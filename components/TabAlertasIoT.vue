<template>
  <div class="space-y-6">
    <!-- Cards resumo -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="card p-4">
        <div class="flex items-center gap-3 mb-2">
          <div class="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
            <span class="material-icons-outlined text-amber-600 dark:text-amber-400 text-lg">notifications_active</span>
          </div>
          <span class="text-sm text-subtext-light dark:text-subtext-dark">Não Lidos</span>
        </div>
        <p class="text-2xl font-semibold text-text-light dark:text-text-dark">{{ resumo.naoLidos }}</p>
      </div>

      <div class="card p-4">
        <div class="flex items-center gap-3 mb-2">
          <div class="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
            <span class="material-icons-outlined text-red-500 text-lg">thermostat</span>
          </div>
          <span class="text-sm text-subtext-light dark:text-subtext-dark">Temperatura</span>
        </div>
        <p class="text-2xl font-semibold text-text-light dark:text-text-dark">{{ resumo.temperatura }}</p>
      </div>

      <div class="card p-4">
        <div class="flex items-center gap-3 mb-2">
          <div class="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
            <span class="material-icons-outlined text-blue-500 text-lg">water_drop</span>
          </div>
          <span class="text-sm text-subtext-light dark:text-subtext-dark">Umidade</span>
        </div>
        <p class="text-2xl font-semibold text-text-light dark:text-text-dark">{{ resumo.umidade }}</p>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center gap-3">
      <select v-model="filtroTipo" class="input w-auto">
        <option value="todos">Todos os tipos</option>
        <option value="temperatura">Temperatura</option>
        <option value="umidade">Umidade</option>
      </select>

      <select v-model="filtroLido" class="input w-auto">
        <option value="todos">Todos</option>
        <option value="nao_lido">Não lidos</option>
        <option value="lido">Lidos</option>
      </select>

      <button
        v-if="alertasSelecionados.length > 0"
        @click="handleMarcarLidoLote"
        class="btn btn-secondary ml-auto"
      >
        <span class="material-icons-outlined text-base mr-1">done_all</span>
        Marcar {{ alertasSelecionados.length }} como lido(s)
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="card p-8 text-center">
      <span class="material-icons-outlined animate-spin text-2xl text-subtext-light dark:text-subtext-dark">refresh</span>
    </div>

    <!-- Empty state -->
    <div v-else-if="alertasFiltrados.length === 0" class="card p-8 text-center">
      <span class="material-icons-outlined text-4xl text-gray-300 dark:text-gray-600 mb-2">notifications_none</span>
      <p class="text-sm text-subtext-light dark:text-subtext-dark">Nenhum alerta encontrado</p>
    </div>

    <!-- Tabela -->
    <div v-else class="card overflow-x-auto">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-gray-100 dark:bg-gray-700/50 border-b border-border-light dark:border-border-dark">
            <th class="table-header w-8">
              <input
                type="checkbox"
                :checked="todosChecked"
                @change="toggleTodos"
                class="rounded border-gray-300 text-primary focus:ring-primary"
              />
            </th>
            <th class="table-header">Data/Hora</th>
            <th class="table-header">Dispositivo</th>
            <th class="table-header">Tipo</th>
            <th class="table-header text-center">Valor</th>
            <th class="table-header text-center">Limite</th>
            <th class="table-header text-center">Status</th>
            <th class="table-header text-center">Ação</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border-light dark:divide-border-dark">
          <tr
            v-for="a in alertasFiltrados"
            :key="a.id"
            class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            :class="!a.lido ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''"
          >
            <td class="table-cell">
              <input
                type="checkbox"
                :checked="alertasSelecionados.includes(a.id)"
                @change="toggleAlerta(a.id)"
                class="rounded border-gray-300 text-primary focus:ring-primary"
              />
            </td>

            <td class="table-cell">
              <span class="text-xs">{{ formatDate(a.registrado_em) }}</span>
            </td>

            <td class="table-cell">
              <span class="text-sm text-text-light dark:text-text-dark">
                {{ deviceNames[a.dispositivo_id] || 'Desconhecido' }}
              </span>
            </td>

            <td class="table-cell">
              <span class="inline-flex items-center gap-1 text-xs">
                <span class="material-icons-outlined text-sm"
                  :class="a.tipo === 'temperatura' ? 'text-red-500' : 'text-blue-500'"
                >
                  {{ a.tipo === 'temperatura' ? 'thermostat' : 'water_drop' }}
                </span>
                {{ a.tipo === 'temperatura' ? 'Temp.' : 'Umid.' }}
              </span>
            </td>

            <td class="table-cell text-center">
              <span class="font-medium text-text-light dark:text-text-dark">
                {{ Number(a.valor_lido).toFixed(1) }}{{ a.tipo === 'temperatura' ? '°C' : '%' }}
              </span>
            </td>

            <td class="table-cell text-center">
              <span class="text-xs"
                :class="a.limite_violado === 'min'
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-red-600 dark:text-red-400'"
              >
                {{ a.limite_violado === 'min' ? '↓' : '↑' }}
                {{ Number(a.limite_valor).toFixed(1) }}{{ a.tipo === 'temperatura' ? '°C' : '%' }}
              </span>
            </td>

            <td class="table-cell text-center">
              <span
                class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                :class="!a.lido
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'"
              >
                {{ a.lido ? 'Lido' : 'Novo' }}
              </span>
            </td>

            <td class="table-cell text-center">
              <button
                v-if="!a.lido"
                @click="handleMarcarLido(a)"
                class="p-1 text-subtext-light dark:text-subtext-dark hover:text-primary transition-colors"
                title="Marcar como lido"
              >
                <span class="material-icons-outlined text-lg">check</span>
              </button>
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
const { success } = useToast()

const loading = ref(false)
const alertas = ref([])
const dispositivos = ref([])
const filtroTipo = ref('todos')
const filtroLido = ref('todos')
const alertasSelecionados = ref([])

const deviceNames = computed(() => {
  const map = {}
  dispositivos.value.forEach(d => {
    map[d.id] = d.nome_personalizado || d.nome
  })
  return map
})

const resumo = computed(() => {
  const naoLidos = alertas.value.filter(a => !a.lido).length
  const temperatura = alertas.value.filter(a => a.tipo === 'temperatura' && !a.lido).length
  const umidade = alertas.value.filter(a => a.tipo === 'umidade' && !a.lido).length
  return { naoLidos, temperatura, umidade }
})

const alertasFiltrados = computed(() => {
  let filtered = alertas.value

  if (filtroTipo.value !== 'todos') {
    filtered = filtered.filter(a => a.tipo === filtroTipo.value)
  }

  if (filtroLido.value === 'nao_lido') {
    filtered = filtered.filter(a => !a.lido)
  } else if (filtroLido.value === 'lido') {
    filtered = filtered.filter(a => a.lido)
  }

  return filtered
})

const todosChecked = computed(() =>
  alertasFiltrados.value.length > 0 &&
  alertasFiltrados.value.every(a => alertasSelecionados.value.includes(a.id))
)

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

function toggleAlerta(id) {
  const idx = alertasSelecionados.value.indexOf(id)
  if (idx >= 0) {
    alertasSelecionados.value.splice(idx, 1)
  } else {
    alertasSelecionados.value.push(id)
  }
}

function toggleTodos() {
  if (todosChecked.value) {
    alertasSelecionados.value = []
  } else {
    alertasSelecionados.value = alertasFiltrados.value.map(a => a.id)
  }
}

async function fetchAlertas() {
  if (!currentCompany.value?.id) return
  loading.value = true
  try {
    const { data } = await supabase
      .from('alertas_historico_iot')
      .select('*')
      .eq('empresa_id', currentCompany.value.id)
      .order('registrado_em', { ascending: false })
      .limit(200)
    alertas.value = data || []
  } finally {
    loading.value = false
  }
}

async function fetchDispositivos() {
  if (!currentCompany.value?.id) return
  const { data } = await supabase
    .from('dispositivos_iot')
    .select('id, nome, nome_personalizado')
    .eq('empresa_id', currentCompany.value.id)
  dispositivos.value = data || []
}

async function handleMarcarLido(alerta) {
  const { error } = await supabase
    .from('alertas_historico_iot')
    .update({ lido: true })
    .eq('id', alerta.id)
    .eq('empresa_id', currentCompany.value.id)

  if (!error) {
    alerta.lido = true
    success('Alerta marcado como lido')
  }
}

async function handleMarcarLidoLote() {
  if (alertasSelecionados.value.length === 0) return

  const { error } = await supabase
    .from('alertas_historico_iot')
    .update({ lido: true })
    .in('id', alertasSelecionados.value)
    .eq('empresa_id', currentCompany.value.id)

  if (!error) {
    alertas.value.forEach(a => {
      if (alertasSelecionados.value.includes(a.id)) {
        a.lido = true
      }
    })
    success(`${alertasSelecionados.value.length} alertas marcados como lidos`)
    alertasSelecionados.value = []
  }
}

watch(() => currentCompany.value?.id, () => {
  fetchAlertas()
  fetchDispositivos()
}, { immediate: true })
</script>
