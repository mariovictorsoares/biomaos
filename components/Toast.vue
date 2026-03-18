<template>
  <Teleport to="body">
    <div class="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      <TransitionGroup
        enter-active-class="transition-all duration-300 ease-out"
        enter-from-class="opacity-0 translate-x-8"
        enter-to-class="opacity-100 translate-x-0"
        leave-active-class="transition-all duration-200 ease-in"
        leave-from-class="opacity-100 translate-x-0"
        leave-to-class="opacity-0 translate-x-8"
      >
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="pointer-events-auto flex items-center gap-3 px-4 py-3 bg-white rounded-lg shadow-lg border border-gray-100 min-w-[280px] max-w-[400px]"
        >
          <!-- Icon -->
          <div :class="getIconContainerClass(toast.type)">
            <span class="material-icons-outlined text-sm">{{ getIcon(toast.type) }}</span>
          </div>

          <!-- Message -->
          <p class="flex-1 text-sm text-gray-700 font-medium">{{ toast.message }}</p>

          <!-- Close button -->
          <button
            @click="removeToast(toast.id)"
            class="text-gray-400 hover:text-gray-600 transition-colors shrink-0"
          >
            <span class="material-icons-outlined text-lg">close</span>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { useToast } from '~/composables/useToast'

const { toasts, removeToast } = useToast()

function getIcon(type) {
  switch (type) {
    case 'success': return 'check'
    case 'error': return 'close'
    case 'warning': return 'warning'
    default: return 'info'
  }
}

function getIconContainerClass(type) {
  const base = 'w-6 h-6 rounded-full flex items-center justify-center shrink-0'
  switch (type) {
    case 'success': return `${base} bg-green-100 text-green-600`
    case 'error': return `${base} bg-red-100 text-red-600`
    case 'warning': return `${base} bg-amber-100 text-amber-600`
    default: return `${base} bg-blue-100 text-blue-600`
  }
}
</script>
