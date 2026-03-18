<template>
  <div class="fixed inset-0 z-[95] overflow-y-auto">
    <!-- Backdrop -->
    <div
      class="fixed inset-0 glass-backdrop transition-opacity"
      @click="$emit('close')"
    ></div>

    <!-- Modal -->
    <div class="flex min-h-full items-center justify-center p-2 sm:p-4">
      <div class="relative w-full max-w-md glass-panel rounded-xl shadow-xl transform transition-all max-h-[90vh] flex flex-col">
        <!-- Header com icone -->
        <div class="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <svg class="w-5 h-5 sm:w-6 sm:h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <div class="min-w-0">
            <h2 class="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Tabela de preço</h2>
            <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Cadastro de tabelas de preços</p>
          </div>
        </div>

        <!-- Content -->
        <div class="px-4 sm:px-6 py-4 sm:py-6 overflow-y-auto flex-1">
          <!-- Nome da Tabela -->
          <div class="mb-4 sm:mb-6">
            <label class="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-1.5">
              Nome da tabela
            </label>
            <input
              type="text"
              v-model="form.nome"
              class="input w-full text-sm"
              placeholder="Ex: Distribuidor, Varejo, Atacado..."
            />
          </div>

          <!-- Adicionar Produto -->
          <div class="mb-4 sm:mb-6">
            <div class="flex items-end gap-2 sm:gap-3">
              <div class="flex-1 min-w-0">
                <label class="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-1.5">
                  Adicionar produto
                </label>
                <select v-model="itemForm.produtoId" class="input w-full text-sm">
                  <option value="">Selecione...</option>
                  <option
                    v-for="produto in produtosDisponiveis"
                    :key="produto.id"
                    :value="produto.id"
                  >
                    {{ produto.nome }}
                  </option>
                </select>
              </div>
              <div class="w-28 sm:w-32 flex-shrink-0">
                <label class="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-1.5">
                  Valor
                </label>
                <div class="relative">
                  <span class="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-subtext-light dark:text-subtext-dark">R$</span>
                  <input
                    type="text"
                    :value="itemForm.precoFormatado"
                    @input="onPrecoInput"
                    class="input w-full text-sm text-right pl-8"
                    placeholder="0,00"
                    inputmode="numeric"
                  />
                </div>
              </div>
              <button
                @click="adicionarItem"
                type="button"
                class="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-primary text-white rounded-full hover:bg-primary-dark transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Adicionar produto"
                :disabled="!canAddItem"
              >
                <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Lista de Itens -->
          <div v-if="form.itens.length > 0" class="space-y-2 max-h-48 sm:max-h-64 overflow-y-auto">
            <div
              v-for="(item, index) in form.itens"
              :key="item.produto_id"
              class="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
            >
              <div class="flex-1 min-w-0">
                <p class="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">
                  {{ getProdutoNome(item.produto_id) }}
                </p>
              </div>
              <div class="w-28 sm:w-32 flex-shrink-0">
                <div class="relative">
                  <span class="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-subtext-light dark:text-subtext-dark">R$</span>
                  <input
                    type="text"
                    :value="item.precoFormatado"
                    @input="(e) => onItemPrecoInput(e, index)"
                    class="input w-full text-right text-xs sm:text-sm pl-8"
                    inputmode="numeric"
                  />
                </div>
              </div>
              <button
                @click="removerItem(index)"
                class="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                title="Remover"
              >
                <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else class="text-center py-6 sm:py-8 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
            <svg class="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-gray-300 dark:text-gray-600 mb-2 sm:mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
            <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Nenhum produto adicionado</p>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 dark:border-gray-700 flex gap-2 sm:gap-3 flex-shrink-0">
          <button
            @click="$emit('close')"
            class="flex-1 btn btn-secondary justify-center text-sm"
          >
            Voltar
          </button>
          <button
            @click="handleSave"
            class="flex-1 btn btn-primary justify-center text-sm"
            :disabled="!canSave || saving"
          >
            <span v-if="saving" class="material-icons-outlined text-sm animate-spin mr-2">refresh</span>
            Salvar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

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
  tabela_preco_id?: string
  produto_id: string
  preco: number
  produtos?: Produto
}

interface ItemForm {
  produto_id: string
  preco: number
  precoFormatado: string
}

const props = defineProps<{
  tabela: TabelaPreco | null
  produtos: Produto[]
  tabelaPrecoItens: TabelaPrecoItem[]
}>()

const emit = defineEmits<{
  close: []
  save: [data: any]
}>()

// Estado
const saving = ref(false)

// Formulario principal
const form = ref({
  nome: '',
  itens: [] as ItemForm[]
})

// Formulario de item
const itemForm = ref({
  produtoId: '',
  preco: 0,
  precoFormatado: '0,00'
})

// Computed
const produtosDisponiveis = computed(() => {
  const idsUsados = form.value.itens.map(i => i.produto_id)
  return props.produtos.filter(p => !idsUsados.includes(p.id))
})

const canAddItem = computed(() => {
  return itemForm.value.produtoId && itemForm.value.preco > 0
})

const canSave = computed(() => {
  return form.value.nome.trim().length > 0
})

// Inicializar formulario
onMounted(() => {
  if (props.tabela) {
    form.value.nome = props.tabela.nome
    form.value.itens = props.tabelaPrecoItens.map(item => ({
      produto_id: item.produto_id,
      preco: item.preco,
      precoFormatado: formatMonetario(item.preco)
    }))
  }
})

// Formatação monetária estilo banco
function formatMonetario(value: number): string {
  const cents = Math.round(Number(value) * 100)
  const reais = (cents / 100).toFixed(2)
  const [intPart, decPart] = reais.split('.')
  const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${formatted},${decPart}`
}

function onPrecoInput(e: Event) {
  const target = e.target as HTMLInputElement
  const raw = target.value.replace(/\D/g, '')
  if (!raw) {
    itemForm.value.preco = 0
    itemForm.value.precoFormatado = '0,00'
    target.value = '0,00'
    return
  }
  const cents = parseInt(raw, 10)
  const reais = cents / 100
  itemForm.value.preco = reais
  itemForm.value.precoFormatado = formatMonetario(reais)
  target.value = itemForm.value.precoFormatado
}

function onItemPrecoInput(e: Event, index: number) {
  const target = e.target as HTMLInputElement
  const raw = target.value.replace(/\D/g, '')
  const item = form.value.itens[index]
  if (!raw) {
    item.preco = 0
    item.precoFormatado = '0,00'
    target.value = '0,00'
    return
  }
  const cents = parseInt(raw, 10)
  const reais = cents / 100
  item.preco = reais
  item.precoFormatado = formatMonetario(reais)
  target.value = item.precoFormatado
}

function getProdutoNome(produtoId: string): string {
  const produto = props.produtos.find(p => p.id === produtoId)
  return produto?.nome || '-'
}

function adicionarItem() {
  if (!canAddItem.value) return

  form.value.itens.push({
    produto_id: itemForm.value.produtoId,
    preco: itemForm.value.preco,
    precoFormatado: formatMonetario(itemForm.value.preco)
  })

  // Limpar form do item
  itemForm.value = {
    produtoId: '',
    preco: 0,
    precoFormatado: '0,00'
  }
}

function removerItem(index: number) {
  form.value.itens.splice(index, 1)
}

function handleSave() {
  if (!canSave.value) return

  saving.value = true

  // Converte para o formato esperado pelo parent
  const itensParaSalvar = form.value.itens.map(item => ({
    produto_id: item.produto_id,
    preco: item.preco
  }))

  emit('save', {
    id: props.tabela?.id || null,
    nome: form.value.nome.trim(),
    itens: itensParaSalvar
  })
}
</script>
