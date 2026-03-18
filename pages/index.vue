<template>
  <div class="min-h-screen">
    <!-- Header -->
    <div class="flex flex-col gap-4 mb-8">
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Visão geral da operação</p>
        </div>

        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <!-- Dropdown Multi-Select de Empresas -->
          <div class="relative" ref="dropdownRef">
            <button
              @click="showDropdown = !showDropdown"
              class="flex items-center justify-between gap-2 bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 w-full sm:w-64 text-left hover:border-primary transition-colors shadow-sm"
            >
              <div class="flex items-center gap-2 truncate">
                <span class="material-icons-outlined text-primary text-lg">business</span>
                <span class="text-sm text-gray-700 dark:text-gray-200 truncate">Todas as Empresas</span>
              </div>
              <span class="material-icons-outlined text-gray-400 text-lg transition-transform" :class="{ 'rotate-180': showDropdown }">expand_more</span>
            </button>
          </div>

          <!-- Seletor de Período -->
          <div class="flex items-center gap-2 bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 shadow-sm">
            <button class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-0.5">
              <span class="material-icons-outlined text-lg">chevron_left</span>
            </button>
            <span class="text-sm font-medium text-gray-700 dark:text-gray-200 min-w-[160px] text-center whitespace-nowrap">
              10/03/2026 até 16/03/2026
            </span>
            <button class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-0.5">
              <span class="material-icons-outlined text-lg">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Hero KPIs -->
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-6">
      <div
        v-for="(kpi, index) in heroKpis"
        :key="kpi.label"
        class="kpi-card bg-white dark:bg-[#1e1e1e] border border-gray-100 dark:border-gray-800 rounded-xl shadow-sm p-5 relative overflow-hidden"
        :style="{ animationDelay: `${index * 100}ms` }"
      >
        <div class="flex items-start justify-between mb-3">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center" :class="kpi.iconBg">
              <span class="material-icons-outlined text-base" :class="kpi.iconColor">{{ kpi.icon }}</span>
            </div>
            <span class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">{{ kpi.label }}</span>
          </div>
        </div>

        <div class="flex items-end justify-between">
          <div>
            <div class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tabular-nums">
              {{ formatKpiValue(kpi, animatedValues[index]) }}
            </div>
            <div class="flex items-center gap-1 mt-1.5">
              <span
                class="inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-full"
                :class="kpi.change >= 0 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'"
              >
                <span class="material-icons-outlined text-xs">{{ kpi.change >= 0 ? 'trending_up' : 'trending_down' }}</span>
                {{ kpi.change >= 0 ? '+' : '' }}{{ kpi.change }}{{ kpi.format === 'percent' ? 'pp' : '%' }}
              </span>
              <span class="text-[10px] text-gray-400 dark:text-gray-500">vs sem. anterior</span>
            </div>
          </div>

          <!-- Sparkline -->
          <svg class="w-16 h-8 flex-shrink-0" viewBox="0 0 64 28">
            <defs>
              <linearGradient :id="'sparkGrad' + index" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" :stop-color="kpi.change >= 0 ? '#22C55E' : '#EF4444'" stop-opacity="0.15" />
                <stop offset="100%" :stop-color="kpi.change >= 0 ? '#22C55E' : '#EF4444'" stop-opacity="0" />
              </linearGradient>
            </defs>
            <polygon
              :points="sparklineArea(kpi.sparkline)"
              :fill="'url(#sparkGrad' + index + ')'"
            />
            <polyline
              :points="sparklinePoints(kpi.sparkline)"
              fill="none"
              :stroke="kpi.change >= 0 ? '#22C55E' : '#EF4444'"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>
      </div>
    </div>

    <!-- Middle Section: Rankings + Produção -->
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
      <!-- Rankings por Produto -->
      <div class="bg-white dark:bg-[#1e1e1e] border border-gray-100 dark:border-gray-800 rounded-xl shadow-sm p-5">
        <div class="flex items-center justify-between mb-5">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Rankings por Produto</h2>
          <div class="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
            <button
              v-for="tab in rankingTabs"
              :key="tab.key"
              @click="activeRankingTab = tab.key"
              class="px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200"
              :class="activeRankingTab === tab.key
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'"
            >
              {{ tab.label }}
            </button>
          </div>
        </div>

        <!-- Ranking Bars -->
        <div class="space-y-2.5">
          <TransitionGroup name="ranking-list">
            <div
              v-for="(item, idx) in currentRanking"
              :key="item.nome + activeRankingTab"
              class="flex items-center gap-3 group"
            >
              <span class="text-xs font-bold w-5 text-right tabular-nums" :style="{ color: getRankColor(idx) }">
                {{ idx + 1 }}
              </span>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between mb-0.5">
                  <span class="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{{ item.nome }}</span>
                  <span class="text-sm font-bold tabular-nums text-gray-900 dark:text-white ml-2">
                    {{ formatRankingValue(item.valor) }}
                  </span>
                </div>
                <div class="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    class="h-full rounded-full transition-all duration-500 ease-out ranking-bar"
                    :style="{
                      width: rankingBarAnimated ? `${(item.valor / currentRanking[0].valor) * 100}%` : '0%',
                      backgroundColor: getRankColor(idx),
                      transitionDelay: `${idx * 50}ms`
                    }"
                  />
                </div>
              </div>
            </div>
          </TransitionGroup>
        </div>
      </div>

      <!-- Produção -->
      <div class="bg-white dark:bg-[#1e1e1e] border border-gray-100 dark:border-gray-800 rounded-xl shadow-sm p-5">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-5">Produção</h2>

        <div class="flex flex-col items-center">
          <!-- Donut Chart -->
          <div class="relative w-56 h-56 mb-6">
            <Doughnut :data="chartProducaoData" :options="doughnutOptions" />
            <div class="absolute inset-0 flex flex-col items-center justify-center">
              <span class="text-3xl font-bold text-gray-900 dark:text-white">{{ producao.total }}</span>
              <span class="text-xs text-gray-500 dark:text-gray-400">produções</span>
            </div>
          </div>

          <!-- Legenda -->
          <div class="flex flex-wrap items-center justify-center gap-4 mb-6">
            <div v-for="fase in producaoFases" :key="fase.label" class="flex items-center gap-1.5">
              <div class="w-2.5 h-2.5 rounded-full" :style="{ backgroundColor: fase.color }" />
              <span class="text-xs text-gray-600 dark:text-gray-400">{{ fase.label }} ({{ fase.value }})</span>
            </div>
          </div>

          <!-- Mini Cards -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
            <div
              v-for="card in producaoCards"
              :key="card.label"
              class="flex flex-col items-center p-3 rounded-lg border"
              :class="card.borderClass"
            >
              <span class="material-icons-outlined text-lg mb-1" :class="card.iconClass">{{ card.icon }}</span>
              <span class="text-xl font-bold" :class="card.valueClass">{{ card.value }}</span>
              <span class="text-[10px] text-gray-500 dark:text-gray-400 text-center">{{ card.label }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Section: Vendas Mensais + Fazendas -->
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <!-- Vendas Mensais -->
      <div class="bg-white dark:bg-[#1e1e1e] border border-gray-100 dark:border-gray-800 rounded-xl shadow-sm p-5">
        <div class="flex items-center justify-between mb-5">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Vendas Mensais</h2>
          <span class="text-xs text-gray-400 dark:text-gray-500">últimos 12 meses</span>
        </div>
        <div class="h-[280px]">
          <Bar :data="chartVendasData" :options="barOptions" />
        </div>
      </div>

      <!-- Fazendas -->
      <div class="bg-white dark:bg-[#1e1e1e] border border-gray-100 dark:border-gray-800 rounded-xl shadow-sm p-5">
        <div class="flex items-center justify-between mb-5">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Fazendas</h2>
          <span class="text-xs text-gray-400 dark:text-gray-500">{{ fazendas.length }} unidades</span>
        </div>

        <div class="space-y-4">
          <div
            v-for="fazenda in fazendas"
            :key="fazenda.nome"
            class="group p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          >
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ fazenda.nome }}</span>
              <div class="flex items-center gap-3">
                <span
                  class="text-xs font-semibold px-2 py-0.5 rounded-full"
                  :class="getEficienciaBadgeClass(fazenda.eficiencia)"
                >
                  {{ fazenda.eficiencia }}% efic.
                </span>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <div class="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full transition-all duration-700"
                  :style="{ width: `${fazenda.ocupacao}%` }"
                  :class="getOcupacaoBarClass(fazenda.ocupacao)"
                />
              </div>
              <span class="text-xs font-bold tabular-nums w-10 text-right" :class="getOcupacaoTextClass(fazenda.ocupacao)">
                {{ fazenda.ocupacao }}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { Doughnut, Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title)

definePageMeta({ layout: 'default', middleware: 'auth' })

// ─── State ───────────────────────────────────────────────
const showDropdown = ref(false)
const dropdownRef = ref(null)
const activeRankingTab = ref('eficiencia')
const rankingBarAnimated = ref(false)
const animatedValues = ref([0, 0, 0, 0, 0])

// ─── Mock Data ───────────────────────────────────────────
const heroKpis = [
  {
    label: 'Faturamento',
    value: 24580,
    format: 'currency',
    sparkline: [18200, 21400, 22800, 24580],
    change: 12,
    icon: 'payments',
    iconBg: 'bg-emerald-50 dark:bg-emerald-500/10',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    label: 'Vendas',
    value: 1842,
    format: 'number',
    suffix: 'un',
    sparkline: [1520, 1680, 1750, 1842],
    change: 8,
    icon: 'shopping_cart',
    iconBg: 'bg-blue-50 dark:bg-blue-500/10',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    label: 'Produção',
    value: 156,
    format: 'number',
    suffix: 'bdj',
    sparkline: [168, 172, 160, 156],
    change: -3,
    icon: 'eco',
    iconBg: 'bg-amber-50 dark:bg-amber-500/10',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  {
    label: 'Margem Bruta',
    value: 42,
    format: 'percent',
    sparkline: [38, 39, 41, 42],
    change: 2,
    icon: 'trending_up',
    iconBg: 'bg-violet-50 dark:bg-violet-500/10',
    iconColor: 'text-violet-600 dark:text-violet-400',
  },
  {
    label: 'Eficiência',
    value: 87,
    format: 'percent',
    sparkline: [78, 82, 84, 87],
    change: 5,
    icon: 'speed',
    iconBg: 'bg-cyan-50 dark:bg-cyan-500/10',
    iconColor: 'text-cyan-600 dark:text-cyan-400',
  },
]

const rankingTabs = [
  { key: 'eficiencia', label: 'Eficiência' },
  { key: 'vendidos', label: 'Mais Vendidos' },
  { key: 'margem', label: 'Margem' },
]

const rankings = {
  eficiencia: [
    { nome: 'Rabanete', valor: 96 },
    { nome: 'Girassol', valor: 93 },
    { nome: 'Ervilha', valor: 89 },
    { nome: 'Mostarda', valor: 86 },
    { nome: 'Rúcula', valor: 82 },
    { nome: 'Beterraba', valor: 78 },
    { nome: 'Coentro', valor: 74 },
    { nome: 'Brócolis', valor: 69 },
    { nome: 'Repolho Roxo', valor: 63 },
    { nome: 'Cenoura', valor: 58 },
  ],
  vendidos: [
    { nome: 'Rúcula', valor: 342 },
    { nome: 'Rabanete', valor: 298 },
    { nome: 'Girassol', valor: 256 },
    { nome: 'Coentro', valor: 214 },
    { nome: 'Mostarda', valor: 187 },
    { nome: 'Ervilha', valor: 165 },
    { nome: 'Beterraba', valor: 142 },
    { nome: 'Brócolis', valor: 118 },
    { nome: 'Cenoura', valor: 95 },
    { nome: 'Repolho Roxo', valor: 78 },
  ],
  margem: [
    { nome: 'Girassol', valor: 58 },
    { nome: 'Mostarda', valor: 52 },
    { nome: 'Rabanete', valor: 48 },
    { nome: 'Ervilha', valor: 45 },
    { nome: 'Rúcula', valor: 41 },
    { nome: 'Beterraba', valor: 38 },
    { nome: 'Coentro', valor: 34 },
    { nome: 'Brócolis', valor: 29 },
    { nome: 'Repolho Roxo', valor: 24 },
    { nome: 'Cenoura', valor: 19 },
  ],
}

const producao = {
  total: 156,
  perdas: 8,
  previstos: 42,
  atrasados: 3,
  fases: { plantio: 38, luz: 45, colheita: 28, concluido: 45 },
}

const producaoFases = [
  { label: 'Plantio', value: producao.fases.plantio, color: '#3B82F6' },
  { label: 'Luz', value: producao.fases.luz, color: '#EAB308' },
  { label: 'Colheita', value: producao.fases.colheita, color: '#22C55E' },
  { label: 'Concluído', value: producao.fases.concluido, color: '#9CA3AF' },
]

const producaoCards = [
  {
    label: 'Total',
    value: producao.total,
    icon: 'inventory_2',
    iconClass: 'text-blue-500',
    valueClass: 'text-gray-900 dark:text-white',
    borderClass: 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50',
  },
  {
    label: 'Perdas',
    value: producao.perdas,
    icon: 'delete_outline',
    iconClass: 'text-red-500',
    valueClass: 'text-red-600 dark:text-red-400',
    borderClass: 'border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-500/5',
  },
  {
    label: 'Previstos',
    value: producao.previstos,
    icon: 'schedule',
    iconClass: 'text-blue-500',
    valueClass: 'text-blue-600 dark:text-blue-400',
    borderClass: 'border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-500/5',
  },
  {
    label: 'Atrasados',
    value: producao.atrasados,
    icon: 'warning',
    iconClass: 'text-amber-500',
    valueClass: 'text-amber-600 dark:text-amber-400',
    borderClass: 'border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-500/5',
  },
]

const vendasMensais = [
  { mes: 'Mar', valor: 15200 },
  { mes: 'Abr', valor: 17800 },
  { mes: 'Mai', valor: 16400 },
  { mes: 'Jun', valor: 19200 },
  { mes: 'Jul', valor: 21500 },
  { mes: 'Ago', valor: 20100 },
  { mes: 'Set', valor: 22800 },
  { mes: 'Out', valor: 24200 },
  { mes: 'Nov', valor: 23100 },
  { mes: 'Dez', valor: 18900 },
  { mes: 'Jan', valor: 20400 },
  { mes: 'Fev', valor: 24580 },
]

const fazendas = [
  { nome: 'Fazenda Central', ocupacao: 85, eficiencia: 92 },
  { nome: 'Fazenda Norte', ocupacao: 62, eficiencia: 88 },
  { nome: 'Fazenda Sul', ocupacao: 94, eficiencia: 76 },
  { nome: 'Fazenda Leste', ocupacao: 45, eficiencia: 95 },
  { nome: 'Fazenda Oeste', ocupacao: 73, eficiencia: 83 },
  { nome: 'Fazenda Horizonte', ocupacao: 58, eficiencia: 90 },
]

// ─── Computed ────────────────────────────────────────────
const currentRanking = computed(() => rankings[activeRankingTab.value] || [])

const chartProducaoData = computed(() => ({
  labels: producaoFases.map((f) => f.label),
  datasets: [
    {
      data: producaoFases.map((f) => f.value),
      backgroundColor: producaoFases.map((f) => f.color),
      borderWidth: 0,
      hoverOffset: 4,
    },
  ],
}))

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: true,
  cutout: '72%',
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(0,0,0,0.8)',
      padding: 12,
      cornerRadius: 8,
      titleFont: { size: 13, weight: 'bold' },
      bodyFont: { size: 12 },
    },
  },
}

const chartVendasData = computed(() => ({
  labels: vendasMensais.map((v) => v.mes),
  datasets: [
    {
      data: vendasMensais.map((v) => v.valor),
      backgroundColor: 'rgba(34, 197, 94, 0.7)',
      hoverBackgroundColor: 'rgba(34, 197, 94, 0.9)',
      borderRadius: 6,
      borderSkipped: false,
      maxBarThickness: 40,
    },
  ],
}))

const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(0,0,0,0.8)',
      padding: 12,
      cornerRadius: 8,
      callbacks: {
        label: (ctx) =>
          new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ctx.raw),
      },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: { color: 'rgba(0,0,0,0.04)' },
      border: { display: false },
      ticks: {
        font: { size: 11 },
        color: '#9CA3AF',
        callback: (v) => (v >= 1000 ? `${v / 1000}k` : v),
      },
    },
    x: {
      grid: { display: false },
      border: { display: false },
      ticks: { font: { size: 11 }, color: '#9CA3AF' },
    },
  },
}

// ─── Helpers ─────────────────────────────────────────────
function formatKpiValue(kpi, animVal) {
  const v = animVal ?? 0
  if (kpi.format === 'currency') {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(v)
  }
  if (kpi.format === 'percent') return `${Math.round(v)}%`
  if (kpi.suffix) return `${Math.round(v).toLocaleString('pt-BR')} ${kpi.suffix}`
  return Math.round(v).toLocaleString('pt-BR')
}

function formatRankingValue(valor) {
  if (activeRankingTab.value === 'vendidos') return `${valor} un`
  return `${valor}%`
}

function getRankColor(index) {
  const colors = [
    '#22C55E', '#3DD856', '#6BE05A', '#8DE45A', '#B0E85A',
    '#D4E85A', '#E8D44A', '#E8B44A', '#E8884A', '#EF4444',
  ]
  return colors[index] || '#9CA3AF'
}

function sparklinePoints(data) {
  if (!data?.length) return ''
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  return data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * 64
      const y = 26 - ((v - min) / range) * 22
      return `${x},${y}`
    })
    .join(' ')
}

function sparklineArea(data) {
  if (!data?.length) return ''
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 64
    const y = 26 - ((v - min) / range) * 22
    return `${x},${y}`
  })
  return `0,28 ${points.join(' ')} 64,28`
}

function getOcupacaoBarClass(ocupacao) {
  if (ocupacao >= 90) return 'bg-red-500'
  if (ocupacao >= 70) return 'bg-amber-500'
  return 'bg-emerald-500'
}

function getOcupacaoTextClass(ocupacao) {
  if (ocupacao >= 90) return 'text-red-600 dark:text-red-400'
  if (ocupacao >= 70) return 'text-amber-600 dark:text-amber-400'
  return 'text-emerald-600 dark:text-emerald-400'
}

function getEficienciaBadgeClass(eficiencia) {
  if (eficiencia >= 90)
    return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
  if (eficiencia >= 80)
    return 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400'
  return 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
}

// ─── Animations ──────────────────────────────────────────
function animateCounters() {
  const duration = 600
  const startTime = performance.now()

  function tick(now) {
    const elapsed = now - startTime
    const progress = Math.min(elapsed / duration, 1)
    const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic

    animatedValues.value = heroKpis.map((kpi) => kpi.value * eased)

    if (progress < 1) requestAnimationFrame(tick)
  }

  requestAnimationFrame(tick)
}

// ─── Lifecycle ───────────────────────────────────────────
onMounted(() => {
  animateCounters()

  nextTick(() => {
    setTimeout(() => {
      rankingBarAnimated.value = true
    }, 300)
  })
})

watch(activeRankingTab, () => {
  rankingBarAnimated.value = false
  nextTick(() => {
    setTimeout(() => {
      rankingBarAnimated.value = true
    }, 50)
  })
})
</script>

<style scoped>
.kpi-card {
  animation: fadeSlideUp 0.5s ease-out both;
}

@keyframes fadeSlideUp {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.ranking-list-enter-active {
  transition: all 0.3s ease-out;
}
.ranking-list-leave-active {
  transition: all 0.2s ease-in;
}
.ranking-list-enter-from {
  opacity: 0;
  transform: translateX(-10px);
}
.ranking-list-leave-to {
  opacity: 0;
  transform: translateX(10px);
}

.tabular-nums {
  font-variant-numeric: tabular-nums;
}
</style>
