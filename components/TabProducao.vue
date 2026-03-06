<template>
  <div>
    <!-- Toolbar (fora do card) -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-4 mb-4">
      <!-- Lado Esquerdo: Filtros -->
      <div class="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 flex-1 min-w-0">
        <!-- Seletor de Período -->
        <div class="flex items-center gap-2">
          <span class="text-xs text-subtext-light dark:text-subtext-dark hidden sm:inline">Período</span>
          <div class="flex items-center">
            <button
              @click="previousPeriod"
              class="p-1.5 sm:p-2 border border-border-light dark:border-border-dark rounded-l-lg hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 transition-colors"
            >
              <span class="material-icons text-sm">chevron_left</span>
            </button>
            <!-- Modo semana: texto clicável -->
            <div v-if="!customDateMode"
                 @click="toggleCustomDateMode"
                 class="px-2 sm:px-3 py-1.5 sm:py-2 border-y border-border-light dark:border-border-dark bg-white dark:bg-gray-800 text-[11px] sm:text-sm min-w-[140px] sm:min-w-[200px] text-center whitespace-nowrap cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                 title="Clique para escolher datas personalizadas">
              {{ formatDateBR(periodoInicio) }} até {{ formatDateBR(periodoFim) }}
            </div>
            <!-- Modo custom: dois date inputs -->
            <div v-else class="flex items-center border-y border-border-light dark:border-border-dark bg-white dark:bg-gray-800">
              <input type="date"
                     v-model="customInicio"
                     class="w-[120px] text-center text-xs py-1.5 px-1 bg-transparent border-none focus:ring-0 focus:outline-none" />
              <span class="text-[10px] text-subtext-light dark:text-subtext-dark">até</span>
              <input type="date"
                     v-model="customFim"
                     class="w-[120px] text-center text-xs py-1.5 px-1 bg-transparent border-none focus:ring-0 focus:outline-none" />
            </div>
            <button
              @click="nextPeriod"
              class="p-1.5 sm:p-2 border border-border-light dark:border-border-dark rounded-r-lg hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 transition-colors"
            >
              <span class="material-icons text-sm">chevron_right</span>
            </button>
          </div>
        </div>

        <!-- Filtros por Etapa -->
        <div class="flex items-center gap-1 overflow-visible pb-1 -mx-3 px-3 sm:mx-0 sm:px-0 sm:pb-0">
          <!-- Ícone de ajuda com tooltip via Teleport -->
          <div class="hidden sm:flex items-center shrink-0" ref="tooltipTriggerRef"
               @mouseenter="showEtapaTooltip = true"
               @mouseleave="showEtapaTooltip = false">
            <span class="material-icons text-sm text-subtext-light dark:text-subtext-dark cursor-help">help_outline</span>
          </div>
          <Teleport to="body">
            <div v-if="showEtapaTooltip"
                 class="etapa-tooltip-fixed"
                 :style="etapaTooltipStyle">
              <div class="text-xs font-semibold mb-1.5">Como funcionam os filtros</div>
              <div class="space-y-1 text-[11px] leading-relaxed">
                <div><span class="font-medium text-white">Todos:</span> Produções a serem <span class="text-green-300 font-medium">colhidas</span> no período</div>
                <div><span class="font-medium text-white">Plantio:</span> Produções a serem <span class="text-green-300 font-medium">plantadas</span> no período</div>
                <div><span class="font-medium text-white">Luz:</span> Produções que entram na <span class="text-green-300 font-medium">fase de luz</span> no período</div>
                <div><span class="font-medium text-white">Colheita:</span> Produções a serem <span class="text-green-300 font-medium">colhidas</span> no período</div>
              </div>
              <div class="etapa-tooltip-arrow-fixed"></div>
            </div>
          </Teleport>
          <button
            v-for="etapa in etapas"
            :key="etapa.value"
            @click="filterEtapa = etapa.value"
            :class="[
              'px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap transition-all shrink-0',
              filterEtapa === etapa.value
                ? 'bg-[#4A7C59] text-white'
                : 'bg-white dark:bg-gray-800 border border-border-light dark:border-border-dark text-text-light dark:text-text-dark hover:bg-gray-50 dark:hover:bg-gray-700'
            ]"
          >
            {{ etapa.label }}
          </button>
        </div>

        <!-- Filtros Dropdown -->
        <div class="flex gap-2 flex-1">
          <select v-model="filterFazenda" class="input text-xs sm:text-sm flex-1 sm:flex-none sm:w-40">
            <option value="">Fazenda</option>
            <option v-for="fazenda in fazendas" :key="fazenda.id" :value="fazenda.id">
              {{ fazenda.nome }}
            </option>
          </select>
          <select v-model="filterEspecie" class="input text-xs sm:text-sm flex-1 sm:flex-none sm:w-40">
            <option value="">Espécie</option>
            <option v-for="especie in especies" :key="especie.id" :value="especie.id">
              {{ especie.nome }}
            </option>
          </select>
        </div>

        <!-- Exibir Finalizados -->
        <label class="flex items-center gap-2 cursor-pointer whitespace-nowrap">
          <div class="relative">
            <input
              type="checkbox"
              v-model="exibirFinalizados"
              class="sr-only peer"
            />
            <div class="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#4A7C59]"></div>
          </div>
          <span class="text-xs sm:text-sm text-text-light dark:text-text-dark">Exibir Finalizados</span>
        </label>
      </div>

      <!-- Lado Direito: Botão Desktop -->
      <button @click="openCadastroModal" class="hidden sm:flex btn btn-primary shrink-0">
        Cadastrar Produção
      </button>
      <!-- Botão Mobile -->
      <button @click="openCadastroModal" class="sm:hidden btn btn-primary w-full justify-center">
        Cadastrar Produção
      </button>
    </div>

    <!-- Card Principal -->
    <div class="card" style="overflow: hidden; max-width: 100%;">

      <!-- Resumo / KPIs -->
      <div class="p-3 sm:p-4 border-b border-border-light dark:border-border-dark">
        <div class="flex items-center gap-6 sm:gap-10 overflow-x-auto pb-1">
          <div v-for="kpi in kpis" :key="kpi.label" class="flex items-center gap-2 shrink-0">
            <div :class="['w-1 h-12 rounded-full', kpi.color]"></div>
            <div>
              <p class="text-xs text-subtext-light dark:text-subtext-dark">{{ kpi.label }}</p>
              <div class="flex items-baseline gap-2">
                <p :class="['text-xl font-bold', kpi.textColor]">{{ kpi.value }}</p>
                <p :class="['text-sm', kpi.textColor]">{{ kpi.percent }}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-16">
        <span class="material-icons text-5xl text-gray-300 dark:text-gray-600 animate-spin">refresh</span>
        <p class="text-sm text-subtext-light dark:text-subtext-dark mt-3">Carregando produção...</p>
      </div>

      <!-- Tabela - Desktop -->
      <div v-if="!loading && filteredProducao.length > 0" class="hidden lg:block">
        <!-- Container com scroll horizontal -->
        <div class="table-scroll-container custom-scrollbar" ref="tableScrollRef">
          <table class="producao-table w-full text-left border-collapse" style="min-width: 1100px;">
              <thead>
                <!-- Header com seções coloridas -->
                <tr>
                  <th colspan="9" class="bg-[#C4A574] text-white text-center py-2 text-xs font-medium border-r border-[#B39560]">
                    Planejado
                  </th>
                  <th colspan="10" class="bg-[#4A7C59] text-white text-center py-2 text-xs font-medium">
                    Realizado
                  </th>
                </tr>
                <!-- Subheader -->
                <tr class="bg-gray-100 dark:bg-gray-700/50 border-b border-border-light dark:border-border-dark text-xs">
                  <!-- Cod e Fazenda -->
                  <th class="table-header font-medium whitespace-nowrap">Cod</th>
                  <th class="table-header font-medium whitespace-nowrap">Fazenda</th>
                  <th class="table-header font-medium text-center whitespace-nowrap w-10">Orig.</th>
                  <!-- Planejado -->
                  <th class="table-header font-medium whitespace-nowrap">Espécie</th>
                  <th class="table-header font-medium text-center whitespace-nowrap">Qtd</th>
                  <th class="table-header font-medium text-center whitespace-nowrap">Band.</th>
                  <th class="table-header font-medium text-center whitespace-nowrap cursor-pointer hover:text-text-light dark:hover:text-text-dark select-none" @click="toggleSort('data_plantio_previsto')">
                    <div class="flex items-center justify-center gap-0.5">
                      Plantio
                      <span v-if="sortField === 'data_plantio_previsto'" class="material-icons text-[10px]">{{ sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward' }}</span>
                    </div>
                  </th>
                  <th class="table-header font-medium text-center whitespace-nowrap cursor-pointer hover:text-text-light dark:hover:text-text-dark select-none" @click="toggleSort('data_luz_prevista')">
                    <div class="flex items-center justify-center gap-0.5">
                      Luz
                      <span v-if="sortField === 'data_luz_prevista'" class="material-icons text-[10px]">{{ sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward' }}</span>
                    </div>
                  </th>
                  <th class="table-header font-medium text-center border-r border-border-light dark:border-border-dark whitespace-nowrap cursor-pointer hover:text-text-light dark:hover:text-text-dark select-none" @click="toggleSort('data_colheita_prevista')">
                    <div class="flex items-center justify-center gap-0.5">
                      Colheita
                      <span v-if="sortField === 'data_colheita_prevista'" class="material-icons text-[10px]">{{ sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward' }}</span>
                    </div>
                  </th>
                  <!-- Realizado -->
                  <th class="table-header font-medium text-center whitespace-nowrap cursor-pointer hover:text-text-light dark:hover:text-text-dark select-none" @click="toggleSort('data_plantio_real')">
                    <div class="flex items-center justify-center gap-0.5">
                      Plantio
                      <span v-if="sortField === 'data_plantio_real'" class="material-icons text-[10px]">{{ sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward' }}</span>
                    </div>
                  </th>
                  <th class="table-header font-medium text-center whitespace-nowrap">Qtd</th>
                  <th class="table-header font-medium text-center whitespace-nowrap cursor-pointer hover:text-text-light dark:hover:text-text-dark select-none" @click="toggleSort('data_luz_real')">
                    <div class="flex items-center justify-center gap-0.5">
                      Luz
                      <span v-if="sortField === 'data_luz_real'" class="material-icons text-[10px]">{{ sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward' }}</span>
                    </div>
                  </th>
                  <th class="table-header font-medium text-center whitespace-nowrap">Qtd</th>
                  <th class="table-header font-medium text-center whitespace-nowrap">Perda</th>
                  <th class="table-header font-medium text-center whitespace-nowrap cursor-pointer hover:text-text-light dark:hover:text-text-dark select-none" @click="toggleSort('data_colheita_real')">
                    <div class="flex items-center justify-center gap-0.5">
                      Colheita
                      <span v-if="sortField === 'data_colheita_real'" class="material-icons text-[10px]">{{ sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward' }}</span>
                    </div>
                  </th>
                  <th class="table-header font-medium text-center whitespace-nowrap">Qtd</th>
                  <th class="table-header font-medium text-center whitespace-nowrap">Perda</th>
                  <th class="table-header font-medium text-center whitespace-nowrap">Status</th>
                  <th class="table-header font-medium text-center whitespace-nowrap w-12"></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border-light dark:divide-border-dark">
                <tr
                  v-for="prod in paginatedProducao"
                  :key="prod.id"
                  class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                  @click="openDetailsSlideover(prod)"
                >
                  <!-- Cod e Fazenda -->
                  <td class="table-cell text-xs whitespace-nowrap">
                    <div class="flex items-center gap-1">
                      <span>{{ prod.codigo || '-' }}</span>
                      <span v-if="prod.recorrente" class="w-4 h-4 bg-primary text-white rounded-full flex items-center justify-center text-[9px] font-bold">R</span>
                    </div>
                  </td>
                  <td class="table-cell text-xs whitespace-nowrap">{{ prod.fazendas?.nome || '-' }}</td>
                  <td class="table-cell text-center p-1" :title="prod.origem === 'pedido' ? 'Gerado a partir de pedido' : 'Cadastro manual'">
                    <span class="material-icons text-sm" :class="prod.origem === 'pedido' ? 'text-blue-500' : 'text-gray-400'">
                      {{ prod.origem === 'pedido' ? 'shopping_cart' : 'edit_note' }}
                    </span>
                  </td>
                  <!-- Planejado -->
                  <td class="table-cell text-xs font-medium whitespace-nowrap">
                    {{ prod.especies?.codigo || prod.produtos?.nome || '-' }}
                    <span v-if="!prod.especie_id && prod.produtos" class="text-[10px] text-blue-500 ml-1">(MIX)</span>
                  </td>
                  <td class="table-cell text-center text-xs">{{ prod.quantidade_bandeja || 0 }}</td>
                  <td class="table-cell text-center text-xs">{{ calcularBandejas(prod) }}</td>
                  <td class="table-cell text-center text-xs whitespace-nowrap">{{ formatDateShort(prod.data_plantio_previsto || prod.data_semeadura) }}</td>
                  <td class="table-cell text-center text-xs whitespace-nowrap">{{ formatDateShort(prod.data_luz_prevista) || '-' }}</td>
                  <td class="table-cell text-center text-xs border-r border-border-light dark:border-border-dark whitespace-nowrap">{{ formatDateShort(prod.data_colheita_prevista) }}</td>
                  <!-- Realizado - Campos editáveis -->
                  <!-- Data Plantio Real - sempre habilitado -->
                  <td class="table-cell text-center p-1" @click.stop>
                    <input
                      type="date"
                      :value="prod.data_plantio_real || ''"
                      @change="updateRealizadoPlantio(prod, $event)"
                      class="w-[88px] text-center text-xs py-1.5 px-1 border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-800 focus:ring-1 focus:ring-primary focus:border-primary"
                    />
                  </td>
                  <!-- Quantia Plantio - sempre habilitado -->
                  <td class="table-cell text-center p-1" @click.stop>
                    <input
                      type="number"
                      :value="prod.quantidade_plantio || ''"
                      @change="updateRealizadoPlantioQtd(prod, $event)"
                      class="w-14 text-center text-xs py-1.5 px-1 border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-800 focus:ring-1 focus:ring-primary focus:border-primary"
                      :placeholder="getPlaceholderPlantio(prod)"
                    />
                  </td>
                  <!-- Data Luz Real - só habilita após plantio completo -->
                  <td class="table-cell text-center p-1" @click.stop>
                    <input
                      type="date"
                      :value="prod.data_luz_real || ''"
                      @change="updateRealizadoLuz(prod, $event)"
                      :disabled="!prod.data_plantio_real || !prod.quantidade_plantio"
                      :class="[
                        'w-[88px] text-center text-xs py-1.5 px-1 border rounded focus:ring-1 focus:ring-primary focus:border-primary',
                        (!prod.data_plantio_real || !prod.quantidade_plantio)
                          ? 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-400 cursor-not-allowed'
                          : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800'
                      ]"
                    />
                  </td>
                  <!-- Quantia Luz - só habilita após plantio completo -->
                  <td class="table-cell text-center p-1" @click.stop>
                    <input
                      type="number"
                      :value="prod.quantidade_luz || ''"
                      @change="updateRealizadoLuzQtd(prod, $event)"
                      :disabled="!prod.data_plantio_real || !prod.quantidade_plantio"
                      :class="[
                        'w-14 text-center text-xs py-1.5 px-1 border rounded focus:ring-1 focus:ring-primary focus:border-primary',
                        (!prod.data_plantio_real || !prod.quantidade_plantio)
                          ? 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-400 cursor-not-allowed'
                          : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800'
                      ]"
                      :placeholder="getPlaceholderLuz(prod)"
                    />
                  </td>
                  <!-- Perda Luz - editável -->
                  <td class="table-cell text-center p-1" @click.stop>
                    <input
                      type="number"
                      :value="prod.perda_luz || ''"
                      @change="updatePerdaLuz(prod, $event)"
                      :disabled="!prod.quantidade_plantio || !prod.quantidade_luz"
                      :class="[
                        'w-12 text-center text-xs py-1.5 px-0.5 border rounded focus:ring-1 focus:ring-red-400 focus:border-red-400',
                        (!prod.quantidade_plantio || !prod.quantidade_luz)
                          ? 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-400 cursor-not-allowed'
                          : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                      ]"
                      :placeholder="calcularPerdaLuz(prod) > 0 ? String(calcularPerdaLuz(prod)) : '0'"
                      min="0"
                    />
                  </td>
                  <!-- Data Colheita Real - só habilita após luz completo -->
                  <td class="table-cell text-center p-1" @click.stop>
                    <input
                      type="date"
                      :value="prod.data_colheita_real || ''"
                      @change="updateRealizadoColheita(prod, $event)"
                      :disabled="!prod.data_luz_real || !prod.quantidade_luz"
                      :class="[
                        'w-[88px] text-center text-xs py-1.5 px-1 border rounded focus:ring-1 focus:ring-primary focus:border-primary',
                        (!prod.data_luz_real || !prod.quantidade_luz)
                          ? 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-400 cursor-not-allowed'
                          : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800'
                      ]"
                    />
                  </td>
                  <!-- Quantia Colheita - só habilita após luz completo -->
                  <td class="table-cell text-center p-1" @click.stop>
                    <input
                      type="number"
                      :value="prod.quantidade_colhida || ''"
                      @change="updateRealizadoColheitaQtd(prod, $event)"
                      :disabled="!prod.data_luz_real || !prod.quantidade_luz"
                      :class="[
                        'w-14 text-center text-xs py-1.5 px-1 border rounded focus:ring-1 focus:ring-primary focus:border-primary',
                        (!prod.data_luz_real || !prod.quantidade_luz)
                          ? 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-400 cursor-not-allowed'
                          : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800'
                      ]"
                      :placeholder="getPlaceholderColheita(prod)"
                    />
                  </td>
                  <!-- Perda Colheita - editável -->
                  <td class="table-cell text-center p-1" @click.stop>
                    <input
                      type="number"
                      :value="prod.perda_colheita || ''"
                      @change="updatePerdaColheita(prod, $event)"
                      :disabled="!prod.quantidade_luz || !prod.quantidade_colhida"
                      :class="[
                        'w-12 text-center text-xs py-1.5 px-0.5 border rounded focus:ring-1 focus:ring-red-400 focus:border-red-400',
                        (!prod.quantidade_luz || !prod.quantidade_colhida)
                          ? 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-400 cursor-not-allowed'
                          : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                      ]"
                      :placeholder="calcularPerdaColheita(prod) > 0 ? String(calcularPerdaColheita(prod)) : '0'"
                      min="0"
                    />
                  </td>
                  <td class="table-cell text-center p-1">
                    <span :class="['inline-block px-2 py-1 text-xs rounded-full border whitespace-nowrap', getStatusBadgeClass(prod.status)]">
                      {{ getStatusLabel(prod.status) }}
                    </span>
                  </td>
                  <!-- Coluna de Ações -->
                  <td class="table-cell text-center p-1 relative" @click.stop>
                    <button
                      @click="openDetailsSlideover(prod)"
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
      <div v-if="!loading && filteredProducao.length > 0" class="lg:hidden divide-y divide-border-light dark:divide-border-dark">
        <div
          v-for="prod in paginatedProducao"
          :key="prod.id"
          class="p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
          @click="openDetailsSlideover(prod)"
        >
          <!-- Header do Card -->
          <div class="flex items-start justify-between gap-2 mb-3">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-xs font-medium text-subtext-light dark:text-subtext-dark">#{{ prod.codigo || '-' }}</span>
              <span v-if="prod.recorrente" class="w-4 h-4 bg-primary text-white rounded-full flex items-center justify-center text-[9px] font-bold">R</span>
              <span :class="['text-[10px] px-2 py-0.5 rounded-full border whitespace-nowrap', getStatusBadgeClass(prod.status)]">
                {{ getStatusLabel(prod.status) }}
              </span>
              <span v-if="prod.origem === 'pedido'" class="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 whitespace-nowrap">Pedido</span>
            </div>
            <button
              @click.stop="openDetailsSlideover(prod)"
              class="text-gray-400 hover:text-primary transition-colors shrink-0"
            >
              <span class="material-icons-outlined text-xl">chevron_right</span>
            </button>
          </div>

          <!-- Info Principal -->
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <span class="text-sm font-bold text-primary">{{ prod.especies?.codigo?.substring(0, 2) || prod.produtos?.codigo?.substring(0, 2) || '-' }}</span>
            </div>
            <div class="min-w-0 flex-1">
              <p class="font-semibold text-sm text-text-light dark:text-text-dark truncate">{{ prod.especies?.nome || prod.produtos?.nome || '-' }}</p>
              <p class="text-xs text-subtext-light dark:text-subtext-dark truncate">{{ prod.fazendas?.nome || '-' }}</p>
            </div>
          </div>

          <!-- Grid de Informações -->
          <div class="grid grid-cols-3 gap-2 text-[11px] mb-3">
            <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-center">
              <p class="text-subtext-light dark:text-subtext-dark mb-0.5">Qtd</p>
              <p class="font-semibold text-text-light dark:text-text-dark">{{ prod.quantidade_bandeja || 0 }}</p>
            </div>
            <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-center">
              <p class="text-subtext-light dark:text-subtext-dark mb-0.5">Plantio</p>
              <p class="font-semibold text-text-light dark:text-text-dark">{{ formatDateShort(prod.data_plantio_previsto || prod.data_semeadura) || '-' }}</p>
            </div>
            <div :class="['rounded-lg p-2 text-center', getColheitaMobileClass(prod)]">
              <p class="mb-0.5 opacity-80">Colheita</p>
              <p class="font-semibold">{{ formatDateShort(prod.data_colheita_prevista) || '-' }}</p>
            </div>
          </div>

          <!-- Barra de Progresso Visual -->
          <div class="flex items-center gap-1 text-[10px]">
            <div :class="['flex-1 h-1.5 rounded-full', prod.data_plantio_real ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700']"></div>
            <div :class="['flex-1 h-1.5 rounded-full', prod.data_luz_real ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700']"></div>
            <div :class="['flex-1 h-1.5 rounded-full', prod.data_colheita_real ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700']"></div>
          </div>

        </div>
      </div>

      <!-- Empty State -->
      <div v-if="!loading && filteredProducao.length === 0" class="text-center py-16 flex flex-col items-center px-4">
        <div class="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
          <span class="material-icons-outlined text-4xl text-gray-400 dark:text-gray-500">grass</span>
        </div>
        <h3 class="text-lg font-semibold text-text-light dark:text-text-dark mb-2">Nenhuma produção encontrada</h3>
        <p class="text-sm text-subtext-light dark:text-subtext-dark mb-6 max-w-sm">
          Não há planos de produção para o período selecionado.
        </p>
        <button @click="openCadastroModal" class="btn btn-primary">
          Cadastrar Produção
        </button>
      </div>

      <!-- Paginação -->
      <div v-if="filteredProducao.length > 0" class="p-4 flex flex-col sm:flex-row items-center justify-between border-t border-border-light dark:border-border-dark text-xs text-subtext-light dark:text-subtext-dark gap-4">
        <div class="flex items-center gap-4">
          <select v-model="itemsPerPage" class="border border-border-light dark:border-border-dark rounded px-2 py-1 bg-white dark:bg-gray-800 text-sm cursor-pointer">
            <option :value="10">10 linhas</option>
            <option :value="25">25 linhas</option>
            <option :value="50">50 linhas</option>
          </select>
          <span>{{ filteredProducao.length }} registros</span>
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="currentPage--"
            :disabled="currentPage === 1"
            class="p-1 border border-border-light dark:border-border-dark rounded hover:bg-gray-50 dark:hover:bg-gray-800 bg-white dark:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span class="material-icons text-sm">chevron_left</span>
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
            <span class="material-icons text-sm">chevron_right</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de Cadastro -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-200"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="showCadastroModal" class="fixed inset-0 z-[100] overflow-y-auto">
          <div class="fixed inset-0 glass-backdrop z-[100]" @click="closeCadastroModal"></div>
          <div class="flex min-h-full items-center justify-center p-4">
            <Transition
              enter-active-class="transition-all duration-200"
              enter-from-class="opacity-0 scale-95"
              enter-to-class="opacity-100 scale-100"
              leave-active-class="transition-all duration-200"
              leave-from-class="opacity-100 scale-100"
              leave-to-class="opacity-0 scale-95"
            >
              <div v-if="showCadastroModal" class="relative z-[101] bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                <!-- Header -->
                <div class="px-6 py-4 border-b border-border-light dark:border-border-dark flex items-center justify-between">
                  <h2 class="text-lg font-semibold text-text-light dark:text-text-dark">Cadastro de Plano de Produção</h2>
                  <button @click="closeCadastroModal" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <span class="material-icons">close</span>
                  </button>
                </div>

                <!-- Body -->
                <div class="p-6 overflow-y-auto flex-1 space-y-4">
                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Espécie</label>
                      <select v-model="novoPlano.especie_id" class="input" @change="onEspecieChange">
                        <option value="">Selecione</option>
                        <option v-for="especie in especies" :key="especie.id" :value="especie.id">
                          {{ especie.nome }}
                        </option>
                      </select>
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Quantidade</label>
                      <input type="number" v-model.number="novoPlano.quantidade" class="input" min="1" />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Fazenda</label>
                      <select v-model="novoPlano.fazenda_id" class="input">
                        <option value="">Selecione</option>
                        <option v-for="fazenda in fazendas" :key="fazenda.id" :value="fazenda.id">
                          {{ fazenda.nome }}
                        </option>
                      </select>
                    </div>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Data da Colheita (Planejamento)</label>
                      <input type="date" v-model="novoPlano.data_colheita" class="input" @change="calcularDatasFromColheita" />
                    </div>
                    <div class="flex items-center pt-6">
                      <label class="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" v-model="novoPlano.recorrente" class="w-4 h-4 text-primary rounded" />
                        <span class="text-sm text-text-light dark:text-text-dark">Recorrente</span>
                      </label>
                    </div>
                    <!-- Campo Lote (aparece após selecionar espécie) -->
                    <div v-if="novoPlano.especie_id">
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Lote</label>
                      <select v-model="novoPlano.lote_id" class="input" @change="calcularDatasFromColheita">
                        <option value="">Selecione o lote</option>
                        <option v-for="lote in lotesFiltradosNovo" :key="lote.id" :value="lote.id">
                          {{ lote.numero }}
                        </option>
                      </select>
                    </div>
                  </div>

                  <!-- Datas Calculadas e Bandejas -->
                  <div v-if="datasCalculadas.data_plantio && novoPlano.lote_id" class="grid grid-cols-3 gap-4 pt-4 border-t border-border-light dark:border-border-dark">
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Data de Plantio (Previsto)</label>
                      <p class="text-base text-text-light dark:text-text-dark">{{ formatDateBR(datasCalculadas.data_plantio) }}</p>
                      <p class="text-xs text-subtext-light dark:text-subtext-dark">{{ getDiaSemana(datasCalculadas.data_plantio) }}</p>
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Data de Luz (Previsto)</label>
                      <p class="text-base text-text-light dark:text-text-dark">{{ formatDateBR(datasCalculadas.data_luz) }}</p>
                      <p class="text-xs text-subtext-light dark:text-subtext-dark">{{ getDiaSemana(datasCalculadas.data_luz) }}</p>
                    </div>
                    <div v-if="bandejasCalculadas > 0">
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Bandejas</label>
                      <p class="text-base text-text-light dark:text-text-dark">{{ bandejasCalculadas }}</p>
                      <p class="text-xs text-subtext-light dark:text-subtext-dark">{{ novoPlano.quantidade }} unid. / {{ fazendaSelecionada?.unidades_por_bandeja }} por bandeja</p>
                    </div>
                  </div>
                </div>

                <!-- Footer -->
                <div class="px-6 py-4 border-t border-border-light dark:border-border-dark flex items-center justify-end gap-3">
                  <button @click="closeCadastroModal" class="btn btn-secondary">Voltar</button>
                  <button @click="salvarPlano" class="btn btn-primary" :disabled="saving || !isFormValid">
                    <span v-if="saving" class="material-icons text-sm animate-spin">refresh</span>
                    {{ saving ? 'Salvando...' : 'Concluir plano' }}
                  </button>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Modal Editar Plano (Alteração de cliente) -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-200"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="showEditModal" class="fixed inset-0 z-[100] overflow-y-auto">
          <div class="fixed inset-0 glass-backdrop z-[100]" @click="closeEditModal"></div>
          <div class="flex min-h-full items-center justify-center p-4">
            <Transition
              enter-active-class="transition-all duration-200"
              enter-from-class="opacity-0 scale-95"
              enter-to-class="opacity-100 scale-100"
              leave-active-class="transition-all duration-200"
              leave-from-class="opacity-100 scale-100"
              leave-to-class="opacity-0 scale-95"
            >
              <div v-if="showEditModal" class="relative z-[101] bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                <!-- Header -->
                <div class="px-6 py-4 border-b border-border-light dark:border-border-dark">
                  <h2 class="text-lg font-semibold text-text-light dark:text-text-dark">Alteração de plano</h2>
                </div>

                <!-- Body -->
                <div class="p-6 overflow-y-auto flex-1 space-y-4">
                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Espécie</label>
                      <select v-model="editPlano.especie_id" class="input" @change="calcularDatasFromColheitaEdit">
                        <option value="">Selecione</option>
                        <option v-for="especie in especies" :key="especie.id" :value="especie.id">
                          {{ especie.nome }}
                        </option>
                      </select>
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Quantidade</label>
                      <input type="number" v-model.number="editPlano.quantidade" class="input" min="1" />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Fazenda</label>
                      <select v-model="editPlano.fazenda_id" class="input">
                        <option value="">Selecione</option>
                        <option v-for="fazenda in fazendas" :key="fazenda.id" :value="fazenda.id">
                          {{ fazenda.nome }}
                        </option>
                      </select>
                    </div>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Data da Colheita (Planejamento)</label>
                      <input type="date" v-model="editPlano.data_colheita" class="input" @change="calcularDatasFromColheitaEdit" />
                    </div>
                    <div class="flex items-center pt-6">
                      <label class="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" v-model="editPlano.recorrente" class="w-4 h-4 text-primary rounded" />
                        <span class="text-sm text-text-light dark:text-text-dark">Recorrente</span>
                      </label>
                    </div>
                    <div v-if="editPlano.especie_id">
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Lote</label>
                      <select v-model="editPlano.lote_id" class="input" @change="calcularDatasFromColheitaEdit">
                        <option value="">Selecione o lote</option>
                        <option v-for="lote in lotesFiltrados" :key="lote.id" :value="lote.id">
                          {{ lote.numero }}
                        </option>
                      </select>
                    </div>
                  </div>

                  <!-- Datas Calculadas e Bandejas -->
                  <div v-if="editPlano.data_plantio_previsto" class="grid grid-cols-3 gap-4 pt-4 border-t border-border-light dark:border-border-dark">
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Data de Plantio (Previsto)</label>
                      <p class="text-base text-text-light dark:text-text-dark">{{ formatDateBR(editPlano.data_plantio_previsto) }}</p>
                      <p class="text-xs text-subtext-light dark:text-subtext-dark">{{ getDiaSemana(editPlano.data_plantio_previsto) }}</p>
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Data de Luz (Previsto)</label>
                      <p class="text-base text-text-light dark:text-text-dark">{{ formatDateBR(editPlano.data_luz_prevista) }}</p>
                      <p class="text-xs text-subtext-light dark:text-subtext-dark">{{ getDiaSemana(editPlano.data_luz_prevista) }}</p>
                    </div>
                    <div v-if="bandejasCalculadasEdit > 0">
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Bandejas</label>
                      <p class="text-base text-text-light dark:text-text-dark">{{ bandejasCalculadasEdit }}</p>
                      <p class="text-xs text-subtext-light dark:text-subtext-dark">{{ editPlano.quantidade }} unid. / {{ fazendaSelecionadaEdit?.unidades_por_bandeja }} por bandeja</p>
                    </div>
                  </div>
                </div>

                <!-- Footer -->
                <div class="px-6 py-4 border-t border-border-light dark:border-border-dark flex justify-end gap-3">
                  <button @click="closeEditModal" class="btn btn-secondary">Cancelar</button>
                  <button @click="salvarEdicao" class="btn btn-primary" :disabled="saving">
                    {{ saving ? 'Salvando...' : 'Salvar alterações' }}
                  </button>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Modal Ver Lotes -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-200"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="showLotesModal" class="fixed inset-0 z-[100] overflow-y-auto">
          <div class="fixed inset-0 glass-backdrop z-[100]" @click="closeLotesModal"></div>
          <div class="flex min-h-full items-center justify-center p-4">
            <Transition
              enter-active-class="transition-all duration-200"
              enter-from-class="opacity-0 scale-95"
              enter-to-class="opacity-100 scale-100"
              leave-active-class="transition-all duration-200"
              leave-from-class="opacity-100 scale-100"
              leave-to-class="opacity-0 scale-95"
            >
              <div v-if="showLotesModal" class="relative z-[101] bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md">
                <!-- Header com ícone -->
                <div class="p-6 flex flex-col items-center">
                  <div class="w-16 h-16 rounded-xl bg-[#F5F0E6] flex items-center justify-center mb-4">
                    <span class="material-icons text-3xl text-[#C4A574]">inventory_2</span>
                  </div>
                  <h2 class="text-lg font-semibold text-text-light dark:text-text-dark">Detalhe do Lote</h2>
                  <p class="text-sm text-subtext-light dark:text-subtext-dark mt-1">Confira a identificação do lote utilizado.</p>
                </div>

                <!-- Body -->
                <div class="px-6 pb-2">
                  <table class="w-full">
                    <thead>
                      <tr class="border-b border-border-light dark:border-border-dark">
                        <th class="text-left py-2 text-sm font-medium text-text-light dark:text-text-dark">Espécie</th>
                        <th class="text-left py-2 text-sm font-medium text-text-light dark:text-text-dark">Lote</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td class="py-3 text-sm text-text-light dark:text-text-dark">{{ selectedProducao?.especies?.nome || '-' }}</td>
                        <td class="py-3 text-sm text-text-light dark:text-text-dark">{{ selectedProducao?.lotes_sementes?.numero || '-' }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <!-- Footer -->
                <div class="p-6">
                  <button @click="closeLotesModal" class="w-full btn btn-primary justify-center">
                    Fechar
                  </button>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Modal Editar Recorrência -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-200"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="showRecorrenciaModal" class="fixed inset-0 z-[100] overflow-y-auto">
          <div class="fixed inset-0 glass-backdrop z-[100]" @click="closeRecorrenciaModal"></div>
          <div class="flex min-h-full items-center justify-center p-4">
            <Transition
              enter-active-class="transition-all duration-200"
              enter-from-class="opacity-0 scale-95"
              enter-to-class="opacity-100 scale-100"
              leave-active-class="transition-all duration-200"
              leave-from-class="opacity-100 scale-100"
              leave-to-class="opacity-0 scale-95"
            >
              <div v-if="showRecorrenciaModal" class="relative z-[101] bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md">
                <!-- Header com ícone -->
                <div class="p-6 flex flex-col items-center">
                  <div class="w-16 h-16 rounded-xl bg-[#F5F0E6] flex items-center justify-center mb-4">
                    <span class="material-icons text-3xl text-[#C4A574]">inventory_2</span>
                  </div>
                  <h2 class="text-lg font-semibold text-text-light dark:text-text-dark">Edição de Recorrência do Plano</h2>
                  <p class="text-sm text-subtext-light dark:text-subtext-dark mt-1 text-center">
                    Informar a quantidade de {{ selectedProducao?.especies?.nome || 'espécie' }} que deve ter esse plano recorrente.<br>
                    Apenas planos com data prevista de plantação posterior a hoje serão alterados
                  </p>
                </div>

                <!-- Body -->
                <div class="px-6 pb-4">
                  <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Quantidade a Plantar</label>
                  <input type="number" v-model.number="recorrenciaQuantidade" class="input" min="1" />
                </div>

                <!-- Footer -->
                <div class="p-6 flex items-center gap-3">
                  <button @click="closeRecorrenciaModal" class="flex-1 btn btn-secondary justify-center">
                    Cancelar
                  </button>
                  <button @click="salvarRecorrencia" class="flex-1 btn btn-primary justify-center" :disabled="saving">
                    {{ saving ? 'Salvando...' : 'Salvar' }}
                  </button>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Modal Cancelar Recorrência -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-200"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="showCancelarRecorrenciaModal" class="fixed inset-0 z-[100] overflow-y-auto">
          <div class="fixed inset-0 glass-backdrop z-[100]" @click="closeCancelarRecorrenciaModal"></div>
          <div class="flex min-h-full items-center justify-center p-4">
            <Transition
              enter-active-class="transition-all duration-200"
              enter-from-class="opacity-0 scale-95"
              enter-to-class="opacity-100 scale-100"
              leave-active-class="transition-all duration-200"
              leave-from-class="opacity-100 scale-100"
              leave-to-class="opacity-0 scale-95"
            >
              <div v-if="showCancelarRecorrenciaModal" class="relative z-[101] bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md">
                <!-- Header com ícone -->
                <div class="p-6 flex flex-col items-center">
                  <div class="w-16 h-16 rounded-xl bg-red-100 flex items-center justify-center mb-4">
                    <span class="material-icons text-3xl text-red-600">close</span>
                  </div>
                  <h2 class="text-lg font-semibold text-text-light dark:text-text-dark text-center">Tem certeza que deseja cancelar essa recorrência?</h2>
                  <p class="text-sm text-subtext-light dark:text-subtext-dark mt-2 text-center">
                    Ao cancelar, todos os planos futuros dessa recorrência que ainda não tenham começado a ser plantados serão apagados.
                  </p>
                  <div class="mt-4 text-sm text-left w-full">
                    <p class="text-text-light dark:text-text-dark"><strong>Espécie do plano:</strong> {{ selectedProducao?.especies?.nome || '-' }}</p>
                    <p class="text-text-light dark:text-text-dark"><strong>Fazenda do Plano:</strong> {{ selectedProducao?.fazendas?.nome || '-' }}</p>
                  </div>
                </div>

                <!-- Footer -->
                <div class="p-6 pt-0 flex items-center gap-3">
                  <button @click="closeCancelarRecorrenciaModal" class="flex-1 btn btn-secondary justify-center">
                    Cancelar
                  </button>
                  <button @click="confirmarApagarRecorrencia" class="flex-1 btn justify-center bg-red-600 hover:bg-red-700 text-white" :disabled="saving">
                    {{ saving ? 'Excluindo...' : 'Excluir' }}
                  </button>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Modal Cancelar Plano -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-200"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="showCancelarPlanoModal" class="fixed inset-0 z-[100] overflow-y-auto">
          <div class="fixed inset-0 glass-backdrop z-[100]" @click="closeCancelarPlanoModal"></div>
          <div class="flex min-h-full items-center justify-center p-4">
            <Transition
              enter-active-class="transition-all duration-200"
              enter-from-class="opacity-0 scale-95"
              enter-to-class="opacity-100 scale-100"
              leave-active-class="transition-all duration-200"
              leave-from-class="opacity-100 scale-100"
              leave-to-class="opacity-0 scale-95"
            >
              <div v-if="showCancelarPlanoModal" class="relative z-[101] bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md">
                <!-- Header com ícone -->
                <div class="p-6 flex flex-col items-center">
                  <div class="w-16 h-16 rounded-xl bg-red-100 flex items-center justify-center mb-4">
                    <span class="material-icons text-3xl text-red-600">close</span>
                  </div>
                  <h2 class="text-lg font-semibold text-text-light dark:text-text-dark text-center">Tem certeza que deseja cancelar o plano {{ selectedProducao?.codigo }}?</h2>
                  <div class="mt-3 text-sm text-left w-full">
                    <p class="text-subtext-light dark:text-subtext-dark">Ao cancelar esse plano será permanentemente apagado</p>
                    <p class="text-text-light dark:text-text-dark mt-2"><strong>Espécie do plano:</strong> {{ selectedProducao?.especies?.nome || '-' }}</p>
                    <p class="text-text-light dark:text-text-dark"><strong>Fazenda do Plano:</strong> {{ selectedProducao?.fazendas?.nome || '-' }}</p>
                  </div>
                </div>

                <!-- Footer -->
                <div class="p-6 pt-0 flex items-center gap-3">
                  <button @click="closeCancelarPlanoModal" class="flex-1 btn btn-secondary justify-center">
                    Cancelar
                  </button>
                  <button @click="confirmarCancelarPlano" class="flex-1 btn justify-center bg-red-600 hover:bg-red-700 text-white" :disabled="saving">
                    {{ saving ? 'Excluindo...' : 'Excluir' }}
                  </button>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Modal Registrar Colheita -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-200"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="showColheitaModal" class="fixed inset-0 z-[100] overflow-y-auto">
          <div class="fixed inset-0 glass-backdrop z-[100]" @click="closeColheitaModal"></div>
          <div class="flex min-h-full items-center justify-center p-4">
            <Transition
              enter-active-class="transition-all duration-200"
              enter-from-class="opacity-0 scale-95"
              enter-to-class="opacity-100 scale-100"
              leave-active-class="transition-all duration-200"
              leave-from-class="opacity-100 scale-100"
              leave-to-class="opacity-0 scale-95"
            >
              <div v-if="showColheitaModal" class="relative z-[101] bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md">
                <!-- Header com ícone -->
                <div class="px-6 pt-6 pb-4">
                  <!-- Ícone -->
                  <div class="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                    <span class="material-icons text-primary text-3xl">task_alt</span>
                  </div>
                  <h2 class="text-xl font-semibold text-text-light dark:text-text-dark">Registrar Colheita</h2>
                  <p class="text-sm text-subtext-light dark:text-subtext-dark mt-1">Informe os dados abaixo para finalizar este Plano de produção.</p>

                  <!-- Espécie e Fazenda -->
                  <div class="flex items-center justify-between mt-4 pt-4 border-t border-border-light dark:border-border-dark">
                    <span class="text-sm font-medium text-text-light dark:text-text-dark">{{ selectedProducao?.especies?.nome }}</span>
                    <span class="text-sm text-subtext-light dark:text-subtext-dark">{{ selectedProducao?.fazendas?.nome }}</span>
                  </div>
                </div>

                <!-- Body -->
                <div class="px-6 pb-4 space-y-5">
                  <!-- Quantidade Colhida -->
                  <div>
                    <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Quantidade Colhida</label>
                    <input type="number" v-model.number="colheitaForm.quantidade" class="input" min="0" />
                  </div>

                  <!-- Perda (só aparece se NÃO finalizar) -->
                  <div v-if="!colheitaForm.finalizar">
                    <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Perda total na colheita</label>
                    <input type="number" v-model.number="colheitaForm.perda" class="input" min="0" placeholder="Entre quantidade perdida na colheita" />
                  </div>

                  <!-- Opções de Finalização -->
                  <div>
                    <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Finalizar Colheita</label>
                    <p class="text-xs text-subtext-light dark:text-subtext-dark mb-3">Selecione uma das opções abaixo</p>

                    <!-- Opção Sim -->
                    <label
                      :class="[
                        'flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all mb-3',
                        colheitaForm.finalizar
                          ? 'border-primary bg-primary/5'
                          : 'border-border-light dark:border-border-dark hover:border-gray-300'
                      ]"
                    >
                      <div class="flex-shrink-0 mt-0.5">
                        <div :class="['w-10 h-10 rounded-lg flex items-center justify-center', colheitaForm.finalizar ? 'bg-primary/10' : 'bg-gray-100 dark:bg-gray-800']">
                          <span class="material-icons" :class="colheitaForm.finalizar ? 'text-primary' : 'text-gray-400'">check_box</span>
                        </div>
                      </div>
                      <div class="flex-1">
                        <span class="font-medium text-text-light dark:text-text-dark">Sim! Finalizar a colheita</span>
                        <p class="text-xs text-subtext-light dark:text-subtext-dark mt-0.5">A diferença será considerada perda.</p>
                      </div>
                      <input type="radio" v-model="colheitaForm.finalizar" :value="true" class="sr-only" />
                      <div class="flex-shrink-0">
                        <div :class="['w-5 h-5 rounded-full border-2 flex items-center justify-center', colheitaForm.finalizar ? 'border-primary' : 'border-gray-300']">
                          <div v-if="colheitaForm.finalizar" class="w-2.5 h-2.5 rounded-full bg-primary"></div>
                        </div>
                      </div>
                    </label>

                    <!-- Opção Não -->
                    <label
                      :class="[
                        'flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all',
                        !colheitaForm.finalizar
                          ? 'border-primary bg-primary/5'
                          : 'border-border-light dark:border-border-dark hover:border-gray-300'
                      ]"
                    >
                      <div class="flex-shrink-0 mt-0.5">
                        <div :class="['w-10 h-10 rounded-lg flex items-center justify-center', !colheitaForm.finalizar ? 'bg-primary/10' : 'bg-gray-100 dark:bg-gray-800']">
                          <span class="material-icons" :class="!colheitaForm.finalizar ? 'text-primary' : 'text-gray-400'">eco</span>
                        </div>
                      </div>
                      <div class="flex-1">
                        <span class="font-medium text-text-light dark:text-text-dark">Não! A colheita será finalizada mais tarde</span>
                        <p class="text-xs text-subtext-light dark:text-subtext-dark mt-0.5">Manter a diferença de quantidade na fazenda.</p>
                      </div>
                      <input type="radio" v-model="colheitaForm.finalizar" :value="false" class="sr-only" />
                      <div class="flex-shrink-0">
                        <div :class="['w-5 h-5 rounded-full border-2 flex items-center justify-center', !colheitaForm.finalizar ? 'border-primary' : 'border-gray-300']">
                          <div v-if="!colheitaForm.finalizar" class="w-2.5 h-2.5 rounded-full bg-primary"></div>
                        </div>
                      </div>
                    </label>
                  </div>

                  <!-- Barra de Progresso -->
                  <div class="pt-2 border-t border-border-light dark:border-border-dark">
                    <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-2">Progresso da Colheita</label>
                    <div class="flex items-center gap-3">
                      <div class="flex-1 h-6 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div
                          class="h-full bg-primary rounded-full flex items-center justify-center transition-all duration-300"
                          :style="{ width: progressoColheita + '%' }"
                        >
                          <span v-if="progressoColheita > 15" class="text-xs font-medium text-white">{{ progressoColheita }}%</span>
                        </div>
                      </div>
                      <span class="text-sm text-subtext-light dark:text-subtext-dark whitespace-nowrap">{{ selectedProducao?.quantidade_luz || 0 }}</span>
                    </div>
                  </div>
                </div>

                <!-- Footer -->
                <div class="px-6 py-4 border-t border-border-light dark:border-border-dark flex items-center gap-3">
                  <button @click="closeColheitaModal" class="btn btn-secondary flex-1 justify-center">Cancelar</button>
                  <button @click="salvarColheita" class="btn btn-primary flex-1 justify-center" :disabled="saving">
                    {{ saving ? 'Salvando...' : 'Salvar' }}
                  </button>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Modal Alterar Status -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-200"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="showStatusModal" class="fixed inset-0 z-[100] overflow-y-auto">
          <div class="fixed inset-0 glass-backdrop z-[100]" @click="closeStatusModal"></div>
          <div class="flex min-h-full items-center justify-center p-4">
            <Transition
              enter-active-class="transition-all duration-200"
              enter-from-class="opacity-0 scale-95"
              enter-to-class="opacity-100 scale-100"
              leave-active-class="transition-all duration-200"
              leave-from-class="opacity-100 scale-100"
              leave-to-class="opacity-0 scale-95"
            >
              <div v-if="showStatusModal" class="relative z-[101] bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-sm">
                <!-- Header -->
                <div class="px-6 py-4 border-b border-border-light dark:border-border-dark">
                  <h2 class="text-lg font-semibold text-text-light dark:text-text-dark">Alterar Status</h2>
                </div>

                <!-- Body -->
                <div class="p-6 space-y-2">
                  <button
                    v-for="status in statusOptions"
                    :key="status.value"
                    @click="alterarStatus(status.value)"
                    :class="[
                      'w-full px-4 py-3 text-left text-sm rounded-lg border transition-colors',
                      selectedProducao?.status === status.value
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border-light dark:border-border-dark hover:bg-gray-50 dark:hover:bg-gray-700'
                    ]"
                  >
                    {{ status.label }}
                  </button>
                </div>

                <!-- Footer -->
                <div class="px-6 py-4 border-t border-border-light dark:border-border-dark">
                  <button @click="closeStatusModal" class="w-full btn btn-secondary justify-center">
                    Cancelar
                  </button>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Modal Diferença Plantio -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-200"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="showDiferencaPlantioModal" class="fixed inset-0 z-[100] overflow-y-auto">
          <div class="fixed inset-0 glass-backdrop z-[100]" @click="closeDiferencaPlantioModal"></div>
          <div class="flex min-h-full items-center justify-center p-4">
            <Transition
              enter-active-class="transition-all duration-200"
              enter-from-class="opacity-0 scale-95"
              enter-to-class="opacity-100 scale-100"
              leave-active-class="transition-all duration-200"
              leave-from-class="opacity-100 scale-100"
              leave-to-class="opacity-0 scale-95"
            >
              <div v-if="showDiferencaPlantioModal" class="relative z-[101] bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md">
                <!-- Header com ícone de alerta -->
                <div class="px-6 pt-6 pb-4">
                  <div class="w-14 h-14 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center mb-4">
                    <span class="material-icons text-yellow-600 dark:text-yellow-500 text-3xl">warning</span>
                  </div>
                  <h2 class="text-xl font-semibold text-text-light dark:text-text-dark">Quantidade Plantada diferente da Planejada</h2>
                  <p class="text-sm text-subtext-light dark:text-subtext-dark mt-2">
                    Você informou que plantou <strong>{{ diferencaPlantioData.quantidadeInformada }}</strong> unidades de {{ diferencaPlantioData.prod?.especies?.nome || 'espécie' }}, mas o plano original era para plantar <strong>{{ diferencaPlantioData.quantidadePlanejada }}</strong> unidades.
                  </p>
                  <p class="text-sm text-subtext-light dark:text-subtext-dark mt-2">
                    Isso pode impactar seu cronograma de colheita
                  </p>
                </div>

                <!-- Body -->
                <div class="px-6 pb-4">
                  <p class="text-sm font-medium text-text-light dark:text-text-dark mb-3">Selecione o que deseja fazer:</p>

                  <!-- Opção Criar Novo Plano -->
                  <label
                    :class="[
                      'flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all mb-3',
                      diferencaPlantioData.opcao === 'criar_plano'
                        ? 'border-primary bg-primary/5'
                        : 'border-border-light dark:border-border-dark hover:border-gray-300'
                    ]"
                  >
                    <div class="flex-shrink-0 mt-0.5">
                      <div :class="['w-10 h-10 rounded-lg flex items-center justify-center', diferencaPlantioData.opcao === 'criar_plano' ? 'bg-primary/10' : 'bg-gray-100 dark:bg-gray-800']">
                        <span class="material-icons" :class="diferencaPlantioData.opcao === 'criar_plano' ? 'text-primary' : 'text-gray-400'">add_circle</span>
                      </div>
                    </div>
                    <div class="flex-1">
                      <span class="font-medium text-text-light dark:text-text-dark">Criar um novo plano de produção com as {{ diferencaPlantioData.diferenca }} unidades restantes de {{ diferencaPlantioData.prod?.especies?.nome || 'espécie' }}.</span>
                    </div>
                    <input type="radio" v-model="diferencaPlantioData.opcao" value="criar_plano" class="sr-only" />
                    <div class="flex-shrink-0">
                      <div :class="['w-5 h-5 rounded-full border-2 flex items-center justify-center', diferencaPlantioData.opcao === 'criar_plano' ? 'border-primary' : 'border-gray-300']">
                        <div v-if="diferencaPlantioData.opcao === 'criar_plano'" class="w-2.5 h-2.5 rounded-full bg-primary"></div>
                      </div>
                    </div>
                  </label>

                  <!-- Opção Manter como está -->
                  <label
                    :class="[
                      'flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all',
                      diferencaPlantioData.opcao === 'manter'
                        ? 'border-primary bg-primary/5'
                        : 'border-border-light dark:border-border-dark hover:border-gray-300'
                    ]"
                  >
                    <div class="flex-shrink-0 mt-0.5">
                      <div :class="['w-10 h-10 rounded-lg flex items-center justify-center', diferencaPlantioData.opcao === 'manter' ? 'bg-primary/10' : 'bg-gray-100 dark:bg-gray-800']">
                        <span class="material-icons" :class="diferencaPlantioData.opcao === 'manter' ? 'text-primary' : 'text-gray-400'">check_box</span>
                      </div>
                    </div>
                    <div class="flex-1">
                      <span class="font-medium text-text-light dark:text-text-dark">Manter como está!</span>
                    </div>
                    <input type="radio" v-model="diferencaPlantioData.opcao" value="manter" class="sr-only" />
                    <div class="flex-shrink-0">
                      <div :class="['w-5 h-5 rounded-full border-2 flex items-center justify-center', diferencaPlantioData.opcao === 'manter' ? 'border-primary' : 'border-gray-300']">
                        <div v-if="diferencaPlantioData.opcao === 'manter'" class="w-2.5 h-2.5 rounded-full bg-primary"></div>
                      </div>
                    </div>
                  </label>
                </div>

                <!-- Footer -->
                <div class="px-6 py-4 border-t border-border-light dark:border-border-dark flex items-center gap-3">
                  <button @click="closeDiferencaPlantioModal" class="btn btn-secondary flex-1 justify-center">Cancelar</button>
                  <button @click="confirmarDiferencaPlantio" class="btn btn-primary flex-1 justify-center" :disabled="saving">
                    {{ saving ? 'Salvando...' : 'Salvar' }}
                  </button>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Modal Diferença Luz -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-200"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="showDiferencaLuzModal" class="fixed inset-0 z-[100] overflow-y-auto">
          <div class="fixed inset-0 glass-backdrop z-[100]" @click="closeDiferencaLuzModal"></div>
          <div class="flex min-h-full items-center justify-center p-4">
            <Transition
              enter-active-class="transition-all duration-200"
              enter-from-class="opacity-0 scale-95"
              enter-to-class="opacity-100 scale-100"
              leave-active-class="transition-all duration-200"
              leave-from-class="opacity-100 scale-100"
              leave-to-class="opacity-0 scale-95"
            >
              <div v-if="showDiferencaLuzModal" class="relative z-[101] bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md">
                <!-- Header com ícone de alerta -->
                <div class="px-6 pt-6 pb-4">
                  <div class="w-14 h-14 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center mb-4">
                    <span class="material-icons text-yellow-600 dark:text-yellow-500 text-3xl">warning</span>
                  </div>
                  <h2 class="text-xl font-semibold text-text-light dark:text-text-dark">Ciclo Luz</h2>
                  <p class="text-sm text-subtext-light dark:text-subtext-dark mt-2">
                    Você informou que plantou <strong>{{ diferencaLuzData.quantidadePlantio }}</strong> unidades de {{ diferencaLuzData.prod?.especies?.nome || 'espécie' }}, e apenas <strong>{{ diferencaLuzData.quantidadeLuz }}</strong> unidades foram para o ciclo da luz.
                  </p>
                  <p class="text-sm text-subtext-light dark:text-subtext-dark mt-2">
                    Isso pode impactar seu cronograma de colheita
                  </p>
                </div>

                <!-- Body -->
                <div class="px-6 pb-4">
                  <p class="text-sm font-medium text-text-light dark:text-text-dark mb-3">Selecione o que deseja fazer:</p>

                  <!-- Opção Manter na Fazenda -->
                  <label
                    :class="[
                      'flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all mb-3',
                      diferencaLuzData.opcao === 'manter_fazenda'
                        ? 'border-primary bg-primary/5'
                        : 'border-border-light dark:border-border-dark hover:border-gray-300'
                    ]"
                  >
                    <div class="flex-shrink-0 mt-0.5">
                      <div :class="['w-10 h-10 rounded-lg flex items-center justify-center', diferencaLuzData.opcao === 'manter_fazenda' ? 'bg-primary/10' : 'bg-gray-100 dark:bg-gray-800']">
                        <span class="material-icons" :class="diferencaLuzData.opcao === 'manter_fazenda' ? 'text-primary' : 'text-gray-400'">agriculture</span>
                      </div>
                    </div>
                    <div class="flex-1">
                      <span class="font-medium text-text-light dark:text-text-dark">Manter a diferença na fazenda</span>
                    </div>
                    <input type="radio" v-model="diferencaLuzData.opcao" value="manter_fazenda" class="sr-only" />
                    <div class="flex-shrink-0">
                      <div :class="['w-5 h-5 rounded-full border-2 flex items-center justify-center', diferencaLuzData.opcao === 'manter_fazenda' ? 'border-primary' : 'border-gray-300']">
                        <div v-if="diferencaLuzData.opcao === 'manter_fazenda'" class="w-2.5 h-2.5 rounded-full bg-primary"></div>
                      </div>
                    </div>
                  </label>

                  <!-- Opção Marcar como Perda -->
                  <label
                    :class="[
                      'flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all',
                      diferencaLuzData.opcao === 'perda'
                        ? 'border-primary bg-primary/5'
                        : 'border-border-light dark:border-border-dark hover:border-gray-300'
                    ]"
                  >
                    <div class="flex-shrink-0 mt-0.5">
                      <div :class="['w-10 h-10 rounded-lg flex items-center justify-center', diferencaLuzData.opcao === 'perda' ? 'bg-primary/10' : 'bg-gray-100 dark:bg-gray-800']">
                        <span class="material-icons" :class="diferencaLuzData.opcao === 'perda' ? 'text-primary' : 'text-gray-400'">check_box</span>
                      </div>
                    </div>
                    <div class="flex-1">
                      <span class="font-medium text-text-light dark:text-text-dark">Marcar como perda</span>
                    </div>
                    <input type="radio" v-model="diferencaLuzData.opcao" value="perda" class="sr-only" />
                    <div class="flex-shrink-0">
                      <div :class="['w-5 h-5 rounded-full border-2 flex items-center justify-center', diferencaLuzData.opcao === 'perda' ? 'border-primary' : 'border-gray-300']">
                        <div v-if="diferencaLuzData.opcao === 'perda'" class="w-2.5 h-2.5 rounded-full bg-primary"></div>
                      </div>
                    </div>
                  </label>
                </div>

                <!-- Footer -->
                <div class="px-6 py-4 border-t border-border-light dark:border-border-dark flex items-center gap-3">
                  <button @click="closeDiferencaLuzModal" class="btn btn-secondary flex-1 justify-center">Cancelar</button>
                  <button @click="confirmarDiferencaLuz" class="btn btn-primary flex-1 justify-center" :disabled="saving">
                    {{ saving ? 'Salvando...' : 'Salvar' }}
                  </button>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Slideover de Detalhes da Produção -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-300 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-200 ease-in"
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
                        {{ selectedProducao?.especies?.codigo?.substring(0, 2) || selectedProducao?.produtos?.codigo?.substring(0, 2) || 'PR' }}
                      </div>
                      <div class="min-w-0 flex-1">
                        <h2 class="text-base sm:text-lg font-semibold text-gray-900 dark:text-text-dark truncate">{{ selectedProducao?.especies?.nome || selectedProducao?.produtos?.nome || '-' }}</h2>
                        <p class="text-xs sm:text-sm text-gray-500 dark:text-subtext-dark truncate">Código: {{ selectedProducao?.codigo || '-' }}</p>
                      </div>
                    </div>
                    <button @click="closeDetailsSlideover" class="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shrink-0">
                      <span class="material-icons text-xl">close</span>
                    </button>
                  </div>

                  <!-- Body -->
                  <div class="flex-1 overflow-y-auto">
                    <div class="p-4 sm:p-6 space-y-5 sm:space-y-6">
                      <!-- Status e Info Rápida -->
                      <div class="flex flex-wrap items-center gap-2">
                        <span :class="['inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border', getStatusBadgeClass(selectedProducao?.status)]">
                          {{ getStatusLabel(selectedProducao?.status) }}
                        </span>
                        <span v-if="selectedProducao?.recorrente" class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          <span class="material-icons text-sm mr-1">repeat</span>
                          Recorrente
                        </span>
                      </div>

                      <!-- Origem -->
                      <div v-if="selectedProducao?.origem === 'pedido'" class="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <span class="material-icons text-sm text-blue-500">shopping_cart</span>
                        <span class="text-xs text-blue-700 dark:text-blue-400">Gerado a partir de pedido</span>
                      </div>

                      <!-- Dados da Produção -->
                      <div class="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 sm:p-5">
                        <h3 class="text-xs font-semibold text-gray-500 dark:text-subtext-dark uppercase tracking-wider mb-3 sm:mb-4">Informações</h3>
                        <div class="grid grid-cols-2 gap-3 sm:gap-4">
                          <div>
                            <p class="text-xs text-gray-500 dark:text-subtext-dark mb-1">Fazenda</p>
                            <p class="text-sm font-medium text-gray-900 dark:text-text-dark">{{ selectedProducao?.fazendas?.nome || '-' }}</p>
                          </div>
                          <div>
                            <p class="text-xs text-gray-500 dark:text-subtext-dark mb-1">Quantidade</p>
                            <p class="text-sm font-medium text-gray-900 dark:text-text-dark">{{ selectedProducao?.quantidade_bandeja || 0 }} bandejas</p>
                          </div>
                          <div>
                            <p class="text-xs text-gray-500 dark:text-subtext-dark mb-1">Lote</p>
                            <p class="text-sm font-medium text-gray-900 dark:text-text-dark">{{ selectedProducao?.lotes_sementes?.numero || '-' }}</p>
                          </div>
                          <div>
                            <p class="text-xs text-gray-500 dark:text-subtext-dark mb-1">{{ selectedProducao?.especie_id ? 'Espécie' : 'Produto' }}</p>
                            <p class="text-sm font-medium text-gray-900 dark:text-text-dark">{{ selectedProducao?.especies?.codigo || selectedProducao?.produtos?.nome || '-' }}</p>
                          </div>
                        </div>
                      </div>

                      <!-- Datas Planejadas -->
                      <div class="bg-[#F5F0E6] dark:bg-[#C4A574]/10 rounded-xl p-4 sm:p-5">
                        <h3 class="text-xs font-semibold text-[#C4A574] uppercase tracking-wider mb-3 sm:mb-4">Planejado</h3>
                        <div class="grid grid-cols-3 gap-3 sm:gap-4">
                          <div>
                            <p class="text-xs text-gray-500 dark:text-subtext-dark mb-1">Plantio</p>
                            <p class="text-sm font-medium text-gray-900 dark:text-text-dark">{{ formatDateShort(selectedProducao?.data_plantio_previsto || selectedProducao?.data_semeadura) || '-' }}</p>
                          </div>
                          <div>
                            <p class="text-xs text-gray-500 dark:text-subtext-dark mb-1">Luz</p>
                            <p class="text-sm font-medium text-gray-900 dark:text-text-dark">{{ formatDateShort(selectedProducao?.data_luz_prevista) || '-' }}</p>
                          </div>
                          <div>
                            <p class="text-xs text-gray-500 dark:text-subtext-dark mb-1">Colheita</p>
                            <p class="text-sm font-medium text-gray-900 dark:text-text-dark">{{ formatDateShort(selectedProducao?.data_colheita_prevista) || '-' }}</p>
                          </div>
                        </div>
                      </div>

                      <!-- Datas Realizadas -->
                      <div class="bg-green-50 dark:bg-green-900/10 rounded-xl p-4 sm:p-5">
                        <h3 class="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wider mb-3 sm:mb-4">Realizado</h3>
                        <div class="grid grid-cols-3 gap-3 sm:gap-4">
                          <div>
                            <p class="text-xs text-gray-500 dark:text-subtext-dark mb-1">Plantio</p>
                            <p class="text-sm font-medium text-gray-900 dark:text-text-dark">{{ formatDateShort(selectedProducao?.data_plantio_real) || '-' }}</p>
                            <p v-if="selectedProducao?.quantidade_plantio" class="text-xs text-gray-500 dark:text-subtext-dark">Qtd: {{ selectedProducao.quantidade_plantio }}</p>
                          </div>
                          <div>
                            <p class="text-xs text-gray-500 dark:text-subtext-dark mb-1">Luz</p>
                            <p class="text-sm font-medium text-gray-900 dark:text-text-dark">{{ formatDateShort(selectedProducao?.data_luz_real) || '-' }}</p>
                            <p v-if="selectedProducao?.quantidade_luz" class="text-xs text-gray-500 dark:text-subtext-dark">Qtd: {{ selectedProducao.quantidade_luz }}</p>
                          </div>
                          <div>
                            <p class="text-xs text-gray-500 dark:text-subtext-dark mb-1">Colheita</p>
                            <p class="text-sm font-medium text-gray-900 dark:text-text-dark">{{ formatDateShort(selectedProducao?.data_colheita_real) || '-' }}</p>
                            <p v-if="selectedProducao?.quantidade_colhida" class="text-xs text-gray-500 dark:text-subtext-dark">Qtd: {{ selectedProducao.quantidade_colhida }}</p>
                          </div>
                        </div>
                      </div>

                      <!-- Perdas -->
                      <div v-if="(selectedProducao?.perda_plantio || 0) + (selectedProducao?.perda_luz || 0) + (selectedProducao?.perda_colheita || 0) > 0" class="bg-red-50 dark:bg-red-900/10 rounded-xl p-4 sm:p-5">
                        <h3 class="text-xs font-semibold text-red-700 dark:text-red-400 uppercase tracking-wider mb-3 sm:mb-4">Perdas</h3>
                        <div class="grid grid-cols-3 gap-3 sm:gap-4">
                          <div>
                            <p class="text-xs text-gray-500 dark:text-subtext-dark mb-1">Plantio</p>
                            <p class="text-sm font-medium text-red-700 dark:text-red-400">{{ selectedProducao?.perda_plantio || 0 }}</p>
                          </div>
                          <div>
                            <p class="text-xs text-gray-500 dark:text-subtext-dark mb-1">Luz</p>
                            <p class="text-sm font-medium text-red-700 dark:text-red-400">{{ selectedProducao?.perda_luz || 0 }}</p>
                          </div>
                          <div>
                            <p class="text-xs text-gray-500 dark:text-subtext-dark mb-1">Colheita</p>
                            <p class="text-sm font-medium text-red-700 dark:text-red-400">{{ selectedProducao?.perda_colheita || 0 }}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Footer - Ações -->
                  <div class="px-4 sm:px-6 py-4 border-t border-gray-100 dark:border-border-dark">
                    <div class="grid grid-cols-2 gap-2">
                      <button @click="openEditarPlanoFromSlideover" class="btn btn-secondary justify-center text-sm">
                        <span class="material-icons text-base mr-1">edit</span>
                        Editar Plano
                      </button>
                      <button @click="openRegistrarColheitaFromSlideover" class="btn btn-primary justify-center text-sm">
                        <span class="material-icons text-base mr-1">grass</span>
                        Reg. Colheita
                      </button>
                      <button @click="openVerLotesFromSlideover" class="btn btn-secondary justify-center text-sm">
                        <span class="material-icons text-base mr-1">inventory_2</span>
                        Ver Lotes
                      </button>
                      <button @click="openAlterarStatusFromSlideover" class="btn btn-secondary justify-center text-sm">
                        <span class="material-icons text-base mr-1">sync</span>
                        Alterar Status
                      </button>
                      <template v-if="selectedProducao?.recorrente && selectedProducao?.recorrencia_id">
                        <button @click="openEditarRecorrenciaFromSlideover" class="btn btn-secondary justify-center text-sm">
                          <span class="material-icons text-base mr-1">edit</span>
                          Editar Recorrência
                        </button>
                        <button @click="apagarRecorrenciaFromSlideover" class="btn btn-secondary justify-center text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                          <span class="material-icons text-base mr-1">delete</span>
                          Apagar Recorrência
                        </button>
                      </template>
                      <button @click="cancelarPlanoFromSlideover" class="btn btn-secondary justify-center text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 col-span-2">
                        <span class="material-icons text-base mr-1">delete</span>
                        Cancelar Plano
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useCurrentCompany } from '~/composables/useCurrentCompany'
import { useToast } from '~/composables/useToast'

// Interfaces
interface Producao {
  id: string
  empresa_id: string
  codigo?: string
  fazenda_id?: string
  especie_id?: string
  lote_id?: string
  produto_id?: string
  data_semeadura?: string
  data_plantio_previsto?: string
  data_plantio_real?: string
  data_luz_prevista?: string
  data_luz_real?: string
  data_colheita_prevista?: string
  data_colheita_real?: string
  quantidade_bandeja?: number
  quantidade_plantio?: number
  quantidade_luz?: number
  quantidade_colhida?: number
  perda_plantio?: number
  perda_luz?: number
  perda_colheita?: number
  status: string
  recorrente?: boolean
  recorrencia_id?: string
  observacoes?: string
  created_at?: string
  updated_at?: string
  fazendas?: { id: string; nome: string }
  especies?: { id: string; codigo: string; nome: string; tempo_germinacao?: number; tempo_luz?: number }
  lotes_sementes?: { id: string; numero: string; eficiencia?: number }
  origem?: string
  produtos?: { id: string; nome: string; codigo: string }
}

interface Fazenda { id: string; nome: string; unidades_por_bandeja?: number }
interface Especie { id: string; codigo: string; nome: string; tempo_germinacao?: number; tempo_luz?: number }
interface Lote { id: string; numero: string; especie_id?: string; tempo_germinacao?: number; tempo_luz?: number; eficiencia?: number; created_at?: string }

const supabase = useSupabaseClient()
const { currentCompany } = useCurrentCompany()
const { success, error: showError } = useToast()

// Estado
const producao = ref<Producao[]>([])
const fazendas = ref<Fazenda[]>([])
const especies = ref<Especie[]>([])
const lotes = ref<Lote[]>([])
const loading = ref(false)
const saving = ref(false)

// Menu
const openMenuId = ref<string | null>(null)
const editingCell = ref<string | null>(null)

// Tooltip filtros de etapa
const showEtapaTooltip = ref(false)
const tooltipTriggerRef = ref<HTMLElement | null>(null)

const etapaTooltipStyle = computed(() => {
  if (!tooltipTriggerRef.value) return {}
  const rect = tooltipTriggerRef.value.getBoundingClientRect()
  return {
    top: `${rect.bottom + 10}px`,
    left: `${rect.left + rect.width / 2}px`,
    transform: 'translateX(-50%)'
  }
})

// Scroll ref
const tableScrollRef = ref<HTMLElement | null>(null)

// Modais
const showCadastroModal = ref(false)
const showEditModal = ref(false)
const showLotesModal = ref(false)
const showRecorrenciaModal = ref(false)
const showCancelarRecorrenciaModal = ref(false)
const showCancelarPlanoModal = ref(false)
const showColheitaModal = ref(false)
const showStatusModal = ref(false)
const showDetailsSlideover = ref(false)
const showDiferencaPlantioModal = ref(false)
const showDiferencaLuzModal = ref(false)
const selectedProducao = ref<Producao | null>(null)

// Dados para modais de diferença
const diferencaPlantioData = ref({
  prod: null as Producao | null,
  quantidadePlanejada: 0,
  quantidadeInformada: 0,
  diferenca: 0,
  opcao: 'manter' as 'criar_plano' | 'manter'
})

const diferencaLuzData = ref({
  prod: null as Producao | null,
  quantidadePlantio: 0,
  quantidadeLuz: 0,
  diferenca: 0,
  opcao: 'perda' as 'manter_fazenda' | 'perda'
})

// Status options - novo fluxo: planejado -> germinando -> vegetacao -> colhendo -> finalizado
const statusOptions = [
  { value: 'planejado', label: 'Planejado' },
  { value: 'germinando', label: 'Germinando' },
  { value: 'vegetacao', label: 'Vegetação' },
  { value: 'colhendo', label: 'Colhendo' },
  { value: 'finalizado', label: 'Finalizado' },
  { value: 'cancelado', label: 'Cancelado' }
]

// Filtros
const etapas = [
  { value: 'todos', label: 'Todos' },
  { value: 'plantio', label: 'Plantio' },
  { value: 'luz', label: 'Luz' },
  { value: 'colheita', label: 'Colheita' }
]
// Recuperar filtros salvos do localStorage
const savedFilterEtapa = typeof window !== 'undefined' ? localStorage.getItem('producao-filter-etapa') : null
const savedFilterFazenda = typeof window !== 'undefined' ? localStorage.getItem('producao-filter-fazenda') : null
const savedFilterEspecie = typeof window !== 'undefined' ? localStorage.getItem('producao-filter-especie') : null
const savedExibirFinalizados = typeof window !== 'undefined' ? localStorage.getItem('producao-exibir-finalizados') : null
const savedPeriodoInicio = typeof window !== 'undefined' ? localStorage.getItem('producao-periodo-inicio') : null
const savedPeriodoFim = typeof window !== 'undefined' ? localStorage.getItem('producao-periodo-fim') : null

const filterEtapa = ref(savedFilterEtapa || 'todos')
const filterFazenda = ref(savedFilterFazenda || '')
const filterEspecie = ref(savedFilterEspecie || '')
const exibirFinalizados = ref(savedExibirFinalizados === 'true')

// Período - com persistência
const periodoInicio = ref(savedPeriodoInicio ? new Date(savedPeriodoInicio) : getStartOfWeek(new Date()))
const periodoFim = ref(savedPeriodoFim ? new Date(savedPeriodoFim) : getEndOfWeek(new Date()))
const customDateMode = ref(false)

const customInicio = computed({
  get: () => periodoInicio.value.toISOString().split('T')[0],
  set: (val: string) => {
    periodoInicio.value = new Date(val + 'T00:00:00')
    savePeriodoToStorage()
  }
})

const customFim = computed({
  get: () => periodoFim.value.toISOString().split('T')[0],
  set: (val: string) => {
    periodoFim.value = new Date(val + 'T00:00:00')
    savePeriodoToStorage()
  }
})

// Paginação
const currentPage = ref(1)
const itemsPerPage = ref(10)
const pageInput = ref('1')

// Ordenação
const sortField = ref<string>('')
const sortDirection = ref<'asc' | 'desc'>('asc')

function toggleSort(field: string) {
  if (sortField.value === field) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortDirection.value = 'asc'
  }
  currentPage.value = 1
}

// Formulários
const novoPlano = ref({
  especie_id: '',
  fazenda_id: '',
  lote_id: '',
  quantidade: 1,
  data_colheita: '',
  recorrente: false
})

const editPlano = ref({
  id: '',
  especie_id: '',
  fazenda_id: '',
  lote_id: '',
  quantidade: 1,
  data_colheita: '',
  data_plantio_previsto: '',
  data_luz_prevista: '',
  recorrente: false
})

const colheitaForm = ref({
  data: new Date().toISOString().split('T')[0],
  quantidade: 0,
  perda: 0,
  finalizar: true // true = Sim, finalizar | false = Não, continuar mais tarde
})

const recorrenciaQuantidade = ref(0)

const datasCalculadas = ref({ data_plantio: '', data_luz: '' })

// Helpers de data
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

function previousPeriod() {
  if (customDateMode.value) {
    customDateMode.value = false
    periodoInicio.value = getStartOfWeek(periodoInicio.value)
    periodoFim.value = getEndOfWeek(periodoInicio.value)
  }
  periodoInicio.value = new Date(periodoInicio.value.getTime() - 7 * 24 * 60 * 60 * 1000)
  periodoFim.value = new Date(periodoFim.value.getTime() - 7 * 24 * 60 * 60 * 1000)
  savePeriodoToStorage()
}

function nextPeriod() {
  if (customDateMode.value) {
    customDateMode.value = false
    periodoInicio.value = getStartOfWeek(periodoInicio.value)
    periodoFim.value = getEndOfWeek(periodoInicio.value)
  }
  periodoInicio.value = new Date(periodoInicio.value.getTime() + 7 * 24 * 60 * 60 * 1000)
  periodoFim.value = new Date(periodoFim.value.getTime() + 7 * 24 * 60 * 60 * 1000)
  savePeriodoToStorage()
}

function toggleCustomDateMode() {
  customDateMode.value = !customDateMode.value
}

// Salvar filtros no localStorage
function savePeriodoToStorage() {
  if (typeof window !== 'undefined') {
    localStorage.setItem('producao-periodo-inicio', periodoInicio.value.toISOString())
    localStorage.setItem('producao-periodo-fim', periodoFim.value.toISOString())
  }
}

function saveFiltersToStorage() {
  if (typeof window !== 'undefined') {
    localStorage.setItem('producao-filter-etapa', filterEtapa.value)
    localStorage.setItem('producao-filter-fazenda', filterFazenda.value)
    localStorage.setItem('producao-filter-especie', filterEspecie.value)
    localStorage.setItem('producao-exibir-finalizados', exibirFinalizados.value.toString())
  }
}

function formatDateBR(dateStr?: string | Date): string {
  if (!dateStr) return ''
  const date = typeof dateStr === 'string' ? new Date(dateStr + 'T00:00:00') : dateStr
  return date.toLocaleDateString('pt-BR')
}

function formatDateShort(dateStr?: string): string {
  if (!dateStr) return ''
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function getDiaSemana(dateStr?: string): string {
  if (!dateStr) return ''
  const date = new Date(dateStr + 'T00:00:00')
  const dia = date.toLocaleDateString('pt-BR', { weekday: 'long' })
  return dia.charAt(0).toUpperCase() + dia.slice(1)
}

function parseDate(dateStr: string): string | null {
  // Tenta converter DD/MM/YYYY para YYYY-MM-DD
  const parts = dateStr.split('/')
  if (parts.length === 3) {
    const [day, month, year] = parts
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }
  return null
}

// Computed
const especieSelecionada = computed(() => especies.value.find(e => e.id === novoPlano.value.especie_id))
const especieSelecionadaEdit = computed(() => especies.value.find(e => e.id === editPlano.value.especie_id))

const lotesFiltrados = computed(() => {
  if (!editPlano.value.especie_id) return lotes.value
  return lotes.value.filter(l => l.especie_id === editPlano.value.especie_id)
})

const lotesFiltradosNovo = computed(() => {
  if (!novoPlano.value.especie_id) return lotes.value
  return lotes.value.filter(l => l.especie_id === novoPlano.value.especie_id)
})

const isFormValid = computed(() => {
  return novoPlano.value.especie_id && novoPlano.value.fazenda_id &&
         novoPlano.value.lote_id && novoPlano.value.quantidade > 0 && novoPlano.value.data_colheita
})

const kpis = computed(() => {
  const total = filteredProducao.value.reduce((sum, p) => sum + (p.quantidade_bandeja || 0), 0)
  const previstos = filteredProducao.value.filter(p => p.status === 'planejado')
    .reduce((sum, p) => sum + (p.quantidade_bandeja || 0), 0)
  const realizado = filteredProducao.value.filter(p => p.data_colheita_real)
    .reduce((sum, p) => sum + (p.quantidade_colhida || p.quantidade_bandeja || 0), 0)
  const hoje = new Date()
  const atrasados = filteredProducao.value.filter(p => {
    if (['colhido', 'cancelado', 'finalizado'].includes(p.status)) return false
    const dc = p.data_colheita_prevista ? new Date(p.data_colheita_prevista + 'T00:00:00') : null
    return dc && dc < hoje && !p.data_colheita_real
  }).reduce((sum, p) => sum + (p.quantidade_bandeja || 0), 0)
  const perdas = filteredProducao.value.reduce((sum, p) =>
    sum + (p.perda_plantio || 0) + (p.perda_luz || 0) + (p.perda_colheita || 0), 0)

  return [
    { label: 'Total', value: total, percent: 100, color: 'bg-gray-400', textColor: 'text-text-light dark:text-text-dark' },
    { label: 'Previstos', value: previstos, percent: total > 0 ? Math.round((previstos / total) * 100) : 0, color: 'bg-blue-500', textColor: 'text-blue-600' },
    { label: 'Realizado', value: realizado, percent: total > 0 ? Math.round((realizado / total) * 100) : 0, color: 'bg-green-500', textColor: 'text-green-600' },
    { label: 'Atrasados', value: atrasados, percent: total > 0 ? Math.round((atrasados / total) * 100) : 0, color: 'bg-yellow-500', textColor: 'text-yellow-600' },
    { label: 'Perdas', value: perdas, percent: total > 0 ? Math.round((perdas / total) * 100) : 0, color: 'bg-red-500', textColor: 'text-red-600' }
  ]
})

const filteredProducao = computed(() => {
  let result = producao.value
  const inicio = periodoInicio.value.toISOString().split('T')[0]
  const fim = periodoFim.value.toISOString().split('T')[0]

  // Filtro por etapa - busca direta pela data da etapa selecionada
  result = result.filter(p => {
    const dp = p.data_plantio_previsto || p.data_semeadura
    const dl = p.data_luz_prevista
    const dc = p.data_colheita_prevista

    if (filterEtapa.value === 'plantio') {
      return dp && dp >= inicio && dp <= fim
    }
    if (filterEtapa.value === 'luz') {
      return dl && dl >= inicio && dl <= fim
    }
    if (filterEtapa.value === 'colheita') {
      return dc && dc >= inicio && dc <= fim
    }
    // "Todos" - mostra produções a serem colhidas no período
    return dc && dc >= inicio && dc <= fim
  })

  if (filterFazenda.value) result = result.filter(p => p.fazenda_id === filterFazenda.value)
  if (filterEspecie.value) result = result.filter(p => p.especie_id === filterEspecie.value)
  if (!exibirFinalizados.value) result = result.filter(p => !['colhido', 'cancelado', 'finalizado'].includes(p.status))

  // Ordenação por coluna
  if (sortField.value) {
    result = [...result].sort((a: Producao, b: Producao) => {
      const valA = (a as any)[sortField.value] || ''
      const valB = (b as any)[sortField.value] || ''
      const comparison = valA.localeCompare(valB)
      return sortDirection.value === 'asc' ? comparison : -comparison
    })
  }

  return result
})

const totalPages = computed(() => Math.ceil(filteredProducao.value.length / itemsPerPage.value) || 1)

const paginatedProducao = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  return filteredProducao.value.slice(start, start + itemsPerPage.value)
})

// Funções auxiliares
function getStatusLabel(status?: string): string {
  const labels: Record<string, string> = {
    planejado: 'Planejado',
    germinando: 'Germinando',
    vegetacao: 'Vegetação',
    colhendo: 'Colhendo',
    em_plantio: 'Em Plantio',
    em_luz: 'Em Luz',
    em_colheita: 'Em Colheita',
    colhido: 'Colhido',
    finalizado: 'Finalizado',
    cancelado: 'Cancelado',
    em_andamento: 'Em Andamento'
  }
  return labels[status || ''] || status || '-'
}

function getColheitaClass(prod: Producao): string {
  if (prod.status === 'colhido' || prod.data_colheita_real) return 'bg-green-50 border-green-200 text-green-700'
  if (!prod.data_colheita_prevista) return 'bg-gray-50 border-gray-200 text-gray-700'
  const hoje = new Date()
  const colheita = new Date(prod.data_colheita_prevista + 'T00:00:00')
  const diff = Math.ceil((colheita.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
  if (diff < 0) return 'bg-red-50 border-red-200 text-red-700'
  if (diff <= 3) return 'bg-yellow-50 border-yellow-200 text-yellow-700'
  return 'bg-green-50 border-green-200 text-green-700'
}

function getColheitaMobileClass(prod: Producao): string {
  if (prod.status === 'colhido' || prod.data_colheita_real) return 'bg-green-100 text-green-800'
  if (!prod.data_colheita_prevista) return 'bg-gray-50 dark:bg-gray-800 text-text-light dark:text-text-dark'
  const hoje = new Date()
  const colheita = new Date(prod.data_colheita_prevista + 'T00:00:00')
  const diff = Math.ceil((colheita.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
  if (diff < 0) return 'bg-red-100 text-red-800'
  if (diff <= 3) return 'bg-yellow-100 text-yellow-800'
  return 'bg-green-100 text-green-800'
}

function getStatusBadgeClass(status?: string): string {
  const classes: Record<string, string> = {
    planejado: 'border-gray-400 bg-transparent text-gray-600 dark:border-gray-500 dark:text-gray-400',
    germinando: 'border-amber-500 bg-transparent text-amber-600 dark:border-amber-400 dark:text-amber-400',
    vegetacao: 'border-blue-500 bg-transparent text-blue-600 dark:border-blue-400 dark:text-blue-400',
    colhendo: 'border-green-500 bg-transparent text-green-600 dark:border-green-400 dark:text-green-400',
    finalizado: 'border-gray-400 bg-transparent text-gray-600 dark:border-gray-500 dark:text-gray-400',
    em_plantio: 'border-blue-500 bg-transparent text-blue-600',
    em_luz: 'border-yellow-500 bg-transparent text-yellow-600',
    em_colheita: 'border-orange-500 bg-transparent text-orange-600',
    colhido: 'border-green-500 bg-transparent text-green-600',
    cancelado: 'border-red-500 bg-transparent text-red-600'
  }
  return classes[status || ''] || classes.planejado
}

// Menu toggle
function toggleMenu(id: string) {
  openMenuId.value = openMenuId.value === id ? null : id
}

// Update inline field
async function updateField(id: string, field: string, event: Event) {
  const target = event.target as HTMLInputElement
  const value = target.value
  if (!value || !currentCompany.value?.id) return

  const dateValue = parseDate(value)
  if (!dateValue) {
    showError('Data inválida. Use o formato DD/MM/YYYY')
    return
  }

  try {
    const { error } = await supabase
      .from('producao')
      .update({ [field]: dateValue })
      .eq('id', id)
      .eq('empresa_id', currentCompany.value.id)

    if (error) throw error
    success('Data atualizada com sucesso!')
    loadProducao()
  } catch (e: any) {
    showError('Erro ao atualizar: ' + e.message)
  }
}

async function updateFieldNumber(id: string, field: string, event: Event) {
  const target = event.target as HTMLInputElement
  const value = parseInt(target.value)
  if (isNaN(value) || !currentCompany.value?.id) return

  try {
    const { error } = await supabase
      .from('producao')
      .update({ [field]: value })
      .eq('id', id)
      .eq('empresa_id', currentCompany.value.id)

    if (error) throw error
    success('Quantidade atualizada com sucesso!')
    loadProducao()
  } catch (e: any) {
    showError('Erro ao atualizar: ' + e.message)
  }
}

// =====================================================
// Funções para seção "Realizado" com mudança de status
// =====================================================

// Cálculo de perdas
function calcularBandejas(prod: Producao): number {
  if (!prod.quantidade_bandeja || !prod.fazenda_id) return 0
  const fazenda = fazendas.value.find(f => f.id === prod.fazenda_id)
  if (!fazenda?.unidades_por_bandeja) return 0
  return Math.ceil(prod.quantidade_bandeja / fazenda.unidades_por_bandeja)
}

function calcularPerdaLuz(prod: Producao): number {
  if (!prod.quantidade_plantio || !prod.quantidade_luz) return 0
  const perda = prod.quantidade_plantio - prod.quantidade_luz
  return perda > 0 ? perda : 0
}

function calcularPerdaColheita(prod: Producao): number {
  if (!prod.quantidade_luz || !prod.quantidade_colhida) return 0
  const perda = prod.quantidade_luz - prod.quantidade_colhida
  return perda > 0 ? perda : 0
}

// Placeholders com valores estimados para os inputs do Realizado
function getPlaceholderPlantio(prod: Producao): string {
  return prod.quantidade_bandeja ? String(prod.quantidade_bandeja) : '-'
}

function getPlaceholderLuz(prod: Producao): string {
  if (!prod.quantidade_plantio && !prod.quantidade_bandeja) return '-'
  const base = prod.quantidade_plantio || prod.quantidade_bandeja || 0
  const eficiencia = prod.lotes_sementes?.eficiencia
  if (eficiencia && eficiencia > 0) {
    return String(Math.round(base * (eficiencia / 100)))
  }
  return String(base)
}

function getPlaceholderColheita(prod: Producao): string {
  if (!prod.quantidade_luz && !prod.quantidade_plantio && !prod.quantidade_bandeja) return '-'
  const base = prod.quantidade_luz || prod.quantidade_plantio || prod.quantidade_bandeja || 0
  return String(Math.round(base * 0.95))
}

// Atualização manual de perdas
async function updatePerdaLuz(prod: Producao, event: Event) {
  const target = event.target as HTMLInputElement
  const value = parseInt(target.value)
  if (!currentCompany.value?.id || isNaN(value)) return

  // Validação: quantidade_luz + perda não pode ser maior que quantidade_plantio
  const qtdPlantio = prod.quantidade_plantio || 0
  const qtdLuz = prod.quantidade_luz || 0
  if (qtdLuz + value > qtdPlantio) {
    showError(`Qtd luz (${qtdLuz}) + perda (${value}) não pode ser maior que qtd plantio (${qtdPlantio})`)
    target.value = String(prod.perda_luz || 0)
    return
  }

  try {
    const { error } = await supabase
      .from('producao')
      .update({ perda_luz: value })
      .eq('id', prod.id)
      .eq('empresa_id', currentCompany.value.id)

    if (error) throw error
    prod.perda_luz = value
    success('Perda de luz atualizada!')
  } catch (e: any) {
    showError('Erro ao atualizar: ' + e.message)
  }
}

async function updatePerdaColheita(prod: Producao, event: Event) {
  const target = event.target as HTMLInputElement
  const value = parseInt(target.value)
  if (!currentCompany.value?.id || isNaN(value)) return

  // Validação: quantidade_colhida + perda não pode ser maior que quantidade_luz
  const qtdLuz = prod.quantidade_luz || 0
  const qtdColhida = prod.quantidade_colhida || 0
  if (qtdColhida + value > qtdLuz) {
    showError(`Qtd colhida (${qtdColhida}) + perda (${value}) não pode ser maior que qtd luz (${qtdLuz})`)
    target.value = String(prod.perda_colheita || 0)
    return
  }

  try {
    const { error } = await supabase
      .from('producao')
      .update({ perda_colheita: value })
      .eq('id', prod.id)
      .eq('empresa_id', currentCompany.value.id)

    if (error) throw error
    prod.perda_colheita = value
    success('Perda de colheita atualizada!')
  } catch (e: any) {
    showError('Erro ao atualizar: ' + e.message)
  }
}

// Atualização de Data Plantio Real
async function updateRealizadoPlantio(prod: Producao, event: Event) {
  const target = event.target as HTMLInputElement
  const value = target.value
  if (!currentCompany.value?.id) return

  try {
    const updateData: Record<string, any> = {
      data_plantio_real: value || null
    }

    // Muda status para 'germinando' se data E quantidade estiverem preenchidos
    if (value && prod.quantidade_plantio) {
      updateData.status = 'germinando'
    }

    const { error } = await supabase
      .from('producao')
      .update(updateData)
      .eq('id', prod.id)
      .eq('empresa_id', currentCompany.value.id)

    if (error) throw error

    // Atualiza localmente sem recarregar (mantém scroll)
    prod.data_plantio_real = value || undefined
    if (updateData.status) prod.status = updateData.status

    success('Data de plantio atualizada!')
  } catch (e: any) {
    showError('Erro ao atualizar: ' + e.message)
  }
}

// Atualização de Quantidade Plantio
async function updateRealizadoPlantioQtd(prod: Producao, event: Event) {
  const target = event.target as HTMLInputElement
  const value = parseInt(target.value)
  if (!currentCompany.value?.id || isNaN(value)) return

  const quantidadePlanejada = prod.quantidade_bandeja || 0

  // Validação: quantidade de plantio não pode ser maior que quantidade planejada (bandejas)
  if (value > quantidadePlanejada && quantidadePlanejada > 0) {
    showError(`Quantidade de plantio (${value}) não pode ser maior que a quantidade planejada (${quantidadePlanejada})`)
    target.value = String(prod.quantidade_plantio || '')
    return
  }

  // Se há diferença entre planejado e informado, abre modal de decisão
  if (value < quantidadePlanejada) {
    openDiferencaPlantioModal(prod, value)
    return
  }

  // Se quantidade igual, salva direto
  try {
    const updateData: Record<string, any> = {
      quantidade_plantio: value
    }

    // Muda status para 'germinando' se data E quantidade estiverem preenchidos
    if (prod.data_plantio_real && value > 0) {
      updateData.status = 'germinando'
    }

    const { error } = await supabase
      .from('producao')
      .update(updateData)
      .eq('id', prod.id)
      .eq('empresa_id', currentCompany.value.id)

    if (error) throw error

    // Atualiza localmente sem recarregar (mantém scroll)
    prod.quantidade_plantio = value
    if (updateData.status) prod.status = updateData.status

    success('Quantidade de plantio atualizada!')
  } catch (e: any) {
    showError('Erro ao atualizar: ' + e.message)
  }
}

// Atualização de Data Luz Real
async function updateRealizadoLuz(prod: Producao, event: Event) {
  const target = event.target as HTMLInputElement
  const value = target.value
  if (!currentCompany.value?.id) return

  try {
    const updateData: Record<string, any> = {
      data_luz_real: value || null
    }

    // Muda status para 'vegetacao' se data E quantidade estiverem preenchidos
    if (value && prod.quantidade_luz) {
      updateData.status = 'vegetacao'
    }

    // Calcula perda_luz automaticamente
    if (prod.quantidade_plantio && prod.quantidade_luz) {
      const perda = prod.quantidade_plantio - prod.quantidade_luz
      updateData.perda_luz = perda > 0 ? perda : 0
    }

    const { error } = await supabase
      .from('producao')
      .update(updateData)
      .eq('id', prod.id)
      .eq('empresa_id', currentCompany.value.id)

    if (error) throw error

    // Atualiza localmente sem recarregar (mantém scroll)
    prod.data_luz_real = value || undefined
    if (updateData.status) prod.status = updateData.status
    if (updateData.perda_luz !== undefined) prod.perda_luz = updateData.perda_luz

    success('Data de luz atualizada!')
  } catch (e: any) {
    showError('Erro ao atualizar: ' + e.message)
  }
}

// Atualização de Quantidade Luz
async function updateRealizadoLuzQtd(prod: Producao, event: Event) {
  const target = event.target as HTMLInputElement
  const value = parseInt(target.value)
  if (!currentCompany.value?.id || isNaN(value)) return

  const quantidadePlantio = prod.quantidade_plantio || 0

  // Validação: quantidade de luz não pode ser maior que quantidade de plantio
  if (value > quantidadePlantio) {
    showError(`Quantidade de luz (${value}) não pode ser maior que a quantidade de plantio (${quantidadePlantio})`)
    target.value = String(prod.quantidade_luz || '')
    return
  }

  // Se há diferença entre plantio e luz, abre modal de decisão
  if (value < quantidadePlantio) {
    openDiferencaLuzModal(prod, value)
    return
  }

  // Se quantidade igual, salva direto
  try {
    const updateData: Record<string, any> = {
      quantidade_luz: value,
      perda_luz: 0 // Sem perda se quantidade >= plantio
    }

    // Muda status para 'vegetacao' se data E quantidade estiverem preenchidos
    if (prod.data_luz_real && value > 0) {
      updateData.status = 'vegetacao'
    }

    const { error } = await supabase
      .from('producao')
      .update(updateData)
      .eq('id', prod.id)
      .eq('empresa_id', currentCompany.value.id)

    if (error) throw error

    // Atualiza localmente sem recarregar (mantém scroll)
    prod.quantidade_luz = value
    if (updateData.status) prod.status = updateData.status
    prod.perda_luz = 0

    success('Quantidade de luz atualizada!')
  } catch (e: any) {
    showError('Erro ao atualizar: ' + e.message)
  }
}

// Atualização de Data Colheita Real
async function updateRealizadoColheita(prod: Producao, event: Event) {
  const target = event.target as HTMLInputElement
  const value = target.value
  if (!currentCompany.value?.id) return

  try {
    const updateData: Record<string, any> = {
      data_colheita_real: value || null
    }

    // Muda status para 'colhendo' se data E quantidade estiverem preenchidos
    if (value && prod.quantidade_colhida) {
      updateData.status = 'colhendo'
    }

    // Calcula perda_colheita automaticamente
    if (prod.quantidade_luz && prod.quantidade_colhida) {
      const perda = prod.quantidade_luz - prod.quantidade_colhida
      updateData.perda_colheita = perda > 0 ? perda : 0
    }

    const { error } = await supabase
      .from('producao')
      .update(updateData)
      .eq('id', prod.id)
      .eq('empresa_id', currentCompany.value.id)

    if (error) throw error

    // Atualiza localmente sem recarregar (mantém scroll)
    prod.data_colheita_real = value || undefined
    if (updateData.status) prod.status = updateData.status
    if (updateData.perda_colheita !== undefined) prod.perda_colheita = updateData.perda_colheita

    success('Data de colheita atualizada!')
  } catch (e: any) {
    showError('Erro ao atualizar: ' + e.message)
  }
}

// Atualização de Quantidade Colheita
async function updateRealizadoColheitaQtd(prod: Producao, event: Event) {
  const target = event.target as HTMLInputElement
  const value = parseInt(target.value)
  if (!currentCompany.value?.id) return

  // Validação: quantidade colhida não pode ser maior que quantidade de luz
  const quantidadeLuz = prod.quantidade_luz || 0
  if (!isNaN(value) && value > quantidadeLuz && quantidadeLuz > 0) {
    showError(`Quantidade colhida (${value}) não pode ser maior que a quantidade de luz (${quantidadeLuz})`)
    target.value = String(prod.quantidade_colhida || '')
    return
  }

  try {
    const quantidadeAnterior = prod.quantidade_colhida || 0
    const quantidadeNova = isNaN(value) ? 0 : value
    const diferencaQuantidade = quantidadeNova - quantidadeAnterior

    const updateData: Record<string, any> = {
      quantidade_colhida: isNaN(value) ? null : value
    }

    // Muda status para 'colhendo' se data E quantidade estiverem preenchidos
    if (prod.data_colheita_real && !isNaN(value) && value > 0) {
      updateData.status = 'colhendo'
    }

    // Calcula perda_colheita automaticamente
    if (prod.quantidade_luz && !isNaN(value)) {
      const perda = prod.quantidade_luz - value
      updateData.perda_colheita = perda > 0 ? perda : 0
    }

    const { error } = await supabase
      .from('producao')
      .update(updateData)
      .eq('id', prod.id)
      .eq('empresa_id', currentCompany.value.id)

    if (error) throw error

    // Registrar entrada/ajuste no estoque se houve mudança na quantidade
    if (diferencaQuantidade !== 0 && prod.especie_id) {
      await registrarAjusteEstoque(
        prod.especie_id,
        prod.id,
        diferencaQuantidade
      )
    }

    // Atualiza localmente sem recarregar (mantém scroll)
    prod.quantidade_colhida = isNaN(value) ? undefined : value
    if (updateData.status) prod.status = updateData.status
    if (updateData.perda_colheita !== undefined) prod.perda_colheita = updateData.perda_colheita

    success('Quantidade colhida atualizada!')
  } catch (e: any) {
    showError('Erro ao atualizar: ' + e.message)
  }
}

// Função para registrar ajuste no estoque (quando edita quantidade inline)
async function registrarAjusteEstoque(especieId: string, producaoId: string, diferenca: number) {
  if (!currentCompany.value?.id || diferenca === 0) return

  try {
    // Buscar estoque existente para a espécie
    const { data: estoqueExistente } = await supabase
      .from('estoque')
      .select('id, quantidade')
      .eq('empresa_id', currentCompany.value.id)
      .eq('especie_id', especieId)
      .is('produto_id', null)
      .single()

    const quantidadeAnterior = estoqueExistente?.quantidade || 0
    const quantidadeNova = Math.max(0, quantidadeAnterior + diferenca)

    if (estoqueExistente) {
      // Atualizar estoque existente
      await supabase
        .from('estoque')
        .update({ quantidade: quantidadeNova, updated_at: new Date().toISOString() })
        .eq('id', estoqueExistente.id)
    } else if (diferenca > 0) {
      // Criar novo registro de estoque apenas se for entrada
      await supabase
        .from('estoque')
        .insert({
          empresa_id: currentCompany.value.id,
          especie_id: especieId,
          quantidade: diferenca
        })
    }

    // Registrar movimentação (entrada se positivo, saída se negativo)
    const user = useSupabaseUser()
    await supabase
      .from('movimentacoes_estoque')
      .insert({
        empresa_id: currentCompany.value.id,
        especie_id: especieId,
        producao_id: producaoId,
        tipo: diferenca > 0 ? 'entrada' : 'saida',
        quantidade: Math.abs(diferenca),
        quantidade_anterior: quantidadeAnterior,
        quantidade_nova: quantidadeNova,
        motivo: 'producao',
        observacoes: diferenca > 0 ? 'Ajuste de colheita (aumento)' : 'Ajuste de colheita (redução)',
        usuario_id: user.value?.id
      })
  } catch (e: any) {
    console.error('Erro ao registrar ajuste no estoque:', e)
  }
}

// Computed para obter o lote selecionado
const loteSelecionado = computed(() => lotes.value.find(l => l.id === novoPlano.value.lote_id))
const loteSelecionadoEdit = computed(() => lotes.value.find(l => l.id === editPlano.value.lote_id))

// Computed para obter a fazenda selecionada
const fazendaSelecionada = computed(() => fazendas.value.find(f => f.id === novoPlano.value.fazenda_id))
const fazendaSelecionadaEdit = computed(() => fazendas.value.find(f => f.id === editPlano.value.fazenda_id))

// Computed para calcular bandejas
const bandejasCalculadas = computed(() => {
  if (!novoPlano.value.quantidade || !fazendaSelecionada.value?.unidades_por_bandeja) return 0
  return Math.ceil(novoPlano.value.quantidade / fazendaSelecionada.value.unidades_por_bandeja)
})

const bandejasCalculadasEdit = computed(() => {
  if (!editPlano.value.quantidade || !fazendaSelecionadaEdit.value?.unidades_por_bandeja) return 0
  return Math.ceil(editPlano.value.quantidade / fazendaSelecionadaEdit.value.unidades_por_bandeja)
})

// Função chamada ao mudar a espécie - pré-seleciona o lote mais recente
function onEspecieChange() {
  // Limpa o lote atual
  novoPlano.value.lote_id = ''
  datasCalculadas.value = { data_plantio: '', data_luz: '' }

  // Filtra lotes da espécie selecionada
  const lotesEspecie = lotes.value.filter(l => l.especie_id === novoPlano.value.especie_id)

  // Pré-seleciona o primeiro (mais recente, pois já está ordenado por created_at desc)
  if (lotesEspecie.length > 0) {
    novoPlano.value.lote_id = lotesEspecie[0].id
    calcularDatasFromColheita()
  }
}

function calcularDatasFromColheita() {
  // Agora usa os tempos do LOTE, não da espécie
  if (!novoPlano.value.data_colheita || !loteSelecionado.value) {
    datasCalculadas.value = { data_plantio: '', data_luz: '' }
    return
  }
  const lote = loteSelecionado.value
  const tg = lote.tempo_germinacao || 0
  const tl = lote.tempo_luz || 0
  const tempoTotal = tg + tl
  const dc = new Date(novoPlano.value.data_colheita + 'T00:00:00')
  const dplantio = new Date(dc); dplantio.setDate(dplantio.getDate() - tempoTotal)
  const dluz = new Date(dplantio); dluz.setDate(dluz.getDate() + tg)
  datasCalculadas.value = {
    data_plantio: dplantio.toISOString().split('T')[0],
    data_luz: dluz.toISOString().split('T')[0]
  }
}

function calcularDatasFromColheitaEdit() {
  // Usa os tempos do lote selecionado, ou da espécie como fallback
  const lote = loteSelecionadoEdit.value
  const especie = especieSelecionadaEdit.value

  if (!editPlano.value.data_colheita) return

  // Prioriza tempos do lote, depois da espécie
  const tg = lote?.tempo_germinacao || especie?.tempo_germinacao || 0
  const tl = lote?.tempo_luz || especie?.tempo_luz || 0
  const tempoTotal = tg + tl

  const dc = new Date(editPlano.value.data_colheita + 'T00:00:00')
  const dplantio = new Date(dc); dplantio.setDate(dplantio.getDate() - tempoTotal)
  const dluz = new Date(dplantio); dluz.setDate(dluz.getDate() + tg)

  editPlano.value.data_plantio_previsto = dplantio.toISOString().split('T')[0]
  editPlano.value.data_luz_prevista = dluz.toISOString().split('T')[0]
}

// CRUD
async function loadProducao() {
  if (!currentCompany.value?.id) return
  loading.value = true
  try {
    const { data, error } = await supabase
      .from('producao')
      .select(`*, fazendas:fazenda_id (id, nome), especies:especie_id (id, codigo, nome, tempo_germinacao, tempo_luz), lotes_sementes:lote_id (id, numero, eficiencia), produtos:produto_id (id, nome, codigo)`)
      .eq('empresa_id', currentCompany.value.id)
      .order('data_colheita_prevista', { ascending: true })
    if (error) throw error
    producao.value = data || []
  } catch (e: any) {
    showError('Erro ao carregar: ' + e.message)
  } finally {
    loading.value = false
  }
}

async function loadFazendas() {
  if (!currentCompany.value?.id) return
  const { data } = await supabase.from('fazendas').select('id, nome, unidades_por_bandeja').eq('empresa_id', currentCompany.value.id).eq('ativo', true).order('nome')
  fazendas.value = data || []
}

async function loadEspecies() {
  if (!currentCompany.value?.id) return
  const { data } = await supabase.from('especies').select('id, codigo, nome, tempo_germinacao, tempo_luz').eq('empresa_id', currentCompany.value.id).eq('ativo', true).order('nome')
  especies.value = data || []
}

async function loadLotes() {
  if (!currentCompany.value?.id) return
  const { data } = await supabase.from('lotes_sementes').select('id, numero, especie_id, tempo_germinacao, tempo_luz, eficiencia, created_at').eq('empresa_id', currentCompany.value.id).eq('status', 'ativo').order('created_at', { ascending: false })
  lotes.value = data || []
}

// Modais
function openCadastroModal() {
  novoPlano.value = { especie_id: '', fazenda_id: '', lote_id: '', quantidade: 1, data_colheita: '', recorrente: false }
  datasCalculadas.value = { data_plantio: '', data_luz: '' }
  showCadastroModal.value = true
}

function closeCadastroModal() { showCadastroModal.value = false }

function openEditarPlano(prod: Producao) {
  openMenuId.value = null
  selectedProducao.value = prod
  editPlano.value = {
    id: prod.id,
    especie_id: prod.especie_id || '',
    fazenda_id: prod.fazenda_id || '',
    lote_id: prod.lote_id || '',
    quantidade: prod.quantidade_bandeja || 1,
    data_colheita: prod.data_colheita_prevista || '',
    data_plantio_previsto: prod.data_plantio_previsto || prod.data_semeadura || '',
    data_luz_prevista: prod.data_luz_prevista || '',
    recorrente: prod.recorrente || false
  }
  showEditModal.value = true
}

function closeEditModal() { showEditModal.value = false }

function openVerLotes(prod: Producao) {
  openMenuId.value = null
  selectedProducao.value = prod
  showLotesModal.value = true
}

function closeLotesModal() { showLotesModal.value = false }

function openEditarRecorrencia(prod: Producao) {
  openMenuId.value = null
  selectedProducao.value = prod
  recorrenciaQuantidade.value = prod.quantidade_bandeja || 0
  showRecorrenciaModal.value = true
}

function closeRecorrenciaModal() { showRecorrenciaModal.value = false }

function openRegistrarColheita(prod: Producao) {
  openMenuId.value = null
  selectedProducao.value = prod
  colheitaForm.value = {
    data: new Date().toISOString().split('T')[0],
    quantidade: prod.quantidade_colhida || 0,
    perda: 0,
    finalizar: true
  }
  showColheitaModal.value = true
}

// Computed para calcular o progresso da colheita
const progressoColheita = computed(() => {
  if (!selectedProducao.value?.quantidade_luz) return 0
  const colhida = colheitaForm.value.quantidade || 0
  const total = selectedProducao.value.quantidade_luz
  return Math.min(Math.round((colhida / total) * 100), 100)
})

function closeColheitaModal() { showColheitaModal.value = false }

function openAlterarStatus(prod: Producao) {
  openMenuId.value = null
  selectedProducao.value = prod
  showStatusModal.value = true
}

function closeStatusModal() { showStatusModal.value = false }

// Modal Diferença Plantio
function openDiferencaPlantioModal(prod: Producao, quantidadeInformada: number) {
  const quantidadePlanejada = prod.quantidade_bandeja || 0
  diferencaPlantioData.value = {
    prod,
    quantidadePlanejada,
    quantidadeInformada,
    diferenca: quantidadePlanejada - quantidadeInformada,
    opcao: 'manter'
  }
  showDiferencaPlantioModal.value = true
}

function closeDiferencaPlantioModal() {
  showDiferencaPlantioModal.value = false
  diferencaPlantioData.value.prod = null
}

async function confirmarDiferencaPlantio() {
  if (!currentCompany.value?.id || !diferencaPlantioData.value.prod) return
  saving.value = true

  try {
    const prod = diferencaPlantioData.value.prod
    const quantidadeInformada = diferencaPlantioData.value.quantidadeInformada

    // Atualizar o plano atual
    const updateData: Record<string, any> = {
      quantidade_plantio: quantidadeInformada,
      quantidade_bandeja: quantidadeInformada // Atualiza também o planejado
    }

    if (prod.data_plantio_real && quantidadeInformada > 0) {
      updateData.status = 'germinando'
    }

    const { error } = await supabase
      .from('producao')
      .update(updateData)
      .eq('id', prod.id)
      .eq('empresa_id', currentCompany.value.id)

    if (error) throw error

    // Se escolheu criar novo plano
    if (diferencaPlantioData.value.opcao === 'criar_plano' && diferencaPlantioData.value.diferenca > 0) {
      // Buscar último código
      const { data: lastProd } = await supabase
        .from('producao')
        .select('codigo')
        .eq('empresa_id', currentCompany.value.id)
        .order('created_at', { ascending: false })
        .limit(1)

      let nextCode = 1
      if (lastProd?.[0]?.codigo) {
        const match = lastProd[0].codigo.match(/\d+/)
        if (match) nextCode = parseInt(match[0]) + 1
      }

      // Criar novo plano com a diferença
      const { error: insertError } = await supabase.from('producao').insert({
        empresa_id: currentCompany.value.id,
        codigo: String(nextCode).padStart(4, '0'),
        fazenda_id: prod.fazenda_id,
        especie_id: prod.especie_id,
        lote_id: prod.lote_id || null,
        quantidade_bandeja: diferencaPlantioData.value.diferenca,
        data_semeadura: prod.data_plantio_previsto || prod.data_semeadura,
        data_plantio_previsto: prod.data_plantio_previsto || prod.data_semeadura,
        data_luz_prevista: prod.data_luz_prevista,
        data_colheita_prevista: prod.data_colheita_prevista,
        status: 'planejado',
        recorrente: false
      })

      if (insertError) throw insertError
      success(`Plano atualizado e novo plano criado com ${diferencaPlantioData.value.diferenca} unidades!`)
    } else {
      success('Quantidade de plantio atualizada!')
    }

    closeDiferencaPlantioModal()
    loadProducao()
  } catch (e: any) {
    showError('Erro: ' + e.message)
  } finally {
    saving.value = false
  }
}

// Modal Diferença Luz
function openDiferencaLuzModal(prod: Producao, quantidadeLuz: number) {
  const quantidadePlantio = prod.quantidade_plantio || 0
  diferencaLuzData.value = {
    prod,
    quantidadePlantio,
    quantidadeLuz,
    diferenca: quantidadePlantio - quantidadeLuz,
    opcao: 'perda'
  }
  showDiferencaLuzModal.value = true
}

function closeDiferencaLuzModal() {
  showDiferencaLuzModal.value = false
  diferencaLuzData.value.prod = null
}

async function confirmarDiferencaLuz() {
  if (!currentCompany.value?.id || !diferencaLuzData.value.prod) return
  saving.value = true

  try {
    const prod = diferencaLuzData.value.prod
    const quantidadeLuz = diferencaLuzData.value.quantidadeLuz
    const diferenca = diferencaLuzData.value.diferenca

    const updateData: Record<string, any> = {
      quantidade_luz: quantidadeLuz
    }

    // Muda status para 'vegetacao' se data E quantidade estiverem preenchidos
    if (prod.data_luz_real && quantidadeLuz > 0) {
      updateData.status = 'vegetacao'
    }

    // Se marcou como perda, registra a perda_luz
    if (diferencaLuzData.value.opcao === 'perda') {
      updateData.perda_luz = diferenca > 0 ? diferenca : 0
    } else {
      // Manter na fazenda - não registra como perda
      updateData.perda_luz = 0
    }

    const { error } = await supabase
      .from('producao')
      .update(updateData)
      .eq('id', prod.id)
      .eq('empresa_id', currentCompany.value.id)

    if (error) throw error

    success(diferencaLuzData.value.opcao === 'perda' ? 'Perda registrada!' : 'Quantidade de luz atualizada!')
    closeDiferencaLuzModal()
    loadProducao()
  } catch (e: any) {
    showError('Erro: ' + e.message)
  } finally {
    saving.value = false
  }
}

// Slideover de detalhes
function openDetailsSlideover(prod: Producao) {
  selectedProducao.value = prod
  showDetailsSlideover.value = true
}

function closeDetailsSlideover() { showDetailsSlideover.value = false }

// Funções para ações do slideover
function openEditarPlanoFromSlideover() {
  if (selectedProducao.value) {
    closeDetailsSlideover()
    openEditarPlano(selectedProducao.value)
  }
}

function openRegistrarColheitaFromSlideover() {
  if (selectedProducao.value) {
    closeDetailsSlideover()
    openRegistrarColheita(selectedProducao.value)
  }
}

function openVerLotesFromSlideover() {
  if (selectedProducao.value) {
    closeDetailsSlideover()
    openVerLotes(selectedProducao.value)
  }
}

function openAlterarStatusFromSlideover() {
  if (selectedProducao.value) {
    closeDetailsSlideover()
    openAlterarStatus(selectedProducao.value)
  }
}

function openEditarRecorrenciaFromSlideover() {
  if (selectedProducao.value) {
    closeDetailsSlideover()
    openEditarRecorrencia(selectedProducao.value)
  }
}

function apagarRecorrenciaFromSlideover() {
  if (selectedProducao.value) {
    showDetailsSlideover.value = false
    apagarRecorrencia(selectedProducao.value)
  }
}

function cancelarPlanoFromSlideover() {
  if (selectedProducao.value) {
    showDetailsSlideover.value = false
    cancelarPlano(selectedProducao.value)
  }
}

async function salvarPlano() {
  if (!currentCompany.value?.id || !isFormValid.value) return
  saving.value = true
  try {
    const { data: lastProd } = await supabase.from('producao').select('codigo').eq('empresa_id', currentCompany.value.id).order('created_at', { ascending: false }).limit(1)
    let nextCode = 1
    if (lastProd?.[0]?.codigo) {
      const match = lastProd[0].codigo.match(/\d+/)
      if (match) nextCode = parseInt(match[0]) + 1
    }

    // Se recorrente, gera UUID para agrupar todos os planos
    const recorrenciaId = novoPlano.value.recorrente ? crypto.randomUUID() : null

    // Buscar tempos do LOTE selecionado (prioridade), ou da espécie como fallback
    const loteSelecionadoAtual = lotes.value.find(l => l.id === novoPlano.value.lote_id)
    const especieSelecionadaAtual = especies.value.find(e => e.id === novoPlano.value.especie_id)
    const tempoGerminacao = loteSelecionadoAtual?.tempo_germinacao || especieSelecionadaAtual?.tempo_germinacao || 7
    const tempoLuz = loteSelecionadoAtual?.tempo_luz || especieSelecionadaAtual?.tempo_luz || 7

    // Quantidade de planos a criar (1 normal ou 13 semanas/~3 meses se recorrente)
    const totalPlanos = novoPlano.value.recorrente ? 13 : 1
    const planosParaInserir = []

    for (let i = 0; i < totalPlanos; i++) {
      // Calcular data de colheita para este plano (+7 dias por semana)
      const dataColheitaBase = new Date(novoPlano.value.data_colheita + 'T00:00:00')
      dataColheitaBase.setDate(dataColheitaBase.getDate() + (i * 7))
      const dataColheita = dataColheitaBase.toISOString().split('T')[0]

      // Calcular datas de luz e plantio baseadas na colheita
      const dataLuzBase = new Date(dataColheita + 'T00:00:00')
      dataLuzBase.setDate(dataLuzBase.getDate() - tempoLuz)
      const dataLuz = dataLuzBase.toISOString().split('T')[0]

      const dataPlantioBase = new Date(dataLuz + 'T00:00:00')
      dataPlantioBase.setDate(dataPlantioBase.getDate() - tempoGerminacao)
      const dataPlantio = dataPlantioBase.toISOString().split('T')[0]

      planosParaInserir.push({
        empresa_id: currentCompany.value.id,
        codigo: String(nextCode + i).padStart(4, '0'),
        fazenda_id: novoPlano.value.fazenda_id,
        especie_id: novoPlano.value.especie_id,
        lote_id: novoPlano.value.lote_id || null,
        quantidade_bandeja: novoPlano.value.quantidade,
        data_semeadura: dataPlantio,
        data_plantio_previsto: dataPlantio,
        data_luz_prevista: dataLuz,
        data_colheita_prevista: dataColheita,
        status: 'planejado',
        recorrente: novoPlano.value.recorrente,
        recorrencia_id: recorrenciaId
      })
    }

    const { error } = await supabase.from('producao').insert(planosParaInserir)
    if (error) throw error

    const msg = novoPlano.value.recorrente
      ? `Recorrência criada! ${totalPlanos} planos cadastrados (~3 meses).`
      : 'Produção cadastrada com sucesso!'
    success(msg)
    closeCadastroModal()
    loadProducao()
  } catch (e: any) {
    showError('Erro: ' + e.message)
  } finally {
    saving.value = false
  }
}

async function salvarEdicao() {
  if (!currentCompany.value?.id || !editPlano.value.id) return
  saving.value = true
  try {
    const { error } = await supabase.from('producao').update({
      especie_id: editPlano.value.especie_id,
      fazenda_id: editPlano.value.fazenda_id,
      lote_id: editPlano.value.lote_id || null,
      quantidade_bandeja: editPlano.value.quantidade,
      data_colheita_prevista: editPlano.value.data_colheita,
      data_plantio_previsto: editPlano.value.data_plantio_previsto,
      data_luz_prevista: editPlano.value.data_luz_prevista,
      recorrente: editPlano.value.recorrente
    }).eq('id', editPlano.value.id).eq('empresa_id', currentCompany.value.id)
    if (error) throw error
    success('Produção atualizada!')
    closeEditModal()
    loadProducao()
  } catch (e: any) {
    showError('Erro: ' + e.message)
  } finally {
    saving.value = false
  }
}

async function salvarColheita() {
  if (!currentCompany.value?.id || !selectedProducao.value) return
  saving.value = true
  try {
    const quantidadeLuz = selectedProducao.value.quantidade_luz || 0
    const quantidadeColhidaAnterior = selectedProducao.value.quantidade_colhida || 0
    const quantidadeColhidaNova = colheitaForm.value.quantidade || 0

    let perda = colheitaForm.value.perda || 0
    let novoStatus = 'colhendo'

    if (colheitaForm.value.finalizar) {
      // Sim! Finalizar - perda é calculada automaticamente
      perda = Math.max(0, quantidadeLuz - quantidadeColhidaNova)
      novoStatus = 'finalizado'
    }
    // Se não finalizar, usa a perda informada manualmente e status fica 'colhendo'

    const { error } = await supabase.from('producao').update({
      data_colheita_real: colheitaForm.value.data,
      quantidade_colhida: quantidadeColhidaNova,
      perda_colheita: perda,
      status: novoStatus
    }).eq('id', selectedProducao.value.id).eq('empresa_id', currentCompany.value.id)

    if (error) throw error

    // Registrar ajuste no estoque (apenas a diferença entre nova e anterior)
    const diferencaColheita = quantidadeColhidaNova - quantidadeColhidaAnterior
    if (diferencaColheita !== 0 && selectedProducao.value.especie_id) {
      await registrarAjusteEstoque(
        selectedProducao.value.especie_id,
        selectedProducao.value.id,
        diferencaColheita
      )
    }

    success(colheitaForm.value.finalizar ? 'Colheita finalizada!' : 'Colheita registrada!')
    closeColheitaModal()
    loadProducao()
  } catch (e: any) {
    showError('Erro: ' + e.message)
  } finally {
    saving.value = false
  }
}

async function salvarRecorrencia() {
  if (!currentCompany.value?.id || !selectedProducao.value) return
  if (!recorrenciaQuantidade.value || recorrenciaQuantidade.value <= 0) {
    showError('A quantidade deve ser maior que zero')
    return
  }
  saving.value = true
  try {
    // Atualiza todos os planos recorrentes futuros
    const hoje = new Date().toISOString().split('T')[0]
    const { error } = await supabase.from('producao')
      .update({ quantidade_bandeja: recorrenciaQuantidade.value })
      .eq('empresa_id', currentCompany.value.id)
      .eq('recorrencia_id', selectedProducao.value.recorrencia_id)
      .gte('data_plantio_previsto', hoje)
    if (error) throw error
    success('Recorrência atualizada!')
    closeRecorrenciaModal()
    loadProducao()
  } catch (e: any) {
    showError('Erro: ' + e.message)
  } finally {
    saving.value = false
  }
}

function apagarRecorrencia(prod: Producao) {
  openMenuId.value = null
  selectedProducao.value = prod
  showCancelarRecorrenciaModal.value = true
}

function closeCancelarRecorrenciaModal() {
  showCancelarRecorrenciaModal.value = false
}

async function confirmarApagarRecorrencia() {
  if (!currentCompany.value?.id || !selectedProducao.value) return
  if (!selectedProducao.value.recorrencia_id) {
    showError('Este plano não faz parte de uma recorrência')
    closeCancelarRecorrenciaModal()
    return
  }
  saving.value = true

  try {
    const hoje = new Date().toISOString().split('T')[0]
    const { error } = await supabase.from('producao')
      .delete()
      .eq('empresa_id', currentCompany.value.id)
      .eq('recorrencia_id', selectedProducao.value.recorrencia_id)
      .gte('data_plantio_previsto', hoje)
    if (error) throw error
    success('Recorrência apagada!')
    closeCancelarRecorrenciaModal()
    loadProducao()
  } catch (e: any) {
    showError('Erro: ' + e.message)
  } finally {
    saving.value = false
  }
}

function cancelarPlano(prod: Producao) {
  openMenuId.value = null
  selectedProducao.value = prod
  showCancelarPlanoModal.value = true
}

function closeCancelarPlanoModal() {
  showCancelarPlanoModal.value = false
}

async function confirmarCancelarPlano() {
  if (!currentCompany.value?.id || !selectedProducao.value) return
  saving.value = true

  try {
    const { error } = await supabase.from('producao')
      .delete()
      .eq('id', selectedProducao.value.id)
      .eq('empresa_id', currentCompany.value.id)
    if (error) throw error
    success('Plano excluído!')
    closeCancelarPlanoModal()
    loadProducao()
  } catch (e: any) {
    showError('Erro: ' + e.message)
  } finally {
    saving.value = false
  }
}

async function alterarStatus(newStatus: string) {
  if (!currentCompany.value?.id || !selectedProducao.value) return

  try {
    const { error } = await supabase.from('producao')
      .update({ status: newStatus })
      .eq('id', selectedProducao.value.id)
      .eq('empresa_id', currentCompany.value.id)
    if (error) throw error
    success('Status alterado!')
    closeStatusModal()
    loadProducao()
  } catch (e: any) {
    showError('Erro: ' + e.message)
  }
}

// Watchers
watch(() => currentCompany.value?.id, (newId) => {
  if (newId) { loadProducao(); loadFazendas(); loadEspecies(); loadLotes() }
}, { immediate: true })

watch([periodoInicio, periodoFim, filterEtapa, filterFazenda, filterEspecie, exibirFinalizados], () => {
  currentPage.value = 1
  pageInput.value = '1'
  // Salvar filtros no localStorage
  saveFiltersToStorage()
  savePeriodoToStorage()
})

watch(itemsPerPage, () => {
  currentPage.value = 1
  pageInput.value = '1'
})

watch(currentPage, (newVal) => {
  pageInput.value = String(newVal)
})

// Função para ir para página específica
function goToPage() {
  const page = parseInt(pageInput.value)
  if (!isNaN(page) && page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  } else {
    pageInput.value = String(currentPage.value)
  }
}

onMounted(() => {
  if (currentCompany.value?.id) { loadProducao(); loadFazendas(); loadEspecies(); loadLotes() }
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

/* Animação do menu mobile */
@keyframes slide-up {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.animate-slide-up {
  animation: slide-up 0.2s ease-out;
}

/* Compactar tabela de produção */
.producao-table :deep(.table-header) {
  padding: 6px 6px;
  font-size: 0.65rem;
  letter-spacing: 0.02em;
}

.producao-table :deep(.table-cell) {
  padding: 4px 6px;
  font-size: 0.7rem;
}


</style>

<style>
/* Tooltip fixo dos filtros de etapa (via Teleport - precisa ser global) */
.etapa-tooltip-fixed {
  position: fixed;
  width: 280px;
  padding: 12px 14px;
  background: #1f2937;
  color: #d1d5db;
  border-radius: 10px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25);
  z-index: 9999;
  pointer-events: none;
  animation: tooltip-fade-in 0.15s ease-out;
}

.etapa-tooltip-arrow-fixed {
  position: absolute;
  top: -5px;
  left: 50%;
  width: 10px;
  height: 10px;
  background: #1f2937;
  transform: translateX(-50%) rotate(45deg);
}

@keyframes tooltip-fade-in {
  from { opacity: 0; transform: translateX(-50%) translateY(-4px); }
  to { opacity: 1; transform: translateX(-50%); }
}
</style>
