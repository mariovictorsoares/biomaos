<template>
  <div>
    <h1 class="text-xl sm:text-2xl font-bold text-text-light dark:text-text-dark mb-4 sm:mb-6">Lotes de Sementes</h1>

    <!-- Card da Tabela -->
    <div class="card">
      <!-- Header do Card -->
      <div class="p-3 sm:p-4 border-b border-border-light dark:border-border-dark">
        <div class="flex flex-col gap-3">
          <div class="flex items-center justify-between">
            <h2 class="text-xs sm:text-sm font-medium text-subtext-light dark:text-subtext-dark uppercase tracking-wider">Lista de Lotes</h2>
            <!-- Botao Novo Lote - Desktop -->
            <button @click="openCreateModal" class="hidden sm:flex btn btn-primary shrink-0">
              <span class="material-icons text-sm">add</span>
              Novo lote
            </button>
          </div>
          <div class="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <!-- Filtro por Especie -->
            <select v-model="filterEspecie" class="input text-sm w-full sm:w-48 shrink-0">
              <option value="">Todas especies</option>
              <option v-for="especie in especies" :key="especie.id" :value="especie.id">
                {{ especie.codigo }} - {{ especie.nome }}
              </option>
            </select>
            <!-- Filtro por Status -->
            <select v-model="filterStatus" class="input text-sm w-full sm:w-28 shrink-0">
              <option value="">Todos</option>
              <option value="ativo">Ativos</option>
              <option value="inativo">Inativos</option>
            </select>
            <!-- Filtro Validade De -->
            <div class="flex items-center gap-1 shrink-0">
              <span class="text-xs text-subtext-light dark:text-subtext-dark hidden sm:inline">Val. de</span>
              <input type="date" v-model="validadeInicio" class="input text-sm w-full sm:w-36" placeholder="De" />
            </div>
            <!-- Filtro Validade Ate -->
            <div class="flex items-center gap-1 shrink-0">
              <span class="text-xs text-subtext-light dark:text-subtext-dark hidden sm:inline">ate</span>
              <input type="date" v-model="validadeFim" class="input text-sm w-full sm:w-36" placeholder="Ate" />
            </div>
            <!-- Limpar Filtros -->
            <button
              v-if="hasActiveFilters"
              @click="clearFilters"
              class="hidden sm:flex btn btn-secondary text-sm shrink-0"
              title="Limpar filtros"
            >
              <span class="material-icons text-sm">clear</span>
            </button>
            <!-- Busca -->
            <div class="relative flex-1">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 material-icons-outlined text-gray-400 text-base sm:text-lg">search</span>
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Pesquise aqui..."
                class="input w-full text-sm pl-9 sm:pl-10"
              />
            </div>
            <!-- Botao Novo Lote - Mobile -->
            <button @click="openCreateModal" class="sm:hidden btn btn-primary w-full justify-center">
              <span class="material-icons text-sm">add</span>
              Novo lote
            </button>
          </div>
        </div>
      </div>

      <!-- Tabela - Desktop -->
      <div class="hidden md:block overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-50 dark:bg-gray-800 border-b border-border-light dark:border-border-dark">
              <th class="table-header">
                <button class="flex items-center gap-1 hover:text-text-light dark:hover:text-text-dark" @click="toggleSort('numero')">
                  Numero do lote
                  <span class="material-icons text-xs">{{ getSortIcon('numero') }}</span>
                </button>
              </th>
              <th class="table-header">Especie</th>
              <th class="table-header text-right">Estoque Atual (g)</th>
              <th class="table-header text-center">
                <button class="flex items-center gap-1 hover:text-text-light dark:hover:text-text-dark mx-auto" @click="toggleSort('validade')">
                  Validade
                  <span class="material-icons text-xs">{{ getSortIcon('validade') }}</span>
                </button>
              </th>
              <th class="table-header text-center">Safra</th>
              <th class="table-header text-center w-28">Status</th>
              <th class="table-header text-center w-24">Acoes</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-light dark:divide-border-dark">
            <tr
              v-for="lote in paginatedLotes"
              :key="lote.id"
              @click="openSlideover(lote)"
              class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
            >
              <td class="table-cell">
                <p class="font-medium text-text-light dark:text-text-dark">{{ lote.numero }}</p>
              </td>
              <td class="table-cell">
                <span v-if="lote.especies" class="text-text-light dark:text-text-dark">{{ lote.especies.codigo }} - {{ lote.especies.nome }}</span>
                <span v-else class="text-gray-400">-</span>
              </td>
              <td class="table-cell text-right text-subtext-light dark:text-subtext-dark">{{ formatNumber(lote.estoque_atual) }}</td>
              <td class="table-cell text-center">
                <span :class="getValidadeClass(lote.validade)">{{ formatDate(lote.validade) }}</span>
              </td>
              <td class="table-cell text-center text-subtext-light dark:text-subtext-dark">{{ lote.safra || '-' }}</td>
              <td class="table-cell text-center">
                <span :class="['badge', lote.status === 'ativo' ? 'badge-success' : 'badge-inactive']">
                  {{ lote.status === 'ativo' ? 'Ativo' : 'Inativo' }}
                </span>
              </td>
              <td class="table-cell text-center" @click.stop>
                <button
                  @click="openSlideover(lote)"
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
          v-for="lote in paginatedLotes"
          :key="lote.id"
          class="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
          @click="openSlideover(lote)"
        >
          <div class="flex items-start gap-3">
            <div class="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
              <span class="material-icons">grain</span>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <p class="font-medium text-text-light dark:text-text-dark truncate">{{ lote.numero }}</p>
                  <p v-if="lote.especies" class="text-xs text-subtext-light dark:text-subtext-dark truncate">{{ lote.especies.codigo }} - {{ lote.especies.nome }}</p>
                </div>
                <span :class="['badge shrink-0', lote.status === 'ativo' ? 'badge-success' : 'badge-inactive']">
                  {{ lote.status === 'ativo' ? 'Ativo' : 'Inativo' }}
                </span>
              </div>
              <div class="flex items-center gap-2 mt-2">
                <span class="text-xs text-subtext-light dark:text-subtext-dark">
                  Estoque: {{ formatNumber(lote.estoque_atual) }}g
                </span>
                <span class="text-xs" :class="getValidadeClass(lote.validade)">
                  Val: {{ formatDate(lote.validade) }}
                </span>
              </div>
            </div>
            <button
              @click.stop="openSlideover(lote)"
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
      <div v-else-if="filteredLotes.length === 0 && !loading" class="text-center py-12 flex flex-col items-center px-4">
        <span class="material-icons-outlined text-4xl text-gray-300 dark:text-gray-600 mb-2">grain</span>
        <h3 class="text-lg font-medium text-text-light dark:text-text-dark mb-1">Nenhum lote encontrado</h3>
        <p class="text-sm text-subtext-light dark:text-subtext-dark mb-4">
          {{ searchQuery || hasActiveFilters ? 'Tente ajustar os filtros' : 'Comece criando seu primeiro lote de sementes' }}
        </p>
        <button v-if="!searchQuery && !hasActiveFilters" @click="openCreateModal" class="btn btn-primary">
          <span class="material-icons text-sm">add</span>
          Novo lote
        </button>
      </div>

      <!-- Paginacao -->
      <div v-if="filteredLotes.length > 0" class="p-3 sm:p-4 border-t border-border-light dark:border-border-dark text-xs text-subtext-light dark:text-subtext-dark">
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
            <span class="text-xs">{{ filteredLotes.length }} registros</span>
          </div>
          <div class="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto justify-center sm:justify-end">
            <button
              @click="currentPage--"
              :disabled="currentPage === 1"
              class="p-1 border border-border-light dark:border-border-dark rounded hover:bg-gray-50 dark:hover:bg-gray-800 bg-white dark:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span class="material-icons text-sm">chevron_left</span>
            </button>
            <span class="hidden xs:inline">Pagina</span>
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

    <!-- Modal de Criacao -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-200"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="showCreateModal" class="fixed inset-0 z-50 overflow-y-auto">
          <div class="fixed inset-0 glass-backdrop" @click="closeCreateModal"></div>
          <div class="flex min-h-full items-center justify-center p-4">
            <Transition
              enter-active-class="transition-all duration-200"
              enter-from-class="opacity-0 scale-95"
              enter-to-class="opacity-100 scale-100"
              leave-active-class="transition-all duration-200"
              leave-from-class="opacity-100 scale-100"
              leave-to-class="opacity-0 scale-95"
            >
              <div v-if="showCreateModal" class="relative glass-panel rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <!-- Modal Header -->
            <div class="sticky top-0 glass-panel border-b border-border-light dark:border-border-dark px-6 py-4 flex items-center justify-between z-10">
              <h2 class="text-lg font-semibold text-text-light dark:text-text-dark">Cadastro de lote</h2>
              <button @click="closeCreateModal" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <span class="material-icons">close</span>
              </button>
            </div>

            <!-- Modal Body -->
            <div class="p-6">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Especie *</label>
                  <select v-model="newLote.especie_id" class="input" required>
                    <option value="">Selecione a especie</option>
                    <option v-for="especie in especies" :key="especie.id" :value="especie.id">
                      {{ especie.codigo }} - {{ especie.nome }}
                    </option>
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Numero do lote *</label>
                  <input type="text" v-model="newLote.numero" class="input" required />
                </div>

                <div>
                  <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Data de validade *</label>
                  <input type="date" v-model="newLote.validade" class="input" required />
                </div>

                <div>
                  <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Estoque inicial (g)</label>
                  <input type="number" v-model.number="newLote.estoque_inicial" class="input" step="0.01" />
                </div>

                <div>
                  <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Tempo de germinacao (dias)</label>
                  <input type="number" v-model.number="newLote.tempo_germinacao" class="input" />
                </div>

                <div>
                  <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Tempo de luz (dias)</label>
                  <input type="number" v-model.number="newLote.tempo_luz" class="input" />
                </div>

                <div>
                  <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Tempo total (dias)</label>
                  <input type="number" :value="tempoTotalCreate" class="input bg-gray-100 dark:bg-gray-700" disabled />
                </div>

                <div>
                  <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Densidade Semeadura (g)</label>
                  <input type="number" v-model.number="newLote.densidade_semeadura" class="input" step="0.01" />
                </div>

                <div>
                  <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Safra (ano/ano)</label>
                  <input type="text" v-model="newLote.safra" class="input" placeholder="2025/2026" />
                </div>

                <div>
                  <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Eficiencia (%)</label>
                  <input type="number" v-model.number="newLote.eficiencia" class="input" step="0.01" min="0" max="100" />
                </div>

                <div>
                  <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Taxa de Germinacao (%)</label>
                  <input type="number" v-model.number="newLote.taxa_germinacao" class="input" step="0.01" min="0" max="100" />
                </div>

                <div>
                  <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Taxa de Pureza (%)</label>
                  <input type="number" v-model.number="newLote.taxa_pureza" class="input" step="0.01" min="0" max="100" />
                </div>

                <div>
                  <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Pais de Origem</label>
                  <input type="text" v-model="newLote.pais_origem" class="input" />
                </div>

                <div>
                  <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Fornecedor</label>
                  <input type="text" v-model="newLote.fornecedor" class="input" />
                </div>

                <div>
                  <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Valor da semente (R$/kg)</label>
                  <input type="number" v-model.number="newLote.valor_semente" class="input" step="0.01" />
                </div>

                <div class="md:col-span-3">
                  <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Observacoes</label>
                  <textarea v-model="newLote.observacoes" class="input min-h-[80px] resize-y" placeholder="Observacoes sobre o lote"></textarea>
                </div>
              </div>
            </div>

            <!-- Modal Footer -->
            <div class="sticky bottom-0 glass-panel border-t border-border-light dark:border-border-dark px-6 py-4 flex items-center justify-end gap-3">
              <button @click="closeCreateModal" class="btn btn-secondary" :disabled="saving">Cancelar</button>
              <button @click="saveLote" class="btn btn-primary" :disabled="saving || !isCreateFormValid">
                <span v-if="saving" class="material-icons animate-spin text-sm">refresh</span>
                {{ saving ? 'Salvando...' : 'Salvar lote' }}
              </button>
            </div>
            </div>
            </Transition>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Modal de Edicao -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-200"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="showEditModal" class="fixed inset-0 z-[60] overflow-y-auto">
          <div class="fixed inset-0 glass-backdrop" @click="closeEditModal"></div>
          <div class="flex min-h-full items-center justify-center p-4">
            <Transition
              enter-active-class="transition-all duration-200"
              enter-from-class="opacity-0 scale-95"
              enter-to-class="opacity-100 scale-100"
              leave-active-class="transition-all duration-200"
              leave-from-class="opacity-100 scale-100"
              leave-to-class="opacity-0 scale-95"
            >
              <div v-if="showEditModal" class="relative glass-panel rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <!-- Modal Header -->
            <div class="sticky top-0 glass-panel border-b border-border-light dark:border-border-dark px-6 py-4 flex items-center justify-between z-10">
              <h2 class="text-lg font-semibold text-text-light dark:text-text-dark">Lotes de sementes</h2>
              <button @click="closeEditModal" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <span class="material-icons">close</span>
              </button>
            </div>

            <!-- Modal Body -->
            <div class="p-6 space-y-4">
              <!-- Linha 1: Especie | Numero do lote + Ativo -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Especie</label>
                  <input type="text" :value="getEspecieNome(editLote.especie_id)" class="input bg-gray-100 dark:bg-gray-700" disabled />
                </div>
                <div>
                  <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Numero do lote</label>
                  <div class="flex items-center gap-3">
                    <input type="text" v-model="editLote.numero" class="input flex-1 bg-gray-100 dark:bg-gray-700" disabled />
                    <label class="flex items-center gap-2 text-sm text-text-light dark:text-text-dark whitespace-nowrap">
                      <input type="checkbox" v-model="editLoteAtivo" class="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary" />
                      Ativo
                    </label>
                  </div>
                </div>
              </div>

              <!-- Linha 2: Quantidade em Estoque | Data de validade -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Quantidade em Estoque</label>
                  <input type="number" v-model.number="editLote.estoque_atual" class="input bg-gray-100 dark:bg-gray-700" step="0.01" disabled />
                </div>
                <div>
                  <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Data de validade</label>
                  <input type="date" v-model="editLote.validade" class="input" />
                </div>
              </div>

              <!-- Linha 3: Tempo germinacao | Tempo luz | Tempo total -->
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Tempo de germinacao (dias)</label>
                  <input type="number" v-model.number="editLote.tempo_germinacao" class="input" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Tempo de luz (dias)</label>
                  <input type="number" v-model.number="editLote.tempo_luz" class="input" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Tempo total (dias)</label>
                  <input type="number" :value="tempoTotalEdit" class="input bg-gray-100 dark:bg-gray-700" disabled />
                </div>
              </div>

              <!-- Linha 4: Densidade Semeadura | Safra -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Densidade Semeadura (g)</label>
                  <input type="number" v-model.number="editLote.densidade_semeadura" class="input" step="0.01" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Safra (ano/ano)</label>
                  <input type="text" v-model="editLote.safra" class="input" placeholder="24/24" />
                </div>
              </div>

              <!-- Linha 5: Eficiencia | Taxa de Germinacao -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Eficiencia (%)</label>
                  <input type="text" v-model="editLote.eficiencia" class="input" placeholder="90%" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Taxa de Germinacao (%)</label>
                  <input type="text" v-model="editLote.taxa_germinacao" class="input" placeholder="90%" />
                </div>
              </div>

              <!-- Linha 6: Taxa de Pureza | Pais de Origem -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Taxa de Pureza (%)</label>
                  <input type="text" v-model="editLote.taxa_pureza" class="input" placeholder="99%" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Pais de Origem</label>
                  <input type="text" v-model="editLote.pais_origem" class="input" placeholder="BR" />
                </div>
              </div>

              <!-- Linha 7: Fornecedor | Valor da semente -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Fornecedor</label>
                  <input type="text" v-model="editLote.fornecedor" class="input" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Valor da semente (R$/kg)</label>
                  <input type="text" v-model="editLote.valor_semente" class="input" />
                </div>
              </div>

              <!-- Linha 8: Observacoes -->
              <div>
                <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Observacoes</label>
                <textarea v-model="editLote.observacoes" class="input min-h-[80px] resize-y" placeholder="Observacoes"></textarea>
              </div>
            </div>

            <!-- Modal Footer -->
            <div class="sticky bottom-0 glass-panel border-t border-border-light dark:border-border-dark px-6 py-4 flex items-center justify-end gap-3">
              <button @click="closeEditModal" class="btn btn-secondary" :disabled="saving">Cancelar</button>
              <button @click="updateLote" class="btn btn-primary" :disabled="saving || !isEditFormValid">
                <span v-if="saving" class="material-icons animate-spin text-sm">refresh</span>
                {{ saving ? 'Salvando...' : 'Salvar alteracoes' }}
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
                  <!-- Header -->
                  <div class="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100 dark:border-border-dark flex items-center justify-between gap-3">
                    <div class="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                      <div class="w-10 h-10 sm:w-14 sm:h-14 rounded-xl bg-primary/10 flex items-center justify-center text-sm sm:text-lg font-bold text-primary shrink-0">
                        <span class="material-icons">grain</span>
                      </div>
                      <div class="min-w-0 flex-1">
                        <h2 class="text-base sm:text-lg font-semibold text-gray-900 dark:text-text-dark truncate">{{ selectedLote?.numero }}</h2>
                        <p v-if="selectedLote?.especies" class="text-xs sm:text-sm text-gray-500 dark:text-subtext-dark truncate">{{ selectedLote.especies.codigo }} - {{ selectedLote.especies.nome }}</p>
                      </div>
                    </div>
                    <button @click="closeSlideover" class="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shrink-0">
                      <span class="material-icons text-xl">close</span>
                    </button>
                  </div>

                  <!-- Body -->
                  <div class="flex-1 overflow-y-auto" v-if="selectedLote">
                    <div class="p-4 sm:p-6 space-y-5 sm:space-y-6">
                      <!-- Status e Acoes Rapidas -->
                      <div class="flex flex-wrap items-center justify-between gap-2">
                        <div class="flex items-center gap-2">
                          <span :class="['inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium', selectedLote.status === 'ativo' ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400']">
                            <span :class="['w-1.5 h-1.5 rounded-full mr-1.5', selectedLote.status === 'ativo' ? 'bg-green-500' : 'bg-gray-400']"></span>
                            {{ selectedLote.status === 'ativo' ? 'Ativo' : 'Inativo' }}
                          </span>
                          <span :class="['inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium', getValidadeClass(selectedLote.validade).includes('red') ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400' : getValidadeClass(selectedLote.validade).includes('yellow') ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400']">
                            Val: {{ formatDate(selectedLote.validade) }}
                          </span>
                        </div>
                        <button
                          @click="toggleStatus"
                          class="text-sm text-primary hover:underline"
                          :disabled="saving"
                        >
                          {{ selectedLote.status === 'ativo' ? 'Desativar lote' : 'Ativar lote' }}
                        </button>
                      </div>

                      <!-- Informacoes Basicas -->
                      <div class="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 sm:p-5">
                        <h3 class="text-xs font-semibold text-gray-500 dark:text-subtext-dark uppercase tracking-wider mb-3 sm:mb-4">Informacoes Basicas</h3>
                        <div class="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4">
                          <div>
                            <p class="text-xs text-gray-500 dark:text-subtext-dark mb-1">Numero do Lote</p>
                            <p class="text-sm font-medium text-gray-900 dark:text-text-dark">{{ selectedLote.numero }}</p>
                          </div>
                          <div>
                            <p class="text-xs text-gray-500 dark:text-subtext-dark mb-1">Safra</p>
                            <p class="text-sm font-medium text-gray-900 dark:text-text-dark">{{ selectedLote.safra || '-' }}</p>
                          </div>
                          <div>
                            <p class="text-xs text-gray-500 dark:text-subtext-dark mb-1">Validade</p>
                            <p :class="['text-sm font-medium', getValidadeClass(selectedLote.validade)]">{{ formatDate(selectedLote.validade) }}</p>
                          </div>
                          <div>
                            <p class="text-xs text-gray-500 dark:text-subtext-dark mb-1">Fornecedor</p>
                            <p class="text-sm font-medium text-gray-900 dark:text-text-dark">{{ selectedLote.fornecedor || '-' }}</p>
                          </div>
                        </div>
                      </div>

                      <!-- Estoque -->
                      <div class="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 sm:p-5">
                        <h3 class="text-xs font-semibold text-gray-500 dark:text-subtext-dark uppercase tracking-wider mb-3 sm:mb-4">Estoque</h3>
                        <div class="grid grid-cols-1 xs:grid-cols-3 gap-3 sm:gap-4">
                          <div>
                            <p class="text-xs text-gray-500 dark:text-subtext-dark mb-1">Estoque Inicial</p>
                            <p class="text-sm font-medium text-gray-900 dark:text-text-dark">{{ formatNumber(selectedLote.estoque_inicial) }} g</p>
                          </div>
                          <div>
                            <p class="text-xs text-gray-500 dark:text-subtext-dark mb-1">Estoque Atual</p>
                            <p class="text-sm font-medium text-gray-900 dark:text-text-dark">{{ formatNumber(selectedLote.estoque_atual) }} g</p>
                          </div>
                          <div>
                            <p class="text-xs text-gray-500 dark:text-subtext-dark mb-1">Consumido</p>
                            <p class="text-sm font-medium text-gray-900 dark:text-text-dark">{{ formatNumber((selectedLote.estoque_inicial || 0) - (selectedLote.estoque_atual || 0)) }} g</p>
                          </div>
                        </div>
                      </div>

                      <!-- Tempos de Cultivo -->
                      <div class="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 sm:p-5">
                        <h3 class="text-xs font-semibold text-gray-500 dark:text-subtext-dark uppercase tracking-wider mb-3 sm:mb-4">Tempos de Cultivo</h3>
                        <div class="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4">
                          <div>
                            <p class="text-xs text-gray-500 dark:text-subtext-dark mb-1">Germinacao</p>
                            <p class="text-sm font-medium text-gray-900 dark:text-text-dark">{{ selectedLote.tempo_germinacao || '-' }} dias</p>
                          </div>
                          <div>
                            <p class="text-xs text-gray-500 dark:text-subtext-dark mb-1">Luz</p>
                            <p class="text-sm font-medium text-gray-900 dark:text-text-dark">{{ selectedLote.tempo_luz || '-' }} dias</p>
                          </div>
                          <div>
                            <p class="text-xs text-gray-500 dark:text-subtext-dark mb-1">Tempo Total</p>
                            <p class="text-sm font-medium text-gray-900 dark:text-text-dark">{{ (selectedLote.tempo_germinacao || 0) + (selectedLote.tempo_luz || 0) }} dias</p>
                          </div>
                          <div>
                            <p class="text-xs text-gray-500 dark:text-subtext-dark mb-1">Densidade Semeadura</p>
                            <p class="text-sm font-medium text-gray-900 dark:text-text-dark">{{ selectedLote.densidade_semeadura || '-' }} g</p>
                          </div>
                        </div>
                      </div>

                      <!-- Taxas e Eficiencia -->
                      <div class="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 sm:p-5">
                        <h3 class="text-xs font-semibold text-gray-500 dark:text-subtext-dark uppercase tracking-wider mb-3 sm:mb-4">Taxas e Eficiencia</h3>
                        <div class="grid grid-cols-1 xs:grid-cols-3 gap-3 sm:gap-4">
                          <div>
                            <p class="text-xs text-gray-500 dark:text-subtext-dark mb-1">Eficiencia</p>
                            <p class="text-sm font-medium text-gray-900 dark:text-text-dark">{{ selectedLote.eficiencia ? `${selectedLote.eficiencia}%` : '-' }}</p>
                          </div>
                          <div>
                            <p class="text-xs text-gray-500 dark:text-subtext-dark mb-1">Taxa Germinacao</p>
                            <p class="text-sm font-medium text-gray-900 dark:text-text-dark">{{ selectedLote.taxa_germinacao ? `${selectedLote.taxa_germinacao}%` : '-' }}</p>
                          </div>
                          <div>
                            <p class="text-xs text-gray-500 dark:text-subtext-dark mb-1">Taxa Pureza</p>
                            <p class="text-sm font-medium text-gray-900 dark:text-text-dark">{{ selectedLote.taxa_pureza ? `${selectedLote.taxa_pureza}%` : '-' }}</p>
                          </div>
                        </div>
                      </div>

                      <!-- Origem e Valor -->
                      <div class="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 sm:p-5">
                        <h3 class="text-xs font-semibold text-gray-500 dark:text-subtext-dark uppercase tracking-wider mb-3 sm:mb-4">Origem e Valor</h3>
                        <div class="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4">
                          <div>
                            <p class="text-xs text-gray-500 dark:text-subtext-dark mb-1">Pais de Origem</p>
                            <p class="text-sm font-medium text-gray-900 dark:text-text-dark">{{ selectedLote.pais_origem || '-' }}</p>
                          </div>
                          <div>
                            <p class="text-xs text-gray-500 dark:text-subtext-dark mb-1">Valor da Semente</p>
                            <p class="text-sm font-medium text-gray-900 dark:text-text-dark">{{ selectedLote.valor_semente ? formatCurrency(selectedLote.valor_semente) + '/kg' : '-' }}</p>
                          </div>
                        </div>
                      </div>

                      <!-- Observacoes -->
                      <div v-if="selectedLote.observacoes" class="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 sm:p-5">
                        <h3 class="text-xs font-semibold text-gray-500 dark:text-subtext-dark uppercase tracking-wider mb-3 sm:mb-4">Observacoes</h3>
                        <p class="text-sm text-gray-900 dark:text-text-dark whitespace-pre-wrap">{{ selectedLote.observacoes }}</p>
                      </div>
                    </div>
                  </div>

                  <!-- Footer -->
                  <div class="px-4 sm:px-6 py-4 border-t border-gray-100 dark:border-border-dark">
                    <button @click="openEditFromSlideover" class="w-full btn btn-primary justify-center">
                      <span class="material-icons text-sm">edit</span>
                      Editar lote
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

interface Especie {
  id: string
  codigo: string
  nome: string
}

interface Lote {
  id: string
  empresa_id: string
  especie_id: string | null
  numero: string
  estoque_inicial: number | null
  estoque_atual: number | null
  validade: string | null
  tempo_germinacao: number | null
  tempo_luz: number | null
  densidade_semeadura: number | null
  safra: string | null
  eficiencia: number | null
  taxa_germinacao: number | null
  taxa_pureza: number | null
  pais_origem: string | null
  fornecedor: string | null
  valor_semente: number | null
  observacoes: string | null
  status: string
  created_at: string
  updated_at: string
  especies?: Especie
}

const supabase = useSupabaseClient()
const { currentCompany } = useCurrentCompany()
const { success, error: showError } = useToast()

// Estado
const lotes = ref<Lote[]>([])
const especies = ref<Especie[]>([])
const loading = ref(false)
const saving = ref(false)

// Modais
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showSlideover = ref(false)
const selectedLote = ref<Lote | null>(null)

// Paginacao
const currentPage = ref(1)
const itemsPerPage = ref(10)
const pageInput = ref('1')

// Filtros
const searchQuery = ref('')
const filterEspecie = ref('')
const filterStatus = ref('')
const validadeInicio = ref('')
const validadeFim = ref('')

// Ordenacao
const sortField = ref<string>('numero')
const sortDirection = ref<'asc' | 'desc'>('asc')

// Formularios
const newLote = ref({
  especie_id: '',
  numero: '',
  estoque_inicial: null as number | null,
  validade: '',
  tempo_germinacao: null as number | null,
  tempo_luz: null as number | null,
  densidade_semeadura: null as number | null,
  safra: '',
  eficiencia: null as number | null,
  taxa_germinacao: null as number | null,
  taxa_pureza: null as number | null,
  pais_origem: '',
  fornecedor: '',
  valor_semente: null as number | null,
  observacoes: ''
})

const editLote = ref<Partial<Lote>>({})
const editLoteAtivo = ref(true)

// Computed
const hasActiveFilters = computed(() => {
  return filterEspecie.value || filterStatus.value || validadeInicio.value || validadeFim.value
})

const filteredLotes = computed(() => {
  let result = [...lotes.value]

  // Busca por texto
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(lote =>
      lote.numero.toLowerCase().includes(query) ||
      lote.especies?.nome.toLowerCase().includes(query) ||
      lote.especies?.codigo.toLowerCase().includes(query) ||
      lote.fornecedor?.toLowerCase().includes(query)
    )
  }

  // Filtro por especie
  if (filterEspecie.value) {
    result = result.filter(lote => lote.especie_id === filterEspecie.value)
  }

  // Filtro por status
  if (filterStatus.value) {
    result = result.filter(lote => lote.status === filterStatus.value)
  }

  // Filtro por validade
  if (validadeInicio.value) {
    result = result.filter(lote => lote.validade && lote.validade >= validadeInicio.value)
  }
  if (validadeFim.value) {
    result = result.filter(lote => lote.validade && lote.validade <= validadeFim.value)
  }

  // Ordenacao
  result.sort((a, b) => {
    let aVal: any = a[sortField.value as keyof Lote]
    let bVal: any = b[sortField.value as keyof Lote]

    if (aVal === null || aVal === undefined) aVal = ''
    if (bVal === null || bVal === undefined) bVal = ''

    if (typeof aVal === 'string') aVal = aVal.toLowerCase()
    if (typeof bVal === 'string') bVal = bVal.toLowerCase()

    if (aVal < bVal) return sortDirection.value === 'asc' ? -1 : 1
    if (aVal > bVal) return sortDirection.value === 'asc' ? 1 : -1
    return 0
  })

  return result
})

const totalPages = computed(() => Math.ceil(filteredLotes.value.length / itemsPerPage.value) || 1)

const paginatedLotes = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  return filteredLotes.value.slice(start, start + itemsPerPage.value)
})

const visiblePages = computed(() => {
  const pages: (number | string)[] = []
  const total = totalPages.value
  const current = currentPage.value

  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else {
    pages.push(1)
    if (current > 3) pages.push('...')

    const start = Math.max(2, current - 1)
    const end = Math.min(total - 1, current + 1)

    for (let i = start; i <= end; i++) pages.push(i)

    if (current < total - 2) pages.push('...')
    pages.push(total)
  }

  return pages
})

const tempoTotalCreate = computed(() => {
  return (newLote.value.tempo_germinacao || 0) + (newLote.value.tempo_luz || 0)
})

const tempoTotalEdit = computed(() => {
  return (editLote.value.tempo_germinacao || 0) + (editLote.value.tempo_luz || 0)
})

const isCreateFormValid = computed(() => {
  return newLote.value.especie_id && newLote.value.numero && newLote.value.validade
})

const isEditFormValid = computed(() => {
  return editLote.value.especie_id && editLote.value.numero && editLote.value.validade
})

// Funcoes auxiliares
function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-'
  return new Intl.NumberFormat('pt-BR').format(value)
}

function formatDate(dateString: string | null): string {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('pt-BR')
}

function formatDateTime(dateString: string | null): string {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString('pt-BR')
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function getValidadeClass(validade: string | null): string {
  if (!validade) return 'text-text-light dark:text-text-dark'

  const hoje = new Date()
  const dataValidade = new Date(validade)
  const diffDays = Math.ceil((dataValidade.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return 'text-red-600 dark:text-red-400 font-semibold'
  if (diffDays <= 30) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-text-light dark:text-text-dark'
}

function toggleSort(field: string) {
  if (sortField.value === field) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortDirection.value = 'asc'
  }
}

function getSortIcon(field: string): string {
  if (sortField.value !== field) return 'unfold_more'
  return sortDirection.value === 'asc' ? 'expand_less' : 'expand_more'
}

function clearFilters() {
  filterEspecie.value = ''
  filterStatus.value = ''
  validadeInicio.value = ''
  validadeFim.value = ''
  currentPage.value = 1
}

function getEspecieNome(especieId: string | undefined): string {
  if (!especieId) return '-'
  const especie = especies.value.find(e => e.id === especieId)
  return especie ? especie.nome : '-'
}

// Carregar dados
async function loadLotes() {
  if (!currentCompany.value?.id) {
    lotes.value = []
    return
  }

  loading.value = true
  try {
    const { data, error } = await supabase
      .from('lotes_sementes')
      .select('*, especies(id, codigo, nome)')
      .eq('empresa_id', currentCompany.value.id)
      .order('numero', { ascending: true })

    if (error) throw error
    lotes.value = data || []
  } catch (e: any) {
    console.error('Erro ao carregar lotes:', e)
    showError('Erro ao carregar lotes de sementes')
  } finally {
    loading.value = false
  }
}

async function loadEspecies() {
  if (!currentCompany.value?.id) {
    especies.value = []
    return
  }

  try {
    const { data, error } = await supabase
      .from('especies')
      .select('id, codigo, nome')
      .eq('empresa_id', currentCompany.value.id)
      .eq('ativo', true)
      .order('nome', { ascending: true })

    if (error) throw error
    especies.value = data || []
  } catch (e: any) {
    console.error('Erro ao carregar especies:', e)
  }
}

// Modal de criacao
function openCreateModal() {
  newLote.value = {
    especie_id: '',
    numero: '',
    estoque_inicial: null,
    validade: '',
    tempo_germinacao: null,
    tempo_luz: null,
    densidade_semeadura: null,
    safra: '',
    eficiencia: null,
    taxa_germinacao: null,
    taxa_pureza: null,
    pais_origem: '',
    fornecedor: '',
    valor_semente: null,
    observacoes: ''
  }
  showCreateModal.value = true
}

function closeCreateModal() {
  showCreateModal.value = false
}

async function saveLote() {
  if (!currentCompany.value?.id) {
    showError('Nenhuma empresa selecionada')
    return
  }

  if (!isCreateFormValid.value) {
    showError('Preencha todos os campos obrigatorios')
    return
  }

  saving.value = true
  try {
    const { error } = await supabase
      .from('lotes_sementes')
      .insert({
        empresa_id: currentCompany.value.id,
        especie_id: newLote.value.especie_id || null,
        numero: newLote.value.numero,
        estoque_inicial: newLote.value.estoque_inicial,
        estoque_atual: newLote.value.estoque_inicial,
        validade: newLote.value.validade || null,
        tempo_germinacao: newLote.value.tempo_germinacao,
        tempo_luz: newLote.value.tempo_luz,
        densidade_semeadura: newLote.value.densidade_semeadura,
        safra: newLote.value.safra || null,
        eficiencia: newLote.value.eficiencia,
        taxa_germinacao: newLote.value.taxa_germinacao,
        taxa_pureza: newLote.value.taxa_pureza,
        pais_origem: newLote.value.pais_origem || null,
        fornecedor: newLote.value.fornecedor || null,
        valor_semente: newLote.value.valor_semente,
        observacoes: newLote.value.observacoes || null,
        status: 'ativo'
      })

    if (error) throw error

    success('Lote criado com sucesso')
    closeCreateModal()
    await loadLotes()
  } catch (e: any) {
    console.error('Erro ao criar lote:', e)
    showError(e.message || 'Erro ao criar lote')
  } finally {
    saving.value = false
  }
}

// Modal de edicao
function openEditModal(lote: Lote) {
  editLote.value = {
    ...lote,
    validade: lote.validade || ''
  }
  editLoteAtivo.value = lote.status === 'ativo'
  showEditModal.value = true
}

function closeEditModal() {
  showEditModal.value = false
}

function openEditFromSlideover() {
  if (selectedLote.value) {
    openEditModal(selectedLote.value)
  }
}

async function updateLote() {
  if (!currentCompany.value?.id || !editLote.value.id) {
    showError('Erro ao atualizar lote')
    return
  }

  if (!isEditFormValid.value) {
    showError('Preencha todos os campos obrigatorios')
    return
  }

  saving.value = true
  try {
    const { error } = await supabase
      .from('lotes_sementes')
      .update({
        especie_id: editLote.value.especie_id || null,
        numero: editLote.value.numero,
        estoque_inicial: editLote.value.estoque_inicial,
        estoque_atual: editLote.value.estoque_atual,
        validade: editLote.value.validade || null,
        tempo_germinacao: editLote.value.tempo_germinacao,
        tempo_luz: editLote.value.tempo_luz,
        densidade_semeadura: editLote.value.densidade_semeadura,
        safra: editLote.value.safra || null,
        eficiencia: editLote.value.eficiencia,
        taxa_germinacao: editLote.value.taxa_germinacao,
        taxa_pureza: editLote.value.taxa_pureza,
        pais_origem: editLote.value.pais_origem || null,
        fornecedor: editLote.value.fornecedor || null,
        valor_semente: editLote.value.valor_semente,
        observacoes: editLote.value.observacoes || null,
        status: editLoteAtivo.value ? 'ativo' : 'inativo'
      })
      .eq('id', editLote.value.id)
      .eq('empresa_id', currentCompany.value.id)

    if (error) throw error

    success('Lote atualizado com sucesso')
    closeEditModal()
    await loadLotes()

    // Atualizar o selectedLote se estiver aberto
    if (selectedLote.value?.id === editLote.value.id) {
      const updated = lotes.value.find(l => l.id === editLote.value.id)
      if (updated) selectedLote.value = updated
    }
  } catch (e: any) {
    console.error('Erro ao atualizar lote:', e)
    showError(e.message || 'Erro ao atualizar lote')
  } finally {
    saving.value = false
  }
}

// Slideover
function openSlideover(lote: Lote) {
  selectedLote.value = lote
  showSlideover.value = true
}

function closeSlideover() {
  showSlideover.value = false
  selectedLote.value = null
}

async function toggleStatus() {
  if (!selectedLote.value || !currentCompany.value?.id) return

  saving.value = true
  try {
    const newStatus = selectedLote.value.status === 'ativo' ? 'inativo' : 'ativo'

    const { error } = await supabase
      .from('lotes_sementes')
      .update({ status: newStatus })
      .eq('id', selectedLote.value.id)
      .eq('empresa_id', currentCompany.value.id)

    if (error) throw error

    selectedLote.value.status = newStatus
    success(`Lote ${newStatus === 'ativo' ? 'ativado' : 'desativado'} com sucesso`)
    await loadLotes()
  } catch (e: any) {
    console.error('Erro ao alterar status:', e)
    showError('Erro ao alterar status do lote')
  } finally {
    saving.value = false
  }
}

// Watch para mudanca de empresa
watch(
  () => currentCompany.value?.id,
  (newId, oldId) => {
    if (newId !== oldId) {
      currentPage.value = 1
      loadLotes()
      loadEspecies()
    }
  },
  { immediate: true }
)

// Watch para resetar paginacao quando filtros mudam
watch([searchQuery, filterEspecie, filterStatus, validadeInicio, validadeFim], () => {
  currentPage.value = 1
  pageInput.value = '1'
})

// Sincronizar pageInput com currentPage
watch(currentPage, (newVal) => {
  pageInput.value = String(newVal)
})

// Watch para itemsPerPage
watch(itemsPerPage, () => {
  currentPage.value = 1
  pageInput.value = '1'
})

// Funcao para ir para pagina especifica
function goToPage() {
  const page = parseInt(pageInput.value)
  if (!isNaN(page) && page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  } else {
    pageInput.value = String(currentPage.value)
  }
}

// Inicializacao
onMounted(() => {
  loadLotes()
  loadEspecies()
})
</script>
