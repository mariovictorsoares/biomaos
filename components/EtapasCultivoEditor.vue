<template>
  <div class="space-y-3">
    <div class="flex items-center justify-between">
      <h4 class="text-sm font-medium text-text-light dark:text-text-dark">Etapas de Cultivo</h4>
      <button
        type="button"
        @click="adicionarEtapa"
        class="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium"
      >
        <span class="material-icons text-sm">add</span>
        Adicionar etapa
      </button>
    </div>

    <!-- Lista de etapas -->
    <div v-if="etapas.length > 0" class="space-y-2">
      <div
        v-for="(etapa, index) in etapas"
        :key="index"
        class="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
      >
        <!-- Ordem -->
        <div class="flex flex-col gap-0.5 shrink-0">
          <button
            type="button"
            @click="moverEtapa(index, -1)"
            :disabled="index === 0"
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <span class="material-icons text-xs">keyboard_arrow_up</span>
          </button>
          <button
            type="button"
            @click="moverEtapa(index, 1)"
            :disabled="index === etapas.length - 1"
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <span class="material-icons text-xs">keyboard_arrow_down</span>
          </button>
        </div>

        <!-- Número -->
        <span class="text-xs text-subtext-light dark:text-subtext-dark font-mono w-5 text-center shrink-0">
          {{ index + 1 }}
        </span>

        <!-- Nome -->
        <input
          v-model="etapa.nome"
          type="text"
          placeholder="Nome da etapa"
          class="input text-sm flex-1 min-w-0"
          @input="emitUpdate"
        />

        <!-- Duração -->
        <div class="flex items-center gap-1 shrink-0">
          <input
            v-model.number="etapa.duracao_dias"
            type="number"
            min="1"
            placeholder="0"
            class="input text-sm w-16 text-center"
            @input="emitUpdate"
          />
          <span class="text-xs text-subtext-light dark:text-subtext-dark">dias</span>
        </div>

        <!-- Remover -->
        <button
          type="button"
          @click="removerEtapa(index)"
          class="text-red-400 hover:text-red-600 shrink-0"
        >
          <span class="material-icons text-sm">close</span>
        </button>
      </div>
    </div>

    <!-- Mensagem quando vazio -->
    <div v-else class="text-center py-4 border border-dashed border-border-light dark:border-border-dark rounded-lg">
      <p class="text-xs text-subtext-light dark:text-subtext-dark">
        <template v-if="tempoGerminacao || tempoLuz">
          Usando padrão: Germinação ({{ tempoGerminacao || 0 }} dias) + Luz ({{ tempoLuz || 0 }} dias)
        </template>
        <template v-else>
          Nenhuma etapa definida. Clique em "Adicionar etapa" para configurar.
        </template>
      </p>
    </div>

    <!-- Timeline visual -->
    <div v-if="etapas.length > 0 && tempoTotal > 0" class="space-y-1">
      <div class="flex rounded-full overflow-hidden h-6">
        <div
          v-for="(etapa, index) in etapas"
          :key="'bar-' + index"
          :style="{ width: (etapa.duracao_dias / tempoTotal * 100) + '%' }"
          :class="coresEtapa[index % coresEtapa.length]"
          class="flex items-center justify-center text-[10px] font-medium text-white truncate px-1"
          :title="etapa.nome + ' (' + etapa.duracao_dias + 'd)'"
        >
          {{ etapa.duracao_dias }}d
        </div>
      </div>
      <div class="flex justify-between text-[10px] text-subtext-light dark:text-subtext-dark">
        <span>Plantio</span>
        <span>{{ tempoTotal }} dias total</span>
        <span>Colheita</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  tempoGerminacao: { type: Number, default: 0 },
  tempoLuz: { type: Number, default: 0 }
})

const emit = defineEmits(['update:modelValue'])

const etapas = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const coresEtapa = [
  'bg-amber-500',
  'bg-emerald-500',
  'bg-sky-500',
  'bg-violet-500',
  'bg-rose-500',
  'bg-orange-500'
]

const tempoTotal = computed(() => {
  return etapas.value.reduce((sum, e) => sum + (e.duracao_dias || 0), 0)
})

function adicionarEtapa() {
  const novaEtapa = {
    nome: '',
    ordem: etapas.value.length + 1,
    duracao_dias: 1
  }
  emit('update:modelValue', [...etapas.value, novaEtapa])
}

function removerEtapa(index) {
  const novas = etapas.value.filter((_, i) => i !== index)
  // Reordenar
  novas.forEach((e, i) => { e.ordem = i + 1 })
  emit('update:modelValue', novas)
}

function moverEtapa(index, direcao) {
  const novoIndex = index + direcao
  if (novoIndex < 0 || novoIndex >= etapas.value.length) return

  const novas = [...etapas.value]
  const [movida] = novas.splice(index, 1)
  novas.splice(novoIndex, 0, movida)
  // Reordenar
  novas.forEach((e, i) => { e.ordem = i + 1 })
  emit('update:modelValue', novas)
}

function emitUpdate() {
  emit('update:modelValue', [...etapas.value])
}
</script>
