<template>
  <div>
    <div class="flex items-center justify-between mb-12">
      <h1 class="text-lg font-medium text-text-light/70 dark:text-text-dark/70 tracking-wide uppercase">Fazendas</h1>
      <TabsNav
        v-model="activeTab"
        :tabs="tabs"
      />
    </div>

    <div>
      <TabFazendas v-if="activeTab === 'fazendas'" />
      <TabCapacidadeFazendas v-if="activeTab === 'capacidade'" />
    </div>
  </div>
</template>

<script setup>
const route = useRoute()
const router = useRouter()

const activeTab = ref(route.query.tab === 'capacidade' ? 'capacidade' : 'fazendas')

const tabs = [
  { key: 'fazendas', label: 'Fazendas' },
  { key: 'capacidade', label: 'Capacidade' }
]

watch(activeTab, (tab) => {
  router.replace({ query: tab === 'fazendas' ? {} : { tab } })
})
</script>
