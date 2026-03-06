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
            <span class="material-icons-outlined text-primary text-xl sm:text-2xl">inventory_2</span>
          </div>
          <div class="min-w-0">
            <h2 class="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
              {{ embalagem ? 'Editar embalagem' : 'Nova embalagem' }}
            </h2>
            <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Cadastro de embalagem</p>
          </div>
        </div>

        <!-- Content -->
        <div class="px-4 sm:px-6 py-4 sm:py-6 overflow-y-auto flex-1 space-y-4">
          <div>
            <label class="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-1.5">
              Nome da embalagem
            </label>
            <input
              type="text"
              v-model="form.nome"
              class="input w-full text-sm"
              placeholder="Ex: Bandeja 200g, Saco 500g, Caixa 5kg..."
              @keyup.enter="handleSave"
            />
          </div>
          <div>
            <label class="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-1.5">
              Valor unitário
            </label>
            <input
              type="text"
              v-model="form.valorFormatado"
              @focus="onValorFocus"
              @blur="onValorBlur"
              @input="onValorInput"
              class="input w-full text-sm"
              placeholder="R$ 0,00"
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
  embalagem: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'save'])

const saving = ref(false)

const form = ref({
  nome: '',
  valor: 0,
  valorFormatado: 'R$ 0,00'
})

const canSave = computed(() => {
  return form.value.nome.trim().length > 0
})

onMounted(() => {
  if (props.embalagem) {
    form.value.nome = props.embalagem.nome
    form.value.valor = props.embalagem.valor_unitario || 0
    form.value.valorFormatado = formatCurrency(form.value.valor)
  }
})

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function parseCurrency(value) {
  const cleaned = value.replace(/[R$\s.]/g, '').replace(',', '.')
  return parseFloat(cleaned) || 0
}

function onValorFocus() {
  if (form.value.valor > 0) {
    form.value.valorFormatado = form.value.valor.toString().replace('.', ',')
  } else {
    form.value.valorFormatado = ''
  }
}

function onValorBlur() {
  form.value.valorFormatado = formatCurrency(form.value.valor)
}

function onValorInput(e) {
  const value = e.target.value
  const cleaned = value.replace(/[^\d,]/g, '')
  const parts = cleaned.split(',')
  let finalValue = parts[0]
  if (parts.length > 1) {
    finalValue += ',' + parts[1].slice(0, 2)
  }
  form.value.valorFormatado = finalValue
  form.value.valor = parseCurrency(finalValue)
}

function handleSave() {
  if (!canSave.value) return

  saving.value = true

  emit('save', {
    id: props.embalagem?.id || null,
    nome: form.value.nome.trim(),
    valor_unitario: form.value.valor
  })
}
</script>
