import { ref, computed, watch } from 'vue'

// ─── Helpers ─────────────────────────────────────────────

function getInicioSemana(date: Date): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}

function getFimSemana(date: Date): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? 0 : 7)
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}

function toDateStr(date: Date): string {
  return date.toISOString().split('T')[0]
}

function isInRange(dateStr: string, start: string, end: string): boolean {
  return dateStr >= start && dateStr <= end
}

/** Gera 4 sub-períodos iguais dentro do range para sparkline */
function getSparklinePeriods(inicio: string, fim: string) {
  const start = new Date(inicio + 'T00:00:00')
  const end = new Date(fim + 'T00:00:00')
  const totalDays = Math.max(Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1, 4)
  const chunkSize = Math.floor(totalDays / 4)
  const periods: { start: string; end: string }[] = []
  for (let i = 0; i < 4; i++) {
    const s = new Date(start)
    s.setDate(s.getDate() + i * chunkSize)
    const e = new Date(start)
    e.setDate(e.getDate() + (i === 3 ? totalDays - 1 : (i + 1) * chunkSize - 1))
    periods.push({ start: toDateStr(s), end: toDateStr(e) })
  }
  return periods
}

/** Período anterior de mesma duração para cálculo de variação */
function getPeriodoAnterior(inicio: string, fim: string) {
  const start = new Date(inicio + 'T00:00:00')
  const end = new Date(fim + 'T00:00:00')
  const days = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
  const prevEnd = new Date(start)
  prevEnd.setDate(prevEnd.getDate() - 1)
  const prevStart = new Date(prevEnd)
  prevStart.setDate(prevStart.getDate() - days + 1)
  return { start: toDateStr(prevStart), end: toDateStr(prevEnd) }
}

const MONTH_LABELS_BR = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

// ─── Interfaces ──────────────────────────────────────────

interface HeroKpi {
  label: string
  value: number
  format: 'currency' | 'number' | 'percent'
  suffix?: string
  sparkline: number[]
  change: number
  icon: string
  iconBg: string
  iconColor: string
}

interface RankingItem {
  nome: string
  valor: number
}

interface ProducaoData {
  total: number
  perdas: number
  previstos: number
  atrasados: number
  fases: { plantio: number; germinando: number; luz: number; colheita: number; concluido: number }
}

interface FazendaData {
  nome: string
  ocupacao: number
  eficiencia: number
}

// ─── Composable ──────────────────────────────────────────

export function useDashboardData() {
  const supabase = useSupabaseClient()
  const { currentCompany } = useCurrentCompany()

  // ── Período (date range, igual comercial) ──
  const periodo = ref({
    inicio: getInicioSemana(new Date()),
    fim: getFimSemana(new Date()),
  })

  const dateRangeModel = ref<Date[]>([
    new Date(periodo.value.inicio + 'T00:00:00'),
    new Date(periodo.value.fim + 'T00:00:00'),
  ])

  // ── Estado ──
  const loading = ref(false)
  const hasData = ref(false)

  // ── Data Refs ──
  const heroKpis = ref<HeroKpi[]>(buildEmptyKpis())
  const rankings = ref<{ eficiencia: RankingItem[]; vendidos: RankingItem[]; margem: RankingItem[] }>({
    eficiencia: [],
    vendidos: [],
    margem: [],
  })
  const producao = ref<ProducaoData>({
    total: 0,
    perdas: 0,
    previstos: 0,
    atrasados: 0,
    fases: { plantio: 0, germinando: 0, luz: 0, colheita: 0, concluido: 0 },
  })
  const vendasMensais = ref<{ mes: string; valor: number }[]>([])
  const fazendas = ref<FazendaData[]>([])

  // ── Computed derivados para template ──
  const producaoFases = computed(() => [
    { label: 'Plantio', value: producao.value.fases.plantio, color: '#3B82F6' },
    { label: 'Germinando', value: producao.value.fases.germinando, color: '#8B5CF6' },
    { label: 'Luz', value: producao.value.fases.luz, color: '#EAB308' },
    { label: 'Colheita', value: producao.value.fases.colheita, color: '#22C55E' },
    { label: 'Concluído', value: producao.value.fases.concluido, color: '#9CA3AF' },
  ])

  const producaoCards = computed(() => [
    {
      label: 'Total',
      value: producao.value.total,
      icon: 'inventory_2',
      iconClass: 'text-blue-500',
      valueClass: 'text-gray-900 dark:text-white',
      borderClass: 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50',
    },
    {
      label: 'Perdas',
      value: producao.value.perdas,
      icon: 'delete_outline',
      iconClass: 'text-red-500',
      valueClass: 'text-red-600 dark:text-red-400',
      borderClass: 'border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-500/5',
    },
    {
      label: 'Previstos',
      value: producao.value.previstos,
      icon: 'schedule',
      iconClass: 'text-blue-500',
      valueClass: 'text-blue-600 dark:text-blue-400',
      borderClass: 'border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-500/5',
    },
    {
      label: 'Atrasados',
      value: producao.value.atrasados,
      icon: 'warning',
      iconClass: 'text-amber-500',
      valueClass: 'text-amber-600 dark:text-amber-400',
      borderClass: 'border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-500/5',
    },
  ])

  // ── Navegação de Período ──
  function periodoAnterior() {
    const inicio = new Date(periodo.value.inicio + 'T00:00:00')
    const fim = new Date(periodo.value.fim + 'T00:00:00')
    const days = Math.round((fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)) + 1
    inicio.setDate(inicio.getDate() - days)
    fim.setDate(fim.getDate() - days)
    dateRangeModel.value = [inicio, fim]
  }

  function proximoPeriodo() {
    const inicio = new Date(periodo.value.inicio + 'T00:00:00')
    const fim = new Date(periodo.value.fim + 'T00:00:00')
    const days = Math.round((fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)) + 1
    inicio.setDate(inicio.getDate() + days)
    fim.setDate(fim.getDate() + days)
    dateRangeModel.value = [inicio, fim]
  }

  // Sync dateRangeModel → periodo
  watch(dateRangeModel, (val) => {
    if (val && val.length === 2 && val[0] && val[1]) {
      periodo.value.inicio = val[0].toISOString().split('T')[0]
      periodo.value.fim = val[1].toISOString().split('T')[0]
    }
  }, { deep: true })

  // Preset dates para seleção rápida
  const presetDates = computed(() => {
    const today = new Date()
    const startThisWeek = new Date(getInicioSemana(today) + 'T00:00:00')
    const endThisWeek = new Date(getFimSemana(today) + 'T00:00:00')
    const lastWeekStart = new Date(startThisWeek)
    lastWeekStart.setDate(lastWeekStart.getDate() - 7)
    const lastWeekEnd = new Date(endThisWeek)
    lastWeekEnd.setDate(lastWeekEnd.getDate() - 7)
    const startThisMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const endThisMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    const startLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const endLastMonth = new Date(today.getFullYear(), today.getMonth(), 0)
    return [
      { label: 'Esta semana', value: [startThisWeek, endThisWeek] },
      { label: 'Semana passada', value: [lastWeekStart, lastWeekEnd] },
      { label: 'Este mês', value: [startThisMonth, endThisMonth] },
      { label: 'Mês passado', value: [startLastMonth, endLastMonth] },
    ]
  })

  function formatDateDisplay(dates: Date[]) {
    if (!dates || dates.length < 2) return ''
    const fmt = (d: Date) => {
      const dd = String(d.getDate()).padStart(2, '0')
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const yy = String(d.getFullYear()).slice(2)
      return `${dd}/${mm}/${yy}`
    }
    return `${fmt(dates[0])} - ${fmt(dates[1])}`
  }

  // ── Fetch Principal ──
  async function fetchAll() {
    const empresaId = currentCompany.value?.id
    if (!empresaId) {
      resetAll()
      return
    }

    loading.value = true
    try {
      const { inicio, fim } = periodo.value
      const sparkPeriods = getSparklinePeriods(inicio, fim)
      const prevPeriodo = getPeriodoAnterior(inicio, fim)

      // 12 meses atrás para gráfico de vendas mensais
      const twelveMonthsAgo = new Date(fim + 'T00:00:00')
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11)
      twelveMonthsAgo.setDate(1)
      const startDate12m = toDateStr(twelveMonthsAgo)

      // Buscar pedidos do período anterior até o fim (cobre sparkline + variação + 12 meses)
      const fetchStart = startDate12m < prevPeriodo.start ? startDate12m : prevPeriodo.start

      const [pedidosResult, producoesResult, fazendasResult] = await Promise.all([
        fetchPedidos(empresaId, fetchStart, fim),
        fetchProducoes(empresaId),
        fetchFazendas(empresaId),
      ])

      processPedidosData(pedidosResult, { start: inicio, end: fim }, prevPeriodo, sparkPeriods)
      processProducoesData(producoesResult)
      processFazendasData(fazendasResult, producoesResult)

      hasData.value = true
    } catch (e: any) {
      console.error('Dashboard fetch error:', e)
    } finally {
      loading.value = false
    }
  }

  // ── Queries ──

  async function fetchPedidos(empresaId: string, startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from('pedidos')
      .select('id, data_pedido, valor_total, status, pedido_itens(quantidade, produto_id, valor_total, produtos(nome, especie_id))')
      .eq('empresa_id', empresaId)
      .not('status', 'eq', 'cancelado')
      .gte('data_pedido', startDate)
      .lte('data_pedido', endDate)
      .order('data_pedido', { ascending: true })

    if (error) {
      console.error('Erro ao buscar pedidos:', error)
      return []
    }
    return data || []
  }

  async function fetchProducoes(empresaId: string) {
    const { data, error } = await supabase
      .from('producoes')
      .select(`
        id, status, quantidade_planejada, fazenda_id,
        data_colheita_prevista, data_planejado, data_finalizado, created_at,
        producao_especies(
          especie_id, quantidade_planejada, total_colhido,
          perda_germinacao, perda_final,
          especies(nome)
        )
      `)
      .eq('empresa_id', empresaId)
      .not('status', 'eq', 'cancelado')

    if (error) {
      console.error('Erro ao buscar produções:', error)
      return []
    }
    return data || []
  }

  async function fetchFazendas(empresaId: string) {
    const { data, error } = await supabase
      .from('fazendas')
      .select('id, nome, capacidade_bandejas')
      .eq('empresa_id', empresaId)
      .eq('ativo', true)
      .order('nome', { ascending: true })

    if (error) {
      console.error('Erro ao buscar fazendas:', error)
      return []
    }
    return data || []
  }

  // ── Processamento de Pedidos ──

  function processPedidosData(
    pedidos: any[],
    currentPeriod: { start: string; end: string },
    prevPeriod: { start: string; end: string },
    sparkPeriods: { start: string; end: string }[]
  ) {
    // ── Faturamento ──
    const faturamentoAtual = sumPedidosValor(pedidos, currentPeriod)
    const faturamentoAnterior = sumPedidosValor(pedidos, prevPeriod)
    const faturamentoSpark = sparkPeriods.map((p) => sumPedidosValor(pedidos, p))
    const faturamentoChange = calcChange(faturamentoAtual, faturamentoAnterior)

    updateKpi(0, Math.round(faturamentoAtual), faturamentoSpark.map(Math.round), faturamentoChange)

    // ── Vendas (unidades) ──
    const vendasAtual = sumPedidosQuantidade(pedidos, currentPeriod)
    const vendasAnterior = sumPedidosQuantidade(pedidos, prevPeriod)
    const vendasSpark = sparkPeriods.map((p) => sumPedidosQuantidade(pedidos, p))
    const vendasChange = calcChange(vendasAtual, vendasAnterior)

    updateKpi(1, Math.round(vendasAtual), vendasSpark.map(Math.round), vendasChange)

    // ── Ranking Vendidos (no período atual) ──
    const produtoMap = new Map<string, number>()
    pedidos
      .filter((p: any) => isInRange(p.data_pedido, currentPeriod.start, currentPeriod.end))
      .forEach((p: any) => {
        (p.pedido_itens || []).forEach((item: any) => {
          const nome = item.produtos?.nome || 'Sem nome'
          produtoMap.set(nome, (produtoMap.get(nome) || 0) + (Number(item.quantidade) || 0))
        })
      })
    rankings.value.vendidos = [...produtoMap.entries()]
      .map(([nome, valor]) => ({ nome, valor: Math.round(valor) }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 10)

    // ── Vendas Mensais (últimos 12 meses) ──
    const monthMap = new Map<string, number>()
    pedidos.forEach((p: any) => {
      if (!p.data_pedido) return
      const d = new Date(p.data_pedido + 'T00:00:00')
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`
      monthMap.set(key, (monthMap.get(key) || 0) + (Number(p.valor_total) || 0))
    })
    const meses: { mes: string; valor: number }[] = []
    const endDate = new Date(currentPeriod.end + 'T00:00:00')
    for (let i = 11; i >= 0; i--) {
      const d = new Date(endDate)
      d.setMonth(d.getMonth() - i)
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`
      meses.push({ mes: MONTH_LABELS_BR[d.getMonth()], valor: Math.round(monthMap.get(key) || 0) })
    }
    vendasMensais.value = meses
  }

  function sumPedidosValor(pedidos: any[], range: { start: string; end: string }): number {
    return pedidos
      .filter((p: any) => isInRange(p.data_pedido, range.start, range.end))
      .reduce((sum: number, p: any) => sum + (Number(p.valor_total) || 0), 0)
  }

  function sumPedidosQuantidade(pedidos: any[], range: { start: string; end: string }): number {
    return pedidos
      .filter((p: any) => isInRange(p.data_pedido, range.start, range.end))
      .reduce((sum: number, p: any) => {
        return sum + (p.pedido_itens || []).reduce((s: number, i: any) => s + (Number(i.quantidade) || 0), 0)
      }, 0)
  }

  function calcChange(current: number, previous: number): number {
    if (previous <= 0) return 0
    return Math.round(((current - previous) / previous) * 100)
  }

  // ── Processamento de Produções ──

  function processProducoesData(prods: any[]) {
    if (!prods || prods.length === 0) {
      producao.value = { total: 0, perdas: 0, previstos: 0, atrasados: 0, fases: { plantio: 0, germinando: 0, luz: 0, colheita: 0, concluido: 0 } }
      updateKpi(2, 0, [0, 0, 0, 0], 0)
      updateKpi(3, 0, [0, 0, 0, 0], 0)
      updateKpi(4, 0, [0, 0, 0, 0], 0)
      rankings.value.eficiencia = []
      rankings.value.margem = []
      return
    }

    const activeStatuses = ['planejado', 'germinando', 'luz', 'colhendo']
    const today = toDateStr(new Date())

    // Fases
    const fases = {
      plantio: prods.filter((p: any) => p.status === 'planejado').length,
      germinando: prods.filter((p: any) => p.status === 'germinando').length,
      luz: prods.filter((p: any) => p.status === 'luz').length,
      colheita: prods.filter((p: any) => p.status === 'colhendo').length,
      concluido: prods.filter((p: any) => p.status === 'finalizado').length,
    }

    const total = prods.length
    const previstos = fases.plantio
    const atrasados = prods.filter((p: any) =>
      p.data_colheita_prevista && p.data_colheita_prevista < today &&
      activeStatuses.includes(p.status)
    ).length

    // Perdas: sum perda_germinacao + perda_final
    let perdas = 0
    prods.forEach((p: any) => {
      (p.producao_especies || []).forEach((pe: any) => {
        perdas += (pe.perda_germinacao || 0) + (pe.perda_final || 0)
      })
    })

    producao.value = { total, perdas, previstos, atrasados, fases }

    // ── KPI: Produção Ativa (bandejas em status ativo) ──
    const producaoAtiva = prods
      .filter((p: any) => activeStatuses.includes(p.status))
      .reduce((sum: number, p: any) => sum + (p.quantidade_planejada || 0), 0)
    updateKpi(2, producaoAtiva, [0, 0, 0, producaoAtiva], 0)

    // ── KPI: Eficiência (finalizadas: bandejas colhidas / bandejas planejadas) ──
    const finalizados = prods.filter((p: any) => p.status === 'finalizado')
    const especieEffMap = new Map<string, { colhido: number; planejado: number }>()
    let totalColhidoGeral = 0
    let totalPlanejadoGeral = 0

    finalizados.forEach((p: any) => {
      (p.producao_especies || []).forEach((pe: any) => {
        const planejado = pe.quantidade_planejada || 0
        const colhido = pe.total_colhido || 0
        if (planejado > 0) {
          const nome = pe.especies?.nome || 'Desconhecida'
          const entry = especieEffMap.get(nome) || { colhido: 0, planejado: 0 }
          entry.colhido += colhido
          entry.planejado += planejado
          especieEffMap.set(nome, entry)
          totalColhidoGeral += colhido
          totalPlanejadoGeral += planejado
        }
      })
    })

    // Eficiência geral: % de bandejas colhidas vs planejadas (cap 100%)
    const eficienciaGeral = totalPlanejadoGeral > 0
      ? Math.min(100, Math.round((totalColhidoGeral / totalPlanejadoGeral) * 100))
      : 0
    updateKpi(4, eficienciaGeral, [0, 0, 0, eficienciaGeral], 0)

    // Ranking Eficiência por espécie
    rankings.value.eficiencia = [...especieEffMap.entries()]
      .map(([nome, data]) => ({
        nome,
        valor: data.planejado > 0 ? Math.min(100, Math.round((data.colhido / data.planejado) * 100)) : 0,
      }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 10)

    // ── KPI: Margem Bruta ──
    // Sem dados confiáveis de custo por pedido — mostra 0 até ter modelo de custo
    updateKpi(3, 0, [0, 0, 0, 0], 0)
    rankings.value.margem = []
  }

  // ── Processamento de Fazendas ──

  function processFazendasData(farmsData: any[], producoesData: any[]) {
    if (!farmsData || farmsData.length === 0) {
      fazendas.value = []
      return
    }

    const activeStatuses = ['planejado', 'germinando', 'luz', 'colhendo']
    const activeProds = (producoesData || []).filter((p: any) => activeStatuses.includes(p.status))
    const finalProds = (producoesData || []).filter((p: any) => p.status === 'finalizado')

    fazendas.value = farmsData.map((farm: any) => {
      const farmActiveTrays = activeProds
        .filter((p: any) => p.fazenda_id === farm.id)
        .reduce((sum: number, p: any) => sum + (p.quantidade_planejada || 0), 0)
      const capacidade = farm.capacidade_bandejas || 1
      const ocupacao = Math.min(Math.round((farmActiveTrays / capacidade) * 100), 100)

      let totalColhido = 0
      let totalPlanejado = 0
      finalProds
        .filter((p: any) => p.fazenda_id === farm.id)
        .forEach((p: any) => {
          (p.producao_especies || []).forEach((pe: any) => {
            totalColhido += (pe.total_colhido || 0)
            totalPlanejado += (pe.quantidade_planejada || 0)
          })
        })
      const eficiencia = totalPlanejado > 0 ? Math.min(100, Math.round((totalColhido / totalPlanejado) * 100)) : 0

      return { nome: farm.nome, ocupacao, eficiencia }
    })
  }

  // ── Helpers ──

  function updateKpi(index: number, value: number, sparkline: number[], change: number) {
    if (heroKpis.value[index]) {
      heroKpis.value[index].value = value
      heroKpis.value[index].sparkline = sparkline
      heroKpis.value[index].change = change
    }
  }

  function resetAll() {
    heroKpis.value = buildEmptyKpis()
    rankings.value = { eficiencia: [], vendidos: [], margem: [] }
    producao.value = { total: 0, perdas: 0, previstos: 0, atrasados: 0, fases: { plantio: 0, germinando: 0, luz: 0, colheita: 0, concluido: 0 } }
    vendasMensais.value = []
    fazendas.value = []
    hasData.value = false
  }

  // ── Watchers ──
  watch(() => currentCompany.value?.id, (newId) => {
    if (newId) fetchAll()
    else resetAll()
  }, { immediate: true })

  watch(() => periodo.value, () => {
    if (currentCompany.value?.id) fetchAll()
  }, { deep: true })

  return {
    loading,
    hasData,
    heroKpis,
    rankings,
    producao,
    producaoFases,
    producaoCards,
    vendasMensais,
    fazendas,
    periodo,
    dateRangeModel,
    presetDates,
    formatDateDisplay,
    periodoAnterior,
    proximoPeriodo,
    fetchAll,
  }
}

// ── KPIs Vazios ──

function buildEmptyKpis(): HeroKpi[] {
  return [
    {
      label: 'Faturamento',
      value: 0,
      format: 'currency',
      sparkline: [0, 0, 0, 0],
      change: 0,
      icon: 'payments',
      iconBg: 'bg-emerald-50 dark:bg-emerald-500/10',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'Vendas',
      value: 0,
      format: 'number',
      suffix: 'un',
      sparkline: [0, 0, 0, 0],
      change: 0,
      icon: 'shopping_cart',
      iconBg: 'bg-blue-50 dark:bg-blue-500/10',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      label: 'Produção',
      value: 0,
      format: 'number',
      suffix: 'bdj',
      sparkline: [0, 0, 0, 0],
      change: 0,
      icon: 'eco',
      iconBg: 'bg-amber-50 dark:bg-amber-500/10',
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
    {
      label: 'Margem Bruta',
      value: 0,
      format: 'percent',
      sparkline: [0, 0, 0, 0],
      change: 0,
      icon: 'trending_up',
      iconBg: 'bg-violet-50 dark:bg-violet-500/10',
      iconColor: 'text-violet-600 dark:text-violet-400',
    },
    {
      label: 'Eficiência',
      value: 0,
      format: 'percent',
      sparkline: [0, 0, 0, 0],
      change: 0,
      icon: 'speed',
      iconBg: 'bg-cyan-50 dark:bg-cyan-500/10',
      iconColor: 'text-cyan-600 dark:text-cyan-400',
    },
  ]
}
