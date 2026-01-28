import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  const { contratoId, email } = body

  if (!contratoId || !email) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Dados incompletos: contratoId e email sao obrigatorios'
    })
  }

  // Criar cliente Supabase com service role se disponivel, senao usar anon key
  const supabaseUrl = config.public.supabase.url || process.env.SUPABASE_URL
  const supabaseKey = config.supabaseServiceKey || process.env.SUPABASE_SERVICE_KEY || config.public.supabase.key || process.env.SUPABASE_KEY

  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // 1. Buscar contrato com dados do cliente e empresa
    const { data: contrato, error: contratoError } = await supabase
      .from('contratos')
      .select(`
        *,
        clientes (
          id,
          razao_social,
          nome_fantasia,
          email
        ),
        empresas (
          id,
          razao_social,
          nome_fantasia
        )
      `)
      .eq('id', contratoId)
      .single()

    if (contratoError) {
      console.error('Erro ao buscar contrato:', contratoError)
      throw createError({
        statusCode: 404,
        statusMessage: `Contrato nao encontrado: ${contratoError.message}`
      })
    }

    if (!contrato) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Contrato nao encontrado'
      })
    }

    // 2. Gerar chave de acesso se nao existir
    let chaveAcesso = contrato.chave_acesso
    if (!chaveAcesso) {
      // Gerar chave aleatoria de 5 caracteres
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
      chaveAcesso = ''
      for (let i = 0; i < 5; i++) {
        chaveAcesso += chars.charAt(Math.floor(Math.random() * chars.length))
      }
    }

    // 3. Atualizar contrato com chave de acesso e dados do envio
    const { error: updateError } = await supabase
      .from('contratos')
      .update({
        chave_acesso: chaveAcesso,
        email_enviado_em: new Date().toISOString(),
        email_enviado_para: email
      })
      .eq('id', contratoId)

    if (updateError) {
      console.error('Erro ao atualizar contrato:', updateError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao atualizar contrato'
      })
    }

    // 4. Preparar dados para o e-mail
    const baseUrl = config.public.baseUrl || 'https://app.fazendasbioma.com.br'
    const contratoUrl = `${baseUrl}/contrato/${contratoId}`
    const clienteNome = contrato.clientes?.nome_fantasia || contrato.clientes?.razao_social || 'Cliente'
    const empresaNome = contrato.empresas?.nome_fantasia || contrato.empresas?.razao_social || 'Fazendas Bioma'

    // 5. Enviar e-mail via Resend
    const resend = new Resend(config.resendApiKey)

    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'Bioma OS <noreply@biomaos.com.br>',
      to: email,
      subject: `Seu contrato de microverdes - ${empresaNome}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Contrato de Fornecimento de Microverdes</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f0;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f0; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 500px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 32px 32px 24px; text-align: center; background-color: #2d2d2d; border-radius: 8px 8px 0 0;">
                      <div style="display: inline-flex; align-items: center; gap: 8px;">
                        <span style="color: #549E54; font-size: 28px;">&#127807;</span>
                        <span style="font-size: 24px; font-weight: 700; color: #ffffff;">BiomaOS</span>
                      </div>
                    </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding: 32px;">
                      <h1 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #333333;">
                        Ola, ${clienteNome}!
                      </h1>

                      <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: #666666;">
                        Voce esta prestes a visualizar o contrato de fornecimento de microverdes com todos os detalhes.
                      </p>

                      <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: #666666;">
                        Caso tenha duvidas, estamos a disposicao para esclarecimentos por telefone, e-mail ou em uma reuniao.
                      </p>

                      <!-- Access Key Box -->
                      <div style="background-color: #f5f5f0; border-radius: 8px; padding: 20px; margin-bottom: 24px; text-align: center;">
                        <p style="margin: 0 0 8px; font-size: 12px; color: #666666; text-transform: uppercase; letter-spacing: 1px;">
                          Chave de Acesso
                        </p>
                        <p style="margin: 0; font-size: 28px; font-weight: 700; color: #549E54; letter-spacing: 4px; font-family: monospace;">
                          ${chaveAcesso}
                        </p>
                      </div>

                      <!-- Button -->
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center">
                            <a href="${contratoUrl}" style="display: inline-block; padding: 14px 32px; background-color: #549E54; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; border-radius: 6px;">
                              Visualizar Contrato
                            </a>
                          </td>
                        </tr>
                      </table>

                      <p style="margin: 24px 0 0; font-size: 12px; color: #999999; text-align: center;">
                        Use a chave de acesso acima para visualizar o contrato.
                      </p>

                      <p style="margin: 16px 0 0; font-size: 12px; color: #999999; text-align: center;">
                        Agradecemos desde ja pela confianca em nosso trabalho!
                      </p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding: 24px 32px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
                      <p style="margin: 0; font-size: 12px; color: #999999; text-align: center;">
                        &copy; ${new Date().getFullYear()} ${empresaNome}. Todos os direitos reservados.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `
    })

    if (emailError) {
      console.error('Erro ao enviar email:', emailError)
      return {
        success: true,
        emailSent: false,
        emailError: emailError.message || 'Erro ao enviar email',
        chaveAcesso,
        contratoUrl
      }
    }

    return {
      success: true,
      emailSent: true,
      chaveAcesso,
      contratoUrl,
      emailData
    }
  } catch (error: any) {
    console.error('Erro ao processar envio de contrato:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Erro ao processar envio de contrato'
    })
  }
})
