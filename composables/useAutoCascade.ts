/**
 * useAutoCascade
 *
 * Auto-cascade logic: when a pedido (order) is saved/confirmed,
 * automatically generate Plantios, Tarefas, Colheitas and ColheitaItens.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PlantioGerado {
  id: string
  especie_id: string
  bandejas: number
  data_plantio: string
  data_colheita: string
}

interface ProdutoRow {
  id: string
  especie_id: string | null
  modalidade: 'vivo' | 'cortado'
  peso_gramas: number | null
  unidade: string | null
  unidades_por_bandeja: number | null
  is_mix: boolean
  produto_especies: ProdutoEspecieRow[]
}

interface ProdutoEspecieRow {
  especie_id: string
  percentual: number
  especie: {
    id: string
    tempo_germinacao?: number | null
    tempo_luz?: number | null
    vida_util_dias?: number | null
    tempo_buffer_colheita?: number | null
  }
}

interface PedidoItemRow {
  id: string
  pedido_id: string
  produto_id: string
  quantidade: number
  valor_unitario: number
  produto: ProdutoRow
}

interface PedidoRow {
  id: string
  empresa_id: string
  data_entrega: string
  status: string
  pedido_itens: PedidoItemRow[]
}

interface LoteRow {
  id: string
  especie_id: string
  rendimento_por_bandeja: number | null
  densidade_semeadura: number | null
  margem_seguranca: number | null
  eficiencia?: number | null
}

interface EtapaRow {
  id: string
  especie_id: string
  nome: string
  ordem: number
  duracao_dias: number
}

interface EspecieRow {
  id: string
  tempo_germinacao?: number | null
  tempo_luz?: number | null
  vida_util_dias?: number | null
  tempo_buffer_colheita?: number | null
}

/** Intermediate structure while accumulating plantio data per item */
interface PlantioCandidate {
  especie_id: string
  lote_semente_id: string
  pedido_item_id: string
  bandejas: number
  semente_necessaria_g: number
  rendimento_esperado_g: number
  rendimento_alocado_g: number
  data_plantio: string
  data_colheita: string
  data_validade: string | null
  etapas: EtapaRow[]
  especie: EspecieRow
  fazenda_id: string | null
}

/** Key used to group plantios into colheitas */
interface ColheitaGroup {
  data_colheita: string
  candidates: PlantioCandidate[]
}

// ---------------------------------------------------------------------------
// Composable
// ---------------------------------------------------------------------------

export function useAutoCascade() {
  const supabase = useSupabaseClient()
  const { currentCompany } = useCurrentCompany()
  const {
    calcularBandejas,
    calcularBandejasMix,
    calcularBandejasMixVivo,
    calcularDataPlantio,
    calcularDatasEtapas,
    calcularSementeNecessaria,
    calcularRendimentoEsperado,
    calcularDataValidade,
    maiorMargem
  } = useProducaoCalc()

  const empresaId = () => currentCompany.value?.id as string

  // -------------------------------------------------------------------------
  // Helpers: fetch supporting data
  // -------------------------------------------------------------------------

  async function fetchActiveLote(especieId: string): Promise<LoteRow | null> {
    const { data, error } = await supabase
      .from('lotes_sementes')
      .select('*')
      .eq('especie_id', especieId)
      .eq('status', 'ativo')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) return null
    return data as LoteRow
  }

  async function fetchEtapas(especieId: string): Promise<EtapaRow[]> {
    const { data, error } = await supabase
      .from('etapas_cultivo')
      .select('*')
      .eq('especie_id', especieId)
      .order('ordem')

    if (error || !data) return []
    return data as EtapaRow[]
  }

  async function fetchEspecie(especieId: string): Promise<EspecieRow | null> {
    const { data, error } = await supabase
      .from('especies')
      .select('id, tempo_germinacao, tempo_luz, vida_util_dias, tempo_buffer_colheita')
      .eq('id', especieId)
      .single()

    if (error || !data) return null
    return data as EspecieRow
  }

  // -------------------------------------------------------------------------
  // gerarCascadeFromPedido
  // -------------------------------------------------------------------------

  async function gerarCascadeFromPedido(
    pedidoId: string,
    fazendaId?: string
  ): Promise<PlantioGerado[]> {
    // 1. Fetch pedido with items and produto details
    const { data: pedido, error: pedidoError } = await supabase
      .from('pedidos')
      .select(`
        id,
        empresa_id,
        data_entrega,
        status,
        pedido_itens (
          id,
          pedido_id,
          produto_id,
          quantidade,
          valor_unitario,
          produto:produtos (
            id,
            especie_id,
            modalidade,
            peso_gramas,
            unidade,
            unidades_por_bandeja,
            is_mix,
            produto_especies (
              especie_id,
              percentual,
              especie:especies (
                id,
                tempo_germinacao,
                tempo_luz,
                vida_util_dias,
                tempo_buffer_colheita
              )
            )
          )
        )
      `)
      .eq('id', pedidoId)
      .single()

    if (pedidoError || !pedido) {
      console.error('[useAutoCascade] Erro ao buscar pedido:', pedidoError?.message)
      return []
    }

    const pedidoData = pedido as unknown as PedidoRow
    const dataColheita = pedidoData.data_entrega

    if (!dataColheita) {
      console.warn('[useAutoCascade] Pedido sem data_entrega, abortando cascade.')
      return []
    }

    // 2. Process each pedido_item into PlantioCandidate(s)
    const allCandidates: PlantioCandidate[] = []

    for (const item of pedidoData.pedido_itens) {
      const produto = item.produto
      if (!produto) continue

      const isMix = produto.is_mix && produto.produto_especies?.length > 0

      if (isMix) {
        // --- MIX product: one plantio per especie in the mix ---
        const candidates = await processMixItem(item, produto, dataColheita, fazendaId ?? null)
        allCandidates.push(...candidates)
      } else {
        // --- Single-species product ---
        const candidate = await processSingleItem(item, produto, dataColheita, fazendaId ?? null)
        if (candidate) allCandidates.push(candidate)
      }
    }

    if (allCandidates.length === 0) {
      console.warn('[useAutoCascade] Nenhum plantio gerado (lotes ou especies faltando).')
      return []
    }

    // 3. Group by (especie_id + data_colheita) -- colheitas are grouped by date
    const colheitaMap = new Map<string, ColheitaGroup>()
    for (const c of allCandidates) {
      const key = c.data_colheita
      if (!colheitaMap.has(key)) {
        colheitaMap.set(key, { data_colheita: c.data_colheita, candidates: [] })
      }
      colheitaMap.get(key)!.candidates.push(c)
    }

    // 4. For each colheita group: upsert colheita, insert plantios, colheita_itens, tarefas
    const createdPlantios: PlantioGerado[] = []

    for (const [, group] of colheitaMap) {
      // 4a. Upsert colheita (unique on empresa_id + data_colheita)
      const colheitaId = await upsertColheita(group.data_colheita)
      if (!colheitaId) continue

      // 4b. Insert plantios
      const plantioRows = group.candidates.map((c) => ({
        empresa_id: empresaId(),
        especie_id: c.especie_id,
        lote_semente_id: c.lote_semente_id,
        pedido_item_id: c.pedido_item_id,
        colheita_id: colheitaId,
        fazenda_id: c.fazenda_id,
        bandejas: c.bandejas,
        semente_necessaria_g: c.semente_necessaria_g,
        rendimento_esperado_g: c.rendimento_esperado_g,
        rendimento_alocado_g: c.rendimento_alocado_g,
        status: 'planejado',
        data_plantio: c.data_plantio,
        data_colheita: c.data_colheita,
        data_validade: c.data_validade
      }))

      const { data: insertedPlantios, error: plantioError } = await supabase
        .from('plantios')
        .insert(plantioRows)
        .select()

      if (plantioError || !insertedPlantios) {
        console.error('[useAutoCascade] Erro ao inserir plantios:', plantioError?.message)
        continue
      }

      // Map inserted plantios back to candidates for tarefa generation
      for (let i = 0; i < insertedPlantios.length; i++) {
        const plantio = insertedPlantios[i] as { id: string; especie_id: string; bandejas: number; data_plantio: string; data_colheita: string }
        const candidate = group.candidates[i]

        createdPlantios.push({
          id: plantio.id,
          especie_id: plantio.especie_id,
          bandejas: plantio.bandejas,
          data_plantio: plantio.data_plantio,
          data_colheita: plantio.data_colheita
        })

        // 4d. Create tarefas from etapas for this plantio
        await criarTarefasFromEtapas(plantio.id, candidate)
      }

      // 4c. Upsert colheita_itens (aggregate per especie per colheita)
      await upsertColheitaItens(colheitaId, group.candidates)
    }

    return createdPlantios
  }

  // -------------------------------------------------------------------------
  // Process single-species pedido item
  // -------------------------------------------------------------------------

  async function processSingleItem(
    item: PedidoItemRow,
    produto: ProdutoRow,
    dataColheita: string,
    fazendaId: string | null
  ): Promise<PlantioCandidate | null> {
    const especieId = produto.especie_id
    if (!especieId) {
      console.warn(`[useAutoCascade] Produto ${produto.id} sem especie_id, pulando.`)
      return null
    }

    const [lote, etapas, especie] = await Promise.all([
      fetchActiveLote(especieId),
      fetchEtapas(especieId),
      fetchEspecie(especieId)
    ])

    if (!lote) {
      console.warn(`[useAutoCascade] Sem lote ativo para especie ${especieId}, pulando item ${item.id}.`)
      return null
    }
    if (!especie) {
      console.warn(`[useAutoCascade] Especie ${especieId} nao encontrada, pulando item ${item.id}.`)
      return null
    }

    const bandejas = calcularBandejas(
      item.quantidade,
      lote,
      produto.modalidade,
      produto.peso_gramas,
      produto.unidade ?? undefined,
      produto.unidades_por_bandeja ?? undefined
    )

    const sementeNecessaria = calcularSementeNecessaria(bandejas, lote)
    const rendimentoEsperado = calcularRendimentoEsperado(bandejas, lote)
    const dataPlantio = calcularDataPlantio(dataColheita, etapas, especie)
    const dataValidade = calcularDataValidade(dataColheita, especie)

    // rendimento_alocado = weight the customer actually needs
    const rendimentoAlocado = produto.modalidade === 'cortado' && produto.peso_gramas
      ? item.quantidade * produto.peso_gramas
      : 0

    return {
      especie_id: especieId,
      lote_semente_id: lote.id,
      pedido_item_id: item.id,
      bandejas,
      semente_necessaria_g: sementeNecessaria,
      rendimento_esperado_g: rendimentoEsperado,
      rendimento_alocado_g: rendimentoAlocado,
      data_plantio: dataPlantio,
      data_colheita: dataColheita,
      data_validade: dataValidade,
      etapas,
      especie,
      fazenda_id: fazendaId
    }
  }

  // -------------------------------------------------------------------------
  // Process MIX pedido item
  // -------------------------------------------------------------------------

  async function processMixItem(
    item: PedidoItemRow,
    produto: ProdutoRow,
    dataColheita: string,
    fazendaId: string | null
  ): Promise<PlantioCandidate[]> {
    const candidates: PlantioCandidate[] = []

    if (produto.modalidade === 'vivo') {
      // Vivo MIX: shared trays, one plantio per species but same bandeja count
      const lotes: LoteRow[] = []
      const especiesData: { especie: EspecieRow; lote: LoteRow; etapas: EtapaRow[]; percentual: number }[] = []

      for (const pe of produto.produto_especies) {
        const [lote, etapas, especie] = await Promise.all([
          fetchActiveLote(pe.especie_id),
          fetchEtapas(pe.especie_id),
          fetchEspecie(pe.especie_id)
        ])

        if (!lote) {
          console.warn(`[useAutoCascade] Sem lote ativo para especie MIX ${pe.especie_id}, pulando.`)
          continue
        }
        if (!especie) continue

        lotes.push(lote)
        especiesData.push({ especie, lote, etapas, percentual: pe.percentual })
      }

      if (lotes.length === 0) return []

      const margemMaiorVal = maiorMargem(lotes)
      const bandejasTotal = calcularBandejasMixVivo(
        item.quantidade,
        margemMaiorVal,
        produto.unidade ?? undefined,
        produto.unidades_por_bandeja ?? undefined
      )

      // Create one plantio per species, proportional trays
      for (const ed of especiesData) {
        const bandejasEspecie = Math.ceil(bandejasTotal * (ed.percentual / 100))
        const sementeNecessaria = calcularSementeNecessaria(bandejasEspecie, ed.lote)
        const rendimentoEsperado = calcularRendimentoEsperado(bandejasEspecie, ed.lote)
        const dataPlantio = calcularDataPlantio(dataColheita, ed.etapas, ed.especie)
        const dataValidade = calcularDataValidade(dataColheita, ed.especie)

        candidates.push({
          especie_id: ed.especie.id,
          lote_semente_id: ed.lote.id,
          pedido_item_id: item.id,
          bandejas: bandejasEspecie,
          semente_necessaria_g: sementeNecessaria,
          rendimento_esperado_g: rendimentoEsperado,
          rendimento_alocado_g: 0,
          data_plantio: dataPlantio,
          data_colheita: dataColheita,
          data_validade: dataValidade,
          etapas: ed.etapas,
          especie: ed.especie,
          fazenda_id: fazendaId
        })
      }
    } else {
      // Cortado MIX: use calcularBandejasMix for per-species tray counts
      const especiesMix: { especie: EspecieRow; lote: LoteRow; percentual: number; etapas: EtapaRow[] }[] = []

      for (const pe of produto.produto_especies) {
        const [lote, etapas, especie] = await Promise.all([
          fetchActiveLote(pe.especie_id),
          fetchEtapas(pe.especie_id),
          fetchEspecie(pe.especie_id)
        ])

        if (!lote) {
          console.warn(`[useAutoCascade] Sem lote ativo para especie MIX cortado ${pe.especie_id}, pulando.`)
          continue
        }
        if (!especie) continue

        especiesMix.push({ especie, lote, percentual: pe.percentual, etapas })
      }

      if (especiesMix.length === 0) return []

      const resultados = calcularBandejasMix(
        item.quantidade,
        produto.peso_gramas ?? 0,
        especiesMix.map((em) => ({
          especie: em.especie,
          lote: em.lote,
          percentual: em.percentual
        }))
      )

      for (let i = 0; i < resultados.length; i++) {
        const res = resultados[i]
        const ed = especiesMix[i]
        if (!res.especie_id || res.bandejas <= 0) continue

        const sementeNecessaria = res.semente_necessaria ?? calcularSementeNecessaria(res.bandejas, ed.lote)
        const rendimentoEsperado = calcularRendimentoEsperado(res.bandejas, ed.lote)
        const dataPlantio = calcularDataPlantio(dataColheita, ed.etapas, ed.especie)
        const dataValidade = calcularDataValidade(dataColheita, ed.especie)

        candidates.push({
          especie_id: res.especie_id,
          lote_semente_id: ed.lote.id,
          pedido_item_id: item.id,
          bandejas: res.bandejas,
          semente_necessaria_g: sementeNecessaria,
          rendimento_esperado_g: rendimentoEsperado,
          rendimento_alocado_g: res.gramas_necessarias ?? 0,
          data_plantio: dataPlantio,
          data_colheita: dataColheita,
          data_validade: dataValidade,
          etapas: ed.etapas,
          especie: ed.especie,
          fazenda_id: fazendaId
        })
      }
    }

    return candidates
  }

  // -------------------------------------------------------------------------
  // Upsert colheita (unique on empresa_id + data_colheita)
  // -------------------------------------------------------------------------

  async function upsertColheita(dataColheita: string): Promise<string | null> {
    // Try to find existing colheita for this date
    const { data: existing } = await supabase
      .from('colheitas')
      .select('id')
      .eq('empresa_id', empresaId())
      .eq('data_colheita', dataColheita)
      .single()

    if (existing) return existing.id as string

    // Create new colheita
    const { data: created, error } = await supabase
      .from('colheitas')
      .insert({
        empresa_id: empresaId(),
        data_colheita: dataColheita,
        status: 'pendente'
      })
      .select('id')
      .single()

    if (error || !created) {
      console.error('[useAutoCascade] Erro ao criar colheita:', error?.message)
      return null
    }

    return created.id as string
  }

  // -------------------------------------------------------------------------
  // Upsert colheita_itens (aggregate per especie per colheita)
  // -------------------------------------------------------------------------

  async function upsertColheitaItens(
    colheitaId: string,
    candidates: PlantioCandidate[]
  ): Promise<void> {
    // Aggregate by especie_id
    const aggregated = new Map<string, {
      bandejas: number
      rendimento_esperado_g: number
      peso_necessario_g: number
    }>()

    for (const c of candidates) {
      const existing = aggregated.get(c.especie_id)
      if (existing) {
        existing.bandejas += c.bandejas
        existing.rendimento_esperado_g += c.rendimento_esperado_g
        existing.peso_necessario_g += c.rendimento_alocado_g
      } else {
        aggregated.set(c.especie_id, {
          bandejas: c.bandejas,
          rendimento_esperado_g: c.rendimento_esperado_g,
          peso_necessario_g: c.rendimento_alocado_g
        })
      }
    }

    for (const [especieId, agg] of aggregated) {
      const excedente = Math.max(0, agg.rendimento_esperado_g - agg.peso_necessario_g)

      // Try to upsert using the unique constraint (colheita_id, especie_id)
      const { data: existing } = await supabase
        .from('colheita_itens')
        .select('id, bandejas, rendimento_esperado_g, peso_necessario_g')
        .eq('colheita_id', colheitaId)
        .eq('especie_id', especieId)
        .single()

      if (existing) {
        // Update: add to existing values
        const newBandejas = (existing.bandejas ?? 0) + agg.bandejas
        const newRendimento = (existing.rendimento_esperado_g ?? 0) + agg.rendimento_esperado_g
        const newPeso = (existing.peso_necessario_g ?? 0) + agg.peso_necessario_g
        const newExcedente = Math.max(0, newRendimento - newPeso)

        await supabase
          .from('colheita_itens')
          .update({
            bandejas: newBandejas,
            rendimento_esperado_g: newRendimento,
            peso_necessario_g: newPeso,
            excedente_g: newExcedente
          })
          .eq('id', existing.id)
      } else {
        await supabase
          .from('colheita_itens')
          .insert({
            colheita_id: colheitaId,
            especie_id: especieId,
            bandejas: agg.bandejas,
            rendimento_esperado_g: agg.rendimento_esperado_g,
            peso_necessario_g: agg.peso_necessario_g,
            excedente_g: excedente
          })
      }
    }
  }

  // -------------------------------------------------------------------------
  // Create tarefas from etapas for a plantio
  // -------------------------------------------------------------------------

  async function criarTarefasFromEtapas(
    plantioId: string,
    candidate: PlantioCandidate
  ): Promise<void> {
    const etapasComDatas = calcularDatasEtapas(
      candidate.data_colheita,
      candidate.etapas,
      candidate.especie
    )

    if (etapasComDatas.length === 0) return

    const tarefaRows = etapasComDatas.map((etapa) => ({
      empresa_id: empresaId(),
      plantio_id: plantioId,
      nome: etapa.nome,
      tipo: 'cultivo' as const,
      bandejas: candidate.bandejas,
      especie_id: candidate.especie_id,
      data_prevista: etapa.data_inicio,
      concluida: false
    }))

    const { error } = await supabase
      .from('tarefas')
      .insert(tarefaRows)

    if (error) {
      console.error(`[useAutoCascade] Erro ao criar tarefas para plantio ${plantioId}:`, error.message)
    }
  }

  // -------------------------------------------------------------------------
  // cancelarCascadePedido
  // -------------------------------------------------------------------------

  async function cancelarCascadePedido(pedidoId: string): Promise<void> {
    // 1. Find all pedido_itens for this pedido
    const { data: itens, error: itensError } = await supabase
      .from('pedido_itens')
      .select('id')
      .eq('pedido_id', pedidoId)

    if (itensError || !itens || itens.length === 0) return

    const itemIds = itens.map((i: { id: string }) => i.id)

    // 2. Find all plantios linked to these pedido_itens
    const { data: plantios, error: plantiosError } = await supabase
      .from('plantios')
      .select('id, colheita_id, especie_id, bandejas, rendimento_esperado_g, rendimento_alocado_g')
      .in('pedido_item_id', itemIds)

    if (plantiosError || !plantios || plantios.length === 0) return

    // Collect affected colheita IDs before deleting
    const affectedColheitaIds = new Set<string>()
    for (const p of plantios) {
      if (p.colheita_id) affectedColheitaIds.add(p.colheita_id as string)
    }

    // 3. Delete plantios (CASCADE will delete tarefas)
    const plantioIds = plantios.map((p: { id: string }) => p.id)
    const { error: deleteError } = await supabase
      .from('plantios')
      .delete()
      .in('id', plantioIds)

    if (deleteError) {
      console.error('[useAutoCascade] Erro ao deletar plantios:', deleteError.message)
      return
    }

    // 4. Recalculate colheita_itens for affected colheitas
    for (const colheitaId of affectedColheitaIds) {
      await recalcularColheitaItens(colheitaId)
    }
  }

  // -------------------------------------------------------------------------
  // Recalculate colheita_itens from remaining plantios
  // -------------------------------------------------------------------------

  async function recalcularColheitaItens(colheitaId: string): Promise<void> {
    // Fetch remaining plantios for this colheita
    const { data: remainingPlantios } = await supabase
      .from('plantios')
      .select('especie_id, bandejas, rendimento_esperado_g, rendimento_alocado_g')
      .eq('colheita_id', colheitaId)

    if (!remainingPlantios || remainingPlantios.length === 0) {
      // No plantios left: delete all colheita_itens and the colheita itself
      await supabase
        .from('colheita_itens')
        .delete()
        .eq('colheita_id', colheitaId)

      await supabase
        .from('colheitas')
        .delete()
        .eq('id', colheitaId)

      return
    }

    // Re-aggregate by especie_id
    const aggregated = new Map<string, {
      bandejas: number
      rendimento_esperado_g: number
      peso_necessario_g: number
    }>()

    for (const p of remainingPlantios) {
      const especieId = p.especie_id as string
      const existing = aggregated.get(especieId)
      if (existing) {
        existing.bandejas += Number(p.bandejas ?? 0)
        existing.rendimento_esperado_g += Number(p.rendimento_esperado_g ?? 0)
        existing.peso_necessario_g += Number(p.rendimento_alocado_g ?? 0)
      } else {
        aggregated.set(especieId, {
          bandejas: Number(p.bandejas ?? 0),
          rendimento_esperado_g: Number(p.rendimento_esperado_g ?? 0),
          peso_necessario_g: Number(p.rendimento_alocado_g ?? 0)
        })
      }
    }

    // Delete existing colheita_itens and re-insert
    await supabase
      .from('colheita_itens')
      .delete()
      .eq('colheita_id', colheitaId)

    const newItens = Array.from(aggregated.entries()).map(([especieId, agg]) => ({
      colheita_id: colheitaId,
      especie_id: especieId,
      bandejas: agg.bandejas,
      rendimento_esperado_g: agg.rendimento_esperado_g,
      peso_necessario_g: agg.peso_necessario_g,
      excedente_g: Math.max(0, agg.rendimento_esperado_g - agg.peso_necessario_g)
    }))

    if (newItens.length > 0) {
      const { error } = await supabase
        .from('colheita_itens')
        .insert(newItens)

      if (error) {
        console.error('[useAutoCascade] Erro ao recalcular colheita_itens:', error.message)
      }
    }
  }

  // -------------------------------------------------------------------------
  // Return
  // -------------------------------------------------------------------------

  return {
    gerarCascadeFromPedido,
    cancelarCascadePedido
  }
}
