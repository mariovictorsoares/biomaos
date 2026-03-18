<template>
  <div class="min-h-screen flex items-center justify-center bg-white">
    <div class="text-center auth-animate-card">
      <!-- Loading -->
      <div v-if="!error" class="space-y-5">
        <div class="w-16 h-16 mx-auto bg-[#568D43]/10 rounded-2xl flex items-center justify-center">
          <svg class="animate-spin h-8 w-8 text-[#568D43]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <h2 class="text-xl font-semibold text-gray-900">Autenticando...</h2>
        <p class="text-sm text-gray-500">Aguarde enquanto verificamos suas credenciais</p>
      </div>

      <!-- Error -->
      <div v-else class="space-y-5">
        <div class="w-16 h-16 mx-auto bg-red-50 border border-red-200 rounded-2xl flex items-center justify-center">
          <span class="material-icons-outlined text-red-500 text-3xl">error_outline</span>
        </div>
        <h2 class="text-xl font-semibold text-gray-900">Erro na autenticação</h2>
        <p class="text-sm text-gray-500 max-w-sm">{{ error }}</p>
        <NuxtLink
          to="/auth/login"
          class="auth-btn-primary inline-flex items-center justify-center gap-2 px-8 !w-auto mt-2"
        >
          <span class="material-icons-outlined text-xl">arrow_back</span>
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
    const errorParam = route.query.error
    const errorDescription = route.query.error_description

    if (errorParam) {
      error.value = errorDescription || 'Ocorreu um erro durante a autenticação.'
      return
    }

    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      error.value = sessionError.message
      return
    }

    if (session) {
      router.push('/')
    } else {
      router.push('/auth/login')
    }
  } catch (err) {
    error.value = 'Ocorreu um erro inesperado durante a autenticação.'
  }
})
</script>
