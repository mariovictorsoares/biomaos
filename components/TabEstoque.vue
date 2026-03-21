<template>
  <div>
    <!-- Toolbar: Busca + Data + Ação -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-4 mb-4">
      <!-- Esquerda: Busca + Filtro Data -->
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
        <div class="relative">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 material-icons-outlined text-gray-400 text-base">search</span>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar produto..."
            class="input w-full sm:w-64 text-sm pl-9"
          />
        </div>
        <div class="estoque-date-range-wrapper">
          <VueDatePicker
            v-model="dateRange"
            range
            :preset-dates="presetDates"
            :dark="isDark"
            :enable-time-picker="false"
            auto-apply
            :format="formatDateDisplay"
            locale="pt-BR"
            placeholder="Período..."
            :clearable="true"
            input-class-name="dp-input-custom"
            menu-class-name="dp-menu-custom"
          />
        </div>
        <!-- Filtro Tipo -->
        <select v-model="filterTipo" class="input text-sm h-9 w-full sm:w-28 shrink-0">
          <option value="">Todos</option>
          <option value="entrada">Entrada</option>
          <option value="saida">Saída</option>
          <option value="ajuste">Ajuste</option>
        </select>
      </div>
      <!-- Direita: Botão -->
      <button @click="openMovimentacaoModal(null)" class="btn btn-primary shrink-0 justify-center sm:justify-start">
        <span class="material-icons-outlined text-sm">swap_horiz</span>
        Movimentação
      </button>
    </div>

    <!-- Card da Tabela -->
    <div class="card">

      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>

      <template v-else>
        <!-- Tabela - Desktop -->
        <div class="hidden md:block overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-gray-100 dark:bg-gray-700/50 border-b border-border-light dark:border-border-dark">
                <th class="table-header w-40">Data</th>
                <th class="table-header">Produto</th>
                <th class="table-header text-center w-24">Tipo</th>
                <th class="table-header text-right w-24">Qtd</th>
                <th class="table-header text-right w-24">Saldo</th>
                <th class="table-header">Obs</th>
                <th class="table-header text-center w-20">Ações</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border-light dark:divide-border-dark">
              <tr
                v-for="mov in movimentacoesData"
                :key="mov.id"
                :class="[
                  'transition-colors h-12',
                  mov.cancelado ? 'opacity-50' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                ]"
              >
                <td class="table-cell text-xs text-subtext-light dark:text-subtext-dark whitespace-nowrap">{{ formatDateTime(mov.created_at) }}</td>
                <td class="table-cell font-medium max-w-[200px] truncate">{{ mov.produtos?.nome || '—' }}</td>
                <td class="table-cell text-center">
                  <span :class="[
                    'inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium',
                    mov.tipo === 'entrada' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                    mov.tipo === 'saida'   ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                             'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  ]">
                    {{ mov.tipo === 'entrada' ? 'Entrada' : mov.tipo === 'saida' ? 'Saída' : 'Ajuste' }}
                  </span>
                  <span v-if="mov.cancelado" class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 ml-1">
                    Cancelado
                  </span>
                </td>
                <td class="table-cell text-right font-semibold tabular-nums">
                  <span :class="[
                    mov.cancelado ? 'text-gray-400 line-through' :
                    mov.tipo === 'entrada' ? 'text-green-600 dark:text-green-400' :
                    mov.tipo === 'saida'   ? 'text-red-600 dark:text-red-400' :
                                             'text-blue-600 dark:text-blue-400'
                  ]">
                    {{ mov.tipo === 'entrada' ? '+' : mov.tipo === 'saida' ? '-' : '=' }}{{ mov.quantidade }}
                  </span>
                </td>
                <td class="table-cell text-right tabular-nums text-subtext-light dark:text-subtext-dark">→ {{ mov.quantidade_nova }}</td>
                <td class="table-cell text-sm text-subtext-light dark:text-subtext-dark max-w-[200px] truncate">{{ mov.motivo || '—' }}</td>
                <td class="table-cell text-center">
                  <button
                    v-if="!mov.cancelado"
                    @click="openCancelModal(mov)"
                    class="text-gray-400 hover:text-red-500 transition-colors p-0.5"
                    title="Cancelar lançamento"
                  >
                    <span class="material-icons-outlined text-sm">cancel</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Cards - Mobile -->
        <div class="md:hidden divide-y divide-border-light dark:divide-border-dark">
          <div
            v-for="mov in movimentacoesData"
            :key="mov.id"
            :class="[
              'p-4 transition-colors',
              mov.cancelado ? 'opacity-50' : ''
            ]"
          >
            <div class="flex items-start gap-3">
              <!-- Ícone tipo -->
              <div :class="[
                'w-9 h-9 rounded-full flex items-center justify-center shrink-0',
                mov.cancelado ? 'bg-gray-100 dark:bg-gray-700' :
                mov.tipo === 'entrada' ? 'bg-green-100 dark:bg-green-900/30' :
                mov.tipo === 'saida'   ? 'bg-red-100 dark:bg-red-900/30' :
                                         'bg-blue-100 dark:bg-blue-900/30'
              ]">
                <span :class="[
                  'material-icons-outlined text-sm',
                  mov.cancelado ? 'text-gray-400' :
                  mov.tipo === 'entrada' ? 'text-green-600 dark:text-green-400' :
                  mov.tipo === 'saida'   ? 'text-red-600 dark:text-red-400' :
                                           'text-blue-600 dark:text-blue-400'
                ]">
                  {{ mov.cancelado ? 'block' : mov.tipo === 'entrada' ? 'add' : mov.tipo === 'saida' ? 'remove' : 'tune' }}
                </span>
              </div>

              <!-- Info -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap mb-0.5">
                  <span class="text-sm font-medium text-text-light dark:text-text-dark truncate">{{ mov.produtos?.nome || '—' }}</span>
                  <span :class="[
                    'inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium',
                    mov.tipo === 'entrada' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                    mov.tipo === 'saida'   ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                             'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  ]">
                    {{ mov.tipo === 'entrada' ? 'Entrada' : mov.tipo === 'saida' ? 'Saída' : 'Ajuste' }}
                  </span>
                  <span v-if="mov.cancelado" class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400">Cancelado</span>
                </div>
                <p class="text-xs text-subtext-light dark:text-subtext-dark">{{ formatDateTime(mov.created_at) }}</p>
                <p v-if="mov.motivo" class="text-xs text-subtext-light dark:text-subtext-dark mt-0.5">{{ mov.motivo }}</p>
              </div>

              <!-- Qty + Cancel -->
              <div class="flex items-start gap-2 shrink-0">
                <div class="text-right">
                  <p :class="[
                    'text-sm font-semibold tabular-nums',
                    mov.cancelado ? 'text-gray-400 line-through' :
                    mov.tipo === 'entrada' ? 'text-green-600 dark:text-green-400' :
                    mov.tipo === 'saida'   ? 'text-red-600 dark:text-red-400' :
                                             'text-blue-600 dark:text-blue-400'
                  ]">
                    {{ mov.tipo === 'entrada' ? '+' : mov.tipo === 'saida' ? '-' : '=' }}{{ mov.quantidade }}
                  </p>
                  <p class="text-xs text-subtext-light dark:text-subtext-dark">→ {{ mov.quantidade_nova }}</p>
                </div>
                <button
                  v-if="!mov.cancelado"
                  @click="openCancelModal(mov)"
                  class="text-gray-400 hover:text-red-500 transition-colors p-0.5"
                  title="Cancelar"
                >
                  <span class="material-icons-outlined text-sm">cancel</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="movimentacoesData.length === 0 && !loading" class="text-center py-12 flex flex-col items-center px-4">
          <span class="material-icons-outlined text-4xl text-gray-300 dark:text-gray-600 mb-2">history</span>
          <h3 class="text-lg font-medium text-text-light dark:text-text-dark mb-1">Nenhuma movimentação</h3>
          <p class="text-sm text-subtext-light dark:text-subtext-dark mb-4">
            {{ hasActiveFilters ? 'Tente ajustar os filtros' : 'Registre movimentações de estoque' }}
          </p>
          <button @click="openMovimentacaoModal(null)" class="btn btn-primary">
            <span class="material-icons-outlined text-sm">swap_horiz</span>
            Nova Movimentação
          </button>
        </div>

        <!-- Paginação -->
        <div v-if="totalMovimentacoes > 0" class="p-3 sm:p-4 border-t border-border-light dark:border-border-dark text-xs text-subtext-light dark:text-subtext-dark">
          <div class="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
            <div class="flex items-center gap-3 sm:gap-4 w-full sm:w-auto justify-between sm:justify-start">
              <div class="flex items-center gap-2">
                <span class="hidden sm:inline">Mostrar</span>
                <select v-model="itemsPerPage" class="border border-border-light dark:border-border-dark rounded px-2 py-1 bg-white dark:bg-gray-800 text-xs sm:text-sm cursor-pointer">
                  <option :value="15">15</option>
                  <option :value="30">30</option>
                  <option :value="50">50</option>
                </select>
              </div>
              <span class="text-xs">{{ totalMovimentacoes }} registros</span>
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
      </template>
    </div>

    <!-- Modal de Movimentação (só form, sem histórico) -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        leave-active-class="transition-opacity duration-200"
        leave-to-class="opacity-0"
      >
        <div v-if="showModal" class="fixed inset-0 z-[60] overflow-y-auto">
          <div class="fixed inset-0 glass-backdrop" @click="closeModal"></div>
          <div class="flex min-h-full items-center justify-center p-4">
            <Transition
              enter-active-class="transition-all duration-200"
              enter-from-class="opacity-0 scale-95"
              leave-active-class="transition-all duration-200"
              leave-to-class="opacity-0 scale-95"
            >
              <div v-if="showModal" class="relative glass-panel rounded-xl shadow-2xl w-full max-w-lg">

                <!-- Header -->
                <div class="border-b border-border-light dark:border-border-dark px-6 py-4 flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center shrink-0">
                    <span class="material-icons-outlined text-primary text-lg">inventory_2</span>
                  </div>
                  <div class="flex-1 min-w-0">
                    <h2 class="text-base font-semibold text-text-light dark:text-text-dark truncate">{{ modalProduto?.nome || 'Nova Movimentação' }}</h2>
                    <p v-if="modalProduto" class="text-xs text-subtext-light dark:text-subtext-dark">
                      Estoque atual:
                      <span :class="getEstoqueQtd(modalProduto.id) > 0 ? 'text-green-600 dark:text-green-400 font-semibold' : 'text-gray-400'">
                        {{ getEstoqueQtd(modalProduto.id) }}
                      </span>
                    </p>
                  </div>
                  <button @click="closeModal" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <span class="material-icons-outlined">close</span>
                  </button>
                </div>

                <!-- Body -->
                <div class="p-6 space-y-4">
                  <!-- Seletor de produto -->
                  <div v-if="!modalProduto">
                    <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Produto <span class="text-red-500">*</span></label>
                    <select v-model="selectedProdutoId" class="input" @change="onSelectProduto">
                      <option value="">Selecione o produto</option>
                      <option v-for="p in produtos" :key="p.id" :value="p.id">
                        {{ p.codigo }} - {{ p.nome }}
                      </option>
                    </select>
                  </div>

                  <template v-if="modalProduto">
                    <!-- Tipo -->
                    <div class="grid grid-cols-3 gap-2">
                      <button
                        v-for="tipo in tiposMovimentacao"
                        :key="tipo.value"
                        type="button"
                        @click="form.tipo = tipo.value"
                        :class="[
                          'py-2 px-3 rounded-lg text-sm font-medium border-2 transition-all',
                          form.tipo === tipo.value
                            ? tipo.activeClass
                            : 'border-border-light dark:border-border-dark text-subtext-light dark:text-subtext-dark hover:border-gray-400'
                        ]"
                      >
                        <span class="material-icons-outlined text-sm block mb-0.5">{{ tipo.icon }}</span>
                        {{ tipo.label }}
                      </button>
                    </div>

                    <!-- Qtd + Obs -->
                    <div class="grid grid-cols-2 gap-3">
                      <div>
                        <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Quantidade <span class="text-red-500">*</span></label>
                        <input v-model.number="form.quantidade" type="number" min="1" step="1" class="input" placeholder="Ex: 10" />
                        <p v-if="form.tipo === 'ajuste'" class="text-xs text-subtext-light dark:text-subtext-dark mt-1">Define o valor exato</p>
                        <p v-else-if="modalProduto && form.quantidade > 0" class="text-xs text-subtext-light dark:text-subtext-dark mt-1">
                          Novo saldo:
                          <span class="font-medium">
                            {{ form.tipo === 'entrada'
                              ? getEstoqueQtd(modalProduto.id) + (form.quantidade || 0)
                              : Math.max(0, getEstoqueQtd(modalProduto.id) - (form.quantidade || 0)) }}
                          </span>
                        </p>
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Observação</label>
                        <input v-model="form.motivo" type="text" class="input" placeholder="Opcional..." />
                      </div>
                    </div>
                  </template>
                </div>

                <!-- Footer -->
                <div class="border-t border-border-light dark:border-border-dark px-6 py-4 flex items-center justify-end gap-3">
                  <button @click="closeModal" class="btn btn-secondary">Cancelar</button>
                  <button
                    @click="saveMovimentacao"
                    class="btn btn-primary"
                    :disabled="saving || !modalProduto || !form.quantidade || form.quantidade <= 0"
                  >
                    <span v-if="saving" class="material-icons-outlined text-sm animate-spin">refresh</span>
                    Confirmar
                  </button>
                </div>

              </div>
            </Transition>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Modal Confirmar Cancelamento -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        leave-active-class="transition-opacity duration-200"
        leave-to-class="opacity-0"
      >
        <div v-if="showCancelModal" class="fixed inset-0 z-[70] overflow-y-auto">
          <div class="fixed inset-0 glass-backdrop" @click="closeCancelModal"></div>
          <div class="flex min-h-full items-center justify-center p-4">
            <Transition
              enter-active-class="transition-all duration-200"
              enter-from-class="opacity-0 scale-95"
              leave-active-class="transition-all duration-200"
              leave-to-class="opacity-0 scale-95"
            >
              <div v-if="showCancelModal" class="relative glass-panel rounded-xl shadow-2xl w-full max-w-sm">
                <div class="p-6 text-center">
                  <div class="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                    <span class="material-icons-outlined text-red-600 dark:text-red-400 text-2xl">warning</span>
                  </div>
                  <h3 class="text-base font-semibold text-text-light dark:text-text-dark mb-2">Cancelar lançamento?</h3>
                  <p class="text-sm text-subtext-light dark:text-subtext-dark mb-1">
                    O estoque de <span class="font-medium text-text-light dark:text-text-dark">{{ cancelTarget?.produtos?.nome || '—' }}</span> será revertido.
                  </p>
                  <p class="text-xs text-red-500 dark:text-red-400 font-medium">Essa ação é irreversível.</p>
                </div>
                <div class="border-t border-border-light dark:border-border-dark px-6 py-4 flex items-center justify-end gap-3">
                  <button @click="closeCancelModal" class="btn btn-secondary" :disabled="cancelling">Voltar</button>
                  <button
                    @click="confirmarCancelamento"
                    class="btn bg-red-600 hover:bg-red-700 text-white"
                    :disabled="cancelling"
                  >
                    <span v-if="cancelling" class="material-icons-outlined text-sm animate-spin mr-1">refresh</span>
                    Cancelar lançamento
                  </button>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import VueDatePicker from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'
import { useCurrentCompany } from '~/composables/useCurrentCompany'
import { useToast } from '~/composables/useToast'

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const { currentCompany } = useCurrentCompany()
const { success, error: showError } = useToast()

// === ESTADO ===
const loading = ref(false)
const saving = ref(false)
const produtos = ref([])
const estoqueData = ref([])
const movimentacoesData = ref([])
const totalMovimentacoes = ref(0)

// Filtros
const searchQuery = ref('')
const filterTipo = ref('')
const dateRange = ref([null, null])
const filterDataDe = ref('')
const filterDataAte = ref('')
const isDark = ref(false)

// Paginação
const currentPage = ref(1)
const itemsPerPage = ref(15)
const pageInput = ref('1')

// Modal
const showModal = ref(false)
const modalProduto = ref(null)
const selectedProdutoId = ref('')
const form = ref({ tipo: 'entrada', quantidade: null, motivo: '' })

// Modal Cancelamento
const showCancelModal = ref(false)
const cancelTarget = ref(null)
const cancelling = ref(false)

const tiposMovimentacao = [
  { value: 'entrada', label: 'Entrada', icon: 'add_circle_outline',    activeClass: 'border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 dark:border-green-500' },
  { value: 'saida',   label: 'Saída',   icon: 'remove_circle_outline', activeClass: 'border-red-500 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 dark:border-red-500' },
  { value: 'ajuste',  label: 'Ajuste',  icon: 'tune',                  activeClass: 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-500' },
]

// === COMPUTED ===

const estoqueMap = computed(() => {
  const map = new Map()
  for (const e of estoqueData.value) {
    if (e.produto_id) map.set(e.produto_id, e.quantidade || 0)
  }
  return map
})

function getEstoqueQtd(produtoId) {
  return estoqueMap.value.get(produtoId) || 0
}

const totalPages = computed(() => Math.ceil(totalMovimentacoes.value / itemsPerPage.value) || 1)
const hasActiveFilters = computed(() => !!(searchQuery.value || filterTipo.value || filterDataDe.value || filterDataAte.value))

// === HELPERS ===

function formatDateTime(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yy = String(d.getFullYear()).slice(2)
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${dd}/${mm}/${yy}, ${hh}:${min}`
}

// === CRUD ===

async function loadProdutos() {
  if (!currentCompany.value?.id) return
  try {
    const { data, error } = await supabase
      .from('produtos')
      .select('id, codigo, nome')
      .eq('empresa_id', currentCompany.value.id)
      .eq('ativo', true)
      .order('codigo')
    if (error) throw error
    produtos.value = data || []
  } catch (e) {
    console.error('Erro ao carregar produtos:', e)
  }
}

async function loadEstoque() {
  if (!currentCompany.value?.id) return
  try {
    const { data, error } = await supabase
      .from('estoque')
      .select('id, produto_id, quantidade')
      .eq('empresa_id', currentCompany.value.id)
      .not('produto_id', 'is', null)
    if (error) throw error
    estoqueData.value = data || []
  } catch (e) {
    console.error('Erro ao carregar estoque:', e)
  }
}

async function loadMovimentacoes() {
  if (!currentCompany.value?.id) return

  loading.value = true
  try {
    let query = supabase
      .from('movimentacoes_estoque')
      .select('*, produtos:produto_id(id, codigo, nome)', { count: 'exact' })
      .eq('empresa_id', currentCompany.value.id)
      .not('produto_id', 'is', null)
      .order('created_at', { ascending: false })

    // Filtro por tipo
    if (filterTipo.value) {
      query = query.eq('tipo', filterTipo.value)
    }

    // Filtro por data
    if (filterDataDe.value) {
      query = query.gte('created_at', filterDataDe.value + 'T00:00:00')
    }
    if (filterDataAte.value) {
      query = query.lte('created_at', filterDataAte.value + 'T23:59:59')
    }

    // Filtro por produto (busca por nome/código)
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      const matchingIds = produtos.value
        .filter(p => p.codigo?.toLowerCase().includes(q) || p.nome?.toLowerCase().includes(q))
        .map(p => p.id)
      if (matchingIds.length > 0) {
        query = query.in('produto_id', matchingIds)
      } else {
        // Nenhum produto bate com a busca
        movimentacoesData.value = []
        totalMovimentacoes.value = 0
        loading.value = false
        return
      }
    }

    // Paginação server-side
    const from = (currentPage.value - 1) * itemsPerPage.value
    const to = from + itemsPerPage.value - 1
    query = query.range(from, to)

    const { data, error, count } = await query
    if (error) throw error
    movimentacoesData.value = data || []
    totalMovimentacoes.value = count || 0
  } catch (e) {
    console.error('Erro ao carregar movimentações:', e)
    showError('Erro ao carregar movimentações')
  } finally {
    loading.value = false
  }
}

async function upsertEstoque(produtoId, qtdNova) {
  const existing = estoqueData.value.find((e) => e.produto_id === produtoId)
  if (existing?.id) {
    const { error } = await supabase
      .from('estoque')
      .update({ quantidade: qtdNova })
      .eq('id', existing.id)
    if (error) throw error
  } else {
    const { error } = await supabase
      .from('estoque')
      .insert({ empresa_id: currentCompany.value.id, produto_id: produtoId, quantidade: qtdNova })
    if (error) throw error
  }
}

async function recalcularEstoqueFromDB(produtoId) {
  const { data } = await supabase
    .from('movimentacoes_estoque')
    .select('tipo, quantidade')
    .eq('empresa_id', currentCompany.value.id)
    .eq('produto_id', produtoId)
    .eq('cancelado', false)
    .order('created_at', { ascending: true })

  let qtd = 0
  for (const m of data || []) {
    if (m.tipo === 'entrada') qtd += m.quantidade
    else if (m.tipo === 'saida') qtd = Math.max(0, qtd - m.quantidade)
    else if (m.tipo === 'ajuste') qtd = m.quantidade
  }
  return qtd
}

// === MODAL ===

function openMovimentacaoModal(produto) {
  modalProduto.value = produto || null
  selectedProdutoId.value = ''
  form.value = { tipo: 'entrada', quantidade: null, motivo: '' }
  showModal.value = true
}

function onSelectProduto() {
  const p = produtos.value.find(x => x.id === selectedProdutoId.value)
  if (p) modalProduto.value = p
}

function closeModal() {
  showModal.value = false
  modalProduto.value = null
  selectedProdutoId.value = ''
}

async function saveMovimentacao() {
  if (!currentCompany.value?.id || !modalProduto.value) return

  const { tipo, quantidade, motivo } = form.value
  if (!quantidade || quantidade <= 0) {
    showError('Informe uma quantidade válida')
    return
  }

  const qtdAtual = getEstoqueQtd(modalProduto.value.id)
  let qtdNova
  if (tipo === 'entrada') qtdNova = qtdAtual + quantidade
  else if (tipo === 'saida') qtdNova = Math.max(0, qtdAtual - quantidade)
  else qtdNova = quantidade

  saving.value = true
  try {
    await upsertEstoque(modalProduto.value.id, qtdNova)

    const { error: movError } = await supabase
      .from('movimentacoes_estoque')
      .insert({
        empresa_id: currentCompany.value.id,
        produto_id: modalProduto.value.id,
        tipo,
        quantidade,
        quantidade_anterior: qtdAtual,
        quantidade_nova: qtdNova,
        motivo: motivo || null,
        usuario_id: user.value?.id || null
      })

    if (movError) throw movError

    success('Estoque atualizado com sucesso')
    closeModal()
    await Promise.all([loadEstoque(), loadMovimentacoes()])
  } catch (e) {
    console.error('Erro ao salvar movimentação:', e)
    showError(e.message || 'Erro ao salvar movimentação')
  } finally {
    saving.value = false
  }
}

function openCancelModal(mov) {
  cancelTarget.value = mov
  showCancelModal.value = true
}

function closeCancelModal() {
  showCancelModal.value = false
  cancelTarget.value = null
}

async function confirmarCancelamento() {
  if (!cancelTarget.value) return

  cancelling.value = true
  try {
    const mov = cancelTarget.value
    const { error: cancelError } = await supabase
      .from('movimentacoes_estoque')
      .update({
        cancelado: true,
        cancelado_em: new Date().toISOString(),
        cancelado_por: user.value?.id || null,
        motivo_cancelamento: 'Cancelado pelo usuário'
      })
      .eq('id', mov.id)

    if (cancelError) throw cancelError

    const qtdRecalculada = await recalcularEstoqueFromDB(mov.produto_id)
    await upsertEstoque(mov.produto_id, qtdRecalculada)

    success('Lançamento cancelado e estoque revertido')
    closeCancelModal()
    await Promise.all([loadEstoque(), loadMovimentacoes()])
  } catch (e) {
    console.error('Erro ao cancelar:', e)
    showError(e.message || 'Erro ao cancelar lançamento')
  } finally {
    cancelling.value = false
  }
}

// === DATE PICKER ===

const presetDates = computed(() => {
  const today = new Date()
  const last7 = new Date(today)
  last7.setDate(last7.getDate() - 6)
  const startMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const endMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
  const startLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
  const endLastMonth = new Date(today.getFullYear(), today.getMonth(), 0)
  return [
    { label: 'Últimos 7 dias', value: [last7, today] },
    { label: 'Este mês', value: [startMonth, endMonth] },
    { label: 'Mês passado', value: [startLastMonth, endLastMonth] },
  ]
})

function formatDateDisplay(dates) {
  if (!dates || dates.length < 2 || !dates[0] || !dates[1]) return ''
  const fmt = (d) => {
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const yy = String(d.getFullYear()).slice(2)
    return `${dd}/${mm}/${yy}`
  }
  return `${fmt(dates[0])} – ${fmt(dates[1])}`
}

// === PAGINAÇÃO ===

function goToPage() {
  const page = parseInt(pageInput.value)
  if (!isNaN(page) && page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  } else {
    pageInput.value = String(currentPage.value)
  }
}

// === WATCHERS ===

watch(() => currentCompany.value?.id, (newId) => {
  if (newId) {
    loadProdutos()
    loadEstoque()
    loadMovimentacoes()
  }
}, { immediate: true })

// Sync datepicker → filtros de data
watch(dateRange, (val) => {
  if (val && val.length === 2 && val[0] && val[1]) {
    filterDataDe.value = val[0].toISOString().split('T')[0]
    filterDataAte.value = val[1].toISOString().split('T')[0]
  } else {
    filterDataDe.value = ''
    filterDataAte.value = ''
  }
}, { deep: true })

// Filtros mudam → reset página e recarregar
watch([searchQuery, filterTipo, filterDataDe, filterDataAte], () => {
  currentPage.value = 1
  pageInput.value = '1'
  loadMovimentacoes()
})

watch(currentPage, (newVal) => {
  pageInput.value = String(newVal)
  loadMovimentacoes()
})

watch(itemsPerPage, () => {
  currentPage.value = 1
  pageInput.value = '1'
  loadMovimentacoes()
})

// Dark mode detect
onMounted(() => {
  isDark.value = document.documentElement.classList.contains('dark')
  const observer = new MutationObserver(() => {
    isDark.value = document.documentElement.classList.contains('dark')
  })
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
})
</script>

<style>
/* VueDatePicker — Estoque page theme */
.estoque-date-range-wrapper {
  min-width: 200px;
  max-width: 240px;
}

.estoque-date-range-wrapper .dp__input_wrap .dp__input {
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 0.8rem;
  font-weight: 500;
  padding: 0.35rem 0.5rem 0.35rem 2rem;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  background: #fff;
  color: #333;
  height: 36px;
  transition: all 0.15s ease;
}

.estoque-date-range-wrapper .dp__input_wrap .dp__input:hover {
  border-color: #549E54;
}

.estoque-date-range-wrapper .dp__input_wrap .dp__input:focus,
.estoque-date-range-wrapper .dp__input_wrap .dp__input.dp__input_focus {
  border-color: #549E54;
  box-shadow: 0 0 0 2px rgba(84, 158, 84, 0.15);
}

.dark .estoque-date-range-wrapper .dp__input_wrap .dp__input {
  background: #2a2a2a;
  border-color: #404040;
  color: #e0e0e0;
}

.dark .estoque-date-range-wrapper .dp__input_wrap .dp__input:hover {
  border-color: #549E54;
}

.dark .estoque-date-range-wrapper .dp__input_wrap .dp__input:focus,
.dark .estoque-date-range-wrapper .dp__input_wrap .dp__input.dp__input_focus {
  border-color: #549E54;
  box-shadow: 0 0 0 2px rgba(84, 158, 84, 0.2);
}

.estoque-date-range-wrapper .dp__input_icon {
  color: #549E54;
}

.dark .estoque-date-range-wrapper .dp__input_icon {
  color: #86efac;
}
</style>
