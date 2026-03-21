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
            <div class="relative w-full max-w-3xl glass-panel rounded-xl shadow-xl">
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

                <!-- Linha 2: KM e Horários -->
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label class="block text-xs font-medium text-text-light dark:text-text-dark mb-1">KM Início</label>
                    <input type="number" v-model.number="form.kmInicio" class="input" placeholder="0" />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-text-light dark:text-text-dark mb-1">KM Término</label>
                    <input type="number" v-model.number="form.kmTermino" class="input" placeholder="0" />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-text-light dark:text-text-dark mb-1">Horário Início</label>
                    <input type="time" v-model="form.horarioInicio" class="input" />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-text-light dark:text-text-dark mb-1">Horário Término</label>
                    <input type="time" v-model="form.horarioTermino" class="input" />
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
                      <span v-if="paradasEntregues > 0" class="text-sm font-normal text-green-600 dark:text-green-400 ml-2">
                        {{ paradasEntregues }}/{{ paradas.length }} entregues
                      </span>
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

                  <!-- Lista de paradas agrupadas -->
                  <div v-else class="space-y-2">
                    <div v-for="(grupo, grupoKey) in paradasAgrupadas" :key="grupoKey">
                      <!-- Header do grupo (seção ou bairro) -->
                      <p class="text-xs font-semibold text-subtext-light dark:text-subtext-dark uppercase tracking-wider mb-1 mt-3 first:mt-0">
                        {{ grupoKey || 'Sem bairro' }}
                      </p>
                      <div
                        v-for="parada in grupo"
                        :key="parada.pedidoId"
                        :class="[
                          'p-3 rounded-lg border transition-colors',
                          parada.entregue
                            ? 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10'
                            : 'border-border-light dark:border-border-dark bg-gray-50 dark:bg-gray-800/50'
                        ]"
                      >
                        <div class="flex items-start gap-3">
                          <!-- Número ordem -->
                          <span class="text-xs font-bold text-subtext-light dark:text-subtext-dark w-6 text-center shrink-0 mt-1">
                            {{ parada.ordem }}
                          </span>

                          <!-- Info -->
                          <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-1.5">
                              <p class="text-sm font-medium text-text-light dark:text-text-dark truncate">
                                {{ parada.clienteNome }}
                              </p>
                              <span v-if="parada.rotuloEmbalagem" :class="[
                                'inline-flex items-center px-1 py-0.5 rounded text-[9px] font-bold shrink-0',
                                parada.rotuloEmbalagem === 'C'
                                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                                  : 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300'
                              ]">{{ parada.rotuloEmbalagem }}</span>
                              <span v-if="parada.embalagemSecundaria" class="inline-flex items-center px-1 py-0.5 rounded text-[9px] font-medium bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300 shrink-0">
                                {{ parada.embalagemSecundaria }}
                              </span>
                            </div>
                            <p class="text-xs text-subtext-light dark:text-subtext-dark truncate">
                              {{ parada.endereco }}
                            </p>
                            <p v-if="parada.itensResumo" class="text-xs text-subtext-light dark:text-subtext-dark mt-0.5">
                              {{ parada.itensResumo }}
                            </p>
                          </div>

                          <!-- Checkboxes operacionais -->
                          <div class="flex items-center gap-1 shrink-0">
                            <button
                              @click="parada.pedidoPronto = !parada.pedidoPronto"
                              :class="['p-1 rounded transition-colors', parada.pedidoPronto ? 'text-green-500' : 'text-gray-300 dark:text-gray-600 hover:text-gray-400']"
                              title="Pedido pronto"
                            >
                              <span class="material-icons-outlined text-base">inventory</span>
                            </button>
                            <button
                              @click="parada.conferidoChegada = !parada.conferidoChegada"
                              :class="['p-1 rounded transition-colors', parada.conferidoChegada ? 'text-blue-500' : 'text-gray-300 dark:text-gray-600 hover:text-gray-400']"
                              title="Conferido na chegada"
                            >
                              <span class="material-icons-outlined text-base">fact_check</span>
                            </button>
                            <button
                              @click="toggleEntregue(parada)"
                              :class="['p-1 rounded transition-colors', parada.entregue ? 'text-green-600' : 'text-gray-300 dark:text-gray-600 hover:text-gray-400']"
                              title="Entregue"
                            >
                              <span class="material-icons-outlined text-base">check_circle</span>
                            </button>
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

                        <!-- Linha inferior: Seção + Canhoto -->
                        <div class="flex items-center gap-3 mt-2 ml-9">
                          <select
                            v-model="parada.secao"
                            class="text-[11px] border border-border-light dark:border-border-dark rounded px-1.5 py-0.5 bg-white dark:bg-gray-800 text-text-light dark:text-text-dark w-28"
                          >
                            <option value="">Seção...</option>
                            <option value="ROTA 1">ROTA 1</option>
                            <option value="ROTA 2">ROTA 2</option>
                            <option value="ROTA EXTRA">ROTA EXTRA</option>
                            <option value="DISTRIBUIDOR">DISTRIBUIDOR</option>
                          </select>
                          <div class="flex items-center gap-1">
                            <span class="text-[10px] text-subtext-light dark:text-subtext-dark">NF:</span>
                            <span v-if="parada.notaFiscal" class="text-[11px] text-text-light dark:text-text-dark">{{ parada.notaFiscal }}</span>
                          </div>
                          <div class="flex items-center gap-1">
                            <span class="text-[10px] text-subtext-light dark:text-subtext-dark">Canhoto:</span>
                            <input
                              type="text"
                              v-model="parada.canhoto"
                              class="text-[11px] border border-border-light dark:border-border-dark rounded px-1.5 py-0.5 bg-white dark:bg-gray-800 text-text-light dark:text-text-dark w-24"
                              placeholder="N° canhoto"
                            />
                          </div>
                        </div>
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
  secao: string
  pedidoPronto: boolean
  conferidoChegada: boolean
  entregue: boolean
  canhoto: string
  status: string
  rotuloEmbalagem: string
  embalagemSecundaria: string
  notaFiscal: string
}

interface RotaData {
  id?: string
  dataRota: string
  motoristaId: string
  status: string
  observacoes: string
  kmInicio: number | null
  kmTermino: number | null
  horarioInicio: string
  horarioTermino: string
  paradas: Array<{
    pedido_id: string
    cliente_id: string
    ordem: number
    observacoes: string
    secao: string | null
    pedido_pronto: boolean
    conferido_chegada: boolean
    entregue: boolean
    canhoto: string | null
    status: string
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
    km_inicio: number | null
    km_termino: number | null
    horario_inicio: string | null
    horario_termino: string | null
    rota_paradas: Array<{
      pedido_id: string
      cliente_id: string
      ordem: number
      observacoes: string | null
      secao: string | null
      pedido_pronto: boolean
      conferido_chegada: boolean
      entregue: boolean
      canhoto: string | null
      status: string
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
  observacoes: '',
  kmInicio: null as number | null,
  kmTermino: null as number | null,
  horarioInicio: '',
  horarioTermino: ''
})

// Paradas
const paradas = ref<Parada[]>([])

const paradasEntregues = computed(() => paradas.value.filter(p => p.entregue).length)

// Inicializar form se estiver editando
watch(() => props.editData, async (data) => {
  if (data) {
    form.value = {
      dataRota: data.data_rota || '',
      motoristaId: data.motorista_id || '',
      observacoes: data.observacoes || '',
      kmInicio: data.km_inicio ?? null,
      kmTermino: data.km_termino ?? null,
      horarioInicio: data.horario_inicio ? data.horario_inicio.substring(0, 5) : '',
      horarioTermino: data.horario_termino ? data.horario_termino.substring(0, 5) : ''
    }
    if (data.rota_paradas?.length) {
      await loadExistingParadas(data.rota_paradas)
    }
  } else {
    form.value = { dataRota: '', motoristaId: '', observacoes: '', kmInicio: null, kmTermino: null, horarioInicio: '', horarioTermino: '' }
    paradas.value = []
  }
}, { immediate: true })

// Computed - agrupa por seção primeiro (se houver), depois por bairro
const paradasAgrupadas = computed(() => {
  const grupos: Record<string, Parada[]> = {}
  const sorted = [...paradas.value].sort((a, b) => a.ordem - b.ordem)
  const hasSecao = sorted.some(p => p.secao)

  for (const p of sorted) {
    let key: string
    if (hasSecao && p.secao) {
      key = `${p.secao} — ${p.bairro || 'Sem bairro'}`
    } else {
      key = p.bairro || 'Sem bairro'
    }
    if (!grupos[key]) grupos[key] = []
    grupos[key].push(p)
  }
  return grupos
})

const isFormValid = computed(() => {
  return form.value.dataRota && paradas.value.length > 0
})

// Carregar paradas existentes (edição)
async function loadExistingParadas(rotaParadas: Array<any>) {
  if (!currentCompany.value?.id) return
  loadingPedidos.value = true

  try {
    const pedidoIds = rotaParadas.map(p => p.pedido_id)
    const clienteIds = rotaParadas.map(p => p.cliente_id)

    const [pedidosRes, clientesRes, itensRes] = await Promise.all([
      supabase.from('pedidos').select('id, cliente_id, numero, nota_fiscal').in('id', pedidoIds),
      supabase.from('clientes').select('id, razao_social, nome_fantasia, bairro, bairro_entrega, logradouro_entrega, numero_entrega, cidade_entrega, estado_entrega, logradouro, numero, cidade, estado, rotulo_embalagem, embalagem_secundaria').in('id', clienteIds),
      supabase.from('pedido_itens').select('pedido_id, quantidade, produto_id, produtos(nome)').in('pedido_id', pedidoIds)
    ])

    const clientesMap = new Map((clientesRes.data || []).map(c => [c.id, c]))
    const pedidosMap = new Map((pedidosRes.data || []).map(p => [p.id, p]))
    const itensMap = new Map<string, any[]>()
    for (const item of (itensRes.data || [])) {
      if (!itensMap.has(item.pedido_id)) itensMap.set(item.pedido_id, [])
      itensMap.get(item.pedido_id)!.push(item)
    }

    paradas.value = rotaParadas.map(rp => {
      const cliente = clientesMap.get(rp.cliente_id)
      const pedido = pedidosMap.get(rp.pedido_id)
      const itens = itensMap.get(rp.pedido_id) || []
      return buildParada(rp.pedido_id, rp.cliente_id, cliente, pedido, itens, rp.ordem, rp)
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
    const dataRota = form.value.dataRota
    const { data: pedidosData, error: pedidosErr } = await supabase
      .from('pedidos')
      .select('id, cliente_id, numero, status, nota_fiscal')
      .eq('empresa_id', currentCompany.value.id)
      .eq('data_entrega', dataRota)
      .neq('status', 'cancelado')

    if (pedidosErr) throw pedidosErr

    if (!pedidosData?.length) {
      paradas.value = []
      return
    }

    const pedidoIds = pedidosData.map(p => p.id)
    const clienteIds = [...new Set(pedidosData.map(p => p.cliente_id).filter(Boolean))]

    const [clientesRes, itensRes] = await Promise.all([
      supabase.from('clientes').select('id, razao_social, nome_fantasia, bairro, bairro_entrega, logradouro_entrega, numero_entrega, cidade_entrega, estado_entrega, logradouro, numero, cidade, estado, rotulo_embalagem, embalagem_secundaria').in('id', clienteIds),
      supabase.from('pedido_itens').select('pedido_id, quantidade, produto_id, produtos(nome)').in('pedido_id', pedidoIds)
    ])

    const clientesMap = new Map((clientesRes.data || []).map(c => [c.id, c]))
    const itensMap = new Map<string, any[]>()
    for (const item of (itensRes.data || [])) {
      if (!itensMap.has(item.pedido_id)) itensMap.set(item.pedido_id, [])
      itensMap.get(item.pedido_id)!.push(item)
    }

    const novasParadas: Parada[] = pedidosData.map(p => {
      const cliente = clientesMap.get(p.cliente_id)
      const itens = itensMap.get(p.id) || []
      return buildParada(p.id, p.cliente_id, cliente, p, itens, 0, null)
    })

    novasParadas.sort((a, b) => {
      const bairroComp = (a.bairro || '').localeCompare(b.bairro || '')
      if (bairroComp !== 0) return bairroComp
      return a.clienteNome.localeCompare(b.clienteNome)
    })

    novasParadas.forEach((p, i) => { p.ordem = i + 1 })
    paradas.value = novasParadas
  } catch (e: any) {
    console.error('Erro ao buscar pedidos:', e)
    toast.error('Erro ao buscar pedidos para a data')
  } finally {
    loadingPedidos.value = false
  }
}

function buildParada(pedidoId: string, clienteId: string, cliente: any, pedido: any, itens: any[], ordem: number, existingData: any): Parada {
  const nome = cliente?.nome_fantasia || cliente?.razao_social || 'Cliente'
  const bairro = cliente?.bairro_entrega || cliente?.bairro || ''

  const logradouro = cliente?.logradouro_entrega || cliente?.logradouro || ''
  const numero = cliente?.numero_entrega || cliente?.numero || ''
  const cidade = cliente?.cidade_entrega || cliente?.cidade || ''
  const estado = cliente?.estado_entrega || cliente?.estado || ''
  const enderecoParts = [logradouro, numero].filter(Boolean).join(', ')
  const localidade = [bairro, cidade, estado].filter(Boolean).join(' - ')
  const endereco = [enderecoParts, localidade].filter(Boolean).join(' - ')

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
    observacoes: existingData?.observacoes || '',
    secao: existingData?.secao || '',
    pedidoPronto: existingData?.pedido_pronto ?? false,
    conferidoChegada: existingData?.conferido_chegada ?? false,
    entregue: existingData?.entregue ?? false,
    canhoto: existingData?.canhoto || '',
    status: existingData?.status || 'pendente',
    rotuloEmbalagem: cliente?.rotulo_embalagem || '',
    embalagemSecundaria: cliente?.embalagem_secundaria || '',
    notaFiscal: pedido?.nota_fiscal || ''
  }
}

function toggleEntregue(parada: Parada) {
  parada.entregue = !parada.entregue
  parada.status = parada.entregue ? 'entregue' : 'pendente'
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
    kmInicio: form.value.kmInicio || null,
    kmTermino: form.value.kmTermino || null,
    horarioInicio: form.value.horarioInicio,
    horarioTermino: form.value.horarioTermino,
    paradas: paradas.value.map(p => ({
      pedido_id: p.pedidoId,
      cliente_id: p.clienteId,
      ordem: p.ordem,
      observacoes: p.observacoes,
      secao: p.secao || null,
      pedido_pronto: p.pedidoPronto,
      conferido_chegada: p.conferidoChegada,
      entregue: p.entregue,
      canhoto: p.canhoto || null,
      status: p.status
    }))
  }
  emit('save', data)
}

// Expor saving para o parent poder resetar
defineExpose({ saving })
</script>
