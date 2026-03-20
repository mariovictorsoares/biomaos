import { createHmac } from 'node:crypto'

const REGION_URLS: Record<string, string> = {
  us: 'https://us-apia.coolkit.cc',
  eu: 'https://eu-apia.coolkit.cc',
  cn: 'https://cn-apia.coolkit.cn',
  as: 'https://as-apia.coolkit.cc',
}

function nonce(size = 8): string {
  return Math.random().toString(36).slice(-size)
}

function hmacSign(message: string, secret: string): string {
  return createHmac('sha256', secret).update(message).digest('base64')
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  const { regiao, state } = body

  const appId = config.ewelinkAppId
  const appSecret = config.ewelinkAppSecret

  if (!appId || !appSecret) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Credenciais eWeLink (EWELINK_APP_ID / EWELINK_APP_SECRET) não configuradas no servidor'
    })
  }

  const seq = Date.now().toString()
  const authorization = hmacSign(`${appId}_${seq}`, appSecret)

  // Redirect URL deve corresponder EXATAMENTE ao cadastrado no console eWeLink
  let redirectUrl = config.public.baseUrl || 'https://biomaos.vercel.app'
  if (!redirectUrl.endsWith('/')) redirectUrl += '/'

  // Montar URL seguindo formato do SDK oficial (ewelink-api-next)
  const params = [
    `clientId=${appId}`,
    `redirectUrl=${encodeURIComponent(redirectUrl)}`,
    `grantType=authorization_code`,
    `state=${encodeURIComponent(state || '')}`,
    `nonce=${nonce()}`,
    `seq=${seq}`,
    `authorization=${encodeURIComponent(authorization)}`,
  ].join('&')

  return {
    url: `https://c2ccdn.coolkit.cc/oauth/index.html?${params}`,
    redirectUrl,
  }
})
