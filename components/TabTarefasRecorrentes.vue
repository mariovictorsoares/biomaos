<template>
  <div>
    <!-- Toolbar -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-4 mb-4">
      <div class="flex items-center gap-2">
        <input
          v-model="searchTerm"
          type="text"
          class="input text-xs sm:text-sm flex-1 sm:w-64"
          placeholder="Buscar por nome..."
        />
      </div>
      <button @click="openModal()" class="btn btn-primary shrink-0 justify-center sm:justify-start">
        <span class="material-icons-outlined text-sm">add</span>
        Nova Recorrência
      </button>
    </div>

    <!-- Card da Tabela -->
    <div class="card">

      <!-- Loading -->
      <div v-if="loading" class="text-center py-12">
        <span class="material-icons-outlined text-4xl text-gray-300 dark:text-gray-600 animate-spin">refresh</span>
        <p class="text-sm text-subtext-light dark:text-subtext-dark mt-2">Carregando recorrências...</p>
      </div>

      <!-- Tabela Desktop -->
      <div v-if="!loading && filtered.length > 0" class="hidden md:block overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-100 dark:bg-gray-700/50 border-b border-border-light dark:border-border-dark">
              <th class="table-header">Nome</th>
              <th class="table-header">Descrição</th>
              <th class="table-header text-center">Frequência</th>
              <th class="table-header text-center w-20">Ativo</th>
              <th class="table-header text-center w-28">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-light dark:divide-border-dark">
            <tr
              v-for="rec in paginated"
              :key="rec.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <td class="table-cell font-medium text-text-light dark:text-text-dark">
                {{ rec.nome }}
              </td>
              <td class="table-cell text-subtext-light dark:text-subtext-dark">
                <span class="truncate block max-w-[250px]">{{ rec.descricao || '-' }}</span>
              </td>
              <td class="table-cell text-center whitespace-nowrap">
                {{ formatFrequencia(rec) }}
              </td>
              <td class="table-cell text-center">
                <button
                  @click="toggleAtivo(rec)"
                  class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none"
                  :class="rec.ativo ? 'bg-[#4A7C59]' : 'bg-gray-300 dark:bg-gray-600'"
                >
                  <span
                    class="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform"
                    :class="rec.ativo ? 'translate-x-[18px]' : 'translate-x-[3px]'"
                  />
                </button>
              </td>
              <td class="table-cell text-center">
                <div class="flex items-center justify-center gap-1">
                  <button
                    @click="openModal(rec)"
                    class="p-1 text-subtext-light dark:text-subtext-dark hover:text-[#4A7C59] dark:hover:text-[#6B9E7A] transition-colors"
                    title="Editar"
                  >
                    <span class="material-icons-outlined text-sm">edit</span>
                  </button>
                  <button
                    @click="confirmDelete(rec)"
                    class="p-1 text-subtext-light dark:text-subtext-dark hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    title="Excluir"
                  >
                    <span class="material-icons-outlined text-sm">delete</span>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Cards Mobile -->
      <div v-if="!loading && filtered.length > 0" class="md:hidden divide-y divide-border-light dark:divide-border-dark">
        <div
          v-for="rec in paginated"
          :key="rec.id"
          class="p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        >
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0 flex-1">
              <p class="font-medium text-text-light dark:text-text-dark truncate">{{ rec.nome }}</p>
              <p v-if="rec.descricao" class="text-xs text-subtext-light dark:text-subtext-dark truncate mt-0.5">
                {{ rec.descricao }}
              </p>
              <div class="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-subtext-light dark:text-subtext-dark">
                <span>
                  <span class="material-icons-outlined text-[11px] align-middle mr-0.5">schedule</span>
                  {{ formatFrequencia(rec) }}
                </span>
                <span :class="rec.ativo ? 'text-[#4A7C59] dark:text-[#6B9E7A]' : 'text-red-500 dark:text-red-400'">
                  {{ rec.ativo ? 'Ativo' : 'Inativo' }}
                </span>
              </div>
            </div>
            <div class="flex items-center gap-1 shrink-0">
              <button
                @click="openModal(rec)"
                class="p-1 text-subtext-light dark:text-subtext-dark hover:text-[#4A7C59] dark:hover:text-[#6B9E7A] transition-colors"
              >
                <span class="material-icons-outlined text-sm">edit</span>
              </button>
              <button
                @click="confirmDelete(rec)"
                class="p-1 text-subtext-light dark:text-subtext-dark hover:text-red-600 dark:hover:text-red-400 transition-colors"
              >
                <span class="material-icons-outlined text-sm">delete</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="!loading && filtered.length === 0" class="text-center py-12 flex flex-col items-center px-4">
        <span class="material-icons-outlined text-4xl text-gray-300 dark:text-gray-600 mb-2">repeat</span>
        <h3 class="text-lg font-medium text-text-light dark:text-text-dark mb-1">Nenhuma recorrência encontrada</h3>
        <p class="text-sm text-subtext-light dark:text-subtext-dark mb-4">
          {{ searchTerm ? 'Tente ajustar a busca' : 'Crie regras de recorrência para gerar tarefas automaticamente' }}
        </p>
        <button @click="openModal()" class="btn btn-primary">
          <span class="material-icons-outlined text-sm">add</span>
          Nova Recorrência
        </button>
      </div>

      <!-- Paginacao -->
      <div v-if="filtered.length > 0" class="p-3 sm:p-4 border-t border-border-light dark:border-border-dark text-xs text-subtext-light dark:text-subtext-dark">
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
            <span class="text-xs">{{ filtered.length }} registros</span>
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

    <!-- Modal Criar/Editar -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-200"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="showModal" class="fixed inset-0 z-[60] overflow-y-auto">
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
                <!-- Header -->
                <div class="border-b border-border-light dark:border-border-dark px-6 py-4 flex items-center justify-between">
                  <h2 class="text-lg font-semibold text-text-light dark:text-text-dark">
                    {{ editingId ? 'Editar Recorrência' : 'Nova Recorrência' }}
                  </h2>
                  <button @click="closeModal" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <span class="material-icons-outlined">close</span>
                  </button>
                </div>

                <!-- Body -->
                <div class="p-6 space-y-4">
                  <!-- Nome -->
                  <div>
                    <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Nome *</label>
                    <input
                      v-model="form.nome"
                      type="text"
                      class="input"
                      placeholder="Nome da recorrência"
                    />
                  </div>

                  <!-- Descricao -->
                  <div>
                    <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Descrição</label>
                    <textarea
                      v-model="form.descricao"
                      class="input min-h-[60px] resize-y"
                      placeholder="Descrição (opcional)"
                    ></textarea>
                  </div>

                  <!-- Recorrência Infinita -->
                  <div class="flex items-center gap-2">
                    <input
                      id="recorrencia_infinita"
                      v-model="form.recorrencia_infinita"
                      type="checkbox"
                      class="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-[#4A7C59] focus:ring-[#4A7C59]"
                    />
                    <label for="recorrencia_infinita" class="text-sm text-text-light dark:text-text-dark">Recorrência infinita</label>
                  </div>

                  <!-- Data Início -->
                  <div>
                    <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Data Início *</label>
                    <input
                      v-model="form.data_inicio"
                      type="date"
                      class="input"
                    />
                  </div>

                  <!-- Data Fim -->
                  <div v-if="!form.recorrencia_infinita">
                    <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Data Fim</label>
                    <input
                      v-model="form.data_fim"
                      type="date"
                      class="input"
                    />
                  </div>

                  <!-- Tipo Frequencia -->
                  <div>
                    <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Tipo de Frequência *</label>
                    <select v-model="form.tipo_frequencia" class="input">
                      <option value="semanal">Semanal</option>
                      <option value="dia_semana">Dia da Semana</option>
                      <option value="dia_util_mes">Dia Útil do Mês</option>
                    </select>
                  </div>

                  <!-- Intervalo -->
                  <div v-if="form.tipo_frequencia === 'semanal' || form.tipo_frequencia === 'dia_util_mes'">
                    <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                      {{ form.tipo_frequencia === 'semanal' ? 'Intervalo (semanas)' : 'N-ésimo dia útil' }}
                    </label>
                    <input
                      v-model.number="form.intervalo"
                      type="number"
                      min="1"
                      class="input"
                      placeholder="1"
                    />
                  </div>

                  <!-- Dia da Semana -->
                  <div v-if="form.tipo_frequencia === 'dia_semana'">
                    <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Dia da Semana</label>
                    <select v-model.number="form.dia_semana" class="input">
                      <option v-for="dia in diasSemana" :key="dia.value" :value="dia.value">
                        {{ dia.label }}
                      </option>
                    </select>
                  </div>

                  <!-- Criar Atrasados -->
                  <div class="flex items-center gap-2">
                    <input
                      id="criar_atrasados"
                      v-model="form.criar_atrasados"
                      type="checkbox"
                      class="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-[#4A7C59] focus:ring-[#4A7C59]"
                    />
                    <label for="criar_atrasados" class="text-sm text-text-light dark:text-text-dark">Criar tarefas atrasadas</label>
                  </div>
                </div>

                <!-- Footer -->
                <div class="border-t border-border-light dark:border-border-dark px-6 py-4 flex items-center justify-end gap-3">
                  <button @click="closeModal" class="btn btn-secondary" :disabled="saving">Cancelar</button>
                  <button @click="salvar" class="btn btn-primary" :disabled="saving || !isFormValid">
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

    <!-- Modal Confirmar Exclusao -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-200"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="showDeleteModal" class="fixed inset-0 z-[60] overflow-y-auto">
          <div class="fixed inset-0 glass-backdrop" @click="showDeleteModal = false"></div>
          <div class="flex min-h-full items-center justify-center p-4">
            <Transition
              enter-active-class="transition-all duration-200"
              enter-from-class="opacity-0 scale-95"
              enter-to-class="opacity-100 scale-100"
              leave-active-class="transition-all duration-200"
              leave-from-class="opacity-100 scale-100"
              leave-to-class="opacity-0 scale-95"
            >
              <div v-if="showDeleteModal" class="relative glass-panel rounded-lg shadow-xl w-full max-w-sm">
                <div class="p-6 text-center">
                  <span class="material-icons-outlined text-4xl text-red-500 mb-3">warning</span>
                  <h3 class="text-lg font-semibold text-text-light dark:text-text-dark mb-2">Excluir Recorrência</h3>
                  <p class="text-sm text-subtext-light dark:text-subtext-dark mb-6">
                    Tem certeza que deseja excluir <strong>{{ deletingItem?.nome }}</strong>? Esta ação não pode ser desfeita.
                  </p>
                  <div class="flex items-center justify-center gap-3">
                    <button @click="showDeleteModal = false" class="btn btn-secondary" :disabled="saving">Cancelar</button>
                    <button @click="excluir" class="btn bg-red-600 hover:bg-red-700 text-white" :disabled="saving">
                      <span v-if="saving" class="material-icons-outlined animate-spin text-sm">refresh</span>
                      {{ saving ? 'Excluindo...' : 'Excluir' }}
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

interface TarefaRecorrente {
  id: string
  empresa_id: string
  nome: string
  descricao?: string
  recorrencia_infinita: boolean
  data_inicio: string
  data_fim?: string
  tipo_frequencia: 'semanal' | 'dia_semana' | 'dia_util_mes'
  intervalo?: number
  dia_semana?: number
  criar_atrasados: boolean
  ativo: boolean
  ultima_geracao?: string
}

const supabase = useSupabaseClient()
const { currentCompany } = useCurrentCompany()
const { success, error: showError } = useToast()

// Estado
const recorrencias = ref<TarefaRecorrente[]>([])
const loading = ref(false)
const saving = ref(false)
const searchTerm = ref('')

// Paginacao
const currentPage = ref(1)
const itemsPerPage = ref(25)
const pageInput = ref('1')

// Modal criar/editar
const showModal = ref(false)
const editingId = ref<string | null>(null)

const defaultForm = () => ({
  nome: '',
  descricao: '',
  recorrencia_infinita: false,
  data_inicio: '',
  data_fim: '',
  tipo_frequencia: 'semanal' as const,
  intervalo: 1,
  dia_semana: 1,
  criar_atrasados: false,
})

const form = ref(defaultForm())

// Modal exclusao
const showDeleteModal = ref(false)
const deletingItem = ref<TarefaRecorrente | null>(null)

// Dias da semana
const diasSemana = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' },
]

// Computed
const filtered = computed(() => {
  if (!searchTerm.value) return recorrencias.value
  const term = searchTerm.value.toLowerCase()
  return recorrencias.value.filter(r =>
    r.nome.toLowerCase().includes(term) ||
    (r.descricao && r.descricao.toLowerCase().includes(term))
  )
})

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / itemsPerPage.value)))

const paginated = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  return filtered.value.slice(start, start + itemsPerPage.value)
})

const isFormValid = computed(() => {
  return form.value.nome.trim() && form.value.data_inicio && form.value.tipo_frequencia
})

// Watchers
watch(filtered, () => {
  currentPage.value = 1
  pageInput.value = '1'
})

watch(currentPage, (val) => {
  pageInput.value = String(val)
})

watch(itemsPerPage, () => {
  currentPage.value = 1
  pageInput.value = '1'
})

// Funcoes
function goToPage() {
  const page = parseInt(pageInput.value)
  if (!isNaN(page) && page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  } else {
    pageInput.value = String(currentPage.value)
  }
}

function formatFrequencia(rec: TarefaRecorrente): string {
  switch (rec.tipo_frequencia) {
    case 'semanal':
      return rec.intervalo && rec.intervalo > 1
        ? `A cada ${rec.intervalo} semana(s)`
        : 'Semanalmente'
    case 'dia_semana': {
      const dia = diasSemana.find(d => d.value === rec.dia_semana)
      return dia ? `Toda ${dia.label}` : 'Dia da semana'
    }
    case 'dia_util_mes':
      return `${rec.intervalo || 1}-ésimo dia útil do mês`
    default:
      return '-'
  }
}

async function fetchRecorrencias() {
  const empresaAtiva = currentCompany.value
  if (!empresaAtiva) return

  loading.value = true
  try {
    const { data, error } = await supabase
      .from('tarefas_recorrentes')
      .select('*')
      .eq('empresa_id', empresaAtiva)
      .order('nome')

    if (error) throw error
    recorrencias.value = data || []
  } catch (err: any) {
    showError('Erro ao carregar recorrências: ' + (err.message || err))
  } finally {
    loading.value = false
  }
}

function openModal(rec?: TarefaRecorrente) {
  if (rec) {
    editingId.value = rec.id
    form.value = {
      nome: rec.nome,
      descricao: rec.descricao || '',
      recorrencia_infinita: rec.recorrencia_infinita,
      data_inicio: rec.data_inicio,
      data_fim: rec.data_fim || '',
      tipo_frequencia: rec.tipo_frequencia,
      intervalo: rec.intervalo || 1,
      dia_semana: rec.dia_semana ?? 1,
      criar_atrasados: rec.criar_atrasados,
    }
  } else {
    editingId.value = null
    form.value = defaultForm()
  }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingId.value = null
  form.value = defaultForm()
}

async function salvar() {
  const empresaAtiva = currentCompany.value
  if (!empresaAtiva || !isFormValid.value) return

  saving.value = true
  try {
    const payload: Record<string, any> = {
      empresa_id: empresaAtiva,
      nome: form.value.nome.trim(),
      descricao: form.value.descricao.trim() || null,
      recorrencia_infinita: form.value.recorrencia_infinita,
      data_inicio: form.value.data_inicio,
      data_fim: form.value.recorrencia_infinita ? null : (form.value.data_fim || null),
      tipo_frequencia: form.value.tipo_frequencia,
      intervalo: form.value.tipo_frequencia !== 'dia_semana' ? (form.value.intervalo || 1) : null,
      dia_semana: form.value.tipo_frequencia === 'dia_semana' ? form.value.dia_semana : null,
      criar_atrasados: form.value.criar_atrasados,
      ativo: true,
    }

    if (editingId.value) {
      const { error } = await supabase
        .from('tarefas_recorrentes')
        .update(payload)
        .eq('id', editingId.value)
      if (error) throw error
      success('Recorrência atualizada com sucesso')
    } else {
      const { error } = await supabase
        .from('tarefas_recorrentes')
        .insert(payload)
      if (error) throw error
      success('Recorrência criada com sucesso')
    }

    closeModal()
    await fetchRecorrencias()
  } catch (err: any) {
    showError('Erro ao salvar: ' + (err.message || err))
  } finally {
    saving.value = false
  }
}

async function toggleAtivo(rec: TarefaRecorrente) {
  try {
    const { error } = await supabase
      .from('tarefas_recorrentes')
      .update({ ativo: !rec.ativo })
      .eq('id', rec.id)
    if (error) throw error
    rec.ativo = !rec.ativo
    success(rec.ativo ? 'Recorrência ativada' : 'Recorrência desativada')
  } catch (err: any) {
    showError('Erro ao alterar status: ' + (err.message || err))
  }
}

function confirmDelete(rec: TarefaRecorrente) {
  deletingItem.value = rec
  showDeleteModal.value = true
}

async function excluir() {
  if (!deletingItem.value) return

  saving.value = true
  try {
    const { error } = await supabase
      .from('tarefas_recorrentes')
      .delete()
      .eq('id', deletingItem.value.id)
    if (error) throw error
    success('Recorrência excluída com sucesso')
    showDeleteModal.value = false
    deletingItem.value = null
    await fetchRecorrencias()
  } catch (err: any) {
    showError('Erro ao excluir: ' + (err.message || err))
  } finally {
    saving.value = false
  }
}

// Lifecycle
onMounted(() => {
  fetchRecorrencias()
})

watch(currentCompany, () => {
  fetchRecorrencias()
})
</script>
