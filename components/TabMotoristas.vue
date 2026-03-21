<template>
  <div>
    <!-- Toolbar: Filtros + Ação -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-4 mb-4">
      <!-- Esquerda: Busca + Filtro -->
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
        <!-- Busca -->
        <div class="relative">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 material-icons-outlined text-gray-400 text-base">search</span>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Pesquise aqui..."
            class="input w-full sm:w-64 text-sm pl-9"
          />
        </div>
        <!-- Filtro Status -->
        <select v-model="filterStatus" class="input text-sm w-full sm:w-28 shrink-0">
          <option value="ativo">Ativos</option>
          <option value="inativo">Inativos</option>
          <option value="">Todos</option>
        </select>
      </div>
      <!-- Direita: Botão -->
      <button @click="openCreateModal" class="btn btn-primary shrink-0 justify-center sm:justify-start">
        <span class="material-icons-outlined text-sm">add</span>
        Novo motorista
      </button>
    </div>

    <!-- Card da Tabela -->
    <div class="card overflow-hidden">
      <!-- Tabela - Desktop -->
      <div class="hidden md:block overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-50 dark:bg-gray-800 border-b border-border-light dark:border-border-dark">
              <th class="table-header cursor-pointer select-none" @click="toggleSort('nome')">
                <div class="flex items-center gap-1">
                  Nome
                  <span class="material-icons-outlined text-xs">{{ getSortIcon('nome') }}</span>
                </div>
              </th>
              <th class="table-header">Telefone</th>
              <th class="table-header">Veículo</th>
              <th class="table-header text-center w-24">Status</th>
              <th class="table-header text-center w-24">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-light dark:divide-border-dark">
            <tr
              v-for="motorista in paginatedMotoristas"
              :key="motorista.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
              @click="openEditModal(motorista)"
            >
              <td class="table-cell">
                <p class="font-medium text-text-light dark:text-text-dark">{{ motorista.nome }}</p>
              </td>
              <td class="table-cell text-subtext-light dark:text-subtext-dark">
                {{ motorista.telefone || '-' }}
              </td>
              <td class="table-cell text-subtext-light dark:text-subtext-dark">
                {{ motorista.veiculo || '-' }}
              </td>
              <td class="table-cell text-center">
                <span :class="['badge', motorista.ativo ? 'badge-success' : 'badge-inactive']">
                  {{ motorista.ativo ? 'Ativo' : 'Inativo' }}
                </span>
              </td>
              <td class="table-cell text-center" @click.stop>
                <button
                  @click="openEditModal(motorista)"
                  class="text-gray-400 hover:text-primary transition-colors"
                  title="Editar motorista"
                >
                  <span class="material-icons-outlined text-sm">edit</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Cards - Mobile -->
      <div class="md:hidden divide-y divide-border-light dark:divide-border-dark">
        <div
          v-for="motorista in paginatedMotoristas"
          :key="motorista.id"
          class="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
          @click="openEditModal(motorista)"
        >
          <div class="flex items-start gap-3">
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <p class="font-medium text-text-light dark:text-text-dark truncate">{{ motorista.nome }}</p>
                  <p v-if="motorista.veiculo" class="text-xs text-subtext-light dark:text-subtext-dark truncate">{{ motorista.veiculo }}</p>
                </div>
                <span :class="['badge shrink-0', motorista.ativo ? 'badge-success' : 'badge-inactive']">
                  {{ motorista.ativo ? 'Ativo' : 'Inativo' }}
                </span>
              </div>
              <p v-if="motorista.telefone" class="text-xs text-subtext-light dark:text-subtext-dark mt-1">
                {{ motorista.telefone }}
              </p>
            </div>
            <button
              @click.stop="openEditModal(motorista)"
              class="text-gray-400 hover:text-primary transition-colors shrink-0"
            >
              <span class="material-icons-outlined text-xl">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-12">
        <span class="material-icons-outlined text-4xl text-gray-300 dark:text-gray-600 animate-spin">refresh</span>
        <p class="text-sm text-subtext-light dark:text-subtext-dark mt-2">Carregando...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredMotoristas.length === 0 && !loading" class="text-center py-12 flex flex-col items-center px-4">
        <span class="material-icons-outlined text-4xl text-gray-300 dark:text-gray-600 mb-2">local_shipping</span>
        <h3 class="text-lg font-medium text-text-light dark:text-text-dark mb-1">Nenhum motorista encontrado</h3>
        <p class="text-sm text-subtext-light dark:text-subtext-dark mb-4">
          {{ searchQuery ? 'Tente ajustar a busca' : 'Comece cadastrando seu primeiro motorista' }}
        </p>
        <button v-if="!searchQuery" @click="openCreateModal" class="btn btn-primary">
          <span class="material-icons-outlined text-sm">add</span>
          Novo motorista
        </button>
      </div>

      <!-- Paginação -->
      <div v-if="filteredMotoristas.length > 0" class="p-3 sm:p-4 border-t border-border-light dark:border-border-dark text-xs text-subtext-light dark:text-subtext-dark">
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
            <span class="text-xs">{{ filteredMotoristas.length }} registros</span>
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

    <!-- Modal de Criação/Edição -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-200"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="showModal" class="fixed inset-0 z-[80] overflow-y-auto">
          <div class="fixed inset-0 glass-backdrop" @click="closeModal"></div>
          <div class="flex min-h-full items-center justify-center p-4">
            <Transition
              enter-active-class="transition-all duration-200"
              enter-from-class="opacity-0 scale-95"
              enter-to-class="opacity-100 scale-100"
              leave-active-class="transition-all duration-200"
              leave-from-class="opacity-100 scale-100"
              leave-to-class="opacity-0 scale-95"
            >
              <div v-if="showModal" class="relative glass-panel rounded-lg shadow-xl w-full max-w-lg">
                <!-- Modal Header -->
                <div class="border-b border-border-light dark:border-border-dark px-6 py-4 flex items-center justify-between">
                  <h2 class="text-lg font-semibold text-text-light dark:text-text-dark">
                    {{ isEditing ? 'Editar motorista' : 'Cadastro de motorista' }}
                  </h2>
                  <button @click="closeModal" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <span class="material-icons-outlined">close</span>
                  </button>
                </div>

                <!-- Modal Body -->
                <div class="p-6 space-y-5">
                  <!-- Nome -->
                  <div>
                    <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Nome <span class="text-red-500">*</span></label>
                    <input type="text" v-model="formData.nome" class="input" placeholder="Nome do motorista" />
                  </div>

                  <!-- Telefone -->
                  <div>
                    <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Telefone</label>
                    <input type="text" v-model="formData.telefone" class="input" placeholder="(00) 00000-0000" v-maska data-maska="(##) #####-####" />
                  </div>

                  <!-- Veículo -->
                  <div>
                    <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Veículo</label>
                    <input type="text" v-model="formData.veiculo" class="input" placeholder="Ex: Fiorino branca" />
                  </div>

                  <!-- Status (só no edit) -->
                  <div v-if="isEditing" class="flex items-center gap-3">
                    <label class="flex items-center gap-2 text-sm text-text-light dark:text-text-dark">
                      <input
                        type="checkbox"
                        v-model="formData.ativo"
                        class="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                      />
                      Motorista ativo
                    </label>
                  </div>
                </div>

                <!-- Modal Footer -->
                <div class="border-t border-border-light dark:border-border-dark px-6 py-4 flex items-center justify-end gap-3">
                  <button @click="closeModal" class="btn btn-secondary">Cancelar</button>
                  <button
                    @click="saveMotorista"
                    class="btn btn-primary"
                    :disabled="!isFormValid || saving"
                  >
                    <span v-if="saving" class="material-icons-outlined text-sm animate-spin">refresh</span>
                    {{ saving ? 'Salvando...' : (isEditing ? 'Salvar' : 'Cadastrar') }}
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

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useCurrentCompany } from '~/composables/useCurrentCompany'
import { useToast } from '~/composables/useToast'

interface Motorista {
  id: string
  empresa_id: string
  nome: string
  telefone: string | null
  veiculo: string | null
  ativo: boolean
  created_at: string
  updated_at: string
}

const supabase = useSupabaseClient()
const { currentCompany } = useCurrentCompany()
const toast = useToast()

// Estado
const motoristas = ref<Motorista[]>([])
const loading = ref(false)
const saving = ref(false)

// Modal
const showModal = ref(false)
const isEditing = ref(false)

// Paginação
const currentPage = ref(1)
const itemsPerPage = ref(10)
const pageInput = ref('1')

// Filtros
const searchQuery = ref('')
const filterStatus = ref('ativo')

// Ordenação
const sortField = ref<string>('nome')
const sortDirection = ref<'asc' | 'desc'>('asc')

// Form vazio
const getEmptyForm = () => ({
  nome: '',
  telefone: '',
  veiculo: '',
  ativo: true
})

const formData = ref(getEmptyForm())
const editingId = ref<string | null>(null)

// Computed
const filteredMotoristas = computed(() => {
  let result = [...motoristas.value]

  if (filterStatus.value === 'ativo') {
    result = result.filter(m => m.ativo === true)
  } else if (filterStatus.value === 'inativo') {
    result = result.filter(m => m.ativo === false)
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(m =>
      m.nome?.toLowerCase().includes(query) ||
      m.telefone?.toLowerCase().includes(query) ||
      m.veiculo?.toLowerCase().includes(query)
    )
  }

  result.sort((a, b) => {
    let aVal: any = a[sortField.value as keyof Motorista]
    let bVal: any = b[sortField.value as keyof Motorista]

    if (aVal === null || aVal === undefined) aVal = ''
    if (bVal === null || bVal === undefined) bVal = ''

    if (typeof aVal === 'string') aVal = aVal.toLowerCase()
    if (typeof bVal === 'string') bVal = bVal.toLowerCase()

    if (aVal < bVal) return sortDirection.value === 'asc' ? -1 : 1
    if (aVal > bVal) return sortDirection.value === 'asc' ? 1 : -1
    return 0
  })

  return result
})

const totalPages = computed(() => Math.ceil(filteredMotoristas.value.length / itemsPerPage.value) || 1)

const paginatedMotoristas = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  return filteredMotoristas.value.slice(start, start + itemsPerPage.value)
})

const isFormValid = computed(() => {
  return formData.value.nome.trim().length > 0
})

// Funções auxiliares
function toggleSort(field: string) {
  if (sortField.value === field) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortDirection.value = 'asc'
  }
}

function getSortIcon(field: string): string {
  if (sortField.value !== field) return 'unfold_more'
  return sortDirection.value === 'asc' ? 'expand_less' : 'expand_more'
}

function goToPage() {
  const page = parseInt(pageInput.value)
  if (!isNaN(page) && page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  } else {
    pageInput.value = String(currentPage.value)
  }
}

// Carregar motoristas
async function loadMotoristas() {
  if (!currentCompany.value?.id) {
    motoristas.value = []
    return
  }

  loading.value = true
  try {
    const { data, error } = await supabase
      .from('motoristas')
      .select('*')
      .eq('empresa_id', currentCompany.value.id)
      .order('nome', { ascending: true })

    if (error) throw error
    motoristas.value = data || []
  } catch (e: any) {
    console.error('Erro ao carregar motoristas:', e)
    toast.error('Erro ao carregar motoristas')
  } finally {
    loading.value = false
  }
}

// Modal
function openCreateModal() {
  formData.value = getEmptyForm()
  editingId.value = null
  isEditing.value = false
  showModal.value = true
}

function openEditModal(motorista: Motorista) {
  formData.value = {
    nome: motorista.nome || '',
    telefone: motorista.telefone || '',
    veiculo: motorista.veiculo || '',
    ativo: motorista.ativo
  }
  editingId.value = motorista.id
  isEditing.value = true
  showModal.value = true
}

function closeModal() {
  showModal.value = false
}

async function saveMotorista() {
  if (!currentCompany.value?.id) {
    toast.error('Nenhuma empresa selecionada')
    return
  }

  if (!isFormValid.value) {
    toast.error('Preencha o nome do motorista')
    return
  }

  saving.value = true
  try {
    const motoristaData = {
      empresa_id: currentCompany.value.id,
      nome: formData.value.nome,
      telefone: formData.value.telefone || null,
      veiculo: formData.value.veiculo || null,
      ativo: formData.value.ativo
    }

    if (isEditing.value && editingId.value) {
      const { error } = await supabase
        .from('motoristas')
        .update(motoristaData)
        .eq('id', editingId.value)
        .eq('empresa_id', currentCompany.value.id)

      if (error) throw error
      toast.success('Motorista atualizado com sucesso')
    } else {
      const { error } = await supabase
        .from('motoristas')
        .insert({ ...motoristaData, ativo: true })

      if (error) throw error
      toast.success('Motorista criado com sucesso')
    }

    closeModal()
    await loadMotoristas()
  } catch (e: any) {
    console.error('Erro ao salvar motorista:', e)
    toast.error(e.message || 'Erro ao salvar motorista')
  } finally {
    saving.value = false
  }
}

// Watchers
watch(
  () => currentCompany.value?.id,
  (newId, oldId) => {
    if (newId !== oldId) {
      currentPage.value = 1
      loadMotoristas()
    }
  },
  { immediate: true }
)

watch([searchQuery, filterStatus], () => {
  currentPage.value = 1
  pageInput.value = '1'
})

watch(currentPage, (newVal) => {
  pageInput.value = String(newVal)
})

watch(itemsPerPage, () => {
  currentPage.value = 1
  pageInput.value = '1'
})

onMounted(() => {
  loadMotoristas()
})
</script>
