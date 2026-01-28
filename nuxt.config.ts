export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/supabase'
  ],

  supabase: {
    redirect: true,
    redirectOptions: {
      login: '/auth/login',
      callback: '/auth/callback',
      exclude: ['/auth/*']
    }
  },

  runtimeConfig: {
    resendApiKey: process.env.RESEND_API_KEY,
    public: {
      baseUrl: process.env.BASE_URL || 'http://localhost:3000'
    }
  },

  routeRules: {
    '/auth/**': { ssr: false }
  },

  css: ['~/assets/css/main.css'],

  app: {
    head: {
      title: 'BiomaOS',
      link: [
        { rel: 'icon', type: 'image/png', href: '/favicon.png' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/icon?family=Material+Icons' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/icon?family=Material+Icons+Outlined' }
      ]
    }
  }
})
