<template>
  <div>
    <h1 class="text-2xl font-bold text-text-light dark:text-text-dark mb-6">Capacidade Livre das Fazendas</h1>

    <!-- Card Principal -->
    <div class="card">
      <!-- Header com Filtros -->
      <div class="p-4 border-b border-border-light dark:border-border-dark">
        <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <!-- Seletor de Mês/Ano -->
          <div>
            <label class="block text-xs text-subtext-light dark:text-subtext-dark mb-1">Período</label>
            <input
              v-model="selectedMonth"
              type="month"
              class="input w-44"
            />
          </div>

          <!-- Navegação de Semanas -->
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-sm text-subtext-light dark:text-subtext-dark mr-2">Semana:</span>
            <button
              v-for="semana in semanas"
              :key="semana.numero"
              @click="selectedSemana = semana.numero"
              :class="[
                'px-4 py-2 text-sm font-medium rounded-md transition-colors',
                selectedSemana === semana.numero
                  ? 'bg-primary text-white'
                  : 'bg-white dark:bg-gray-800 text-text-light dark:text-text-dark border border-border-light dark:border-border-dark hover:bg-gray-100 dark:hover:bg-gray-700'
              ]"
            >
              Semana {{ semana.numero.toString().padStart(2, '0') }}
              <span class="text-xs opacity-70 ml-1">({{ semana.inicio }} - {{ semana.fim }})</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Resumo -->
      <div class="p-4 border-b border-border-light dark:border-border-dark bg-gray-50/50 dark:bg-gray-800/30">
        <div class="flex flex-wrap gap-6">
          <div>
            <span class="text-xs text-subtext-light dark:text-subtext-dark">Total Fazendas</span>
            <p class="text-lg font-semibold text-text-light dark:text-text-dark">{{ fazendas.length }}</p>
          </div>
          <div>
            <span class="text-xs text-subtext-light dark:text-subtext-dark">Capacidade Total</span>
            <p class="text-lg font-semibold text-primary">{{ capacidadeTotal.toLocaleString('pt-BR') }} unidades</p>
          </div>
          <div>
            <span class="text-xs text-subtext-light dark:text-subtext-dark">Ocupação Média</span>
            <p class="text-lg font-semibold text-text-light dark:text-text-dark">{{ ocupacaoMedia }}%</p>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="p-8 text-center">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
        <p class="mt-2 text-subtext-light dark:text-subtext-dark">Carregando capacidade...</p>
      </div>

      <!-- Tabela de Capacidade -->
      <div v-else-if="fazendas.length > 0" class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-50 dark:bg-gray-800 border-b border-border-light dark:border-border-dark">
              <th class="table-header sticky left-0 bg-gray-50 dark:bg-gray-800 z-10 min-w-[120px]">Fazenda</th>
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
import { ref, computed, watch, onMounted } from 'vue'
import { useCurrentCompany } from '~/composables/useCurrentCompany'

interface Fazenda {
  id: string
  codigo?: string
  nome: string
  capacidade: number // Capacidade em UNIDADES (calculado: unidades_por_bandeja * andares * bandejas_por_andar)
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

// Recuperar filtros salvos do localStorage
const savedMonth = typeof window !== 'undefined' ? localStorage.getItem('capacidade-fazendas-month') : null
const savedSemana = typeof window !== 'undefined' ? localStorage.getItem('capacidade-fazendas-semana') : null

const selectedMonth = ref(savedMonth || defaultMonth)
const selectedSemana = ref(savedSemana ? parseInt(savedSemana) : 1)

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

const ocupacaoMedia = computed(() => {
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
      .select('id, codigo, nome, capacidade')
      .eq('empresa_id', currentCompany.value.id)
      .eq('ativo', true)
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

// Lifecycle
onMounted(() => {
  if (currentCompany.value?.id) {
    loadFazendas()
    loadProducoes()
  }
})
</script>
