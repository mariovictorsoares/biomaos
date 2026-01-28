<template>
  <div class="w-full max-w-md">
    <!-- Voltar -->
    <NuxtLink
      to="/auth/login"
      class="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors mb-8"
    >
      <span class="material-icons text-xl">arrow_back</span>
      Voltar para login
    </NuxtLink>

    <!-- Header -->
    <div class="mb-8">
      <div class="w-14 h-14 bg-[#568D43]/10 rounded-2xl flex items-center justify-center mb-6">
        <span class="material-icons-outlined text-[#568D43] text-3xl">lock_reset</span>
      </div>
      <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
        Esqueceu a senha?
      </h2>
      <p class="text-gray-500 dark:text-gray-400">
        Sem problemas! Digite seu e-mail e enviaremos um link para redefinir sua senha.
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
          <p class="text-xs text-green-500 dark:text-green-500 mt-2">
            Não recebeu o e-mail?
            <button
              @click="handleSubmit"
              :disabled="loading || countdown > 0"
              class="text-green-600 dark:text-green-400 font-medium hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ countdown > 0 ? `Reenviar em ${countdown}s` : 'Reenviar' }}
            </button>
          </p>
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
    <form @submit.prevent="handleSubmit" class="space-y-5" v-if="!successMessage">
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

      <!-- Botao de Enviar -->
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
          Enviando...
        </span>
        <span v-else class="flex items-center gap-2">
          Enviar link de recuperação
          <span class="material-icons text-xl">send</span>
        </span>
      </button>
    </form>

    <!-- Acao apos sucesso -->
    <div v-if="successMessage" class="space-y-4">
      <NuxtLink
        to="/auth/login"
        class="w-full h-12 bg-[#568D43] hover:bg-[#4a7a3a] text-white font-semibold rounded-xl shadow-lg shadow-[#568D43]/25 hover:shadow-[#568D43]/40 transition-all duration-200 flex items-center justify-center gap-2"
      >
        <span class="flex items-center gap-2">
          Voltar para login
          <span class="material-icons text-xl">arrow_forward</span>
        </span>
      </NuxtLink>
    </div>

    <!-- Dicas -->
    <div class="mt-8 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
      <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Dicas:</p>
      <ul class="space-y-2 text-sm text-gray-500 dark:text-gray-400">
        <li class="flex items-start gap-2">
          <span class="material-icons text-[#568D43] text-sm mt-0.5">check</span>
          Verifique sua pasta de spam ou lixo eletrônico
        </li>
        <li class="flex items-start gap-2">
          <span class="material-icons text-[#568D43] text-sm mt-0.5">check</span>
          O link expira em 1 hora
        </li>
        <li class="flex items-start gap-2">
          <span class="material-icons text-[#568D43] text-sm mt-0.5">check</span>
          Se não receber, tente novamente ou contate o suporte
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'auth'
})

const supabase = useSupabaseClient()

const email = ref('')
const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const countdown = ref(0)

let countdownInterval = null

const startCountdown = () => {
  countdown.value = 60
  countdownInterval = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(countdownInterval)
    }
  }, 1000)
}

const handleSubmit = async () => {
  loading.value = true
  errorMessage.value = ''

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email.value, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    })

    if (error) {
      errorMessage.value = error.message
      return
    }

    successMessage.value = `Enviamos um link de recuperação para ${email.value}`
    startCountdown()
  } catch (err) {
    errorMessage.value = 'Ocorreu um erro inesperado. Tente novamente.'
  } finally {
    loading.value = false
  }
}

onUnmounted(() => {
  if (countdownInterval) {
    clearInterval(countdownInterval)
  }
})
</script>
