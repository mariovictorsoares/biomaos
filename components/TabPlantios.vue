<template>
  <div>
    <!-- Toolbar (fora do card) -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-4 mb-4">
      <!-- Lado Esquerdo: Filtros -->
      <div class="flex flex-col sm:flex-row gap-2 sm:gap-3 flex-1">
        <!-- Filtro Status -->
        <select v-model="filterStatus" class="input text-xs sm:text-sm flex-1 sm:flex-none sm:w-40">
          <option value="">Todos os Status</option>
          <option value="planejado">Planejado</option>
          <option value="em_andamento">Em Andamento</option>
          <option value="colhido">Colhido</option>
          <option value="cancelado">Cancelado</option>
        </select>

        <!-- Filtro Especie -->
        <select v-model="filterEspecie" class="input text-xs sm:text-sm flex-1 sm:flex-none sm:w-40">
          <option value="">Espécie</option>
          <option v-for="especie in especies" :key="especie.id" :value="especie.id">
            {{ especie.nome }}
          </option>
        </select>

        <!-- Filtro Fazenda -->
        <select v-model="filterFazenda" class="input text-xs sm:text-sm flex-1 sm:flex-none sm:w-40">
          <option value="">Fazenda</option>
          <option v-for="fazenda in fazendas" :key="fazenda.id" :value="fazenda.id">
            {{ fazenda.nome }}
          </option>
        </select>

        <!-- Data Colheita Inicio / Fim -->
        <div class="flex items-center gap-2">
          <span class="text-xs text-subtext-light dark:text-subtext-dark hidden sm:inline">Colheita</span>
          <input
            type="date"
            v-model="filterDataInicio"
            class="input text-xs sm:text-sm w-[130px]"
            placeholder="Início"
          />
          <span class="text-xs text-subtext-light dark:text-subtext-dark">até</span>
          <input
            type="date"
            v-model="filterDataFim"
            class="input text-xs sm:text-sm w-[130px]"
            placeholder="Fim"
          />
        </div>
      </div>

      <!-- Lado Direito: Botao Desktop -->
      <button @click="openNovoPlantioModal" class="hidden sm:flex btn btn-primary shrink-0">
        Novo Plantio
      </button>
      <!-- Botao Mobile -->
      <button @click="openNovoPlantioModal" class="sm:hidden btn btn-primary w-full justify-center">
        Novo Plantio
      </button>
    </div>

    <!-- Card Principal -->
    <div class="card" style="overflow: hidden; max-width: 100%;">

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-16">
        <span class="material-icons-outlined text-5xl text-gray-300 dark:text-gray-600 animate-spin">refresh</span>
        <p class="text-sm text-subtext-light dark:text-subtext-dark mt-3">Carregando plantios...</p>
      </div>

      <!-- Tabela - Desktop -->
      <div v-if="!loading && filteredPlantios.length > 0" class="hidden lg:block">
        <div class="table-scroll-container custom-scrollbar">
          <table class="w-full text-left border-collapse" style="min-width: 900px;">
            <thead>
              <tr class="bg-gray-100 dark:bg-gray-700/50 border-b border-border-light dark:border-border-dark text-xs">
                <th class="table-header font-medium whitespace-nowrap">Espécie</th>
                <th class="table-header font-medium text-center whitespace-nowrap">Bandejas</th>
                <th class="table-header font-medium text-center whitespace-nowrap">Status</th>
                <th class="table-header font-medium whitespace-nowrap">Etapa Atual</th>
                <th class="table-header font-medium text-center whitespace-nowrap cursor-pointer hover:text-text-light dark:hover:text-text-dark select-none" @click="toggleSort('data_plantio')">
                  <div class="flex items-center justify-center gap-0.5">
                    Data Plantio
                    <span v-if="sortField === 'data_plantio'" class="material-icons-outlined text-[10px]">{{ sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward' }}</span>
                  </div>
                </th>
                <th class="table-header font-medium text-center whitespace-nowrap cursor-pointer hover:text-text-light dark:hover:text-text-dark select-none" @click="toggleSort('data_colheita')">
                  <div class="flex items-center justify-center gap-0.5">
                    Data Colheita
                    <span v-if="sortField === 'data_colheita'" class="material-icons-outlined text-[10px]">{{ sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward' }}</span>
                  </div>
                </th>
                <th class="table-header font-medium whitespace-nowrap hidden xl:table-cell">Fazenda</th>
                <th class="table-header font-medium whitespace-nowrap hidden xl:table-cell">Pedido</th>
                <th class="table-header font-medium text-center whitespace-nowrap w-12"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border-light dark:divide-border-dark">
              <tr
                v-for="plantio in paginatedPlantios"
                :key="plantio.id"
                class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                @click="openDetailsSlideover(plantio)"
              >
                <td class="table-cell text-xs font-medium whitespace-nowrap">
                  {{ plantio.especies?.nome || '-' }}
                </td>
                <td class="table-cell text-center text-xs">{{ formatNumber(plantio.bandejas) }}</td>
                <td class="table-cell text-center p-1">
                  <span :class="['inline-block px-2 py-1 text-xs rounded-full border whitespace-nowrap', getStatusBadgeClass(plantio.status)]">
                    {{ getStatusLabel(plantio.status) }}
                  </span>
                </td>
                <td class="table-cell text-xs whitespace-nowrap">{{ plantio.etapa_atual || '-' }}</td>
                <td class="table-cell text-center text-xs whitespace-nowrap">{{ formatDateBR(plantio.data_plantio) }}</td>
                <td class="table-cell text-center text-xs whitespace-nowrap">{{ formatDateBR(plantio.data_colheita) }}</td>
                <td class="table-cell text-xs whitespace-nowrap hidden xl:table-cell">{{ plantio.fazendas?.nome || '-' }}</td>
                <td class="table-cell text-xs whitespace-nowrap hidden xl:table-cell">
                  <span v-if="plantio.pedido_itens?.pedidos" class="text-blue-600 dark:text-blue-400">
                    #{{ plantio.pedido_itens.pedidos.numero }}
                    <span class="text-[10px] text-subtext-light dark:text-subtext-dark ml-1">{{ plantio.pedido_itens.pedidos.clientes?.nome_fantasia }}</span>
                  </span>
                  <span v-else class="text-subtext-light dark:text-subtext-dark">-</span>
                </td>
                <td class="table-cell text-center p-1" @click.stop>
                  <button
                    @click="openDetailsSlideover(plantio)"
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
      </div>

      <!-- Cards - Mobile/Tablet -->
      <div v-if="!loading && filteredPlantios.length > 0" class="lg:hidden divide-y divide-border-light dark:divide-border-dark">
        <div
          v-for="plantio in paginatedPlantios"
          :key="plantio.id"
          class="p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
          @click="openDetailsSlideover(plantio)"
        >
          <!-- Header do Card -->
          <div class="flex items-start justify-between gap-2 mb-3">
            <div class="flex items-center gap-2 flex-wrap">
              <span :class="['text-[10px] px-2 py-0.5 rounded-full border whitespace-nowrap', getStatusBadgeClass(plantio.status)]">
                {{ getStatusLabel(plantio.status) }}
              </span>
              <span v-if="plantio.etapa_atual" class="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 whitespace-nowrap">
                {{ plantio.etapa_atual }}
              </span>
              <span v-if="plantio.pedido_itens?.pedidos" class="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 whitespace-nowrap">
                Pedido #{{ plantio.pedido_itens.pedidos.numero }}
              </span>
            </div>
            <button
              @click.stop="openDetailsSlideover(plantio)"
              class="text-gray-400 hover:text-primary transition-colors shrink-0"
            >
              <span class="material-icons-outlined text-xl">chevron_right</span>
            </button>
          </div>

          <!-- Info Principal -->
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <span class="text-sm font-bold text-primary">{{ plantio.especies?.codigo?.substring(0, 2) || '-' }}</span>
            </div>
            <div class="min-w-0 flex-1">
              <p class="font-semibold text-sm text-text-light dark:text-text-dark truncate">{{ plantio.especies?.nome || '-' }}</p>
              <p class="text-xs text-subtext-light dark:text-subtext-dark truncate">{{ plantio.fazendas?.nome || '-' }}</p>
            </div>
          </div>

          <!-- Grid de Informacoes -->
          <div class="grid grid-cols-3 gap-2 text-[11px]">
            <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-center">
              <p class="text-subtext-light dark:text-subtext-dark mb-0.5">Bandejas</p>
              <p class="font-semibold text-text-light dark:text-text-dark">{{ formatNumber(plantio.bandejas) }}</p>
            </div>
            <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-center">
              <p class="text-subtext-light dark:text-subtext-dark mb-0.5">Plantio</p>
              <p class="font-semibold text-text-light dark:text-text-dark">{{ formatDateBR(plantio.data_plantio) || '-' }}</p>
            </div>
            <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-center">
              <p class="text-subtext-light dark:text-subtext-dark mb-0.5">Colheita</p>
              <p class="font-semibold text-text-light dark:text-text-dark">{{ formatDateBR(plantio.data_colheita) || '-' }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="!loading && filteredPlantios.length === 0" class="text-center py-16 flex flex-col items-center px-4">
        <div class="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
          <span class="material-icons-outlined text-4xl text-gray-400 dark:text-gray-500">eco</span>
        </div>
        <h3 class="text-lg font-semibold text-text-light dark:text-text-dark mb-2">Nenhum plantio encontrado</h3>
        <p class="text-sm text-subtext-light dark:text-subtext-dark mb-6 max-w-sm">
          Não há plantios para os filtros selecionados.
        </p>
        <button @click="openNovoPlantioModal" class="btn btn-primary">
          Novo Plantio
        </button>
      </div>

      <!-- Paginacao -->
      <div v-if="filteredPlantios.length > 0" class="p-4 flex flex-col sm:flex-row items-center justify-between border-t border-border-light dark:border-border-dark text-xs text-subtext-light dark:text-subtext-dark gap-4">
        <div class="flex items-center gap-4">
          <select v-model="itemsPerPage" class="border border-border-light dark:border-border-dark rounded px-2 py-1 bg-white dark:bg-gray-800 text-sm cursor-pointer">
            <option :value="10">10 linhas</option>
            <option :value="25">25 linhas</option>
            <option :value="50">50 linhas</option>
          </select>
          <span>{{ filteredPlantios.length }} registros</span>
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="currentPage--"
            :disabled="currentPage === 1"
            class="p-1 border border-border-light dark:border-border-dark rounded hover:bg-gray-50 dark:hover:bg-gray-800 bg-white dark:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span class="material-icons-outlined text-sm">chevron_left</span>
          </button>
          <span>Página</span>
          <input
            v-model="pageInput"
            type="text"
            class="w-12 text-center border border-border-light dark:border-border-dark rounded px-2 py-1 bg-white dark:bg-gray-800 font-medium focus:outline-none focus:ring-1 focus:ring-primary"
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

    <!-- Slideover Detalhes -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-200"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="showDetailsSlideover" class="fixed inset-0 z-50 overflow-hidden">
          <div class="fixed inset-0 glass-backdrop" @click="closeDetailsSlideover"></div>

          <div class="fixed inset-y-0 right-0 flex max-w-full">
            <Transition
              enter-active-class="transform transition-transform duration-300 ease-out"
              enter-from-class="translate-x-full"
              enter-to-class="translate-x-0"
              leave-active-class="transform transition-transform duration-200 ease-in"
              leave-from-class="translate-x-0"
              leave-to-class="translate-x-full"
            >
              <div v-if="showDetailsSlideover" class="w-screen max-w-full sm:max-w-xl">
                <div class="h-full flex flex-col glass-panel shadow-2xl">
                  <!-- Header -->
                  <div class="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100 dark:border-border-dark flex items-center justify-between gap-3">
                    <div class="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                      <div class="w-10 h-10 sm:w-14 sm:h-14 rounded-xl bg-primary/10 flex items-center justify-center text-sm sm:text-lg font-bold text-primary overflow-hidden shrink-0">
                        {{ selectedPlantio?.especies?.codigo?.substring(0, 2) || 'PL' }}
                      </div>
                      <div class="min-w-0 flex-1">
                        <h2 class="text-base sm:text-lg font-semibold text-gray-900 dark:text-text-dark truncate">{{ selectedPlantio?.especies?.nome || '-' }}</h2>
                        <p class="text-xs sm:text-sm text-gray-500 dark:text-subtext-dark truncate">Lote: {{ selectedPlantio?.lotes_sementes?.numero || '-' }}</p>
                      </div>
                    </div>
                    <button @click="closeDetailsSlideover" class="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shrink-0">
                      <span class="material-icons-outlined text-xl">close</span>
                    </button>
                  </div>

                  <!-- Body -->
                  <div class="flex-1 overflow-y-auto">
                    <div class="p-4 sm:p-6 space-y-5 sm:space-y-6">
                      <!-- Status -->
                      <div class="flex flex-wrap items-center gap-2">
                        <span :class="['inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border', getStatusBadgeClass(selectedPlantio?.status)]">
                          {{ getStatusLabel(selectedPlantio?.status) }}
                        </span>
                        <span v-if="selectedPlantio?.etapa_atual" class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                          {{ selectedPlantio.etapa_atual }}
                        </span>
                      </div>

                      <!-- Pedido Link -->
                      <div v-if="selectedPlantio?.pedido_itens?.pedidos" class="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <span class="material-icons-outlined text-sm text-blue-500">shopping_cart</span>
                        <span class="text-xs text-blue-700 dark:text-blue-400">
                          Pedido #{{ selectedPlantio.pedido_itens.pedidos.numero }}
                          <span v-if="selectedPlantio.pedido_itens.pedidos.clientes?.nome_fantasia" class="ml-1">
                            - {{ selectedPlantio.pedido_itens.pedidos.clientes.nome_fantasia }}
                          </span>
                        </span>
                      </div>

                      <!-- Resumo -->
                      <div class="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 sm:p-5">
                        <h3 class="text-xs font-semibold text-gray-500 dark:text-subtext-dark uppercase tracking-wider mb-3 sm:mb-4">Informações</h3>
                        <div class="grid grid-cols-2 gap-3 sm:gap-4">
                          <div>
                            <p class="text-xs text-gray-500 dark:text-subtext-dark mb-1">Espécie</p>
                            <p class="text-sm font-medium text-gray-900 dark:text-text-dark">{{ selectedPlantio?.especies?.nome || '-' }}</p>
                          </div>
                          <div>
                            <p class="text-xs text-gray-500 dark:text-subtext-dark mb-1">Lote</p>
                            <p class="text-sm font-medium text-gray-900 dark:text-text-dark">{{ selectedPlantio?.lotes_sementes?.numero || '-' }}</p>
                          </div>
                          <div>
                            <p class="text-xs text-gray-500 dark:text-subtext-dark mb-1">Fazenda</p>
                            <p class="text-sm font-medium text-gray-900 dark:text-text-dark">{{ selectedPlantio?.fazendas?.nome || '-' }}</p>
                          </div>
                          <div>
                            <p class="text-xs text-gray-500 dark:text-subtext-dark mb-1">Bandejas</p>
                            <p class="text-sm font-medium text-gray-900 dark:text-text-dark">{{ formatNumber(selectedPlantio?.bandejas) }}</p>
                          </div>
                        </div>
                      </div>

                      <!-- Numeros -->
                      <div class="bg-[#F5F0E6] dark:bg-[#C4A574]/10 rounded-xl p-4 sm:p-5">
                        <h3 class="text-xs font-semibold text-[#C4A574] uppercase tracking-wider mb-3 sm:mb-4">Produção</h3>
                        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                          <div>
                            <p class="text-xs text-gray-500 dark:text-subtext-dark mb-1">Semente Necessaria</p>
                            <p class="text-sm font-medium text-gray-900 dark:text-text-dark">{{ formatDecimal(selectedPlantio?.semente_necessaria_g) }} g</p>
                          </div>
                          <div>
                            <p class="text-xs text-gray-500 dark:text-subtext-dark mb-1">Rendimento Esperado</p>
                            <p class="text-sm font-medium text-gray-900 dark:text-text-dark">{{ formatDecimal(selectedPlantio?.rendimento_esperado_g) }} g</p>
                          </div>
                          <div>
                            <p class="text-xs text-gray-500 dark:text-subtext-dark mb-1">Excedente</p>
                            <p class="text-sm font-medium text-gray-900 dark:text-text-dark">{{ formatDecimal(selectedPlantio?.excedente_g) }} g</p>
                          </div>
                          <div>
                            <p class="text-xs text-gray-500 dark:text-subtext-dark mb-1">Bandejas Perdidas</p>
                            <p class="text-sm font-medium text-red-600 dark:text-red-400">{{ formatNumber(selectedPlantio?.bandejas_perdidas) }}</p>
                          </div>
                          <div>
                            <p class="text-xs text-gray-500 dark:text-subtext-dark mb-1">Data Plantio</p>
                            <p class="text-sm font-medium text-gray-900 dark:text-text-dark">{{ formatDateBR(selectedPlantio?.data_plantio) || '-' }}</p>
                          </div>
                          <div>
                            <p class="text-xs text-gray-500 dark:text-subtext-dark mb-1">Data Colheita</p>
                            <p class="text-sm font-medium text-gray-900 dark:text-text-dark">{{ formatDateBR(selectedPlantio?.data_colheita) || '-' }}</p>
                          </div>
                        </div>
                      </div>

                      <!-- Ciclo de Cultivo -->
                      <div v-if="detailEtapas.length > 0" class="bg-green-50 dark:bg-green-900/10 rounded-xl p-4 sm:p-5">
                        <h3 class="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wider mb-3 sm:mb-4">Ciclo de Cultivo</h3>
                        <div class="space-y-2">
                          <div
                            v-for="(etapa, idx) in detailEtapas"
                            :key="idx"
                            class="flex items-center gap-3"
                          >
                            <div class="w-6 h-6 rounded-full bg-green-200 dark:bg-green-800 flex items-center justify-center text-[10px] font-bold text-green-800 dark:text-green-200 shrink-0">
                              {{ etapa.ordem }}
                            </div>
                            <div class="flex-1 min-w-0">
                              <div class="flex items-center justify-between gap-2">
                                <span class="text-xs font-medium text-gray-900 dark:text-text-dark truncate">{{ etapa.nome }}</span>
                                <span class="text-[10px] text-subtext-light dark:text-subtext-dark whitespace-nowrap">{{ etapa.duracao_dias }}d</span>
                              </div>
                              <div class="flex items-center justify-between gap-2 mt-0.5">
                                <span class="text-[10px] text-subtext-light dark:text-subtext-dark">{{ formatDateBR(etapa.data_inicio) }}</span>
                                <span class="text-[10px] text-subtext-light dark:text-subtext-dark">{{ formatDateBR(etapa.data_fim) }}</span>
                              </div>
                              <!-- Barra visual -->
                              <div class="mt-1 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                                <div
                                  class="h-full rounded-full bg-green-500 transition-all"
                                  :style="{ width: getEtapaProgress(etapa) + '%' }"
                                ></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <!-- Tarefas -->
                      <div v-if="detailTarefas.length > 0" class="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 sm:p-5">
                        <h3 class="text-xs font-semibold text-gray-500 dark:text-subtext-dark uppercase tracking-wider mb-3 sm:mb-4">Tarefas</h3>
                        <div class="space-y-2">
                          <div
                            v-for="tarefa in detailTarefas"
                            :key="tarefa.id"
                            class="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                          >
                            <button
                              @click.stop="toggleTarefa(tarefa)"
                              :class="[
                                'w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
                                tarefa.concluida
                                  ? 'bg-primary border-primary'
                                  : 'border-gray-300 dark:border-gray-600 hover:border-primary'
                              ]"
                            >
                              <span v-if="tarefa.concluida" class="material-icons-outlined text-white text-xs">check</span>
                            </button>
                            <div class="flex-1 min-w-0">
                              <p :class="['text-xs', tarefa.concluida ? 'line-through text-subtext-light dark:text-subtext-dark' : 'text-text-light dark:text-text-dark']">
                                {{ tarefa.nome }}
                              </p>
                              <p class="text-[10px] text-subtext-light dark:text-subtext-dark">
                                {{ formatDateBR(tarefa.data_prevista) }}
                                <span v-if="tarefa.data_conclusao" class="ml-1 text-green-600 dark:text-green-400">- Concluída {{ formatDateBR(tarefa.data_conclusao) }}</span>
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <!-- Notas -->
                      <div v-if="selectedPlantio?.notas" class="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 sm:p-5">
                        <h3 class="text-xs font-semibold text-gray-500 dark:text-subtext-dark uppercase tracking-wider mb-2">Notas</h3>
                        <p class="text-sm text-text-light dark:text-text-dark whitespace-pre-wrap">{{ selectedPlantio.notas }}</p>
                      </div>
                    </div>
                  </div>

                  <!-- Footer - Acoes -->
                  <div class="px-4 sm:px-6 py-4 border-t border-gray-100 dark:border-border-dark">
                    <div class="grid grid-cols-2 gap-2">
                      <button
                        v-if="selectedPlantio?.status === 'planejado'"
                        @click="changeStatus('em_andamento')"
                        class="btn btn-primary justify-center text-sm"
                        :disabled="saving"
                      >
                        <span class="material-icons-outlined text-base mr-1">play_arrow</span>
                        Iniciar
                      </button>
                      <button
                        v-if="selectedPlantio?.status === 'em_andamento'"
                        @click="changeStatus('colhido')"
                        class="btn btn-primary justify-center text-sm"
                        :disabled="saving"
                      >
                        <span class="material-icons-outlined text-base mr-1">grass</span>
                        Marcar Colhido
                      </button>
                      <button
                        v-if="selectedPlantio?.status !== 'cancelado' && selectedPlantio?.status !== 'colhido'"
                        @click="changeStatus('cancelado')"
                        class="btn btn-secondary justify-center text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        :disabled="saving"
                      >
                        <span class="material-icons-outlined text-base mr-1">close</span>
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Modal Novo Plantio -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-200"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="showNovoPlantioModal" class="fixed inset-0 z-[100] overflow-y-auto">
          <div class="fixed inset-0 glass-backdrop z-[100]" @click="closeNovoPlantioModal"></div>
          <div class="flex min-h-full items-center justify-center p-4">
            <Transition
              enter-active-class="transition-all duration-200"
              enter-from-class="opacity-0 scale-95"
              enter-to-class="opacity-100 scale-100"
              leave-active-class="transition-all duration-200"
              leave-from-class="opacity-100 scale-100"
              leave-to-class="opacity-0 scale-95"
            >
              <div v-if="showNovoPlantioModal" class="relative z-[101] bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                <!-- Header -->
                <div class="px-6 py-4 border-b border-border-light dark:border-border-dark flex items-center justify-between">
                  <h2 class="text-lg font-semibold text-text-light dark:text-text-dark">Novo Plantio</h2>
                  <button @click="closeNovoPlantioModal" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <span class="material-icons-outlined">close</span>
                  </button>
                </div>

                <!-- Body -->
                <div class="p-6 overflow-y-auto flex-1 space-y-4">
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Espécie</label>
                      <select v-model="novoPlantio.especie_id" class="input" @change="onNovoEspecieChange">
                        <option value="">Selecione</option>
                        <option v-for="especie in especies" :key="especie.id" :value="especie.id">
                          {{ especie.nome }}
                        </option>
                      </select>
                    </div>
                    <div v-if="novoPlantio.especie_id">
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Lote</label>
                      <select v-model="novoPlantio.lote_semente_id" class="input">
                        <option value="">Selecione o lote</option>
                        <option v-for="lote in lotesFiltradosNovo" :key="lote.id" :value="lote.id">
                          {{ lote.numero }}
                        </option>
                      </select>
                    </div>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Fazenda</label>
                      <select v-model="novoPlantio.fazenda_id" class="input">
                        <option value="">Selecione</option>
                        <option v-for="fazenda in fazendas" :key="fazenda.id" :value="fazenda.id">
                          {{ fazenda.nome }}
                        </option>
                      </select>
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Bandejas</label>
                      <input type="number" v-model.number="novoPlantio.bandejas" class="input" min="1" />
                    </div>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Data da Colheita</label>
                      <input type="date" v-model="novoPlantio.data_colheita" class="input" @change="calcularDatasNovo" />
                    </div>
                  </div>

                  <!-- Datas Calculadas -->
                  <div v-if="novoCalculado.data_plantio && novoPlantio.lote_semente_id" class="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-border-light dark:border-border-dark">
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Data de Plantio</label>
                      <p class="text-base text-text-light dark:text-text-dark">{{ formatDateBR(novoCalculado.data_plantio) }}</p>
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Semente (g)</label>
                      <p class="text-base text-text-light dark:text-text-dark">{{ formatDecimal(novoCalculado.semente_g) }}</p>
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Rendimento (g)</label>
                      <p class="text-base text-text-light dark:text-text-dark">{{ formatDecimal(novoCalculado.rendimento_g) }}</p>
                    </div>
                    <div v-if="novoCalculado.data_validade">
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Validade</label>
                      <p class="text-base text-text-light dark:text-text-dark">{{ formatDateBR(novoCalculado.data_validade) }}</p>
                    </div>
                  </div>
                </div>

                <!-- Footer -->
                <div class="px-6 py-4 border-t border-border-light dark:border-border-dark flex items-center justify-end gap-3">
                  <button @click="closeNovoPlantioModal" class="btn btn-secondary">Voltar</button>
                  <button @click="salvarNovoPlantio" class="btn btn-primary" :disabled="saving || !isNovoFormValid">
                    <span v-if="saving" class="material-icons-outlined text-sm animate-spin">refresh</span>
                    {{ saving ? 'Salvando...' : 'Criar Plantio' }}
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
import { useToast } from '~/composables/useToast'
import { useProducaoCalc } from '~/composables/useProducaoCalc'

// Interfaces
interface Plantio {
  id: string
  empresa_id: string
  especie_id: string
  lote_semente_id: string
  pedido_item_id?: string
  colheita_id?: string
  fazenda_id?: string
  bandejas: number
  bandejas_perdidas?: number
  semente_necessaria_g?: number
  rendimento_esperado_g?: number
  rendimento_alocado_g?: number
  excedente_g?: number
  status: string
  etapa_atual?: string
  data_plantio?: string
  data_colheita: string
  data_validade?: string
  notas?: string
  created_at?: string
  updated_at?: string
  especies?: { id: string; nome: string; codigo: string }
  lotes_sementes?: { id: string; numero: string }
  fazendas?: { id: string; nome: string }
  pedido_itens?: {
    id: string
    pedido_id: string
    pedidos?: {
      id: string
      numero: string
      clientes?: { nome_fantasia: string }
    }
  }
}

interface Fazenda { id: string; nome: string }
interface Especie {
  id: string
  codigo: string
  nome: string
  tempo_germinacao?: number
  tempo_luz?: number
  vida_util_dias?: number
}
interface Lote {
  id: string
  numero: string
  especie_id?: string
  status?: string
  rendimento_por_bandeja?: number
  densidade_semeadura?: number
  margem_seguranca?: number
}
interface Tarefa {
  id: string
  plantio_id: string
  nome: string
  tipo: string
  data_prevista: string
  data_conclusao?: string
  concluida: boolean
}
interface EtapaComDatas {
  nome: string
  ordem: number
  duracao_dias: number
  data_inicio: string
  data_fim: string
}

const supabase = useSupabaseClient()
const { currentCompany } = useCurrentCompany()
const { success, error: showError } = useToast()
const {
  calcularDataPlantio,
  calcularDatasEtapas,
  calcularSementeNecessaria,
  calcularRendimentoEsperado,
  calcularDataValidade,
  tempoTotalCultivo
} = useProducaoCalc()

// Estado
const plantios = ref<Plantio[]>([])
const fazendas = ref<Fazenda[]>([])
const especies = ref<Especie[]>([])
const lotes = ref<Lote[]>([])
const loading = ref(false)
const saving = ref(false)

// Filtros
const filterStatus = ref('')
const filterEspecie = ref('')
const filterFazenda = ref('')
const filterDataInicio = ref('')
const filterDataFim = ref('')

// Paginacao
const currentPage = ref(1)
const itemsPerPage = ref(10)
const pageInput = ref('1')

// Ordenacao
const sortField = ref<string>('')
const sortDirection = ref<'asc' | 'desc'>('asc')

// Modais
const showDetailsSlideover = ref(false)
const showNovoPlantioModal = ref(false)
const selectedPlantio = ref<Plantio | null>(null)

// Detalhe slideover
const detailEtapas = ref<EtapaComDatas[]>([])
const detailTarefas = ref<Tarefa[]>([])

// Formulario novo plantio
const novoPlantio = ref({
  especie_id: '',
  lote_semente_id: '',
  fazenda_id: '',
  bandejas: 1,
  data_colheita: ''
})

const novoCalculado = ref({
  data_plantio: '',
  semente_g: 0,
  rendimento_g: 0,
  data_validade: ''
})

// Number formatter
const numFmt = new Intl.NumberFormat('pt-BR')
const decFmt = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 })

// =====================================================
// Formatacao
// =====================================================

function formatDateBR(dateStr?: string): string {
  if (!dateStr) return ''
  const date = new Date(dateStr + 'T12:00:00')
  return date.toLocaleDateString('pt-BR')
}

function formatNumber(val?: number | null): string {
  if (val === undefined || val === null) return '0'
  return numFmt.format(val)
}

function formatDecimal(val?: number | null): string {
  if (val === undefined || val === null) return '0'
  return decFmt.format(val)
}

// =====================================================
// Status
// =====================================================

function getStatusLabel(status?: string): string {
  const labels: Record<string, string> = {
    planejado: 'Planejado',
    em_andamento: 'Em Andamento',
    colhido: 'Colhido',
    cancelado: 'Cancelado'
  }
  return labels[status || ''] || status || '-'
}

function getStatusBadgeClass(status?: string): string {
  const classes: Record<string, string> = {
    planejado: 'border-blue-500 bg-transparent text-blue-600 dark:border-blue-400 dark:text-blue-400',
    em_andamento: 'border-yellow-500 bg-transparent text-yellow-600 dark:border-yellow-400 dark:text-yellow-400',
    colhido: 'border-green-500 bg-transparent text-green-600 dark:border-green-400 dark:text-green-400',
    cancelado: 'border-red-500 bg-transparent text-red-600 dark:border-red-400 dark:text-red-400'
  }
  return classes[status || ''] || classes.planejado
}

// =====================================================
// Sorting
// =====================================================

function toggleSort(field: string) {
  if (sortField.value === field) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortDirection.value = 'asc'
  }
  currentPage.value = 1
}

// =====================================================
// Computed
// =====================================================

const filteredPlantios = computed(() => {
  let result = plantios.value

  if (filterStatus.value) {
    result = result.filter(p => p.status === filterStatus.value)
  }
  if (filterEspecie.value) {
    result = result.filter(p => p.especie_id === filterEspecie.value)
  }
  if (filterFazenda.value) {
    result = result.filter(p => p.fazenda_id === filterFazenda.value)
  }
  if (filterDataInicio.value) {
    result = result.filter(p => p.data_colheita >= filterDataInicio.value)
  }
  if (filterDataFim.value) {
    result = result.filter(p => p.data_colheita <= filterDataFim.value)
  }

  // Ordenacao
  if (sortField.value) {
    result = [...result].sort((a: any, b: any) => {
      const valA = a[sortField.value] || ''
      const valB = b[sortField.value] || ''
      const comparison = String(valA).localeCompare(String(valB))
      return sortDirection.value === 'asc' ? comparison : -comparison
    })
  }

  return result
})

const totalPages = computed(() => Math.ceil(filteredPlantios.value.length / itemsPerPage.value) || 1)

const paginatedPlantios = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  return filteredPlantios.value.slice(start, start + itemsPerPage.value)
})

const lotesFiltradosNovo = computed(() => {
  if (!novoPlantio.value.especie_id) return []
  return lotes.value.filter(l => l.especie_id === novoPlantio.value.especie_id)
})

const isNovoFormValid = computed(() => {
  return novoPlantio.value.especie_id &&
         novoPlantio.value.lote_semente_id &&
         novoPlantio.value.fazenda_id &&
         novoPlantio.value.bandejas > 0 &&
         novoPlantio.value.data_colheita
})

// =====================================================
// Etapa progress (visual bar in slideover)
// =====================================================

function getEtapaProgress(etapa: EtapaComDatas): number {
  const hoje = new Date()
  const inicio = new Date(etapa.data_inicio + 'T12:00:00')
  const fim = new Date(etapa.data_fim + 'T12:00:00')

  if (hoje < inicio) return 0
  if (hoje >= fim) return 100

  const totalMs = fim.getTime() - inicio.getTime()
  const elapsedMs = hoje.getTime() - inicio.getTime()
  return Math.round((elapsedMs / totalMs) * 100)
}

// =====================================================
// Paginacao
// =====================================================

function goToPage() {
  const page = parseInt(pageInput.value)
  if (!isNaN(page) && page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  } else {
    pageInput.value = String(currentPage.value)
  }
}

// =====================================================
// Data Loading
// =====================================================

async function loadPlantios() {
  if (!currentCompany.value?.id) return
  loading.value = true
  try {
    const { data, error } = await supabase
      .from('plantios')
      .select('*, especies(id, nome, codigo), lotes_sementes:lote_semente_id(id, numero), fazendas(id, nome), pedido_itens:pedido_item_id(id, pedido_id, pedidos(id, numero, clientes(nome_fantasia)))')
      .eq('empresa_id', currentCompany.value.id)
      .order('data_colheita', { ascending: true })
    if (error) throw error
    plantios.value = data || []
  } catch (e: any) {
    showError('Erro ao carregar plantios: ' + e.message)
  } finally {
    loading.value = false
  }
}

async function loadFazendas() {
  if (!currentCompany.value?.id) return
  const { data } = await supabase
    .from('fazendas')
    .select('id, nome')
    .eq('empresa_id', currentCompany.value.id)
    .eq('ativo', true)
    .order('nome')
  fazendas.value = data || []
}

async function loadEspecies() {
  if (!currentCompany.value?.id) return
  const { data } = await supabase
    .from('especies')
    .select('id, codigo, nome, tempo_germinacao, tempo_luz, vida_util_dias')
    .eq('empresa_id', currentCompany.value.id)
    .eq('ativo', true)
    .order('nome')
  especies.value = data || []
}

async function loadLotes() {
  if (!currentCompany.value?.id) return
  const { data } = await supabase
    .from('lotes_sementes')
    .select('id, numero, especie_id, status, rendimento_por_bandeja, densidade_semeadura, margem_seguranca')
    .eq('empresa_id', currentCompany.value.id)
    .eq('status', 'ativo')
    .order('created_at', { ascending: false })
  lotes.value = data || []
}

async function loadDetailEtapas(plantio: Plantio) {
  if (!plantio.especie_id || !plantio.data_colheita) {
    detailEtapas.value = []
    return
  }
  try {
    const { data } = await supabase
      .from('etapas_cultivo')
      .select('nome, ordem, duracao_dias')
      .eq('especie_id', plantio.especie_id)
      .order('ordem')

    const etapasRaw = data && data.length > 0 ? data : null
    const especie = especies.value.find(e => e.id === plantio.especie_id)
    detailEtapas.value = calcularDatasEtapas(plantio.data_colheita, etapasRaw, especie)
  } catch {
    detailEtapas.value = []
  }
}

async function loadDetailTarefas(plantio: Plantio) {
  try {
    const { data } = await supabase
      .from('tarefas')
      .select('id, plantio_id, nome, tipo, data_prevista, data_conclusao, concluida')
      .eq('plantio_id', plantio.id)
      .order('data_prevista')
    detailTarefas.value = data || []
  } catch {
    detailTarefas.value = []
  }
}

// =====================================================
// Slideover Detalhes
// =====================================================

function openDetailsSlideover(plantio: Plantio) {
  selectedPlantio.value = plantio
  showDetailsSlideover.value = true
  loadDetailEtapas(plantio)
  loadDetailTarefas(plantio)
}

function closeDetailsSlideover() {
  showDetailsSlideover.value = false
}

// =====================================================
// Alterar Status
// =====================================================

async function changeStatus(newStatus: string) {
  if (!selectedPlantio.value || !currentCompany.value?.id) return
  saving.value = true
  try {
    const updateData: Record<string, any> = { status: newStatus }
    // Se estiver mudando para colhido, setar data_colheita se nao houver
    if (newStatus === 'colhido' && !selectedPlantio.value.data_colheita) {
      updateData.data_colheita = new Date().toISOString().split('T')[0]
    }

    const { error } = await supabase
      .from('plantios')
      .update(updateData)
      .eq('id', selectedPlantio.value.id)
      .eq('empresa_id', currentCompany.value.id)
    if (error) throw error
    success('Status atualizado com sucesso!')
    closeDetailsSlideover()
    loadPlantios()
  } catch (e: any) {
    showError('Erro ao atualizar status: ' + e.message)
  } finally {
    saving.value = false
  }
}

// =====================================================
// Toggle Tarefa
// =====================================================

async function toggleTarefa(tarefa: Tarefa) {
  if (!currentCompany.value?.id) return
  const novaConcluida = !tarefa.concluida
  try {
    const { error } = await supabase
      .from('tarefas')
      .update({
        concluida: novaConcluida,
        data_conclusao: novaConcluida ? new Date().toISOString().split('T')[0] : null
      })
      .eq('id', tarefa.id)
    if (error) throw error
    tarefa.concluida = novaConcluida
    tarefa.data_conclusao = novaConcluida ? new Date().toISOString().split('T')[0] : undefined
  } catch (e: any) {
    showError('Erro ao atualizar tarefa: ' + e.message)
  }
}

// =====================================================
// Modal Novo Plantio
// =====================================================

function openNovoPlantioModal() {
  novoPlantio.value = { especie_id: '', lote_semente_id: '', fazenda_id: '', bandejas: 1, data_colheita: '' }
  novoCalculado.value = { data_plantio: '', semente_g: 0, rendimento_g: 0, data_validade: '' }
  showNovoPlantioModal.value = true
}

function closeNovoPlantioModal() {
  showNovoPlantioModal.value = false
}

function onNovoEspecieChange() {
  novoPlantio.value.lote_semente_id = ''
  novoCalculado.value = { data_plantio: '', semente_g: 0, rendimento_g: 0, data_validade: '' }
}

async function calcularDatasNovo() {
  const { especie_id, lote_semente_id, data_colheita, bandejas } = novoPlantio.value
  if (!especie_id || !lote_semente_id || !data_colheita) {
    novoCalculado.value = { data_plantio: '', semente_g: 0, rendimento_g: 0, data_validade: '' }
    return
  }

  const especie = especies.value.find(e => e.id === especie_id)
  const lote = lotes.value.find(l => l.id === lote_semente_id)
  if (!especie || !lote) return

  // Buscar etapas de cultivo
  let etapasRaw = null
  try {
    const { data } = await supabase
      .from('etapas_cultivo')
      .select('nome, ordem, duracao_dias')
      .eq('especie_id', especie_id)
      .order('ordem')
    if (data && data.length > 0) etapasRaw = data
  } catch { /* usa fallback legado */ }

  const dataPlantio = calcularDataPlantio(data_colheita, etapasRaw, especie)
  const semente = calcularSementeNecessaria(bandejas, lote)
  const rendimento = calcularRendimentoEsperado(bandejas, lote)
  const validade = calcularDataValidade(data_colheita, especie)

  novoCalculado.value = {
    data_plantio: dataPlantio,
    semente_g: semente,
    rendimento_g: rendimento,
    data_validade: validade || ''
  }
}

async function salvarNovoPlantio() {
  if (!currentCompany.value?.id || !isNovoFormValid.value) return
  saving.value = true

  try {
    const { especie_id, lote_semente_id, fazenda_id, bandejas, data_colheita } = novoPlantio.value
    const especie = especies.value.find(e => e.id === especie_id)
    const lote = lotes.value.find(l => l.id === lote_semente_id)
    if (!especie || !lote) throw new Error('Espécie ou Lote não encontrado')

    // Buscar etapas
    let etapasRaw: any[] | null = null
    try {
      const { data } = await supabase
        .from('etapas_cultivo')
        .select('nome, ordem, duracao_dias')
        .eq('especie_id', especie_id)
        .order('ordem')
      if (data && data.length > 0) etapasRaw = data
    } catch { /* usa fallback legado */ }

    const dataPlantio = calcularDataPlantio(data_colheita, etapasRaw, especie)
    const sementeNecessaria = calcularSementeNecessaria(bandejas, lote)
    const rendimentoEsperado = calcularRendimentoEsperado(bandejas, lote)
    const dataValidade = calcularDataValidade(data_colheita, especie)

    // Inserir plantio
    const { data: plantioData, error: plantioError } = await supabase
      .from('plantios')
      .insert({
        empresa_id: currentCompany.value.id,
        especie_id,
        lote_semente_id,
        fazenda_id: fazenda_id || null,
        bandejas,
        semente_necessaria_g: sementeNecessaria,
        rendimento_esperado_g: rendimentoEsperado,
        data_plantio: dataPlantio,
        data_colheita,
        data_validade: dataValidade,
        status: 'planejado',
        etapa_atual: etapasRaw && etapasRaw.length > 0 ? etapasRaw[0].nome : null
      })
      .select('id')
      .single()

    if (plantioError) throw plantioError

    // Criar tarefas automaticamente a partir das etapas de cultivo
    if (plantioData && etapasRaw && etapasRaw.length > 0) {
      const etapasComDatas = calcularDatasEtapas(data_colheita, etapasRaw, especie)
      const tarefas = etapasComDatas.map(etapa => ({
        empresa_id: currentCompany.value!.id,
        plantio_id: plantioData.id,
        nome: etapa.nome,
        tipo: 'cultivo',
        especie_id,
        bandejas,
        data_prevista: etapa.data_inicio,
        concluida: false
      }))

      const { error: tarefasError } = await supabase.from('tarefas').insert(tarefas)
      if (tarefasError) {
        console.warn('Erro ao criar tarefas:', tarefasError.message)
      }
    }

    success('Plantio criado com sucesso!')
    closeNovoPlantioModal()
    loadPlantios()
  } catch (e: any) {
    showError('Erro ao salvar plantio: ' + e.message)
  } finally {
    saving.value = false
  }
}

// =====================================================
// Watchers
// =====================================================

watch(() => currentCompany.value?.id, (newId) => {
  if (newId) { loadPlantios(); loadFazendas(); loadEspecies(); loadLotes() }
}, { immediate: true })

watch([filterStatus, filterEspecie, filterFazenda, filterDataInicio, filterDataFim], () => {
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

// Recalcular dados ao mudar campos do novo plantio
watch(
  () => [novoPlantio.value.bandejas, novoPlantio.value.lote_semente_id, novoPlantio.value.data_colheita],
  () => { calcularDatasNovo() }
)

onMounted(() => {
  if (currentCompany.value?.id) { loadPlantios(); loadFazendas(); loadEspecies(); loadLotes() }
})
</script>

<style scoped>
/* Container da tabela com scroll */
.table-scroll-container {
  overflow-x: auto;
  overflow-y: visible;
  max-width: 100%;
  width: 100%;
}

/* Barra de scroll customizada para a tabela */
.custom-scrollbar {
  scrollbar-width: auto;
  scrollbar-color: #4A7C59 #e5e7eb;
}

.custom-scrollbar::-webkit-scrollbar {
  height: 12px;
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
</style>
