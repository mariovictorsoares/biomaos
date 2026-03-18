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
        <div
          class="fixed inset-0 glass-backdrop"
          @click="$emit('close')"
        ></div>

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
              <div class="px-6 py-5 border-b border-border-light dark:border-border-dark flex items-center justify-between">
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
                {{ isEditing ? 'Editar rota' : 'Nova rota de entrega' }}
              </h2>
              <div class="flex items-center gap-3">
                <button @click="$emit('close')" class="btn btn-secondary">Voltar</button>
                <button
                  @click="handleSave"
                  class="btn btn-primary"
                  :disabled="!isFormValid || saving"
                >
                  <span v-if="saving" class="material-icons-outlined text-sm animate-spin">refresh</span>
                  {{ saving ? 'Salvando...' : (isEditing ? 'Salvar' : 'Cadastrar') }}
                </button>
              </div>
            </div>

              <!-- Content -->
              <div class="overflow-y-auto max-h-[70vh]">
                <div class="px-6 py-6 space-y-6">
                <!-- Linha 1: Data + Motorista -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">
                      Data da rota <span class="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      v-model="form.dataRota"
                      class="input"
                      @change="onDateChange"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">
                      Motorista
                    </label>
                    <select v-model="form.motoristaId" class="input">
                      <option value="">Selecione...</option>
                      <option v-for="m in motoristas" :key="m.id" :value="m.id">
                        {{ m.nome }}{{ m.veiculo ? ` (${m.veiculo})` : '' }}
                      </option>
                    </select>
                  </div>
                </div>

                <!-- Observações -->
                <div>
                  <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Observações</label>
                  <textarea v-model="form.observacoes" rows="2" class="input resize-none" placeholder="Observações da rota"></textarea>
                </div>

                <!-- Paradas -->
                <div class="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <div class="flex items-center justify-between mb-4">
                    <h3 class="text-base font-semibold text-text-light dark:text-text-dark">
                      Paradas ({{ paradas.length }})
                    </h3>
                    <div class="flex items-center gap-2">
                      <button
                        v-if="paradas.length > 1"
                        @click="optimizeRoute"
                        class="btn btn-secondary text-xs"
                        title="Agrupar paradas por bairro para otimizar o trajeto"
                      >
                        <span class="material-icons-outlined text-sm">alt_route</span>
                        Otimizar rota
                      </button>
                      <button
                        v-if="form.dataRota"
                        @click="autoPopulate"
                        class="btn btn-secondary text-xs"
                        :disabled="loadingPedidos"
                      >
                        <span v-if="loadingPedidos" class="material-icons-outlined text-sm animate-spin">refresh</span>
                        <span v-else class="material-icons-outlined text-sm">autorenew</span>
                        Recarregar pedidos
                      </button>
                    </div>
                  </div>

                  <!-- Loading pedidos -->
                  <div v-if="loadingPedidos" class="text-center py-8">
                    <span class="material-icons-outlined text-3xl text-gray-300 dark:text-gray-600 animate-spin">refresh</span>
                    <p class="text-sm text-subtext-light dark:text-subtext-dark mt-2">Buscando pedidos...</p>
                  </div>

                  <!-- Sem data selecionada -->
                  <div v-else-if="!form.dataRota" class="text-center py-8">
                    <span class="material-icons-outlined text-3xl text-gray-300 dark:text-gray-600">calendar_today</span>
                    <p class="text-sm text-subtext-light dark:text-subtext-dark mt-2">Selecione uma data para carregar os pedidos</p>
                  </div>

                  <!-- Sem paradas -->
                  <div v-else-if="paradas.length === 0" class="text-center py-8">
                    <span class="material-icons-outlined text-3xl text-gray-300 dark:text-gray-600">local_shipping</span>
                    <p class="text-sm text-subtext-light dark:text-subtext-dark mt-2">Nenhum pedido encontrado para esta data</p>
                  </div>

                  <!-- Lista de paradas -->
                  <div v-else class="space-y-2">
                    <!-- Agrupamento por bairro -->
                    <div v-for="(grupo, bairro) in paradasPorBairro" :key="bairro">
                      <p class="text-xs font-semibold text-subtext-light dark:text-subtext-dark uppercase tracking-wider mb-1 mt-3 first:mt-0">
                        {{ bairro || 'Sem bairro' }}
                      </p>
                      <div
                        v-for="(parada, idx) in grupo"
                        :key="parada.pedidoId"
                        class="flex items-center gap-3 p-3 rounded-lg border border-border-light dark:border-border-dark bg-gray-50 dark:bg-gray-800/50"
                      >
                        <!-- Número ordem -->
                        <span class="text-xs font-bold text-subtext-light dark:text-subtext-dark w-6 text-center shrink-0">
                          {{ parada.ordem }}
                        </span>

                        <!-- Info -->
                        <div class="flex-1 min-w-0">
                          <p class="text-sm font-medium text-text-light dark:text-text-dark truncate">
                            {{ parada.clienteNome }}
                          </p>
                          <p class="text-xs text-subtext-light dark:text-subtext-dark truncate">
                            {{ parada.endereco }}
                          </p>
                          <p v-if="parada.itensResumo" class="text-xs text-subtext-light dark:text-subtext-dark mt-0.5">
                            {{ parada.itensResumo }}
                          </p>
                        </div>

                        <!-- Ações reordenar / remover -->
                        <div class="flex flex-col gap-0.5 shrink-0">
                          <button
                            @click="moveParada(parada.pedidoId, -1)"
                            class="text-gray-400 hover:text-primary transition-colors p-0.5"
                            :disabled="parada.ordem === 1"
                            title="Mover para cima"
                          >
                            <span class="material-icons-outlined text-sm">arrow_upward</span>
                          </button>
                          <button
                            @click="moveParada(parada.pedidoId, 1)"
                            class="text-gray-400 hover:text-primary transition-colors p-0.5"
                            :disabled="parada.ordem === paradas.length"
                            title="Mover para baixo"
                          >
                            <span class="material-icons-outlined text-sm">arrow_downward</span>
                          </button>
                        </div>
                        <button
                          @click="removeParada(parada.pedidoId)"
                          class="text-gray-400 hover:text-red-500 transition-colors p-1 shrink-0"
                          title="Remover parada"
                        >
                          <span class="material-icons-outlined text-sm">close</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
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
import { ref, computed, watch } from 'vue'
import { useCurrentCompany } from '~/composables/useCurrentCompany'
import { useToast } from '~/composables/useToast'

interface Motorista {
  id: string
  nome: string
  veiculo: string | null
}

interface Parada {
  pedidoId: string
  clienteId: string
  clienteNome: string
  bairro: string
  endereco: string
  itensResumo: string
  ordem: number
  observacoes: string
}

interface RotaData {
  id?: string
  dataRota: string
  motoristaId: string
  status: string
  observacoes: string
  paradas: Array<{
    pedido_id: string
    cliente_id: string
    ordem: number
    observacoes: string
  }>
}

const props = defineProps<{
  motoristas: Motorista[]
  editData?: {
    id: string
    data_rota: string
    motorista_id: string | null
    status: string
    observacoes: string | null
    rota_paradas: Array<{
      pedido_id: string
      cliente_id: string
      ordem: number
      observacoes: string | null
    }>
  } | null
}>()

const emit = defineEmits<{
  close: []
  save: [data: RotaData]
}>()

const supabase = useSupabaseClient()
const { currentCompany } = useCurrentCompany()
const toast = useToast()

const saving = ref(false)
const loadingPedidos = ref(false)
const isEditing = computed(() => !!props.editData?.id)

// Form
const form = ref({
  dataRota: '',
  motoristaId: '',
  observacoes: ''
})

// Paradas
const paradas = ref<Parada[]>([])

// Inicializar form se estiver editando
watch(() => props.editData, async (data) => {
  if (data) {
    form.value = {
      dataRota: data.data_rota || '',
      motoristaId: data.motorista_id || '',
      observacoes: data.observacoes || ''
    }
    // Carregar paradas existentes
    if (data.rota_paradas?.length) {
      await loadExistingParadas(data.rota_paradas)
    }
  } else {
    form.value = { dataRota: '', motoristaId: '', observacoes: '' }
    paradas.value = []
  }
}, { immediate: true })

// Computed
const paradasPorBairro = computed(() => {
  const grupos: Record<string, Parada[]> = {}
  const sorted = [...paradas.value].sort((a, b) => a.ordem - b.ordem)
  for (const p of sorted) {
    const key = p.bairro || 'Sem bairro'
    if (!grupos[key]) grupos[key] = []
    grupos[key].push(p)
  }
  return grupos
})

const isFormValid = computed(() => {
  return form.value.dataRota && paradas.value.length > 0
})

// Carregar paradas existentes (edição)
async function loadExistingParadas(rotaParadas: Array<{ pedido_id: string; cliente_id: string; ordem: number; observacoes: string | null }>) {
  if (!currentCompany.value?.id) return
  loadingPedidos.value = true

  try {
    const pedidoIds = rotaParadas.map(p => p.pedido_id)
    const clienteIds = rotaParadas.map(p => p.cliente_id)

    const [pedidosRes, clientesRes, itensRes] = await Promise.all([
      supabase.from('pedidos').select('id, cliente_id, numero').in('id', pedidoIds),
      supabase.from('clientes').select('id, razao_social, nome_fantasia, bairro, bairro_entrega, logradouro_entrega, numero_entrega, cidade_entrega, estado_entrega, logradouro, numero, cidade, estado').in('id', clienteIds),
      supabase.from('pedido_itens').select('pedido_id, quantidade, produto_id, produtos(nome)').in('pedido_id', pedidoIds)
    ])

    const clientesMap = new Map((clientesRes.data || []).map(c => [c.id, c]))
    const itensMap = new Map<string, any[]>()
    for (const item of (itensRes.data || [])) {
      if (!itensMap.has(item.pedido_id)) itensMap.set(item.pedido_id, [])
      itensMap.get(item.pedido_id)!.push(item)
    }

    paradas.value = rotaParadas.map(rp => {
      const cliente = clientesMap.get(rp.cliente_id)
      const itens = itensMap.get(rp.pedido_id) || []
      return buildParada(rp.pedido_id, rp.cliente_id, cliente, itens, rp.ordem)
    })
  } catch (e) {
    console.error('Erro ao carregar paradas:', e)
  } finally {
    loadingPedidos.value = false
  }
}

// Auto-popular paradas pela data
async function autoPopulate() {
  if (!form.value.dataRota || !currentCompany.value?.id) return

  loadingPedidos.value = true
  try {
    // Buscar pedidos para a data
    const { data: pedidosData, error: pedidosErr } = await supabase
      .from('pedidos')
      .select('id, cliente_id, numero, status')
      .eq('empresa_id', currentCompany.value.id)
      .eq('data_entrega', form.value.dataRota)
      .in('status', ['confirmado', 'em_producao', 'finalizado'])

    if (pedidosErr) throw pedidosErr

    if (!pedidosData?.length) {
      paradas.value = []
      return
    }

    const pedidoIds = pedidosData.map(p => p.id)
    const clienteIds = [...new Set(pedidosData.map(p => p.cliente_id).filter(Boolean))]

    const [clientesRes, itensRes] = await Promise.all([
      supabase.from('clientes').select('id, razao_social, nome_fantasia, bairro, bairro_entrega, logradouro_entrega, numero_entrega, cidade_entrega, estado_entrega, logradouro, numero, cidade, estado').in('id', clienteIds),
      supabase.from('pedido_itens').select('pedido_id, quantidade, produto_id, produtos(nome)').in('pedido_id', pedidoIds)
    ])

    const clientesMap = new Map((clientesRes.data || []).map(c => [c.id, c]))
    const itensMap = new Map<string, any[]>()
    for (const item of (itensRes.data || [])) {
      if (!itensMap.has(item.pedido_id)) itensMap.set(item.pedido_id, [])
      itensMap.get(item.pedido_id)!.push(item)
    }

    // Montar paradas agrupadas por bairro
    const novasParadas: Parada[] = pedidosData.map(p => {
      const cliente = clientesMap.get(p.cliente_id)
      const itens = itensMap.get(p.id) || []
      return buildParada(p.id, p.cliente_id, cliente, itens, 0)
    })

    // Ordenar por bairro, depois por nome do cliente
    novasParadas.sort((a, b) => {
      const bairroComp = (a.bairro || '').localeCompare(b.bairro || '')
      if (bairroComp !== 0) return bairroComp
      return a.clienteNome.localeCompare(b.clienteNome)
    })

    // Atribuir ordem
    novasParadas.forEach((p, i) => { p.ordem = i + 1 })

    paradas.value = novasParadas
  } catch (e: any) {
    console.error('Erro ao buscar pedidos:', e)
    toast.error('Erro ao buscar pedidos para a data')
  } finally {
    loadingPedidos.value = false
  }
}

function buildParada(pedidoId: string, clienteId: string, cliente: any, itens: any[], ordem: number): Parada {
  const nome = cliente?.nome_fantasia || cliente?.razao_social || 'Cliente'
  const bairro = cliente?.bairro_entrega || cliente?.bairro || ''

  // Endereço de entrega (preferir entrega, fallback para principal)
  const logradouro = cliente?.logradouro_entrega || cliente?.logradouro || ''
  const numero = cliente?.numero_entrega || cliente?.numero || ''
  const cidade = cliente?.cidade_entrega || cliente?.cidade || ''
  const estado = cliente?.estado_entrega || cliente?.estado || ''
  const enderecoParts = [logradouro, numero].filter(Boolean).join(', ')
  const localidade = [bairro, cidade, estado].filter(Boolean).join(' - ')
  const endereco = [enderecoParts, localidade].filter(Boolean).join(' - ')

  // Resumo de itens
  const itensResumo = itens.map(i => {
    const prodNome = (i.produtos as any)?.nome || 'Produto'
    return `${prodNome} x${i.quantidade}`
  }).join(', ')

  return {
    pedidoId,
    clienteId,
    clienteNome: nome,
    bairro,
    endereco,
    itensResumo,
    ordem,
    observacoes: ''
  }
}

function onDateChange() {
  if (!isEditing.value) {
    autoPopulate()
  }
}

function moveParada(pedidoId: string, direction: number) {
  const idx = paradas.value.findIndex(p => p.pedidoId === pedidoId)
  if (idx === -1) return

  const newIdx = idx + direction
  if (newIdx < 0 || newIdx >= paradas.value.length) return

  const arr = [...paradas.value]
  const [item] = arr.splice(idx, 1)
  arr.splice(newIdx, 0, item)
  arr.forEach((p, i) => { p.ordem = i + 1 })
  paradas.value = arr
}

function removeParada(pedidoId: string) {
  paradas.value = paradas.value.filter(p => p.pedidoId !== pedidoId)
  paradas.value.forEach((p, i) => { p.ordem = i + 1 })
}

function optimizeRoute() {
  if (paradas.value.length <= 1) return

  // Sort by bairro (alphabetically), then by clienteNome within each bairro
  const sorted = [...paradas.value].sort((a, b) => {
    const bairroA = (a.bairro || 'zzz').toLowerCase()
    const bairroB = (b.bairro || 'zzz').toLowerCase()
    const bairroComp = bairroA.localeCompare(bairroB)
    if (bairroComp !== 0) return bairroComp
    return a.clienteNome.localeCompare(b.clienteNome)
  })

  sorted.forEach((p, i) => { p.ordem = i + 1 })
  paradas.value = sorted
  toast.success('Rota otimizada por região')
}

function handleSave() {
  if (!isFormValid.value) return

  saving.value = true
  const data: RotaData = {
    id: props.editData?.id,
    dataRota: form.value.dataRota,
    motoristaId: form.value.motoristaId,
    status: props.editData?.status || 'planejada',
    observacoes: form.value.observacoes,
    paradas: paradas.value.map(p => ({
      pedido_id: p.pedidoId,
      cliente_id: p.clienteId,
      ordem: p.ordem,
      observacoes: p.observacoes
    }))
  }
  emit('save', data)
}

// Expor saving para o parent poder resetar
defineExpose({ saving })
</script>
