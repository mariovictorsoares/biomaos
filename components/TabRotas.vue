<template>
  <div>
    <!-- Conteúdo normal (oculto na impressão) -->
    <div class="print:hidden">
      <!-- Toolbar -->
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-4 mb-4">
        <!-- Esquerda: Filtros -->
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <!-- Data -->
          <input
            v-model="filterDate"
            type="date"
            class="input text-sm w-full sm:w-40"
          />
          <!-- Motorista -->
          <select v-model="filterMotorista" class="input text-sm w-full sm:w-44 shrink-0">
            <option value="">Todos motoristas</option>
            <option v-for="m in motoristas" :key="m.id" :value="m.id">{{ m.nome }}</option>
          </select>
          <!-- Região -->
          <select v-model="filterRegiao" class="input text-sm w-full sm:w-40 shrink-0">
            <option value="">Todas regiões</option>
            <option v-for="b in availableBairros" :key="b" :value="b">{{ b }}</option>
          </select>
          <!-- Status -->
          <select v-model="filterStatus" class="input text-sm w-full sm:w-36 shrink-0">
            <option value="">Todos status</option>
            <option value="planejada">Planejada</option>
            <option value="em_andamento">Em andamento</option>
            <option value="finalizada">Finalizada</option>
          </select>
        </div>
        <!-- Direita: Botão -->
        <button @click="openCreateSlideover" class="btn btn-primary shrink-0 justify-center sm:justify-start">
          <span class="material-icons-outlined text-sm">add</span>
          Nova rota
        </button>
      </div>

      <!-- Card da Tabela -->
      <div class="card overflow-hidden">
        <!-- Tabela - Desktop -->
        <div class="hidden md:block overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-gray-50 dark:bg-gray-800 border-b border-border-light dark:border-border-dark">
                <th class="table-header cursor-pointer select-none" @click="toggleSort('data_rota')">
                  <div class="flex items-center gap-1">
                    Data
                    <span class="material-icons-outlined text-xs">{{ getSortIcon('data_rota') }}</span>
                  </div>
                </th>
                <th class="table-header">Motorista</th>
                <th class="table-header">Regiões</th>
                <th class="table-header text-center">Paradas</th>
                <th class="table-header text-center">Status</th>
                <th class="table-header text-center w-32">Ações</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border-light dark:divide-border-dark">
              <tr
                v-for="rota in paginatedRotas"
                :key="rota.id"
                class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                @click="openEditSlideover(rota)"
              >
                <td class="table-cell">
                  <p class="font-medium text-text-light dark:text-text-dark">{{ formatDate(rota.data_rota) }}</p>
                  <p class="text-xs text-subtext-light dark:text-subtext-dark">{{ getDiaSemana(rota.data_rota) }}</p>
                </td>
                <td class="table-cell text-subtext-light dark:text-subtext-dark">
                  {{ getMotoristaName(rota.motorista_id) || '-' }}
                </td>
                <td class="table-cell">
                  <div v-if="rota.bairros?.length" class="flex flex-wrap gap-1">
                    <span
                      v-for="bairro in rota.bairros.slice(0, 3)"
                      :key="bairro"
                      class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                    >{{ bairro }}</span>
                    <span
                      v-if="rota.bairros.length > 3"
                      class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                    >+{{ rota.bairros.length - 3 }}</span>
                  </div>
                  <span v-else class="text-xs text-subtext-light dark:text-subtext-dark">-</span>
                </td>
                <td class="table-cell text-center text-subtext-light dark:text-subtext-dark">
                  {{ rota.paradas_count || 0 }}
                </td>
                <td class="table-cell text-center">
                  <span :class="['badge', statusBadgeClass(rota.status)]">
                    {{ statusLabel(rota.status) }}
                  </span>
                </td>
                <td class="table-cell text-center" @click.stop>
                  <div class="flex items-center justify-center gap-1">
                    <!-- Botão status -->
                    <button
                      v-if="rota.status === 'planejada'"
                      @click="updateStatus(rota, 'em_andamento')"
                      class="text-gray-400 hover:text-blue-500 transition-colors p-1"
                      title="Iniciar entregas"
                    >
                      <span class="material-icons-outlined text-sm">play_arrow</span>
                    </button>
                    <button
                      v-else-if="rota.status === 'em_andamento'"
                      @click="updateStatus(rota, 'finalizada')"
                      class="text-gray-400 hover:text-green-500 transition-colors p-1"
                      title="Finalizar rota"
                    >
                      <span class="material-icons-outlined text-sm">check_circle</span>
                    </button>
                    <!-- Imprimir -->
                    <button
                      @click="printRota(rota)"
                      class="text-gray-400 hover:text-primary transition-colors p-1"
                      title="Imprimir roteiro"
                    >
                      <span class="material-icons-outlined text-sm">print</span>
                    </button>
                    <!-- Editar -->
                    <button
                      @click="openEditSlideover(rota)"
                      class="text-gray-400 hover:text-primary transition-colors p-1"
                      title="Editar rota"
                    >
                      <span class="material-icons-outlined text-sm">edit</span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Cards - Mobile -->
        <div class="md:hidden divide-y divide-border-light dark:divide-border-dark">
          <div
            v-for="rota in paginatedRotas"
            :key="rota.id"
            class="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
            @click="openEditSlideover(rota)"
          >
            <div class="flex items-start gap-3">
              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-2">
                  <div class="min-w-0">
                    <p class="font-medium text-text-light dark:text-text-dark">
                      {{ formatDate(rota.data_rota) }} - {{ getDiaSemana(rota.data_rota) }}
                    </p>
                    <p class="text-xs text-subtext-light dark:text-subtext-dark">
                      {{ getMotoristaName(rota.motorista_id) || 'Sem motorista' }} &middot; {{ rota.paradas_count || 0 }} paradas
                    </p>
                  </div>
                  <span :class="['badge shrink-0', statusBadgeClass(rota.status)]">
                    {{ statusLabel(rota.status) }}
                  </span>
                </div>
                <!-- Bairros tags no mobile -->
                <div v-if="rota.bairros?.length" class="flex flex-wrap gap-1 mt-1.5">
                  <span
                    v-for="bairro in rota.bairros.slice(0, 4)"
                    :key="bairro"
                    class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                  >{{ bairro }}</span>
                  <span
                    v-if="rota.bairros.length > 4"
                    class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                  >+{{ rota.bairros.length - 4 }}</span>
                </div>
              </div>
              <div class="flex items-center gap-1 shrink-0" @click.stop>
                <button
                  @click="printRota(rota)"
                  class="text-gray-400 hover:text-primary transition-colors p-1"
                >
                  <span class="material-icons-outlined text-lg">print</span>
                </button>
                <span class="material-icons-outlined text-xl text-gray-400">chevron_right</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="text-center py-12">
          <span class="material-icons-outlined text-4xl text-gray-300 dark:text-gray-600 animate-spin">refresh</span>
          <p class="text-sm text-subtext-light dark:text-subtext-dark mt-2">Carregando...</p>
        </div>

        <!-- Empty State -->
        <div v-else-if="filteredRotas.length === 0 && !loading" class="text-center py-12 flex flex-col items-center px-4">
          <span class="material-icons-outlined text-4xl text-gray-300 dark:text-gray-600 mb-2">route</span>
          <h3 class="text-lg font-medium text-text-light dark:text-text-dark mb-1">Nenhuma rota encontrada</h3>
          <p class="text-sm text-subtext-light dark:text-subtext-dark mb-4">
            {{ hasAnyFilter ? 'Tente ajustar os filtros' : 'Crie sua primeira rota de entrega' }}
          </p>
          <button v-if="!hasAnyFilter" @click="openCreateSlideover" class="btn btn-primary">
            <span class="material-icons-outlined text-sm">add</span>
            Nova rota
          </button>
        </div>

        <!-- Paginação -->
        <div v-if="filteredRotas.length > 0" class="p-3 sm:p-4 border-t border-border-light dark:border-border-dark text-xs text-subtext-light dark:text-subtext-dark">
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
              <span class="text-xs">{{ filteredRotas.length }} registros</span>
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
    </div>

    <!-- Layout de Impressão -->
    <div v-if="printData" class="hidden print:block print-layout">
      <!-- Cabeçalho -->
      <div class="print-header">
        <h1 class="print-title">Roteiro de Entregas</h1>
        <div class="print-meta">
          <span><strong>Data:</strong> {{ formatDate(printData.data_rota) }} ({{ getDiaSemana(printData.data_rota) }})</span>
          <span v-if="printData.motoristaNome"><strong>Motorista:</strong> {{ printData.motoristaNome }}</span>
          <span v-if="printData.motoristaVeiculo"><strong>Veículo:</strong> {{ printData.motoristaVeiculo }}</span>
        </div>
        <div class="print-summary">
          <span><strong>{{ printData.paradas.length }}</strong> paradas</span>
          <span>&middot;</span>
          <span><strong>{{ printData.totalBairros }}</strong> regiões</span>
        </div>
      </div>

      <!-- Paradas agrupadas por bairro -->
      <div v-for="(grupo, bairroIdx) in printData.paradasPorBairro" :key="bairroIdx" class="print-bairro-group">
        <div class="print-bairro-header">
          <span class="print-bairro-icon">&#9679;</span>
          <span class="print-bairro-name">{{ grupo.bairro }}</span>
          <span class="print-bairro-count">({{ grupo.paradas.length }} {{ grupo.paradas.length === 1 ? 'parada' : 'paradas' }})</span>
        </div>

        <div v-for="parada in grupo.paradas" :key="parada.ordem" class="print-parada">
          <div class="print-parada-number">{{ parada.ordem }}</div>
          <div class="print-parada-content">
            <div class="print-parada-header-row">
              <span class="print-parada-name">{{ parada.clienteNome }}</span>
              <span v-if="parada.horario" class="print-parada-time">{{ parada.horario }}</span>
            </div>
            <p class="print-parada-address">{{ parada.endereco }}</p>
            <div v-if="parada.itens.length" class="print-parada-items">
              <span v-for="(item, iIdx) in parada.itens" :key="iIdx" class="print-item">
                {{ item.nome }} x{{ item.quantidade }}<span v-if="iIdx < parada.itens.length - 1">, </span>
              </span>
            </div>
            <p v-if="parada.observacoes" class="print-parada-obs">
              <em>Obs: {{ parada.observacoes }}</em>
            </p>
          </div>
          <div class="print-parada-check">
            <div class="print-checkbox"></div>
          </div>
        </div>
      </div>

      <!-- Rodapé da impressão -->
      <div class="print-footer">
        <p>Impresso em {{ new Date().toLocaleDateString('pt-BR') }} às {{ new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }}</p>
      </div>
    </div>

    <!-- Slideover -->
    <SlideoverRota
      v-if="showSlideover"
      :motoristas="motoristas"
      :edit-data="editingRota"
      @close="closeSlideover"
      @save="handleSave"
      ref="slideoverRef"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useCurrentCompany } from '~/composables/useCurrentCompany'
import { useToast } from '~/composables/useToast'

interface Rota {
  id: string
  empresa_id: string
  data_rota: string
  motorista_id: string | null
  status: string
  observacoes: string | null
  paradas_count: number
  bairros: string[]
  created_at: string
  updated_at: string
}

interface Motorista {
  id: string
  nome: string
  telefone: string | null
  veiculo: string | null
}

interface PrintParada {
  ordem: number
  clienteNome: string
  endereco: string
  bairro: string
  horario: string
  itens: Array<{ nome: string; quantidade: number }>
  observacoes: string
}

interface PrintBairroGroup {
  bairro: string
  paradas: PrintParada[]
}

interface PrintData {
  data_rota: string
  motoristaNome: string
  motoristaVeiculo: string
  paradas: PrintParada[]
  paradasPorBairro: PrintBairroGroup[]
  totalBairros: number
}

const supabase = useSupabaseClient()
const { currentCompany } = useCurrentCompany()
const toast = useToast()

// Estado
const rotas = ref<Rota[]>([])
const motoristas = ref<Motorista[]>([])
const loading = ref(false)

// Slideover
const showSlideover = ref(false)
const editingRota = ref<any>(null)
const slideoverRef = ref<any>(null)

// Impressão
const printData = ref<PrintData | null>(null)

// Paginação
const currentPage = ref(1)
const itemsPerPage = ref(10)
const pageInput = ref('1')

// Filtros
const filterDate = ref('')
const filterMotorista = ref('')
const filterRegiao = ref('')
const filterStatus = ref('')

// Ordenação
const sortField = ref<string>('data_rota')
const sortDirection = ref<'asc' | 'desc'>('desc')

// Computed
const hasAnyFilter = computed(() => !!(filterDate.value || filterMotorista.value || filterRegiao.value || filterStatus.value))

const availableBairros = computed(() => {
  const bairros = new Set<string>()
  for (const rota of rotas.value) {
    if (rota.bairros) {
      for (const b of rota.bairros) {
        bairros.add(b)
      }
    }
  }
  return [...bairros].sort()
})

const filteredRotas = computed(() => {
  let result = [...rotas.value]

  if (filterDate.value) {
    result = result.filter(r => r.data_rota === filterDate.value)
  }

  if (filterMotorista.value) {
    result = result.filter(r => r.motorista_id === filterMotorista.value)
  }

  if (filterRegiao.value) {
    result = result.filter(r => r.bairros?.includes(filterRegiao.value))
  }

  if (filterStatus.value) {
    result = result.filter(r => r.status === filterStatus.value)
  }

  result.sort((a, b) => {
    let aVal: any = a[sortField.value as keyof Rota]
    let bVal: any = b[sortField.value as keyof Rota]
    if (aVal === null || aVal === undefined) aVal = ''
    if (bVal === null || bVal === undefined) bVal = ''
    if (typeof aVal === 'string') aVal = aVal.toLowerCase()
    if (typeof bVal === 'string') bVal = bVal.toLowerCase()
    if (aVal < bVal) return sortDirection.value === 'asc' ? -1 : 1
    if (aVal > bVal) return sortDirection.value === 'asc' ? 1 : -1
    return 0
  })

  return result
})

const totalPages = computed(() => Math.ceil(filteredRotas.value.length / itemsPerPage.value) || 1)

const paginatedRotas = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  return filteredRotas.value.slice(start, start + itemsPerPage.value)
})

// Funções auxiliares
function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

function getDiaSemana(dateStr: string | null): string {
  if (!dateStr) return ''
  const dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
  const d = new Date(dateStr + 'T12:00:00')
  return dias[d.getDay()]
}

function getMotoristaName(id: string | null): string {
  if (!id) return ''
  return motoristas.value.find(m => m.id === id)?.nome || ''
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    planejada: 'Planejada',
    em_andamento: 'Em andamento',
    finalizada: 'Finalizada'
  }
  return map[status] || status
}

function statusBadgeClass(status: string): string {
  const map: Record<string, string> = {
    planejada: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    em_andamento: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    finalizada: 'badge-success'
  }
  return map[status] || 'badge-inactive'
}

function toggleSort(field: string) {
  if (sortField.value === field) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortDirection.value = 'asc'
  }
}

function getSortIcon(field: string): string {
  if (sortField.value !== field) return 'unfold_more'
  return sortDirection.value === 'asc' ? 'expand_less' : 'expand_more'
}

function goToPage() {
  const page = parseInt(pageInput.value)
  if (!isNaN(page) && page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  } else {
    pageInput.value = String(currentPage.value)
  }
}

// Carregar dados
async function loadData() {
  if (!currentCompany.value?.id) {
    rotas.value = []
    motoristas.value = []
    return
  }

  loading.value = true
  try {
    const [rotasRes, motoristasRes] = await Promise.all([
      supabase
        .from('rotas')
        .select('*, rota_paradas(id, cliente_id, clientes(bairro, bairro_entrega))')
        .eq('empresa_id', currentCompany.value.id)
        .order('data_rota', { ascending: false }),
      supabase
        .from('motoristas')
        .select('id, nome, telefone, veiculo')
        .eq('empresa_id', currentCompany.value.id)
        .eq('ativo', true)
        .order('nome', { ascending: true })
    ])

    if (rotasRes.error) throw rotasRes.error
    if (motoristasRes.error) throw motoristasRes.error

    rotas.value = (rotasRes.data || []).map(r => {
      // Extract unique bairros from paradas
      const bairros = new Set<string>()
      if (r.rota_paradas) {
        for (const p of r.rota_paradas) {
          const cliente = p.clientes as any
          const bairro = cliente?.bairro_entrega || cliente?.bairro
          if (bairro) bairros.add(bairro)
        }
      }
      return {
        ...r,
        paradas_count: r.rota_paradas?.length || 0,
        bairros: [...bairros].sort()
      }
    })
    motoristas.value = motoristasRes.data || []
  } catch (e: any) {
    console.error('Erro ao carregar rotas:', e)
    toast.error('Erro ao carregar rotas')
  } finally {
    loading.value = false
  }
}

// Slideover
function openCreateSlideover() {
  editingRota.value = null
  showSlideover.value = true
}

async function openEditSlideover(rota: Rota) {
  try {
    const { data, error } = await supabase
      .from('rota_paradas')
      .select('pedido_id, cliente_id, ordem, observacoes')
      .eq('rota_id', rota.id)
      .order('ordem', { ascending: true })

    if (error) throw error

    editingRota.value = {
      id: rota.id,
      data_rota: rota.data_rota,
      motorista_id: rota.motorista_id,
      status: rota.status,
      observacoes: rota.observacoes,
      rota_paradas: data || []
    }
    showSlideover.value = true
  } catch (e: any) {
    console.error('Erro ao carregar paradas:', e)
    toast.error('Erro ao carregar paradas da rota')
  }
}

function closeSlideover() {
  showSlideover.value = false
  editingRota.value = null
}

async function handleSave(data: any) {
  if (!currentCompany.value?.id) {
    toast.error('Nenhuma empresa selecionada')
    return
  }

  try {
    const rotaPayload = {
      empresa_id: currentCompany.value.id,
      data_rota: data.dataRota,
      motorista_id: data.motoristaId || null,
      status: data.status,
      observacoes: data.observacoes || null
    }

    let rotaId: string

    if (data.id) {
      const { error } = await supabase
        .from('rotas')
        .update(rotaPayload)
        .eq('id', data.id)
        .eq('empresa_id', currentCompany.value.id)

      if (error) throw error
      rotaId = data.id

      await supabase.from('rota_paradas').delete().eq('rota_id', rotaId)
    } else {
      const { data: inserted, error } = await supabase
        .from('rotas')
        .insert(rotaPayload)
        .select('id')
        .single()

      if (error) throw error
      rotaId = inserted.id
    }

    if (data.paradas.length > 0) {
      const paradasPayload = data.paradas.map((p: any) => ({
        rota_id: rotaId,
        pedido_id: p.pedido_id,
        cliente_id: p.cliente_id,
        ordem: p.ordem,
        observacoes: p.observacoes || null
      }))

      const { error: paradasErr } = await supabase
        .from('rota_paradas')
        .insert(paradasPayload)

      if (paradasErr) throw paradasErr
    }

    toast.success(data.id ? 'Rota atualizada com sucesso' : 'Rota criada com sucesso')
    closeSlideover()
    await loadData()
  } catch (e: any) {
    console.error('Erro ao salvar rota:', e)
    toast.error(e.message || 'Erro ao salvar rota')
  } finally {
    if (slideoverRef.value) {
      slideoverRef.value.saving = false
    }
  }
}

// Status
async function updateStatus(rota: Rota, newStatus: string) {
  if (!currentCompany.value?.id) return

  try {
    const { error } = await supabase
      .from('rotas')
      .update({ status: newStatus })
      .eq('id', rota.id)
      .eq('empresa_id', currentCompany.value.id)

    if (error) throw error

    const label = newStatus === 'em_andamento' ? 'Rota iniciada' : 'Rota finalizada'
    toast.success(label)
    await loadData()
  } catch (e: any) {
    console.error('Erro ao atualizar status:', e)
    toast.error('Erro ao atualizar status')
  }
}

// Impressão
async function printRota(rota: Rota) {
  if (!currentCompany.value?.id) return

  try {
    const { data: paradasData, error: paradasErr } = await supabase
      .from('rota_paradas')
      .select('pedido_id, cliente_id, ordem, observacoes')
      .eq('rota_id', rota.id)
      .order('ordem', { ascending: true })

    if (paradasErr) throw paradasErr
    if (!paradasData?.length) {
      toast.error('Rota sem paradas para imprimir')
      return
    }

    const pedidoIds = paradasData.map(p => p.pedido_id)
    const clienteIds = [...new Set(paradasData.map(p => p.cliente_id))]

    const [clientesRes, itensRes] = await Promise.all([
      supabase.from('clientes').select('id, razao_social, nome_fantasia, bairro, bairro_entrega, logradouro_entrega, numero_entrega, complemento_entrega, cidade_entrega, estado_entrega, logradouro, numero, complemento, cidade, estado, hora_manha_inicio, hora_manha_fim, hora_tarde_inicio, hora_tarde_fim, observacoes_entrega').in('id', clienteIds),
      supabase.from('pedido_itens').select('pedido_id, quantidade, produto_id, produtos(nome)').in('pedido_id', pedidoIds)
    ])

    const clientesMap = new Map((clientesRes.data || []).map(c => [c.id, c]))
    const itensMap = new Map<string, any[]>()
    for (const item of (itensRes.data || [])) {
      if (!itensMap.has(item.pedido_id)) itensMap.set(item.pedido_id, [])
      itensMap.get(item.pedido_id)!.push(item)
    }

    const motorista = motoristas.value.find(m => m.id === rota.motorista_id)

    const paradas: PrintParada[] = paradasData.map(p => {
      const cliente = clientesMap.get(p.cliente_id)
      const itens = itensMap.get(p.pedido_id) || []

      const logradouro = cliente?.logradouro_entrega || cliente?.logradouro || ''
      const numero = cliente?.numero_entrega || cliente?.numero || ''
      const complemento = cliente?.complemento_entrega || cliente?.complemento || ''
      const bairro = cliente?.bairro_entrega || cliente?.bairro || ''
      const cidade = cliente?.cidade_entrega || cliente?.cidade || ''
      const estado = cliente?.estado_entrega || cliente?.estado || ''

      const enderecoParts = [logradouro, numero].filter(Boolean).join(', ')
      const enderecoComplemento = complemento ? `${enderecoParts} - ${complemento}` : enderecoParts
      const localidade = [cidade, estado].filter(Boolean).join(' - ')
      const endereco = [enderecoComplemento, localidade].filter(Boolean).join(' - ')

      const horarioParts: string[] = []
      if (cliente?.hora_manha_inicio && cliente?.hora_manha_fim) {
        horarioParts.push(`${cliente.hora_manha_inicio.substring(0, 5)} - ${cliente.hora_manha_fim.substring(0, 5)}`)
      }
      if (cliente?.hora_tarde_inicio && cliente?.hora_tarde_fim) {
        horarioParts.push(`${cliente.hora_tarde_inicio.substring(0, 5)} - ${cliente.hora_tarde_fim.substring(0, 5)}`)
      }

      return {
        ordem: p.ordem,
        clienteNome: cliente?.nome_fantasia || cliente?.razao_social || 'Cliente',
        endereco,
        bairro: bairro || 'Sem bairro',
        horario: horarioParts.join(' / '),
        itens: itens.map(i => ({
          nome: (i.produtos as any)?.nome || 'Produto',
          quantidade: i.quantidade
        })),
        observacoes: cliente?.observacoes_entrega || ''
      }
    })

    // Agrupar por bairro (mantendo ordem original)
    const bairroOrder: string[] = []
    const bairroMap = new Map<string, PrintParada[]>()
    for (const p of paradas) {
      if (!bairroMap.has(p.bairro)) {
        bairroOrder.push(p.bairro)
        bairroMap.set(p.bairro, [])
      }
      bairroMap.get(p.bairro)!.push(p)
    }

    const paradasPorBairro: PrintBairroGroup[] = bairroOrder.map(bairro => ({
      bairro,
      paradas: bairroMap.get(bairro)!
    }))

    printData.value = {
      data_rota: rota.data_rota,
      motoristaNome: motorista?.nome || '',
      motoristaVeiculo: motorista?.veiculo || '',
      paradas,
      paradasPorBairro,
      totalBairros: bairroOrder.length
    }

    await nextTick()
    window.print()

    window.addEventListener('afterprint', () => {
      printData.value = null
    }, { once: true })
  } catch (e: any) {
    console.error('Erro ao preparar impressão:', e)
    toast.error('Erro ao preparar impressão')
  }
}

// Watchers
watch(
  () => currentCompany.value?.id,
  (newId, oldId) => {
    if (newId !== oldId) {
      currentPage.value = 1
      loadData()
    }
  },
  { immediate: true }
)

watch([filterDate, filterMotorista, filterRegiao, filterStatus], () => {
  currentPage.value = 1
  pageInput.value = '1'
})

watch(currentPage, (newVal) => {
  pageInput.value = String(newVal)
})

watch(itemsPerPage, () => {
  currentPage.value = 1
  pageInput.value = '1'
})

onMounted(() => {
  loadData()
})
</script>

<style scoped>
@media print {
  .print-layout {
    font-family: 'Inter', Arial, sans-serif;
    color: #000;
    font-size: 11px;
    padding: 8mm;
  }

  .print-header {
    text-align: center;
    margin-bottom: 5mm;
    padding-bottom: 3mm;
    border-bottom: 2px solid #000;
  }

  .print-title {
    font-size: 18px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 2px;
    margin: 0;
  }

  .print-meta {
    display: flex;
    justify-content: center;
    gap: 20px;
    margin-top: 4px;
    font-size: 11px;
  }

  .print-summary {
    display: flex;
    justify-content: center;
    gap: 8px;
    margin-top: 2px;
    font-size: 11px;
    color: #555;
  }

  .print-bairro-group {
    margin-bottom: 4mm;
  }

  .print-bairro-header {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 3px 0;
    margin-bottom: 2mm;
    border-bottom: 1px solid #ccc;
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .print-bairro-icon {
    font-size: 8px;
    color: #666;
  }

  .print-bairro-name {
    flex: 1;
  }

  .print-bairro-count {
    font-weight: 400;
    font-size: 10px;
    color: #888;
    text-transform: none;
  }

  .print-parada {
    display: flex;
    gap: 8px;
    padding: 2mm 0;
    border-bottom: 1px dotted #ddd;
    page-break-inside: avoid;
  }

  .print-parada-number {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: #f3f4f6;
    border: 1px solid #d1d5db;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: 700;
    flex-shrink: 0;
    margin-top: 1px;
  }

  .print-parada-content {
    flex: 1;
    min-width: 0;
  }

  .print-parada-header-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 8px;
  }

  .print-parada-name {
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
  }

  .print-parada-time {
    font-size: 10px;
    color: #555;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .print-parada-address {
    font-size: 10px;
    color: #444;
    margin: 1px 0;
  }

  .print-parada-items {
    font-size: 10px;
    color: #333;
    margin-top: 1px;
  }

  .print-item {
    white-space: nowrap;
  }

  .print-parada-obs {
    font-size: 10px;
    color: #666;
    margin-top: 1px;
  }

  .print-parada-check {
    display: flex;
    align-items: flex-start;
    padding-top: 2px;
    flex-shrink: 0;
  }

  .print-checkbox {
    width: 16px;
    height: 16px;
    border: 1.5px solid #999;
    border-radius: 3px;
  }

  .print-footer {
    margin-top: 5mm;
    padding-top: 2mm;
    border-top: 1px solid #ccc;
    text-align: center;
    font-size: 9px;
    color: #999;
  }
}
</style>
