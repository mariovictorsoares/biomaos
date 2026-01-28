import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  const supabaseUrl = config.public.supabase.url || process.env.SUPABASE_URL
  const supabaseKey = config.supabaseServiceKey || process.env.SUPABASE_SERVICE_KEY || config.public.supabase.key || process.env.SUPABASE_KEY

  const supabase = createClient(supabaseUrl, supabaseKey)

  const { conviteId } = body

  if (!conviteId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID do convite e obrigatorio'
    })
  }

  const { error } = await supabase
    .from('convites_usuario')
    .update({ status: 'cancelled' })
    .eq('id', conviteId)

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro ao cancelar convite: ' + error.message
    })
  }

  return { success: true }
})
