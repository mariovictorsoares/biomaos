<template>
  <div>
    <!-- Toolbar -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-4 mb-4">
      <!-- Navegação do Mês -->
      <div class="flex items-center gap-2">
        <button
          @click="previousMonth"
          class="p-1.5 sm:p-2 border border-border-light dark:border-border-dark rounded-l-lg hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 transition-colors"
        >
          <span class="material-icons-outlined text-sm">chevron_left</span>
        </button>
        <div class="px-3 sm:px-4 py-1.5 sm:py-2 border-y border-border-light dark:border-border-dark bg-white dark:bg-gray-800 text-sm sm:text-base font-medium min-w-[160px] sm:min-w-[200px] text-center whitespace-nowrap capitalize">
          {{ monthName }} {{ year }}
        </div>
        <button
          @click="nextMonth"
          class="p-1.5 sm:p-2 border border-border-light dark:border-border-dark rounded-r-lg hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 transition-colors"
        >
          <span class="material-icons-outlined text-sm">chevron_right</span>
        </button>
        <!-- Botão Hoje -->
        <button
          @click="goToToday"
          class="px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg bg-white dark:bg-gray-800 border border-border-light dark:border-border-dark hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Hoje
        </button>
      </div>

      <!-- Legenda (desktop) -->
      <div class="hidden sm:flex items-center gap-3 text-xs text-subtext-light dark:text-subtext-dark">
        <span class="flex items-center gap-1">
          <span class="w-2.5 h-2.5 rounded-full bg-green-500"></span> Plantio
        </span>
        <span class="flex items-center gap-1">
          <span class="w-2.5 h-2.5 rounded-full bg-yellow-500"></span> Luz
        </span>
        <span class="flex items-center gap-1">
          <span class="w-2.5 h-2.5 rounded-full bg-orange-500"></span> Colheita
        </span>
        <span class="flex items-center gap-1">
          <span class="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Manual
        </span>
        <span class="flex items-center gap-1">
          <span class="w-2.5 h-2.5 rounded-full bg-purple-500"></span> Recorrente
        </span>
      </div>
    </div>

    <!-- Card Principal -->
    <div class="card overflow-hidden">

      <!-- Loading -->
      <div v-if="loading" class="text-center py-16">
        <span class="material-icons-outlined text-5xl text-gray-300 dark:text-gray-600 animate-spin">refresh</span>
        <p class="text-sm text-subtext-light dark:text-subtext-dark mt-3">Carregando calendário...</p>
      </div>

      <!-- Calendário Grid - Desktop -->
      <div v-if="!loading" class="hidden md:block">
        <!-- Header dos dias da semana -->
        <div class="grid grid-cols-7 border-b border-border-light dark:border-border-dark">
          <div
            v-for="(dia, i) in diasSemana"
            :key="dia"
            :class="[
              'py-2 px-2 text-center text-xs font-medium uppercase tracking-wider',
              'text-subtext-light dark:text-subtext-dark',
              'border-r border-border-light dark:border-border-dark last:border-r-0',
              i === 0 || i === 6 ? 'bg-gray-50 dark:bg-gray-800/50' : 'bg-white dark:bg-gray-800'
            ]"
          >
            {{ dia }}
          </div>
        </div>

        <!-- Semanas -->
        <div
          v-for="(semana, sIdx) in calendarWeeks"
          :key="sIdx"
          class="grid grid-cols-7 border-b border-border-light dark:border-border-dark last:border-b-0"
        >
          <div
            v-for="(cell, cIdx) in semana"
            :key="cIdx"
            @click="cell.day ? selectDay(cell) : null"
            :class="[
              'min-h-[100px] p-1.5 border-r border-border-light dark:border-border-dark last:border-r-0 transition-colors',
              cell.isCurrentMonth ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/50 dark:bg-gray-900/30',
              cell.isWeekend && cell.isCurrentMonth ? 'bg-gray-50 dark:bg-gray-800/50' : '',
              cell.isToday ? 'ring-2 ring-inset ring-[#4A7C59] dark:ring-[#6BA37A]' : '',
              cell.day && cell.isCurrentMonth ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50' : '',
              selectedDay?.dateStr === cell.dateStr ? 'bg-[#4A7C59]/5 dark:bg-[#4A7C59]/10' : ''
            ]"
          >
            <!-- Número do dia -->
            <div class="flex items-center justify-between mb-1">
              <span
                v-if="cell.day"
                :class="[
                  'text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full',
                  cell.isToday ? 'bg-[#4A7C59] text-white' : '',
                  cell.isCurrentMonth ? 'text-text-light dark:text-text-dark' : 'text-gray-300 dark:text-gray-600'
                ]"
              >
                {{ cell.day }}
              </span>
              <!-- Badge de contagem se >3 tarefas -->
              <span
                v-if="cell.tasks && cell.tasks.length > 3"
                class="text-[10px] text-subtext-light dark:text-subtext-dark font-medium"
              >
                +{{ cell.tasks.length - 3 }} mais
              </span>
            </div>

            <!-- Task chips (máximo 3 visíveis) -->
            <div v-if="cell.tasks && cell.tasks.length > 0" class="space-y-0.5">
              <div
                v-for="tarefa in cell.tasks.slice(0, 3)"
                :key="tarefa.id"
                :class="[
                  'text-[10px] leading-tight px-1.5 py-0.5 rounded truncate font-medium',
                  getTaskChipClasses(tarefa)
                ]"
                :title="tarefa.titulo"
              >
                {{ tarefa.titulo }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Lista Mobile -->
      <div v-if="!loading" class="md:hidden">
        <!-- Legenda mobile -->
        <div class="flex items-center gap-2 px-3 py-2 border-b border-border-light dark:border-border-dark overflow-x-auto text-[10px] text-subtext-light dark:text-subtext-dark">
          <span class="flex items-center gap-1 shrink-0">
            <span class="w-2 h-2 rounded-full bg-green-500"></span> Plantio
          </span>
          <span class="flex items-center gap-1 shrink-0">
            <span class="w-2 h-2 rounded-full bg-yellow-500"></span> Luz
          </span>
          <span class="flex items-center gap-1 shrink-0">
            <span class="w-2 h-2 rounded-full bg-orange-500"></span> Colheita
          </span>
          <span class="flex items-center gap-1 shrink-0">
            <span class="w-2 h-2 rounded-full bg-blue-500"></span> Manual
          </span>
          <span class="flex items-center gap-1 shrink-0">
            <span class="w-2 h-2 rounded-full bg-purple-500"></span> Recorrente
          </span>
        </div>

        <!-- Dias com tarefas -->
        <div v-if="daysWithTasks.length > 0" class="divide-y divide-border-light dark:divide-border-dark">
          <div
            v-for="dayGroup in daysWithTasks"
            :key="dayGroup.dateStr"
            class="px-3 py-3"
          >
            <!-- Data header -->
            <div class="flex items-center gap-2 mb-2">
              <span
                :class="[
                  'text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full shrink-0',
                  dayGroup.isToday ? 'bg-[#4A7C59] text-white' : 'text-text-light dark:text-text-dark'
                ]"
              >
                {{ dayGroup.day }}
              </span>
              <span class="text-xs text-subtext-light dark:text-subtext-dark capitalize">
                {{ dayGroup.weekdayName }}, {{ dayGroup.day }} de {{ monthName }}
              </span>
            </div>

            <!-- Tarefas do dia -->
            <div class="space-y-1.5 pl-9">
              <div
                v-for="tarefa in dayGroup.tasks"
                :key="tarefa.id"
                :class="[
                  'flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs',
                  getTaskChipClasses(tarefa)
                ]"
              >
                <span class="material-icons-outlined text-xs opacity-70">{{ getTaskIcon(tarefa) }}</span>
                <div class="flex-1 min-w-0">
                  <div class="font-medium truncate">{{ tarefa.titulo }}</div>
                  <div v-if="tarefa.especies" class="text-[10px] opacity-70 truncate">
                    {{ tarefa.especies.nome }}
                  </div>
                </div>
                <span
                  v-if="tarefa.concluida"
                  class="material-icons-outlined text-xs text-green-600 dark:text-green-400"
                >check_circle</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Vazio -->
        <div v-else class="text-center py-12">
          <span class="material-icons-outlined text-5xl text-gray-300 dark:text-gray-600">event_busy</span>
          <p class="text-sm text-subtext-light dark:text-subtext-dark mt-3">Nenhuma tarefa neste mês</p>
        </div>
      </div>

      <!-- Empty state desktop -->
      <div v-if="!loading && tarefas.length === 0" class="hidden md:block text-center py-12">
        <span class="material-icons-outlined text-5xl text-gray-300 dark:text-gray-600">event_busy</span>
        <p class="text-sm text-subtext-light dark:text-subtext-dark mt-3">Nenhuma tarefa neste mês</p>
      </div>
    </div>

    <!-- Painel de detalhes do dia selecionado (Desktop) -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="selectedDay && selectedDay.tasks && selectedDay.tasks.length > 0"
          class="fixed inset-0 z-40 flex items-center justify-center p-4"
          @click.self="selectedDay = null"
        >
          <!-- Overlay -->
          <div class="absolute inset-0 bg-black/30 dark:bg-black/50" @click="selectedDay = null"></div>

          <!-- Popup -->
          <div class="relative z-50 w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-border-light dark:border-border-dark overflow-hidden">
            <!-- Header -->
            <div class="flex items-center justify-between px-4 py-3 border-b border-border-light dark:border-border-dark bg-gray-50 dark:bg-gray-700/50">
              <div class="flex items-center gap-2">
                <span
                  :class="[
                    'text-sm font-bold w-8 h-8 flex items-center justify-center rounded-full',
                    selectedDay.isToday ? 'bg-[#4A7C59] text-white' : 'bg-gray-200 dark:bg-gray-600 text-text-light dark:text-text-dark'
                  ]"
                >
                  {{ selectedDay.day }}
                </span>
                <div>
                  <p class="text-sm font-semibold text-text-light dark:text-text-dark capitalize">
                    {{ selectedDayWeekdayFull }}, {{ selectedDay.day }} de {{ monthName }} de {{ year }}
                  </p>
                  <p class="text-xs text-subtext-light dark:text-subtext-dark">
                    {{ selectedDay.tasks.length }} {{ selectedDay.tasks.length === 1 ? 'tarefa' : 'tarefas' }}
                  </p>
                </div>
              </div>
              <button
                @click="selectedDay = null"
                class="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <span class="material-icons-outlined text-lg text-subtext-light dark:text-subtext-dark">close</span>
              </button>
            </div>

            <!-- Lista de tarefas -->
            <div class="max-h-[400px] overflow-y-auto divide-y divide-border-light dark:divide-border-dark">
              <div
                v-for="tarefa in selectedDay.tasks"
                :key="tarefa.id"
                class="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
              >
                <div class="flex items-start gap-3">
                  <!-- Indicador de cor -->
                  <span :class="['w-2 h-2 rounded-full mt-1.5 shrink-0', getTaskDotColor(tarefa)]"></span>

                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                      <p class="text-sm font-medium text-text-light dark:text-text-dark truncate">
                        {{ tarefa.titulo }}
                      </p>
                      <span
                        v-if="tarefa.concluida"
                        class="material-icons-outlined text-xs text-green-600 dark:text-green-400 shrink-0"
                      >check_circle</span>
                    </div>
                    <p v-if="tarefa.especies" class="text-xs text-subtext-light dark:text-subtext-dark mt-0.5">
                      {{ tarefa.especies.nome }}
                    </p>
                    <p v-if="tarefa.descricao" class="text-xs text-subtext-light dark:text-subtext-dark mt-1 line-clamp-2">
                      {{ tarefa.descricao }}
                    </p>
                  </div>

                  <!-- Ícone do tipo -->
                  <span :class="['material-icons-outlined text-base shrink-0', getTaskIconColor(tarefa)]">
                    {{ getTaskIcon(tarefa) }}
                  </span>
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

interface Especie {
  id: string
  nome: string
}

interface Tarefa {
  id: string
  titulo: string
  descricao?: string
  tipo?: string
  data_prevista: string
  concluida: boolean
  empresa_id: string
  especie_id?: string
  especies?: Especie | null
}

interface CalendarCell {
  day: number | null
  dateStr: string
  isCurrentMonth: boolean
  isToday: boolean
  isWeekend: boolean
  tasks: Tarefa[]
}

interface DayGroup {
  dateStr: string
  day: number
  isToday: boolean
  weekdayName: string
  tasks: Tarefa[]
}

const supabase = useSupabaseClient()
const { currentCompany } = useCurrentCompany()

const loading = ref(false)
const tarefas = ref<Tarefa[]>([])
const selectedDay = ref<CalendarCell | null>(null)

// Mês/ano atual
const today = new Date()
const month = ref(today.getMonth())
const year = ref(today.getFullYear())

const mesesPtBR = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
]

const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

const diasSemanaFull = [
  'domingo', 'segunda-feira', 'terça-feira', 'quarta-feira',
  'quinta-feira', 'sexta-feira', 'sábado'
]

const monthName = computed(() => mesesPtBR[month.value])

// Navegação
function previousMonth() {
  selectedDay.value = null
  if (month.value === 0) {
    month.value = 11
    year.value--
  } else {
    month.value--
  }
}

function nextMonth() {
  selectedDay.value = null
  if (month.value === 11) {
    month.value = 0
    year.value++
  } else {
    month.value++
  }
}

function goToToday() {
  selectedDay.value = null
  month.value = today.getMonth()
  year.value = today.getFullYear()
}

// Classificação de tarefa por tipo/nome
function classifyTask(tarefa: Tarefa): 'plantio' | 'luz' | 'colheita' | 'manual' | 'recorrente' {
  const tipo = (tarefa.tipo || '').toLowerCase()
  const titulo = (tarefa.titulo || '').toLowerCase()

  if (tipo === 'recorrente' || titulo.includes('recorrente')) return 'recorrente'
  if (tipo === 'plantio' || titulo.includes('plantio') || titulo.includes('plantar') || titulo.includes('semeadura') || titulo.includes('semear')) return 'plantio'
  if (tipo === 'luz' || titulo.includes('luz') || titulo.includes('iluminação') || titulo.includes('iluminacao') || titulo.includes('blackout')) return 'luz'
  if (tipo === 'colheita' || titulo.includes('colheita') || titulo.includes('colher') || titulo.includes('corte') || titulo.includes('cortar')) return 'colheita'

  return 'manual'
}

function getTaskChipClasses(tarefa: Tarefa): string {
  const cat = classifyTask(tarefa)
  switch (cat) {
    case 'plantio':
      return 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300'
    case 'luz':
      return 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300'
    case 'colheita':
      return 'bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300'
    case 'recorrente':
      return 'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300'
    default:
      return 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300'
  }
}

function getTaskDotColor(tarefa: Tarefa): string {
  const cat = classifyTask(tarefa)
  switch (cat) {
    case 'plantio': return 'bg-green-500'
    case 'luz': return 'bg-yellow-500'
    case 'colheita': return 'bg-orange-500'
    case 'recorrente': return 'bg-purple-500'
    default: return 'bg-blue-500'
  }
}

function getTaskIcon(tarefa: Tarefa): string {
  const cat = classifyTask(tarefa)
  switch (cat) {
    case 'plantio': return 'grass'
    case 'luz': return 'wb_sunny'
    case 'colheita': return 'agriculture'
    case 'recorrente': return 'repeat'
    default: return 'task_alt'
  }
}

function getTaskIconColor(tarefa: Tarefa): string {
  const cat = classifyTask(tarefa)
  switch (cat) {
    case 'plantio': return 'text-green-500 dark:text-green-400'
    case 'luz': return 'text-yellow-500 dark:text-yellow-400'
    case 'colheita': return 'text-orange-500 dark:text-orange-400'
    case 'recorrente': return 'text-purple-500 dark:text-purple-400'
    default: return 'text-blue-500 dark:text-blue-400'
  }
}

// Construção do calendário
const calendarWeeks = computed<CalendarCell[][]>(() => {
  const y = year.value
  const m = month.value

  const firstDay = new Date(y, m, 1)
  const lastDay = new Date(y, m + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startPad = firstDay.getDay() // 0=Domingo

  // Mês anterior para preencher
  const prevMonthLastDay = new Date(y, m, 0).getDate()

  // Mapa de tarefas por data
  const taskMap = new Map<string, Tarefa[]>()
  for (const t of tarefas.value) {
    const dateKey = t.data_prevista // YYYY-MM-DD
    if (!taskMap.has(dateKey)) {
      taskMap.set(dateKey, [])
    }
    taskMap.get(dateKey)!.push(t)
  }

  const todayStr = formatDateStr(today.getFullYear(), today.getMonth(), today.getDate())

  const cells: CalendarCell[] = []

  // Dias do mês anterior (padding)
  for (let i = startPad - 1; i >= 0; i--) {
    const day = prevMonthLastDay - i
    const prevM = m === 0 ? 11 : m - 1
    const prevY = m === 0 ? y - 1 : y
    const dateStr = formatDateStr(prevY, prevM, day)
    cells.push({
      day,
      dateStr,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
      isWeekend: cells.length % 7 === 0 || cells.length % 7 === 6,
      tasks: taskMap.get(dateStr) || []
    })
  }

  // Dias do mês atual
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = formatDateStr(y, m, d)
    const dayOfWeek = (startPad + d - 1) % 7
    cells.push({
      day: d,
      dateStr,
      isCurrentMonth: true,
      isToday: dateStr === todayStr,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      tasks: taskMap.get(dateStr) || []
    })
  }

  // Dias do próximo mês (padding para completar última semana)
  const remainder = cells.length % 7
  if (remainder > 0) {
    const padEnd = 7 - remainder
    const nextM = m === 11 ? 0 : m + 1
    const nextY = m === 11 ? y + 1 : y
    for (let d = 1; d <= padEnd; d++) {
      const dateStr = formatDateStr(nextY, nextM, d)
      cells.push({
        day: d,
        dateStr,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isWeekend: cells.length % 7 === 0 || cells.length % 7 === 6,
        tasks: taskMap.get(dateStr) || []
      })
    }
  }

  // Dividir em semanas
  const weeks: CalendarCell[][] = []
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7))
  }

  return weeks
})

// Lista mobile: dias com tarefas agrupados
const daysWithTasks = computed<DayGroup[]>(() => {
  const y = year.value
  const m = month.value
  const daysInMonth = new Date(y, m + 1, 0).getDate()
  const todayStr = formatDateStr(today.getFullYear(), today.getMonth(), today.getDate())

  const taskMap = new Map<string, Tarefa[]>()
  for (const t of tarefas.value) {
    const dateKey = t.data_prevista
    if (!taskMap.has(dateKey)) {
      taskMap.set(dateKey, [])
    }
    taskMap.get(dateKey)!.push(t)
  }

  const groups: DayGroup[] = []
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = formatDateStr(y, m, d)
    const tasks = taskMap.get(dateStr)
    if (tasks && tasks.length > 0) {
      const dayOfWeek = new Date(y, m, d).getDay()
      groups.push({
        dateStr,
        day: d,
        isToday: dateStr === todayStr,
        weekdayName: diasSemanaFull[dayOfWeek],
        tasks
      })
    }
  }

  return groups
})

// Nome do dia da semana para dia selecionado (popup)
const selectedDayWeekdayFull = computed(() => {
  if (!selectedDay.value || !selectedDay.value.dateStr) return ''
  const [sy, sm, sd] = selectedDay.value.dateStr.split('-').map(Number)
  const d = new Date(sy, sm - 1, sd)
  return diasSemanaFull[d.getDay()]
})

// Helpers
function formatDateStr(y: number, m: number, d: number): string {
  const mm = String(m + 1).padStart(2, '0')
  const dd = String(d).padStart(2, '0')
  return `${y}-${mm}-${dd}`
}

function selectDay(cell: CalendarCell) {
  if (!cell.day || !cell.isCurrentMonth) return
  if (cell.tasks.length === 0) {
    selectedDay.value = null
    return
  }
  selectedDay.value = selectedDay.value?.dateStr === cell.dateStr ? null : cell
}

// Fetch tarefas
async function fetchTarefas() {
  if (!currentCompany.value?.id) return

  loading.value = true
  try {
    const y = year.value
    const m = month.value
    const firstDayOfMonth = formatDateStr(y, m, 1)
    const lastDayOfMonth = formatDateStr(y, m, new Date(y, m + 1, 0).getDate())

    const { data, error } = await supabase
      .from('tarefas')
      .select('*, especies(id, nome)')
      .eq('empresa_id', currentCompany.value.id)
      .gte('data_prevista', firstDayOfMonth)
      .lte('data_prevista', lastDayOfMonth)
      .order('data_prevista')

    if (error) {
      console.error('Erro ao carregar tarefas:', error)
      tarefas.value = []
    } else {
      tarefas.value = data || []
    }
  } catch (err) {
    console.error('Erro ao carregar tarefas:', err)
    tarefas.value = []
  } finally {
    loading.value = false
  }
}

// Watchers
watch([month, year], () => {
  fetchTarefas()
})

watch(() => currentCompany.value?.id, () => {
  fetchTarefas()
})

onMounted(() => {
  fetchTarefas()
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
