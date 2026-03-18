<template>
  <div>
    <!-- Toolbar: Filtros + Acao -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-4 mb-4">
      <!-- Esquerda: Filtros -->
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
        <!-- Busca -->
        <div class="relative">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 material-icons-outlined text-gray-400 text-base">search</span>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar recorrências..."
            class="input w-full sm:w-64 text-sm pl-9"
          />
        </div>
        <!-- Filtro Status -->
        <select v-model="filterStatus" class="input text-sm w-full sm:w-auto shrink-0">
          <option value="">Todos</option>
          <option value="ativo">Ativos</option>
          <option value="inativo">Inativos</option>
        </select>
        <!-- Filtro Cliente -->
        <select v-model="filterCliente" class="input text-sm w-full sm:w-auto shrink-0">
          <option value="">Todos clientes</option>
          <option v-for="cliente in clientes" :key="cliente.id" :value="cliente.id">
            {{ cliente.nome_fantasia || cliente.razao_social }}
          </option>
        </select>
      </div>
      <!-- Direita: Botao -->
      <button @click="openModal()" class="btn btn-primary shrink-0 justify-center sm:justify-start">
        <span class="material-icons-outlined text-sm">add</span>
        Nova recorrência
      </button>
    </div>

    <!-- Card da Tabela -->
    <div class="card">

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-12">
        <span class="material-icons-outlined text-4xl text-gray-300 dark:text-gray-600 animate-spin">refresh</span>
        <p class="text-sm text-subtext-light dark:text-subtext-dark mt-2">Carregando...</p>
      </div>

      <!-- Tabela - Desktop -->
      <div v-if="!loading && filteredRecorrencias.length > 0" class="hidden md:block overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-100 dark:bg-gray-700/50 border-b border-border-light dark:border-border-dark">
              <th class="table-header">Nome</th>
              <th class="table-header">Cliente</th>
              <th class="table-header">Frequência</th>
              <th class="table-header text-center">Próxima Geração</th>
              <th class="table-header text-center w-24">Ativo</th>
              <th class="table-header text-center w-24">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-light dark:divide-border-dark">
            <tr
              v-for="rec in paginatedRecorrencias"
              :key="rec.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <td class="table-cell font-medium text-text-light dark:text-text-dark">
                {{ rec.nome }}
              </td>
              <td class="table-cell text-subtext-light dark:text-subtext-dark">
                {{ rec.clientes?.nome_fantasia || rec.clientes?.razao_social || '-' }}
              </td>
              <td class="table-cell text-subtext-light dark:text-subtext-dark">
                {{ formatFrequencia(rec) }}
              </td>
              <td class="table-cell text-center text-subtext-light dark:text-subtext-dark">
                {{ calcProximaGeracao(rec) }}
              </td>
              <td class="table-cell text-center">
                <button
                  @click="toggleAtivo(rec)"
                  :class="[
                    'relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none',
                    rec.ativo ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
                  ]"
                  :title="rec.ativo ? 'Desativar' : 'Ativar'"
                >
                  <span
                    :class="[
                      'inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform',
                      rec.ativo ? 'translate-x-[18px]' : 'translate-x-[3px]'
                    ]"
                  />
                </button>
              </td>
              <td class="table-cell text-center">
                <div class="flex items-center justify-center gap-1">
                  <button
                    @click="openModal(rec)"
                    class="text-gray-400 hover:text-primary dark:text-gray-500 dark:hover:text-primary transition-colors"
                    title="Editar"
                  >
                    <span class="material-icons-outlined text-lg">edit</span>
                  </button>
                  <button
                    @click="confirmDelete(rec)"
                    class="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors"
                    title="Excluir"
                  >
                    <span class="material-icons-outlined text-lg">delete</span>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Cards - Mobile -->
      <div v-if="!loading && filteredRecorrencias.length > 0" class="md:hidden divide-y divide-border-light dark:divide-border-dark">
        <div
          v-for="rec in paginatedRecorrencias"
          :key="rec.id"
          class="p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        >
          <div class="flex items-start justify-between gap-2 mb-2">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <span :class="[
                  'text-[10px] px-1.5 py-0.5 rounded-full border whitespace-nowrap',
                  rec.ativo
                    ? 'border-green-500 text-green-600 dark:border-green-400 dark:text-green-400'
                    : 'border-gray-400 text-gray-500 dark:border-gray-500 dark:text-gray-400'
                ]">
                  {{ rec.ativo ? 'Ativo' : 'Inativo' }}
                </span>
              </div>
              <p class="text-sm font-medium text-text-light dark:text-text-dark truncate">
                {{ rec.nome }}
              </p>
              <p class="text-xs text-subtext-light dark:text-subtext-dark mt-0.5">
                {{ rec.clientes?.nome_fantasia || rec.clientes?.razao_social || '-' }}
              </p>
            </div>
            <div class="flex items-center gap-1 shrink-0">
              <button
                @click="toggleAtivo(rec)"
                :class="[
                  'relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none',
                  rec.ativo ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
                ]"
              >
                <span
                  :class="[
                    'inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform',
                    rec.ativo ? 'translate-x-[18px]' : 'translate-x-[3px]'
                  ]"
                />
              </button>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-2 text-[11px]">
            <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
              <p class="text-subtext-light dark:text-subtext-dark mb-0.5">Frequência</p>
              <p class="font-semibold text-text-light dark:text-text-dark">{{ formatFrequencia(rec) }}</p>
            </div>
            <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
              <p class="text-subtext-light dark:text-subtext-dark mb-0.5">Próxima</p>
              <p class="font-semibold text-text-light dark:text-text-dark">{{ calcProximaGeracao(rec) }}</p>
            </div>
          </div>
          <div class="flex items-center justify-end gap-2 mt-2">
            <button @click="openModal(rec)" class="text-xs text-primary hover:underline">Editar</button>
            <button @click="confirmDelete(rec)" class="text-xs text-red-500 hover:underline">Excluir</button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="!loading && filteredRecorrencias.length === 0" class="text-center py-12 flex flex-col items-center px-4">
        <span class="material-icons-outlined text-4xl text-gray-300 dark:text-gray-600 mb-2">event_repeat</span>
        <h3 class="text-lg font-medium text-text-light dark:text-text-dark mb-1">Nenhuma recorrência encontrada</h3>
        <p class="text-sm text-subtext-light dark:text-subtext-dark mb-4">
          {{ hasActiveFilters ? 'Tente ajustar os filtros' : 'Comece criando sua primeira recorrência' }}
        </p>
        <button v-if="!hasActiveFilters" @click="openModal()" class="btn btn-primary">
          <span class="material-icons-outlined text-sm">add</span>
          Nova recorrência
        </button>
      </div>

      <!-- Paginacao -->
      <div v-if="filteredRecorrencias.length > 0" class="p-3 sm:p-4 border-t border-border-light dark:border-border-dark text-xs text-subtext-light dark:text-subtext-dark">
        <div class="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <div class="flex items-center gap-3 sm:gap-4 w-full sm:w-auto justify-between sm:justify-start">
            <div class="flex items-center gap-2">
              <span class="hidden sm:inline">Mostrar</span>
              <select v-model="itemsPerPage" class="border border-border-light dark:border-border-dark rounded px-2 py-1 bg-white dark:bg-gray-800 text-xs sm:text-sm cursor-pointer">
                <option :value="10">10</option>
                <option :value="25">25</option>
                <option :value="50">50</option>
              </select>
            </div>
            <span class="text-xs">{{ filteredRecorrencias.length }} registros</span>
          </div>
          <div class="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto justify-center sm:justify-end">
            <button
              @click="currentPage--"
              :disabled="currentPage === 1"
              class="p-1 border border-border-light dark:border-border-dark rounded hover:bg-gray-50 dark:hover:bg-gray-800 bg-white dark:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span class="material-icons-outlined text-sm">chevron_left</span>
            </button>
            <span class="hidden xs:inline">Página</span>
            <input
              v-model="pageInput"
              type="text"
              class="w-10 sm:w-12 text-center border border-border-light dark:border-border-dark rounded px-1 sm:px-2 py-1 bg-white dark:bg-gray-800 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              @keyup.enter="goToPage"
              @blur="goToPage"
            />
            <span>de {{ totalPages }}</span>
            <button
              @click="currentPage++"
              :disabled="currentPage === totalPages"
              class="p-1 border border-border-light dark:border-border-dark rounded hover:bg-gray-50 dark:hover:bg-gray-800 bg-white dark:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span class="material-icons-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Cadastro/Edicao -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-200"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="showModal" class="fixed inset-0 z-[100] overflow-y-auto">
          <div class="fixed inset-0 glass-backdrop z-[100]" @click="closeModal"></div>
          <div class="flex min-h-full items-center justify-center p-4">
            <Transition
              enter-active-class="transition-all duration-200"
              enter-from-class="opacity-0 scale-95"
              enter-to-class="opacity-100 scale-100"
              leave-active-class="transition-all duration-200"
              leave-from-class="opacity-100 scale-100"
              leave-to-class="opacity-0 scale-95"
            >
              <div v-if="showModal" class="relative z-[101] bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                <!-- Header -->
                <div class="px-6 py-4 border-b border-border-light dark:border-border-dark flex items-center justify-between">
                  <h2 class="text-lg font-semibold text-text-light dark:text-text-dark">
                    {{ editingId ? 'Editar Recorrência' : 'Nova Recorrência' }}
                  </h2>
                  <button @click="closeModal" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <span class="material-icons-outlined">close</span>
                  </button>
                </div>

                <!-- Body -->
                <div class="p-6 overflow-y-auto flex-1 space-y-5">
                  <!-- Dados Basicos -->
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Nome *</label>
                      <input v-model="form.nome" type="text" class="input" placeholder="Ex: Pedido semanal restaurante" />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Cliente *</label>
                      <select v-model="form.cliente_id" class="input">
                        <option value="">Selecione</option>
                        <option v-for="cliente in clientes" :key="cliente.id" :value="cliente.id">
                          {{ cliente.nome_fantasia || cliente.razao_social }}
                        </option>
                      </select>
                    </div>
                  </div>

                  <!-- Recorrência -->
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Tipo de Frequência *</label>
                      <select v-model="form.tipo_frequencia" class="input">
                        <option value="semanal">A cada N semanas</option>
                        <option value="dia_semana">Dia da semana</option>
                        <option value="dia_util_mes">Dia útil do mês</option>
                      </select>
                    </div>
                    <div v-if="form.tipo_frequencia === 'semanal' || form.tipo_frequencia === 'dia_util_mes'">
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">
                        {{ form.tipo_frequencia === 'semanal' ? 'Intervalo (semanas)' : 'Dia útil do mês' }}
                      </label>
                      <input v-model.number="form.intervalo" type="number" class="input" min="1" />
                    </div>
                    <div v-if="form.tipo_frequencia === 'dia_semana'">
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Dia da Semana</label>
                      <select v-model.number="form.dia_semana" class="input">
                        <option :value="0">Domingo</option>
                        <option :value="1">Segunda-feira</option>
                        <option :value="2">Terça-feira</option>
                        <option :value="3">Quarta-feira</option>
                        <option :value="4">Quinta-feira</option>
                        <option :value="5">Sexta-feira</option>
                        <option :value="6">Sábado</option>
                      </select>
                    </div>
                  </div>

                  <!-- Datas -->
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Data Início *</label>
                      <input v-model="form.data_inicio" type="date" class="input" />
                    </div>
                    <div v-if="!form.recorrencia_infinita">
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Data Fim</label>
                      <input v-model="form.data_fim" type="date" class="input" />
                    </div>
                  </div>

                  <!-- Checkboxes -->
                  <div class="flex flex-wrap items-center gap-6">
                    <label class="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        v-model="form.recorrencia_infinita"
                        class="w-4 h-4 text-primary bg-white border-gray-300 rounded focus:ring-primary dark:bg-gray-800 dark:border-gray-600"
                      />
                      <span class="text-sm text-text-light dark:text-text-dark">Recorrência infinita</span>
                    </label>
                    <label class="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        v-model="form.criar_atrasados"
                        class="w-4 h-4 text-primary bg-white border-gray-300 rounded focus:ring-primary dark:bg-gray-800 dark:border-gray-600"
                      />
                      <span class="text-sm text-text-light dark:text-text-dark">Criar pedidos atrasados</span>
                    </label>
                  </div>

                  <!-- Preview frequencia -->
                  <div v-if="previewFrequencia" class="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <span class="material-icons-outlined text-sm text-blue-500">event_repeat</span>
                    <span class="text-xs text-blue-700 dark:text-blue-400 font-medium">{{ previewFrequencia }}</span>
                  </div>

                  <!-- Notas -->
                  <div>
                    <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Notas</label>
                    <textarea v-model="form.notas" class="input" rows="2" placeholder="Observações..."></textarea>
                  </div>

                  <!-- Itens -->
                  <div>
                    <div class="flex items-center justify-between mb-3">
                      <div class="flex items-center gap-2">
                        <h3 class="text-sm font-semibold text-text-light dark:text-text-dark">Itens do pedido</h3>
                        <span class="text-xs text-gray-500 dark:text-subtext-dark bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                          {{ form.itens.length }}
                        </span>
                      </div>
                      <button @click="addItem" class="text-sm text-primary hover:underline flex items-center gap-1">
                        <span class="material-icons-outlined text-sm">add</span>
                        Adicionar item
                      </button>
                    </div>

                    <div v-if="form.itens.length === 0" class="text-center py-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                      <span class="material-icons-outlined text-2xl text-gray-300 dark:text-gray-600 mb-1">inventory_2</span>
                      <p class="text-sm text-gray-500 dark:text-subtext-dark">Nenhum item adicionado</p>
                    </div>

                    <div v-else class="space-y-2">
                      <div
                        v-for="(item, idx) in form.itens"
                        :key="idx"
                        class="flex flex-col sm:flex-row items-stretch sm:items-end gap-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl"
                      >
                        <div class="flex-1 min-w-0">
                          <label class="block text-xs text-subtext-light dark:text-subtext-dark mb-1">Produto</label>
                          <select v-model="item.produto_id" class="input text-sm">
                            <option value="">Selecione</option>
                            <option v-for="produto in produtos" :key="produto.id" :value="produto.id">
                              {{ produto.nome }}
                            </option>
                          </select>
                        </div>
                        <div class="w-full sm:w-24">
                          <label class="block text-xs text-subtext-light dark:text-subtext-dark mb-1">Qtd</label>
                          <input v-model.number="item.quantidade" type="number" class="input text-sm" min="1" />
                        </div>
                        <div class="w-full sm:w-28">
                          <label class="block text-xs text-subtext-light dark:text-subtext-dark mb-1">Preço Unit.</label>
                          <input v-model.number="item.preco_unitario" type="number" class="input text-sm" min="0" step="0.01" />
                        </div>
                        <div class="flex items-center gap-3 sm:pb-0.5">
                          <label class="flex items-center gap-1.5 cursor-pointer whitespace-nowrap">
                            <input
                              type="checkbox"
                              v-model="item.usar_excedentes"
                              class="w-3.5 h-3.5 text-primary bg-white border-gray-300 rounded focus:ring-primary dark:bg-gray-800 dark:border-gray-600"
                            />
                            <span class="text-xs text-subtext-light dark:text-subtext-dark">Excedentes</span>
                          </label>
                          <button
                            @click="removeItem(idx)"
                            class="text-gray-400 hover:text-red-500 transition-colors shrink-0"
                            title="Remover item"
                          >
                            <span class="material-icons-outlined text-lg">close</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Footer -->
                <div class="px-6 py-4 border-t border-border-light dark:border-border-dark flex items-center justify-end gap-3">
                  <button @click="closeModal" class="btn btn-secondary">Cancelar</button>
                  <button @click="saveRecorrencia" class="btn btn-primary" :disabled="saving || !isFormValid">
                    <span v-if="saving" class="material-icons-outlined text-sm animate-spin">refresh</span>
                    {{ saving ? 'Salvando...' : (editingId ? 'Salvar alterações' : 'Criar recorrência') }}
                  </button>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Modal Confirmar Exclusao -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-200"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="showDeleteConfirm" class="fixed inset-0 z-[100] overflow-y-auto">
          <div class="fixed inset-0 glass-backdrop z-[100]" @click="showDeleteConfirm = false"></div>
          <div class="flex min-h-full items-center justify-center p-4">
            <div class="relative z-[101] bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-sm p-6">
              <div class="text-center">
                <span class="material-icons-outlined text-4xl text-red-400 mb-3">warning</span>
                <h3 class="text-lg font-semibold text-text-light dark:text-text-dark mb-2">Excluir recorrência</h3>
                <p class="text-sm text-subtext-light dark:text-subtext-dark mb-6">
                  Tem certeza que deseja excluir "<strong>{{ deletingRec?.nome }}</strong>"? Esta ação não pode ser desfeita.
                </p>
                <div class="flex items-center justify-center gap-3">
                  <button @click="showDeleteConfirm = false" class="btn btn-secondary">Cancelar</button>
                  <button @click="deleteRecorrencia" class="btn bg-red-600 hover:bg-red-700 text-white" :disabled="saving">
                    <span v-if="saving" class="material-icons-outlined text-sm animate-spin">refresh</span>
                    {{ saving ? 'Excluindo...' : 'Excluir' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useCurrentCompany } from '~/composables/useCurrentCompany'
import { useToast } from '~/composables/useToast'

// Interfaces
interface Cliente {
  id: string
  nome_fantasia?: string
  razao_social?: string
}

interface Produto {
  id: string
  nome: string
}

interface RecorrenteItem {
  id?: string
  pedido_recorrente_id?: string
  produto_id: string
  quantidade: number
  preco_unitario: number
  usar_excedentes: boolean
  produtos?: Produto
}

interface PedidoRecorrente {
  id: string
  empresa_id: string
  cliente_id: string
  nome: string
  recorrencia_infinita: boolean
  data_inicio: string
  data_fim?: string | null
  tipo_frequencia: 'semanal' | 'dia_semana' | 'dia_util_mes'
  intervalo: number
  dia_semana: number | null
  criar_atrasados: boolean
  ativo: boolean
  ultima_geracao?: string | null
  notas?: string | null
  clientes?: Cliente
  pedido_recorrente_itens?: RecorrenteItem[]
}

interface FormItem {
  produto_id: string
  quantidade: number
  preco_unitario: number
  usar_excedentes: boolean
}

const supabase = useSupabaseClient()
const { currentCompany } = useCurrentCompany()
const { success, error: showError } = useToast()

// Estado
const recorrencias = ref<PedidoRecorrente[]>([])
const clientes = ref<Cliente[]>([])
const produtos = ref<Produto[]>([])
const loading = ref(false)
const saving = ref(false)

// Filtros
const searchQuery = ref('')
const filterStatus = ref('')
const filterCliente = ref('')

// Paginacao
const currentPage = ref(1)
const itemsPerPage = ref(10)
const pageInput = ref('1')

// Modal
const showModal = ref(false)
const editingId = ref<string | null>(null)

// Delete
const showDeleteConfirm = ref(false)
const deletingRec = ref<PedidoRecorrente | null>(null)

// Formulario
const defaultForm = () => ({
  nome: '',
  cliente_id: '',
  recorrencia_infinita: true,
  data_inicio: '',
  data_fim: '',
  tipo_frequencia: 'semanal' as 'semanal' | 'dia_semana' | 'dia_util_mes',
  intervalo: 1,
  dia_semana: 1,
  criar_atrasados: false,
  notas: '',
  itens: [] as FormItem[]
})

const form = ref(defaultForm())

// Dias da semana helper
const diasSemana = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']

// =====================================================
// Formatacao de Frequência
// =====================================================

function formatFrequencia(rec: PedidoRecorrente): string {
  if (rec.tipo_frequencia === 'semanal') {
    if (rec.intervalo === 1) return 'Semanalmente'
    return `A cada ${rec.intervalo} semanas`
  }
  if (rec.tipo_frequencia === 'dia_semana') {
    const dia = diasSemana[rec.dia_semana ?? 0]
    return `Toda ${dia.toLowerCase()}`
  }
  if (rec.tipo_frequencia === 'dia_util_mes') {
    const n = rec.intervalo || 1
    return `${n}o dia útil do mês`
  }
  return '-'
}

// Preview da frequencia no formulario
const previewFrequencia = computed(() => {
  const f = form.value
  if (f.tipo_frequencia === 'semanal') {
    if (f.intervalo === 1) return 'Semanalmente'
    if (f.intervalo > 1) return `A cada ${f.intervalo} semanas`
    return ''
  }
  if (f.tipo_frequencia === 'dia_semana') {
    const dia = diasSemana[f.dia_semana ?? 0]
    return `Toda ${dia.toLowerCase()}`
  }
  if (f.tipo_frequencia === 'dia_util_mes') {
    const n = f.intervalo || 1
    return `${n}o dia útil do mês`
  }
  return ''
})

// =====================================================
// Calcular Proxima Geracao
// =====================================================

function calcProximaGeracao(rec: PedidoRecorrente): string {
  if (!rec.ativo) return '-'

  const baseDate = rec.ultima_geracao ? new Date(rec.ultima_geracao + 'T12:00:00') : new Date(rec.data_inicio + 'T12:00:00')

  // Se tem data_fim e ja passou
  if (!rec.recorrencia_infinita && rec.data_fim) {
    const fim = new Date(rec.data_fim + 'T12:00:00')
    if (fim < new Date()) return 'Encerrada'
  }

  let next: Date

  if (rec.tipo_frequencia === 'semanal') {
    next = new Date(baseDate)
    if (rec.ultima_geracao) {
      next.setDate(next.getDate() + (rec.intervalo || 1) * 7)
    }
  } else if (rec.tipo_frequencia === 'dia_semana') {
    next = new Date(baseDate)
    if (rec.ultima_geracao) {
      next.setDate(next.getDate() + 7)
    }
    // Ajustar para o dia da semana correto
    const targetDay = rec.dia_semana ?? 0
    while (next.getDay() !== targetDay) {
      next.setDate(next.getDate() + 1)
    }
  } else {
    // dia_util_mes
    next = new Date(baseDate)
    if (rec.ultima_geracao) {
      next.setMonth(next.getMonth() + 1)
    }
    next.setDate(1)
    let diaUtil = 0
    const target = rec.intervalo || 1
    while (diaUtil < target) {
      const dow = next.getDay()
      if (dow !== 0 && dow !== 6) diaUtil++
      if (diaUtil < target) next.setDate(next.getDate() + 1)
    }
  }

  return formatDateBR(next.toISOString().split('T')[0])
}

// =====================================================
// Formatacao
// =====================================================

function formatDateBR(dateStr?: string | null): string {
  if (!dateStr) return '-'
  const date = new Date(dateStr + 'T12:00:00')
  return date.toLocaleDateString('pt-BR')
}

function formatCurrency(val?: number | null): string {
  if (val === undefined || val === null) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
}

// =====================================================
// Filtros & Computed
// =====================================================

const hasActiveFilters = computed(() => {
  return searchQuery.value || filterStatus.value || filterCliente.value
})

const filteredRecorrencias = computed(() => {
  let result = recorrencias.value

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(r =>
      r.nome.toLowerCase().includes(q) ||
      (r.clientes?.nome_fantasia || '').toLowerCase().includes(q) ||
      (r.clientes?.razao_social || '').toLowerCase().includes(q)
    )
  }

  if (filterStatus.value === 'ativo') {
    result = result.filter(r => r.ativo)
  } else if (filterStatus.value === 'inativo') {
    result = result.filter(r => !r.ativo)
  }

  if (filterCliente.value) {
    result = result.filter(r => r.cliente_id === filterCliente.value)
  }

  return result
})

const totalPages = computed(() => Math.ceil(filteredRecorrencias.value.length / itemsPerPage.value) || 1)

const paginatedRecorrencias = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  return filteredRecorrencias.value.slice(start, start + itemsPerPage.value)
})

const isFormValid = computed(() => {
  return form.value.nome.trim() &&
    form.value.cliente_id &&
    form.value.data_inicio &&
    form.value.tipo_frequencia &&
    form.value.itens.length > 0 &&
    form.value.itens.every(i => i.produto_id && i.quantidade > 0)
})

// =====================================================
// Paginacao
// =====================================================

function goToPage() {
  const page = parseInt(pageInput.value)
  if (!isNaN(page) && page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  } else {
    pageInput.value = String(currentPage.value)
  }
}

watch(currentPage, (val) => {
  pageInput.value = String(val)
})

watch([searchQuery, filterStatus, filterCliente], () => {
  currentPage.value = 1
})

// =====================================================
// Data Loading
// =====================================================

async function loadRecorrencias() {
  if (!currentCompany.value?.id) return
  loading.value = true
  try {
    const { data, error } = await supabase
      .from('pedidos_recorrentes')
      .select('*, clientes(id, nome_fantasia, razao_social), pedido_recorrente_itens(*, produtos(id, nome))')
      .eq('empresa_id', currentCompany.value.id)
      .order('created_at', { ascending: false })
    if (error) throw error
    recorrencias.value = data || []
  } catch (e: any) {
    showError('Erro ao carregar recorrências: ' + e.message)
  } finally {
    loading.value = false
  }
}

async function loadClientes() {
  if (!currentCompany.value?.id) return
  const { data } = await supabase
    .from('clientes')
    .select('id, nome_fantasia, razao_social')
    .eq('empresa_id', currentCompany.value.id)
    .eq('ativo', true)
    .order('nome_fantasia')
  clientes.value = data || []
}

async function loadProdutos() {
  if (!currentCompany.value?.id) return
  const { data } = await supabase
    .from('produtos')
    .select('id, nome')
    .eq('empresa_id', currentCompany.value.id)
    .eq('ativo', true)
    .order('nome')
  produtos.value = data || []
}

// =====================================================
// Modal
// =====================================================

function openModal(rec?: PedidoRecorrente) {
  if (rec) {
    editingId.value = rec.id
    form.value = {
      nome: rec.nome,
      cliente_id: rec.cliente_id,
      recorrencia_infinita: rec.recorrencia_infinita,
      data_inicio: rec.data_inicio,
      data_fim: rec.data_fim || '',
      tipo_frequencia: rec.tipo_frequencia,
      intervalo: rec.intervalo || 1,
      dia_semana: rec.dia_semana ?? 1,
      criar_atrasados: rec.criar_atrasados,
      notas: rec.notas || '',
      itens: (rec.pedido_recorrente_itens || []).map(i => ({
        produto_id: i.produto_id,
        quantidade: i.quantidade,
        preco_unitario: i.preco_unitario,
        usar_excedentes: i.usar_excedentes
      }))
    }
  } else {
    editingId.value = null
    form.value = defaultForm()
  }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingId.value = null
}

function addItem() {
  form.value.itens.push({
    produto_id: '',
    quantidade: 1,
    preco_unitario: 0,
    usar_excedentes: false
  })
}

function removeItem(idx: number) {
  form.value.itens.splice(idx, 1)
}

// =====================================================
// Salvar
// =====================================================

async function saveRecorrencia() {
  if (!currentCompany.value?.id || !isFormValid.value) return
  saving.value = true

  try {
    const payload = {
      empresa_id: currentCompany.value.id,
      cliente_id: form.value.cliente_id,
      nome: form.value.nome.trim(),
      recorrencia_infinita: form.value.recorrencia_infinita,
      data_inicio: form.value.data_inicio,
      data_fim: form.value.recorrencia_infinita ? null : (form.value.data_fim || null),
      tipo_frequencia: form.value.tipo_frequencia,
      intervalo: form.value.tipo_frequencia === 'dia_semana' ? 1 : form.value.intervalo,
      dia_semana: form.value.tipo_frequencia === 'dia_semana' ? form.value.dia_semana : null,
      criar_atrasados: form.value.criar_atrasados,
      notas: form.value.notas?.trim() || null
    }

    let recorrenteId: string

    if (editingId.value) {
      // Atualizar
      const { error } = await supabase
        .from('pedidos_recorrentes')
        .update(payload)
        .eq('id', editingId.value)
      if (error) throw error
      recorrenteId = editingId.value

      // Remover itens antigos
      const { error: delError } = await supabase
        .from('pedido_recorrente_itens')
        .delete()
        .eq('pedido_recorrente_id', recorrenteId)
      if (delError) throw delError
    } else {
      // Inserir
      const { data, error } = await supabase
        .from('pedidos_recorrentes')
        .insert(payload)
        .select('id')
        .single()
      if (error) throw error
      recorrenteId = data.id
    }

    // Inserir itens
    if (form.value.itens.length > 0) {
      const itensPayload = form.value.itens.map(i => ({
        pedido_recorrente_id: recorrenteId,
        produto_id: i.produto_id,
        quantidade: i.quantidade,
        preco_unitario: i.preco_unitario,
        usar_excedentes: i.usar_excedentes
      }))
      const { error: itensError } = await supabase
        .from('pedido_recorrente_itens')
        .insert(itensPayload)
      if (itensError) throw itensError
    }

    success(editingId.value ? 'Recorrência atualizada com sucesso' : 'Recorrência criada com sucesso')
    closeModal()
    await loadRecorrencias()
  } catch (e: any) {
    showError('Erro ao salvar recorrência: ' + e.message)
  } finally {
    saving.value = false
  }
}

// =====================================================
// Toggle Ativo
// =====================================================

async function toggleAtivo(rec: PedidoRecorrente) {
  try {
    const newAtivo = !rec.ativo
    const { error } = await supabase
      .from('pedidos_recorrentes')
      .update({ ativo: newAtivo })
      .eq('id', rec.id)
    if (error) throw error
    rec.ativo = newAtivo
    success(newAtivo ? 'Recorrência ativada' : 'Recorrência desativada')
  } catch (e: any) {
    showError('Erro ao alterar status: ' + e.message)
  }
}

// =====================================================
// Excluir
// =====================================================

function confirmDelete(rec: PedidoRecorrente) {
  deletingRec.value = rec
  showDeleteConfirm.value = true
}

async function deleteRecorrencia() {
  if (!deletingRec.value) return
  saving.value = true
  try {
    // Excluir itens primeiro
    const { error: itensError } = await supabase
      .from('pedido_recorrente_itens')
      .delete()
      .eq('pedido_recorrente_id', deletingRec.value.id)
    if (itensError) throw itensError

    // Excluir a recorrência
    const { error } = await supabase
      .from('pedidos_recorrentes')
      .delete()
      .eq('id', deletingRec.value.id)
    if (error) throw error

    success('Recorrência excluída com sucesso')
    showDeleteConfirm.value = false
    deletingRec.value = null
    await loadRecorrencias()
  } catch (e: any) {
    showError('Erro ao excluir recorrência: ' + e.message)
  } finally {
    saving.value = false
  }
}

// =====================================================
// Watchers & Lifecycle
// =====================================================

watch(() => currentCompany.value?.id, async () => {
  await Promise.all([loadRecorrencias(), loadClientes(), loadProdutos()])
}, { immediate: false })

onMounted(async () => {
  if (currentCompany.value?.id) {
    await Promise.all([loadRecorrencias(), loadClientes(), loadProdutos()])
  }
})
</script>
