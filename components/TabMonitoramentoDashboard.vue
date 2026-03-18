<template>
  <div class="space-y-6">
    <!-- Toolbar: Seletor de dispositivo/fazenda + Período -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <select v-model="selectedDeviceId" class="input w-auto">
          <option value="">Todos os dispositivos</option>
          <option v-for="d in dispositivos" :key="d.id" :value="d.id">
            {{ d.nome_personalizado || d.nome }}
          </option>
        </select>
      </div>

      <div class="flex items-center gap-1 bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded-lg p-0.5">
        <button
          v-for="p in periodos"
          :key="p.value"
          @click="periodo = p.value"
          class="px-3 py-1.5 text-xs font-medium rounded-md transition-colors"
          :class="periodo === p.value
            ? 'bg-primary text-white'
            : 'text-subtext-light dark:text-subtext-dark hover:text-text-light dark:hover:text-text-dark'"
        >
          {{ p.label }}
        </button>
      </div>
    </div>

    <!-- KPI Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <!-- Temperatura Média -->
      <div class="card p-4">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
            <span class="material-icons-outlined text-red-600 dark:text-red-400">thermostat</span>
          </div>
          <span class="text-sm text-subtext-light dark:text-subtext-dark">Temperatura Média</span>
        </div>
        <p class="text-3xl font-semibold text-text-light dark:text-text-dark">
          {{ tempMedia !== null ? `${tempMedia.toFixed(1)}°C` : '-' }}
        </p>
      </div>

      <!-- Umidade Média -->
      <div class="card p-4">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
            <span class="material-icons-outlined text-blue-600 dark:text-blue-400">water_drop</span>
          </div>
          <span class="text-sm text-subtext-light dark:text-subtext-dark">Umidade Média</span>
        </div>
        <p class="text-3xl font-semibold text-text-light dark:text-text-dark">
          {{ umidMedia !== null ? `${umidMedia.toFixed(0)}%` : '-' }}
        </p>
      </div>

      <!-- Dispositivos Online -->
      <div class="card p-4">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
            <span class="material-icons-outlined text-green-600 dark:text-green-400">sensors</span>
          </div>
          <span class="text-sm text-subtext-light dark:text-subtext-dark">Dispositivos Online</span>
        </div>
        <p class="text-3xl font-semibold text-text-light dark:text-text-dark">
          {{ dispositivosOnline }} <span class="text-base font-normal text-subtext-light dark:text-subtext-dark">/ {{ dispositivos.length }}</span>
        </p>
      </div>

      <!-- Alertas Não Lidos -->
      <div class="card p-4">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            :class="alertasNaoLidos > 0 ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-gray-100 dark:bg-gray-700'"
          >
            <span class="material-icons-outlined"
              :class="alertasNaoLidos > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400 dark:text-gray-500'"
            >warning</span>
          </div>
          <span class="text-sm text-subtext-light dark:text-subtext-dark">Alertas Não Lidos</span>
        </div>
        <p class="text-3xl font-semibold text-text-light dark:text-text-dark">{{ alertasNaoLidos }}</p>
      </div>
    </div>

    <!-- Gráficos -->
    <div v-if="leituras.length > 0" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Gráfico Temperatura -->
      <div class="card p-5">
        <h3 class="text-sm font-medium text-text-light dark:text-text-dark mb-4">
          Temperatura (°C)
          <span class="text-xs text-subtext-light dark:text-subtext-dark ml-2">{{ periodoLabel }}</span>
        </h3>
        <div class="relative h-[300px]">
          <Line :data="chartTempData" :options="chartOptions" />
        </div>
      </div>

      <!-- Gráfico Umidade -->
      <div class="card p-5">
        <h3 class="text-sm font-medium text-text-light dark:text-text-dark mb-4">
          Umidade (%)
          <span class="text-xs text-subtext-light dark:text-subtext-dark ml-2">{{ periodoLabel }}</span>
        </h3>
        <div class="relative h-[300px]">
          <Line :data="chartUmidData" :options="chartOptions" />
        </div>
      </div>
    </div>

    <!-- Empty state para gráficos -->
    <div v-else-if="!loadingLeituras && dispositivos.length > 0" class="card p-8 text-center">
      <span class="material-icons-outlined text-4xl text-gray-300 dark:text-gray-600 mb-2">show_chart</span>
      <p class="text-sm text-subtext-light dark:text-subtext-dark">Nenhuma leitura para o período selecionado</p>
    </div>

    <!-- Loading -->
    <div v-if="loadingLeituras" class="card p-8 text-center">
      <span class="material-icons-outlined animate-spin text-2xl text-subtext-light dark:text-subtext-dark">refresh</span>
      <p class="text-sm text-subtext-light dark:text-subtext-dark mt-2">Carregando dados...</p>
    </div>

    <!-- Sem dispositivos -->
    <div v-if="!loadingLeituras && dispositivos.length === 0" class="card p-8 text-center">
      <span class="material-icons-outlined text-4xl text-gray-300 dark:text-gray-600 mb-2">sensors_off</span>
      <p class="text-sm text-subtext-light dark:text-subtext-dark">Nenhum dispositivo sensor configurado</p>
      <p class="text-xs text-subtext-light/70 dark:text-subtext-dark/70 mt-1">Configure dispositivos na aba Configuração</p>
    </div>
  </div>
</template>

<script setup>
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler)

const supabase = useSupabaseClient()
const { currentCompany } = useCurrentCompany()

const selectedDeviceId = ref('')
const periodo = ref('24h')
const dispositivos = ref([])
const leituras = ref([])
const alertasNaoLidos = ref(0)
const loadingLeituras = ref(false)

const periodos = [
  { value: '24h', label: '24h' },
  { value: '7d', label: '7 dias' },
  { value: '30d', label: '30 dias' },
]

const periodoLabel = computed(() =>
  periodos.find(p => p.value === periodo.value)?.label || ''
)

const dispositivosOnline = computed(() =>
  dispositivos.value.filter(d => d.online).length
)

const tempMedia = computed(() => {
  const relevantes = selectedDeviceId.value
    ? dispositivos.value.filter(d => d.id === selectedDeviceId.value)
    : dispositivos.value
  const temps = relevantes.filter(d => d.temperatura_atual !== null).map(d => Number(d.temperatura_atual))
  if (temps.length === 0) return null
  return temps.reduce((a, b) => a + b, 0) / temps.length
})

const umidMedia = computed(() => {
  const relevantes = selectedDeviceId.value
    ? dispositivos.value.filter(d => d.id === selectedDeviceId.value)
    : dispositivos.value
  const umids = relevantes.filter(d => d.umidade_atual !== null).map(d => Number(d.umidade_atual))
  if (umids.length === 0) return null
  return umids.reduce((a, b) => a + b, 0) / umids.length
})

function formatTimeLabel(dateStr) {
  const d = new Date(dateStr)
  if (periodo.value === '24h') {
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

const chartTempData = computed(() => {
  const labels = leituras.value.map(l => formatTimeLabel(l.registrado_em))
  return {
    labels,
    datasets: [{
      label: 'Temperatura',
      data: leituras.value.map(l => l.temperatura),
      borderColor: '#EF4444',
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      borderWidth: 2,
      fill: true,
      tension: 0.3,
      pointRadius: periodo.value === '24h' ? 2 : 0,
      pointHoverRadius: 4,
    }]
  }
})

const chartUmidData = computed(() => {
  const labels = leituras.value.map(l => formatTimeLabel(l.registrado_em))
  return {
    labels,
    datasets: [{
      label: 'Umidade',
      data: leituras.value.map(l => l.umidade),
      borderColor: '#3B82F6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      borderWidth: 2,
      fill: true,
      tension: 0.3,
      pointRadius: periodo.value === '24h' ? 2 : 0,
      pointHoverRadius: 4,
    }]
  }
})

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#ffffff',
      titleColor: '#111827',
      bodyColor: '#4b5563',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      padding: 12,
      cornerRadius: 8,
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: {
        color: '#6b7280',
        font: { size: 10 },
        maxTicksLimit: 12,
      },
    },
    y: {
      beginAtZero: false,
      grid: {
        color: '#f3f4f6',
      },
      ticks: {
        color: '#6b7280',
        font: { size: 11 },
      },
    },
  },
}))

async function fetchDispositivos() {
  if (!currentCompany.value?.id) return
  const { data } = await supabase
    .from('dispositivos_iot')
    .select('*')
    .eq('empresa_id', currentCompany.value.id)
    .eq('ativo', true)
    .or('tem_temperatura.eq.true,tem_umidade.eq.true')
    .order('nome')
  dispositivos.value = data || []
}

async function fetchLeituras() {
  if (!currentCompany.value?.id) return
  loadingLeituras.value = true
  try {
    const result = await $fetch('/api/ewelink/leituras', {
      method: 'POST',
      body: {
        empresa_id: currentCompany.value.id,
        dispositivo_id: selectedDeviceId.value || undefined,
        periodo: periodo.value,
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

async function fetchAlertasNaoLidos() {
  if (!currentCompany.value?.id) return
  const { count } = await supabase
    .from('alertas_historico_iot')
    .select('id', { count: 'exact', head: true })
    .eq('empresa_id', currentCompany.value.id)
    .eq('lido', false)
  alertasNaoLidos.value = count || 0
}

watch([selectedDeviceId, periodo], () => {
  fetchLeituras()
})

watch(() => currentCompany.value?.id, () => {
  fetchDispositivos()
  fetchLeituras()
  fetchAlertasNaoLidos()
}, { immediate: true })
</script>
