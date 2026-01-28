/**
 * Middleware de autenticação
 * Protege rotas e valida sessão do usuário
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const user = useSupabaseUser()
  const supabase = useSupabaseClient()

  // Rotas públicas (autenticação)
  const publicRoutes = [
    '/auth/login',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/auth/callback',
    '/auth/accept-invite',
    '/auth/register'
  ]

  // Verifica se é uma rota pública
  const isPublicRoute = publicRoutes.some(route => to.path.startsWith(route))

  // Se o usuário está tentando acessar uma rota pública
  if (isPublicRoute) {
    // Se já está logado e a sessão é válida, redireciona para o dashboard
    if (user.value) {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        // Se a sessão for válida, redireciona para home
        if (session && !error) {
          return navigateTo('/')
        }

        // Se houver erro na sessão, permite acesso à rota pública
      } catch (err) {
        // Ignora erros - permite acesso à rota pública
      }
    }
    // Permite acesso à rota pública
    return
  }

  // Para rotas protegidas, verifica se o usuário está logado
  if (!user.value) {
    return navigateTo('/auth/login')
  }

  // Valida se a sessão ainda é válida (somente no cliente)
  if (import.meta.client) {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error || !session) {
        // Verifica se o erro é de refresh token
        if (error?.message?.includes('Refresh Token') ||
            error?.message?.includes('refresh_token') ||
            error?.message?.includes('Invalid')) {

          // Faz logout para limpar estado corrompido
          await supabase.auth.signOut()

          return navigateTo('/auth/login?session_expired=true')
        }

        // Tenta refresh da sessão
        const { error: refreshError } = await supabase.auth.refreshSession()

        if (refreshError) {
          await supabase.auth.signOut()
          return navigateTo('/auth/login?session_expired=true')
        }
      }
    } catch (err) {
      return navigateTo('/auth/login')
    }
  }
})
