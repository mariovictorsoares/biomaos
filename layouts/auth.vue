<template>
  <div class="min-h-screen flex flex-col lg:flex-row bg-white dark:bg-gray-900">
    <!-- Lado Esquerdo - Formulario -->
    <div class="w-full lg:w-[45%] flex flex-col justify-center px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20 py-10 lg:py-0 min-h-screen lg:min-h-0">
      <!-- Logo -->
      <div class="mb-10">
        <img 
          src="/images/logo-biomaos.png" 
          alt="BiomaOS" 
          class="h-12 w-auto dark:invert"
        />
      </div>

      <!-- Conteudo do formulario -->
      <slot />

      <!-- Footer -->
      <div class="mt-10 lg:mt-12">
        <p class="text-xs text-gray-400 dark:text-gray-500">
          &copy; {{ new Date().getFullYear() }} Fazendas Bioma. Todos os direitos reservados.
        </p>
      </div>
    </div>

    <!-- Lado Direito - Branding -->
    <div class="hidden lg:flex lg:w-[55%] relative overflow-hidden">
      <!-- Background com imagem e overlay -->
      <div class="absolute inset-0 bg-gradient-to-br from-[#568D43] via-[#4a7a3a] to-[#3d6830]"></div>

      <!-- Pattern decorativo -->
      <div class="absolute inset-0 opacity-5">
        <svg class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="leaves" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M30 5 Q35 15 30 25 Q25 15 30 5" fill="white" />
              <path d="M50 35 Q55 45 50 55 Q45 45 50 35" fill="white" />
              <path d="M10 40 Q15 50 10 60 Q5 50 10 40" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#leaves)" />
        </svg>
      </div>

      <!-- Circulos decorativos -->
      <div class="absolute -top-20 -right-20 w-80 h-80 bg-[#A8FF73]/10 rounded-full blur-3xl"></div>
      <div class="absolute -bottom-32 -left-20 w-96 h-96 bg-[#A8FF73]/10 rounded-full blur-3xl"></div>

      <!-- Conteudo -->
      <div class="relative z-10 flex flex-col justify-center items-center w-full px-12 xl:px-20">
        <!-- Badge -->
        <div class="mb-8">
          <span class="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white/90 text-sm font-medium">
            <span class="w-2 h-2 bg-[#A8FF73] rounded-full animate-pulse"></span>
            Sistema de Gestão Agrícola
          </span>
        </div>

        <!-- Titulo -->
        <h1 class="text-4xl xl:text-5xl font-bold text-white text-center leading-tight mb-6">
          Tecnologia e<br />
          <span class="text-[#A8FF73]">sustentabilidade</span><br />
          para o campo
        </h1>

        <!-- Subtitulo -->
        <p class="text-white/70 text-center max-w-md text-lg leading-relaxed mb-12">
          Gerencie sua produção com inteligência. Controle total do plantio à colheita.
        </p>

        <!-- Cards de features -->
        <div class="grid grid-cols-3 gap-4 w-full max-w-lg">
          <div class="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
            <span class="material-icons text-[#A8FF73] text-2xl mb-2">inventory_2</span>
            <p class="text-white/90 text-xs font-medium">Estoque</p>
          </div>
          <div class="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
            <span class="material-icons text-[#A8FF73] text-2xl mb-2">analytics</span>
            <p class="text-white/90 text-xs font-medium">Relatórios</p>
          </div>
          <div class="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
            <span class="material-icons text-[#A8FF73] text-2xl mb-2">agriculture</span>
            <p class="text-white/90 text-xs font-medium">Produção</p>
          </div>
        </div>

        <!-- Indicador de confianca -->
        <div class="mt-12 flex items-center gap-6 text-white/60 text-sm">
          <div class="flex items-center gap-2">
            <span class="material-icons text-[#A8FF73] text-lg">verified</span>
            <span>Dados seguros</span>
          </div>
          <div class="w-1 h-1 bg-white/30 rounded-full"></div>
          <div class="flex items-center gap-2">
            <span class="material-icons text-[#A8FF73] text-lg">cloud_done</span>
            <span>100% na nuvem</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
</script>
