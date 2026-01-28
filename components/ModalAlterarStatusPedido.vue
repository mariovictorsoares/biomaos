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
      <div class="fixed inset-0 z-50 overflow-y-auto">
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
            <div class="relative w-full max-w-md glass-panel rounded-xl shadow-xl">
          <!-- Header -->
          <div class="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
              </div>
              <div>
                <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                  Alterar Status Pedido
                </h2>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Alterar status do pedido {{ pedido?.numero }}
                </p>
              </div>
            </div>
          </div>

          <!-- Content -->
          <div class="px-6 py-6">
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Selecione o novo status para o pedido:
            </p>

            <div class="space-y-2">
              <label
                v-for="status in statusOptions"
                :key="status.value"
                :class="[
                  'flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors',
                  selectedStatus === status.value
                    ? 'border-primary bg-primary/5 dark:bg-primary/10'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                ]"
              >
                <input
                  type="radio"
                  :value="status.value"
                  v-model="selectedStatus"
                  class="w-4 h-4 text-primary focus:ring-primary"
                />
                <div class="flex-1">
                  <span class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ status.label }}
                  </span>
                </div>
                <span :class="getStatusBadgeClass(status.value)">
                  {{ status.label }}
                </span>
              </label>
            </div>
          </div>

          <!-- Footer -->
          <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
            <button
              @click="$emit('close')"
              class="btn btn-secondary"
            >
              Cancelar
            </button>
            <button
              @click="handleSave"
              class="btn btn-primary"
              :disabled="!selectedStatus || selectedStatus === pedido?.status"
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

<script setup lang="ts">
import { ref, watch } from 'vue'

interface Pedido {
  id: string
  numero: string
  status: string
}

const props = defineProps<{
  pedido: Pedido | null
}>()

const emit = defineEmits<{
  close: []
  save: [status: string]
}>()

const statusOptions = [
  { value: 'previsto', label: 'Previsto' },
  { value: 'reservado', label: 'Reservado' },
  { value: 'confirmado', label: 'Confirmado' },
  { value: 'finalizado', label: 'Finalizado' },
  { value: 'cancelado', label: 'Cancelado' }
]

const selectedStatus = ref('')

watch(() => props.pedido, (novoPedido) => {
  if (novoPedido) {
    selectedStatus.value = novoPedido.status
  }
}, { immediate: true })

function getStatusBadgeClass(status: string): string {
  const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border'
  const classes: Record<string, string> = {
    previsto: 'bg-gray-50 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600',
    reservado: 'bg-orange-50 text-orange-700 border-orange-300 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-700',
    confirmado: 'bg-green-50 text-green-700 border-green-300 dark:bg-green-900/20 dark:text-green-400 dark:border-green-700',
    finalizado: 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-700',
    cancelado: 'bg-red-50 text-red-700 border-red-300 dark:bg-red-900/20 dark:text-red-400 dark:border-red-700'
  }
  return `${base} ${classes[status] || classes.previsto}`
}

function handleSave() {
  if (selectedStatus.value && selectedStatus.value !== props.pedido?.status) {
    emit('save', selectedStatus.value)
  }
}
</script>
