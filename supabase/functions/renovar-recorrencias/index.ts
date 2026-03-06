// =============================================
// BIOMA OS - EDGE FUNCTION: RENOVAR RECORRÊNCIAS
// Executa diariamente para gerar:
// 1. Pedidos a partir de pedidos_recorrentes
// 2. Plantios a partir de plantios_recorrentes
// 3. Tarefas a partir de tarefas_recorrentes
// 4. (Legado) Producao recorrente da tabela producao
// =============================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const DIAS_NOME = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado']

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0]
}

function addDays(date: string, days: number): string {
  const d = new Date(date + 'T12:00:00')
  d.setDate(d.getDate() + days)
  return formatDate(d)
}

/**
 * Calcula a proxima data de geracao baseado na frequencia
 */
function calcProximaData(
  ultimaGeracao: string | null,
  dataInicio: string,
  tipoFrequencia: string,
  intervalo: number,
  diaSemana: number | null
): string | null {
  const hoje = new Date()
  hoje.setHours(12, 0, 0, 0)
  const hojeStr = formatDate(hoje)

  const base = ultimaGeracao || dataInicio

  if (tipoFrequencia === 'semanal') {
    // A cada N semanas a partir da base
    const d = new Date(base + 'T12:00:00')
    d.setDate(d.getDate() + (intervalo * 7))
    return formatDate(d)
  }

  if (tipoFrequencia === 'dia_semana' && diaSemana !== null) {
    // Proximo dia da semana especifico apos a ultima geracao
    const d = new Date(base + 'T12:00:00')
    d.setDate(d.getDate() + 1) // avancar pelo menos 1 dia
    while (d.getDay() !== diaSemana) {
      d.setDate(d.getDate() + 1)
    }
    // Se intervalo > 1, pular N-1 semanas adicionais
    if (intervalo > 1) {
      d.setDate(d.getDate() + (intervalo - 1) * 7)
    }
    return formatDate(d)
  }

  if (tipoFrequencia === 'dia_util_mes') {
    // N-esimo dia util do proximo mes
    const d = new Date(base + 'T12:00:00')
    d.setMonth(d.getMonth() + 1)
    d.setDate(1)
    let diasUteis = 0
    while (diasUteis < intervalo) {
      const dow = d.getDay()
      if (dow !== 0 && dow !== 6) diasUteis++
      if (diasUteis < intervalo) d.setDate(d.getDate() + 1)
    }
    return formatDate(d)
  }

  return null
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const hoje = new Date()
    hoje.setHours(12, 0, 0, 0)
    const hojeStr = formatDate(hoje)

    const logs: string[] = []
    let totalGerados = 0

    // =============================================
    // 1. PEDIDOS RECORRENTES
    // =============================================
    const { data: pedidosRec } = await supabase
      .from('pedidos_recorrentes')
      .select('*, pedido_recorrente_itens(*, produtos(id, nome))')
      .eq('ativo', true)

    for (const pr of pedidosRec || []) {
      // Verificar data_fim
      if (!pr.recorrencia_infinita && pr.data_fim && pr.data_fim < hojeStr) {
        continue
      }

      const proximaData = calcProximaData(
        pr.ultima_geracao, pr.data_inicio, pr.tipo_frequencia, pr.intervalo || 1, pr.dia_semana
      )

      if (!proximaData || proximaData > hojeStr) {
        if (!pr.criar_atrasados) continue
        // Se criar_atrasados e proximaData <= hoje, prosseguir
        if (proximaData && proximaData > hojeStr) continue
      }

      // Gerar pedido
      const { data: novoPedido, error: errPedido } = await supabase
        .from('pedidos')
        .insert({
          empresa_id: pr.empresa_id,
          cliente_id: pr.cliente_id,
          data_pedido: hojeStr,
          data_entrega: proximaData || hojeStr,
          status: 'previsto',
          pedido_recorrente_id: pr.id,
          usar_excedentes: false,
          observacoes: `Gerado automaticamente de recorrencia: ${pr.nome || pr.id}`
        })
        .select()
        .single()

      if (errPedido || !novoPedido) {
        logs.push(`Pedido rec. ${pr.id}: erro - ${errPedido?.message}`)
        continue
      }

      // Copiar itens
      const itens = (pr.pedido_recorrente_itens || []).map((item: any) => ({
        pedido_id: novoPedido.id,
        produto_id: item.produto_id,
        quantidade: item.quantidade,
        valor_unitario: item.preco_unitario || 0,
        valor_total: (item.quantidade || 0) * (item.preco_unitario || 0)
      }))

      if (itens.length > 0) {
        await supabase.from('pedido_itens').insert(itens)
      }

      // Atualizar ultima_geracao
      await supabase
        .from('pedidos_recorrentes')
        .update({ ultima_geracao: hojeStr })
        .eq('id', pr.id)

      totalGerados++
      logs.push(`Pedido rec. ${pr.nome || pr.id}: pedido ${novoPedido.id} gerado para ${proximaData}`)

      // NOTA: O auto-cascade (plantios/tarefas/colheitas) sera disparado pelo frontend
      // quando o pedido for visualizado/confirmado, ou pode ser feito aqui futuramente
    }

    // =============================================
    // 2. PLANTIOS RECORRENTES
    // =============================================
    const { data: plantiosRec } = await supabase
      .from('plantios_recorrentes')
      .select('*, especies(id, tempo_germinacao, tempo_luz, vida_util_dias)')
      .eq('ativo', true)

    for (const plr of plantiosRec || []) {
      if (!plr.recorrencia_infinita && plr.data_fim && plr.data_fim < hojeStr) {
        continue
      }

      const proximaData = calcProximaData(
        plr.ultima_geracao, plr.data_inicio, plr.tipo_frequencia, plr.intervalo || 1, plr.dia_semana
      )

      if (!proximaData || proximaData > hojeStr) {
        if (!plr.criar_atrasados) continue
        if (proximaData && proximaData > hojeStr) continue
      }

      const dataColheita = proximaData || hojeStr

      // Buscar etapas da especie
      const { data: etapas } = await supabase
        .from('etapas_cultivo')
        .select('nome, ordem, duracao_dias')
        .eq('especie_id', plr.especie_id)
        .order('ordem')

      // Calcular tempo total
      let tempoTotal = 0
      if (etapas && etapas.length > 0) {
        tempoTotal = etapas.reduce((t: number, e: any) => t + e.duracao_dias, 0)
      } else if (plr.especies) {
        tempoTotal = (plr.especies.tempo_germinacao || 0) + (plr.especies.tempo_luz || 0)
      }

      const dataPlantio = addDays(dataColheita, -tempoTotal)
      const dataValidade = plr.especies?.vida_util_dias
        ? addDays(dataColheita, plr.especies.vida_util_dias)
        : null

      // Buscar dados do lote para semente/rendimento
      let sementeNecessaria = null
      let rendimentoEsperado = null
      if (plr.lote_semente_id) {
        const { data: lote } = await supabase
          .from('lotes_sementes')
          .select('densidade_semeadura, rendimento_por_bandeja')
          .eq('id', plr.lote_semente_id)
          .single()

        if (lote) {
          sementeNecessaria = lote.densidade_semeadura ? plr.bandejas * lote.densidade_semeadura : null
          rendimentoEsperado = lote.rendimento_por_bandeja ? plr.bandejas * lote.rendimento_por_bandeja : null
        }
      }

      // Upsert colheita
      let colheitaId = null
      const { data: colheitaExistente } = await supabase
        .from('colheitas')
        .select('id')
        .eq('empresa_id', plr.empresa_id)
        .eq('data_colheita', dataColheita)
        .maybeSingle()

      if (colheitaExistente) {
        colheitaId = colheitaExistente.id
      } else {
        const { data: novaColheita } = await supabase
          .from('colheitas')
          .insert({ empresa_id: plr.empresa_id, data_colheita: dataColheita, status: 'pendente' })
          .select()
          .single()
        colheitaId = novaColheita?.id
      }

      // Inserir plantio
      const { data: novoPlantio, error: errPlantio } = await supabase
        .from('plantios')
        .insert({
          empresa_id: plr.empresa_id,
          especie_id: plr.especie_id,
          lote_semente_id: plr.lote_semente_id,
          plantio_recorrente_id: plr.id,
          colheita_id: colheitaId,
          fazenda_id: plr.fazenda_id,
          bandejas: plr.bandejas,
          semente_necessaria_g: sementeNecessaria,
          rendimento_esperado_g: rendimentoEsperado,
          status: 'planejado',
          data_plantio: dataPlantio,
          data_colheita: dataColheita,
          data_validade: dataValidade
        })
        .select()
        .single()

      if (errPlantio || !novoPlantio) {
        logs.push(`Plantio rec. ${plr.nome}: erro - ${errPlantio?.message}`)
        continue
      }

      // Criar tarefas a partir das etapas
      if (etapas && etapas.length > 0) {
        const tarefas: any[] = []
        let dataFimEtapa = new Date(dataColheita + 'T12:00:00')

        for (let i = etapas.length - 1; i >= 0; i--) {
          const etapa = etapas[i]
          const inicio = new Date(dataFimEtapa)
          inicio.setDate(inicio.getDate() - etapa.duracao_dias)

          tarefas.push({
            empresa_id: plr.empresa_id,
            plantio_id: novoPlantio.id,
            nome: etapa.nome,
            tipo: 'cultivo',
            bandejas: plr.bandejas,
            especie_id: plr.especie_id,
            data_prevista: formatDate(inicio),
            concluida: false
          })

          dataFimEtapa = inicio
        }

        if (tarefas.length > 0) {
          await supabase.from('tarefas').insert(tarefas)
        }
      }

      // Atualizar ultima_geracao
      await supabase
        .from('plantios_recorrentes')
        .update({ ultima_geracao: hojeStr })
        .eq('id', plr.id)

      totalGerados++
      logs.push(`Plantio rec. ${plr.nome}: plantio ${novoPlantio.id} gerado para colheita ${dataColheita}`)
    }

    // =============================================
    // 3. TAREFAS RECORRENTES
    // =============================================
    const { data: tarefasRec } = await supabase
      .from('tarefas_recorrentes')
      .select('*')
      .eq('ativo', true)

    for (const tr of tarefasRec || []) {
      if (!tr.recorrencia_infinita && tr.data_fim && tr.data_fim < hojeStr) {
        continue
      }

      const proximaData = calcProximaData(
        tr.ultima_geracao, tr.data_inicio, tr.tipo_frequencia, tr.intervalo || 1, tr.dia_semana
      )

      if (!proximaData || proximaData > hojeStr) {
        if (!tr.criar_atrasados) continue
        if (proximaData && proximaData > hojeStr) continue
      }

      const { error: errTarefa } = await supabase
        .from('tarefas')
        .insert({
          empresa_id: tr.empresa_id,
          tarefa_recorrente_id: tr.id,
          nome: tr.nome,
          descricao: tr.descricao,
          tipo: 'recorrente',
          data_prevista: proximaData || hojeStr,
          concluida: false
        })

      if (errTarefa) {
        logs.push(`Tarefa rec. ${tr.nome}: erro - ${errTarefa.message}`)
        continue
      }

      await supabase
        .from('tarefas_recorrentes')
        .update({ ultima_geracao: hojeStr })
        .eq('id', tr.id)

      totalGerados++
      logs.push(`Tarefa rec. ${tr.nome}: tarefa gerada para ${proximaData}`)
    }

    // =============================================
    // 4. LEGADO: Producao recorrente (tabela producao)
    // =============================================
    const dataLimite = new Date(hoje)
    dataLimite.setDate(dataLimite.getDate() + 77)
    const dataLimiteStr = formatDate(dataLimite)

    const { data: recorrenciasAtivas } = await supabase
      .from('producao')
      .select('recorrencia_id, empresa_id')
      .eq('recorrente', true)
      .not('recorrencia_id', 'is', null)
      .not('status', 'eq', 'cancelado')
      .gte('data_colheita_prevista', hojeStr)

    const recorrenciasUnicas = new Map<string, string>()
    for (const r of recorrenciasAtivas || []) {
      if (r.recorrencia_id && !recorrenciasUnicas.has(r.recorrencia_id)) {
        recorrenciasUnicas.set(r.recorrencia_id, r.empresa_id)
      }
    }

    for (const [recorrenciaId, empresaId] of recorrenciasUnicas) {
      const { data: ultimoPlano } = await supabase
        .from('producao')
        .select('*')
        .eq('recorrencia_id', recorrenciaId)
        .eq('empresa_id', empresaId)
        .order('data_colheita_prevista', { ascending: false })
        .limit(1)
        .single()

      if (!ultimoPlano || ultimoPlano.data_colheita_prevista >= dataLimiteStr) continue

      const { data: especie } = await supabase
        .from('especies')
        .select('tempo_germinacao, tempo_luz')
        .eq('id', ultimoPlano.especie_id)
        .single()

      const tempoGerminacao = especie?.tempo_germinacao || 7
      const tempoLuz = especie?.tempo_luz || 7

      const { data: ultimoCodigo } = await supabase
        .from('producao')
        .select('codigo')
        .eq('empresa_id', empresaId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      let nextCode = 1
      if (ultimoCodigo?.codigo) {
        const match = String(ultimoCodigo.codigo).match(/\d+/)
        if (match) nextCode = parseInt(match[0]) + 1
      }

      const tresMesesFrente = new Date(hoje)
      tresMesesFrente.setDate(tresMesesFrente.getDate() + 91)
      const tresMesesStr = formatDate(tresMesesFrente)

      const planosParaInserir = []
      let dataColheitaAtual = new Date(ultimoPlano.data_colheita_prevista + 'T00:00:00')

      while (true) {
        dataColheitaAtual.setDate(dataColheitaAtual.getDate() + 7)
        const dataColheita = formatDate(dataColheitaAtual)
        if (dataColheita > tresMesesStr) break

        const dataLuz = addDays(dataColheita, -tempoLuz)
        const dataPlantio = addDays(dataLuz, -tempoGerminacao)

        planosParaInserir.push({
          empresa_id: empresaId,
          codigo: String(nextCode).padStart(4, '0'),
          fazenda_id: ultimoPlano.fazenda_id,
          especie_id: ultimoPlano.especie_id,
          lote_id: ultimoPlano.lote_id || null,
          quantidade_bandeja: ultimoPlano.quantidade_bandeja,
          data_semeadura: dataPlantio,
          data_plantio_previsto: dataPlantio,
          data_luz_prevista: dataLuz,
          data_colheita_prevista: dataColheita,
          status: 'planejado',
          recorrente: true,
          recorrencia_id: recorrenciaId
        })
        nextCode++
      }

      if (planosParaInserir.length > 0) {
        const { error: errInsert } = await supabase.from('producao').insert(planosParaInserir)
        if (errInsert) {
          logs.push(`Legado ${recorrenciaId}: erro - ${errInsert.message}`)
        } else {
          totalGerados += planosParaInserir.length
          logs.push(`Legado ${recorrenciaId}: ${planosParaInserir.length} planos gerados`)
        }
      }
    }

    // =============================================
    // RESULTADO
    // =============================================
    return new Response(
      JSON.stringify({
        success: true,
        data: hojeStr,
        totalGerados,
        logs
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
