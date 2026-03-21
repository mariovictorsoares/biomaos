<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-12">
      <h1 class="text-lg font-medium text-text-light/70 dark:text-text-dark/70 tracking-wide uppercase">Fazendas</h1>
      <div class="flex items-center gap-2">
        <button @click="showEwelinkModal = true" class="btn btn-secondary text-xs">
          <span class="w-1.5 h-1.5 rounded-full" :class="contaAtiva ? 'bg-green-500' : contaErro ? 'bg-red-500' : 'bg-gray-400'"></span>
          <span class="material-icons-outlined text-sm">sensors</span>
          IoT
        </button>
        <button @click="openModal(null)" class="btn btn-primary">
          <span class="material-icons-outlined text-sm">add</span>
          Nova fazenda
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-16">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>

    <!-- Farm cards grid -->
    <template v-else-if="fazendasAtivas.length > 0">
      <div class="space-y-3">
        <CardMonitoramentoFazenda
          v-for="f in fazendasAtivas"
          :key="f.id"
          :fazenda="f"
          :dispositivos="dispositivosPorFazenda[f.id] || []"
          :stats="statsPorFazenda[f.id] || null"
          @click="openSlideover(f)"
        />
      </div>
    </template>

    <!-- Empty state -->
    <div v-else class="card p-12 text-center">
      <span class="material-icons-outlined text-5xl text-gray-300 dark:text-gray-600 mb-3">agriculture</span>
      <h3 class="text-lg font-medium text-text-light dark:text-text-dark mb-1">Nenhuma fazenda cadastrada</h3>
      <p class="text-sm text-subtext-light dark:text-subtext-dark mb-4">Comece cadastrando sua primeira fazenda</p>
      <button @click="openModal(null)" class="btn btn-primary">
        <span class="material-icons-outlined text-sm">add</span>
        Nova fazenda
      </button>
    </div>

    <!-- Modal Monitoramento -->
    <SlideoverMonitoramentoFazenda
      :show="!!selectedFazenda"
      :fazenda="selectedFazenda || {}"
      @close="selectedFazenda = null"
      @updated="handleSlideoverUpdated"
    />

    <!-- ======================= -->
    <!-- MODAL EWELINK CONFIG    -->
    <!-- ======================= -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        leave-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        leave-to-class="opacity-0"
      >
        <div v-if="showEwelinkModal" class="fixed inset-0 z-[60] overflow-y-auto">
          <div class="fixed inset-0 glass-backdrop" @click="showEwelinkModal = false"></div>
          <div class="flex min-h-full items-center justify-center p-4">
            <Transition
              enter-active-class="transition-all duration-200"
              leave-active-class="transition-all duration-200"
              enter-from-class="opacity-0 scale-95"
              leave-to-class="opacity-0 scale-95"
            >
              <div v-if="showEwelinkModal" class="relative glass-panel rounded-lg shadow-xl w-full max-w-lg">
                <!-- Header -->
                <div class="border-b border-border-light dark:border-border-dark px-6 py-4 flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center border-2 border-blue-500 shrink-0">
                      <span class="material-icons-outlined text-blue-500 text-lg">sensors</span>
                    </div>
                    <div>
                      <h2 class="text-lg font-semibold text-text-light dark:text-text-dark">Configuração eWeLink</h2>
                      <p class="text-xs text-subtext-light dark:text-subtext-dark">Contas e dispositivos IoT</p>
                    </div>
                  </div>
                  <button @click="showEwelinkModal = false" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <span class="material-icons-outlined">close</span>
                  </button>
                </div>

                <!-- Body -->
                <div class="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
                  <!-- Status -->
                  <div class="flex items-center gap-2 text-sm">
                    <span class="w-2.5 h-2.5 rounded-full" :class="contaAtiva ? 'bg-green-500 animate-pulse' : contaErro ? 'bg-red-500' : 'bg-gray-400'"></span>
                    <span v-if="contaAtiva" class="text-text-light dark:text-text-dark">
                      Conectado <span class="text-subtext-light dark:text-subtext-dark">&middot; {{ contaAtiva.email }}</span>
                    </span>
                    <span v-else-if="contaErro" class="text-red-600 dark:text-red-400">
                      Erro de autenticação <span class="text-subtext-light dark:text-subtext-dark">&middot; {{ contaErro.email }}</span>
                    </span>
                    <span v-else class="text-subtext-light dark:text-subtext-dark">Nenhuma conta conectada</span>
                  </div>

                  <!-- Contas -->
                  <div v-if="contas.length > 0" class="space-y-2">
                    <div v-for="conta in contas" :key="conta.id" class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-lg flex items-center justify-center"
                          :class="conta.status === 'ativo' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'">
                          <span class="material-icons-outlined text-sm"
                            :class="conta.status === 'ativo' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
                            {{ conta.status === 'erro_auth' ? 'error' : 'cloud_done' }}
                          </span>
                        </div>
                        <div>
                          <p class="text-sm font-medium text-text-light dark:text-text-dark">{{ conta.nome }}</p>
                          <p class="text-xs text-subtext-light dark:text-subtext-dark">
                            {{ conta.email }} &middot; {{ (conta.regiao || 'us').toUpperCase() }}
                            <span v-if="conta.ultimo_sync"> &middot; Sync: {{ formatDate(conta.ultimo_sync) }}</span>
                          </p>
                        </div>
                      </div>
                      <button @click="handleDesconectar(conta)" class="p-1.5 text-subtext-light dark:text-subtext-dark hover:text-red-500 transition-colors" title="Desconectar">
                        <span class="material-icons-outlined text-lg">link_off</span>
                      </button>
                    </div>
                  </div>

                  <div v-else class="text-center py-4">
                    <span class="material-icons-outlined text-3xl text-gray-300 dark:text-gray-600 mb-1">cloud_off</span>
                    <p class="text-xs text-subtext-light dark:text-subtext-dark">Nenhuma conta eWeLink conectada</p>
                  </div>
                </div>

                <!-- Footer -->
                <div class="border-t border-border-light dark:border-border-dark px-6 py-4 flex items-center justify-between">
                  <button @click="handleConectar" class="btn btn-primary text-xs" :disabled="conectando">
                    <span v-if="conectando" class="material-icons-outlined animate-spin text-sm mr-1">refresh</span>
                    <span v-else class="material-icons-outlined text-sm mr-1">add</span>
                    {{ conectando ? 'Redirecionando...' : 'Conectar Conta' }}
                  </button>
                  <div class="flex items-center gap-2">
                    <button v-if="contas.length > 0" @click="handleSincronizar" class="btn btn-secondary text-xs" :disabled="sincronizando">
                      <span class="material-icons-outlined text-sm mr-1" :class="{ 'animate-spin': sincronizando }">sync</span>
                      {{ sincronizando ? 'Sincronizando...' : 'Sincronizar' }}
                    </button>
                    <button @click="showEwelinkModal = false" class="btn btn-secondary">Fechar</button>
                  </div>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ======================= -->
    <!-- MODAL FAZENDA (CRUD)    -->
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
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                        Código <span class="text-red-500">*</span>
                      </label>
                      <input type="text" v-model="form.codigo"
                        :class="['input', formAttempted && !form.codigo ? 'border-red-500 dark:border-red-500' : '']"
                        placeholder="Ex: CAMP" maxlength="10" />
                      <span v-if="formAttempted && !form.codigo" class="text-xs text-red-500 mt-1">Campo obrigatório</span>
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                        Nome <span class="text-red-500">*</span>
                      </label>
                      <input type="text" v-model="form.nome"
                        :class="['input', formAttempted && !form.nome ? 'border-red-500 dark:border-red-500' : '']"
                        placeholder="Ex: Campinas" />
                      <span v-if="formAttempted && !form.nome" class="text-xs text-red-500 mt-1">Campo obrigatório</span>
                    </div>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Unidades por bandeja</label>
                    <input type="number" v-model.number="form.unidades_por_bandeja" class="input" placeholder="Ex: 6" min="1" />
                  </div>

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

                  <div>
                    <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Capacidade</label>
                    <div class="input bg-gray-100 dark:bg-gray-700 cursor-not-allowed">{{ capacidadeCalculada }}</div>
                    <p class="text-xs text-subtext-light dark:text-subtext-dark mt-1">Calculado: Unidades × Andares × Bandejas/andar</p>
                  </div>
                </div>

                <!-- Footer -->
                <div class="border-t border-border-light dark:border-border-dark px-6 py-4 flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <button v-if="isEditing" @click="deleteFazenda" class="btn btn-secondary text-red-600 dark:text-red-400">
                      <span class="material-icons-outlined text-sm">delete</span> Excluir
                    </button>
                    <button v-if="isEditing" @click="toggleStatus"
                      :class="['btn btn-secondary text-sm', form.status === 'active' ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400']">
                      <span class="material-icons-outlined text-sm">{{ form.status === 'active' ? 'block' : 'check_circle' }}</span>
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
const supabase = useSupabaseClient()
const { currentCompany } = useCurrentCompany()
const { success, error: showError } = useToast()
const route = useRoute()
const router = useRouter()

// ===========================
// State
// ===========================
const loading = ref(false)
const saving = ref(false)
const fazendas = ref([])
const todosDispositivos = ref([])
const contas = ref([])
const selectedFazenda = ref(null)
const showEwelinkModal = ref(false)
const conectando = ref(false)
const sincronizando = ref(false)

// Modal CRUD
const showModal = ref(false)
const formAttempted = ref(false)
const getEmptyFazenda = () => ({
  id: null, codigo: '', nome: '',
  unidades_por_bandeja: 6, numero_andares: 1, bandejas_por_andar: 6,
  status: 'active'
})
const form = ref(getEmptyFazenda())
const isEditing = computed(() => !!form.value.id)
const capacidadeCalculada = computed(() => {
  const { unidades_por_bandeja, numero_andares, bandejas_por_andar } = form.value
  return (unidades_por_bandeja || 0) * (numero_andares || 0) * (bandejas_por_andar || 0)
})

// ===========================
// Computeds - Monitoring
// ===========================
const dispositivosPorFazenda = computed(() => {
  const map = {}
  todosDispositivos.value
    .filter(d => d.ativo && (d.tem_temperatura || d.tem_umidade))
    .forEach(d => {
      if (d.fazenda_id) {
        if (!map[d.fazenda_id]) map[d.fazenda_id] = []
        map[d.fazenda_id].push(d)
      }
    })
  return map
})

const fazendasAtivas = computed(() =>
  fazendas.value.filter(f => f.status === 'active')
)

const contaAtiva = computed(() => contas.value.find(c => c.status === 'ativo'))
const contaErro = computed(() => contas.value.find(c => c.status === 'erro_auth'))

// Daily stats per fazenda { [fazenda_id]: { minTemp, maxTemp, avgTemp, minHumid, maxHumid, avgHumid } }
const statsPorFazenda = ref({})


// ===========================
// Helpers
// ===========================
function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
  })
}

// ===========================
// Data Fetching
// ===========================
async function loadFazendas() {
  if (!currentCompany.value?.id) return
  loading.value = true
  try {
    const { data } = await supabase
      .from('fazendas').select('*')
      .eq('empresa_id', currentCompany.value.id)
      .order('nome')
    fazendas.value = data || []
  } finally {
    loading.value = false
  }
}

async function fetchDispositivos() {
  if (!currentCompany.value?.id) return
  const { data } = await supabase
    .from('dispositivos_iot').select('*')
    .eq('empresa_id', currentCompany.value.id)
    .order('nome')
  todosDispositivos.value = data || []
}

async function fetchDailyStats() {
  if (!currentCompany.value?.id) return
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).toISOString()
  const { data } = await supabase
    .from('leituras_sensores')
    .select('dispositivo_id, temperatura, umidade')
    .eq('empresa_id', currentCompany.value.id)
    .gte('registrado_em', startOfDay)
  if (!data || data.length === 0) { statsPorFazenda.value = {}; return }

  // Map dispositivo_id -> fazenda_id
  const devToFazenda = {}
  todosDispositivos.value.forEach(d => { if (d.fazenda_id) devToFazenda[d.id] = d.fazenda_id })

  // Aggregate per fazenda
  const agg = {}
  for (const l of data) {
    const fId = devToFazenda[l.dispositivo_id]
    if (!fId) continue
    if (!agg[fId]) agg[fId] = { temps: [], umids: [] }
    if (l.temperatura !== null && l.temperatura !== undefined) agg[fId].temps.push(Number(l.temperatura))
    if (l.umidade !== null && l.umidade !== undefined) agg[fId].umids.push(Number(l.umidade))
  }

  const result = {}
  for (const [fId, v] of Object.entries(agg)) {
    result[fId] = {
      minTemp: v.temps.length ? Math.min(...v.temps) : null,
      maxTemp: v.temps.length ? Math.max(...v.temps) : null,
      avgTemp: v.temps.length ? v.temps.reduce((a, b) => a + b, 0) / v.temps.length : null,
      minHumid: v.umids.length ? Math.min(...v.umids) : null,
      maxHumid: v.umids.length ? Math.max(...v.umids) : null,
      avgHumid: v.umids.length ? v.umids.reduce((a, b) => a + b, 0) / v.umids.length : null,
    }
  }
  statsPorFazenda.value = result
}

async function fetchContas() {
  if (!currentCompany.value?.id) return
  const { data } = await supabase
    .from('contas_ewelink').select('*')
    .eq('empresa_id', currentCompany.value.id)
    .neq('status', 'inativo')
    .order('created_at', { ascending: false })
  contas.value = data || []
}

// ===========================
// Slideover
// ===========================
function openSlideover(fazenda) {
  selectedFazenda.value = fazenda
}

function handleSlideoverUpdated() {
  fetchDispositivos()
}

// ===========================
// Modal CRUD
// ===========================
function openModal(fazenda) {
  formAttempted.value = false
  form.value = fazenda ? { ...getEmptyFazenda(), ...fazenda } : getEmptyFazenda()
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  formAttempted.value = false
}

async function saveOrUpdate() {
  if (isEditing.value) await updateFazenda()
  else await saveFazenda()
}

async function saveFazenda() {
  if (!currentCompany.value?.id) { showError('Nenhuma empresa selecionada'); return }
  formAttempted.value = true
  if (!form.value.codigo || !form.value.nome) { showError('Preencha todos os campos obrigatórios'); return }

  saving.value = true
  try {
    const andares = form.value.numero_andares || 1
    const bandejas = form.value.bandejas_por_andar || 6
    const { error } = await supabase.from('fazendas').insert({
      empresa_id: currentCompany.value.id,
      codigo: form.value.codigo, nome: form.value.nome,
      unidades_por_bandeja: form.value.unidades_por_bandeja || 6,
      numero_andares: andares, bandejas_por_andar: bandejas,
      capacidade_bandejas: andares * bandejas, status: 'active'
    })
    if (error) throw error
    success('Fazenda criada com sucesso')
    closeModal()
    await loadFazendas()
  } catch (e) {
    showError(e.message || 'Erro ao criar fazenda')
  } finally {
    saving.value = false
  }
}

async function updateFazenda() {
  formAttempted.value = true
  if (!form.value.codigo || !form.value.nome) { showError('Preencha todos os campos obrigatórios'); return }

  saving.value = true
  try {
    const andares = form.value.numero_andares || 1
    const bandejas = form.value.bandejas_por_andar || 1
    const { error } = await supabase.from('fazendas').update({
      codigo: form.value.codigo, nome: form.value.nome,
      unidades_por_bandeja: form.value.unidades_por_bandeja,
      numero_andares: form.value.numero_andares, bandejas_por_andar: form.value.bandejas_por_andar,
      capacidade_bandejas: andares * bandejas, status: form.value.status
    }).eq('id', form.value.id)
    if (error) throw error
    success('Fazenda atualizada com sucesso')
    closeModal()
    await loadFazendas()
  } catch (e) {
    showError(e.message || 'Erro ao atualizar fazenda')
  } finally {
    saving.value = false
  }
}

async function toggleStatus() {
  if (!form.value.id) return
  const newStatus = form.value.status === 'active' ? 'inactive' : 'active'
  if (!confirm(`Tem certeza que deseja ${newStatus === 'active' ? 'ativar' : 'desativar'} esta fazenda?`)) return
  saving.value = true
  try {
    const { error } = await supabase.from('fazendas').update({ status: newStatus }).eq('id', form.value.id)
    if (error) throw error
    success(`Fazenda ${newStatus === 'active' ? 'ativada' : 'desativada'} com sucesso`)
    closeModal()
    await loadFazendas()
  } catch (e) {
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
    const { error } = await supabase.from('fazendas').delete().eq('id', form.value.id)
    if (error) throw error
    success('Fazenda excluída com sucesso')
    closeModal()
    await loadFazendas()
  } catch (e) {
    showError(e.message || 'Erro ao excluir fazenda')
  } finally {
    saving.value = false
  }
}

// ===========================
// eWeLink Actions
// ===========================
async function handleSincronizar() {
  const contasAtivas = contas.value.filter(c => c.status === 'ativo')
  if (contasAtivas.length === 0) { showError('Nenhuma conta eWeLink ativa'); return }
  sincronizando.value = true
  try {
    let totalNovos = 0, totalAtualizados = 0
    for (const conta of contasAtivas) {
      const result = await $fetch('/api/ewelink/sincronizar-dispositivos', {
        method: 'POST', body: { conta_ewelink_id: conta.id, empresa_id: currentCompany.value.id }
      })
      if (result.success) { totalNovos += result.novos || 0; totalAtualizados += result.atualizados || 0 }
    }
    success(`Sincronizado! ${totalNovos} novos, ${totalAtualizados} atualizados`)
    fetchDispositivos()
    fetchContas()
  } catch (e) {
    showError('Erro ao sincronizar dispositivos')
  } finally {
    sincronizando.value = false
  }
}

async function handleConectar() {
  if (!currentCompany.value?.id) { showError('Empresa não selecionada'); return }
  conectando.value = true
  try {
    const array = new Uint8Array(16)
    crypto.getRandomValues(array)
    const state = 'ew_' + Array.from(array, b => b.toString(16).padStart(2, '0')).join('')
    localStorage.setItem('ewelink_oauth_state', state)
    localStorage.setItem('ewelink_oauth_data', JSON.stringify({
      empresa_id: currentCompany.value.id, regiao: 'us', nome: 'Conta eWeLink',
    }))
    const result = await $fetch('/api/ewelink/oauth-url', { method: 'POST', body: { regiao: 'us', state } })
    if (result.url) { window.location.href = result.url }
    else { showError('Erro ao gerar URL de autorização'); conectando.value = false }
  } catch (e) {
    conectando.value = false
    showError('Erro ao comunicar com o servidor')
  }
}

async function handleDesconectar(conta) {
  if (!confirm(`Desconectar a conta "${conta.nome}"? Os dispositivos serão desativados.`)) return
  try {
    const result = await $fetch('/api/ewelink/desconectar', {
      method: 'POST', body: { conta_ewelink_id: conta.id, empresa_id: currentCompany.value.id }
    })
    if (result.success) { success('Conta desconectada'); fetchContas(); fetchDispositivos() }
  } catch (e) {
    showError('Erro ao desconectar conta')
  }
}

// ===========================
// OAuth callback
// ===========================
onMounted(() => {
  if (route.query.ewelink_connected === 'true') {
    success('Conta eWeLink conectada com sucesso!')
    fetchContas()
    fetchDispositivos()
    router.replace({ path: '/fazendas' })
  }
  if (route.query.ewelink_error) {
    showError(decodeURIComponent(route.query.ewelink_error))
    router.replace({ path: '/fazendas' })
  }
})

// ===========================
// Auto-refresh dispositivos a cada 10s
// ===========================
let refreshInterval = null

onMounted(() => {
  refreshInterval = setInterval(() => {
    if (currentCompany.value?.id) {
      fetchDispositivos()
      fetchDailyStats()
    }
  }, 10000)
})

onBeforeUnmount(() => {
  if (refreshInterval) clearInterval(refreshInterval)
})

// ===========================
// Watchers
// ===========================
watch(() => currentCompany.value?.id, () => {
  loadFazendas()
  fetchDispositivos()
  fetchContas()
  fetchDailyStats()
}, { immediate: true })
</script>
