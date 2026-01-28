import { Resend } from 'resend'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  const { email, token, empresaNome, role } = body

  if (!email || !token || !empresaNome) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Dados incompletos'
    })
  }

  const resend = new Resend(config.resendApiKey)

  const baseUrl = config.public.baseUrl || 'http://localhost:3000'
  const inviteUrl = `${baseUrl}/auth/accept-invite?token=${token}`

  const roleLabel = role === 'admin' ? 'Administrador' : 'Membro'

  try {
    const { data, error } = await resend.emails.send({
      from: 'Bioma OS <noreply@biomaos.com.br>',
      to: email,
      subject: `Você foi convidado para ${empresaNome}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Convite para ${empresaNome}</title>
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
                        Voce foi convidado!
                      </h1>

                      <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: #666666;">
                        Você recebeu um convite para fazer parte da empresa <strong style="color: #333333;">${empresaNome}</strong> como <strong style="color: #549E54;">${roleLabel}</strong>.
                      </p>

                      <p style="margin: 0 0 32px; font-size: 14px; line-height: 1.6; color: #666666;">
                        Clique no botão abaixo para aceitar o convite e acessar o sistema:
                      </p>

                      <!-- Button -->
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center">
                            <a href="${inviteUrl}" style="display: inline-block; padding: 14px 32px; background-color: #549E54; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; border-radius: 6px;">
                              Aceitar Convite
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
      // Retorna sucesso parcial - convite foi criado, mas email falhou
      return {
        success: true,
        emailSent: false,
        emailError: error.message || 'Domínio não verificado no Resend'
      }
    }

    return { success: true, emailSent: true, data }
  } catch (error: any) {
    console.error('Erro ao enviar email:', error)
    // Retorna sucesso parcial - convite foi criado, mas email falhou
    return {
      success: true,
      emailSent: false,
      emailError: error.message || 'Erro ao enviar email'
    }
  }
})
