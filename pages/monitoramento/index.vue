<template>
  <div>
    <div class="flex items-center justify-between mb-12">
      <h1 class="text-lg font-medium text-text-light/70 dark:text-text-dark/70 tracking-wide uppercase">Monitoramento IoT</h1>
      <TabsNav
        v-model="activeTab"
        :tabs="tabs"
      />
    </div>

    <div>
      <TabMonitoramentoDashboard v-if="activeTab === 'dashboard'" />
      <TabDispositivosIoT v-if="activeTab === 'dispositivos'" />
      <TabAlertasIoT v-if="activeTab === 'alertas'" />
      <TabConfiguracaoIoT v-if="activeTab === 'configuracao'" />
    </div>
  </div>
</template>

<script setup>
const route = useRoute()
const router = useRouter()

const validTabs = ['dashboard', 'dispositivos', 'alertas', 'configuracao']
const initialTab = validTabs.includes(route.query.tab) ? route.query.tab : 'dashboard'
const activeTab = ref(initialTab)

const tabs = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'dispositivos', label: 'Dispositivos' },
  { key: 'alertas', label: 'Alertas' },
  { key: 'configuracao', label: 'Configuração' }
]

watch(activeTab, (tab) => {
  router.replace({ query: tab === 'dashboard' ? {} : { tab } })
})
</script>
