<template>
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <!-- Backdrop -->
    <div
      class="fixed inset-0 bg-black/50 transition-opacity"
      @click="$emit('close')"
    ></div>

    <!-- Modal -->
    <div class="flex min-h-full items-center justify-center p-4">
      <div class="relative w-full max-w-lg bg-white rounded-xl shadow-xl transform transition-all">
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-5 border-b border-gray-200">
          <h2 class="text-xl font-semibold text-gray-900">Editar produto</h2>
          <button
            @click="$emit('close')"
            class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <!-- Content -->
        <div class="px-6 py-6 space-y-5">
          <!-- Grid 2 colunas - Código e Unidade -->
          <div class="grid grid-cols-2 gap-4">
            <!-- Código -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">
                Código <span class="text-red-500">*</span>
              </label>
              <input
                type="text"
                v-model="form.codigo"
                placeholder=""
                :class="['input', attempted && !form.codigo ? 'border-red-500' : '']"
                maxlength="10"
              />
              <span v-if="attempted && !form.codigo" class="text-xs text-red-500 mt-1">Campo obrigatório</span>
            </div>

            <!-- Unidade -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">
                Unidade <span class="text-red-500">*</span>
              </label>
              <input
                type="text"
                v-model="form.unidade"
                placeholder=""
                :class="['input', attempted && !form.unidade ? 'border-red-500' : '']"
              />
              <span v-if="attempted && !form.unidade" class="text-xs text-red-500 mt-1">Campo obrigatório</span>
            </div>
          </div>

          <!-- Produto -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">
              Produto <span class="text-red-500">*</span>
            </label>
            <input
              type="text"
              v-model="form.nome"
              placeholder=""
              :class="['input', attempted && !form.nome ? 'border-red-500' : '']"
            />
            <span v-if="attempted && !form.nome" class="text-xs text-red-500 mt-1">Campo obrigatório</span>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <button
            @click="handleDelete"
            class="text-sm text-red-500 hover:text-red-600 font-medium flex items-center gap-1.5"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
            Excluir Produto
          </button>
          <div class="flex items-center gap-3">
            <button
              @click="$emit('close')"
              class="btn btn-secondary"
            >
              Cancelar
            </button>
            <button
              @click="handleSave"
              class="btn btn-primary"
            >
              Salvar Alterações
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useToast } from '~/composables/useToast'

const { showToast } = useToast()

const props = defineProps({
  produto: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'save', 'delete'])

const attempted = ref(false)

const form = ref({
  codigo: '',
  nome: '',
  unidade: ''
})

// Preencher form com dados do produto
watch(() => props.produto, (newProduto) => {
  if (newProduto) {
    form.value = {
      codigo: newProduto.codigo || '',
      nome: newProduto.nome || '',
      unidade: newProduto.unidade || ''
    }
    attempted.value = false
  }
}, { immediate: true })

const handleSave = () => {
  attempted.value = true
  if (!form.value.codigo || !form.value.nome || !form.value.unidade) {
    showToast('Por favor, preencha todos os campos obrigatórios.', 'error')
    return
  }

  emit('save', {
    codigo: form.value.codigo.toUpperCase(),
    nome: form.value.nome,
    unidade: form.value.unidade
  })
}

const handleDelete = () => {
  if (confirm(`Deseja realmente excluir o produto "${form.value.nome}"?`)) {
    emit('delete', props.produto)
    emit('close')
  }
}
</script>
