<template>
  <div class="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
    <div class="text-center">
      <!-- Loading -->
      <div v-if="!error" class="space-y-4">
        <div class="w-16 h-16 mx-auto bg-primary-light dark:bg-primary/20 rounded-2xl flex items-center justify-center">
          <svg class="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <h2 class="text-xl font-semibold text-text-light dark:text-text-dark">Autenticando...</h2>
        <p class="text-sm text-subtext-light dark:text-subtext-dark">Aguarde enquanto verificamos suas credenciais</p>
      </div>

      <!-- Error -->
      <div v-else class="space-y-4">
        <div class="w-16 h-16 mx-auto bg-red-100 dark:bg-red-900/20 rounded-2xl flex items-center justify-center">
          <span class="material-icons text-red-500 text-3xl">error_outline</span>
        </div>
        <h2 class="text-xl font-semibold text-text-light dark:text-text-dark">Erro na autenticação</h2>
        <p class="text-sm text-subtext-light dark:text-subtext-dark max-w-sm">{{ error }}</p>
        <NuxtLink
          to="/auth/login"
          class="inline-flex items-center gap-2 btn btn-primary mt-4"
        >
          <span class="material-icons text-xl">arrow_back</span>
          Voltar para login
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: false
})

const supabase = useSupabaseClient()
const router = useRouter()
const route = useRoute()

const error = ref('')

onMounted(async () => {
  try {
    // Verifica se há um erro na URL
    const errorParam = route.query.error
    const errorDescription = route.query.error_description

    if (errorParam) {
      error.value = errorDescription || 'Ocorreu um erro durante a autenticação.'
      return
    }

    // Verifica a sessão atual
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      error.value = sessionError.message
      return
    }

    if (session) {
      // Usuário autenticado, redireciona para o dashboard
      router.push('/')
    } else {
      // Sem sessão, redireciona para login
      router.push('/auth/login')
    }
  } catch (err) {
    error.value = 'Ocorreu um erro inesperado durante a autenticação.'
  }
})
</script>
