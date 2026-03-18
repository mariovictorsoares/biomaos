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

        <!-- Modal -->
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
        <div class="flex items-center justify-between px-6 py-5 border-b border-gray-200">
          <h2 class="text-xl font-semibold text-gray-900">Alterar estoque</h2>
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
            >
              Alterar
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="px-6 py-6">
          <!-- Item do Estoque -->
          <div class="mb-6">
            <h3 class="text-base font-medium text-gray-900 mb-4">Item do Estoque</h3>

            <!-- Adicionar novo item -->
            <div class="flex items-end gap-3 mb-6">
              <div class="flex-1">
                <label class="block text-xs font-medium text-gray-500 mb-1.5">Produto</label>
                <select v-model="novoProduto" class="input">
                  <option value="">Selecione um produto</option>
                  <option
                    v-for="produto in produtosDisponiveis"
                    :key="produto.codigo"
                    :value="produto.codigo"
                  >
                    {{ produto.nome }}
                  </option>
                </select>
              </div>
              <div class="w-32">
                <label class="block text-xs font-medium text-gray-500 mb-1.5">Quantidade</label>
                <input
                  type="number"
                  v-model.number="novaQuantidade"
                  placeholder="0"
                  class="input"
                  min="0"
                />
              </div>
              <button
                @click="adicionarItem"
                :disabled="!novoProduto || novaQuantidade < 0"
                class="w-10 h-10 flex items-center justify-center rounded-full bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                </svg>
              </button>
            </div>
          </div>

          <!-- Tabela de itens -->
          <div class="border border-gray-200 rounded-lg overflow-hidden">
            <table class="w-full">
              <thead class="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                    Produto
                  </th>
                  <th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3 w-32">
                    Quantidade
                  </th>
                  <th class="w-12 px-4 py-3"></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                <tr
                  v-for="(item, index) in paginatedItens"
                  :key="item.codigo"
                  class="hover:bg-gray-50 transition-colors"
                >
                  <td class="px-4 py-3">
                    <p class="text-sm text-gray-900">{{ item.nome }}</p>
                  </td>
                  <td class="px-4 py-3">
                    <input
                      type="number"
                      v-model.number="item.quantidade"
                      class="input w-24 py-1.5 text-sm"
                      min="0"
                    />
                  </td>
                  <td class="px-4 py-3 text-center">
                    <button
                      @click="removerItem(item.codigo)"
                      class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                      title="Remover item"
                    >
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                      </svg>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- Empty State -->
            <div v-if="itensEstoque.length === 0" class="text-center py-8">
              <p class="text-sm text-gray-500">Nenhum item no estoque</p>
            </div>
          </div>

          <!-- Paginacao da tabela -->
          <div v-if="itensEstoque.length > itemsPerPage" class="flex items-center justify-center mt-4">
            <div class="flex items-center gap-2">
              <button
                @click="currentPage--"
                :disabled="currentPage === 1"
                class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                </svg>
              </button>
              <button
                v-for="page in visiblePages"
                :key="page"
                @click="currentPage = page"
                :class="[
                  'w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium',
                  currentPage === page
                    ? 'bg-green-600 text-white'
                    : 'hover:bg-gray-100 text-gray-700'
                ]"
              >
                {{ page }}
              </button>
              <button
                @click="currentPage++"
                :disabled="currentPage === totalPages"
                class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </button>
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

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  estoque: {
    type: Array,
    required: true
  },
  produtos: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['close', 'save'])

// Estado do formulário de adição
const novoProduto = ref('')
const novaQuantidade = ref(0)

// Lista de itens do estoque (cópia local)
const itensEstoque = ref([])

// Paginação
const currentPage = ref(1)
const itemsPerPage = 5

// Preencher com dados existentes
watch(() => props.estoque, (newEstoque) => {
  if (newEstoque) {
    itensEstoque.value = newEstoque.map(item => ({ ...item }))
  }
}, { immediate: true })

// Produtos disponíveis (que ainda não estão no estoque)
const produtosDisponiveis = computed(() => {
  const codigosNoEstoque = itensEstoque.value.map(item => item.codigo)
  return props.produtos.filter(p => !codigosNoEstoque.includes(p.codigo))
})

// Paginação
const totalPages = computed(() => {
  return Math.ceil(itensEstoque.value.length / itemsPerPage)
})

const visiblePages = computed(() => {
  const pages = []
  const total = totalPages.value

  if (total <= 5) {
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    if (currentPage.value <= 3) {
      pages.push(1, 2, 3, 4, 5)
    } else if (currentPage.value >= total - 2) {
      pages.push(total - 4, total - 3, total - 2, total - 1, total)
    } else {
      pages.push(
        currentPage.value - 2,
        currentPage.value - 1,
        currentPage.value,
        currentPage.value + 1,
        currentPage.value + 2
      )
    }
  }

  return pages
})

const paginatedItens = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return itensEstoque.value.slice(start, end)
})

// Adicionar item ao estoque
const adicionarItem = () => {
  if (!novoProduto.value || novaQuantidade.value < 0) return

  const produto = props.produtos.find(p => p.codigo === novoProduto.value)
  if (produto) {
    itensEstoque.value.push({
      codigo: produto.codigo,
      nome: produto.nome,
      quantidade: novaQuantidade.value
    })
  }

  // Limpar campos
  novoProduto.value = ''
  novaQuantidade.value = 0
}

// Remover item do estoque
const removerItem = (codigo) => {
  const index = itensEstoque.value.findIndex(item => item.codigo === codigo)
  if (index !== -1) {
    itensEstoque.value.splice(index, 1)
  }
}

// Salvar alterações
const handleSave = () => {
  emit('save', itensEstoque.value)
}
</script>
