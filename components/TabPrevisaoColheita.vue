<template>
  <div>
    <!-- Toolbar: Filtros -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-4 mb-4">
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
        <!-- Seletor de Mês -->
        <div class="relative">
          <button
            @click="showMonthPicker = !showMonthPicker"
            class="flex items-center gap-2 px-3 py-2 h-[38px] text-sm font-medium border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-gray-800 text-text-light dark:text-text-dark hover:border-primary dark:hover:border-primary transition-colors cursor-pointer"
          >
            <span class="material-icons-outlined text-primary text-base">calendar_month</span>
            <span class="capitalize">{{ selectedMonthLabel }}</span>
            <span class="material-icons-outlined text-gray-400 text-base">expand_more</span>
          </button>

          <!-- Month Picker Dropdown -->
          <Transition
            enter-active-class="transition-all duration-150 ease-out"
            leave-active-class="transition-all duration-100 ease-in"
            enter-from-class="opacity-0 scale-95 -translate-y-1"
            leave-to-class="opacity-0 scale-95 -translate-y-1"
          >
            <div
              v-if="showMonthPicker"
              class="absolute top-full left-0 mt-1 z-30 bg-white dark:bg-card-dark border border-border-light dark:border-border-dark rounded-xl shadow-lg p-3 w-[260px]"
            >
              <!-- Ano nav -->
              <div class="flex items-center justify-between mb-3">
                <button @click="pickerYear--" class="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <span class="material-icons-outlined text-sm text-subtext-light dark:text-subtext-dark">chevron_left</span>
                </button>
                <span class="text-sm font-semibold text-text-light dark:text-text-dark">{{ pickerYear }}</span>
                <button @click="pickerYear++" class="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <span class="material-icons-outlined text-sm text-subtext-light dark:text-subtext-dark">chevron_right</span>
                </button>
              </div>
              <!-- Grid meses -->
              <div class="grid grid-cols-3 gap-1.5">
                <button
                  v-for="(mes, i) in mesesNomes"
                  :key="i"
                  @click="selecionarMes(i)"
                  :class="[
                    'px-2 py-2 text-xs font-medium rounded-lg transition-all duration-150',
                    isSelectedMonth(i)
                      ? 'bg-primary text-white shadow-sm'
                      : isCurrentMonth(i)
                        ? 'bg-primary/10 text-primary border border-primary/30'
                        : 'text-text-light dark:text-text-dark hover:bg-gray-100 dark:hover:bg-gray-700'
                  ]"
                >
                  {{ mes }}
                </button>
              </div>
            </div>
          </Transition>
        </div>

        <!-- Seletor de Semana (dropdown) -->
        <div class="relative">
          <button
            @click="showWeekPicker = !showWeekPicker"
            class="flex items-center gap-2 px-3 py-2 h-[38px] text-sm font-medium border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-gray-800 text-text-light dark:text-text-dark hover:border-primary dark:hover:border-primary transition-colors cursor-pointer"
          >
            <span class="material-icons-outlined text-primary text-base">date_range</span>
            <span>Semana {{ selectedSemana.toString().padStart(2, '0') }}</span>
            <span class="text-xs text-subtext-light dark:text-subtext-dark">({{ selectedSemanaRange }})</span>
            <span class="material-icons-outlined text-gray-400 text-base">expand_more</span>
          </button>

          <Transition
            enter-active-class="transition-all duration-150 ease-out"
            leave-active-class="transition-all duration-100 ease-in"
            enter-from-class="opacity-0 scale-95 -translate-y-1"
            leave-to-class="opacity-0 scale-95 -translate-y-1"
          >
            <div
              v-if="showWeekPicker"
              class="absolute top-full left-0 mt-1 z-30 bg-white dark:bg-card-dark border border-border-light dark:border-border-dark rounded-xl shadow-lg py-1 min-w-[240px]"
            >
              <button
                v-for="semana in semanas"
                :key="semana.numero"
                @click="selecionarSemana(semana.numero)"
                :class="[
                  'w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors',
                  selectedSemana === semana.numero
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-text-light dark:text-text-dark hover:bg-gray-50 dark:hover:bg-gray-800'
                ]"
              >
                <span class="font-medium">Semana {{ semana.numero.toString().padStart(2, '0') }}</span>
                <span class="text-xs text-subtext-light dark:text-subtext-dark">{{ semana.inicio }} - {{ semana.fim }}</span>
              </button>
            </div>
          </Transition>
        </div>
      </div>
    </div>

    <!-- Click outside overlay -->
    <div v-if="showMonthPicker || showWeekPicker" class="fixed inset-0 z-20" @click="showMonthPicker = false; showWeekPicker = false"></div>

    <!-- Header fixo da tabela (aparece ao rolar) -->
    <div
      v-if="showFixedHeader && !loading && filteredEspecies.length > 0"
      class="fixed top-0 left-0 right-0 z-40 bg-gray-100 dark:bg-gray-700/50 border-b border-border-light dark:border-border-dark shadow-sm"
      :style="fixedHeaderStyle"
    >
      <table class="w-full text-left border-collapse">
        <thead>
          <tr>
            <th class="table-header bg-gray-100 dark:bg-gray-700/50 cursor-pointer select-none" :style="{ width: colWidths[0] + 'px' }" @click="toggleSort('especie')">
              <span class="inline-flex items-center gap-0.5">Especie <span class="material-icons-outlined text-xs text-gray-400">{{ sortIcon('especie') }}</span></span>
            </th>
            <th
              v-for="(dia, i) in diasDaSemana"
              :key="dia.data"
              class="table-header text-center bg-gray-100 dark:bg-gray-700/50"
              :style="{ width: colWidths[i + 1] + 'px' }"
            >
              <div>{{ dia.dataFormatada }}</div>
              <div class="text-[10px] font-normal text-subtext-light dark:text-subtext-dark">{{ dia.diaSemana }}</div>
            </th>
            <th class="table-header text-center bg-gray-100 dark:bg-gray-700 cursor-pointer select-none" :style="{ width: colWidths[colWidths.length - 1] + 'px' }" @click="toggleSort('total')">
              <span class="inline-flex items-center gap-0.5">Total <span class="material-icons-outlined text-xs text-gray-400">{{ sortIcon('total') }}</span></span>
            </th>
          </tr>
        </thead>
      </table>
    </div>

    <!-- Card da Tabela -->
    <div class="card">
      <!-- Resumo -->
      <div class="p-4 border-b border-border-light dark:border-border-dark bg-gray-50/50 dark:bg-gray-800/30">
        <div class="flex flex-wrap gap-6">
          <div>
            <span class="text-xs text-subtext-light dark:text-subtext-dark">Total Especies</span>
            <p class="text-lg font-semibold text-text-light dark:text-text-dark">{{ filteredEspecies.length }}</p>
          </div>
          <div>
            <span class="text-xs text-subtext-light dark:text-subtext-dark">Total Previsto</span>
            <p class="text-lg font-semibold text-primary">{{ getTotalGeral() }} bandejas</p>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="p-8 text-center">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
        <p class="mt-2 text-subtext-light dark:text-subtext-dark">Carregando previsão...</p>
      </div>

      <!-- Tabela -->
      <div v-else-if="filteredEspecies.length > 0">
        <table ref="tabelaRef" class="w-full text-left border-collapse">
          <thead ref="theadRef">
            <tr class="bg-gray-100 dark:bg-gray-700/50 border-b border-border-light dark:border-border-dark">
              <th class="table-header sticky left-0 bg-gray-100 dark:bg-gray-700/50 z-10 cursor-pointer select-none" @click="toggleSort('especie')">
                <span class="inline-flex items-center gap-0.5">Especie <span class="material-icons-outlined text-xs text-gray-400">{{ sortIcon('especie') }}</span></span>
              </th>
              <th
                v-for="dia in diasDaSemana"
                :key="dia.data"
                class="table-header text-center min-w-[100px] bg-gray-100 dark:bg-gray-700/50"
              >
                <div>{{ dia.dataFormatada }}</div>
                <div class="text-[10px] font-normal text-subtext-light dark:text-subtext-dark">{{ dia.diaSemana }}</div>
              </th>
              <th class="table-header text-center bg-gray-100 dark:bg-gray-700 min-w-[100px] cursor-pointer select-none" @click="toggleSort('total')">
                <span class="inline-flex items-center gap-0.5">Total <span class="material-icons-outlined text-xs text-gray-400">{{ sortIcon('total') }}</span></span>
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-light dark:divide-border-dark">
            <tr
              v-for="especie in paginatedEspecies"
              :key="especie.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <td class="table-cell font-medium sticky left-0 bg-white dark:bg-card-dark z-10">
                {{ especie.codigo }}
              </td>
              <td
                v-for="dia in diasDaSemana"
                :key="dia.data"
                class="table-cell text-center"
              >
                <span
                  v-if="getValorColheita(especie.id, dia.data) > 0"
                  class="inline-flex items-center justify-center min-w-[28px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium text-xs"
                >
                  {{ getValorColheita(especie.id, dia.data) }}
                </span>
                <span v-else class="text-gray-300 dark:text-gray-600">-</span>
              </td>
              <td class="table-cell text-center bg-gray-50 dark:bg-gray-800/50 font-semibold">
                {{ getTotalSemana(especie.id) || '-' }}
              </td>
            </tr>
          </tbody>
          <tfoot class="border-t-2 border-border-light dark:border-border-dark">
            <tr class="bg-gray-100 dark:bg-gray-800">
              <td class="table-cell font-bold sticky left-0 bg-gray-100 dark:bg-gray-800 z-10">
                Total:
              </td>
              <td
                v-for="dia in diasDaSemana"
                :key="dia.data"
                class="table-cell text-center font-semibold"
              >
                {{ getTotalDia(dia.data) || '-' }}
              </td>
              <td class="table-cell text-center bg-primary/10 dark:bg-primary/20">
                <span class="text-lg font-bold text-primary">{{ getTotalGeral() }}</span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-12">
        <span class="material-icons-outlined text-4xl text-gray-300 dark:text-gray-600 mb-2">eco</span>
        <h3 class="text-lg font-medium text-text-light dark:text-text-dark mb-1">Nenhuma espécie cadastrada</h3>
        <p class="text-sm text-subtext-light dark:text-subtext-dark">
          Cadastre espécies para visualizar a previsão de colheita
        </p>
      </div>

      <!-- Paginacao -->
      <div v-if="filteredEspecies.length > 0" class="p-3 sm:p-4 border-t border-border-light dark:border-border-dark text-xs text-subtext-light dark:text-subtext-dark">
        <div class="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <div class="flex items-center gap-3 sm:gap-4 w-full sm:w-auto justify-between sm:justify-start">
            <div class="flex items-center gap-2">
              <span class="hidden sm:inline">Mostrar</span>
              <select v-model="itemsPerPage" class="border border-border-light dark:border-border-dark rounded px-2 py-1 bg-white dark:bg-gray-800 text-xs sm:text-sm cursor-pointer">
                <option :value="10">10</option>
                <option :value="25">25</option>
                <option :value="50">50</option>
              </select>
            </div>
            <span class="text-xs">{{ filteredEspecies.length }} registros</span>
          </div>
          <div class="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto justify-center sm:justify-end">
            <button
              @click="currentPage--"
              :disabled="currentPage === 1"
              class="p-1 border border-border-light dark:border-border-dark rounded hover:bg-gray-50 dark:hover:bg-gray-800 bg-white dark:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span class="material-icons-outlined text-sm">chevron_left</span>
            </button>
            <span class="hidden xs:inline">Página</span>
            <input
              v-model="pageInput"
              type="text"
              class="w-10 sm:w-12 text-center border border-border-light dark:border-border-dark rounded px-1 sm:px-2 py-1 bg-white dark:bg-gray-800 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              @keyup.enter="goToPage"
              @blur="goToPage"
            />
            <span>de {{ totalPages }}</span>
            <button
              @click="currentPage++"
              :disabled="currentPage === totalPages"
              class="p-1 border border-border-light dark:border-border-dark rounded hover:bg-gray-50 dark:hover:bg-gray-800 bg-white dark:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span class="material-icons-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useCurrentCompany } from '~/composables/useCurrentCompany'

interface Especie {
  id: string
  codigo: string
  nome: string
}

interface ProducaoPrevisao {
  id: string
  especie_id: string
  data_colheita_prevista: string
  quantidade_planejada: number
  status: string
}

const supabase = useSupabaseClient()
const { currentCompany } = useCurrentCompany()

// Estado
const especies = ref<Especie[]>([])
const producoes = ref<ProducaoPrevisao[]>([])
const loading = ref(false)

// Header fixo
const theadRef = ref<HTMLElement | null>(null)
const tabelaRef = ref<HTMLElement | null>(null)
const showFixedHeader = ref(false)
const fixedHeaderStyle = ref<Record<string, string>>({})
const colWidths = ref<number[]>([])
let mainEl: HTMLElement | null = null

function onMainScroll() {
  if (!theadRef.value || !tabelaRef.value || !mainEl) return
  const theadRect = theadRef.value.getBoundingClientRect()
  const tabelaRect = tabelaRef.value.getBoundingClientRect()
  const mainRect = mainEl.getBoundingClientRect()

  // Mostra header fixo quando o thead original sai do viewport do main
  const shouldShow = theadRect.top < mainRect.top && tabelaRect.bottom > mainRect.top + 100

  if (shouldShow && !showFixedHeader.value) {
    // Capturar larguras das colunas
    const ths = theadRef.value.querySelectorAll('th')
    colWidths.value = Array.from(ths).map(th => th.getBoundingClientRect().width)
  }

  showFixedHeader.value = shouldShow

  if (shouldShow) {
    fixedHeaderStyle.value = {
      left: tabelaRect.left + 'px',
      width: tabelaRect.width + 'px',
      top: mainRect.top + 'px',
    }
  }
}

// Ordenacao
const sortColumn = ref<'especie' | 'total'>('especie')
const sortDirection = ref<'asc' | 'desc'>('asc')

function toggleSort(col: 'especie' | 'total') {
  if (sortColumn.value === col) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortColumn.value = col
    sortDirection.value = col === 'especie' ? 'asc' : 'desc'
  }
  currentPage.value = 1
  pageInput.value = '1'
}

function sortIcon(col: 'especie' | 'total') {
  if (sortColumn.value !== col) return 'unfold_more'
  return sortDirection.value === 'asc' ? 'expand_less' : 'expand_more'
}

// Dropdowns
const showMonthPicker = ref(false)
const showWeekPicker = ref(false)

// Meses
const mesesNomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

// Recuperar filtros salvos do localStorage
const hoje = new Date()
const defaultMonth = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`

const savedMonth = typeof window !== 'undefined' ? localStorage.getItem('previsao-colheita-month') : null
const savedSemana = typeof window !== 'undefined' ? localStorage.getItem('previsao-colheita-semana') : null
const savedItemsPerPage = typeof window !== 'undefined' ? localStorage.getItem('previsao-colheita-items-per-page') : null

const selectedMonth = ref(savedMonth || defaultMonth)
const selectedSemana = ref(savedSemana ? parseInt(savedSemana) : 1)

// Picker year
const pickerYear = ref(parseInt(selectedMonth.value.split('-')[0]))

// Paginacao
const currentPage = ref(1)
const itemsPerPage = ref(savedItemsPerPage ? parseInt(savedItemsPerPage) : 10)
const pageInput = ref('1')

// Computed - label do mes selecionado
const selectedMonthLabel = computed(() => {
  const [ano, mes] = selectedMonth.value.split('-').map(Number)
  const mesesFull = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
  return `${mesesFull[mes - 1]} ${ano}`
})

// Computed - range da semana selecionada
const selectedSemanaRange = computed(() => {
  const s = semanas.value.find(s => s.numero === selectedSemana.value)
  return s ? `${s.inicio} - ${s.fim}` : ''
})

function isSelectedMonth(mesIndex: number): boolean {
  const [ano, mes] = selectedMonth.value.split('-').map(Number)
  return pickerYear.value === ano && mesIndex === mes - 1
}

function isCurrentMonth(mesIndex: number): boolean {
  return pickerYear.value === hoje.getFullYear() && mesIndex === hoje.getMonth()
}

function selecionarMes(mesIndex: number) {
  selectedMonth.value = `${pickerYear.value}-${String(mesIndex + 1).padStart(2, '0')}`
  showMonthPicker.value = false
}

function selecionarSemana(numero: number) {
  selectedSemana.value = numero
  showWeekPicker.value = false
}

// Funcoes para salvar filtros no localStorage
function saveFiltersToStorage() {
  if (typeof window !== 'undefined') {
    localStorage.setItem('previsao-colheita-month', selectedMonth.value)
    localStorage.setItem('previsao-colheita-semana', selectedSemana.value.toString())
    localStorage.setItem('previsao-colheita-items-per-page', itemsPerPage.value.toString())
  }
}

// Computed - semanas do mes
const semanas = computed(() => {
  const [ano, mes] = selectedMonth.value.split('-').map(Number)
  const primeiroDia = new Date(ano, mes - 1, 1)
  const ultimoDia = new Date(ano, mes, 0)

  const diaDaSemana = primeiroDia.getDay()
  const offsetParaSegunda = diaDaSemana === 0 ? -6 : 1 - diaDaSemana

  const primeiraSegunda = new Date(primeiroDia)
  primeiraSegunda.setDate(primeiroDia.getDate() + offsetParaSegunda)

  const semanasArr = []
  let semanaNum = 1
  let inicioSemana = new Date(primeiraSegunda)

  while (inicioSemana <= ultimoDia || semanaNum === 1) {
    const fimSemana = new Date(inicioSemana)
    fimSemana.setDate(inicioSemana.getDate() + 6)

    semanasArr.push({
      numero: semanaNum,
      inicio: `${inicioSemana.getDate().toString().padStart(2, '0')}/${(inicioSemana.getMonth() + 1).toString().padStart(2, '0')}`,
      fim: `${fimSemana.getDate().toString().padStart(2, '0')}/${(fimSemana.getMonth() + 1).toString().padStart(2, '0')}`
    })

    inicioSemana.setDate(inicioSemana.getDate() + 7)
    semanaNum++

    if (semanaNum > 6) break
  }

  return semanasArr
})

// Computed - dias da semana selecionada
const diasDaSemana = computed(() => {
  const [ano, mes] = selectedMonth.value.split('-').map(Number)
  const primeiroDia = new Date(ano, mes - 1, 1)

  const diaDaSemana = primeiroDia.getDay()
  const offsetParaSegunda = diaDaSemana === 0 ? -6 : 1 - diaDaSemana

  const primeiraSegunda = new Date(primeiroDia)
  primeiraSegunda.setDate(primeiroDia.getDate() + offsetParaSegunda)

  const inicioSemana = new Date(primeiraSegunda)
  inicioSemana.setDate(primeiraSegunda.getDate() + (selectedSemana.value - 1) * 7)

  const dias = []
  const diasSemanaNames = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']

  for (let i = 0; i < 7; i++) {
    const data = new Date(inicioSemana)
    data.setDate(inicioSemana.getDate() + i)
    dias.push({
      data: data.toISOString().split('T')[0],
      dataFormatada: `${data.getDate().toString().padStart(2, '0')}/${(data.getMonth() + 1).toString().padStart(2, '0')}`,
      diaSemana: diasSemanaNames[i]
    })
  }

  return dias
})

const filteredEspecies = computed(() => {
  const list = [...especies.value]
  const dir = sortDirection.value === 'asc' ? 1 : -1

  if (sortColumn.value === 'especie') {
    list.sort((a, b) => a.codigo.localeCompare(b.codigo) * dir)
  } else if (sortColumn.value === 'total') {
    list.sort((a, b) => (getTotalSemana(a.id) - getTotalSemana(b.id)) * dir)
  }

  return list
})

// Paginacao
const totalPages = computed(() => {
  return Math.ceil(filteredEspecies.value.length / itemsPerPage.value) || 1
})

const paginatedEspecies = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredEspecies.value.slice(start, end)
})

// Funcoes auxiliares
function getValorColheita(especieId: string, data: string) {
  return producoes.value
    .filter(p => p.especie_id === especieId && p.data_colheita_prevista === data && p.status !== 'finalizado' && p.status !== 'cancelado')
    .reduce((sum, p) => sum + (p.quantidade_planejada || 0), 0)
}

function getTotalSemana(especieId: string) {
  return diasDaSemana.value.reduce((total, dia) => {
    return total + getValorColheita(especieId, dia.data)
  }, 0)
}

function getTotalDia(data: string) {
  return filteredEspecies.value.reduce((total, especie) => {
    return total + getValorColheita(especie.id, data)
  }, 0)
}

function getTotalGeral() {
  return filteredEspecies.value.reduce((total, especie) => {
    return total + getTotalSemana(especie.id)
  }, 0)
}

function goToPage() {
  const page = parseInt(pageInput.value)
  if (!isNaN(page) && page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  } else {
    pageInput.value = String(currentPage.value)
  }
}

// CRUD
async function loadEspecies() {
  if (!currentCompany.value?.id) return

  try {
    const { data, error } = await supabase
      .from('especies')
      .select('id, codigo, nome')
      .eq('empresa_id', currentCompany.value.id)
      .eq('ativo', true)
      .order('codigo')

    if (error) throw error
    especies.value = data || []
  } catch (e: any) {
    console.error('Erro ao carregar especies:', e)
  }
}

async function loadProducoes() {
  if (!currentCompany.value?.id) return

  loading.value = true
  try {
    const [ano, mes] = selectedMonth.value.split('-').map(Number)
    const primeiroDia = new Date(ano, mes - 1, 1)
    const ultimoDia = new Date(ano, mes, 0)

    // Expandir range para incluir semanas completas
    const diaDaSemana = primeiroDia.getDay()
    const offsetParaSegunda = diaDaSemana === 0 ? -6 : 1 - diaDaSemana
    primeiroDia.setDate(primeiroDia.getDate() + offsetParaSegunda)
    ultimoDia.setDate(ultimoDia.getDate() + 7)

    const dataInicio = primeiroDia.toISOString().split('T')[0]
    const dataFim = ultimoDia.toISOString().split('T')[0]

    // Busca da tabela producao_especies que tem o especie_id e quantidade por especie
    // JOIN com producoes para pegar status e data_colheita_prevista
    const { data, error } = await supabase
      .from('producao_especies')
      .select(`
        id,
        especie_id,
        quantidade_planejada,
        producoes!inner(
          id,
          status,
          data_colheita_prevista,
          empresa_id
        )
      `)
      .eq('producoes.empresa_id', currentCompany.value.id)
      .gte('producoes.data_colheita_prevista', dataInicio)
      .lte('producoes.data_colheita_prevista', dataFim)
      .in('producoes.status', ['planejado', 'germinando', 'luz', 'colhendo'])

    if (error) throw error

    // Mapear para formato flat
    producoes.value = (data || []).map((pe: any) => ({
      id: pe.id,
      especie_id: pe.especie_id,
      data_colheita_prevista: pe.producoes.data_colheita_prevista,
      quantidade_planejada: pe.quantidade_planejada || 0,
      status: pe.producoes.status
    }))
  } catch (e: any) {
    console.error('Erro ao carregar producoes:', e)
  } finally {
    loading.value = false
  }
}

// Watch
watch(() => currentCompany.value?.id, (newId) => {
  if (newId) {
    loadEspecies()
    loadProducoes()
  }
}, { immediate: true })

watch(selectedMonth, () => {
  selectedSemana.value = 1
  currentPage.value = 1
  pageInput.value = '1'
  pickerYear.value = parseInt(selectedMonth.value.split('-')[0])
  saveFiltersToStorage()
  loadProducoes()
})

watch(selectedSemana, () => {
  currentPage.value = 1
  pageInput.value = '1'
  saveFiltersToStorage()
})

watch(itemsPerPage, () => {
  currentPage.value = 1
  pageInput.value = '1'
  saveFiltersToStorage()
})

watch(currentPage, (newVal) => {
  pageInput.value = String(newVal)
})

// Lifecycle
onMounted(() => {
  if (semanas.value.length > 0 && selectedSemana.value > semanas.value.length) {
    selectedSemana.value = 1
    saveFiltersToStorage()
  }

  if (currentCompany.value?.id) {
    loadEspecies()
    loadProducoes()
  }

  // Encontrar o <main> ancestor para ouvir scroll
  nextTick(() => {
    mainEl = document.querySelector('main')
    if (mainEl) {
      mainEl.addEventListener('scroll', onMainScroll, { passive: true })
    }
  })
})

onUnmounted(() => {
  if (mainEl) {
    mainEl.removeEventListener('scroll', onMainScroll)
  }
})
</script>
