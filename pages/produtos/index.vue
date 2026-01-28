<template>
  <div>
    <h1 class="text-xl sm:text-2xl font-bold text-text-light dark:text-text-dark mb-4 sm:mb-6">Produtos</h1>

    <!-- Card da Tabela -->
    <div class="card">
      <!-- Header do Card com Filtros -->
      <div class="p-3 sm:p-4 border-b border-border-light dark:border-border-dark">
        <div class="flex flex-col gap-3">
          <div class="flex items-center justify-between">
            <h2 class="text-xs sm:text-sm font-medium text-subtext-light dark:text-subtext-dark uppercase tracking-wider">Lista Produtos</h2>
            <!-- Botao Novo Produto - Desktop -->
            <button @click="openCreateModal" class="hidden sm:flex btn btn-primary shrink-0">
              <span class="material-icons text-sm">add</span>
              Novo produto
            </button>
          </div>
          <div class="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <!-- Filtro Status -->
            <select v-model="filterStatus" class="input text-sm w-full sm:w-28 shrink-0">
              <option value="ativo">Ativos</option>
              <option value="inativo">Inativos</option>
              <option value="">Todos</option>
            </select>

            <!-- Busca -->
            <div class="relative flex-1">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 material-icons-outlined text-gray-400 text-base sm:text-lg">search</span>
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Pesquise aqui..."
                class="input w-full text-sm pl-9 sm:pl-10"
              />
            </div>

            <!-- Botao Novo Produto - Mobile -->
            <button @click="openCreateModal" class="sm:hidden btn btn-primary w-full justify-center">
              <span class="material-icons text-sm">add</span>
              Novo produto
            </button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>

      <!-- Tabela - Desktop -->
      <div v-if="!loading" class="hidden md:block overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-50 dark:bg-gray-800 border-b border-border-light dark:border-border-dark">
              <th class="table-header cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700" @click="sortBy('codigo')">
                <div class="flex items-center gap-1">
                  Código
                  <span v-if="sortField === 'codigo'" class="material-icons text-xs">
                    {{ sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward' }}
                  </span>
                </div>
              </th>
              <th class="table-header cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700" @click="sortBy('nome')">
                <div class="flex items-center gap-1">
                  Nome
                  <span v-if="sortField === 'nome'" class="material-icons text-xs">
                    {{ sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward' }}
                  </span>
                </div>
              </th>
              <th class="table-header text-right w-24">Unidade</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-light dark:divide-border-dark">
            <tr
              v-for="produto in paginatedProdutos"
              :key="produto.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
              @click="openDetailsSlideover(produto)"
            >
              <td class="table-cell font-medium text-primary">{{ produto.codigo }}</td>
              <td class="table-cell font-medium">{{ produto.nome }}</td>
              <td class="table-cell text-right">{{ produto.unidade }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Cards - Mobile -->
      <div v-if="!loading" class="md:hidden divide-y divide-border-light dark:divide-border-dark">
        <div
          v-for="produto in paginatedProdutos"
          :key="produto.id"
          class="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
          @click="openDetailsSlideover(produto)"
        >
          <div class="flex items-center justify-between gap-3">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <span class="text-xs font-medium text-primary">{{ produto.codigo }}</span>
                <span class="text-xs text-subtext-light dark:text-subtext-dark">{{ produto.unidade }}</span>
              </div>
              <p class="font-medium text-text-light dark:text-text-dark truncate">{{ produto.nome }}</p>
            </div>
            <button
              @click.stop="openDetailsSlideover(produto)"
              class="text-gray-400 hover:text-primary transition-colors shrink-0"
            >
              <span class="material-icons-outlined text-xl">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="!loading && filteredProdutos.length === 0" class="flex flex-col items-center justify-center text-center py-12">
        <span class="material-icons-outlined text-4xl text-gray-300 dark:text-gray-600 mb-2">inventory_2</span>
        <h3 class="text-lg font-medium text-text-light dark:text-text-dark mb-1">Nenhum produto encontrado</h3>
        <p class="text-sm text-subtext-light dark:text-subtext-dark mb-4">Comece cadastrando seu primeiro produto</p>
        <button @click="openCreateModal" class="btn btn-primary">
          <span class="material-icons text-sm">add</span>
          Novo produto
        </button>
      </div>

      <!-- Paginacao -->
      <div v-if="filteredProdutos.length > 0" class="p-4 flex flex-col sm:flex-row items-center justify-between border-t border-border-light dark:border-border-dark text-xs text-subtext-light dark:text-subtext-dark gap-4">
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2">
            <span>Mostrar</span>
            <select v-model="itemsPerPage" class="border border-border-light dark:border-border-dark rounded px-2 py-1 bg-white dark:bg-gray-800 text-sm">
              <option :value="10">10</option>
              <option :value="25">25</option>
              <option :value="50">50</option>
            </select>
          </div>
          <span>{{ filteredProdutos.length }} registros</span>
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="currentPage--"
            :disabled="currentPage === 1"
            class="p-1 border border-border-light dark:border-border-dark rounded hover:bg-gray-50 dark:hover:bg-gray-800 bg-white dark:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span class="material-icons text-sm">chevron_left</span>
          </button>
          <span>Pagina</span>
          <input
            v-model="pageInput"
            type="text"
            class="w-12 text-center border border-border-light dark:border-border-dark rounded px-2 py-1 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
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

    <!-- Modal de Criacao -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-200"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="showCreateModal" class="fixed inset-0 z-50 overflow-y-auto">
          <div class="fixed inset-0 glass-backdrop" @click="closeCreateModal"></div>
          <div class="flex min-h-full items-center justify-center p-4">
            <Transition
              enter-active-class="transition-all duration-200"
              enter-from-class="opacity-0 scale-95"
              enter-to-class="opacity-100 scale-100"
              leave-active-class="transition-all duration-200"
              leave-from-class="opacity-100 scale-100"
              leave-to-class="opacity-0 scale-95"
            >
              <div v-if="showCreateModal" class="relative glass-panel rounded-lg shadow-xl w-full max-w-lg">
                <!-- Modal Header -->
                <div class="border-b border-border-light dark:border-border-dark px-6 py-4 flex items-center justify-between">
                  <h2 class="text-lg font-semibold text-text-light dark:text-text-dark">Novo produto</h2>
                  <button @click="closeCreateModal" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <span class="material-icons">close</span>
                  </button>
                </div>

                <!-- Modal Body -->
                <div class="p-6 space-y-4">
                  <!-- Codigo e Unidade -->
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                        Código
                      </label>
                      <input type="text" v-model="newProduto.codigo" class="input" placeholder="" maxlength="20" />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                        Unidade
                      </label>
                      <input type="text" v-model="newProduto.unidade" class="input" placeholder="" />
                    </div>
                  </div>

                  <!-- Produto -->
                  <div>
                    <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                      Produto
                    </label>
                    <input type="text" v-model="newProduto.nome" class="input" placeholder="" />
                  </div>
                </div>

                <!-- Modal Footer -->
                <div class="border-t border-border-light dark:border-border-dark px-6 py-4 flex items-center justify-end gap-3">
                  <button @click="closeCreateModal" class="btn btn-secondary" :disabled="saving">Cancelar</button>
                  <button @click="saveProduto" :disabled="saving" class="btn btn-primary">
                    <span v-if="saving" class="animate-spin material-icons text-sm">refresh</span>
                    {{ saving ? 'Salvando...' : 'Salvar produto' }}
                  </button>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Modal de Edicao -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-200"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="showEditModal" class="fixed inset-0 z-[60] overflow-y-auto">
          <div class="fixed inset-0 glass-backdrop" @click="closeEditModal"></div>
          <div class="flex min-h-full items-center justify-center p-4">
            <Transition
              enter-active-class="transition-all duration-200"
              enter-from-class="opacity-0 scale-95"
              enter-to-class="opacity-100 scale-100"
              leave-active-class="transition-all duration-200"
              leave-from-class="opacity-100 scale-100"
              leave-to-class="opacity-0 scale-95"
            >
              <div v-if="showEditModal" class="relative glass-panel rounded-lg shadow-xl w-full max-w-lg">
                <!-- Modal Header -->
                <div class="border-b border-border-light dark:border-border-dark px-6 py-4 flex items-center justify-between">
                  <h2 class="text-lg font-semibold text-text-light dark:text-text-dark">Editar produto</h2>
                  <button @click="closeEditModal" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <span class="material-icons">close</span>
                  </button>
                </div>

                <!-- Modal Body -->
                <div class="p-6 space-y-4">
                  <!-- Codigo e Unidade -->
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                        Código
                      </label>
                      <input type="text" v-model="editProduto.codigo" class="input" placeholder="" maxlength="20" />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                        Unidade
                      </label>
                      <input type="text" v-model="editProduto.unidade" class="input" placeholder="" />
                    </div>
                  </div>

                  <!-- Produto -->
                  <div>
                    <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                      Produto
                    </label>
                    <input type="text" v-model="editProduto.nome" class="input" placeholder="" />
                  </div>
                </div>

                <!-- Modal Footer -->
                <div class="border-t border-border-light dark:border-border-dark px-6 py-4 flex items-center justify-end gap-3">
                  <button @click="closeEditModal" class="btn btn-secondary" :disabled="saving">Cancelar</button>
                  <button @click="updateProduto" :disabled="saving" class="btn btn-primary">
                    <span v-if="saving" class="animate-spin material-icons text-sm">refresh</span>
                    {{ saving ? 'Salvando...' : 'Salvar alterações' }}
                  </button>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </Transition>
    </Teleport>

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
        <div v-if="showDetailsSlideover" class="fixed inset-0 z-50 overflow-hidden">
          <div class="fixed inset-0 glass-backdrop" @click="closeDetailsSlideover"></div>

          <div class="fixed inset-y-0 right-0 flex max-w-full">
            <Transition
              enter-active-class="transform transition-transform duration-300 ease-out"
              enter-from-class="translate-x-full"
              enter-to-class="translate-x-0"
              leave-active-class="transform transition-transform duration-200 ease-in"
              leave-from-class="translate-x-0"
              leave-to-class="translate-x-full"
            >
              <div v-if="showDetailsSlideover" class="w-screen max-w-full sm:max-w-xl">
                <div class="h-full flex flex-col glass-panel shadow-2xl">
                  <!-- Header -->
                  <div class="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100 dark:border-border-dark flex items-center justify-between gap-3">
                    <div class="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                      <div class="w-10 h-10 sm:w-14 sm:h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <span class="material-icons-outlined text-primary text-xl sm:text-2xl">inventory_2</span>
                      </div>
                      <div class="min-w-0 flex-1">
                        <h2 class="text-base sm:text-lg font-semibold text-gray-900 dark:text-text-dark truncate">
                          {{ selectedProduto?.nome }}
                        </h2>
                        <p class="text-xs sm:text-sm text-gray-500 dark:text-subtext-dark">
                          Código: {{ selectedProduto?.codigo }}
                        </p>
                      </div>
                    </div>
                    <button @click="closeDetailsSlideover" class="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shrink-0">
                      <span class="material-icons text-xl">close</span>
                    </button>
                  </div>

                  <!-- Body -->
                  <div class="flex-1 overflow-y-auto">
                    <div class="p-4 sm:p-6 space-y-5 sm:space-y-6">
                      <!-- Status -->
                      <div class="flex items-center gap-2">
                        <span :class="['inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium', selectedProduto?.ativo ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400']">
                          <span :class="['w-1.5 h-1.5 rounded-full mr-1.5', selectedProduto?.ativo ? 'bg-green-500' : 'bg-gray-400']"></span>
                          {{ selectedProduto?.ativo ? 'Ativo' : 'Inativo' }}
                        </span>
                      </div>

                      <!-- Informações do Produto -->
                      <div class="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 sm:p-5">
                        <h3 class="text-xs font-semibold text-gray-500 dark:text-subtext-dark uppercase tracking-wider mb-3 sm:mb-4">Informações</h3>
                        <div class="grid grid-cols-2 gap-3 sm:gap-4">
                          <div>
                            <p class="text-xs text-gray-500 dark:text-subtext-dark mb-1">Código</p>
                            <p class="text-sm font-medium text-gray-900 dark:text-text-dark">{{ selectedProduto?.codigo }}</p>
                          </div>
                          <div>
                            <p class="text-xs text-gray-500 dark:text-subtext-dark mb-1">Unidade</p>
                            <p class="text-sm font-medium text-gray-900 dark:text-text-dark">{{ selectedProduto?.unidade || '-' }}</p>
                          </div>
                          <div class="col-span-2">
                            <p class="text-xs text-gray-500 dark:text-subtext-dark mb-1">Produto</p>
                            <p class="text-sm font-medium text-gray-900 dark:text-text-dark">{{ selectedProduto?.nome }}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Footer -->
                  <div class="px-4 sm:px-6 py-4 border-t border-gray-100 dark:border-border-dark flex flex-col gap-2">
                    <button @click="openEditFromSlideover" class="w-full btn btn-primary justify-center">
                      <span class="material-icons text-sm">edit</span>
                      Editar produto
                    </button>
                    <button
                      @click="toggleStatus"
                      :class="[
                        'w-full btn justify-center',
                        selectedProduto?.ativo ? 'btn-secondary text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20' : 'btn-secondary text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                      ]"
                    >
                      <span class="material-icons text-sm">{{ selectedProduto?.ativo ? 'block' : 'check_circle' }}</span>
                      {{ selectedProduto?.ativo ? 'Desativar produto' : 'Ativar produto' }}
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

<script setup>
import { ref, computed, watch } from 'vue'
import { useCurrentCompany } from '~/composables/useCurrentCompany'
import { useToast } from '~/composables/useToast'

const supabase = useSupabaseClient()
const { currentCompany } = useCurrentCompany()
const { success, error: showError } = useToast()

// Estado
const loading = ref(false)
const saving = ref(false)
const produtos = ref([])

// Modais
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDetailsSlideover = ref(false)

// Produto selecionado
const selectedProduto = ref(null)

// Paginacao
const currentPage = ref(1)
const itemsPerPage = ref(10)
const pageInput = ref('1')

// Filtros
const searchQuery = ref('')
const filterStatus = ref('ativo')

// Ordenacao
const sortField = ref('nome')
const sortDirection = ref('asc')

// Novo produto
const getEmptyProduto = () => ({
  codigo: '',
  nome: '',
  unidade: ''
})

const newProduto = ref(getEmptyProduto())
const editProduto = ref({})

// Computed - Filtros
const filteredProdutos = computed(() => {
  let result = produtos.value

  // Filtro de status
  if (filterStatus.value === 'ativo') {
    result = result.filter(p => p.ativo === true)
  } else if (filterStatus.value === 'inativo') {
    result = result.filter(p => p.ativo === false)
  }

  // Filtro de busca (codigo ou nome)
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(p =>
      p.codigo?.toLowerCase().includes(query) ||
      p.nome?.toLowerCase().includes(query)
    )
  }

  result = [...result].sort((a, b) => {
    let comparison = 0
    if (sortField.value === 'codigo') {
      comparison = (a.codigo || '').localeCompare(b.codigo || '')
    } else if (sortField.value === 'nome') {
      comparison = (a.nome || '').localeCompare(b.nome || '')
    }
    return sortDirection.value === 'asc' ? comparison : -comparison
  })

  return result
})

const totalPages = computed(() => {
  return Math.ceil(filteredProdutos.value.length / itemsPerPage.value) || 1
})

const paginatedProdutos = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredProdutos.value.slice(start, end)
})

// Funcoes de carregamento
async function loadProdutos() {
  if (!currentCompany.value?.id) return

  loading.value = true
  try {
    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .eq('empresa_id', currentCompany.value.id)
      .order('nome')

    if (error) throw error

    produtos.value = data || []
  } catch (e) {
    console.error('Erro ao carregar produtos:', e)
    showError('Erro ao carregar produtos')
  } finally {
    loading.value = false
  }
}

// Ordenacao
function sortBy(field) {
  if (sortField.value === field) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortDirection.value = 'asc'
  }
}

// Modal de criacao
function openCreateModal() {
  newProduto.value = getEmptyProduto()
  showCreateModal.value = true
}

function closeCreateModal() {
  showCreateModal.value = false
}

async function saveProduto() {
  if (!currentCompany.value?.id) {
    showError('Nenhuma empresa selecionada')
    return
  }

  saving.value = true
  try {
    const { error } = await supabase
      .from('produtos')
      .insert({
        empresa_id: currentCompany.value.id,
        codigo: newProduto.value.codigo || null,
        nome: newProduto.value.nome || null,
        unidade: newProduto.value.unidade || null
      })

    if (error) throw error

    success('Produto criado com sucesso')
    closeCreateModal()
    await loadProdutos()
  } catch (e) {
    console.error('Erro ao criar produto:', e)
    showError(e.message || 'Erro ao criar produto')
  } finally {
    saving.value = false
  }
}

// Modal de edicao
function openEditModal(produto) {
  editProduto.value = { ...produto }
  showEditModal.value = true
}

function closeEditModal() {
  showEditModal.value = false
}

async function updateProduto() {
  saving.value = true
  try {
    const { error } = await supabase
      .from('produtos')
      .update({
        codigo: editProduto.value.codigo || null,
        nome: editProduto.value.nome || null,
        unidade: editProduto.value.unidade || null
      })
      .eq('id', editProduto.value.id)

    if (error) throw error

    success('Produto atualizado com sucesso')
    closeEditModal()

    if (selectedProduto.value?.id === editProduto.value.id) {
      selectedProduto.value = { ...editProduto.value }
    }

    await loadProdutos()
  } catch (e) {
    console.error('Erro ao atualizar produto:', e)
    showError(e.message || 'Erro ao atualizar produto')
  } finally {
    saving.value = false
  }
}

// Slideover de detalhes
function openDetailsSlideover(produto) {
  selectedProduto.value = produto
  showDetailsSlideover.value = true
}

function closeDetailsSlideover() {
  showDetailsSlideover.value = false
}

function openEditFromSlideover() {
  openEditModal(selectedProduto.value)
}

async function toggleStatus() {
  if (!selectedProduto.value) return

  const newStatus = !selectedProduto.value.ativo

  try {
    const { error } = await supabase
      .from('produtos')
      .update({ ativo: newStatus })
      .eq('id', selectedProduto.value.id)

    if (error) throw error

    selectedProduto.value.ativo = newStatus
    success(`Produto ${newStatus ? 'ativado' : 'desativado'} com sucesso`)
    await loadProdutos()
  } catch (e) {
    console.error('Erro ao alterar status:', e)
    showError('Erro ao alterar status do produto')
  }
}

// Watch para recarregar quando a empresa mudar
watch(
  () => currentCompany.value?.id,
  (newId) => {
    if (newId) {
      loadProdutos()
    }
  },
  { immediate: true }
)

// Reset da pagina quando filtros mudam
watch([searchQuery, filterStatus], () => {
  currentPage.value = 1
  pageInput.value = '1'
})

// Sincronizar pageInput com currentPage
watch(currentPage, (newVal) => {
  pageInput.value = String(newVal)
})

// Watch para itemsPerPage
watch(itemsPerPage, () => {
  currentPage.value = 1
  pageInput.value = '1'
})

// Funcao para ir para pagina especifica
function goToPage() {
  const page = parseInt(pageInput.value)
  if (!isNaN(page) && page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  } else {
    pageInput.value = String(currentPage.value)
  }
}
</script>
