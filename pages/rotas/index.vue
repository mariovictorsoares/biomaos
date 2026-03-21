<template>
  <div>
    <div class="flex items-center justify-between mb-12">
      <h1 class="text-lg font-medium text-text-light/70 dark:text-text-dark/70 tracking-wide uppercase">Rotas</h1>
    </div>

    <TabRotas ref="tabRotasRef" @motoristas="showMotoristas = true" />

    <!-- Modal Motoristas -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        leave-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        leave-to-class="opacity-0"
      >
        <div v-if="showMotoristas" class="fixed inset-0 z-[70] overflow-y-auto">
          <div class="fixed inset-0 glass-backdrop" @click="closeMotoristas"></div>
          <div class="flex min-h-full items-center justify-center p-4">
            <Transition
              enter-active-class="transition-all duration-200"
              leave-active-class="transition-all duration-200"
              enter-from-class="opacity-0 scale-95"
              leave-to-class="opacity-0 scale-95"
            >
              <div v-if="showMotoristas" class="relative z-[71] glass-panel rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                <div class="flex items-center justify-between px-6 py-4 border-b border-border-light dark:border-border-dark flex-shrink-0">
                  <h2 class="text-lg font-semibold text-text-light dark:text-text-dark">Motoristas</h2>
                  <button @click="closeMotoristas" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <span class="material-icons-outlined">close</span>
                  </button>
                </div>
                <div class="overflow-y-auto flex-1 p-6">
                  <TabMotoristas />
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const showMotoristas = ref(false)
const tabRotasRef = ref<any>(null)

function closeMotoristas() {
  showMotoristas.value = false
  tabRotasRef.value?.loadData()
}
</script>
