<template>
  <div>
    <!-- Toolbar: Período + Filtros + Botão -->
    <div class="flex flex-wrap items-center gap-2 sm:gap-3 mb-4">
      <!-- Seletor de Período (Date Range Picker) -->
      <div class="flex items-center gap-1">
        <button @click="periodoAnterior" class="p-1.5 self-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
          <span class="material-icons-outlined text-sm text-subtext-light">chevron_left</span>
        </button>
        <div class="pedidos-date-range-wrapper">
          <VueDatePicker
            v-model="dateRangeModel"
            range
            :preset-dates="presetDates"
            :dark="isDark"
            :enable-time-picker="false"
            auto-apply
            :format="formatDateDisplay"
            locale="pt-BR"
            placeholder="Período..."
            :clearable="false"
            menu-class-name="dp-menu-custom"
            teleport
          />
        </div>
        <button @click="proximoPeriodo" class="p-1.5 self-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
          <span class="material-icons-outlined text-sm text-subtext-light">chevron_right</span>
        </button>
      </div>

      <!-- Filtro Cliente - Multi Select Dropdown -->
      <div class="relative" ref="filtroClienteRef">
        <button
          @click="toggleFiltroCliente"
          class="flex items-center gap-1.5 bg-white dark:bg-gray-800 rounded-lg px-2.5 sm:px-3 h-[34px] sm:h-[38px] border transition-colors"
          :class="filtroClienteAberto ? 'border-primary ring-1 ring-primary' : 'border-border-light dark:border-border-dark hover:border-gray-300 dark:hover:border-gray-500'"
        >
          <span class="material-icons-outlined text-sm text-subtext-light">person_outline</span>
          <span class="text-xs text-text-light dark:text-text-dark whitespace-nowrap max-w-[120px] sm:max-w-[160px] truncate">
            {{ filtroClienteLabel }}
          </span>
          <span v-if="clientesSelecionados.length > 0 && clientesSelecionados.length < clientes.length" class="inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-primary rounded-full">{{ clientesSelecionados.length }}</span>
          <span class="material-icons-outlined text-sm text-subtext-light transition-transform" :class="filtroClienteAberto ? 'rotate-180' : ''">expand_more</span>
        </button>

        <Transition
          enter-active-class="transition duration-150 ease-out"
          enter-from-class="opacity-0 scale-95 -translate-y-1"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition duration-100 ease-in"
          leave-from-class="opacity-100 scale-100 translate-y-0"
          leave-to-class="opacity-0 scale-95 -translate-y-1"
        >
          <div v-if="filtroClienteAberto" class="absolute top-full left-0 mt-1 w-56 sm:w-64 bg-white dark:bg-gray-800 rounded-lg border border-border-light dark:border-border-dark shadow-lg z-30 overflow-hidden">
            <div class="p-2 border-b border-border-light dark:border-border-dark">
              <input
                ref="filtroClienteBuscaRef"
                v-model="filtroClienteBusca"
                type="text"
                placeholder="Buscar cliente..."
                class="w-full px-2.5 py-1.5 text-xs border border-border-light dark:border-border-dark rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-1 focus:ring-primary focus:border-primary text-text-light dark:text-text-dark placeholder-gray-400"
              />
            </div>
            <div class="flex items-center justify-between px-3 py-1.5 border-b border-border-light dark:border-border-dark">
              <button @click="selecionarTodosClientes" class="text-[10px] text-primary hover:text-primary/80 font-medium">Todos</button>
              <button @click="limparFiltroClientes" class="text-[10px] text-subtext-light hover:text-text-light dark:hover:text-text-dark font-medium">Limpar</button>
            </div>
            <div class="max-h-48 overflow-y-auto overscroll-contain">
              <label
                v-for="cliente in clientesFiltrados"
                :key="cliente.id"
                class="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div
                  @click.prevent="toggleCliente(cliente.id)"
                  class="w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors"
                  :class="clientesSelecionados.includes(cliente.id) ? 'border-primary bg-primary' : 'border-gray-300 dark:border-gray-500'"
                >
                  <span v-if="clientesSelecionados.includes(cliente.id)" class="material-icons-outlined text-white" style="font-size: 10px">check</span>
                </div>
                <span class="text-xs text-text-light dark:text-text-dark truncate">{{ cliente.nome_fantasia || cliente.razao_social }}</span>
              </label>
              <div v-if="clientesFiltrados.length === 0" class="px-3 py-4 text-center text-[10px] text-subtext-light">Nenhum cliente encontrado</div>
            </div>
          </div>
        </Transition>
      </div>

      <!-- Filtro Status - Multi Select Dropdown -->
      <div class="relative" ref="filtroStatusRef">
        <button
          @click="toggleFiltroStatus"
          class="flex items-center gap-1.5 bg-white dark:bg-gray-800 rounded-lg px-2.5 sm:px-3 h-[34px] sm:h-[38px] border transition-colors"
          :class="filtroStatusAberto ? 'border-primary ring-1 ring-primary' : 'border-border-light dark:border-border-dark hover:border-gray-300 dark:hover:border-gray-500'"
        >
          <span class="material-icons-outlined text-sm text-subtext-light">filter_list</span>
          <span class="text-xs text-text-light dark:text-text-dark whitespace-nowrap">
            {{ filtroStatusLabel }}
          </span>
          <span
            v-if="statusSelecionados.length > 0 && statusSelecionados.length < opcoesStatus.length"
            class="bg-primary text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-medium"
          >{{ statusSelecionados.length }}</span>
          <span class="material-icons-outlined text-xs text-subtext-light transition-transform" :class="filtroStatusAberto ? 'rotate-180' : ''">expand_more</span>
        </button>

        <Transition enter-active-class="transition ease-out duration-150" enter-from-class="opacity-0 scale-95 -translate-y-1" enter-to-class="opacity-100 scale-100 translate-y-0" leave-active-class="transition ease-in duration-100" leave-from-class="opacity-100 scale-100 translate-y-0" leave-to-class="opacity-0 scale-95 -translate-y-1">
          <div v-if="filtroStatusAberto" class="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-border-light dark:border-border-dark rounded-lg shadow-lg z-50 w-52">
            <div class="flex items-center px-3 py-1.5 border-b border-border-light dark:border-border-dark">
              <button @click="statusSelecionados = opcoesStatus.map(s => s.key)" class="text-[10px] text-primary hover:text-primary/80 font-medium">Todos</button>
            </div>
            <div class="py-1 max-h-[200px] overflow-y-auto">
              <label
                v-for="opcao in opcoesStatus"
                :key="opcao.key"
                class="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
              >
                <div class="w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-colors"
                  :class="statusSelecionados.includes(opcao.key) ? 'bg-primary border-primary' : 'border-gray-300 dark:border-gray-500'"
                >
                  <span v-if="statusSelecionados.includes(opcao.key)" class="material-icons-outlined text-white text-[10px]">check</span>
                </div>
                <input type="checkbox" :checked="statusSelecionados.includes(opcao.key)" @change="toggleStatus(opcao.key)" class="sr-only" />
                <span class="text-xs text-text-light dark:text-text-dark truncate">{{ opcao.label }}</span>
              </label>
            </div>
          </div>
        </Transition>
      </div>

      <!-- Spacer -->
      <div class="flex-1"></div>

      <!-- Botão Novo Pedido -->
      <button @click="openCadastro" class="btn btn-primary text-xs sm:text-sm px-3 sm:px-4 h-[34px] sm:h-[38px]">
        <span class="material-icons-outlined text-sm mr-1">add</span>
        <span class="hidden sm:inline">Novo pedido</span>
        <span class="sm:hidden">Novo</span>
      </button>
    </div>

    <!-- Card da Tabela -->
    <div class="card">

      <!-- Tabela - Desktop -->
      <div class="hidden md:block overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-100 dark:bg-gray-700/50 border-b border-border-light dark:border-border-dark">
              <th class="table-header cursor-pointer select-none hover:text-primary transition-colors" @click="toggleSort('numero')">
                <span class="inline-flex items-center gap-1">Código <span class="material-icons-outlined text-xs" :class="sortColumn === 'numero' ? 'text-primary' : 'text-gray-300 dark:text-gray-600'">{{ sortColumn === 'numero' ? (sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more' }}</span></span>
              </th>
              <th class="table-header cursor-pointer select-none hover:text-primary transition-colors" @click="toggleSort('data_pedido')">
                <span class="inline-flex items-center gap-1">Data Abertura <span class="material-icons-outlined text-xs" :class="sortColumn === 'data_pedido' ? 'text-primary' : 'text-gray-300 dark:text-gray-600'">{{ sortColumn === 'data_pedido' ? (sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more' }}</span></span>
              </th>
              <th class="table-header cursor-pointer select-none hover:text-primary transition-colors" @click="toggleSort('data_entrega')">
                <span class="inline-flex items-center gap-1">Previsão Entrega <span class="material-icons-outlined text-xs" :class="sortColumn === 'data_entrega' ? 'text-primary' : 'text-gray-300 dark:text-gray-600'">{{ sortColumn === 'data_entrega' ? (sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more' }}</span></span>
              </th>
              <th class="table-header cursor-pointer select-none hover:text-primary transition-colors" @click="toggleSort('responsavel')">
                <span class="inline-flex items-center gap-1">Responsável <span class="material-icons-outlined text-xs" :class="sortColumn === 'responsavel' ? 'text-primary' : 'text-gray-300 dark:text-gray-600'">{{ sortColumn === 'responsavel' ? (sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more' }}</span></span>
              </th>
              <th class="table-header cursor-pointer select-none hover:text-primary transition-colors" @click="toggleSort('cliente')">
                <span class="inline-flex items-center gap-1">Cliente <span class="material-icons-outlined text-xs" :class="sortColumn === 'cliente' ? 'text-primary' : 'text-gray-300 dark:text-gray-600'">{{ sortColumn === 'cliente' ? (sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more' }}</span></span>
              </th>
              <th class="table-header text-center w-32 cursor-pointer select-none hover:text-primary transition-colors" @click="toggleSort('status')">
                <span class="inline-flex items-center gap-1 justify-center">Status <span class="material-icons-outlined text-xs" :class="sortColumn === 'status' ? 'text-primary' : 'text-gray-300 dark:text-gray-600'">{{ sortColumn === 'status' ? (sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more' }}</span></span>
              </th>
              <th class="table-header text-center w-16">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-light dark:divide-border-dark">
            <tr
              v-for="pedido in paginatedPedidos"
              :key="pedido.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
              @click="openDetalhes(pedido)"
            >
              <td class="table-cell font-medium text-text-light dark:text-text-dark">
                #{{ pedido.numero }}
              </td>
              <td class="table-cell text-subtext-light dark:text-subtext-dark">
                {{ formatDate(pedido.data_pedido) }}
              </td>
              <td class="table-cell text-subtext-light dark:text-subtext-dark">
                {{ formatDate(pedido.data_entrega) }}
              </td>
              <td class="table-cell text-subtext-light dark:text-subtext-dark">
                {{ pedido.responsavel || '-' }}
              </td>
              <td class="table-cell">
                <div>
                  <p class="text-text-light dark:text-text-dark">{{ pedido.clientes?.razao_social || pedido.clientes?.nome_fantasia || '-' }}</p>
                </div>
              </td>
              <td class="table-cell text-center">
                <div class="flex items-center justify-center gap-1">
                  <span :class="getStatusBadgeClass(pedido.status)">
                    {{ getStatusLabel(pedido.status) }}
                  </span>
                  <span v-if="pedidosComProducao.has(pedido.id)" class="material-icons-outlined text-xs text-green-500" title="Produção gerada">agriculture</span>
                </div>
              </td>
              <td class="table-cell text-center" @click.stop>
                <button
                  @click="openDetalhes(pedido)"
                  class="text-gray-400 hover:text-primary dark:text-gray-500 dark:hover:text-primary transition-colors"
                  title="Ver detalhes"
                >
                  <span class="material-icons-outlined text-xl">chevron_right</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Cards - Mobile -->
      <div class="md:hidden divide-y divide-border-light dark:divide-border-dark">
        <div
          v-for="pedido in paginatedPedidos"
          :key="pedido.id"
          class="p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
          @click="openDetalhes(pedido)"
        >
          <div class="flex items-center gap-3">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <span class="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                  #{{ formatNumero(pedido.numero) }}
                </span>
                <span :class="getStatusBadgeClass(pedido.status)" class="text-[10px] px-1.5 py-0.5">
                  {{ getStatusLabel(pedido.status) }}
                </span>
                <span v-if="pedidosComProducao.has(pedido.id)" class="material-icons-outlined text-xs text-green-500" title="Produção gerada">agriculture</span>
              </div>
              <p class="text-sm font-medium text-text-light dark:text-text-dark truncate">
                {{ pedido.clientes?.razao_social || pedido.clientes?.nome_fantasia || 'Sem cliente' }}
              </p>
              <p class="text-xs text-subtext-light dark:text-subtext-dark mt-0.5">
                {{ formatDate(pedido.data_pedido) }}
                <span v-if="pedido.data_entrega"> · Entrega: {{ formatDate(pedido.data_entrega) }}</span>
              </p>
            </div>
            <button
              @click.stop="openDetalhes(pedido)"
              class="text-gray-400 hover:text-primary transition-colors shrink-0"
            >
              <span class="material-icons-outlined text-xl">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-12">
        <span class="material-icons-outlined text-4xl text-gray-300 dark:text-gray-600 animate-spin">refresh</span>
        <p class="text-sm text-subtext-light dark:text-subtext-dark mt-2">Carregando...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredPedidos.length === 0 && !loading" class="text-center py-12 flex flex-col items-center px-4">
        <span class="material-icons-outlined text-4xl text-gray-300 dark:text-gray-600 mb-2">receipt_long</span>
        <h3 class="text-lg font-medium text-text-light dark:text-text-dark mb-1">Nenhum pedido encontrado</h3>
        <p class="text-sm text-subtext-light dark:text-subtext-dark mb-4">
          {{ hasActiveFilters ? 'Tente ajustar os filtros' : 'Comece criando seu primeiro pedido' }}
        </p>
        <button v-if="!hasActiveFilters" @click="openCadastro" class="btn btn-primary">
          <span class="material-icons-outlined text-sm">add</span>
          Novo pedido
        </button>
      </div>

      <!-- Paginacao -->
      <div v-if="filteredPedidos.length > 0" class="p-3 sm:p-4 border-t border-border-light dark:border-border-dark text-xs text-subtext-light dark:text-subtext-dark">
        <div class="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <div class="flex items-center gap-3 sm:gap-4 w-full sm:w-auto justify-between sm:justify-start">
            <div class="flex items-center gap-2">
              <span class="hidden sm:inline">Mostrar</span>
              <select v-model="itemsPerPage" class="border border-border-light dark:border-border-dark rounded px-2 py-1 bg-white dark:bg-gray-800 text-xs sm:text-sm cursor-pointer">
                <option :value="10">10</option>
                <option :value="25">25</option>
                <option :value="50">50</option>
              </select>
            </div>
            <span class="text-xs">{{ filteredPedidos.length }} registros</span>
          </div>
          <div class="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto justify-center sm:justify-end">
            <button
              @click="currentPage--"
              :disabled="currentPage === 1"
              class="p-1 border border-border-light dark:border-border-dark rounded hover:bg-gray-50 dark:hover:bg-gray-800 bg-white dark:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span class="material-icons-outlined text-sm">chevron_left</span>
            </button>
            <span class="hidden xs:inline">Página</span>
            <input
              v-model="pageInput"
              type="text"
              class="w-10 sm:w-12 text-center border border-border-light dark:border-border-dark rounded px-1 sm:px-2 py-1 bg-white dark:bg-gray-800 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              @keyup.enter="goToPage"
              @blur="goToPage"
            />
            <span>de {{ totalPages }}</span>
            <button
              @click="currentPage++"
              :disabled="currentPage === totalPages"
              class="p-1 border border-border-light dark:border-border-dark rounded hover:bg-gray-50 dark:hover:bg-gray-800 bg-white dark:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span class="material-icons-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Slideover de Detalhes -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-300 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-200 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="showDetalhes" class="fixed inset-0 z-[80] overflow-y-auto">
          <div class="fixed inset-0 glass-backdrop" @click="closeDetalhes"></div>

          <div class="flex min-h-full items-center justify-center p-2 sm:p-4">
            <Transition
              enter-active-class="transition-all duration-200 ease-out"
              enter-from-class="opacity-0 scale-95"
              enter-to-class="opacity-100 scale-100"
              leave-active-class="transition-all duration-150 ease-in"
              leave-from-class="opacity-100 scale-100"
              leave-to-class="opacity-0 scale-95"
            >
              <div v-if="showDetalhes" class="relative z-[81] w-full max-w-2xl">
                <div class="flex flex-col glass-panel rounded-xl shadow-2xl max-h-[90vh] overflow-hidden">
                  <!-- Header -->
                  <div class="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100 dark:border-border-dark flex items-center justify-between gap-3">
                    <div class="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                      <div class="w-10 h-10 sm:w-14 sm:h-14 rounded-xl bg-primary/10 flex items-center justify-center text-sm sm:text-lg font-bold text-primary shrink-0">
                        <span class="material-icons-outlined text-xl sm:text-2xl">receipt_long</span>
                      </div>
                      <div class="min-w-0 flex-1">
                        <h2 class="text-base sm:text-lg font-semibold text-gray-900 dark:text-text-dark">
                          Pedido #{{ selectedPedido?.numero }}
                        </h2>
                        <p class="text-xs sm:text-sm text-gray-500 dark:text-subtext-dark truncate">
                          {{ selectedPedido?.clientes?.razao_social || selectedPedido?.clientes?.nome_fantasia || 'Sem cliente' }}
                        </p>
                      </div>
                    </div>
                    <button @click="closeDetalhes" class="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shrink-0">
                      <span class="material-icons-outlined text-xl">close</span>
                    </button>
                  </div>

                  <!-- Tabs -->
                  <div class="border-b border-gray-200 dark:border-gray-700">
                    <nav class="flex -mb-px overflow-x-auto no-scrollbar">
                      <button
                        @click="activeTab = 'pedido'"
                        :class="[
                          'px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
                          activeTab === 'pedido'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                        ]"
                      >
                        Pedido
                      </button>
                      <button
                        @click="activeTab = 'dados'"
                        :class="[
                          'px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
                          activeTab === 'dados'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                        ]"
                      >
                        Dados Gerais
                      </button>
                      <button
                        @click="activeTab = 'financeiro'"
                        :class="[
                          'px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
                          activeTab === 'financeiro'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                        ]"
                      >
                        Financeiro
                      </button>
                      <button
                        @click="activeTab = 'entrega'"
                        :class="[
                          'px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
                          activeTab === 'entrega'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                        ]"
                      >
                        Entrega
                      </button>
                    </nav>
                  </div>

                  <!-- Body -->
                  <div class="flex-1 overflow-y-auto">
                    <!-- Tab: Pedido -->
                    <div v-if="activeTab === 'pedido'" class="p-4 sm:p-6 space-y-5 sm:space-y-6">
                      <!-- Status -->
                      <div class="flex flex-wrap items-center justify-between gap-2">
                        <div class="flex items-center gap-2">
                          <span :class="getStatusBadgeClass(selectedPedido?.status)">
                            {{ getStatusLabel(selectedPedido?.status) }}
                          </span>
                        </div>
                        <button
                          @click="openAlterarStatus"
                          class="text-sm text-primary hover:underline"
                        >
                          Alterar status
                        </button>
                      </div>

                      <div v-if="selectedPedido && pedidosComProducao.has(selectedPedido.id)" class="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <span class="material-icons-outlined text-sm text-green-600">agriculture</span>
                        <span class="text-xs text-green-700 dark:text-green-400 font-medium">Produção já gerada para este pedido</span>
                      </div>

                      <!-- Informações do Pedido -->
                      <div class="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 sm:p-5">
                        <h3 class="text-xs font-semibold text-gray-500 dark:text-subtext-dark uppercase tracking-wider mb-3 sm:mb-4">Informações</h3>
                        <div class="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4">
                          <div>
                            <p class="text-xs text-gray-500 dark:text-subtext-dark mb-1">Data de abertura</p>
                            <p class="text-sm font-medium text-gray-900 dark:text-text-dark">{{ formatDate(selectedPedido?.data_pedido) }}</p>
                          </div>
                          <div>
                            <p class="text-xs text-gray-500 dark:text-subtext-dark mb-1">Previsão de entrega</p>
                            <p class="text-sm font-medium text-gray-900 dark:text-text-dark">{{ formatDate(selectedPedido?.data_entrega) || '-' }}</p>
                          </div>
                          <div>
                            <p class="text-xs text-gray-500 dark:text-subtext-dark mb-1">Responsável</p>
                            <p class="text-sm font-medium text-gray-900 dark:text-text-dark">{{ selectedPedido?.responsavel || '-' }}</p>
                          </div>
                          <div>
                            <p class="text-xs text-gray-500 dark:text-subtext-dark mb-1">Valor total</p>
                            <p class="text-sm font-medium text-gray-900 dark:text-text-dark">{{ formatCurrency(selectedPedido?.valor_total) }}</p>
                          </div>
                        </div>
                      </div>

                      <!-- Itens do Pedido -->
                      <div>
                        <div class="flex items-center justify-between mb-4">
                          <div class="flex items-center gap-2">
                            <h3 class="text-sm font-semibold text-gray-900 dark:text-text-dark">Itens do pedido</h3>
                            <span class="text-xs text-gray-500 dark:text-subtext-dark bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                              {{ pedidoItens.length }}
                            </span>
                          </div>
                        </div>

                        <div v-if="loadingItens" class="text-center py-8">
                          <span class="material-icons-outlined text-2xl text-gray-300 animate-spin">refresh</span>
                        </div>

                        <div v-else-if="pedidoItens.length === 0" class="text-center py-8 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                          <span class="material-icons-outlined text-3xl text-gray-300 dark:text-gray-600 mb-2">inventory_2</span>
                          <p class="text-sm text-gray-500 dark:text-subtext-dark">Nenhum item neste pedido</p>
                        </div>

                        <div v-else class="space-y-2">
                          <div v-for="item in paginatedItens" :key="item.id" class="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                            <div class="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary shrink-0">
                              {{ item.quantidade }}
                            </div>
                            <div class="flex-1 min-w-0">
                              <p class="text-xs sm:text-sm font-medium text-gray-900 dark:text-text-dark truncate">{{ item.produtos?.nome || '-' }}</p>
                              <p class="text-[10px] sm:text-xs text-gray-500 dark:text-subtext-dark">
                                {{ formatCurrency(item.valor_unitario) }} / un
                              </p>
                            </div>
                            <span class="text-xs sm:text-sm font-medium text-gray-900 dark:text-text-dark whitespace-nowrap">
                              {{ formatCurrency(item.quantidade * item.valor_unitario) }}
                            </span>
                          </div>

                          <!-- Paginação dos Itens -->
                          <div v-if="totalPagesItens > 1" class="flex items-center justify-center gap-2 mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                            <button
                              @click="currentPageItens = Math.max(1, currentPageItens - 1)"
                              :disabled="currentPageItens === 1"
                              class="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <span class="material-icons-outlined text-sm text-gray-600 dark:text-gray-400">chevron_left</span>
                            </button>
                            <span class="text-xs text-gray-500 dark:text-gray-400">
                              {{ currentPageItens }} / {{ totalPagesItens }}
                            </span>
                            <button
                              @click="currentPageItens = Math.min(totalPagesItens, currentPageItens + 1)"
                              :disabled="currentPageItens === totalPagesItens"
                              class="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <span class="material-icons-outlined text-sm text-gray-600 dark:text-gray-400">chevron_right</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      <!-- Ações Rápidas -->
                      <div class="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 sm:p-5">
                        <h3 class="text-xs font-semibold text-gray-500 dark:text-subtext-dark uppercase tracking-wider mb-3 sm:mb-4">Ações</h3>
                        <div class="space-y-2">
                          <button
                            v-if="selectedPedido?.status === 'confirmado'"
                            @click="openGerarProducao"
                            class="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors text-left"
                          >
                            <span class="material-icons-outlined text-green-600">agriculture</span>
                            <div class="flex-1">
                              <span class="text-sm text-green-700 dark:text-green-400 font-medium">Gerar Produção</span>
                              <p class="text-[10px] text-gray-500 dark:text-gray-400">Criar planos de produção para este pedido</p>
                            </div>
                          </button>
                          <button
                            @click="openAlteracao"
                            class="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white dark:hover:bg-gray-700 transition-colors text-left"
                          >
                            <span class="material-icons-outlined text-gray-400">edit</span>
                            <span class="text-sm text-gray-700 dark:text-gray-300">Alterar pedido</span>
                          </button>
                          <button
                            @click="openAlterarStatus"
                            class="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white dark:hover:bg-gray-700 transition-colors text-left"
                          >
                            <span class="material-icons-outlined text-gray-400">sync</span>
                            <span class="text-sm text-gray-700 dark:text-gray-300">Alterar status</span>
                          </button>
                          <button
                            @click="emitirNF"
                            class="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white dark:hover:bg-gray-700 transition-colors text-left"
                          >
                            <span class="material-icons-outlined text-gray-400">description</span>
                            <span class="text-sm text-gray-700 dark:text-gray-300">Emitir NF</span>
                          </button>
                          <button
                            @click="confirmDelete"
                            class="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
                          >
                            <span class="material-icons-outlined text-red-500">delete</span>
                            <span class="text-sm text-red-600 dark:text-red-400">Excluir pedido</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <!-- Tab: Dados Gerais -->
                    <div v-if="activeTab === 'dados'" class="p-4 sm:p-6 space-y-5 sm:space-y-6">
                      <!-- Informações da Empresa -->
                      <div>
                        <h3 class="text-xs font-semibold text-gray-500 dark:text-subtext-dark uppercase tracking-wider mb-3">Informações da Empresa</h3>
                        <div class="space-y-3">
                          <div>
                            <p class="text-xs text-gray-500 dark:text-subtext-dark mb-0.5">CNPJ</p>
                            <p class="text-sm font-medium text-gray-900 dark:text-text-dark">{{ formatCnpjCpf(selectedPedido?.clientes?.cnpj_cpf) }}</p>
                          </div>
                          <div>
                            <p class="text-xs text-gray-500 dark:text-subtext-dark mb-0.5">Razão social</p>
                            <p class="text-sm font-medium text-gray-900 dark:text-text-dark">{{ selectedPedido?.clientes?.razao_social || '-' }}</p>
                          </div>
                          <div>
                            <p class="text-xs text-gray-500 dark:text-subtext-dark mb-0.5">Nome fantasia</p>
                            <p class="text-sm font-medium text-gray-900 dark:text-text-dark">{{ selectedPedido?.clientes?.nome_fantasia || '-' }}</p>
                          </div>
                        </div>
                      </div>

                      <div class="border-t border-gray-200 dark:border-gray-700"></div>

                      <!-- Endereço -->
                      <div>
                        <h3 class="text-xs font-semibold text-gray-500 dark:text-subtext-dark uppercase tracking-wider mb-3">Endereço</h3>
                        <div class="space-y-3">
                          <div>
                            <p class="text-xs text-gray-500 dark:text-subtext-dark mb-0.5">CEP</p>
                            <p class="text-sm font-medium text-gray-900 dark:text-text-dark">{{ formatCep(selectedPedido?.clientes?.cep) }}</p>
                          </div>
                          <div>
                            <p class="text-xs text-gray-500 dark:text-subtext-dark mb-0.5">Logradouro</p>
                            <p class="text-sm font-medium text-gray-900 dark:text-text-dark">{{ selectedPedido?.clientes?.logradouro || '-' }}</p>
                          </div>
                          <div class="grid grid-cols-2 gap-3">
                            <div>
                              <p class="text-xs text-gray-500 dark:text-subtext-dark mb-0.5">Número</p>
                              <p class="text-sm font-medium text-gray-900 dark:text-text-dark">{{ selectedPedido?.clientes?.numero || '-' }}</p>
                            </div>
                            <div>
                              <p class="text-xs text-gray-500 dark:text-subtext-dark mb-0.5">Complemento</p>
                              <p class="text-sm font-medium text-gray-900 dark:text-text-dark">{{ selectedPedido?.clientes?.complemento || '-' }}</p>
                            </div>
                          </div>
                          <div>
                            <p class="text-xs text-gray-500 dark:text-subtext-dark mb-0.5">Cidade</p>
                            <p class="text-sm font-medium text-gray-900 dark:text-text-dark">
                              {{ selectedPedido?.clientes?.cidade || '-' }}{{ selectedPedido?.clientes?.estado ? ' / ' + selectedPedido?.clientes?.estado : '' }}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div class="border-t border-gray-200 dark:border-gray-700"></div>

                      <!-- Contato -->
                      <div>
                        <h3 class="text-xs font-semibold text-gray-500 dark:text-subtext-dark uppercase tracking-wider mb-3">Contato</h3>
                        <div class="space-y-3">
                          <div>
                            <p class="text-xs text-gray-500 dark:text-subtext-dark mb-0.5">Telefone / Celular</p>
                            <p class="text-sm font-medium text-gray-900 dark:text-text-dark">{{ selectedPedido?.clientes?.telefone || '-' }}</p>
                          </div>
                          <div>
                            <p class="text-xs text-gray-500 dark:text-subtext-dark mb-0.5">E-mail</p>
                            <p class="text-sm font-medium text-gray-900 dark:text-text-dark">{{ selectedPedido?.clientes?.email || '-' }}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Tab: Financeiro -->
                    <div v-if="activeTab === 'financeiro'" class="p-4 sm:p-6 space-y-5 sm:space-y-6">
                      <!-- Responsável Financeiro -->
                      <div>
                        <h3 class="text-xs font-semibold text-gray-500 dark:text-subtext-dark uppercase tracking-wider mb-3">Responsável Financeiro</h3>
                        <div class="space-y-3">
                          <div>
                            <p class="text-xs text-gray-500 dark:text-subtext-dark mb-0.5">Responsável</p>
                            <p class="text-sm font-medium text-gray-900 dark:text-text-dark">{{ selectedPedido?.clientes?.responsavel_financeiro || '-' }}</p>
                          </div>
                          <div>
                            <p class="text-xs text-gray-500 dark:text-subtext-dark mb-0.5">E-mail Responsável Financeiro</p>
                            <p class="text-sm font-medium text-gray-900 dark:text-text-dark">{{ selectedPedido?.clientes?.email_financeiro || '-' }}</p>
                          </div>
                          <div>
                            <p class="text-xs text-gray-500 dark:text-subtext-dark mb-0.5">Telefone Responsável Financeiro</p>
                            <p class="text-sm font-medium text-gray-900 dark:text-text-dark">{{ selectedPedido?.clientes?.telefone_financeiro || '-' }}</p>
                          </div>
                        </div>
                      </div>

                      <div class="border-t border-gray-200 dark:border-gray-700"></div>

                      <!-- Preferências de Pagamento -->
                      <div>
                        <h3 class="text-xs font-semibold text-gray-500 dark:text-subtext-dark uppercase tracking-wider mb-3">Preferências de Pagamento</h3>
                        <div class="space-y-3">
                          <div class="flex items-center justify-between">
                            <p class="text-sm text-gray-700 dark:text-gray-300">Pix</p>
                            <span :class="selectedPedido?.clientes?.pagamento_pix ? 'text-primary' : 'text-red-500'" class="text-sm font-medium">
                              {{ selectedPedido?.clientes?.pagamento_pix ? 'Sim' : 'Não' }}
                            </span>
                          </div>
                          <div class="flex items-center justify-between">
                            <p class="text-sm text-gray-700 dark:text-gray-300">Boleto</p>
                            <span :class="selectedPedido?.clientes?.pagamento_boleto ? 'text-primary' : 'text-red-500'" class="text-sm font-medium">
                              {{ selectedPedido?.clientes?.pagamento_boleto ? 'Sim' : 'Não' }}
                            </span>
                          </div>
                          <div class="flex items-center justify-between">
                            <p class="text-sm text-gray-700 dark:text-gray-300">Cartão</p>
                            <span :class="selectedPedido?.clientes?.pagamento_cartao ? 'text-primary' : 'text-red-500'" class="text-sm font-medium">
                              {{ selectedPedido?.clientes?.pagamento_cartao ? 'Sim' : 'Não' }}
                            </span>
                          </div>
                          <div>
                            <p class="text-xs text-gray-500 dark:text-subtext-dark mb-0.5">Observações</p>
                            <p class="text-sm font-medium text-gray-900 dark:text-text-dark">{{ selectedPedido?.clientes?.observacoes_financeiro || '-' }}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Tab: Entrega -->
                    <div v-if="activeTab === 'entrega'" class="p-4 sm:p-6 space-y-5 sm:space-y-6">
                      <!-- Responsável pelo Pedido -->
                      <div>
                        <h3 class="text-xs font-semibold text-gray-500 dark:text-subtext-dark uppercase tracking-wider mb-3">Responsável pelo Pedido</h3>
                        <div class="space-y-3">
                          <div>
                            <p class="text-xs text-gray-500 dark:text-subtext-dark mb-0.5">Nome</p>
                            <p class="text-sm font-medium text-gray-900 dark:text-text-dark">{{ selectedPedido?.clientes?.responsavel_pedido || '-' }}</p>
                          </div>
                          <div>
                            <p class="text-xs text-gray-500 dark:text-subtext-dark mb-0.5">E-mail</p>
                            <p class="text-sm font-medium text-gray-900 dark:text-text-dark">{{ selectedPedido?.clientes?.email_pedido || '-' }}</p>
                          </div>
                          <div>
                            <p class="text-xs text-gray-500 dark:text-subtext-dark mb-0.5">Telefone</p>
                            <p class="text-sm font-medium text-gray-900 dark:text-text-dark">{{ selectedPedido?.clientes?.telefone_pedido || '-' }}</p>
                          </div>
                        </div>
                      </div>

                      <div class="border-t border-gray-200 dark:border-gray-700"></div>

                      <!-- Endereço de Entrega -->
                      <div>
                        <h3 class="text-xs font-semibold text-gray-500 dark:text-subtext-dark uppercase tracking-wider mb-3">Endereço de Entrega</h3>
                        <div class="space-y-3">
                          <div>
                            <p class="text-xs text-gray-500 dark:text-subtext-dark mb-0.5">CEP</p>
                            <p class="text-sm font-medium text-gray-900 dark:text-text-dark">{{ formatCep(selectedPedido?.clientes?.cep_entrega) }}</p>
                          </div>
                          <div>
                            <p class="text-xs text-gray-500 dark:text-subtext-dark mb-0.5">Logradouro</p>
                            <p class="text-sm font-medium text-gray-900 dark:text-text-dark">{{ selectedPedido?.clientes?.logradouro_entrega || '-' }}</p>
                          </div>
                          <div class="grid grid-cols-2 gap-3">
                            <div>
                              <p class="text-xs text-gray-500 dark:text-subtext-dark mb-0.5">Número</p>
                              <p class="text-sm font-medium text-gray-900 dark:text-text-dark">{{ selectedPedido?.clientes?.numero_entrega || '-' }}</p>
                            </div>
                            <div>
                              <p class="text-xs text-gray-500 dark:text-subtext-dark mb-0.5">Complemento</p>
                              <p class="text-sm font-medium text-gray-900 dark:text-text-dark">{{ selectedPedido?.clientes?.complemento_entrega || '-' }}</p>
                            </div>
                          </div>
                          <div>
                            <p class="text-xs text-gray-500 dark:text-subtext-dark mb-0.5">Cidade</p>
                            <p class="text-sm font-medium text-gray-900 dark:text-text-dark">
                              {{ selectedPedido?.clientes?.cidade_entrega || '-' }}{{ selectedPedido?.clientes?.estado_entrega ? ' / ' + selectedPedido?.clientes?.estado_entrega : '' }}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div class="border-t border-gray-200 dark:border-gray-700"></div>

                      <!-- Preferências de Entrega -->
                      <div>
                        <h3 class="text-xs font-semibold text-gray-500 dark:text-subtext-dark uppercase tracking-wider mb-3">Preferências de Entrega</h3>
                        <div class="space-y-3">
                          <div>
                            <p class="text-xs text-gray-500 dark:text-subtext-dark mb-0.5">Dia(s) da Semana</p>
                            <p class="text-sm font-medium text-gray-900 dark:text-text-dark">{{ getDiasEntrega(selectedPedido?.clientes) }}</p>
                          </div>
                          <div>
                            <p class="text-xs text-gray-500 dark:text-subtext-dark mb-0.5">Horário Turno Manhã</p>
                            <p class="text-sm font-medium text-gray-900 dark:text-text-dark">{{ formatHorario(selectedPedido?.clientes?.hora_manha_inicio, selectedPedido?.clientes?.hora_manha_fim) }}</p>
                          </div>
                          <div>
                            <p class="text-xs text-gray-500 dark:text-subtext-dark mb-0.5">Horário Turno Tarde</p>
                            <p class="text-sm font-medium text-gray-900 dark:text-text-dark">{{ formatHorario(selectedPedido?.clientes?.hora_tarde_inicio, selectedPedido?.clientes?.hora_tarde_fim) }}</p>
                          </div>
                          <div>
                            <p class="text-xs text-gray-500 dark:text-subtext-dark mb-0.5">Observações</p>
                            <p class="text-sm font-medium text-gray-900 dark:text-text-dark">{{ selectedPedido?.clientes?.observacoes_entrega || '-' }}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Footer -->
                  <div class="px-4 sm:px-6 py-4 border-t border-gray-100 dark:border-border-dark">
                    <button @click="openAlteracao" class="w-full btn btn-primary justify-center">
                      <span class="material-icons-outlined text-sm">edit</span>
                      Editar pedido
                    </button>
                  </div>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Modal Cadastro -->
    <ModalCadastroPedido
      v-if="showCadastro"
      :clientes="clientes"
      :produtos="produtos"
      :tabelas-preco="tabelasPreco"
      :proximo-codigo="proximoCodigo"
      @close="closeCadastro"
      @save="handleSavePedido"
      @refresh-tabelas="loadTabelasPreco"
    />

    <!-- Modal Editar Pedido -->
    <ModalEditarPedido
      v-if="showAlteracao"
      :pedido="selectedPedido"
      :itens="pedidoItens"
      :clientes="clientes"
      :produtos="produtos"
      :tabelas-preco="tabelasPreco"
      @close="closeAlteracao"
      @save="handleUpdatePedido"
      @refresh-tabelas="loadTabelasPreco"
    />

    <!-- Modal Alterar Status -->
    <ModalAlterarStatusPedido
      v-if="showAlterarStatus"
      :pedido="selectedPedido"
      @close="closeAlterarStatus"
      @save="handleChangeStatus"
    />

    <!-- Modal Confirmacao Exclusao -->
    <ModalConfirmacao
      v-if="showConfirmDelete"
      title="Excluir pedido"
      :message="`Deseja realmente excluir o pedido #${selectedPedido?.numero}? Esta ação não pode ser desfeita.`"
      confirm-text="Excluir"
      confirm-class="bg-red-600 hover:bg-red-700 text-white"
      @close="showConfirmDelete = false"
      @confirm="handleDelete"
    />

    <!-- Modal Gerar Produção -->
    <ModalCadastroProducao
      v-if="showProducaoModal"
      :pedido-id="producaoParaPedido"
      @close="closeGerarProducao"
      @save="handleProducaoGerada"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, onBeforeUnmount, nextTick } from 'vue'
import VueDatePicker from '@vuepic/vue-datepicker'
import { useCurrentCompany } from '~/composables/useCurrentCompany'

const route = useRoute()
const router = useRouter()
const { gerarCascadeFromPedido, cancelarCascadePedido } = useAutoCascade()

interface Cliente {
  id: string
  razao_social: string
  nome_fantasia: string | null
  cnpj_cpf: string | null
  telefone: string | null
  email: string | null
  // Endereço
  cep: string | null
  logradouro: string | null
  numero: string | null
  complemento: string | null
  bairro: string | null
  cidade: string | null
  estado: string | null
  // Financeiro
  responsavel_financeiro: string | null
  email_financeiro: string | null
  telefone_financeiro: string | null
  pagamento_pix: boolean
  pagamento_boleto: boolean
  pagamento_cartao: boolean
  observacoes_financeiro: string | null
  // Entrega
  responsavel_pedido: string | null
  email_pedido: string | null
  telefone_pedido: string | null
  cep_entrega: string | null
  logradouro_entrega: string | null
  numero_entrega: string | null
  complemento_entrega: string | null
  bairro_entrega: string | null
  cidade_entrega: string | null
  estado_entrega: string | null
  dia_segunda: boolean
  dia_terca: boolean
  dia_quarta: boolean
  dia_quinta: boolean
  dia_sexta: boolean
  hora_manha_inicio: string | null
  hora_manha_fim: string | null
  hora_tarde_inicio: string | null
  hora_tarde_fim: string | null
  observacoes_entrega: string | null
}

interface Produto {
  id: string
  codigo: string
  nome: string
  preco_padrao: number | null
}

interface TabelaPreco {
  id: string
  nome: string
}

interface PedidoItem {
  id?: string
  pedido_id?: string
  produto_id: string
  quantidade: number
  valor_unitario: number
  valor_total: number
  produtos?: Produto
}

interface Pedido {
  id: string
  empresa_id: string
  cliente_id: string | null
  numero: string
  data_pedido: string
  data_entrega: string | null
  status: string
  valor_total: number | null
  observacoes: string | null
  responsavel: string | null
  tabela_preco_id: string | null
  logistica: string | null
  documento: string | null
  valor_frete: number | null
  tipo: string | null
  nota_fiscal: string | null
  valor_nf: number | null
  created_at: string
  updated_at: string
  clientes?: Cliente
}

const supabase = useSupabaseClient()
const { currentCompany } = useCurrentCompany()
const { success, error: showError } = useToast()

// Estado
const pedidos = ref<Pedido[]>([])
const clientes = ref<Cliente[]>([])
const produtos = ref<Produto[]>([])
const tabelasPreco = ref<TabelaPreco[]>([])
const pedidoItens = ref<PedidoItem[]>([])
const loading = ref(false)
const loadingItens = ref(false)
const saving = ref(false)

// Modais e Slideovers
const showDetalhes = ref(false)
const showCadastro = ref(false)
const showAlteracao = ref(false)
const showAlterarStatus = ref(false)
const showConfirmDelete = ref(false)
const showProducaoModal = ref(false)
const producaoParaPedido = ref<string | null>(null)
const pedidosComProducao = ref<Set<string>>(new Set())
const selectedPedido = ref<Pedido | null>(null)

// Aba ativa no slideover de detalhes
const activeTab = ref<'pedido' | 'dados' | 'financeiro' | 'entrega'>('pedido')

// Paginacao
const currentPage = ref(1)
const itemsPerPage = ref(10)
const pageInput = ref('1')

// Paginacao dos itens no slideover
const currentPageItens = ref(1)
const itensPerPage = 5

// Filtros

// Periodo (date range)
function getInicioSemana(d: Date): string {
  const date = new Date(d)
  const day = date.getDay()
  const diff = day === 0 ? 6 : day - 1
  date.setDate(date.getDate() - diff)
  return date.toISOString().split('T')[0]
}

function getFimSemana(d: Date): string {
  const date = new Date(d)
  const day = date.getDay()
  const diff = day === 0 ? 0 : 7 - day
  date.setDate(date.getDate() + diff)
  return date.toISOString().split('T')[0]
}

const periodo = ref({
  inicio: getInicioSemana(new Date()),
  fim: getFimSemana(new Date())
})

const dateRangeModel = ref<Date[]>([
  new Date(periodo.value.inicio + 'T00:00:00'),
  new Date(periodo.value.fim + 'T00:00:00')
])

const isDark = ref(false)

const presetDates = computed(() => {
  const today = new Date()
  const startThisWeek = new Date(getInicioSemana(today) + 'T00:00:00')
  const endThisWeek = new Date(getFimSemana(today) + 'T00:00:00')
  const lastWeekStart = new Date(startThisWeek)
  lastWeekStart.setDate(lastWeekStart.getDate() - 7)
  const lastWeekEnd = new Date(endThisWeek)
  lastWeekEnd.setDate(lastWeekEnd.getDate() - 7)
  const startThisMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const endThisMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
  const startLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
  const endLastMonth = new Date(today.getFullYear(), today.getMonth(), 0)
  return [
    { label: 'Esta semana', value: [startThisWeek, endThisWeek] },
    { label: 'Semana passada', value: [lastWeekStart, lastWeekEnd] },
    { label: 'Este mês', value: [startThisMonth, endThisMonth] },
    { label: 'Mês passado', value: [startLastMonth, endLastMonth] },
  ]
})

function formatDateDisplay(dates: Date[]) {
  if (!dates || dates.length < 2) return ''
  const fmt = (d: Date) => {
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const yy = String(d.getFullYear()).slice(2)
    return `${dd}/${mm}/${yy}`
  }
  return `${fmt(dates[0])} - ${fmt(dates[1])}`
}

function periodoAnterior() {
  const inicio = new Date(periodo.value.inicio + 'T00:00:00')
  const fim = new Date(periodo.value.fim + 'T00:00:00')
  const dias = Math.round((fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)) + 1
  inicio.setDate(inicio.getDate() - dias)
  fim.setDate(fim.getDate() - dias)
  periodo.value.inicio = inicio.toISOString().split('T')[0]
  periodo.value.fim = fim.toISOString().split('T')[0]
  dateRangeModel.value = [inicio, fim]
}

function proximoPeriodo() {
  const inicio = new Date(periodo.value.inicio + 'T00:00:00')
  const fim = new Date(periodo.value.fim + 'T00:00:00')
  const dias = Math.round((fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)) + 1
  inicio.setDate(inicio.getDate() + dias)
  fim.setDate(fim.getDate() + dias)
  periodo.value.inicio = inicio.toISOString().split('T')[0]
  periodo.value.fim = fim.toISOString().split('T')[0]
  dateRangeModel.value = [inicio, fim]
}

watch(dateRangeModel, (val) => {
  if (val && val.length === 2 && val[0] && val[1]) {
    periodo.value.inicio = new Date(val[0]).toISOString().split('T')[0]
    periodo.value.fim = new Date(val[1]).toISOString().split('T')[0]
  }
})

// Filtro Cliente
const clientesSelecionados = ref<string[]>([])
const filtroClienteAberto = ref(false)
const filtroClienteBusca = ref('')
const filtroClienteRef = ref<HTMLElement | null>(null)
const filtroClienteBuscaRef = ref<HTMLInputElement | null>(null)

const filtroClienteLabel = computed(() => {
  if (clientesSelecionados.value.length === 0) return 'Todos clientes'
  if (clientesSelecionados.value.length === clientes.value.length) return 'Todos clientes'
  if (clientesSelecionados.value.length === 1) {
    const c = clientes.value.find(cl => cl.id === clientesSelecionados.value[0])
    return c?.nome_fantasia || c?.razao_social || 'Cliente'
  }
  return `${clientesSelecionados.value.length} clientes`
})

const clientesFiltrados = computed(() => {
  const busca = filtroClienteBusca.value.toLowerCase()
  if (!busca) return clientes.value
  return clientes.value.filter(c =>
    (c.nome_fantasia || '').toLowerCase().includes(busca) ||
    c.razao_social.toLowerCase().includes(busca)
  )
})

function toggleFiltroCliente() {
  filtroClienteAberto.value = !filtroClienteAberto.value
  if (filtroClienteAberto.value) {
    filtroClienteBusca.value = ''
    nextTick(() => filtroClienteBuscaRef.value?.focus())
  }
}

function toggleCliente(id: string) {
  const idx = clientesSelecionados.value.indexOf(id)
  if (idx >= 0) {
    clientesSelecionados.value.splice(idx, 1)
  } else {
    clientesSelecionados.value.push(id)
  }
}

function selecionarTodosClientes() {
  clientesSelecionados.value = clientes.value.map(c => c.id)
}

function limparFiltroClientes() {
  clientesSelecionados.value = []
}

function onClickOutsideFiltroCliente(e: MouseEvent) {
  if (filtroClienteRef.value && !filtroClienteRef.value.contains(e.target as Node)) {
    filtroClienteAberto.value = false
  }
}

// Filtro Status (multiselect)
const opcoesStatus = [
  { key: 'previsto', label: 'Previsto' },
  { key: 'reservado', label: 'Reservado' },
  { key: 'confirmado', label: 'Confirmado' },
  { key: 'em_producao', label: 'Em Produção' },
  { key: 'finalizado', label: 'Finalizado' },
  { key: 'cancelado', label: 'Cancelado' },
]
const statusSelecionados = ref<string[]>(opcoesStatus.filter(s => s.key !== 'finalizado' && s.key !== 'cancelado').map(s => s.key))
const filtroStatusAberto = ref(false)
const filtroStatusRef = ref<HTMLElement | null>(null)

const filtroStatusLabel = computed(() => {
  if (statusSelecionados.value.length === 0) return 'Nenhum status'
  if (statusSelecionados.value.length === opcoesStatus.length) return 'Todos status'
  if (statusSelecionados.value.length === 1) {
    return opcoesStatus.find(s => s.key === statusSelecionados.value[0])?.label || 'Status'
  }
  return `${statusSelecionados.value.length} status`
})

function toggleFiltroStatus() {
  filtroStatusAberto.value = !filtroStatusAberto.value
}

function toggleStatus(key: string) {
  const idx = statusSelecionados.value.indexOf(key)
  if (idx >= 0) {
    if (statusSelecionados.value.length <= 1) return
    statusSelecionados.value.splice(idx, 1)
  } else {
    statusSelecionados.value.push(key)
  }
}

function onClickOutsideFiltroStatus(e: MouseEvent) {
  if (filtroStatusRef.value && !filtroStatusRef.value.contains(e.target as Node)) {
    filtroStatusAberto.value = false
  }
}

// Ordenação
const sortColumn = ref<string>('data_pedido')
const sortDir = ref<'asc' | 'desc'>('desc')

function toggleSort(col: string) {
  if (sortColumn.value === col) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortColumn.value = col
    sortDir.value = col === 'numero' ? 'asc' : 'desc'
  }
  currentPage.value = 1
}

// Proximo codigo
const proximoCodigo = computed(() => {
  if (pedidos.value.length === 0) return '1000'
  const maxNumero = Math.max(...pedidos.value.map(p => parseInt(p.numero) || 0))
  return String(maxNumero + 1)
})

// Computed
const hasActiveFilters = computed(() => {
  return clientesSelecionados.value.length < clientes.value.length || statusSelecionados.value.length < opcoesStatus.length
})

const filteredPedidos = computed(() => {
  let result = [...pedidos.value]

  // Filtro por período (data_entrega dentro do range)
  if (periodo.value.inicio) {
    result = result.filter(p => (p.data_entrega || p.data_pedido) >= periodo.value.inicio)
  }
  if (periodo.value.fim) {
    result = result.filter(p => (p.data_entrega || p.data_pedido) <= periodo.value.fim)
  }

  // Filtro por status (multiselect)
  if (statusSelecionados.value.length > 0 && statusSelecionados.value.length < opcoesStatus.length) {
    result = result.filter(p => statusSelecionados.value.includes(p.status))
  }

  // Filtro por cliente (multiselect)
  if (clientesSelecionados.value.length > 0 && clientesSelecionados.value.length < clientes.value.length) {
    result = result.filter(p => p.cliente_id && clientesSelecionados.value.includes(p.cliente_id))
  }


  // Ordenação dinâmica
  const col = sortColumn.value
  const dir = sortDir.value === 'asc' ? 1 : -1
  result.sort((a, b) => {
    let valA: any, valB: any
    switch (col) {
      case 'numero':
        valA = parseInt(a.numero) || 0
        valB = parseInt(b.numero) || 0
        break
      case 'data_pedido':
        valA = a.data_pedido || ''
        valB = b.data_pedido || ''
        break
      case 'data_entrega':
        valA = a.data_entrega || ''
        valB = b.data_entrega || ''
        break
      case 'responsavel':
        valA = (a.responsavel || '').toLowerCase()
        valB = (b.responsavel || '').toLowerCase()
        break
      case 'cliente':
        valA = (a.clientes?.nome_fantasia || a.clientes?.razao_social || '').toLowerCase()
        valB = (b.clientes?.nome_fantasia || b.clientes?.razao_social || '').toLowerCase()
        break
      case 'status':
        valA = a.status || ''
        valB = b.status || ''
        break
      default:
        valA = a.data_pedido || ''
        valB = b.data_pedido || ''
    }
    if (valA < valB) return -1 * dir
    if (valA > valB) return 1 * dir
    return 0
  })

  return result
})

const totalPages = computed(() => Math.ceil(filteredPedidos.value.length / itemsPerPage.value) || 1)

const paginatedPedidos = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  return filteredPedidos.value.slice(start, start + itemsPerPage.value)
})

const totalPagesItens = computed(() => Math.ceil(pedidoItens.value.length / itensPerPage) || 1)

const paginatedItens = computed(() => {
  const start = (currentPageItens.value - 1) * itensPerPage
  return pedidoItens.value.slice(start, start + itensPerPage)
})

// Watchers
watch([statusSelecionados, clientesSelecionados, periodo], () => {
  currentPage.value = 1
  pageInput.value = '1'
}, { deep: true })

watch(itemsPerPage, () => {
  currentPage.value = 1
  pageInput.value = '1'
})

watch(currentPage, (newVal) => {
  pageInput.value = String(newVal)
})

// Funcoes auxiliares
function goToPage() {
  const page = parseInt(pageInput.value)
  if (!isNaN(page) && page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  } else {
    pageInput.value = String(currentPage.value)
  }
}

function formatDate(dateString: string | null): string {
  if (!dateString) return '-'
  return new Date(dateString + 'T00:00:00').toLocaleDateString('pt-BR')
}

function formatNumero(numero: string | null): string {
  if (!numero) return '-'
  // Se for um numero curto (ate 6 caracteres), mostra completo
  if (numero.length <= 6) return numero
  // Se comecar com PED-, remove e abrevia
  if (numero.startsWith('PED-')) {
    const num = numero.slice(4)
    if (num.length <= 6) return num
    return num.slice(-6)
  }
  // Caso contrario, mostra os ultimos 6 caracteres
  return numero.slice(-6)
}

function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function formatCnpjCpf(value: string | null): string {
  if (!value) return '-'
  const cleaned = value.replace(/\D/g, '')
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  } else if (cleaned.length === 14) {
    return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  }
  return value
}

function formatCep(value: string | null): string {
  if (!value) return '-'
  const cleaned = value.replace(/\D/g, '')
  if (cleaned.length === 8) {
    return cleaned.replace(/(\d{5})(\d{3})/, '$1-$2')
  }
  return value
}

function getDiasEntrega(cliente: Cliente | undefined): string {
  if (!cliente) return '-'
  const dias = []
  if (cliente.dia_segunda) dias.push('Seg')
  if (cliente.dia_terca) dias.push('Ter')
  if (cliente.dia_quarta) dias.push('Qua')
  if (cliente.dia_quinta) dias.push('Qui')
  if (cliente.dia_sexta) dias.push('Sex')
  return dias.length > 0 ? dias.join(', ') : '-'
}

function formatHorario(inicio: string | null, fim: string | null): string {
  if (!inicio && !fim) return '-'
  const i = inicio || '00:00'
  const f = fim || '00:00'
  return `${i} até às ${f}`
}

function getStatusLabel(status: string | undefined): string {
  if (!status) return '-'
  const labels: Record<string, string> = {
    previsto: 'Previsto',
    reservado: 'Reservado',
    confirmado: 'Confirmado',
    finalizado: 'Finalizado',
    cancelado: 'Cancelado'
  }
  return labels[status] || status
}

function getStatusBadgeClass(status: string | undefined): string {
  if (!status) return 'badge badge-inactive'
  const classes: Record<string, string> = {
    previsto: 'badge badge-inactive',
    reservado: 'badge badge-warning',
    confirmado: 'badge badge-success',
    finalizado: 'badge badge-info',
    cancelado: 'badge badge-danger'
  }
  return classes[status] || 'badge badge-inactive'
}

// Carregar dados
async function loadPedidos() {
  if (!currentCompany.value?.id) {
    pedidos.value = []
    return
  }

  loading.value = true
  try {
    const { data, error } = await supabase
      .from('pedidos')
      .select(`*, clientes(
        id, razao_social, nome_fantasia, cnpj_cpf, telefone, email,
        cep, logradouro, numero, complemento, bairro, cidade, estado,
        responsavel_financeiro, email_financeiro, telefone_financeiro,
        pagamento_pix, pagamento_boleto, pagamento_cartao, observacoes_financeiro,
        responsavel_pedido, email_pedido, telefone_pedido,
        cep_entrega, logradouro_entrega, numero_entrega, complemento_entrega,
        bairro_entrega, cidade_entrega, estado_entrega,
        dia_segunda, dia_terca, dia_quarta, dia_quinta, dia_sexta,
        hora_manha_inicio, hora_manha_fim, hora_tarde_inicio, hora_tarde_fim,
        observacoes_entrega
      )`)
      .eq('empresa_id', currentCompany.value.id)
      .order('data_pedido', { ascending: false })

    if (error) throw error
    pedidos.value = data || []
  } catch (e: any) {
    console.error('Erro ao carregar pedidos:', e)
    showError('Erro ao carregar pedidos')
  } finally {
    loading.value = false
  }
}

async function loadClientes() {
  if (!currentCompany.value?.id) return

  try {
    const { data, error } = await supabase
      .from('clientes')
      .select('id, razao_social, nome_fantasia, telefone')
      .eq('empresa_id', currentCompany.value.id)
      .eq('ativo', true)
      .order('razao_social')

    if (error) throw error
    clientes.value = data || []
    clientesSelecionados.value = clientes.value.map(c => c.id)
  } catch (e: any) {
    console.error('Erro ao carregar clientes:', e)
  }
}

async function loadProdutos() {
  if (!currentCompany.value?.id) return

  try {
    const { data, error } = await supabase
      .from('produtos')
      .select('id, codigo, nome, preco_padrao')
      .eq('empresa_id', currentCompany.value.id)
      .eq('ativo', true)
      .order('nome')

    if (error) throw error
    produtos.value = data || []
  } catch (e: any) {
    console.error('Erro ao carregar produtos:', e)
  }
}

async function loadTabelasPreco() {
  if (!currentCompany.value?.id) return

  try {
    const { data, error } = await supabase
      .from('tabelas_preco')
      .select('id, nome')
      .eq('empresa_id', currentCompany.value.id)
      .eq('ativo', true)
      .order('nome')

    if (error) throw error
    tabelasPreco.value = data || []
  } catch (e: any) {
    console.error('Erro ao carregar tabelas de preco:', e)
    tabelasPreco.value = []
  }
}

async function loadPedidoItens(pedidoId: string) {
  loadingItens.value = true
  currentPageItens.value = 1
  try {
    const { data, error } = await supabase
      .from('pedido_itens')
      .select('*, produtos(id, codigo, nome)')
      .eq('pedido_id', pedidoId)
      .order('created_at')

    if (error) throw error
    pedidoItens.value = data || []
  } catch (e: any) {
    console.error('Erro ao carregar itens:', e)
    pedidoItens.value = []
  } finally {
    loadingItens.value = false
  }
}

// Slideover Detalhes
async function openDetalhes(pedido: Pedido) {
  selectedPedido.value = pedido
  activeTab.value = 'pedido'
  showDetalhes.value = true
  await loadPedidoItens(pedido.id)
}

function closeDetalhes() {
  showDetalhes.value = false
  selectedPedido.value = null
  pedidoItens.value = []
  activeTab.value = 'pedido'
}

// Slideover Cadastro
function openCadastro() {
  showCadastro.value = true
}

function closeCadastro() {
  showCadastro.value = false
}

async function handleSavePedido(pedidoData: any) {
  if (!currentCompany.value?.id) {
    showError('Nenhuma empresa selecionada')
    return
  }

  saving.value = true
  try {
    // Criar pedido
    const { data: novoPedido, error: pedidoError } = await supabase
      .from('pedidos')
      .insert({
        empresa_id: currentCompany.value.id,
        numero: pedidoData.numero,
        data_pedido: new Date().toISOString().split('T')[0],
        data_entrega: pedidoData.data_entrega || null,
        cliente_id: pedidoData.cliente_id || null,
        tabela_preco_id: pedidoData.tabela_preco_id || null,
        status: 'previsto',
        valor_total: pedidoData.valor_total || 0
      })
      .select()
      .single()

    if (pedidoError) throw pedidoError

    // Criar itens
    if (pedidoData.itens && pedidoData.itens.length > 0) {
      const itensToInsert = pedidoData.itens.map((item: any) => ({
        pedido_id: novoPedido.id,
        produto_id: item.produto_id,
        quantidade: item.quantidade,
        valor_unitario: item.valor_unitario,
        valor_total: item.quantidade * item.valor_unitario
      }))

      const { error: itensError } = await supabase
        .from('pedido_itens')
        .insert(itensToInsert)

      if (itensError) throw itensError
    }

    // Auto-gerar plantios, tarefas e colheitas
    try {
      await gerarCascadeFromPedido(novoPedido.id)
    } catch (err) {
      console.error('Erro ao gerar cascade:', err)
      // Don't block the order save - cascade is supplementary
    }

    success('Pedido criado com sucesso')
    closeCadastro()
    await loadPedidos()
  } catch (e: any) {
    console.error('Erro ao criar pedido:', e)
    showError(e.message || 'Erro ao criar pedido')
  } finally {
    saving.value = false
  }
}

// Slideover Alteracao
function openAlteracao() {
  showDetalhes.value = false
  showAlteracao.value = true
}

function closeAlteracao() {
  showAlteracao.value = false
  selectedPedido.value = null
  pedidoItens.value = []
}

async function handleUpdatePedido(pedidoData: any) {
  if (!currentCompany.value?.id || !selectedPedido.value?.id) {
    showError('Erro ao atualizar pedido')
    return
  }

  saving.value = true
  try {
    // Atualizar pedido
    const { error: pedidoError } = await supabase
      .from('pedidos')
      .update({
        data_entrega: pedidoData.data_entrega || null,
        cliente_id: pedidoData.cliente_id || null,
        tabela_preco_id: pedidoData.tabela_preco_id || null,
        status: pedidoData.status,
        valor_total: pedidoData.valor_total || 0,
        logistica: pedidoData.logistica || null,
        documento: pedidoData.documento || null,
        valor_frete: pedidoData.valor_frete || null,
        tipo: pedidoData.tipo || null,
        nota_fiscal: pedidoData.nota_fiscal || null,
        valor_nf: pedidoData.valor_nf || null
      })
      .eq('id', selectedPedido.value.id)
      .eq('empresa_id', currentCompany.value.id)

    if (pedidoError) throw pedidoError

    // Deletar itens antigos
    await supabase
      .from('pedido_itens')
      .delete()
      .eq('pedido_id', selectedPedido.value.id)

    // Criar novos itens
    if (pedidoData.itens && pedidoData.itens.length > 0) {
      const itensToInsert = pedidoData.itens.map((item: any) => ({
        pedido_id: selectedPedido.value!.id,
        produto_id: item.produto_id,
        quantidade: item.quantidade,
        valor_unitario: item.valor_unitario,
        valor_total: item.quantidade * item.valor_unitario
      }))

      const { error: itensError } = await supabase
        .from('pedido_itens')
        .insert(itensToInsert)

      if (itensError) throw itensError
    }

    // Recriar cascade (cancela antigo e gera novo)
    try {
      await cancelarCascadePedido(selectedPedido.value!.id)
      await gerarCascadeFromPedido(selectedPedido.value!.id)
    } catch (err) {
      console.error('Erro ao atualizar cascade:', err)
    }

    success('Pedido atualizado com sucesso')
    closeAlteracao()
    await loadPedidos()
  } catch (e: any) {
    console.error('Erro ao atualizar pedido:', e)
    showError(e.message || 'Erro ao atualizar pedido')
  } finally {
    saving.value = false
  }
}

// Modal Alterar Status
function openAlterarStatus() {
  showAlterarStatus.value = true
}

function closeAlterarStatus() {
  showAlterarStatus.value = false
}

async function handleChangeStatus(novoStatus: string) {
  if (!currentCompany.value?.id || !selectedPedido.value?.id) return

  saving.value = true
  try {
    const { error } = await supabase
      .from('pedidos')
      .update({ status: novoStatus })
      .eq('id', selectedPedido.value.id)
      .eq('empresa_id', currentCompany.value.id)

    if (error) throw error

    success(`Status alterado para ${getStatusLabel(novoStatus)}`)
    closeAlterarStatus()

    // Atualizar pedido selecionado
    if (selectedPedido.value) {
      selectedPedido.value = { ...selectedPedido.value, status: novoStatus }
    }

    await loadPedidos()
  } catch (e: any) {
    console.error('Erro ao alterar status:', e)
    showError('Erro ao alterar status')
  } finally {
    saving.value = false
  }
}

// Emitir NF (placeholder)
function emitirNF() {
  showError('Funcionalidade de emissão de NF em desenvolvimento')
}

// Excluir
function confirmDelete() {
  showConfirmDelete.value = true
}

async function handleDelete() {
  if (!currentCompany.value?.id || !selectedPedido.value?.id) return

  saving.value = true
  try {
    // Deletar itens primeiro
    await supabase
      .from('pedido_itens')
      .delete()
      .eq('pedido_id', selectedPedido.value.id)

    // Deletar pedido
    const { error } = await supabase
      .from('pedidos')
      .delete()
      .eq('id', selectedPedido.value.id)
      .eq('empresa_id', currentCompany.value.id)

    if (error) throw error

    success('Pedido excluído com sucesso')
    showConfirmDelete.value = false
    closeDetalhes()
    await loadPedidos()
  } catch (e: any) {
    console.error('Erro ao excluir pedido:', e)
    showError('Erro ao excluir pedido')
  } finally {
    saving.value = false
  }
}

// Gerar Produção
function openGerarProducao() {
  if (!selectedPedido.value) return
  producaoParaPedido.value = selectedPedido.value.id
  showDetalhes.value = false
  showProducaoModal.value = true
}

function closeGerarProducao() {
  showProducaoModal.value = false
  producaoParaPedido.value = null
}

async function handleProducaoGerada() {
  closeGerarProducao()
  success('Produção gerada com sucesso!')
  await loadPedidosComProducao()
}

async function loadPedidosComProducao() {
  if (!currentCompany.value?.id) return
  try {
    const { data } = await supabase
      .from('producao_pedidos')
      .select('pedido_item_id, pedido_itens!inner(pedido_id)')

    if (data) {
      const ids = new Set<string>()
      data.forEach((pp: any) => {
        if (pp.pedido_itens?.pedido_id) {
          ids.add(pp.pedido_itens.pedido_id)
        }
      })
      pedidosComProducao.value = ids
    }
  } catch (e) {
    console.error('Erro ao carregar produção dos pedidos:', e)
  }
}

// Watch
watch(
  () => currentCompany.value?.id,
  (newId, oldId) => {
    if (newId !== oldId) {
      currentPage.value = 1
      pageInput.value = '1'
      loadPedidos()
      loadClientes()
      loadProdutos()
      loadTabelasPreco()
      loadPedidosComProducao()
    }
  },
  { immediate: true }
)

// Abrir pedido via query param (?pedido=<id>)
watch(
  () => route.query.pedido,
  (pedidoId) => {
    if (pedidoId && typeof pedidoId === 'string' && pedidos.value.length > 0) {
      const pedido = pedidos.value.find(p => p.id === pedidoId)
      if (pedido) {
        openDetalhes(pedido)
        router.replace({ query: {} })
      }
    }
  }
)

watch(
  () => pedidos.value.length,
  () => {
    const pedidoId = route.query.pedido
    if (pedidoId && typeof pedidoId === 'string') {
      const pedido = pedidos.value.find(p => p.id === pedidoId)
      if (pedido) {
        openDetalhes(pedido)
        router.replace({ query: {} })
      }
    }
  }
)

// Lifecycle
onMounted(() => {
  document.addEventListener('click', onClickOutsideFiltroCliente)
  document.addEventListener('click', onClickOutsideFiltroStatus)

  // Dark mode detection para datepicker
  isDark.value = document.documentElement.classList.contains('dark')
  const darkObserver = new MutationObserver(() => {
    isDark.value = document.documentElement.classList.contains('dark')
  })
  darkObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
  onBeforeUnmount(() => darkObserver.disconnect())
})

onUnmounted(() => {
  document.removeEventListener('click', onClickOutsideFiltroCliente)
  document.removeEventListener('click', onClickOutsideFiltroStatus)
})
</script>

<style>
/* VueDatePicker — BiomaOS theme (unscoped para afetar popup teleportado) */

/* ---------- Input ---------- */
.pedidos-date-range-wrapper {
  min-width: 200px;
  max-width: 240px;
}

.pedidos-date-range-wrapper .dp__input_wrap .dp__input {
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 0.8rem;
  font-weight: 500;
  padding: 0.35rem 0.5rem 0.35rem 2rem;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  background: #fff;
  color: #333;
  height: 34px;
  transition: all 0.15s ease;
}

@media (min-width: 640px) {
  .pedidos-date-range-wrapper .dp__input_wrap .dp__input {
    height: 38px;
  }
}

.pedidos-date-range-wrapper .dp__input_wrap .dp__input:hover {
  border-color: #549E54;
}

.pedidos-date-range-wrapper .dp__input_wrap .dp__input:focus,
.pedidos-date-range-wrapper .dp__input_wrap .dp__input.dp__input_focus {
  border-color: #549E54;
  box-shadow: 0 0 0 2px rgba(84, 158, 84, 0.15);
}

.dark .pedidos-date-range-wrapper .dp__input_wrap .dp__input {
  background: #2a2a2a;
  border-color: #404040;
  color: #e0e0e0;
}

.dark .pedidos-date-range-wrapper .dp__input_wrap .dp__input:hover {
  border-color: #549E54;
}

.dark .pedidos-date-range-wrapper .dp__input_wrap .dp__input:focus,
.dark .pedidos-date-range-wrapper .dp__input_wrap .dp__input.dp__input_focus {
  border-color: #549E54;
  box-shadow: 0 0 0 2px rgba(84, 158, 84, 0.2);
}

/* ---------- Input icon ---------- */
.pedidos-date-range-wrapper .dp__input_icon {
  color: #549E54;
}

.dark .pedidos-date-range-wrapper .dp__input_icon {
  color: #86efac;
}
</style>
