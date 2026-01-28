import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  const { contratoId } = body

  if (!contratoId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'contratoId é obrigatório'
    })
  }

  // Criar cliente Supabase com service role para bypass RLS
  const supabaseUrl = config.public.supabase.url || process.env.SUPABASE_URL
  const supabaseKey = config.supabaseServiceKey || process.env.SUPABASE_SERVICE_KEY || config.public.supabase.key || process.env.SUPABASE_KEY

  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // Verificar se contrato existe
    const { data: contrato, error: fetchError } = await supabase
      .from('contratos')
      .select('id, aceito_em')
      .eq('id', contratoId)
      .single()

    if (fetchError || !contrato) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Contrato não encontrado'
      })
    }

    // Se já foi aceito, retornar sucesso
    if (contrato.aceito_em) {
      return {
        success: true,
        aceito_em: contrato.aceito_em,
        message: 'Contrato já foi aceito anteriormente'
      }
    }

    // Atualizar contrato
    const aceito_em = new Date().toISOString()
    const { error: updateError } = await supabase
      .from('contratos')
      .update({ aceito_em })
      .eq('id', contratoId)

    if (updateError) {
      console.error('Erro ao atualizar contrato:', updateError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao aceitar contrato'
      })
    }

    return {
      success: true,
      aceito_em,
      message: 'Contrato aceito com sucesso'
    }
  } catch (error: any) {
    console.error('Erro ao processar aceite do contrato:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Erro ao processar aceite do contrato'
    })
  }
})
