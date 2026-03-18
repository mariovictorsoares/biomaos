<template>
  <div>
    <!-- Toolbar (fora do card) -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-4 mb-4">
      <!-- Lado Esquerdo: Filtros -->
      <div class="flex flex-col sm:flex-row gap-2 sm:gap-3 flex-1">
        <!-- Filtro Especie -->
        <select v-model="filterEspecie" class="input text-xs sm:text-sm flex-1 sm:flex-none sm:w-40">
          <option value="">Espécie</option>
          <option v-for="especie in especies" :key="especie.id" :value="especie.id">
            {{ especie.nome }}
          </option>
        </select>

        <!-- Filtro Status -->
        <select v-model="filterStatus" class="input text-xs sm:text-sm flex-1 sm:flex-none sm:w-40">
          <option value="">Todos</option>
          <option value="disponivel">Disponível</option>
          <option value="consumido">Consumido</option>
        </select>
      </div>
    </div>

    <!-- Card Principal -->
    <div class="card" style="overflow: hidden; max-width: 100%;">

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-16">
        <span class="material-icons-outlined text-5xl text-gray-300 dark:text-gray-600 animate-spin">refresh</span>
        <p class="text-sm text-subtext-light dark:text-subtext-dark mt-3">Carregando excedentes...</p>
      </div>

      <!-- Tabela - Desktop -->
      <div v-if="!loading && filteredExcedentes.length > 0" class="hidden lg:block">
        <div class="table-scroll-container custom-scrollbar">
          <table class="w-full text-left border-collapse" style="min-width: 800px;">
            <thead>
              <tr class="bg-gray-100 dark:bg-gray-700/50 border-b border-border-light dark:border-border-dark text-xs">
                <th class="table-header font-medium whitespace-nowrap">Espécie</th>
                <th class="table-header font-medium text-center whitespace-nowrap">Quantidade (g)</th>
                <th class="table-header font-medium text-center whitespace-nowrap">Bandejas</th>
                <th class="table-header font-medium text-center whitespace-nowrap">Motivo</th>
                <th class="table-header font-medium text-center whitespace-nowrap">Status</th>
                <th class="table-header font-medium text-center whitespace-nowrap">Data Disponível</th>
                <th class="table-header font-medium text-center whitespace-nowrap">Data Validade</th>
                <th class="table-header font-medium whitespace-nowrap hidden xl:table-cell">Pedido</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border-light dark:divide-border-dark">
              <tr
                v-for="exc in paginatedExcedentes"
                :key="exc.id"
                class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <td class="table-cell text-xs font-medium whitespace-nowrap">
                  {{ exc.especies?.nome || '-' }}
                </td>
                <td class="table-cell text-center text-xs">{{ formatDecimal(exc.quantidade_g) }}</td>
                <td class="table-cell text-center text-xs">{{ formatNumber(exc.bandejas) }}</td>
                <td class="table-cell text-center p-1">
                  <span :class="['inline-block px-2 py-1 text-xs rounded-full border whitespace-nowrap', getMotivoBadgeClass(exc.motivo)]">
                    {{ getMotivoLabel(exc.motivo) }}
                  </span>
                </td>
                <td class="table-cell text-center p-1">
                  <span :class="['inline-block px-2 py-1 text-xs rounded-full border whitespace-nowrap', getStatusBadgeClass(exc.consumido)]">
                    {{ exc.consumido ? 'Consumido' : 'Disponível' }}
                  </span>
                </td>
                <td class="table-cell text-center text-xs whitespace-nowrap">{{ formatDateBR(exc.data_disponivel) }}</td>
                <td class="table-cell text-center text-xs whitespace-nowrap">{{ formatDateBR(exc.data_validade) }}</td>
                <td class="table-cell text-xs whitespace-nowrap hidden xl:table-cell">
                  <span v-if="exc.pedidos" class="text-blue-600 dark:text-blue-400">
                    #{{ exc.pedidos.numero }}
                  </span>
                  <span v-else class="text-subtext-light dark:text-subtext-dark">-</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Cards - Mobile/Tablet -->
      <div v-if="!loading && filteredExcedentes.length > 0" class="lg:hidden divide-y divide-border-light dark:divide-border-dark">
        <div
          v-for="exc in paginatedExcedentes"
          :key="exc.id"
          class="p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        >
          <!-- Header do Card -->
          <div class="flex items-start justify-between gap-2 mb-3">
            <div class="flex items-center gap-2 flex-wrap">
              <span :class="['text-[10px] px-2 py-0.5 rounded-full border whitespace-nowrap', getMotivoBadgeClass(exc.motivo)]">
                {{ getMotivoLabel(exc.motivo) }}
              </span>
              <span :class="['text-[10px] px-2 py-0.5 rounded-full border whitespace-nowrap', getStatusBadgeClass(exc.consumido)]">
                {{ exc.consumido ? 'Consumido' : 'Disponível' }}
              </span>
              <span v-if="exc.pedidos" class="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 whitespace-nowrap">
                Pedido #{{ exc.pedidos.numero }}
              </span>
            </div>
          </div>

          <!-- Info Principal -->
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <span class="material-icons-outlined text-lg text-primary">inventory_2</span>
            </div>
            <div class="min-w-0 flex-1">
              <p class="font-semibold text-sm text-text-light dark:text-text-dark truncate">{{ exc.especies?.nome || '-' }}</p>
              <p class="text-xs text-subtext-light dark:text-subtext-dark truncate">{{ formatDecimal(exc.quantidade_g) }} g</p>
            </div>
          </div>

          <!-- Grid de Informacoes -->
          <div class="grid grid-cols-3 gap-2 text-[11px]">
            <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-center">
              <p class="text-subtext-light dark:text-subtext-dark mb-0.5">Bandejas</p>
              <p class="font-semibold text-text-light dark:text-text-dark">{{ formatNumber(exc.bandejas) }}</p>
            </div>
            <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-center">
              <p class="text-subtext-light dark:text-subtext-dark mb-0.5">Disponível</p>
              <p class="font-semibold text-text-light dark:text-text-dark">{{ formatDateBR(exc.data_disponivel) || '-' }}</p>
            </div>
            <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-center">
              <p class="text-subtext-light dark:text-subtext-dark mb-0.5">Validade</p>
              <p class="font-semibold text-text-light dark:text-text-dark">{{ formatDateBR(exc.data_validade) || '-' }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="!loading && filteredExcedentes.length === 0" class="text-center py-16 flex flex-col items-center px-4">
        <div class="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
          <span class="material-icons-outlined text-4xl text-gray-400 dark:text-gray-500">inventory_2</span>
        </div>
        <h3 class="text-lg font-semibold text-text-light dark:text-text-dark mb-2">Nenhum excedente encontrado</h3>
        <p class="text-sm text-subtext-light dark:text-subtext-dark mb-6 max-w-sm">
          Não há excedentes para os filtros selecionados. Excedentes são gerados automaticamente pelo sistema de produção.
        </p>
      </div>

      <!-- Paginacao -->
      <div v-if="filteredExcedentes.length > 0" class="p-4 flex flex-col sm:flex-row items-center justify-between border-t border-border-light dark:border-border-dark text-xs text-subtext-light dark:text-subtext-dark gap-4">
        <div class="flex items-center gap-4">
          <select v-model="itemsPerPage" class="border border-border-light dark:border-border-dark rounded px-2 py-1 bg-white dark:bg-gray-800 text-sm cursor-pointer">
            <option :value="10">10 linhas</option>
            <option :value="25">25 linhas</option>
            <option :value="50">50 linhas</option>
          </select>
          <span>{{ filteredExcedentes.length }} registros</span>
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="currentPage--"
            :disabled="currentPage === 1"
            class="p-1 border border-border-light dark:border-border-dark rounded hover:bg-gray-50 dark:hover:bg-gray-800 bg-white dark:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span class="material-icons-outlined text-sm">chevron_left</span>
          </button>
          <span>Página</span>
          <input
            v-model="pageInput"
            type="text"
            class="w-12 text-center border border-border-light dark:border-border-dark rounded px-2 py-1 bg-white dark:bg-gray-800 font-medium focus:outline-none focus:ring-1 focus:ring-primary"
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
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useCurrentCompany } from '~/composables/useCurrentCompany'

// Interfaces
interface Excedente {
  id: string
  empresa_id: string
  especie_id: string
  plantio_id?: string
  pedido_id?: string
  quantidade_g: number
  bandejas: number
  motivo: 'arredondamento' | 'pedido_cancelado' | 'pedido_modificado'
  consumido: boolean
  consumido_por_pedido_id?: string
  data_disponivel?: string
  data_validade?: string
  especies?: { id: string; nome: string }
  pedidos?: { numero: string }
}

interface Especie {
  id: string
  nome: string
}

// Composables
const supabase = useSupabaseClient()
const { currentCompany } = useCurrentCompany()

// State
const loading = ref(false)
const excedentes = ref<Excedente[]>([])
const especies = ref<Especie[]>([])

// Filters
const filterEspecie = ref('')
const filterStatus = ref('')

// Pagination
const currentPage = ref(1)
const itemsPerPage = ref(10)
const pageInput = ref('1')

// Formatters
const numFmt = new Intl.NumberFormat('pt-BR')
const decFmt = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 })

// =====================================================
// Computed
// =====================================================

const empresaAtiva = computed(() => currentCompany.value?.id)

const filteredExcedentes = computed(() => {
  let result = [...excedentes.value]

  if (filterEspecie.value) {
    result = result.filter(e => e.especie_id === filterEspecie.value)
  }

  if (filterStatus.value === 'disponivel') {
    result = result.filter(e => !e.consumido)
  } else if (filterStatus.value === 'consumido') {
    result = result.filter(e => e.consumido)
  }

  return result
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredExcedentes.value.length / itemsPerPage.value)))

const paginatedExcedentes = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  return filteredExcedentes.value.slice(start, start + itemsPerPage.value)
})

// =====================================================
// Watchers
// =====================================================

watch(empresaAtiva, () => {
  if (empresaAtiva.value) {
    fetchExcedentes()
    fetchEspecies()
  }
})

watch([filterEspecie, filterStatus], () => {
  currentPage.value = 1
  pageInput.value = '1'
})

watch(itemsPerPage, () => {
  currentPage.value = 1
  pageInput.value = '1'
})

watch(currentPage, (val) => {
  pageInput.value = String(val)
})

// =====================================================
// Fetch Data
// =====================================================

async function fetchExcedentes() {
  if (!empresaAtiva.value) return
  loading.value = true
  try {
    const { data, error } = await supabase
      .from('excedentes')
      .select('*, especies(id, nome), pedidos(numero)')
      .eq('empresa_id', empresaAtiva.value)
      .order('data_disponivel', { ascending: false })

    if (error) throw error
    excedentes.value = data || []
  } catch (err) {
    console.error('Erro ao carregar excedentes:', err)
    excedentes.value = []
  } finally {
    loading.value = false
  }
}

async function fetchEspecies() {
  if (!empresaAtiva.value) return
  try {
    const { data, error } = await supabase
      .from('especies')
      .select('id, nome')
      .eq('empresa_id', empresaAtiva.value)
      .order('nome')

    if (error) throw error
    especies.value = data || []
  } catch (err) {
    console.error('Erro ao carregar especies:', err)
  }
}

// =====================================================
// Pagination
// =====================================================

function goToPage() {
  const page = parseInt(pageInput.value)
  if (!isNaN(page) && page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  } else {
    pageInput.value = String(currentPage.value)
  }
}

// =====================================================
// Formatters
// =====================================================

function formatDateBR(dateStr?: string): string {
  if (!dateStr) return ''
  const date = new Date(dateStr + 'T12:00:00')
  return date.toLocaleDateString('pt-BR')
}

function formatNumber(val?: number | null): string {
  if (val === undefined || val === null) return '0'
  return numFmt.format(val)
}

function formatDecimal(val?: number | null): string {
  if (val === undefined || val === null) return '0'
  return decFmt.format(val)
}

// =====================================================
// Badge Helpers
// =====================================================

function getMotivoLabel(motivo?: string): string {
  const labels: Record<string, string> = {
    arredondamento: 'Arredondamento',
    pedido_cancelado: 'Pedido Cancelado',
    pedido_modificado: 'Pedido Modificado'
  }
  return labels[motivo || ''] || motivo || '-'
}

function getMotivoBadgeClass(motivo?: string): string {
  const classes: Record<string, string> = {
    arredondamento: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
    pedido_cancelado: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
    pedido_modificado: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800'
  }
  return classes[motivo || ''] || 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600'
}

function getStatusBadgeClass(consumido?: boolean): string {
  if (consumido) {
    return 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600'
  }
  return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800'
}

// =====================================================
// Lifecycle
// =====================================================

onMounted(() => {
  if (empresaAtiva.value) {
    fetchExcedentes()
    fetchEspecies()
  }
})
</script>
