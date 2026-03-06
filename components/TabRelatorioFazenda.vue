<template>
  <div>
    <!-- Toolbar: Filtro de Datas -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-4 mb-4">
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
        <!-- Date Range -->
        <div class="flex items-center gap-2">
          <span class="text-xs text-subtext-light dark:text-subtext-dark hidden sm:inline">De</span>
          <input
            type="date"
            v-model="dataInicio"
            class="input text-xs sm:text-sm w-full sm:w-auto"
          />
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs text-subtext-light dark:text-subtext-dark hidden sm:inline">Até</span>
          <input
            type="date"
            v-model="dataFim"
            class="input text-xs sm:text-sm w-full sm:w-auto"
          />
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-16">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>

    <template v-else>
      <!-- Summary Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <!-- Total Bandejas Plantadas -->
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-border-light dark:border-border-dark p-4">
          <p class="text-[11px] text-subtext-light dark:text-subtext-dark uppercase tracking-wide mb-1">
            Total Bandejas Plantadas
          </p>
          <p class="text-2xl font-semibold text-primary">
            {{ totalPlantadas }}
          </p>
        </div>

        <!-- Total Bandejas Perdidas -->
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-border-light dark:border-border-dark p-4">
          <p class="text-[11px] text-subtext-light dark:text-subtext-dark uppercase tracking-wide mb-1">
            Total Bandejas Perdidas
          </p>
          <div class="flex items-baseline gap-2">
            <span class="text-2xl font-semibold" :class="totalPerdidas > 0 ? 'text-red-600' : 'text-text-light dark:text-text-dark'">
              {{ totalPerdidas }}
            </span>
            <span v-if="totalPlantadas > 0" class="text-sm" :class="totalPerdidas > 0 ? 'text-red-500' : 'text-subtext-light dark:text-subtext-dark'">
              {{ percentPerdidas }}%
            </span>
          </div>
        </div>
      </div>

      <!-- Bar Chart -->
      <div v-if="speciesData.length > 0" class="card p-4 sm:p-6 mb-4">
        <h3 class="text-sm font-semibold text-text-light dark:text-text-dark mb-4">
          Colhidas vs Perdidas por Espécie
        </h3>
        <div class="relative h-[300px] sm:h-[350px]">
          <Bar :data="chartData" :options="chartOptions" />
        </div>
      </div>

      <!-- Empty state for chart -->
      <div v-else class="card p-8 mb-4 text-center">
        <span class="material-icons text-4xl text-gray-300 dark:text-gray-600 mb-2">bar_chart</span>
        <p class="text-sm text-subtext-light dark:text-subtext-dark">
          Nenhum dado para o período selecionado
        </p>
      </div>

      <!-- Data Table -->
      <div class="card">
        <!-- Desktop Table -->
        <div class="hidden md:block overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-gray-100 dark:bg-gray-700/50 border-b border-border-light dark:border-border-dark">
                <th class="table-header">Espécie</th>
                <th class="table-header text-right">Plantadas</th>
                <th class="table-header text-right">Perdidas</th>
                <th class="table-header text-right">% da Fazenda</th>
                <th class="table-header text-right">Densidade</th>
                <th class="table-header text-right">Semente Usada</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border-light dark:divide-border-dark">
              <tr
                v-for="row in speciesData"
                :key="row.especieId"
                class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <td class="table-cell font-medium">{{ row.nome }}</td>
                <td class="table-cell text-right">{{ row.plantadas }}</td>
                <td class="table-cell text-right">
                  <span :class="row.perdidas > 0 ? 'text-red-600' : ''">
                    {{ row.perdidas }}
                  </span>
                  <span v-if="row.plantadas > 0" class="text-xs ml-1" :class="row.perdidas > 0 ? 'text-red-400' : 'text-subtext-light dark:text-subtext-dark'">
                    ({{ row.percentPerdidas }}%)
                  </span>
                </td>
                <td class="table-cell text-right">{{ row.percentFazenda }}%</td>
                <td class="table-cell text-right">
                  {{ row.densidade ? `${row.densidade} g/bandeja` : '-' }}
                </td>
                <td class="table-cell text-right">
                  <template v-if="row.densidade">
                    {{ formatSementeUsada(row.sementeUsada) }}
                  </template>
                  <template v-else>-</template>
                </td>
              </tr>
              <!-- Empty -->
              <tr v-if="speciesData.length === 0">
                <td colspan="6" class="table-cell text-center py-8 text-subtext-light dark:text-subtext-dark">
                  Nenhum registro encontrado no período
                </td>
              </tr>
            </tbody>
            <!-- Totals row -->
            <tfoot v-if="speciesData.length > 0">
              <tr class="bg-gray-50 dark:bg-gray-700/30 border-t-2 border-border-light dark:border-border-dark font-semibold">
                <td class="table-cell">Total</td>
                <td class="table-cell text-right">{{ totalPlantadas }}</td>
                <td class="table-cell text-right">
                  <span :class="totalPerdidas > 0 ? 'text-red-600' : ''">{{ totalPerdidas }}</span>
                  <span v-if="totalPlantadas > 0" class="text-xs ml-1" :class="totalPerdidas > 0 ? 'text-red-400' : ''">
                    ({{ percentPerdidas }}%)
                  </span>
                </td>
                <td class="table-cell text-right">100%</td>
                <td class="table-cell text-right">-</td>
                <td class="table-cell text-right">{{ formatSementeUsada(totalSementeUsada) }}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- Mobile Cards -->
        <div class="md:hidden divide-y divide-border-light dark:divide-border-dark">
          <div
            v-for="row in speciesData"
            :key="row.especieId"
            class="p-4"
          >
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-semibold text-text-light dark:text-text-dark">{{ row.nome }}</span>
              <span class="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{{ row.percentFazenda }}%</span>
            </div>
            <div class="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span class="text-subtext-light dark:text-subtext-dark">Plantadas</span>
                <p class="font-medium text-text-light dark:text-text-dark">{{ row.plantadas }}</p>
              </div>
              <div>
                <span class="text-subtext-light dark:text-subtext-dark">Perdidas</span>
                <p class="font-medium" :class="row.perdidas > 0 ? 'text-red-600' : 'text-text-light dark:text-text-dark'">
                  {{ row.perdidas }} <span v-if="row.plantadas > 0">({{ row.percentPerdidas }}%)</span>
                </p>
              </div>
              <div>
                <span class="text-subtext-light dark:text-subtext-dark">Densidade</span>
                <p class="font-medium text-text-light dark:text-text-dark">
                  {{ row.densidade ? `${row.densidade} g/bd` : '-' }}
                </p>
              </div>
              <div>
                <span class="text-subtext-light dark:text-subtext-dark">Semente Usada</span>
                <p class="font-medium text-text-light dark:text-text-dark">
                  {{ row.densidade ? formatSementeUsada(row.sementeUsada) : '-' }}
                </p>
              </div>
            </div>
          </div>

          <!-- Mobile empty state -->
          <div v-if="speciesData.length === 0" class="p-8 text-center">
            <p class="text-sm text-subtext-light dark:text-subtext-dark">
              Nenhum registro encontrado no período
            </p>
          </div>

          <!-- Mobile totals -->
          <div v-if="speciesData.length > 0" class="p-4 bg-gray-50 dark:bg-gray-700/30">
            <p class="text-xs font-semibold text-subtext-light dark:text-subtext-dark uppercase tracking-wide mb-2">Totais</p>
            <div class="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span class="text-subtext-light dark:text-subtext-dark">Plantadas</span>
                <p class="font-semibold text-text-light dark:text-text-dark">{{ totalPlantadas }}</p>
              </div>
              <div>
                <span class="text-subtext-light dark:text-subtext-dark">Perdidas</span>
                <p class="font-semibold" :class="totalPerdidas > 0 ? 'text-red-600' : 'text-text-light dark:text-text-dark'">
                  {{ totalPerdidas }} ({{ percentPerdidas }}%)
                </p>
              </div>
              <div class="col-span-2">
                <span class="text-subtext-light dark:text-subtext-dark">Total Semente Usada</span>
                <p class="font-semibold text-text-light dark:text-text-dark">{{ formatSementeUsada(totalSementeUsada) }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const supabase = useSupabaseClient()
const { currentCompany } = useCurrentCompany()

// ── Date range (default: last 30 days) ──────────────────────────────
const today = new Date()
const thirtyDaysAgo = new Date(today)
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

const dataInicio = ref(formatDateISO(thirtyDaysAgo))
const dataFim = ref(formatDateISO(today))

function formatDateISO(d: Date): string {
  return d.toISOString().split('T')[0]
}

// ── State ────────────────────────────────────────────────────────────
const loading = ref(false)

interface PlantioRow {
  especie_id: string
  bandejas: number
  especies: { nome: string } | null
  lotes_sementes: { densidade_semeadura: number } | null
}

interface PerdidaRow {
  especie_id: string
  bandejas: number
  especies: { nome: string } | null
}

const plantiosRaw = ref<PlantioRow[]>([])
const perdidasRaw = ref<PerdidaRow[]>([])

// ── Fetch data ───────────────────────────────────────────────────────
async function fetchData() {
  if (!currentCompany.value?.id) return

  loading.value = true
  try {
    const empresaId = currentCompany.value.id
    const inicio = dataInicio.value
    const fim = dataFim.value

    const [plantiosRes, perdidasRes] = await Promise.all([
      supabase
        .from('plantios')
        .select('especie_id, bandejas, especies(nome), lotes_sementes(densidade_semeadura)')
        .eq('empresa_id', empresaId)
        .gte('data_colheita', inicio)
        .lte('data_colheita', fim),
      supabase
        .from('bandejas_perdidas')
        .select('especie_id, bandejas, especies(nome)')
        .eq('empresa_id', empresaId)
        .gte('data_registro', inicio)
        .lte('data_registro', fim)
    ])

    plantiosRaw.value = (plantiosRes.data as PlantioRow[]) || []
    perdidasRaw.value = (perdidasRes.data as PerdidaRow[]) || []
  } catch (e) {
    console.error('Erro ao carregar relatório da fazenda:', e)
  } finally {
    loading.value = false
  }
}

// ── Computed: aggregated species data ────────────────────────────────
interface SpeciesRow {
  especieId: string
  nome: string
  plantadas: number
  perdidas: number
  percentPerdidas: string
  percentFazenda: string
  densidade: number | null
  sementeUsada: number
}

const speciesData = computed<SpeciesRow[]>(() => {
  const map = new Map<string, {
    nome: string
    plantadas: number
    perdidas: number
    densidade: number | null
  }>()

  // Aggregate plantios
  for (const p of plantiosRaw.value) {
    if (!p.especie_id) continue
    const existing = map.get(p.especie_id)
    const densidade = p.lotes_sementes?.densidade_semeadura ?? null
    if (existing) {
      existing.plantadas += (p.bandejas || 0)
      if (densidade !== null && existing.densidade === null) {
        existing.densidade = densidade
      }
    } else {
      map.set(p.especie_id, {
        nome: p.especies?.nome || 'Desconhecida',
        plantadas: p.bandejas || 0,
        perdidas: 0,
        densidade
      })
    }
  }

  // Aggregate perdidas
  for (const pd of perdidasRaw.value) {
    if (!pd.especie_id) continue
    const existing = map.get(pd.especie_id)
    if (existing) {
      existing.perdidas += (pd.bandejas || 0)
    } else {
      map.set(pd.especie_id, {
        nome: pd.especies?.nome || 'Desconhecida',
        plantadas: 0,
        perdidas: pd.bandejas || 0,
        densidade: null
      })
    }
  }

  const total = totalPlantadasRaw.value

  const rows: SpeciesRow[] = []
  for (const [id, data] of map) {
    const sementeUsada = data.densidade !== null ? data.plantadas * data.densidade : 0
    rows.push({
      especieId: id,
      nome: data.nome,
      plantadas: data.plantadas,
      perdidas: data.perdidas,
      percentPerdidas: data.plantadas > 0 ? ((data.perdidas / data.plantadas) * 100).toFixed(1) : '0.0',
      percentFazenda: total > 0 ? ((data.plantadas / total) * 100).toFixed(1) : '0.0',
      densidade: data.densidade,
      sementeUsada
    })
  }

  // Sort by plantadas descending
  rows.sort((a, b) => b.plantadas - a.plantadas)
  return rows
})

// ── Computed: totals ─────────────────────────────────────────────────
const totalPlantadasRaw = computed(() => {
  return plantiosRaw.value.reduce((sum, p) => sum + (p.bandejas || 0), 0)
})

const totalPlantadas = computed(() => totalPlantadasRaw.value)

const totalPerdidas = computed(() => {
  return perdidasRaw.value.reduce((sum, p) => sum + (p.bandejas || 0), 0)
})

const percentPerdidas = computed(() => {
  if (totalPlantadas.value === 0) return '0.0'
  return ((totalPerdidas.value / totalPlantadas.value) * 100).toFixed(1)
})

const totalSementeUsada = computed(() => {
  return speciesData.value.reduce((sum, row) => sum + row.sementeUsada, 0)
})

// ── Format: seed usage ───────────────────────────────────────────────
function formatSementeUsada(gramas: number): string {
  if (gramas === 0) return '-'
  if (gramas >= 1000) {
    return `${(gramas / 1000).toFixed(2)} kg`
  }
  return `${gramas.toFixed(1)} g`
}

// ── Chart data ───────────────────────────────────────────────────────
const chartData = computed(() => {
  const labels = speciesData.value.map(r => r.nome)
  return {
    labels,
    datasets: [
      {
        label: 'Colhidas',
        backgroundColor: '#22c55e',
        borderRadius: 4,
        data: speciesData.value.map(r => r.plantadas - r.perdidas)
      },
      {
        label: 'Perdidas',
        backgroundColor: '#ef4444',
        borderRadius: 4,
        data: speciesData.value.map(r => r.perdidas)
      }
    ]
  }
})

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
      labels: {
        usePointStyle: true,
        pointStyle: 'circle',
        padding: 16,
        font: { size: 12 },
        color: isDark() ? '#d1d5db' : '#374151'
      }
    },
    tooltip: {
      backgroundColor: isDark() ? '#1f2937' : '#ffffff',
      titleColor: isDark() ? '#f9fafb' : '#111827',
      bodyColor: isDark() ? '#d1d5db' : '#4b5563',
      borderColor: isDark() ? '#374151' : '#e5e7eb',
      borderWidth: 1,
      padding: 12,
      cornerRadius: 8
    }
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: {
        color: isDark() ? '#9ca3af' : '#6b7280',
        font: { size: 11 }
      }
    },
    y: {
      beginAtZero: true,
      grid: {
        color: isDark() ? '#374151' : '#f3f4f6'
      },
      ticks: {
        color: isDark() ? '#9ca3af' : '#6b7280',
        font: { size: 11 },
        stepSize: 1
      }
    }
  }
}))

function isDark(): boolean {
  if (import.meta.client) {
    return document.documentElement.classList.contains('dark')
  }
  return false
}

// ── Watchers & lifecycle ─────────────────────────────────────────────
watch([dataInicio, dataFim, () => currentCompany.value?.id], () => {
  fetchData()
})

onMounted(() => {
  fetchData()
})
</script>
