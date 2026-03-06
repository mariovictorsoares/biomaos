<template>
  <div class="fixed inset-0 z-[70] overflow-y-auto">
    <!-- Backdrop -->
    <div
      class="fixed inset-0 glass-backdrop transition-opacity"
      @click="$emit('close')"
    ></div>

    <!-- Modal -->
    <div class="flex min-h-full items-center justify-center p-2 sm:p-4">
      <div class="relative w-full max-w-md glass-panel rounded-xl shadow-xl transform transition-all max-h-[90vh] flex flex-col">
        <!-- Header com icone -->
        <div class="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span class="material-icons-outlined text-primary text-xl sm:text-2xl">category</span>
          </div>
          <div class="min-w-0">
            <h2 class="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
              {{ tipo ? 'Editar tipo' : 'Novo tipo' }}
            </h2>
            <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Cadastro de tipo de produto</p>
          </div>
        </div>

        <!-- Content -->
        <div class="px-4 sm:px-6 py-4 sm:py-6 overflow-y-auto flex-1 space-y-4">
          <div>
            <label class="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-1.5">
              Código
            </label>
            <input
              type="text"
              v-model="form.codigo"
              class="input w-full text-sm"
              placeholder="Ex: 100g, BP, BG..."
              maxlength="20"
            />
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Código curto para usar no produto (opcional)</p>
          </div>

          <div>
            <label class="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-1.5">
              Nome do tipo
            </label>
            <input
              type="text"
              v-model="form.nome"
              class="input w-full text-sm"
              placeholder="Ex: Colhido 100g, Plantado Bandeja Pequena..."
              @keyup.enter="handleSave"
            />
          </div>
        </div>

        <!-- Footer -->
        <div class="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 dark:border-gray-700 flex gap-2 sm:gap-3 flex-shrink-0">
          <button
            @click="$emit('close')"
            class="flex-1 btn btn-secondary justify-center text-sm"
          >
            Voltar
          </button>
          <button
            @click="handleSave"
            class="flex-1 btn btn-primary justify-center text-sm"
            :disabled="!canSave || saving"
          >
            <span v-if="saving" class="material-icons text-sm animate-spin mr-2">refresh</span>
            Salvar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const props = defineProps({
  tipo: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'save'])

const saving = ref(false)

const form = ref({
  codigo: '',
  nome: ''
})

const canSave = computed(() => {
  return form.value.nome.trim().length > 0
})

onMounted(() => {
  if (props.tipo) {
    form.value.codigo = props.tipo.codigo || ''
    form.value.nome = props.tipo.nome
  }
})

function handleSave() {
  if (!canSave.value) return

  saving.value = true

  emit('save', {
    id: props.tipo?.id || null,
    codigo: form.value.codigo.trim() || null,
    nome: form.value.nome.trim()
  })
}
</script>
