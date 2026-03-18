// =============================================
// BIOMA OS - EDGE FUNCTION: RENOVAR RECORRÊNCIAS
// Executa diariamente para gerar:
// 1. Plantios a partir de plantios_recorrentes
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
    // PLANTIOS RECORRENTES
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
