import { createClient } from '@supabase/supabase-js'

const REGION_URLS: Record<string, string> = {
  us: 'https://us-apia.coolkit.cc',
  eu: 'https://eu-apia.coolkit.cc',
  cn: 'https://cn-apia.coolkit.cn',
  as: 'https://as-apia.coolkit.cc',
}

// UIIDs conhecidos que possuem sensores de temperatura/umidade
const TH_UIIDS = new Set([15, 1770, 18, 181, 182, 190])

function detectaSensores(device: any): { temTemperatura: boolean; temUmidade: boolean } {
  // Detectar por UIID
  if (TH_UIIDS.has(device.extra?.uiid || device.itemData?.extra?.uiid)) {
    return { temTemperatura: true, temUmidade: true }
  }

  // Detectar por presença de params
  const params = device.params || device.itemData?.params || {}
  const temTemperatura = params.currentTemperature !== undefined
    || params.temperature !== undefined
  const temUmidade = params.currentHumidity !== undefined
    || params.humidity !== undefined

  return { temTemperatura, temUmidade }
}

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

  // Buscar conta eWeLink
  const { data: conta, error: contaError } = await supabase
    .from('contas_ewelink')
    .select('*')
    .eq('id', conta_ewelink_id)
    .eq('empresa_id', empresa_id)
    .single()

  if (contaError || !conta) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Conta eWeLink não encontrada'
    })
  }

  if (!conta.access_token) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Conta sem token de acesso. Reconecte a conta.'
    })
  }

  const baseUrl = REGION_URLS[conta.regiao] || REGION_URLS.us
  const appId = config.ewelinkAppId

  try {
    // Buscar lista de dispositivos da eWeLink
    const allDevices: any[] = []
    let beginIndex = 0
    const pageSize = 30

    while (true) {
      const response = await fetch(
        `${baseUrl}/v2/device/thing?num=${pageSize}&beginIndex=${beginIndex}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${conta.access_token}`,
            'X-CK-Appid': appId,
          }
        }
      )

      const data = await response.json()

      if (data.error !== 0) {
        // Se token expirou, marcar conta com erro
        if (data.error === 401 || data.error === 402) {
          await supabase
            .from('contas_ewelink')
            .update({ status: 'erro_auth', erro_mensagem: 'Token expirado. Reconecte a conta.' })
            .eq('id', conta_ewelink_id)
        }
        return {
          success: false,
          error: data.msg || `Erro na API eWeLink (código ${data.error})`
        }
      }

      const thingList = data.data?.thingList || []
      if (thingList.length === 0) break

      allDevices.push(...thingList)
      if (thingList.length < pageSize) break
      beginIndex += pageSize
    }

    // Buscar dispositivos existentes de uma vez
    const { data: existingDevices } = await supabase
      .from('dispositivos_iot')
      .select('id, device_id')
      .eq('empresa_id', empresa_id)
      .eq('conta_ewelink_id', conta_ewelink_id)

    const existingMap = new Map(
      (existingDevices || []).map(d => [d.device_id, d.id])
    )

    let novos = 0
    let atualizados = 0
    const upsertBatch: any[] = []

    for (const thing of allDevices) {
      const device = thing.itemData || thing
      const deviceId = device.deviceid
      if (!deviceId) continue

      const { temTemperatura, temUmidade } = detectaSensores(thing)

      const params = device.params || {}
      const tempAtual = params.currentTemperature ?? params.temperature ?? null
      const umidAtual = params.currentHumidity ?? params.humidity ?? null

      const deviceData: any = {
        empresa_id,
        conta_ewelink_id,
        device_id: deviceId,
        nome: device.name || deviceId,
        modelo: device.productModel || device.extra?.model || null,
        uiid: device.extra?.uiid || null,
        marca: device.brandName || device.extra?.brandId || 'SONOFF',
        online: device.online === true,
        tem_temperatura: temTemperatura,
        tem_umidade: temUmidade,
        temperatura_atual: tempAtual,
        umidade_atual: umidAtual,
        ultima_leitura: (tempAtual !== null || umidAtual !== null) ? new Date().toISOString() : null,
      }

      const existingId = existingMap.get(deviceId)
      if (existingId) {
        deviceData.id = existingId
        atualizados++
      } else {
        novos++
      }
      upsertBatch.push(deviceData)
    }

    // Upsert em batch
    if (upsertBatch.length > 0) {
      const { error: upsertError } = await supabase
        .from('dispositivos_iot')
        .upsert(upsertBatch, { onConflict: 'empresa_id,device_id' })

      if (upsertError) {
        console.error('Erro ao upsert dispositivos:', upsertError)
        return {
          success: false,
          error: 'Erro ao salvar dispositivos: ' + upsertError.message
        }
      }
    }

    // Atualizar ultimo_sync
    await supabase
      .from('contas_ewelink')
      .update({ ultimo_sync: new Date().toISOString() })
      .eq('id', conta_ewelink_id)

    return {
      success: true,
      totalDispositivos: allDevices.length,
      novos,
      atualizados
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('Erro ao sincronizar dispositivos:', error)
    return {
      success: false,
      error: error.message || 'Erro ao sincronizar dispositivos'
    }
  }
})
