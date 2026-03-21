/**
 * Plugin client-side que intercepta o callback OAuth do eWeLink.
 *
 * Quando o eWeLink redireciona de volta para a app com ?code=XXX&state=YYY,
 * este plugin detecta os params, troca o code por token via API, e
 * redireciona o usuário para /fazendas com o resultado.
 */
export default defineNuxtPlugin(async () => {
  if (typeof window === 'undefined') return

  const url = new URL(window.location.href)
  const code = url.searchParams.get('code')
  if (!code) return

  const state = url.searchParams.get('state')
  const savedState = localStorage.getItem('ewelink_oauth_state')

  // Verificar se é realmente um callback eWeLink (state válido)
  if (!state || state !== savedState) return

  // Limpar URL imediatamente (remover code/state da barra de endereço)
  const cleanUrl = new URL(window.location.href)
  cleanUrl.searchParams.delete('code')
  cleanUrl.searchParams.delete('state')
  window.history.replaceState({}, '', cleanUrl.toString())

  // Recuperar dados salvos antes da redireção
  const savedDataStr = localStorage.getItem('ewelink_oauth_data')
  localStorage.removeItem('ewelink_oauth_state')
  localStorage.removeItem('ewelink_oauth_data')

  if (!savedDataStr) return

  let savedData: any
  try {
    savedData = JSON.parse(savedDataStr)
  } catch {
    return
  }
  if (!savedData?.empresa_id) return

  try {
    const result: any = await $fetch('/api/ewelink/conectar', {
      method: 'POST',
      body: {
        code,
        empresa_id: savedData.empresa_id,
        regiao: savedData.regiao,
        nome: savedData.nome,
      }
    })

    if (result.success) {
      window.location.href = '/fazendas?ewelink_connected=true'
    } else {
      window.location.href = `/fazendas?ewelink_error=${encodeURIComponent(result.error || 'Erro ao conectar')}`
    }
  } catch {
    window.location.href = '/fazendas?ewelink_error=Erro%20de%20comunica%C3%A7%C3%A3o%20com%20o%20servidor'
  }
})
