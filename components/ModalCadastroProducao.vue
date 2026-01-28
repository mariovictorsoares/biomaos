<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 overflow-y-auto">
      <!-- Backdrop -->
      <div
        class="fixed inset-0 bg-black/50 transition-opacity"
        @click="$emit('close')"
      ></div>

      <!-- Modal -->
      <div class="flex min-h-full items-center justify-center p-4">
        <div class="relative w-full max-w-2xl bg-card-light dark:bg-card-dark rounded-xl shadow-xl transform transition-all">
          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-border-light dark:border-border-dark">
            <h2 class="text-lg font-semibold text-text-light dark:text-text-dark">Cadastro de Plano de Produção</h2>
            <div class="flex items-center gap-2">
              <button
                @click="$emit('close')"
                class="btn btn-secondary"
              >
                Voltar
              </button>
              <button
                @click="handleConcluir"
                class="btn btn-primary"
              >
                Concluir plano
              </button>
            </div>
          </div>

          <!-- Content -->
          <div class="px-6 py-5 space-y-5">
            <!-- Linha 1: Espécie, Quantidade, Fazenda -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <!-- Espécie -->
              <div>
                <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">
                  Espécie
                </label>
                <select v-model="form.especie" class="input">
                  <option value="">Escolha a espécie</option>
                  <option v-for="especie in especies" :key="especie.codigo" :value="especie.codigo">
                    {{ especie.nome }}
                  </option>
                </select>
              </div>

              <!-- Quantidade -->
              <div>
                <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">
                  Quantidade
                </label>
                <input
                  type="number"
                  v-model.number="form.quantidade"
                  placeholder="Entre a quantidade planejada"
                  class="input"
                />
              </div>

              <!-- Fazenda -->
              <div>
                <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">
                  Fazenda
                </label>
                <select v-model="form.fazenda" class="input">
                  <option value="">Escolha a fazenda</option>
                  <option v-for="fazenda in fazendas" :key="fazenda" :value="fazenda">
                    {{ fazenda }}
                  </option>
                </select>
              </div>
            </div>

            <!-- Linha 2: Data da Colheita e Recorrência -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Data da Colheita -->
              <div>
                <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">
                  Data da Colheita (Planejamento)
                </label>
                <input
                  type="date"
                  v-model="form.dataColheita"
                  class="input"
                />
              </div>

              <!-- Recorrência -->
              <div>
                <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">
                  Recorrência
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    v-model="form.recorrente"
                    class="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <span class="text-sm text-text-light dark:text-text-dark">Recorrente</span>
                </label>
              </div>
            </div>

            <!-- Opções de Recorrência (visível apenas quando recorrente está marcado) -->
            <div v-if="form.recorrente" class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-4">
              <h4 class="text-sm font-medium text-text-light dark:text-text-dark">Configurações de Recorrência</h4>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Frequência -->
                <div>
                  <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">
                    Frequência
                  </label>
                  <select v-model="form.frequencia" class="input">
                    <option value="diario">Diário</option>
                    <option value="semanal">Semanal</option>
                    <option value="quinzenal">Quinzenal</option>
                    <option value="mensal">Mensal</option>
                  </select>
                </div>

                <!-- Repetições -->
                <div>
                  <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">
                    Número de Repetições
                  </label>
                  <input
                    type="number"
                    v-model.number="form.repeticoes"
                    placeholder="Ex: 4"
                    min="1"
                    class="input"
                  />
                </div>
              </div>
            </div>

            <!-- Botão Adicionar Item -->
            <div class="flex justify-end">
              <button
                @click="adicionarItem"
                class="btn btn-primary"
              >
                Adicionar
              </button>
            </div>

            <!-- Lista de Itens Adicionados -->
            <div v-if="itensAdicionados.length > 0" class="border border-border-light dark:border-border-dark rounded-lg overflow-hidden">
              <table class="w-full text-left">
                <thead>
                  <tr class="bg-gray-50 dark:bg-gray-800 border-b border-border-light dark:border-border-dark">
                    <th class="table-header">Espécie</th>
                    <th class="table-header text-center">Quantidade</th>
                    <th class="table-header">Fazenda</th>
                    <th class="table-header text-center">Data Colheita</th>
                    <th class="table-header text-center">Recorrência</th>
                    <th class="table-header text-center w-20">Ações</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-border-light dark:divide-border-dark">
                  <tr
                    v-for="(item, index) in itensAdicionados"
                    :key="index"
                    class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td class="table-cell font-medium">{{ getEspecieNome(item.especie) }}</td>
                    <td class="table-cell text-center">{{ item.quantidade }}</td>
                    <td class="table-cell">{{ item.fazenda }}</td>
                    <td class="table-cell text-center">{{ formatDate(item.dataColheita) }}</td>
                    <td class="table-cell text-center">
                      <span v-if="item.recorrente" class="badge badge-success">
                        {{ item.frequencia }} x{{ item.repeticoes }}
                      </span>
                      <span v-else class="text-subtext-light dark:text-subtext-dark">-</span>
                    </td>
                    <td class="table-cell text-center">
                      <button
                        @click="removerItem(index)"
                        class="text-red-500 hover:text-red-700 transition-colors"
                        title="Remover"
                      >
                        <span class="material-icons text-sm">delete</span>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Mensagem quando não há itens -->
            <div v-else class="text-center py-8 border border-dashed border-border-light dark:border-border-dark rounded-lg">
              <span class="material-icons-outlined text-3xl text-gray-300 dark:text-gray-600 mb-2">inventory_2</span>
              <p class="text-sm text-subtext-light dark:text-subtext-dark">
                Nenhum item adicionado. Preencha os campos acima e clique em "Adicionar".
              </p>
            </div>
          </div>

          <!-- Footer com Resumo -->
          <div v-if="itensAdicionados.length > 0" class="px-6 py-4 border-t border-border-light dark:border-border-dark bg-gray-50 dark:bg-gray-800 rounded-b-xl">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-6">
                <div>
                  <span class="text-xs text-subtext-light dark:text-subtext-dark">Total de Itens</span>
                  <p class="text-lg font-semibold text-text-light dark:text-text-dark">{{ itensAdicionados.length }}</p>
                </div>
                <div>
                  <span class="text-xs text-subtext-light dark:text-subtext-dark">Quantidade Total</span>
                  <p class="text-lg font-semibold text-text-light dark:text-text-dark">{{ quantidadeTotal }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useToast } from '~/composables/useToast'

const { showToast } = useToast()
const emit = defineEmits(['close', 'save'])

// Formulário
const form = ref({
  especie: '',
  quantidade: null,
  fazenda: '',
  dataColheita: new Date().toISOString().split('T')[0],
  recorrente: false,
  frequencia: 'semanal',
  repeticoes: 4
})

// Itens adicionados
const itensAdicionados = ref([])

// Dados de exemplo
const fazendas = ['OTÁVIA', 'NONA', 'DIZIMA', 'SEDE', 'CAMP', 'CORE', 'GAMA', 'JURE', 'KOBRA']

const especies = [
  { codigo: 'BETE', nome: 'Beterraba' },
  { codigo: 'MRMO', nome: 'Manjericão Roxo Micro' },
  { codigo: 'AGRA', nome: 'Agrião' },
  { codigo: 'COUV', nome: 'Couve' },
  { codigo: 'NABO', nome: 'Nabo' },
  { codigo: 'RABR', nome: 'Rabanete Roxo' },
  { codigo: 'RABX', nome: 'Rabanete Extra' },
  { codigo: 'REPX', nome: 'Repolho Extra' },
  { codigo: 'CENO', nome: 'Cenoura' },
  { codigo: 'COEN', nome: 'Coentro' },
  { codigo: 'RUCA', nome: 'Rúcula' },
  { codigo: 'ALFA', nome: 'Alface' },
  { codigo: 'SALV', nome: 'Salvia' },
  { codigo: 'MANJ', nome: 'Manjericão' }
]

// Computed
const quantidadeTotal = computed(() => {
  return itensAdicionados.value.reduce((total, item) => total + item.quantidade, 0)
})

// Funções
function getEspecieNome(codigo) {
  const especie = especies.find(e => e.codigo === codigo)
  return especie ? especie.nome : codigo
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('pt-BR')
}

function adicionarItem() {
  // Validação básica
  if (!form.value.especie) {
    showToast('Selecione uma espécie', 'error')
    return
  }
  if (!form.value.quantidade || form.value.quantidade <= 0) {
    showToast('Informe uma quantidade válida', 'error')
    return
  }
  if (!form.value.fazenda) {
    showToast('Selecione uma fazenda', 'error')
    return
  }
  if (!form.value.dataColheita) {
    showToast('Informe a data da colheita', 'error')
    return
  }

  // Adicionar item à lista
  itensAdicionados.value.push({
    especie: form.value.especie,
    quantidade: form.value.quantidade,
    fazenda: form.value.fazenda,
    dataColheita: form.value.dataColheita,
    recorrente: form.value.recorrente,
    frequencia: form.value.recorrente ? form.value.frequencia : null,
    repeticoes: form.value.recorrente ? form.value.repeticoes : null
  })

  // Limpar formulário
  form.value.especie = ''
  form.value.quantidade = null
  form.value.recorrente = false
}

function removerItem(index) {
  itensAdicionados.value.splice(index, 1)
}

function handleConcluir() {
  if (itensAdicionados.value.length === 0) {
    showToast('Adicione pelo menos um item ao plano de produção', 'error')
    return
  }

  emit('save', itensAdicionados.value)
}
</script>
