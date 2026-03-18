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
            <div class="relative w-full max-w-md glass-panel rounded-xl shadow-xl">
          <!-- Content -->
          <div class="p-6">
            <!-- Icon -->
            <div class="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
              <svg class="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
            </div>

            <!-- Title -->
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white text-center mb-2">
              {{ title }}
            </h3>

            <!-- Message -->
            <p class="text-sm text-gray-500 dark:text-gray-400 text-center">
              {{ message }}
            </p>
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
              @click="$emit('confirm')"
              :class="['btn', confirmClass || 'btn-primary']"
            >
              {{ confirmText || 'Confirmar' }}
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
defineProps<{
  title: string
  message: string
  confirmText?: string
  confirmClass?: string
}>()

defineEmits<{
  close: []
  confirm: []
}>()
</script>
