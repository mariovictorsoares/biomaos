<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div class="fixed inset-0 z-[100] overflow-y-auto">
        <!-- Backdrop -->
        <div
          class="fixed inset-0 glass-backdrop"
          @click="$emit('close')"
        ></div>

        <!-- Modal -->
        <div class="flex min-h-full items-center justify-center p-4">
          <Transition
            enter-active-class="transition-all duration-200"
            enter-from-class="opacity-0 scale-95"
            enter-to-class="opacity-100 scale-100"
            leave-active-class="transition-all duration-200"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-95"
          >
            <div class="relative w-full max-w-lg glass-panel rounded-xl shadow-xl">
              <!-- Header -->
              <div class="flex items-center justify-between px-6 py-4 border-b border-border-light dark:border-border-dark">
                <div>
                  <h2 class="text-lg font-semibold text-text-light dark:text-text-dark">Conectar Conta eWeLink</h2>
                  <p class="text-sm text-subtext-light dark:text-subtext-dark mt-1">Autorize o acesso aos seus dispositivos</p>
                </div>
                <button
                  @click="$emit('close')"
                  class="text-subtext-light dark:text-subtext-dark hover:text-text-light dark:hover:text-text-dark"
                >
                  <span class="material-icons-outlined">close</span>
                </button>
              </div>

              <!-- Form -->
              <div class="px-6 py-6 space-y-5">
                <!-- Nome -->
                <div>
                  <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Nome da conta (opcional)</label>
                  <input
                    v-model="form.nome"
                    type="text"
                    class="input"
                    placeholder="Ex: Conta Principal"
                  />
                </div>

                <!-- Região -->
                <div>
                  <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Região do servidor</label>
                  <select v-model="form.regiao" class="input">
                    <option value="us">América (US)</option>
                    <option value="eu">Europa (EU)</option>
                    <option value="cn">China (CN)</option>
                    <option value="as">Ásia (AS)</option>
                  </select>
                </div>

                <!-- Info -->
                <div class="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p class="text-sm text-blue-700 dark:text-blue-300">
                    Você será redirecionado para a página do eWeLink para fazer login e autorizar o acesso aos seus dispositivos.
                  </p>
                </div>

                <!-- Erro -->
                <div v-if="erro" class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p class="text-sm text-red-600 dark:text-red-400">{{ erro }}</p>
                </div>
              </div>

              <!-- Footer -->
              <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-border-light dark:border-border-dark">
                <button @click="$emit('close')" class="btn btn-secondary">
                  Cancelar
                </button>
                <button
                  @click="handleAutorizar"
                  class="btn btn-primary"
                  :disabled="loading"
                >
                  <span v-if="loading" class="material-icons-outlined animate-spin text-base mr-1">refresh</span>
                  {{ loading ? 'Redirecionando...' : 'Autorizar no eWeLink' }}
                </button>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
const props = defineProps({
  empresaId: { type: String, required: true }
})

const emit = defineEmits(['close', 'connected'])

const loading = ref(false)
const erro = ref('')

const form = ref({
  nome: '',
  regiao: 'us',
})

async function handleAutorizar() {
  if (!props.empresaId) {
    erro.value = 'Empresa não selecionada'
    return
  }

  loading.value = true
  erro.value = ''

  try {
    // Gerar state para proteção CSRF (crypto seguro)
    const array = new Uint8Array(16)
    crypto.getRandomValues(array)
    const state = 'ew_' + Array.from(array, b => b.toString(16).padStart(2, '0')).join('')

    // Salvar state e dados para processamento após callback
    localStorage.setItem('ewelink_oauth_state', state)
    localStorage.setItem('ewelink_oauth_data', JSON.stringify({
      empresa_id: props.empresaId,
      regiao: form.value.regiao,
      nome: form.value.nome || 'Conta eWeLink',
    }))

    // Obter URL OAuth do servidor (APPID fica no server, não exposto ao client)
    const result = await $fetch('/api/ewelink/oauth-url', {
      method: 'POST',
      body: {
        regiao: form.value.regiao,
        state,
      }
    })

    if (result.url) {
      // Redirecionar para página de autorização eWeLink
      window.location.href = result.url
    } else {
      erro.value = 'Erro ao gerar URL de autorização'
      loading.value = false
    }
  } catch (e) {
    loading.value = false
    erro.value = 'Erro ao comunicar com o servidor'
    console.error('Erro OAuth eWeLink:', e)
  }
}
</script>
