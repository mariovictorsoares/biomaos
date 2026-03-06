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

  if (!appId) {
    console.warn('[Featurebase] FEATUREBASE_APP_ID não configurado')
    return {
      provide: {
        featurebase: {
          showHelp: () => {},
          showMessages: () => {},
          showNewMessage: (_text?: string) => {},
          hide: () => {},
          setTheme: (_theme: 'light' | 'dark') => {},
        }
      }
    }
  }

  // Queue de chamadas antes do SDK carregar
  if (typeof window.Featurebase !== 'function') {
    window.Featurebase = function () {
      (window.Featurebase.q = window.Featurebase.q || []).push(arguments)
    }
  }

  // Injeta script do SDK
  if (!document.getElementById('featurebase-sdk')) {
    const script = document.createElement('script')
    script.id = 'featurebase-sdk'
    script.src = 'https://do.featurebase.app/js/sdk.js'
    script.async = true
    document.head.appendChild(script)
  }

  // Boot com launcher padrão escondido
  const user = useSupabaseUser()

  const bootMessenger = () => {
    const bootConfig: Record<string, any> = {
      appId,
      theme: 'dark',
      language: 'pt',
      hideDefaultLauncher: true,
    }

    // Identifica usuário se logado
    if (user.value) {
      bootConfig.email = user.value.email
      bootConfig.userId = user.value.id
    }

    window.Featurebase('boot', bootConfig)
  }

  bootMessenger()
  console.log('[Featurebase] Boot realizado com appId:', appId)

  // Re-boot quando usuário loga/desloga para atualizar identificação
  watch(user, () => {
    bootMessenger()
  })

  return {
    provide: {
      featurebase: {
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
        setTheme: (theme: 'light' | 'dark') => window.Featurebase('setTheme', theme),
      }
    }
  }
})
