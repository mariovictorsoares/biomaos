<template>
  <div class="fixed inset-0 z-[60] overflow-y-auto">
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
            <h2 class="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Substratos</h2>
            <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Gerenciar substratos</p>
          </div>
        </div>

        <!-- Content -->
        <div class="px-4 sm:px-6 py-4 sm:py-6 overflow-y-auto flex-1">
          <label class="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">
            Substratos cadastrados
          </label>

          <!-- Lista -->
          <div v-if="substratos.length > 0" class="space-y-2">
            <div
              v-for="item in substratos"
              :key="item.id"
              class="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <div class="flex-1 min-w-0 pr-2">
                <span class="text-sm font-medium text-gray-900 dark:text-white truncate block">
                  {{ item.nome }}
                </span>
                <span class="text-xs text-subtext-light dark:text-subtext-dark">
                  {{ formatCurrency(item.valor_unitario) }}
                </span>
              </div>
              <button
                @click="editarItem(item)"
                class="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-primary transition-colors flex-shrink-0"
                title="Editar substrato"
              >
                <span class="material-icons-outlined text-lg">edit</span>
              </button>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else class="text-center py-6 sm:py-8 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
            <span class="material-icons-outlined text-4xl text-gray-300 dark:text-gray-600 mb-2">grass</span>
            <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Nenhum substrato cadastrado</p>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 dark:border-gray-700 flex gap-2 sm:gap-3 flex-shrink-0">
          <button
            @click="$emit('close')"
            class="flex-1 btn btn-secondary justify-center text-sm"
          >
            Fechar
          </button>
          <button
            @click="novoItem"
            class="flex-1 btn btn-primary justify-center text-sm"
          >
            Novo substrato
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  substratos: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close', 'novo-substrato', 'editar-substrato'])

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
}

function novoItem() {
  emit('novo-substrato')
}

function editarItem(item) {
  emit('editar-substrato', item)
}
</script>
