<template>
  <div>
    <h1 class="text-2xl font-bold text-text-light dark:text-text-dark mb-6">Especies</h1>

    <!-- Card da Tabela -->
    <div class="card">
      <!-- Header do Card -->
      <div class="p-3 sm:p-4 border-b border-border-light dark:border-border-dark">
        <div class="flex flex-col gap-3">
          <div class="flex items-center justify-between">
            <h2 class="text-xs sm:text-sm font-medium text-subtext-light dark:text-subtext-dark uppercase tracking-wider">Lista Especies</h2>
            <!-- Botao Nova Especie - Desktop -->
            <button @click="openCreateModal" class="hidden sm:flex btn btn-primary shrink-0">
              <span class="material-icons text-sm">add</span>
              Nova especie
            </button>
          </div>
          <div class="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <!-- Filtro Status -->
            <select v-model="filterStatus" class="input text-sm w-full sm:w-28 shrink-0">
              <option value="true">Ativos</option>
              <option value="false">Inativos</option>
              <option value="">Todos</option>
            </select>
            <!-- Filtro Tipo -->
            <select v-model="filterTipo" class="input text-sm w-full sm:w-32 shrink-0">
              <option value="">Todos tipos</option>
              <option value="mix">MIX</option>
              <option value="simples">Simples</option>
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
            <!-- Botao Nova Especie - Mobile -->
            <button @click="openCreateModal" class="sm:hidden btn btn-primary w-full justify-center">
              <span class="material-icons text-sm">add</span>
              Nova especie
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
              <th class="table-header w-16">Foto</th>
              <th class="table-header cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700" @click="sortBy('nome')">
                <div class="flex items-center gap-1">
                  Nome
                  <span v-if="sortField === 'nome'" class="material-icons text-xs">
                    {{ sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward' }}
                  </span>
                </div>
              </th>
              <th class="table-header text-center w-32">Tipo</th>
              <th class="table-header text-center w-24">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-light dark:divide-border-dark">
            <tr
              v-for="especie in paginatedEspecies"
              :key="especie.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
              @click="openDetailsSlideover(especie)"
            >
              <td class="table-cell font-medium text-primary">{{ especie.codigo }}</td>
              <td class="table-cell">
                <div class="w-8 h-8 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center border-2 border-primary">
                  <img
                    v-if="especie.imagem_url"
                    :src="especie.imagem_url"
                    :alt="especie.nome"
                    class="w-full h-full object-cover"
                  />
                  <span v-else class="material-icons-outlined text-primary text-sm">eco</span>
                </div>
              </td>
              <td class="table-cell font-medium">{{ especie.nome }}</td>
              <td class="table-cell text-center">
                <span :class="[
                  'badge',
                  especie.produto_mix ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' : 'badge-success'
                ]">
                  {{ especie.produto_mix ? 'MIX' : 'Simples' }}
                </span>
              </td>
              <td class="table-cell text-center">
                <span :class="['badge', especie.ativo ? 'badge-success' : 'badge-inactive']">
                  {{ especie.ativo ? 'Ativo' : 'Inativo' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty State -->
      <div v-if="!loading && filteredEspecies.length === 0" class="flex flex-col items-center justify-center text-center py-12">
        <span class="material-icons-outlined text-4xl text-gray-300 dark:text-gray-600 mb-2">eco</span>
        <h3 class="text-lg font-medium text-text-light dark:text-text-dark mb-1">Nenhuma especie encontrada</h3>
        <p class="text-sm text-subtext-light dark:text-subtext-dark mb-4">Comece cadastrando sua primeira especie</p>
        <button @click="openCreateModal" class="btn btn-primary">
          <span class="material-icons text-sm">add</span>
          Nova especie
        </button>
      </div>

      <!-- Paginacao -->
      <div v-if="filteredEspecies.length > 0" class="p-4 flex flex-col sm:flex-row items-center justify-between border-t border-border-light dark:border-border-dark text-xs text-subtext-light dark:text-subtext-dark gap-4">
        <div class="flex items-center gap-4">
          <select v-model="itemsPerPage" class="border border-border-light dark:border-border-dark rounded px-2 py-1 bg-white dark:bg-gray-800 text-sm cursor-pointer">
            <option :value="10">10 linhas</option>
            <option :value="25">25 linhas</option>
            <option :value="50">50 linhas</option>
          </select>
          <span>{{ filteredEspecies.length }} registros</span>
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
              <div v-if="showCreateModal" class="relative glass-panel rounded-lg shadow-xl w-full max-w-lg">
                <!-- Modal Header -->
                <div class="border-b border-border-light dark:border-border-dark px-6 py-4 flex items-center justify-between">
                  <h2 class="text-lg font-semibold text-text-light dark:text-text-dark">Nova especie</h2>
                  <button @click="closeCreateModal" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <span class="material-icons">close</span>
                  </button>
                </div>

                <!-- Modal Body -->
                <div class="p-6 space-y-5">
                  <!-- Upload de Imagem -->
                  <div class="flex flex-col items-center">
                    <div class="relative">
                      <div class="w-24 h-24 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center border-2 border-primary">
                        <img
                          v-if="newImagePreview"
                          :src="newImagePreview"
                          alt="Preview"
                          class="w-full h-full object-cover"
                        />
                        <span v-else class="material-icons-outlined text-primary text-4xl">eco</span>
                      </div>
                    </div>
                    <p class="mt-2 text-sm font-medium text-text-light dark:text-text-dark">Imagem da especie</p>
                    <label class="mt-2 cursor-pointer">
                      <span class="px-4 py-2 text-sm font-medium text-primary border border-primary rounded-lg hover:bg-primary/5 transition-colors">
                        Carregar imagem
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        class="hidden"
                        @change="handleImageUpload($event, 'new')"
                      />
                    </label>
                  </div>

                  <!-- Codigo e Nome -->
                  <div class="grid grid-cols-3 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                        Codigo <span class="text-red-500">*</span>
                      </label>
                      <input type="text" v-model="newEspecie.codigo" class="input" placeholder="Ex: AGRI" maxlength="10" />
                    </div>
                    <div class="col-span-2">
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                        Nome <span class="text-red-500">*</span>
                      </label>
                      <input type="text" v-model="newEspecie.nome" class="input" placeholder="Ex: Agriao" />
                    </div>
                  </div>

                  <!-- Produto MIX -->
                  <div class="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="newProdutoMix"
                      v-model="newEspecie.produto_mix"
                      class="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                    />
                    <label for="newProdutoMix" class="text-sm font-medium text-text-light dark:text-text-dark">
                      Produto MIX
                    </label>
                  </div>
                </div>

                <!-- Modal Footer -->
                <div class="border-t border-border-light dark:border-border-dark px-6 py-4 flex items-center justify-end gap-3">
                  <button @click="closeCreateModal" class="btn btn-secondary">Cancelar</button>
                  <button @click="saveEspecie" :disabled="saving" class="btn btn-primary">
                    <span v-if="saving" class="animate-spin material-icons text-sm">refresh</span>
                    {{ saving ? 'Salvando...' : 'Salvar especie' }}
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
              <div v-if="showEditModal" class="relative glass-panel rounded-lg shadow-xl w-full max-w-lg">
                <!-- Modal Header -->
                <div class="border-b border-border-light dark:border-border-dark px-6 py-4 flex items-center justify-between">
                  <h2 class="text-lg font-semibold text-text-light dark:text-text-dark">Editar especie</h2>
                  <button @click="closeEditModal" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <span class="material-icons">close</span>
                  </button>
                </div>

                <!-- Modal Body -->
                <div class="p-6 space-y-5">
                  <!-- Upload de Imagem -->
                  <div class="flex flex-col items-center">
                    <div class="relative">
                      <div class="w-24 h-24 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center border-2 border-primary">
                        <img
                          v-if="editImagePreview || editEspecie.imagem_url"
                          :src="editImagePreview || editEspecie.imagem_url"
                          alt="Preview"
                          class="w-full h-full object-cover"
                        />
                        <span v-else class="material-icons-outlined text-primary text-4xl">eco</span>
                      </div>
                    </div>
                    <p class="mt-2 text-sm font-medium text-text-light dark:text-text-dark">Imagem da especie</p>
                    <label class="mt-2 cursor-pointer">
                      <span class="px-4 py-2 text-sm font-medium text-primary border border-primary rounded-lg hover:bg-primary/5 transition-colors">
                        Alterar imagem
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        class="hidden"
                        @change="handleImageUpload($event, 'edit')"
                      />
                    </label>
                  </div>

                  <!-- Codigo e Nome -->
                  <div class="grid grid-cols-3 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                        Codigo <span class="text-red-500">*</span>
                      </label>
                      <input type="text" v-model="editEspecie.codigo" class="input" placeholder="Ex: AGRI" maxlength="10" />
                    </div>
                    <div class="col-span-2">
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                        Nome <span class="text-red-500">*</span>
                      </label>
                      <input type="text" v-model="editEspecie.nome" class="input" placeholder="Ex: Agriao" />
                    </div>
                  </div>

                  <!-- Produto MIX e Status -->
                  <div class="flex items-center gap-6">
                    <div class="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="editProdutoMix"
                        v-model="editEspecie.produto_mix"
                        class="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                      />
                      <label for="editProdutoMix" class="text-sm font-medium text-text-light dark:text-text-dark">
                        Produto MIX
                      </label>
                    </div>
                    <div class="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="editAtivo"
                        v-model="editEspecie.ativo"
                        class="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                      />
                      <label for="editAtivo" class="text-sm font-medium text-text-light dark:text-text-dark">
                        Ativo
                      </label>
                    </div>
                  </div>
                </div>

                <!-- Modal Footer -->
                <div class="border-t border-border-light dark:border-border-dark px-6 py-4 flex items-center justify-end gap-3">
                  <button @click="closeEditModal" class="btn btn-secondary">Cancelar</button>
                  <button @click="updateEspecie" :disabled="saving" class="btn btn-primary">
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
                        <div class="w-16 h-16 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center border-2 border-primary">
                          <img
                            v-if="selectedEspecie?.imagem_url"
                            :src="selectedEspecie.imagem_url"
                            :alt="selectedEspecie.nome"
                            class="w-full h-full object-cover"
                          />
                          <span v-else class="material-icons-outlined text-primary text-3xl">eco</span>
                        </div>
                        <div>
                          <h2 class="text-xl font-semibold text-text-light dark:text-text-dark">
                            {{ selectedEspecie?.nome }}
                          </h2>
                          <p class="text-sm text-subtext-light dark:text-subtext-dark">
                            Codigo: {{ selectedEspecie?.codigo }}
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
                    <!-- Status Badges -->
                    <div class="flex gap-2 mb-6">
                      <span :class="[
                        'badge',
                        selectedEspecie?.produto_mix ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' : 'badge-success'
                      ]">
                        {{ selectedEspecie?.produto_mix ? 'Produto MIX' : 'Especie Simples' }}
                      </span>
                      <span :class="['badge', selectedEspecie?.ativo ? 'badge-success' : 'badge-inactive']">
                        {{ selectedEspecie?.ativo ? 'Ativo' : 'Inativo' }}
                      </span>
                    </div>

                    <!-- Informacoes -->
                    <div class="space-y-6">
                      <div>
                        <h3 class="text-sm font-medium text-subtext-light dark:text-subtext-dark mb-3 uppercase tracking-wider">
                          Informacoes da Especie
                        </h3>
                        <div class="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                          <div class="grid grid-cols-2 gap-4">
                            <div>
                              <p class="text-xs text-subtext-light dark:text-subtext-dark">Codigo</p>
                              <p class="text-sm font-medium text-text-light dark:text-text-dark">
                                {{ selectedEspecie?.codigo }}
                              </p>
                            </div>
                            <div>
                              <p class="text-xs text-subtext-light dark:text-subtext-dark">Nome</p>
                              <p class="text-sm font-medium text-text-light dark:text-text-dark">
                                {{ selectedEspecie?.nome }}
                              </p>
                            </div>
                            <div>
                              <p class="text-xs text-subtext-light dark:text-subtext-dark">Tipo</p>
                              <p class="text-sm font-medium text-text-light dark:text-text-dark">
                                {{ selectedEspecie?.produto_mix ? 'Produto MIX' : 'Especie Simples' }}
                              </p>
                            </div>
                            <div>
                              <p class="text-xs text-subtext-light dark:text-subtext-dark">Status</p>
                              <p class="text-sm font-medium text-text-light dark:text-text-dark">
                                {{ selectedEspecie?.ativo ? 'Ativo' : 'Inativo' }}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <!-- Imagem -->
                      <div v-if="selectedEspecie?.imagem_url">
                        <h3 class="text-sm font-medium text-subtext-light dark:text-subtext-dark mb-3 uppercase tracking-wider">
                          Imagem
                        </h3>
                        <div class="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                          <img
                            :src="selectedEspecie.imagem_url"
                            :alt="selectedEspecie.nome"
                            class="max-w-xs rounded-lg"
                          />
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
                                {{ formatDate(selectedEspecie?.created_at) }}
                              </p>
                            </div>
                            <div>
                              <p class="text-xs text-subtext-light dark:text-subtext-dark">Atualizado em</p>
                              <p class="text-sm font-medium text-text-light dark:text-text-dark">
                                {{ formatDate(selectedEspecie?.updated_at) }}
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
                          selectedEspecie?.ativo ? 'btn-secondary text-red-600' : 'btn-secondary text-green-600'
                        ]"
                      >
                        <span class="material-icons-outlined text-sm">
                          {{ selectedEspecie?.ativo ? 'block' : 'check_circle' }}
                        </span>
                        {{ selectedEspecie?.ativo ? 'Desativar' : 'Ativar' }}
                      </button>
                      <button @click="openEditFromSlideover" class="btn btn-primary">
                        <span class="material-icons-outlined text-sm">edit</span>
                        Editar especie
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
import { ref, computed, watch } from 'vue'
import { useCurrentCompany } from '~/composables/useCurrentCompany'
import { useToast } from '~/composables/useToast'

const supabase = useSupabaseClient()
const { currentCompany } = useCurrentCompany()
const { success, error: showError } = useToast()

// Estado
const loading = ref(false)
const saving = ref(false)
const especies = ref([])

// Modais
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDetailsSlideover = ref(false)

// Especie selecionada
const selectedEspecie = ref(null)

// Upload de imagem
const newImageFile = ref(null)
const newImagePreview = ref(null)
const editImageFile = ref(null)
const editImagePreview = ref(null)

// Paginacao
const currentPage = ref(1)
const itemsPerPage = ref(10)
const pageInput = ref('1')

// Filtros
const searchQuery = ref('')
const filterTipo = ref('')
const filterStatus = ref('true')

// Ordenacao
const sortField = ref('nome')
const sortDirection = ref('asc')

// Nova especie
const getEmptyEspecie = () => ({
  codigo: '',
  nome: '',
  produto_mix: false,
  ativo: true
})

const newEspecie = ref(getEmptyEspecie())
const editEspecie = ref({})

// Computed - Filtros
const filteredEspecies = computed(() => {
  let result = especies.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(e =>
      e.codigo.toLowerCase().includes(query) ||
      e.nome.toLowerCase().includes(query)
    )
  }

  if (filterTipo.value) {
    const isMix = filterTipo.value === 'mix'
    result = result.filter(e => e.produto_mix === isMix)
  }

  if (filterStatus.value) {
    const isAtivo = filterStatus.value === 'true'
    result = result.filter(e => e.ativo === isAtivo)
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
  return Math.ceil(filteredEspecies.value.length / itemsPerPage.value) || 1
})

const paginatedEspecies = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredEspecies.value.slice(start, end)
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
async function loadEspecies() {
  if (!currentCompany.value?.id) return

  loading.value = true
  try {
    const { data, error } = await supabase
      .from('especies')
      .select('*')
      .eq('empresa_id', currentCompany.value.id)
      .order('nome')

    if (error) throw error

    especies.value = data || []
  } catch (e) {
    console.error('Erro ao carregar especies:', e)
    showError('Erro ao carregar especies')
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

// Upload de imagem
function handleImageUpload(event, type) {
  const file = event.target.files[0]
  if (!file) return

  if (file.size > 2 * 1024 * 1024) {
    showError('Imagem deve ter no maximo 2MB')
    return
  }

  if (!file.type.startsWith('image/')) {
    showError('Arquivo deve ser uma imagem')
    return
  }

  if (type === 'new') {
    newImageFile.value = file
    newImagePreview.value = URL.createObjectURL(file)
  } else {
    editImageFile.value = file
    editImagePreview.value = URL.createObjectURL(file)
  }
}

async function uploadImage(file, especieId) {
  const fileExt = file.name.split('.').pop()
  const fileName = `${especieId}.${fileExt}`
  const filePath = `${currentCompany.value.id}/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('especies')
    .upload(filePath, file, { upsert: true })

  if (uploadError) throw uploadError

  const { data: { publicUrl } } = supabase.storage
    .from('especies')
    .getPublicUrl(filePath)

  return publicUrl
}

// Modal de criacao
function openCreateModal() {
  newEspecie.value = getEmptyEspecie()
  newImageFile.value = null
  newImagePreview.value = null
  showCreateModal.value = true
}

function closeCreateModal() {
  showCreateModal.value = false
}

async function saveEspecie() {
  if (!currentCompany.value?.id) {
    showError('Nenhuma empresa selecionada')
    return
  }

  if (!newEspecie.value.codigo || !newEspecie.value.nome) {
    showError('Preencha todos os campos obrigatorios')
    return
  }

  saving.value = true
  try {
    const { data, error } = await supabase
      .from('especies')
      .insert({
        empresa_id: currentCompany.value.id,
        codigo: newEspecie.value.codigo,
        nome: newEspecie.value.nome,
        produto_mix: newEspecie.value.produto_mix,
        ativo: true
      })
      .select()
      .single()

    if (error) throw error

    // Upload de imagem se houver
    if (newImageFile.value && data) {
      const imageUrl = await uploadImage(newImageFile.value, data.id)
      await supabase
        .from('especies')
        .update({ imagem_url: imageUrl })
        .eq('id', data.id)
    }

    success('Especie criada com sucesso')
    closeCreateModal()
    await loadEspecies()
  } catch (e) {
    console.error('Erro ao criar especie:', e)
    showError(e.message || 'Erro ao criar especie')
  } finally {
    saving.value = false
  }
}

// Modal de edicao
function openEditModal(especie) {
  editEspecie.value = { ...especie }
  editImageFile.value = null
  editImagePreview.value = null
  showEditModal.value = true
}

function closeEditModal() {
  showEditModal.value = false
}

async function updateEspecie() {
  if (!editEspecie.value.codigo || !editEspecie.value.nome) {
    showError('Preencha todos os campos obrigatorios')
    return
  }

  saving.value = true
  try {
    let imageUrl = editEspecie.value.imagem_url

    // Upload nova imagem se houver
    if (editImageFile.value) {
      imageUrl = await uploadImage(editImageFile.value, editEspecie.value.id)
    }

    const { error } = await supabase
      .from('especies')
      .update({
        codigo: editEspecie.value.codigo,
        nome: editEspecie.value.nome,
        produto_mix: editEspecie.value.produto_mix,
        ativo: editEspecie.value.ativo,
        imagem_url: imageUrl
      })
      .eq('id', editEspecie.value.id)

    if (error) throw error

    success('Especie atualizada com sucesso')
    closeEditModal()

    if (selectedEspecie.value?.id === editEspecie.value.id) {
      selectedEspecie.value = { ...editEspecie.value, imagem_url: imageUrl }
    }

    await loadEspecies()
  } catch (e) {
    console.error('Erro ao atualizar especie:', e)
    showError(e.message || 'Erro ao atualizar especie')
  } finally {
    saving.value = false
  }
}

// Slideover de detalhes
function openDetailsSlideover(especie) {
  selectedEspecie.value = especie
  showDetailsSlideover.value = true
}

function closeDetailsSlideover() {
  showDetailsSlideover.value = false
}

function openEditFromSlideover() {
  openEditModal(selectedEspecie.value)
}

async function toggleStatusFromSlideover() {
  if (!selectedEspecie.value) return

  const newStatus = !selectedEspecie.value.ativo

  try {
    const { error } = await supabase
      .from('especies')
      .update({ ativo: newStatus })
      .eq('id', selectedEspecie.value.id)

    if (error) throw error

    selectedEspecie.value.ativo = newStatus
    success(`Especie ${newStatus ? 'ativada' : 'desativada'} com sucesso`)
    await loadEspecies()
  } catch (e) {
    console.error('Erro ao alterar status:', e)
    showError('Erro ao alterar status da especie')
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
      loadEspecies()
    }
  },
  { immediate: true }
)

// Reset da pagina quando filtros mudam
watch([searchQuery, filterTipo, filterStatus], () => {
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
