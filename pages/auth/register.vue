<template>
  <div class="auth-animate-stagger">
    <!-- Loading -->
    <div v-if="loadingInvite" class="text-center py-12">
      <span class="material-icons-outlined text-4xl text-[#568D43] animate-spin">refresh</span>
      <p class="text-gray-500 mt-4">Verificando convite...</p>
    </div>

    <!-- Convite inválido ou expirado -->
    <div v-else-if="inviteError" class="text-center py-8">
      <span class="material-icons-outlined text-6xl text-red-400 mb-4">error_outline</span>
      <h2 class="text-2xl font-bold text-gray-900 mb-2">
        Convite inválido
      </h2>
      <p class="text-gray-500 mb-6">
        {{ inviteError }}
      </p>
      <NuxtLink to="/auth/login" class="auth-btn-primary inline-flex items-center justify-center gap-2 px-6 !w-auto">
        Ir para o login
      </NuxtLink>
    </div>

    <!-- Formulario de registro -->
    <template v-else>
      <!-- Header -->
      <div class="mb-6">
        <h2 class="text-3xl font-bold text-gray-900 mb-2">
          Criar sua conta
        </h2>
        <p class="text-gray-500">
          Olá, <strong class="text-gray-700">{{ convite.nome }}</strong>! Complete seu cadastro para acessar o sistema.
        </p>
      </div>

      <!-- Mensagem de erro -->
      <div
        v-if="errorMessage"
        class="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3"
      >
        <span class="material-icons-outlined text-red-500 text-xl shrink-0">error_outline</span>
        <p class="text-sm text-red-700">{{ errorMessage }}</p>
      </div>

      <!-- Mensagem de sucesso -->
      <div
        v-if="successMessage"
        class="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3"
      >
        <span class="material-icons-outlined text-green-500 text-xl shrink-0">check_circle</span>
        <p class="text-sm text-green-700">{{ successMessage }}</p>
      </div>

      <!-- Info do convite -->
      <div class="mb-6 p-4 bg-[#568D43]/5 border border-[#568D43]/15 rounded-xl">
        <div class="flex items-center gap-3">
          <span class="material-icons-outlined text-[#568D43] text-xl">badge</span>
          <div>
            <p class="text-sm font-medium text-gray-900">{{ convite.nome }}</p>
            <p class="text-xs text-gray-500">{{ convite.email }} - {{ convite.perfil === 'admin' ? 'Administrador' : 'Usuário' }}</p>
          </div>
        </div>
      </div>

      <!-- Formulario -->
      <form @submit.prevent="handleRegister" class="space-y-5">
        <!-- Email (readonly) -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            E-mail
          </label>
          <div class="relative">
            <span class="absolute left-4 top-1/2 -translate-y-1/2 material-icons-outlined text-gray-400 text-xl">
              mail
            </span>
            <input
              type="email"
              :value="convite.email"
              readonly
              class="auth-input pl-12 !bg-gray-100 cursor-not-allowed text-gray-500"
            />
          </div>
        </div>

        <!-- Senha -->
        <div>
          <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
            Crie uma senha
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
            Confirme a senha
          </label>
          <div class="relative">
            <span class="absolute left-4 top-1/2 -translate-y-1/2 material-icons-outlined text-gray-400 text-xl">
              lock
            </span>
            <input
              id="confirmPassword"
              v-model="confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              placeholder="Repita a senha"
              required
              minlength="6"
              class="auth-input pl-12 pr-12"
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

        <!-- Botao de Registro -->
        <button
          type="submit"
          :disabled="loading || !canSubmit"
          class="auth-btn-primary flex items-center justify-center gap-2"
        >
          <span v-if="loading" class="flex items-center gap-2">
            <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Criando conta...
          </span>
          <span v-else class="flex items-center gap-2">
            Criar conta
            <span class="material-icons-outlined text-xl">arrow_forward</span>
          </span>
        </button>
      </form>

      <!-- Link para login -->
      <p class="mt-6 text-center text-sm text-gray-500">
        Já tem uma conta?
        <NuxtLink to="/auth/login" class="text-[#568D43] hover:text-[#4a7a3a] font-medium transition-colors">
          Faça login
        </NuxtLink>
      </p>
    </template>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'auth',
  pageTransition: { name: 'auth-page', mode: 'out-in' }
})

const route = useRoute()
const router = useRouter()
const supabase = useSupabaseClient()

const loadingInvite = ref(true)
const inviteError = ref('')
const convite = ref(null)

const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const canSubmit = computed(() => {
  return password.value.length >= 6 && password.value === confirmPassword.value
})

onMounted(async () => {
  const token = route.query.token

  if (!token) {
    inviteError.value = 'Token de convite não informado.'
    loadingInvite.value = false
    return
  }

  try {
    const { data, error } = await supabase
      .from('convites_usuario')
      .select('*')
      .eq('token', token)
      .eq('status', 'pending')
      .single()

    if (error || !data) {
      inviteError.value = 'Convite não encontrado ou já foi utilizado.'
      loadingInvite.value = false
      return
    }

    if (new Date(data.expires_at) < new Date()) {
      inviteError.value = 'Este convite expirou. Solicite um novo convite.'
      loadingInvite.value = false
      return
    }

    convite.value = data
  } catch (err) {
    console.error('Erro ao verificar convite:', err)
    inviteError.value = 'Erro ao verificar convite. Tente novamente.'
  } finally {
    loadingInvite.value = false
  }
})

const handleRegister = async () => {
  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'As senhas não coincidem.'
    return
  }

  if (password.value.length < 6) {
    errorMessage.value = 'A senha deve ter no mínimo 6 caracteres.'
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: convite.value.email,
      password: password.value,
      options: {
        data: {
          full_name: convite.value.nome
        }
      }
    })

    if (signUpError) throw signUpError

    if (signUpData.user) {
      const { error: prefError } = await supabase.from('user_preferences').insert({
        user_id: signUpData.user.id,
        perfil: convite.value.perfil,
        nome_completo: convite.value.nome,
        celular: convite.value.celular || null,
        cep: convite.value.cep || null,
        endereco: convite.value.endereco || null,
        numero: convite.value.numero || null,
        complemento: convite.value.complemento || null,
        estado: convite.value.estado || null,
        cidade: convite.value.cidade || null,
        foto_url: convite.value.foto_url || null,
        ativo: true
      })

      if (prefError) {
        console.error('Erro ao salvar preferencias:', prefError)
      }

      await supabase
        .from('convites_usuario')
        .update({ status: 'accepted', accepted_at: new Date().toISOString() })
        .eq('id', convite.value.id)
    }

    successMessage.value = 'Conta criada com sucesso! Redirecionando...'

    setTimeout(() => {
      router.push('/')
    }, 2000)
  } catch (err) {
    console.error('Erro ao criar conta:', err)
    if (err.message?.includes('already registered')) {
      errorMessage.value = 'Este e-mail já está cadastrado. Faça login.'
    } else {
      errorMessage.value = err.message || 'Erro ao criar conta. Tente novamente.'
    }
  } finally {
    loading.value = false
  }
}
</script>
