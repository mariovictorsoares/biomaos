<template>
  <div class="auth-animate-stagger">
    <!-- Loading -->
    <div v-if="loading" class="text-center py-8">
      <div class="w-16 h-16 mx-auto bg-[#568D43]/10 rounded-2xl flex items-center justify-center mb-5">
        <svg class="animate-spin h-8 w-8 text-[#568D43]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
      <h2 class="text-xl font-semibold text-gray-900 mb-2">Processando convite...</h2>
      <p class="text-sm text-gray-500">Aguarde um momento</p>
    </div>

    <!-- Sucesso -->
    <div v-else-if="success" class="text-center py-8">
      <div class="w-16 h-16 mx-auto bg-green-50 border border-green-200 rounded-2xl flex items-center justify-center mb-5">
        <span class="material-icons-outlined text-green-500 text-3xl">check_circle</span>
      </div>
      <h2 class="text-xl font-semibold text-gray-900 mb-2">Convite aceito!</h2>
      <p class="text-sm text-gray-500 mb-6">Você agora faz parte da empresa.</p>
      <NuxtLink to="/" class="auth-btn-primary inline-flex items-center justify-center gap-2 px-8 !w-auto">
        Ir para o Dashboard
      </NuxtLink>
    </div>

    <!-- Erro -->
    <div v-else-if="error" class="text-center py-8">
      <div class="w-16 h-16 mx-auto bg-red-50 border border-red-200 rounded-2xl flex items-center justify-center mb-5">
        <span class="material-icons-outlined text-red-500 text-3xl">error</span>
      </div>
      <h2 class="text-xl font-semibold text-gray-900 mb-2">Erro ao aceitar convite</h2>
      <p class="text-sm text-gray-500 mb-6">{{ errorMessage }}</p>
      <NuxtLink to="/auth/login" class="auth-btn-primary inline-flex items-center justify-center gap-2 px-8 !w-auto">
        Ir para o Login
      </NuxtLink>
    </div>

    <!-- Nao autenticado -->
    <div v-else-if="!user" class="text-center py-8">
      <div class="w-16 h-16 mx-auto bg-[#568D43]/10 rounded-2xl flex items-center justify-center mb-5">
        <span class="material-icons-outlined text-[#568D43] text-3xl">mail</span>
      </div>
      <h2 class="text-xl font-semibold text-gray-900 mb-2">Você recebeu um convite!</h2>
      <p class="text-sm text-gray-500 mb-6">
        Faça login com sua conta para aceitar o convite.
      </p>
      <NuxtLink :to="`/auth/login?redirect=/auth/accept-invite?token=${token}`" class="auth-btn-primary inline-flex items-center justify-center gap-2 px-8 !w-auto">
        Fazer Login
      </NuxtLink>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'auth',
  pageTransition: { name: 'auth-page', mode: 'out-in' }
})

const route = useRoute()
const supabase = useSupabaseClient()
const user = useSupabaseUser()

const token = computed(() => route.query.token)
const loading = ref(false)
const success = ref(false)
const error = ref(false)
const errorMessage = ref('')

async function acceptInvite() {
  if (!token.value || !user.value) return

  loading.value = true
  try {
    const { data, error: rpcError } = await supabase.rpc('accept_invite', {
      p_token: token.value
    })

    if (rpcError) throw rpcError

    if (data?.success) {
      success.value = true
    } else {
      error.value = true
      errorMessage.value = data?.error || 'Erro desconhecido'
    }
  } catch (err) {
    console.error('Erro ao aceitar convite:', err)
    error.value = true
    errorMessage.value = err.message || 'Erro ao processar convite'
  } finally {
    loading.value = false
  }
}

watch(user, (newUser) => {
  if (newUser && token.value && !success.value && !error.value) {
    acceptInvite()
  }
}, { immediate: true })
</script>
