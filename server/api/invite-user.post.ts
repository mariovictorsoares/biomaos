import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  // Criar cliente Supabase com service role se disponivel, senao usar anon key
  const supabaseUrl = config.public.supabase.url || process.env.SUPABASE_URL
  const supabaseKey = config.supabaseServiceKey || process.env.SUPABASE_SERVICE_KEY || config.public.supabase.key || process.env.SUPABASE_KEY

  const supabase = createClient(supabaseUrl, supabaseKey)

  const { email, nome, perfil, celular, cep, endereco, numero, complemento, estado, cidade } = body

  if (!email || !nome || !perfil) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Dados incompletos: email, nome e perfil são obrigatórios'
    })
  }

  // Verificar se ja existe convite pendente para este email
  const { data: existingInvite } = await supabase
    .from('convites_usuario')
    .select('id')
    .eq('email', email)
    .eq('status', 'pending')
    .single()

  if (existingInvite) {
    return {
      success: false,
      error: 'Já existe um convite pendente para este email'
    }
  }

  // Gerar token unico para o convite
  const token = crypto.randomUUID()

  // Salvar convite na tabela convites_usuario
  const { error: insertError } = await supabase.from('convites_usuario').insert({
    email,
    nome,
    perfil,
    celular: celular || null,
    cep: cep || null,
    endereco: endereco || null,
    numero: numero || null,
    complemento: complemento || null,
    estado: estado || null,
    cidade: cidade || null,
    token,
    status: 'pending',
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 dias
  })

  if (insertError) {
    console.error('Erro ao criar convite:', insertError)
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro ao criar convite: ' + insertError.message
    })
  }

  // Enviar email de convite
  const resend = new Resend(config.resendApiKey)
  const baseUrl = config.public.baseUrl || 'http://localhost:3000'
  const inviteUrl = `${baseUrl}/auth/register?token=${token}`

  const perfilLabel = perfil === 'admin' ? 'Administrador' : 'Usuário'

  try {
    const { data, error } = await resend.emails.send({
      from: 'Bioma OS <noreply@biomaos.com.br>',
      to: email,
      subject: 'Voce foi convidado para o Bioma OS',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Convite para Bioma OS</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8f8f8;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f8f8; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 500px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 32px 32px 24px; text-align: center; border-bottom: 1px solid #e5e7eb;">
                      <div style="display: inline-flex; align-items: center; gap: 8px;">
                        <span style="color: #549E54; font-size: 28px;">🌿</span>
                        <span style="font-size: 24px; font-weight: 700; color: #549E54;">Bioma OS</span>
                      </div>
                    </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding: 32px;">
                      <h1 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #333333;">
                        Olá, ${nome}!
                      </h1>

                      <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: #666666;">
                        Você foi convidado para acessar o <strong style="color: #549E54;">Bioma OS</strong> como <strong style="color: #333333;">${perfilLabel}</strong>.
                      </p>

                      <p style="margin: 0 0 32px; font-size: 14px; line-height: 1.6; color: #666666;">
                        Clique no botão abaixo para criar sua conta e começar a usar o sistema:
                      </p>

                      <!-- Button -->
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center">
                            <a href="${inviteUrl}" style="display: inline-block; padding: 14px 32px; background-color: #549E54; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; border-radius: 6px;">
                              Criar minha conta
                            </a>
                          </td>
                        </tr>
                      </table>

                      <p style="margin: 32px 0 0; font-size: 12px; color: #999999; text-align: center;">
                        Este convite expira em 7 dias.
                      </p>

                      <p style="margin: 16px 0 0; font-size: 12px; color: #999999; text-align: center;">
                        Se você não solicitou este convite, ignore este email.
                      </p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding: 24px 32px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
                      <p style="margin: 0; font-size: 12px; color: #999999; text-align: center;">
                        © ${new Date().getFullYear()} Bioma OS. Todos os direitos reservados.
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

    if (error) {
      console.error('Erro ao enviar email:', error)
      return {
        success: true,
        emailSent: false,
        emailError: error.message || 'Domínio não verificado no Resend'
      }
    }

    return { success: true, emailSent: true, data }
  } catch (error: any) {
    console.error('Erro ao enviar email:', error)
    return {
      success: true,
      emailSent: false,
      emailError: error.message || 'Erro ao enviar email'
    }
  }
})
