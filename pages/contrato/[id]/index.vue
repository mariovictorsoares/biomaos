<template>
  <div class="w-full max-w-lg">
    <div class="bg-white rounded-xl shadow-sm p-8">
      <!-- Logo -->
      <div class="flex items-center gap-2 mb-8">
        <div class="w-10 h-10 bg-[#549E54] rounded-lg flex items-center justify-center">
          <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </div>
        <span class="text-xl font-semibold text-gray-800">BiomaOS</span>
      </div>

      <h1 class="text-2xl font-bold text-gray-800 mb-4">Olá!</h1>

      <p class="text-gray-600 mb-4">
        Você está prestes a visualizar o contrato com todos os detalhes.
      </p>

      <p class="text-gray-600 mb-4">
        Caso tenha dúvidas, estamos à disposição para esclarecimentos por telefone, e-mail ou em uma reunião.
      </p>

      <p class="text-gray-600 mb-8">
        Agradecemos desde já pela confiança em nosso trabalho!
      </p>

      <NuxtLink
        :to="`/contrato/${route.params.id}/acesso`"
        class="block w-full text-center px-6 py-3 bg-[#549E54] text-white font-semibold rounded-lg hover:bg-[#478a47] transition-colors"
      >
        Avançar
      </NuxtLink>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'public'
})

const route = useRoute()
</script>
