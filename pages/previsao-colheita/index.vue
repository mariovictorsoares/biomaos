<template>
  <div>
    <h1 class="text-2xl font-bold text-text-light dark:text-text-dark mb-6">Previsão de Colheita</h1>

    <!-- Card da Tabela -->
    <div class="card">
      <!-- Header do Card -->
      <div class="p-4 flex flex-col sm:flex-row justify-between items-center border-b border-border-light dark:border-border-dark gap-4">
        <h2 class="text-sm font-medium text-subtext-light dark:text-subtext-dark uppercase tracking-wider self-start sm:self-center">Previsão Semanal</h2>
        <div class="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <!-- Seletor de Mês/Ano -->
          <div class="relative">
            <input
              type="month"
              v-model="selectedMonth"
              class="input w-44"
            />
          </div>
        </div>
      </div>

      <!-- Filtros - Semanas -->
      <div class="p-4 border-b border-border-light dark:border-border-dark bg-gray-50 dark:bg-gray-800/50">
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

      <!-- Resumo -->
      <div class="p-4 border-b border-border-light dark:border-border-dark bg-gray-50/50 dark:bg-gray-800/30">
        <div class="flex flex-wrap gap-6">
          <div>
            <span class="text-xs text-subtext-light dark:text-subtext-dark">Total Espécies</span>
            <p class="text-lg font-semibold text-text-light dark:text-text-dark">{{ filteredEspecies.length }}</p>
          </div>
          <div>
            <span class="text-xs text-subtext-light dark:text-subtext-dark">Total Previsto</span>
            <p class="text-lg font-semibold text-primary">{{ getTotalGeral() }} unidades</p>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="p-8 text-center">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
        <p class="mt-2 text-subtext-light dark:text-subtext-dark">Carregando previsão...</p>
      </div>

      <!-- Tabela -->
      <div v-else-if="filteredEspecies.length > 0" class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-50 dark:bg-gray-800 border-b border-border-light dark:border-border-dark">
              <th class="table-header sticky left-0 bg-gray-50 dark:bg-gray-800 z-10">Espécie</th>
              <th
                v-for="dia in diasDaSemana"
                :key="dia.data"
                class="table-header text-center min-w-[100px]"
              >
                <div>{{ dia.dataFormatada }}</div>
                <div class="text-[10px] font-normal text-subtext-light dark:text-subtext-dark">{{ dia.diaSemana }}</div>
              </th>
              <th class="table-header text-center bg-gray-100 dark:bg-gray-700 min-w-[100px]">Total</th>
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
                  class="text-text-light dark:text-text-dark"
                >
                  {{ getValorColheita(especie.id, dia.data) }}
                </span>
                <span v-else class="text-gray-300 dark:text-gray-600">0</span>
              </td>
              <td class="table-cell text-center bg-gray-50 dark:bg-gray-800/50 font-semibold">
                {{ getTotalSemana(especie.id) }}
              </td>
            </tr>
          </tbody>
          <!-- Footer com totais -->
          <tfoot class="border-t-2 border-border-light dark:border-border-dark">
            <tr class="bg-gray-100 dark:bg-gray-800">
              <td class="table-cell font-bold sticky left-0 bg-gray-100 dark:bg-gray-800 z-10">
                Total Microverdes:
              </td>
              <td
                v-for="dia in diasDaSemana"
                :key="dia.data"
                class="table-cell text-center font-semibold"
              >
                {{ getTotalDia(dia.data) }}
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

      <!-- Paginação -->
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
              @click="currentPage++"
              :disabled="currentPage === totalPages"
              class="p-1 border border-border-light dark:border-border-dark rounded hover:bg-gray-50 dark:hover:bg-gray-800 bg-white dark:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span class="material-icons text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useCurrentCompany } from '~/composables/useCurrentCompany'

interface Especie {
  id: string
  codigo: string
  nome: string
}

interface Producao {
  id: string
  especie_id: string
  data_colheita_prevista: string
  quantidade_bandeja: number
  status: string
}

const supabase = useSupabaseClient()
const { currentCompany } = useCurrentCompany()

// Estado
const especies = ref<Especie[]>([])
const producoes = ref<Producao[]>([])
const loading = ref(false)

// Recuperar filtros salvos do localStorage
const hoje = new Date()
const defaultMonth = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`

const savedMonth = typeof window !== 'undefined' ? localStorage.getItem('previsao-colheita-month') : null
const savedSemana = typeof window !== 'undefined' ? localStorage.getItem('previsao-colheita-semana') : null
const savedItemsPerPage = typeof window !== 'undefined' ? localStorage.getItem('previsao-colheita-items-per-page') : null

const selectedMonth = ref(savedMonth || defaultMonth)
const selectedSemana = ref(savedSemana ? parseInt(savedSemana) : 1)

// Paginação
const currentPage = ref(1)
const itemsPerPage = ref(savedItemsPerPage ? parseInt(savedItemsPerPage) : 10)
const pageInput = ref('1')

// Funções para salvar filtros no localStorage
function saveFiltersToStorage() {
  if (typeof window !== 'undefined') {
    localStorage.setItem('previsao-colheita-month', selectedMonth.value)
    localStorage.setItem('previsao-colheita-semana', selectedSemana.value.toString())
    localStorage.setItem('previsao-colheita-items-per-page', itemsPerPage.value.toString())
  }
}

// Computed - semanas do mês
const semanas = computed(() => {
  const [ano, mes] = selectedMonth.value.split('-').map(Number)
  const primeiroDia = new Date(ano, mes - 1, 1)
  const ultimoDia = new Date(ano, mes, 0)

  // Encontrar primeira segunda-feira
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

// Computed - mostrar todas as espécies ativas (como no sistema original)
const filteredEspecies = computed(() => {
  return especies.value
})

// Paginação
const totalPages = computed(() => {
  return Math.ceil(filteredEspecies.value.length / itemsPerPage.value) || 1
})

const paginatedEspecies = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredEspecies.value.slice(start, end)
})

// Funções auxiliares
function getValorColheita(especieId: string, data: string) {
  return producoes.value
    .filter(p => p.especie_id === especieId && p.data_colheita_prevista === data && p.status !== 'finalizado' && p.status !== 'cancelado')
    .reduce((sum, p) => sum + (p.quantidade_bandeja || 0), 0)
}

function getTotalSemana(especieId: string) {
  return diasDaSemana.value.reduce((total, dia) => {
    return total + getValorColheita(especieId, dia.data)
  }, 0)
}

function getTotalDia(data: string) {
  // Soma de todas as espécies para o dia
  return filteredEspecies.value.reduce((total, especie) => {
    return total + getValorColheita(especie.id, data)
  }, 0)
}

function getTotalGeral() {
  // Soma geral da semana (todas as espécies)
  return filteredEspecies.value.reduce((total, especie) => {
    return total + getTotalSemana(especie.id)
  }, 0)
}

// Função para ir para página específica
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
    console.error('Erro ao carregar espécies:', e)
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

    // Expandir range para incluir semanas completas
    const diaDaSemana = primeiroDia.getDay()
    const offsetParaSegunda = diaDaSemana === 0 ? -6 : 1 - diaDaSemana
    primeiroDia.setDate(primeiroDia.getDate() + offsetParaSegunda)
    ultimoDia.setDate(ultimoDia.getDate() + 7)

    const dataInicio = primeiroDia.toISOString().split('T')[0]
    const dataFim = ultimoDia.toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('producao')
      .select('id, especie_id, data_colheita_prevista, quantidade_bandeja, status')
      .eq('empresa_id', currentCompany.value.id)
      .gte('data_colheita_prevista', dataInicio)
      .lte('data_colheita_prevista', dataFim)
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
    loadEspecies()
    loadProducoes()
  }
}, { immediate: true })

watch(selectedMonth, () => {
  selectedSemana.value = 1
  currentPage.value = 1
  pageInput.value = '1'
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
  // Validar se a semana salva é válida para o mês atual
  // (a semana pode não existir se o mês mudou)
  if (semanas.value.length > 0 && selectedSemana.value > semanas.value.length) {
    selectedSemana.value = 1
    saveFiltersToStorage()
  }

  if (currentCompany.value?.id) {
    loadEspecies()
    loadProducoes()
  }
})
</script>
