import { createClient } from '@supabase/supabase-js'

// Endpoints regionais CoolKit v2
const REGION_URLS: Record<string, string> = {
  us: 'https://us-apia.coolkit.cc',
  eu: 'https://eu-apia.coolkit.cc',
  cn: 'https://cn-apia.coolkit.cn',
  as: 'https://as-apia.coolkit.cc',
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  const { empresa_id, email, senha, regiao, nome } = body

  if (!empresa_id || !email || !senha) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Dados incompletos: empresa_id, email e senha são obrigatórios'
    })
  }

  const region = regiao || 'us'
  const baseUrl = REGION_URLS[region]
  if (!baseUrl) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Região inválida. Use: us, eu, cn ou as'
    })
  }

  const appId = config.ewelinkAppId
  const appSecret = config.ewelinkAppSecret

  if (!appId || !appSecret) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Credenciais eWeLink (EWELINK_APP_ID / EWELINK_APP_SECRET) não configuradas no servidor'
    })
  }

  try {
    // Login via CoolKit v2 REST API
    const loginResponse = await fetch(`${baseUrl}/v2/user/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CK-Appid': appId,
      },
      body: JSON.stringify({
        lang: 'pt',
        countryCode: '+55',
        email: email,
        password: senha,
      })
    })

    const loginData = await loginResponse.json()

    if (loginData.error !== 0) {
      return {
        success: false,
        error: loginData.msg || `Erro de autenticação eWeLink (código ${loginData.error})`
      }
    }

    const { at: accessToken, rt: refreshToken, user } = loginData.data
    const userApikey = user?.apikey

    // Calcular expiração (tokens eWeLink duram ~30 dias)
    const tokenExpiraEm = new Date()
    tokenExpiraEm.setDate(tokenExpiraEm.getDate() + 29)

    // Salvar no banco
    const supabaseUrl = config.public.supabase?.url || process.env.SUPABASE_URL
    const supabaseKey = config.supabaseServiceKey || process.env.SUPABASE_SERVICE_KEY || config.public.supabase?.key || process.env.SUPABASE_KEY
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data: conta, error: insertError } = await supabase
      .from('contas_ewelink')
      .upsert({
        empresa_id,
        nome: nome || `Conta ${email}`,
        email,
        regiao: region,
        access_token: accessToken,
        refresh_token: refreshToken,
        user_apikey: userApikey,
        token_expira_em: tokenExpiraEm.toISOString(),
        status: 'ativo',
        erro_mensagem: null,
      }, {
        onConflict: 'empresa_id,email'
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('Erro ao salvar conta eWeLink:', insertError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao salvar conta: ' + insertError.message
      })
    }

    return {
      success: true,
      contaId: conta.id,
      email,
      regiao: region
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('Erro ao conectar eWeLink:', error)
    return {
      success: false,
      error: error.message || 'Erro ao conectar com a API eWeLink'
    }
  }
})
