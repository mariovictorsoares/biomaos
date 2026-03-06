import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  const supabaseUrl = config.public.supabase.url || process.env.SUPABASE_URL
  const supabaseKey = config.supabaseServiceKey || process.env.SUPABASE_SERVICE_KEY || config.public.supabase.key || process.env.SUPABASE_KEY

  const supabase = createClient(supabaseUrl, supabaseKey)

  const { conviteId } = body

  if (!conviteId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID do convite é obrigatório'
    })
  }

  // Buscar o convite
  const { data: convite, error: fetchError } = await supabase
    .from('convites_usuario')
    .select('*')
    .eq('id', conviteId)
    .single()

  if (fetchError || !convite) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Convite não encontrado'
    })
  }

  // Gerar novo token e atualizar data de expiração
  const newToken = crypto.randomUUID()
  const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  const { error: updateError } = await supabase
    .from('convites_usuario')
    .update({
      token: newToken,
      expires_at: newExpiresAt,
      status: 'pending'
    })
    .eq('id', conviteId)

  if (updateError) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro ao atualizar convite: ' + updateError.message
    })
  }

  // Reenviar email
  const resend = new Resend(config.resendApiKey)
  const baseUrl = config.public.baseUrl || 'http://localhost:3000'
  const inviteUrl = `${baseUrl}/auth/register?token=${newToken}`

  const perfilLabel = convite.perfil === 'admin' ? 'Administrador' : 'Usuário'

  try {
    const { data, error } = await resend.emails.send({
      from: 'Bioma OS <noreply@biomaos.com.br>',
      to: convite.email,
      subject: 'Você foi convidado para o Bioma OS',
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
                  <tr>
                    <td style="padding: 32px 32px 24px; text-align: center; border-bottom: 1px solid #e5e7eb;">
                      <div style="display: inline-flex; align-items: center; gap: 8px;">
                        <span style="color: #549E54; font-size: 28px;">🌿</span>
                        <span style="font-size: 24px; font-weight: 700; color: #549E54;">Bioma OS</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 32px;">
                      <h1 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #333333;">
                        Olá, ${convite.nome}!
                      </h1>
                      <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: #666666;">
                        Você foi convidado para acessar o <strong style="color: #549E54;">Bioma OS</strong> como <strong style="color: #333333;">${perfilLabel}</strong>.
                      </p>
                      <p style="margin: 0 0 32px; font-size: 14px; line-height: 1.6; color: #666666;">
                        Clique no botão abaixo para criar sua conta e começar a usar o sistema:
                      </p>
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
                    </td>
                  </tr>
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
      return { success: true, emailSent: false }
    }

    return { success: true, emailSent: true }
  } catch (error: any) {
    console.error('Erro ao enviar email:', error)
    return { success: true, emailSent: false }
  }
})
