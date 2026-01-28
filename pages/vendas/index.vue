<template>
  <div>
    <!-- Header com Titulo e Botao -->
    <div class="flex items-center justify-between mb-3 sm:mb-4">
      <h1 class="text-lg sm:text-xl font-semibold text-text-light dark:text-text-dark">Vendas</h1>
      <button @click="openRegistrarModal" class="btn btn-primary text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2">
        <span class="material-icons text-xs sm:text-sm mr-1">add</span>
        <span class="hidden sm:inline">Registrar pedido</span>
        <span class="sm:hidden">Novo</span>
      </button>
    </div>

    <!-- Periodo e Metricas - Layout responsivo -->
    <div class="flex flex-col gap-2 sm:gap-3 mb-3 sm:mb-4">
      <!-- Linha 1: Período (sempre visível e centralizado no mobile) -->
      <div class="flex justify-center sm:justify-start">
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-border-light dark:border-border-dark px-3 py-1.5 flex items-center gap-2">
          <span class="text-xs text-subtext-light dark:text-subtext-dark hidden sm:inline">Período</span>
          <div class="flex items-center">
            <button @click="periodoAnterior" class="p-1 sm:p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
              <span class="material-icons text-base sm:text-sm text-subtext-light">chevron_left</span>
            </button>
            <span class="text-xs font-medium text-text-light dark:text-text-dark whitespace-nowrap px-1 sm:px-1">
              {{ formatDateShort(periodo.inicio) }} - {{ formatDateShort(periodo.fim) }}
            </span>
            <button @click="proximoPeriodo" class="p-1 sm:p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
              <span class="material-icons text-base sm:text-sm text-subtext-light">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Linha 2: Métricas em grid responsivo -->
      <div class="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3">
        <!-- Faturamento -->
        <div class="col-span-2 sm:col-span-1 bg-white dark:bg-gray-800 rounded-lg border border-border-light dark:border-border-dark px-2 sm:px-3 py-1.5 flex items-center gap-2">
          <div class="w-0.5 h-5 sm:h-6 bg-primary rounded-full"></div>
          <div class="flex items-center gap-1 sm:gap-2 flex-1 min-w-0">
            <span class="text-[10px] sm:text-xs text-subtext-light dark:text-subtext-dark whitespace-nowrap">Faturamento</span>
            <span class="text-xs sm:text-xs font-bold text-primary truncate">{{ formatCurrency(metricas.faturamento) }}</span>
          </div>
        </div>

        <!-- Total Microverdes -->
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-border-light dark:border-border-dark px-2 sm:px-3 py-1.5 flex items-center gap-2">
          <div class="w-0.5 h-5 sm:h-6 bg-gray-400 rounded-full"></div>
          <div class="flex items-center gap-1 sm:gap-2">
            <span class="text-[10px] sm:text-xs text-subtext-light dark:text-subtext-dark whitespace-nowrap">Total</span>
            <span class="text-xs font-bold text-text-light dark:text-text-dark">{{ metricas.totalMicroverdes }}</span>
          </div>
        </div>

        <!-- Vendido -->
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-border-light dark:border-border-dark px-2 sm:px-3 py-1.5 flex items-center gap-2">
          <div class="w-0.5 h-5 sm:h-6 bg-green-500 rounded-full"></div>
          <div class="flex items-center gap-1 sm:gap-2">
            <span class="text-[10px] sm:text-xs text-subtext-light dark:text-subtext-dark">Vendido</span>
            <span class="text-xs font-bold" :class="metricas.vendido.quantidade > 0 ? 'text-green-600' : 'text-text-light dark:text-text-dark'">{{ metricas.vendido.quantidade }}</span>
            <span class="text-[10px] sm:text-xs text-green-600">{{ metricas.vendido.percentual }}%</span>
          </div>
        </div>

        <!-- Vender -->
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-border-light dark:border-border-dark px-2 sm:px-3 py-1.5 flex items-center gap-2">
          <div class="w-0.5 h-5 sm:h-6 bg-yellow-500 rounded-full"></div>
          <div class="flex items-center gap-1 sm:gap-2">
            <span class="text-[10px] sm:text-xs text-subtext-light dark:text-subtext-dark">Vender</span>
            <span class="text-xs font-bold text-yellow-600">{{ metricas.vender.quantidade }}</span>
            <span class="text-[10px] sm:text-xs text-yellow-600">{{ metricas.vender.percentual }}%</span>
          </div>
        </div>

        <!-- Colhido -->
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-border-light dark:border-border-dark px-2 sm:px-3 py-1.5 flex items-center gap-2">
          <div class="w-0.5 h-5 sm:h-6 bg-green-500 rounded-full"></div>
          <div class="flex items-center gap-1 sm:gap-2">
            <span class="text-[10px] sm:text-xs text-subtext-light dark:text-subtext-dark">Colhido</span>
            <span class="text-xs font-bold text-green-600">{{ metricas.colhido.quantidade }}</span>
            <span class="text-[10px] sm:text-xs text-green-600">{{ metricas.colhido.percentual }}%</span>
          </div>
        </div>

        <!-- Colher -->
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-border-light dark:border-border-dark px-2 sm:px-3 py-1.5 flex items-center gap-2">
          <div class="w-0.5 h-5 sm:h-6 rounded-full" :class="metricas.colher.quantidade > 0 ? 'bg-red-500' : 'bg-gray-300'"></div>
          <div class="flex items-center gap-1 sm:gap-2">
            <span class="text-[10px] sm:text-xs text-subtext-light dark:text-subtext-dark">Colher</span>
            <span class="text-xs font-bold" :class="metricas.colher.quantidade > 0 ? 'text-red-600' : 'text-text-light dark:text-text-dark'">{{ metricas.colher.quantidade }}</span>
            <span class="text-[10px] sm:text-xs" :class="metricas.colher.quantidade > 0 ? 'text-red-600' : 'text-subtext-light'">{{ metricas.colher.percentual }}%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Filtro Cliente e Toggles - Responsivo -->
    <div class="flex flex-wrap items-center gap-2 sm:gap-4 mb-3 sm:mb-4">
      <!-- Filtro Cliente -->
      <div class="bg-white dark:bg-gray-800 rounded-lg px-2 sm:px-3 py-1.5 border border-border-light dark:border-border-dark flex items-center gap-2 flex-1 sm:flex-initial min-w-0">
        <span class="material-icons text-sm text-subtext-light sm:hidden">search</span>
        <span class="text-xs text-subtext-light dark:text-subtext-dark hidden sm:inline">Cliente</span>
        <input
          type="text"
          v-model="filtroCliente"
          placeholder="Buscar cliente..."
          class="px-2 py-1 text-xs border border-border-light dark:border-border-dark rounded bg-gray-50 dark:bg-gray-700 w-full sm:w-32 focus:ring-1 focus:ring-primary focus:border-primary"
        />
      </div>

      <!-- Toggles Container -->
      <div class="flex items-center gap-2">
        <!-- Toggle Visualizar Inventario -->
        <label class="flex items-center gap-1.5 sm:gap-2 cursor-pointer bg-white dark:bg-gray-800 rounded-lg px-2 sm:px-3 py-1.5 border border-border-light dark:border-border-dark">
          <div class="relative">
            <input type="checkbox" v-model="showInventario" class="sr-only peer" />
            <div class="w-7 sm:w-8 h-3.5 sm:h-4 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-2.5 sm:after:h-3 after:w-2.5 sm:after:w-3 after:transition-all peer-checked:bg-primary"></div>
          </div>
          <span class="text-[10px] sm:text-xs text-text-light dark:text-text-dark whitespace-nowrap">
            <span class="hidden sm:inline">Visualizar </span>Inventário
          </span>
        </label>

        <!-- Toggle Visualizar Colher -->
        <label class="flex items-center gap-1.5 sm:gap-2 cursor-pointer bg-white dark:bg-gray-800 rounded-lg px-2 sm:px-3 py-1.5 border border-border-light dark:border-border-dark">
          <div class="relative">
            <input type="checkbox" v-model="showColher" class="sr-only peer" />
            <div class="w-7 sm:w-8 h-3.5 sm:h-4 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-2.5 sm:after:h-3 after:w-2.5 sm:after:w-3 after:transition-all peer-checked:bg-primary"></div>
          </div>
          <span class="text-[10px] sm:text-xs text-text-light dark:text-text-dark whitespace-nowrap">
            <span class="hidden sm:inline">Visualizar </span>Colher
          </span>
        </label>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="p-8 text-center">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
      <p class="mt-2 text-subtext-light dark:text-subtext-dark">Carregando dados...</p>
    </div>

    <!-- Matriz de Produtos e Entregas Previstas - Container com scroll sincronizado -->
    <div v-if="!loading && produtosAtivos.length > 0" class="mb-3 sm:mb-4">
      <!-- Matriz de Produtos -->
      <div ref="matrizScrollRef" class="overflow-x-auto scrollbar-hide" @scroll="syncScroll('matriz')" style="-ms-overflow-style: none; scrollbar-width: none;">
        <div class="inline-flex flex-col min-w-full gap-1 sm:gap-1.5">
          <!-- Header com códigos dos produtos -->
          <div class="flex items-center text-[10px] sm:text-xs bg-background-light dark:bg-background-dark py-1.5 sm:py-2 rounded-lg border border-transparent">
            <div class="w-[120px] sm:w-[280px] min-w-[120px] sm:min-w-[280px] shrink-0 px-2 sm:px-3 sticky left-0 bg-background-light dark:bg-background-dark z-10">&nbsp;</div>
            <div class="w-4 sm:w-6 shrink-0"></div>
            <div
              v-for="produto in produtosAtivos"
              :key="produto.id"
              class="w-10 sm:w-14 shrink-0 px-0.5 sm:px-1 text-center font-medium text-subtext-light dark:text-subtext-dark"
              :title="produto.nome"
            >
              {{ produto.codigo }}
            </div>
          </div>

          <!-- Vendido -->
          <div class="flex items-center text-[10px] sm:text-xs bg-white dark:bg-gray-800 rounded-lg border border-border-light dark:border-border-dark py-1.5 sm:py-2">
            <div class="w-[80px] sm:w-[200px] shrink-0 px-2 sm:px-3 text-text-light dark:text-text-dark font-medium sticky left-0 bg-white dark:bg-gray-800 z-10">Vendido</div>
            <div class="w-[40px] sm:w-[80px] shrink-0 px-0.5 sm:px-1 text-center font-bold text-green-600 sticky left-[80px] sm:left-[200px] bg-white dark:bg-gray-800 z-10">{{ getTotalMatriz('vendido') }}</div>
            <div class="w-4 sm:w-6 shrink-0"></div>
            <div
              v-for="produto in produtosAtivos"
              :key="produto.id"
              class="w-10 sm:w-14 shrink-0 px-0.5 sm:px-1 text-center"
              :class="getMatrizValue(produto.codigo, 'vendido') > 0 ? 'text-green-600 font-medium' : 'text-gray-300'"
            >
              {{ getMatrizValue(produto.codigo, 'vendido') || 0 }}
            </div>
          </div>

          <!-- Vender -->
          <div class="flex items-center text-[10px] sm:text-xs bg-white dark:bg-gray-800 rounded-lg border border-border-light dark:border-border-dark py-1.5 sm:py-2">
            <div class="w-[80px] sm:w-[200px] shrink-0 px-2 sm:px-3 text-text-light dark:text-text-dark font-medium sticky left-0 bg-white dark:bg-gray-800 z-10">Vender</div>
            <div class="w-[40px] sm:w-[80px] shrink-0 px-0.5 sm:px-1 text-center font-bold text-yellow-600 sticky left-[80px] sm:left-[200px] bg-white dark:bg-gray-800 z-10">{{ getTotalMatriz('vender') }}</div>
            <div class="w-4 sm:w-6 shrink-0"></div>
            <div
              v-for="produto in produtosAtivos"
              :key="produto.id"
              class="w-10 sm:w-14 shrink-0 px-0.5 sm:px-1 text-center"
              :class="getMatrizValue(produto.codigo, 'vender') > 0 ? 'text-yellow-600 font-medium' : 'text-gray-300'"
            >
              {{ getMatrizValue(produto.codigo, 'vender') || 0 }}
            </div>
          </div>

          <!-- Colhido (condicional - showInventario) -->
          <div v-if="showInventario" class="flex items-center text-[10px] sm:text-xs bg-white dark:bg-gray-800 rounded-lg border border-border-light dark:border-border-dark py-1.5 sm:py-2">
            <div class="w-[80px] sm:w-[200px] shrink-0 px-2 sm:px-3 text-text-light dark:text-text-dark font-medium sticky left-0 bg-white dark:bg-gray-800 z-10">Colhido</div>
            <div class="w-[40px] sm:w-[80px] shrink-0 px-0.5 sm:px-1 text-center font-bold text-green-600 sticky left-[80px] sm:left-[200px] bg-white dark:bg-gray-800 z-10">{{ getTotalMatriz('colhido') }}</div>
            <div class="w-4 sm:w-6 shrink-0"></div>
            <div
              v-for="produto in produtosAtivos"
              :key="produto.id"
              class="w-10 sm:w-14 shrink-0 px-0.5 sm:px-1 text-center"
              :class="getColhidoClass(produto.codigo)"
            >
              {{ getMatrizValue(produto.codigo, 'colhido') || 0 }}
            </div>
          </div>

          <!-- Colher (condicional - showColher) -->
          <div v-if="showColher" class="flex items-center text-[10px] sm:text-xs bg-white dark:bg-gray-800 rounded-lg border border-border-light dark:border-border-dark py-1.5 sm:py-2">
            <div class="w-[80px] sm:w-[200px] shrink-0 px-2 sm:px-3 text-text-light dark:text-text-dark font-medium sticky left-0 bg-white dark:bg-gray-800 z-10">Colher</div>
            <div class="w-[40px] sm:w-[80px] shrink-0 px-0.5 sm:px-1 text-center font-bold sticky left-[80px] sm:left-[200px] bg-white dark:bg-gray-800 z-10" :class="getTotalMatriz('colher') > 0 ? 'text-red-600' : 'text-gray-300'">{{ getTotalMatriz('colher') }}</div>
            <div class="w-4 sm:w-6 shrink-0"></div>
            <div
              v-for="produto in produtosAtivos"
              :key="produto.id"
              class="w-10 sm:w-14 shrink-0 px-0.5 sm:px-1 text-center"
              :class="getMatrizValue(produto.codigo, 'colher') > 0 ? 'text-red-600 font-medium' : 'text-gray-300'"
            >
              {{ getMatrizValue(produto.codigo, 'colher') || 0 }}
            </div>
          </div>
        </div>
      </div>

      <!-- Entregas Previstas -->
      <div class="mt-3 sm:mt-4">
        <div v-if="entregasPorData.length === 0" class="text-center py-4 sm:py-6 bg-white dark:bg-gray-800 rounded-lg border border-border-light dark:border-border-dark">
          <p class="text-[10px] sm:text-xs text-subtext-light dark:text-subtext-dark">Nenhuma entrega prevista para este período</p>
        </div>

        <!-- Desktop: Layout com duas colunas -->
        <div v-else class="hidden sm:flex gap-4">
          <!-- Coluna Esquerda - Fixa (280px) -->
          <div class="w-[280px] min-w-[280px] bg-white dark:bg-gray-800 rounded-lg border border-border-light dark:border-border-dark">
            <div class="h-[36px] px-4 flex items-center mb-1.5">
              <span class="text-xs font-semibold text-text-light dark:text-text-dark">Entregas Previstas</span>
            </div>
            <div class="flex flex-col gap-1.5 px-2 pb-2">
              <template v-for="entrega in entregasPorDataFiltrado" :key="'left-' + entrega.data">
                <div class="bg-row-beige dark:bg-gray-700 h-[32px] px-3 flex items-center justify-between rounded-lg border border-border-light dark:border-border-dark">
                  <span class="text-text-light dark:text-text-dark text-xs">{{ formatDateShort(entrega.data) }}</span>
                  <div class="flex items-center gap-2">
                    <span class="font-semibold text-teal-700 dark:text-teal-400 text-xs">{{ entrega.totalUnidades }}</span>
                    <span @click="toggleDataExpanded(entrega.data)" class="material-icons text-sm text-subtext-light transition-transform cursor-pointer hover:text-primary" :class="expandedDatas.includes(entrega.data) ? 'rotate-180' : ''">expand_more</span>
                  </div>
                </div>
                <template v-if="expandedDatas.includes(entrega.data)">
                  <div v-for="pedido in entrega.pedidos" :key="'left-pedido-' + pedido.id" class="h-[32px] px-3 flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg border border-border-light dark:border-border-dark">
                    <span class="text-primary font-medium text-xs truncate flex-1 min-w-0">{{ pedido.cliente }}</span>
                    <select :value="pedido.status" @change="updatePedidoStatus(pedido.id, ($event.target as HTMLSelectElement).value)" @click.stop class="text-xs px-2 py-0.5 rounded border border-border-light dark:border-border-dark cursor-pointer font-medium shrink-0 bg-white dark:bg-gray-800" :class="getStatusSelectClass(pedido.status)">
                      <option value="previsto">Previsto</option>
                      <option value="reservado">Reservado</option>
                      <option value="confirmado">Confirmado</option>
                      <option value="finalizado">Finalizado</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                    <span class="text-xs font-medium text-text-light dark:text-text-dark w-6 text-center shrink-0">{{ pedido.quantidadePrevista }}</span>
                    <span class="text-xs font-medium text-primary w-6 text-center shrink-0">{{ pedido.quantidadeFinal }}</span>
                  </div>
                </template>
              </template>
            </div>
          </div>

          <!-- Coluna Direita - Scrollável -->
          <div ref="entregasScrollRef" class="flex-1 overflow-x-auto custom-scrollbar" @scroll="syncScroll('entregas')">
            <div class="inline-flex flex-col gap-1.5 min-w-max">
              <div class="bg-white dark:bg-gray-800 rounded-lg border border-border-light dark:border-border-dark h-[36px] px-2 flex items-center">
                <div v-for="produto in produtosAtivos" :key="'header-' + produto.id" class="w-14 shrink-0 px-1 text-center text-xs font-medium text-subtext-light dark:text-subtext-dark" :title="produto.nome">{{ produto.codigo }}</div>
              </div>
              <template v-for="entrega in entregasPorDataFiltrado" :key="'right-' + entrega.data">
                <div class="bg-row-beige dark:bg-gray-700 rounded-lg border border-border-light dark:border-border-dark h-[32px] px-2 flex items-center">
                  <div v-for="produto in produtosAtivos" :key="'data-' + entrega.data + '-' + produto.id" class="w-14 shrink-0 px-1 text-center text-xs" :class="getTotalProdutoDia(entrega.data, produto.codigo) > 0 ? 'text-teal-700 dark:text-teal-400 font-medium' : 'text-gray-400'">{{ getTotalProdutoDia(entrega.data, produto.codigo) || 0 }}</div>
                </div>
                <template v-if="expandedDatas.includes(entrega.data)">
                  <div v-for="pedido in entrega.pedidos" :key="'right-pedido-' + pedido.id" class="bg-white dark:bg-gray-800 rounded-lg border border-border-light dark:border-border-dark h-[32px] px-2 flex items-center">
                    <div v-for="produto in produtosAtivos" :key="'pedido-' + pedido.id + '-' + produto.id" class="w-14 shrink-0 px-0.5 text-center" @click.stop>
                      <input type="number" :value="getPedidoItemQtd(pedido.id, produto.codigo)" @blur="updatePedidoItem(pedido.id, produto.id, produto.codigo, $event)" @keyup.enter="($event.target as HTMLInputElement).blur()" class="input-centered w-11 text-xs py-0.5 rounded-sm bg-gray-50 dark:bg-gray-700 focus:ring-1 focus:ring-primary focus:outline-none border border-gray-200 dark:border-gray-600" :class="getPedidoItemQtd(pedido.id, produto.codigo) ? 'text-teal-700 dark:text-teal-400 font-medium' : 'text-gray-400'" min="0" />
                    </div>
                  </div>
                </template>
              </template>
            </div>
          </div>
        </div>

        <!-- Mobile: Layout em cards expansíveis -->
        <div v-if="entregasPorData.length > 0" class="sm:hidden space-y-2">
          <div class="flex items-center justify-between px-1 mb-1">
            <span class="text-[10px] font-semibold text-text-light dark:text-text-dark">Entregas Previstas</span>
          </div>

          <template v-for="entrega in entregasPorDataFiltrado" :key="'mobile-' + entrega.data">
            <!-- Card da Data -->
            <div class="bg-white dark:bg-gray-800 rounded-lg border border-border-light dark:border-border-dark overflow-hidden">
              <!-- Header da Data -->
              <div
                @click="toggleDataExpanded(entrega.data)"
                class="bg-row-beige dark:bg-gray-700 px-3 py-2 flex items-center justify-between cursor-pointer active:bg-gray-200 dark:active:bg-gray-600"
              >
                <div class="flex items-center gap-2">
                  <span class="text-text-light dark:text-text-dark text-xs font-medium">{{ formatDateShort(entrega.data) }}</span>
                  <span class="text-[10px] text-subtext-light dark:text-subtext-dark">({{ entrega.pedidos.length }} pedido{{ entrega.pedidos.length > 1 ? 's' : '' }})</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="font-bold text-teal-700 dark:text-teal-400 text-sm">{{ entrega.totalUnidades }}</span>
                  <span class="material-icons text-base text-subtext-light transition-transform" :class="expandedDatas.includes(entrega.data) ? 'rotate-180' : ''">expand_more</span>
                </div>
              </div>

              <!-- Pedidos Expandidos -->
              <div v-if="expandedDatas.includes(entrega.data)" class="divide-y divide-border-light dark:divide-border-dark">
                <div
                  v-for="pedido in entrega.pedidos"
                  :key="'mobile-pedido-' + pedido.id"
                  class="p-3"
                >
                  <!-- Linha 1: Cliente e Status -->
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-primary font-medium text-xs truncate flex-1 mr-2">{{ pedido.cliente }}</span>
                    <select
                      :value="pedido.status"
                      @change="updatePedidoStatus(pedido.id, ($event.target as HTMLSelectElement).value)"
                      class="text-[10px] px-2 py-1 rounded border border-border-light dark:border-border-dark font-medium bg-white dark:bg-gray-800"
                      :class="getStatusSelectClass(pedido.status)"
                    >
                      <option value="previsto">Previsto</option>
                      <option value="reservado">Reservado</option>
                      <option value="confirmado">Confirmado</option>
                      <option value="finalizado">Finalizado</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                  </div>

                  <!-- Linha 2: Grid de Produtos (scroll horizontal) -->
                  <div class="overflow-x-auto -mx-3 px-3 pb-1">
                    <div class="flex gap-1.5 min-w-max">
                      <template v-for="produto in produtosAtivos" :key="'mobile-item-' + pedido.id + '-' + produto.id">
                        <div v-if="getPedidoItemQtd(pedido.id, produto.codigo) > 0 || true" class="flex flex-col items-center">
                          <span class="text-[9px] text-subtext-light dark:text-subtext-dark mb-0.5">{{ produto.codigo }}</span>
                          <input
                            type="number"
                            :value="getPedidoItemQtd(pedido.id, produto.codigo)"
                            @blur="updatePedidoItem(pedido.id, produto.id, produto.codigo, $event)"
                            @keyup.enter="($event.target as HTMLInputElement).blur()"
                            class="input-centered w-10 h-7 text-[10px] rounded bg-gray-50 dark:bg-gray-700 focus:ring-1 focus:ring-primary focus:outline-none border border-gray-200 dark:border-gray-600"
                            :class="getPedidoItemQtd(pedido.id, produto.codigo) ? 'text-teal-700 dark:text-teal-400 font-medium' : 'text-gray-400'"
                            min="0"
                          />
                        </div>
                      </template>
                    </div>
                  </div>

                  <!-- Linha 3: Totais -->
                  <div class="flex items-center justify-end gap-3 mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                    <div class="flex items-center gap-1">
                      <span class="text-[9px] text-subtext-light">Prev:</span>
                      <span class="text-xs font-medium text-text-light dark:text-text-dark">{{ pedido.quantidadePrevista }}</span>
                    </div>
                    <div class="flex items-center gap-1">
                      <span class="text-[9px] text-subtext-light">Final:</span>
                      <span class="text-xs font-bold text-primary">{{ pedido.quantidadeFinal }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- Empty state quando nao tem produtos -->
    <div v-else-if="!loading" class="text-center py-4 sm:py-6 bg-white dark:bg-gray-800 rounded-lg border border-border-light dark:border-border-dark">
      <p class="text-[10px] sm:text-xs text-subtext-light dark:text-subtext-dark">Nenhum produto cadastrado</p>
    </div>

    <!-- Modal Registrar Pedido -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-200"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="showRegistrarModal" class="fixed inset-0 z-50 overflow-y-auto">
          <div class="fixed inset-0 glass-backdrop" @click="closeRegistrarModal"></div>
          <div class="flex min-h-full items-end sm:items-center justify-center p-0 sm:p-4">
            <Transition
              enter-active-class="transition-all duration-200"
              enter-from-class="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enter-to-class="opacity-100 translate-y-0 sm:scale-100"
              leave-active-class="transition-all duration-200"
              leave-from-class="opacity-100 translate-y-0 sm:scale-100"
              leave-to-class="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <div v-if="showRegistrarModal" class="relative glass-panel rounded-t-xl sm:rounded-lg shadow-xl w-full sm:max-w-md max-h-[85vh] sm:max-h-[90vh] overflow-y-auto">
            <!-- Modal Header -->
            <div class="sticky top-0 glass-panel border-b border-border-light dark:border-border-dark px-3 sm:px-4 py-2.5 sm:py-3 z-10">
              <div class="flex items-center gap-2">
                <div class="w-7 sm:w-8 h-7 sm:h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <span class="material-icons text-primary text-xs sm:text-sm">assignment</span>
                </div>
                <div class="flex-1">
                  <h2 class="text-xs sm:text-sm font-semibold text-text-light dark:text-text-dark">Registrar Pedido</h2>
                  <p class="text-[10px] sm:text-xs text-subtext-light dark:text-subtext-dark">Informe os dados abaixo</p>
                </div>
                <button @click="closeRegistrarModal" class="sm:hidden p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                  <span class="material-icons text-subtext-light text-lg">close</span>
                </button>
              </div>
            </div>

            <!-- Modal Body -->
            <div class="p-3 sm:p-4 space-y-3 sm:space-y-4">
              <!-- Previsao de Entrega e Cliente -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                <div>
                  <label class="block text-[10px] sm:text-xs font-medium text-text-light dark:text-text-dark mb-1">Previsão de entrega</label>
                  <input type="date" v-model="novoPedido.previsaoEntrega" class="input text-xs py-2 sm:py-1.5" />
                </div>
                <div>
                  <label class="block text-[10px] sm:text-xs font-medium text-text-light dark:text-text-dark mb-1">Cliente</label>
                  <select v-model="novoPedido.clienteId" class="input text-xs py-2 sm:py-1.5">
                    <option value="">Selecione</option>
                    <option v-for="cliente in clientes" :key="cliente.id" :value="cliente.id">
                      {{ cliente.nome_fantasia || cliente.razao_social }}
                    </option>
                  </select>
                </div>
              </div>

              <!-- Tabela de Preco e Frete -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                <div class="flex items-end gap-2">
                  <div class="flex-1">
                    <label class="block text-[10px] sm:text-xs font-medium text-text-light dark:text-text-dark mb-1">Tabela de preço</label>
                    <select v-model="novoPedido.tabelaPrecoId" class="input text-xs py-2 sm:py-1.5">
                      <option value="">Selecione...</option>
                      <option v-for="tabela in tabelasPreco" :key="tabela.id" :value="tabela.id">
                        {{ tabela.nome }}
                      </option>
                    </select>
                  </div>
                  <button
                    @click="abrirCriarTabelaPreco"
                    class="w-9 sm:w-8 h-9 sm:h-8 flex items-center justify-center bg-primary text-white rounded-lg hover:bg-primary/90 active:scale-95 transition-all shrink-0"
                    title="Adicionar tabela de preço"
                  >
                    <span class="material-icons text-sm">add</span>
                  </button>
                </div>
                <div>
                  <label class="block text-[10px] sm:text-xs font-medium text-text-light dark:text-text-dark mb-1">Valor Frete</label>
                  <input
                    type="number"
                    v-model.number="novoPedido.valorFrete"
                    placeholder="0,00"
                    class="input text-xs py-2 sm:py-1.5"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <!-- Secao Item do Pedido -->
              <div class="pt-2 sm:pt-3 border-t border-border-light dark:border-border-dark">
                <h3 class="text-[10px] sm:text-xs font-semibold text-text-light dark:text-text-dark mb-2 sm:mb-3">Item do pedido</h3>

                <!-- Mobile: Layout em grid -->
                <div class="flex flex-col sm:flex-row sm:items-end gap-2">
                  <!-- Produto -->
                  <div class="flex-1">
                    <label class="block text-[10px] sm:text-xs text-subtext-light dark:text-subtext-dark mb-1">Produto</label>
                    <select v-model="itemForm.produtoId" class="input text-xs py-2 sm:py-1.5" @change="onProdutoChange">
                      <option value="">Selecione</option>
                      <option v-for="produto in produtos" :key="produto.id" :value="produto.id">
                        {{ produto.codigo }} - {{ produto.nome }}
                      </option>
                    </select>
                  </div>

                  <!-- Qtd e Valor em linha no mobile -->
                  <div class="flex items-end gap-2">
                    <!-- Quantidade -->
                    <div class="w-20 sm:w-16">
                      <label class="block text-[10px] sm:text-xs text-subtext-light dark:text-subtext-dark mb-1">Qtd</label>
                      <input
                        type="number"
                        v-model.number="itemForm.quantidade"
                        placeholder="0"
                        class="input text-xs py-2 sm:py-1.5"
                        min="1"
                      />
                    </div>

                    <!-- Valor Unitario -->
                    <div class="flex-1 sm:w-20 sm:flex-initial">
                      <label class="block text-[10px] sm:text-xs text-subtext-light dark:text-subtext-dark mb-1">Valor unit.</label>
                      <input
                        type="number"
                        v-model.number="itemForm.valorUnitario"
                        placeholder="0,00"
                        class="input text-xs py-2 sm:py-1.5"
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <!-- Botao Adicionar -->
                    <button
                      @click="adicionarItem"
                      class="w-10 sm:w-8 h-10 sm:h-8 flex items-center justify-center bg-primary text-white rounded-lg hover:bg-primary/90 active:scale-95 transition-all shrink-0"
                      title="Adicionar item"
                    >
                      <span class="material-icons text-sm">add</span>
                    </button>
                  </div>
                </div>

                <!-- Tabela de Itens -->
                <div v-if="novoPedido.itens.length > 0" class="mt-2 sm:mt-3 border border-border-light dark:border-border-dark rounded-lg overflow-hidden">
                  <table class="w-full text-[10px] sm:text-xs">
                    <thead class="bg-gray-50 dark:bg-gray-800 border-b border-border-light dark:border-border-dark">
                      <tr>
                        <th class="text-left text-[10px] sm:text-xs font-medium text-subtext-light dark:text-subtext-dark px-2 sm:px-3 py-1.5">Produto</th>
                        <th class="text-center text-[10px] sm:text-xs font-medium text-subtext-light dark:text-subtext-dark px-2 sm:px-3 py-1.5 w-12 sm:w-16">Qtd</th>
                        <th class="w-8"></th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-border-light dark:divide-border-dark">
                      <tr
                        v-for="(item, index) in novoPedido.itens"
                        :key="index"
                        class="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      >
                        <td class="px-2 sm:px-3 py-1.5">
                          <p class="text-text-light dark:text-text-dark truncate">{{ getProdutoNome(item.produtoId) }}</p>
                        </td>
                        <td class="px-2 sm:px-3 py-1.5 text-center text-text-light dark:text-text-dark font-medium">
                          {{ item.quantidade }}
                        </td>
                        <td class="px-1.5 sm:px-2 py-1.5 text-center">
                          <button
                            @click="removerItem(index)"
                            class="text-red-500 hover:text-red-700 active:scale-95 transition-all p-1"
                            title="Remover"
                          >
                            <span class="material-icons text-sm">close</span>
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <!-- Total de Produtos -->
                <div class="mt-2 sm:mt-3 flex justify-between items-center text-[10px] sm:text-xs border border-border-light dark:border-border-dark rounded-lg px-2 sm:px-3 py-2">
                  <span class="text-subtext-light dark:text-subtext-dark">Total de Produtos</span>
                  <span class="font-bold text-primary">{{ totalProdutosModal }}</span>
                </div>
              </div>
            </div>

            <!-- Modal Footer -->
            <div class="sticky bottom-0 glass-panel border-t border-border-light dark:border-border-dark px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-end gap-2">
              <button @click="closeRegistrarModal" class="hidden sm:inline-flex btn btn-secondary text-xs px-3 py-1.5" :disabled="saving">Fechar</button>
              <button @click="salvarPedido" class="btn btn-primary text-xs px-4 sm:px-3 py-2 sm:py-1.5 flex-1 sm:flex-initial" :disabled="saving || !isModalFormValid">
                <span v-if="saving" class="material-icons animate-spin text-sm mr-1">refresh</span>
                {{ saving ? 'Salvando...' : 'Salvar Pedido' }}
              </button>
            </div>
              </div>
            </Transition>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useCurrentCompany } from '~/composables/useCurrentCompany'

// Interfaces
interface Cliente {
  id: string
  razao_social: string
  nome_fantasia: string | null
}

interface Produto {
  id: string
  codigo: string
  nome: string
  preco_padrao: number | null
  especie_id: string | null
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
}

interface Pedido {
  id: string
  empresa_id: string
  cliente_id: string | null
  contrato_id?: string | null
  numero: string
  data_pedido: string
  data_entrega: string | null
  status: string
  valor_total: number | null
  observacoes: string | null
  created_at: string
  updated_at: string
  clientes?: Cliente
  pedido_itens?: PedidoItem[]
}

interface PrevisaoColheita {
  id: string
  empresa_id: string
  producao_id: string
  especie_id: string
  data_prevista: string
  quantidade_prevista: number
  quantidade_colhida: number
}

interface Producao {
  id: string
  empresa_id: string
  produto_id: string | null
  especie_id: string | null
  data_colheita_prevista: string | null
  data_colheita_real: string | null
  quantidade_bandeja: number
  quantidade_colhida: number | null
  status: string
}

interface MatrizProduto {
  codigo: string
  vendido: number
  vender: number
  colhido: number
  colher: number
}

interface PedidoEntrega {
  id: string
  cliente: string
  clienteId: string
  status: string
  quantidadePrevista: number
  quantidadeFinal: number
  itens: Map<string, number>
}

interface EntregaPrevista {
  data: string
  totalUnidades: number
  pedidos: PedidoEntrega[]
}

// Composables
const supabase = useSupabaseClient()
const { currentCompany } = useCurrentCompany()
const { success, error: showError } = useToast()

// Estado
const loading = ref(false)
const saving = ref(false)

// Dados
const clientes = ref<Cliente[]>([])
const produtos = ref<Produto[]>([])
const tabelasPreco = ref<TabelaPreco[]>([])
const pedidos = ref<Pedido[]>([])
const previsaoColheita = ref<PrevisaoColheita[]>([])
const producaoData = ref<Producao[]>([])
const produtoEspecieMap = ref<Map<string, string>>(new Map())

// Periodo
const periodo = ref({
  inicio: getInicioSemana(new Date()),
  fim: getFimSemana(new Date())
})

// Filtros e toggles
const filtroCliente = ref('')
const showInventario = ref(true)
const showColher = ref(true)
const expandedDatas = ref<string[]>([])

// Refs para scroll sincronizado
const matrizScrollRef = ref<HTMLElement | null>(null)
const entregasScrollRef = ref<HTMLElement | null>(null)
const isScrolling = ref(false)

// Funcao para sincronizar scroll entre as duas tabelas
function syncScroll(source: 'matriz' | 'entregas') {
  if (isScrolling.value) return

  isScrolling.value = true

  const sourceEl = source === 'matriz' ? matrizScrollRef.value : entregasScrollRef.value
  const targetEl = source === 'matriz' ? entregasScrollRef.value : matrizScrollRef.value

  if (sourceEl && targetEl) {
    targetEl.scrollLeft = sourceEl.scrollLeft
  }

  setTimeout(() => {
    isScrolling.value = false
  }, 10)
}

// Modal
const showRegistrarModal = ref(false)
const novoPedido = ref({
  previsaoEntrega: new Date().toISOString().split('T')[0],
  clienteId: '',
  tabelaPrecoId: '',
  valorFrete: 0,
  itens: [] as { produtoId: string; quantidade: number; valorUnitario: number }[]
})
const itemForm = ref({
  produtoId: '',
  quantidade: 1,
  valorUnitario: 0
})

// Computed - Produtos ativos ordenados por codigo
const produtosAtivos = computed(() => {
  return [...produtos.value].sort((a, b) => a.codigo.localeCompare(b.codigo))
})

// Computed - Metricas
const metricas = computed(() => {
  let vendido = 0
  let vender = 0
  let colhido = 0
  let colher = 0
  let faturamento = 0

  // Calcular faturamento de todos pedidos exceto cancelados
  // Vendido e Vender baseado nos pedidos
  for (const pedido of pedidos.value) {
    const itens = pedido.pedido_itens || []
    const totalItens = itens.reduce((sum, item) => sum + (item.quantidade || 0), 0)

    // Faturamento: todos exceto cancelados
    if (pedido.status !== 'cancelado') {
      faturamento += pedido.valor_total || 0
    }

    // Vendido: pedidos finalizados/entregues
    if (pedido.status === 'finalizado' || pedido.status === 'entregue') {
      vendido += totalItens
    }
    // Vender: pedidos pendentes (previsto, reservado, confirmado, em_producao)
    else if (['previsto', 'reservado', 'confirmado', 'em_producao'].includes(pedido.status)) {
      vender += totalItens
    }
  }

  // Calcular colhido e colher baseado na tabela de producao
  const statusColhido = ['colhido', 'finalizado']
  const statusAColher = ['planejado', 'germinando', 'vegetacao', 'em_plantio', 'em_luz', 'em_colheita', 'colhendo']

  for (const prod of producaoData.value) {
    if (statusColhido.includes(prod.status)) {
      // Já colhido: usar quantidade_colhida
      colhido += Number(prod.quantidade_colhida) || 0
    } else if (statusAColher.includes(prod.status)) {
      // A colher: usar quantidade_bandeja (planejada)
      colher += prod.quantidade_bandeja || 0
    }
  }

  const total = vendido + vender
  const totalColheita = colhido + colher

  return {
    faturamento,
    totalMicroverdes: total,
    vendido: {
      quantidade: vendido,
      percentual: total > 0 ? Math.round((vendido / total) * 100) : 0
    },
    vender: {
      quantidade: vender,
      percentual: total > 0 ? Math.round((vender / total) * 100) : 0
    },
    colhido: {
      quantidade: colhido,
      percentual: totalColheita > 0 ? Math.round((colhido / totalColheita) * 100) : 0
    },
    colher: {
      quantidade: colher,
      percentual: totalColheita > 0 ? Math.round((colher / totalColheita) * 100) : 0
    }
  }
})

// Computed - Matriz de produtos
const matrizProdutos = computed(() => {
  const matriz = new Map<string, MatrizProduto>()

  // Inicializar matriz com todos os produtos
  for (const produto of produtosAtivos.value) {
    matriz.set(produto.codigo, {
      codigo: produto.codigo,
      vendido: 0,
      vender: 0,
      colhido: 0,
      colher: 0
    })
  }

  // Preencher com dados dos pedidos
  for (const pedido of pedidos.value) {
    const itens = pedido.pedido_itens || []
    for (const item of itens) {
      const produto = produtos.value.find(p => p.id === item.produto_id)
      if (produto && matriz.has(produto.codigo)) {
        const m = matriz.get(produto.codigo)!
        if (pedido.status === 'finalizado' || pedido.status === 'entregue') {
          m.vendido += item.quantidade || 0
        } else if (['previsto', 'reservado', 'confirmado', 'em_producao'].includes(pedido.status)) {
          m.vender += item.quantidade || 0
        }
      }
    }
  }

  // Preencher com dados de producao
  const statusColhido = ['colhido', 'finalizado']
  const statusAColher = ['planejado', 'germinando', 'vegetacao', 'em_plantio', 'em_luz', 'em_colheita', 'colhendo']

  for (const prod of producaoData.value) {
    // Encontrar produto pelo produto_id ou usando o mapa especie -> produto
    let produtoCodigo: string | undefined

    if (prod.produto_id) {
      const produto = produtos.value.find(p => p.id === prod.produto_id)
      produtoCodigo = produto?.codigo
    }

    if (!produtoCodigo && prod.especie_id) {
      // Usar o mapa que foi criado em loadProdutos
      produtoCodigo = produtoEspecieMap.value.get(prod.especie_id)
    }

    if (produtoCodigo && matriz.has(produtoCodigo)) {
      const m = matriz.get(produtoCodigo)!
      if (statusColhido.includes(prod.status)) {
        m.colhido += Number(prod.quantidade_colhida) || 0
      } else if (statusAColher.includes(prod.status)) {
        m.colher += prod.quantidade_bandeja || 0
      }
    }
  }

  return matriz
})

// Computed - Entregas por data
const entregasPorData = computed(() => {
  const agrupado = new Map<string, EntregaPrevista>()

  // Filtrar pedidos com data_entrega no periodo
  const pedidosFiltrados = pedidos.value.filter(p => {
    if (!p.data_entrega) return false
    return p.data_entrega >= periodo.value.inicio && p.data_entrega <= periodo.value.fim
  })

  for (const pedido of pedidosFiltrados) {
    const data = pedido.data_entrega!

    if (!agrupado.has(data)) {
      agrupado.set(data, {
        data,
        totalUnidades: 0,
        pedidos: []
      })
    }

    const grupo = agrupado.get(data)!
    const itens = pedido.pedido_itens || []
    const totalItens = itens.reduce((sum, item) => sum + (item.quantidade || 0), 0)

    // Mapear itens por codigo de produto
    const itensMap = new Map<string, number>()
    for (const item of itens) {
      const produto = produtos.value.find(p => p.id === item.produto_id)
      if (produto) {
        itensMap.set(produto.codigo, (itensMap.get(produto.codigo) || 0) + (item.quantidade || 0))
      }
    }

    grupo.pedidos.push({
      id: pedido.id,
      cliente: pedido.clientes?.nome_fantasia || pedido.clientes?.razao_social || 'Cliente',
      clienteId: pedido.cliente_id || '',
      status: pedido.status,
      quantidadePrevista: totalItens,
      quantidadeFinal: totalItens,
      itens: itensMap
    })

    grupo.totalUnidades += totalItens
  }

  // Ordenar por data
  return Array.from(agrupado.values()).sort((a, b) => a.data.localeCompare(b.data))
})

// Computed - Entregas filtradas por cliente
const entregasPorDataFiltrado = computed(() => {
  if (!filtroCliente.value) return entregasPorData.value

  const filtro = filtroCliente.value.toLowerCase()
  return entregasPorData.value.map(entrega => ({
    ...entrega,
    pedidos: entrega.pedidos.filter(p => p.cliente.toLowerCase().includes(filtro))
  })).filter(e => e.pedidos.length > 0)
})

// Computed - Total produtos no modal
const totalProdutosModal = computed(() => {
  return novoPedido.value.itens.reduce((sum, item) => sum + (item.quantidade || 0), 0)
})

// Computed - Validacao do form do modal
const isModalFormValid = computed(() => {
  return novoPedido.value.previsaoEntrega && novoPedido.value.clienteId && novoPedido.value.itens.length > 0
})

// Funcoes auxiliares de data
function getInicioSemana(date: Date): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}

function getFimSemana(date: Date): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? 0 : 7)
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}

function formatDateShort(dateString: string): string {
  if (!dateString) return '-'
  const date = new Date(dateString + 'T00:00:00')
  return date.toLocaleDateString('pt-BR')
}

function formatDateFull(dateString: string): string {
  if (!dateString) return '-'
  const date = new Date(dateString + 'T00:00:00')
  return date.toLocaleDateString('pt-BR')
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
}

// Navegacao de periodo
function periodoAnterior() {
  const inicio = new Date(periodo.value.inicio)
  inicio.setDate(inicio.getDate() - 7)
  periodo.value.inicio = getInicioSemana(inicio)
  periodo.value.fim = getFimSemana(inicio)
}

function proximoPeriodo() {
  const inicio = new Date(periodo.value.inicio)
  inicio.setDate(inicio.getDate() + 7)
  periodo.value.inicio = getInicioSemana(inicio)
  periodo.value.fim = getFimSemana(inicio)
}

// Funcoes da matriz
function getMatrizValue(codigo: string, tipo: 'vendido' | 'vender' | 'colhido' | 'colher'): number {
  const m = matrizProdutos.value.get(codigo)
  return m ? m[tipo] : 0
}

function getMatrizValueClass(codigo: string, tipo: 'vendido' | 'vender' | 'colhido' | 'colher'): string {
  const value = getMatrizValue(codigo, tipo)
  if (value < 0) return 'text-red-600 font-medium'
  if (value > 0) return 'text-yellow-600'
  return 'text-gray-400'
}

function getColhidoClass(codigo: string): string {
  const colhido = getMatrizValue(codigo, 'colhido')
  const vender = getMatrizValue(codigo, 'vender')

  if (colhido === 0) return 'text-gray-400'
  // Se colhido for menor que o necessário para vender, mostra em vermelho
  if (colhido > 0 && colhido < vender) return 'text-red-600'
  return 'text-green-600'
}

function getMatrizValueDisplay(codigo: string, tipo: 'vendido' | 'vender' | 'colhido' | 'colher'): string {
  const value = getMatrizValue(codigo, tipo)
  return value !== 0 ? value.toString() : ''
}

function getTotalMatriz(tipo: 'vendido' | 'vender' | 'colhido' | 'colher'): number {
  let total = 0
  for (const m of matrizProdutos.value.values()) {
    total += m[tipo]
  }
  return total
}

// Funcoes de entregas
function toggleDataExpanded(data: string) {
  const index = expandedDatas.value.indexOf(data)
  if (index >= 0) {
    expandedDatas.value.splice(index, 1)
  } else {
    expandedDatas.value.push(data)
  }
}

function getTotalProdutoDia(data: string, codigo: string): number {
  const entrega = entregasPorData.value.find(e => e.data === data)
  if (!entrega) return 0

  let total = 0
  for (const pedido of entrega.pedidos) {
    total += pedido.itens.get(codigo) || 0
  }
  return total
}

function getPedidoItemQtd(pedidoId: string, codigo: string): number | string {
  for (const entrega of entregasPorData.value) {
    const pedido = entrega.pedidos.find(p => p.id === pedidoId)
    if (pedido) {
      const qtd = pedido.itens.get(codigo)
      return qtd !== undefined && qtd > 0 ? qtd : ''
    }
  }
  return ''
}

function getStatusSelectClass(status: string): string {
  switch (status) {
    case 'reservado':
      return 'text-blue-600 dark:text-blue-400'
    case 'confirmado':
      return 'text-green-600 dark:text-green-400'
    case 'finalizado':
      return 'text-emerald-600 dark:text-emerald-400'
    case 'cancelado':
      return 'text-gray-500 dark:text-gray-400'
    case 'previsto':
    default:
      return 'text-yellow-600 dark:text-yellow-400'
  }
}

// Funcoes de atualizacao
async function updatePedidoStatus(pedidoId: string, newStatus: string) {
  if (!currentCompany.value?.id) return

  try {
    // Buscar pedido para saber o status anterior e contrato_id
    const pedido = pedidos.value.find(p => p.id === pedidoId)
    const statusAnterior = pedido?.status
    const contratoId = pedido?.contrato_id

    const { error } = await supabase
      .from('pedidos')
      .update({ status: newStatus })
      .eq('id', pedidoId)
      .eq('empresa_id', currentCompany.value.id)

    if (error) throw error

    // Atualizar contador de entregas do contrato se mudou para/de entregue ou finalizado
    if (contratoId) {
      const statusEntregue = ['entregue', 'finalizado']
      const eraEntregue = statusEntregue.includes(statusAnterior || '')
      const agoraEntregue = statusEntregue.includes(newStatus)

      if (!eraEntregue && agoraEntregue) {
        // Incrementar entregas_realizadas
        try {
          await supabase.rpc('increment_entregas_realizadas', { contrato_uuid: contratoId })
        } catch (rpcError) {
          console.warn('Função RPC não disponível:', rpcError)
        }
      } else if (eraEntregue && !agoraEntregue) {
        // Decrementar entregas_realizadas
        try {
          await supabase.rpc('decrement_entregas_realizadas', { contrato_uuid: contratoId })
        } catch (rpcError) {
          console.warn('Função RPC não disponível:', rpcError)
        }
      }
    }

    // Atualizar localmente sem recarregar toda a página
    const pedidoIndex = pedidos.value.findIndex(p => p.id === pedidoId)
    if (pedidoIndex !== -1) {
      pedidos.value[pedidoIndex].status = newStatus
    }

    success('Status atualizado')
  } catch (e: any) {
    console.error('Erro ao atualizar status:', e)
    showError(e.message || 'Erro ao atualizar status')
    // Reverter o status localmente se deu erro
    await loadPedidos()
  }
}

async function updatePedidoItem(pedidoId: string, produtoId: string, produtoCodigo: string, event: Event) {
  if (!currentCompany.value?.id) return

  const input = event.target as HTMLInputElement
  const novaQtd = parseInt(input.value) || 0

  // Buscar pedido e item existente
  const pedidoIndex = pedidos.value.findIndex(p => p.id === pedidoId)
  if (pedidoIndex === -1) return

  const pedido = pedidos.value[pedidoIndex]
  const itemIndex = pedido.pedido_itens?.findIndex(item => {
    const prod = produtos.value.find(p => p.id === item.produto_id)
    return prod?.codigo === produtoCodigo
  }) ?? -1

  const itemExistente = itemIndex !== -1 ? pedido.pedido_itens?.[itemIndex] : null

  try {
    if (itemExistente) {
      if (novaQtd === 0) {
        // Remover item do banco
        const { error } = await supabase
          .from('pedido_itens')
          .delete()
          .eq('id', itemExistente.id)

        if (error) throw error

        // Remover localmente
        pedido.pedido_itens?.splice(itemIndex, 1)
      } else {
        const novoValorTotal = novaQtd * (itemExistente.valor_unitario || 0)

        // Atualizar quantidade no banco
        const { error } = await supabase
          .from('pedido_itens')
          .update({
            quantidade: novaQtd,
            valor_total: novoValorTotal
          })
          .eq('id', itemExistente.id)

        if (error) throw error

        // Atualizar localmente
        itemExistente.quantidade = novaQtd
        itemExistente.valor_total = novoValorTotal
      }
    } else if (novaQtd > 0) {
      // Criar novo item
      const produto = produtos.value.find(p => p.codigo === produtoCodigo)
      if (!produto) return

      const novoItem = {
        pedido_id: pedidoId,
        produto_id: produto.id,
        quantidade: novaQtd,
        valor_unitario: produto.preco_padrao || 0,
        valor_total: novaQtd * (produto.preco_padrao || 0)
      }

      const { data, error } = await supabase
        .from('pedido_itens')
        .insert(novoItem)
        .select()
        .single()

      if (error) throw error

      // Adicionar localmente
      if (!pedido.pedido_itens) pedido.pedido_itens = []
      pedido.pedido_itens.push(data)
    }

    // Recalcular total do pedido localmente
    const novoTotal = (pedido.pedido_itens || []).reduce((sum, item) => sum + (item.valor_total || 0), 0)
    pedido.valor_total = novoTotal

    // Atualizar total no banco
    await supabase
      .from('pedidos')
      .update({ valor_total: novoTotal })
      .eq('id', pedidoId)

  } catch (e: any) {
    console.error('Erro ao atualizar item:', e)
    showError('Erro ao atualizar item')
    await loadPedidos() // Recarregar para reverter em caso de erro
  }
}

async function recalcularTotalPedido(pedidoId: string) {
  const { data: itens } = await supabase
    .from('pedido_itens')
    .select('valor_total')
    .eq('pedido_id', pedidoId)

  const total = (itens || []).reduce((sum, item) => sum + (item.valor_total || 0), 0)

  await supabase
    .from('pedidos')
    .update({ valor_total: total })
    .eq('id', pedidoId)
}

// Modal
function openRegistrarModal() {
  novoPedido.value = {
    previsaoEntrega: periodo.value.inicio,
    clienteId: '',
    tabelaPrecoId: '',
    valorFrete: 0,
    itens: []
  }
  itemForm.value = { produtoId: '', quantidade: 1, valorUnitario: 0 }
  showRegistrarModal.value = true
}

function closeRegistrarModal() {
  showRegistrarModal.value = false
}

function abrirCriarTabelaPreco() {
  showError('Funcionalidade de criar tabela de preco em desenvolvimento')
}

function onProdutoChange() {
  const produto = produtos.value.find(p => p.id === itemForm.value.produtoId)
  if (produto) {
    itemForm.value.valorUnitario = produto.preco_padrao || 0
  }
}

function adicionarItem() {
  if (!itemForm.value.produtoId) {
    showError('Selecione um produto')
    return
  }
  if (!itemForm.value.quantidade || itemForm.value.quantidade <= 0) {
    showError('Informe uma quantidade valida')
    return
  }

  novoPedido.value.itens.push({
    produtoId: itemForm.value.produtoId,
    quantidade: itemForm.value.quantidade,
    valorUnitario: itemForm.value.valorUnitario
  })

  itemForm.value = { produtoId: '', quantidade: 1, valorUnitario: 0 }
}

function removerItem(index: number) {
  novoPedido.value.itens.splice(index, 1)
}

function getProdutoNome(produtoId: string): string {
  const produto = produtos.value.find(p => p.id === produtoId)
  return produto ? `${produto.codigo} - ${produto.nome}` : produtoId
}

async function salvarPedido() {
  if (!currentCompany.value?.id) {
    showError('Nenhuma empresa selecionada')
    return
  }

  if (!isModalFormValid.value) {
    showError('Preencha todos os campos obrigatorios')
    return
  }

  saving.value = true
  try {
    // Gerar numero do pedido
    const numero = `PED-${Date.now()}`

    // Calcular valor total
    const valorTotal = novoPedido.value.itens.reduce(
      (sum, item) => sum + (item.quantidade * item.valorUnitario),
      0
    ) + (novoPedido.value.valorFrete || 0)

    // Criar pedido
    const { data: pedidoData, error: pedidoError } = await supabase
      .from('pedidos')
      .insert({
        empresa_id: currentCompany.value.id,
        cliente_id: novoPedido.value.clienteId,
        numero,
        data_pedido: new Date().toISOString().split('T')[0],
        data_entrega: novoPedido.value.previsaoEntrega,
        status: 'previsto',
        valor_total: valorTotal,
        observacoes: novoPedido.value.tabelaPrecoId ? `Tabela: ${novoPedido.value.tabelaPrecoId}` : null
      })
      .select()
      .single()

    if (pedidoError) throw pedidoError

    // Criar itens
    if (novoPedido.value.itens.length > 0 && pedidoData) {
      const itensToInsert = novoPedido.value.itens.map(item => ({
        pedido_id: pedidoData.id,
        produto_id: item.produtoId,
        quantidade: item.quantidade,
        valor_unitario: item.valorUnitario,
        valor_total: item.quantidade * item.valorUnitario
      }))

      const { error: itensError } = await supabase
        .from('pedido_itens')
        .insert(itensToInsert)

      if (itensError) throw itensError
    }

    success('Pedido registrado com sucesso')
    closeRegistrarModal()
    await loadPedidos()

    // Expandir a data da nova entrega
    if (!expandedDatas.value.includes(novoPedido.value.previsaoEntrega)) {
      expandedDatas.value.push(novoPedido.value.previsaoEntrega)
    }
  } catch (e: any) {
    console.error('Erro ao salvar pedido:', e)
    showError(e.message || 'Erro ao salvar pedido')
  } finally {
    saving.value = false
  }
}

// Carregar dados
async function loadClientes() {
  if (!currentCompany.value?.id) {
    clientes.value = []
    return
  }

  try {
    const { data, error } = await supabase
      .from('clientes')
      .select('id, razao_social, nome_fantasia')
      .eq('empresa_id', currentCompany.value.id)
      .eq('ativo', true)
      .order('razao_social', { ascending: true })

    if (error) throw error
    clientes.value = data || []
  } catch (e: any) {
    console.error('Erro ao carregar clientes:', e)
  }
}

async function loadProdutos() {
  if (!currentCompany.value?.id) {
    produtos.value = []
    return
  }

  try {
    const { data, error } = await supabase
      .from('produtos')
      .select('id, codigo, nome, preco_padrao, especie_id')
      .eq('empresa_id', currentCompany.value.id)
      .eq('ativo', true)
      .order('codigo', { ascending: true })

    if (error) throw error
    produtos.value = data || []

    // Criar mapa de especie para produto
    produtoEspecieMap.value.clear()
    for (const p of produtos.value) {
      if (p.especie_id) {
        produtoEspecieMap.value.set(p.especie_id, p.codigo)
      }
    }
  } catch (e: any) {
    console.error('Erro ao carregar produtos:', e)
  }
}

async function loadTabelasPreco() {
  if (!currentCompany.value?.id) {
    tabelasPreco.value = []
    return
  }

  try {
    const { data, error } = await supabase
      .from('tabelas_preco')
      .select('id, nome')
      .eq('empresa_id', currentCompany.value.id)
      .eq('ativo', true)
      .order('nome', { ascending: true })

    if (error) throw error
    tabelasPreco.value = data || []
  } catch (e: any) {
    console.error('Erro ao carregar tabelas de preco:', e)
  }
}

async function loadPedidos() {
  if (!currentCompany.value?.id) {
    pedidos.value = []
    return
  }

  loading.value = true
  try {
    const { data, error } = await supabase
      .from('pedidos')
      .select(`
        *,
        clientes(id, razao_social, nome_fantasia),
        pedido_itens(id, produto_id, quantidade, valor_unitario, valor_total)
      `)
      .eq('empresa_id', currentCompany.value.id)
      .gte('data_entrega', periodo.value.inicio)
      .lte('data_entrega', periodo.value.fim)
      .order('data_entrega', { ascending: true })

    if (error) throw error
    pedidos.value = data || []

    // Expandir todas as datas por padrao
    expandedDatas.value = [...new Set(pedidos.value.filter(p => p.data_entrega).map(p => p.data_entrega!))]
  } catch (e: any) {
    console.error('Erro ao carregar pedidos:', e)
    showError('Erro ao carregar pedidos')
  } finally {
    loading.value = false
  }
}

async function loadPrevisaoColheita() {
  if (!currentCompany.value?.id) {
    previsaoColheita.value = []
    return
  }

  try {
    const { data, error } = await supabase
      .from('previsao_colheita')
      .select('*')
      .eq('empresa_id', currentCompany.value.id)
      .gte('data_prevista', periodo.value.inicio)
      .lte('data_prevista', periodo.value.fim)

    if (error) throw error
    previsaoColheita.value = data || []
  } catch (e: any) {
    console.error('Erro ao carregar previsao de colheita:', e)
  }
}

async function loadProducao() {
  if (!currentCompany.value?.id) {
    producaoData.value = []
    return
  }

  try {
    // Buscar produções onde colheita_planejada OU colheita_realizada está no período
    // Campos da tabela original: colheita_planejada, colheita_realizada, bandejas/quantia_planejada, quantia_colheita
    const { data, error } = await supabase
      .from('producao')
      .select('id, empresa_id, especie_id, colheita_planejada, colheita_realizada, bandejas, quantia_colheita, status')
      .eq('empresa_id', currentCompany.value.id)
      .neq('status', 'cancelado')
      .or(`and(colheita_planejada.gte.${periodo.value.inicio},colheita_planejada.lte.${periodo.value.fim}),and(colheita_realizada.gte.${periodo.value.inicio},colheita_realizada.lte.${periodo.value.fim})`)

    if (error) throw error

    // Mapear para interface esperada
    producaoData.value = (data || []).map(p => ({
      id: p.id,
      empresa_id: p.empresa_id,
      produto_id: null,
      especie_id: p.especie_id,
      data_colheita_prevista: p.colheita_planejada,
      data_colheita_real: p.colheita_realizada,
      quantidade_bandeja: p.bandejas || 0,
      quantidade_colhida: p.quantia_colheita,
      status: p.status
    }))
  } catch (e: any) {
    console.error('Erro ao carregar producao:', e)
  }
}

async function loadAllData() {
  await Promise.all([
    loadClientes(),
    loadProdutos(),
    loadTabelasPreco()
  ])
  await Promise.all([
    loadPedidos(),
    loadPrevisaoColheita(),
    loadProducao()
  ])
}

// Watchers
watch(
  () => currentCompany.value?.id,
  (newId, oldId) => {
    if (newId !== oldId) {
      loadAllData()
    }
  },
  { immediate: true }
)

watch(
  () => periodo.value,
  () => {
    loadPedidos()
    loadPrevisaoColheita()
    loadProducao()
  },
  { deep: true }
)

// Inicializacao
onMounted(() => {
  loadAllData()
})
</script>

<style scoped>
/* Esconder scrollbar na matriz de cima */
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

/* Barra de scroll customizada para a tabela de entregas */
.custom-scrollbar {
  scrollbar-width: auto;
  scrollbar-color: #4A7C59 #e5e7eb;
}

.custom-scrollbar::-webkit-scrollbar {
  height: 10px;
}

@media (min-width: 640px) {
  .custom-scrollbar::-webkit-scrollbar {
    height: 12px;
  }
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: #e5e7eb;
  border-radius: 6px;
  margin: 4px 0;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #4A7C59;
  border-radius: 6px;
  border: 2px solid #e5e7eb;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #3d6b4a;
}

/* Dark mode */
.dark .custom-scrollbar {
  scrollbar-color: #4A7C59 #374151;
}

.dark .custom-scrollbar::-webkit-scrollbar-track {
  background: #374151;
}

.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  border-color: #374151;
}

/* Esconder setas dos inputs number e centralizar texto */
input[type="number"].input-centered {
  -moz-appearance: textfield;
  appearance: textfield;
  text-align: center;
}

input[type="number"].input-centered::-webkit-outer-spin-button,
input[type="number"].input-centered::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* Touch-friendly improvements */
@media (max-width: 639px) {
  /* Larger touch targets on mobile */
  select, input {
    min-height: 36px;
  }

  /* Smooth horizontal scrolling on mobile */
  .custom-scrollbar {
    -webkit-overflow-scrolling: touch;
    scroll-snap-type: x proximity;
  }

  /* Prevent text selection on touch */
  .bg-row-beige {
    -webkit-user-select: none;
    user-select: none;
  }
}

/* Safe area padding for notched devices */
@supports (padding-bottom: env(safe-area-inset-bottom)) {
  .sticky.bottom-0 {
    padding-bottom: calc(0.75rem + env(safe-area-inset-bottom));
  }
}
</style>
