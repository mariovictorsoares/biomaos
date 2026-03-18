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
      <div class="fixed inset-0 z-[100] overflow-y-auto">
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
            <div class="relative w-full max-w-2xl glass-panel rounded-xl shadow-xl">
          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-border-light dark:border-border-dark">
            <h2 class="text-lg font-semibold text-text-light dark:text-text-dark">Novo Plano de Produção</h2>
            <div class="flex items-center gap-2">
              <button @click="$emit('close')" class="btn btn-secondary">Voltar</button>
              <button @click="handleSalvar" class="btn btn-primary" :disabled="saving || !isFormValid">
                <span v-if="saving" class="animate-spin material-icons-outlined text-sm">refresh</span>
                {{ saving ? 'Salvando...' : 'Salvar' }}
              </button>
            </div>
          </div>

          <!-- Content -->
          <div class="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
            <!-- Toggle Tipo: Simples / Mix -->
            <div class="flex gap-2">
              <button
                type="button"
                @click="form.tipo = 'simples'"
                :class="[
                  'flex-1 py-2 px-3 rounded-lg text-sm font-medium border-2 transition-all text-center',
                  form.tipo === 'simples'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border-light dark:border-border-dark text-subtext-light dark:text-subtext-dark hover:border-gray-400'
                ]"
              >
                Simples
              </button>
              <button
                type="button"
                @click="form.tipo = 'mix'"
                :class="[
                  'flex-1 py-2 px-3 rounded-lg text-sm font-medium border-2 transition-all text-center',
                  form.tipo === 'mix'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border-light dark:border-border-dark text-subtext-light dark:text-subtext-dark hover:border-gray-400'
                ]"
              >
                Mix (2 espécies)
              </button>
            </div>

            <!-- Espécie(s) -->
            <div :class="form.tipo === 'mix' ? 'grid grid-cols-2 gap-4' : ''">
              <div>
                <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">
                  {{ form.tipo === 'mix' ? 'Espécie 1' : 'Espécie' }}
                </label>
                <select v-model="form.especie_id_1" :class="['input', attempted && !form.especie_id_1 ? 'border-red-500' : '']">
                  <option value="">Escolha a espécie</option>
                  <option v-for="esp in especiesAtivas" :key="esp.id" :value="esp.id">
                    {{ esp.nome }}
                  </option>
                </select>
                <span v-if="attempted && !form.especie_id_1" class="text-xs text-red-500 mt-1">Campo obrigatório</span>
                <!-- Lote ativo info -->
                <p v-if="loteAtivo1" class="text-[11px] text-subtext-light dark:text-subtext-dark mt-1">
                  Lote: {{ loteAtivo1.numero }} | Margem: {{ ((loteAtivo1.margem_seguranca || 0) * 100).toFixed(0) }}%
                </p>
                <p v-else-if="form.especie_id_1 && !loteAtivo1" class="text-[11px] text-red-500 mt-1">
                  <span class="material-icons-outlined text-[11px] align-middle">warning</span>
                  Sem lote ativo para esta espécie
                </p>
              </div>
              <div v-if="form.tipo === 'mix'">
                <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Espécie 2</label>
                <select v-model="form.especie_id_2" :class="['input', attempted && form.tipo === 'mix' && !form.especie_id_2 ? 'border-red-500' : '']">
                  <option value="">Escolha a espécie</option>
                  <option v-for="esp in especiesAtivas.filter(e => e.id !== form.especie_id_1)" :key="esp.id" :value="esp.id">
                    {{ esp.nome }}
                  </option>
                </select>
                <span v-if="attempted && form.tipo === 'mix' && !form.especie_id_2" class="text-xs text-red-500 mt-1">Campo obrigatório</span>
                <p v-if="loteAtivo2" class="text-[11px] text-subtext-light dark:text-subtext-dark mt-1">
                  Lote: {{ loteAtivo2.numero }} | Margem: {{ ((loteAtivo2.margem_seguranca || 0) * 100).toFixed(0) }}%
                </p>
                <p v-else-if="form.especie_id_2 && !loteAtivo2" class="text-[11px] text-red-500 mt-1">
                  <span class="material-icons-outlined text-[11px] align-middle">warning</span>
                  Sem lote ativo para esta espécie
                </p>
              </div>
            </div>

            <!-- Quantidade + Fazenda -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Quantidade (unidades)</label>
                <input
                  type="number"
                  v-model.number="form.quantidade"
                  min="1"
                  :step="form.tipo === 'mix' ? 2 : 1"
                  placeholder="Ex: 100"
                  :class="['input', attempted && quantidadeError ? 'border-red-500' : '']"
                />
                <span v-if="attempted && quantidadeError" class="text-xs text-red-500 mt-1">{{ quantidadeError }}</span>
              </div>
              <div>
                <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Fazenda</label>
                <select v-model="form.fazenda_id" :class="['input', attempted && !form.fazenda_id ? 'border-red-500' : '']">
                  <option value="">Escolha a fazenda</option>
                  <option v-for="faz in fazendasAtivas" :key="faz.id" :value="faz.id">
                    {{ faz.nome }}
                  </option>
                </select>
                <span v-if="attempted && !form.fazenda_id" class="text-xs text-red-500 mt-1">Campo obrigatório</span>
              </div>
            </div>

            <!-- Data Colheita -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Data de Colheita</label>
                <input type="date" v-model="form.dataColheita" :class="['input', attempted && (!form.dataColheita || !colheitaNoFuturo) ? 'border-red-500' : '']" />
                <span v-if="attempted && !form.dataColheita" class="text-xs text-red-500 mt-1">Campo obrigatório</span>
                <span v-else-if="form.dataColheita && !colheitaNoFuturo" class="text-xs text-red-500 mt-1">Data deve ser no futuro</span>
              </div>
              <div></div>
            </div>

            <!-- Info Calculada -->
            <div v-if="showPreview" class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg space-y-2">
              <p class="text-xs font-medium text-blue-700 dark:text-blue-300 mb-2">Cálculos Automáticos</p>

              <div class="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <div class="flex justify-between">
                  <span class="text-blue-600 dark:text-blue-400">Bandejas:</span>
                  <span class="font-medium text-blue-800 dark:text-blue-200">{{ preview.bandejas }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-blue-600 dark:text-blue-400">Margem:</span>
                  <span class="font-medium text-blue-800 dark:text-blue-200">{{ (preview.margem * 100).toFixed(0) }}%</span>
                </div>

                <!-- Data plantio (simples) -->
                <template v-if="form.tipo === 'simples'">
                  <div class="flex justify-between">
                    <span class="text-blue-600 dark:text-blue-400">Data plantio:</span>
                    <span class="font-medium text-blue-800 dark:text-blue-200">{{ formatDateBR(preview.dataPlantio1) }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-blue-600 dark:text-blue-400">Semente:</span>
                    <span class="font-medium text-blue-800 dark:text-blue-200">
                      {{ preview.semente1 > 0 ? preview.semente1.toFixed(1) + ' g' : 'N/D' }}
                      <span v-if="preview.semente1 === 0" class="material-icons-outlined text-[11px] text-amber-500 align-middle">warning</span>
                    </span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-blue-600 dark:text-blue-400">Rendimento esperado:</span>
                    <span class="font-medium text-blue-800 dark:text-blue-200">
                      {{ preview.rendimento1 > 0 ? preview.rendimento1.toFixed(1) + ' g' : 'N/D' }}
                      <span v-if="preview.rendimento1 === 0" class="material-icons-outlined text-[11px] text-amber-500 align-middle">warning</span>
                    </span>
                  </div>
                </template>

                <!-- Data plantio (mix — 2 linhas) -->
                <template v-if="form.tipo === 'mix'">
                  <div class="flex justify-between">
                    <span class="text-blue-600 dark:text-blue-400">Plantio esp. 1:</span>
                    <span class="font-medium text-blue-800 dark:text-blue-200">{{ formatDateBR(preview.dataPlantio1) }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-blue-600 dark:text-blue-400">Plantio esp. 2:</span>
                    <span class="font-medium text-blue-800 dark:text-blue-200">{{ formatDateBR(preview.dataPlantio2) }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-blue-600 dark:text-blue-400">Semente esp. 1:</span>
                    <span class="font-medium text-blue-800 dark:text-blue-200">
                      {{ preview.semente1 > 0 ? preview.semente1.toFixed(1) + ' g' : 'N/D' }}
                    </span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-blue-600 dark:text-blue-400">Semente esp. 2:</span>
                    <span class="font-medium text-blue-800 dark:text-blue-200">
                      {{ preview.semente2 > 0 ? preview.semente2.toFixed(1) + ' g' : 'N/D' }}
                    </span>
                  </div>
                </template>
              </div>

              <!-- Data plantio no passado warning -->
              <p v-if="preview.plantioNoPassado" class="text-xs text-red-500 mt-2">
                <span class="material-icons-outlined text-[11px] align-middle">error</span>
                A data de plantio calculada está no passado!
              </p>
            </div>
          </div>
            </div>
          </Transition>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  close: []
  saved: []
}>()

const supabase = useSupabaseClient()
const { currentCompany } = useCurrentCompany()
const { success, error: showError } = useToast()
const {
  calcularBandejasPlano,
  calcularDataPlantio,
  calcularDataValidade,
  calcularSementeNecessaria,
  calcularRendimentoEsperado,
  maiorMargem
} = useProducaoCalc()

// Form state
const form = reactive({
  tipo: 'simples' as 'simples' | 'mix',
  especie_id_1: '',
  especie_id_2: '',
  quantidade: null as number | null,
  fazenda_id: '',
  dataColheita: ''
})
const attempted = ref(false)
const saving = ref(false)

// Data
const especies = ref<any[]>([])
const fazendas = ref<any[]>([])
const lotes = ref<any[]>([])
const etapasMap = ref<Record<string, any[]>>({})

// Load data on mount
onMounted(async () => {
  if (!currentCompany.value?.id) return
  const empresaId = currentCompany.value.id

  const [especiesRes, fazendasRes, lotesRes, etapasRes] = await Promise.all([
    supabase.from('especies').select('id, codigo, nome, tempo_germinacao, tempo_luz, vida_util_dias, tempo_buffer_colheita')
      .eq('empresa_id', empresaId).eq('ativo', true).order('nome'),
    supabase.from('fazendas').select('id, nome, unidades_por_bandeja')
      .eq('empresa_id', empresaId).eq('ativo', true).order('nome'),
    supabase.from('lotes_sementes').select('id, numero, especie_id, rendimento_por_bandeja, densidade_semeadura, margem_seguranca')
      .eq('empresa_id', empresaId).eq('status', 'ativo').order('created_at', { ascending: false }),
    supabase.from('etapas_cultivo').select('especie_id, nome, ordem, duracao_dias')
      .order('ordem', { ascending: true })
  ])

  especies.value = especiesRes.data || []
  fazendas.value = fazendasRes.data || []
  lotes.value = lotesRes.data || []

  // Build etapas map: especie_id -> etapas[]
  const map: Record<string, any[]> = {}
  for (const e of etapasRes.data || []) {
    if (!map[e.especie_id]) map[e.especie_id] = []
    map[e.especie_id].push(e)
  }
  etapasMap.value = map
})

// Computed: filtered lists
const especiesAtivas = computed(() => especies.value)
const fazendasAtivas = computed(() => fazendas.value)

// Computed: lote ativo for selected species
const loteAtivo1 = computed(() => {
  if (!form.especie_id_1) return null
  return lotes.value.find(l => l.especie_id === form.especie_id_1) || null
})
const loteAtivo2 = computed(() => {
  if (!form.especie_id_2) return null
  return lotes.value.find(l => l.especie_id === form.especie_id_2) || null
})

// Computed: fazenda selected
const fazendaSelecionada = computed(() => fazendas.value.find(f => f.id === form.fazenda_id))

// Computed: especie objects
const especie1 = computed(() => especies.value.find(e => e.id === form.especie_id_1))
const especie2 = computed(() => especies.value.find(e => e.id === form.especie_id_2))

// Computed: quantidade validation
const quantidadeError = computed(() => {
  if (!form.quantidade || form.quantidade <= 0) return 'Campo obrigatório'
  if (form.tipo === 'mix' && form.quantidade % 2 !== 0) return 'Para mix, quantidade deve ser par'
  return ''
})

// Computed: colheita no futuro
const colheitaNoFuturo = computed(() => {
  if (!form.dataColheita) return false
  return new Date(form.dataColheita) >= new Date(new Date().toISOString().split('T')[0])
})

// Computed: preview calculations
const showPreview = computed(() => {
  const hasSpecies = form.tipo === 'simples' ? !!form.especie_id_1 : (!!form.especie_id_1 && !!form.especie_id_2)
  const hasLote = form.tipo === 'simples' ? !!loteAtivo1.value : (!!loteAtivo1.value && !!loteAtivo2.value)
  return hasSpecies && hasLote && form.quantidade && form.quantidade > 0 && form.fazenda_id && form.dataColheita && colheitaNoFuturo.value
})

const preview = computed(() => {
  if (!showPreview.value) return { bandejas: 0, margem: 0, dataPlantio1: '', dataPlantio2: '', semente1: 0, semente2: 0, rendimento1: 0, rendimento2: 0, plantioNoPassado: false }

  const faz = fazendaSelecionada.value
  const upb = faz?.unidades_por_bandeja || 6

  if (form.tipo === 'simples') {
    const lote = loteAtivo1.value!
    const esp = especie1.value!
    const etapas = etapasMap.value[esp.id] || null
    const margem = lote.margem_seguranca || 0
    const bandejas = calcularBandejasPlano(form.quantidade!, upb, margem)
    const dataPlantio = calcularDataPlantio(form.dataColheita, etapas, esp)
    const semente = calcularSementeNecessaria(bandejas, lote)
    const rendimento = calcularRendimentoEsperado(bandejas, lote)
    const plantioNoPassado = new Date(dataPlantio) < new Date(new Date().toISOString().split('T')[0])

    return { bandejas, margem, dataPlantio1: dataPlantio, dataPlantio2: '', semente1: semente, semente2: 0, rendimento1: rendimento, rendimento2: 0, plantioNoPassado }
  }

  // Mix
  const lote1 = loteAtivo1.value!
  const lote2 = loteAtivo2.value!
  const esp1 = especie1.value!
  const esp2 = especie2.value!
  const etapas1 = etapasMap.value[esp1.id] || null
  const etapas2 = etapasMap.value[esp2.id] || null
  const margem = maiorMargem([lote1, lote2])
  const bandejas = calcularBandejasPlano(form.quantidade!, upb, margem)
  const dataPlantio1 = calcularDataPlantio(form.dataColheita, etapas1, esp1)
  const dataPlantio2 = calcularDataPlantio(form.dataColheita, etapas2, esp2)
  const halfBandejas = bandejas / 2
  const semente1 = calcularSementeNecessaria(halfBandejas, lote1)
  const semente2 = calcularSementeNecessaria(halfBandejas, lote2)
  const rendimento1 = calcularRendimentoEsperado(halfBandejas, lote1)
  const rendimento2 = calcularRendimentoEsperado(halfBandejas, lote2)
  const plantioNoPassado = new Date(dataPlantio1) < new Date(new Date().toISOString().split('T')[0]) || new Date(dataPlantio2) < new Date(new Date().toISOString().split('T')[0])

  return { bandejas, margem, dataPlantio1, dataPlantio2, semente1, semente2, rendimento1, rendimento2, plantioNoPassado }
})

// Form valid
const isFormValid = computed(() => {
  if (!form.especie_id_1 || !form.fazenda_id || !form.dataColheita) return false
  if (!colheitaNoFuturo.value) return false
  if (!form.quantidade || form.quantidade <= 0) return false
  if (form.tipo === 'mix') {
    if (!form.especie_id_2 || form.especie_id_1 === form.especie_id_2) return false
    if (form.quantidade % 2 !== 0) return false
    if (!loteAtivo2.value) return false
  }
  if (!loteAtivo1.value) return false
  if (preview.value.plantioNoPassado) return false
  return true
})

// Save
async function handleSalvar() {
  attempted.value = true
  if (!isFormValid.value || !currentCompany.value?.id) return

  saving.value = true
  try {
    const empresaId = currentCompany.value.id
    const faz = fazendaSelecionada.value!
    const upb = faz.unidades_por_bandeja || 6

    if (form.tipo === 'simples') {
      const lote = loteAtivo1.value!
      const esp = especie1.value!
      const etapas = etapasMap.value[esp.id] || null
      const margem = lote.margem_seguranca || 0
      const bandejas = calcularBandejasPlano(form.quantidade!, upb, margem)
      const dataPlantio = calcularDataPlantio(form.dataColheita, etapas, esp)
      const dataValidade = calcularDataValidade(form.dataColheita, esp)
      const semente = calcularSementeNecessaria(bandejas, lote)
      const rendimento = calcularRendimentoEsperado(bandejas, lote)

      const { error } = await supabase.from('plantios').insert({
        empresa_id: empresaId,
        especie_id: esp.id,
        lote_semente_id: lote.id,
        fazenda_id: faz.id,
        quantidade_unidades: form.quantidade,
        bandejas,
        data_colheita: form.dataColheita,
        data_plantio: dataPlantio,
        data_validade: dataValidade,
        semente_necessaria_g: semente,
        rendimento_esperado_g: rendimento,
        status: 'planejado'
      })
      if (error) throw error
    } else {
      // Mix: 2 inserts with shared mix_grupo_id
      const mixGrupoId = crypto.randomUUID()
      const lote1 = loteAtivo1.value!
      const lote2 = loteAtivo2.value!
      const esp1 = especie1.value!
      const esp2 = especie2.value!
      const etapas1 = etapasMap.value[esp1.id] || null
      const etapas2 = etapasMap.value[esp2.id] || null
      const margem = maiorMargem([lote1, lote2])
      const bandejas = calcularBandejasPlano(form.quantidade!, upb, margem)
      const unidadesPorEspecie = form.quantidade! / 2
      const halfBandejas = bandejas / 2

      const records = [
        {
          empresa_id: empresaId,
          especie_id: esp1.id,
          lote_semente_id: lote1.id,
          fazenda_id: faz.id,
          quantidade_unidades: unidadesPorEspecie,
          bandejas,
          mix_grupo_id: mixGrupoId,
          data_colheita: form.dataColheita,
          data_plantio: calcularDataPlantio(form.dataColheita, etapas1, esp1),
          data_validade: calcularDataValidade(form.dataColheita, esp1),
          semente_necessaria_g: calcularSementeNecessaria(halfBandejas, lote1),
          rendimento_esperado_g: calcularRendimentoEsperado(halfBandejas, lote1),
          status: 'planejado'
        },
        {
          empresa_id: empresaId,
          especie_id: esp2.id,
          lote_semente_id: lote2.id,
          fazenda_id: faz.id,
          quantidade_unidades: unidadesPorEspecie,
          bandejas,
          mix_grupo_id: mixGrupoId,
          data_colheita: form.dataColheita,
          data_plantio: calcularDataPlantio(form.dataColheita, etapas2, esp2),
          data_validade: calcularDataValidade(form.dataColheita, esp2),
          semente_necessaria_g: calcularSementeNecessaria(halfBandejas, lote2),
          rendimento_esperado_g: calcularRendimentoEsperado(halfBandejas, lote2),
          status: 'planejado'
        }
      ]

      const { error } = await supabase.from('plantios').insert(records)
      if (error) throw error
    }

    success(form.tipo === 'mix' ? 'Plano mix criado com sucesso!' : 'Plano de produção criado!')
    emit('saved')
    emit('close')
  } catch (e: any) {
    showError('Erro ao salvar: ' + e.message)
  } finally {
    saving.value = false
  }
}

// Helpers
function formatDateBR(dateStr: string): string {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}
</script>
