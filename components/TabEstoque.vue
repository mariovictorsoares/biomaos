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
            placeholder="Buscar estoque..."
            class="input w-full sm:w-64 text-sm pl-9"
          />
        </div>
        <!-- Filtro Status -->
        <select v-model="filterStatus" class="input text-sm w-full sm:w-auto shrink-0">
          <option value="">Todos</option>
          <option value="normal">Normal</option>
          <option value="baixo">Estoque Baixo</option>
          <option value="esgotado">Esgotado</option>
        </select>
      </div>
      <!-- Direita: Botão -->
      <button @click="openMovimentacaoModal" class="btn btn-primary shrink-0 justify-center sm:justify-start">
        <span class="material-icons text-sm">swap_horiz</span>
        Movimentação
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
              <th class="table-header">Espécie</th>
              <th class="table-header text-right">Quantidade</th>
              <th class="table-header text-right">Estoque Min.</th>
              <th class="table-header text-center w-28">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-light dark:divide-border-dark">
            <tr
              v-for="item in paginatedEstoque"
              :key="item.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
              @click="openSlideover(item)"
            >
              <td class="table-cell font-medium">{{ item.especies?.codigo || '-' }}</td>
              <td class="table-cell">{{ item.especies?.nome || '-' }}</td>
              <td class="table-cell text-right font-medium">
                <span :class="getQuantidadeClass(item)">{{ item.quantidade || 0 }}</span>
              </td>
              <td class="table-cell text-right">{{ item.estoque_minimo || 0 }}</td>
              <td class="table-cell text-center">
                <span :class="['badge', getEstoqueStatusClass(item)]">
                  {{ getEstoqueStatusLabel(item) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Cards - Mobile -->
      <div class="md:hidden divide-y divide-border-light dark:divide-border-dark">
        <div
          v-for="item in paginatedEstoque"
          :key="item.id"
          class="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
          @click="openSlideover(item)"
        >
          <div class="flex items-start gap-3">
            <div class="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary overflow-hidden shrink-0">
              <span class="material-icons text-xl">inventory_2</span>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <p class="font-medium text-text-light dark:text-text-dark truncate">{{ item.especies?.nome || '-' }}</p>
                  <p class="text-xs text-subtext-light dark:text-subtext-dark truncate">{{ item.especies?.codigo || '-' }}</p>
                </div>
                <span :class="['badge shrink-0', getEstoqueStatusClass(item)]">
                  {{ getEstoqueStatusLabel(item) }}
                </span>
              </div>
              <div class="flex items-center gap-4 mt-2 text-xs text-subtext-light dark:text-subtext-dark">
                <span>Qtd: <strong :class="getQuantidadeClass(item)">{{ item.quantidade || 0 }}</strong></span>
                <span>Min: {{ item.estoque_minimo || 0 }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-12">
        <span class="material-icons text-4xl text-gray-300 dark:text-gray-600 animate-spin">refresh</span>
        <p class="text-sm text-subtext-light dark:text-subtext-dark mt-2">Carregando...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredEstoque.length === 0 && !loading" class="text-center py-12 flex flex-col items-center px-4">
        <span class="material-icons-outlined text-4xl text-gray-300 dark:text-gray-600 mb-2">inventory_2</span>
        <h3 class="text-lg font-medium text-text-light dark:text-text-dark mb-1">Nenhum produto encontrado</h3>
        <p class="text-sm text-subtext-light dark:text-subtext-dark mb-4">
          {{ searchQuery || filterStatus ? 'Tente ajustar os filtros' : 'Cadastre produtos e faça movimentações' }}
        </p>
        <button @click="openMovimentacaoModal" class="btn btn-primary">
          <span class="material-icons text-sm">swap_horiz</span>
          Movimentação
        </button>
      </div>

      <!-- Paginacao -->
      <div v-if="filteredEstoque.length > 0" class="p-3 sm:p-4 border-t border-border-light dark:border-border-dark text-xs text-subtext-light dark:text-subtext-dark">
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
            <span class="text-xs">{{ filteredEstoque.length }} registros</span>
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

    <!-- Modal de Movimentação (z-index maior que slideover) -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-200"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="showMovimentacaoModal" class="fixed inset-0 z-[60] overflow-y-auto">
          <div class="fixed inset-0 glass-backdrop" @click="closeMovimentacaoModal"></div>
          <div class="flex min-h-full items-center justify-center p-4">
            <Transition
              enter-active-class="transition-all duration-200"
              enter-from-class="opacity-0 scale-95"
              enter-to-class="opacity-100 scale-100"
              leave-active-class="transition-all duration-200"
              leave-from-class="opacity-100 scale-100"
              leave-to-class="opacity-0 scale-95"
            >
              <div v-if="showMovimentacaoModal" class="relative glass-panel rounded-lg shadow-xl w-full max-w-lg">
                <!-- Modal Header -->
                <div class="border-b border-border-light dark:border-border-dark px-6 py-4 flex items-center justify-between">
                  <h2 class="text-lg font-semibold text-text-light dark:text-text-dark">Movimentação de Estoque</h2>
                  <button @click="closeMovimentacaoModal" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <span class="material-icons">close</span>
                  </button>
                </div>

                <!-- Modal Body -->
                <div class="p-6 space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Espécie *</label>
                    <select v-model="movimentacao.especie_id" class="input" required>
                      <option value="">Selecione a espécie</option>
                      <option v-for="especie in especies" :key="especie.id" :value="especie.id">
                        {{ especie.codigo }} - {{ especie.nome }}
                      </option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Tipo *</label>
                    <div class="flex gap-4">
                      <label class="flex items-center gap-2 cursor-pointer">
                        <input type="radio" v-model="movimentacao.tipo" value="entrada" class="text-primary" />
                        <span class="text-text-light dark:text-text-dark">Entrada</span>
                      </label>
                      <label class="flex items-center gap-2 cursor-pointer">
                        <input type="radio" v-model="movimentacao.tipo" value="saida" class="text-primary" />
                        <span class="text-text-light dark:text-text-dark">Saída</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Quantidade *</label>
                    <input type="number" v-model.number="movimentacao.quantidade" class="input" min="0" step="1" required />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Motivo</label>
                    <select v-model="movimentacao.motivo" class="input">
                      <option value="">Selecione</option>
                      <option value="compra">Compra</option>
                      <option value="producao">Produção</option>
                      <option value="venda">Venda</option>
                      <option value="ajuste">Ajuste de Inventário</option>
                      <option value="perda">Perda/Descarte</option>
                      <option value="outro">Outro</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Observações</label>
                    <textarea v-model="movimentacao.observacoes" class="input min-h-[60px] resize-y" placeholder="Detalhes da movimentação"></textarea>
                  </div>
                </div>

                <!-- Modal Footer -->
                <div class="border-t border-border-light dark:border-border-dark px-6 py-4 flex items-center justify-end gap-3">
                  <button @click="closeMovimentacaoModal" class="btn btn-secondary" :disabled="saving">Cancelar</button>
                  <button @click="saveMovimentacao" class="btn btn-primary" :disabled="saving || !isMovimentacaoValid">
                    <span v-if="saving" class="material-icons animate-spin text-sm">refresh</span>
                    {{ saving ? 'Salvando...' : 'Confirmar' }}
                  </button>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Modal de Detalhes da Movimentação -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-200"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="showDetalhesModal" class="fixed inset-0 z-[70] overflow-y-auto">
          <div class="fixed inset-0 glass-backdrop" @click="closeDetalhesModal"></div>
          <div class="flex min-h-full items-center justify-center p-4">
            <Transition
              enter-active-class="transition-all duration-200"
              enter-from-class="opacity-0 scale-95"
              enter-to-class="opacity-100 scale-100"
              leave-active-class="transition-all duration-200"
              leave-from-class="opacity-100 scale-100"
              leave-to-class="opacity-0 scale-95"
            >
              <div v-if="showDetalhesModal && selectedMovimentacao" class="relative glass-panel rounded-lg shadow-xl w-full max-w-md">
                <!-- Modal Header -->
                <div class="border-b border-border-light dark:border-border-dark px-6 py-4 flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <span :class="[
                      'w-10 h-10 rounded-full flex items-center justify-center',
                      selectedMovimentacao.cancelado ? 'bg-gray-200 text-gray-400' : selectedMovimentacao.tipo === 'entrada' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                    ]">
                      <span class="material-icons">{{ selectedMovimentacao.cancelado ? 'block' : selectedMovimentacao.tipo === 'entrada' ? 'add' : 'remove' }}</span>
                    </span>
                    <div>
                      <h2 class="text-lg font-semibold text-text-light dark:text-text-dark">
                        {{ selectedMovimentacao.tipo === 'entrada' ? 'Entrada' : 'Saída' }}
                      </h2>
                      <p class="text-xs text-subtext-light dark:text-subtext-dark">Detalhes da movimentação</p>
                    </div>
                  </div>
                  <button @click="closeDetalhesModal" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <span class="material-icons">close</span>
                  </button>
                </div>

                <!-- Modal Body -->
                <div class="p-6 space-y-4">
                  <!-- Status -->
                  <div v-if="selectedMovimentacao.cancelado" class="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                    <p class="text-sm font-medium text-red-600 dark:text-red-400">Movimentação Cancelada</p>
                    <p class="text-xs text-red-500 mt-1">
                      Por {{ selectedMovimentacao.cancelado_por_nome || 'Usuário desconhecido' }} em {{ formatDateTime(selectedMovimentacao.cancelado_em) }}
                    </p>
                    <p v-if="selectedMovimentacao.motivo_cancelamento" class="text-xs text-red-500 mt-1 italic">
                      "{{ selectedMovimentacao.motivo_cancelamento }}"
                    </p>
                  </div>

                  <!-- Informacoes -->
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <p class="text-xs text-subtext-light dark:text-subtext-dark">Quantidade</p>
                      <p :class="['text-xl font-bold', selectedMovimentacao.cancelado ? 'text-gray-400 line-through' : selectedMovimentacao.tipo === 'entrada' ? 'text-green-600' : 'text-red-600']">
                        {{ selectedMovimentacao.tipo === 'entrada' ? '+' : '-' }}{{ selectedMovimentacao.quantidade }}
                      </p>
                    </div>
                    <div>
                      <p class="text-xs text-subtext-light dark:text-subtext-dark">Motivo</p>
                      <p class="text-sm font-medium text-text-light dark:text-text-dark">{{ selectedMovimentacao.motivo || 'Não informado' }}</p>
                    </div>
                  </div>

                  <div>
                    <p class="text-xs text-subtext-light dark:text-subtext-dark">Data/Hora</p>
                    <p class="text-sm text-text-light dark:text-text-dark">{{ formatDateTime(selectedMovimentacao.created_at) }}</p>
                  </div>

                  <div>
                    <p class="text-xs text-subtext-light dark:text-subtext-dark">Criado por</p>
                    <p class="text-sm text-text-light dark:text-text-dark">{{ selectedMovimentacao.usuario_nome || 'Usuário desconhecido' }}</p>
                  </div>

                  <div v-if="selectedMovimentacao.observacoes">
                    <p class="text-xs text-subtext-light dark:text-subtext-dark">Observações</p>
                    <p class="text-sm text-text-light dark:text-text-dark italic">"{{ selectedMovimentacao.observacoes }}"</p>
                  </div>

                  <!-- Formulario de Cancelamento -->
                  <div v-if="!selectedMovimentacao.cancelado" class="pt-4 border-t border-border-light dark:border-border-dark">
                    <div class="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800 mb-4">
                      <p class="text-xs text-yellow-700 dark:text-yellow-400">
                        <span class="material-icons text-sm align-middle mr-1">warning</span>
                        Ao cancelar, o estoque será revertido automaticamente. Esta ação não pode ser desfeita.
                      </p>
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Motivo do cancelamento *</label>
                      <textarea
                        v-model="motivoCancelamento"
                        class="input min-h-[80px] resize-y"
                        placeholder="Descreva o motivo do cancelamento..."
                        required
                      ></textarea>
                    </div>
                  </div>
                </div>

                <!-- Modal Footer -->
                <div class="border-t border-border-light dark:border-border-dark px-6 py-4 flex items-center justify-end gap-3">
                  <button @click="closeDetalhesModal" class="btn btn-secondary">Fechar</button>
                  <button
                    v-if="!selectedMovimentacao.cancelado"
                    @click="confirmarCancelamento"
                    class="btn btn-danger"
                    :disabled="!motivoCancelamento.trim() || saving"
                  >
                    <span v-if="saving" class="material-icons animate-spin text-sm">refresh</span>
                    {{ saving ? 'Cancelando...' : 'Cancelar Movimentação' }}
                  </button>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </Transition>
    </Teleport>

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
        <div v-if="showSlideover" class="fixed inset-0 z-50 overflow-hidden">
          <div class="fixed inset-0 glass-backdrop" @click="closeSlideover"></div>

          <div class="fixed inset-y-0 right-0 flex max-w-full">
            <Transition
              enter-active-class="transform transition-transform duration-300 ease-out"
              enter-from-class="translate-x-full"
              enter-to-class="translate-x-0"
              leave-active-class="transform transition-transform duration-200 ease-in"
              leave-from-class="translate-x-0"
              leave-to-class="translate-x-full"
            >
              <div v-if="showSlideover" class="w-screen max-w-full sm:max-w-xl">
                <div class="h-full flex flex-col glass-panel shadow-2xl">
                  <!-- Slideover Header -->
                  <div class="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100 dark:border-border-dark flex items-center justify-between gap-3">
                    <div class="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                      <div class="w-10 h-10 sm:w-14 sm:h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <span class="material-icons text-primary text-xl sm:text-2xl">inventory_2</span>
                      </div>
                      <div class="min-w-0 flex-1">
                        <h2 class="text-base sm:text-lg font-semibold text-gray-900 dark:text-text-dark truncate">
                          {{ selectedEstoque?.especies?.nome || 'N/A' }}
                        </h2>
                        <p class="text-xs sm:text-sm text-gray-500 dark:text-subtext-dark">
                          {{ selectedEstoque?.especies?.codigo || '-' }}
                        </p>
                      </div>
                    </div>
                    <button @click="closeSlideover" class="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shrink-0">
                      <span class="material-icons text-xl">close</span>
                    </button>
                  </div>

                  <!-- Slideover Content -->
                  <div class="flex-1 overflow-y-auto">
                    <div v-if="selectedEstoque" class="p-4 sm:p-6 space-y-5 sm:space-y-6">
                      <!-- Cards de Status -->
                      <div class="grid grid-cols-2 gap-3 sm:gap-4">
                        <div class="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                          <p class="text-xs text-gray-500 dark:text-subtext-dark mb-1">Quantidade Atual</p>
                          <p :class="['text-2xl font-bold', getQuantidadeClass(selectedEstoque)]">{{ selectedEstoque.quantidade || 0 }}</p>
                          <span :class="['badge mt-2', getEstoqueStatusClass(selectedEstoque)]">
                            {{ getEstoqueStatusLabel(selectedEstoque) }}
                          </span>
                        </div>
                        <div class="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                          <p class="text-xs text-gray-500 dark:text-subtext-dark mb-1">Estoque Mínimo</p>
                          <input
                            type="number"
                            v-model.number="estoqueMinimo"
                            class="text-2xl font-bold bg-transparent border-none p-0 w-full text-gray-900 dark:text-text-dark focus:outline-none focus:ring-0"
                            min="0"
                            step="1"
                            @change="saveEstoqueMinimo"
                          />
                          <p class="text-xs text-gray-400 mt-2">Clique para editar</p>
                        </div>
                      </div>

                      <!-- Historico de Movimentações -->
                      <div>
                        <div class="flex flex-col gap-3 mb-4">
                          <h3 class="text-sm font-semibold text-gray-900 dark:text-text-dark">Movimentações</h3>
                          <!-- Filtro de Range de Data -->
                          <div class="flex flex-wrap items-center gap-2">
                            <div class="flex items-center gap-2">
                              <label class="text-xs text-gray-500">De:</label>
                              <input
                                type="date"
                                v-model="filterDataInicio"
                                class="input text-xs py-1 px-2"
                              />
                            </div>
                            <div class="flex items-center gap-2">
                              <label class="text-xs text-gray-500">Até:</label>
                              <input
                                type="date"
                                v-model="filterDataFim"
                                class="input text-xs py-1 px-2"
                              />
                            </div>
                            <button
                              @click="aplicarFiltroData"
                              class="btn btn-secondary text-xs py-1 px-2"
                            >
                              <span class="material-icons text-sm">filter_alt</span>
                              Filtrar
                            </button>
                            <button
                              v-if="filterDataInicio || filterDataFim"
                              @click="limparFiltroData"
                              class="btn btn-secondary text-xs py-1 px-2"
                            >
                              <span class="material-icons text-sm">clear</span>
                            </button>
                          </div>
                        </div>

                        <!-- Loading Movimentações -->
                        <div v-if="loadingMovimentacoes" class="text-center py-8">
                          <span class="material-icons text-2xl text-gray-300 animate-spin">refresh</span>
                        </div>

                        <div v-else-if="movimentacoes.length > 0" class="space-y-2">
                          <div
                            v-for="mov in paginatedMovimentacoes"
                            :key="mov.id"
                            :class="[
                              'p-3 rounded-xl border transition-colors cursor-pointer hover:border-primary/50',
                              mov.cancelado ? 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-60' : 'bg-gray-50 dark:bg-gray-800/50 border-transparent'
                            ]"
                            @click="openDetalhesModal(mov)"
                          >
                            <div class="flex items-start justify-between gap-2">
                              <div class="flex items-start gap-3">
                                <span :class="[
                                  'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                                  mov.cancelado ? 'bg-gray-200 text-gray-400 dark:bg-gray-700' : mov.tipo === 'entrada' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                                ]">
                                  <span class="material-icons text-sm">{{ mov.cancelado ? 'block' : mov.tipo === 'entrada' ? 'add' : 'remove' }}</span>
                                </span>
                                <div class="min-w-0">
                                  <div class="flex items-center gap-2">
                                    <p class="text-sm font-medium text-gray-900 dark:text-text-dark">
                                      {{ mov.tipo === 'entrada' ? 'Entrada' : 'Saída' }}
                                    </p>
                                    <span v-if="mov.cancelado" class="badge badge-inactive text-xs">Cancelado</span>
                                  </div>
                                  <p class="text-xs text-gray-500 dark:text-subtext-dark">
                                    {{ mov.motivo || 'Sem motivo' }} <span v-if="mov.usuario_nome">• {{ mov.usuario_nome }}</span>
                                  </p>
                                  <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                    {{ formatDateTime(mov.created_at) }}
                                  </p>
                                </div>
                              </div>
                              <div class="flex flex-col items-end gap-1">
                                <span :class="[
                                  'font-semibold',
                                  mov.cancelado ? 'text-gray-400 line-through' : mov.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'
                                ]">
                                  {{ mov.tipo === 'entrada' ? '+' : '-' }}{{ mov.quantidade }}
                                </span>
                                <span class="text-xs text-gray-400">
                                  <span class="material-icons text-xs">visibility</span>
                                </span>
                              </div>
                            </div>
                          </div>

                          <!-- Paginacao Movimentações -->
                          <div v-if="totalPagesMovimentacoes > 1" class="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                            <span class="text-xs text-gray-500">{{ movimentacoes.length }} movimentações</span>
                            <div class="flex items-center gap-2">
                              <button
                                @click="currentPageMovimentacoes--"
                                :disabled="currentPageMovimentacoes === 1"
                                class="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                              >
                                <span class="material-icons text-sm">chevron_left</span>
                              </button>
                              <span class="text-xs text-gray-500">{{ currentPageMovimentacoes }} / {{ totalPagesMovimentacoes }}</span>
                              <button
                                @click="currentPageMovimentacoes++"
                                :disabled="currentPageMovimentacoes === totalPagesMovimentacoes"
                                class="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                              >
                                <span class="material-icons text-sm">chevron_right</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        <div v-else class="text-center py-8 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                          <span class="material-icons-outlined text-3xl text-gray-300 dark:text-gray-600 mb-2">history</span>
                          <p class="text-sm text-gray-500 dark:text-subtext-dark">Nenhuma movimentação</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Footer -->
                  <div class="px-4 sm:px-6 py-4 border-t border-gray-100 dark:border-border-dark">
                    <button @click="openMovimentacaoForProduct()" class="w-full btn btn-primary justify-center">
                      <span class="material-icons text-sm">swap_horiz</span>
                      Nova Movimentação
                    </button>
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

interface Estoque {
  id: string
  empresa_id: string
  produto_id?: string
  especie_id?: string
  quantidade: number
  estoque_minimo: number
  produtos?: { id: string; codigo: string; nome: string }
  especies?: { id: string; codigo: string; nome: string }
}

interface Movimentacao {
  id: string
  tipo: string
  quantidade: number
  motivo?: string
  observacoes?: string
  created_at: string
  usuario_id?: string
  usuario_nome?: string
  cancelado?: boolean
  cancelado_em?: string
  cancelado_por?: string
  cancelado_por_nome?: string
  motivo_cancelamento?: string
  producao_id?: string
}

interface Produto {
  id: string
  codigo: string
  nome: string
}

interface Especie {
  id: string
  codigo: string
  nome: string
}

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const { currentCompany } = useCurrentCompany()
const { success, error: showError } = useToast()

// Estado
const estoque = ref<Estoque[]>([])
const movimentacoes = ref<Movimentacao[]>([])
const produtos = ref<Produto[]>([])
const especies = ref<Especie[]>([])
const loading = ref(false)
const saving = ref(false)
const loadingMovimentacoes = ref(false)

// Modais e Slideover
const showMovimentacaoModal = ref(false)
const showSlideover = ref(false)
const showDetalhesModal = ref(false)
const selectedEstoque = ref<Estoque | null>(null)
const selectedMovimentacao = ref<Movimentacao | null>(null)

// Formularios
const movimentacao = ref({
  especie_id: '',
  tipo: 'entrada',
  quantidade: 0,
  motivo: '',
  observacoes: ''
})

// Estoque minimo editavel
const estoqueMinimo = ref(0)

// Motivo cancelamento
const motivoCancelamento = ref('')

// Filtros e Busca
const searchQuery = ref('')
const filterStatus = ref('')
const filterDataInicio = ref('')
const filterDataFim = ref('')

// Paginacao
const currentPage = ref(1)
const itemsPerPage = ref(10)
const pageInput = ref('1')

// Paginacao Movimentacoes
const currentPageMovimentacoes = ref(1)
const itemsPerPageMovimentacoes = 10

// Validacao
const isMovimentacaoValid = computed(() => {
  return movimentacao.value.especie_id && movimentacao.value.quantidade > 0
})

// Computed - Filtros ativos
const hasActiveFilters = computed(() => {
  return searchQuery.value || filterStatus.value
})

// Computed - Totais
const totalItens = computed(() => {
  return estoque.value.reduce((sum, item) => sum + (item.quantidade || 0), 0)
})

const countEstoqueBaixo = computed(() => {
  return estoque.value.filter(item =>
    item.quantidade <= (item.estoque_minimo || 0)
  ).length
})

// Computed - Filtros
const filteredEstoque = computed(() => {
  let result = estoque.value

  // Busca (por espécie)
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(item =>
      (item.especies?.codigo?.toLowerCase().includes(query)) ||
      (item.especies?.nome?.toLowerCase().includes(query))
    )
  }

  // Filtro por status
  if (filterStatus.value === 'normal') {
    result = result.filter(item => item.quantidade > (item.estoque_minimo || 0))
  } else if (filterStatus.value === 'baixo') {
    result = result.filter(item => item.quantidade > 0 && item.quantidade <= (item.estoque_minimo || 0))
  } else if (filterStatus.value === 'esgotado') {
    result = result.filter(item => item.quantidade <= 0)
  }

  return result
})

const totalPages = computed(() => {
  return Math.ceil(filteredEstoque.value.length / itemsPerPage.value) || 1
})

const paginatedEstoque = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredEstoque.value.slice(start, end)
})

// Paginacao Movimentacoes
const totalPagesMovimentacoes = computed(() => {
  return Math.ceil(movimentacoes.value.length / itemsPerPageMovimentacoes) || 1
})

const paginatedMovimentacoes = computed(() => {
  const start = (currentPageMovimentacoes.value - 1) * itemsPerPageMovimentacoes
  const end = start + itemsPerPageMovimentacoes
  return movimentacoes.value.slice(start, end)
})

// Funcoes auxiliares
function formatDateTime(dateStr?: string) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleString('pt-BR')
}

function getQuantidadeClass(item: Estoque) {
  if (item.quantidade <= 0) return 'text-red-600'
  if (item.quantidade <= (item.estoque_minimo || 0)) return 'text-yellow-600'
  return 'text-text-light dark:text-text-dark'
}

function getEstoqueStatusLabel(item: Estoque) {
  if (item.quantidade <= 0) return 'Esgotado'
  if (item.quantidade <= (item.estoque_minimo || 0)) return 'Baixo'
  return 'Normal'
}

function getEstoqueStatusClass(item: Estoque) {
  if (item.quantidade <= 0) return 'badge-inactive'
  if (item.quantidade <= (item.estoque_minimo || 0)) return 'badge-warning'
  return 'badge-success'
}

function clearFilters() {
  searchQuery.value = ''
  filterStatus.value = ''
}

// CRUD
async function loadEstoque() {
  if (!currentCompany.value?.id) return

  loading.value = true
  try {
    // Buscar estoque existente (tanto por produto quanto por espécie)
    const { data: estoqueData, error: estoqueError } = await supabase
      .from('estoque')
      .select(`
        *,
        produtos:produto_id (id, codigo, nome),
        especies:especie_id (id, codigo, nome)
      `)
      .eq('empresa_id', currentCompany.value.id)

    if (estoqueError) throw estoqueError

    // Buscar todas as espécies ativas
    const { data: especiesData, error: especiesError } = await supabase
      .from('especies')
      .select('id, codigo, nome')
      .eq('empresa_id', currentCompany.value.id)
      .eq('ativo', true)
      .order('codigo')

    if (especiesError) throw especiesError

    // Criar mapa de estoque por espécie
    const estoqueEspecieMap = new Map(
      (estoqueData || []).filter(e => e.especie_id && !e.produto_id).map(e => [e.especie_id, e])
    )

    // Criar lista combinada - todas as espécies com estoque
    const combined: Estoque[] = (especiesData || []).map(especie => {
      const estoqueExistente = estoqueEspecieMap.get(especie.id)
      if (estoqueExistente) {
        return estoqueExistente
      }
      // Criar registro virtual para espécies sem estoque
      return {
        id: `virtual_especie_${especie.id}`,
        empresa_id: currentCompany.value!.id,
        especie_id: especie.id,
        quantidade: 0,
        estoque_minimo: 0,
        especies: especie
      }
    })

    // Ordenar por codigo da espécie
    estoque.value = combined.sort((a, b) => {
      const codigoA = a.especies?.codigo || ''
      const codigoB = b.especies?.codigo || ''
      return codigoA.localeCompare(codigoB)
    })
  } catch (e: any) {
    showError('Erro ao carregar estoque: ' + e.message)
  } finally {
    loading.value = false
  }
}

async function loadEspecies() {
  if (!currentCompany.value?.id) return

  try {
    const { data, error } = await supabase
      .from('especies')
      .select('id, codigo, nome')
      .eq('empresa_id', currentCompany.value.id)
      .eq('ativo', true)
      .order('codigo')

    if (error) throw error
    especies.value = data || []
  } catch (e: any) {
    console.error('Erro ao carregar espécies:', e)
  }
}

async function loadProdutos() {
  if (!currentCompany.value?.id) return

  try {
    const { data, error } = await supabase
      .from('produtos')
      .select('id, codigo, nome')
      .eq('empresa_id', currentCompany.value.id)
      .eq('ativo', true)
      .order('codigo')

    if (error) throw error
    produtos.value = data || []
  } catch (e: any) {
    console.error('Erro ao carregar produtos:', e)
  }
}

async function loadMovimentacoes(especieId?: string, produtoId?: string) {
  if (!currentCompany.value?.id) return

  loadingMovimentacoes.value = true
  currentPageMovimentacoes.value = 1

  try {
    let query = supabase
      .from('movimentacoes_estoque')
      .select('*')
      .eq('empresa_id', currentCompany.value.id)
      .order('created_at', { ascending: false })

    // Filtrar por espécie ou produto
    if (especieId) {
      query = query.eq('especie_id', especieId)
    } else if (produtoId) {
      query = query.eq('produto_id', produtoId)
    }

    // Filtro de data inicio
    if (filterDataInicio.value) {
      // Formato YYYY-MM-DD do input date + horario inicio do dia
      query = query.gte('created_at', `${filterDataInicio.value}T00:00:00`)
    }

    // Filtro de data fim
    if (filterDataFim.value) {
      // Formato YYYY-MM-DD do input date + horario fim do dia
      query = query.lte('created_at', `${filterDataFim.value}T23:59:59`)
    }

    const { data, error } = await query.limit(100)

    if (error) throw error

    // Buscar informacoes dos usuarios
    const movs = data || []
    const userIds = [...new Set([
      ...movs.filter(m => m.usuario_id).map(m => m.usuario_id),
      ...movs.filter(m => m.cancelado_por).map(m => m.cancelado_por)
    ])]

    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from('user_preferences')
        .select('user_id, nome_completo')
        .in('user_id', userIds)

      const userMap = new Map(users?.map(u => [u.user_id, u.nome_completo || 'Usuário']) || [])

      movimentacoes.value = movs.map(m => ({
        ...m,
        usuario_nome: m.usuario_id ? userMap.get(m.usuario_id) : null,
        cancelado_por_nome: m.cancelado_por ? userMap.get(m.cancelado_por) : null
      }))
    } else {
      movimentacoes.value = movs
    }
  } catch (e: any) {
    console.error('Erro ao carregar movimentacoes:', e)
  } finally {
    loadingMovimentacoes.value = false
  }
}

function aplicarFiltroData() {
  if (selectedEstoque.value) {
    loadMovimentacoes(selectedEstoque.value.especie_id, selectedEstoque.value.produto_id)
  }
}

function limparFiltroData() {
  filterDataInicio.value = ''
  filterDataFim.value = ''
  if (selectedEstoque.value) {
    loadMovimentacoes(selectedEstoque.value.especie_id, selectedEstoque.value.produto_id)
  }
}

async function saveMovimentacao() {
  if (!currentCompany.value?.id) return

  saving.value = true
  try {
    const userId = user.value?.id

    // 1. Registrar movimentacao
    const { error: movError } = await supabase
      .from('movimentacoes_estoque')
      .insert({
        empresa_id: currentCompany.value.id,
        especie_id: movimentacao.value.especie_id,
        tipo: movimentacao.value.tipo,
        quantidade: movimentacao.value.quantidade,
        motivo: movimentacao.value.motivo || null,
        observacoes: movimentacao.value.observacoes || null,
        usuario_id: userId
      })

    if (movError) throw movError

    // 2. Atualizar estoque
    const estoqueAtual = estoque.value.find(e => e.especie_id === movimentacao.value.especie_id)
    const quantidadeAtual = estoqueAtual?.quantidade || 0
    const novaQuantidade = movimentacao.value.tipo === 'entrada'
      ? quantidadeAtual + movimentacao.value.quantidade
      : quantidadeAtual - movimentacao.value.quantidade

    // Verifica se e um registro real ou virtual
    const isVirtual = estoqueAtual?.id?.startsWith('virtual_')

    if (estoqueAtual && !isVirtual) {
      const { error: updError } = await supabase
        .from('estoque')
        .update({ quantidade: novaQuantidade })
        .eq('id', estoqueAtual.id)

      if (updError) throw updError
    } else {
      const { error: insError } = await supabase
        .from('estoque')
        .insert({
          empresa_id: currentCompany.value.id,
          especie_id: movimentacao.value.especie_id,
          quantidade: novaQuantidade,
          estoque_minimo: estoqueAtual?.estoque_minimo || 0
        })

      if (insError) throw insError
    }

    success('Movimentação registrada com sucesso')
    closeMovimentacaoModal()
    loadEstoque()

    if (selectedEstoque.value?.especie_id === movimentacao.value.especie_id) {
      loadMovimentacoes(movimentacao.value.especie_id)
      // Atualizar quantidade no slideover
      if (selectedEstoque.value) {
        selectedEstoque.value.quantidade = novaQuantidade
      }
    }
  } catch (e: any) {
    showError('Erro ao salvar movimentação: ' + e.message)
  } finally {
    saving.value = false
  }
}

async function confirmarCancelamento() {
  if (!currentCompany.value?.id || !selectedEstoque.value || !selectedMovimentacao.value) return
  if (!motivoCancelamento.value.trim()) {
    showError('Informe o motivo do cancelamento')
    return
  }

  saving.value = true
  try {
    // 1. Marcar movimentacao como cancelada
    const { error: updError } = await supabase
      .from('movimentacoes_estoque')
      .update({
        cancelado: true,
        cancelado_em: new Date().toISOString(),
        cancelado_por: user.value?.id,
        motivo_cancelamento: motivoCancelamento.value.trim()
      })
      .eq('id', selectedMovimentacao.value.id)

    if (updError) throw updError

    // 2. Reverter quantidade no estoque
    const mov = selectedMovimentacao.value
    const ajuste = mov.tipo === 'entrada' ? -mov.quantidade : mov.quantidade
    const novaQuantidade = (selectedEstoque.value.quantidade || 0) + ajuste

    const isVirtual = selectedEstoque.value.id.startsWith('virtual_')

    if (!isVirtual) {
      const { error: estoqueError } = await supabase
        .from('estoque')
        .update({ quantidade: novaQuantidade })
        .eq('id', selectedEstoque.value.id)

      if (estoqueError) throw estoqueError
    }

    success('Movimentação cancelada com sucesso')
    selectedEstoque.value.quantidade = novaQuantidade
    closeDetalhesModal()
    loadMovimentacoes(selectedEstoque.value.especie_id, selectedEstoque.value.produto_id)
    loadEstoque()
  } catch (e: any) {
    showError('Erro ao cancelar movimentação: ' + e.message)
  } finally {
    saving.value = false
  }
}

async function saveEstoqueMinimo() {
  if (!currentCompany.value?.id || !selectedEstoque.value) return

  try {
    // Verifica se e um registro virtual (espécie sem estoque ainda)
    const isVirtual = selectedEstoque.value.id.startsWith('virtual_')

    if (isVirtual) {
      // Criar registro de estoque
      const { data, error } = await supabase
        .from('estoque')
        .insert({
          empresa_id: currentCompany.value.id,
          especie_id: selectedEstoque.value.especie_id,
          quantidade: 0,
          estoque_minimo: estoqueMinimo.value
        })
        .select()
        .single()

      if (error) throw error

      // Atualizar o registro selecionado com o ID real
      if (data) {
        selectedEstoque.value.id = data.id
      }
    } else {
      // Atualizar registro existente
      const { error } = await supabase
        .from('estoque')
        .update({
          estoque_minimo: estoqueMinimo.value
        })
        .eq('id', selectedEstoque.value.id)
        .eq('empresa_id', currentCompany.value.id)

      if (error) throw error
    }

    success('Estoque mínimo atualizado')
    selectedEstoque.value.estoque_minimo = estoqueMinimo.value
    loadEstoque()
  } catch (e: any) {
    showError('Erro ao atualizar estoque mínimo: ' + e.message)
  }
}

// Modais e Slideover
function openMovimentacaoModal() {
  movimentacao.value = {
    especie_id: '',
    tipo: 'entrada',
    quantidade: 0,
    motivo: '',
    observacoes: ''
  }
  showMovimentacaoModal.value = true
}

function closeMovimentacaoModal() {
  showMovimentacaoModal.value = false
}

function openMovimentacaoForProduct() {
  if (!selectedEstoque.value) return
  movimentacao.value = {
    especie_id: selectedEstoque.value.especie_id || '',
    tipo: 'entrada',
    quantidade: 0,
    motivo: '',
    observacoes: ''
  }
  showMovimentacaoModal.value = true
}

function openDetalhesModal(mov: Movimentacao) {
  selectedMovimentacao.value = mov
  motivoCancelamento.value = ''
  showDetalhesModal.value = true
}

function closeDetalhesModal() {
  showDetalhesModal.value = false
  selectedMovimentacao.value = null
  motivoCancelamento.value = ''
}

function openSlideover(item: Estoque) {
  selectedEstoque.value = item
  estoqueMinimo.value = item.estoque_minimo || 0
  filterDataInicio.value = ''
  filterDataFim.value = ''
  showSlideover.value = true
  loadMovimentacoes(item.especie_id, item.produto_id)
}

function closeSlideover() {
  showSlideover.value = false
  selectedEstoque.value = null
  movimentacoes.value = []
}

// Watch
watch(() => currentCompany.value?.id, (newId) => {
  if (newId) {
    loadEstoque()
    loadEspecies()
  }
}, { immediate: true })

watch(itemsPerPage, () => {
  currentPage.value = 1
  pageInput.value = '1'
})

watch(currentPage, (newVal) => {
  pageInput.value = String(newVal)
})

watch([searchQuery, filterStatus], () => {
  currentPage.value = 1
  pageInput.value = '1'
})

function goToPage() {
  const page = parseInt(pageInput.value)
  if (!isNaN(page) && page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  } else {
    pageInput.value = String(currentPage.value)
  }
}

// Lifecycle
onMounted(() => {
  if (currentCompany.value?.id) {
    loadEstoque()
    loadEspecies()
  }
})
</script>
