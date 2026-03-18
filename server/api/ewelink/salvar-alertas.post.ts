import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  const { empresa_id, dispositivo_id, alertas } = body

  if (!empresa_id || !dispositivo_id || !alertas || !Array.isArray(alertas)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'empresa_id, dispositivo_id e alertas (array) são obrigatórios'
    })
  }

  const supabaseUrl = config.public.supabase?.url || process.env.SUPABASE_URL
  const supabaseKey = config.supabaseServiceKey || process.env.SUPABASE_SERVICE_KEY || config.public.supabase?.key || process.env.SUPABASE_KEY
  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    const resultados = []

    for (const alerta of alertas) {
      const { tipo, limite_min, limite_max, ativo, cooldown_minutos, notificar_email, email_destino } = alerta

      if (!tipo || !['temperatura', 'umidade'].includes(tipo)) {
        continue
      }

      const { data, error } = await supabase
        .from('alertas_config_iot')
        .upsert({
          empresa_id,
          dispositivo_id,
          tipo,
          limite_min: limite_min ?? null,
          limite_max: limite_max ?? null,
          ativo: ativo !== false,
          cooldown_minutos: cooldown_minutos || 30,
          notificar_email: notificar_email || false,
          email_destino: email_destino || null,
        }, {
          onConflict: 'dispositivo_id,tipo'
        })
        .select()
        .single()

      if (error) {
        console.error(`Erro ao salvar alerta ${tipo}:`, error)
        resultados.push({ tipo, success: false, error: error.message })
      } else {
        resultados.push({ tipo, success: true, id: data.id })
      }
    }

    return { success: true, resultados }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('Erro ao salvar alertas:', error)
    return {
      success: false,
      error: error.message || 'Erro ao salvar alertas'
    }
  }
})
