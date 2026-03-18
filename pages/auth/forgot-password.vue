<template>
  <div class="auth-animate-stagger">
    <!-- Voltar -->
    <NuxtLink
      to="/auth/login"
      class="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-8"
    >
      <span class="material-icons-outlined text-xl">arrow_back</span>
      Voltar para login
    </NuxtLink>

    <!-- Header -->
    <div class="mb-8">
      <h2 class="text-3xl font-bold text-gray-900 mb-2">
        Esqueceu a senha?
      </h2>
      <p class="text-gray-500">
        Sem problemas! Digite seu e-mail e enviaremos um link para redefinir sua senha.
      </p>
    </div>

    <!-- Formulario -->
    <form @submit.prevent="handleSubmit" class="space-y-5" v-if="!emailSent">
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

      <!-- Botao de Enviar -->
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
          Enviando...
        </span>
        <span v-else class="flex items-center gap-2">
          Enviar link de recuperação
          <span class="material-icons-outlined text-xl">send</span>
        </span>
      </button>
    </form>

    <!-- Acao apos sucesso -->
    <div v-if="emailSent" class="space-y-4">
      <p class="text-sm text-gray-500 text-center">
        Não recebeu o e-mail?
        <button
          @click="handleSubmit"
          :disabled="loading || countdown > 0"
          class="text-[#568D43] font-semibold hover:text-[#4a7a3a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ countdown > 0 ? `Reenviar em ${countdown}s` : 'Reenviar' }}
        </button>
      </p>
      <NuxtLink
        to="/auth/login"
        class="auth-btn-primary flex items-center justify-center gap-2"
      >
        Voltar para login
        <span class="material-icons-outlined text-xl">arrow_forward</span>
      </NuxtLink>
    </div>

  </div>
</template>

<script setup>
definePageMeta({
  layout: 'auth',
  pageTransition: { name: 'auth-page', mode: 'out-in' }
})

const supabase = useSupabaseClient()
const toast = useToast()

const email = ref('')
const loading = ref(false)
const emailSent = ref(false)
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

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email.value, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    })

    if (error) {
      toast.error('Erro ao enviar e-mail. Verifique o endereço e tente novamente.')
      return
    }

    emailSent.value = true
    toast.success(`Enviamos um link de recuperação para ${email.value}`, 5000)
    startCountdown()
  } catch (err) {
    toast.error('Ocorreu um erro inesperado. Tente novamente.')
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
