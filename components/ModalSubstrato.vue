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
            <span class="material-icons-outlined text-primary text-xl sm:text-2xl">grass</span>
          </div>
          <div class="min-w-0">
            <h2 class="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
              {{ substrato ? 'Editar substrato' : 'Novo substrato' }}
            </h2>
            <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Cadastro de substrato</p>
          </div>
        </div>

        <!-- Content -->
        <div class="px-4 sm:px-6 py-4 sm:py-6 overflow-y-auto flex-1">
          <div class="flex items-end gap-3">
            <div class="flex-1 min-w-0">
              <label class="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-1.5">
                Nome do substrato
              </label>
              <input
                type="text"
                v-model="form.nome"
                class="input w-full text-sm"
                placeholder="Ex: Turfa, Fibra de Coco..."
                @keyup.enter="handleSave"
              />
            </div>
            <div class="w-28 sm:w-32 flex-shrink-0">
              <label class="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-1.5">
                Valor unit.
              </label>
              <div class="relative">
                <span class="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-subtext-light dark:text-subtext-dark">R$</span>
                <input
                  type="text"
                  :value="form.valorFormatado"
                  @input="onValorInput"
                  class="input w-full text-sm text-right pl-8"
                  placeholder="0,00"
                  inputmode="numeric"
                />
              </div>
            </div>
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
            <span v-if="saving" class="material-icons-outlined text-sm animate-spin mr-2">refresh</span>
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
  substrato: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'save'])

const saving = ref(false)

const form = ref({
  nome: '',
  valor: 0,
  valorFormatado: '0,00'
})

const canSave = computed(() => {
  return form.value.nome.trim().length > 0
})

onMounted(() => {
  if (props.substrato) {
    form.value.nome = props.substrato.nome
    form.value.valor = props.substrato.valor_unitario || 0
    form.value.valorFormatado = formatMonetario(form.value.valor)
  }
})

function formatMonetario(value) {
  const cents = Math.round(Number(value) * 100)
  const reais = (cents / 100).toFixed(2)
  const [intPart, decPart] = reais.split('.')
  const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${formatted},${decPart}`
}

function onValorInput(e) {
  const raw = e.target.value.replace(/\D/g, '')
  if (!raw) {
    form.value.valor = 0
    form.value.valorFormatado = '0,00'
    e.target.value = '0,00'
    return
  }
  const cents = parseInt(raw, 10)
  const reais = cents / 100
  form.value.valor = reais
  form.value.valorFormatado = formatMonetario(reais)
  e.target.value = form.value.valorFormatado
}

function handleSave() {
  if (!canSave.value) return

  saving.value = true

  emit('save', {
    id: props.substrato?.id || null,
    nome: form.value.nome.trim(),
    valor_unitario: form.value.valor
  })
}
</script>
