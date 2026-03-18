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
      <div v-if="modelValue" class="fixed inset-0 z-[70] overflow-y-auto">
        <div class="fixed inset-0 glass-backdrop z-[70]" @click="$emit('update:modelValue', false)"></div>
        <div class="flex min-h-full items-center justify-center p-2 sm:p-4">
          <Transition
            enter-active-class="transition-all duration-200"
            enter-from-class="opacity-0 scale-95"
            enter-to-class="opacity-100 scale-100"
            leave-active-class="transition-all duration-200"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-95"
          >
            <div v-if="modelValue" class="relative z-[71] bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
              <!-- Header -->
              <div class="px-4 sm:px-6 py-4 border-b border-border-light dark:border-border-dark flex items-center justify-between flex-shrink-0">
                <div class="flex items-center gap-3 sm:gap-4">
                  <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span class="material-icons-outlined text-primary text-xl sm:text-2xl">receipt_long</span>
                  </div>
                  <div class="min-w-0">
                    <h2 class="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Pedidos</h2>
                    <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Gerencie seus pedidos e recorrências</p>
                  </div>
                </div>

                <div class="flex items-center gap-3">
                  <!-- Mini tabs -->
                  <div class="hidden sm:flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
                    <button
                      v-for="tab in tabs"
                      :key="tab.key"
                      @click="activeTab = tab.key"
                      :class="[
                        'px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap',
                        activeTab === tab.key
                          ? 'bg-white dark:bg-gray-700 text-primary shadow-sm'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                      ]"
                    >
                      <span class="material-icons-outlined text-sm mr-1 align-middle">{{ tab.icon }}</span>
                      {{ tab.label }}
                    </button>
                  </div>

                  <button
                    @click="$emit('update:modelValue', false)"
                    class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    <span class="material-icons-outlined">close</span>
                  </button>
                </div>
              </div>

              <!-- Mobile tabs -->
              <div class="sm:hidden flex items-center border-b border-border-light dark:border-border-dark px-4">
                <button
                  v-for="tab in tabs"
                  :key="tab.key"
                  @click="activeTab = tab.key"
                  :class="[
                    'flex-1 py-2.5 text-xs font-medium text-center border-b-2 transition-all',
                    activeTab === tab.key
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 dark:text-gray-400'
                  ]"
                >
                  {{ tab.label }}
                </button>
              </div>

              <!-- Body -->
              <div class="flex-1 overflow-y-auto p-4 sm:p-6">
                <TabPedidos v-if="activeTab === 'pedidos'" />
                <TabPedidosRecorrentes v-if="activeTab === 'recorrentes'" />
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const activeTab = ref('pedidos')

const tabs = [
  { key: 'pedidos', label: 'Pedidos', icon: 'receipt_long' },
  { key: 'recorrentes', label: 'Recorrentes', icon: 'event_repeat' }
]
</script>
