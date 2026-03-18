<template>
  <div>
    <div class="flex items-center justify-between mb-12">
      <h1 class="text-lg font-medium text-text-light/70 dark:text-text-dark/70 tracking-wide uppercase">Catálogo</h1>
      <TabsNav
        v-model="activeTab"
        :tabs="tabs"
      />
    </div>

    <div>
      <TabProdutos v-if="activeTab === 'produtos'" />
      <TabEspecies v-if="activeTab === 'especies'" />
    </div>
  </div>
</template>

<script setup>
const route = useRoute()
const router = useRouter()

const activeTab = ref(route.query.tab === 'produtos' ? 'produtos' : 'especies')

const tabs = [
  { key: 'especies', label: 'Espécies' },
  { key: 'produtos', label: 'Produtos' }
]

watch(activeTab, (tab) => {
  router.replace({ query: tab === 'especies' ? {} : { tab } })
})
</script>
