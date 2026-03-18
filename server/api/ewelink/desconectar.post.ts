import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  const { conta_ewelink_id, empresa_id } = body

  if (!conta_ewelink_id || !empresa_id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'conta_ewelink_id e empresa_id são obrigatórios'
    })
  }

  const supabaseUrl = config.public.supabase?.url || process.env.SUPABASE_URL
  const supabaseKey = config.supabaseServiceKey || process.env.SUPABASE_SERVICE_KEY || config.public.supabase?.key || process.env.SUPABASE_KEY
  const supabase = createClient(supabaseUrl, supabaseKey)

  // Desativar conta
  const { error: contaError } = await supabase
    .from('contas_ewelink')
    .update({
      status: 'inativo',
      access_token: null,
      refresh_token: null,
      user_apikey: null,
    })
    .eq('id', conta_ewelink_id)
    .eq('empresa_id', empresa_id)

  if (contaError) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro ao desconectar conta: ' + contaError.message
    })
  }

  // Desativar dispositivos da conta
  await supabase
    .from('dispositivos_iot')
    .update({ ativo: false })
    .eq('conta_ewelink_id', conta_ewelink_id)
    .eq('empresa_id', empresa_id)

  return { success: true }
})
