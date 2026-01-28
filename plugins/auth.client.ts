/**
 * Plugin de autenticação cliente
 * Gerencia sessão, refresh tokens e tratamento de erros de auth
 */
export default defineNuxtPlugin(async () => {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  // Função para limpar sessão inválida
  const clearInvalidSession = async () => {
    // Limpa todos os dados de sessão do Supabase no localStorage
    if (typeof window !== 'undefined') {
      const keysToRemove = Object.keys(localStorage).filter(key =>
        key.startsWith('sb-') || key.includes('supabase')
      )
      keysToRemove.forEach(key => localStorage.removeItem(key))
    }
  }

  // Função para validar e recuperar sessão
  const validateSession = async (): Promise<boolean> => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error) {
        // Se o erro for de refresh token inválido, limpa a sessão
        if (error.message.includes('Refresh Token') ||
            error.message.includes('refresh_token') ||
            error.message.includes('Invalid') ||
            error.message.includes('expired')) {
          await clearInvalidSession()
          return false
        }
      }

      return !!session
    } catch (err) {
      return false
    }
  }

  // Listener para mudanças de estado de autenticação
  supabase.auth.onAuthStateChange(async (event, session) => {
    switch (event) {
      case 'SIGNED_OUT':
        // Usuário fez logout - limpa tudo
        await clearInvalidSession()
        break
    }
  })

  // Intercepta erros de autenticação globalmente
  const originalFetch = globalThis.fetch
  globalThis.fetch = async (...args) => {
    try {
      const response = await originalFetch(...args)

      // Se receber 401 ou 403 em chamadas para o Supabase
      if ((response.status === 401 || response.status === 403) &&
          args[0]?.toString().includes('supabase')) {
        // Tenta atualizar a sessão
        const { error: refreshError } = await supabase.auth.refreshSession()

        if (refreshError) {
          await clearInvalidSession()

          // Redireciona para login se não estiver já na página de login
          if (!window.location.pathname.startsWith('/auth/')) {
            window.location.href = '/auth/login?session_expired=true'
          }
        } else {
          // Retry da requisição original após refresh bem-sucedido
          return originalFetch(...args)
        }
      }

      return response
    } catch (error) {
      throw error
    }
  }

  // Valida sessão inicial ao carregar a aplicação
  if (user.value) {
    const isValid = await validateSession()
    if (!isValid && !window.location.pathname.startsWith('/auth/')) {
      await navigateTo('/auth/login?session_expired=true')
    }
  }

  // Expõe funções úteis para uso em componentes
  return {
    provide: {
      auth: {
        clearInvalidSession,
        validateSession
      }
    }
  }
})
