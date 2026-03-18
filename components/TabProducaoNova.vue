<template>
  <div>
    <!-- Toolbar -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-4 mb-4">
      <!-- Lado Esquerdo: Search + Filtros -->
      <div class="flex flex-wrap gap-2 flex-1 min-w-0">
        <!-- Busca -->
        <div class="relative flex-1 sm:flex-none sm:w-48">
          <span class="material-icons-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-gray-400">search</span>
          <input
            v-model="busca"
            type="text"
            placeholder="Buscar..."
            class="input pl-8 text-xs sm:text-sm w-full"
          />
        </div>

        <!-- Multi-select Status -->
        <div class="relative" ref="statusDropdownRef">
          <button
            @click="showStatusDropdown = !showStatusDropdown"
            class="input text-xs sm:text-sm flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <span class="material-icons-outlined text-sm text-gray-400">filter_list</span>
            <span v-if="filtroStatusSet.size === allStatusOptions.length">Todos os status</span>
            <span v-else-if="filtroStatusSet.size === 0">Nenhum status</span>
            <span v-else>{{ filtroStatusSet.size }} status</span>
            <span class="material-icons-outlined text-xs text-gray-400 ml-auto">expand_more</span>
          </button>
          <Transition
            enter-active-class="transition-all duration-150 ease-out"
            leave-active-class="transition-all duration-100 ease-in"
            enter-from-class="opacity-0 scale-95"
            leave-to-class="opacity-0 scale-95"
          >
            <div
              v-if="showStatusDropdown"
              class="absolute top-full left-0 mt-1 z-50 bg-white dark:bg-gray-800 border border-border-light dark:border-border-dark rounded-lg shadow-lg py-1 min-w-[180px]"
            >
              <label
                v-for="opt in allStatusOptions"
                :key="opt.value"
                class="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer text-xs"
              >
                <input
                  type="checkbox"
                  :checked="filtroStatusSet.has(opt.value)"
                  @change="toggleStatus(opt.value)"
                  class="rounded border-gray-300 dark:border-gray-600 text-[#4A7C59] focus:ring-[#4A7C59]"
                />
                <span :class="['w-2 h-2 rounded-full shrink-0', statusDotColor(opt.value)]"></span>
                <span class="text-text-light dark:text-text-dark">{{ opt.label }}</span>
              </label>
              <div class="border-t border-border-light dark:border-border-dark mt-1 pt-1 px-3 flex gap-2">
                <button @click="filtroStatusSet = new Set(allStatusOptions.map(o => o.value))" class="text-[11px] text-[#4A7C59] hover:underline">Todos</button>
                <button @click="filtroStatusSet = new Set()" class="text-[11px] text-gray-400 hover:underline">Nenhum</button>
              </div>
            </div>
          </Transition>
        </div>

        <!-- Multi-select Fazenda -->
        <div class="relative" ref="fazendaDropdownRef">
          <button
            @click="showFazendaDropdown = !showFazendaDropdown"
            class="input text-xs sm:text-sm flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <span class="material-icons-outlined text-sm text-gray-400">location_on</span>
            <span v-if="filtroFazendaIds.size === fazendas.length">Todas fazendas</span>
            <span v-else-if="filtroFazendaIds.size === 0">Nenhuma fazenda</span>
            <span v-else>{{ filtroFazendaIds.size }} fazenda{{ filtroFazendaIds.size > 1 ? 's' : '' }}</span>
            <span class="material-icons-outlined text-xs text-gray-400 ml-auto">expand_more</span>
          </button>
          <Transition
            enter-active-class="transition-all duration-150 ease-out"
            leave-active-class="transition-all duration-100 ease-in"
            enter-from-class="opacity-0 scale-95"
            leave-to-class="opacity-0 scale-95"
          >
            <div
              v-if="showFazendaDropdown"
              class="absolute top-full left-0 mt-1 z-50 bg-white dark:bg-gray-800 border border-border-light dark:border-border-dark rounded-lg shadow-lg py-1 min-w-[180px]"
            >
              <label
                v-for="f in fazendas"
                :key="f.id"
                class="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer text-xs"
              >
                <input
                  type="checkbox"
                  :checked="filtroFazendaIds.has(f.id)"
                  @change="toggleFazenda(f.id)"
                  class="rounded border-gray-300 dark:border-gray-600 text-[#4A7C59] focus:ring-[#4A7C59]"
                />
                <span class="text-text-light dark:text-text-dark">{{ f.nome }}</span>
              </label>
              <div class="border-t border-border-light dark:border-border-dark mt-1 pt-1 px-3 flex gap-2">
                <button @click="filtroFazendaIds = new Set(fazendas.map(f => f.id))" class="text-[11px] text-[#4A7C59] hover:underline">Todas</button>
                <button @click="filtroFazendaIds = new Set()" class="text-[11px] text-gray-400 hover:underline">Nenhuma</button>
              </div>
            </div>
          </Transition>
        </div>

        <!-- Date Range -->
        <div class="date-range-wrapper">
          <VueDatePicker
            v-model="filtroDateRange"
            range
            :preset-dates="[]"
            :dark="isDark"
            :enable-time-picker="false"
            auto-apply
            :format="formatDateDisplay"
            locale="pt-BR"
            placeholder="Período..."
            :clearable="true"
            input-class-name="dp-input-custom"
            menu-class-name="dp-menu-custom"
          />
        </div>
      </div>

      <!-- Lado Direito: Botoes -->
      <div class="shrink-0 flex items-center gap-2">
        <button
          v-if="totalRecorrentes > 0"
          @click="emit('ver-recorrentes')"
          class="btn btn-secondary text-xs sm:text-sm"
        >
          <span class="material-icons-outlined text-sm mr-1">repeat</span>
          {{ totalRecorrentes }} Recorrente{{ totalRecorrentes > 1 ? 's' : '' }}
        </button>
        <button @click="emit('nova-producao')" class="btn btn-primary w-full sm:w-auto">
          <span class="material-icons-outlined text-sm mr-1">add</span>
          Nova Produção
        </button>
      </div>
    </div>

    <!-- Card Principal -->
    <div class="card" style="overflow: hidden; max-width: 100%;">

      <!-- KPI Cards -->
      <div class="p-3 sm:p-4 border-b border-border-light dark:border-border-dark">
        <div class="flex items-center gap-6 sm:gap-10 overflow-x-auto pb-1">
          <div v-for="kpi in kpis" :key="kpi.label" class="flex items-center gap-2 shrink-0">
            <div :class="['w-1 h-12 rounded-full', kpi.barColor]"></div>
            <div>
              <p class="text-xs text-subtext-light dark:text-subtext-dark">{{ kpi.label }}</p>
              <div class="flex items-baseline gap-2">
                <p :class="['text-xl font-bold', kpi.textColor]">{{ kpi.value }}</p>
                <p :class="['text-sm', kpi.textColor]">{{ kpi.percent }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-16">
        <span class="material-icons-outlined text-5xl text-gray-300 dark:text-gray-600 animate-spin">refresh</span>
        <p class="text-sm text-subtext-light dark:text-subtext-dark mt-3">Carregando produção...</p>
      </div>

      <!-- Tabela Desktop -->
      <div v-if="!loading && producoesFiltradas.length > 0" class="hidden lg:block">
        <div class="table-scroll-container custom-scrollbar">
          <table class="w-full text-left border-collapse table-fixed" style="min-width: 950px;">
            <colgroup>
              <!-- Planejado: 7 colunas (50%) -->
              <col style="width: 7%;" />   <!-- Cod -->
              <col style="width: 8%;" />   <!-- Fazenda -->
              <col style="width: 12%;" />  <!-- Produção (tipo+espécie) -->
              <col style="width: 5%;" />   <!-- Qtd -->
              <col style="width: 6%;" />   <!-- Plantio prev -->
              <col style="width: 6%;" />   <!-- Luz prev -->
              <col style="width: 6%;" />   <!-- Colheita prev -->
              <!-- Realizado: 9 colunas (50%) -->
              <col style="width: 6%;" />   <!-- Plantio real -->
              <col style="width: 5%;" />   <!-- Qtd plantada -->
              <col style="width: 5%;" />   <!-- Luz real -->
              <col style="width: 5%;" />   <!-- Qtd germinada -->
              <col style="width: 5%;" />   <!-- Perda germ -->
              <col style="width: 6%;" />   <!-- Colheita -->
              <col style="width: 5%;" />   <!-- Qtd colhida -->
              <col style="width: 5%;" />   <!-- Perda final -->
              <col style="width: 8%;" />   <!-- Status -->
            </colgroup>
            <thead>
              <!-- Header principal com secoes coloridas -->
              <tr>
                <th colspan="7" class="bg-amber-600/80 text-white text-center py-2 text-xs font-medium border-r border-amber-700/50">
                  Planejado
                </th>
                <th colspan="9" class="bg-green-700/80 text-white text-center py-2 text-xs font-medium">
                  Realizado
                </th>
              </tr>
              <!-- Sub-header -->
              <tr class="bg-gray-100 dark:bg-gray-700/50 border-b border-border-light dark:border-border-dark text-xs">
                <!-- Planejado -->
                <th class="px-2 py-2 text-xs font-medium whitespace-nowrap cursor-pointer select-none" @click="toggleSort('codigo')">
                  <div class="flex items-center gap-0.5">Cod <span v-if="sortField === 'codigo'" class="material-icons-outlined text-[10px]">{{ sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward' }}</span></div>
                </th>
                <th class="px-2 py-2 text-xs font-medium whitespace-nowrap cursor-pointer select-none" @click="toggleSort('fazenda')">
                  <div class="flex items-center gap-0.5">Fazenda <span v-if="sortField === 'fazenda'" class="material-icons-outlined text-[10px]">{{ sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward' }}</span></div>
                </th>
                <th class="px-2 py-2 text-xs font-medium whitespace-nowrap cursor-pointer select-none" @click="toggleSort('especie')">
                  <div class="flex items-center gap-0.5">Produção <span v-if="sortField === 'especie'" class="material-icons-outlined text-[10px]">{{ sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward' }}</span></div>
                </th>
                <th class="px-2 py-2 text-xs font-medium text-center whitespace-nowrap cursor-pointer select-none" @click="toggleSort('quantidade_planejada')">
                  <div class="flex items-center justify-center gap-0.5">Qtd <span v-if="sortField === 'quantidade_planejada'" class="material-icons-outlined text-[10px]">{{ sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward' }}</span></div>
                </th>
                <th class="px-2 py-2 text-xs font-medium text-center whitespace-nowrap cursor-pointer select-none" @click="toggleSort('data_plantio_prevista')">
                  <div class="flex items-center justify-center gap-0.5">Plantio <span v-if="sortField === 'data_plantio_prevista'" class="material-icons-outlined text-[10px]">{{ sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward' }}</span></div>
                </th>
                <th class="px-2 py-2 text-xs font-medium text-center whitespace-nowrap cursor-pointer select-none" @click="toggleSort('data_luz_prevista')">
                  <div class="flex items-center justify-center gap-0.5">Luz <span v-if="sortField === 'data_luz_prevista'" class="material-icons-outlined text-[10px]">{{ sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward' }}</span></div>
                </th>
                <th class="px-2 py-2 text-xs font-medium text-center border-r border-border-light dark:border-border-dark whitespace-nowrap cursor-pointer select-none" @click="toggleSort('data_colheita_prevista')">
                  <div class="flex items-center justify-center gap-0.5">Colheita <span v-if="sortField === 'data_colheita_prevista'" class="material-icons-outlined text-[10px]">{{ sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward' }}</span></div>
                </th>
                <!-- Realizado -->
                <th class="px-2 py-2 text-xs font-medium text-center whitespace-nowrap cursor-pointer select-none" @click="toggleSort('data_plantio_real')">
                  <div class="flex items-center justify-center gap-0.5">Plantio <span v-if="sortField === 'data_plantio_real'" class="material-icons-outlined text-[10px]">{{ sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward' }}</span></div>
                </th>
                <th class="px-2 py-2 text-xs font-medium text-center whitespace-nowrap cursor-pointer select-none" @click="toggleSort('quantidade_plantada')">
                  <div class="flex items-center justify-center gap-0.5">Qtd <span v-if="sortField === 'quantidade_plantada'" class="material-icons-outlined text-[10px]">{{ sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward' }}</span></div>
                </th>
                <th class="px-2 py-2 text-xs font-medium text-center whitespace-nowrap cursor-pointer select-none" @click="toggleSort('data_luz_real')">
                  <div class="flex items-center justify-center gap-0.5">Luz <span v-if="sortField === 'data_luz_real'" class="material-icons-outlined text-[10px]">{{ sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward' }}</span></div>
                </th>
                <th class="px-2 py-2 text-xs font-medium text-center whitespace-nowrap cursor-pointer select-none" @click="toggleSort('quantidade_germinada')">
                  <div class="flex items-center justify-center gap-0.5">Qtd <span v-if="sortField === 'quantidade_germinada'" class="material-icons-outlined text-[10px]">{{ sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward' }}</span></div>
                </th>
                <th class="px-2 py-2 text-xs font-medium text-center whitespace-nowrap cursor-pointer select-none" @click="toggleSort('perda_germinacao')">
                  <div class="flex items-center justify-center gap-0.5">Perda <span v-if="sortField === 'perda_germinacao'" class="material-icons-outlined text-[10px]">{{ sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward' }}</span></div>
                </th>
                <th class="px-2 py-2 text-xs font-medium text-center whitespace-nowrap cursor-pointer select-none" @click="toggleSort('ultima_colheita')">
                  <div class="flex items-center justify-center gap-0.5">Colheita <span v-if="sortField === 'ultima_colheita'" class="material-icons-outlined text-[10px]">{{ sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward' }}</span></div>
                </th>
                <th class="px-2 py-2 text-xs font-medium text-center whitespace-nowrap cursor-pointer select-none" @click="toggleSort('total_colhido')">
                  <div class="flex items-center justify-center gap-0.5">Qtd <span v-if="sortField === 'total_colhido'" class="material-icons-outlined text-[10px]">{{ sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward' }}</span></div>
                </th>
                <th class="px-2 py-2 text-xs font-medium text-center whitespace-nowrap cursor-pointer select-none" @click="toggleSort('perda_final')">
                  <div class="flex items-center justify-center gap-0.5">Perda <span v-if="sortField === 'perda_final'" class="material-icons-outlined text-[10px]">{{ sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward' }}</span></div>
                </th>
                <th class="px-2 py-2 text-xs font-medium text-center whitespace-nowrap cursor-pointer select-none" @click="toggleSort('status')">
                  <div class="flex items-center justify-center gap-0.5">Status <span v-if="sortField === 'status'" class="material-icons-outlined text-[10px]">{{ sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward' }}</span></div>
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border-light dark:divide-border-dark">
              <tr
                v-for="(prod, idx) in paginadas"
                :key="prod.id"
                class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                @click="emit('detalhe-producao', prod)"
              >
                <!-- PLANEJADO -->
                <td class="px-2 py-2 text-xs whitespace-nowrap">
                  <div class="flex items-center gap-1.5">
                    <span class="font-medium">{{ prod.codigo || codigoProd(prod, idx) }}</span>
                    <span v-if="prod.recorrente" class="w-4 h-4 min-w-[16px] bg-primary text-white rounded-full flex items-center justify-center text-[9px] font-bold shrink-0" title="Recorrente">R</span>
                  </div>
                </td>
                <td class="px-2 py-2 text-xs truncate" :title="prod.fazendas?.nome || '-'">{{ prod.fazendas?.nome || '-' }}</td>
                <td class="px-2 py-2 text-xs font-medium truncate" :title="labelProducao(prod)">
                  <span
                    v-if="prod.tipo === 'mix'"
                    class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 mr-1"
                  >Mix</span>
                  {{ nomeEspecies(prod) }}
                </td>
                <td class="px-2 py-2 text-center text-xs">{{ prod.quantidade_planejada }}</td>
                <td class="px-2 py-2 text-center text-xs whitespace-nowrap">{{ formatDate(prod.data_plantio_prevista) }}</td>
                <td class="px-2 py-2 text-center text-xs whitespace-nowrap">{{ formatDate(prod.data_luz_prevista) }}</td>
                <td class="px-2 py-2 text-center text-xs border-r border-border-light dark:border-border-dark whitespace-nowrap">{{ formatDate(prod.data_colheita_prevista) }}</td>

                <!-- REALIZADO -->
                <td class="px-2 py-2 text-center text-xs whitespace-nowrap">{{ formatDate(prod.data_plantio_real) }}</td>
                <td class="px-2 py-2 text-center text-xs">{{ somaEspecies(prod, 'quantidade_plantada') || '-' }}</td>
                <td class="px-2 py-2 text-center text-xs whitespace-nowrap">{{ formatDate(prod.data_luz_real) }}</td>
                <td class="px-2 py-2 text-center text-xs">{{ somaEspecies(prod, 'quantidade_germinada') || '-' }}</td>
                <td class="px-2 py-2 text-center text-xs">
                  <span :class="{ 'text-red-500 dark:text-red-400 font-semibold': somaEspecies(prod, 'perda_germinacao') > 0 }">
                    {{ somaEspecies(prod, 'perda_germinacao') || '-' }}
                  </span>
                </td>
                <td class="px-2 py-2 text-center text-xs whitespace-nowrap">{{ ultimaColheitaDate(prod) }}</td>
                <td class="px-2 py-2 text-center text-xs">{{ somaColheitas(prod) || '-' }}</td>
                <td class="px-2 py-2 text-center text-xs">
                  <span v-if="prod.status === 'finalizado'" :class="{ 'text-red-500 dark:text-red-400 font-semibold': somaEspecies(prod, 'perda_final') > 0 }">
                    {{ somaEspecies(prod, 'perda_final') || '-' }}
                  </span>
                  <span v-else>-</span>
                </td>
                <td class="px-2 py-2 text-center p-1">
                  <div class="flex items-center justify-center gap-1 flex-wrap">
                    <span :class="['inline-block px-2 py-1 text-[10px] rounded-full border whitespace-nowrap', statusBadgeClass(prod.status)]">
                      {{ PRODUCAO_STATUS_CONFIG[prod.status]?.label || prod.status }}
                    </span>
                    <span
                      v-if="getAtraso(prod).atrasado"
                      class="inline-block px-1.5 py-0.5 text-[9px] font-semibold rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 whitespace-nowrap"
                    >
                      Atrasado {{ getAtraso(prod).diasAtraso }}d
                    </span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Cards Mobile/Tablet -->
      <div v-if="!loading && producoesFiltradas.length > 0" class="lg:hidden divide-y divide-border-light dark:divide-border-dark">
        <div
          v-for="(prod, idx) in paginadas"
          :key="prod.id"
          class="p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
          @click="emit('detalhe-producao', prod)"
        >
          <!-- Header do Card -->
          <div class="flex items-start justify-between gap-2 mb-3">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-xs font-medium text-subtext-light dark:text-subtext-dark">#{{ codigoProd(prod, idx) }}</span>
              <span
                :class="[
                  'text-[10px] px-1.5 py-0.5 rounded font-semibold',
                  prod.tipo === 'mix'
                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                ]"
              >
                {{ prod.tipo === 'mix' ? 'MIX' : 'S' }}
              </span>
              <span :class="['text-[10px] px-2 py-0.5 rounded-full border whitespace-nowrap', statusBadgeClass(prod.status)]">
                {{ PRODUCAO_STATUS_CONFIG[prod.status]?.label || prod.status }}
              </span>
              <span
                v-if="getAtraso(prod).atrasado"
                class="text-[9px] px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-semibold whitespace-nowrap"
              >
                Atrasado {{ getAtraso(prod).diasAtraso }}d
              </span>
            </div>
            <span class="material-icons-outlined text-xl text-gray-400 shrink-0">chevron_right</span>
          </div>

          <!-- Info Principal -->
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <span class="text-sm font-bold text-primary">
                {{ primeiraEspecieCodigo(prod) }}
              </span>
            </div>
            <div class="min-w-0 flex-1">
              <p class="font-semibold text-sm text-text-light dark:text-text-dark truncate">{{ nomeEspecies(prod) }}</p>
              <p class="text-xs text-subtext-light dark:text-subtext-dark truncate">{{ prod.fazendas?.nome || '-' }}</p>
            </div>
          </div>

          <!-- Grid de Informacoes Compacto -->
          <div class="grid grid-cols-3 gap-2 text-[11px]">
            <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-center">
              <p class="text-subtext-light dark:text-subtext-dark mb-0.5">Qtd</p>
              <p class="font-semibold text-text-light dark:text-text-dark">{{ prod.quantidade_planejada }}</p>
            </div>
            <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-center">
              <p class="text-subtext-light dark:text-subtext-dark mb-0.5">Plantio</p>
              <p class="font-semibold text-text-light dark:text-text-dark">{{ formatDate(prod.data_plantio_prevista) }}</p>
            </div>
            <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-center">
              <p class="text-subtext-light dark:text-subtext-dark mb-0.5">Colheita</p>
              <p class="font-semibold text-text-light dark:text-text-dark">{{ formatDate(prod.data_colheita_prevista) }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="!loading && producoesFiltradas.length === 0" class="text-center py-16 flex flex-col items-center px-4">
        <div class="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
          <span class="material-icons-outlined text-4xl text-gray-400 dark:text-gray-500">grass</span>
        </div>
        <h3 class="text-lg font-semibold text-text-light dark:text-text-dark mb-2">Nenhuma produção encontrada</h3>
        <p class="text-sm text-subtext-light dark:text-subtext-dark mb-6 max-w-sm">
          Ajuste os filtros ou cadastre uma nova produção para começar.
        </p>
        <button @click="emit('nova-producao')" class="btn btn-primary">
          <span class="material-icons-outlined text-sm mr-1">add</span>
          Nova Produção
        </button>
      </div>

      <!-- Paginacao -->
      <div v-if="producoesFiltradas.length > 0" class="p-4 flex flex-col sm:flex-row items-center justify-between border-t border-border-light dark:border-border-dark text-xs text-subtext-light dark:text-subtext-dark gap-4">
        <div class="flex items-center gap-4">
          <select v-model="itensPorPagina" class="border border-border-light dark:border-border-dark rounded px-2 py-1 bg-white dark:bg-gray-800 text-sm cursor-pointer">
            <option :value="10">10 linhas</option>
            <option :value="25">25 linhas</option>
            <option :value="50">50 linhas</option>
          </select>
          <span>{{ producoesFiltradas.length }} registros</span>
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="paginaAtual--"
            :disabled="paginaAtual === 1"
            class="p-1 border border-border-light dark:border-border-dark rounded hover:bg-gray-50 dark:hover:bg-gray-800 bg-white dark:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span class="material-icons-outlined text-sm">chevron_left</span>
          </button>
          <span>Página</span>
          <input
            v-model="paginaInput"
            type="text"
            class="w-12 text-center border border-border-light dark:border-border-dark rounded px-2 py-1 bg-white dark:bg-gray-800 font-medium focus:outline-none focus:ring-1 focus:ring-primary"
            @keyup.enter="irParaPagina"
            @blur="irParaPagina"
          />
          <span>de {{ totalPaginas }}</span>
          <button
            @click="paginaAtual++"
            :disabled="paginaAtual === totalPaginas"
            class="p-1 border border-border-light dark:border-border-dark rounded hover:bg-gray-50 dark:hover:bg-gray-800 bg-white dark:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span class="material-icons-outlined text-sm">chevron_right</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import VueDatePicker from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'
import type { ProducaoCompleta, ProducaoFiltros, ProducaoStatus } from '~/composables/types/producao'
import { PRODUCAO_STATUS_CONFIG } from '~/composables/types/producao'

// ============================================================
// Props & Emits
// ============================================================

const props = defineProps<{
  reloadKey?: number
}>()

const emit = defineEmits<{
  (e: 'nova-producao'): void
  (e: 'detalhe-producao', producao: ProducaoCompleta): void
  (e: 'ver-recorrentes'): void
}>()

// ============================================================
// Composables
// ============================================================

const supabase = useSupabaseClient()
const { currentCompany } = useCurrentCompany()
const toast = useToast()
const producao = useProducao()
const calc = useProducaoCalc()

// ============================================================
// State
// ============================================================

const loading = ref(false)
const producoes = ref<ProducaoCompleta[]>([])
const fazendas = ref<{ id: string; nome: string }[]>([])

// Filtros
const busca = ref('')

// Multi-select status (default: tudo exceto finalizado)
const allStatusOptions: { label: string; value: ProducaoStatus }[] = [
  { label: 'Planejado', value: 'planejado' },
  { label: 'Germinando', value: 'germinando' },
  { label: 'Luz', value: 'luz' },
  { label: 'Colhendo', value: 'colhendo' },
  { label: 'Finalizado', value: 'finalizado' },
  { label: 'Cancelado', value: 'cancelado' },
]
const filtroStatusSet = ref<Set<ProducaoStatus>>(new Set(['planejado', 'germinando', 'luz', 'colhendo']))

// Multi-select fazenda (default: todas — populated after loadData)
const filtroFazendaIds = ref<Set<string>>(new Set())
const fazendaInicializada = ref(false)

// Dropdown visibility
const showStatusDropdown = ref(false)
const showFazendaDropdown = ref(false)
const statusDropdownRef = ref<HTMLElement | null>(null)
const fazendaDropdownRef = ref<HTMLElement | null>(null)

// Filtro de data (range geral — se qualquer data da produção cai no range, mostra)
const now = new Date()
const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
const lastOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
const filtroDateRange = ref<Date[] | null>([firstOfMonth, lastOfMonth])

// Dark mode detection para o datepicker
const isDark = ref(false)
onMounted(() => {
  isDark.value = document.documentElement.classList.contains('dark')
  const observer = new MutationObserver(() => {
    isDark.value = document.documentElement.classList.contains('dark')
  })
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
  onBeforeUnmount(() => observer.disconnect())
})

// Preset dates para seleção rápida
const presetDates = computed(() => {
  const today = new Date()
  const startThisMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const endThisMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
  const startLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
  const endLastMonth = new Date(today.getFullYear(), today.getMonth(), 0)
  const startThisYear = new Date(today.getFullYear(), 0, 1)
  const endThisYear = new Date(today.getFullYear(), 11, 31)
  return [
    { label: 'Este mês', value: [startThisMonth, endThisMonth] },
    { label: 'Mês passado', value: [startLastMonth, endLastMonth] },
    { label: 'Este ano', value: [startThisYear, endThisYear] },
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

// Todos os campos de data que uma produção pode ter (inclui colheitas reais)
const DATE_FIELDS = ['data_plantio_prevista', 'data_luz_prevista', 'data_colheita_prevista', 'data_plantio_real', 'data_luz_real'] as const

// Contagem de recorrentes
const totalRecorrentes = ref(0)

// Ordenacao
const sortField = ref<string>('codigo')
const sortDir = ref<'asc' | 'desc'>('desc')

// Paginacao
const paginaAtual = ref(1)
const itensPorPagina = ref(10)
const paginaInput = ref('1')

// ============================================================
// Dropdown toggle helpers
// ============================================================

function toggleStatus(status: ProducaoStatus) {
  const next = new Set(filtroStatusSet.value)
  if (next.has(status)) {
    next.delete(status)
  } else {
    next.add(status)
  }
  filtroStatusSet.value = next
  paginaAtual.value = 1
}

function toggleFazenda(id: string) {
  const next = new Set(filtroFazendaIds.value)
  if (next.has(id)) {
    next.delete(id)
  } else {
    next.add(id)
  }
  filtroFazendaIds.value = next
  paginaAtual.value = 1
}

function statusDotColor(status: ProducaoStatus): string {
  const map: Record<ProducaoStatus, string> = {
    planejado: 'bg-blue-400',
    germinando: 'bg-amber-400',
    luz: 'bg-emerald-400',
    colhendo: 'bg-orange-400',
    finalizado: 'bg-green-500',
    cancelado: 'bg-red-400',
  }
  return map[status] || 'bg-gray-400'
}

// Close dropdowns on outside click
function handleClickOutside(e: MouseEvent) {
  if (statusDropdownRef.value && !statusDropdownRef.value.contains(e.target as Node)) {
    showStatusDropdown.value = false
  }
  if (fazendaDropdownRef.value && !fazendaDropdownRef.value.contains(e.target as Node)) {
    showFazendaDropdown.value = false
  }
}

// Click outside listener is registered in the main onMounted below

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})

// ============================================================
// Data loading
// ============================================================

async function loadData() {
  if (!currentCompany.value?.id) return

  loading.value = true
  try {
    // Carregar todas producoes (filtro client-side)
    producoes.value = await producao.listarProducoes()

    // Carregar fazendas para o filtro
    const { data: fazData } = await supabase
      .from('fazendas')
      .select('id, nome')
      .eq('empresa_id', currentCompany.value.id)
      .order('nome')
    fazendas.value = fazData || []

    // Inicializar filtro fazenda com todas selecionadas na primeira carga
    if (!fazendaInicializada.value && fazendas.value.length > 0) {
      filtroFazendaIds.value = new Set(fazendas.value.map(f => f.id))
      fazendaInicializada.value = true
    }

    // Contar producoes recorrentes ativas
    const { count: recCount } = await supabase
      .from('producoes_recorrentes')
      .select('id', { count: 'exact', head: true })
      .eq('empresa_id', currentCompany.value.id)
      .in('status', ['ativa', 'pausada'])
    totalRecorrentes.value = recCount || 0
  } catch (err) {
    console.error('Erro ao carregar dados:', err)
    toast.error('Erro ao carregar produções')
  } finally {
    loading.value = false
  }
}

watch(() => currentCompany.value?.id, () => {
  loadData()
})

watch(() => props.reloadKey, () => {
  loadData()
})

onMounted(() => {
  loadData()
  document.addEventListener('click', handleClickOutside)
})

// ============================================================
// Filtros reativos (todos client-side)
// ============================================================

const producoesFiltradas = computed(() => {
  let resultado = [...producoes.value]

  // Filtro multi-select status
  if (filtroStatusSet.value.size > 0 && filtroStatusSet.value.size < allStatusOptions.length) {
    resultado = resultado.filter(p => filtroStatusSet.value.has(p.status))
  } else if (filtroStatusSet.value.size === 0) {
    resultado = []
  }

  // Filtro multi-select fazenda (se todas marcadas = sem filtro)
  if (filtroFazendaIds.value.size > 0 && filtroFazendaIds.value.size < fazendas.value.length) {
    resultado = resultado.filter(p => filtroFazendaIds.value.has(p.fazenda_id))
  } else if (filtroFazendaIds.value.size === 0) {
    resultado = []
  }

  // Busca por texto (codigo, especie, fazenda nome)
  if (busca.value.trim()) {
    const termo = busca.value.trim().toLowerCase()
    resultado = resultado.filter(p => {
      const codFazenda = p.fazendas?.codigo?.toLowerCase() || ''
      const nomeFazenda = p.fazendas?.nome?.toLowerCase() || ''
      const codigo = p.codigo?.toLowerCase() || ''
      const nomes = (p.producao_especies || [])
        .map(pe => (pe.especies?.nome || '').toLowerCase() + ' ' + (pe.especies?.codigo || '').toLowerCase())
        .join(' ')
      const tipo = p.tipo?.toLowerCase() || ''
      return codFazenda.includes(termo) || nomeFazenda.includes(termo) || nomes.includes(termo) || codigo.includes(termo) || tipo.includes(termo) || p.id.toLowerCase().includes(termo)
    })
  }

  // Filtro por data (qualquer data da produção no range, inclui colheitas reais)
  if (filtroDateRange.value && filtroDateRange.value.length === 2) {
    const rangeStart = toDateStr(filtroDateRange.value[0])
    const rangeEnd = toDateStr(filtroDateRange.value[1])
    resultado = resultado.filter(p => {
      // Checar campos de data diretos na produção
      for (const campo of DATE_FIELDS) {
        const valor = (p as any)[campo]
        if (!valor) continue
        const dateStr = valor.split('T')[0]
        if (dateStr >= rangeStart && dateStr <= rangeEnd) return true
      }
      // Checar datas de colheita reais (producao_colheitas)
      for (const colheita of (p.producao_colheitas || [])) {
        if (!colheita.data_colheita) continue
        const dateStr = colheita.data_colheita.split('T')[0]
        if (dateStr >= rangeStart && dateStr <= rangeEnd) return true
      }
      return false
    })
  }

  // Ordenacao
  resultado.sort((a, b) => {
    const field = sortField.value
    if (!field) return 0

    let valA: any = null
    let valB: any = null

    // Direct string/date fields on producao
    if (['data_plantio_prevista', 'data_luz_prevista', 'data_colheita_prevista', 'data_plantio_real', 'data_luz_real', 'status', 'codigo'].includes(field)) {
      valA = (a as any)[field] || ''
      valB = (b as any)[field] || ''
    }
    // Numeric field on producao
    else if (field === 'quantidade_planejada') {
      valA = a.quantidade_planejada || 0
      valB = b.quantidade_planejada || 0
      return sortDir.value === 'asc' ? valA - valB : valB - valA
    }
    // Nested: fazenda name
    else if (field === 'fazenda') {
      valA = a.fazendas?.nome || ''
      valB = b.fazendas?.nome || ''
    }
    // Nested: especie name
    else if (field === 'especie') {
      valA = nomeEspecies(a)
      valB = nomeEspecies(b)
    }
    // Computed from producao_especies: sum fields
    else if (['quantidade_plantada', 'quantidade_germinada', 'perda_germinacao', 'perda_final', 'total_colhido'].includes(field)) {
      valA = somaEspecies(a, field as any) || 0
      valB = somaEspecies(b, field as any) || 0
      return sortDir.value === 'asc' ? valA - valB : valB - valA
    }
    // ultima colheita date
    else if (field === 'ultima_colheita') {
      const colA = a.producao_colheitas || []
      const colB = b.producao_colheitas || []
      valA = colA.length > 0 ? [...colA].sort((x, y) => (y.data_colheita || '').localeCompare(x.data_colheita || ''))[0]?.data_colheita || '' : ''
      valB = colB.length > 0 ? [...colB].sort((x, y) => (y.data_colheita || '').localeCompare(x.data_colheita || ''))[0]?.data_colheita || '' : ''
    }

    if (!valA && !valB) return 0
    if (!valA) return 1
    if (!valB) return -1

    const cmp = String(valA).localeCompare(String(valB))
    return sortDir.value === 'asc' ? cmp : -cmp
  })

  return resultado
})

function toggleSort(field: string) {
  if (sortField.value === field) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortDir.value = 'asc'
  }
}

// ============================================================
// Paginacao
// ============================================================

const totalPaginas = computed(() => {
  return Math.max(1, Math.ceil(producoesFiltradas.value.length / itensPorPagina.value))
})

const paginadas = computed(() => {
  const inicio = (paginaAtual.value - 1) * itensPorPagina.value
  return producoesFiltradas.value.slice(inicio, inicio + itensPorPagina.value)
})

watch(paginaAtual, (val) => {
  paginaInput.value = String(val)
})

watch(itensPorPagina, () => {
  paginaAtual.value = 1
})

function irParaPagina() {
  const num = parseInt(paginaInput.value)
  if (!isNaN(num) && num >= 1 && num <= totalPaginas.value) {
    paginaAtual.value = num
  } else {
    paginaInput.value = String(paginaAtual.value)
  }
}

// ============================================================
// KPIs
// ============================================================

const kpis = computed(() => {
  const all = producoes.value
  const total = all.length
  if (total === 0) {
    return [
      { label: 'Total', value: 0, percent: '100%', barColor: 'bg-gray-400', textColor: 'text-text-light dark:text-text-dark' },
      { label: 'Previstos', value: 0, percent: '0%', barColor: 'bg-blue-400', textColor: 'text-blue-600 dark:text-blue-400' },
      { label: 'Realizado', value: 0, percent: '0%', barColor: 'bg-green-500', textColor: 'text-green-600 dark:text-green-400' },
      { label: 'Atrasados', value: 0, percent: '0%', barColor: 'bg-red-400', textColor: 'text-red-600 dark:text-red-400' },
      { label: 'Perdas', value: 0, percent: '0%', barColor: 'bg-orange-400', textColor: 'text-orange-600 dark:text-orange-400' },
    ]
  }

  const previstos = all.filter(p => p.status === 'planejado').length
  const finalizado = all.filter(p => p.status === 'finalizado').length

  let atrasados = 0
  for (const p of all) {
    const atraso = calc.calcularAtraso(
      p.status,
      { data_plantio_real: p.data_plantio_real, data_luz_real: p.data_luz_real },
      { data_plantio_prevista: p.data_plantio_prevista, data_luz_prevista: p.data_luz_prevista, data_colheita_prevista: p.data_colheita_prevista }
    )
    if (atraso.atrasado) atrasados++
  }

  let totalPerdas = 0
  for (const p of all) {
    for (const pe of (p.producao_especies || [])) {
      totalPerdas += (pe.perda_germinacao || 0) + (pe.perda_final || 0)
    }
  }

  const pct = (n: number) => total > 0 ? Math.round((n / total) * 100) + '%' : '0%'

  return [
    { label: 'Total', value: total, percent: '100%', barColor: 'bg-gray-400', textColor: 'text-text-light dark:text-text-dark' },
    { label: 'Previstos', value: previstos, percent: pct(previstos), barColor: 'bg-blue-400', textColor: 'text-blue-600 dark:text-blue-400' },
    { label: 'Realizado', value: finalizado, percent: pct(finalizado), barColor: 'bg-green-500', textColor: 'text-green-600 dark:text-green-400' },
    { label: 'Atrasados', value: atrasados, percent: pct(atrasados), barColor: 'bg-red-400', textColor: 'text-red-600 dark:text-red-400' },
    { label: 'Perdas', value: totalPerdas, percent: '', barColor: 'bg-orange-400', textColor: 'text-orange-600 dark:text-orange-400' },
  ]
})

// ============================================================
// Helpers de display
// ============================================================

/**
 * Converte Date para string YYYY-MM-DD para comparacao
 */
function toDateStr(d: Date): string {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

/**
 * Codigo da producao - usa indice + 1 paginado como fallback visual
 */
function codigoProd(prod: ProducaoCompleta, idx: number): string {
  // Use primeiro 6 chars do UUID como codigo visual
  return prod.id.substring(0, 6).toUpperCase()
}

/**
 * Junta nomes das especies. Simples: "Alface". Mix: "Alface + Rucula"
 */
function nomeEspecies(prod: ProducaoCompleta): string {
  const especies = prod.producao_especies || []
  if (especies.length === 0) return '-'
  return especies.map(pe => pe.especies?.nome || '?').join(' + ')
}

/**
 * Label completo para tooltip da coluna Producao (tipo + especies)
 */
function labelProducao(prod: ProducaoCompleta): string {
  const prefix = prod.tipo === 'mix' ? 'Mix: ' : ''
  return prefix + nomeEspecies(prod)
}

/**
 * Retorna as primeiras 2 letras do codigo da primeira especie
 */
function primeiraEspecieCodigo(prod: ProducaoCompleta): string {
  const esp = (prod.producao_especies || [])[0]?.especies
  if (!esp) return '-'
  return (esp.codigo || esp.nome || '-').substring(0, 2).toUpperCase()
}

/**
 * Soma um campo numerico em producao_especies
 */
function somaEspecies(prod: ProducaoCompleta, campo: 'quantidade_plantada' | 'quantidade_germinada' | 'perda_germinacao' | 'total_colhido' | 'perda_final'): number {
  return (prod.producao_especies || []).reduce((sum, pe) => {
    const val = pe[campo]
    return sum + (typeof val === 'number' ? val : 0)
  }, 0)
}

/**
 * Soma total colhido das colheitas
 */
function somaColheitas(prod: ProducaoCompleta): number {
  return (prod.producao_colheitas || []).reduce((sum, c) => sum + (c.quantidade || 0), 0)
}

/**
 * Retorna a data da ultima colheita formatada, ou '-'
 */
function ultimaColheitaDate(prod: ProducaoCompleta): string {
  const colheitas = prod.producao_colheitas || []
  if (colheitas.length === 0) return '-'
  const sorted = [...colheitas].sort((a, b) => (b.data_colheita || '').localeCompare(a.data_colheita || ''))
  return formatDate(sorted[0].data_colheita)
}

/**
 * Calcula atraso para uma producao
 */
function getAtraso(prod: ProducaoCompleta) {
  return calc.calcularAtraso(
    prod.status,
    { data_plantio_real: prod.data_plantio_real, data_luz_real: prod.data_luz_real },
    { data_plantio_prevista: prod.data_plantio_prevista, data_luz_prevista: prod.data_luz_prevista, data_colheita_prevista: prod.data_colheita_prevista }
  )
}

/**
 * Formata data ISO (YYYY-MM-DD) para dd/mm/yyyy
 */
function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  const parts = dateStr.split('-')
  if (parts.length !== 3) return dateStr
  return `${parts[2]}/${parts[1]}/${parts[0].slice(2)}`
}

/**
 * Classes do badge de status
 */
function statusBadgeClass(status: ProducaoStatus): string {
  const map: Record<ProducaoStatus, string> = {
    planejado: 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:border-blue-500 dark:text-blue-400',
    germinando: 'border-amber-400 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:border-amber-400 dark:text-amber-400',
    luz: 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400',
    colhendo: 'border-orange-400 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:border-orange-400 dark:text-orange-400',
    finalizado: 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-600 dark:border-green-500 dark:text-green-400',
    cancelado: 'border-red-400 bg-red-50 dark:bg-red-900/20 text-red-600 dark:border-red-400 dark:text-red-400',
  }
  return map[status] || map.planejado
}
</script>

<style>
/* ============================================================
   VueDatePicker — BiomaOS theme (unscoped para afetar popup)
   ============================================================ */

/* ---------- Input ---------- */
.date-range-wrapper {
  min-width: 220px;
  max-width: 260px;
}

.date-range-wrapper .dp__input_wrap .dp__input {
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 0.8rem;
  font-weight: 500;
  padding: 0.45rem 0.6rem 0.45rem 2.2rem;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  background: #fff;
  color: #333;
  min-height: 36px;
  transition: all 0.15s ease;
}

.date-range-wrapper .dp__input_wrap .dp__input:hover {
  border-color: #549E54;
}

.date-range-wrapper .dp__input_wrap .dp__input:focus,
.date-range-wrapper .dp__input_wrap .dp__input.dp__input_focus {
  border-color: #549E54;
  box-shadow: 0 0 0 2px rgba(84, 158, 84, 0.15);
}

.dark .date-range-wrapper .dp__input_wrap .dp__input {
  background: #2a2a2a;
  border-color: #404040;
  color: #e0e0e0;
}

.dark .date-range-wrapper .dp__input_wrap .dp__input:hover {
  border-color: #549E54;
}

.dark .date-range-wrapper .dp__input_wrap .dp__input:focus,
.dark .date-range-wrapper .dp__input_wrap .dp__input.dp__input_focus {
  border-color: #549E54;
  box-shadow: 0 0 0 2px rgba(84, 158, 84, 0.2);
}

/* ---------- Input icon ---------- */
.date-range-wrapper .dp__input_icon {
  color: #549E54;
}

.dark .date-range-wrapper .dp__input_icon {
  color: #86efac;
}

/* ---------- Menu popup ---------- */
.dp-menu-custom {
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 0.8rem;
  border-radius: 0.75rem !important;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.06) !important;
  overflow: hidden;
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

.dp__preset_range {
  padding: 0.4rem 0.75rem;
  border-radius: 0.375rem;
  margin: 0.1rem 0.35rem;
  transition: all 0.15s ease;
}

.dp__preset_range:hover {
  background: #e8f5e9 !important;
  color: #166534 !important;
}

.dark .dp__preset_range:hover {
  background: rgba(84, 158, 84, 0.15) !important;
  color: #86efac !important;
}

/* ---------- Calendar cells polish ---------- */
.dp__cell_inner {
  border-radius: 0.375rem;
}

.dp__today {
  border-color: #549E54 !important;
}

.dp__action_button.dp__action_select {
  background: #549E54;
  color: #fff;
  border-radius: 0.375rem;
}

.dp__action_button.dp__action_select:hover {
  background: #428042;
}

/* ---------- Arrow nav ---------- */
.dp__arrow_top,
.dp__arrow_bottom {
  display: none;
}

/* ---------- Month/year header ---------- */
.dp__month_year_select:hover {
  color: #549E54;
}
</style>

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
