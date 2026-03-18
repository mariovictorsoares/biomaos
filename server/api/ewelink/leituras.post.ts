import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  const { empresa_id, dispositivo_id, periodo, fazenda_id } = body

  if (!empresa_id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'empresa_id é obrigatório'
    })
  }

  const supabaseUrl = config.public.supabase?.url || process.env.SUPABASE_URL
  const supabaseKey = config.supabaseServiceKey || process.env.SUPABASE_SERVICE_KEY || config.public.supabase?.key || process.env.SUPABASE_KEY
  const supabase = createClient(supabaseUrl, supabaseKey)

  // Calcular data de inicio baseado no periodo
  const agora = new Date()
  let dataInicio: Date

  switch (periodo) {
    case '7d':
      dataInicio = new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case '30d':
      dataInicio = new Date(agora.getTime() - 30 * 24 * 60 * 60 * 1000)
      break
    case '24h':
    default:
      dataInicio = new Date(agora.getTime() - 24 * 60 * 60 * 1000)
      break
  }

  // Se fazenda_id informado, buscar dispositivos dessa fazenda
  let dispositivosFazenda: string[] | null = null
  if (fazenda_id) {
    const { data: devsFazenda } = await supabase
      .from('dispositivos_iot')
      .select('id')
      .eq('fazenda_id', fazenda_id)
    if (devsFazenda && devsFazenda.length > 0) {
      dispositivosFazenda = devsFazenda.map((d: any) => d.id)
    } else {
      return { success: true, leituras: [] }
    }
  }

  try {
    // Se periodo = 30d, usar RPC de agregacao por hora
    if (periodo === '30d') {
      const { data: leituras, error } = await supabase
        .rpc('leituras_agregadas_por_hora', {
          p_empresa_id: empresa_id,
          p_dispositivo_id: dispositivo_id || null,
          p_data_inicio: dataInicio.toISOString(),
        })

      // Fallback se a RPC nao existe ainda
      if (error) {
        let query = supabase
          .from('leituras_sensores')
          .select('temperatura, umidade, registrado_em, dispositivo_id')
          .eq('empresa_id', empresa_id)
          .gte('registrado_em', dataInicio.toISOString())
          .order('registrado_em', { ascending: true })
          .limit(5000)

        if (dispositivo_id) {
          query = query.eq('dispositivo_id', dispositivo_id)
        } else if (dispositivosFazenda) {
          query = query.in('dispositivo_id', dispositivosFazenda)
        }

        const { data: fallbackData, error: fallbackError } = await query

        if (fallbackError) {
          throw createError({
            statusCode: 500,
            statusMessage: 'Erro ao buscar leituras: ' + fallbackError.message
          })
        }

        return { success: true, leituras: fallbackData || [] }
      }

      return { success: true, leituras: leituras || [] }
    }

    // Periodos curtos: retornar leituras individuais
    let query = supabase
      .from('leituras_sensores')
      .select('temperatura, umidade, registrado_em, dispositivo_id')
      .eq('empresa_id', empresa_id)
      .gte('registrado_em', dataInicio.toISOString())
      .order('registrado_em', { ascending: true })
      .limit(5000)

    if (dispositivo_id) {
      query = query.eq('dispositivo_id', dispositivo_id)
    } else if (dispositivosFazenda) {
      query = query.in('dispositivo_id', dispositivosFazenda)
    }

    const { data: leituras, error } = await query

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao buscar leituras: ' + error.message
      })
    }

    return { success: true, leituras: leituras || [] }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('Erro ao buscar leituras:', error)
    return {
      success: false,
      error: error.message || 'Erro ao buscar leituras'
    }
  }
})
