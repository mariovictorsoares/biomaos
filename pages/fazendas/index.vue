<template>
  <div>
    <h1 class="text-2xl font-bold text-text-light dark:text-text-dark mb-6">Fazendas</h1>

    <!-- Card da Tabela -->
    <div class="card">
      <!-- Header do Card -->
      <div class="p-3 sm:p-4 border-b border-border-light dark:border-border-dark">
        <div class="flex flex-col gap-3">
          <div class="flex items-center justify-between">
            <h2 class="text-xs sm:text-sm font-medium text-subtext-light dark:text-subtext-dark uppercase tracking-wider">Lista Fazendas</h2>
            <!-- Botao Nova Fazenda - Desktop -->
            <button @click="openCreateModal" class="hidden sm:flex btn btn-primary shrink-0">
              <span class="material-icons text-sm">add</span>
              Nova fazenda
            </button>
          </div>
          <div class="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <!-- Filtro Status -->
            <select v-model="filterStatus" class="input text-sm w-full sm:w-28 shrink-0">
              <option value="active">Ativas</option>
              <option value="inactive">Inativas</option>
              <option value="">Todas</option>
            </select>
            <!-- Busca -->
            <div class="relative flex-1">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 material-icons-outlined text-gray-400 text-base sm:text-lg">search</span>
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Pesquise aqui..."
                class="input w-full text-sm pl-9 sm:pl-10"
              />
            </div>
            <!-- Botao Nova Fazenda - Mobile -->
            <button @click="openCreateModal" class="sm:hidden btn btn-primary w-full justify-center">
              <span class="material-icons text-sm">add</span>
              Nova fazenda
            </button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>

      <!-- Tabela -->
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-50 dark:bg-gray-800 border-b border-border-light dark:border-border-dark">
              <th class="table-header cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700" @click="sortBy('codigo')">
                <div class="flex items-center gap-1">
                  Codigo
                  <span v-if="sortField === 'codigo'" class="material-icons text-xs">
                    {{ sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward' }}
                  </span>
                </div>
              </th>
              <th class="table-header cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700" @click="sortBy('nome')">
                <div class="flex items-center gap-1">
                  Nome
                  <span v-if="sortField === 'nome'" class="material-icons text-xs">
                    {{ sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward' }}
                  </span>
                </div>
              </th>
              <th class="table-header text-center">Unidades/Bandeja</th>
              <th class="table-header text-center">Andares</th>
              <th class="table-header text-center">Bandejas/Andar</th>
              <th class="table-header text-center">Capacidade</th>
              <th class="table-header text-center w-32">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-light dark:divide-border-dark">
            <tr
              v-for="fazenda in paginatedFazendas"
              :key="fazenda.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
              @click="openDetailsSlideover(fazenda)"
            >
              <td class="table-cell font-medium text-primary">{{ fazenda.codigo }}</td>
              <td class="table-cell font-medium">{{ fazenda.nome }}</td>
              <td class="table-cell text-center">{{ fazenda.unidades_por_bandeja }}</td>
              <td class="table-cell text-center">{{ fazenda.numero_andares }}</td>
              <td class="table-cell text-center">{{ fazenda.bandejas_por_andar }}</td>
              <td class="table-cell text-center font-medium">{{ fazenda.capacidade }}</td>
              <td class="table-cell text-center">
                <span :class="['badge', fazenda.status === 'active' ? 'badge-success' : 'badge-inactive']">
                  {{ fazenda.status === 'active' ? 'Ativa' : 'Inativa' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty State -->
      <div v-if="!loading && filteredFazendas.length === 0" class="flex flex-col items-center justify-center text-center py-12">
        <span class="material-icons-outlined text-4xl text-gray-300 dark:text-gray-600 mb-2">agriculture</span>
        <h3 class="text-lg font-medium text-text-light dark:text-text-dark mb-1">Nenhuma fazenda encontrada</h3>
        <p class="text-sm text-subtext-light dark:text-subtext-dark mb-4">Comece cadastrando sua primeira fazenda</p>
        <button @click="openCreateModal" class="btn btn-primary">
          <span class="material-icons text-sm">add</span>
          Nova fazenda
        </button>
      </div>

      <!-- Paginacao -->
      <div v-if="filteredFazendas.length > 0" class="p-4 flex flex-col sm:flex-row items-center justify-between border-t border-border-light dark:border-border-dark text-xs text-subtext-light dark:text-subtext-dark gap-4">
        <div class="flex items-center gap-4">
          <select v-model="itemsPerPage" class="border border-border-light dark:border-border-dark rounded px-2 py-1 bg-white dark:bg-gray-800 text-sm cursor-pointer">
            <option :value="10">10 linhas</option>
            <option :value="25">25 linhas</option>
            <option :value="50">50 linhas</option>
          </select>
          <span>{{ filteredFazendas.length }} registros</span>
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="currentPage--"
            :disabled="currentPage === 1"
            class="p-1 border border-border-light dark:border-border-dark rounded hover:bg-gray-50 dark:hover:bg-gray-800 bg-white dark:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span class="material-icons text-sm">chevron_left</span>
          </button>
          <span>Pagina</span>
          <input
            v-model="pageInput"
            type="text"
            class="w-12 text-center border border-border-light dark:border-border-dark rounded px-2 py-1 bg-white dark:bg-gray-800 font-medium focus:outline-none focus:ring-1 focus:ring-primary"
            @keyup.enter="goToPage"
            @blur="goToPage"
          />
          <span>de {{ totalPages }}</span>
          <button
            @click="currentPage++"
            :disabled="currentPage === totalPages"
            class="p-1 border border-border-light dark:border-border-dark rounded hover:bg-gray-50 dark:hover:bg-gray-800 bg-white dark:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span class="material-icons text-sm">chevron_right</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de Criacao -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        leave-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        leave-to-class="opacity-0"
      >
        <div v-if="showCreateModal" class="fixed inset-0 z-50 overflow-y-auto">
          <div class="fixed inset-0 glass-backdrop" @click="closeCreateModal"></div>
          <div class="flex min-h-full items-center justify-center p-4">
            <Transition
              enter-active-class="transition-all duration-200"
              leave-active-class="transition-all duration-200"
              enter-from-class="opacity-0 scale-95"
              leave-to-class="opacity-0 scale-95"
            >
              <div v-if="showCreateModal" class="relative glass-panel rounded-lg shadow-xl w-full max-w-xl">
                <!-- Modal Header -->
                <div class="border-b border-border-light dark:border-border-dark px-6 py-4 flex items-center justify-between">
                  <h2 class="text-lg font-semibold text-text-light dark:text-text-dark">Nova fazenda</h2>
                  <button @click="closeCreateModal" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <span class="material-icons">close</span>
                  </button>
                </div>

                <!-- Modal Body -->
                <div class="p-6 space-y-4">
                  <!-- Codigo e Nome -->
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                        Codigo <span class="text-red-500">*</span>
                      </label>
                      <input type="text" v-model="newFazenda.codigo" class="input" placeholder="Ex: CAMP" />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                        Nome da fazenda <span class="text-red-500">*</span>
                      </label>
                      <input type="text" v-model="newFazenda.nome" class="input" placeholder="Ex: Campinas" />
                    </div>
                  </div>

                  <!-- Unidades por bandeja -->
                  <div>
                    <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Unidades por bandeja</label>
                    <input type="number" v-model.number="newFazenda.unidades_por_bandeja" class="input" placeholder="Ex: 6" min="1" />
                  </div>

                  <!-- Numero de andares e Bandejas por andar -->
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Numero de andares</label>
                      <input type="number" v-model.number="newFazenda.numero_andares" class="input" placeholder="Ex: 3" min="1" />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Bandejas por andar</label>
                      <input type="number" v-model.number="newFazenda.bandejas_por_andar" class="input" placeholder="Ex: 2" min="1" />
                    </div>
                  </div>

                  <!-- Capacidade (calculada automaticamente) -->
                  <div>
                    <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Capacidade</label>
                    <div class="input bg-gray-100 dark:bg-gray-700 cursor-not-allowed">
                      {{ capacidadeCalculada }}
                    </div>
                    <p class="text-xs text-subtext-light dark:text-subtext-dark mt-1">
                      Calculado automaticamente: Unidades x Andares x Bandejas/andar
                    </p>
                  </div>
                </div>

                <!-- Modal Footer -->
                <div class="border-t border-border-light dark:border-border-dark px-6 py-4 flex items-center justify-end gap-3">
                  <button @click="closeCreateModal" class="btn btn-secondary">Cancelar</button>
                  <button @click="saveFazenda" :disabled="saving" class="btn btn-primary">
                    <span v-if="saving" class="animate-spin material-icons text-sm">refresh</span>
                    {{ saving ? 'Salvando...' : 'Salvar fazenda' }}
                  </button>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Modal de Edicao -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        leave-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        leave-to-class="opacity-0"
      >
        <div v-if="showEditModal" class="fixed inset-0 z-[60] overflow-y-auto">
          <div class="fixed inset-0 glass-backdrop" @click="closeEditModal"></div>
          <div class="flex min-h-full items-center justify-center p-4">
            <Transition
              enter-active-class="transition-all duration-200"
              leave-active-class="transition-all duration-200"
              enter-from-class="opacity-0 scale-95"
              leave-to-class="opacity-0 scale-95"
            >
              <div v-if="showEditModal" class="relative glass-panel rounded-lg shadow-xl w-full max-w-xl">
                <!-- Modal Header -->
                <div class="border-b border-border-light dark:border-border-dark px-6 py-4 flex items-center justify-between">
                  <h2 class="text-lg font-semibold text-text-light dark:text-text-dark">Editar fazenda</h2>
                  <button @click="closeEditModal" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <span class="material-icons">close</span>
                  </button>
                </div>

                <!-- Modal Body -->
                <div class="p-6 space-y-4">
                  <!-- Codigo e Nome -->
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                        Codigo <span class="text-red-500">*</span>
                      </label>
                      <input type="text" v-model="editFazenda.codigo" class="input" placeholder="Ex: CAMP" />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                        Nome da fazenda <span class="text-red-500">*</span>
                      </label>
                      <input type="text" v-model="editFazenda.nome" class="input" placeholder="Ex: Campinas" />
                    </div>
                  </div>

                  <!-- Unidades por bandeja -->
                  <div>
                    <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Unidades por bandeja</label>
                    <input type="number" v-model.number="editFazenda.unidades_por_bandeja" class="input" placeholder="Ex: 6" min="1" />
                  </div>

                  <!-- Numero de andares e Bandejas por andar -->
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Numero de andares</label>
                      <input type="number" v-model.number="editFazenda.numero_andares" class="input" placeholder="Ex: 3" min="1" />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Bandejas por andar</label>
                      <input type="number" v-model.number="editFazenda.bandejas_por_andar" class="input" placeholder="Ex: 2" min="1" />
                    </div>
                  </div>

                  <!-- Capacidade (calculada automaticamente) -->
                  <div>
                    <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Capacidade</label>
                    <div class="input bg-gray-100 dark:bg-gray-700 cursor-not-allowed">
                      {{ capacidadeCalculadaEdit }}
                    </div>
                    <p class="text-xs text-subtext-light dark:text-subtext-dark mt-1">
                      Calculado automaticamente: Unidades x Andares x Bandejas/andar
                    </p>
                  </div>

                  <!-- Status -->
                  <div>
                    <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Status</label>
                    <select v-model="editFazenda.status" class="input">
                      <option value="active">Ativa</option>
                      <option value="inactive">Inativa</option>
                    </select>
                  </div>
                </div>

                <!-- Modal Footer -->
                <div class="border-t border-border-light dark:border-border-dark px-6 py-4 flex items-center justify-end gap-3">
                  <button @click="closeEditModal" class="btn btn-secondary">Cancelar</button>
                  <button @click="updateFazenda" :disabled="saving" class="btn btn-primary">
                    <span v-if="saving" class="animate-spin material-icons text-sm">refresh</span>
                    {{ saving ? 'Salvando...' : 'Salvar alteracoes' }}
                  </button>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Slideover de Detalhes -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-300"
        leave-active-class="transition-opacity duration-300"
        enter-from-class="opacity-0"
        leave-to-class="opacity-0"
      >
        <div v-if="showDetailsSlideover" class="fixed inset-0 z-50 overflow-hidden">
          <!-- Backdrop -->
          <div class="fixed inset-0 glass-backdrop" @click="closeDetailsSlideover"></div>

          <!-- Slideover Panel -->
          <div class="fixed inset-y-0 right-0 flex max-w-full">
            <Transition
              enter-active-class="transform transition ease-in-out duration-300"
              leave-active-class="transform transition ease-in-out duration-300"
              enter-from-class="translate-x-full"
              leave-to-class="translate-x-full"
            >
              <div v-if="showDetailsSlideover" class="w-screen max-w-full sm:max-w-xl">
                <div class="h-full flex flex-col glass-panel shadow-2xl">
                  <!-- Header -->
                  <div class="px-6 py-5 border-b border-border-light dark:border-border-dark">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-4">
                        <div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <span class="material-icons-outlined text-primary text-2xl">agriculture</span>
                        </div>
                        <div>
                          <h2 class="text-xl font-semibold text-text-light dark:text-text-dark">
                            {{ selectedFazenda?.nome }}
                          </h2>
                          <p class="text-sm text-subtext-light dark:text-subtext-dark">
                            Codigo: {{ selectedFazenda?.codigo }}
                          </p>
                        </div>
                      </div>
                      <button
                        @click="closeDetailsSlideover"
                        class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      >
                        <span class="material-icons">close</span>
                      </button>
                    </div>
                  </div>

                  <!-- Content -->
                  <div class="flex-1 overflow-y-auto p-6">
                    <!-- Status Badge -->
                    <div class="mb-6">
                      <span :class="[
                        'badge',
                        selectedFazenda?.status === 'active' ? 'badge-success' : 'badge-inactive'
                      ]">
                        {{ selectedFazenda?.status === 'active' ? 'Ativa' : 'Inativa' }}
                      </span>
                    </div>

                    <!-- Informacoes da Fazenda -->
                    <div class="space-y-6">
                      <div>
                        <h3 class="text-sm font-medium text-subtext-light dark:text-subtext-dark mb-3 uppercase tracking-wider">
                          Informacoes da Fazenda
                        </h3>
                        <div class="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                          <div class="grid grid-cols-2 gap-4">
                            <div>
                              <p class="text-xs text-subtext-light dark:text-subtext-dark">Codigo</p>
                              <p class="text-sm font-medium text-text-light dark:text-text-dark">
                                {{ selectedFazenda?.codigo }}
                              </p>
                            </div>
                            <div>
                              <p class="text-xs text-subtext-light dark:text-subtext-dark">Nome</p>
                              <p class="text-sm font-medium text-text-light dark:text-text-dark">
                                {{ selectedFazenda?.nome }}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <!-- Configuracao de Capacidade -->
                      <div>
                        <h3 class="text-sm font-medium text-subtext-light dark:text-subtext-dark mb-3 uppercase tracking-wider">
                          Configuracao de Capacidade
                        </h3>
                        <div class="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                              <p class="text-xs text-subtext-light dark:text-subtext-dark">Unidades/Bandeja</p>
                              <p class="text-lg font-semibold text-text-light dark:text-text-dark">
                                {{ selectedFazenda?.unidades_por_bandeja }}
                              </p>
                            </div>
                            <div>
                              <p class="text-xs text-subtext-light dark:text-subtext-dark">Andares</p>
                              <p class="text-lg font-semibold text-text-light dark:text-text-dark">
                                {{ selectedFazenda?.numero_andares }}
                              </p>
                            </div>
                            <div>
                              <p class="text-xs text-subtext-light dark:text-subtext-dark">Bandejas/Andar</p>
                              <p class="text-lg font-semibold text-text-light dark:text-text-dark">
                                {{ selectedFazenda?.bandejas_por_andar }}
                              </p>
                            </div>
                            <div>
                              <p class="text-xs text-subtext-light dark:text-subtext-dark">Capacidade Total</p>
                              <p class="text-lg font-semibold text-primary">
                                {{ selectedFazenda?.capacidade }}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <!-- Informacoes do Sistema -->
                      <div>
                        <h3 class="text-sm font-medium text-subtext-light dark:text-subtext-dark mb-3 uppercase tracking-wider">
                          Informacoes do Sistema
                        </h3>
                        <div class="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                          <div class="grid grid-cols-2 gap-4">
                            <div>
                              <p class="text-xs text-subtext-light dark:text-subtext-dark">Criado em</p>
                              <p class="text-sm font-medium text-text-light dark:text-text-dark">
                                {{ formatDate(selectedFazenda?.created_at) }}
                              </p>
                            </div>
                            <div>
                              <p class="text-xs text-subtext-light dark:text-subtext-dark">Atualizado em</p>
                              <p class="text-sm font-medium text-text-light dark:text-text-dark">
                                {{ formatDate(selectedFazenda?.updated_at) }}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Footer -->
                  <div class="px-6 py-4 border-t border-border-light dark:border-border-dark">
                    <div class="flex items-center justify-end gap-3">
                      <button
                        @click="toggleStatusFromSlideover"
                        :class="[
                          'btn',
                          selectedFazenda?.status === 'active' ? 'btn-secondary text-red-600' : 'btn-secondary text-green-600'
                        ]"
                      >
                        <span class="material-icons-outlined text-sm">
                          {{ selectedFazenda?.status === 'active' ? 'block' : 'check_circle' }}
                        </span>
                        {{ selectedFazenda?.status === 'active' ? 'Desativar' : 'Ativar' }}
                      </button>
                      <button @click="openEditFromSlideover" class="btn btn-primary">
                        <span class="material-icons-outlined text-sm">edit</span>
                        Editar fazenda
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useCurrentCompany } from '~/composables/useCurrentCompany'
import { useToast } from '~/composables/useToast'

const supabase = useSupabaseClient()
const { currentCompany } = useCurrentCompany()
const { success, error: showError } = useToast()

// Estado
const loading = ref(false)
const saving = ref(false)
const fazendas = ref([])

// Modais
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDetailsSlideover = ref(false)

// Fazenda selecionada
const selectedFazenda = ref(null)

// Paginacao
const currentPage = ref(1)
const itemsPerPage = ref(10)
const pageInput = ref('1')

// Filtros
const searchQuery = ref('')
const filterStatus = ref('active')

// Ordenacao
const sortField = ref('nome')
const sortDirection = ref('asc')

// Nova fazenda
const getEmptyFazenda = () => ({
  codigo: '',
  nome: '',
  unidades_por_bandeja: 6,
  numero_andares: 1,
  bandejas_por_andar: 6,
  status: 'active'
})

const newFazenda = ref(getEmptyFazenda())
const editFazenda = ref({})

// Computed - Capacidade calculada para criacao
const capacidadeCalculada = computed(() => {
  const { unidades_por_bandeja, numero_andares, bandejas_por_andar } = newFazenda.value
  if (unidades_por_bandeja && numero_andares && bandejas_por_andar) {
    return unidades_por_bandeja * numero_andares * bandejas_por_andar
  }
  return 0
})

// Computed - Capacidade calculada para edicao
const capacidadeCalculadaEdit = computed(() => {
  const { unidades_por_bandeja, numero_andares, bandejas_por_andar } = editFazenda.value
  if (unidades_por_bandeja && numero_andares && bandejas_por_andar) {
    return unidades_por_bandeja * numero_andares * bandejas_por_andar
  }
  return 0
})

// Computed - Filtros
const filteredFazendas = computed(() => {
  let result = fazendas.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(fazenda =>
      fazenda.codigo.toLowerCase().includes(query) ||
      fazenda.nome.toLowerCase().includes(query)
    )
  }

  if (filterStatus.value) {
    result = result.filter(fazenda => fazenda.status === filterStatus.value)
  }

  result = [...result].sort((a, b) => {
    let comparison = 0
    if (sortField.value === 'codigo') {
      comparison = a.codigo.localeCompare(b.codigo)
    } else if (sortField.value === 'nome') {
      comparison = a.nome.localeCompare(b.nome)
    }
    return sortDirection.value === 'asc' ? comparison : -comparison
  })

  return result
})

const totalPages = computed(() => {
  return Math.ceil(filteredFazendas.value.length / itemsPerPage.value) || 1
})

const paginatedFazendas = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredFazendas.value.slice(start, end)
})

const visiblePages = computed(() => {
  const pages = []
  const total = totalPages.value
  const current = currentPage.value

  if (total <= 5) {
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    if (current <= 3) {
      pages.push(1, 2, 3, 4, '...', total)
    } else if (current >= total - 2) {
      pages.push(1, '...', total - 3, total - 2, total - 1, total)
    } else {
      pages.push(1, '...', current - 1, current, current + 1, '...', total)
    }
  }

  return pages
})

// Funcoes de carregamento
async function loadFazendas() {
  if (!currentCompany.value?.id) return

  loading.value = true
  try {
    const { data, error } = await supabase
      .from('fazendas')
      .select('*')
      .eq('empresa_id', currentCompany.value.id)
      .order('nome')

    if (error) throw error

    fazendas.value = data || []
  } catch (e) {
    console.error('Erro ao carregar fazendas:', e)
    showError('Erro ao carregar fazendas')
  } finally {
    loading.value = false
  }
}

// Ordenacao
function sortBy(field) {
  if (sortField.value === field) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortDirection.value = 'asc'
  }
}

// Modal de criacao
function openCreateModal() {
  newFazenda.value = getEmptyFazenda()
  showCreateModal.value = true
}

function closeCreateModal() {
  showCreateModal.value = false
}

async function saveFazenda() {
  if (!currentCompany.value?.id) {
    showError('Nenhuma empresa selecionada')
    return
  }

  if (!newFazenda.value.codigo || !newFazenda.value.nome) {
    showError('Preencha todos os campos obrigatorios')
    return
  }

  saving.value = true
  try {
    // Calcular capacidade_bandejas
    const unidades = newFazenda.value.unidades_por_bandeja || 6
    const andares = newFazenda.value.numero_andares || 1
    const bandejas = newFazenda.value.bandejas_por_andar || 6
    const capacidadeBandejas = andares * bandejas

    const { error } = await supabase
      .from('fazendas')
      .insert({
        empresa_id: currentCompany.value.id,
        codigo: newFazenda.value.codigo,
        nome: newFazenda.value.nome,
        unidades_por_bandeja: unidades,
        numero_andares: andares,
        bandejas_por_andar: bandejas,
        capacidade_bandejas: capacidadeBandejas,
        status: newFazenda.value.status
      })

    if (error) throw error

    success('Fazenda criada com sucesso')
    closeCreateModal()
    await loadFazendas()
  } catch (e) {
    console.error('Erro ao criar fazenda:', e)
    showError(e.message || 'Erro ao criar fazenda')
  } finally {
    saving.value = false
  }
}

// Modal de edicao
function openEditModal(fazenda) {
  editFazenda.value = { ...fazenda }
  showEditModal.value = true
}

function closeEditModal() {
  showEditModal.value = false
}

async function updateFazenda() {
  if (!editFazenda.value.codigo || !editFazenda.value.nome) {
    showError('Preencha todos os campos obrigatorios')
    return
  }

  saving.value = true
  try {
    // Calcular capacidade_bandejas
    const andares = editFazenda.value.numero_andares || 1
    const bandejas = editFazenda.value.bandejas_por_andar || 1
    const capacidadeBandejas = andares * bandejas

    const { error } = await supabase
      .from('fazendas')
      .update({
        codigo: editFazenda.value.codigo,
        nome: editFazenda.value.nome,
        unidades_por_bandeja: editFazenda.value.unidades_por_bandeja,
        numero_andares: editFazenda.value.numero_andares,
        bandejas_por_andar: editFazenda.value.bandejas_por_andar,
        capacidade_bandejas: capacidadeBandejas,
        status: editFazenda.value.status
      })
      .eq('id', editFazenda.value.id)

    if (error) throw error

    success('Fazenda atualizada com sucesso')
    closeEditModal()

    // Atualizar fazenda selecionada se estiver aberta no slideover
    if (selectedFazenda.value?.id === editFazenda.value.id) {
      selectedFazenda.value = { ...editFazenda.value }
    }

    await loadFazendas()
  } catch (e) {
    console.error('Erro ao atualizar fazenda:', e)
    showError(e.message || 'Erro ao atualizar fazenda')
  } finally {
    saving.value = false
  }
}

// Slideover de detalhes
function openDetailsSlideover(fazenda) {
  selectedFazenda.value = fazenda
  showDetailsSlideover.value = true
}

function closeDetailsSlideover() {
  showDetailsSlideover.value = false
}

function openEditFromSlideover() {
  openEditModal(selectedFazenda.value)
}

async function toggleStatusFromSlideover() {
  if (!selectedFazenda.value) return

  const newStatus = selectedFazenda.value.status === 'active' ? 'inactive' : 'active'

  try {
    const { error } = await supabase
      .from('fazendas')
      .update({ status: newStatus })
      .eq('id', selectedFazenda.value.id)

    if (error) throw error

    selectedFazenda.value.status = newStatus
    success(`Fazenda ${newStatus === 'active' ? 'ativada' : 'desativada'} com sucesso`)
    await loadFazendas()
  } catch (e) {
    console.error('Erro ao alterar status:', e)
    showError('Erro ao alterar status da fazenda')
  }
}

// Utilitarios
function formatDate(dateString) {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Watch para recarregar quando a empresa mudar
watch(
  () => currentCompany.value?.id,
  (newId) => {
    if (newId) {
      loadFazendas()
    }
  },
  { immediate: true }
)

// Reset da pagina quando filtros mudam
watch([searchQuery, filterStatus], () => {
  currentPage.value = 1
  pageInput.value = '1'
})

watch(itemsPerPage, () => {
  currentPage.value = 1
  pageInput.value = '1'
})

watch(currentPage, (newVal) => {
  pageInput.value = String(newVal)
})

// Funcao para ir para pagina especifica
function goToPage() {
  const page = parseInt(pageInput.value)
  if (!isNaN(page) && page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  } else {
    pageInput.value = String(currentPage.value)
  }
}
</script>

<style scoped>
.badge-inactive {
  @apply bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300;
}
</style>
