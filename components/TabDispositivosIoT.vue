<template>
  <div class="space-y-4">
    <!-- Toolbar -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center gap-3">
      <div class="relative flex-1 w-full sm:max-w-sm">
        <span class="material-icons-outlined absolute left-3 top-1/2 -translate-y-1/2 text-subtext-light dark:text-subtext-dark text-lg">search</span>
        <input
          v-model="busca"
          type="text"
          class="input pl-10"
          placeholder="Buscar dispositivos..."
        />
      </div>

      <div class="flex items-center gap-2">
        <select v-model="filtroStatus" class="input w-auto">
          <option value="todos">Todos</option>
          <option value="online">Online</option>
          <option value="offline">Offline</option>
        </select>

        <button @click="handleSincronizar" class="btn btn-secondary" :disabled="sincronizando">
          <span class="material-icons-outlined text-base mr-1" :class="{ 'animate-spin': sincronizando }">sync</span>
          {{ sincronizando ? 'Sincronizando...' : 'Sincronizar' }}
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="card p-8 text-center">
      <span class="material-icons-outlined animate-spin text-2xl text-subtext-light dark:text-subtext-dark">refresh</span>
    </div>

    <!-- Empty state -->
    <div v-else-if="dispositivosFiltrados.length === 0" class="card p-8 text-center">
      <span class="material-icons-outlined text-4xl text-gray-300 dark:text-gray-600 mb-2">sensors_off</span>
      <p class="text-sm text-subtext-light dark:text-subtext-dark">
        {{ busca || filtroStatus !== 'todos' ? 'Nenhum dispositivo encontrado com esses filtros' : 'Nenhum dispositivo sincronizado' }}
      </p>
      <p v-if="!busca && filtroStatus === 'todos'" class="text-xs text-subtext-light/70 dark:text-subtext-dark/70 mt-1">
        Conecte uma conta eWeLink na aba Configuração e sincronize
      </p>
    </div>

    <!-- Tabela -->
    <div v-else class="card overflow-x-auto">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-gray-100 dark:bg-gray-700/50 border-b border-border-light dark:border-border-dark">
            <th class="table-header">Nome</th>
            <th class="table-header">Modelo</th>
            <th class="table-header">Fazenda</th>
            <th class="table-header text-center">Temp</th>
            <th class="table-header text-center">Umidade</th>
            <th class="table-header text-center">Status</th>
            <th class="table-header">Última Leitura</th>
            <th class="table-header text-center">Ações</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border-light dark:divide-border-dark">
          <tr
            v-for="d in dispositivosFiltrados"
            :key="d.id"
            class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          >
            <!-- Nome -->
            <td class="table-cell">
              <div>
                <p class="font-medium text-text-light dark:text-text-dark">{{ d.nome_personalizado || d.nome }}</p>
                <p v-if="d.nome_personalizado" class="text-xs text-subtext-light/70 dark:text-subtext-dark/70">{{ d.nome }}</p>
              </div>
            </td>

            <!-- Modelo -->
            <td class="table-cell">
              <span class="text-subtext-light dark:text-subtext-dark">{{ d.modelo || '-' }}</span>
            </td>

            <!-- Fazenda -->
            <td class="table-cell">
              <select
                :value="d.fazenda_id || ''"
                @change="handleMapearFazenda(d, $event.target.value)"
                class="input py-1 text-xs w-36"
              >
                <option value="">Sem fazenda</option>
                <option v-for="f in fazendas" :key="f.id" :value="f.id">{{ f.nome }}</option>
              </select>
            </td>

            <!-- Temperatura -->
            <td class="table-cell text-center">
              <span v-if="d.tem_temperatura && d.temperatura_atual !== null" class="font-medium text-text-light dark:text-text-dark">
                {{ Number(d.temperatura_atual).toFixed(1) }}°C
              </span>
              <span v-else class="text-subtext-light/50 dark:text-subtext-dark/50">-</span>
            </td>

            <!-- Umidade -->
            <td class="table-cell text-center">
              <span v-if="d.tem_umidade && d.umidade_atual !== null" class="font-medium text-text-light dark:text-text-dark">
                {{ Number(d.umidade_atual).toFixed(0) }}%
              </span>
              <span v-else class="text-subtext-light/50 dark:text-subtext-dark/50">-</span>
            </td>

            <!-- Status -->
            <td class="table-cell text-center">
              <span
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                :class="d.online
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'"
              >
                <span class="w-1.5 h-1.5 rounded-full" :class="d.online ? 'bg-green-500' : 'bg-gray-400'"></span>
                {{ d.online ? 'Online' : 'Offline' }}
              </span>
            </td>

            <!-- Última Leitura -->
            <td class="table-cell">
              <span class="text-xs text-subtext-light dark:text-subtext-dark">
                {{ d.ultima_leitura ? formatDate(d.ultima_leitura) : '-' }}
              </span>
            </td>

            <!-- Ações -->
            <td class="table-cell text-center">
              <div class="flex items-center justify-center gap-1">
                <button
                  @click="handleEditarNome(d)"
                  class="p-1 text-subtext-light dark:text-subtext-dark hover:text-primary transition-colors"
                  title="Editar nome"
                >
                  <span class="material-icons-outlined text-lg">edit</span>
                </button>
                <button
                  @click="handleToggleAtivo(d)"
                  class="p-1 transition-colors"
                  :class="d.ativo
                    ? 'text-subtext-light dark:text-subtext-dark hover:text-red-500'
                    : 'text-red-400 hover:text-green-500'"
                  :title="d.ativo ? 'Desativar' : 'Ativar'"
                >
                  <span class="material-icons-outlined text-lg">{{ d.ativo ? 'visibility' : 'visibility_off' }}</span>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
const supabase = useSupabaseClient()
const { currentCompany } = useCurrentCompany()
const { success, error: showError } = useToast()

const loading = ref(false)
const sincronizando = ref(false)
const busca = ref('')
const filtroStatus = ref('todos')
const dispositivos = ref([])
const fazendas = ref([])

const dispositivosFiltrados = computed(() => {
  let filtered = dispositivos.value

  if (busca.value) {
    const q = busca.value.toLowerCase()
    filtered = filtered.filter(d =>
      (d.nome || '').toLowerCase().includes(q) ||
      (d.nome_personalizado || '').toLowerCase().includes(q) ||
      (d.modelo || '').toLowerCase().includes(q)
    )
  }

  if (filtroStatus.value === 'online') {
    filtered = filtered.filter(d => d.online)
  } else if (filtroStatus.value === 'offline') {
    filtered = filtered.filter(d => !d.online)
  }

  return filtered
})

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit'
  })
}

async function fetchDispositivos() {
  if (!currentCompany.value?.id) return
  loading.value = true
  try {
    const { data } = await supabase
      .from('dispositivos_iot')
      .select('*')
      .eq('empresa_id', currentCompany.value.id)
      .order('nome')
    dispositivos.value = data || []
  } finally {
    loading.value = false
  }
}

async function fetchFazendas() {
  if (!currentCompany.value?.id) return
  const { data } = await supabase
    .from('fazendas')
    .select('id, nome')
    .eq('empresa_id', currentCompany.value.id)
    .order('nome')
  fazendas.value = data || []
}

async function handleSincronizar() {
  if (!currentCompany.value?.id) return

  // Buscar contas ativas
  const { data: contas } = await supabase
    .from('contas_ewelink')
    .select('id')
    .eq('empresa_id', currentCompany.value.id)
    .eq('status', 'ativo')

  if (!contas || contas.length === 0) {
    showError('Nenhuma conta eWeLink ativa. Conecte uma conta na aba Configuração.')
    return
  }

  sincronizando.value = true
  try {
    let totalNovos = 0
    let totalAtualizados = 0

    const erros = []

    for (const conta of contas) {
      const result = await $fetch('/api/ewelink/sincronizar-dispositivos', {
        method: 'POST',
        body: {
          conta_ewelink_id: conta.id,
          empresa_id: currentCompany.value.id,
        }
      })

      if (result.success) {
        totalNovos += result.novos || 0
        totalAtualizados += result.atualizados || 0
      } else {
        erros.push(result.error || 'Erro desconhecido')
      }
    }

    if (erros.length > 0) {
      showError(erros.join('; '))
    } else {
      success(`Sincronizado! ${totalNovos} novos, ${totalAtualizados} atualizados`)
    }
    fetchDispositivos()
  } catch (e) {
    showError('Erro ao sincronizar dispositivos')
  } finally {
    sincronizando.value = false
  }
}

async function handleMapearFazenda(dispositivo, fazendaId) {
  const { error } = await supabase
    .from('dispositivos_iot')
    .update({ fazenda_id: fazendaId || null })
    .eq('id', dispositivo.id)

  if (error) {
    showError('Erro ao mapear fazenda')
  } else {
    dispositivo.fazenda_id = fazendaId || null
    success('Fazenda atualizada')
  }
}

async function handleEditarNome(dispositivo) {
  const novoNome = prompt('Nome personalizado:', dispositivo.nome_personalizado || dispositivo.nome)
  if (novoNome === null) return

  const { error } = await supabase
    .from('dispositivos_iot')
    .update({ nome_personalizado: novoNome || null })
    .eq('id', dispositivo.id)

  if (error) {
    showError('Erro ao atualizar nome')
  } else {
    dispositivo.nome_personalizado = novoNome || null
    success('Nome atualizado')
  }
}

async function handleToggleAtivo(dispositivo) {
  const novoStatus = !dispositivo.ativo
  const { error } = await supabase
    .from('dispositivos_iot')
    .update({ ativo: novoStatus })
    .eq('id', dispositivo.id)

  if (error) {
    showError('Erro ao alterar status')
  } else {
    dispositivo.ativo = novoStatus
    success(novoStatus ? 'Dispositivo ativado' : 'Dispositivo desativado')
  }
}

watch(() => currentCompany.value?.id, () => {
  fetchDispositivos()
  fetchFazendas()
}, { immediate: true })
</script>
