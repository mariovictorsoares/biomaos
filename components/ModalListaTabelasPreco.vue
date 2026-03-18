<template>
  <div v-if="show" class="fixed inset-0 z-[90] overflow-y-auto">
    <!-- Backdrop -->
    <div class="fixed inset-0 glass-backdrop transition-opacity" @click="$emit('close')"></div>

    <!-- Modal -->
    <div class="flex min-h-full items-center justify-center p-2 sm:p-4">
      <div class="relative w-full max-w-md glass-panel rounded-xl shadow-xl transform transition-all max-h-[90vh] flex flex-col">
        <!-- Header -->
        <div class="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span class="material-icons-outlined text-primary text-xl sm:text-2xl">payments</span>
          </div>
          <div class="min-w-0">
            <h2 class="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Tabelas de Preço</h2>
            <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Gerenciar tabelas de preço</p>
          </div>
        </div>

        <!-- Content -->
        <div class="px-4 sm:px-6 py-4 sm:py-6 overflow-y-auto flex-1">
          <!-- Loading -->
          <div v-if="loading" class="flex items-center justify-center py-8">
            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>

          <template v-else>
            <!-- Lista -->
            <div v-if="tabelas.length > 0" class="space-y-2">
              <div
                v-for="tabela in tabelas"
                :key="tabela.id"
                class="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <!-- Inline edit mode -->
                <template v-if="editingId === tabela.id">
                  <input
                    v-model="editingNome"
                    type="text"
                    class="input flex-1 mr-2 text-sm"
                    placeholder="Nome da tabela"
                    @keyup.enter="saveEdit(tabela.id)"
                    @keyup.escape="cancelEdit"
                    :ref="el => { if (el && editingId === tabela.id) el.focus() }"
                  />
                  <div class="flex items-center gap-1 shrink-0">
                    <button @click="saveEdit(tabela.id)" class="w-8 h-8 flex items-center justify-center text-green-600 hover:text-green-700 transition-colors" title="Salvar">
                      <span class="material-icons-outlined text-lg">check</span>
                    </button>
                    <button @click="cancelEdit" class="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors" title="Cancelar">
                      <span class="material-icons-outlined text-lg">close</span>
                    </button>
                  </div>
                </template>

                <!-- Normal display mode -->
                <template v-else>
                  <span class="text-sm font-medium text-gray-900 dark:text-white truncate pr-2">{{ tabela.nome }}</span>
                  <div class="flex items-center gap-1 shrink-0">
                    <button @click="startEdit(tabela)" class="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-primary transition-colors" title="Editar">
                      <span class="material-icons-outlined text-lg">edit</span>
                    </button>
                    <button @click="confirmDelete(tabela)" class="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors" title="Excluir">
                      <span class="material-icons-outlined text-lg">delete</span>
                    </button>
                  </div>
                </template>
              </div>
            </div>

            <!-- Empty State -->
            <div v-else class="text-center py-6 sm:py-8 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
              <span class="material-icons-outlined text-4xl text-gray-300 dark:text-gray-600 mb-2">payments</span>
              <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Nenhuma tabela cadastrada</p>
            </div>

            <!-- Inline create form -->
            <div v-if="showCreateForm" class="mt-3 flex items-center gap-2">
              <input
                v-model="newNome"
                type="text"
                class="input flex-1 text-sm"
                placeholder="Nome da nova tabela"
                @keyup.enter="createTabela"
                @keyup.escape="showCreateForm = false"
                ref="createInput"
              />
              <button @click="createTabela" :disabled="!newNome.trim() || saving" class="btn btn-primary text-sm py-2 px-3">
                <span v-if="saving" class="material-icons-outlined animate-spin text-sm">refresh</span>
                <span v-else class="material-icons-outlined text-sm">check</span>
              </button>
              <button @click="showCreateForm = false" class="btn btn-secondary text-sm py-2 px-3">
                <span class="material-icons-outlined text-sm">close</span>
              </button>
            </div>
          </template>
        </div>

        <!-- Footer -->
        <div class="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 dark:border-gray-700 flex gap-2 sm:gap-3 flex-shrink-0">
          <button @click="$emit('close')" class="flex-1 btn btn-secondary justify-center text-sm">Fechar</button>
          <button @click="openCreateForm" class="flex-1 btn btn-primary justify-center text-sm">Nova tabela</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import { useCurrentCompany } from '~/composables/useCurrentCompany'
import { useToast } from '~/composables/useToast'

const props = defineProps({
  show: { type: Boolean, default: false }
})

const emit = defineEmits(['close', 'updated'])

const supabase = useSupabaseClient()
const { currentCompany } = useCurrentCompany()
const { success, error: showError } = useToast()

const loading = ref(false)
const saving = ref(false)
const tabelas = ref([])

// Create
const showCreateForm = ref(false)
const newNome = ref('')
const createInput = ref(null)

// Edit
const editingId = ref(null)
const editingNome = ref('')

// Load tabelas
async function loadTabelas() {
  if (!currentCompany.value?.id) return
  loading.value = true
  try {
    const { data, error } = await supabase
      .from('tabelas_preco')
      .select('id, nome, ativo')
      .eq('empresa_id', currentCompany.value.id)
      .eq('ativo', true)
      .order('nome')
    if (error) throw error
    tabelas.value = data || []
  } catch (e) {
    console.error('Erro ao carregar tabelas de preço:', e)
    showError('Erro ao carregar tabelas de preço')
  } finally {
    loading.value = false
  }
}

// Create
function openCreateForm() {
  showCreateForm.value = true
  newNome.value = ''
  nextTick(() => createInput.value?.focus())
}

async function createTabela() {
  if (!newNome.value.trim() || !currentCompany.value?.id) return
  saving.value = true
  try {
    const { error } = await supabase
      .from('tabelas_preco')
      .insert({ empresa_id: currentCompany.value.id, nome: newNome.value.trim() })
    if (error) throw error
    success('Tabela de preço criada')
    showCreateForm.value = false
    newNome.value = ''
    await loadTabelas()
    emit('updated')
  } catch (e) {
    showError(e.message || 'Erro ao criar tabela')
  } finally {
    saving.value = false
  }
}

// Edit
function startEdit(tabela) {
  editingId.value = tabela.id
  editingNome.value = tabela.nome
  // Focus is handled by the :ref function in the template
}

function cancelEdit() {
  editingId.value = null
  editingNome.value = ''
}

async function saveEdit(id) {
  if (!editingNome.value.trim()) return
  saving.value = true
  try {
    const { error } = await supabase
      .from('tabelas_preco')
      .update({ nome: editingNome.value.trim() })
      .eq('id', id)
    if (error) throw error
    success('Tabela atualizada')
    cancelEdit()
    await loadTabelas()
    emit('updated')
  } catch (e) {
    showError(e.message || 'Erro ao atualizar tabela')
  } finally {
    saving.value = false
  }
}

// Delete
async function confirmDelete(tabela) {
  if (!confirm(`Excluir a tabela "${tabela.nome}"? Os preços vinculados serão removidos.`)) return
  saving.value = true
  try {
    const { error } = await supabase
      .from('tabelas_preco')
      .delete()
      .eq('id', tabela.id)
    if (error) throw error
    success('Tabela excluída')
    await loadTabelas()
    emit('updated')
  } catch (e) {
    showError(e.message || 'Erro ao excluir tabela')
  } finally {
    saving.value = false
  }
}

// Watch show prop to reload
watch(() => props.show, (val) => {
  if (val) loadTabelas()
})
</script>
