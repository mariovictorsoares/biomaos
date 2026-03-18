<template>
  <div>
    <div class="flex items-center justify-between mb-12">
      <h1 class="text-lg font-medium text-text-light/70 dark:text-text-dark/70 tracking-wide uppercase">Entregas</h1>
      <TabsNav
        v-model="activeTab"
        :tabs="tabs"
      />
    </div>

    <div>
      <TabRotas v-if="activeTab === 'rotas'" />
      <TabMotoristas v-if="activeTab === 'motoristas'" />
    </div>
  </div>
</template>

<script setup>
const route = useRoute()
const router = useRouter()

const activeTab = ref(route.query.tab === 'motoristas' ? 'motoristas' : 'rotas')

const tabs = [
  { key: 'rotas', label: 'Rotas' },
  { key: 'motoristas', label: 'Motoristas' }
]

watch(activeTab, (tab) => {
  router.replace({ query: tab === 'rotas' ? {} : { tab } })
})
</script>
