<template>
  <div>
    <div class="flex items-center justify-between mb-12">
      <h1 class="text-lg font-medium text-text-light/70 dark:text-text-dark/70 tracking-wide uppercase">Produção</h1>
      <TabsNav
        v-model="activeTab"
        :tabs="tabs"
      />
    </div>

    <div>
      <TabProducao v-if="activeTab === 'producao'" />
      <TabPrevisaoColheita v-if="activeTab === 'previsao'" />
    </div>
  </div>
</template>

<script setup>
const route = useRoute()
const router = useRouter()

const validTabs = ['producao', 'previsao']
const queryTab = route.query.tab
const activeTab = ref(validTabs.includes(queryTab) ? queryTab : 'producao')

const tabs = [
  { key: 'producao', label: 'Legado' },
  { key: 'previsao', label: 'Previsão' }
]

watch(activeTab, (tab) => {
  router.replace({ query: tab === 'producao' ? {} : { tab } })
})
</script>
