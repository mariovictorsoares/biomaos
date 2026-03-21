<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200"
      leave-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div v-if="show" class="fixed inset-0 z-[60] overflow-y-auto">
        <div class="fixed inset-0 glass-backdrop" @click="$emit('close')"></div>
        <div class="flex min-h-full items-center justify-center p-4">
          <Transition
            enter-active-class="transition-all duration-200"
            leave-active-class="transition-all duration-200"
            enter-from-class="opacity-0 scale-95"
            leave-to-class="opacity-0 scale-95"
          >
            <div v-if="show" class="relative glass-panel rounded-lg shadow-xl w-full max-w-5xl">
              <!-- Header -->
              <div class="border-b border-border-light dark:border-border-dark px-6 py-4 flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary shrink-0">
                    <span class="material-icons-outlined text-primary text-lg">agriculture</span>
                  </div>
                  <div>
                    <h2 class="text-lg font-semibold text-text-light dark:text-text-dark">{{ fazenda.nome }}</h2>
                    <p class="text-xs text-subtext-light dark:text-subtext-dark">{{ fazenda.codigo }} &middot; Monitoramento</p>
                  </div>
                </div>
                <div class="flex items-center gap-3">
                  <span
                    class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                    :class="dispositivosOnline > 0
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'"
                  >
                    <span class="w-2 h-2 rounded-full" :class="dispositivosOnline > 0 ? 'bg-green-500 animate-pulse' : 'bg-gray-400'"></span>
                    <span class="material-icons-outlined text-sm">sensors</span>
                    {{ dispositivosOnline }}/{{ dispositivos.length }}
                  </span>
                  <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <span class="material-icons-outlined">close</span>
                  </button>
                </div>
              </div>

              <!-- Body -->
              <div class="p-6 space-y-6 overflow-y-auto max-h-[75vh]">

                <!-- Devices -->
                <div>
                  <div class="flex items-center justify-between mb-3">
                    <h3 class="text-sm font-semibold text-text-light dark:text-text-dark">
                      Dispositivos <span class="text-subtext-light dark:text-subtext-dark font-normal">({{ dispositivos.length }})</span>
                    </h3>
                    <button @click="showAddDevice = !showAddDevice" class="btn btn-secondary text-xs">
                      <span class="material-icons-outlined text-sm mr-1">add_link</span>
                      Vincular
                    </button>
                  </div>

                  <div v-if="showAddDevice" class="card p-3 mb-3 flex items-center gap-2">
                    <select v-model="deviceToAdd" class="input flex-1 text-sm">
                      <option value="">Selecione um dispositivo...</option>
                      <option v-for="d in unassignedDevices" :key="d.id" :value="d.id">
                        {{ d.nome_personalizado || d.nome }} ({{ d.modelo || 'Sensor' }})
                      </option>
                    </select>
                    <button @click="handleAddDevice" class="btn btn-primary text-xs" :disabled="!deviceToAdd">
                      Vincular
                    </button>
                    <button @click="showAddDevice = false" class="btn btn-secondary text-xs">
                      <span class="material-icons-outlined text-sm">close</span>
                    </button>
                  </div>

                  <div v-if="dispositivos.length > 0" class="space-y-2">
                    <div
                      v-for="d in dispositivos"
                      :key="d.id"
                      class="card p-3 flex items-center justify-between"
                    >
                      <div class="flex items-center gap-3">
                        <span class="w-2.5 h-2.5 rounded-full flex-shrink-0" :class="d.online ? 'bg-green-500' : 'bg-gray-400'"></span>
                        <div>
                          <p class="text-sm font-medium text-text-light dark:text-text-dark">{{ d.nome_personalizado || d.nome }}</p>
                          <p class="text-xs text-subtext-light dark:text-subtext-dark">{{ d.modelo || 'Sensor' }} &middot; {{ d.online ? 'Online' : 'Offline' }}</p>
                        </div>
                      </div>
                      <div class="flex items-center gap-4">
                        <div class="flex items-center gap-3 text-sm">
                          <span v-if="d.tem_temperatura && d.temperatura_atual !== null" class="font-medium" :class="tempColor(d.temperatura_atual)">
                            {{ Number(d.temperatura_atual).toFixed(1) }}°C
                          </span>
                          <span v-if="d.tem_umidade && d.umidade_atual !== null" class="font-medium text-blue-600 dark:text-blue-400">
                            {{ Number(d.umidade_atual).toFixed(0) }}%
                          </span>
                        </div>
                        <button
                          @click="handleRemoveDevice(d)"
                          class="p-1 text-gray-400 hover:text-red-500 transition-colors"
                          title="Desvincular"
                        >
                          <span class="material-icons-outlined text-lg">link_off</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div v-else class="card p-6 text-center">
                    <span class="material-icons-outlined text-3xl text-gray-300 dark:text-gray-600 mb-1">sensors_off</span>
                    <p class="text-sm text-subtext-light dark:text-subtext-dark">Nenhum dispositivo vinculado</p>
                    <p class="text-xs text-subtext-light/70 dark:text-subtext-dark/70 mt-1">Clique em "Vincular" para associar dispositivos a esta fazenda</p>
                  </div>
                </div>

                <!-- Charts -->
                <div>
                  <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
                    <h3 class="text-sm font-semibold text-text-light dark:text-text-dark">Histórico</h3>
                    <div class="monit-date-range-wrapper">
                      <VueDatePicker
                        v-model="dateRange"
                        range
                        :preset-dates="presetDates"
                        :dark="isDark"
                        :enable-time-picker="false"
                        auto-apply
                        :format="formatDateRange"
                        locale="pt-BR"
                        placeholder="Selecione período..."
                        :clearable="false"
                        input-class-name="dp-input-custom"
                        menu-class-name="dp-menu-custom"
                        :max-date="new Date()"
                        position="left"
                        :teleport="true"
                      />
                    </div>
                  </div>

                  <div v-if="loadingLeituras" class="card p-8 text-center">
                    <span class="material-icons-outlined animate-spin text-2xl text-subtext-light dark:text-subtext-dark">refresh</span>
                    <p class="text-sm text-subtext-light dark:text-subtext-dark mt-2">Carregando dados...</p>
                  </div>

                  <template v-else-if="leituras.length > 0">
                    <div class="space-y-3">
                      <!-- Temperature chart -->
                      <div class="card p-4">
                        <div class="flex items-center justify-between mb-3">
                          <div class="flex items-center gap-1.5">
                            <span class="material-icons-outlined text-sm text-red-500">thermostat</span>
                            <span class="text-xs font-semibold text-text-light dark:text-text-dark">Temperatura</span>
                          </div>
                          <div class="flex items-center gap-3 text-xs font-medium">
                            <span class="text-sky-600 dark:text-sky-400">
                              <span class="material-icons-outlined text-xs align-middle">arrow_downward</span>
                              {{ minTemp !== null ? minTemp.toFixed(1) + '°' : '-' }}
                            </span>
                            <span class="text-amber-600 dark:text-amber-400">
                              <span class="material-icons-outlined text-xs align-middle">remove</span>
                              {{ avgTempLeituras !== null ? avgTempLeituras.toFixed(1) + '°' : '-' }}
                            </span>
                            <span class="text-red-600 dark:text-red-400">
                              <span class="material-icons-outlined text-xs align-middle">arrow_upward</span>
                              {{ maxTemp !== null ? maxTemp.toFixed(1) + '°' : '-' }}
                            </span>
                          </div>
                        </div>
                        <div class="relative h-[190px]">
                          <Line :data="chartDataTemp" :options="chartOptionsTemp" :plugins="[gradientPlugin]" />
                        </div>
                      </div>

                      <!-- Humidity chart -->
                      <div class="card p-4">
                        <div class="flex items-center justify-between mb-3">
                          <div class="flex items-center gap-1.5">
                            <span class="material-icons-outlined text-sm text-blue-500">water_drop</span>
                            <span class="text-xs font-semibold text-text-light dark:text-text-dark">Umidade</span>
                          </div>
                          <div class="flex items-center gap-3 text-xs font-medium">
                            <span class="text-sky-600 dark:text-sky-400">
                              <span class="material-icons-outlined text-xs align-middle">arrow_downward</span>
                              {{ minHumid !== null ? minHumid.toFixed(0) + '%' : '-' }}
                            </span>
                            <span class="text-amber-600 dark:text-amber-400">
                              <span class="material-icons-outlined text-xs align-middle">remove</span>
                              {{ avgHumidLeituras !== null ? avgHumidLeituras.toFixed(0) + '%' : '-' }}
                            </span>
                            <span class="text-blue-600 dark:text-blue-400">
                              <span class="material-icons-outlined text-xs align-middle">arrow_upward</span>
                              {{ maxHumid !== null ? maxHumid.toFixed(0) + '%' : '-' }}
                            </span>
                          </div>
                        </div>
                        <div class="relative h-[190px]">
                          <Line :data="chartDataUmid" :options="chartOptionsUmid" :plugins="[gradientPlugin]" />
                        </div>
                      </div>
                    </div>
                  </template>

                  <div v-else class="card p-8 text-center">
                    <span class="material-icons-outlined text-3xl text-gray-300 dark:text-gray-600 mb-1">show_chart</span>
                    <p class="text-sm text-subtext-light dark:text-subtext-dark">Nenhuma leitura para o período selecionado</p>
                  </div>
                </div>

              </div>

              <!-- Footer -->
              <div class="border-t border-border-light dark:border-border-dark px-6 py-4 flex justify-end">
                <button @click="$emit('close')" class="btn btn-secondary">Fechar</button>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  TimeScale,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import 'chartjs-adapter-date-fns'
import { ptBR } from 'date-fns/locale'
import VueDatePicker from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, TimeScale, Tooltip, Legend, Filler)

const props = defineProps({
  show: { type: Boolean, default: false },
  fazenda: { type: Object, required: true },
})

const emit = defineEmits(['close', 'updated'])

const supabase = useSupabaseClient()
const { currentCompany } = useCurrentCompany()
const { success, error: showError } = useToast()

// State
const dispositivos = ref([])
const allDevices = ref([])
const leituras = ref([])
const loadingLeituras = ref(false)
const showAddDevice = ref(false)
const deviceToAdd = ref('')

// Date range picker - default: today (full day)
function todayRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
  return [start, end]
}

const dateRange = ref(todayRange())

const presetDates = computed(() => {
  const today = new Date()
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0)
  const endToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59)
  const last7 = new Date(today)
  last7.setDate(last7.getDate() - 6)
  last7.setHours(0, 0, 0, 0)
  const last30 = new Date(today)
  last30.setDate(last30.getDate() - 29)
  last30.setHours(0, 0, 0, 0)
  const startMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  return [
    { label: 'Hoje', value: [startToday, endToday] },
    { label: 'Últimos 7 dias', value: [last7, endToday] },
    { label: 'Últimos 30 dias', value: [last30, endToday] },
    { label: 'Este mês', value: [startMonth, endToday] },
  ]
})

function formatDateRange(dates) {
  if (!dates || dates.length < 2 || !dates[0] || !dates[1]) return ''
  const fmt = (d) => {
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const yy = String(d.getFullYear()).slice(2)
    return `${dd}/${mm}/${yy}`
  }
  // Same day: show only one date
  if (dates[0].toDateString() === dates[1].toDateString()) return fmt(dates[0])
  return `${fmt(dates[0])} – ${fmt(dates[1])}`
}

// Whether range spans more than 1 day (for label formatting)
const isMultiDay = computed(() => {
  if (!dateRange.value || !dateRange.value[0] || !dateRange.value[1]) return false
  return dateRange.value[0].toDateString() !== dateRange.value[1].toDateString()
})

// Computeds
const dispositivosOnline = computed(() => dispositivos.value.filter(d => d.online).length)

const tempMedia = computed(() => {
  const temps = dispositivos.value.filter(d => d.tem_temperatura && d.temperatura_atual !== null).map(d => Number(d.temperatura_atual))
  if (temps.length === 0) return null
  return temps.reduce((a, b) => a + b, 0) / temps.length
})

const umidMedia = computed(() => {
  const umids = dispositivos.value.filter(d => d.tem_umidade && d.umidade_atual !== null).map(d => Number(d.umidade_atual))
  if (umids.length === 0) return null
  return umids.reduce((a, b) => a + b, 0) / umids.length
})


const unassignedDevices = computed(() =>
  allDevices.value.filter(d => !d.fazenda_id && d.ativo && (d.tem_temperatura || d.tem_umidade))
)

// Chart min/max
const minTemp = computed(() => {
  const temps = leituras.value.map(l => l.temperatura).filter(v => v !== null && v !== undefined)
  return temps.length ? Math.min(...temps) : null
})
const maxTemp = computed(() => {
  const temps = leituras.value.map(l => l.temperatura).filter(v => v !== null && v !== undefined)
  return temps.length ? Math.max(...temps) : null
})
const minHumid = computed(() => {
  const vals = leituras.value.map(l => l.umidade).filter(v => v !== null && v !== undefined)
  return vals.length ? Math.min(...vals) : null
})
const maxHumid = computed(() => {
  const vals = leituras.value.map(l => l.umidade).filter(v => v !== null && v !== undefined)
  return vals.length ? Math.max(...vals) : null
})
const avgTempLeituras = computed(() => {
  const temps = leituras.value.map(l => l.temperatura).filter(v => v !== null && v !== undefined)
  return temps.length ? temps.reduce((a, b) => a + b, 0) / temps.length : null
})
const avgHumidLeituras = computed(() => {
  const vals = leituras.value.map(l => l.umidade).filter(v => v !== null && v !== undefined)
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
})

// Dark mode
const isDark = ref(false)

onMounted(() => {
  isDark.value = document.documentElement.classList.contains('dark')
  const darkObserver = new MutationObserver(() => {
    isDark.value = document.documentElement.classList.contains('dark')
  })
  darkObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
  onBeforeUnmount(() => darkObserver.disconnect())
})

// Gradient plugin - creates dynamic canvas gradients using chartArea dimensions
const gradientPlugin = {
  id: 'customGradient',
  beforeDatasetsDraw(chart) {
    const { ctx, chartArea } = chart
    if (!chartArea) return

    chart.data.datasets.forEach((dataset) => {
      if (!dataset.borderColor || !dataset.fill) return
      const hex = dataset.borderColor
      const r = parseInt(hex.slice(1, 3), 16)
      const g = parseInt(hex.slice(3, 5), 16)
      const b = parseInt(hex.slice(5, 7), 16)
      const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
      gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.25)`)
      gradient.addColorStop(0.7, `rgba(${r}, ${g}, ${b}, 0.05)`)
      gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`)
      dataset.backgroundColor = gradient
    })
  }
}

// Determine aggregation bucket size (ms) based on date range span
const bucketMs = computed(() => {
  if (!xBounds.value.min || !xBounds.value.max) return 15 * 60 * 1000
  const diffMs = xBounds.value.max.getTime() - xBounds.value.min.getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)
  if (diffDays <= 1) return 10 * 60 * 1000      // 10 min buckets
  if (diffDays <= 7) return 60 * 60 * 1000       // 1 hour buckets
  return 3 * 60 * 60 * 1000                      // 3 hour buckets
})

// Build time-series data points aggregated by time buckets (average per bucket)
const chartPoints = computed(() => {
  const bucket = bucketMs.value
  const tempBuckets = new Map()
  const umidBuckets = new Map()

  for (const l of leituras.value) {
    const t = new Date(l.registrado_em).getTime()
    const key = Math.floor(t / bucket) * bucket

    if (l.temperatura !== null && l.temperatura !== undefined) {
      if (!tempBuckets.has(key)) tempBuckets.set(key, { sum: 0, count: 0 })
      const b = tempBuckets.get(key)
      b.sum += Number(l.temperatura)
      b.count++
    }
    if (l.umidade !== null && l.umidade !== undefined) {
      if (!umidBuckets.has(key)) umidBuckets.set(key, { sum: 0, count: 0 })
      const b = umidBuckets.get(key)
      b.sum += Number(l.umidade)
      b.count++
    }
  }

  const temps = []
  for (const [key, b] of tempBuckets) {
    temps.push({ x: new Date(key + bucket / 2), y: Math.round((b.sum / b.count) * 10) / 10 })
  }
  temps.sort((a, b) => a.x - b.x)

  const umids = []
  for (const [key, b] of umidBuckets) {
    umids.push({ x: new Date(key + bucket / 2), y: Math.round(b.sum / b.count) })
  }
  umids.sort((a, b) => a.x - b.x)

  return { temps, umids }
})

// X-axis min/max to show full day (or full range)
const xBounds = computed(() => {
  if (!dateRange.value || !dateRange.value[0] || !dateRange.value[1]) return {}
  const [rangeStart, rangeEnd] = dateRange.value
  const min = new Date(rangeStart)
  min.setHours(0, 0, 0, 0)
  const end = new Date(rangeEnd)
  end.setHours(23, 59, 59, 999)
  return { min, max: end }
})

// Determine time unit based on range span
const timeUnit = computed(() => {
  if (!xBounds.value.min || !xBounds.value.max) return 'hour'
  const diffMs = xBounds.value.max.getTime() - xBounds.value.min.getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)
  if (diffDays <= 1) return 'hour'
  if (diffDays <= 7) return 'day'
  return 'day'
})

const manyPoints = computed(() => chartPoints.value.temps.length > 100)

const chartDataTemp = computed(() => ({
  datasets: [{
    label: 'Temperatura (°C)',
    data: chartPoints.value.temps,
    borderColor: '#EF4444',
    borderWidth: 2,
    fill: true,
    tension: 0.4,
    cubicInterpolationMode: 'monotone',
    pointRadius: manyPoints.value ? 0 : 2,
    pointHoverRadius: 5,
    pointBackgroundColor: '#EF4444',
    pointHoverBackgroundColor: '#EF4444',
    pointBorderColor: '#fff',
    pointBorderWidth: 1,
    spanGaps: false,
  }]
}))

const chartDataUmid = computed(() => ({
  datasets: [{
    label: 'Umidade (%)',
    data: chartPoints.value.umids,
    borderColor: '#3B82F6',
    borderWidth: 2,
    fill: true,
    tension: 0.4,
    cubicInterpolationMode: 'monotone',
    pointRadius: manyPoints.value ? 0 : 2,
    pointHoverRadius: 5,
    pointBackgroundColor: '#3B82F6',
    pointHoverBackgroundColor: '#3B82F6',
    pointBorderColor: '#fff',
    pointBorderWidth: 1,
    spanGaps: false,
  }]
}))

function makeChartOptions(unit, color, valueSuffix) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: isDark.value ? '#1f2937' : '#ffffff',
        titleColor: isDark.value ? '#e5e7eb' : '#111827',
        bodyColor: isDark.value ? '#d1d5db' : '#4b5563',
        borderColor: isDark.value ? '#374151' : '#e5e7eb',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
        boxPadding: 4,
        usePointStyle: true,
        callbacks: {
          title(items) {
            if (!items.length) return ''
            const d = new Date(items[0].parsed.x)
            if (isMultiDay.value) {
              return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
            }
            return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
          },
          label(ctx) {
            const val = ctx.parsed.y
            return ` ${val?.toFixed(valueSuffix === '°' ? 1 : 0)}${valueSuffix}`
          }
        }
      },
    },
    scales: {
      x: {
        type: 'time',
        min: xBounds.value.min,
        max: xBounds.value.max,
        time: {
          unit: timeUnit.value,
          displayFormats: {
            hour: 'HH:mm',
            day: 'dd/MM',
          },
          tooltipFormat: isMultiDay.value ? 'dd/MM HH:mm' : 'HH:mm',
        },
        adapters: { date: { locale: ptBR } },
        grid: { display: false },
        ticks: {
          color: isDark.value ? '#9ca3af' : '#6b7280',
          font: { size: 10 },
          maxTicksLimit: 8,
          source: 'auto',
        },
      },
      y: {
        position: 'left',
        beginAtZero: false,
        grid: {
          color: isDark.value ? '#374151' : '#f3f4f6',
        },
        ticks: {
          color,
          font: { size: 10 },
          callback: (v) => (valueSuffix === '°' ? Number(v).toFixed(1) : Math.round(v)) + valueSuffix,
        },
      },
    },
  }
}

const chartOptionsTemp = computed(() => makeChartOptions(timeUnit.value, '#EF4444', '°'))
const chartOptionsUmid = computed(() => makeChartOptions(timeUnit.value, '#3B82F6', '%'))

// Helpers
function tempColor(val) {
  if (val === null) return 'text-gray-400'
  const v = Number(val)
  if (v < 15) return 'text-sky-600 dark:text-sky-400'
  if (v < 28) return 'text-emerald-600 dark:text-emerald-400'
  if (v < 32) return 'text-orange-600 dark:text-orange-400'
  return 'text-red-600 dark:text-red-400'
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit'
  })
}

// Data fetching
async function fetchDispositivos() {
  if (!currentCompany.value?.id) return
  const { data } = await supabase
    .from('dispositivos_iot')
    .select('*')
    .eq('empresa_id', currentCompany.value.id)
    .eq('fazenda_id', props.fazenda.id)
    .eq('ativo', true)
    .order('nome')
  dispositivos.value = data || []
}

async function fetchAllDevices() {
  if (!currentCompany.value?.id) return
  const { data } = await supabase
    .from('dispositivos_iot')
    .select('id, nome, nome_personalizado, modelo, fazenda_id, ativo, tem_temperatura, tem_umidade')
    .eq('empresa_id', currentCompany.value.id)
    .order('nome')
  allDevices.value = data || []
}

async function fetchLeituras() {
  if (!currentCompany.value?.id) return
  if (!dateRange.value || !dateRange.value[0]) return
  loadingLeituras.value = true
  try {
    const [start, end] = dateRange.value
    const result = await $fetch('/api/ewelink/leituras', {
      method: 'POST',
      body: {
        empresa_id: currentCompany.value.id,
        fazenda_id: props.fazenda.id,
        data_inicio: start.toISOString(),
        data_fim: end ? end.toISOString() : new Date().toISOString(),
      }
    })
    if (result.success) {
      leituras.value = result.leituras || []
    }
  } catch (e) {
    console.error('Erro ao buscar leituras:', e)
  } finally {
    loadingLeituras.value = false
  }
}

// Actions
async function handleAddDevice() {
  if (!deviceToAdd.value) return
  const { error } = await supabase
    .from('dispositivos_iot')
    .update({ fazenda_id: props.fazenda.id })
    .eq('id', deviceToAdd.value)

  if (error) {
    showError('Erro ao vincular dispositivo')
  } else {
    success('Dispositivo vinculado')
    deviceToAdd.value = ''
    showAddDevice.value = false
    await fetchDispositivos()
    await fetchAllDevices()
    fetchLeituras()
    emit('updated')
  }
}

async function handleRemoveDevice(d) {
  if (!confirm(`Desvincular "${d.nome_personalizado || d.nome}" desta fazenda?`)) return
  const { error } = await supabase
    .from('dispositivos_iot')
    .update({ fazenda_id: null })
    .eq('id', d.id)

  if (error) {
    showError('Erro ao desvincular dispositivo')
  } else {
    success('Dispositivo desvinculado')
    await fetchDispositivos()
    await fetchAllDevices()
    fetchLeituras()
    emit('updated')
  }
}

// Watchers
watch(dateRange, () => fetchLeituras(), { deep: true })

// Initial load
async function loadAll() {
  dateRange.value = todayRange()
  await Promise.all([fetchDispositivos(), fetchAllDevices()])
  fetchLeituras()
}

watch(() => props.show, (val) => {
  if (val) loadAll()
})
</script>

<style>
.monit-date-range-wrapper {
  min-width: 180px;
  max-width: 220px;
}

.monit-date-range-wrapper .dp__input_wrap .dp__input {
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.3rem 0.5rem 0.3rem 2rem;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  background: #fff;
  color: #333;
  height: 30px;
  transition: all 0.15s ease;
}

.monit-date-range-wrapper .dp__input_wrap .dp__input:hover {
  border-color: #549E54;
}

.monit-date-range-wrapper .dp__input_wrap .dp__input:focus,
.monit-date-range-wrapper .dp__input_wrap .dp__input.dp__input_focus {
  border-color: #549E54;
  box-shadow: 0 0 0 2px rgba(84, 158, 84, 0.15);
}

.dark .monit-date-range-wrapper .dp__input_wrap .dp__input {
  background: #2a2a2a;
  border-color: #404040;
  color: #e0e0e0;
}

.dark .monit-date-range-wrapper .dp__input_wrap .dp__input:hover {
  border-color: #549E54;
}

.dark .monit-date-range-wrapper .dp__input_wrap .dp__input:focus,
.dark .monit-date-range-wrapper .dp__input_wrap .dp__input.dp__input_focus {
  border-color: #549E54;
  box-shadow: 0 0 0 2px rgba(84, 158, 84, 0.2);
}

.monit-date-range-wrapper .dp__input_icon {
  color: #549E54;
}

.dark .monit-date-range-wrapper .dp__input_icon {
  color: #86efac;
}
</style>
