<template>
  <div>
    <!-- Toolbar (fora do card) -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-4 mb-4">
      <!-- Lado Esquerdo: Filtros -->
      <div class="flex flex-col sm:flex-row gap-2 sm:gap-3 flex-1">
        <!-- Filtro Especie -->
        <select v-model="filterEspecie" class="input text-xs sm:text-sm flex-1 sm:flex-none sm:w-40">
          <option value="">Espécie</option>
          <option v-for="especie in especies" :key="especie.id" :value="especie.id">
            {{ especie.nome }}
          </option>
        </select>

        <!-- Filtro Motivo -->
        <select v-model="filterMotivo" class="input text-xs sm:text-sm flex-1 sm:flex-none sm:w-40">
          <option value="">Todos os Motivos</option>
          <option value="mofo">Mofo</option>
          <option value="praga">Praga</option>
          <option value="erro_irrigacao">Erro de Irrigacao</option>
          <option value="semente_ruim">Semente Ruim</option>
          <option value="outro">Outro</option>
        </select>

        <!-- Data Registro Inicio / Fim -->
        <div class="flex items-center gap-2">
          <span class="text-xs text-subtext-light dark:text-subtext-dark hidden sm:inline">Período</span>
          <input
            type="date"
            v-model="filterDataInicio"
            class="input text-xs sm:text-sm w-[130px]"
            placeholder="Inicio"
          />
          <span class="text-xs text-subtext-light dark:text-subtext-dark">ate</span>
          <input
            type="date"
            v-model="filterDataFim"
            class="input text-xs sm:text-sm w-[130px]"
            placeholder="Fim"
          />
        </div>
      </div>

      <!-- Lado Direito: Botao Desktop -->
      <button @click="openNovoIncidenteModal" class="hidden sm:flex btn btn-primary shrink-0">
        Novo Incidente
      </button>
      <!-- Botao Mobile -->
      <button @click="openNovoIncidenteModal" class="sm:hidden btn btn-primary w-full justify-center">
        Novo Incidente
      </button>
    </div>

    <!-- Card Principal -->
    <div class="card" style="overflow: hidden; max-width: 100%;">

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-16">
        <span class="material-icons-outlined text-5xl text-gray-300 dark:text-gray-600 animate-spin">refresh</span>
        <p class="text-sm text-subtext-light dark:text-subtext-dark mt-3">Carregando incidentes...</p>
      </div>

      <!-- Tabela - Desktop -->
      <div v-if="!loading && filteredIncidentes.length > 0" class="hidden lg:block">
        <div class="table-scroll-container custom-scrollbar">
          <table class="w-full text-left border-collapse" style="min-width: 700px;">
            <thead>
              <tr class="bg-gray-100 dark:bg-gray-700/50 border-b border-border-light dark:border-border-dark text-xs">
                <th class="table-header font-medium whitespace-nowrap">Espécie</th>
                <th class="table-header font-medium text-center whitespace-nowrap">Bandejas</th>
                <th class="table-header font-medium text-center whitespace-nowrap">Motivo</th>
                <th class="table-header font-medium text-center whitespace-nowrap cursor-pointer hover:text-text-light dark:hover:text-text-dark select-none" @click="toggleSort('data_registro')">
                  <div class="flex items-center justify-center gap-0.5">
                    Data
                    <span v-if="sortField === 'data_registro'" class="material-icons-outlined text-[10px]">{{ sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward' }}</span>
                  </div>
                </th>
                <th class="table-header font-medium whitespace-nowrap">Notas</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border-light dark:divide-border-dark">
              <tr
                v-for="incidente in paginatedIncidentes"
                :key="incidente.id"
                class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <td class="table-cell text-xs font-medium whitespace-nowrap">
                  {{ incidente.especies?.nome || '-' }}
                </td>
                <td class="table-cell text-center text-xs">{{ formatNumber(incidente.bandejas) }}</td>
                <td class="table-cell text-center p-1">
                  <span :class="['inline-block px-2 py-1 text-xs rounded-full border whitespace-nowrap', getMotivoBadgeClass(incidente.motivo)]">
                    {{ getMotivoLabel(incidente.motivo) }}
                  </span>
                </td>
                <td class="table-cell text-center text-xs whitespace-nowrap">{{ formatDateBR(incidente.data_registro) }}</td>
                <td class="table-cell text-xs max-w-[200px] truncate" :title="incidente.notas || ''">
                  {{ incidente.notas || '-' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Cards - Mobile/Tablet -->
      <div v-if="!loading && filteredIncidentes.length > 0" class="lg:hidden divide-y divide-border-light dark:divide-border-dark">
        <div
          v-for="incidente in paginatedIncidentes"
          :key="incidente.id"
          class="p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        >
          <!-- Header do Card -->
          <div class="flex items-start justify-between gap-2 mb-3">
            <div class="flex items-center gap-2 flex-wrap">
              <span :class="['text-[10px] px-2 py-0.5 rounded-full border whitespace-nowrap', getMotivoBadgeClass(incidente.motivo)]">
                {{ getMotivoLabel(incidente.motivo) }}
              </span>
              <span class="text-[10px] text-subtext-light dark:text-subtext-dark">
                {{ formatDateBR(incidente.data_registro) }}
              </span>
            </div>
          </div>

          <!-- Info Principal -->
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
              <span class="material-icons-outlined text-sm text-red-500">warning</span>
            </div>
            <div class="min-w-0 flex-1">
              <p class="font-semibold text-sm text-text-light dark:text-text-dark truncate">{{ incidente.especies?.nome || '-' }}</p>
              <p class="text-xs text-subtext-light dark:text-subtext-dark truncate">{{ incidente.notas || 'Sem observações' }}</p>
            </div>
          </div>

          <!-- Grid de Informacoes -->
          <div class="grid grid-cols-2 gap-2 text-[11px]">
            <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-center">
              <p class="text-subtext-light dark:text-subtext-dark mb-0.5">Bandejas</p>
              <p class="font-semibold text-text-light dark:text-text-dark">{{ formatNumber(incidente.bandejas) }}</p>
            </div>
            <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-center">
              <p class="text-subtext-light dark:text-subtext-dark mb-0.5">Data</p>
              <p class="font-semibold text-text-light dark:text-text-dark">{{ formatDateBR(incidente.data_registro) }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="!loading && filteredIncidentes.length === 0" class="text-center py-16 flex flex-col items-center px-4">
        <div class="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
          <span class="material-icons-outlined text-4xl text-gray-400 dark:text-gray-500">check_circle</span>
        </div>
        <h3 class="text-lg font-semibold text-text-light dark:text-text-dark mb-2">Nenhum incidente encontrado</h3>
        <p class="text-sm text-subtext-light dark:text-subtext-dark mb-6 max-w-sm">
          Não há registros de bandejas perdidas para os filtros selecionados.
        </p>
        <button @click="openNovoIncidenteModal" class="btn btn-primary">
          Novo Incidente
        </button>
      </div>

      <!-- Paginacao -->
      <div v-if="filteredIncidentes.length > 0" class="p-4 flex flex-col sm:flex-row items-center justify-between border-t border-border-light dark:border-border-dark text-xs text-subtext-light dark:text-subtext-dark gap-4">
        <div class="flex items-center gap-4">
          <select v-model="itemsPerPage" class="border border-border-light dark:border-border-dark rounded px-2 py-1 bg-white dark:bg-gray-800 text-sm cursor-pointer">
            <option :value="10">10 linhas</option>
            <option :value="25">25 linhas</option>
            <option :value="50">50 linhas</option>
          </select>
          <span>{{ filteredIncidentes.length }} registros</span>
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

    <!-- Modal Novo Incidente -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-200"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="showNovoIncidenteModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div class="fixed inset-0 glass-backdrop" @click="closeNovoIncidenteModal"></div>

          <Transition
            enter-active-class="transition-all duration-200"
            enter-from-class="opacity-0 scale-95"
            enter-to-class="opacity-100 scale-100"
            leave-active-class="transition-all duration-150"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-95"
          >
            <div v-if="showNovoIncidenteModal" class="relative z-[101] bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
              <!-- Header -->
              <div class="px-6 py-4 border-b border-border-light dark:border-border-dark flex items-center justify-between">
                <h2 class="text-lg font-semibold text-text-light dark:text-text-dark">Novo Incidente</h2>
                <button @click="closeNovoIncidenteModal" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <span class="material-icons-outlined">close</span>
                </button>
              </div>

              <!-- Body -->
              <div class="p-6 overflow-y-auto flex-1 space-y-4">
                <!-- Plantio -->
                <div>
                  <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Plantio</label>
                  <select v-model="novoIncidente.plantio_id" class="input" @change="onPlantioChange">
                    <option value="">Selecione o plantio</option>
                    <option v-for="plantio in plantiosEmAndamento" :key="plantio.id" :value="plantio.id">
                      {{ plantio.especies?.nome || '-' }} - {{ formatNumber(plantio.bandejas) }} bandejas
                      <template v-if="plantio.data_colheita"> (Colheita: {{ formatDateBR(plantio.data_colheita) }})</template>
                    </option>
                  </select>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <!-- Bandejas -->
                  <div>
                    <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Bandejas Perdidas</label>
                    <input type="number" v-model.number="novoIncidente.bandejas" class="input" min="1" />
                  </div>

                  <!-- Motivo -->
                  <div>
                    <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Motivo</label>
                    <select v-model="novoIncidente.motivo" class="input">
                      <option value="">Selecione</option>
                      <option value="mofo">Mofo</option>
                      <option value="praga">Praga</option>
                      <option value="erro_irrigacao">Erro de Irrigacao</option>
                      <option value="semente_ruim">Semente Ruim</option>
                      <option value="outro">Outro</option>
                    </select>
                  </div>
                </div>

                <!-- Notas -->
                <div>
                  <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Notas</label>
                  <textarea v-model="novoIncidente.notas" class="input" rows="3" placeholder="Observações sobre o incidente..."></textarea>
                </div>

                <!-- Info do plantio selecionado -->
                <div v-if="plantioSelecionado" class="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                  <h3 class="text-xs font-semibold text-gray-500 dark:text-subtext-dark uppercase tracking-wider mb-3">Plantio Selecionado</h3>
                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <p class="text-xs text-gray-500 dark:text-subtext-dark mb-1">Espécie</p>
                      <p class="text-sm font-medium text-gray-900 dark:text-text-dark">{{ plantioSelecionado.especies?.nome || '-' }}</p>
                    </div>
                    <div>
                      <p class="text-xs text-gray-500 dark:text-subtext-dark mb-1">Bandejas Totais</p>
                      <p class="text-sm font-medium text-gray-900 dark:text-text-dark">{{ formatNumber(plantioSelecionado.bandejas) }}</p>
                    </div>
                    <div>
                      <p class="text-xs text-gray-500 dark:text-subtext-dark mb-1">Colheita Prevista</p>
                      <p class="text-sm font-medium text-gray-900 dark:text-text-dark">{{ formatDateBR(plantioSelecionado.data_colheita) || '-' }}</p>
                    </div>
                    <div>
                      <p class="text-xs text-gray-500 dark:text-subtext-dark mb-1">Ja Perdidas</p>
                      <p class="text-sm font-medium text-red-600 dark:text-red-400">{{ formatNumber(plantioSelecionado.bandejas_perdidas || 0) }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Footer -->
              <div class="px-6 py-4 border-t border-border-light dark:border-border-dark flex items-center justify-end gap-3">
                <button @click="closeNovoIncidenteModal" class="btn btn-secondary">Voltar</button>
                <button @click="salvarNovoIncidente" class="btn btn-primary" :disabled="saving || !isFormValid">
                  <span v-if="saving" class="material-icons-outlined text-sm animate-spin">refresh</span>
                  {{ saving ? 'Salvando...' : 'Registrar Incidente' }}
                </button>
              </div>
            </div>
          </Transition>
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
interface Incidente {
  id: string
  empresa_id: string
  plantio_id: string
  especie_id: string
  bandejas: number
  motivo: string
  notas?: string
  data_registro: string
  especies?: { id: string; nome: string }
  plantios?: { id: string; bandejas: number; data_colheita: string }
}

interface PlantioEmAndamento {
  id: string
  especie_id: string
  bandejas: number
  bandejas_perdidas?: number
  data_colheita: string
  especies?: { nome: string }
}

interface Especie {
  id: string
  nome: string
}

const supabase = useSupabaseClient()
const { currentCompany } = useCurrentCompany()
const { success, error: showError } = useToast()

// Estado
const incidentes = ref<Incidente[]>([])
const especies = ref<Especie[]>([])
const plantiosEmAndamento = ref<PlantioEmAndamento[]>([])
const loading = ref(false)
const saving = ref(false)

// Filtros
const filterEspecie = ref('')
const filterMotivo = ref('')
const filterDataInicio = ref('')
const filterDataFim = ref('')

// Paginacao
const currentPage = ref(1)
const itemsPerPage = ref(10)
const pageInput = ref('1')

// Ordenacao
const sortField = ref<string>('')
const sortDirection = ref<'asc' | 'desc'>('desc')

// Modal
const showNovoIncidenteModal = ref(false)

// Formulario novo incidente
const novoIncidente = ref({
  plantio_id: '',
  bandejas: 1,
  motivo: '',
  notas: ''
})

// Number formatter
const numFmt = new Intl.NumberFormat('pt-BR')

// =====================================================
// Formatacao
// =====================================================

function formatDateBR(dateStr?: string): string {
  if (!dateStr) return ''
  const date = new Date(dateStr + 'T12:00:00')
  return date.toLocaleDateString('pt-BR')
}

function formatNumber(val?: number | null): string {
  if (val === undefined || val === null) return '0'
  return numFmt.format(val)
}

// =====================================================
// Motivo
// =====================================================

function getMotivoLabel(motivo?: string): string {
  const labels: Record<string, string> = {
    mofo: 'Mofo',
    praga: 'Praga',
    erro_irrigacao: 'Erro de Irrigacao',
    semente_ruim: 'Semente Ruim',
    outro: 'Outro'
  }
  return labels[motivo || ''] || motivo || '-'
}

function getMotivoBadgeClass(motivo?: string): string {
  const classes: Record<string, string> = {
    mofo: 'border-red-500 bg-transparent text-red-600 dark:border-red-400 dark:text-red-400',
    praga: 'border-orange-500 bg-transparent text-orange-600 dark:border-orange-400 dark:text-orange-400',
    erro_irrigacao: 'border-blue-500 bg-transparent text-blue-600 dark:border-blue-400 dark:text-blue-400',
    semente_ruim: 'border-yellow-500 bg-transparent text-yellow-600 dark:border-yellow-400 dark:text-yellow-400',
    outro: 'border-gray-500 bg-transparent text-gray-600 dark:border-gray-400 dark:text-gray-400'
  }
  return classes[motivo || ''] || classes.outro
}

// =====================================================
// Sorting
// =====================================================

function toggleSort(field: string) {
  if (sortField.value === field) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortDirection.value = 'desc'
  }
  currentPage.value = 1
}

// =====================================================
// Computed
// =====================================================

const filteredIncidentes = computed(() => {
  let result = incidentes.value

  if (filterEspecie.value) {
    result = result.filter(i => i.especie_id === filterEspecie.value)
  }
  if (filterMotivo.value) {
    result = result.filter(i => i.motivo === filterMotivo.value)
  }
  if (filterDataInicio.value) {
    result = result.filter(i => i.data_registro >= filterDataInicio.value)
  }
  if (filterDataFim.value) {
    result = result.filter(i => i.data_registro <= filterDataFim.value)
  }

  // Ordenacao
  if (sortField.value) {
    result = [...result].sort((a: any, b: any) => {
      const valA = a[sortField.value] || ''
      const valB = b[sortField.value] || ''
      const comparison = String(valA).localeCompare(String(valB))
      return sortDirection.value === 'asc' ? comparison : -comparison
    })
  }

  return result
})

const totalPages = computed(() => Math.ceil(filteredIncidentes.value.length / itemsPerPage.value) || 1)

const paginatedIncidentes = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  return filteredIncidentes.value.slice(start, start + itemsPerPage.value)
})

const plantioSelecionado = computed(() => {
  if (!novoIncidente.value.plantio_id) return null
  return plantiosEmAndamento.value.find(p => p.id === novoIncidente.value.plantio_id) || null
})

const isFormValid = computed(() => {
  return novoIncidente.value.plantio_id &&
         novoIncidente.value.bandejas > 0 &&
         novoIncidente.value.motivo
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

// =====================================================
// Data Loading
// =====================================================

async function loadIncidentes() {
  if (!currentCompany.value?.id) return
  loading.value = true
  try {
    const { data, error } = await supabase
      .from('bandejas_perdidas')
      .select('*, especies(id, nome), plantios(id, bandejas, data_colheita)')
      .eq('empresa_id', currentCompany.value.id)
      .order('data_registro', { ascending: false })
    if (error) throw error
    incidentes.value = data || []
  } catch (e: any) {
    showError('Erro ao carregar incidentes: ' + e.message)
  } finally {
    loading.value = false
  }
}

async function loadEspecies() {
  if (!currentCompany.value?.id) return
  const { data } = await supabase
    .from('especies')
    .select('id, nome')
    .eq('empresa_id', currentCompany.value.id)
    .eq('ativo', true)
    .order('nome')
  especies.value = data || []
}

async function loadPlantiosEmAndamento() {
  if (!currentCompany.value?.id) return
  const { data } = await supabase
    .from('plantios')
    .select('id, especie_id, bandejas, bandejas_perdidas, data_colheita, especies(nome)')
    .eq('empresa_id', currentCompany.value.id)
    .eq('status', 'em_andamento')
    .order('data_colheita', { ascending: true })
  plantiosEmAndamento.value = data || []
}

// =====================================================
// Modal Novo Incidente
// =====================================================

function openNovoIncidenteModal() {
  novoIncidente.value = { plantio_id: '', bandejas: 1, motivo: '', notas: '' }
  loadPlantiosEmAndamento()
  showNovoIncidenteModal.value = true
}

function closeNovoIncidenteModal() {
  showNovoIncidenteModal.value = false
}

function onPlantioChange() {
  // Auto-fill especie_id happens implicitly through plantioSelecionado computed
}

async function salvarNovoIncidente() {
  if (!currentCompany.value?.id || !isFormValid.value) return
  saving.value = true

  try {
    const plantio = plantioSelecionado.value
    if (!plantio) throw new Error('Plantio não encontrado')

    const especie_id = plantio.especie_id
    const hoje = new Date().toISOString().split('T')[0]

    // Inserir registro de bandejas perdidas
    const { error: insertError } = await supabase
      .from('bandejas_perdidas')
      .insert({
        empresa_id: currentCompany.value.id,
        plantio_id: novoIncidente.value.plantio_id,
        especie_id,
        bandejas: novoIncidente.value.bandejas,
        motivo: novoIncidente.value.motivo,
        notas: novoIncidente.value.notas || null,
        data_registro: hoje
      })

    if (insertError) throw insertError

    // Atualizar bandejas_perdidas no plantio
    const novasPerdidas = (plantio.bandejas_perdidas || 0) + novoIncidente.value.bandejas
    const { error: updateError } = await supabase
      .from('plantios')
      .update({ bandejas_perdidas: novasPerdidas })
      .eq('id', novoIncidente.value.plantio_id)
      .eq('empresa_id', currentCompany.value.id)

    if (updateError) throw updateError

    success('Incidente registrado com sucesso!')
    closeNovoIncidenteModal()
    loadIncidentes()
  } catch (e: any) {
    showError('Erro ao registrar incidente: ' + e.message)
  } finally {
    saving.value = false
  }
}

// =====================================================
// Watchers
// =====================================================

watch(() => currentCompany.value?.id, (newId) => {
  if (newId) { loadIncidentes(); loadEspecies() }
}, { immediate: true })

watch([filterEspecie, filterMotivo, filterDataInicio, filterDataFim], () => {
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

onMounted(() => {
  if (currentCompany.value?.id) { loadIncidentes(); loadEspecies() }
})
</script>

<style scoped>
/* Container da tabela com scroll */
.table-scroll-container {
  overflow-x: auto;
  overflow-y: visible;
  max-width: 100%;
  width: 100%;
}

/* Barra de scroll customizada para a tabela */
.custom-scrollbar {
  scrollbar-width: auto;
  scrollbar-color: #4A7C59 #e5e7eb;
}

.custom-scrollbar::-webkit-scrollbar {
  height: 12px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: #e5e7eb;
  border-radius: 6px;
  margin: 4px 0;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #4A7C59;
  border-radius: 6px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #3d6b4a;
}

:root.dark .custom-scrollbar {
  scrollbar-color: #4A7C59 #374151;
}

:root.dark .custom-scrollbar::-webkit-scrollbar-track {
  background: #374151;
}
</style>
