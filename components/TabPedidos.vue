<template>
  <div>
    <!-- Toolbar: Filtros + Ação -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-4 mb-4">
      <!-- Esquerda: Busca + Filtros -->
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
        <!-- Busca -->
        <div class="relative">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 material-icons-outlined text-gray-400 text-base">search</span>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar pedidos..."
            class="input w-full sm:w-64 text-sm pl-9"
          />
        </div>
        <!-- Data Inicial -->
        <input
          type="date"
          v-model="filterDataInicial"
          class="input text-sm w-full sm:w-auto shrink-0"
          placeholder="Data inicial"
        />
        <!-- Data Final -->
        <input
          type="date"
          v-model="filterDataFinal"
          class="input text-sm w-full sm:w-auto shrink-0"
          placeholder="Data final"
        />
        <!-- Filtro Status -->
        <select v-model="filterStatus" class="input text-sm w-full sm:w-auto shrink-0">
          <option value="">Todos status</option>
          <option value="previsto">Previsto</option>
          <option value="reservado">Reservado</option>
          <option value="confirmado">Confirmado</option>
          <option value="finalizado">Finalizado</option>
          <option value="cancelado">Cancelado</option>
        </select>
        <!-- Checkbox Mostrar Finalizados -->
        <label class="flex items-center gap-2 cursor-pointer shrink-0">
          <input
            type="checkbox"
            v-model="mostrarFinalizados"
            class="w-4 h-4 text-primary bg-white border-gray-300 rounded focus:ring-primary dark:bg-gray-800 dark:border-gray-600"
          />
          <span class="text-sm text-subtext-light dark:text-subtext-dark whitespace-nowrap">Mostrar finalizados</span>
        </label>
      </div>
      <!-- Direita: Botão -->
      <button @click="openCadastro" class="btn btn-primary shrink-0 justify-center sm:justify-start">
        <span class="material-icons text-sm">add</span>
        Novo pedido
      </button>
    </div>

    <!-- Card da Tabela -->
    <div class="card">

      <!-- Tabela - Desktop -->
      <div class="hidden md:block overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-100 dark:bg-gray-700/50 border-b border-border-light dark:border-border-dark">
              <th class="table-header">Código</th>
              <th class="table-header">Data Abertura</th>
              <th class="table-header">Previsão Entrega</th>
              <th class="table-header">Responsável</th>
              <th class="table-header">Cliente</th>
              <th class="table-header text-center w-32">Status</th>
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
                  <span v-if="pedidosComProducao.has(pedido.id)" class="material-icons text-xs text-green-500" title="Produção gerada">agriculture</span>
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
                <span v-if="pedidosComProducao.has(pedido.id)" class="material-icons text-xs text-green-500" title="Produção gerada">agriculture</span>
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
        <span class="material-icons text-4xl text-gray-300 dark:text-gray-600 animate-spin">refresh</span>
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
          <span class="material-icons text-sm">add</span>
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
              <span class="material-icons text-sm">chevron_left</span>
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
              <span class="material-icons text-sm">chevron_right</span>
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
        <div v-if="showDetalhes" class="fixed inset-0 z-50 overflow-hidden">
          <div class="fixed inset-0 glass-backdrop" @click="closeDetalhes"></div>

          <div class="fixed inset-y-0 right-0 flex max-w-full">
            <Transition
              enter-active-class="transform transition-transform duration-300 ease-out"
              enter-from-class="translate-x-full"
              enter-to-class="translate-x-0"
              leave-active-class="transform transition-transform duration-200 ease-in"
              leave-from-class="translate-x-0"
              leave-to-class="translate-x-full"
            >
              <div v-if="showDetalhes" class="w-screen max-w-full sm:max-w-xl">
                <div class="h-full flex flex-col glass-panel shadow-2xl">
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
                      <span class="material-icons text-xl">close</span>
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
                        <span class="material-icons text-sm text-green-600">agriculture</span>
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
                          <span class="material-icons text-2xl text-gray-300 animate-spin">refresh</span>
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
                              <span class="material-icons text-sm text-gray-600 dark:text-gray-400">chevron_left</span>
                            </button>
                            <span class="text-xs text-gray-500 dark:text-gray-400">
                              {{ currentPageItens }} / {{ totalPagesItens }}
                            </span>
                            <button
                              @click="currentPageItens = Math.min(totalPagesItens, currentPageItens + 1)"
                              :disabled="currentPageItens === totalPagesItens"
                              class="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <span class="material-icons text-sm text-gray-600 dark:text-gray-400">chevron_right</span>
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
                      <span class="material-icons text-sm">edit</span>
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
import { ref, computed, watch, onMounted } from 'vue'
import { useCurrentCompany } from '~/composables/useCurrentCompany'

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
const filterDataInicial = ref('')
const filterDataFinal = ref('')
const filterStatus = ref('')
const searchQuery = ref('')
const mostrarFinalizados = ref(false)

// Proximo codigo
const proximoCodigo = computed(() => {
  if (pedidos.value.length === 0) return '1000'
  const maxNumero = Math.max(...pedidos.value.map(p => parseInt(p.numero) || 0))
  return String(maxNumero + 1)
})

// Computed
const hasActiveFilters = computed(() => {
  return filterDataInicial.value || filterDataFinal.value || filterStatus.value || searchQuery.value
})

const filteredPedidos = computed(() => {
  let result = [...pedidos.value]

  // Filtro por status finalizado
  if (!mostrarFinalizados.value) {
    result = result.filter(p => p.status !== 'finalizado')
  }

  // Filtro por data inicial
  if (filterDataInicial.value) {
    result = result.filter(p => p.data_pedido >= filterDataInicial.value)
  }

  // Filtro por data final
  if (filterDataFinal.value) {
    result = result.filter(p => p.data_pedido <= filterDataFinal.value)
  }

  // Filtro por status
  if (filterStatus.value) {
    result = result.filter(p => p.status === filterStatus.value)
  }

  // Filtro por cliente (busca)
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(p =>
      p.clientes?.razao_social?.toLowerCase().includes(query) ||
      p.clientes?.nome_fantasia?.toLowerCase().includes(query) ||
      p.numero?.includes(query)
    )
  }

  // Ordenar por data_pedido decrescente
  result.sort((a, b) => new Date(b.data_pedido).getTime() - new Date(a.data_pedido).getTime())

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
watch([searchQuery, filterStatus, filterDataInicial, filterDataFinal, mostrarFinalizados], () => {
  currentPage.value = 1
  pageInput.value = '1'
})

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
</script>
