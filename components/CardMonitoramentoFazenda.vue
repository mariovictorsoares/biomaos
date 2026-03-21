<template>
  <div
    class="card cursor-pointer hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group relative overflow-hidden"
    @click="$emit('click')"
  >
    <!-- Decorative gradient left border -->
    <div
      class="absolute top-0 left-0 bottom-0 w-1 rounded-l-lg"
      :class="hasDevices ? tempGradientVerticalClass : 'bg-gray-300 dark:bg-gray-600'"
    ></div>

    <div class="flex items-center px-5 py-4 gap-6">
      <!-- Farm name + code -->
      <div class="min-w-0 w-40 shrink-0">
        <h3 class="font-semibold text-text-light dark:text-text-dark truncate text-[15px]">{{ fazenda.nome }}</h3>
        <p class="text-[11px] text-subtext-light dark:text-subtext-dark mt-0.5 tracking-wide uppercase">{{ fazenda.codigo }}</p>
      </div>

      <!-- Metrics or empty state -->
      <div class="flex items-center gap-3 flex-1 min-w-0">
        <template v-if="hasDevices">
          <!-- Temperature: current + daily stats -->
          <div class="rounded-lg px-3 py-1.5 transition-colors flex items-center gap-3" :class="tempBgClass">
            <div class="flex items-center gap-1.5">
              <span class="material-icons-outlined text-[16px]" :class="tempIconClass">thermostat</span>
              <span class="text-lg font-bold tracking-tight" :class="tempTextClass">
                {{ avgTemp !== null ? avgTemp.toFixed(1) + '°' : '--' }}
              </span>
            </div>
            <div v-if="stats && stats.minTemp !== null" class="flex items-center gap-1.5 text-[10px] font-medium border-l pl-3" :class="tempBorderClass">
              <span class="text-sky-600 dark:text-sky-400">{{ stats.minTemp.toFixed(1) }}°</span>
              <span class="text-amber-600 dark:text-amber-400">{{ stats.avgTemp.toFixed(1) }}°</span>
              <span class="text-red-500 dark:text-red-400">{{ stats.maxTemp.toFixed(1) }}°</span>
            </div>
          </div>
          <!-- Humidity: current + daily stats -->
          <div class="rounded-lg px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 transition-colors flex items-center gap-3">
            <div class="flex items-center gap-1.5">
              <span class="material-icons-outlined text-[16px] text-blue-500 dark:text-blue-400">water_drop</span>
              <span class="text-lg font-bold tracking-tight text-blue-700 dark:text-blue-300">
                {{ avgHumid !== null ? avgHumid.toFixed(0) + '%' : '--' }}
              </span>
            </div>
            <div v-if="stats && stats.minHumid !== null" class="flex items-center gap-1.5 text-[10px] font-medium border-l border-blue-200 dark:border-blue-700/50 pl-3">
              <span class="text-sky-600 dark:text-sky-400">{{ stats.minHumid.toFixed(0) }}%</span>
              <span class="text-amber-600 dark:text-amber-400">{{ stats.avgHumid.toFixed(0) }}%</span>
              <span class="text-blue-600 dark:text-blue-400">{{ stats.maxHumid.toFixed(0) }}%</span>
            </div>
          </div>
        </template>
        <template v-else>
          <div class="flex items-center gap-1.5 text-subtext-light dark:text-subtext-dark">
            <span class="material-icons-outlined text-lg text-gray-300 dark:text-gray-600">sensors_off</span>
            <span class="text-xs">Nenhum dispositivo vinculado</span>
          </div>
        </template>
      </div>

      <!-- Farm info -->
      <div class="flex items-center text-[11px] text-subtext-light dark:text-subtext-dark shrink-0">
        <div class="flex items-center gap-1 w-[70px]">
          <span class="material-icons-outlined text-[13px]">stairs</span>
          <span>{{ fazenda.numero_andares || 0 }} and.</span>
        </div>
        <div class="flex items-center gap-1 w-[75px]">
          <span class="material-icons-outlined text-[13px]">view_comfy_alt</span>
          <span>{{ fazenda.bandejas_por_andar || 0 }}/and.</span>
        </div>
        <div class="flex items-center gap-1 w-[80px]">
          <span class="material-icons-outlined text-[13px]">inventory_2</span>
          <span class="font-medium text-text-light dark:text-text-dark">{{ fazenda.capacidade_bandejas || 0 }} band.</span>
        </div>
      </div>

      <!-- Device badge -->
      <span
        class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium shrink-0 w-[46px] justify-center"
        :class="onlineCount > 0
          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
          : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'"
      >
        <span class="w-1.5 h-1.5 rounded-full" :class="onlineCount > 0 ? 'bg-green-500 animate-pulse' : 'bg-gray-400'"></span>
        {{ onlineCount }}/{{ dispositivos.length }}
      </span>

      <!-- Updated + arrow -->
      <div class="flex items-center gap-2 shrink-0 text-[11px]">
        <span class="text-subtext-light dark:text-subtext-dark w-[72px] text-right">{{ lastUpdatedText }}</span>
        <span class="material-icons-outlined text-base text-gray-400 group-hover:text-primary transition-colors group-hover:translate-x-0.5 transform">chevron_right</span>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  fazenda: { type: Object, required: true },
  dispositivos: { type: Array, default: () => [] },
  stats: { type: Object, default: null },
})

defineEmits(['click'])

const hasDevices = computed(() => props.dispositivos.length > 0)

const onlineCount = computed(() =>
  props.dispositivos.filter(d => d.online).length
)

const avgTemp = computed(() => {
  const temps = props.dispositivos
    .filter(d => d.tem_temperatura && d.temperatura_atual !== null)
    .map(d => Number(d.temperatura_atual))
  if (temps.length === 0) return null
  return temps.reduce((a, b) => a + b, 0) / temps.length
})

const avgHumid = computed(() => {
  const umids = props.dispositivos
    .filter(d => d.tem_umidade && d.umidade_atual !== null)
    .map(d => Number(d.umidade_atual))
  if (umids.length === 0) return null
  return umids.reduce((a, b) => a + b, 0) / umids.length
})

// Temperature color zones
const tempBgClass = computed(() => {
  if (avgTemp.value === null) return 'bg-gray-50 dark:bg-gray-800'
  if (avgTemp.value < 15) return 'bg-sky-50 dark:bg-sky-900/20'
  if (avgTemp.value < 28) return 'bg-emerald-50 dark:bg-emerald-900/20'
  if (avgTemp.value < 32) return 'bg-orange-50 dark:bg-orange-900/20'
  return 'bg-red-50 dark:bg-red-900/20'
})

const tempBorderClass = computed(() => {
  if (avgTemp.value === null) return 'border-gray-200 dark:border-gray-700'
  if (avgTemp.value < 15) return 'border-sky-200 dark:border-sky-700/50'
  if (avgTemp.value < 28) return 'border-emerald-200 dark:border-emerald-700/50'
  if (avgTemp.value < 32) return 'border-orange-200 dark:border-orange-700/50'
  return 'border-red-200 dark:border-red-700/50'
})

const tempIconClass = computed(() => {
  if (avgTemp.value === null) return 'text-gray-400'
  if (avgTemp.value < 15) return 'text-sky-500 dark:text-sky-400'
  if (avgTemp.value < 28) return 'text-emerald-500 dark:text-emerald-400'
  if (avgTemp.value < 32) return 'text-orange-500 dark:text-orange-400'
  return 'text-red-500 dark:text-red-400'
})

const tempTextClass = computed(() => {
  if (avgTemp.value === null) return 'text-gray-400'
  if (avgTemp.value < 15) return 'text-sky-700 dark:text-sky-300'
  if (avgTemp.value < 28) return 'text-emerald-700 dark:text-emerald-300'
  if (avgTemp.value < 32) return 'text-orange-700 dark:text-orange-300'
  return 'text-red-700 dark:text-red-300'
})

const tempGradientVerticalClass = computed(() => {
  if (avgTemp.value === null) return 'bg-gradient-to-b from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-500'
  if (avgTemp.value < 15) return 'bg-gradient-to-b from-sky-400 to-blue-500'
  if (avgTemp.value < 28) return 'bg-gradient-to-b from-emerald-400 to-green-500'
  if (avgTemp.value < 32) return 'bg-gradient-to-b from-orange-400 to-amber-500'
  return 'bg-gradient-to-b from-red-400 to-rose-500'
})

const lastUpdatedText = computed(() => {
  const ultimaLeitura = props.dispositivos
    .filter(d => d.ultima_leitura)
    .map(d => new Date(d.ultima_leitura))
    .sort((a, b) => b - a)[0]

  if (!ultimaLeitura) return 'Sem leituras'

  const diffMs = Date.now() - ultimaLeitura.getTime()
  const diffMin = Math.floor(diffMs / 60000)

  if (diffMin < 1) return 'Agora'
  if (diffMin < 60) return `${diffMin} min`
  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) return `${diffHours}h`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d`
})
</script>
