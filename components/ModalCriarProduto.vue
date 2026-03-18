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
        <div class="px-6 py-5 border-b border-gray-200">
          <h2 class="text-xl font-semibold text-gray-900">Cadastro de produto</h2>
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
        <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
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
            Salvar
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
import { ref } from 'vue'
import { useToast } from '~/composables/useToast'

const { showToast } = useToast()
const emit = defineEmits(['close', 'save'])

const attempted = ref(false)

const form = ref({
  codigo: '',
  nome: '',
  unidade: ''
})

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
</script>
