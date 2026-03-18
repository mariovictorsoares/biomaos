/**
 * Plugin Featurebase (client-only)
 * Integra o Messenger Widget para Central de Ajuda e Chat com Atendente
 * Launcher padrão escondido — abertura controlada pelo Sidebar
 */

declare global {
  interface Window {
    Featurebase: any
  }
}

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const appId = config.public.featurebaseAppId as string

  const noopFeaturebase = {
    show: () => {},
    showHelp: () => {},
    showMessages: () => {},
    showNewMessage: (_text?: string) => {},
    hide: () => {},
  }

  if (!appId) {
    return { provide: { featurebase: noopFeaturebase } }
  }

  // Força widget a colar no bottom — espera SDK criar o wrapper, aplica uma vez
  const observer = new MutationObserver((_mutations, obs) => {
    const wrapper = document.getElementById('featurebase-iframe-wrapper')
    if (wrapper) {
      wrapper.style.setProperty('--fb-element-bottom', '0px')
      obs.disconnect() // para de observar após aplicar
    }
  })
  observer.observe(document.body, { childList: true, subtree: true })

  const user = useSupabaseUser()
  let sdkReady = false
  let identified = false

  const identifyUser = () => {
    if (!sdkReady || identified || !user.value) return
    window.Featurebase('identify', {
      organization: 'fazendasbioma',
      email: user.value.email,
      name: user.value.user_metadata?.full_name || user.value.email?.split('@')[0],
      userId: user.value.id,
    })
    identified = true
  }

  // Carrega SDK
  const script = document.createElement('script')
  script.id = 'featurebase-sdk'
  script.src = 'https://do.featurebase.app/js/sdk.js'
  script.async = true
  script.onload = () => {
    sdkReady = true
    window.Featurebase('boot', {
      appId,
      organization: 'fazendasbioma',
      language: 'pt-BR',
      placement: 'right',
      verticalPadding: 0,
      hideDefaultLauncher: true,
    })
    identifyUser()
  }

  const existing = document.getElementById('featurebase-sdk')
  if (existing) existing.remove()
  document.head.appendChild(script)

  // Identifica quando o user ficar disponível (login após boot)
  watch(user, () => identifyUser())

  return {
    provide: {
      featurebase: {
        show: () => window.Featurebase('show'),
        showHelp: () => window.Featurebase('show', 'help'),
        showMessages: () => window.Featurebase('show', 'messages'),
        showNewMessage: (text?: string) => {
          if (text) {
            window.Featurebase('showNewMessage', text)
          } else {
            window.Featurebase('showNewMessage')
          }
        },
        hide: () => window.Featurebase('hide'),
      }
    }
  }
})
