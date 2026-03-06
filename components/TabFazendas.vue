<template>
  <div>
    <!-- Toolbar: Busca + Ação -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-4 mb-4">
      <!-- Esquerda: Busca -->
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
        <div class="relative">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 material-icons-outlined text-gray-400 text-base">search</span>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar fazendas..."
            class="input w-full sm:w-64 text-sm pl-9"
          />
        </div>
        <select v-model="filtroStatus" class="input text-sm w-full sm:w-28 shrink-0">
          <option value="ativas">Ativas</option>
          <option value="inativas">Inativas</option>
          <option value="todas">Todas</option>
        </select>
      </div>
      <!-- Direita: Botão -->
      <button @click="openModal(null)" class="btn btn-primary shrink-0 justify-center sm:justify-start">
        <span class="material-icons-outlined text-sm">add</span>
        Nova fazenda
      </button>
    </div>

    <!-- Card da Tabela -->
    <div class="card overflow-hidden">

      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>

      <!-- Tabela -->
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-100 dark:bg-gray-700/50 border-b border-border-light dark:border-border-dark">
              <th class="table-header rounded-tl-lg w-24 cursor-pointer hover:text-text-light dark:hover:text-text-dark" @click="sortBy('codigo')">
                <div class="flex items-center gap-1">
                  Código
                  <span v-if="sortField === 'codigo'" class="material-icons-outlined text-xs">
                    {{ sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward' }}
                  </span>
                </div>
              </th>
              <th class="table-header cursor-pointer hover:text-text-light dark:hover:text-text-dark" @click="sortBy('nome')">
                <div class="flex items-center gap-1">
                  Nome
                  <span v-if="sortField === 'nome'" class="material-icons-outlined text-xs">
                    {{ sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward' }}
                  </span>
                </div>
              </th>
              <th class="table-header text-center">Unid/Bandeja</th>
              <th class="table-header text-center">Andares</th>
              <th class="table-header text-center">Band/Andar</th>
              <th class="table-header text-center">Capacidade</th>
              <th class="table-header text-center w-24">Status</th>
              <th class="table-header text-center w-24 rounded-tr-lg">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-light dark:divide-border-dark">
            <tr
              v-for="fazenda in paginatedFazendas"
              :key="fazenda.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
              @click="openModal(fazenda)"
            >
              <td class="table-cell w-24 font-medium text-primary">{{ fazenda.codigo }}</td>
              <td class="table-cell font-medium">{{ fazenda.nome }}</td>
              <td class="table-cell text-center">{{ fazenda.unidades_por_bandeja }}</td>
              <td class="table-cell text-center">{{ fazenda.numero_andares }}</td>
              <td class="table-cell text-center">{{ fazenda.bandejas_por_andar }}</td>
              <td class="table-cell text-center font-medium">{{ fazenda.capacidade }}</td>
              <td class="table-cell text-center">
                <span :class="['badge text-[10px]', fazenda.status === 'active' ? 'badge-success' : 'badge-inactive']">
                  {{ fazenda.status === 'active' ? 'Ativa' : 'Inativa' }}
                </span>
              </td>
              <td class="table-cell text-center">
                <button
                  @click.stop="openModal(fazenda)"
                  class="text-gray-400 hover:text-primary transition-colors"
                  title="Ver fazenda"
                >
                  <span class="material-icons-outlined text-sm">visibility</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty State -->
      <div v-if="!loading && filteredFazendas.length === 0" class="flex flex-col items-center justify-center text-center py-12">
        <span class="material-icons-outlined text-4xl text-gray-300 dark:text-gray-600 mb-2">agriculture</span>
        <h3 class="text-lg font-medium text-text-light dark:text-text-dark mb-1">Nenhuma fazenda encontrada</h3>
        <p class="text-sm text-subtext-light dark:text-subtext-dark mb-4">Comece cadastrando sua primeira fazenda</p>
        <button @click="openModal(null)" class="btn btn-primary">
          <span class="material-icons-outlined text-sm">add</span>
          Nova fazenda
        </button>
      </div>

      <!-- Paginação -->
      <div v-if="filteredFazendas.length > 0" class="p-4 flex flex-col sm:flex-row items-center justify-between border-t border-border-light dark:border-border-dark text-xs text-subtext-light dark:text-subtext-dark gap-4">
        <div class="flex items-center gap-4">
          <select v-model="itemsPerPage" class="border border-border-light dark:border-border-dark rounded px-2 py-1 bg-white dark:bg-gray-800 text-sm cursor-pointer">
            <option :value="10">10 linhas</option>
            <option :value="25">25 linhas</option>
            <option :value="50">50 linhas</option>
          </select>
          <span>{{ filteredFazendas.length }} registros</span>
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

    <!-- ======================= -->
    <!-- MODAL FAZENDA (z-[60]) -->
    <!-- ======================= -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        leave-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        leave-to-class="opacity-0"
      >
        <div v-if="showModal" class="fixed inset-0 z-[60] overflow-y-auto">
          <div class="fixed inset-0 glass-backdrop" @click="closeModal"></div>
          <div class="flex min-h-full items-center justify-center p-4">
            <Transition
              enter-active-class="transition-all duration-200"
              leave-active-class="transition-all duration-200"
              enter-from-class="opacity-0 scale-95"
              leave-to-class="opacity-0 scale-95"
            >
              <div v-if="showModal" class="relative glass-panel rounded-lg shadow-xl w-full max-w-xl">

                <!-- Header -->
                <div class="border-b border-border-light dark:border-border-dark px-6 py-4 flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary shrink-0">
                      <span class="material-icons-outlined text-primary text-lg">agriculture</span>
                    </div>
                    <h2 class="text-lg font-semibold text-text-light dark:text-text-dark">
                      {{ isEditing ? (form.codigo ? form.codigo + ' - ' : '') + (form.nome || 'Editar fazenda') : 'Nova fazenda' }}
                    </h2>
                  </div>
                  <button @click="closeModal" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <span class="material-icons-outlined">close</span>
                  </button>
                </div>

                <!-- Body -->
                <div class="p-6 space-y-4 overflow-y-auto max-h-[70vh]">

                  <!-- Código e Nome -->
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                        Código <span class="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        v-model="form.codigo"
                        :class="['input', formAttempted && !form.codigo ? 'border-red-500 dark:border-red-500' : '']"
                        placeholder="Ex: CAMP"
                        maxlength="10"
                      />
                      <span v-if="formAttempted && !form.codigo" class="text-xs text-red-500 mt-1">Campo obrigatório</span>
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                        Nome <span class="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        v-model="form.nome"
                        :class="['input', formAttempted && !form.nome ? 'border-red-500 dark:border-red-500' : '']"
                        placeholder="Ex: Campinas"
                      />
                      <span v-if="formAttempted && !form.nome" class="text-xs text-red-500 mt-1">Campo obrigatório</span>
                    </div>
                  </div>

                  <!-- Unidades por bandeja -->
                  <div>
                    <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Unidades por bandeja</label>
                    <input type="number" v-model.number="form.unidades_por_bandeja" class="input" placeholder="Ex: 6" min="1" />
                  </div>

                  <!-- Número de andares e Bandejas por andar -->
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Número de andares</label>
                      <input type="number" v-model.number="form.numero_andares" class="input" placeholder="Ex: 3" min="1" />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Bandejas por andar</label>
                      <input type="number" v-model.number="form.bandejas_por_andar" class="input" placeholder="Ex: 2" min="1" />
                    </div>
                  </div>

                  <!-- Capacidade (calculada automaticamente) -->
                  <div>
                    <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Capacidade</label>
                    <div class="input bg-gray-100 dark:bg-gray-700 cursor-not-allowed">
                      {{ capacidadeCalculada }}
                    </div>
                    <p class="text-xs text-subtext-light dark:text-subtext-dark mt-1">
                      Calculado: Unidades × Andares × Bandejas/andar
                    </p>
                  </div>

                </div>

                <!-- Footer -->
                <div class="border-t border-border-light dark:border-border-dark px-6 py-4 flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <button
                      v-if="isEditing"
                      @click="deleteFazenda"
                      class="btn btn-secondary text-red-600 dark:text-red-400"
                    >
                      <span class="material-icons-outlined text-sm">delete</span>
                      Excluir
                    </button>
                    <button
                      v-if="isEditing"
                      @click="toggleStatus"
                      :class="[
                        'btn btn-secondary text-sm',
                        form.status === 'active'
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      ]"
                    >
                      <span class="material-icons-outlined text-sm">
                        {{ form.status === 'active' ? 'block' : 'check_circle' }}
                      </span>
                      {{ form.status === 'active' ? 'Desativar' : 'Ativar' }}
                    </button>
                  </div>
                  <div class="flex items-center gap-3">
                    <button @click="closeModal" class="btn btn-secondary">Cancelar</button>
                    <button @click="saveOrUpdate" :disabled="saving" class="btn btn-primary">
                      <span v-if="saving" class="animate-spin material-icons-outlined text-sm">refresh</span>
                      {{ saving ? 'Salvando...' : (isEditing ? 'Salvar alterações' : 'Salvar fazenda') }}
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

// ===========================
// Estado principal
// ===========================
const loading = ref(false)
const saving = ref(false)
const fazendas = ref([])

// Modal
const showModal = ref(false)

// Formulário
const getEmptyFazenda = () => ({
  id: null,
  codigo: '',
  nome: '',
  unidades_por_bandeja: 6,
  numero_andares: 1,
  bandejas_por_andar: 6,
  status: 'active'
})

const form = ref(getEmptyFazenda())
const formAttempted = ref(false)
const isEditing = computed(() => !!form.value.id)

// Paginação
const currentPage = ref(1)
const itemsPerPage = ref(10)
const pageInput = ref('1')

// Filtros
const searchQuery = ref('')
const filtroStatus = ref('ativas')

// Ordenação
const sortField = ref('nome')
const sortDirection = ref('asc')

// ===========================
// Computed
// ===========================
const capacidadeCalculada = computed(() => {
  const { unidades_por_bandeja, numero_andares, bandejas_por_andar } = form.value
  if (unidades_por_bandeja && numero_andares && bandejas_por_andar) {
    return unidades_por_bandeja * numero_andares * bandejas_por_andar
  }
  return 0
})

const filteredFazendas = computed(() => {
  let result = fazendas.value

  // Filtro por status
  if (filtroStatus.value === 'ativas') {
    result = result.filter(f => f.status === 'active')
  } else if (filtroStatus.value === 'inativas') {
    result = result.filter(f => f.status !== 'active')
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(f =>
      f.codigo.toLowerCase().includes(query) ||
      f.nome.toLowerCase().includes(query)
    )
  }

  result = [...result].sort((a, b) => {
    let comparison = 0
    if (sortField.value === 'codigo') {
      comparison = a.codigo.localeCompare(b.codigo)
    } else if (sortField.value === 'nome') {
      comparison = a.nome.localeCompare(b.nome)
    }
    return sortDirection.value === 'asc' ? comparison : -comparison
  })

  return result
})

const totalPages = computed(() => {
  return Math.ceil(filteredFazendas.value.length / itemsPerPage.value) || 1
})

const paginatedFazendas = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredFazendas.value.slice(start, end)
})

// ===========================
// Carregamento de dados
// ===========================
async function loadFazendas() {
  if (!currentCompany.value?.id) return

  loading.value = true
  try {
    const { data, error } = await supabase
      .from('fazendas')
      .select('*')
      .eq('empresa_id', currentCompany.value.id)
      .order('nome')

    if (error) throw error
    fazendas.value = data || []
  } catch (e) {
    console.error('Erro ao carregar fazendas:', e)
    showError('Erro ao carregar fazendas')
  } finally {
    loading.value = false
  }
}

// ===========================
// Ordenação
// ===========================
function sortBy(field) {
  if (sortField.value === field) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortDirection.value = 'asc'
  }
}

// ===========================
// Modal
// ===========================
function openModal(fazenda) {
  formAttempted.value = false

  if (fazenda) {
    form.value = { ...getEmptyFazenda(), ...fazenda }
  } else {
    form.value = getEmptyFazenda()
  }

  showModal.value = true
}

function closeModal() {
  showModal.value = false
  formAttempted.value = false
}

async function saveOrUpdate() {
  if (isEditing.value) {
    await updateFazenda()
  } else {
    await saveFazenda()
  }
}

async function saveFazenda() {
  if (!currentCompany.value?.id) {
    showError('Nenhuma empresa selecionada')
    return
  }

  formAttempted.value = true
  if (!form.value.codigo || !form.value.nome) {
    showError('Preencha todos os campos obrigatórios')
    return
  }

  saving.value = true
  try {
    const andares = form.value.numero_andares || 1
    const bandejas = form.value.bandejas_por_andar || 6
    const capacidadeBandejas = andares * bandejas

    const { error } = await supabase
      .from('fazendas')
      .insert({
        empresa_id: currentCompany.value.id,
        codigo: form.value.codigo,
        nome: form.value.nome,
        unidades_por_bandeja: form.value.unidades_por_bandeja || 6,
        numero_andares: andares,
        bandejas_por_andar: bandejas,
        capacidade_bandejas: capacidadeBandejas,
        status: 'active'
      })

    if (error) throw error

    success('Fazenda criada com sucesso')
    closeModal()
    await loadFazendas()
  } catch (e) {
    console.error('Erro ao criar fazenda:', e)
    showError(e.message || 'Erro ao criar fazenda')
  } finally {
    saving.value = false
  }
}

async function updateFazenda() {
  formAttempted.value = true
  if (!form.value.codigo || !form.value.nome) {
    showError('Preencha todos os campos obrigatórios')
    return
  }

  saving.value = true
  try {
    const andares = form.value.numero_andares || 1
    const bandejas = form.value.bandejas_por_andar || 1
    const capacidadeBandejas = andares * bandejas

    const { error } = await supabase
      .from('fazendas')
      .update({
        codigo: form.value.codigo,
        nome: form.value.nome,
        unidades_por_bandeja: form.value.unidades_por_bandeja,
        numero_andares: form.value.numero_andares,
        bandejas_por_andar: form.value.bandejas_por_andar,
        capacidade_bandejas: capacidadeBandejas,
        status: form.value.status
      })
      .eq('id', form.value.id)

    if (error) throw error

    success('Fazenda atualizada com sucesso')
    closeModal()
    await loadFazendas()
  } catch (e) {
    console.error('Erro ao atualizar fazenda:', e)
    showError(e.message || 'Erro ao atualizar fazenda')
  } finally {
    saving.value = false
  }
}

async function toggleStatus() {
  if (!form.value.id) return
  const newStatus = form.value.status === 'active' ? 'inactive' : 'active'
  const label = newStatus === 'active' ? 'ativar' : 'desativar'

  if (!confirm(`Tem certeza que deseja ${label} esta fazenda?`)) return

  saving.value = true
  try {
    const { error } = await supabase
      .from('fazendas')
      .update({ status: newStatus })
      .eq('id', form.value.id)

    if (error) throw error

    success(`Fazenda ${newStatus === 'active' ? 'ativada' : 'desativada'} com sucesso`)
    closeModal()
    await loadFazendas()
  } catch (e) {
    console.error('Erro ao alterar status:', e)
    showError(e.message || 'Erro ao alterar status')
  } finally {
    saving.value = false
  }
}

async function deleteFazenda() {
  if (!form.value.id) return

  if (!confirm('Tem certeza que deseja excluir esta fazenda? Esta ação não pode ser desfeita.')) return

  saving.value = true
  try {
    const { error } = await supabase
      .from('fazendas')
      .delete()
      .eq('id', form.value.id)

    if (error) throw error

    success('Fazenda excluída com sucesso')
    closeModal()
    await loadFazendas()
  } catch (e) {
    console.error('Erro ao excluir fazenda:', e)
    showError(e.message || 'Erro ao excluir fazenda')
  } finally {
    saving.value = false
  }
}

// ===========================
// Watchers
// ===========================
watch(
  () => currentCompany.value?.id,
  (newId) => {
    if (newId) {
      loadFazendas()
    }
  },
  { immediate: true }
)

watch([searchQuery, filtroStatus], () => {
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

function goToPage() {
  const page = parseInt(pageInput.value)
  if (!isNaN(page) && page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  } else {
    pageInput.value = String(currentPage.value)
  }
}
</script>

<style scoped>
.badge-inactive {
  @apply bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300;
}
</style>
