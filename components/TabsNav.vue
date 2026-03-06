<template>
  <div class="inline-flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1" role="tablist">
    <button
      v-for="tab in tabs"
      :key="tab.key"
      role="tab"
      :aria-selected="modelValue === tab.key"
      :class="[
        'relative px-4 py-1.5 text-sm font-medium whitespace-nowrap rounded-md transition-all duration-200 shrink-0',
        modelValue === tab.key
          ? 'bg-white dark:bg-gray-700 text-primary shadow-sm'
          : 'text-subtext-light dark:text-subtext-dark hover:text-text-light dark:hover:text-text-dark'
      ]"
      @click="$emit('update:modelValue', tab.key)"
    >
      {{ tab.label }}
      <span
        v-if="tab.count !== undefined && tab.count !== null"
        :class="[
          'ml-1.5 px-1.5 py-0.5 text-[10px] font-semibold rounded-full',
          modelValue === tab.key
            ? 'bg-primary/10 text-primary'
            : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
        ]"
      >
        {{ tab.count }}
      </span>
    </button>
  </div>
</template>

<script setup>
defineProps({
  tabs: {
    type: Array,
    required: true
  },
  modelValue: {
    type: String,
    required: true
  }
})

defineEmits(['update:modelValue'])
</script>
