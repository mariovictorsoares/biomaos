<template>
  <div>
    <!-- Toolbar (fora do card) -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-4 mb-4">
      <!-- Lado Esquerdo: Filtros -->
      <div class="flex flex-col sm:flex-row gap-2 sm:gap-3 flex-1">
        <!-- Filtro Status -->
        <select v-model="filterAtivo" class="input text-xs sm:text-sm flex-1 sm:flex-none sm:w-40">
          <option value="">Todos</option>
          <option value="true">Ativos</option>
          <option value="false">Inativos</option>
        </select>

        <!-- Filtro Especie -->
        <select v-model="filterEspecie" class="input text-xs sm:text-sm flex-1 sm:flex-none sm:w-40">
          <option value="">Espécie</option>
          <option v-for="especie in especies" :key="especie.id" :value="especie.id">
            {{ especie.nome }}
          </option>
        </select>

        <!-- Filtro Fazenda -->
        <select v-model="filterFazenda" class="input text-xs sm:text-sm flex-1 sm:flex-none sm:w-40">
          <option value="">Fazenda</option>
          <option v-for="fazenda in fazendas" :key="fazenda.id" :value="fazenda.id">
            {{ fazenda.nome }}
          </option>
        </select>
      </div>

      <!-- Lado Direito: Botao Desktop -->
      <button @click="openModal()" class="hidden sm:flex btn btn-primary shrink-0">
        Nova Recorrência
      </button>
      <!-- Botao Mobile -->
      <button @click="openModal()" class="sm:hidden btn btn-primary w-full justify-center">
        Nova Recorrência
      </button>
    </div>

    <!-- Card Principal -->
    <div class="card" style="overflow: hidden; max-width: 100%;">

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-16">
        <span class="material-icons-outlined text-5xl text-gray-300 dark:text-gray-600 animate-spin">refresh</span>
        <p class="text-sm text-subtext-light dark:text-subtext-dark mt-3">Carregando plantios recorrentes...</p>
      </div>

      <!-- Tabela - Desktop -->
      <div v-if="!loading && filteredRecorrentes.length > 0" class="hidden lg:block">
        <div class="table-scroll-container custom-scrollbar">
          <table class="w-full text-left border-collapse" style="min-width: 800px;">
            <thead>
              <tr class="bg-gray-100 dark:bg-gray-700/50 border-b border-border-light dark:border-border-dark text-xs">
                <th class="table-header font-medium whitespace-nowrap">Nome</th>
                <th class="table-header font-medium whitespace-nowrap">Espécie</th>
                <th class="table-header font-medium text-center whitespace-nowrap">Bandejas</th>
                <th class="table-header font-medium whitespace-nowrap">Frequência</th>
                <th class="table-header font-medium whitespace-nowrap hidden xl:table-cell">Fazenda</th>
                <th class="table-header font-medium text-center whitespace-nowrap">Ativo</th>
                <th class="table-header font-medium text-center whitespace-nowrap w-24">Ações</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border-light dark:divide-border-dark">
              <tr
                v-for="rec in paginatedRecorrentes"
                :key="rec.id"
                class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <td class="table-cell text-xs font-medium whitespace-nowrap">{{ rec.nome }}</td>
                <td class="table-cell text-xs whitespace-nowrap">{{ rec.especies?.nome || '-' }}</td>
                <td class="table-cell text-center text-xs">{{ formatNumber(rec.bandejas) }}</td>
                <td class="table-cell text-xs whitespace-nowrap">{{ formatFrequencia(rec) }}</td>
                <td class="table-cell text-xs whitespace-nowrap hidden xl:table-cell">{{ rec.fazendas?.nome || '-' }}</td>
                <td class="table-cell text-center p-1" @click.stop>
                  <button
                    @click="toggleAtivo(rec)"
                    :class="[
                      'relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none',
                      rec.ativo ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
                    ]"
                    :disabled="togglingId === rec.id"
                  >
                    <span
                      :class="[
                        'inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform',
                        rec.ativo ? 'translate-x-[18px]' : 'translate-x-[3px]'
                      ]"
                    />
                  </button>
                </td>
                <td class="table-cell text-center p-1">
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
      </div>

      <!-- Cards - Mobile/Tablet -->
      <div v-if="!loading && filteredRecorrentes.length > 0" class="lg:hidden divide-y divide-border-light dark:divide-border-dark">
        <div
          v-for="rec in paginatedRecorrentes"
          :key="rec.id"
          class="p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        >
          <!-- Header do Card -->
          <div class="flex items-start justify-between gap-2 mb-3">
            <div class="flex items-center gap-2 flex-wrap">
              <span :class="['text-[10px] px-2 py-0.5 rounded-full border whitespace-nowrap', rec.ativo ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' : 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-500 dark:border-gray-700']">
                {{ rec.ativo ? 'Ativo' : 'Inativo' }}
              </span>
              <span class="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 whitespace-nowrap">
                {{ formatFrequencia(rec) }}
              </span>
            </div>
            <div class="flex items-center gap-1 shrink-0">
              <button
                @click="openModal(rec)"
                class="text-gray-400 hover:text-primary transition-colors"
              >
                <span class="material-icons-outlined text-lg">edit</span>
              </button>
              <button
                @click="confirmDelete(rec)"
                class="text-gray-400 hover:text-red-500 transition-colors"
              >
                <span class="material-icons-outlined text-lg">delete</span>
              </button>
            </div>
          </div>

          <!-- Info Principal -->
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <span class="material-icons-outlined text-lg text-primary">repeat</span>
            </div>
            <div class="min-w-0 flex-1">
              <p class="font-semibold text-sm text-text-light dark:text-text-dark truncate">{{ rec.nome }}</p>
              <p class="text-xs text-subtext-light dark:text-subtext-dark truncate">{{ rec.especies?.nome || '-' }}</p>
            </div>
          </div>

          <!-- Grid de Informacoes -->
          <div class="grid grid-cols-3 gap-2 text-[11px]">
            <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-center">
              <p class="text-subtext-light dark:text-subtext-dark mb-0.5">Bandejas</p>
              <p class="font-semibold text-text-light dark:text-text-dark">{{ formatNumber(rec.bandejas) }}</p>
            </div>
            <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-center">
              <p class="text-subtext-light dark:text-subtext-dark mb-0.5">Início</p>
              <p class="font-semibold text-text-light dark:text-text-dark">{{ formatDateBR(rec.data_inicio) || '-' }}</p>
            </div>
            <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-center">
              <p class="text-subtext-light dark:text-subtext-dark mb-0.5">Fazenda</p>
              <p class="font-semibold text-text-light dark:text-text-dark truncate">{{ rec.fazendas?.nome || '-' }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="!loading && filteredRecorrentes.length === 0" class="text-center py-16 flex flex-col items-center px-4">
        <div class="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
          <span class="material-icons-outlined text-4xl text-gray-400 dark:text-gray-500">repeat</span>
        </div>
        <h3 class="text-lg font-semibold text-text-light dark:text-text-dark mb-2">Nenhum plantio recorrente encontrado</h3>
        <p class="text-sm text-subtext-light dark:text-subtext-dark mb-6 max-w-sm">
          Crie plantios recorrentes para automatizar o agendamento da produção.
        </p>
        <button @click="openModal()" class="btn btn-primary">
          Nova Recorrência
        </button>
      </div>

      <!-- Paginacao -->
      <div v-if="filteredRecorrentes.length > 0" class="p-4 flex flex-col sm:flex-row items-center justify-between border-t border-border-light dark:border-border-dark text-xs text-subtext-light dark:text-subtext-dark gap-4">
        <div class="flex items-center gap-4">
          <select v-model="itemsPerPage" class="border border-border-light dark:border-border-dark rounded px-2 py-1 bg-white dark:bg-gray-800 text-sm cursor-pointer">
            <option :value="10">10 linhas</option>
            <option :value="25">25 linhas</option>
            <option :value="50">50 linhas</option>
          </select>
          <span>{{ filteredRecorrentes.length }} registros</span>
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="currentPage--"
            :disabled="currentPage === 1"
            class="p-1 border border-border-light dark:border-border-dark rounded hover:bg-gray-50 dark:hover:bg-gray-800 bg-white dark:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span class="material-icons-outlined text-sm">chevron_left</span>
          </button>
          <span>Página</span>
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
            <span class="material-icons-outlined text-sm">chevron_right</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Criar/Editar -->
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
              <div v-if="showModal" class="relative z-[101] bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                <!-- Header -->
                <div class="px-6 py-4 border-b border-border-light dark:border-border-dark flex items-center justify-between">
                  <h2 class="text-lg font-semibold text-text-light dark:text-text-dark">
                    {{ editingId ? 'Editar Plantio Recorrente' : 'Novo Plantio Recorrente' }}
                  </h2>
                  <button @click="closeModal" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <span class="material-icons-outlined">close</span>
                  </button>
                </div>

                <!-- Body -->
                <div class="p-6 overflow-y-auto flex-1 space-y-4">
                  <!-- Nome -->
                  <div>
                    <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Nome *</label>
                    <input type="text" v-model="form.nome" class="input" placeholder="Ex: Rucula semanal" />
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <!-- Especie -->
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Especie *</label>
                      <select v-model="form.especie_id" class="input" @change="onEspecieChange">
                        <option value="">Selecione</option>
                        <option v-for="especie in especies" :key="especie.id" :value="especie.id">
                          {{ especie.nome }}
                        </option>
                      </select>
                    </div>

                    <!-- Lote -->
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Lote de Semente</label>
                      <select v-model="form.lote_semente_id" class="input" :disabled="!form.especie_id">
                        <option value="">Selecione o lote</option>
                        <option v-for="lote in lotesFiltrados" :key="lote.id" :value="lote.id">
                          {{ lote.numero }}
                        </option>
                      </select>
                    </div>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <!-- Fazenda -->
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Fazenda</label>
                      <select v-model="form.fazenda_id" class="input">
                        <option value="">Selecione</option>
                        <option v-for="fazenda in fazendas" :key="fazenda.id" :value="fazenda.id">
                          {{ fazenda.nome }}
                        </option>
                      </select>
                    </div>

                    <!-- Bandejas -->
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Bandejas *</label>
                      <input type="number" v-model.number="form.bandejas" class="input" min="1" />
                    </div>
                  </div>

                  <!-- Recorrência -->
                  <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-4">
                    <h3 class="text-sm font-semibold text-text-light dark:text-text-dark">Configuração de Recorrência</h3>

                    <!-- Recorrência Infinita -->
                    <label class="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" v-model="form.recorrencia_infinita" class="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary" />
                      <span class="text-sm text-text-light dark:text-text-dark">Recorrência infinita</span>
                    </label>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <!-- Data Início -->
                      <div>
                        <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Data Início *</label>
                        <input type="date" v-model="form.data_inicio" class="input" />
                      </div>

                      <!-- Data Fim -->
                      <div v-if="!form.recorrencia_infinita">
                        <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Data Fim</label>
                        <input type="date" v-model="form.data_fim" class="input" />
                      </div>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <!-- Tipo Frequência -->
                      <div>
                        <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Tipo de Frequência</label>
                        <select v-model="form.tipo_frequencia" class="input">
                          <option value="semanal">Semanal</option>
                          <option value="dia_semana">Dia da Semana</option>
                          <option value="dia_util_mes">Dia Útil do Mês</option>
                        </select>
                      </div>

                      <!-- Intervalo (para semanal) -->
                      <div v-if="form.tipo_frequencia === 'semanal'">
                        <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Intervalo (semanas)</label>
                        <input type="number" v-model.number="form.intervalo" class="input" min="1" />
                      </div>

                      <!-- Intervalo (para dia_util_mes) -->
                      <div v-if="form.tipo_frequencia === 'dia_util_mes'">
                        <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">N-ésimo dia útil</label>
                        <input type="number" v-model.number="form.intervalo" class="input" min="1" max="23" />
                      </div>

                      <!-- Dia da Semana -->
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

                    <!-- Preview -->
                    <div class="text-xs text-subtext-light dark:text-subtext-dark bg-white dark:bg-gray-900 rounded px-3 py-2">
                      Frequência: <span class="font-medium text-text-light dark:text-text-dark">{{ frequenciaPreview }}</span>
                    </div>

                    <!-- Criar Atrasados -->
                    <label class="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" v-model="form.criar_atrasados" class="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary" />
                      <span class="text-sm text-text-light dark:text-text-dark">Criar plantios atrasados ao ativar</span>
                    </label>
                  </div>

                  <!-- Notas -->
                  <div>
                    <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Notas</label>
                    <textarea v-model="form.notas" class="input" rows="3" placeholder="Observações opcionais..."></textarea>
                  </div>
                </div>

                <!-- Footer -->
                <div class="px-6 py-4 border-t border-border-light dark:border-border-dark flex items-center justify-end gap-3">
                  <button @click="closeModal" class="btn btn-secondary">Voltar</button>
                  <button @click="salvar" class="btn btn-primary" :disabled="saving || !isFormValid">
                    <span v-if="saving" class="material-icons-outlined text-sm animate-spin">refresh</span>
                    {{ saving ? 'Salvando...' : (editingId ? 'Salvar' : 'Criar Recorrência') }}
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
        <div v-if="showDeleteModal" class="fixed inset-0 z-[100] overflow-y-auto">
          <div class="fixed inset-0 glass-backdrop z-[100]" @click="showDeleteModal = false"></div>
          <div class="flex min-h-full items-center justify-center p-4">
            <Transition
              enter-active-class="transition-all duration-200"
              enter-from-class="opacity-0 scale-95"
              enter-to-class="opacity-100 scale-100"
              leave-active-class="transition-all duration-200"
              leave-from-class="opacity-100 scale-100"
              leave-to-class="opacity-0 scale-95"
            >
              <div v-if="showDeleteModal" class="relative z-[101] bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                <div class="p-6 text-center">
                  <div class="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                    <span class="material-icons-outlined text-2xl text-red-500">delete</span>
                  </div>
                  <h3 class="text-lg font-semibold text-text-light dark:text-text-dark mb-2">Excluir Recorrência</h3>
                  <p class="text-sm text-subtext-light dark:text-subtext-dark mb-6">
                    Tem certeza que deseja excluir <strong>"{{ deleteTarget?.nome }}"</strong>? Esta ação não pode ser desfeita.
                  </p>
                  <div class="flex items-center justify-center gap-3">
                    <button @click="showDeleteModal = false" class="btn btn-secondary">Cancelar</button>
                    <button @click="excluir" class="btn bg-red-500 hover:bg-red-600 text-white" :disabled="saving">
                      <span v-if="saving" class="material-icons-outlined text-sm animate-spin">refresh</span>
                      {{ saving ? 'Excluindo...' : 'Excluir' }}
                    </button>
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

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useCurrentCompany } from '~/composables/useCurrentCompany'
import { useToast } from '~/composables/useToast'

// Interfaces
interface PlantioRecorrente {
  id: string
  empresa_id: string
  nome: string
  especie_id: string
  lote_semente_id?: string
  fazenda_id?: string
  bandejas: number
  recorrencia_infinita: boolean
  data_inicio: string
  data_fim?: string
  tipo_frequencia: 'semanal' | 'dia_semana' | 'dia_util_mes'
  intervalo?: number
  dia_semana?: number
  criar_atrasados: boolean
  ativo: boolean
  ultima_geracao?: string
  notas?: string
  created_at?: string
  updated_at?: string
  especies?: { id: string; nome: string }
  lotes_sementes?: { id: string; numero: string }
  fazendas?: { id: string; nome: string }
}

interface Fazenda { id: string; nome: string }
interface Especie { id: string; nome: string }
interface Lote { id: string; numero: string; especie_id?: string; status?: string }

interface FormData {
  nome: string
  especie_id: string
  lote_semente_id: string
  fazenda_id: string
  bandejas: number | null
  recorrencia_infinita: boolean
  data_inicio: string
  data_fim: string
  tipo_frequencia: 'semanal' | 'dia_semana' | 'dia_util_mes'
  intervalo: number
  dia_semana: number
  criar_atrasados: boolean
  notas: string
}

const supabase = useSupabaseClient()
const { currentCompany } = useCurrentCompany()
const { success, error: showError } = useToast()

const numFmt = new Intl.NumberFormat('pt-BR')

// State
const recorrentes = ref<PlantioRecorrente[]>([])
const especies = ref<Especie[]>([])
const fazendas = ref<Fazenda[]>([])
const lotes = ref<Lote[]>([])
const loading = ref(true)
const saving = ref(false)
const togglingId = ref<string | null>(null)

// Filters
const filterAtivo = ref<string>('')
const filterEspecie = ref<string>('')
const filterFazenda = ref<string>('')

// Pagination
const currentPage = ref(1)
const itemsPerPage = ref(10)
const pageInput = ref('1')

// Modal
const showModal = ref(false)
const editingId = ref<string | null>(null)
const form = ref<FormData>(getEmptyForm())

// Delete modal
const showDeleteModal = ref(false)
const deleteTarget = ref<PlantioRecorrente | null>(null)

// Day labels (0=Domingo, 6=Sabado)
const diasSemanaLabels: Record<number, string> = {
  0: 'domingo',
  1: 'segunda-feira',
  2: 'terça-feira',
  3: 'quarta-feira',
  4: 'quinta-feira',
  5: 'sexta-feira',
  6: 'sábado'
}

// Computed
const filteredRecorrentes = computed(() => {
  let list = [...recorrentes.value]

  if (filterAtivo.value !== '') {
    const isAtivo = filterAtivo.value === 'true'
    list = list.filter(r => r.ativo === isAtivo)
  }
  if (filterEspecie.value) {
    list = list.filter(r => r.especie_id === filterEspecie.value)
  }
  if (filterFazenda.value) {
    list = list.filter(r => r.fazenda_id === filterFazenda.value)
  }

  return list
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredRecorrentes.value.length / itemsPerPage.value)))

const paginatedRecorrentes = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  return filteredRecorrentes.value.slice(start, start + itemsPerPage.value)
})

const lotesFiltrados = computed(() => {
  if (!form.value.especie_id) return []
  return lotes.value.filter(l => l.especie_id === form.value.especie_id && l.status === 'ativo')
})

const isFormValid = computed(() => {
  return !!(form.value.nome && form.value.especie_id && form.value.bandejas && form.value.bandejas > 0 && form.value.data_inicio)
})

const frequenciaPreview = computed(() => {
  return formatFrequenciaFromValues(form.value.tipo_frequencia, form.value.intervalo, form.value.dia_semana)
})

// Watchers
watch(filteredRecorrentes, () => {
  if (currentPage.value > totalPages.value) {
    currentPage.value = totalPages.value
  }
})

watch(currentPage, (val) => {
  pageInput.value = String(val)
})

watch(itemsPerPage, () => {
  currentPage.value = 1
})

watch(() => currentCompany.value?.id, () => {
  fetchAll()
})

// Methods
function getEmptyForm(): FormData {
  return {
    nome: '',
    especie_id: '',
    lote_semente_id: '',
    fazenda_id: '',
    bandejas: null,
    recorrencia_infinita: false,
    data_inicio: '',
    data_fim: '',
    tipo_frequencia: 'semanal',
    intervalo: 1,
    dia_semana: 1,
    criar_atrasados: false,
    notas: ''
  }
}

function goToPage() {
  const page = parseInt(pageInput.value)
  if (!isNaN(page) && page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  } else {
    pageInput.value = String(currentPage.value)
  }
}

function formatDateBR(dateStr?: string): string {
  if (!dateStr) return ''
  const date = new Date(dateStr + 'T12:00:00')
  return date.toLocaleDateString('pt-BR')
}

function formatNumber(val?: number | null): string {
  if (val === undefined || val === null) return '0'
  return numFmt.format(val)
}

function formatFrequenciaFromValues(tipo: string, intervalo?: number, dia?: number): string {
  switch (tipo) {
    case 'semanal':
      if (intervalo && intervalo === 1) return 'Semanalmente'
      return `A cada ${intervalo || 1} semana(s)`
    case 'dia_semana': {
      const diaLabel = diasSemanaLabels[dia ?? 1] || 'segunda-feira'
      return `Toda ${diaLabel}`
    }
    case 'dia_util_mes':
      return `${intervalo || 1}-ésimo dia útil do mês`
    default:
      return '-'
  }
}

function formatFrequencia(rec: PlantioRecorrente): string {
  return formatFrequenciaFromValues(rec.tipo_frequencia, rec.intervalo, rec.dia_semana)
}

function onEspecieChange() {
  form.value.lote_semente_id = ''
}

function openModal(rec?: PlantioRecorrente) {
  if (rec) {
    editingId.value = rec.id
    form.value = {
      nome: rec.nome,
      especie_id: rec.especie_id,
      lote_semente_id: rec.lote_semente_id || '',
      fazenda_id: rec.fazenda_id || '',
      bandejas: rec.bandejas,
      recorrencia_infinita: rec.recorrencia_infinita,
      data_inicio: rec.data_inicio,
      data_fim: rec.data_fim || '',
      tipo_frequencia: rec.tipo_frequencia,
      intervalo: rec.intervalo || 1,
      dia_semana: rec.dia_semana ?? 1,
      criar_atrasados: rec.criar_atrasados,
      notas: rec.notas || ''
    }
  } else {
    editingId.value = null
    form.value = getEmptyForm()
  }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingId.value = null
  form.value = getEmptyForm()
}

function confirmDelete(rec: PlantioRecorrente) {
  deleteTarget.value = rec
  showDeleteModal.value = true
}

async function toggleAtivo(rec: PlantioRecorrente) {
  togglingId.value = rec.id
  const novoAtivo = !rec.ativo

  const { error } = await supabase
    .from('plantios_recorrentes')
    .update({ ativo: novoAtivo })
    .eq('id', rec.id)

  if (error) {
    showError('Erro ao alterar status')
  } else {
    rec.ativo = novoAtivo
    success(novoAtivo ? 'Recorrência ativada' : 'Recorrência desativada')
  }

  togglingId.value = null
}

async function salvar() {
  if (!currentCompany.value?.id || !isFormValid.value) return

  saving.value = true

  const payload: Record<string, any> = {
    empresa_id: currentCompany.value.id,
    nome: form.value.nome,
    especie_id: form.value.especie_id,
    lote_semente_id: form.value.lote_semente_id || null,
    fazenda_id: form.value.fazenda_id || null,
    bandejas: form.value.bandejas,
    recorrencia_infinita: form.value.recorrencia_infinita,
    data_inicio: form.value.data_inicio,
    data_fim: form.value.recorrencia_infinita ? null : (form.value.data_fim || null),
    tipo_frequencia: form.value.tipo_frequencia,
    intervalo: form.value.tipo_frequencia === 'dia_semana' ? null : (form.value.intervalo || 1),
    dia_semana: form.value.tipo_frequencia === 'dia_semana' ? form.value.dia_semana : null,
    criar_atrasados: form.value.criar_atrasados,
    notas: form.value.notas || null
  }

  try {
    if (editingId.value) {
      const { error } = await supabase
        .from('plantios_recorrentes')
        .update(payload)
        .eq('id', editingId.value)

      if (error) throw error
      success('Recorrência atualizada com sucesso')
    } else {
      payload.ativo = true
      const { error } = await supabase
        .from('plantios_recorrentes')
        .insert(payload)

      if (error) throw error
      success('Recorrência criada com sucesso')
    }

    closeModal()
    await fetchRecorrentes()
  } catch (err: any) {
    showError(err.message || 'Erro ao salvar recorrência')
  } finally {
    saving.value = false
  }
}

async function excluir() {
  if (!deleteTarget.value) return

  saving.value = true

  const { error } = await supabase
    .from('plantios_recorrentes')
    .delete()
    .eq('id', deleteTarget.value.id)

  if (error) {
    showError('Erro ao excluir recorrência')
  } else {
    success('Recorrência excluída com sucesso')
    await fetchRecorrentes()
  }

  saving.value = false
  showDeleteModal.value = false
  deleteTarget.value = null
}

async function fetchRecorrentes() {
  if (!currentCompany.value?.id) return

  const { data, error } = await supabase
    .from('plantios_recorrentes')
    .select('*, especies(id, nome), lotes_sementes(id, numero), fazendas(id, nome)')
    .eq('empresa_id', currentCompany.value.id)
    .order('created_at', { ascending: false })

  if (error) {
    showError('Erro ao carregar plantios recorrentes')
    return
  }

  recorrentes.value = data || []
}

async function fetchEspecies() {
  if (!currentCompany.value?.id) return

  const { data } = await supabase
    .from('especies')
    .select('id, nome')
    .eq('empresa_id', currentCompany.value.id)
    .order('nome')

  especies.value = data || []
}

async function fetchFazendas() {
  if (!currentCompany.value?.id) return

  const { data } = await supabase
    .from('fazendas')
    .select('id, nome')
    .eq('empresa_id', currentCompany.value.id)
    .order('nome')

  fazendas.value = data || []
}

async function fetchLotes() {
  if (!currentCompany.value?.id) return

  const { data } = await supabase
    .from('lotes_sementes')
    .select('id, numero, especie_id, status')
    .eq('empresa_id', currentCompany.value.id)
    .eq('status', 'ativo')
    .order('numero')

  lotes.value = data || []
}

async function fetchAll() {
  loading.value = true
  await Promise.all([
    fetchRecorrentes(),
    fetchEspecies(),
    fetchFazendas(),
    fetchLotes()
  ])
  loading.value = false
}

onMounted(() => {
  if (currentCompany.value?.id) {
    fetchAll()
  }
})
</script>
