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
            <p class="text-sm text-subtext-light dark:text-subtext-dark mt-1">Vincule sua conta eWeLink para monitorar dispositivos</p>
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
            <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Nome da conta</label>
            <input
              v-model="form.nome"
              type="text"
              class="input"
              placeholder="Ex: Conta Principal"
            />
          </div>

          <!-- Email -->
          <div>
            <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Email eWeLink</label>
            <input
              v-model="form.email"
              type="email"
              class="input"
              placeholder="seu@email.com"
            />
          </div>

          <!-- Senha -->
          <div>
            <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Senha eWeLink</label>
            <input
              v-model="form.senha"
              type="password"
              class="input"
              placeholder="••••••••"
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
            @click="handleConectar"
            class="btn btn-primary"
            :disabled="loading || !form.email || !form.senha"
          >
            <span v-if="loading" class="material-icons-outlined animate-spin text-base mr-1">refresh</span>
            {{ loading ? 'Conectando...' : 'Conectar' }}
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
const { success, error: showError } = useToast()

const loading = ref(false)
const erro = ref('')

const form = ref({
  nome: '',
  email: '',
  senha: '',
  regiao: 'us',
})

async function handleConectar() {
  if (!form.value.email || !form.value.senha) {
    erro.value = 'Email e senha são obrigatórios'
    return
  }

  loading.value = true
  erro.value = ''

  try {
    const result = await $fetch('/api/ewelink/conectar', {
      method: 'POST',
      body: {
        empresa_id: props.empresaId,
        email: form.value.email,
        senha: form.value.senha,
        regiao: form.value.regiao,
        nome: form.value.nome || `Conta ${form.value.email}`,
      }
    })

    if (result.success) {
      success('Conta eWeLink conectada com sucesso!')
      emit('connected', result)
      emit('close')
    } else {
      erro.value = result.error || 'Erro ao conectar'
    }
  } catch (e) {
    erro.value = 'Erro de comunicação com o servidor'
    console.error('Erro ao conectar eWeLink:', e)
  } finally {
    loading.value = false
  }
}
</script>
