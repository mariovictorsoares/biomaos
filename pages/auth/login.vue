<template>
  <div class="auth-animate-stagger">
    <!-- Header -->
    <div class="mb-8">
      <h2 class="text-3xl font-bold text-gray-900 mb-2">
        Bem-vindo de volta
      </h2>
      <p class="text-gray-500">
        Entre com suas credenciais para acessar o sistema
      </p>
    </div>

    <!-- Formulario -->
    <form @submit.prevent="handleLogin" class="space-y-5">
      <!-- Email -->
      <div>
        <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
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
            class="auth-input pl-12"
            :disabled="loading"
          />
        </div>
      </div>

      <!-- Senha -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <label for="password" class="block text-sm font-medium text-gray-700">
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
            class="auth-input pl-12 pr-12"
            :disabled="loading"
          />
          <button
            type="button"
            @click="showPassword = !showPassword"
            class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
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
          class="w-4 h-4 rounded border-gray-300 text-[#568D43] focus:ring-[#568D43] focus:ring-2 cursor-pointer"
        />
        <label for="remember" class="ml-2.5 text-sm text-gray-500 cursor-pointer">
          Manter-me conectado
        </label>
      </div>

      <!-- Botao de Login -->
      <button
        type="submit"
        :disabled="loading"
        class="auth-btn-primary flex items-center justify-center gap-2"
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
          <span class="material-icons-outlined text-xl">arrow_forward</span>
        </span>
      </button>
    </form>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'auth',
  pageTransition: { name: 'auth-page', mode: 'out-in' }
})

const supabase = useSupabaseClient()
const router = useRouter()
const route = useRoute()
const toast = useToast()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const rememberMe = ref(false)
const loading = ref(false)

onMounted(() => {
  if (route.query.session_expired === 'true') {
    toast.warning('Sua sessão expirou. Por favor, faça login novamente.', 5000)
    router.replace({ path: route.path, query: {} })
  }
})

const handleLogin = async () => {
  loading.value = true

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value
    })

    if (error) {
      if (error.message === 'Invalid login credentials') {
        toast.error('E-mail ou senha incorretos. Verifique suas credenciais.')
      } else if (error.message === 'Email not confirmed') {
        toast.error('E-mail não confirmado. Verifique sua caixa de entrada.')
      } else {
        toast.error('Ocorreu um erro. Tente novamente.')
      }
      return
    }

    router.push('/')
  } catch (err) {
    toast.error('Ocorreu um erro inesperado. Tente novamente.')
  } finally {
    loading.value = false
  }
}
</script>
