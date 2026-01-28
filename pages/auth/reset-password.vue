<template>
  <div class="w-full max-w-md">
    <!-- Header -->
    <div class="mb-8">
      <div class="w-14 h-14 bg-[#568D43]/10 rounded-2xl flex items-center justify-center mb-6">
        <span class="material-icons-outlined text-[#568D43] text-3xl">vpn_key</span>
      </div>
      <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
        Redefinir senha
      </h2>
      <p class="text-gray-500 dark:text-gray-400">
        Crie uma nova senha segura para sua conta
      </p>
    </div>

    <!-- Mensagem de sucesso -->
    <div
      v-if="successMessage"
      class="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-xl"
    >
      <div class="flex items-start gap-3">
        <span class="material-icons text-green-500 text-xl shrink-0">check_circle</span>
        <div>
          <p class="text-sm text-green-600 dark:text-green-400 font-medium">{{ successMessage }}</p>
          <p class="text-xs text-green-500 dark:text-green-500 mt-1">Redirecionando para o login...</p>
        </div>
      </div>
    </div>

    <!-- Mensagem de erro -->
    <div
      v-if="errorMessage"
      class="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl flex items-start gap-3"
    >
      <span class="material-icons text-red-500 text-xl shrink-0">error_outline</span>
      <p class="text-sm text-red-600 dark:text-red-400">{{ errorMessage }}</p>
    </div>

    <!-- Formulario -->
    <form @submit.prevent="handleResetPassword" class="space-y-5" v-if="!successMessage">
      <!-- Nova Senha -->
      <div>
        <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Nova senha
        </label>
        <div class="relative">
          <span class="absolute left-4 top-1/2 -translate-y-1/2 material-icons-outlined text-gray-400 text-xl">
            lock
          </span>
          <input
            id="password"
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="Mínimo 6 caracteres"
            required
            minlength="6"
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
        <!-- Indicador de forca da senha -->
        <div class="mt-3">
          <div class="flex gap-1">
            <div
              v-for="i in 4"
              :key="i"
              class="h-1.5 flex-1 rounded-full transition-colors"
              :class="getPasswordStrengthColor(i)"
            ></div>
          </div>
          <p class="text-xs mt-2" :class="passwordStrengthTextColor">
            {{ passwordStrengthText }}
          </p>
        </div>
      </div>

      <!-- Confirmar Senha -->
      <div>
        <label for="confirmPassword" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Confirmar nova senha
        </label>
        <div class="relative">
          <span class="absolute left-4 top-1/2 -translate-y-1/2 material-icons-outlined text-gray-400 text-xl">
            lock_outline
          </span>
          <input
            id="confirmPassword"
            v-model="confirmPassword"
            :type="showConfirmPassword ? 'text' : 'password'"
            placeholder="Digite a senha novamente"
            required
            class="w-full h-12 pl-12 pr-12 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#568D43] focus:border-transparent transition-all"
            :class="{ 'ring-2 ring-red-500 border-transparent': confirmPassword && password !== confirmPassword }"
            :disabled="loading"
          />
          <button
            type="button"
            @click="showConfirmPassword = !showConfirmPassword"
            class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <span class="material-icons-outlined text-xl">
              {{ showConfirmPassword ? 'visibility_off' : 'visibility' }}
            </span>
          </button>
        </div>
        <p v-if="confirmPassword && password !== confirmPassword" class="text-xs text-red-500 mt-2">
          As senhas não coincidem
        </p>
      </div>

      <!-- Requisitos da senha -->
      <div class="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
        <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Sua senha deve conter:</p>
        <ul class="space-y-2">
          <li class="flex items-center gap-2 text-sm" :class="password.length >= 6 ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'">
            <span class="material-icons text-sm">{{ password.length >= 6 ? 'check_circle' : 'radio_button_unchecked' }}</span>
            Mínimo 6 caracteres
          </li>
          <li class="flex items-center gap-2 text-sm" :class="/[a-z]/.test(password) && /[A-Z]/.test(password) ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'">
            <span class="material-icons text-sm">{{ /[a-z]/.test(password) && /[A-Z]/.test(password) ? 'check_circle' : 'radio_button_unchecked' }}</span>
            Letras maiúsculas e minúsculas
          </li>
          <li class="flex items-center gap-2 text-sm" :class="/\d/.test(password) ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'">
            <span class="material-icons text-sm">{{ /\d/.test(password) ? 'check_circle' : 'radio_button_unchecked' }}</span>
            Pelo menos um número
          </li>
        </ul>
      </div>

      <!-- Botao de Redefinir -->
      <button
        type="submit"
        :disabled="loading || password !== confirmPassword || password.length < 6"
        class="w-full h-12 bg-[#568D43] hover:bg-[#4a7a3a] text-white font-semibold rounded-xl shadow-lg shadow-[#568D43]/25 hover:shadow-[#568D43]/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <span v-if="loading" class="flex items-center gap-2">
          <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Redefinindo...
        </span>
        <span v-else class="flex items-center gap-2">
          Redefinir senha
          <span class="material-icons text-xl">check</span>
        </span>
      </button>
    </form>

    <!-- Acao apos sucesso -->
    <div v-if="successMessage" class="mt-4">
      <NuxtLink
        to="/auth/login"
        class="w-full h-12 bg-[#568D43] hover:bg-[#4a7a3a] text-white font-semibold rounded-xl shadow-lg shadow-[#568D43]/25 hover:shadow-[#568D43]/40 transition-all duration-200 flex items-center justify-center gap-2"
      >
        <span class="flex items-center gap-2">
          Ir para login
          <span class="material-icons text-xl">arrow_forward</span>
        </span>
      </NuxtLink>
    </div>

    <!-- Link para login -->
    <p class="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
      Lembrou a senha antiga?
      <NuxtLink to="/auth/login" class="text-[#568D43] hover:text-[#4a7a3a] font-semibold transition-colors">
        Fazer login
      </NuxtLink>
    </p>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'auth'
})

const supabase = useSupabaseClient()
const router = useRouter()

const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const passwordStrength = computed(() => {
  const pwd = password.value
  if (!pwd) return 0

  let strength = 0
  if (pwd.length >= 6) strength++
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++
  if (/\d/.test(pwd)) strength++
  if (/[^a-zA-Z0-9]/.test(pwd)) strength++

  return strength
})

const passwordStrengthText = computed(() => {
  const texts = ['', 'Fraca', 'Razoável', 'Boa', 'Forte']
  return password.value ? texts[passwordStrength.value] : ''
})

const passwordStrengthTextColor = computed(() => {
  const colors = ['', 'text-red-500', 'text-orange-500', 'text-yellow-600', 'text-green-500']
  return colors[passwordStrength.value]
})

const getPasswordStrengthColor = (index) => {
  if (!password.value) return 'bg-gray-200 dark:bg-gray-700'
  if (index <= passwordStrength.value) {
    const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500']
    return colors[passwordStrength.value - 1] || 'bg-gray-200 dark:bg-gray-700'
  }
  return 'bg-gray-200 dark:bg-gray-700'
}

const handleResetPassword = async () => {
  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'As senhas não coincidem.'
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    const { error } = await supabase.auth.updateUser({
      password: password.value
    })

    if (error) {
      errorMessage.value = error.message
      return
    }

    successMessage.value = 'Senha redefinida com sucesso!'

    setTimeout(() => {
      router.push('/auth/login')
    }, 3000)
  } catch (err) {
    errorMessage.value = 'Ocorreu um erro inesperado. Tente novamente.'
  } finally {
    loading.value = false
  }
}
</script>
