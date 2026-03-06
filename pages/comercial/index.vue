<template>
  <div>
    <div class="flex items-center justify-between mb-12">
      <h1 class="text-lg font-medium text-text-light/70 dark:text-text-dark/70 tracking-wide uppercase">Comercial</h1>
      <TabsNav
        v-model="activeTab"
        :tabs="tabs"
      />
    </div>

    <div>
      <TabPedidos v-if="activeTab === 'pedidos'" />
      <TabPedidosRecorrentes v-if="activeTab === 'recorrentes'" />
      <TabVendas v-if="activeTab === 'vendas'" />
    </div>
  </div>
</template>

<script setup>
const route = useRoute()
const router = useRouter()

const validTabs = ['pedidos', 'recorrentes', 'vendas']
const queryTab = route.query.tab
const activeTab = ref(validTabs.includes(queryTab) ? queryTab : 'pedidos')

const tabs = [
  { key: 'pedidos', label: 'Pedidos' },
  { key: 'recorrentes', label: 'Recorrentes' },
  { key: 'vendas', label: 'Vendas' }
]

watch(activeTab, (tab) => {
  router.replace({ query: tab === 'pedidos' ? {} : { tab } })
})
</script>
