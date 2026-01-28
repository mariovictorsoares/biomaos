<template>
  <div class="w-full max-w-md">
    <div class="card p-8 text-center">
      <!-- Loading -->
      <div v-if="loading">
        <span class="material-icons text-5xl text-primary animate-spin mb-4">refresh</span>
        <h2 class="text-xl font-semibold text-text-light dark:text-text-dark mb-2">Processando convite...</h2>
        <p class="text-sm text-subtext-light dark:text-subtext-dark">Aguarde um momento</p>
      </div>

      <!-- Sucesso -->
      <div v-else-if="success">
        <span class="material-icons text-5xl text-green-500 mb-4">check_circle</span>
        <h2 class="text-xl font-semibold text-text-light dark:text-text-dark mb-2">Convite aceito!</h2>
        <p class="text-sm text-subtext-light dark:text-subtext-dark mb-6">Você agora faz parte da empresa.</p>
        <NuxtLink to="/" class="btn btn-primary w-full justify-center">
          Ir para o Dashboard
        </NuxtLink>
      </div>

      <!-- Erro -->
      <div v-else-if="error">
        <span class="material-icons text-5xl text-red-500 mb-4">error</span>
        <h2 class="text-xl font-semibold text-text-light dark:text-text-dark mb-2">Erro ao aceitar convite</h2>
        <p class="text-sm text-subtext-light dark:text-subtext-dark mb-6">{{ errorMessage }}</p>
        <NuxtLink to="/auth/login" class="btn btn-primary w-full justify-center">
          Ir para o Login
        </NuxtLink>
      </div>

      <!-- Não autenticado -->
      <div v-else-if="!user">
        <span class="material-icons text-5xl text-primary mb-4">mail</span>
        <h2 class="text-xl font-semibold text-text-light dark:text-text-dark mb-2">Você recebeu um convite!</h2>
        <p class="text-sm text-subtext-light dark:text-subtext-dark mb-6">
          Faça login com sua conta para aceitar o convite.
        </p>
        <NuxtLink :to="`/auth/login?redirect=/auth/accept-invite?token=${token}`" class="btn btn-primary w-full justify-center">
          Fazer Login
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'auth'
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

// Aceitar convite quando usuario estiver autenticado
watch(user, (newUser) => {
  if (newUser && token.value && !success.value && !error.value) {
    acceptInvite()
  }
}, { immediate: true })
</script>
