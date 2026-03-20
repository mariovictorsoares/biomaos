import { createClient } from '@supabase/supabase-js'
import { createHmac } from 'node:crypto'

// Endpoints regionais CoolKit v2
const REGION_URLS: Record<string, string> = {
  us: 'https://us-apia.coolkit.cc',
  eu: 'https://eu-apia.coolkit.cc',
  cn: 'https://cn-apia.coolkit.cn',
  as: 'https://as-apia.coolkit.cc',
}

function hmacSignBody(body: object, secret: string): string {
  return createHmac('sha256', secret).update(JSON.stringify(body)).digest('base64')
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  const { empresa_id, code, regiao, nome } = body

  if (!empresa_id || !code) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Dados incompletos: empresa_id e code são obrigatórios'
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
    // Redirect URL deve ser EXATAMENTE igual ao usado na autorização
    let redirectUrl = config.public.baseUrl || 'https://biomaos.vercel.app'
    if (!redirectUrl.endsWith('/')) redirectUrl += '/'

    // Trocar authorization code por token via CoolKit v2 OAuth
    const tokenBody = {
      redirectUrl,
      code,
      grantType: 'authorization_code' as const,
    }

    const tokenResponse = await fetch(`${baseUrl}/v2/user/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CK-Appid': appId,
        'Authorization': `Sign ${hmacSignBody(tokenBody, appSecret)}`,
      },
      body: JSON.stringify(tokenBody),
    })

    const tokenData = await tokenResponse.json()

    if (tokenData.error !== 0) {
      return {
        success: false,
        error: tokenData.msg || `Erro na autenticação eWeLink (código ${tokenData.error})`
      }
    }

    // OAuth response pode usar accessToken/refreshToken OU at/rt
    const accessToken = tokenData.data?.accessToken || tokenData.data?.at
    const refreshToken = tokenData.data?.refreshToken || tokenData.data?.rt
    const userApikey = tokenData.data?.user?.apikey
    const userEmail = tokenData.data?.user?.email || null

    if (!accessToken) {
      return {
        success: false,
        error: 'Token não recebido na resposta da API eWeLink'
      }
    }

    // Calcular expiração (tokens eWeLink duram ~30 dias)
    const tokenExpiraEm = new Date()
    tokenExpiraEm.setDate(tokenExpiraEm.getDate() + 29)

    // Salvar no banco
    const supabaseUrl = config.public.supabase?.url || process.env.SUPABASE_URL
    const supabaseKey = config.supabaseServiceKey || process.env.SUPABASE_SERVICE_KEY || config.public.supabase?.key || process.env.SUPABASE_KEY
    const supabase = createClient(supabaseUrl, supabaseKey)

    const contaData = {
      empresa_id,
      nome: nome || 'Conta eWeLink',
      email: userEmail,
      regiao: region,
      access_token: accessToken,
      refresh_token: refreshToken,
      user_apikey: userApikey,
      token_expira_em: tokenExpiraEm.toISOString(),
      status: 'ativo' as const,
      erro_mensagem: null,
    }

    // Verificar se conta já existe (por user_apikey ou email)
    let contaId: string | null = null

    if (userApikey) {
      const { data: existing } = await supabase
        .from('contas_ewelink')
        .select('id')
        .eq('empresa_id', empresa_id)
        .eq('user_apikey', userApikey)
        .single()

      if (existing) {
        contaId = existing.id
      }
    }

    if (!contaId && userEmail) {
      const { data: existing } = await supabase
        .from('contas_ewelink')
        .select('id')
        .eq('empresa_id', empresa_id)
        .eq('email', userEmail)
        .single()

      if (existing) {
        contaId = existing.id
      }
    }

    let conta
    if (contaId) {
      // Atualizar conta existente
      const { data, error: updateError } = await supabase
        .from('contas_ewelink')
        .update(contaData)
        .eq('id', contaId)
        .select('id')
        .single()

      if (updateError) {
        console.error('Erro ao atualizar conta eWeLink:', updateError)
        throw createError({
          statusCode: 500,
          statusMessage: 'Erro ao atualizar conta: ' + updateError.message
        })
      }
      conta = data
    } else {
      // Inserir nova conta
      const { data, error: insertError } = await supabase
        .from('contas_ewelink')
        .insert(contaData)
        .select('id')
        .single()

      if (insertError) {
        console.error('Erro ao salvar conta eWeLink:', insertError)
        throw createError({
          statusCode: 500,
          statusMessage: 'Erro ao salvar conta: ' + insertError.message
        })
      }
      conta = data
    }

    return {
      success: true,
      contaId: conta.id,
      email: userEmail,
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
