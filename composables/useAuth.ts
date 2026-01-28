/**
 * Composable para gerenciamento de autenticação
 * Fornece funções utilitárias para auth em toda a aplicação
 */
export const useAuth = () => {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()
  const router = useRouter()

  // Estado reativo para loading e erros
  const isLoading = ref(false)
  const authError = ref<string | null>(null)

  /**
   * Limpa todos os dados de sessão do localStorage
   */
  const clearSession = async () => {
    if (typeof window !== 'undefined') {
      const keysToRemove = Object.keys(localStorage).filter(key =>
        key.startsWith('sb-') || key.includes('supabase')
      )
      keysToRemove.forEach(key => localStorage.removeItem(key))
    }
  }

  /**
   * Faz logout do usuário e limpa toda a sessão
   */
  const logout = async () => {
    isLoading.value = true
    authError.value = null

    try {
      const { error } = await supabase.auth.signOut()

      // Ignora erros de logout - limpa sessão de qualquer forma

      // Limpa sessão mesmo se houver erro
      await clearSession()

      // Redireciona para login
      await router.push('/auth/login')
    } catch (err) {
      // Força limpeza e redirecionamento em caso de erro
      await clearSession()
      window.location.href = '/auth/login'
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Tenta recuperar uma sessão inválida
   * Retorna true se conseguiu recuperar, false caso contrário
   */
  const recoverSession = async (): Promise<boolean> => {
    isLoading.value = true
    authError.value = null

    try {
      // Tenta fazer refresh do token
      const { data, error } = await supabase.auth.refreshSession()

      if (error) {
        authError.value = 'Sua sessão expirou. Por favor, faça login novamente.'
        return false
      }

      if (data.session) {
        return true
      }

      return false
    } catch (err) {
      authError.value = 'Erro ao recuperar sessão. Por favor, faça login novamente.'
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Verifica se a sessão atual é válida
   */
  const isSessionValid = async (): Promise<boolean> => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error) {
        return false
      }

      return !!session
    } catch (err) {
      return false
    }
  }

  /**
   * Handler para erros de autenticação
   * Determina a ação apropriada baseado no tipo de erro
   */
  const handleAuthError = async (error: Error | { message: string }) => {
    const errorMessage = error.message || String(error)

    // Erros que requerem novo login
    const requiresNewLogin = [
      'Refresh Token',
      'refresh_token',
      'Invalid',
      'expired',
      'not found',
      'JWT'
    ].some(term => errorMessage.toLowerCase().includes(term.toLowerCase()))

    if (requiresNewLogin) {
      authError.value = 'Sua sessão expirou. Por favor, faça login novamente.'
      await logout()
      return
    }

    // Tenta recuperar para outros tipos de erro
    const recovered = await recoverSession()
    if (!recovered) {
      await logout()
    }
  }

  /**
   * Wrapper para chamadas que podem falhar por auth
   * Automaticamente tenta refresh se necessário
   */
  const withAuth = async <T>(
    fn: () => Promise<{ data: T | null; error: Error | null }>
  ): Promise<{ data: T | null; error: Error | null }> => {
    try {
      const result = await fn()

      if (result.error) {
        const errorMessage = result.error.message || ''

        // Se for erro de auth, tenta refresh e retry
        if (errorMessage.includes('JWT') ||
            errorMessage.includes('token') ||
            errorMessage.includes('session')) {

          const recovered = await recoverSession()

          if (recovered) {
            // Retry após recuperar sessão
            return await fn()
          } else {
            await handleAuthError(result.error)
          }
        }
      }

      return result
    } catch (err) {
      return { data: null, error: err as Error }
    }
  }

  return {
    // Estado
    user,
    isLoading: readonly(isLoading),
    authError: readonly(authError),

    // Funções
    logout,
    clearSession,
    recoverSession,
    isSessionValid,
    handleAuthError,
    withAuth
  }
}
