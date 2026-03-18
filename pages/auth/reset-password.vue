<template>
  <div class="auth-animate-stagger">
    <!-- Header -->
    <div class="mb-8">
      <h2 class="text-3xl font-bold text-gray-900 mb-2">
        Redefinir senha
      </h2>
      <p class="text-gray-500">
        Crie uma nova senha segura para sua conta
      </p>
    </div>

    <!-- Formulario -->
    <form @submit.prevent="handleResetPassword" class="space-y-5" v-if="!resetDone">
      <!-- Nova Senha -->
      <div>
        <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
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

      <!-- Confirmar Senha -->
      <div>
        <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-2">
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
            class="auth-input pl-12 pr-12"
            :class="{ '!border-red-400 !ring-2 !ring-red-100': confirmPassword && password !== confirmPassword }"
            :disabled="loading"
          />
          <button
            type="button"
            @click="showConfirmPassword = !showConfirmPassword"
            class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <span class="material-icons-outlined text-xl">
              {{ showConfirmPassword ? 'visibility_off' : 'visibility' }}
            </span>
          </button>
        </div>
      </div>

      <!-- Botao de Redefinir -->
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
          Redefinindo...
        </span>
        <span v-else class="flex items-center gap-2">
          Redefinir senha
          <span class="material-icons-outlined text-xl">check</span>
        </span>
      </button>
    </form>

    <!-- Acao apos sucesso -->
    <div v-if="resetDone" class="mt-4">
      <NuxtLink
        to="/auth/login"
        class="auth-btn-primary flex items-center justify-center gap-2"
      >
        Ir para login
        <span class="material-icons-outlined text-xl">arrow_forward</span>
      </NuxtLink>
    </div>

    <!-- Link para login -->
    <p class="mt-8 text-center text-sm text-gray-500">
      Lembrou a senha antiga?
      <NuxtLink to="/auth/login" class="text-[#568D43] hover:text-[#4a7a3a] font-semibold transition-colors">
        Fazer login
      </NuxtLink>
    </p>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'auth',
  pageTransition: { name: 'auth-page', mode: 'out-in' }
})

const supabase = useSupabaseClient()
const router = useRouter()
const toast = useToast()

const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const loading = ref(false)
const resetDone = ref(false)

const validate = () => {
  const errs = []
  const pwd = password.value
  if (pwd.length < 6) errs.push('Mínimo 6 caracteres')
  if (!(/[a-z]/.test(pwd) && /[A-Z]/.test(pwd))) errs.push('Letras maiúsculas e minúsculas')
  if (!/\d/.test(pwd)) errs.push('Pelo menos um número')
  if (!confirmPassword.value) errs.push('Confirme a nova senha')
  else if (pwd !== confirmPassword.value) errs.push('As senhas não coincidem')
  return errs
}

const handleResetPassword = async () => {
  const errs = validate()
  if (errs.length) {
    toast.error(errs.join('. '))
    return
  }

  loading.value = true

  try {
    const { error } = await supabase.auth.updateUser({
      password: password.value
    })

    if (error) {
      const msg = error.message
      if (msg.includes('different from the old password')) {
        toast.error('A nova senha deve ser diferente da senha atual.')
      } else if (msg.includes('at least 6 characters')) {
        toast.error('A senha deve ter pelo menos 6 caracteres.')
      } else {
        toast.error('Erro ao redefinir senha. Tente novamente.')
      }
      return
    }

    resetDone.value = true
    toast.success('Senha redefinida com sucesso!', 5000)

    setTimeout(() => {
      router.push('/auth/login')
    }, 3000)
  } catch (err) {
    toast.error('Ocorreu um erro inesperado. Tente novamente.')
  } finally {
    loading.value = false
  }
}
</script>
