<template>
  <div>
    <!-- Toolbar (fora do card) -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-4 mb-4">
      <!-- Esquerda: Filtros -->
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
        <!-- Data Inicial -->
        <div class="flex items-center gap-2">
          <span class="text-xs text-subtext-light dark:text-subtext-dark hidden sm:inline">De</span>
          <input
            type="date"
            v-model="filterDataInicial"
            class="input text-sm w-full sm:w-auto shrink-0"
          />
        </div>
        <!-- Data Final -->
        <div class="flex items-center gap-2">
          <span class="text-xs text-subtext-light dark:text-subtext-dark hidden sm:inline">Até</span>
          <input
            type="date"
            v-model="filterDataFinal"
            class="input text-sm w-full sm:w-auto shrink-0"
          />
        </div>
        <!-- Filtro Status -->
        <select v-model="filterStatus" class="input text-sm w-full sm:w-auto shrink-0">
          <option value="">Todos status</option>
          <option value="pendente">Pendente</option>
          <option value="parcial">Parcial</option>
          <option value="concluida">Concluída</option>
        </select>
      </div>
    </div>

    <!-- Card Principal -->
    <div class="card">

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-16">
        <span class="material-icons text-5xl text-gray-300 dark:text-gray-600 animate-spin">refresh</span>
        <p class="text-sm text-subtext-light dark:text-subtext-dark mt-3">Carregando colheitas...</p>
      </div>

      <!-- Tabela - Desktop -->
      <div v-if="!loading && filteredColheitas.length > 0" class="hidden md:block overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-100 dark:bg-gray-700/50 border-b border-border-light dark:border-border-dark">
              <th class="table-header">Data Colheita</th>
              <th class="table-header text-center">Bandejas Total</th>
              <th class="table-header text-center">Espécies</th>
              <th class="table-header text-center">Pedidos</th>
              <th class="table-header text-center w-32">Status</th>
              <th class="table-header text-center w-16"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-light dark:divide-border-dark">
            <tr
              v-for="colheita in paginatedColheitas"
              :key="colheita.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
              @click="openDetalhes(colheita)"
            >
              <td class="table-cell font-medium text-text-light dark:text-text-dark">
                {{ formatDate(colheita.data_colheita) }}
              </td>
              <td class="table-cell text-center text-subtext-light dark:text-subtext-dark">
                {{ formatNumber(getTotalBandejas(colheita)) }}
              </td>
              <td class="table-cell text-center text-subtext-light dark:text-subtext-dark">
                {{ getEspeciesCount(colheita) }}
              </td>
              <td class="table-cell text-center text-subtext-light dark:text-subtext-dark">
                {{ colheita._pedidosCount ?? '-' }}
              </td>
              <td class="table-cell text-center">
                <span :class="getStatusBadgeClass(colheita.status)">
                  {{ getStatusLabel(colheita.status) }}
                </span>
              </td>
              <td class="table-cell text-center" @click.stop>
                <button
                  @click="openDetalhes(colheita)"
                  class="text-gray-400 hover:text-primary dark:text-gray-500 dark:hover:text-primary transition-colors"
                  title="Ver detalhes"
                >
                  <span class="material-icons-outlined text-xl">chevron_right</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Cards - Mobile -->
      <div v-if="!loading && filteredColheitas.length > 0" class="md:hidden divide-y divide-border-light dark:divide-border-dark">
        <div
          v-for="colheita in paginatedColheitas"
          :key="colheita.id"
          class="p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
          @click="openDetalhes(colheita)"
        >
          <div class="flex items-center gap-3">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <span class="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                  {{ formatDate(colheita.data_colheita) }}
                </span>
                <span :class="getStatusBadgeClass(colheita.status)" class="text-[10px] px-1.5 py-0.5">
                  {{ getStatusLabel(colheita.status) }}
                </span>
              </div>
              <p class="text-sm text-text-light dark:text-text-dark">
                {{ formatNumber(getTotalBandejas(colheita)) }} bandejas · {{ getEspeciesCount(colheita) }} espécies
              </p>
              <p class="text-xs text-subtext-light dark:text-subtext-dark mt-0.5">
                {{ colheita._pedidosCount ?? 0 }} pedidos vinculados
              </p>
            </div>
            <button
              @click.stop="openDetalhes(colheita)"
              class="text-gray-400 hover:text-primary transition-colors shrink-0"
            >
              <span class="material-icons-outlined text-xl">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="!loading && filteredColheitas.length === 0" class="text-center py-12 flex flex-col items-center px-4">
        <span class="material-icons-outlined text-4xl text-gray-300 dark:text-gray-600 mb-2">grass</span>
        <h3 class="text-lg font-medium text-text-light dark:text-text-dark mb-1">Nenhuma colheita encontrada</h3>
        <p class="text-sm text-subtext-light dark:text-subtext-dark mb-4">
          {{ hasActiveFilters ? 'Tente ajustar os filtros' : 'Nenhuma colheita programada' }}
        </p>
      </div>

      <!-- Paginacao -->
      <div v-if="filteredColheitas.length > 0" class="p-3 sm:p-4 border-t border-border-light dark:border-border-dark text-xs text-subtext-light dark:text-subtext-dark">
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
            <span class="text-xs">{{ filteredColheitas.length }} registros</span>
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

    <!-- Slideover de Detalhes -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-300 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-200 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="showDetalhes" class="fixed inset-0 z-50 overflow-hidden">
          <div class="fixed inset-0 glass-backdrop" @click="closeDetalhes"></div>

          <div class="fixed inset-y-0 right-0 flex max-w-full">
            <Transition
              enter-active-class="transform transition-transform duration-300 ease-out"
              enter-from-class="translate-x-full"
              enter-to-class="translate-x-0"
              leave-active-class="transform transition-transform duration-200 ease-in"
              leave-from-class="translate-x-0"
              leave-to-class="translate-x-full"
            >
              <div v-if="showDetalhes" class="w-screen max-w-full sm:max-w-2xl">
                <div class="h-full flex flex-col glass-panel shadow-2xl">
                  <!-- Header -->
                  <div class="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100 dark:border-border-dark flex items-center justify-between gap-3">
                    <div class="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                      <div class="w-10 h-10 sm:w-14 sm:h-14 rounded-xl bg-primary/10 flex items-center justify-center text-sm sm:text-lg font-bold text-primary shrink-0">
                        <span class="material-icons-outlined text-xl sm:text-2xl">grass</span>
                      </div>
                      <div class="min-w-0 flex-1">
                        <h2 class="text-base sm:text-lg font-semibold text-gray-900 dark:text-text-dark">
                          Colheita {{ formatDate(selectedColheita?.data_colheita) }}
                        </h2>
                        <p class="text-xs sm:text-sm text-gray-500 dark:text-subtext-dark">
                          <span :class="getStatusBadgeClass(selectedColheita?.status)">
                            {{ getStatusLabel(selectedColheita?.status) }}
                          </span>
                        </p>
                      </div>
                    </div>
                    <button @click="closeDetalhes" class="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shrink-0">
                      <span class="material-icons text-xl">close</span>
                    </button>
                  </div>

                  <!-- Body -->
                  <div class="flex-1 overflow-y-auto">
                    <div class="p-4 sm:p-6 space-y-5 sm:space-y-6">

                      <!-- Summary Cards -->
                      <div class="grid grid-cols-3 gap-3">
                        <div class="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 sm:p-4 text-center">
                          <p class="text-xs text-gray-500 dark:text-subtext-dark mb-1">Total Bandejas</p>
                          <p class="text-lg sm:text-xl font-bold text-text-light dark:text-text-dark">
                            {{ formatNumber(summaryBandejas) }}
                          </p>
                        </div>
                        <div class="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 sm:p-4 text-center">
                          <p class="text-xs text-gray-500 dark:text-subtext-dark mb-1">Rendimento Esperado</p>
                          <p class="text-lg sm:text-xl font-bold text-text-light dark:text-text-dark">
                            {{ formatNumber(summaryRendimento) }}g
                          </p>
                        </div>
                        <div class="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 sm:p-4 text-center">
                          <p class="text-xs text-gray-500 dark:text-subtext-dark mb-1">Total Excedente</p>
                          <p class="text-lg sm:text-xl font-bold text-text-light dark:text-text-dark">
                            {{ formatNumber(summaryExcedente) }}g
                          </p>
                        </div>
                      </div>

                      <!-- Notas -->
                      <div v-if="selectedColheita?.notas" class="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-3 sm:p-4">
                        <div class="flex items-start gap-2">
                          <span class="material-icons text-sm text-yellow-600 mt-0.5">note</span>
                          <p class="text-sm text-yellow-800 dark:text-yellow-300">{{ selectedColheita.notas }}</p>
                        </div>
                      </div>

                      <!-- Itens por Especie -->
                      <div>
                        <div class="flex items-center gap-2 mb-4">
                          <h3 class="text-sm font-semibold text-gray-900 dark:text-text-dark">Espécies</h3>
                          <span class="text-xs text-gray-500 dark:text-subtext-dark bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                            {{ detalheItens.length }}
                          </span>
                        </div>

                        <div v-if="loadingDetalhes" class="text-center py-8">
                          <span class="material-icons text-2xl text-gray-300 animate-spin">refresh</span>
                        </div>

                        <div v-else-if="detalheItens.length === 0" class="text-center py-8 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                          <span class="material-icons-outlined text-3xl text-gray-300 dark:text-gray-600 mb-2">inventory_2</span>
                          <p class="text-sm text-gray-500 dark:text-subtext-dark">Nenhum item nesta colheita</p>
                        </div>

                        <div v-else class="space-y-2">
                          <div
                            v-for="item in detalheItens"
                            :key="item.id"
                            class="p-3 sm:p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50"
                          >
                            <div class="flex items-center justify-between mb-2">
                              <div class="flex items-center gap-2">
                                <span class="material-icons text-sm text-primary">eco</span>
                                <span class="text-sm font-medium text-gray-900 dark:text-text-dark">
                                  {{ item.especies?.nome || 'Espécie não identificada' }}
                                </span>
                              </div>
                              <button
                                v-if="!item.colhido"
                                @click="marcarColhido(item)"
                                :disabled="savingItemId === item.id"
                                class="text-xs px-3 py-1.5 rounded-lg bg-[#4A7C59] text-white hover:bg-[#3d6a4a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                              >
                                <span v-if="savingItemId === item.id" class="material-icons text-xs animate-spin">refresh</span>
                                <span class="material-icons text-xs" v-else>check</span>
                                Marcar Colhido
                              </button>
                              <span v-else class="text-xs px-3 py-1.5 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 flex items-center gap-1">
                                <span class="material-icons text-xs">check_circle</span>
                                Colhido
                              </span>
                            </div>
                            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                              <div>
                                <p class="text-[10px] text-gray-500 dark:text-subtext-dark">Bandejas</p>
                                <p class="text-sm font-medium text-gray-900 dark:text-text-dark">{{ formatNumber(item.bandejas || 0) }}</p>
                              </div>
                              <div>
                                <p class="text-[10px] text-gray-500 dark:text-subtext-dark">Rendimento Esperado</p>
                                <p class="text-sm font-medium text-gray-900 dark:text-text-dark">{{ formatNumber(item.rendimento_esperado_g || 0) }}g</p>
                              </div>
                              <div>
                                <p class="text-[10px] text-gray-500 dark:text-subtext-dark">Peso Necessário</p>
                                <p class="text-sm font-medium text-gray-900 dark:text-text-dark">{{ formatNumber(item.peso_necessario_g || 0) }}g</p>
                              </div>
                              <div>
                                <p class="text-[10px] text-gray-500 dark:text-subtext-dark">Excedente</p>
                                <p class="text-sm font-medium text-gray-900 dark:text-text-dark">{{ formatNumber(item.excedente_g || 0) }}g</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <!-- Pack List -->
                      <div>
                        <div class="flex items-center gap-2 mb-4">
                          <h3 class="text-sm font-semibold text-gray-900 dark:text-text-dark">Pack List</h3>
                          <span class="text-xs text-gray-500 dark:text-subtext-dark bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                            {{ packList.length }}
                          </span>
                        </div>

                        <div v-if="loadingPackList" class="text-center py-8">
                          <span class="material-icons text-2xl text-gray-300 animate-spin">refresh</span>
                        </div>

                        <div v-else-if="packList.length === 0" class="text-center py-8 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                          <span class="material-icons-outlined text-3xl text-gray-300 dark:text-gray-600 mb-2">local_shipping</span>
                          <p class="text-sm text-gray-500 dark:text-subtext-dark">Nenhum pedido vinculado a esta colheita</p>
                        </div>

                        <div v-else class="overflow-x-auto">
                          <table class="w-full text-left border-collapse">
                            <thead>
                              <tr class="bg-gray-100 dark:bg-gray-700/50 border-b border-border-light dark:border-border-dark">
                                <th class="px-3 py-2 text-xs font-medium text-subtext-light dark:text-subtext-dark">Pedido</th>
                                <th class="px-3 py-2 text-xs font-medium text-subtext-light dark:text-subtext-dark">Cliente</th>
                                <th class="px-3 py-2 text-xs font-medium text-subtext-light dark:text-subtext-dark">Produto</th>
                                <th class="px-3 py-2 text-xs font-medium text-subtext-light dark:text-subtext-dark text-center">Quantidade</th>
                              </tr>
                            </thead>
                            <tbody class="divide-y divide-border-light dark:divide-border-dark">
                              <tr
                                v-for="(item, idx) in packList"
                                :key="idx"
                                class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                              >
                                <td class="px-3 py-2 text-xs font-medium text-primary">
                                  #{{ item.pedidoNumero || '-' }}
                                </td>
                                <td class="px-3 py-2 text-xs text-text-light dark:text-text-dark">
                                  {{ item.clienteNome || '-' }}
                                </td>
                                <td class="px-3 py-2 text-xs text-text-light dark:text-text-dark">
                                  {{ item.produtoNome || '-' }}
                                </td>
                                <td class="px-3 py-2 text-xs text-center text-text-light dark:text-text-dark">
                                  {{ formatNumber(item.quantidade || 0) }}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                    </div>
                  </div>

                  <!-- Footer -->
                  <div class="px-4 sm:px-6 py-4 border-t border-gray-100 dark:border-border-dark">
                    <button @click="closeDetalhes" class="w-full btn btn-primary justify-center">
                      <span class="material-icons text-sm">close</span>
                      Fechar
                    </button>
                  </div>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useCurrentCompany } from '~/composables/useCurrentCompany'

interface Especie {
  id: string
  nome: string
}

interface ColheitaItem {
  id: string
  colheita_id: string
  especie_id: string
  bandejas: number | null
  rendimento_esperado_g: number | null
  peso_necessario_g: number | null
  excedente_g: number | null
  colhido: boolean
  especies?: Especie
}

interface Colheita {
  id: string
  empresa_id: string
  data_colheita: string
  status: string
  notas: string | null
  colheita_itens?: ColheitaItem[]
  _pedidosCount?: number
}

interface PackListItem {
  pedidoNumero: string | null
  clienteNome: string | null
  produtoNome: string | null
  quantidade: number | null
}

const supabase = useSupabaseClient()
const { currentCompany } = useCurrentCompany()
const { success, error: showError } = useToast()

// Estado
const colheitas = ref<Colheita[]>([])
const loading = ref(false)
const loadingDetalhes = ref(false)
const loadingPackList = ref(false)
const savingItemId = ref<string | null>(null)

// Detalhes
const showDetalhes = ref(false)
const selectedColheita = ref<Colheita | null>(null)
const detalheItens = ref<ColheitaItem[]>([])
const packList = ref<PackListItem[]>([])

// Paginacao
const currentPage = ref(1)
const itemsPerPage = ref(10)
const pageInput = ref('1')

// Filtros
const filterDataInicial = ref('')
const filterDataFinal = ref('')
const filterStatus = ref('')

// Computed
const hasActiveFilters = computed(() => {
  return filterDataInicial.value || filterDataFinal.value || filterStatus.value
})

const filteredColheitas = computed(() => {
  let result = [...colheitas.value]

  // Filtro por data inicial
  if (filterDataInicial.value) {
    result = result.filter(c => c.data_colheita >= filterDataInicial.value)
  }

  // Filtro por data final
  if (filterDataFinal.value) {
    result = result.filter(c => c.data_colheita <= filterDataFinal.value)
  }

  // Filtro por status
  if (filterStatus.value) {
    result = result.filter(c => c.status === filterStatus.value)
  }

  // Ordenar por data_colheita decrescente
  result.sort((a, b) => new Date(b.data_colheita).getTime() - new Date(a.data_colheita).getTime())

  return result
})

const totalPages = computed(() => Math.ceil(filteredColheitas.value.length / itemsPerPage.value) || 1)

const paginatedColheitas = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  return filteredColheitas.value.slice(start, start + itemsPerPage.value)
})

// Summary cards (detalhe)
const summaryBandejas = computed(() => {
  return detalheItens.value.reduce((sum, item) => sum + (item.bandejas || 0), 0)
})

const summaryRendimento = computed(() => {
  return detalheItens.value.reduce((sum, item) => sum + (item.rendimento_esperado_g || 0), 0)
})

const summaryExcedente = computed(() => {
  return detalheItens.value.reduce((sum, item) => sum + (item.excedente_g || 0), 0)
})

// Watchers
watch([filterDataInicial, filterDataFinal, filterStatus], () => {
  currentPage.value = 1
  pageInput.value = '1'
})

watch(itemsPerPage, () => {
  currentPage.value = 1
  pageInput.value = '1'
})

watch(currentPage, (newVal) => {
  pageInput.value = String(newVal)
})

// Funcoes auxiliares
function goToPage() {
  const page = parseInt(pageInput.value)
  if (!isNaN(page) && page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  } else {
    pageInput.value = String(currentPage.value)
  }
}

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '-'
  return new Date(dateString + 'T00:00:00').toLocaleDateString('pt-BR')
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value)
}

function getTotalBandejas(colheita: Colheita): number {
  if (!colheita.colheita_itens) return 0
  return colheita.colheita_itens.reduce((sum, item) => sum + (item.bandejas || 0), 0)
}

function getEspeciesCount(colheita: Colheita): number {
  if (!colheita.colheita_itens) return 0
  return colheita.colheita_itens.length
}

function getStatusLabel(status: string | undefined): string {
  if (!status) return '-'
  const labels: Record<string, string> = {
    pendente: 'Pendente',
    parcial: 'Parcial',
    concluida: 'Concluída'
  }
  return labels[status] || status
}

function getStatusBadgeClass(status: string | undefined): string {
  if (!status) return 'badge badge-inactive'
  const classes: Record<string, string> = {
    pendente: 'badge badge-warning',
    parcial: 'badge badge-info',
    concluida: 'badge badge-success'
  }
  return classes[status] || 'badge badge-inactive'
}

// Carregar dados
async function loadColheitas() {
  if (!currentCompany.value?.id) {
    colheitas.value = []
    return
  }

  loading.value = true
  try {
    const { data, error } = await supabase
      .from('colheitas')
      .select('*, colheita_itens(*, especies(id, nome))')
      .eq('empresa_id', currentCompany.value.id)
      .order('data_colheita', { ascending: false })

    if (error) throw error
    colheitas.value = data || []

    // Carregar contagem de pedidos para cada colheita
    await loadPedidosCounts()
  } catch (e: any) {
    console.error('Erro ao carregar colheitas:', e)
    showError('Erro ao carregar colheitas')
  } finally {
    loading.value = false
  }
}

async function loadPedidosCounts() {
  // Para cada colheita, contar pedidos distintos via plantios
  for (const colheita of colheitas.value) {
    try {
      const { data, error } = await supabase
        .from('plantios')
        .select('pedido_itens(pedido_id)')
        .eq('colheita_id', colheita.id)

      if (error) {
        colheita._pedidosCount = 0
        continue
      }

      const pedidoIds = new Set<string>()
      if (data) {
        for (const plantio of data) {
          const pedidoItem = plantio.pedido_itens as any
          if (pedidoItem?.pedido_id) {
            pedidoIds.add(pedidoItem.pedido_id)
          }
        }
      }
      colheita._pedidosCount = pedidoIds.size
    } catch {
      colheita._pedidosCount = 0
    }
  }
}

// Detalhes
async function openDetalhes(colheita: Colheita) {
  selectedColheita.value = colheita
  detalheItens.value = colheita.colheita_itens || []
  showDetalhes.value = true
  await loadPackList(colheita.id)
}

function closeDetalhes() {
  showDetalhes.value = false
  selectedColheita.value = null
  detalheItens.value = []
  packList.value = []
}

async function loadPackList(colheitaId: string) {
  loadingPackList.value = true
  try {
    const { data, error } = await supabase
      .from('plantios')
      .select('*, pedido_itens(*, pedidos(numero, clientes(nome_fantasia)), produtos(nome))')
      .eq('colheita_id', colheitaId)

    if (error) throw error

    const items: PackListItem[] = []
    if (data) {
      for (const plantio of data) {
        const pedidoItem = plantio.pedido_itens as any
        if (pedidoItem) {
          items.push({
            pedidoNumero: pedidoItem.pedidos?.numero || null,
            clienteNome: pedidoItem.pedidos?.clientes?.nome_fantasia || null,
            produtoNome: pedidoItem.produtos?.nome || null,
            quantidade: pedidoItem.quantidade || null
          })
        }
      }
    }
    packList.value = items
  } catch (e: any) {
    console.error('Erro ao carregar pack list:', e)
    packList.value = []
  } finally {
    loadingPackList.value = false
  }
}

async function marcarColhido(item: ColheitaItem) {
  savingItemId.value = item.id
  try {
    const { error } = await supabase
      .from('colheita_itens')
      .update({ colhido: true })
      .eq('id', item.id)

    if (error) throw error

    // Atualizar localmente
    item.colhido = true

    // Atualizar tambem no array principal (colheitas)
    if (selectedColheita.value?.colheita_itens) {
      const found = selectedColheita.value.colheita_itens.find(i => i.id === item.id)
      if (found) found.colhido = true
    }

    // Verificar se todos foram colhidos para atualizar status da colheita
    await checkAndUpdateColheitaStatus()

    success('Item marcado como colhido')
  } catch (e: any) {
    console.error('Erro ao marcar colhido:', e)
    showError('Erro ao marcar item como colhido')
  } finally {
    savingItemId.value = null
  }
}

async function checkAndUpdateColheitaStatus() {
  if (!selectedColheita.value) return

  const itens = detalheItens.value
  if (itens.length === 0) return

  const todosColhidos = itens.every(i => i.colhido)
  const algumColhido = itens.some(i => i.colhido)

  let newStatus = 'pendente'
  if (todosColhidos) {
    newStatus = 'concluida'
  } else if (algumColhido) {
    newStatus = 'parcial'
  }

  if (newStatus !== selectedColheita.value.status) {
    try {
      const { error } = await supabase
        .from('colheitas')
        .update({ status: newStatus })
        .eq('id', selectedColheita.value.id)

      if (error) throw error

      // Atualizar localmente
      selectedColheita.value.status = newStatus

      // Atualizar no array principal
      const idx = colheitas.value.findIndex(c => c.id === selectedColheita.value?.id)
      if (idx !== -1) {
        colheitas.value[idx].status = newStatus
      }
    } catch (e: any) {
      console.error('Erro ao atualizar status da colheita:', e)
    }
  }
}

// Watch empresa
watch(() => currentCompany.value?.id, () => {
  loadColheitas()
})

onMounted(() => {
  loadColheitas()
})
</script>
