<template>
  <div class="w-full max-w-lg">
    <div class="bg-white rounded-xl shadow-sm p-8">
      <!-- Logo -->
      <div class="flex items-center gap-2 mb-8">
        <div class="w-10 h-10 bg-[#549E54] rounded-lg flex items-center justify-center">
          <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </div>
        <span class="text-xl font-semibold text-gray-800">BiomaOS</span>
      </div>

      <h1 class="text-2xl font-bold text-gray-800 mb-2">Chave de acesso</h1>

      <p class="text-[#549E54] mb-6">
        Insira a chave de acesso que foi enviada no e-mail para conseguir visualizar o contrato.
      </p>

      <form @submit.prevent="validarChave">
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Chave de acesso
          </label>
          <input
            v-model="chaveAcesso"
            type="text"
            maxlength="5"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#549E54] focus:border-transparent uppercase tracking-widest text-center text-xl font-mono"
            placeholder="XXXXX"
            :disabled="validando"
          />
          <p v-if="erro" class="mt-2 text-sm text-red-600">
            {{ erro }}
          </p>
        </div>

        <button
          type="submit"
          :disabled="validando || chaveAcesso.length < 5"
          class="w-full px-6 py-3 bg-[#549E54] text-white font-semibold rounded-lg hover:bg-[#478a47] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          <svg v-if="validando" class="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ validando ? 'Validando...' : 'Avançar' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'public'
})

const route = useRoute()
const router = useRouter()
const supabase = useSupabaseClient()

const chaveAcesso = ref('')
const validando = ref(false)
const erro = ref('')

async function validarChave() {
  if (chaveAcesso.value.length < 5) {
    erro.value = 'Insira a chave de acesso completa'
    return
  }

  validando.value = true
  erro.value = ''

  try {
    const { data, error } = await supabase
      .from('contratos')
      .select('id, chave_acesso')
      .eq('id', route.params.id)
      .eq('chave_acesso', chaveAcesso.value.toUpperCase())
      .single()

    if (error || !data) {
      erro.value = 'Chave de acesso inválida. Verifique e tente novamente.'
      return
    }

    // Salvar chave validada no sessionStorage
    sessionStorage.setItem(`contrato_${route.params.id}_validado`, 'true')

    // Redirecionar para visualização
    router.push(`/contrato/${route.params.id}/visualizar`)
  } catch (e) {
    console.error('Erro ao validar chave:', e)
    erro.value = 'Erro ao validar chave. Tente novamente.'
  } finally {
    validando.value = false
  }
}
</script>
