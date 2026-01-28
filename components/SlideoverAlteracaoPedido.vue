<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 overflow-hidden">
      <!-- Backdrop -->
      <div
        class="fixed inset-0 bg-black/50 transition-opacity"
        @click="$emit('close')"
      ></div>

      <!-- Slideover Panel -->
      <div class="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div class="w-screen max-w-2xl">
          <div class="flex h-full flex-col bg-white dark:bg-gray-900 shadow-xl">
            <!-- Header -->
            <div class="px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
                Alteracao de pedido
              </h2>
              <div class="flex items-center gap-3">
                <button
                  @click="$emit('close')"
                  class="btn btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  @click="handleSave"
                  class="btn btn-primary"
                >
                  Salvar
                </button>
              </div>
            </div>

            <!-- Content -->
            <div class="flex-1 overflow-y-auto">
              <div class="px-6 py-6">
                <!-- Linha 1: Codigo, Previsao de Entrega, Cliente -->
                <div class="flex items-start gap-4 mb-6">
                  <!-- Codigo do Pedido -->
                  <div class="flex-shrink-0">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Codigo do pedido
                    </label>
                    <input
                      type="text"
                      :value="pedido?.numero"
                      class="input w-28 bg-gray-100 dark:bg-gray-800"
                      disabled
                    />
                  </div>

                  <!-- Previsao de Entrega -->
                  <div class="flex-shrink-0">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Previsao de entrega
                    </label>
                    <input
                      type="date"
                      v-model="form.dataEntrega"
                      class="input w-40"
                    />
                  </div>

                  <!-- Cliente -->
                  <div class="flex-1">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Cliente
                    </label>
                    <select v-model="form.clienteId" class="input">
                      <option value="">Selecione...</option>
                      <option v-for="cliente in clientes" :key="cliente.id" :value="cliente.id">
                        {{ cliente.razao_social || cliente.nome_fantasia }}
                      </option>
                    </select>
                  </div>
                </div>

                <!-- Linha 2: Tabela de Preco -->
                <div class="flex items-end gap-3 mb-8">
                  <div class="flex-1">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Tabela de preco
                    </label>
                    <select v-model="form.tabelaPrecoId" class="input">
                      <option value="">Selecione...</option>
                      <option v-for="tabela in tabelasPreco" :key="tabela.id" :value="tabela.id">
                        {{ tabela.nome }}
                      </option>
                    </select>
                  </div>
                  <button
                    type="button"
                    class="w-10 h-10 flex items-center justify-center bg-primary text-white rounded-full hover:bg-primary-dark transition-colors flex-shrink-0"
                    title="Adicionar tabela de preco"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                    </svg>
                  </button>
                </div>

                <!-- Secao: Item do Pedido -->
                <div class="border-t border-gray-200 dark:border-gray-700 pt-6 mb-6">
                  <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-4">Item do pedido</h3>

                  <div class="flex items-end gap-3 mb-4">
                    <!-- Produto -->
                    <div class="flex-1">
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Produto
                      </label>
                      <select v-model="itemForm.produtoId" class="input" @change="onProdutoChange">
                        <option value="">Selecione...</option>
                        <option v-for="produto in produtos" :key="produto.id" :value="produto.id">
                          {{ produto.nome }}
                        </option>
                      </select>
                    </div>

                    <!-- Quantidade -->
                    <div class="w-28">
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Quantidade
                      </label>
                      <input
                        type="number"
                        v-model.number="itemForm.quantidade"
                        class="input"
                        min="1"
                        step="1"
                      />
                    </div>

                    <!-- Valor Unitario -->
                    <div class="w-32">
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Valor unitario
                      </label>
                      <input
                        type="number"
                        v-model.number="itemForm.valorUnitario"
                        class="input"
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <!-- Botao Adicionar -->
                    <button
                      @click="adicionarItem"
                      type="button"
                      class="w-10 h-10 flex items-center justify-center bg-primary text-white rounded-full hover:bg-primary-dark transition-colors flex-shrink-0"
                      title="Adicionar item"
                    >
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                      </svg>
                    </button>
                  </div>

                  <!-- Totais -->
                  <div class="flex gap-6 text-sm text-gray-600 dark:text-gray-400 mb-4">
                    <p>Quantidade Total de Produtos Registrados: <span class="font-semibold text-gray-900 dark:text-white">{{ quantidadeTotal }}</span></p>
                    <p>Valor Total dos Produtos do Pedido: <span class="font-semibold text-gray-900 dark:text-white">{{ formatCurrency(valorTotal) }}</span></p>
                  </div>

                  <!-- Tabela de Itens -->
                  <div v-if="form.itens.length > 0" class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <table class="w-full">
                      <thead class="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                        <tr>
                          <th class="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3">
                            Produto
                          </th>
                          <th class="text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 w-24">
                            Quantidade
                          </th>
                          <th class="text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3">
                            Valor
                          </th>
                          <th class="w-12"></th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                        <tr
                          v-for="(item, index) in paginatedItens"
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
                              class="input w-20 text-center text-sm"
                              min="1"
                              @change="recalcularTotal"
                            />
                          </td>
                          <td class="px-4 py-3 text-sm text-gray-900 dark:text-white text-right">
                            {{ formatCurrency(item.quantidade * item.valor_unitario) }}
                          </td>
                          <td class="px-4 py-3 text-center">
                            <button
                              @click="removerItem(index + ((currentPageItens - 1) * itensPerPage))"
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

                    <!-- Paginacao dos Itens -->
                    <div v-if="totalPagesItens > 1" class="flex items-center justify-center gap-2 py-3 border-t border-gray-200 dark:border-gray-700">
                      <button
                        @click="currentPageItens = Math.max(1, currentPageItens - 1)"
                        :disabled="currentPageItens === 1"
                        class="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg class="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                        </svg>
                      </button>
                      <template v-for="page in totalPagesItens" :key="page">
                        <button
                          @click="currentPageItens = page"
                          :class="[
                            'w-8 h-8 rounded text-sm font-medium transition-colors',
                            currentPageItens === page
                              ? 'bg-primary text-white'
                              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                          ]"
                        >
                          {{ page }}
                        </button>
                      </template>
                      <button
                        @click="currentPageItens = Math.min(totalPagesItens, currentPageItens + 1)"
                        :disabled="currentPageItens === totalPagesItens"
                        class="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg class="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Secao: Detalhe da Entrega -->
                <div class="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <button
                    @click="showDetalheEntrega = !showDetalheEntrega"
                    class="flex items-center justify-between w-full text-left"
                  >
                    <h3 class="text-base font-semibold text-gray-900 dark:text-white">Detalhe da Entrega</h3>
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
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Logistica
                      </label>
                      <div class="flex items-center gap-2">
                        <select v-model="form.logistica" class="input flex-1">
                          <option value="">Selecione...</option>
                          <option value="transporte">Transporte</option>
                          <option value="retirada">Retirada</option>
                          <option value="correios">Correios</option>
                        </select>
                        <span class="w-6 h-6 flex items-center justify-center bg-green-100 text-green-600 rounded-full">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                          </svg>
                        </span>
                      </div>
                    </div>

                    <!-- Documento -->
                    <div>
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Documento
                      </label>
                      <select v-model="form.documento" class="input">
                        <option value="">Documento</option>
                        <option value="nf">Nota Fiscal</option>
                        <option value="boleto">Boleto</option>
                        <option value="recibo">Recibo</option>
                      </select>
                    </div>

                    <!-- Valor do Frete e Tipo -->
                    <div class="grid grid-cols-2 gap-4">
                      <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                          Valor do Frete
                        </label>
                        <input
                          type="text"
                          v-model="form.valorFrete"
                          class="input"
                          placeholder="R$0"
                        />
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                          Tipo
                        </label>
                        <select v-model="form.tipo" class="input">
                          <option value="">Tipo pedido</option>
                          <option value="venda">Venda</option>
                          <option value="consignacao">Consignacao</option>
                          <option value="bonificacao">Bonificacao</option>
                        </select>
                      </div>
                    </div>

                    <!-- Nota Fiscal e Valor da NF -->
                    <div class="grid grid-cols-2 gap-4">
                      <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                          Nota Fiscal
                        </label>
                        <select v-model="form.notaFiscal" class="input">
                          <option value="">Nota Fiscal</option>
                        </select>
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                          Valor da NF
                        </label>
                        <input
                          type="text"
                          :value="formatCurrency(valorTotal)"
                          class="input bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                          disabled
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
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

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

interface PedidoItem {
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
  itens: PedidoItem[]
  clientes: Cliente[]
  produtos: Produto[]
  tabelasPreco: TabelaPreco[]
}>()

const emit = defineEmits<{
  close: []
  save: [data: any]
}>()

// Formulario principal
const form = ref({
  dataEntrega: '',
  clienteId: '',
  tabelaPrecoId: '',
  status: 'previsto',
  logistica: '',
  documento: '',
  valorFrete: '',
  tipo: '',
  notaFiscal: '',
  itens: [] as PedidoItem[]
})

// Formulario de item
const itemForm = ref({
  produtoId: '',
  quantidade: 1,
  valorUnitario: 0
})

// UI State
const showDetalheEntrega = ref(true)
const currentPageItens = ref(1)
const itensPerPage = 5

// Carregar dados do pedido
watch(() => props.pedido, (novoPedido) => {
  if (novoPedido) {
    form.value = {
      dataEntrega: novoPedido.data_entrega || '',
      clienteId: novoPedido.cliente_id || '',
      tabelaPrecoId: novoPedido.tabela_preco_id || '',
      status: novoPedido.status || 'previsto',
      logistica: novoPedido.logistica || '',
      documento: novoPedido.documento || '',
      valorFrete: novoPedido.valor_frete ? `R$${novoPedido.valor_frete}` : '',
      tipo: novoPedido.tipo || '',
      notaFiscal: novoPedido.nota_fiscal || '',
      itens: []
    }
  }
}, { immediate: true })

watch(() => props.itens, (novosItens) => {
  form.value.itens = novosItens.map(item => ({
    id: item.id,
    produto_id: item.produto_id,
    quantidade: item.quantidade,
    valor_unitario: item.valor_unitario,
    produtos: item.produtos
  }))
}, { immediate: true })

// Computed
const quantidadeTotal = computed(() => {
  return form.value.itens.reduce((total, item) => total + item.quantidade, 0)
})

const valorTotal = computed(() => {
  return form.value.itens.reduce((total, item) => total + (item.quantidade * item.valor_unitario), 0)
})

const totalPagesItens = computed(() => Math.ceil(form.value.itens.length / itensPerPage) || 1)

const paginatedItens = computed(() => {
  const start = (currentPageItens.value - 1) * itensPerPage
  return form.value.itens.slice(start, start + itensPerPage)
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

function onProdutoChange() {
  const produto = props.produtos.find(p => p.id === itemForm.value.produtoId)
  if (produto?.preco_padrao) {
    itemForm.value.valorUnitario = produto.preco_padrao
  }
}

function adicionarItem() {
  if (!itemForm.value.produtoId) return
  if (!itemForm.value.quantidade || itemForm.value.quantidade <= 0) return
  if (itemForm.value.valorUnitario < 0) return

  form.value.itens.push({
    produto_id: itemForm.value.produtoId,
    quantidade: itemForm.value.quantidade,
    valor_unitario: itemForm.value.valorUnitario
  })

  itemForm.value = {
    produtoId: '',
    quantidade: 1,
    valorUnitario: 0
  }
}

function removerItem(index: number) {
  form.value.itens.splice(index, 1)
}

function recalcularTotal() {
  // Trigger recompute
}

function handleSave() {
  // Extrair valor do frete
  let valorFrete = 0
  if (form.value.valorFrete) {
    const match = form.value.valorFrete.match(/[\d.,]+/)
    if (match) {
      valorFrete = parseFloat(match[0].replace(',', '.'))
    }
  }

  emit('save', {
    data_entrega: form.value.dataEntrega || null,
    cliente_id: form.value.clienteId || null,
    tabela_preco_id: form.value.tabelaPrecoId || null,
    status: form.value.status,
    valor_total: valorTotal.value,
    logistica: form.value.logistica || null,
    documento: form.value.documento || null,
    valor_frete: valorFrete || null,
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
</script>
