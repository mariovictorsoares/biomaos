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
            <span class="material-icons-outlined text-primary text-xl sm:text-2xl">category</span>
          </div>
          <div class="min-w-0">
            <h2 class="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Tipos de produto</h2>
            <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Gerenciar tipos de produto</p>
          </div>
        </div>

        <!-- Content -->
        <div class="px-4 sm:px-6 py-4 sm:py-6 overflow-y-auto flex-1">
          <label class="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">
            Tipos cadastrados
          </label>

          <!-- Lista de Tipos -->
          <div v-if="tipos.length > 0" class="space-y-2">
            <div
              v-for="tipo in tipos"
              :key="tipo.id"
              class="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <div class="flex items-center gap-2 truncate pr-2">
                <span v-if="tipo.codigo" class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono font-semibold bg-primary/10 text-primary shrink-0">
                  {{ tipo.codigo }}
                </span>
                <span class="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {{ tipo.nome }}
                </span>
              </div>
              <button
                @click="editarTipo(tipo)"
                class="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-primary transition-colors flex-shrink-0"
                title="Editar tipo"
              >
                <span class="material-icons-outlined text-lg">edit</span>
              </button>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else class="text-center py-6 sm:py-8 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
            <span class="material-icons-outlined text-4xl text-gray-300 dark:text-gray-600 mb-2">category</span>
            <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Nenhum tipo cadastrado</p>
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
            @click="novoTipo"
            class="flex-1 btn btn-primary justify-center text-sm"
          >
            Novo tipo
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  tipos: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close', 'novo-tipo', 'editar-tipo'])

function novoTipo() {
  emit('novo-tipo')
}

function editarTipo(tipo) {
  emit('editar-tipo', tipo)
}
</script>
