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
      <div class="fixed inset-0 z-50 overflow-y-auto">
        <!-- Backdrop -->
        <div
          class="fixed inset-0 glass-backdrop"
          @click="$emit('close')"
        ></div>

        <!-- Modal -->
        <div class="flex min-h-full items-center justify-center p-2 sm:p-4">
          <Transition
            enter-active-class="transition-all duration-200"
            enter-from-class="opacity-0 scale-95"
            enter-to-class="opacity-100 scale-100"
            leave-active-class="transition-all duration-200"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-95"
          >
            <div class="relative w-full max-w-2xl glass-panel rounded-xl shadow-xl transform transition-all max-h-[95vh] flex flex-col">
          <!-- Header -->
          <div class="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <h2 class="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Editar pedido #{{ pedido?.numero }}</h2>
            <button
              @click="$emit('close')"
              class="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <span class="material-icons text-xl">close</span>
            </button>
          </div>

          <!-- Content -->
          <div class="px-4 sm:px-6 py-4 sm:py-6 overflow-y-auto flex-1">
            <!-- Linha 1: Codigo e Previsao lado a lado, Cliente embaixo no mobile -->
            <div class="grid grid-cols-2 sm:grid-cols-12 gap-3 sm:gap-4 mb-4 sm:mb-6">
              <!-- Codigo do Pedido -->
              <div class="col-span-1 sm:col-span-2">
                <label class="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-1.5">
                  Codigo
                </label>
                <input
                  type="text"
                  :value="pedido?.numero"
                  class="input w-full text-sm bg-gray-100 dark:bg-gray-800"
                  disabled
                />
              </div>

              <!-- Previsao de Entrega -->
              <div class="col-span-1 sm:col-span-3">
                <label class="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-1.5">
                  Entrega
                </label>
                <input
                  type="date"
                  v-model="form.dataEntrega"
                  class="input w-full text-sm"
                />
              </div>

              <!-- Cliente -->
              <div class="col-span-2 sm:col-span-7">
                <label class="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-1.5">
                  Cliente
                </label>
                <select v-model="form.clienteId" class="input w-full text-sm">
                  <option value="">Selecione...</option>
                  <option v-for="cliente in clientes" :key="cliente.id" :value="cliente.id">
                    {{ cliente.razao_social || cliente.nome_fantasia }}
                  </option>
                </select>
              </div>
            </div>

            <!-- Linha 2: Tabela de Preco -->
            <div class="flex items-end gap-2 sm:gap-3 mb-6 sm:mb-8">
              <div class="flex-1">
                <label class="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-1.5">
                  Tabela de preco
                </label>
                <select v-model="form.tabelaPrecoId" class="input text-sm" @change="onTabelaPrecoChange">
                  <option value="">Selecione...</option>
                  <option v-for="tabela in tabelasPrecoLocal" :key="tabela.id" :value="tabela.id">
                    {{ tabela.nome }}
                  </option>
                </select>
              </div>
              <button
                type="button"
                @click="openModalListaTabelas"
                class="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-primary text-white rounded-full hover:bg-primary-dark transition-colors flex-shrink-0"
                title="Gerenciar tabelas de preco"
              >
                <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                </svg>
              </button>
            </div>

            <!-- Secao: Item do Pedido -->
            <div class="border-t border-gray-200 dark:border-gray-700 pt-4 sm:pt-6">
              <h3 class="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">Item do pedido</h3>

              <!-- Form de adicionar item - Mobile: stacked, Desktop: row -->
              <div class="space-y-3 sm:space-y-0 sm:flex sm:items-end sm:gap-3 mb-4">
                <!-- Produto -->
                <div class="flex-1">
                  <label class="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-1.5">
                    Produto
                  </label>
                  <select v-model="itemForm.produtoId" class="input w-full text-sm" @change="onProdutoChange">
                    <option value="">Selecione...</option>
                    <option v-for="produto in produtos" :key="produto.id" :value="produto.id">
                      {{ produto.nome }}
                    </option>
                  </select>
                </div>

                <!-- Quantidade e Valor lado a lado no mobile -->
                <div class="flex gap-2 sm:gap-3">
                  <div class="flex-1 sm:w-24">
                    <label class="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-1.5">
                      Qtd
                    </label>
                    <input
                      type="number"
                      v-model.number="itemForm.quantidade"
                      class="input w-full text-sm"
                      min="1"
                      step="1"
                    />
                  </div>

                  <div class="flex-1 sm:w-28">
                    <label class="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-1.5">
                      Valor
                    </label>
                    <input
                      type="number"
                      v-model.number="itemForm.valorUnitario"
                      class="input w-full text-sm"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <!-- Botao Adicionar -->
                  <div class="flex items-end">
                    <button
                      @click="adicionarItem"
                      type="button"
                      class="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-primary text-white rounded-full hover:bg-primary-dark transition-colors flex-shrink-0"
                      title="Adicionar item"
                    >
                      <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Totais -->
              <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3 sm:mb-4">
                <p>Total: <span class="font-semibold text-gray-900 dark:text-white">{{ quantidadeTotal }} itens</span></p>
                <p>Valor: <span class="font-semibold text-gray-900 dark:text-white">{{ formatCurrency(valorTotal) }}</span></p>
              </div>

              <!-- Lista de Itens - Mobile: cards, Desktop: table -->
              <div v-if="form.itens.length > 0">
                <!-- Desktop: Table -->
                <div class="hidden sm:block border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <table class="w-full">
                    <thead class="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                      <tr>
                        <th class="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3">
                          Produto
                        </th>
                        <th class="text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3">
                          Qtd
                        </th>
                        <th class="text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3">
                          Valor
                        </th>
                        <th class="w-12"></th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                      <tr
                        v-for="(item, index) in form.itens"
                        :key="index"
                        class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <td class="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {{ getProdutoNome(item.produto_id) }}
                        </td>
                        <td class="px-4 py-3 text-center">
                          <input
                            type="number"
                            v-model.number="item.quantidade"
                            class="input w-16 text-center text-sm"
                            min="1"
                            step="1"
                          />
                        </td>
                        <td class="px-4 py-3 text-sm text-gray-900 dark:text-white text-right">
                          {{ formatCurrency(item.valor_unitario) }}
                        </td>
                        <td class="px-4 py-3 text-center">
                          <button
                            @click="removerItem(index)"
                            class="text-red-500 hover:text-red-700 transition-colors"
                            title="Remover"
                          >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                            </svg>
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <!-- Mobile: Cards -->
                <div class="sm:hidden space-y-2">
                  <div
                    v-for="(item, index) in form.itens"
                    :key="index"
                    class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {{ getProdutoNome(item.produto_id) }}
                      </p>
                      <p class="text-xs text-gray-500 dark:text-gray-400">
                        {{ formatCurrency(item.valor_unitario) }}
                      </p>
                    </div>
                    <div class="flex items-center gap-2">
                      <input
                        type="number"
                        v-model.number="item.quantidade"
                        class="input w-16 text-center text-sm"
                        min="1"
                        step="1"
                      />
                      <button
                        @click="removerItem(index)"
                        class="w-8 h-8 flex items-center justify-center text-red-500 hover:text-red-700 transition-colors"
                        title="Remover"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Empty State -->
              <div v-else class="text-center py-8 sm:py-12 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                <div class="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 mb-3 sm:mb-4">
                  <svg class="w-12 h-12 sm:w-16 sm:h-16 text-gray-200 dark:text-gray-700" viewBox="0 0 100 100" fill="currentColor">
                    <circle cx="50" cy="30" r="8"/>
                    <circle cx="35" cy="50" r="6"/>
                    <circle cx="65" cy="50" r="6"/>
                    <ellipse cx="50" cy="70" rx="25" ry="10"/>
                  </svg>
                </div>
                <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Nenhum item cadastrado</p>
              </div>
            </div>

            <!-- Secao: Detalhe da Entrega -->
            <div class="border-t border-gray-200 dark:border-gray-700 pt-4 sm:pt-6 mt-6">
              <button
                @click="showDetalheEntrega = !showDetalheEntrega"
                class="flex items-center justify-between w-full text-left"
              >
                <h3 class="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">Detalhe da Entrega</h3>
                <svg
                  :class="['w-5 h-5 text-gray-400 transition-transform', showDetalheEntrega ? 'rotate-180' : '']"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                </svg>
              </button>

              <div v-if="showDetalheEntrega" class="mt-4 space-y-4">
                <!-- Logistica -->
                <div>
                  <label class="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-1.5">
                    Logistica
                  </label>
                  <select v-model="form.logistica" class="input w-full text-sm">
                    <option value="">Selecione...</option>
                    <option value="transporte">Transporte</option>
                    <option value="retirada">Retirada</option>
                    <option value="correios">Correios</option>
                  </select>
                </div>

                <!-- Documento -->
                <div>
                  <label class="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-1.5">
                    Documento
                  </label>
                  <select v-model="form.documento" class="input w-full text-sm">
                    <option value="">Selecione...</option>
                    <option value="nf">Nota Fiscal</option>
                    <option value="boleto">Boleto</option>
                    <option value="recibo">Recibo</option>
                  </select>
                </div>

                <!-- Valor do Frete e Tipo -->
                <div class="grid grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label class="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-1.5">
                      Valor do Frete
                    </label>
                    <input
                      type="number"
                      v-model.number="form.valorFrete"
                      class="input w-full text-sm"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label class="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-1.5">
                      Tipo
                    </label>
                    <select v-model="form.tipo" class="input w-full text-sm">
                      <option value="">Selecione...</option>
                      <option value="venda">Venda</option>
                      <option value="consignacao">Consignacao</option>
                      <option value="bonificacao">Bonificacao</option>
                    </select>
                  </div>
                </div>

                <!-- Nota Fiscal e Valor da NF -->
                <div class="grid grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label class="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-1.5">
                      Nota Fiscal
                    </label>
                    <input
                      type="text"
                      v-model="form.notaFiscal"
                      class="input w-full text-sm"
                      placeholder="Numero da NF"
                    />
                  </div>
                  <div>
                    <label class="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-1.5">
                      Valor da NF
                    </label>
                    <input
                      type="text"
                      :value="formatCurrency(valorTotal)"
                      class="input w-full text-sm bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                      disabled
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="flex items-center justify-end gap-3 px-4 sm:px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl flex-shrink-0">
            <button
              @click="$emit('close')"
              class="btn btn-secondary"
            >
              Cancelar
            </button>
            <button
              @click="handleSave"
              class="btn btn-primary"
              :disabled="!isFormValid"
            >
              Salvar
            </button>
          </div>
            </div>
          </Transition>
        </div>
      </div>
    </Transition>

    <!-- Modal Lista de Tabelas de Preco -->
    <ModalListaTabelasPreco
      v-if="showModalListaTabelas"
      :tabelas="tabelasPrecoLocal"
      @close="closeModalListaTabelas"
      @nova-tabela="onNovaTabela"
      @editar-tabela="onEditarTabela"
    />

    <!-- Modal Editar/Criar Tabela de Preco -->
    <ModalTabelaPreco
      v-if="showModalTabelaPreco"
      :tabela="tabelaSelecionada"
      :produtos="produtos"
      :tabela-preco-itens="tabelaPrecoItensModal"
      @close="closeModalTabelaPreco"
      @save="handleSaveTabelaPreco"
    />
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'

interface Cliente {
  id: string
  razao_social: string
  nome_fantasia: string | null
}

interface Produto {
  id: string
  codigo: string
  nome: string
  preco_padrao: number | null
}

interface TabelaPreco {
  id: string
  nome: string
}

interface TabelaPrecoItem {
  id?: string
  tabela_preco_id: string
  produto_id: string
  preco: number
  produtos?: Produto
}

interface ItemPedido {
  id?: string
  produto_id: string
  quantidade: number
  valor_unitario: number
  produtos?: Produto
}

interface Pedido {
  id: string
  numero: string
  data_pedido: string
  data_entrega: string | null
  cliente_id: string | null
  tabela_preco_id: string | null
  status: string
  logistica: string | null
  documento: string | null
  valor_frete: number | null
  tipo: string | null
  nota_fiscal: string | null
  valor_nf: number | null
}

const props = defineProps<{
  pedido: Pedido | null
  itens: ItemPedido[]
  clientes: Cliente[]
  produtos: Produto[]
  tabelasPreco: TabelaPreco[]
}>()

const emit = defineEmits<{
  close: []
  save: [data: any]
  'refresh-tabelas': []
}>()

const supabase = useSupabaseClient()
const { currentCompany } = useCurrentCompany()
const { success, error: showError } = useToast()

// Lista local de tabelas (pode ser atualizada quando criar nova)
const tabelasPrecoLocal = ref<TabelaPreco[]>([])

// Formulario principal
const form = ref({
  dataEntrega: '',
  clienteId: '',
  tabelaPrecoId: '',
  status: 'previsto',
  logistica: '',
  documento: '',
  valorFrete: 0 as number,
  tipo: '',
  notaFiscal: '',
  itens: [] as ItemPedido[]
})

// Formulario de item
const itemForm = ref({
  produtoId: '',
  quantidade: 1,
  valorUnitario: 0
})

// UI State
const showDetalheEntrega = ref(false)

// Modais
const showModalListaTabelas = ref(false)
const showModalTabelaPreco = ref(false)
const tabelaSelecionada = ref<TabelaPreco | null>(null)
const tabelaPrecoItens = ref<TabelaPrecoItem[]>([])
const tabelaPrecoItensModal = ref<TabelaPrecoItem[]>([])
const savingTabela = ref(false)

// Inicializar dados
onMounted(() => {
  tabelasPrecoLocal.value = [...props.tabelasPreco]

  // Carregar dados do pedido
  if (props.pedido) {
    form.value = {
      dataEntrega: props.pedido.data_entrega || '',
      clienteId: props.pedido.cliente_id || '',
      tabelaPrecoId: props.pedido.tabela_preco_id || '',
      status: props.pedido.status || 'previsto',
      logistica: props.pedido.logistica || '',
      documento: props.pedido.documento || '',
      valorFrete: props.pedido.valor_frete || 0,
      tipo: props.pedido.tipo || '',
      notaFiscal: props.pedido.nota_fiscal || '',
      itens: []
    }

    // Carregar itens da tabela de preco se houver
    if (form.value.tabelaPrecoId) {
      onTabelaPrecoChange()
    }
  }

  // Carregar itens do pedido
  if (props.itens && props.itens.length > 0) {
    form.value.itens = props.itens.map(item => ({
      id: item.id,
      produto_id: item.produto_id,
      quantidade: item.quantidade,
      valor_unitario: item.valor_unitario,
      produtos: item.produtos
    }))
  }
})

// Computed
const quantidadeTotal = computed(() => {
  return form.value.itens.reduce((total, item) => total + item.quantidade, 0)
})

const valorTotal = computed(() => {
  return form.value.itens.reduce((total, item) => total + (item.quantidade * item.valor_unitario), 0)
})

const isFormValid = computed(() => {
  return form.value.clienteId && form.value.itens.length > 0
})

// Funcoes
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function getProdutoNome(produtoId: string): string {
  const produto = props.produtos.find(p => p.id === produtoId)
  if (produto) return produto.nome

  // Tentar encontrar nos itens existentes
  const item = form.value.itens.find(i => i.produto_id === produtoId)
  return item?.produtos?.nome || '-'
}

function getPrecoFromTabela(produtoId: string): number | null {
  const item = tabelaPrecoItens.value.find(i => i.produto_id === produtoId)
  return item?.preco || null
}

async function onTabelaPrecoChange() {
  if (!form.value.tabelaPrecoId) {
    tabelaPrecoItens.value = []
    return
  }

  try {
    const { data, error } = await supabase
      .from('tabela_preco_itens')
      .select('*, produtos(id, codigo, nome)')
      .eq('tabela_preco_id', form.value.tabelaPrecoId)

    if (error) throw error
    tabelaPrecoItens.value = data || []
  } catch (e: any) {
    console.error('Erro ao carregar itens da tabela de preco:', e)
    tabelaPrecoItens.value = []
  }
}

function onProdutoChange() {
  const produto = props.produtos.find(p => p.id === itemForm.value.produtoId)

  // Primeiro tenta pegar o preco da tabela de preco selecionada
  const precoTabela = getPrecoFromTabela(itemForm.value.produtoId)

  if (precoTabela !== null) {
    itemForm.value.valorUnitario = precoTabela
  } else if (produto?.preco_padrao) {
    itemForm.value.valorUnitario = produto.preco_padrao
  } else {
    itemForm.value.valorUnitario = 0
  }
}

function adicionarItem() {
  if (!itemForm.value.produtoId) {
    return
  }
  if (!itemForm.value.quantidade || itemForm.value.quantidade <= 0) {
    return
  }
  if (itemForm.value.valorUnitario < 0) {
    return
  }

  form.value.itens.push({
    produto_id: itemForm.value.produtoId,
    quantidade: itemForm.value.quantidade,
    valor_unitario: itemForm.value.valorUnitario
  })

  // Limpar form do item
  itemForm.value = {
    produtoId: '',
    quantidade: 1,
    valorUnitario: 0
  }
}

function removerItem(index: number) {
  form.value.itens.splice(index, 1)
}

function handleSave() {
  if (!isFormValid.value) return

  emit('save', {
    data_entrega: form.value.dataEntrega || null,
    cliente_id: form.value.clienteId || null,
    tabela_preco_id: form.value.tabelaPrecoId || null,
    status: form.value.status,
    valor_total: valorTotal.value,
    logistica: form.value.logistica || null,
    documento: form.value.documento || null,
    valor_frete: form.value.valorFrete || null,
    tipo: form.value.tipo || null,
    nota_fiscal: form.value.notaFiscal || null,
    valor_nf: valorTotal.value,
    itens: form.value.itens.map(item => ({
      produto_id: item.produto_id,
      quantidade: item.quantidade,
      valor_unitario: item.valor_unitario
    }))
  })
}

// Modal Lista de Tabelas
function openModalListaTabelas() {
  showModalListaTabelas.value = true
}

function closeModalListaTabelas() {
  showModalListaTabelas.value = false
}

// Handlers para lista de tabelas
function onNovaTabela() {
  closeModalListaTabelas()
  tabelaSelecionada.value = null
  tabelaPrecoItensModal.value = []
  showModalTabelaPreco.value = true
}

async function onEditarTabela(tabela: TabelaPreco) {
  closeModalListaTabelas()
  tabelaSelecionada.value = tabela

  // Carregar itens da tabela
  try {
    const { data, error } = await supabase
      .from('tabela_preco_itens')
      .select('*, produtos(id, codigo, nome)')
      .eq('tabela_preco_id', tabela.id)

    if (error) throw error
    tabelaPrecoItensModal.value = data || []
  } catch (e: any) {
    console.error('Erro ao carregar itens:', e)
    tabelaPrecoItensModal.value = []
  }

  showModalTabelaPreco.value = true
}

// Modal Tabela de Preco
function closeModalTabelaPreco() {
  showModalTabelaPreco.value = false
  tabelaSelecionada.value = null
  tabelaPrecoItensModal.value = []
}

async function handleSaveTabelaPreco(tabelaData: any) {
  if (!currentCompany.value?.id) {
    showError('Nenhuma empresa selecionada')
    return
  }

  if (savingTabela.value) return
  savingTabela.value = true

  try {
    if (tabelaData.id) {
      // Atualizar tabela existente
      const { error: updateError } = await supabase
        .from('tabelas_preco')
        .update({ nome: tabelaData.nome })
        .eq('id', tabelaData.id)

      if (updateError) throw updateError

      // Deletar itens antigos
      await supabase
        .from('tabela_preco_itens')
        .delete()
        .eq('tabela_preco_id', tabelaData.id)

      // Inserir novos itens
      if (tabelaData.itens && tabelaData.itens.length > 0) {
        const itensToInsert = tabelaData.itens.map((item: any) => ({
          tabela_preco_id: tabelaData.id,
          produto_id: item.produto_id,
          preco: item.preco
        }))

        const { error: itensError } = await supabase
          .from('tabela_preco_itens')
          .insert(itensToInsert)

        if (itensError) throw itensError
      }

      // Atualizar lista local
      const index = tabelasPrecoLocal.value.findIndex(t => t.id === tabelaData.id)
      if (index !== -1) {
        tabelasPrecoLocal.value[index].nome = tabelaData.nome
      }

      success('Tabela de preco atualizada')
    } else {
      // Criar nova tabela
      const { data: novaTabela, error: insertError } = await supabase
        .from('tabelas_preco')
        .insert({
          empresa_id: currentCompany.value.id,
          nome: tabelaData.nome,
          ativo: true
        })
        .select()
        .single()

      if (insertError) throw insertError

      // Inserir itens
      if (tabelaData.itens && tabelaData.itens.length > 0) {
        const itensToInsert = tabelaData.itens.map((item: any) => ({
          tabela_preco_id: novaTabela.id,
          produto_id: item.produto_id,
          preco: item.preco
        }))

        const { error: itensError } = await supabase
          .from('tabela_preco_itens')
          .insert(itensToInsert)

        if (itensError) throw itensError
      }

      // Adicionar a nova tabela na lista local
      tabelasPrecoLocal.value.push({ id: novaTabela.id, nome: novaTabela.nome })

      // Selecionar a nova tabela automaticamente
      form.value.tabelaPrecoId = novaTabela.id

      success('Tabela de preco criada')
    }

    // Recarregar tabela de precos e itens
    emit('refresh-tabelas')
    await onTabelaPrecoChange()
    closeModalTabelaPreco()
  } catch (e: any) {
    console.error('Erro ao salvar tabela de preco:', e)
    showError(e.message || 'Erro ao salvar tabela de preco')
  } finally {
    savingTabela.value = false
  }
}
</script>
