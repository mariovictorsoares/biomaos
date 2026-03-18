<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="show" class="fixed inset-0 z-[100] overflow-y-auto">
        <!-- Backdrop -->
        <div class="fixed inset-0 glass-backdrop z-[100]" @click="emit('close')"></div>

        <!-- Modal -->
        <div class="flex min-h-full items-center justify-center p-4">
          <Transition
            enter-active-class="transition-all duration-200"
            enter-from-class="opacity-0 scale-95"
            enter-to-class="opacity-100 scale-100"
            leave-active-class="transition-all duration-200"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-95"
          >
            <div v-if="show" class="relative z-[101] glass-panel rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">

              <!-- Header -->
              <div class="px-6 py-4 border-b border-border-light dark:border-border-dark flex items-center justify-between">
                <div class="flex items-center gap-3 min-w-0">
                  <h2 class="text-lg font-semibold text-text-light dark:text-text-dark truncate">
                    Recorrente - {{ nomeEspecies }}
                  </h2>
                  <span :class="['inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border shrink-0', statusBadgeClass(local.status)]">
                    {{ RECORRENTE_STATUS_CONFIG[local.status]?.label || local.status }}
                  </span>
                </div>
                <button @click="emit('close')" class="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shrink-0">
                  <span class="material-icons-outlined text-xl text-gray-500 dark:text-gray-400">close</span>
                </button>
              </div>

              <!-- Content (scrollable) -->
              <div class="flex-1 overflow-y-auto">

                <!-- Info Section (read-only) -->
                <div v-if="!editing" class="px-6 py-5">
                  <div class="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
                    <div>
                      <p class="text-xs text-subtext-light dark:text-subtext-dark mb-0.5">Tipo</p>
                      <p class="text-sm font-medium text-text-light dark:text-text-dark">
                        <span
                          :class="[
                            'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold',
                            local.tipo === 'mix'
                              ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                              : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                          ]"
                        >
                          {{ local.tipo === 'mix' ? 'Mix' : 'Simples' }}
                        </span>
                      </p>
                    </div>
                    <div :class="local.tipo === 'mix' ? 'col-span-2 sm:col-span-2' : ''">
                      <p class="text-xs text-subtext-light dark:text-subtext-dark mb-0.5">Espécie(s)</p>
                      <p class="text-sm font-medium text-text-light dark:text-text-dark">
                        {{ nomeEspecies }}
                      </p>
                    </div>
                    <div>
                      <p class="text-xs text-subtext-light dark:text-subtext-dark mb-0.5">Quantidade</p>
                      <p class="text-sm font-medium text-text-light dark:text-text-dark">{{ local.quantidade }} un</p>
                    </div>
                    <div>
                      <p class="text-xs text-subtext-light dark:text-subtext-dark mb-0.5">Fazenda</p>
                      <p class="text-sm font-medium text-text-light dark:text-text-dark">{{ local.fazendas?.nome || '-' }}</p>
                    </div>
                    <div>
                      <p class="text-xs text-subtext-light dark:text-subtext-dark mb-0.5">Intervalo</p>
                      <p class="text-sm font-medium text-text-light dark:text-text-dark">A cada {{ local.intervalo_dias }} dias</p>
                    </div>
                    <div>
                      <p class="text-xs text-subtext-light dark:text-subtext-dark mb-0.5">Status</p>
                      <p class="text-sm font-medium text-text-light dark:text-text-dark">{{ RECORRENTE_STATUS_CONFIG[local.status]?.label || local.status }}</p>
                    </div>
                    <div>
                      <p class="text-xs text-subtext-light dark:text-subtext-dark mb-0.5">Criada em</p>
                      <p class="text-sm font-medium text-text-light dark:text-text-dark">{{ formatDateBR(local.created_at) }}</p>
                    </div>
                    <div v-if="local.observacoes" class="col-span-2 sm:col-span-3">
                      <p class="text-xs text-subtext-light dark:text-subtext-dark mb-0.5">Observações</p>
                      <p class="text-sm text-text-light dark:text-text-dark">{{ local.observacoes }}</p>
                    </div>
                  </div>

                  <!-- Botao Editar (dentro da secao read-only) -->
                  <button
                    v-if="local.status !== 'encerrada'"
                    @click="startEditing"
                    class="mt-4 text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    <span class="material-icons-outlined text-sm">edit</span>
                    Editar
                  </button>
                </div>

                <!-- Edit Form -->
                <div v-if="editing" class="px-6 py-5 space-y-4">
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <!-- Quantidade -->
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Quantidade</label>
                      <input type="number" v-model.number="form.quantidade" class="input" min="1" />
                    </div>
                    <!-- Intervalo -->
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Intervalo (dias)</label>
                      <input type="number" v-model.number="form.intervalo_dias" class="input" min="1" />
                    </div>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <!-- Fazenda -->
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Fazenda</label>
                      <select v-model="form.fazenda_id" class="input">
                        <option value="">Sem fazenda</option>
                        <option v-for="f in fazendas" :key="f.id" :value="f.id">
                          {{ f.nome }}
                        </option>
                      </select>
                    </div>
                    <!-- Lote Semente 1 -->
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">
                        Lote de Semente{{ local.tipo === 'mix' ? ' 1' : '' }}
                      </label>
                      <select v-model="form.lote_semente_id_1" class="input">
                        <option value="">Nenhum</option>
                        <option v-for="lote in lotesFiltrados1" :key="lote.id" :value="lote.id">
                          {{ lote.numero }}
                        </option>
                      </select>
                    </div>
                  </div>

                  <!-- Lote Semente 2 (mix) -->
                  <div v-if="local.tipo === 'mix' && local.especie_id_2" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Lote de Semente 2</label>
                      <select v-model="form.lote_semente_id_2" class="input">
                        <option value="">Nenhum</option>
                        <option v-for="lote in lotesFiltrados2" :key="lote.id" :value="lote.id">
                          {{ lote.numero }}
                        </option>
                      </select>
                    </div>
                  </div>

                  <!-- Observações -->
                  <div>
                    <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Observações</label>
                    <textarea v-model="form.observacoes" class="input" rows="3" placeholder="Observações opcionais..."></textarea>
                  </div>

                  <!-- Nota informativa -->
                  <div class="flex items-start gap-2 px-3 py-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <span class="material-icons-outlined text-sm text-blue-500 mt-0.5">info</span>
                    <span class="text-xs text-blue-700 dark:text-blue-400">
                      Alterações valem apenas para novas produções geradas.
                    </span>
                  </div>

                  <!-- Botoes do form -->
                  <div class="flex items-center justify-end gap-3 pt-2">
                    <button @click="cancelEditing" class="btn btn-secondary">Cancelar</button>
                    <button @click="saveEdit" class="btn btn-primary" :disabled="saving">
                      <span v-if="saving" class="material-icons-outlined text-sm animate-spin">refresh</span>
                      {{ saving ? 'Salvando...' : 'Salvar alterações' }}
                    </button>
                  </div>
                </div>

                <!-- Produções Geradas Section -->
                <div class="px-6 py-5 border-t border-border-light dark:border-border-dark">
                  <h3 class="text-sm font-semibold text-text-light dark:text-text-dark mb-3 flex items-center gap-2">
                    <span class="material-icons-outlined text-base text-primary">list_alt</span>
                    Produções geradas
                  </h3>

                  <!-- Loading produções -->
                  <div v-if="loadingProducoes" class="text-center py-6">
                    <span class="material-icons-outlined text-2xl text-gray-300 dark:text-gray-600 animate-spin">refresh</span>
                    <p class="text-xs text-subtext-light dark:text-subtext-dark mt-2">Carregando...</p>
                  </div>

                  <!-- Tabela produções -->
                  <div v-else-if="producoesGeradas.length > 0" class="border border-border-light dark:border-border-dark rounded-lg overflow-hidden">
                    <table class="w-full text-left">
                      <thead>
                        <tr class="bg-gray-50 dark:bg-gray-800 border-b border-border-light dark:border-border-dark">
                          <th class="table-header text-xs font-medium">#</th>
                          <th class="table-header text-xs font-medium">Data Plantio Prev.</th>
                          <th class="table-header text-xs font-medium text-center">Status</th>
                          <th class="table-header text-xs font-medium">Data Criação</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-border-light dark:divide-border-dark">
                        <tr
                          v-for="(prod, idx) in producoesGeradas"
                          :key="prod.id"
                          :class="[
                            'transition-colors',
                            isNextPlanejado(prod) ? 'bg-primary/5 dark:bg-primary/10' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                          ]"
                        >
                          <td class="table-cell text-xs text-subtext-light dark:text-subtext-dark">
                            {{ idx + 1 }}
                          </td>
                          <td class="table-cell text-sm text-text-light dark:text-text-dark">
                            <span class="flex items-center gap-1.5">
                              {{ formatDateBR(prod.data_plantio_prevista) }}
                              <span
                                v-if="isNextPlanejado(prod)"
                                class="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium"
                              >
                                Próxima
                              </span>
                            </span>
                          </td>
                          <td class="table-cell text-center">
                            <span :class="['inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border', producaoStatusBadgeClass(prod.status)]">
                              {{ PRODUCAO_STATUS_CONFIG[prod.status]?.label || prod.status }}
                            </span>
                          </td>
                          <td class="table-cell text-xs text-subtext-light dark:text-subtext-dark">
                            {{ formatDateBR(prod.created_at) }}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <!-- Empty produções -->
                  <div v-else class="text-center py-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <span class="material-icons-outlined text-2xl text-gray-300 dark:text-gray-600 mb-1">inventory_2</span>
                    <p class="text-sm text-subtext-light dark:text-subtext-dark">Nenhuma produção gerada ainda</p>
                  </div>
                </div>
              </div>

              <!-- Footer Actions -->
              <div
                v-if="local.status !== 'encerrada'"
                class="px-6 py-4 border-t border-border-light dark:border-border-dark bg-gray-50 dark:bg-gray-800/50 rounded-b-xl flex flex-wrap items-center justify-end gap-3 flex-shrink-0"
              >
                <template v-if="local.status === 'ativa'">
                  <button
                    @click="handlePausar"
                    class="btn bg-amber-500 hover:bg-amber-600 text-white"
                    :disabled="saving"
                  >
                    <span class="material-icons-outlined text-sm mr-1">pause_circle</span>
                    Pausar
                  </button>
                  <button
                    @click="showEncerrarConfirm = true"
                    class="btn border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                    :disabled="saving"
                  >
                    <span class="material-icons-outlined text-sm mr-1">stop_circle</span>
                    Encerrar
                  </button>
                </template>
                <template v-else-if="local.status === 'pausada'">
                  <button
                    @click="handleRetomar"
                    class="btn bg-green-600 hover:bg-green-700 text-white"
                    :disabled="saving"
                  >
                    <span class="material-icons-outlined text-sm mr-1">play_circle</span>
                    Retomar
                  </button>
                  <button
                    @click="showEncerrarConfirm = true"
                    class="btn border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                    :disabled="saving"
                  >
                    <span class="material-icons-outlined text-sm mr-1">stop_circle</span>
                    Encerrar
                  </button>
                </template>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- Modal Confirmar Encerramento -->
  <ModalConfirmacao
    v-if="showEncerrarConfirm"
    title="Encerrar Recorrente"
    message="Tem certeza que deseja encerrar esta produção recorrente? Nenhuma nova produção será gerada. As produções já criadas não serão afetadas."
    confirm-text="Encerrar"
    confirm-class="btn bg-red-600 hover:bg-red-700 text-white"
    @close="showEncerrarConfirm = false"
    @confirm="handleEncerrar"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useCurrentCompany } from '~/composables/useCurrentCompany'
import { useToast } from '~/composables/useToast'
import type { ProducaoRecorrente, RecorrenteStatus, ProducaoStatus } from '~/composables/types/producao'
import { RECORRENTE_STATUS_CONFIG, PRODUCAO_STATUS_CONFIG } from '~/composables/types/producao'

// ============================================================
// Props & Emits
// ============================================================

const props = defineProps({
  show: { type: Boolean, default: true },
  recorrente: { type: Object as () => ProducaoRecorrente, required: true }
})

const emit = defineEmits(['close', 'atualizado'])

// ============================================================
// Composables
// ============================================================

const producaoService = useProducao()
const { currentCompany } = useCurrentCompany()
const { success, error: showError } = useToast()
const supabase = useSupabaseClient()

// ============================================================
// Local reactive copy
// ============================================================

const local = ref<ProducaoRecorrente>({ ...props.recorrente })

watch(() => props.recorrente, (val) => {
  local.value = { ...val }
}, { deep: true })

// ============================================================
// Estado
// ============================================================

const editing = ref(false)
const saving = ref(false)
const loadingProducoes = ref(false)
const showEncerrarConfirm = ref(false)

// Edit form
const form = ref({
  quantidade: 0,
  intervalo_dias: 0,
  fazenda_id: '',
  lote_semente_id_1: '',
  lote_semente_id_2: '',
  observacoes: ''
})

// Lookup data
const fazendas = ref<Array<{ id: string; nome: string }>>([])
const lotes = ref<Array<{ id: string; numero: string; especie_id: string; status: string }>>([])

// Produções geradas
const producoesGeradas = ref<Array<{
  id: string
  status: ProducaoStatus
  data_plantio_prevista: string | null
  created_at: string
}>>([])

// Next 3 planejado IDs for highlighting
const nextPlanejadoIds = ref<Set<string>>(new Set())

// ============================================================
// Computed
// ============================================================

const nomeEspecies = computed(() => {
  const nome1 = local.value.especie1?.nome || '-'
  if (local.value.tipo === 'mix' && local.value.especie2?.nome) {
    return nome1 + ' + ' + local.value.especie2.nome
  }
  return nome1
})

const lotesFiltrados1 = computed(() => {
  if (!local.value.especie_id_1) return []
  return lotes.value.filter(l => l.especie_id === local.value.especie_id_1 && l.status === 'ativo')
})

const lotesFiltrados2 = computed(() => {
  if (!local.value.especie_id_2) return []
  return lotes.value.filter(l => l.especie_id === local.value.especie_id_2 && l.status === 'ativo')
})

// ============================================================
// Helpers
// ============================================================

function formatDateBR(dateStr?: string | null): string {
  if (!dateStr) return '-'
  const cleaned = dateStr.split('T')[0]
  const date = new Date(cleaned + 'T12:00:00')
  return date.toLocaleDateString('pt-BR')
}

function statusBadgeClass(status: RecorrenteStatus): string {
  const map: Record<RecorrenteStatus, string> = {
    ativa: 'border-green-400 bg-green-50 dark:bg-green-900/20 text-green-600 dark:border-green-500 dark:text-green-400',
    pausada: 'border-amber-400 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:border-amber-400 dark:text-amber-400',
    encerrada: 'border-gray-400 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:border-gray-600 dark:text-gray-400'
  }
  return map[status] || map.ativa
}

function producaoStatusBadgeClass(status: ProducaoStatus): string {
  const map: Record<ProducaoStatus, string> = {
    planejado: 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:border-blue-500 dark:text-blue-400',
    germinando: 'border-amber-400 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:border-amber-400 dark:text-amber-400',
    luz: 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400',
    colhendo: 'border-orange-400 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:border-orange-400 dark:text-orange-400',
    finalizado: 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-600 dark:border-green-500 dark:text-green-400',
    cancelado: 'border-red-400 bg-red-50 dark:bg-red-900/20 text-red-600 dark:border-red-400 dark:text-red-400',
  }
  return map[status] || map.planejado
}

function isNextPlanejado(prod: { id: string }): boolean {
  return nextPlanejadoIds.value.has(prod.id)
}

// ============================================================
// Editing
// ============================================================

function startEditing() {
  form.value = {
    quantidade: local.value.quantidade,
    intervalo_dias: local.value.intervalo_dias,
    fazenda_id: local.value.fazenda_id || '',
    lote_semente_id_1: local.value.lote_semente_id_1 || '',
    lote_semente_id_2: local.value.lote_semente_id_2 || '',
    observacoes: local.value.observacoes || ''
  }
  editing.value = true
}

function cancelEditing() {
  editing.value = false
}

async function saveEdit() {
  saving.value = true

  try {
    const dados: Record<string, any> = {
      quantidade: form.value.quantidade,
      intervalo_dias: form.value.intervalo_dias,
      fazenda_id: form.value.fazenda_id || null,
      lote_semente_id_1: form.value.lote_semente_id_1 || null,
      lote_semente_id_2: form.value.lote_semente_id_2 || null,
      observacoes: form.value.observacoes?.trim() || null
    }

    const ok = await producaoService.editarRecorrente(local.value.id, dados)

    if (ok) {
      editing.value = false
      // Atualizar local com novos valores
      local.value = {
        ...local.value,
        quantidade: dados.quantidade,
        intervalo_dias: dados.intervalo_dias,
        fazenda_id: dados.fazenda_id,
        lote_semente_id_1: dados.lote_semente_id_1,
        lote_semente_id_2: dados.lote_semente_id_2,
        observacoes: dados.observacoes
      }
      emit('atualizado')
    }
  } catch (e: any) {
    showError(e.message || 'Erro ao salvar alterações')
  } finally {
    saving.value = false
  }
}

// ============================================================
// Acoes de Status
// ============================================================

async function handlePausar() {
  saving.value = true
  const ok = await producaoService.pausarRecorrente(local.value.id)
  saving.value = false

  if (ok) {
    local.value = { ...local.value, status: 'pausada' }
    emit('atualizado')
  }
}

async function handleRetomar() {
  saving.value = true
  const ok = await producaoService.retomarRecorrente(local.value.id)
  saving.value = false

  if (ok) {
    local.value = { ...local.value, status: 'ativa' }
    await loadProducoes()
    emit('atualizado')
  }
}

async function handleEncerrar() {
  showEncerrarConfirm.value = false
  saving.value = true

  const ok = await producaoService.encerrarRecorrente(local.value.id)
  saving.value = false

  if (ok) {
    local.value = { ...local.value, status: 'encerrada' }
    emit('atualizado')
  }
}

// ============================================================
// Data Loading
// ============================================================

async function loadProducoes() {
  loadingProducoes.value = true

  try {
    const { data, error } = await supabase
      .from('producoes')
      .select('id, status, data_plantio_prevista, created_at')
      .eq('producao_recorrente_id', local.value.id)
      .order('data_plantio_prevista', { ascending: true })

    if (error) throw error

    producoesGeradas.value = (data || []) as typeof producoesGeradas.value

    // Identificar as proximas 3 planejadas para highlight
    const planejados = producoesGeradas.value
      .filter(p => p.status === 'planejado')
      .slice(0, 3)

    nextPlanejadoIds.value = new Set(planejados.map(p => p.id))
  } catch (e: any) {
    showError('Erro ao carregar produções geradas')
  } finally {
    loadingProducoes.value = false
  }
}

async function loadFazendas() {
  if (!currentCompany.value?.id) return

  const { data } = await supabase
    .from('fazendas')
    .select('id, nome')
    .eq('empresa_id', currentCompany.value.id)
    .order('nome')

  fazendas.value = data || []
}

async function loadLotes() {
  if (!currentCompany.value?.id) return

  const { data } = await supabase
    .from('lotes_sementes')
    .select('id, numero, especie_id, status')
    .eq('empresa_id', currentCompany.value.id)
    .eq('status', 'ativo')
    .order('numero')

  lotes.value = data || []
}

// ============================================================
// Lifecycle
// ============================================================

watch(() => props.show, async (val) => {
  if (val) {
    editing.value = false
    saving.value = false
    await Promise.all([
      loadProducoes(),
      loadFazendas(),
      loadLotes()
    ])
  }
}, { immediate: true })
</script>
