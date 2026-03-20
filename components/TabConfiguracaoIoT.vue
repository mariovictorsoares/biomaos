<template>
  <div class="space-y-8">
    <!-- Seção: Contas eWeLink -->
    <div>
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-base font-semibold text-text-light dark:text-text-dark">Contas eWeLink</h2>
        <button @click="showModal = true" class="btn btn-primary">
          <span class="material-icons-outlined text-base mr-1">add</span>
          Conectar Conta
        </button>
      </div>

      <!-- Loading -->
      <div v-if="loadingContas" class="card p-8 text-center">
        <span class="material-icons-outlined animate-spin text-2xl text-subtext-light dark:text-subtext-dark">refresh</span>
        <p class="text-sm text-subtext-light dark:text-subtext-dark mt-2">Carregando contas...</p>
      </div>

      <!-- Empty state -->
      <div v-else-if="contas.length === 0" class="card p-8 text-center">
        <span class="material-icons-outlined text-4xl text-gray-300 dark:text-gray-600 mb-2">cloud_off</span>
        <p class="text-sm text-subtext-light dark:text-subtext-dark">Nenhuma conta eWeLink conectada</p>
        <p class="text-xs text-subtext-light/70 dark:text-subtext-dark/70 mt-1">Conecte sua conta para começar a monitorar dispositivos</p>
      </div>

      <!-- Lista de contas -->
      <div v-else class="space-y-3">
        <div
          v-for="conta in contas"
          :key="conta.id"
          class="card p-4 flex items-center justify-between"
        >
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 rounded-lg flex items-center justify-center"
              :class="conta.status === 'ativo'
                ? 'bg-green-100 dark:bg-green-900/30'
                : conta.status === 'erro_auth'
                  ? 'bg-red-100 dark:bg-red-900/30'
                  : 'bg-gray-100 dark:bg-gray-700'"
            >
              <span class="material-icons-outlined"
                :class="conta.status === 'ativo'
                  ? 'text-green-600 dark:text-green-400'
                  : conta.status === 'erro_auth'
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-gray-400 dark:text-gray-500'"
              >
                {{ conta.status === 'erro_auth' ? 'error' : 'cloud_done' }}
              </span>
            </div>
            <div>
              <p class="text-sm font-medium text-text-light dark:text-text-dark">{{ conta.nome }}</p>
              <p class="text-xs text-subtext-light dark:text-subtext-dark">
                {{ conta.email }} &middot; Região: {{ (conta.regiao || 'us').toUpperCase() }}
              </p>
              <p v-if="conta.ultimo_sync" class="text-xs text-subtext-light/70 dark:text-subtext-dark/70 mt-0.5">
                Último sync: {{ formatDate(conta.ultimo_sync) }}
              </p>
              <p v-if="conta.status === 'erro_auth'" class="text-xs text-red-500 mt-0.5">
                {{ conta.erro_mensagem || 'Erro de autenticação' }}
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <span
              class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
              :class="conta.status === 'ativo'
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : conta.status === 'erro_auth'
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'"
            >
              {{ conta.status === 'ativo' ? 'Ativo' : conta.status === 'erro_auth' ? 'Erro' : 'Inativo' }}
            </span>
            <button
              @click="handleDesconectar(conta)"
              class="p-1.5 text-subtext-light dark:text-subtext-dark hover:text-red-500 dark:hover:text-red-400 transition-colors"
              title="Desconectar"
            >
              <span class="material-icons-outlined text-lg">link_off</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Seção: Configuração de Alertas -->
    <div>
      <h2 class="text-base font-semibold text-text-light dark:text-text-dark mb-4">Configuração de Alertas</h2>

      <!-- Sem dispositivos -->
      <div v-if="dispositivos.length === 0" class="card p-8 text-center">
        <span class="material-icons-outlined text-4xl text-gray-300 dark:text-gray-600 mb-2">sensors_off</span>
        <p class="text-sm text-subtext-light dark:text-subtext-dark">Nenhum dispositivo com sensores encontrado</p>
        <p class="text-xs text-subtext-light/70 dark:text-subtext-dark/70 mt-1">Sincronize os dispositivos da sua conta eWeLink primeiro</p>
      </div>

      <!-- Seletor de dispositivo + config -->
      <div v-else class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Dispositivo</label>
          <select v-model="selectedDeviceId" class="input max-w-md">
            <option value="">Selecione um dispositivo...</option>
            <option v-for="d in dispositivos" :key="d.id" :value="d.id">
              {{ d.nome_personalizado || d.nome }} ({{ d.modelo || 'Sensor' }})
            </option>
          </select>
        </div>

        <!-- Formulário de alertas -->
        <div v-if="selectedDeviceId" class="card p-5 space-y-6">
          <div v-if="selectedDevice?.tem_temperatura" class="space-y-3">
            <div class="flex items-center gap-2">
              <span class="material-icons-outlined text-red-500 text-lg">thermostat</span>
              <h3 class="text-sm font-medium text-text-light dark:text-text-dark">Temperatura (°C)</h3>
              <label class="ml-auto flex items-center gap-2 cursor-pointer">
                <span class="text-xs text-subtext-light dark:text-subtext-dark">Ativo</span>
                <input type="checkbox" v-model="alertaTemp.ativo" class="rounded border-gray-300 text-primary focus:ring-primary" />
              </label>
            </div>
            <div class="grid grid-cols-3 gap-4">
              <div>
                <label class="block text-xs text-subtext-light dark:text-subtext-dark mb-1">Mínimo</label>
                <input v-model.number="alertaTemp.limite_min" type="number" step="0.5" class="input" placeholder="Ex: 18" />
              </div>
              <div>
                <label class="block text-xs text-subtext-light dark:text-subtext-dark mb-1">Máximo</label>
                <input v-model.number="alertaTemp.limite_max" type="number" step="0.5" class="input" placeholder="Ex: 28" />
              </div>
              <div>
                <label class="block text-xs text-subtext-light dark:text-subtext-dark mb-1">Cooldown (min)</label>
                <input v-model.number="alertaTemp.cooldown_minutos" type="number" class="input" placeholder="30" />
              </div>
            </div>
          </div>

          <div v-if="selectedDevice?.tem_umidade" class="space-y-3">
            <div class="flex items-center gap-2">
              <span class="material-icons-outlined text-blue-500 text-lg">water_drop</span>
              <h3 class="text-sm font-medium text-text-light dark:text-text-dark">Umidade (%)</h3>
              <label class="ml-auto flex items-center gap-2 cursor-pointer">
                <span class="text-xs text-subtext-light dark:text-subtext-dark">Ativo</span>
                <input type="checkbox" v-model="alertaUmid.ativo" class="rounded border-gray-300 text-primary focus:ring-primary" />
              </label>
            </div>
            <div class="grid grid-cols-3 gap-4">
              <div>
                <label class="block text-xs text-subtext-light dark:text-subtext-dark mb-1">Mínimo</label>
                <input v-model.number="alertaUmid.limite_min" type="number" step="1" class="input" placeholder="Ex: 50" />
              </div>
              <div>
                <label class="block text-xs text-subtext-light dark:text-subtext-dark mb-1">Máximo</label>
                <input v-model.number="alertaUmid.limite_max" type="number" step="1" class="input" placeholder="Ex: 85" />
              </div>
              <div>
                <label class="block text-xs text-subtext-light dark:text-subtext-dark mb-1">Cooldown (min)</label>
                <input v-model.number="alertaUmid.cooldown_minutos" type="number" class="input" placeholder="30" />
              </div>
            </div>
          </div>

          <div class="flex justify-end">
            <button @click="handleSalvarAlertas" class="btn btn-primary" :disabled="salvandoAlertas">
              {{ salvandoAlertas ? 'Salvando...' : 'Salvar Alertas' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <ModalConectarEwelink
      v-if="showModal && currentCompany?.id"
      :empresa-id="currentCompany.id"
      @close="showModal = false"
    />
  </div>
</template>

<script setup>
const supabase = useSupabaseClient()
const { currentCompany } = useCurrentCompany()
const { success, error: showError } = useToast()

const showModal = ref(false)
const loadingContas = ref(false)
const contas = ref([])
const dispositivos = ref([])
const selectedDeviceId = ref('')
const salvandoAlertas = ref(false)

const alertaTemp = ref({ ativo: true, limite_min: null, limite_max: null, cooldown_minutos: 30 })
const alertaUmid = ref({ ativo: true, limite_min: null, limite_max: null, cooldown_minutos: 30 })

const selectedDevice = computed(() =>
  dispositivos.value.find(d => d.id === selectedDeviceId.value)
)

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

async function fetchContas() {
  if (!currentCompany.value?.id) return
  loadingContas.value = true
  try {
    const { data } = await supabase
      .from('contas_ewelink')
      .select('*')
      .eq('empresa_id', currentCompany.value.id)
      .neq('status', 'inativo')
      .order('created_at', { ascending: false })
    contas.value = data || []
  } finally {
    loadingContas.value = false
  }
}

async function fetchDispositivos() {
  if (!currentCompany.value?.id) return
  const { data } = await supabase
    .from('dispositivos_iot')
    .select('*')
    .eq('empresa_id', currentCompany.value.id)
    .eq('ativo', true)
    .or('tem_temperatura.eq.true,tem_umidade.eq.true')
    .order('nome')
  dispositivos.value = data || []
}

async function fetchAlertasConfig() {
  if (!selectedDeviceId.value) return
  const { data } = await supabase
    .from('alertas_config_iot')
    .select('*')
    .eq('dispositivo_id', selectedDeviceId.value)

  const tempConfig = data?.find(a => a.tipo === 'temperatura')
  const umidConfig = data?.find(a => a.tipo === 'umidade')

  if (tempConfig) {
    alertaTemp.value = {
      ativo: tempConfig.ativo,
      limite_min: tempConfig.limite_min,
      limite_max: tempConfig.limite_max,
      cooldown_minutos: tempConfig.cooldown_minutos || 30,
    }
  } else {
    alertaTemp.value = { ativo: true, limite_min: null, limite_max: null, cooldown_minutos: 30 }
  }

  if (umidConfig) {
    alertaUmid.value = {
      ativo: umidConfig.ativo,
      limite_min: umidConfig.limite_min,
      limite_max: umidConfig.limite_max,
      cooldown_minutos: umidConfig.cooldown_minutos || 30,
    }
  } else {
    alertaUmid.value = { ativo: true, limite_min: null, limite_max: null, cooldown_minutos: 30 }
  }
}

async function handleDesconectar(conta) {
  if (!confirm(`Desconectar a conta "${conta.nome}"? Os dispositivos serão desativados.`)) return

  try {
    const result = await $fetch('/api/ewelink/desconectar', {
      method: 'POST',
      body: {
        conta_ewelink_id: conta.id,
        empresa_id: currentCompany.value.id,
      }
    })

    if (result.success) {
      success('Conta desconectada')
      fetchContas()
      fetchDispositivos()
    }
  } catch (e) {
    showError('Erro ao desconectar conta')
  }
}

async function handleSalvarAlertas() {
  salvandoAlertas.value = true
  try {
    const alertas = []

    if (selectedDevice.value?.tem_temperatura) {
      alertas.push({ tipo: 'temperatura', ...alertaTemp.value })
    }
    if (selectedDevice.value?.tem_umidade) {
      alertas.push({ tipo: 'umidade', ...alertaUmid.value })
    }

    const result = await $fetch('/api/ewelink/salvar-alertas', {
      method: 'POST',
      body: {
        empresa_id: currentCompany.value.id,
        dispositivo_id: selectedDeviceId.value,
        alertas,
      }
    })

    if (result.success) {
      success('Alertas salvos com sucesso!')
    }
  } catch (e) {
    showError('Erro ao salvar alertas')
  } finally {
    salvandoAlertas.value = false
  }
}

// Detectar callback do OAuth eWeLink
const route = useRoute()
const router = useRouter()

onMounted(() => {
  if (route.query.ewelink_connected === 'true') {
    success('Conta eWeLink conectada com sucesso!')
    fetchContas()
    fetchDispositivos()
    router.replace({ query: { tab: 'configuracao' } })
  }
  if (route.query.ewelink_error) {
    showError(decodeURIComponent(route.query.ewelink_error))
    router.replace({ query: { tab: 'configuracao' } })
  }
})

watch(selectedDeviceId, () => {
  if (selectedDeviceId.value) fetchAlertasConfig()
})

watch(() => currentCompany.value?.id, () => {
  fetchContas()
  fetchDispositivos()
}, { immediate: true })
</script>
