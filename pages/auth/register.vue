<template>
  <div class="w-full max-w-md">
    <!-- Loading -->
    <div v-if="loadingInvite" class="text-center py-12">
      <span class="material-icons text-4xl text-primary animate-spin">refresh</span>
      <p class="text-gray-500 dark:text-gray-400 mt-4">Verificando convite...</p>
    </div>

    <!-- Convite invalido ou expirado -->
    <div v-else-if="inviteError" class="text-center py-8">
      <span class="material-icons-outlined text-6xl text-red-400 mb-4">error_outline</span>
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Convite inválido
      </h2>
      <p class="text-gray-500 dark:text-gray-400 mb-6">
        {{ inviteError }}
      </p>
      <NuxtLink to="/auth/login" class="btn btn-primary">
        Ir para o login
      </NuxtLink>
    </div>

    <!-- Formulário de registro -->
    <template v-else>
      <!-- Header -->
      <div class="mb-8">
        <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Criar sua conta
        </h2>
        <p class="text-gray-500 dark:text-gray-400">
          Olá, <strong>{{ convite.nome }}</strong>! Complete seu cadastro para acessar o sistema.
        </p>
      </div>

      <!-- Mensagem de erro -->
      <div
        v-if="errorMessage"
        class="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl flex items-start gap-3"
      >
        <span class="material-icons text-red-500 text-xl shrink-0">error_outline</span>
        <p class="text-sm text-red-600 dark:text-red-400">{{ errorMessage }}</p>
      </div>

      <!-- Mensagem de sucesso -->
      <div
        v-if="successMessage"
        class="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-xl flex items-start gap-3"
      >
        <span class="material-icons text-green-500 text-xl shrink-0">check_circle</span>
        <p class="text-sm text-green-600 dark:text-green-400">{{ successMessage }}</p>
      </div>

      <!-- Info do convite -->
      <div class="mb-6 p-4 bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-xl">
        <div class="flex items-center gap-3">
          <span class="material-icons text-primary text-xl">badge</span>
          <div>
            <p class="text-sm font-medium text-gray-900 dark:text-white">{{ convite.nome }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">{{ convite.email }} - {{ convite.perfil === 'admin' ? 'Administrador' : 'Usuário' }}</p>
          </div>
        </div>
      </div>

      <!-- Formulário -->
      <form @submit.prevent="handleRegister" class="space-y-5">
        <!-- Email (readonly) -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
              class="w-full h-12 pl-12 pr-4 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-500 dark:text-gray-400 cursor-not-allowed"
            />
          </div>
        </div>

        <!-- Senha -->
        <div>
          <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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

        <!-- Confirmar Senha -->
        <div>
          <label for="confirmPassword" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
              class="w-full h-12 pl-12 pr-12 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#568D43] focus:border-transparent transition-all"
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
        </div>

        <!-- Botão de Registro -->
        <button
          type="submit"
          :disabled="loading || !canSubmit"
          class="w-full h-12 bg-[#568D43] hover:bg-[#4a7a3a] text-white font-semibold rounded-xl shadow-lg shadow-[#568D43]/25 hover:shadow-[#568D43]/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
            <span class="material-icons text-xl">arrow_forward</span>
          </span>
        </button>
      </form>

      <!-- Link para login -->
      <p class="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
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
  layout: 'auth'
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

// Verificar token do convite
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

    // Verificar se expirou
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
    // Criar usuário no Supabase Auth
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

    // Criar preferencias do usuario
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

      // Atualizar status do convite
      await supabase
        .from('convites_usuario')
        .update({ status: 'accepted', accepted_at: new Date().toISOString() })
        .eq('id', convite.value.id)
    }

    successMessage.value = 'Conta criada com sucesso! Redirecionando...'

    // Redirecionar para o dashboard apos 2 segundos
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
