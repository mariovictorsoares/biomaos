// =============================================
// BIOMA OS - EDGE FUNCTION: RENOVAR CONTRATOS
// Executa diariamente para gerar novos pedidos
// a partir de contratos recorrentes ativos
// =============================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Contrato {
  id: string
  empresa_id: string
  cliente_id: string
  numero: string
  tipo_plano: string
  modalidade: string
  status: string
  data_inicio: string
  data_fim: string | null
  primeira_entrega: string | null
  valor_frete_entrega: number
  forma_pagamento: string | null
  endereco_entrega_id: string | null
  usar_endereco_entrega_cliente: boolean
}

interface ContratoItem {
  id: string
  contrato_id: string
  produto_id: string
  quantidade_por_entrega: number
  valor_unitario: number
  dia_semana: string | null
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

    // Calcular data limite: 4 semanas a frente (28 dias)
    const dataLimite = new Date(hoje)
    dataLimite.setDate(dataLimite.getDate() + 28)
    const dataLimiteStr = dataLimite.toISOString().split('T')[0]

    // Buscar contratos ativos com modalidade recorrente
    const { data: contratosAtivos, error: errContratos } = await supabase
      .from('contratos')
      .select('*')
      .eq('status', 'Ativo')
      .eq('modalidade', 'recorrente')

    if (errContratos) throw errContratos

    let totalPedidosGerados = 0
    const logs: string[] = []

    for (const contrato of contratosAtivos || []) {
      try {
        // Buscar itens do contrato com dia_semana definido
        const { data: itensContrato, error: errItens } = await supabase
          .from('contrato_itens')
          .select('*')
          .eq('contrato_id', contrato.id)
          .not('dia_semana', 'is', null)

        if (errItens) {
          logs.push(`Contrato ${contrato.numero}: erro ao buscar itens - ${errItens.message}`)
          continue
        }

        if (!itensContrato || itensContrato.length === 0) {
          logs.push(`Contrato ${contrato.numero}: sem itens com dia_semana definido`)
          continue
        }

        // Agrupar itens por dia da semana
        const itensPorDia = new Map<string, ContratoItem[]>()
        for (const item of itensContrato) {
          const dia = item.dia_semana
          if (!itensPorDia.has(dia)) {
            itensPorDia.set(dia, [])
          }
          itensPorDia.get(dia)!.push(item)
        }

        // Buscar ultimo pedido gerado para este contrato
        const { data: ultimoPedido } = await supabase
          .from('pedidos')
          .select('data_entrega')
          .eq('contrato_id', contrato.id)
          .order('data_entrega', { ascending: false })
          .limit(1)
          .single()

        // Data inicial para gerar pedidos
        let dataInicial = new Date(hoje)
        if (ultimoPedido?.data_entrega) {
          const ultimaEntrega = new Date(ultimoPedido.data_entrega + 'T00:00:00')
          if (ultimaEntrega > dataInicial) {
            dataInicial = ultimaEntrega
          }
        }

        // Gerar pedidos para as proximas 4 semanas
        const pedidosParaInserir: any[] = []
        const itensPedidosParaInserir: any[] = []

        // Mapear dia da semana para numero (0=Domingo, 1=Segunda, etc)
        const diasSemana: Record<string, number> = {
          'domingo': 0,
          'segunda': 1,
          'terca': 2,
          'quarta': 3,
          'quinta': 4,
          'sexta': 5,
          'sabado': 6
        }

        for (const [diaSemana, itens] of itensPorDia) {
          const diaNumero = diasSemana[diaSemana.toLowerCase()]
          if (diaNumero === undefined) {
            logs.push(`Contrato ${contrato.numero}: dia da semana invalido - ${diaSemana}`)
            continue
          }

          // Encontrar as proximas datas deste dia da semana
          const dataAtual = new Date(dataInicial)

          while (dataAtual <= dataLimite) {
            // Ajustar para o proximo dia da semana correspondente
            const diasAteProximo = (diaNumero - dataAtual.getDay() + 7) % 7
            if (diasAteProximo === 0 && dataAtual <= hoje) {
              dataAtual.setDate(dataAtual.getDate() + 7)
            } else {
              dataAtual.setDate(dataAtual.getDate() + diasAteProximo)
            }

            if (dataAtual > dataLimite) break

            const dataEntregaStr = dataAtual.toISOString().split('T')[0]

            // Verificar se ja existe pedido para esta data
            const { data: pedidoExistente } = await supabase
              .from('pedidos')
              .select('id')
              .eq('contrato_id', contrato.id)
              .eq('data_entrega', dataEntregaStr)
              .maybeSingle()

            if (pedidoExistente) {
              dataAtual.setDate(dataAtual.getDate() + 7)
              continue
            }

            // Calcular valor total do pedido
            let valorTotal = 0
            for (const item of itens) {
              valorTotal += item.quantidade_por_entrega * item.valor_unitario
            }
            valorTotal += contrato.valor_frete_entrega || 0

            // Criar pedido
            const pedidoId = crypto.randomUUID()
            pedidosParaInserir.push({
              id: pedidoId,
              empresa_id: contrato.empresa_id,
              cliente_id: contrato.cliente_id,
              contrato_id: contrato.id,
              data_pedido: hojeStr,
              data_entrega: dataEntregaStr,
              status: 'previsto',
              valor_total: valorTotal,
              observacoes: `Pedido gerado automaticamente do contrato ${contrato.numero}`
            })

            // Criar itens do pedido
            for (const item of itens) {
              itensPedidosParaInserir.push({
                pedido_id: pedidoId,
                produto_id: item.produto_id,
                quantidade: item.quantidade_por_entrega,
                valor_unitario: item.valor_unitario,
                valor_total: item.quantidade_por_entrega * item.valor_unitario
              })
            }

            totalPedidosGerados++
            dataAtual.setDate(dataAtual.getDate() + 7)
          }
        }

        // Inserir pedidos
        if (pedidosParaInserir.length > 0) {
          const { error: errInsertPedidos } = await supabase
            .from('pedidos')
            .insert(pedidosParaInserir)

          if (errInsertPedidos) {
            logs.push(`Contrato ${contrato.numero}: erro ao inserir pedidos - ${errInsertPedidos.message}`)
            continue
          }

          // Inserir itens dos pedidos
          const { error: errInsertItens } = await supabase
            .from('pedido_itens')
            .insert(itensPedidosParaInserir)

          if (errInsertItens) {
            logs.push(`Contrato ${contrato.numero}: erro ao inserir itens - ${errInsertItens.message}`)
            continue
          }

          logs.push(`Contrato ${contrato.numero}: ${pedidosParaInserir.length} pedidos gerados`)
        } else {
          logs.push(`Contrato ${contrato.numero}: nenhum pedido novo necessario`)
        }

      } catch (err: any) {
        logs.push(`Contrato ${contrato.numero}: erro - ${err.message}`)
      }
    }

    const resultado = {
      success: true,
      data: hojeStr,
      contratosProcessados: contratosAtivos?.length || 0,
      totalPedidosGerados,
      logs
    }

    return new Response(
      JSON.stringify(resultado),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
