// =============================================
// BIOMA OS - EDGE FUNCTION: COLETAR LEITURAS IoT
// Executa a cada 5 minutos via pg_cron para:
// 1. Buscar dados de temperatura/umidade dos dispositivos eWeLink
// 2. Armazenar leituras na tabela leituras_sensores
// 3. Verificar limiares de alerta e registrar violações
// =============================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Endpoints regionais CoolKit v2
const REGION_URLS: Record<string, string> = {
  us: 'https://us-apia.coolkit.cc',
  eu: 'https://eu-apia.coolkit.cc',
  cn: 'https://cn-apia.coolkit.cn',
  as: 'https://as-apia.coolkit.cc',
}

/**
 * Gera HMAC-SHA256 assinatura em base64 (obrigatório para endpoints de auth CoolKit v2)
 */
async function createHmacSign(body: string, secret: string): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(body))
  return btoa(String.fromCharCode(...new Uint8Array(signature)))
}

/**
 * Tenta renovar o access_token usando o refresh_token
 */
async function refreshToken(
  baseUrl: string,
  rt: string,
  appId: string,
  appSecret: string
): Promise<{ accessToken: string; refreshToken: string; expiresAt: string } | null> {
  try {
    const body = { rt }
    const bodyStr = JSON.stringify(body)
    const signature = await createHmacSign(bodyStr, appSecret)

    const response = await fetch(`${baseUrl}/v2/user/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CK-Appid': appId,
        'Authorization': `Sign ${signature}`,
      },
      body: bodyStr,
    })

    const data = await response.json()
    if (data.error !== 0 || !data.data) return null

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 29)

    return {
      accessToken: data.data.at,
      refreshToken: data.data.rt,
      expiresAt: expiresAt.toISOString(),
    }
  } catch {
    return null
  }
}

/**
 * Busca lista de dispositivos com estado atual da eWeLink
 */
async function fetchDevices(
  baseUrl: string,
  accessToken: string,
  appId: string
): Promise<any[]> {
  const devices: any[] = []
  let beginIndex = 0

  while (true) {
    const response = await fetch(
      `${baseUrl}/v2/device/thing?num=30&beginIndex=${beginIndex}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-CK-Appid': appId,
        },
      }
    )

    const data = await response.json()
    if (data.error !== 0) break

    const thingList = data.data?.thingList || []
    if (thingList.length === 0) break

    devices.push(...thingList)
    if (thingList.length < 30) break
    beginIndex += 30
  }

  return devices
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const appId = Deno.env.get('EWELINK_APP_ID') || ''
    const appSecret = Deno.env.get('EWELINK_APP_SECRET') || ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const logs: string[] = []
    let totalLeituras = 0
    let totalAlertas = 0

    // 1. Buscar todas as contas ativas
    const { data: contas } = await supabase
      .from('contas_ewelink')
      .select('*')
      .eq('status', 'ativo')

    if (!contas || contas.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'Nenhuma conta ativa', totalLeituras: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    for (const conta of contas) {
      const baseUrl = REGION_URLS[conta.regiao] || REGION_URLS.us
      let accessToken = conta.access_token

      // 2. Verificar expiração do token
      if (conta.token_expira_em && new Date(conta.token_expira_em) <= new Date()) {
        logs.push(`Conta ${conta.email || conta.id}: token expirado, tentando refresh...`)

        if (!appSecret) {
          logs.push(`Conta ${conta.email || conta.id}: EWELINK_APP_SECRET não configurado, não é possível renovar token`)
          await supabase
            .from('contas_ewelink')
            .update({ status: 'erro_auth', erro_mensagem: 'APP_SECRET não configurado para refresh.' })
            .eq('id', conta.id)
          continue
        }

        const newTokens = await refreshToken(baseUrl, conta.refresh_token, appId, appSecret)

        if (!newTokens) {
          await supabase
            .from('contas_ewelink')
            .update({ status: 'erro_auth', erro_mensagem: 'Falha ao renovar token. Reconecte a conta.' })
            .eq('id', conta.id)
          logs.push(`Conta ${conta.email || conta.id}: falha no refresh, marcada como erro_auth`)
          continue
        }

        await supabase
          .from('contas_ewelink')
          .update({
            access_token: newTokens.accessToken,
            refresh_token: newTokens.refreshToken,
            token_expira_em: newTokens.expiresAt,
          })
          .eq('id', conta.id)

        accessToken = newTokens.accessToken
        logs.push(`Conta ${conta.email || conta.id}: token renovado com sucesso`)
      }

      // 3. Buscar dispositivos ativos com sensores
      const { data: dispositivos } = await supabase
        .from('dispositivos_iot')
        .select('id, device_id, tem_temperatura, tem_umidade')
        .eq('conta_ewelink_id', conta.id)
        .eq('ativo', true)
        .or('tem_temperatura.eq.true,tem_umidade.eq.true')

      if (!dispositivos || dispositivos.length === 0) {
        logs.push(`Conta ${conta.email || conta.id}: nenhum dispositivo sensor ativo`)
        continue
      }

      // Criar mapa de device_id -> dispositivo local
      const deviceMap = new Map(dispositivos.map(d => [d.device_id, d]))

      // 4. Buscar estado atual dos dispositivos na eWeLink
      const ewelinkDevices = await fetchDevices(baseUrl, accessToken, appId)

      if (ewelinkDevices.length === 0) {
        logs.push(`Conta ${conta.email || conta.id}: nenhum dispositivo retornado pela API`)
        continue
      }

      // 5. Processar leituras
      const leiturasParaInserir: any[] = []
      const dispositivosParaAtualizar: any[] = []

      for (const thing of ewelinkDevices) {
        const device = thing.itemData || thing
        const deviceId = device.deviceid
        const localDevice = deviceMap.get(deviceId)
        if (!localDevice) continue

        const params = device.params || {}
        const temperatura = params.currentTemperature ?? params.temperature ?? null
        const umidade = params.currentHumidity ?? params.humidity ?? null

        if (temperatura === null && umidade === null) continue

        leiturasParaInserir.push({
          empresa_id: conta.empresa_id,
          dispositivo_id: localDevice.id,
          temperatura: temperatura !== null ? parseFloat(String(temperatura)) : null,
          umidade: umidade !== null ? parseFloat(String(umidade)) : null,
          registrado_em: new Date().toISOString(),
          fonte: 'api',
        })

        dispositivosParaAtualizar.push({
          id: localDevice.id,
          online: device.online === true,
          temperatura_atual: temperatura !== null ? parseFloat(String(temperatura)) : null,
          umidade_atual: umidade !== null ? parseFloat(String(umidade)) : null,
          ultima_leitura: new Date().toISOString(),
        })
      }

      // 6. Inserir leituras em batch
      if (leiturasParaInserir.length > 0) {
        const { error: insertError } = await supabase
          .from('leituras_sensores')
          .insert(leiturasParaInserir)

        if (insertError) {
          logs.push(`Conta ${conta.email || conta.id}: erro ao inserir leituras - ${insertError.message}`)
        } else {
          totalLeituras += leiturasParaInserir.length
          logs.push(`Conta ${conta.email || conta.id}: ${leiturasParaInserir.length} leituras inseridas`)
        }
      }

      // 7. Atualizar cache nos dispositivos (batch via Promise.all)
      if (dispositivosParaAtualizar.length > 0) {
        await Promise.all(
          dispositivosParaAtualizar.map(update =>
            supabase
              .from('dispositivos_iot')
              .update({
                online: update.online,
                temperatura_atual: update.temperatura_atual,
                umidade_atual: update.umidade_atual,
                ultima_leitura: update.ultima_leitura,
              })
              .eq('id', update.id)
          )
        )
      }

      // 8. Verificar alertas
      const { data: alertasConfig } = await supabase
        .from('alertas_config_iot')
        .select('*')
        .eq('empresa_id', conta.empresa_id)
        .eq('ativo', true)

      if (alertasConfig && alertasConfig.length > 0) {
        // Buscar alertas recentes de uma vez para checar cooldowns
        const configIds = alertasConfig.map(ac => ac.id)
        const maiorCooldown = Math.max(...alertasConfig.map(ac => ac.cooldown_minutos || 30))
        const cooldownGlobal = new Date()
        cooldownGlobal.setMinutes(cooldownGlobal.getMinutes() - maiorCooldown)

        const { data: alertasRecentes } = await supabase
          .from('alertas_historico_iot')
          .select('alerta_config_id, registrado_em')
          .in('alerta_config_id', configIds)
          .gte('registrado_em', cooldownGlobal.toISOString())

        // Mapa: config_id -> timestamp do alerta mais recente
        const ultimoAlertaPorConfig = new Map<string, Date>()
        if (alertasRecentes) {
          for (const ar of alertasRecentes) {
            const ts = new Date(ar.registrado_em)
            const existing = ultimoAlertaPorConfig.get(ar.alerta_config_id)
            if (!existing || ts > existing) {
              ultimoAlertaPorConfig.set(ar.alerta_config_id, ts)
            }
          }
        }

        const alertasParaInserir: any[] = []

        for (const leitura of leiturasParaInserir) {
          const configsDispositivo = alertasConfig.filter(
            ac => ac.dispositivo_id === leitura.dispositivo_id
          )

          for (const cfg of configsDispositivo) {
            const valor = cfg.tipo === 'temperatura' ? leitura.temperatura : leitura.umidade
            if (valor === null) continue

            let limiteViolado: string | null = null
            let limiteValor: number | null = null

            if (cfg.limite_min !== null && valor < cfg.limite_min) {
              limiteViolado = 'min'
              limiteValor = cfg.limite_min
            } else if (cfg.limite_max !== null && valor > cfg.limite_max) {
              limiteViolado = 'max'
              limiteValor = cfg.limite_max
            }

            if (!limiteViolado) continue

            // Verificar cooldown usando mapa em memória
            const cooldownMinutos = cfg.cooldown_minutos || 30
            const cooldownLimite = new Date()
            cooldownLimite.setMinutes(cooldownLimite.getMinutes() - cooldownMinutos)

            const ultimoAlerta = ultimoAlertaPorConfig.get(cfg.id)
            if (ultimoAlerta && ultimoAlerta >= cooldownLimite) continue

            alertasParaInserir.push({
              empresa_id: conta.empresa_id,
              dispositivo_id: leitura.dispositivo_id,
              alerta_config_id: cfg.id,
              tipo: cfg.tipo,
              valor_lido: valor,
              limite_violado: limiteViolado,
              limite_valor: limiteValor,
              lido: false,
              notificacao_enviada: false,
            })

            // Atualizar mapa para evitar duplicatas no mesmo batch
            ultimoAlertaPorConfig.set(cfg.id, new Date())

            logs.push(`ALERTA: ${cfg.tipo} ${limiteViolado} (${valor} vs ${limiteValor}) no dispositivo ${leitura.dispositivo_id}`)
          }
        }

        if (alertasParaInserir.length > 0) {
          await supabase
            .from('alertas_historico_iot')
            .insert(alertasParaInserir)
          totalAlertas += alertasParaInserir.length
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        totalLeituras,
        totalAlertas,
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
