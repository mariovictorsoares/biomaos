<template>
  <div>
    <!-- KPI Cards -->
    <div class="grid grid-cols-4 gap-4 mb-5">
      <div class="card p-4">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center">
            <span class="material-icons text-blue-500 text-[18px]">agriculture</span>
          </div>
          <div>
            <p class="text-xs text-subtext-light dark:text-subtext-dark">Fazendas</p>
            <p class="text-xl font-bold text-text-light dark:text-text-dark leading-tight">{{ fazendas.length }}</p>
          </div>
        </div>
      </div>
      <div class="card p-4">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
            <span class="material-icons text-primary text-[18px]">grid_view</span>
          </div>
          <div>
            <p class="text-xs text-subtext-light dark:text-subtext-dark">Capacidade Total</p>
            <p class="text-xl font-bold text-text-light dark:text-text-dark leading-tight">{{ capacidadeTotal.toLocaleString('pt-BR') }} <span class="text-xs font-normal text-subtext-light dark:text-subtext-dark">un</span></p>
          </div>
        </div>
      </div>
      <div class="card p-4">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg flex items-center justify-center"
            :class="ocupacaoSemanal > 80 ? 'bg-red-500/10 dark:bg-red-500/20' : ocupacaoSemanal > 50 ? 'bg-yellow-500/10 dark:bg-yellow-500/20' : 'bg-green-500/10 dark:bg-green-500/20'"
          >
            <span class="material-icons text-[18px]"
              :class="ocupacaoSemanal > 80 ? 'text-red-500' : ocupacaoSemanal > 50 ? 'text-yellow-500' : 'text-green-500'"
            >speed</span>
          </div>
          <div>
            <p class="text-xs text-subtext-light dark:text-subtext-dark">Ocupação Semanal</p>
            <p class="text-xl font-bold text-text-light dark:text-text-dark leading-tight">{{ ocupacaoSemanal }}<span class="text-xs font-normal text-subtext-light dark:text-subtext-dark">%</span></p>
          </div>
        </div>
      </div>
      <div class="card p-4">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg flex items-center justify-center"
            :class="ocupacaoMensal > 80 ? 'bg-red-500/10 dark:bg-red-500/20' : ocupacaoMensal > 50 ? 'bg-yellow-500/10 dark:bg-yellow-500/20' : 'bg-green-500/10 dark:bg-green-500/20'"
          >
            <span class="material-icons text-[18px]"
              :class="ocupacaoMensal > 80 ? 'text-red-500' : ocupacaoMensal > 50 ? 'text-yellow-500' : 'text-green-500'"
            >calendar_month</span>
          </div>
          <div>
            <p class="text-xs text-subtext-light dark:text-subtext-dark">Ocupação Mensal</p>
            <p class="text-xl font-bold text-text-light dark:text-text-dark leading-tight">{{ ocupacaoMensal }}<span class="text-xs font-normal text-subtext-light dark:text-subtext-dark">%</span></p>
          </div>
        </div>
      </div>
    </div>

    <!-- Toolbar: Período -->
    <div class="flex items-center justify-between gap-4 mb-4">
      <!-- Seletor de mês com dropdown -->
      <div class="relative">
        <button
          @click="showMonthPicker = !showMonthPicker"
          class="flex items-center gap-2 px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-card-dark hover:border-primary/50 transition-colors"
        >
          <span class="material-icons text-primary text-[18px]">calendar_month</span>
          <span class="text-sm font-medium text-text-light dark:text-text-dark capitalize">{{ mesFormatado }}</span>
          <span class="material-icons text-subtext-light dark:text-subtext-dark text-[16px]">unfold_more</span>
        </button>
        <!-- Dropdown mês/ano -->
        <div
          v-if="showMonthPicker"
          class="absolute top-full left-0 mt-1 z-50 bg-white dark:bg-gray-800 border border-border-light dark:border-border-dark rounded-xl shadow-lg p-3 w-[260px]"
        >
          <!-- Ano -->
          <div class="flex items-center justify-between mb-3">
            <button @click="pickerYear--" class="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <span class="material-icons text-[18px] text-subtext-light dark:text-subtext-dark">chevron_left</span>
            </button>
            <span class="text-sm font-semibold text-text-light dark:text-text-dark">{{ pickerYear }}</span>
            <button @click="pickerYear++" class="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <span class="material-icons text-[18px] text-subtext-light dark:text-subtext-dark">chevron_right</span>
            </button>
          </div>
          <!-- Meses grid -->
          <div class="grid grid-cols-3 gap-1">
            <button
              v-for="(nome, idx) in mesesNomes"
              :key="idx"
              @click="selectMonth(idx)"
              :class="[
                'px-2 py-1.5 text-xs font-medium rounded-lg transition-colors capitalize',
                isCurrentMonth(idx)
                  ? 'bg-primary text-white'
                  : 'text-text-light dark:text-text-dark hover:bg-gray-100 dark:hover:bg-gray-700'
              ]"
            >
              {{ nome }}
            </button>
          </div>
        </div>
      </div>

      <!-- Semanas segmented -->
      <div class="relative flex items-center gap-1.5">
        <div class="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
          <button
            v-for="semana in semanas"
            :key="semana.numero"
            @click="selectedSemana = semana.numero"
            @mouseenter="hoveredSemana = semana.numero"
            @mouseleave="hoveredSemana = null"
            :class="[
              'relative px-3 py-1.5 text-xs font-medium rounded-md transition-all focus:outline-none',
              selectedSemana === semana.numero
                ? 'bg-white dark:bg-gray-700 text-primary shadow-sm'
                : 'text-subtext-light dark:text-subtext-dark hover:text-text-light dark:hover:text-text-dark'
            ]"
          >
            S{{ semana.numero }}
          </button>
        </div>
        <!-- Mini calendário tooltip -->
        <Transition
          enter-active-class="transition duration-150 ease-out"
          enter-from-class="opacity-0 translate-y-1"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition duration-100 ease-in"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 translate-y-1"
        >
          <div
            v-if="hoveredSemana !== null"
            class="absolute top-full right-0 mt-2 z-50 bg-white dark:bg-gray-800 border border-border-light dark:border-border-dark rounded-xl shadow-lg p-2 pointer-events-none"
          >
            <div class="grid grid-cols-7 gap-0 text-center" style="width: 154px">
              <span v-for="d in ['S', 'T', 'Q', 'Q', 'S', 'S', 'D']" :key="d" class="text-[9px] font-medium text-subtext-light dark:text-subtext-dark w-[22px] h-4 flex items-center justify-center">{{ d }}</span>
              <template v-for="(dia, i) in miniCalendario" :key="i">
                <span
                  :class="[
                    'w-[22px] h-[22px] flex items-center justify-center text-[10px] rounded-full',
                    dia.destaque
                      ? 'bg-primary text-white font-semibold'
                      : dia.foraDoMes
                        ? 'text-gray-300 dark:text-gray-600'
                        : 'text-text-light dark:text-text-dark'
                  ]"
                >{{ dia.numero }}</span>
              </template>
            </div>
          </div>
        </Transition>
      </div>
    </div>

    <!-- Card da Tabela -->
    <div class="card">

      <!-- Loading -->
      <div v-if="loading" class="p-8 text-center">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
        <p class="mt-2 text-subtext-light dark:text-subtext-dark">Carregando capacidade...</p>
      </div>

      <!-- Tabela de Capacidade -->
      <div v-else-if="fazendas.length > 0" class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-100 dark:bg-gray-700/50 border-b border-border-light dark:border-border-dark">
              <th class="table-header sticky left-0 bg-gray-100 dark:bg-gray-700/50 z-10 min-w-[120px]">Fazenda</th>
              <th class="table-header text-center min-w-[100px]">Capacidade</th>
              <th
                v-for="dia in diasDaSemana"
                :key="dia.data"
                class="table-header text-center min-w-[100px]"
              >
                <div>{{ dia.dataFormatada }}</div>
                <div class="text-[10px] font-normal text-subtext-light dark:text-subtext-dark">{{ dia.diaSemana }}</div>
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-light dark:divide-border-dark">
            <tr
              v-for="fazenda in paginatedFazendas"
              :key="fazenda.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <td class="table-cell font-medium sticky left-0 bg-white dark:bg-card-dark z-10">
                {{ fazenda.codigo || fazenda.nome }}
              </td>
              <td class="table-cell text-center text-subtext-light dark:text-subtext-dark">
                {{ fazenda.capacidade || 0 }}
              </td>
              <td
                v-for="dia in diasDaSemana"
                :key="`${fazenda.id}-${dia.data}`"
                class="table-cell text-center"
              >
                <span
                  :class="[
                    'inline-flex items-center justify-center min-w-[60px] px-3 py-1.5 rounded text-sm font-semibold',
                    getCapacityClass(getCapacidadeLivre(fazenda, dia.data))
                  ]"
                >
                  {{ getCapacidadeLivre(fazenda, dia.data) }}
                </span>
              </td>
            </tr>
          </tbody>
          <!-- Footer com totais -->
          <tfoot class="border-t-2 border-border-light dark:border-border-dark">
            <tr class="bg-gray-100 dark:bg-gray-800">
              <td class="table-cell font-bold sticky left-0 bg-gray-100 dark:bg-gray-800 z-10">
                Total:
              </td>
              <td class="table-cell text-center font-semibold">
                {{ capacidadeTotal }}
              </td>
              <td
                v-for="dia in diasDaSemana"
                :key="`total-${dia.data}`"
                class="table-cell text-center"
              >
                <span
                  :class="[
                    'inline-flex items-center justify-center min-w-[60px] px-3 py-1.5 rounded text-sm font-semibold',
                    getCapacityClass(getTotalLivreDia(dia.data))
                  ]"
                >
                  {{ getTotalLivreDia(dia.data) }}
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- Paginação -->
      <div v-if="fazendas.length > 0" class="p-3 sm:p-4 border-t border-border-light dark:border-border-dark text-xs text-subtext-light dark:text-subtext-dark">
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
            <span class="text-xs">{{ fazendas.length }} fazendas</span>
          </div>
          <div class="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto justify-center sm:justify-end">
            <button
              @click="currentPage--; pageInput = currentPage.toString()"
              :disabled="currentPage === 1"
              class="p-1 border border-border-light dark:border-border-dark rounded hover:bg-gray-50 dark:hover:bg-gray-800 bg-white dark:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span class="material-icons text-sm">chevron_left</span>
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
              @click="currentPage++; pageInput = currentPage.toString()"
              :disabled="currentPage === totalPages"
              class="p-1 border border-border-light dark:border-border-dark rounded hover:bg-gray-50 dark:hover:bg-gray-800 bg-white dark:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span class="material-icons text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="!loading" class="text-center py-12">
        <span class="material-icons-outlined text-4xl text-gray-300 dark:text-gray-600 mb-2">agriculture</span>
        <h3 class="text-lg font-medium text-text-light dark:text-text-dark mb-1">Nenhuma fazenda encontrada</h3>
        <p class="text-sm text-subtext-light dark:text-subtext-dark">Cadastre fazendas para visualizar a capacidade</p>
      </div>

      <!-- Legenda -->
      <div class="p-4 border-t border-border-light dark:border-border-dark">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div class="flex flex-wrap items-center gap-6 text-xs">
            <span class="text-subtext-light dark:text-subtext-dark font-medium">Legenda:</span>
            <div class="flex items-center gap-2">
              <span class="inline-block w-4 h-4 rounded bg-green-500"></span>
              <span class="text-subtext-light dark:text-subtext-dark">Disponível</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="inline-block w-4 h-4 rounded bg-yellow-500"></span>
              <span class="text-subtext-light dark:text-subtext-dark">Lotada (0)</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="inline-block w-4 h-4 rounded bg-red-500"></span>
              <span class="text-subtext-light dark:text-subtext-dark">Excedida (negativo)</span>
            </div>
          </div>
          <span class="text-xs text-subtext-light dark:text-subtext-dark italic">* Valores em unidades</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useCurrentCompany } from '~/composables/useCurrentCompany'

interface Fazenda {
  id: string
  codigo?: string
  nome: string
  capacidade: number // Capacidade em UNIDADES (calculado: unidades_por_bandeja * andares * bandejas_por_andar)
  ativo: boolean
}

interface Producao {
  id: string
  fazenda_id: string
  data_semeadura: string
  data_colheita_prevista: string
  quantidade_bandeja: number
  status: string
}

const supabase = useSupabaseClient()
const { currentCompany } = useCurrentCompany()

// Estado
const fazendas = ref<Fazenda[]>([])
const producoes = ref<Producao[]>([])
const loading = ref(false)

// Paginação
const itemsPerPage = ref(10)
const currentPage = ref(1)
const pageInput = ref('1')

// Data atual - com persistência em localStorage
const hoje = new Date()
const defaultMonth = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`

// Recuperar filtros salvos do localStorage (com validação)
const savedMonthRaw = typeof window !== 'undefined' ? localStorage.getItem('capacidade-fazendas-month') : null
const savedMonth = savedMonthRaw && /^\d{4}-\d{2}$/.test(savedMonthRaw) && parseInt(savedMonthRaw.split('-')[0]) >= 2000 && parseInt(savedMonthRaw.split('-')[0]) <= 2100
  ? savedMonthRaw
  : null
const savedSemana = typeof window !== 'undefined' ? localStorage.getItem('capacidade-fazendas-semana') : null

const selectedMonth = ref(savedMonth || defaultMonth)
const selectedSemana = ref(savedSemana ? parseInt(savedSemana) : 1)
const showMonthPicker = ref(false)
const hoveredSemana = ref<number | null>(null)
const pickerYear = ref(parseInt(selectedMonth.value.split('-')[0]))

const mesesNomes = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

// Mês formatado para exibição
const mesFormatado = computed(() => {
  const [ano, mes] = selectedMonth.value.split('-').map(Number)
  const data = new Date(ano, mes - 1, 1)
  const m = data.toLocaleDateString('pt-BR', { month: 'long' })
  return `${m} ${ano}`
})

// Semana atualmente selecionada
const semanaAtual = computed(() => {
  return semanas.value.find(s => s.numero === selectedSemana.value)
})

function isCurrentMonth(monthIdx: number): boolean {
  const [ano, mes] = selectedMonth.value.split('-').map(Number)
  return pickerYear.value === ano && monthIdx === mes - 1
}

function selectMonth(monthIdx: number) {
  selectedMonth.value = `${pickerYear.value}-${String(monthIdx + 1).padStart(2, '0')}`
  showMonthPicker.value = false
}

// Mini calendário para tooltip da semana
const miniCalendario = computed(() => {
  const [ano, mes] = selectedMonth.value.split('-').map(Number)
  const primeiroDia = new Date(ano, mes - 1, 1)
  const ultimoDia = new Date(ano, mes, 0)

  // Dias da semana hovered
  const semanaHovered = semanas.value.find(s => s.numero === hoveredSemana.value)
  if (!semanaHovered) return []

  // Calcular datas de início/fim da semana hovered
  const diaDaSemana = primeiroDia.getDay()
  const offsetParaSegunda = diaDaSemana === 0 ? -6 : 1 - diaDaSemana
  const primeiraSegunda = new Date(primeiroDia)
  primeiraSegunda.setDate(primeiroDia.getDate() + offsetParaSegunda)

  const inicioSemanaDate = new Date(primeiraSegunda)
  inicioSemanaDate.setDate(primeiraSegunda.getDate() + (hoveredSemana.value! - 1) * 7)
  const fimSemanaDate = new Date(inicioSemanaDate)
  fimSemanaDate.setDate(inicioSemanaDate.getDate() + 6)

  const inicioStr = inicioSemanaDate.toISOString().split('T')[0]
  const fimStr = fimSemanaDate.toISOString().split('T')[0]

  // Primeira segunda-feira do grid (pode ser do mês anterior)
  const primeiraCelula = new Date(primeiroDia)
  const dow = primeiraCelula.getDay()
  const offset = dow === 0 ? -6 : 1 - dow
  primeiraCelula.setDate(primeiraCelula.getDate() + offset)

  const dias = []
  const totalCelulas = 42 // 6 semanas x 7 dias
  for (let i = 0; i < totalCelulas; i++) {
    const d = new Date(primeiraCelula)
    d.setDate(primeiraCelula.getDate() + i)
    const dStr = d.toISOString().split('T')[0]
    dias.push({
      numero: d.getDate(),
      foraDoMes: d.getMonth() !== mes - 1,
      destaque: dStr >= inicioStr && dStr <= fimStr
    })
  }

  // Cortar linhas vazias no final (se último dia do mês cai antes da 6ª semana)
  while (dias.length > 35 && dias.slice(-7).every(d => d.foraDoMes)) {
    dias.splice(-7)
  }

  return dias
})

// Computed - semanas do mês
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

// Computed - totais (em UNIDADES)
const capacidadeTotal = computed(() => {
  return fazendas.value.reduce((sum, f) => sum + (f.capacidade || 0), 0)
})

// Ocupação semanal (semana selecionada)
const ocupacaoSemanal = computed(() => {
  if (fazendas.value.length === 0 || capacidadeTotal.value === 0) return 0

  let totalOcupacao = 0
  let totalCapacidade = 0

  fazendas.value.forEach(fazenda => {
    diasDaSemana.value.forEach(dia => {
      const livre = getCapacidadeLivre(fazenda, dia.data)
      const ocupada = (fazenda.capacidade || 0) - livre
      totalOcupacao += ocupada
      totalCapacidade += fazenda.capacidade || 0
    })
  })

  if (totalCapacidade === 0) return 0
  return Math.round((totalOcupacao / totalCapacidade) * 100)
})

// Ocupação mensal (média de todas as semanas do mês)
const ocupacaoMensal = computed(() => {
  if (fazendas.value.length === 0 || capacidadeTotal.value === 0) return 0

  const [ano, mes] = selectedMonth.value.split('-').map(Number)
  const primeiroDia = new Date(ano, mes - 1, 1)
  const ultimoDia = new Date(ano, mes, 0)
  const totalDiasMes = ultimoDia.getDate()

  let totalOcupacao = 0
  let totalCapacidade = 0

  for (let d = 1; d <= totalDiasMes; d++) {
    const dataStr = `${ano}-${String(mes).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    fazendas.value.forEach(fazenda => {
      const livre = getCapacidadeLivre(fazenda, dataStr)
      const ocupada = (fazenda.capacidade || 0) - livre
      totalOcupacao += ocupada
      totalCapacidade += fazenda.capacidade || 0
    })
  }

  if (totalCapacidade === 0) return 0
  return Math.round((totalOcupacao / totalCapacidade) * 100)
})

// Paginação computed
const totalPages = computed(() => Math.ceil(fazendas.value.length / itemsPerPage.value) || 1)

const paginatedFazendas = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  return fazendas.value.slice(start, start + itemsPerPage.value)
})

// Funções auxiliares
function getCapacidadeLivre(fazenda: Fazenda, data: string): number {
  // Capacidade em UNIDADES (plantas)
  const capacidade = fazenda.capacidade || 0

  // Somar todas as produções ativas para a fazenda nesta data
  // NOTA: quantidade_bandeja na verdade armazena UNIDADES (apesar do nome confuso)
  const ocupado = producoes.value
    .filter(p => {
      if (p.fazenda_id !== fazenda.id) return false
      if (['colhido', 'finalizado', 'cancelado'].includes(p.status)) return false

      // A produção ocupa espaço desde a semeadura até a colheita
      const semeadura = p.data_semeadura
      const colheita = p.data_colheita_prevista || p.data_semeadura

      return data >= semeadura && data <= colheita
    })
    .reduce((sum, p) => sum + (p.quantidade_bandeja || 0), 0)

  return capacidade - ocupado
}

function getTotalLivreDia(data: string): number {
  return fazendas.value.reduce((sum, fazenda) => {
    return sum + getCapacidadeLivre(fazenda, data)
  }, 0)
}

function getCapacityClass(value: number): string {
  if (value === undefined || value === null) {
    return 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
  }
  if (value > 0) {
    return 'bg-green-500 text-white'
  }
  if (value === 0) {
    return 'bg-yellow-500 text-white'
  }
  return 'bg-red-500 text-white'
}

// Função de paginação
function goToPage() {
  const page = parseInt(pageInput.value)
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
  pageInput.value = currentPage.value.toString()
}

// CRUD
async function loadFazendas() {
  if (!currentCompany.value?.id) return

  try {
    const { data, error } = await supabase
      .from('fazendas')
      .select('id, codigo, nome, capacidade, status')
      .eq('empresa_id', currentCompany.value.id)
      .eq('status', 'active')
      .order('codigo')

    if (error) throw error
    fazendas.value = data || []
  } catch (e: any) {
    console.error('Erro ao carregar fazendas:', e)
  }
}

async function loadProducoes() {
  if (!currentCompany.value?.id) return

  loading.value = true
  try {
    // Calcular range de datas baseado no mês
    const [ano, mes] = selectedMonth.value.split('-').map(Number)
    const primeiroDia = new Date(ano, mes - 1, 1)
    const ultimoDia = new Date(ano, mes, 0)

    // Expandir range para incluir semanas completas e produções que atravessam o período
    const diaDaSemana = primeiroDia.getDay()
    const offsetParaSegunda = diaDaSemana === 0 ? -6 : 1 - diaDaSemana
    primeiroDia.setDate(primeiroDia.getDate() + offsetParaSegunda - 30) // 30 dias antes para pegar produções em andamento
    ultimoDia.setDate(ultimoDia.getDate() + 14)

    const dataInicio = primeiroDia.toISOString().split('T')[0]
    const dataFim = ultimoDia.toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('producao')
      .select('id, fazenda_id, data_semeadura, data_colheita_prevista, quantidade_bandeja, status')
      .eq('empresa_id', currentCompany.value.id)
      .or(`data_semeadura.gte.${dataInicio},data_colheita_prevista.gte.${dataInicio}`)
      .or(`data_semeadura.lte.${dataFim},data_colheita_prevista.lte.${dataFim}`)
      .in('status', ['planejado', 'germinando', 'vegetacao', 'colhendo'])

    if (error) throw error
    producoes.value = data || []
  } catch (e: any) {
    console.error('Erro ao carregar produções:', e)
  } finally {
    loading.value = false
  }
}

// Watch
watch(() => currentCompany.value?.id, (newId) => {
  if (newId) {
    loadFazendas()
    loadProducoes()
  }
}, { immediate: true })

watch(selectedMonth, (newMonth) => {
  selectedSemana.value = 1
  pickerYear.value = parseInt(newMonth.split('-')[0])
  loadProducoes()
  // Salvar no localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem('capacidade-fazendas-month', newMonth)
    localStorage.setItem('capacidade-fazendas-semana', '1')
  }
})

watch(selectedSemana, (newSemana) => {
  // Salvar no localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem('capacidade-fazendas-semana', newSemana.toString())
  }
})

watch(itemsPerPage, () => {
  currentPage.value = 1
  pageInput.value = '1'
})

// Fechar month picker ao clicar fora
function handleClickOutside(e: MouseEvent) {
  if (showMonthPicker.value && !(e.target as HTMLElement).closest('.relative')) {
    showMonthPicker.value = false
  }
}

// Lifecycle
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  if (currentCompany.value?.id) {
    loadFazendas()
    loadProducoes()
  }
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
