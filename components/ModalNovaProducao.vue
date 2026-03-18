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
      <div v-if="show" class="fixed inset-0 z-[70] overflow-y-auto">
        <!-- Backdrop -->
        <div class="fixed inset-0 glass-backdrop" @click="$emit('close')"></div>

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
            <div v-if="show" class="relative z-[71] glass-panel rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
              <!-- Header (title + close only) -->
              <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
                <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Nova Produção</h2>
                <button @click="$emit('close')" class="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <span class="material-icons-outlined text-xl text-gray-500 dark:text-gray-400">close</span>
                </button>
              </div>

              <!-- Content -->
              <div class="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                <!-- Toggle Simples / Mix -->
                <div class="flex gap-2">
                  <button
                    type="button"
                    @click="form.tipo = 'simples'"
                    :class="[
                      'flex-1 py-2 px-3 rounded-lg text-sm font-medium border-2 transition-all text-center',
                      form.tipo === 'simples'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-400'
                    ]"
                  >
                    <span class="material-icons-outlined text-sm mr-1">eco</span>
                    Simples
                  </button>
                  <button
                    type="button"
                    @click="form.tipo = 'mix'"
                    :class="[
                      'flex-1 py-2 px-3 rounded-lg text-sm font-medium border-2 transition-all text-center',
                      form.tipo === 'mix'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-400'
                    ]"
                  >
                    <span class="material-icons-outlined text-sm mr-1">blender</span>
                    Mix (2 espécies)
                  </button>
                </div>

                <!-- Espécie 1 + Lote 1 -->
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Espécie {{ form.tipo === 'mix' ? '1' : '' }} <span class="text-red-500">*</span>
                    </label>
                    <select
                      v-model="form.especie_id_1"
                      :class="['input', attempted && !form.especie_id_1 ? 'border-red-500' : '']"
                    >
                      <option value="">Selecione a espécie</option>
                      <option
                        v-for="esp in especiesAtivas"
                        :key="esp.id"
                        :value="esp.id"
                      >
                        {{ esp.nome }}
                      </option>
                    </select>
                    <span v-if="attempted && !form.especie_id_1" class="text-xs text-red-500 mt-1">Campo obrigatório</span>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Lote de Semente {{ form.tipo === 'mix' ? '1' : '' }}
                    </label>
                    <select
                      v-model="form.lote_id_1"
                      :class="['input', attempted && !form.lote_id_1 ? 'border-red-500' : '']"
                      :disabled="!form.especie_id_1 || lotesEspecie1.length === 0"
                    >
                      <option value="">{{ !form.especie_id_1 ? 'Selecione a espécie primeiro' : lotesEspecie1.length === 0 ? 'Nenhum lote ativo' : 'Selecione o lote' }}</option>
                      <option
                        v-for="lote in lotesEspecie1"
                        :key="lote.id"
                        :value="lote.id"
                      >
                        {{ lote.numero }}
                      </option>
                    </select>
                  </div>
                </div>

                <!-- Espécie 2 + Lote 2 (somente Mix) -->
                <div v-if="form.tipo === 'mix'" class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Espécie 2 <span class="text-red-500">*</span>
                    </label>
                    <select
                      v-model="form.especie_id_2"
                      :class="['input', attempted && form.tipo === 'mix' && !form.especie_id_2 ? 'border-red-500' : '']"
                    >
                      <option value="">Selecione a espécie</option>
                      <option
                        v-for="esp in especiesAtivas"
                        :key="esp.id"
                        :value="esp.id"
                      >
                        {{ esp.nome }}
                      </option>
                    </select>
                    <span v-if="attempted && form.tipo === 'mix' && !form.especie_id_2" class="text-xs text-red-500 mt-1">Campo obrigatório</span>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Lote de Semente 2
                    </label>
                    <select
                      v-model="form.lote_id_2"
                      :class="['input', attempted && form.tipo === 'mix' && !form.lote_id_2 ? 'border-red-500' : '']"
                      :disabled="!form.especie_id_2 || lotesEspecie2.length === 0"
                    >
                      <option value="">{{ !form.especie_id_2 ? 'Selecione a espécie primeiro' : lotesEspecie2.length === 0 ? 'Nenhum lote ativo' : 'Selecione o lote' }}</option>
                      <option
                        v-for="lote in lotesEspecie2"
                        :key="lote.id"
                        :value="lote.id"
                      >
                        {{ lote.numero }}
                      </option>
                    </select>
                  </div>
                </div>

                <!-- Quantidade + Fazenda -->
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Quantidade (unidades) <span class="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      v-model.number="form.quantidade"
                      placeholder="Ex: 10"
                      min="1"
                      :class="['input', attempted && (!form.quantidade || form.quantidade <= 0) ? 'border-red-500' : '', attempted && form.tipo === 'mix' && form.quantidade % 2 !== 0 ? 'border-red-500' : '']"
                    />
                    <span v-if="attempted && (!form.quantidade || form.quantidade <= 0)" class="text-xs text-red-500 mt-1">Quantidade deve ser maior que zero</span>
                    <span v-else-if="attempted && form.tipo === 'mix' && form.quantidade && form.quantidade % 2 !== 0" class="text-xs text-red-500 mt-1">Mix deve ter quantidade par (50/50)</span>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Fazenda
                    </label>
                    <select v-model="form.fazenda_id" :class="['input', attempted && !form.fazenda_id ? 'border-red-500' : '']">
                      <option value="">Selecione a fazenda</option>
                      <option
                        v-for="faz in fazendasAtivas"
                        :key="faz.id"
                        :value="faz.id"
                      >
                        {{ faz.nome }}
                      </option>
                    </select>
                  </div>
                </div>

                <!-- Data Plantio Prevista -->
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Data de Plantio Prevista <span class="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      v-model="form.data_plantio_prevista"
                      :class="['input', attempted && !form.data_plantio_prevista ? 'border-red-500' : '']"
                    />
                    <span v-if="attempted && !form.data_plantio_prevista" class="text-xs text-red-500 mt-1">Campo obrigatório</span>
                  </div>

                  <!-- Toggle Recorrente -->
                  <div class="flex flex-col justify-end">
                    <label class="flex items-center gap-2 cursor-pointer py-2">
                      <input
                        type="checkbox"
                        v-model="form.recorrente"
                        class="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                      />
                      <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Produção recorrente</span>
                    </label>
                  </div>
                </div>

                <!-- Recorrência: intervalo em dias -->
                <div v-if="form.recorrente" class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Intervalo</label>
                  <div class="flex items-center gap-2">
                    <span class="text-sm text-gray-500 dark:text-gray-400">A cada</span>
                    <input
                      type="number"
                      v-model.number="form.intervalo_dias"
                      min="1"
                      placeholder="7"
                      :class="['input w-24', attempted && form.recorrente && (!form.intervalo_dias || form.intervalo_dias <= 0) ? 'border-red-500' : '']"
                    />
                    <span class="text-sm text-gray-500 dark:text-gray-400">dias</span>
                  </div>
                  <span v-if="attempted && form.recorrente && (!form.intervalo_dias || form.intervalo_dias <= 0)" class="text-xs text-red-500 mt-1">Intervalo deve ser maior que zero</span>
                </div>

                <!-- Preview Panel: Datas Calculadas -->
                <div
                  v-if="previewDatas"
                  class="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
                >
                  <p class="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-3 flex items-center gap-1">
                    <span class="material-icons-outlined text-sm">calendar_month</span>
                    Previsão do Ciclo de Cultivo
                  </p>
                  <div class="grid grid-cols-3 gap-3">
                    <!-- Plantio -->
                    <div class="flex items-start gap-2">
                      <span class="material-icons-outlined text-amber-500 text-lg mt-0.5">grass</span>
                      <div>
                        <p class="text-[11px] text-blue-600 dark:text-blue-400 font-medium">Plantio</p>
                        <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ formatDate(previewDatas.data_plantio_prevista) }}</p>
                      </div>
                    </div>
                    <!-- Luz -->
                    <div class="flex items-start gap-2">
                      <span class="material-icons-outlined text-yellow-500 text-lg mt-0.5">wb_sunny</span>
                      <div>
                        <p class="text-[11px] text-blue-600 dark:text-blue-400 font-medium">Luz</p>
                        <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ formatDate(previewDatas.data_luz_prevista) }}</p>
                      </div>
                    </div>
                    <!-- Colheita -->
                    <div class="flex items-start gap-2">
                      <span class="material-icons-outlined text-green-500 text-lg mt-0.5">content_cut</span>
                      <div>
                        <p class="text-[11px] text-blue-600 dark:text-blue-400 font-medium">Colheita</p>
                        <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ formatDate(previewDatas.data_colheita_prevista) }}</p>
                      </div>
                    </div>
                  </div>
                  <p v-if="previewTempos" class="text-[11px] text-blue-500 dark:text-blue-400 mt-2">
                    Germinação: {{ previewTempos.germinacao }}d | Luz: {{ previewTempos.luz }}d | Total: {{ previewTempos.germinacao + previewTempos.luz }}d
                  </p>

                  <!-- Bandejas -->
                  <div v-if="previewBandejas" class="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800 flex items-center gap-2">
                    <span class="material-icons-outlined text-blue-500 text-lg">grid_view</span>
                    <div>
                      <p class="text-sm font-semibold text-gray-900 dark:text-white">
                        {{ previewBandejas.bandejas }} {{ previewBandejas.bandejas === 1 ? 'bandeja' : 'bandejas' }}
                      </p>
                      <p class="text-[11px] text-blue-500 dark:text-blue-400">
                        {{ previewBandejas.unidadesPorBandeja }} und/bandeja{{ previewBandejas.margem > 0 ? ` · +${Math.round(previewBandejas.margem * 100)}% margem` : '' }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Footer (buttons bottom-right) -->
              <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl flex-shrink-0">
                <button @click="$emit('close')" class="btn btn-secondary">Cancelar</button>
                <button @click="handleSave" class="btn btn-primary" :disabled="saving">
                  <span v-if="saving" class="material-icons-outlined text-sm animate-spin mr-1">refresh</span>
                  {{ saving ? 'Salvando...' : 'Salvar' }}
                </button>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useCurrentCompany } from '~/composables/useCurrentCompany'
import { useToast } from '~/composables/useToast'
import { useProducao } from '~/composables/useProducao'
import { useProducaoCalc } from '~/composables/useProducaoCalc'

const supabase = useSupabaseClient()
const { currentCompany } = useCurrentCompany()
const toast = useToast()
const producao = useProducao()
const calc = useProducaoCalc()

const props = defineProps({
  show: { type: Boolean, default: true }
})

const emit = defineEmits(['close', 'saved'])

// ============================================================
// State
// ============================================================

const saving = ref(false)
const attempted = ref(false)

const form = ref({
  tipo: 'simples',
  especie_id_1: '',
  lote_id_1: '',
  especie_id_2: '',
  lote_id_2: '',
  quantidade: null,
  fazenda_id: '',
  data_plantio_prevista: new Date().toISOString().split('T')[0],
  recorrente: false,
  intervalo_dias: null
})

// Data from Supabase
const especies = ref([])
const fazendas = ref([])
const lotesEspecie1 = ref([])
const lotesEspecie2 = ref([])

// ============================================================
// Computed
// ============================================================

const especiesAtivas = computed(() => {
  return especies.value.filter(e => e.ativo)
})

const fazendasAtivas = computed(() => {
  return fazendas.value.filter(f => f.ativo !== false)
})

/**
 * Resolve tempos de germinacao/luz para a especie 1 (lote > especie fallback)
 */
const temposEspecie1 = computed(() => {
  return resolverTempos(form.value.especie_id_1, form.value.lote_id_1)
})

/**
 * Resolve tempos de germinacao/luz para a especie 2 (lote > especie fallback)
 */
const temposEspecie2 = computed(() => {
  return resolverTempos(form.value.especie_id_2, form.value.lote_id_2)
})

/**
 * Tempos efetivos para calculo de datas. Para mix, usa o maior entre as 2 especies.
 */
const previewTempos = computed(() => {
  const t1 = temposEspecie1.value
  if (!t1) return null

  if (form.value.tipo === 'mix') {
    const t2 = temposEspecie2.value
    if (!t2) return t1
    return {
      germinacao: Math.max(t1.germinacao, t2.germinacao),
      luz: Math.max(t1.luz, t2.luz)
    }
  }

  return t1
})

/**
 * Fazenda selecionada (com unidades_por_bandeja)
 */
const fazendaSelecionada = computed(() => {
  if (!form.value.fazenda_id) return null
  return fazendas.value.find(f => f.id === form.value.fazenda_id) || null
})

/**
 * Calcula quantas bandejas serao necessarias
 */
const previewBandejas = computed(() => {
  const qtd = form.value.quantidade
  const faz = fazendaSelecionada.value
  if (!qtd || qtd <= 0 || !faz || !faz.unidades_por_bandeja || faz.unidades_por_bandeja <= 0) return null

  // Margem de seguranca do lote (maior entre lotes 1 e 2 para mix)
  let margem = 0
  if (form.value.lote_id_1) {
    const lote1 = lotesEspecie1.value.find(l => l.id === form.value.lote_id_1)
    if (lote1) margem = lote1.margem_seguranca || 0
  }
  if (form.value.tipo === 'mix' && form.value.lote_id_2) {
    const lote2 = lotesEspecie2.value.find(l => l.id === form.value.lote_id_2)
    if (lote2) margem = Math.max(margem, lote2.margem_seguranca || 0)
  }

  const bandejas = calc.calcularBandejasPlano(qtd, faz.unidades_por_bandeja, margem)
  return {
    bandejas,
    unidadesPorBandeja: faz.unidades_por_bandeja,
    margem
  }
})

/**
 * Preview de datas calculadas
 */
const previewDatas = computed(() => {
  if (!form.value.data_plantio_prevista || !previewTempos.value) return null
  if (!form.value.especie_id_1) return null

  return calc.calcularDatasProducao(
    form.value.data_plantio_prevista,
    previewTempos.value.germinacao,
    previewTempos.value.luz
  )
})

// ============================================================
// Watchers: carregar lotes quando especie muda
// ============================================================

watch(() => form.value.especie_id_1, async (newVal) => {
  form.value.lote_id_1 = ''
  lotesEspecie1.value = []
  if (newVal) {
    lotesEspecie1.value = await carregarLotes(newVal)
    if (lotesEspecie1.value.length > 0) {
      form.value.lote_id_1 = lotesEspecie1.value[0].id
    }
  }
})

watch(() => form.value.especie_id_2, async (newVal) => {
  form.value.lote_id_2 = ''
  lotesEspecie2.value = []
  if (newVal) {
    lotesEspecie2.value = await carregarLotes(newVal)
    if (lotesEspecie2.value.length > 0) {
      form.value.lote_id_2 = lotesEspecie2.value[0].id
    }
  }
})

// Resetar campos de especie 2 quando volta para simples
watch(() => form.value.tipo, (newVal) => {
  if (newVal === 'simples') {
    form.value.especie_id_2 = ''
    form.value.lote_id_2 = ''
    lotesEspecie2.value = []
  }
})

// ============================================================
// Helpers
// ============================================================

function resolverTempos(especieId, loteId) {
  if (!especieId || !loteId) return null

  const lotes = especieId === form.value.especie_id_1 ? lotesEspecie1.value : lotesEspecie2.value
  const lote = lotes.find(l => l.id === loteId)
  if (!lote) return null

  const germinacao = lote.tempo_germinacao || 0
  const luz = lote.tempo_luz || 0
  if (germinacao === 0 && luz === 0) return null

  return { germinacao, luz }
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr + 'T12:00:00')
  return date.toLocaleDateString('pt-BR')
}

// ============================================================
// Data loading
// ============================================================

async function carregarLotes(especieId) {
  const { data, error } = await supabase
    .from('lotes_sementes')
    .select('id, numero, tempo_germinacao, tempo_luz, rendimento_por_bandeja, densidade_semeadura, margem_seguranca')
    .eq('especie_id', especieId)
    .eq('status', 'ativo')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erro ao carregar lotes:', error)
    return []
  }

  return data || []
}

async function carregarDados() {
  if (!currentCompany.value?.id) return

  const [especiesRes, fazendasRes] = await Promise.all([
    supabase
      .from('especies')
      .select('id, nome, codigo, ativo, tempo_germinacao, tempo_luz, vida_util_dias, tempo_buffer_colheita')
      .eq('empresa_id', currentCompany.value.id)
      .eq('ativo', true)
      .order('nome'),
    supabase
      .from('fazendas')
      .select('id, nome, codigo, ativo, unidades_por_bandeja')
      .eq('empresa_id', currentCompany.value.id)
      .eq('ativo', true)
      .order('nome')
  ])

  especies.value = especiesRes.data || []
  fazendas.value = fazendasRes.data || []
}

// ============================================================
// Validation & Save
// ============================================================

function validate() {
  // Fazenda obrigatoria
  if (!form.value.fazenda_id) return false

  // Especie 1 obrigatoria
  if (!form.value.especie_id_1) return false

  // Lote 1 obrigatorio
  if (!form.value.lote_id_1) return false

  // Quantidade > 0
  if (!form.value.quantidade || form.value.quantidade <= 0) return false

  // Mix: quantidade par
  if (form.value.tipo === 'mix' && form.value.quantidade % 2 !== 0) return false

  // Mix: especie 2 obrigatoria
  if (form.value.tipo === 'mix' && !form.value.especie_id_2) return false

  // Mix: lote 2 obrigatorio
  if (form.value.tipo === 'mix' && !form.value.lote_id_2) return false

  // Data plantio obrigatoria
  if (!form.value.data_plantio_prevista) return false

  // Recorrente: intervalo > 0
  if (form.value.recorrente && (!form.value.intervalo_dias || form.value.intervalo_dias <= 0)) return false

  return true
}

async function handleSave() {
  attempted.value = true

  if (!validate()) {
    toast.error('Preencha todos os campos obrigatórios')
    return
  }

  saving.value = true

  try {
    // Montar form no formato esperado por useProducao.criarProducao
    const especiesArr = [
      {
        especie_id: form.value.especie_id_1,
        lote_semente_id: form.value.lote_id_1 || null
      }
    ]

    if (form.value.tipo === 'mix' && form.value.especie_id_2) {
      especiesArr.push({
        especie_id: form.value.especie_id_2,
        lote_semente_id: form.value.lote_id_2 || null
      })
    }

    const novaProducaoForm = {
      tipo: form.value.tipo,
      fazenda_id: form.value.fazenda_id || null,
      quantidade_planejada: form.value.quantidade,
      data_plantio_prevista: form.value.data_plantio_prevista,
      observacoes: '',
      especies: especiesArr,
      recorrente: form.value.recorrente,
      intervalo_dias: form.value.recorrente ? form.value.intervalo_dias : null
    }

    // Criar producao
    const producaoId = await producao.criarProducao(novaProducaoForm)

    if (!producaoId) {
      saving.value = false
      return
    }

    // Se recorrente, criar template recorrente
    if (form.value.recorrente && form.value.intervalo_dias > 0) {
      await producao.criarRecorrente(
        {
          tipo: form.value.tipo,
          fazenda_id: form.value.fazenda_id || null,
          quantidade: form.value.quantidade,
          intervalo_dias: form.value.intervalo_dias,
          observacoes: '',
          especies: especiesArr
        },
        producaoId
      )
    }

    emit('saved')
  } catch (e) {
    console.error('Erro ao salvar producao:', e)
    toast.error('Erro ao salvar produção')
  } finally {
    saving.value = false
  }
}

// ============================================================
// Lifecycle
// ============================================================

watch(() => currentCompany.value?.id, (id) => {
  if (id && props.show) carregarDados()
}, { immediate: true })

// Reset form when modal opens
watch(() => props.show, (val) => {
  if (val) {
    attempted.value = false
    saving.value = false
    form.value = {
      tipo: 'simples',
      especie_id_1: '',
      lote_id_1: '',
      especie_id_2: '',
      lote_id_2: '',
      quantidade: null,
      fazenda_id: '',
      data_plantio_prevista: new Date().toISOString().split('T')[0],
      recorrente: false,
      intervalo_dias: null
    }
    lotesEspecie1.value = []
    lotesEspecie2.value = []
    if (currentCompany.value?.id) carregarDados()
  }
})
</script>
