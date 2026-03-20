<template>
  <div>
    <!-- Toolbar: Período + Filtros + Botão -->
    <div class="flex flex-wrap items-center gap-2 sm:gap-3 mb-4">
      <!-- Seletor de Período (Date Range Picker) -->
      <div class="flex items-center gap-1">
        <button @click="periodoAnterior" class="p-1.5 self-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
          <span class="material-icons-outlined text-sm text-subtext-light">chevron_left</span>
        </button>
        <div class="vendas-date-range-wrapper">
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
            input-class-name="dp-input-custom"
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
          <span v-if="clientesSelecionados.length > 0" class="inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-primary rounded-full">{{ clientesSelecionados.length }}</span>
          <span class="material-icons-outlined text-sm text-subtext-light transition-transform" :class="filtroClienteAberto ? 'rotate-180' : ''">expand_more</span>
        </button>

        <!-- Dropdown -->
        <Transition
          enter-active-class="transition duration-150 ease-out"
          enter-from-class="opacity-0 scale-95 -translate-y-1"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition duration-100 ease-in"
          leave-from-class="opacity-100 scale-100 translate-y-0"
          leave-to-class="opacity-0 scale-95 -translate-y-1"
        >
          <div v-if="filtroClienteAberto" class="absolute top-full left-0 mt-1 w-56 sm:w-64 bg-white dark:bg-gray-800 rounded-lg border border-border-light dark:border-border-dark shadow-lg z-30 overflow-hidden">
            <!-- Busca -->
            <div class="p-2 border-b border-border-light dark:border-border-dark">
              <input
                ref="filtroClienteBuscaRef"
                v-model="filtroClienteBusca"
                type="text"
                placeholder="Buscar cliente..."
                class="w-full px-2.5 py-1.5 text-xs border border-border-light dark:border-border-dark rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-1 focus:ring-primary focus:border-primary text-text-light dark:text-text-dark placeholder-gray-400"
              />
            </div>

            <!-- Ações -->
            <div class="flex items-center justify-between px-3 py-1.5 border-b border-border-light dark:border-border-dark">
              <button @click="selecionarTodosClientes" class="text-[10px] text-primary hover:text-primary/80 font-medium">Todos</button>
              <button @click="limparFiltroClientes" class="text-[10px] text-subtext-light hover:text-text-light dark:hover:text-text-dark font-medium">Limpar</button>
            </div>

            <!-- Lista -->
            <div class="max-h-48 overflow-y-auto overscroll-contain">
              <label
                v-for="cliente in clientesPaginados"
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

            <!-- Paginação -->
            <div v-if="totalPaginasClientes > 1" class="flex items-center justify-between px-3 py-1.5 border-t border-border-light dark:border-border-dark">
              <span class="text-[10px] text-subtext-light">{{ clientesFiltrados.length }} clientes</span>
              <div class="flex items-center gap-1">
                <button @click="paginaClientes = Math.max(1, paginaClientes - 1)" :disabled="paginaClientes === 1" class="p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed">
                  <span class="material-icons-outlined text-xs text-subtext-light">chevron_left</span>
                </button>
                <span class="text-[10px] text-text-light dark:text-text-dark font-medium min-w-[40px] text-center">{{ paginaClientes }}/{{ totalPaginasClientes }}</span>
                <button @click="paginaClientes = Math.min(totalPaginasClientes, paginaClientes + 1)" :disabled="paginaClientes === totalPaginasClientes" class="p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed">
                  <span class="material-icons-outlined text-xs text-subtext-light">chevron_right</span>
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </div>

      <!-- Filtro Linhas - Multi Select Dropdown -->
      <div class="relative" ref="filtroLinhasRef">
        <button
          @click="toggleFiltroLinhas"
          class="flex items-center gap-1.5 bg-white dark:bg-gray-800 rounded-lg px-2.5 sm:px-3 h-[34px] sm:h-[38px] border transition-colors"
          :class="filtroLinhasAberto ? 'border-primary ring-1 ring-primary' : 'border-border-light dark:border-border-dark hover:border-gray-300 dark:hover:border-gray-500'"
        >
          <span class="material-icons-outlined text-sm text-subtext-light">tune</span>
          <span class="text-xs text-text-light dark:text-text-dark whitespace-nowrap">
            {{ filtroLinhasLabel }}
          </span>
          <span
            v-if="linhasVisiveis.length < opcoesLinhas.length && linhasVisiveis.length > 0"
            class="bg-primary text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-medium"
          >{{ linhasVisiveis.length }}</span>
          <span class="material-icons-outlined text-xs text-subtext-light transition-transform" :class="filtroLinhasAberto ? 'rotate-180' : ''">expand_more</span>
        </button>

        <Transition enter-active-class="transition ease-out duration-150" enter-from-class="opacity-0 scale-95 -translate-y-1" enter-to-class="opacity-100 scale-100 translate-y-0" leave-active-class="transition ease-in duration-100" leave-from-class="opacity-100 scale-100 translate-y-0" leave-to-class="opacity-0 scale-95 -translate-y-1">
          <div v-if="filtroLinhasAberto" class="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-border-light dark:border-border-dark rounded-lg shadow-lg z-50 w-52">
            <!-- Ações -->
            <div class="flex items-center px-3 py-1.5 border-b border-border-light dark:border-border-dark">
              <button @click="linhasVisiveis = opcoesLinhas.map(l => l.key)" class="text-[10px] text-primary hover:text-primary/80 font-medium">Todas</button>
            </div>

            <!-- Lista de opções -->
            <div class="py-1 max-h-[200px] overflow-y-auto">
              <label
                v-for="opcao in opcoesLinhas"
                :key="opcao.key"
                class="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
              >
                <div class="w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-colors"
                  :class="linhasVisiveis.includes(opcao.key) ? 'bg-primary border-primary' : 'border-gray-300 dark:border-gray-500'"
                >
                  <span v-if="linhasVisiveis.includes(opcao.key)" class="material-icons-outlined text-white text-[10px]">check</span>
                </div>
                <input type="checkbox" :checked="linhasVisiveis.includes(opcao.key)" @change="toggleLinha(opcao.key)" class="sr-only" />
                <span class="text-xs text-text-light dark:text-text-dark truncate">{{ opcao.label }}</span>
              </label>
            </div>
          </div>
        </Transition>
      </div>

      <!-- Spacer -->
      <div class="flex-1"></div>

      <!-- Botão Registrar -->
      <button @click="openRegistrarModal" class="btn btn-primary text-xs sm:text-sm px-3 sm:px-4 h-[34px] sm:h-[38px]">
        <span class="material-icons-outlined text-sm mr-1">add</span>
        <span class="hidden sm:inline">Registrar pedido</span>
        <span class="sm:hidden">Novo</span>
      </button>
    </div>


    <!-- Loading -->
    <div v-if="loading" class="p-8 text-center">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
      <p class="mt-2 text-subtext-light dark:text-subtext-dark">Carregando dados...</p>
    </div>

    <!-- Matriz de Produtos e Entregas Previstas - Container com scroll sincronizado -->
    <div v-if="!loading && produtosAtivos.length > 0" class="mb-3 sm:mb-4">
      <!-- Matriz de Produtos (sticky) -->
      <div class="sticky -top-4 sm:-top-6 lg:-top-8 z-20 bg-background-light dark:bg-background-dark -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pt-1 pb-1 matriz-sticky">
      <div ref="matrizScrollRef" class="overflow-x-auto scrollbar-hide" @scroll="syncScroll('matriz')" style="-ms-overflow-style: none; scrollbar-width: none;">
        <div class="inline-flex flex-col min-w-full gap-1 sm:gap-1.5">
          <!-- Header com códigos dos produtos -->
          <div class="flex items-end text-[10px] sm:text-xs py-1.5 sm:py-2 rounded-lg">
            <div class="w-[120px] sm:w-[280px] min-w-[120px] sm:min-w-[280px] shrink-0 px-2 sm:px-3 sticky left-0 bg-background-light dark:bg-background-dark z-10">&nbsp;</div>
            <div class="w-4 sm:w-6 shrink-0"></div>
            <div
              v-for="produto in produtosAtivos"
              :key="produto.id"
              class="w-10 sm:w-14 shrink-0 px-0.5 sm:px-1 text-center font-medium text-subtext-light dark:text-subtext-dark truncate"
              :title="produto.codigo + ' - ' + produto.nome"
            >
              {{ produto.codigo }}
            </div>
          </div>

          <!-- Vendido -->
          <div v-if="linhasVisiveis.includes('vendido')" class="flex items-center text-[10px] sm:text-xs bg-white dark:bg-gray-800 rounded-lg border border-border-light dark:border-border-dark py-1.5 sm:py-2">
            <div class="w-[80px] sm:w-[200px] shrink-0 px-2 sm:px-3 text-text-light dark:text-text-dark font-medium sticky left-0 bg-white dark:bg-gray-800 z-10 cursor-help flex items-center gap-1" @mouseenter="showMatrizTooltip($event, 'vendido')" @mouseleave="hideMatrizTooltip">Vendido <span class="material-icons-outlined text-[11px] text-gray-400">info_outline</span></div>
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
          <div v-if="linhasVisiveis.includes('vender')" class="flex items-center text-[10px] sm:text-xs bg-white dark:bg-gray-800 rounded-lg border border-border-light dark:border-border-dark py-1.5 sm:py-2">
            <div class="w-[80px] sm:w-[200px] shrink-0 px-2 sm:px-3 text-text-light dark:text-text-dark font-medium sticky left-0 bg-white dark:bg-gray-800 z-10 cursor-help flex items-center gap-1" @mouseenter="showMatrizTooltip($event, 'vender')" @mouseleave="hideMatrizTooltip">Vender <span class="material-icons-outlined text-[11px] text-gray-400">info_outline</span></div>
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

          <!-- Em Estoque -->
          <div v-if="linhasVisiveis.includes('em_estoque')" class="flex items-center text-[10px] sm:text-xs bg-white dark:bg-gray-800 rounded-lg border border-border-light dark:border-border-dark py-1.5 sm:py-2">
            <div class="w-[80px] sm:w-[200px] shrink-0 px-2 sm:px-3 text-text-light dark:text-text-dark font-medium sticky left-0 bg-white dark:bg-gray-800 z-10 cursor-help flex items-center gap-1" @mouseenter="showMatrizTooltip($event, 'em_estoque')" @mouseleave="hideMatrizTooltip">Em Estoque <span class="material-icons-outlined text-[11px] text-gray-400">info_outline</span></div>
            <div class="w-[40px] sm:w-[80px] shrink-0 px-0.5 sm:px-1 text-center font-bold text-green-600 sticky left-[80px] sm:left-[200px] bg-white dark:bg-gray-800 z-10">{{ getTotalMatriz('em_estoque') }}</div>
            <div class="w-4 sm:w-6 shrink-0"></div>
            <div
              v-for="produto in produtosAtivos"
              :key="produto.id"
              class="w-10 sm:w-14 shrink-0 px-0.5 sm:px-1 text-center"
              :class="getMatrizValue(produto.codigo, 'em_estoque') > 0 ? 'text-green-600 font-medium' : 'text-gray-400'"
            >
              {{ getMatrizValue(produto.codigo, 'em_estoque') || 0 }}
            </div>
          </div>

          <!-- A Prover -->
          <div v-if="linhasVisiveis.includes('prover')" class="flex items-center text-[10px] sm:text-xs bg-white dark:bg-gray-800 rounded-lg border border-border-light dark:border-border-dark py-1.5 sm:py-2">
            <div class="w-[80px] sm:w-[200px] shrink-0 px-2 sm:px-3 text-text-light dark:text-text-dark font-medium sticky left-0 bg-white dark:bg-gray-800 z-10 cursor-help flex items-center gap-1" @mouseenter="showMatrizTooltip($event, 'prover')" @mouseleave="hideMatrizTooltip">A Prover <span class="material-icons-outlined text-[11px] text-gray-400">info_outline</span></div>
            <div class="w-[40px] sm:w-[80px] shrink-0 px-0.5 sm:px-1 text-center font-bold sticky left-[80px] sm:left-[200px] bg-white dark:bg-gray-800 z-10" :class="getTotalMatriz('prover') > 0 ? 'text-red-600' : 'text-gray-300'">{{ getTotalMatriz('prover') }}</div>
            <div class="w-4 sm:w-6 shrink-0"></div>
            <div
              v-for="produto in produtosAtivos"
              :key="produto.id"
              class="w-10 sm:w-14 shrink-0 px-0.5 sm:px-1 text-center"
              :class="getMatrizValue(produto.codigo, 'prover') > 0 ? 'text-red-600 font-medium' : 'text-gray-300'"
            >
              {{ getMatrizValue(produto.codigo, 'prover') || 0 }}
            </div>
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
        <div v-else class="hidden sm:flex gap-6">
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
                    <span @click="toggleDataExpanded(entrega.data)" class="material-icons-outlined text-sm text-subtext-light transition-transform cursor-pointer hover:text-primary" :class="expandedDatas.includes(entrega.data) ? 'rotate-180' : ''">expand_more</span>
                  </div>
                </div>
                <template v-if="expandedDatas.includes(entrega.data)">
                  <div v-for="pedido in entrega.pedidos" :key="'left-pedido-' + pedido.id" class="h-[32px] px-3 flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg border border-border-light dark:border-border-dark">
                    <span class="text-primary font-medium text-xs truncate flex-1 min-w-0 cursor-pointer hover:underline" @click.stop="abrirPedido(pedido.id)">{{ pedido.cliente }}</span>
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
              <div class="bg-white dark:bg-gray-800 rounded-lg border border-border-light dark:border-border-dark h-[36px] flex items-center">
                <div v-for="produto in produtosAtivos" :key="'header-' + produto.id" class="w-14 shrink-0 px-1 text-center text-xs font-medium text-subtext-light dark:text-subtext-dark" :title="produto.nome">{{ produto.codigo }}</div>
              </div>
              <template v-for="entrega in entregasPorDataFiltrado" :key="'right-' + entrega.data">
                <div class="bg-row-beige dark:bg-gray-700 rounded-lg border border-border-light dark:border-border-dark h-[32px] flex items-center">
                  <div v-for="produto in produtosAtivos" :key="'data-' + entrega.data + '-' + produto.id" class="w-14 shrink-0 px-1 text-center text-xs" :class="getTotalProdutoDia(entrega.data, produto.codigo) > 0 ? 'text-teal-700 dark:text-teal-400 font-medium' : 'text-gray-400'">{{ getTotalProdutoDia(entrega.data, produto.codigo) || 0 }}</div>
                </div>
                <template v-if="expandedDatas.includes(entrega.data)">
                  <div v-for="pedido in entrega.pedidos" :key="'right-pedido-' + pedido.id" class="bg-white dark:bg-gray-800 rounded-lg border border-border-light dark:border-border-dark h-[32px] flex items-center">
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
                  <span class="material-icons-outlined text-base text-subtext-light transition-transform" :class="expandedDatas.includes(entrega.data) ? 'rotate-180' : ''">expand_more</span>
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
                    <span class="text-primary font-medium text-xs truncate flex-1 mr-2 cursor-pointer hover:underline" @click.stop="abrirPedido(pedido.id)">{{ pedido.cliente }}</span>
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
        <div v-if="showRegistrarModal" class="fixed inset-0 z-[80] overflow-y-auto">
          <div class="fixed inset-0 glass-backdrop" @click="closeRegistrarModal"></div>
          <div class="flex min-h-full items-center justify-center p-4">
            <Transition
              enter-active-class="transition-all duration-200"
              enter-from-class="opacity-0 scale-95"
              enter-to-class="opacity-100 scale-100"
              leave-active-class="transition-all duration-200"
              leave-from-class="opacity-100 scale-100"
              leave-to-class="opacity-0 scale-95"
            >
              <div v-if="showRegistrarModal" class="relative glass-panel rounded-lg shadow-xl w-full max-w-2xl">
            <!-- Modal Header -->
            <div class="border-b border-border-light dark:border-border-dark px-6 py-4 flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center shrink-0">
                <span class="material-icons-outlined text-primary text-lg">assignment</span>
              </div>
              <h2 class="text-lg font-semibold text-text-light dark:text-text-dark flex-1">
                {{ editMode ? `Editar Pedido #${formatPedidoNumero(pedidoEditando?.numero)}` : 'Registrar Pedido' }}
              </h2>
              <button @click="closeRegistrarModal" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <span class="material-icons-outlined">close</span>
              </button>
            </div>

            <!-- Modal Body -->
            <div class="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <!-- Previsao de Entrega e Cliente -->
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Previsão de entrega</label>
                  <input type="date" v-model="novoPedido.previsaoEntrega" class="input" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Cliente</label>
                  <select v-model="novoPedido.clienteId" class="input">
                    <option value="">Selecione</option>
                    <option v-for="cliente in clientes" :key="cliente.id" :value="cliente.id">
                      {{ cliente.nome_fantasia || cliente.razao_social }}
                    </option>
                  </select>
                </div>
              </div>

              <!-- Tabela de Preco e Frete -->
              <div class="grid grid-cols-2 gap-4">
                <div class="flex items-end gap-2">
                  <div class="flex-1">
                    <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Tabela de preço</label>
                    <select v-model="novoPedido.tabelaPrecoId" class="input" @change="onTabelaPrecoChange">
                      <option value="">Selecione...</option>
                      <option v-for="tabela in tabelasPreco" :key="tabela.id" :value="tabela.id">
                        {{ tabela.nome }}
                      </option>
                    </select>
                  </div>
                  <button
                    @click="showListaTabelasPreco = true"
                    class="w-9 h-9 flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-subtext-light dark:text-subtext-dark rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 active:scale-95 transition-all shrink-0"
                    title="Gerenciar tabelas de preço"
                  >
                    <span class="material-icons-outlined text-sm">settings</span>
                  </button>
                </div>
                <div>
                  <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Valor Frete</label>
                  <input
                    type="text"
                    :value="formatCentavos(Math.round(novoPedido.valorFrete * 100))"
                    @input="onCurrencyInput($event, v => novoPedido.valorFrete = v, () => novoPedido.valorFrete)"
                    @focus="($event.target as HTMLInputElement).select()"
                    placeholder="R$ 0,00"
                    class="input"
                  />
                </div>
              </div>

              <!-- Secao Item do Pedido -->
              <div class="pt-4 border-t border-border-light dark:border-border-dark">
                <h3 class="text-sm font-semibold text-text-light dark:text-text-dark mb-3">Item do pedido</h3>

                <div class="flex items-end gap-3">
                  <!-- Produto -->
                  <div class="flex-1">
                    <label class="block text-sm text-subtext-light dark:text-subtext-dark mb-1">Produto</label>
                    <select v-model="itemForm.produtoId" class="input" @change="onProdutoChange">
                      <option value="">Selecione</option>
                      <option v-for="produto in produtos" :key="produto.id" :value="produto.id">
                        {{ produto.codigo }} - {{ produto.nome }}
                      </option>
                    </select>
                  </div>

                  <!-- Qtd e Valor em linha -->
                  <div class="flex items-end gap-3">
                    <!-- Quantidade -->
                    <div class="w-20">
                      <label class="block text-sm text-subtext-light dark:text-subtext-dark mb-1">Qtd</label>
                      <input
                        type="number"
                        v-model.number="itemForm.quantidade"
                        placeholder="0"
                        class="input"
                        min="1"
                      />
                    </div>

                    <!-- Valor Unitario -->
                    <div class="w-28">
                      <label class="block text-sm text-subtext-light dark:text-subtext-dark mb-1">Valor unit.</label>
                      <input
                        type="text"
                        :value="formatCentavos(Math.round(itemForm.valorUnitario * 100))"
                        @input="onCurrencyInput($event, v => itemForm.valorUnitario = v, () => itemForm.valorUnitario)"
                        @focus="($event.target as HTMLInputElement).select()"
                        placeholder="R$ 0,00"
                        class="input"
                      />
                    </div>

                    <!-- Botao Adicionar -->
                    <button
                      @click="adicionarItem"
                      class="w-9 h-9 flex items-center justify-center bg-primary text-white rounded-lg hover:bg-primary/90 active:scale-95 transition-all shrink-0"
                      title="Adicionar item"
                    >
                      <span class="material-icons-outlined text-sm">add</span>
                    </button>
                  </div>
                </div>

                <!-- Tabela de Itens -->
                <div v-if="novoPedido.itens.length > 0" class="mt-3 border border-border-light dark:border-border-dark rounded-lg overflow-hidden">
                  <table class="w-full text-sm">
                    <thead class="bg-gray-50 dark:bg-gray-800 border-b border-border-light dark:border-border-dark">
                      <tr>
                        <th class="text-left text-xs font-medium text-subtext-light dark:text-subtext-dark px-3 py-2">Produto</th>
                        <th class="text-center text-xs font-medium text-subtext-light dark:text-subtext-dark px-3 py-2 w-14">Qtd</th>
                        <th class="text-right text-xs font-medium text-subtext-light dark:text-subtext-dark px-3 py-2 w-28">Valor unit.</th>
                        <th class="text-right text-xs font-medium text-subtext-light dark:text-subtext-dark px-3 py-2 w-28">Subtotal</th>
                        <th class="w-10"></th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-border-light dark:divide-border-dark">
                      <tr
                        v-for="(item, index) in novoPedido.itens"
                        :key="index"
                        class="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      >
                        <td class="px-3 py-2">
                          <p class="text-text-light dark:text-text-dark truncate">{{ getProdutoNome(item.produtoId) }}</p>
                        </td>
                        <td class="px-3 py-2 text-center text-text-light dark:text-text-dark font-medium">
                          {{ item.quantidade }}
                        </td>
                        <td class="px-3 py-2 text-right text-text-light dark:text-text-dark">
                          {{ formatCurrencyDetalhe(item.valorUnitario) }}
                        </td>
                        <td class="px-3 py-2 text-right font-medium text-text-light dark:text-text-dark">
                          {{ formatCurrencyDetalhe(item.quantidade * item.valorUnitario) }}
                        </td>
                        <td class="px-2 py-2 text-center">
                          <button
                            @click="removerItem(index)"
                            class="text-red-500 hover:text-red-700 active:scale-95 transition-all p-1"
                            title="Remover"
                          >
                            <span class="material-icons-outlined text-sm">close</span>
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <!-- Totais do Pedido -->
                <div v-if="novoPedido.itens.length > 0" class="mt-3 border border-border-light dark:border-border-dark rounded-lg px-3 py-2.5 space-y-1.5">
                  <div class="flex justify-between items-center text-sm">
                    <span class="text-subtext-light dark:text-subtext-dark">Subtotal ({{ totalProdutosModal }} produtos)</span>
                    <span class="text-text-light dark:text-text-dark">{{ formatCurrencyDetalhe(subtotalItensModal) }}</span>
                  </div>
                  <div v-if="novoPedido.valorFrete > 0" class="flex justify-between items-center text-sm">
                    <span class="text-subtext-light dark:text-subtext-dark">Frete</span>
                    <span class="text-text-light dark:text-text-dark">{{ formatCurrencyDetalhe(novoPedido.valorFrete) }}</span>
                  </div>
                  <div class="flex justify-between items-center text-sm pt-1.5 border-t border-border-light dark:border-border-dark">
                    <span class="font-semibold text-text-light dark:text-text-dark">Valor Total</span>
                    <span class="font-bold text-primary">{{ formatCurrencyDetalhe(valorTotalModal) }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Modal Footer -->
            <div class="border-t border-border-light dark:border-border-dark px-6 py-4 flex items-center gap-3">
              <div class="mr-auto"></div>
              <button @click="closeRegistrarModal" class="btn btn-secondary" :disabled="saving">Cancelar</button>
              <button @click="salvarPedido" class="btn btn-primary" :disabled="saving || !isModalFormValid">
                <span v-if="saving" class="material-icons-outlined animate-spin text-sm">refresh</span>
                {{ saving ? 'Salvando...' : editMode ? 'Atualizar Pedido' : 'Salvar Pedido' }}
              </button>
            </div>
              </div>
            </Transition>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Tooltip explicativo das linhas da matriz -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-150"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-100"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="matrizTooltip.visible"
          class="fixed z-[9999] max-w-xs p-3 text-xs leading-relaxed text-white bg-gray-900 dark:bg-gray-700 rounded-xl shadow-xl pointer-events-none"
          :style="{ top: matrizTooltip.top + 'px', left: matrizTooltip.left + 'px' }"
        >
          {{ matrizTooltip.text }}
          <div class="absolute bottom-full left-4 border-[6px] border-transparent border-b-gray-900 dark:border-b-gray-700"></div>
        </div>
      </Transition>
    </Teleport>

    <!-- Modal Lista Tabelas Preço -->
    <ModalListaTabelasPreco
      :show="showListaTabelasPreco"
      @close="showListaTabelasPreco = false"
      @updated="loadTabelasPreco"
    />

    <!-- Modal Detalhe Pedido -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-300 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-200 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="showPedidoDetalhe" class="fixed inset-0 z-[80] overflow-y-auto">
          <div class="fixed inset-0 glass-backdrop" @click="fecharPedidoDetalhe"></div>

          <div class="flex min-h-full items-center justify-center p-2 sm:p-4">
            <Transition
              enter-active-class="transition-all duration-200 ease-out"
              enter-from-class="opacity-0 scale-95"
              enter-to-class="opacity-100 scale-100"
              leave-active-class="transition-all duration-150 ease-in"
              leave-from-class="opacity-100 scale-100"
              leave-to-class="opacity-0 scale-95"
            >
              <div v-if="showPedidoDetalhe && pedidoDetalhe" class="relative z-[81] w-full max-w-lg">
                <div class="flex flex-col glass-panel rounded-xl shadow-2xl max-h-[90vh] overflow-hidden">
                  <!-- Header -->
                  <div class="px-4 sm:px-6 py-4 border-b border-gray-100 dark:border-border-dark flex items-center justify-between gap-3">
                    <div class="flex items-center gap-3 min-w-0 flex-1">
                      <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <span class="material-icons-outlined text-xl text-primary">receipt_long</span>
                      </div>
                      <div class="min-w-0 flex-1">
                        <h2 class="text-base font-semibold text-gray-900 dark:text-text-dark">
                          Pedido #{{ formatPedidoNumero(pedidoDetalhe.numero) }}
                        </h2>
                        <p class="text-xs text-gray-500 dark:text-subtext-dark truncate">
                          {{ pedidoDetalhe.clientes?.razao_social || pedidoDetalhe.clientes?.nome_fantasia || 'Sem cliente' }}
                        </p>
                      </div>
                    </div>
                    <span :class="getStatusBadgeClassDetalhe(pedidoDetalhe.status)" class="text-xs px-2 py-1 rounded-full font-medium shrink-0">
                      {{ getStatusLabelDetalhe(pedidoDetalhe.status) }}
                    </span>
                    <button @click="fecharPedidoDetalhe" class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors shrink-0">
                      <span class="material-icons-outlined text-gray-400">close</span>
                    </button>
                  </div>

                  <!-- Body -->
                  <div class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                    <!-- Info -->
                    <div class="grid grid-cols-2 gap-3">
                      <div>
                        <p class="text-[10px] text-gray-500 dark:text-subtext-dark uppercase tracking-wide mb-0.5">Data Pedido</p>
                        <p class="text-sm font-medium text-gray-900 dark:text-text-dark">{{ formatDateDetalhe(pedidoDetalhe.data_pedido) }}</p>
                      </div>
                      <div>
                        <p class="text-[10px] text-gray-500 dark:text-subtext-dark uppercase tracking-wide mb-0.5">Previsão Entrega</p>
                        <p class="text-sm font-medium text-gray-900 dark:text-text-dark">{{ formatDateDetalhe(pedidoDetalhe.data_entrega) }}</p>
                      </div>
                    </div>

                    <!-- Itens -->
                    <div>
                      <p class="text-xs font-semibold text-gray-900 dark:text-text-dark mb-2">Itens do Pedido</p>
                      <div v-if="pedidoDetalhe.pedido_itens && pedidoDetalhe.pedido_itens.length > 0" class="border border-border-light dark:border-border-dark rounded-lg overflow-hidden">
                        <table class="w-full text-xs">
                          <thead>
                            <tr class="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-subtext-dark">
                              <th class="text-left px-3 py-2 font-medium">Produto</th>
                              <th class="text-center px-3 py-2 font-medium w-16">Qtd</th>
                              <th class="text-right px-3 py-2 font-medium w-20">Unit.</th>
                              <th class="text-right px-3 py-2 font-medium w-20">Total</th>
                            </tr>
                          </thead>
                          <tbody class="divide-y divide-border-light dark:divide-border-dark">
                            <tr v-for="item in pedidoDetalhe.pedido_itens" :key="item.id">
                              <td class="px-3 py-2 text-gray-900 dark:text-text-dark">{{ getProdutoNome(item.produto_id) }}</td>
                              <td class="px-3 py-2 text-center text-gray-700 dark:text-gray-300">{{ item.quantidade }}</td>
                              <td class="px-3 py-2 text-right text-gray-700 dark:text-gray-300">{{ formatCurrencyDetalhe(item.valor_unitario) }}</td>
                              <td class="px-3 py-2 text-right font-medium text-gray-900 dark:text-text-dark">{{ formatCurrencyDetalhe(item.valor_total) }}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <p v-else class="text-xs text-gray-400 dark:text-gray-500 text-center py-4">Nenhum item</p>
                    </div>

                    <!-- Frete + Total -->
                    <div class="pt-2 border-t border-border-light dark:border-border-dark space-y-1.5">
                      <div v-if="pedidoDetalhe.valor_frete" class="flex items-center justify-between">
                        <span class="text-sm text-gray-500 dark:text-subtext-dark">Frete</span>
                        <span class="text-sm text-gray-700 dark:text-gray-300">{{ formatCurrencyDetalhe(pedidoDetalhe.valor_frete) }}</span>
                      </div>
                      <div class="flex items-center justify-between">
                        <span class="text-sm font-semibold text-gray-900 dark:text-text-dark">Total</span>
                        <span class="text-sm font-bold text-primary">{{ formatCurrencyDetalhe(pedidoDetalhe.valor_total) }}</span>
                      </div>
                    </div>

                    <!-- Observações -->
                    <div v-if="pedidoDetalhe.observacoes">
                      <p class="text-[10px] text-gray-500 dark:text-subtext-dark uppercase tracking-wide mb-0.5">Observações</p>
                      <p class="text-sm text-gray-700 dark:text-gray-300">{{ pedidoDetalhe.observacoes }}</p>
                    </div>
                  </div>

                  <!-- Footer -->
                  <div class="border-t border-border-light dark:border-border-dark px-6 py-4 flex items-center gap-3">
                    <div class="mr-auto"></div>
                    <button @click="fecharPedidoDetalhe" class="btn btn-secondary">Fechar</button>
                    <button @click="editarPedido(pedidoDetalhe)" class="btn btn-primary">
                      <span class="material-icons-outlined text-sm mr-1">edit</span>
                      Editar Pedido
                    </button>
                  </div>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Modal Confirmação de Baixa de Estoque -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="showBaixaEstoqueModal" class="fixed inset-0 z-[90] overflow-y-auto">
          <div class="fixed inset-0 glass-backdrop" @click="cancelarBaixaEstoque"></div>
          <div class="flex min-h-full items-center justify-center p-4">
            <div class="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-sm border border-border-light dark:border-border-dark p-6 z-10">
              <!-- Ícone -->
              <div class="flex items-center justify-center w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 mx-auto mb-4">
                <span class="material-icons-outlined text-yellow-600 dark:text-yellow-400 text-2xl">inventory_2</span>
              </div>

              <!-- Título e mensagem -->
              <h3 class="text-base font-semibold text-text-light dark:text-text-dark text-center mb-2">
                Dar baixa no estoque?
              </h3>
              <p class="text-sm text-subtext-light dark:text-subtext-dark text-center mb-1">
                Deseja registrar a saída dos itens deste pedido no estoque?
              </p>
              <p v-if="pedidoParaBaixa" class="text-xs text-center font-medium text-primary mb-6">
                {{ pedidoParaBaixa.clientes?.nome_fantasia || pedidoParaBaixa.clientes?.razao_social }}
              </p>

              <!-- Itens do pedido -->
              <div v-if="pedidoParaBaixa?.pedido_itens?.length" class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 mb-5 space-y-1">
                <div
                  v-for="item in pedidoParaBaixa.pedido_itens"
                  :key="item.id"
                  class="flex items-center justify-between text-xs text-text-light dark:text-text-dark"
                >
                  <span class="truncate mr-2">{{ getProdutoNome(item.produto_id) }}</span>
                  <span class="font-medium shrink-0 text-red-500">−{{ item.quantidade }}</span>
                </div>
              </div>

              <!-- Botões -->
              <div class="flex gap-2">
                <button
                  type="button"
                  @click="cancelarBaixaEstoque"
                  class="btn btn-secondary flex-1"
                  :disabled="baixandoEstoque"
                >
                  Não, só finalizar
                </button>
                <button
                  type="button"
                  @click="confirmarBaixaEstoque"
                  class="btn btn-primary flex-1"
                  :disabled="baixandoEstoque"
                >
                  <span v-if="baixandoEstoque" class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></span>
                  {{ baixandoEstoque ? 'Baixando...' : 'Sim, dar baixa' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onUnmounted, onBeforeUnmount, nextTick } from 'vue'
import VueDatePicker from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'
import { useCurrentCompany } from '~/composables/useCurrentCompany'

// Modal detalhe pedido
const showPedidoDetalhe = ref(false)
const pedidoDetalhe = ref<Pedido | null>(null)

// Modal confirmação de baixa de estoque
const showBaixaEstoqueModal = ref(false)
const pedidoParaBaixa = ref<Pedido | null>(null)
const baixandoEstoque = ref(false)

function abrirPedido(pedidoId: string) {
  const pedido = pedidos.value.find(p => p.id === pedidoId)
  if (pedido) {
    pedidoDetalhe.value = pedido
    showPedidoDetalhe.value = true
  }
}

function fecharPedidoDetalhe() {
  showPedidoDetalhe.value = false
  pedidoDetalhe.value = null
}

function formatDateDetalhe(date: string | null | undefined): string {
  if (!date) return '-'
  const [y, m, d] = date.split('-')
  return `${d}/${m}/${y}`
}

function formatCurrencyDetalhe(value: number | null | undefined): string {
  if (value == null) return 'R$ 0,00'
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatPedidoNumero(numero: string | null | undefined): string {
  if (!numero) return '—'
  const n = parseInt(numero)
  if (isNaN(n)) return numero
  return String(n).padStart(4, '0')
}

function getStatusLabelDetalhe(status: string): string {
  const labels: Record<string, string> = {
    previsto: 'Previsto', reservado: 'Reservado', confirmado: 'Confirmado',
    finalizado: 'Finalizado', cancelado: 'Cancelado', em_producao: 'Em Produção'
  }
  return labels[status] || status
}

function getStatusBadgeClassDetalhe(status: string): string {
  const classes: Record<string, string> = {
    previsto: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
    reservado: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    confirmado: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    finalizado: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    cancelado: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    em_producao: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
  }
  return classes[status] || 'bg-gray-100 text-gray-600'
}

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
  tabela_preco_id?: string | null
  numero: string
  data_pedido: string
  data_entrega: string | null
  status: string
  valor_total: number | null
  valor_frete: number | null
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
  em_estoque: number
  prover: number
}

interface EstoqueItem {
  id: string
  empresa_id: string
  produto_id: string | null
  quantidade: number
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
const user = useSupabaseUser()

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
const estoqueData = ref<EstoqueItem[]>([])
const produtoEspecieMap = ref<Map<string, string>>(new Map())

// Periodo
const periodo = ref({
  inicio: getInicioSemana(new Date()),
  fim: getFimSemana(new Date())
})

// Date range picker model (synced with periodo)
const dateRangeModel = ref<Date[]>([
  new Date(periodo.value.inicio + 'T00:00:00'),
  new Date(periodo.value.fim + 'T00:00:00')
])

// Dark mode detection para o datepicker
const isDark = ref(false)

// Preset dates para seleção rápida
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

// Format para exibir no input do datepicker
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

// Filtros e toggles
const clientesSelecionados = ref<string[]>([])
const filtroClienteAberto = ref(false)
const filtroClienteBusca = ref('')
const filtroClienteRef = ref<HTMLElement | null>(null)
const filtroClienteBuscaRef = ref<HTMLInputElement | null>(null)
// Filtro de linhas da matriz
const opcoesLinhas = [
  { key: 'vendido', label: 'Vendido', cor: 'bg-green-500' },
  { key: 'vender', label: 'Vender', cor: 'bg-yellow-500' },
  { key: 'em_estoque', label: 'Em Estoque', cor: 'bg-green-500' },
  { key: 'prover', label: 'A Prover', cor: 'bg-red-500' },
]
const tooltipsLinhas: Record<string, string> = {
  vendido: 'Soma de microverdes de pedidos reservados, confirmados ou finalizados',
  vender: 'Estoque disponível para novos pedidos (estoque atual menos pedidos já confirmados)',
  em_estoque: 'Quantidade atual de itens em estoque por produto',
  prover: 'Déficit de estoque: quanto precisa ser produzido para cobrir pedidos confirmados sem estoque suficiente',
}

const matrizTooltip = reactive({
  visible: false,
  text: '',
  top: 0,
  left: 0
})
let matrizTooltipTimeout: ReturnType<typeof setTimeout> | null = null

function showMatrizTooltip(event: MouseEvent, key: string) {
  if (matrizTooltipTimeout) clearTimeout(matrizTooltipTimeout)
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  matrizTooltip.text = tooltipsLinhas[key] || ''
  matrizTooltip.top = rect.bottom + 8
  matrizTooltip.left = rect.left
  matrizTooltip.visible = true
}

function hideMatrizTooltip() {
  matrizTooltipTimeout = setTimeout(() => {
    matrizTooltip.visible = false
  }, 50)
}

const linhasVisiveis = ref<string[]>(opcoesLinhas.map(l => l.key))
const filtroLinhasAberto = ref(false)
const filtroLinhasRef = ref<HTMLElement | null>(null)
const expandedDatas = ref<string[]>([])

// Filtro cliente - computed
const filtroClienteLabel = computed(() => {
  if (clientesSelecionados.value.length === 0) return 'Nenhum cliente'
  if (clientesSelecionados.value.length === clientes.value.length) return 'Todos clientes'
  if (clientesSelecionados.value.length === 1) {
    const c = clientes.value.find(cl => cl.id === clientesSelecionados.value[0])
    return c?.nome_fantasia || c?.razao_social || 'Cliente'
  }
  return `${clientesSelecionados.value.length} clientes`
})

const paginaClientes = ref(1)
const clientesPorPagina = 20

const clientesFiltrados = computed(() => {
  const busca = filtroClienteBusca.value.toLowerCase()
  if (!busca) return clientes.value
  return clientes.value.filter(c =>
    (c.nome_fantasia || '').toLowerCase().includes(busca) ||
    c.razao_social.toLowerCase().includes(busca)
  )
})

const totalPaginasClientes = computed(() =>
  Math.ceil(clientesFiltrados.value.length / clientesPorPagina)
)

const clientesPaginados = computed(() => {
  const inicio = (paginaClientes.value - 1) * clientesPorPagina
  return clientesFiltrados.value.slice(inicio, inicio + clientesPorPagina)
})

watch(filtroClienteBusca, () => {
  paginaClientes.value = 1
})

function toggleFiltroCliente() {
  filtroClienteAberto.value = !filtroClienteAberto.value
  if (filtroClienteAberto.value) {
    filtroClienteBusca.value = ''
    paginaClientes.value = 1
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

// Filtro linhas
const filtroLinhasLabel = computed(() => {
  if (linhasVisiveis.value.length === 0) return 'Nenhuma linha'
  if (linhasVisiveis.value.length === opcoesLinhas.length) return 'Todas linhas'
  if (linhasVisiveis.value.length === 1) {
    return opcoesLinhas.find(l => l.key === linhasVisiveis.value[0])?.label || 'Linha'
  }
  return `${linhasVisiveis.value.length} linhas`
})

function toggleFiltroLinhas() {
  filtroLinhasAberto.value = !filtroLinhasAberto.value
}

function toggleLinha(key: string) {
  const idx = linhasVisiveis.value.indexOf(key)
  if (idx >= 0) {
    if (linhasVisiveis.value.length <= 1) return
    linhasVisiveis.value.splice(idx, 1)
  } else {
    linhasVisiveis.value.push(key)
  }
}

function onClickOutsideFiltroLinhas(e: MouseEvent) {
  if (filtroLinhasRef.value && !filtroLinhasRef.value.contains(e.target as Node)) {
    filtroLinhasAberto.value = false
  }
}

// Refs para scroll sincronizado
const matrizScrollRef = ref<HTMLElement | null>(null)
const entregasScrollRef = ref<HTMLElement | null>(null)
const matrizStickyRef = ref<HTMLElement | null>(null)
const isScrolling = ref(false)

// Detectar quando a matriz esta "stuck" para adicionar shadow
function setupStickyDetection() {
  nextTick(() => {
    const stickyEl = document.querySelector('.matriz-sticky') as HTMLElement
    if (!stickyEl) return
    matrizStickyRef.value = stickyEl

    const scrollParent = stickyEl.closest('main')
    if (!scrollParent) return

    const onScroll = () => {
      if (!matrizStickyRef.value) return
      const rect = matrizStickyRef.value.getBoundingClientRect()
      const parentRect = scrollParent.getBoundingClientRect()
      // Se o top da matriz esta no top do main (com margem de 2px), esta stuck
      const isStuck = Math.abs(rect.top - parentRect.top) < 2
      matrizStickyRef.value.classList.toggle('is-stuck', isStuck)
    }

    scrollParent.addEventListener('scroll', onScroll, { passive: true })
    onUnmounted(() => scrollParent.removeEventListener('scroll', onScroll))
  })
}

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
const editMode = ref(false)
const pedidoEditando = ref<Pedido | null>(null)
const novoPedido = ref({
  previsaoEntrega: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`,
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
const tabelaPrecoItens = ref<{ produto_id: string; preco: number }[]>([])

// Computed - Produtos ativos ordenados por codigo
const produtosAtivos = computed(() => {
  return [...produtos.value].sort((a, b) => a.codigo.localeCompare(b.codigo))
})

// Computed - Matriz de produtos
const matrizProdutos = computed(() => {
  const matriz = new Map<string, MatrizProduto>()
  for (const produto of produtosAtivos.value) {
    matriz.set(produto.codigo, { codigo: produto.codigo, vendido: 0, vender: 0, em_estoque: 0, prover: 0 })
  }

  // --- VENDIDO: reservado + confirmado + finalizado + entregue ---
  const vendidoMap = new Map<string, number>()
  for (const pedido of pedidos.value) {
    if (!['reservado', 'confirmado', 'finalizado', 'entregue'].includes(pedido.status)) continue
    for (const item of (pedido.pedido_itens || [])) {
      const produto = produtos.value.find(p => p.id === item.produto_id)
      if (!produto) continue
      vendidoMap.set(produto.codigo, (vendidoMap.get(produto.codigo) || 0) + (item.quantidade || 0))
    }
  }

  // --- EM ESTOQUE: quantidade real da tabela estoque por produto ---
  const estoqueMap = new Map<string, number>()
  for (const e of estoqueData.value) {
    if (!e.produto_id) continue
    const produto = produtos.value.find(p => p.id === e.produto_id)
    if (!produto) continue
    estoqueMap.set(produto.codigo, e.quantidade || 0)
  }

  // --- CONFIRMADO: apenas pedidos com status "confirmado" (para Vender e Prover) ---
  const confirmadoMap = new Map<string, number>()
  for (const pedido of pedidos.value) {
    if (pedido.status !== 'confirmado') continue
    for (const item of (pedido.pedido_itens || [])) {
      const produto = produtos.value.find(p => p.id === item.produto_id)
      if (!produto) continue
      confirmadoMap.set(produto.codigo, (confirmadoMap.get(produto.codigo) || 0) + (item.quantidade || 0))
    }
  }

  // --- Aplicar na matriz ---
  for (const produto of produtosAtivos.value) {
    const m = matriz.get(produto.codigo)!
    const vendido    = vendidoMap.get(produto.codigo) || 0
    const em_estoque = estoqueMap.get(produto.codigo) || 0
    const confirmado = confirmadoMap.get(produto.codigo) || 0
    m.vendido    = vendido
    m.vender     = Math.max(0, em_estoque - confirmado)
    m.em_estoque = em_estoque
    m.prover     = Math.max(0, confirmado - em_estoque)
  }

  return matriz
})

// Computed - Entregas por data
const entregasPorData = computed(() => {
  const agrupado = new Map<string, EntregaPrevista>()

  // Filtrar pedidos com data_entrega no periodo (excluir cancelados)
  const pedidosFiltrados = pedidos.value.filter(p => {
    if (!p.data_entrega) return false
    if (p.status === 'cancelado') return false
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
const todosClientesSelecionados = computed(() =>
  clientesSelecionados.value.length === clientes.value.length
)

const entregasPorDataFiltrado = computed(() => {
  if (todosClientesSelecionados.value) return entregasPorData.value

  return entregasPorData.value.map(entrega => ({
    ...entrega,
    pedidos: entrega.pedidos.filter(p => clientesSelecionados.value.includes(p.clienteId))
  })).filter(e => e.pedidos.length > 0)
})

// Computed - Total produtos no modal
const totalProdutosModal = computed(() => {
  return novoPedido.value.itens.reduce((sum, item) => sum + (item.quantidade || 0), 0)
})

const subtotalItensModal = computed(() => {
  return novoPedido.value.itens.reduce((sum, item) => sum + (item.quantidade * item.valorUnitario), 0)
})

const valorTotalModal = computed(() => {
  return subtotalItensModal.value + (novoPedido.value.valorFrete || 0)
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

// Navegacao de periodo (setas avançam/recuam 7 dias)
function periodoAnterior() {
  const inicio = new Date(periodo.value.inicio + 'T00:00:00')
  const fim = new Date(periodo.value.fim + 'T00:00:00')
  inicio.setDate(inicio.getDate() - 7)
  fim.setDate(fim.getDate() - 7)
  dateRangeModel.value = [inicio, fim]
}

function proximoPeriodo() {
  const inicio = new Date(periodo.value.inicio + 'T00:00:00')
  const fim = new Date(periodo.value.fim + 'T00:00:00')
  inicio.setDate(inicio.getDate() + 7)
  fim.setDate(fim.getDate() + 7)
  dateRangeModel.value = [inicio, fim]
}

// Sync datepicker model → periodo strings
watch(dateRangeModel, (val) => {
  if (val && val.length === 2 && val[0] && val[1]) {
    periodo.value.inicio = val[0].toISOString().split('T')[0]
    periodo.value.fim = val[1].toISOString().split('T')[0]
  }
}, { deep: true })

// Funcoes da matriz
function getMatrizValue(codigo: string, tipo: 'vendido' | 'vender' | 'em_estoque' | 'prover'): number {
  const m = matrizProdutos.value.get(codigo)
  return m ? m[tipo] : 0
}

function getMatrizValueClass(codigo: string, tipo: 'vendido' | 'vender' | 'em_estoque' | 'prover'): string {
  const value = getMatrizValue(codigo, tipo)
  if (value < 0) return 'text-red-600 font-medium'
  if (value > 0) return 'text-yellow-600'
  return 'text-gray-400'
}

function getMatrizValueDisplay(codigo: string, tipo: 'vendido' | 'vender' | 'em_estoque' | 'prover'): string {
  const value = getMatrizValue(codigo, tipo)
  return value !== 0 ? value.toString() : ''
}

function getTotalMatriz(tipo: 'vendido' | 'vender' | 'em_estoque' | 'prover'): number {
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

// === ESTOQUE ===

// Atualiza ou cria registro de estoque para um produto (atualiza localmente também)
async function upsertEstoqueItem(produtoId: string, qtdNova: number) {
  const existing = estoqueData.value.find(e => e.produto_id === produtoId)
  if (existing?.id) {
    const { error } = await supabase
      .from('estoque')
      .update({ quantidade: qtdNova })
      .eq('id', existing.id)
    if (error) throw error
    existing.quantidade = qtdNova
  } else {
    const { data, error } = await supabase
      .from('estoque')
      .insert({ empresa_id: currentCompany.value!.id, produto_id: produtoId, quantidade: qtdNova })
      .select('id, empresa_id, produto_id, quantidade')
      .single()
    if (error) throw error
    if (data) estoqueData.value.push(data)
  }
}

// Handlers do modal de baixa de estoque
async function confirmarBaixaEstoque() {
  if (!pedidoParaBaixa.value) return
  baixandoEstoque.value = true
  try {
    await baixarEstoquePedido(pedidoParaBaixa.value)
    success('Estoque atualizado — baixa registrada com sucesso')
  } catch (e: any) {
    showError(e.message || 'Erro ao dar baixa no estoque')
  } finally {
    baixandoEstoque.value = false
    showBaixaEstoqueModal.value = false
    pedidoParaBaixa.value = null
  }
}

function cancelarBaixaEstoque() {
  showBaixaEstoqueModal.value = false
  pedidoParaBaixa.value = null
}

// Baixa estoque ao finalizar um pedido
async function baixarEstoquePedido(pedido: Pedido) {
  if (!currentCompany.value?.id) return
  const itens = pedido.pedido_itens || []
  if (itens.length === 0) return

  const nomeCliente = pedido.clientes?.nome_fantasia || pedido.clientes?.razao_social || `pedido ${pedido.id.slice(0, 8)}`

  for (const item of itens) {
    if (!item.produto_id || !item.quantidade || item.quantidade <= 0) continue

    const qtdAtual = estoqueData.value.find(e => e.produto_id === item.produto_id)?.quantidade || 0
    const qtdNova = qtdAtual - item.quantidade

    try {
      await upsertEstoqueItem(item.produto_id, qtdNova)

      await supabase
        .from('movimentacoes_estoque')
        .insert({
          empresa_id: currentCompany.value.id,
          produto_id: item.produto_id,
          tipo: 'saida',
          quantidade: item.quantidade,
          quantidade_anterior: qtdAtual,
          quantidade_nova: qtdNova,
          motivo: `Baixa automática — pedido finalizado (${nomeCliente})`,
          usuario_id: user.value?.id || null
        })
    } catch (e) {
      console.error('Erro ao baixar estoque do produto', item.produto_id, e)
    }
  }
}

// Estornar estoque quando pedido finalizado é cancelado
async function estornarEstoquePedido(pedido: Pedido) {
  if (!currentCompany.value?.id) return
  const itens = pedido.pedido_itens || []
  if (itens.length === 0) return

  const nomeCliente = pedido.clientes?.nome_fantasia || pedido.clientes?.razao_social || `pedido ${pedido.id.slice(0, 8)}`

  for (const item of itens) {
    if (!item.produto_id || !item.quantidade || item.quantidade <= 0) continue

    const qtdAtual = estoqueData.value.find(e => e.produto_id === item.produto_id)?.quantidade || 0
    const qtdNova = qtdAtual + item.quantidade

    try {
      await upsertEstoqueItem(item.produto_id, qtdNova)

      await supabase
        .from('movimentacoes_estoque')
        .insert({
          empresa_id: currentCompany.value.id,
          produto_id: item.produto_id,
          tipo: 'entrada',
          quantidade: item.quantidade,
          quantidade_anterior: qtdAtual,
          quantidade_nova: qtdNova,
          motivo: `Estorno automático — pedido cancelado (${nomeCliente})`,
          usuario_id: user.value?.id || null
        })
    } catch (e) {
      console.error('Erro ao estornar estoque do produto', item.produto_id, e)
    }
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

    // Ao finalizar: abrir modal para confirmar baixa de estoque
    if (newStatus === 'finalizado' && statusAnterior !== 'finalizado' && pedido) {
      pedidoParaBaixa.value = pedido
      showBaixaEstoqueModal.value = true
      success('Status atualizado')
    } else if (newStatus === 'cancelado' && statusAnterior === 'finalizado' && pedido) {
      // Estornar estoque quando pedido finalizado é cancelado
      try {
        await estornarEstoquePedido(pedido)
        success('Status atualizado — estoque estornado')
      } catch (e) {
        console.error('Erro ao estornar estoque:', e)
        success('Status atualizado (erro ao estornar estoque)')
      }
    } else {
      success('Status atualizado')
    }
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
  editMode.value = false
  pedidoEditando.value = null
  novoPedido.value = {
    previsaoEntrega: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`,
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
  editMode.value = false
  pedidoEditando.value = null
}

async function editarPedido(pedido: Pedido | null) {
  if (!pedido) return

  // Fechar detalhe e abrir modal de edição
  fecharPedidoDetalhe()

  editMode.value = true
  pedidoEditando.value = pedido

  // Carregar itens da tabela de preço se houver
  tabelaPrecoItens.value = []
  if (pedido.tabela_preco_id) {
    const { data } = await supabase
      .from('tabela_preco_itens')
      .select('produto_id, preco')
      .eq('tabela_preco_id', pedido.tabela_preco_id)
    tabelaPrecoItens.value = data || []
  }

  // Preencher form com dados do pedido
  novoPedido.value = {
    previsaoEntrega: pedido.data_entrega || '',
    clienteId: pedido.cliente_id || '',
    tabelaPrecoId: pedido.tabela_preco_id || '',
    valorFrete: pedido.valor_frete || 0,
    itens: (pedido.pedido_itens || []).map(item => ({
      produtoId: item.produto_id,
      quantidade: item.quantidade,
      valorUnitario: item.valor_unitario
    }))
  }
  itemForm.value = { produtoId: '', quantidade: 1, valorUnitario: 0 }
  showRegistrarModal.value = true
}

const showListaTabelasPreco = ref(false)

// Formatação monetária estilo banco: digita números, formata em centavos
function formatCentavos(centavos: number): string {
  const reais = centavos / 100
  return reais.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function onCurrencyInput(event: Event, setter: (val: number) => void, getter: () => number) {
  const input = event.target as HTMLInputElement
  const digits = input.value.replace(/\D/g, '')
  const centavos = parseInt(digits) || 0
  setter(centavos / 100)
  nextTick(() => {
    input.value = formatCentavos(centavos)
  })
}

async function onTabelaPrecoChange() {
  tabelaPrecoItens.value = []
  if (!novoPedido.value.tabelaPrecoId) return

  try {
    const { data } = await supabase
      .from('tabela_preco_itens')
      .select('produto_id, preco')
      .eq('tabela_preco_id', novoPedido.value.tabelaPrecoId)

    tabelaPrecoItens.value = data || []
  } catch (e: any) {
    console.error('Erro ao carregar itens da tabela de preco:', e)
  }
}

function onProdutoChange() {
  const produtoId = itemForm.value.produtoId
  if (!produtoId) return

  // Primeiro tenta preço da tabela selecionada
  const itemTabela = tabelaPrecoItens.value.find(i => i.produto_id === produtoId)
  if (itemTabela) {
    itemForm.value.valorUnitario = itemTabela.preco
    return
  }

  // Fallback: preço padrão do produto
  const produto = produtos.value.find(p => p.id === produtoId)
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
    showError('Preencha todos os campos obrigatórios')
    return
  }

  saving.value = true
  try {
    if (editMode.value && pedidoEditando.value) {
      await atualizarPedido()
    } else {
      await criarPedido()
    }
  } catch (e: any) {
    console.error('Erro ao salvar pedido:', e)
    showError(e.message || 'Erro ao salvar pedido')
  } finally {
    saving.value = false
  }
}

async function criarPedido() {
  // Gerar numero sequencial
  const { data: ultimoPedido } = await supabase
    .from('pedidos')
    .select('numero')
    .eq('empresa_id', currentCompany.value!.id)
    .not('numero', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const ultimoNumero = ultimoPedido?.numero ? parseInt(ultimoPedido.numero) : 0
  const novoNumero = String((isNaN(ultimoNumero) ? 0 : ultimoNumero) + 1)

  const valorTotal = novoPedido.value.itens.reduce(
    (sum, item) => sum + (item.quantidade * item.valorUnitario),
    0
  ) + (novoPedido.value.valorFrete || 0)

  const hoje = new Date()
  const hojeStr = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`

  const { data: pedidoData, error: pedidoError } = await supabase
    .from('pedidos')
    .insert({
      empresa_id: currentCompany.value!.id,
      cliente_id: novoPedido.value.clienteId,
      numero: novoNumero,
      data_pedido: hojeStr,
      data_entrega: novoPedido.value.previsaoEntrega,
      status: 'previsto',
      valor_total: valorTotal,
      valor_frete: novoPedido.value.valorFrete || null,
      tabela_preco_id: novoPedido.value.tabelaPrecoId || null,
      observacoes: null
    })
    .select()
    .single()

  if (pedidoError) throw pedidoError

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
  const dataEntrega = novoPedido.value.previsaoEntrega
  closeRegistrarModal()
  await loadPedidos()

  if (!expandedDatas.value.includes(dataEntrega)) {
    expandedDatas.value.push(dataEntrega)
  }
}

async function atualizarPedido() {
  const pedido = pedidoEditando.value!

  const valorTotal = novoPedido.value.itens.reduce(
    (sum, item) => sum + (item.quantidade * item.valorUnitario),
    0
  ) + (novoPedido.value.valorFrete || 0)

  // Atualizar campos do pedido
  const { error: updateError } = await supabase
    .from('pedidos')
    .update({
      cliente_id: novoPedido.value.clienteId,
      data_entrega: novoPedido.value.previsaoEntrega,
      tabela_preco_id: novoPedido.value.tabelaPrecoId || null,
      valor_total: valorTotal,
      valor_frete: novoPedido.value.valorFrete || null
    })
    .eq('id', pedido.id)

  if (updateError) throw updateError

  // Apagar itens antigos e re-inserir
  const { error: deleteError } = await supabase
    .from('pedido_itens')
    .delete()
    .eq('pedido_id', pedido.id)

  if (deleteError) throw deleteError

  if (novoPedido.value.itens.length > 0) {
    const itensToInsert = novoPedido.value.itens.map(item => ({
      pedido_id: pedido.id,
      produto_id: item.produtoId,
      quantidade: item.quantidade,
      valor_unitario: item.valorUnitario,
      valor_total: item.quantidade * item.valorUnitario
    }))

    const { error: insertError } = await supabase
      .from('pedido_itens')
      .insert(itensToInsert)

    if (insertError) throw insertError
  }

  success('Pedido atualizado com sucesso')
  const dataEntrega = novoPedido.value.previsaoEntrega
  closeRegistrarModal()
  await loadPedidos()

  if (!expandedDatas.value.includes(dataEntrega)) {
    expandedDatas.value.push(dataEntrega)
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
    clientesSelecionados.value = clientes.value.map(c => c.id)
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

async function loadEstoque() {
  if (!currentCompany.value?.id) {
    estoqueData.value = []
    return
  }
  try {
    const { data, error } = await supabase
      .from('estoque')
      .select('id, empresa_id, produto_id, quantidade')
      .eq('empresa_id', currentCompany.value.id)
      .not('produto_id', 'is', null)
    if (error) throw error
    estoqueData.value = data || []
  } catch (e: any) {
    console.error('Erro ao carregar estoque:', e)
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
    loadProducao(),
    loadEstoque()
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
  setupStickyDetection()
  document.addEventListener('click', onClickOutsideFiltroCliente)
  document.addEventListener('click', onClickOutsideFiltroLinhas)

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
  document.removeEventListener('click', onClickOutsideFiltroLinhas)
})
</script>

<style scoped>
/* Sticky matrix shadow */
.matriz-sticky {
  box-shadow: none;
  transition: box-shadow 0.2s ease;
}

.matriz-sticky.is-stuck {
  box-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.1);
}

.dark .matriz-sticky.is-stuck {
  box-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.4);
}

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

<style>
/* ============================================================
   VueDatePicker — BiomaOS theme (unscoped para afetar popup teleportado)
   ============================================================ */

/* ---------- Input ---------- */
.vendas-date-range-wrapper {
  min-width: 200px;
  max-width: 240px;
}

.vendas-date-range-wrapper .dp__input_wrap .dp__input {
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
  .vendas-date-range-wrapper .dp__input_wrap .dp__input {
    height: 38px;
  }
}

.vendas-date-range-wrapper .dp__input_wrap .dp__input:hover {
  border-color: #549E54;
}

.vendas-date-range-wrapper .dp__input_wrap .dp__input:focus,
.vendas-date-range-wrapper .dp__input_wrap .dp__input.dp__input_focus {
  border-color: #549E54;
  box-shadow: 0 0 0 2px rgba(84, 158, 84, 0.15);
}

.dark .vendas-date-range-wrapper .dp__input_wrap .dp__input {
  background: #2a2a2a;
  border-color: #404040;
  color: #e0e0e0;
}

.dark .vendas-date-range-wrapper .dp__input_wrap .dp__input:hover {
  border-color: #549E54;
}

.dark .vendas-date-range-wrapper .dp__input_wrap .dp__input:focus,
.dark .vendas-date-range-wrapper .dp__input_wrap .dp__input.dp__input_focus {
  border-color: #549E54;
  box-shadow: 0 0 0 2px rgba(84, 158, 84, 0.2);
}

/* ---------- Input icon ---------- */
.vendas-date-range-wrapper .dp__input_icon {
  color: #549E54;
}

.dark .vendas-date-range-wrapper .dp__input_icon {
  color: #86efac;
}

/* ---------- Menu popup ---------- */
.dp-menu-custom {
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 0.8rem;
  border-radius: 0.75rem !important;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.06) !important;
  overflow: hidden;
  z-index: 9999 !important;
}

/* ---------- Light theme ---------- */
.dp__theme_light {
  --dp-primary-color: #549E54;
  --dp-primary-text-color: #fff;
  --dp-background-color: #fff;
  --dp-secondary-color: #f0fdf4;
  --dp-text-color: #333;
  --dp-border-color: #e5e7eb;
  --dp-menu-border-color: #e5e7eb;
  --dp-hover-color: #e8f5e9;
  --dp-hover-text-color: #333;
  --dp-disabled-color: #d1d5db;
  --dp-range-between-dates-background-color: #e8f5e9;
  --dp-range-between-dates-text-color: #166534;
  --dp-range-between-border-color: #e8f5e9;
  --dp-scroll-bar-background: #f3f4f6;
  --dp-scroll-bar-color: #549E54;
  --dp-highlight-color: rgba(84, 158, 84, 0.1);
}

/* ---------- Dark theme ---------- */
.dp__theme_dark {
  --dp-primary-color: #549E54;
  --dp-primary-text-color: #fff;
  --dp-background-color: #2a2a2a;
  --dp-secondary-color: #1e1e1e;
  --dp-text-color: #e0e0e0;
  --dp-border-color: #404040;
  --dp-menu-border-color: #404040;
  --dp-hover-color: #333;
  --dp-hover-text-color: #e0e0e0;
  --dp-disabled-color: #555;
  --dp-range-between-dates-background-color: rgba(84, 158, 84, 0.15);
  --dp-range-between-dates-text-color: #86efac;
  --dp-range-between-border-color: rgba(84, 158, 84, 0.15);
  --dp-scroll-bar-background: #1e1e1e;
  --dp-scroll-bar-color: #549E54;
  --dp-highlight-color: rgba(84, 158, 84, 0.15);
}

/* ---------- Preset dates sidebar ---------- */
.dp__preset_ranges {
  font-size: 0.8rem;
  padding: 0.5rem 0;
}
</style>
