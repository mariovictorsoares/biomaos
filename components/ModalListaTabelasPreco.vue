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
            <svg class="w-5 h-5 sm:w-6 sm:h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <div class="min-w-0">
            <h2 class="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Tabelas de preco</h2>
            <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Cadastro de tabelas de precos</p>
          </div>
        </div>

        <!-- Content -->
        <div class="px-4 sm:px-6 py-4 sm:py-6 overflow-y-auto flex-1">
          <label class="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">
            Tabelas
          </label>

          <!-- Lista de Tabelas -->
          <div v-if="tabelas.length > 0" class="space-y-2">
            <div
              v-for="tabela in tabelas"
              :key="tabela.id"
              class="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <span class="text-sm font-medium text-gray-900 dark:text-white truncate pr-2">
                {{ tabela.nome }}
              </span>
              <button
                @click="editarTabela(tabela)"
                class="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-primary transition-colors flex-shrink-0"
                title="Editar tabela"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else class="text-center py-6 sm:py-8 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
            <svg class="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-gray-300 dark:text-gray-600 mb-2 sm:mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
            <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Nenhuma tabela cadastrada</p>
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
            @click="novaTabela"
            class="flex-1 btn btn-primary justify-center text-sm"
          >
            Nova tabela
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface TabelaPreco {
  id: string
  nome: string
}

defineProps<{
  tabelas: TabelaPreco[]
}>()

const emit = defineEmits<{
  close: []
  'nova-tabela': []
  'editar-tabela': [tabela: TabelaPreco]
}>()

function novaTabela() {
  emit('nova-tabela')
}

function editarTabela(tabela: TabelaPreco) {
  emit('editar-tabela', tabela)
}
</script>
