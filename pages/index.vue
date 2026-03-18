<template>
  <div class="min-h-screen">
    <!-- Header -->
    <div class="flex flex-col gap-4 mb-12">
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 class="text-lg font-medium text-text-light/70 dark:text-text-dark/70 tracking-wide uppercase">Dashboard</h1>

        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <!-- Dropdown Multi-Select de Empresas -->
          <div class="relative" ref="dropdownRef">
            <button
              @click="showDropdown = !showDropdown"
              class="flex items-center justify-between gap-2 bg-white dark:bg-card-dark border border-border-light dark:border-border-dark rounded-lg px-4 py-2 w-full sm:w-64 text-left hover:border-primary transition-colors"
            >
              <div class="flex items-center gap-2 truncate">
                <span class="material-icons text-gray-400 text-xl">business</span>
                <span class="text-sm text-text-light dark:text-text-dark truncate">
                  {{ empresasSelecionadasLabel }}
                </span>
              </div>
              <span class="material-icons text-gray-400 text-xl transition-transform" :class="{ 'rotate-180': showDropdown }">
                expand_more
              </span>
            </button>

            <!-- Dropdown Menu -->
            <Transition
              enter-active-class="transition ease-out duration-100"
              enter-from-class="transform opacity-0 scale-95"
              enter-to-class="transform opacity-100 scale-100"
              leave-active-class="transition ease-in duration-75"
              leave-from-class="transform opacity-100 scale-100"
              leave-to-class="transform opacity-0 scale-95"
            >
              <div
                v-if="showDropdown"
                class="absolute z-50 mt-2 w-full sm:w-72 bg-white dark:bg-card-dark border border-border-light dark:border-border-dark rounded-lg shadow-lg overflow-hidden"
              >
                <!-- Header do Dropdown -->
                <div class="px-4 py-3 border-b border-border-light dark:border-border-dark bg-gray-50 dark:bg-gray-800">
                  <div class="flex items-center justify-between">
                    <span class="text-sm font-medium text-text-light dark:text-text-dark">Selecionar Empresas</span>
                    <button
                      @click="selecionarTodas"
                      class="text-xs text-primary hover:text-primary/80 font-medium"
                    >
                      {{ todasSelecionadas ? 'Desmarcar todas' : 'Selecionar todas' }}
                    </button>
                  </div>
                </div>

                <!-- Lista de Empresas -->
                <div class="max-h-64 overflow-y-auto">
                  <label
                    v-for="empresa in userCompanies"
                    :key="empresa.id"
                    class="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      :checked="isSelected(empresa.id)"
                      @change="toggleCompany(empresa.id)"
                      class="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2"
                    />
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-text-light dark:text-text-dark truncate">
                        {{ empresa.nome_fantasia || empresa.razao_social }}
                      </p>
                      <p v-if="empresa.cnpj" class="text-xs text-subtext-light dark:text-subtext-dark">
                        {{ formatarCNPJ(empresa.cnpj) }}
                      </p>
                    </div>
                  </label>

                  <div v-if="userCompanies.length === 0" class="px-4 py-6 text-center text-subtext-light dark:text-subtext-dark text-sm">
                    Nenhuma empresa disponível
                  </div>
                </div>
              </div>
            </Transition>
          </div>

          <!-- Seletor de Período -->
          <div class="flex items-center gap-2 bg-white dark:bg-card-dark border border-border-light dark:border-border-dark rounded-lg px-3 py-2">
            <button @click="periodoAnterior" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1">
              <span class="material-icons text-xl">chevron_left</span>
            </button>
            <span class="text-sm text-text-light dark:text-text-dark min-w-[160px] sm:min-w-[180px] text-center whitespace-nowrap">
              {{ formatarPeriodo(periodoInicio) }} até {{ formatarPeriodo(periodoFim) }}
            </span>
            <button @click="proximoPeriodo" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1">
              <span class="material-icons text-xl">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
      <p class="mt-2 text-subtext-light dark:text-subtext-dark">Carregando dashboard...</p>
    </div>

    <!-- Conteúdo -->
    <template v-else>
      <!-- Cards de Métricas Principais -->
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <!-- Contratos Ativos -->
        <!-- Total de Microverdes a entregar -->
        <div class="card p-4">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <span class="material-icons-outlined text-amber-600 dark:text-amber-400">local_shipping</span>
            </div>
            <span class="text-sm text-subtext-light dark:text-subtext-dark">Total de Microverdes a entregar no período</span>
          </div>
          <p class="text-3xl font-semibold text-text-light dark:text-text-dark">{{ metricas.microverdesEntregar }}</p>
        </div>

        <!-- Entregas Programadas -->
        <div class="card p-4">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <span class="material-icons-outlined text-green-600 dark:text-green-400">event</span>
            </div>
            <span class="text-sm text-subtext-light dark:text-subtext-dark">Entregas Programadas para o período</span>
          </div>
          <p class="text-3xl font-semibold text-text-light dark:text-text-dark">{{ metricas.entregasProgramadas }}</p>
        </div>

        <!-- Faturamento Previsto -->
        <div class="card p-4">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <span class="material-icons-outlined text-emerald-600 dark:text-emerald-400">attach_money</span>
            </div>
            <span class="text-sm text-subtext-light dark:text-subtext-dark">Faturamento Previsto do Período</span>
          </div>
          <p class="text-3xl font-semibold text-text-light dark:text-text-dark">{{ formatarMoeda(metricas.faturamentoPrevisto) }}</p>
        </div>
      </div>

      <!-- Produção Ativa: Tarefas Hoje, Colheitas Próximas, Atrasados -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <!-- Tarefas de Hoje -->
        <div class="card p-4 sm:p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-base font-medium text-text-light dark:text-text-dark">Tarefas de Hoje</h2>
            <span class="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium">
              {{ tarefasHoje.length }}
            </span>
          </div>
          <div v-if="tarefasHoje.length > 0" class="space-y-2 max-h-48 overflow-y-auto">
            <div
              v-for="t in tarefasHoje"
              :key="t.id"
              class="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-800"
            >
              <span
                class="w-2 h-2 rounded-full flex-shrink-0"
                :class="t.concluida ? 'bg-green-500' : 'bg-yellow-500'"
              ></span>
              <div class="flex-1 min-w-0">
                <p class="text-sm text-text-light dark:text-text-dark truncate">{{ t.nome }}</p>
                <p class="text-xs text-subtext-light dark:text-subtext-dark truncate">
                  {{ t.especie_nome || 'Tarefa manual' }}
                  <span v-if="t.bandejas"> &middot; {{ t.bandejas }} bdj</span>
                </p>
              </div>
            </div>
          </div>
          <div v-else class="py-6 text-center text-subtext-light dark:text-subtext-dark text-sm">
            Nenhuma tarefa para hoje
          </div>
        </div>

        <!-- Próximas Colheitas (7 dias) -->
        <div class="card p-4 sm:p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-base font-medium text-text-light dark:text-text-dark">Colheitas (7 dias)</h2>
            <span class="text-xs px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-medium">
              {{ proximasColheitas.length }}
            </span>
          </div>
          <div v-if="proximasColheitas.length > 0" class="space-y-2 max-h-48 overflow-y-auto">
            <div
              v-for="c in proximasColheitas"
              :key="c.data_colheita"
              class="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800"
            >
              <div>
                <p class="text-sm font-medium text-text-light dark:text-text-dark">
                  {{ formatarDataCurta(c.data_colheita) }}
                </p>
                <p class="text-xs text-subtext-light dark:text-subtext-dark">
                  {{ c.status === 'concluida' ? 'Concluída' : c.status === 'parcial' ? 'Parcial' : 'Pendente' }}
                </p>
              </div>
              <span
                class="text-xs px-2 py-1 rounded-full font-medium"
                :class="{
                  'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300': c.status === 'concluida',
                  'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300': c.status === 'parcial',
                  'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300': c.status === 'pendente'
                }"
              >
                {{ c.status }}
              </span>
            </div>
          </div>
          <div v-else class="py-6 text-center text-subtext-light dark:text-subtext-dark text-sm">
            Nenhuma colheita nos próximos 7 dias
          </div>
        </div>

        <!-- Tarefas Atrasadas -->
        <div class="card p-4 sm:p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-base font-medium text-text-light dark:text-text-dark">Tarefas Atrasadas</h2>
            <span
              class="text-xs px-2 py-1 rounded-full font-medium"
              :class="tarefasAtrasadas.length > 0
                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'"
            >
              {{ tarefasAtrasadas.length }}
            </span>
          </div>
          <div v-if="tarefasAtrasadas.length > 0" class="space-y-2 max-h-48 overflow-y-auto">
            <div
              v-for="t in tarefasAtrasadas"
              :key="t.id"
              class="flex items-center gap-3 p-2 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30"
            >
              <span class="material-icons text-red-500 text-lg">warning</span>
              <div class="flex-1 min-w-0">
                <p class="text-sm text-text-light dark:text-text-dark truncate">{{ t.nome }}</p>
                <p class="text-xs text-red-600 dark:text-red-400">
                  {{ formatarDataCurta(t.data_prevista) }}
                  <span v-if="t.especie_nome"> &middot; {{ t.especie_nome }}</span>
                </p>
              </div>
            </div>
          </div>
          <div v-else class="py-6 text-center text-green-600 dark:text-green-400 text-sm">
            Nenhuma tarefa atrasada
          </div>
        </div>
      </div>

      <!-- Produção e Vendas -->
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <!-- Seção Produção -->
        <div class="card p-4 sm:p-6">
          <h2 class="text-base font-medium text-text-light dark:text-text-dark mb-4">Produção</h2>

          <!-- Filtros de Produção -->
          <div class="flex flex-wrap gap-2 mb-4">
            <button
              v-for="filtro in filtrosProducao"
              :key="filtro.value"
              @click="filtroProducaoAtivo = filtro.value"
              :class="[
                'px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                filtroProducaoAtivo === filtro.value
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-text-light dark:text-text-dark hover:bg-gray-200 dark:hover:bg-gray-600'
              ]"
            >
              {{ filtro.label }}
            </button>
          </div>

          <div class="flex flex-col lg:flex-row gap-6">
            <!-- Métricas de Produção -->
            <div class="flex-1 space-y-4">
              <!-- Total -->
              <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border-l-4 border-blue-500">
                <span class="text-sm text-subtext-light dark:text-subtext-dark">Total</span>
                <div class="text-right">
                  <span class="text-xl font-semibold text-blue-600">{{ producaoFiltrada.total }}</span>
                  <span class="text-sm text-subtext-light dark:text-subtext-dark ml-2">100%</span>
                </div>
              </div>

              <!-- Perdas -->
              <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border-l-4 border-blue-500">
                <span class="text-sm text-subtext-light dark:text-subtext-dark">Perdas</span>
                <div class="text-right">
                  <span class="text-xl font-semibold text-blue-600">{{ producaoFiltrada.perdas }}</span>
                  <span class="text-sm text-subtext-light dark:text-subtext-dark ml-2">{{ calcularPercentual(producaoFiltrada.perdas, producaoFiltrada.total) }}%</span>
                </div>
              </div>

              <!-- Linha inferior -->
              <div class="grid grid-cols-3 gap-2 sm:gap-3">
                <div class="p-2 sm:p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border-l-4 border-green-500">
                  <p class="text-xs text-subtext-light dark:text-subtext-dark">Previstos</p>
                  <p class="text-base sm:text-lg font-semibold text-green-600">{{ producaoFiltrada.previstos }}</p>
                  <p class="text-xs text-green-600">{{ calcularPercentual(producaoFiltrada.previstos, producaoFiltrada.total) }}%</p>
                </div>
                <div class="p-2 sm:p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border-l-4 border-green-500">
                  <p class="text-xs text-subtext-light dark:text-subtext-dark">Realizados</p>
                  <p class="text-base sm:text-lg font-semibold text-green-600">{{ producaoFiltrada.realizados }}</p>
                  <p class="text-xs text-green-600">{{ calcularPercentual(producaoFiltrada.realizados, producaoFiltrada.total) }}%</p>
                </div>
                <div class="p-2 sm:p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border-l-4 border-red-500">
                  <p class="text-xs text-subtext-light dark:text-subtext-dark">Atrasados</p>
                  <p class="text-base sm:text-lg font-semibold text-red-600">{{ producaoFiltrada.atrasados }}</p>
                  <p class="text-xs text-red-600">{{ calcularPercentual(producaoFiltrada.atrasados, producaoFiltrada.total) }}%</p>
                </div>
              </div>
            </div>

            <!-- Gráfico de Pizza Produção -->
            <div class="w-full lg:w-48 h-48 flex items-center justify-center mx-auto lg:mx-0">
              <Pie v-if="hasProducaoData" :data="chartProducaoData" :options="chartOptions" />
              <div v-else class="text-center text-subtext-light dark:text-subtext-dark text-sm">
                Sem dados
              </div>
            </div>
          </div>
        </div>

        <!-- Seção Vendas -->
        <div class="card p-4 sm:p-6">
          <h2 class="text-base font-medium text-text-light dark:text-text-dark mb-4">Vendas</h2>

          <div class="flex flex-col lg:flex-row gap-6">
            <!-- Métricas de Vendas -->
            <div class="flex-1 space-y-3">
              <div class="grid grid-cols-2 gap-3">
                <!-- Total de Microverdes -->
                <div class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border-l-4 border-green-500">
                  <p class="text-xs text-subtext-light dark:text-subtext-dark">Total de Microverdes</p>
                  <div class="flex items-center justify-between">
                    <p class="text-base sm:text-lg font-semibold text-green-600">{{ vendas.totalMicroverdes }}</p>
                    <p class="text-xs text-subtext-light dark:text-subtext-dark">0%</p>
                  </div>
                </div>

                <!-- Vendido -->
                <div class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border-l-4 border-green-500">
                  <p class="text-xs text-subtext-light dark:text-subtext-dark">Vendido</p>
                  <div class="flex items-center justify-between">
                    <p class="text-base sm:text-lg font-semibold text-green-600">{{ vendas.vendido }}</p>
                    <p class="text-xs text-green-600">{{ calcularPercentual(vendas.vendido, vendas.totalMicroverdes) }}%</p>
                  </div>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <!-- Vender -->
                <div class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border-l-4 border-yellow-500">
                  <p class="text-xs text-subtext-light dark:text-subtext-dark">Vender</p>
                  <div class="flex items-center justify-between">
                    <p class="text-base sm:text-lg font-semibold text-yellow-600">{{ vendas.vender }}</p>
                    <p class="text-xs text-yellow-600">{{ calcularPercentual(vendas.vender, vendas.totalMicroverdes) }}%</p>
                  </div>
                </div>

                <!-- Colhido -->
                <div class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border-l-4 border-green-500">
                  <p class="text-xs text-subtext-light dark:text-subtext-dark">Colhido</p>
                  <div class="flex items-center justify-between">
                    <p class="text-base sm:text-lg font-semibold text-green-600">{{ vendas.colhido }}</p>
                    <p class="text-xs text-green-600">{{ calcularPercentual(vendas.colhido, vendas.totalMicroverdes) }}%</p>
                  </div>
                </div>
              </div>

              <!-- Colher -->
              <div class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border-l-4 border-yellow-500">
                <p class="text-xs text-subtext-light dark:text-subtext-dark">Colher</p>
                <div class="flex items-center justify-between">
                  <p class="text-base sm:text-lg font-semibold text-yellow-600">{{ vendas.colher }}</p>
                  <p class="text-xs text-yellow-600">{{ calcularPercentual(vendas.colher, vendas.totalMicroverdes) }}%</p>
                </div>
              </div>
            </div>

            <!-- Gráfico de Pizza Vendas -->
            <div class="w-full lg:w-48 h-48 flex items-center justify-center mx-auto lg:mx-0">
              <Pie v-if="hasVendasData" :data="chartVendasData" :options="chartOptions" />
              <div v-else class="text-center text-subtext-light dark:text-subtext-dark text-sm">
                Sem dados
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Eficiência -->
      <div class="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <!-- Eficiência da Produção -->
        <div class="card p-4">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <span class="material-icons-outlined text-amber-600 dark:text-amber-400">trending_up</span>
            </div>
            <span class="text-xs sm:text-sm text-subtext-light dark:text-subtext-dark">Eficiência da Produção</span>
          </div>
          <p class="text-2xl sm:text-3xl font-semibold text-text-light dark:text-text-dark">{{ eficiencia.producao }}%</p>
        </div>

        <!-- Microverdes / Pessoa -->
        <div class="card p-4">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <span class="material-icons-outlined text-amber-600 dark:text-amber-400">group</span>
            </div>
            <span class="text-xs sm:text-sm text-subtext-light dark:text-subtext-dark">Microverdes / Pessoa</span>
          </div>
          <p class="text-2xl sm:text-3xl font-semibold text-text-light dark:text-text-dark">{{ eficiencia.microverdesPorPessoa }}</p>
        </div>

        <!-- Eficiência das Vendas -->
        <div class="card p-4">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <span class="material-icons-outlined text-amber-600 dark:text-amber-400">show_chart</span>
            </div>
            <span class="text-xs sm:text-sm text-subtext-light dark:text-subtext-dark">Eficiência das Vendas</span>
          </div>
          <p class="text-2xl sm:text-3xl font-semibold text-text-light dark:text-text-dark">{{ eficiencia.vendas }}%</p>
        </div>

        <!-- Ticket Médio -->
        <div class="card p-4">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <span class="material-icons-outlined text-amber-600 dark:text-amber-400">receipt</span>
            </div>
            <span class="text-xs sm:text-sm text-subtext-light dark:text-subtext-dark">Ticket Médio</span>
          </div>
          <p class="text-2xl sm:text-3xl font-semibold text-text-light dark:text-text-dark">{{ formatarMoeda(eficiencia.ticketMedio) }}</p>
        </div>
      </div>

      <!-- Fazendas e Vendas por Mês -->
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <!-- Tabela de Fazendas -->
        <div class="card p-4 sm:p-6">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <h2 class="text-base font-medium text-text-light dark:text-text-dark">Fazendas</h2>
            <div class="relative w-full sm:w-auto">
              <input
                v-model="buscarFazenda"
                type="text"
                placeholder="Buscar fazenda"
                class="input w-full sm:w-40 pr-10 text-sm"
              />
              <span class="material-icons absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">search</span>
            </div>
          </div>

          <div class="overflow-x-auto -mx-4 sm:mx-0">
            <div class="min-w-[600px] px-4 sm:px-0">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b border-border-light dark:border-border-dark">
                    <th class="text-left py-3 px-2 font-medium text-subtext-light dark:text-subtext-dark">Código</th>
                    <th class="text-left py-3 px-2 font-medium text-subtext-light dark:text-subtext-dark">Nome</th>
                    <th class="text-right py-3 px-2 font-medium text-subtext-light dark:text-subtext-dark">Capacidade</th>
                    <th class="text-right py-3 px-2 font-medium text-subtext-light dark:text-subtext-dark">Alocado</th>
                    <th class="text-right py-3 px-2 font-medium text-subtext-light dark:text-subtext-dark">Ocupação Atual</th>
                    <th class="text-right py-3 px-2 font-medium text-subtext-light dark:text-subtext-dark">Efic. Produção</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="fazenda in fazendasFiltradas" :key="fazenda.id" class="border-b border-border-light/50 dark:border-border-dark/50 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td class="py-3 px-2 text-text-light dark:text-text-dark">{{ fazenda.codigo }}</td>
                    <td class="py-3 px-2 text-text-light dark:text-text-dark">{{ fazenda.nome }}</td>
                    <td class="py-3 px-2 text-right text-subtext-light dark:text-subtext-dark">{{ fazenda.capacidade_bandejas || 0 }}</td>
                    <td class="py-3 px-2 text-right text-subtext-light dark:text-subtext-dark">{{ fazenda.alocado || 0 }}</td>
                    <td class="py-3 px-2 text-right">
                      <span :class="['font-medium', getOcupacaoClass(fazenda.ocupacao)]">
                        {{ fazenda.ocupacao || 0 }}%
                      </span>
                    </td>
                    <td class="py-3 px-2 text-right">
                      <span class="font-medium text-primary">{{ fazenda.eficienciaProducao || 0 }}%</span>
                    </td>
                  </tr>
                  <tr v-if="fazendasFiltradas.length === 0">
                    <td colspan="6" class="py-8 text-center text-subtext-light dark:text-subtext-dark">
                      Nenhuma fazenda encontrada
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Gráfico de Vendas por Mês -->
        <div class="card p-4 sm:p-6">
          <h2 class="text-base font-medium text-text-light dark:text-text-dark mb-4">Vendas (Unidades por mês)</h2>
          <div class="h-64">
            <Bar :data="chartVendasMensaisData" :options="chartBarOptions" />
          </div>
        </div>
      </div>

      <!-- Custo, Preço e Margem -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <!-- Custo médio -->
        <div class="card p-4">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <span class="material-icons-outlined text-amber-600 dark:text-amber-400">payments</span>
            </div>
            <span class="text-sm text-subtext-light dark:text-subtext-dark">Custo médio</span>
          </div>
          <p class="text-2xl sm:text-3xl font-semibold text-text-light dark:text-text-dark">{{ formatarMoeda(custos.custoMedio) }}</p>
        </div>

        <!-- Preço Médio -->
        <div class="card p-4">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <span class="material-icons-outlined text-amber-600 dark:text-amber-400">sell</span>
            </div>
            <span class="text-sm text-subtext-light dark:text-subtext-dark">Preço Médio</span>
          </div>
          <p class="text-2xl sm:text-3xl font-semibold text-text-light dark:text-text-dark">{{ formatarMoeda(custos.precoMedio) }}</p>
        </div>

        <!-- Margem Bruta -->
        <div class="card p-4">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <span class="material-icons-outlined text-amber-600 dark:text-amber-400">percent</span>
            </div>
            <span class="text-sm text-subtext-light dark:text-subtext-dark">Margem Bruta</span>
          </div>
          <p class="text-2xl sm:text-3xl font-semibold text-text-light dark:text-text-dark">{{ custos.margemBruta }}%</p>
        </div>
      </div>

      <!-- Eficiência por Espécie, Mais vendidos, Margem por espécie -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Eficiência por Espécie -->
        <div class="card p-4 sm:p-6">
          <h2 class="text-base font-medium text-text-light dark:text-text-dark mb-4">Eficiência por Espécie</h2>
          <div class="space-y-3">
            <div v-for="especie in eficienciaPorEspecie" :key="especie.id" class="flex items-center justify-between">
              <span class="text-sm text-text-light dark:text-text-dark truncate mr-2">{{ especie.nome }}</span>
              <span class="text-sm font-medium text-primary whitespace-nowrap">{{ especie.eficiencia }}%</span>
            </div>
            <div v-if="eficienciaPorEspecie.length === 0" class="py-4 text-center text-subtext-light dark:text-subtext-dark text-sm">
              Sem dados disponíveis
            </div>
          </div>
        </div>

        <!-- Mais vendidos -->
        <div class="card p-4 sm:p-6">
          <h2 class="text-base font-medium text-text-light dark:text-text-dark mb-4">Mais vendidos</h2>
          <div class="space-y-3">
            <div v-for="item in maisVendidos" :key="item.id" class="flex items-center justify-between">
              <span class="text-sm text-text-light dark:text-text-dark truncate mr-2">{{ item.nome }}</span>
              <span class="text-sm font-medium text-text-light dark:text-text-dark whitespace-nowrap">{{ item.quantidade }} un.</span>
            </div>
            <div v-if="maisVendidos.length === 0" class="py-4 text-center text-subtext-light dark:text-subtext-dark text-sm">
              Sem dados disponíveis
            </div>
          </div>
        </div>

        <!-- Margem por espécie -->
        <div class="card p-4 sm:p-6">
          <h2 class="text-base font-medium text-text-light dark:text-text-dark mb-4">Margem por espécie</h2>
          <div class="space-y-3">
            <div v-for="especie in margemPorEspecie" :key="especie.id" class="flex items-center justify-between">
              <span class="text-sm text-text-light dark:text-text-dark truncate mr-2">{{ especie.nome }}</span>
              <span class="text-sm font-medium text-primary whitespace-nowrap">{{ especie.margem }}%</span>
            </div>
            <div v-if="margemPorEspecie.length === 0" class="py-4 text-center text-subtext-light dark:text-subtext-dark text-sm">
              Sem dados disponíveis
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useDashboardCompanies } from '~/composables/useDashboardCompanies'
import { Pie, Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
} from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title)

const supabase = useSupabaseClient()

// Composable de empresas
const {
  userCompanies,
  selectedCompanyIds,
  isLoadingCompanies,
  loadUserCompanies,
  toggleCompany,
  isSelected,
  selectAll
} = useDashboardCompanies()

// Estado
const loading = ref(false)
const buscarFazenda = ref('')
const showDropdown = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

// Período (semana atual)
const hoje = new Date()
const periodoInicio = ref(getStartOfWeek(hoje))
const periodoFim = ref(getEndOfWeek(hoje))

// Filtros de Produção
const filtrosProducao = [
  { label: 'Todos', value: 'todos' },
  { label: 'Plantio', value: 'plantio' },
  { label: 'Luz', value: 'luz' },
  { label: 'Colheita', value: 'colheita' }
]
const filtroProducaoAtivo = ref('todos')

// Dados
const metricas = ref({
  microverdesEntregar: 0,
  entregasProgramadas: 0,
  faturamentoPrevisto: 0
})

const producao = ref({
  total: 0,
  perdas: 0,
  previstos: 0,
  realizados: 0,
  atrasados: 0,
  plantio: { total: 0, perdas: 0, previstos: 0, realizados: 0, atrasados: 0 },
  luz: { total: 0, perdas: 0, previstos: 0, realizados: 0, atrasados: 0 },
  colheita: { total: 0, perdas: 0, previstos: 0, realizados: 0, atrasados: 0 }
})

const vendas = ref({
  totalMicroverdes: 0,
  vendido: 0,
  vender: 0,
  colhido: 0,
  colher: 0
})

const eficiencia = ref({
  producao: 100,
  microverdesPorPessoa: 0,
  vendas: 100,
  ticketMedio: 0
})

const fazendas = ref<any[]>([])
const custos = ref({
  custoMedio: 0,
  precoMedio: 0,
  margemBruta: 100
})

const eficienciaPorEspecie = ref<any[]>([])
const maisVendidos = ref<any[]>([])
const margemPorEspecie = ref<any[]>([])
const vendasMensais = ref<any[]>([])

// Dados novos (módulo produção reestruturado)
const tarefasHoje = ref<any[]>([])
const tarefasAtrasadas = ref<any[]>([])
const proximasColheitas = ref<any[]>([])

// Computed
const empresasSelecionadasLabel = computed(() => {
  if (selectedCompanyIds.value.length === 0) return 'Selecione empresas'
  if (selectedCompanyIds.value.length === userCompanies.value.length) return 'Todas as empresas'
  if (selectedCompanyIds.value.length === 1) {
    const empresa = userCompanies.value.find(e => e.id === selectedCompanyIds.value[0])
    return empresa?.nome_fantasia || empresa?.razao_social || '1 empresa'
  }
  return `${selectedCompanyIds.value.length} empresas`
})

const todasSelecionadas = computed(() => {
  return userCompanies.value.length > 0 && selectedCompanyIds.value.length === userCompanies.value.length
})

const producaoFiltrada = computed(() => {
  if (filtroProducaoAtivo.value === 'todos') {
    return producao.value
  }
  return producao.value[filtroProducaoAtivo.value as keyof typeof producao.value] || producao.value
})

const fazendasFiltradas = computed(() => {
  if (!buscarFazenda.value) return fazendas.value
  const termo = buscarFazenda.value.toLowerCase()
  return fazendas.value.filter(f =>
    f.nome?.toLowerCase().includes(termo) ||
    f.codigo?.toLowerCase().includes(termo)
  )
})

const hasProducaoData = computed(() => {
  return producaoFiltrada.value.total > 0
})

const hasVendasData = computed(() => {
  return vendas.value.colher > 0 || vendas.value.colhido > 0
})

// Chart Data
const chartProducaoData = computed(() => ({
  labels: ['Atrasados', 'Previstos', 'Realizados'],
  datasets: [{
    data: [
      producaoFiltrada.value.atrasados || 0,
      producaoFiltrada.value.previstos || 0,
      producaoFiltrada.value.realizados || 0
    ],
    backgroundColor: ['#EF4444', '#FBBF24', '#22C55E'],
    borderWidth: 0
  }]
}))

const chartVendasData = computed(() => ({
  labels: ['Colher', 'Colhido'],
  datasets: [{
    data: [
      vendas.value.colher || 0,
      vendas.value.colhido || 0
    ],
    backgroundColor: ['#3B82F6', '#93C5FD'],
    borderWidth: 0
  }]
}))

const chartVendasMensaisData = computed(() => {
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez', 'Jan']
  const dados = Array(13).fill(0)

  vendasMensais.value.forEach(v => {
    if (v.data_venda) {
      const mes = new Date(v.data_venda).getMonth()
      dados[mes] += v.quantidade_total || 0
    }
  })

  return {
    labels: meses,
    datasets: [{
      label: 'Unidades',
      data: dados,
      backgroundColor: '#22C55E',
      borderRadius: 4
    }]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: {
      display: false
    }
  }
}

const chartBarOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(0,0,0,0.05)'
      }
    },
    x: {
      grid: {
        display: false
      }
    }
  }
}

// Helpers
function getStartOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d
}

function getEndOfWeek(date: Date): Date {
  const d = getStartOfWeek(date)
  d.setDate(d.getDate() + 6)
  return d
}

function periodoAnterior() {
  periodoInicio.value = new Date(periodoInicio.value.getTime() - 7 * 24 * 60 * 60 * 1000)
  periodoFim.value = new Date(periodoFim.value.getTime() - 7 * 24 * 60 * 60 * 1000)
  loadDashboard()
}

function proximoPeriodo() {
  periodoInicio.value = new Date(periodoInicio.value.getTime() + 7 * 24 * 60 * 60 * 1000)
  periodoFim.value = new Date(periodoFim.value.getTime() + 7 * 24 * 60 * 60 * 1000)
  loadDashboard()
}

function formatarMoeda(valor: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor || 0)
}

function formatarPeriodo(data: Date) {
  return data.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

function formatarCNPJ(cnpj: string) {
  if (!cnpj) return ''
  const numeros = cnpj.replace(/\D/g, '')
  if (numeros.length !== 14) return cnpj
  return numeros.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
}

function calcularPercentual(valor: number, total: number): number {
  if (total === 0) return 0
  return Math.round((valor / total) * 100)
}

function formatarDataCurta(dateStr: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function getOcupacaoClass(ocupacao: number) {
  if (ocupacao >= 90) return 'text-red-600'
  if (ocupacao >= 70) return 'text-yellow-600'
  return 'text-green-600'
}

function selecionarTodas() {
  if (todasSelecionadas.value) {
    // Manter pelo menos uma selecionada
    if (userCompanies.value.length > 0) {
      selectedCompanyIds.value = [userCompanies.value[0].id]
    }
  } else {
    selectAll()
  }
}

// Click outside handler
function handleClickOutside(event: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    showDropdown.value = false
  }
}

// Carregar dados
async function loadDashboard() {
  if (selectedCompanyIds.value.length === 0) {
    resetData()
    return
  }

  loading.value = true
  try {
    const empresaIds = selectedCompanyIds.value
    const inicio = periodoInicio.value.toISOString().split('T')[0]
    const fim = periodoFim.value.toISOString().split('T')[0]
    const hojeStr = new Date().toISOString().split('T')[0]

    // Carregar tudo em paralelo
    const [
      producoesRes,
      pedidosRes,
      vendasRes,
      fazendasRes,
      produtosRes,
      especiesRes
    ] = await Promise.all([
      // Produções
      supabase
        .from('producao')
        .select('*, especies:especie_id (id, nome, codigo), fazendas:fazenda_id (id, nome, codigo)')
        .in('empresa_id', empresaIds),

      // Pedidos no período
      supabase
        .from('pedidos')
        .select('*, pedido_itens (quantidade)')
        .in('empresa_id', empresaIds)
        .gte('data_entrega', inicio)
        .lte('data_entrega', fim),

      // Vendas
      supabase
        .from('vendas')
        .select('*, venda_itens (quantidade)')
        .in('empresa_id', empresaIds),

      // Fazendas
      supabase
        .from('fazendas')
        .select('*')
        .in('empresa_id', empresaIds)
        .eq('ativo', true)
        .order('codigo'),

      // Produtos
      supabase
        .from('produtos')
        .select('*')
        .in('empresa_id', empresaIds),

      // Espécies
      supabase
        .from('especies')
        .select('*')
        .in('empresa_id', empresaIds)
    ])

    // Carregar dados do novo módulo de produção (tarefas, colheitas)
    const [tarefasHojeRes, tarefasAtrasadasRes, colheitasProximasRes] = await Promise.all([
      supabase
        .from('tarefas')
        .select('id, nome, bandejas, concluida, data_prevista, especies:especie_id (nome)')
        .in('empresa_id', empresaIds)
        .eq('data_prevista', hojeStr)
        .order('concluida')
        .limit(20),
      supabase
        .from('tarefas')
        .select('id, nome, bandejas, data_prevista, especies:especie_id (nome)')
        .in('empresa_id', empresaIds)
        .eq('concluida', false)
        .lt('data_prevista', hojeStr)
        .order('data_prevista')
        .limit(20),
      supabase
        .from('colheitas')
        .select('id, data_colheita, status')
        .in('empresa_id', empresaIds)
        .gte('data_colheita', hojeStr)
        .lte('data_colheita', new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0])
        .order('data_colheita')
        .limit(10)
    ])

    tarefasHoje.value = (tarefasHojeRes.data || []).map(t => ({
      ...t,
      especie_nome: t.especies?.nome || null
    }))
    tarefasAtrasadas.value = (tarefasAtrasadasRes.data || []).map(t => ({
      ...t,
      especie_nome: t.especies?.nome || null
    }))
    proximasColheitas.value = colheitasProximasRes.data || []

    // Processar pedidos
    const pedidos = pedidosRes.data || []
    metricas.value.entregasProgramadas = pedidos.length
    metricas.value.microverdesEntregar = pedidos.reduce((sum, p) => {
      const itens = p.pedido_itens || []
      return sum + itens.reduce((s: number, i: any) => s + (i.quantidade || 0), 0)
    }, 0)
    metricas.value.faturamentoPrevisto = pedidos.reduce((sum, p) => sum + (p.valor_total || 0), 0)

    // Processar produções
    const prods = producoesRes.data || []
    const prodsNoPeriodo = prods.filter(p =>
      (p.data_semeadura >= inicio && p.data_semeadura <= fim) ||
      (p.data_colheita_prevista >= inicio && p.data_colheita_prevista <= fim)
    )

    // Totais
    producao.value.total = prodsNoPeriodo.reduce((sum, p) => sum + (p.quantidade_bandeja || 0), 0)
    producao.value.previstos = prodsNoPeriodo.filter(p => p.status === 'planejado').reduce((sum, p) => sum + (p.quantidade_bandeja || 0), 0)
    producao.value.realizados = prodsNoPeriodo.filter(p => p.status === 'finalizado').reduce((sum, p) => sum + (p.quantidade_bandeja || 0), 0)
    producao.value.atrasados = prodsNoPeriodo.filter(p => {
      if (p.status === 'finalizado' || p.status === 'cancelado') return false
      return p.data_colheita_prevista < hojeStr
    }).reduce((sum, p) => sum + (p.quantidade_bandeja || 0), 0)
    producao.value.perdas = prodsNoPeriodo.filter(p => p.status === 'cancelado').reduce((sum, p) => sum + (p.quantidade_bandeja || 0), 0)

    // Por fase
    const plantio = prodsNoPeriodo.filter(p => p.status === 'planejado')
    const emLuz = prodsNoPeriodo.filter(p => ['germinando', 'vegetacao'].includes(p.status))
    const colheitaProds = prodsNoPeriodo.filter(p => ['colhendo', 'finalizado'].includes(p.status))

    producao.value.plantio = {
      total: plantio.reduce((sum, p) => sum + (p.quantidade_bandeja || 0), 0),
      perdas: 0,
      previstos: plantio.reduce((sum, p) => sum + (p.quantidade_bandeja || 0), 0),
      realizados: 0,
      atrasados: 0
    }

    producao.value.luz = {
      total: emLuz.reduce((sum, p) => sum + (p.quantidade_bandeja || 0), 0),
      perdas: 0,
      previstos: 0,
      realizados: emLuz.reduce((sum, p) => sum + (p.quantidade_bandeja || 0), 0),
      atrasados: 0
    }

    producao.value.colheita = {
      total: colheitaProds.reduce((sum, p) => sum + (p.quantidade_bandeja || 0), 0),
      perdas: 0,
      previstos: 0,
      realizados: colheitaProds.filter(p => p.status === 'finalizado').reduce((sum, p) => sum + (p.quantidade_bandeja || 0), 0),
      atrasados: colheitaProds.filter(p => p.data_colheita_prevista < hojeStr && p.status !== 'finalizado').reduce((sum, p) => sum + (p.quantidade_bandeja || 0), 0)
    }

    // Vendas
    const vendasData = vendasRes.data || []
    const colhidos = prods.filter(p => p.status === 'finalizado')
    const aColher = prods.filter(p => ['planejado', 'germinando', 'vegetacao', 'colhendo'].includes(p.status))

    vendas.value.totalMicroverdes = prods.reduce((sum, p) => sum + (p.quantidade_bandeja || 0), 0)
    vendas.value.colhido = colhidos.reduce((sum, p) => sum + (p.quantidade_colhida || p.quantidade_bandeja || 0), 0)
    vendas.value.colher = aColher.reduce((sum, p) => sum + (p.quantidade_bandeja || 0), 0)
    vendas.value.vendido = vendasData.reduce((sum, v) => {
      const itens = v.venda_itens || []
      return sum + itens.reduce((s: number, i: any) => s + (i.quantidade || 0), 0)
    }, 0)
    vendas.value.vender = Math.max(0, vendas.value.colhido - vendas.value.vendido)

    // Eficiência
    eficiencia.value.producao = producao.value.total > 0
      ? Math.round((producao.value.realizados / producao.value.total) * 100)
      : 100

    const vendasNaoCanceladas = vendasData.filter(v => v.status !== 'cancelado')
    eficiencia.value.vendas = vendas.value.colhido > 0
      ? Math.round((vendas.value.vendido / vendas.value.colhido) * 100)
      : 100
    eficiencia.value.ticketMedio = vendasNaoCanceladas.length > 0
      ? vendasNaoCanceladas.reduce((sum, v) => sum + (v.valor_total || 0), 0) / vendasNaoCanceladas.length
      : 0

    // Fazendas
    const fazendasData = fazendasRes.data || []
    const producoesAtivas = prods.filter(p => ['planejado', 'germinando', 'vegetacao', 'colhendo'].includes(p.status))

    fazendas.value = fazendasData.map(f => {
      const prodsFazenda = producoesAtivas.filter(p => p.fazenda_id === f.id)
      const alocado = prodsFazenda.reduce((sum, p) => sum + (p.quantidade_bandeja || 0), 0)
      const ocupacao = f.capacidade_bandejas > 0 ? Math.round((alocado / f.capacidade_bandejas) * 100) : 0
      const finalizados = prods.filter(p => p.fazenda_id === f.id && p.status === 'finalizado')
      const totalFazenda = prods.filter(p => p.fazenda_id === f.id)
      const eficienciaProducao = totalFazenda.length > 0
        ? Math.round((finalizados.length / totalFazenda.length) * 100)
        : 0

      return { ...f, alocado, ocupacao, eficienciaProducao }
    })

    // Custos e preços
    const produtos = produtosRes.data || []
    if (produtos.length > 0) {
      const produtosComPreco = produtos.filter(p => p.preco > 0)
      custos.value.precoMedio = produtosComPreco.length > 0
        ? produtosComPreco.reduce((sum, p) => sum + (p.preco || 0), 0) / produtosComPreco.length
        : 0
      custos.value.custoMedio = 0
      custos.value.margemBruta = custos.value.precoMedio > 0 && custos.value.custoMedio > 0
        ? Math.round(((custos.value.precoMedio - custos.value.custoMedio) / custos.value.precoMedio) * 100)
        : 100
    }

    // Eficiência por espécie
    const especies = especiesRes.data || []
    eficienciaPorEspecie.value = especies.map(e => {
      const prodsEspecie = prods.filter(p => p.especie_id === e.id)
      const finalizados = prodsEspecie.filter(p => p.status === 'finalizado')
      const ef = prodsEspecie.length > 0
        ? Math.round((finalizados.length / prodsEspecie.length) * 100)
        : 0
      return { id: e.id, nome: e.nome, eficiencia: ef }
    }).filter(e => e.eficiencia > 0).slice(0, 5)

    // Mais vendidos
    const vendasPorEspecie: Record<string, { id: string; nome: string; quantidade: number }> = {}
    prods.filter(p => p.status === 'finalizado').forEach(p => {
      const especie = especies.find(e => e.id === p.especie_id)
      if (especie) {
        if (!vendasPorEspecie[especie.id]) {
          vendasPorEspecie[especie.id] = { id: especie.id, nome: especie.nome, quantidade: 0 }
        }
        vendasPorEspecie[especie.id].quantidade += p.quantidade_colhida || p.quantidade_bandeja || 0
      }
    })
    maisVendidos.value = Object.values(vendasPorEspecie)
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 5)

    // Margem por espécie
    margemPorEspecie.value = especies.map(e => ({
      id: e.id,
      nome: e.nome,
      margem: 100
    })).slice(0, 5)

    // Vendas mensais
    vendasMensais.value = vendasData.map(v => ({
      data_venda: v.data_venda,
      quantidade_total: (v.venda_itens || []).reduce((s: number, i: any) => s + (i.quantidade || 0), 0)
    }))

  } catch (e: any) {
    console.error('Erro ao carregar dashboard:', e)
  } finally {
    loading.value = false
  }
}

function resetData() {
  metricas.value = { microverdesEntregar: 0, entregasProgramadas: 0, faturamentoPrevisto: 0 }
  producao.value = {
    total: 0, perdas: 0, previstos: 0, realizados: 0, atrasados: 0,
    plantio: { total: 0, perdas: 0, previstos: 0, realizados: 0, atrasados: 0 },
    luz: { total: 0, perdas: 0, previstos: 0, realizados: 0, atrasados: 0 },
    colheita: { total: 0, perdas: 0, previstos: 0, realizados: 0, atrasados: 0 }
  }
  vendas.value = { totalMicroverdes: 0, vendido: 0, vender: 0, colhido: 0, colher: 0 }
  eficiencia.value = { producao: 100, microverdesPorPessoa: 0, vendas: 100, ticketMedio: 0 }
  fazendas.value = []
  custos.value = { custoMedio: 0, precoMedio: 0, margemBruta: 100 }
  eficienciaPorEspecie.value = []
  maisVendidos.value = []
  margemPorEspecie.value = []
  vendasMensais.value = []
  tarefasHoje.value = []
  tarefasAtrasadas.value = []
  proximasColheitas.value = []
}

// Watch
watch(() => selectedCompanyIds.value, () => {
  loadDashboard()
}, { deep: true })

// Lifecycle
onMounted(async () => {
  document.addEventListener('click', handleClickOutside)
  await loadUserCompanies()
  if (selectedCompanyIds.value.length > 0) {
    loadDashboard()
  }
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
