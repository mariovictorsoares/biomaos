<template>
  <div class="w-full max-w-md">
    <!-- Header -->
    <div class="mb-8">
      <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
        Bem-vindo de volta
      </h2>
      <p class="text-gray-500 dark:text-gray-400">
        Entre com suas credenciais para acessar o sistema
      </p>
    </div>

    <!-- Mensagem de sessão expirada -->
    <div
      v-if="sessionExpiredMessage"
      class="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-xl flex items-start gap-3"
    >
      <span class="material-icons text-amber-500 text-xl shrink-0">schedule</span>
      <p class="text-sm text-amber-600 dark:text-amber-400">{{ sessionExpiredMessage }}</p>
    </div>

    <!-- Mensagem de erro -->
    <div
      v-if="errorMessage"
      class="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl flex items-start gap-3"
    >
      <span class="material-icons text-red-500 text-xl shrink-0">error_outline</span>
      <p class="text-sm text-red-600 dark:text-red-400">{{ errorMessage }}</p>
    </div>

    <!-- Formulário -->
    <form @submit.prevent="handleLogin" class="space-y-5">
      <!-- Email -->
      <div>
        <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          E-mail
        </label>
        <div class="relative">
          <span class="absolute left-4 top-1/2 -translate-y-1/2 material-icons-outlined text-gray-400 text-xl">
            mail
          </span>
          <input
            id="email"
            v-model="email"
            type="email"
            placeholder="seu@email.com"
            required
            class="w-full h-12 pl-12 pr-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#568D43] focus:border-transparent transition-all"
            :disabled="loading"
          />
        </div>
      </div>

      <!-- Senha -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Senha
          </label>
          <NuxtLink
            to="/auth/forgot-password"
            class="text-sm text-[#568D43] hover:text-[#4a7a3a] font-medium transition-colors"
          >
            Esqueceu a senha?
          </NuxtLink>
        </div>
        <div class="relative">
          <span class="absolute left-4 top-1/2 -translate-y-1/2 material-icons-outlined text-gray-400 text-xl">
            lock
          </span>
          <input
            id="password"
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="Digite sua senha"
            required
            class="w-full h-12 pl-12 pr-12 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#568D43] focus:border-transparent transition-all"
            :disabled="loading"
          />
          <button
            type="button"
            @click="showPassword = !showPassword"
            class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <span class="material-icons-outlined text-xl">
              {{ showPassword ? 'visibility_off' : 'visibility' }}
            </span>
          </button>
        </div>
      </div>

      <!-- Lembrar-me -->
      <div class="flex items-center">
        <input
          id="remember"
          v-model="rememberMe"
          type="checkbox"
          class="w-4 h-4 text-[#568D43] bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded focus:ring-[#568D43] focus:ring-2 cursor-pointer"
        />
        <label for="remember" class="ml-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
          Manter-me conectado
        </label>
      </div>

      <!-- Botão de Login -->
      <button
        type="submit"
        :disabled="loading"
        class="w-full h-12 bg-[#568D43] hover:bg-[#4a7a3a] text-white font-semibold rounded-xl shadow-lg shadow-[#568D43]/25 hover:shadow-[#568D43]/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <span v-if="loading" class="flex items-center gap-2">
          <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Entrando...
        </span>
        <span v-else class="flex items-center gap-2">
          Entrar
          <span class="material-icons text-xl">arrow_forward</span>
        </span>
      </button>
    </form>

  </div>
</template>

<script setup>
definePageMeta({
  layout: 'auth'
})

const supabase = useSupabaseClient()
const router = useRouter()
const route = useRoute()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const rememberMe = ref(false)
const loading = ref(false)
const errorMessage = ref('')
const sessionExpiredMessage = ref('')

// Verifica se a sessão expirou (redirecionado do middleware)
onMounted(() => {
  if (route.query.session_expired === 'true') {
    sessionExpiredMessage.value = 'Sua sessão expirou. Por favor, faça login novamente.'

    // Remove o parâmetro da URL sem recarregar
    router.replace({ path: route.path, query: {} })
  }
})

const handleLogin = async () => {
  // Limpa mensagem de sessão expirada ao tentar login
  sessionExpiredMessage.value = ''
  loading.value = true
  errorMessage.value = ''

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value
    })

    if (error) {
      if (error.message === 'Invalid login credentials') {
        errorMessage.value = 'E-mail ou senha incorretos. Verifique suas credenciais.'
      } else if (error.message === 'Email not confirmed') {
        errorMessage.value = 'E-mail não confirmado. Verifique sua caixa de entrada.'
      } else {
        errorMessage.value = error.message
      }
      return
    }

    router.push('/')
  } catch (err) {
    errorMessage.value = 'Ocorreu um erro inesperado. Tente novamente.'
  } finally {
    loading.value = false
  }
}
</script>
