<template>
  <div>
    <!-- Toolbar -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-4 mb-4">
      <div class="flex flex-wrap gap-2 flex-1 min-w-0">
        <!-- Busca -->
        <div class="relative flex-1 sm:flex-none sm:w-48">
          <span class="material-icons-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-gray-400">search</span>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar..."
            class="input pl-8 text-xs sm:text-sm w-full"
          />
        </div>

        <!-- Multi-select Status -->
        <div class="relative" ref="statusDropdownRef">
          <button
            @click="showStatusDropdown = !showStatusDropdown"
            class="input text-xs sm:text-sm flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <span class="material-icons-outlined text-sm text-gray-400">filter_list</span>
            <span v-if="filtroStatusSet.size === statusOptions.length">Todos os status</span>
            <span v-else-if="filtroStatusSet.size === 0">Nenhum status</span>
            <span v-else>{{ filtroStatusSet.size }} status</span>
            <span class="material-icons-outlined text-xs text-gray-400 ml-auto">expand_more</span>
          </button>
          <Transition
            enter-active-class="transition-all duration-150 ease-out"
            leave-active-class="transition-all duration-100 ease-in"
            enter-from-class="opacity-0 scale-95"
            leave-to-class="opacity-0 scale-95"
          >
            <div
              v-if="showStatusDropdown"
              class="absolute top-full left-0 mt-1 z-50 bg-white dark:bg-gray-800 border border-border-light dark:border-border-dark rounded-lg shadow-lg py-1 min-w-[180px]"
            >
              <label
                v-for="opt in statusOptions"
                :key="opt.value"
                class="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer text-xs"
              >
                <input
                  type="checkbox"
                  :checked="filtroStatusSet.has(opt.value)"
                  @change="toggleStatus(opt.value)"
                  class="rounded border-gray-300 dark:border-gray-600 text-[#4A7C59] focus:ring-[#4A7C59]"
                />
                <span :class="['w-2 h-2 rounded-full shrink-0', opt.dot]"></span>
                <span class="text-text-light dark:text-text-dark">{{ opt.label }}</span>
              </label>
              <div class="border-t border-border-light dark:border-border-dark mt-1 pt-1 px-3 flex gap-2">
                <button @click="filtroStatusSet = new Set(statusOptions.map(o => o.value))" class="text-[11px] text-[#4A7C59] hover:underline">Todos</button>
                <button @click="filtroStatusSet = new Set()" class="text-[11px] text-gray-400 hover:underline">Nenhum</button>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </div>

    <!-- Card Principal -->
    <div class="card" style="overflow: hidden; max-width: 100%;">

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-16">
        <span class="material-icons-outlined text-5xl text-gray-300 dark:text-gray-600 animate-spin">refresh</span>
        <p class="text-sm text-subtext-light dark:text-subtext-dark mt-3">Carregando produções recorrentes...</p>
      </div>

      <!-- Tabela - Desktop -->
      <div v-if="!loading && filteredRecorrentes.length > 0" class="hidden lg:block">
        <div class="table-scroll-container custom-scrollbar">
          <table class="w-full text-left border-collapse" style="min-width: 850px;">
            <thead>
              <tr class="bg-gray-100 dark:bg-gray-700/50 border-b border-border-light dark:border-border-dark text-xs">
                <th class="table-header font-medium whitespace-nowrap">ESPÉCIE(S)</th>
                <th class="table-header font-medium text-center whitespace-nowrap">QTD</th>
                <th class="table-header font-medium whitespace-nowrap">FAZENDA</th>
                <th class="table-header font-medium whitespace-nowrap">INTERVALO</th>
                <th class="table-header font-medium text-center whitespace-nowrap">STATUS</th>
                <th class="table-header font-medium text-center whitespace-nowrap">ÚLTIMA GERAÇÃO</th>
                <th class="table-header font-medium text-center whitespace-nowrap w-28">AÇÕES</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border-light dark:divide-border-dark">
              <tr
                v-for="rec in paginatedRecorrentes"
                :key="rec.id"
                class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                @click="openDetalhes(rec)"
              >
                <!-- ESPECIE(S) -->
                <td class="table-cell text-sm font-medium text-text-light dark:text-text-dark whitespace-nowrap">
                  <span
                    v-if="rec.tipo === 'mix'"
                    class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 mr-1"
                  >Mix</span>
                  {{ nomeEspecies(rec) }}
                </td>
                <!-- QTD -->
                <td class="table-cell text-center text-sm">
                  {{ rec.quantidade }} un
                </td>
                <!-- FAZENDA -->
                <td class="table-cell text-sm text-subtext-light dark:text-subtext-dark whitespace-nowrap">
                  {{ rec.fazendas?.nome || '-' }}
                </td>
                <!-- INTERVALO -->
                <td class="table-cell text-sm text-subtext-light dark:text-subtext-dark whitespace-nowrap">
                  A cada {{ rec.intervalo_dias }} dias
                </td>
                <!-- STATUS -->
                <td class="table-cell text-center">
                  <span :class="['inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border', statusBadgeClass(rec.status)]">
                    {{ RECORRENTE_STATUS_CONFIG[rec.status]?.label || rec.status }}
                  </span>
                </td>
                <!-- ULTIMA GERACAO -->
                <td class="table-cell text-center text-sm text-subtext-light dark:text-subtext-dark whitespace-nowrap">
                  {{ formatDateBR(rec.ultima_geracao) }}
                </td>
                <!-- ACOES -->
                <td class="table-cell text-center p-1" @click.stop>
                  <div class="flex items-center justify-center gap-1">
                    <template v-if="rec.status === 'ativa'">
                      <button
                        @click="handlePausar(rec)"
                        class="text-gray-400 hover:text-amber-500 dark:text-gray-500 dark:hover:text-amber-400 transition-colors"
                        title="Pausar"
                      >
                        <span class="material-icons-outlined text-lg">pause_circle</span>
                      </button>
                      <button
                        @click="openDetalhes(rec)"
                        class="text-gray-400 hover:text-primary dark:text-gray-500 dark:hover:text-primary transition-colors"
                        title="Editar"
                      >
                        <span class="material-icons-outlined text-lg">edit</span>
                      </button>
                      <button
                        @click="confirmEncerrar(rec)"
                        class="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors"
                        title="Encerrar"
                      >
                        <span class="material-icons-outlined text-lg">stop_circle</span>
                      </button>
                    </template>
                    <template v-else-if="rec.status === 'pausada'">
                      <button
                        @click="handleRetomar(rec)"
                        class="text-gray-400 hover:text-green-500 dark:text-gray-500 dark:hover:text-green-400 transition-colors"
                        title="Retomar"
                      >
                        <span class="material-icons-outlined text-lg">play_circle</span>
                      </button>
                      <button
                        @click="openDetalhes(rec)"
                        class="text-gray-400 hover:text-primary dark:text-gray-500 dark:hover:text-primary transition-colors"
                        title="Editar"
                      >
                        <span class="material-icons-outlined text-lg">edit</span>
                      </button>
                      <button
                        @click="confirmEncerrar(rec)"
                        class="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors"
                        title="Encerrar"
                      >
                        <span class="material-icons-outlined text-lg">stop_circle</span>
                      </button>
                    </template>
                    <template v-else>
                      <button
                        @click="openDetalhes(rec)"
                        class="text-gray-400 hover:text-primary dark:text-gray-500 dark:hover:text-primary transition-colors"
                        title="Ver detalhes"
                      >
                        <span class="material-icons-outlined text-lg">visibility</span>
                      </button>
                    </template>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Cards - Mobile/Tablet -->
      <div v-if="!loading && filteredRecorrentes.length > 0" class="lg:hidden divide-y divide-border-light dark:divide-border-dark">
        <div
          v-for="rec in paginatedRecorrentes"
          :key="rec.id"
          class="p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
          @click="openDetalhes(rec)"
        >
          <!-- Header do Card -->
          <div class="flex items-start justify-between gap-2 mb-3">
            <div class="flex items-center gap-2 flex-wrap">
              <!-- Status badge -->
              <span :class="['text-[10px] px-2 py-0.5 rounded-full border whitespace-nowrap', statusBadgeClass(rec.status)]">
                {{ RECORRENTE_STATUS_CONFIG[rec.status]?.label || rec.status }}
              </span>
              <!-- Intervalo -->
              <span class="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 whitespace-nowrap">
                A cada {{ rec.intervalo_dias }}d
              </span>
            </div>
            <div class="flex items-center gap-1 shrink-0" @click.stop>
              <template v-if="rec.status === 'ativa'">
                <button @click="handlePausar(rec)" class="text-gray-400 hover:text-amber-500 transition-colors">
                  <span class="material-icons-outlined text-lg">pause_circle</span>
                </button>
              </template>
              <template v-else-if="rec.status === 'pausada'">
                <button @click="handleRetomar(rec)" class="text-gray-400 hover:text-green-500 transition-colors">
                  <span class="material-icons-outlined text-lg">play_circle</span>
                </button>
              </template>
            </div>
          </div>

          <!-- Info Principal -->
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <span class="material-icons-outlined text-lg text-primary">repeat</span>
            </div>
            <div class="min-w-0 flex-1">
              <p class="font-semibold text-sm text-text-light dark:text-text-dark truncate">
                <span v-if="rec.tipo === 'mix'" class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 mr-1">Mix</span>
                {{ nomeEspecies(rec) }}
              </p>
              <p class="text-xs text-subtext-light dark:text-subtext-dark truncate">{{ rec.fazendas?.nome || 'Sem fazenda' }}</p>
            </div>
          </div>

          <!-- Grid de Informacoes -->
          <div class="grid grid-cols-3 gap-2 text-[11px]">
            <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-center">
              <p class="text-subtext-light dark:text-subtext-dark mb-0.5">Quantidade</p>
              <p class="font-semibold text-text-light dark:text-text-dark">{{ rec.quantidade }} un</p>
            </div>
            <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-center">
              <p class="text-subtext-light dark:text-subtext-dark mb-0.5">Intervalo</p>
              <p class="font-semibold text-text-light dark:text-text-dark">{{ rec.intervalo_dias }} dias</p>
            </div>
            <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-center">
              <p class="text-subtext-light dark:text-subtext-dark mb-0.5">Última Ger.</p>
              <p class="font-semibold text-text-light dark:text-text-dark truncate">{{ formatDateBR(rec.ultima_geracao) }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="!loading && filteredRecorrentes.length === 0" class="text-center py-16 flex flex-col items-center px-4">
        <div class="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
          <span class="material-icons-outlined text-4xl text-gray-400 dark:text-gray-500">repeat</span>
        </div>
        <h3 class="text-lg font-semibold text-text-light dark:text-text-dark mb-2">Nenhuma produção recorrente encontrada</h3>
        <p class="text-sm text-subtext-light dark:text-subtext-dark mb-6 max-w-sm">
          {{ hasActiveFilters ? 'Tente ajustar os filtros de busca.' : 'Crie produções recorrentes a partir do modal de nova produção.' }}
        </p>
      </div>

      <!-- Paginacao -->
      <div v-if="filteredRecorrentes.length > 0" class="p-3 sm:p-4 border-t border-border-light dark:border-border-dark text-xs text-subtext-light dark:text-subtext-dark">
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
            <span class="text-xs">{{ filteredRecorrentes.length }} registros</span>
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

    <!-- Modal Confirmar Encerramento -->
    <ModalConfirmacao
      v-if="showEncerrarConfirm"
      title="Encerrar Recorrente"
      :message="`Tem certeza que deseja encerrar esta produção recorrente? Nenhuma nova produção será gerada. As produções já criadas não serão afetadas.`"
      confirm-text="Encerrar"
      confirm-class="btn bg-red-600 hover:bg-red-700 text-white"
      @close="showEncerrarConfirm = false"
      @confirm="handleEncerrar"
    />

    <!-- Modal Detalhes/Editar -->
    <ModalRecorrenteDetalhes
      v-if="selectedRecorrente"
      :show="showDetalhes"
      :recorrente="selectedRecorrente"
      @close="fecharDetalhes"
      @atualizado="handleAtualizado"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useCurrentCompany } from '~/composables/useCurrentCompany'
import { useToast } from '~/composables/useToast'
import type { ProducaoRecorrente, RecorrenteStatus } from '~/composables/types/producao'
import { RECORRENTE_STATUS_CONFIG } from '~/composables/types/producao'

const producao = useProducao()
const { currentCompany } = useCurrentCompany()
const { success, error: showError } = useToast()

// =====================================================
// Estado
// =====================================================

const recorrentes = ref<ProducaoRecorrente[]>([])
const loading = ref(false)

// Filtros
const searchQuery = ref('')

const statusOptions = [
  { label: 'Ativas', value: 'ativa', dot: 'bg-green-500' },
  { label: 'Pausadas', value: 'pausada', dot: 'bg-amber-500' },
  { label: 'Encerradas', value: 'encerrada', dot: 'bg-gray-400' }
]

const filtroStatusSet = ref<Set<string>>(new Set(['ativa', 'pausada']))

function toggleStatus(value: string) {
  const s = new Set(filtroStatusSet.value)
  if (s.has(value)) s.delete(value)
  else s.add(value)
  filtroStatusSet.value = s
}

// Dropdown status
const showStatusDropdown = ref(false)
const statusDropdownRef = ref<HTMLElement | null>(null)

// Paginacao
const currentPage = ref(1)
const itemsPerPage = ref(10)
const pageInput = ref('1')

// Encerrar confirm
const showEncerrarConfirm = ref(false)
const encerrarTarget = ref<ProducaoRecorrente | null>(null)

// Detalhes modal
const showDetalhes = ref(false)
const selectedRecorrente = ref<ProducaoRecorrente | null>(null)

// =====================================================
// Computed
// =====================================================

const hasActiveFilters = computed(() => {
  return filtroStatusSet.value.size < statusOptions.length || searchQuery.value
})

const filteredRecorrentes = computed(() => {
  let result = recorrentes.value

  if (filtroStatusSet.value.size < statusOptions.length) {
    result = result.filter(r => filtroStatusSet.value.has(r.status))
  }

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(r =>
      (r.especie1?.nome || '').toLowerCase().includes(q) ||
      (r.especie2?.nome || '').toLowerCase().includes(q) ||
      (r.fazendas?.nome || '').toLowerCase().includes(q) ||
      (r.especie1?.codigo || '').toLowerCase().includes(q) ||
      (r.especie2?.codigo || '').toLowerCase().includes(q)
    )
  }

  return result
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredRecorrentes.value.length / itemsPerPage.value)))

const paginatedRecorrentes = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  return filteredRecorrentes.value.slice(start, start + itemsPerPage.value)
})

// =====================================================
// Helpers
// =====================================================

function nomeEspecies(rec: ProducaoRecorrente): string {
  const nome1 = rec.especie1?.nome || '-'
  if (rec.tipo === 'mix' && rec.especie2?.nome) {
    return nome1 + ' + ' + rec.especie2.nome
  }
  return nome1
}

function formatDateBR(dateStr?: string | null): string {
  if (!dateStr) return '-'
  const parts = dateStr.split('-')
  if (parts.length !== 3) return dateStr
  return `${parts[2]}/${parts[1]}/${parts[0].slice(2)}`
}

function statusBadgeClass(status: RecorrenteStatus): string {
  const map: Record<RecorrenteStatus, string> = {
    ativa: 'border-green-400 bg-green-50 dark:bg-green-900/20 text-green-600 dark:border-green-500 dark:text-green-400',
    pausada: 'border-amber-400 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:border-amber-400 dark:text-amber-400',
    encerrada: 'border-gray-400 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:border-gray-600 dark:text-gray-400'
  }
  return map[status] || map.ativa
}

// =====================================================
// Paginacao
// =====================================================

function goToPage() {
  const page = parseInt(pageInput.value)
  if (!isNaN(page) && page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  } else {
    pageInput.value = String(currentPage.value)
  }
}

watch(currentPage, (val) => {
  pageInput.value = String(val)
})

watch([filtroStatusSet, searchQuery], () => {
  currentPage.value = 1
})

watch(itemsPerPage, () => {
  currentPage.value = 1
})

// =====================================================
// Acoes
// =====================================================

async function handlePausar(rec: ProducaoRecorrente) {
  const ok = await producao.pausarRecorrente(rec.id)
  if (ok) {
    await loadData()
  }
}

async function handleRetomar(rec: ProducaoRecorrente) {
  const ok = await producao.retomarRecorrente(rec.id)
  if (ok) {
    await loadData()
  }
}

function confirmEncerrar(rec: ProducaoRecorrente) {
  encerrarTarget.value = rec
  showEncerrarConfirm.value = true
}

async function handleEncerrar() {
  if (!encerrarTarget.value) return

  const ok = await producao.encerrarRecorrente(encerrarTarget.value.id)
  showEncerrarConfirm.value = false
  encerrarTarget.value = null

  if (ok) {
    await loadData()
  }
}

function openDetalhes(rec: ProducaoRecorrente) {
  selectedRecorrente.value = rec
  showDetalhes.value = true
}

function fecharDetalhes() {
  showDetalhes.value = false
  setTimeout(() => {
    selectedRecorrente.value = null
  }, 250)
}

async function handleAtualizado() {
  fecharDetalhes()
  await loadData()
}

// =====================================================
// Data Loading
// =====================================================

async function loadData() {
  if (!currentCompany.value?.id) return

  loading.value = true
  try {
    recorrentes.value = await producao.listarRecorrentes()
  } catch (e: any) {
    showError('Erro ao carregar produções recorrentes')
  } finally {
    loading.value = false
  }
}

// =====================================================
// Lifecycle
// =====================================================

watch(() => currentCompany.value?.id, () => {
  loadData()
})

function handleClickOutside(e: MouseEvent) {
  if (statusDropdownRef.value && !statusDropdownRef.value.contains(e.target as Node)) {
    showStatusDropdown.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  if (currentCompany.value?.id) {
    loadData()
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
