<template>
  <div>
    <div class="flex items-center justify-between mb-12">
      <h1 class="text-lg font-medium text-text-light/70 dark:text-text-dark/70 tracking-wide uppercase">Produção</h1>
    </div>

    <TabProducaoNova
      :reload-key="reloadKey"
      @nova-producao="showModalNova = true"
      @detalhe-producao="abrirDetalhe"
      @ver-recorrentes="showModalRecorrentes = true"
    />

    <!-- Modais -->
    <ModalNovaProducao
      :show="showModalNova"
      @close="showModalNova = false"
      @saved="onProducaoCriada"
    />

    <ModalDetalheProducao
      v-if="producaoSelecionada"
      :show="showModalDetalhe"
      :producao="producaoSelecionada"
      @close="fecharDetalhe"
      @atualizado="onProducaoAtualizada"
    />

    <!-- Modal Recorrentes -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        leave-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        leave-to-class="opacity-0"
      >
        <div v-if="showModalRecorrentes" class="fixed inset-0 z-[70] overflow-y-auto">
          <div class="fixed inset-0 glass-backdrop" @click="showModalRecorrentes = false"></div>
          <div class="flex min-h-full items-center justify-center p-4">
            <Transition
              enter-active-class="transition-all duration-200"
              leave-active-class="transition-all duration-200"
              enter-from-class="opacity-0 scale-95"
              leave-to-class="opacity-0 scale-95"
            >
              <div v-if="showModalRecorrentes" class="relative z-[71] glass-panel rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
                <div class="flex items-center justify-between px-6 py-4 border-b border-border-light dark:border-border-dark flex-shrink-0">
                  <h2 class="text-lg font-semibold text-text-light dark:text-text-dark">Produções Recorrentes</h2>
                  <button @click="showModalRecorrentes = false" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <span class="material-icons-outlined">close</span>
                  </button>
                </div>
                <div class="flex-1 overflow-y-auto p-4">
                  <TabProducoesRecorrentes />
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
// Modais
const showModalNova = ref(false)
const showModalDetalhe = ref(false)
const showModalRecorrentes = ref(false)
const producaoSelecionada = ref(null)

// Key para forcar reload do TabProducaoNova
const reloadKey = ref(0)

function abrirDetalhe(producao) {
  producaoSelecionada.value = producao
  showModalDetalhe.value = true
}

function fecharDetalhe() {
  showModalDetalhe.value = false
  setTimeout(() => {
    producaoSelecionada.value = null
  }, 250)
}

function onProducaoCriada() {
  showModalNova.value = false
  reloadKey.value++
}

function onProducaoAtualizada() {
  reloadKey.value++
}
</script>
