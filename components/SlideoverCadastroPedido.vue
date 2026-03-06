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
                Cadastro de pedido
              </h2>
              <div class="flex items-center gap-3">
                <button
                  @click="$emit('close')"
                  class="btn btn-secondary"
                >
                  Voltar
                </button>
                <button
                  @click="handleSave"
                  class="btn btn-primary"
                  :disabled="!isFormValid"
                >
                  Cadastrar
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
                      Código do pedido
                    </label>
                    <input
                      type="text"
                      :value="proximoCodigo"
                      class="input w-28 bg-gray-100 dark:bg-gray-800"
                      disabled
                    />
                  </div>

                  <!-- Previsao de Entrega -->
                  <div class="flex-shrink-0">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Previsão de entrega
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
                      Tabela de preço
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
                    title="Adicionar tabela de preço"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                    </svg>
                  </button>
                </div>

                <!-- Secao: Item do Pedido -->
                <div class="border-t border-gray-200 dark:border-gray-700 pt-6">
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
                        Valor unitário
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
                          <th class="text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3">
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
                          v-for="(item, index) in form.itens"
                          :key="index"
                          class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                        >
                          <td class="px-4 py-3 text-sm text-gray-900 dark:text-white">
                            {{ getProdutoNome(item.produto_id) }}
                          </td>
                          <td class="px-4 py-3 text-sm text-gray-900 dark:text-white text-center">
                            {{ item.quantidade }}
                          </td>
                          <td class="px-4 py-3 text-sm text-gray-900 dark:text-white text-right">
                            {{ formatCurrency(item.quantidade * item.valor_unitario) }}
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

                  <!-- Empty State -->
                  <div v-else class="text-center py-12 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                    <div class="inline-flex items-center justify-center w-16 h-16 mb-4">
                      <svg class="w-16 h-16 text-gray-200 dark:text-gray-700" viewBox="0 0 100 100" fill="currentColor">
                        <circle cx="50" cy="30" r="8"/>
                        <circle cx="35" cy="50" r="6"/>
                        <circle cx="65" cy="50" r="6"/>
                        <ellipse cx="50" cy="70" rx="25" ry="10"/>
                      </svg>
                    </div>
                    <p class="text-sm text-gray-500 dark:text-gray-400">Nenhum item cadastrado até o momento</p>
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

interface ItemPedido {
  produto_id: string
  quantidade: number
  valor_unitario: number
}

const props = defineProps<{
  clientes: Cliente[]
  produtos: Produto[]
  tabelasPreco: TabelaPreco[]
  proximoCodigo: string
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
  itens: [] as ItemPedido[]
})

// Formulario de item
const itemForm = ref({
  produtoId: '',
  quantidade: 1,
  valorUnitario: 0
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
  return produto?.nome || '-'
}

function onProdutoChange() {
  const produto = props.produtos.find(p => p.id === itemForm.value.produtoId)
  if (produto?.preco_padrao) {
    itemForm.value.valorUnitario = produto.preco_padrao
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
    numero: props.proximoCodigo,
    data_entrega: form.value.dataEntrega || null,
    cliente_id: form.value.clienteId || null,
    tabela_preco_id: form.value.tabelaPrecoId || null,
    valor_total: valorTotal.value,
    itens: form.value.itens
  })
}
</script>
