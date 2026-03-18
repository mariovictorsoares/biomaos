<template>
  <div>
    <!-- Toolbar: Filtros + Acao -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-4 mb-4">
      <!-- Esquerda: Filtros -->
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 flex-1">
        <!-- Filtro Status -->
        <div class="flex items-center gap-1">
          <button
            v-for="st in statusOptions"
            :key="st.value"
            @click="filterStatus = st.value"
            :class="[
              'px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap transition-all shrink-0',
              filterStatus === st.value
                ? 'bg-[#4A7C59] text-white'
                : 'bg-white dark:bg-gray-800 border border-border-light dark:border-border-dark text-text-light dark:text-text-dark hover:bg-gray-50 dark:hover:bg-gray-700'
            ]"
          >
            {{ st.label }}
          </button>
        </div>

        <!-- Filtro Especie -->
        <select v-model="filterEspecie" class="input text-xs sm:text-sm flex-1 sm:flex-none sm:w-40">
          <option value="">Espécie</option>
          <option v-for="esp in especies" :key="esp.id" :value="esp.id">
            {{ esp.nome }}
          </option>
        </select>

        <!-- Filtro Nome (etapa) -->
        <select v-model="filterNome" class="input text-xs sm:text-sm flex-1 sm:flex-none sm:w-44">
          <option value="">Etapa</option>
          <option v-for="nome in distinctNomes" :key="nome" :value="nome">
            {{ nome }}
          </option>
        </select>

        <!-- Date Range -->
        <div class="flex items-center gap-1.5">
          <span class="text-xs text-subtext-light dark:text-subtext-dark hidden sm:inline">De</span>
          <input
            type="date"
            v-model="filterDataDe"
            class="input text-xs sm:text-sm w-full sm:w-auto shrink-0"
          />
          <span class="text-xs text-subtext-light dark:text-subtext-dark hidden sm:inline">Ate</span>
          <input
            type="date"
            v-model="filterDataAte"
            class="input text-xs sm:text-sm w-full sm:w-auto shrink-0"
          />
        </div>
      </div>

      <!-- Direita: Botao Nova Tarefa -->
      <button @click="openNovaTarefa" class="btn btn-primary shrink-0 justify-center sm:justify-start">
        <span class="material-icons-outlined text-sm">add</span>
        Nova Tarefa
      </button>
    </div>

    <!-- Card da Tabela -->
    <div class="card">

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-12">
        <span class="material-icons-outlined text-4xl text-gray-300 dark:text-gray-600 animate-spin">refresh</span>
        <p class="text-sm text-subtext-light dark:text-subtext-dark mt-2">Carregando tarefas...</p>
      </div>

      <!-- Tabela - Desktop -->
      <div v-if="!loading && filteredTarefas.length > 0" class="hidden md:block overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-100 dark:bg-gray-700/50 border-b border-border-light dark:border-border-dark">
              <th class="table-header w-10 text-center">
                <span class="material-icons-outlined text-sm text-subtext-light dark:text-subtext-dark">check_box_outline_blank</span>
              </th>
              <th class="table-header">Nome</th>
              <th class="table-header text-center">Bandejas</th>
              <th class="table-header">Espécie</th>
              <th class="table-header text-center whitespace-nowrap">Data Prevista</th>
              <th class="table-header text-center whitespace-nowrap">Data Colheita</th>
              <th class="table-header">Fazenda</th>
              <th class="table-header text-center w-28">Tipo</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-light dark:divide-border-dark">
            <tr
              v-for="tarefa in paginatedTarefas"
              :key="tarefa.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <!-- Checkbox -->
              <td class="table-cell text-center p-1" @click.stop>
                <button
                  @click="toggleConcluida(tarefa)"
                  class="w-5 h-5 rounded border flex items-center justify-center transition-colors"
                  :class="tarefa.concluida
                    ? 'bg-[#4A7C59] border-[#4A7C59] text-white'
                    : 'border-gray-300 dark:border-gray-600 hover:border-[#4A7C59] dark:hover:border-[#4A7C59]'"
                >
                  <span v-if="tarefa.concluida" class="material-icons-outlined text-sm">check</span>
                </button>
              </td>
              <!-- Nome -->
              <td class="table-cell">
                <span :class="tarefa.concluida ? 'line-through text-subtext-light dark:text-subtext-dark' : 'font-medium text-text-light dark:text-text-dark'">
                  {{ tarefa.nome }}
                </span>
                <p v-if="tarefa.descricao" class="text-[11px] text-subtext-light dark:text-subtext-dark truncate max-w-[200px]" :class="{ 'line-through': tarefa.concluida }">
                  {{ tarefa.descricao }}
                </p>
              </td>
              <!-- Bandejas -->
              <td class="table-cell text-center" :class="{ 'line-through text-subtext-light dark:text-subtext-dark': tarefa.concluida }">
                {{ tarefa.bandejas || '-' }}
              </td>
              <!-- Especie -->
              <td class="table-cell" :class="{ 'line-through text-subtext-light dark:text-subtext-dark': tarefa.concluida }">
                {{ tarefa.especies?.nome || '-' }}
              </td>
              <!-- Data Prevista -->
              <td class="table-cell text-center whitespace-nowrap">
                <span :class="[
                  tarefa.concluida
                    ? 'line-through text-subtext-light dark:text-subtext-dark'
                    : isOverdue(tarefa)
                      ? 'text-red-600 dark:text-red-400 font-medium bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded'
                      : 'text-text-light dark:text-text-dark'
                ]">
                  {{ formatDateBR(tarefa.data_prevista) }}
                </span>
              </td>
              <!-- Data Colheita -->
              <td class="table-cell text-center whitespace-nowrap" :class="{ 'line-through text-subtext-light dark:text-subtext-dark': tarefa.concluida }">
                {{ tarefa.plantios?.data_colheita ? formatDateBR(tarefa.plantios.data_colheita) : '-' }}
              </td>
              <!-- Fazenda -->
              <td class="table-cell" :class="{ 'line-through text-subtext-light dark:text-subtext-dark': tarefa.concluida }">
                {{ tarefa.plantios?.fazendas?.nome || '-' }}
              </td>
              <!-- Tipo badge -->
              <td class="table-cell text-center">
                <span :class="['inline-block px-2 py-1 text-xs rounded-full border whitespace-nowrap', getTipoBadgeClass(tarefa.tipo)]">
                  {{ getTipoLabel(tarefa.tipo) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Cards - Mobile -->
      <div v-if="!loading && filteredTarefas.length > 0" class="md:hidden divide-y divide-border-light dark:divide-border-dark">
        <div
          v-for="tarefa in paginatedTarefas"
          :key="tarefa.id"
          class="p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        >
          <div class="flex items-start gap-3">
            <!-- Checkbox -->
            <button
              @click="toggleConcluida(tarefa)"
              class="w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0 mt-0.5"
              :class="tarefa.concluida
                ? 'bg-[#4A7C59] border-[#4A7C59] text-white'
                : 'border-gray-300 dark:border-gray-600 hover:border-[#4A7C59] dark:hover:border-[#4A7C59]'"
            >
              <span v-if="tarefa.concluida" class="material-icons-outlined text-sm">check</span>
            </button>
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <p :class="tarefa.concluida ? 'line-through text-subtext-light dark:text-subtext-dark' : 'font-medium text-text-light dark:text-text-dark'" class="truncate">
                    {{ tarefa.nome }}
                  </p>
                  <p v-if="tarefa.descricao" class="text-xs text-subtext-light dark:text-subtext-dark truncate" :class="{ 'line-through': tarefa.concluida }">
                    {{ tarefa.descricao }}
                  </p>
                </div>
                <span :class="['badge shrink-0 text-[10px]', getTipoBadgeClass(tarefa.tipo)]">
                  {{ getTipoLabel(tarefa.tipo) }}
                </span>
              </div>
              <div class="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-subtext-light dark:text-subtext-dark">
                <span v-if="tarefa.especies?.nome" :class="{ 'line-through': tarefa.concluida }">
                  <span class="material-icons-outlined text-[11px] align-middle mr-0.5">eco</span>
                  {{ tarefa.especies.nome }}
                </span>
                <span v-if="tarefa.bandejas" :class="{ 'line-through': tarefa.concluida }">
                  {{ tarefa.bandejas }} band.
                </span>
                <span :class="[
                  tarefa.concluida
                    ? 'line-through'
                    : isOverdue(tarefa) ? 'text-red-600 dark:text-red-400 font-medium' : ''
                ]">
                  <span class="material-icons-outlined text-[11px] align-middle mr-0.5">calendar_today</span>
                  {{ formatDateBR(tarefa.data_prevista) }}
                </span>
                <span v-if="tarefa.plantios?.fazendas?.nome" :class="{ 'line-through': tarefa.concluida }">
                  <span class="material-icons-outlined text-[11px] align-middle mr-0.5">location_on</span>
                  {{ tarefa.plantios.fazendas.nome }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="!loading && filteredTarefas.length === 0" class="text-center py-12 flex flex-col items-center px-4">
        <span class="material-icons-outlined text-4xl text-gray-300 dark:text-gray-600 mb-2">task_alt</span>
        <h3 class="text-lg font-medium text-text-light dark:text-text-dark mb-1">Nenhuma tarefa encontrada</h3>
        <p class="text-sm text-subtext-light dark:text-subtext-dark mb-4">
          {{ hasAnyFilter ? 'Tente ajustar os filtros' : 'Tarefas serão geradas automaticamente a partir do cultivo ou adicione manualmente' }}
        </p>
        <button @click="openNovaTarefa" class="btn btn-primary">
          <span class="material-icons-outlined text-sm">add</span>
          Nova Tarefa
        </button>
      </div>

      <!-- Paginacao -->
      <div v-if="filteredTarefas.length > 0" class="p-3 sm:p-4 border-t border-border-light dark:border-border-dark text-xs text-subtext-light dark:text-subtext-dark">
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
            <span class="text-xs">{{ filteredTarefas.length }} registros</span>
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

    <!-- Modal Nova Tarefa -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-200"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="showNovaTarefaModal" class="fixed inset-0 z-[60] overflow-y-auto">
          <div class="fixed inset-0 glass-backdrop" @click="closeNovaTarefa"></div>
          <div class="flex min-h-full items-center justify-center p-4">
            <Transition
              enter-active-class="transition-all duration-200"
              enter-from-class="opacity-0 scale-95"
              enter-to-class="opacity-100 scale-100"
              leave-active-class="transition-all duration-200"
              leave-from-class="opacity-100 scale-100"
              leave-to-class="opacity-0 scale-95"
            >
              <div v-if="showNovaTarefaModal" class="relative glass-panel rounded-lg shadow-xl w-full max-w-lg">
                <!-- Modal Header -->
                <div class="border-b border-border-light dark:border-border-dark px-6 py-4 flex items-center justify-between">
                  <h2 class="text-lg font-semibold text-text-light dark:text-text-dark">Nova Tarefa</h2>
                  <button @click="closeNovaTarefa" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <span class="material-icons-outlined">close</span>
                  </button>
                </div>

                <!-- Modal Body -->
                <div class="p-6 space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Nome *</label>
                    <input
                      v-model="novaTarefa.nome"
                      type="text"
                      class="input"
                      placeholder="Nome da tarefa"
                      required
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Descrição</label>
                    <textarea
                      v-model="novaTarefa.descricao"
                      class="input min-h-[60px] resize-y"
                      placeholder="Descrição da tarefa (opcional)"
                    ></textarea>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Data Prevista *</label>
                    <input
                      v-model="novaTarefa.data_prevista"
                      type="date"
                      class="input"
                      required
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Espécie</label>
                    <select v-model="novaTarefa.especie_id" class="input">
                      <option value="">Nenhuma</option>
                      <option v-for="esp in especies" :key="esp.id" :value="esp.id">
                        {{ esp.nome }}
                      </option>
                    </select>
                  </div>
                </div>

                <!-- Modal Footer -->
                <div class="border-t border-border-light dark:border-border-dark px-6 py-4 flex items-center justify-end gap-3">
                  <button @click="closeNovaTarefa" class="btn btn-secondary" :disabled="saving">Cancelar</button>
                  <button @click="salvarNovaTarefa" class="btn btn-primary" :disabled="saving || !isNovaTarefaValid">
                    <span v-if="saving" class="material-icons-outlined animate-spin text-sm">refresh</span>
                    {{ saving ? 'Salvando...' : 'Salvar' }}
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

interface Tarefa {
  id: string
  empresa_id: string
  plantio_id?: string
  nome: string
  descricao?: string
  tipo: 'cultivo' | 'manual' | 'recorrente'
  bandejas?: number
  especie_id?: string
  data_prevista: string
  data_conclusao?: string
  concluida: boolean
  especies?: { id: string; nome: string }
  plantios?: {
    id: string
    data_colheita?: string
    fazendas?: { nome: string }
  }
}

interface Especie {
  id: string
  nome: string
}

const supabase = useSupabaseClient()
const { currentCompany } = useCurrentCompany()
const { success, error: showError } = useToast()

// Estado
const tarefas = ref<Tarefa[]>([])
const especies = ref<Especie[]>([])
const loading = ref(false)
const saving = ref(false)

// Filtros
const filterStatus = ref<'pendentes' | 'concluidas' | 'todas'>('pendentes')
const filterEspecie = ref('')
const filterNome = ref('')
const filterDataDe = ref('')
const filterDataAte = ref('')

const statusOptions = [
  { value: 'pendentes' as const, label: 'Pendentes' },
  { value: 'concluidas' as const, label: 'Concluídas' },
  { value: 'todas' as const, label: 'Todas' },
]

// Modal Nova Tarefa
const showNovaTarefaModal = ref(false)
const novaTarefa = ref({
  nome: '',
  descricao: '',
  data_prevista: '',
  especie_id: '',
})

// Paginacao
const currentPage = ref(1)
const itemsPerPage = ref(25)
const pageInput = ref('1')

// Computed: nomes distintos para dropdown de etapa
const distinctNomes = computed(() => {
  const nomes = new Set(tarefas.value.map(t => t.nome))
  return Array.from(nomes).sort()
})

// Computed: filteredTarefas
const filteredTarefas = computed(() => {
  let result = [...tarefas.value]

  // Filtro por status
  if (filterStatus.value === 'pendentes') {
    result = result.filter(t => !t.concluida)
  } else if (filterStatus.value === 'concluidas') {
    result = result.filter(t => t.concluida)
  }

  // Filtro por especie
  if (filterEspecie.value) {
    result = result.filter(t => t.especie_id === filterEspecie.value)
  }

  // Filtro por nome (etapa)
  if (filterNome.value) {
    result = result.filter(t => t.nome === filterNome.value)
  }

  // Filtro por data range
  if (filterDataDe.value) {
    result = result.filter(t => t.data_prevista >= filterDataDe.value)
  }
  if (filterDataAte.value) {
    result = result.filter(t => t.data_prevista <= filterDataAte.value)
  }

  // Ordenacao: nao concluidas primeiro, depois por data_prevista
  result.sort((a, b) => {
    if (a.concluida !== b.concluida) {
      return a.concluida ? 1 : -1
    }
    return (a.data_prevista || '').localeCompare(b.data_prevista || '')
  })

  return result
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredTarefas.value.length / itemsPerPage.value)))

const paginatedTarefas = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  return filteredTarefas.value.slice(start, start + itemsPerPage.value)
})

const hasAnyFilter = computed(() => {
  return filterStatus.value !== 'pendentes' || filterEspecie.value || filterNome.value || filterDataDe.value || filterDataAte.value
})

const isNovaTarefaValid = computed(() => {
  return novaTarefa.value.nome.trim() && novaTarefa.value.data_prevista
})

// Helpers
function today(): string {
  const d = new Date()
  return d.toISOString().split('T')[0]
}

function isOverdue(tarefa: Tarefa): boolean {
  if (tarefa.concluida || !tarefa.data_prevista) return false
  return tarefa.data_prevista < today()
}

function formatDateBR(dateStr?: string): string {
  if (!dateStr) return '-'
  const parts = dateStr.split('-')
  if (parts.length !== 3) return dateStr
  return `${parts[2]}/${parts[1]}/${parts[0]}`
}

function getTipoBadgeClass(tipo: string): string {
  switch (tipo) {
    case 'cultivo':
      return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800'
    case 'manual':
      return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800'
    case 'recorrente':
      return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800'
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600'
  }
}

function getTipoLabel(tipo: string): string {
  switch (tipo) {
    case 'cultivo': return 'Cultivo'
    case 'manual': return 'Manual'
    case 'recorrente': return 'Recorrente'
    default: return tipo
  }
}

// Data fetching
async function loadTarefas() {
  if (!currentCompany.value?.id) return
  loading.value = true
  try {
    const { data, error } = await supabase
      .from('tarefas')
      .select('*, especies(id, nome), plantios(id, data_colheita, fazendas(nome))')
      .eq('empresa_id', currentCompany.value.id)
      .order('data_prevista', { ascending: true })

    if (error) throw error
    tarefas.value = data || []
  } catch (err: any) {
    showError('Erro ao carregar tarefas', err.message)
  } finally {
    loading.value = false
  }
}

async function loadEspecies() {
  if (!currentCompany.value?.id) return
  try {
    const { data, error } = await supabase
      .from('especies')
      .select('id, nome')
      .eq('empresa_id', currentCompany.value.id)
      .order('nome')

    if (error) throw error
    especies.value = data || []
  } catch (err: any) {
    // Silencioso
  }
}

// Toggle concluida
async function toggleConcluida(tarefa: Tarefa) {
  const newConcluida = !tarefa.concluida
  const newDataConclusao = newConcluida ? today() : null

  // Optimistic update
  tarefa.concluida = newConcluida
  tarefa.data_conclusao = newDataConclusao || undefined

  try {
    const { error } = await supabase
      .from('tarefas')
      .update({
        concluida: newConcluida,
        data_conclusao: newDataConclusao,
      })
      .eq('id', tarefa.id)

    if (error) throw error
    success(newConcluida ? 'Tarefa concluída!' : 'Tarefa reaberta')
  } catch (err: any) {
    // Revert optimistic update
    tarefa.concluida = !newConcluida
    tarefa.data_conclusao = newConcluida ? undefined : today()
    showError('Erro ao atualizar tarefa', err.message)
  }
}

// Modal Nova Tarefa
function openNovaTarefa() {
  novaTarefa.value = {
    nome: '',
    descricao: '',
    data_prevista: today(),
    especie_id: '',
  }
  showNovaTarefaModal.value = true
}

function closeNovaTarefa() {
  showNovaTarefaModal.value = false
}

async function salvarNovaTarefa() {
  if (!currentCompany.value?.id || !isNovaTarefaValid.value) return
  saving.value = true
  try {
    const payload: Record<string, any> = {
      empresa_id: currentCompany.value.id,
      nome: novaTarefa.value.nome.trim(),
      descricao: novaTarefa.value.descricao.trim() || null,
      data_prevista: novaTarefa.value.data_prevista,
      tipo: 'manual',
      concluida: false,
    }
    if (novaTarefa.value.especie_id) {
      payload.especie_id = novaTarefa.value.especie_id
    }

    const { error } = await supabase.from('tarefas').insert(payload)

    if (error) throw error
    success('Tarefa criada com sucesso!')
    closeNovaTarefa()
    await loadTarefas()
  } catch (err: any) {
    showError('Erro ao criar tarefa', err.message)
  } finally {
    saving.value = false
  }
}

// Paginacao
function goToPage() {
  const page = parseInt(pageInput.value)
  if (!isNaN(page) && page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  } else {
    pageInput.value = String(currentPage.value)
  }
}

// Watches
watch(() => currentCompany.value?.id, (newId) => {
  if (newId) {
    loadTarefas()
    loadEspecies()
  }
}, { immediate: true })

watch(itemsPerPage, () => {
  currentPage.value = 1
  pageInput.value = '1'
})

watch(currentPage, (newVal) => {
  pageInput.value = String(newVal)
})

watch([filterStatus, filterEspecie, filterNome, filterDataDe, filterDataAte], () => {
  currentPage.value = 1
  pageInput.value = '1'
})

// Lifecycle
onMounted(() => {
  if (currentCompany.value?.id) {
    loadTarefas()
    loadEspecies()
  }
})
</script>
