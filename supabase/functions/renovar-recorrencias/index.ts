// =============================================
// BIOMA OS - EDGE FUNCTION: RENOVAR RECORRÊNCIAS
// Executa diariamente para gerar novos planos
// de produções recorrentes (mantém 6 semanas à frente)
// =============================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Producao {
  id: string
  empresa_id: string
  codigo: string
  fazenda_id: string
  especie_id: string
  lote_id?: string
  quantidade_bandeja: number
  data_colheita_prevista: string
  recorrencia_id: string
  recorrente: boolean
}

interface Especie {
  id: string
  tempo_germinacao?: number
  tempo_luz?: number
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const hoje = new Date()
    const hojeStr = hoje.toISOString().split('T')[0]

    // Calcular data limite: 4 semanas à frente (28 dias)
    const dataLimite = new Date(hoje)
    dataLimite.setDate(dataLimite.getDate() + 28)
    const dataLimiteStr = dataLimite.toISOString().split('T')[0]

    // Buscar todas as recorrência_ids únicas que ainda estão ativas
    // (planos recorrentes que não foram cancelados)
    const { data: recorrenciasAtivas, error: errRecorrencias } = await supabase
      .from('producao')
      .select('recorrencia_id, empresa_id')
      .eq('recorrente', true)
      .not('recorrencia_id', 'is', null)
      .not('status', 'eq', 'cancelado')
      .gte('data_colheita_prevista', hojeStr)

    if (errRecorrencias) throw errRecorrencias

    // Agrupar por recorrencia_id único
    const recorrenciasUnicas = new Map<string, string>()
    for (const r of recorrenciasAtivas || []) {
      if (r.recorrencia_id && !recorrenciasUnicas.has(r.recorrencia_id)) {
        recorrenciasUnicas.set(r.recorrencia_id, r.empresa_id)
      }
    }

    let totalPlanosGerados = 0
    const logs: string[] = []

    for (const [recorrenciaId, empresaId] of recorrenciasUnicas) {
      // Buscar o último plano desta recorrência
      const { data: ultimoPlano, error: errUltimo } = await supabase
        .from('producao')
        .select('*')
        .eq('recorrencia_id', recorrenciaId)
        .eq('empresa_id', empresaId)
        .order('data_colheita_prevista', { ascending: false })
        .limit(1)
        .single()

      if (errUltimo || !ultimoPlano) {
        logs.push(`Recorrência ${recorrenciaId}: erro ao buscar último plano`)
        continue
      }

      // Verificar se o último plano está dentro do limite de 4 semanas
      if (ultimoPlano.data_colheita_prevista >= dataLimiteStr) {
        logs.push(`Recorrência ${recorrenciaId}: já tem planos suficientes (até ${ultimoPlano.data_colheita_prevista})`)
        continue
      }

      // Buscar tempos da espécie
      const { data: especie } = await supabase
        .from('especies')
        .select('tempo_germinacao, tempo_luz')
        .eq('id', ultimoPlano.especie_id)
        .single()

      const tempoGerminacao = especie?.tempo_germinacao || 7
      const tempoLuz = especie?.tempo_luz || 7

      // Buscar último código usado na empresa
      const { data: ultimoCodigo } = await supabase
        .from('producao')
        .select('codigo')
        .eq('empresa_id', empresaId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      let nextCode = 1
      if (ultimoCodigo?.codigo) {
        const match = ultimoCodigo.codigo.match(/\d+/)
        if (match) nextCode = parseInt(match[0]) + 1
      }

      // Calcular quantos planos precisam ser gerados (até ter 6 semanas à frente)
      const seisSemanasFrente = new Date(hoje)
      seisSemanasFrente.setDate(seisSemanasFrente.getDate() + 42) // 6 semanas
      const seisSemanasStr = seisSemanasFrente.toISOString().split('T')[0]

      const planosParaInserir = []
      let dataColheitaAtual = new Date(ultimoPlano.data_colheita_prevista + 'T00:00:00')

      while (true) {
        // Próxima colheita é +7 dias
        dataColheitaAtual.setDate(dataColheitaAtual.getDate() + 7)
        const dataColheita = dataColheitaAtual.toISOString().split('T')[0]

        // Se já passou das 6 semanas, para
        if (dataColheita > seisSemanasStr) break

        // Calcular datas de luz e plantio
        const dataLuzBase = new Date(dataColheita + 'T00:00:00')
        dataLuzBase.setDate(dataLuzBase.getDate() - tempoLuz)
        const dataLuz = dataLuzBase.toISOString().split('T')[0]

        const dataPlantioBase = new Date(dataLuz + 'T00:00:00')
        dataPlantioBase.setDate(dataPlantioBase.getDate() - tempoGerminacao)
        const dataPlantio = dataPlantioBase.toISOString().split('T')[0]

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
        const { error: errInsert } = await supabase
          .from('producao')
          .insert(planosParaInserir)

        if (errInsert) {
          logs.push(`Recorrência ${recorrenciaId}: erro ao inserir - ${errInsert.message}`)
        } else {
          totalPlanosGerados += planosParaInserir.length
          logs.push(`Recorrência ${recorrenciaId}: ${planosParaInserir.length} planos gerados`)
        }
      }
    }

    const resultado = {
      success: true,
      data: hojeStr,
      recorrenciasProcessadas: recorrenciasUnicas.size,
      totalPlanosGerados,
      logs
    }

    return new Response(
      JSON.stringify(resultado),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
