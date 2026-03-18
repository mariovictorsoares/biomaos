<template>
  <div class="h-screen overflow-hidden flex flex-col lg:flex-row">
    <!-- Header Mobile -->
    <header class="lg:hidden bg-sidebar-light dark:bg-sidebar-dark border-b border-border-light dark:border-border-dark px-4 py-3 flex items-center justify-between shrink-0 z-30">
      <!-- Hamburger Menu -->
      <button
        @click="openSidebar"
        class="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <span class="material-icons-outlined">menu</span>
      </button>

      <!-- Logo Central -->
      <img 
        src="/images/logo-biomaos.png" 
        alt="BiomaOS" 
        class="h-7 w-auto dark:invert"
      />

      <!-- Empresa Atual (Avatar) -->
      <NuxtLink
        to="/empresas"
        class="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-xs font-bold text-primary overflow-hidden"
      >
        <img v-if="currentCompanyLogo" :src="currentCompanyLogo" class="w-full h-full object-cover" alt="Logo" />
        <span v-else>{{ currentCompanyInitials }}</span>
      </NuxtLink>
    </header>

    <!-- Container Flex para Sidebar e Main -->
    <div class="flex-1 flex min-h-0 min-w-0">
      <!-- Menu Lateral -->
      <Sidebar />

      <!-- Conteudo Principal -->
      <main class="flex-1 min-w-0 overflow-y-auto overflow-x-hidden bg-background-light dark:bg-background-dark p-4 sm:p-6 lg:p-8">
        <slot />
      </main>
    </div>

    <!-- Toast Global -->
    <Toast />
  </div>
</template>

<script setup>
import { watch } from 'vue'
import { useSidebar } from '~/composables/useSidebar'
import { useCurrentCompany } from '~/composables/useCurrentCompany'

const { openSidebar } = useSidebar()
const { currentCompany, currentCompanyInitials, currentCompanyLogo, loadCurrentCompany } = useCurrentCompany()

// Garantir que empresa carrega quando usuario autentica (ex: refresh de pagina)
const user = useSupabaseUser()
watch(
  () => user.value?.id,
  async (newId) => {
    if (newId && !currentCompany.value) {
      await loadCurrentCompany()
    }
  },
  { immediate: true }
)
</script>
