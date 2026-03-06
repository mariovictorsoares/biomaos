<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 overflow-y-auto">
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-black/50 transition-opacity" @click="$emit('close')"></div>

      <!-- Modal -->
      <div class="flex min-h-full items-center justify-center p-4">
        <div class="relative w-full max-w-3xl bg-card-light dark:bg-card-dark rounded-xl shadow-xl transform transition-all">
          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-border-light dark:border-border-dark">
            <h2 class="text-lg font-semibold text-text-light dark:text-text-dark">Cadastro de Plano de Produção</h2>
            <div class="flex items-center gap-2">
              <button @click="$emit('close')" class="btn btn-secondary">Voltar</button>
              <button @click="handleConcluir" class="btn btn-primary" :disabled="saving">
                <span v-if="saving" class="animate-spin material-icons text-sm">refresh</span>
                {{ saving ? 'Salvando...' : 'Concluir plano' }}
              </button>
            </div>
          </div>

          <!-- Content -->
          <div class="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
            <!-- Toggle Origem -->
            <div class="flex gap-2">
              <button
                type="button"
                @click="origem = 'manual'"
                :class="[
                  'flex-1 py-2 px-3 rounded-lg text-sm font-medium border-2 transition-all text-center',
                  origem === 'manual'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border-light dark:border-border-dark text-subtext-light dark:text-subtext-dark hover:border-gray-400'
                ]"
              >
                <span class="material-icons-outlined text-sm mr-1">edit</span>
                Manual
              </button>
              <button
                type="button"
                @click="origem = 'pedido'"
                :class="[
                  'flex-1 py-2 px-3 rounded-lg text-sm font-medium border-2 transition-all text-center',
                  origem === 'pedido'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border-light dark:border-border-dark text-subtext-light dark:text-subtext-dark hover:border-gray-400'
                ]"
              >
                <span class="material-icons-outlined text-sm mr-1">receipt_long</span>
                A partir de Pedido
              </button>
            </div>

            <!-- ========== MODO MANUAL ========== -->
            <template v-if="origem === 'manual'">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <!-- Espécie -->
                <div>
                  <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Espécie</label>
                  <select v-model="form.especie_id" :class="['input', attempted && !form.especie_id ? 'border-red-500' : '']">
                    <option value="">Escolha a espécie</option>
                    <option v-for="esp in especiesAtivas" :key="esp.id" :value="esp.id">
                      {{ esp.nome }}
                    </option>
                  </select>
                  <span v-if="attempted && !form.especie_id" class="text-xs text-red-500 mt-1">Campo obrigatório</span>
                </div>

                <!-- Quantidade (bandejas) -->
                <div>
                  <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Bandejas</label>
                  <input
                    type="number"
                    v-model.number="form.quantidade"
                    placeholder="Qtd bandejas"
                    :class="['input', attempted && (!form.quantidade || form.quantidade <= 0) ? 'border-red-500' : '']"
                  />
                  <span v-if="attempted && (!form.quantidade || form.quantidade <= 0)" class="text-xs text-red-500 mt-1">Campo obrigatório</span>
                </div>

                <!-- Fazenda -->
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

              <!-- Data da Colheita + Recorrência -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Data da Colheita</label>
                  <input type="date" v-model="form.dataColheita" :class="['input', attempted && !form.dataColheita ? 'border-red-500' : '']" />
                  <span v-if="attempted && !form.dataColheita" class="text-xs text-red-500 mt-1">Campo obrigatório</span>
                </div>
                <div>
                  <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Recorrência</label>
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" v-model="form.recorrente" class="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary" />
                    <span class="text-sm text-text-light dark:text-text-dark">Recorrente</span>
                  </label>
                </div>
              </div>

              <!-- Preview de datas calculadas -->
              <div v-if="form.especie_id && form.dataColheita && previewEtapas.length > 0" class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p class="text-xs font-medium text-blue-700 dark:text-blue-300 mb-2">Preview do Ciclo de Cultivo</p>
                <div class="flex rounded-full overflow-hidden h-5 mb-1">
                  <div
                    v-for="(etapa, idx) in previewEtapas"
                    :key="idx"
                    :style="{ width: (etapa.duracao_dias / previewTempoTotal * 100) + '%' }"
                    :class="previewCores[idx % previewCores.length]"
                    class="flex items-center justify-center text-[9px] font-medium text-white truncate px-1"
                  >
                    {{ etapa.nome }} {{ etapa.duracao_dias }}d
                  </div>
                </div>
                <div class="flex justify-between text-[10px] text-blue-600 dark:text-blue-400">
                  <span>Plantio: {{ formatDate(previewEtapas[0]?.data_inicio) }}</span>
                  <span>Colheita: {{ formatDate(form.dataColheita) }}</span>
                </div>
              </div>

              <!-- Opções de Recorrência -->
              <div v-if="form.recorrente" class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-4">
                <h4 class="text-sm font-medium text-text-light dark:text-text-dark">Configurações de Recorrência</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Frequência</label>
                    <select v-model="form.frequencia" class="input">
                      <option value="diario">Diário</option>
                      <option value="semanal">Semanal</option>
                      <option value="quinzenal">Quinzenal</option>
                      <option value="mensal">Mensal</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Número de Repetições</label>
                    <input type="number" v-model.number="form.repeticoes" placeholder="Ex: 4" min="1" class="input" />
                  </div>
                </div>
              </div>

              <!-- Botão Adicionar -->
              <div class="flex justify-end">
                <button @click="adicionarItem" class="btn btn-primary">Adicionar</button>
              </div>
            </template>

            <!-- ========== MODO PEDIDO ========== -->
            <template v-if="origem === 'pedido'">
              <!-- Seleção de Pedido -->
              <div>
                <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Pedido Confirmado</label>
                <select v-model="pedidoSelecionadoId" class="input" @change="carregarItensPedido">
                  <option value="">Selecione um pedido...</option>
                  <option v-for="ped in pedidosConfirmados" :key="ped.id" :value="ped.id">
                    #{{ ped.codigo }} - {{ ped.cliente?.razao_social || 'Sem cliente' }} - {{ formatDate(ped.previsao_entrega) }}
                  </option>
                </select>
              </div>

              <!-- Fazenda para produção -->
              <div v-if="pedidoSelecionadoId">
                <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Fazenda</label>
                <select v-model="pedidoFazendaId" class="input">
                  <option value="">Selecione a fazenda...</option>
                  <option v-for="faz in fazendasAtivas" :key="faz.id" :value="faz.id">
                    {{ faz.nome }}
                  </option>
                </select>
              </div>

              <!-- Itens do Pedido com cálculo automático -->
              <div v-if="itensPedido.length > 0" class="space-y-3">
                <h4 class="text-sm font-medium text-text-light dark:text-text-dark">Itens do Pedido - Cálculo de Bandejas</h4>
                <div class="border border-border-light dark:border-border-dark rounded-lg overflow-hidden">
                  <table class="w-full text-left">
                    <thead>
                      <tr class="bg-gray-50 dark:bg-gray-800 border-b border-border-light dark:border-border-dark">
                        <th class="table-header">Produto</th>
                        <th class="table-header text-center">Qtd</th>
                        <th class="table-header text-center">Espécie</th>
                        <th class="table-header text-center">Bandejas</th>
                        <th class="table-header text-center">Plantio</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-border-light dark:divide-border-dark">
                      <tr
                        v-for="item in itensCalculados"
                        :key="item.key"
                        class="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      >
                        <td class="table-cell font-medium text-sm">
                          {{ item.produto_nome }}
                          <span v-if="item.modalidade" :class="[
                            'ml-1 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium',
                            item.modalidade === 'vivo' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          ]">{{ item.modalidade === 'vivo' ? 'V' : 'C' }}</span>
                        </td>
                        <td class="table-cell text-center text-sm">{{ item.quantidade }}</td>
                        <td class="table-cell text-center text-sm">{{ item.especie_nome || '-' }}</td>
                        <td class="table-cell text-center text-sm font-semibold text-primary">{{ item.bandejas || '?' }}</td>
                        <td class="table-cell text-center text-sm">{{ item.data_plantio ? formatDate(item.data_plantio) : '-' }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div class="flex justify-end">
                  <button @click="gerarProducaoPedido" class="btn btn-primary" :disabled="!pedidoFazendaId">
                    Gerar Produção
                  </button>
                </div>
              </div>

              <!-- Mensagem sem itens -->
              <div v-else-if="pedidoSelecionadoId" class="text-center py-6 text-sm text-subtext-light dark:text-subtext-dark">
                <span class="material-icons-outlined text-2xl text-gray-300 dark:text-gray-600 mb-1">inventory_2</span>
                <p>Nenhum item com produto encontrado neste pedido.</p>
              </div>
            </template>

            <!-- Lista de Itens Adicionados (modo manual) -->
            <div v-if="origem === 'manual' && itensAdicionados.length > 0" class="border border-border-light dark:border-border-dark rounded-lg overflow-hidden">
              <table class="w-full text-left">
                <thead>
                  <tr class="bg-gray-50 dark:bg-gray-800 border-b border-border-light dark:border-border-dark">
                    <th class="table-header">Espécie</th>
                    <th class="table-header text-center">Bandejas</th>
                    <th class="table-header">Fazenda</th>
                    <th class="table-header text-center">Colheita</th>
                    <th class="table-header text-center">Plantio</th>
                    <th class="table-header text-center w-16">Ações</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-border-light dark:divide-border-dark">
                  <tr v-for="(item, index) in itensAdicionados" :key="index" class="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td class="table-cell font-medium">{{ item.especie_nome }}</td>
                    <td class="table-cell text-center">{{ item.quantidade }}</td>
                    <td class="table-cell">{{ item.fazenda_nome }}</td>
                    <td class="table-cell text-center">{{ formatDate(item.dataColheita) }}</td>
                    <td class="table-cell text-center">{{ formatDate(item.dataPlantio) }}</td>
                    <td class="table-cell text-center">
                      <button @click="removerItem(index)" class="text-red-500 hover:text-red-700"><span class="material-icons text-sm">delete</span></button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Empty state (modo manual) -->
            <div v-if="origem === 'manual' && itensAdicionados.length === 0" class="text-center py-8 border border-dashed border-border-light dark:border-border-dark rounded-lg">
              <span class="material-icons-outlined text-3xl text-gray-300 dark:text-gray-600 mb-2">inventory_2</span>
              <p class="text-sm text-subtext-light dark:text-subtext-dark">
                Nenhum item adicionado. Preencha os campos acima e clique em "Adicionar".
              </p>
            </div>
          </div>

          <!-- Footer com Resumo -->
          <div v-if="itensAdicionados.length > 0" class="px-6 py-4 border-t border-border-light dark:border-border-dark bg-gray-50 dark:bg-gray-800 rounded-b-xl">
            <div class="flex items-center gap-6">
              <div>
                <span class="text-xs text-subtext-light dark:text-subtext-dark">Itens</span>
                <p class="text-lg font-semibold text-text-light dark:text-text-dark">{{ itensAdicionados.length }}</p>
              </div>
              <div>
                <span class="text-xs text-subtext-light dark:text-subtext-dark">Bandejas Total</span>
                <p class="text-lg font-semibold text-text-light dark:text-text-dark">{{ bandejasTotal }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useCurrentCompany } from '~/composables/useCurrentCompany'
import { useToast } from '~/composables/useToast'
import { useProducaoCalc } from '~/composables/useProducaoCalc'

const supabase = useSupabaseClient()
const { currentCompany } = useCurrentCompany()
const { showToast } = useToast()
const { calcularDatasEtapas, calcularDataPlantio, calcularBandejas, calcularBandejasMix, calcularBandejasMixVivo, maiorMargem, tempoTotalCultivo } = useProducaoCalc()

const emit = defineEmits(['close', 'save'])
const props = defineProps({
  pedidoId: { type: String, default: null }
})

const saving = ref(false)
const attempted = ref(false)
const origem = ref(props.pedidoId ? 'pedido' : 'manual')

// Dados do banco
const especies = ref([])
const fazendas = ref([])
const etapasMap = ref({}) // { especie_id: etapas[] }

const especiesAtivas = computed(() => especies.value.filter(e => e.ativo))
const fazendasAtivas = computed(() => fazendas.value.filter(f => f.status === 'active'))

// Preview cores
const previewCores = ['bg-amber-500', 'bg-emerald-500', 'bg-sky-500', 'bg-violet-500', 'bg-rose-500']

// ========== MODO MANUAL ==========
const form = ref({
  especie_id: '',
  quantidade: null,
  fazenda_id: '',
  dataColheita: new Date().toISOString().split('T')[0],
  recorrente: false,
  frequencia: 'semanal',
  repeticoes: 4
})

const itensAdicionados = ref([])

const bandejasTotal = computed(() => {
  return itensAdicionados.value.reduce((total, item) => total + (item.quantidade || 0), 0)
})

// Preview das etapas para a espécie selecionada
const previewEtapas = computed(() => {
  if (!form.value.especie_id || !form.value.dataColheita) return []
  const especie = especies.value.find(e => e.id === form.value.especie_id)
  const etapas = etapasMap.value[form.value.especie_id] || null
  return calcularDatasEtapas(form.value.dataColheita, etapas, especie)
})

const previewTempoTotal = computed(() => {
  return previewEtapas.value.reduce((sum, e) => sum + (e.duracao_dias || 0), 0)
})

function adicionarItem() {
  attempted.value = true
  if (!form.value.especie_id || !form.value.quantidade || form.value.quantidade <= 0 || !form.value.fazenda_id || !form.value.dataColheita) {
    showToast('Preencha todos os campos obrigatórios', 'error')
    return
  }

  const especie = especies.value.find(e => e.id === form.value.especie_id)
  const fazenda = fazendas.value.find(f => f.id === form.value.fazenda_id)
  const etapas = etapasMap.value[form.value.especie_id] || null
  const dataPlantio = calcularDataPlantio(form.value.dataColheita, etapas, especie)

  itensAdicionados.value.push({
    especie_id: form.value.especie_id,
    especie_nome: especie?.nome || '',
    quantidade: form.value.quantidade,
    fazenda_id: form.value.fazenda_id,
    fazenda_nome: fazenda?.nome || '',
    dataColheita: form.value.dataColheita,
    dataPlantio,
    recorrente: form.value.recorrente,
    frequencia: form.value.recorrente ? form.value.frequencia : null,
    repeticoes: form.value.recorrente ? form.value.repeticoes : null,
    origem: 'manual'
  })

  // Limpar
  form.value.especie_id = ''
  form.value.quantidade = null
  form.value.recorrente = false
  attempted.value = false
}

function removerItem(index) {
  itensAdicionados.value.splice(index, 1)
}

// ========== MODO PEDIDO ==========
const pedidosConfirmados = ref([])
const pedidoSelecionadoId = ref(props.pedidoId || '')
const pedidoFazendaId = ref('')
const itensPedido = ref([])

const itensCalculados = computed(() => {
  return itensPedido.value.map(item => {
    const produto = item.produto
    if (!produto) return { ...item, key: item.id, bandejas: 0 }

    const modalidade = produto.modalidade || 'cortado'
    const pesoGramas = produto.peso_gramas

    // Espécie(s) do produto
    const especiesProduto = (produto.especies || []).map(e => {
      const full = especies.value.find(es => es.id === e.id)
      return { ...e, ...full, percentual: e.percentual }
    })

    const dataEntrega = pedidosConfirmados.value.find(p => p.id === pedidoSelecionadoId.value)?.previsao_entrega

    if (produto.is_mix && modalidade === 'cortado') {
      // Cortado MIX: uma linha por espécie
      return especiesProduto.map((esp, idx) => {
        const etapas = etapasMap.value[esp.id] || null
        const gramasEspecie = item.quantidade * pesoGramas * ((esp.percentual || 0) / 100)
        const rendimento = esp.rendimento_por_bandeja || 0
        const margem = esp.margem_seguranca || 0
        const bandejas = rendimento > 0 ? Math.ceil((gramasEspecie / rendimento) * (1 + margem)) : 0
        const dataPlantio = dataEntrega ? calcularDataPlantio(dataEntrega, etapas, esp) : null

        return {
          key: `${item.id}-${esp.id}`,
          pedido_item_id: item.id,
          produto_nome: produto.nome,
          modalidade,
          quantidade: item.quantidade,
          especie_id: esp.id,
          especie_nome: esp.nome,
          bandejas,
          data_plantio: dataPlantio,
          data_colheita: dataEntrega,
          is_mix_part: true
        }
      })
    } else {
      // Single ou Vivo (MIX ou não)
      const especie = especiesProduto[0] || especies.value.find(e => e.id === produto.especie_id)
      let bandejas = 0

      if (modalidade === 'vivo') {
        const margem = especie ? (especie.margem_seguranca || 0) : 0
        bandejas = Math.ceil(item.quantidade * (1 + margem))
      } else if (especie && pesoGramas) {
        bandejas = calcularBandejas(item.quantidade, especie, 'cortado', pesoGramas)
      }

      const etapas = especie ? (etapasMap.value[especie.id] || null) : null
      const dataPlantio = dataEntrega && especie ? calcularDataPlantio(dataEntrega, etapas, especie) : null

      return [{
        key: `${item.id}`,
        pedido_item_id: item.id,
        produto_nome: produto.nome,
        modalidade,
        quantidade: item.quantidade,
        especie_id: modalidade === 'vivo' && produto.is_mix ? null : especie?.id,
        especie_nome: produto.is_mix ? especiesProduto.map(e => e.nome).join(' + ') : especie?.nome,
        bandejas,
        data_plantio: dataPlantio,
        data_colheita: dataEntrega,
        produto_id: produto.id,
        is_vivo_mix: modalidade === 'vivo' && produto.is_mix
      }]
    }
  }).flat()
})

async function carregarItensPedido() {
  if (!pedidoSelecionadoId.value) {
    itensPedido.value = []
    return
  }

  const { data } = await supabase
    .from('pedido_itens')
    .select('id, quantidade, valor_unitario, produto_id')
    .eq('pedido_id', pedidoSelecionadoId.value)

  if (!data) { itensPedido.value = []; return }

  // Carregar produtos com espécies
  const produtoIds = [...new Set(data.map(i => i.produto_id).filter(Boolean))]
  let produtosMap = {}
  if (produtoIds.length > 0) {
    const { data: produtos } = await supabase
      .from('produtos')
      .select('id, nome, modalidade, peso_gramas, is_mix, especie_id')
      .in('id', produtoIds)

    // Carregar espécies de cada produto
    for (const prod of (produtos || [])) {
      const { data: rels } = await supabase
        .from('produto_especies')
        .select('especie_id, percentual')
        .eq('produto_id', prod.id)
      prod.especies = (rels || []).map(r => {
        const esp = especies.value.find(e => e.id === r.especie_id)
        return { id: r.especie_id, nome: esp?.nome || '', percentual: r.percentual }
      })
      produtosMap[prod.id] = prod
    }
  }

  itensPedido.value = data.map(item => ({
    ...item,
    produto: produtosMap[item.produto_id] || null
  }))

  // Carregar etapas das espécies envolvidas
  const especieIds = new Set()
  data.forEach(item => {
    const prod = produtosMap[item.produto_id]
    if (prod?.especie_id) especieIds.add(prod.especie_id)
    prod?.especies?.forEach(e => especieIds.add(e.id))
  })
  await carregarEtapas([...especieIds])
}

async function gerarProducaoPedido() {
  if (!pedidoFazendaId.value) {
    showToast('Selecione uma fazenda', 'error')
    return
  }

  for (const item of itensCalculados.value) {
    if (item.bandejas > 0) {
      itensAdicionados.value.push({
        especie_id: item.especie_id,
        especie_nome: item.especie_nome,
        quantidade: item.bandejas,
        fazenda_id: pedidoFazendaId.value,
        fazenda_nome: fazendasAtivas.value.find(f => f.id === pedidoFazendaId.value)?.nome || '',
        dataColheita: item.data_colheita,
        dataPlantio: item.data_plantio,
        recorrente: false,
        origem: 'pedido',
        pedido_item_id: item.pedido_item_id,
        produto_id: item.produto_id || null,
        is_vivo_mix: item.is_vivo_mix || false
      })
    }
  }

  showToast(`${itensCalculados.value.filter(i => i.bandejas > 0).length} itens de produção gerados`, 'success')
}

// ========== CONCLUIR ==========
async function handleConcluir() {
  if (itensAdicionados.value.length === 0) {
    showToast('Adicione pelo menos um item ao plano de produção', 'error')
    return
  }

  emit('save', itensAdicionados.value)
}

// ========== CARREGAR DADOS ==========
async function carregarDados() {
  if (!currentCompany.value?.id) return

  const [especiesRes, fazendasRes, pedidosRes] = await Promise.all([
    supabase.from('especies').select('*').eq('empresa_id', currentCompany.value.id).eq('ativo', true).order('nome'),
    supabase.from('fazendas').select('*').eq('empresa_id', currentCompany.value.id).order('nome'),
    supabase.from('pedidos').select('id, codigo, previsao_entrega, cliente:clientes(razao_social)').eq('empresa_id', currentCompany.value.id).eq('status', 'Confirmado').order('previsao_entrega')
  ])

  especies.value = especiesRes.data || []
  fazendas.value = fazendasRes.data || []
  pedidosConfirmados.value = pedidosRes.data || []

  // Carregar etapas para todas espécies
  const especieIds = especies.value.map(e => e.id)
  await carregarEtapas(especieIds)

  // Se veio com pedidoId, carregar itens
  if (props.pedidoId) {
    pedidoSelecionadoId.value = props.pedidoId
    await carregarItensPedido()
  }
}

async function carregarEtapas(especieIds) {
  if (especieIds.length === 0) return
  const { data } = await supabase
    .from('etapas_cultivo')
    .select('*')
    .in('especie_id', especieIds)
    .order('ordem')

  if (data) {
    for (const etapa of data) {
      if (!etapasMap.value[etapa.especie_id]) {
        etapasMap.value[etapa.especie_id] = []
      }
      // Evitar duplicatas
      if (!etapasMap.value[etapa.especie_id].find(e => e.id === etapa.id)) {
        etapasMap.value[etapa.especie_id].push(etapa)
      }
    }
  }
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr + 'T12:00:00')
  return date.toLocaleDateString('pt-BR')
}

// Carregar dados ao montar
watch(() => currentCompany.value?.id, (id) => { if (id) carregarDados() }, { immediate: true })
</script>
