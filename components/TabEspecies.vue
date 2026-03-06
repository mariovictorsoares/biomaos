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
            placeholder="Buscar espécies..."
            class="input w-full sm:w-64 text-sm pl-9"
          />
        </div>
      </div>
      <!-- Direita: Botão -->
      <button @click="openEspecieModal(null)" class="btn btn-primary shrink-0 justify-center sm:justify-start">
        <span class="material-icons-outlined text-sm">add</span>
        Nova espécie
      </button>
    </div>

    <!-- Card da Tabela -->
    <div class="card overflow-hidden">

      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>

      <!-- Tabela -->
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-100 dark:bg-gray-700/50 border-b border-border-light dark:border-border-dark">
              <th class="table-header rounded-tl-lg w-24 cursor-pointer hover:text-text-light dark:hover:text-text-dark" @click="sortBy('codigo')">
                <div class="flex items-center gap-1">
                  Código
                  <span v-if="sortField === 'codigo'" class="material-icons-outlined text-xs">
                    {{ sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward' }}
                  </span>
                </div>
              </th>
              <th class="table-header w-12 px-2">Foto</th>
              <th class="table-header cursor-pointer hover:text-text-light dark:hover:text-text-dark" @click="sortBy('nome')">
                <div class="flex items-center gap-1">
                  Nome
                  <span v-if="sortField === 'nome'" class="material-icons-outlined text-xs">
                    {{ sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward' }}
                  </span>
                </div>
              </th>
              <th class="table-header text-center w-40">Lote Recente</th>
              <th class="table-header text-center w-24 rounded-tr-lg">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-light dark:divide-border-dark">
            <tr
              v-for="especie in paginatedEspecies"
              :key="especie.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
              @click="openEspecieModal(especie)"
            >
              <td class="table-cell w-24 font-medium text-primary">{{ especie.codigo }}</td>
              <td class="table-cell w-12 px-2">
                <div class="w-8 h-8 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center border-2 border-primary">
                  <img
                    v-if="especie.imagem_url"
                    :src="especie.imagem_url"
                    :alt="especie.nome"
                    class="w-full h-full object-cover"
                  />
                  <span v-else class="material-icons-outlined text-primary text-sm">eco</span>
                </div>
              </td>
              <td class="table-cell font-medium">{{ especie.nome }}</td>
              <td class="table-cell text-center text-sm text-subtext-light dark:text-subtext-dark">
                {{ especieLoteRecente[especie.id] || '-' }}
              </td>
              <td class="table-cell text-center">
                <button
                  @click.stop="openEspecieModal(especie)"
                  class="text-gray-400 hover:text-primary transition-colors"
                  title="Ver espécie"
                >
                  <span class="material-icons-outlined text-sm">visibility</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty State -->
      <div v-if="!loading && filteredEspecies.length === 0" class="flex flex-col items-center justify-center text-center py-12">
        <span class="material-icons-outlined text-4xl text-gray-300 dark:text-gray-600 mb-2">eco</span>
        <h3 class="text-lg font-medium text-text-light dark:text-text-dark mb-1">Nenhuma espécie encontrada</h3>
        <p class="text-sm text-subtext-light dark:text-subtext-dark mb-4">Comece cadastrando sua primeira espécie</p>
        <button @click="openEspecieModal(null)" class="btn btn-primary">
          <span class="material-icons-outlined text-sm">add</span>
          Nova espécie
        </button>
      </div>

      <!-- Paginação -->
      <div v-if="filteredEspecies.length > 0" class="p-4 flex flex-col sm:flex-row items-center justify-between border-t border-border-light dark:border-border-dark text-xs text-subtext-light dark:text-subtext-dark gap-4">
        <div class="flex items-center gap-4">
          <select v-model="itemsPerPage" class="border border-border-light dark:border-border-dark rounded px-2 py-1 bg-white dark:bg-gray-800 text-sm cursor-pointer">
            <option :value="10">10 linhas</option>
            <option :value="25">25 linhas</option>
            <option :value="50">50 linhas</option>
          </select>
          <span>{{ filteredEspecies.length }} registros</span>
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

    <!-- ======================= -->
    <!-- MODAL ESPÉCIE (z-[60]) -->
    <!-- ======================= -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        leave-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        leave-to-class="opacity-0"
      >
        <div v-if="showEspecieModal" class="fixed inset-0 z-[60] overflow-y-auto">
          <div class="fixed inset-0 glass-backdrop" @click="closeEspecieModal"></div>
          <div class="flex min-h-full items-center justify-center p-4">
            <Transition
              enter-active-class="transition-all duration-200"
              leave-active-class="transition-all duration-200"
              enter-from-class="opacity-0 scale-95"
              leave-to-class="opacity-0 scale-95"
            >
              <div v-if="showEspecieModal" class="relative glass-panel rounded-lg shadow-xl w-full max-w-4xl">

                <!-- Header -->
                <div class="border-b border-border-light dark:border-border-dark px-6 py-4 flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center border-2 border-primary shrink-0">
                      <img
                        v-if="especieForm.imagePreview || especieForm.imagem_url"
                        :src="especieForm.imagePreview || especieForm.imagem_url"
                        alt="Espécie"
                        class="w-full h-full object-cover"
                      />
                      <span v-else class="material-icons-outlined text-primary text-lg">eco</span>
                    </div>
                    <div>
                      <h2 class="text-lg font-semibold text-text-light dark:text-text-dark">
                        {{ isEditing ? (especieForm.codigo ? especieForm.codigo + ' - ' : '') + (especieForm.nome || 'Editar espécie') : 'Nova espécie' }}
                      </h2>
                    </div>
                  </div>
                  <button @click="closeEspecieModal" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <span class="material-icons-outlined">close</span>
                  </button>
                </div>

                <!-- Body -->
                <div class="p-6 overflow-y-auto max-h-[80vh] space-y-6">

                  <!-- Section 1: Dados da Espécie -->
                  <div>
                    <h3 class="text-sm font-medium text-subtext-light dark:text-subtext-dark mb-4 uppercase tracking-wider flex items-center gap-2">
                      <span class="material-icons-outlined text-sm">eco</span>
                      Dados da Espécie
                    </h3>

                    <!-- Imagem + Código/Nome lado a lado -->
                    <div class="flex items-start gap-5">
                      <!-- Upload de Imagem -->
                      <div class="flex flex-col items-center shrink-0">
                        <div class="relative group cursor-pointer">
                          <div class="w-20 h-20 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center border-2 border-primary">
                            <img
                              v-if="especieForm.imagePreview || especieForm.imagem_url"
                              :src="especieForm.imagePreview || especieForm.imagem_url"
                              alt="Preview"
                              class="w-full h-full object-cover"
                            />
                            <span v-else class="material-icons-outlined text-primary text-3xl">eco</span>
                          </div>
                          <label class="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                            <span class="material-icons-outlined text-white text-lg">photo_camera</span>
                            <input
                              type="file"
                              accept="image/*"
                              class="hidden"
                              @change="handleImageUpload($event)"
                            />
                          </label>
                        </div>
                        <p class="mt-1 text-[10px] text-subtext-light dark:text-subtext-dark">Alterar foto</p>
                      </div>

                      <!-- Código e Nome -->
                      <div class="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                            Código <span class="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            v-model="especieForm.codigo"
                            :class="['input', formAttempted && !especieForm.codigo ? 'border-red-500 dark:border-red-500' : '']"
                            placeholder="Ex: AGRI"
                            maxlength="10"
                          />
                          <span v-if="formAttempted && !especieForm.codigo" class="text-xs text-red-500 mt-1">Campo obrigatório</span>
                        </div>
                        <div class="sm:col-span-2">
                          <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                            Nome <span class="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            v-model="especieForm.nome"
                            :class="['input', formAttempted && !especieForm.nome ? 'border-red-500 dark:border-red-500' : '']"
                            placeholder="Ex: Agrião"
                          />
                          <span v-if="formAttempted && !especieForm.nome" class="text-xs text-red-500 mt-1">Campo obrigatório</span>
                        </div>
                      </div>
                    </div>

                  </div>

                  <!-- Section 2: Lotes de Sementes (only for existing species) -->
                  <div v-if="isEditing">
                    <div class="border-t border-border-light dark:border-border-dark pt-6">
                      <div class="flex items-center justify-between mb-4">
                        <h3 class="text-sm font-medium text-subtext-light dark:text-subtext-dark uppercase tracking-wider flex items-center gap-2">
                          <span class="material-icons-outlined text-sm">inventory_2</span>
                          Lotes de Sementes
                          <span class="badge badge-success text-[10px] ml-1">{{ lotes.length }}</span>
                        </h3>
                        <button @click="openLoteModal(null)" class="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium">
                          <span class="material-icons-outlined text-sm">add</span>
                          Novo lote
                        </button>
                      </div>

                      <!-- Lotes Table -->
                      <div v-if="lotes.length > 0" class="overflow-x-auto border border-border-light dark:border-border-dark rounded-lg">
                        <table class="w-full text-left border-collapse">
                          <thead>
                            <tr class="bg-gray-50 dark:bg-gray-800/50 border-b border-border-light dark:border-border-dark">
                              <th class="px-3 py-2 text-xs font-medium text-subtext-light dark:text-subtext-dark">Número</th>
                              <th class="px-3 py-2 text-xs font-medium text-subtext-light dark:text-subtext-dark text-center">Estoque Inicial</th>
                              <th class="px-3 py-2 text-xs font-medium text-subtext-light dark:text-subtext-dark text-center">Estoque Atual</th>
                              <th class="px-3 py-2 text-xs font-medium text-subtext-light dark:text-subtext-dark text-center">Validade</th>
                              <th class="px-3 py-2 text-xs font-medium text-subtext-light dark:text-subtext-dark">Fornecedor</th>
                              <th class="px-3 py-2 text-xs font-medium text-subtext-light dark:text-subtext-dark text-center">Status</th>
                              <th class="px-3 py-2 text-xs font-medium text-subtext-light dark:text-subtext-dark w-10"></th>
                            </tr>
                          </thead>
                          <tbody class="divide-y divide-border-light dark:divide-border-dark">
                            <tr
                              v-for="lote in lotes"
                              :key="lote.id"
                              class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                            >
                              <td class="px-3 py-2 text-sm font-medium text-text-light dark:text-text-dark">{{ lote.numero }}</td>
                              <td class="px-3 py-2 text-sm text-text-light dark:text-text-dark text-center">{{ formatNumber(lote.estoque_inicial) }}</td>
                              <td class="px-3 py-2 text-sm text-text-light dark:text-text-dark text-center">{{ formatNumber(lote.estoque_atual) }}</td>
                              <td class="px-3 py-2 text-sm text-center">
                                <span :class="getValidadeClass(lote.validade)">
                                  {{ lote.validade ? formatDate(lote.validade) : '-' }}
                                </span>
                              </td>
                              <td class="px-3 py-2 text-sm text-text-light dark:text-text-dark">{{ lote.fornecedor || '-' }}</td>
                              <td class="px-3 py-2 text-center">
                                <span :class="['badge text-[10px]', lote.status === 'ativo' ? 'badge-success' : 'badge-inactive']">
                                  {{ lote.status === 'ativo' ? 'Ativo' : 'Inativo' }}
                                </span>
                              </td>
                              <td class="px-3 py-2 text-center">
                                <button
                                  @click.stop="openLoteModal(lote)"
                                  class="text-gray-400 hover:text-primary transition-colors"
                                  title="Editar lote"
                                >
                                  <span class="material-icons-outlined text-sm">edit</span>
                                </button>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <!-- Empty State for Lotes -->
                      <div v-else class="text-center py-8 border border-dashed border-border-light dark:border-border-dark rounded-lg">
                        <span class="material-icons-outlined text-3xl text-gray-300 dark:text-gray-600 mb-2">inventory_2</span>
                        <p class="text-sm text-subtext-light dark:text-subtext-dark">Nenhum lote de sementes cadastrado</p>
                        <button @click="openLoteModal(null)" class="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium">
                          <span class="material-icons-outlined text-sm">add</span>
                          Cadastrar primeiro lote
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Footer -->
                <div class="border-t border-border-light dark:border-border-dark px-6 py-4 flex items-center justify-between">
                  <div>
                    <button
                      v-if="isEditing"
                      @click="deleteEspecie"
                      class="btn btn-secondary text-red-600 dark:text-red-400"
                    >
                      <span class="material-icons-outlined text-sm">delete</span>
                      Excluir
                    </button>
                  </div>
                  <div class="flex items-center gap-3">
                    <button @click="closeEspecieModal" class="btn btn-secondary">Cancelar</button>
                    <button @click="saveOrUpdateEspecie" :disabled="saving" class="btn btn-primary">
                      <span v-if="saving" class="animate-spin material-icons-outlined text-sm">refresh</span>
                      {{ saving ? 'Salvando...' : (isEditing ? 'Salvar alterações' : 'Salvar espécie') }}
                    </button>
                  </div>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ========================== -->
    <!-- MODAL LOTE (z-[70]) -->
    <!-- ========================== -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        leave-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        leave-to-class="opacity-0"
      >
        <div v-if="showLoteModal" class="fixed inset-0 z-[70] overflow-y-auto">
          <div class="fixed inset-0 glass-backdrop" @click="closeLoteModal"></div>
          <div class="flex min-h-full items-center justify-center p-4">
            <Transition
              enter-active-class="transition-all duration-200"
              leave-active-class="transition-all duration-200"
              enter-from-class="opacity-0 scale-95"
              leave-to-class="opacity-0 scale-95"
            >
              <div v-if="showLoteModal" class="relative glass-panel rounded-lg shadow-xl w-full max-w-2xl">

                <!-- Header -->
                <div class="border-b border-border-light dark:border-border-dark px-6 py-4 flex items-center justify-between">
                  <h2 class="text-lg font-semibold text-text-light dark:text-text-dark">
                    {{ isEditingLote ? 'Editar lote' : 'Novo lote' }}
                  </h2>
                  <button @click="closeLoteModal" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <span class="material-icons-outlined">close</span>
                  </button>
                </div>

                <!-- Body -->
                <div class="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
                  <!-- Row 1: Número, Safra, Validade -->
                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                        Número <span class="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        v-model="loteForm.numero"
                        :class="['input', loteFormAttempted && !loteForm.numero ? 'border-red-500 dark:border-red-500' : '']"
                        placeholder="Ex: L001"
                      />
                      <span v-if="loteFormAttempted && !loteForm.numero" class="text-xs text-red-500 mt-1">Campo obrigatório</span>
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Safra</label>
                      <input type="text" v-model="loteForm.safra" class="input" placeholder="Ex: 2026A" />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Validade</label>
                      <input type="date" v-model="loteForm.validade" class="input" />
                    </div>
                  </div>

                  <!-- Row 2: Estoque Inicial, Fornecedor, País Origem -->
                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                        Estoque Inicial <span class="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        v-model.number="loteForm.estoque_inicial"
                        :class="['input', loteFormAttempted && !loteForm.estoque_inicial ? 'border-red-500 dark:border-red-500' : '']"
                        placeholder="Ex: 1000"
                        min="0"
                        step="0.01"
                      />
                      <span v-if="loteFormAttempted && !loteForm.estoque_inicial" class="text-xs text-red-500 mt-1">Campo obrigatório</span>
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Fornecedor</label>
                      <input type="text" v-model="loteForm.fornecedor" class="input" placeholder="Ex: SeedCo" />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">País de Origem</label>
                      <input type="text" v-model="loteForm.pais_origem" class="input" placeholder="Ex: Brasil" />
                    </div>
                  </div>

                  <!-- Row 3: Tempo Germinação, Tempo Luz, Densidade Semeadura -->
                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                        Tempo Germinação (dias) <span class="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        v-model.number="loteForm.tempo_germinacao"
                        :class="['input', loteFormAttempted && !loteForm.tempo_germinacao ? 'border-red-500 dark:border-red-500' : '']"
                        placeholder="Ex: 3"
                        min="0"
                      />
                      <span v-if="loteFormAttempted && !loteForm.tempo_germinacao" class="text-xs text-red-500 mt-1">Campo obrigatório</span>
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                        Tempo Luz (dias) <span class="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        v-model.number="loteForm.tempo_luz"
                        :class="['input', loteFormAttempted && !loteForm.tempo_luz ? 'border-red-500 dark:border-red-500' : '']"
                        placeholder="Ex: 7"
                        min="0"
                      />
                      <span v-if="loteFormAttempted && !loteForm.tempo_luz" class="text-xs text-red-500 mt-1">Campo obrigatório</span>
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                        Densidade Semeadura <span class="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        v-model.number="loteForm.densidade_semeadura"
                        :class="['input', loteFormAttempted && !loteForm.densidade_semeadura ? 'border-red-500 dark:border-red-500' : '']"
                        placeholder="Ex: 25"
                        min="0"
                        step="0.01"
                      />
                      <span v-if="loteFormAttempted && !loteForm.densidade_semeadura" class="text-xs text-red-500 mt-1">Campo obrigatório</span>
                    </div>
                  </div>

                  <!-- Row 4: Rendimento, Margem Segurança, Eficiência -->
                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Rendimento por Bandeja</label>
                      <input type="number" v-model.number="loteForm.rendimento_por_bandeja" class="input" placeholder="Ex: 200" min="0" step="0.01" />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Margem de Segurança</label>
                      <input type="number" v-model.number="loteForm.margem_seguranca" class="input" placeholder="Ex: 10" min="0" step="0.01" />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                        Eficiência <span class="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        v-model.number="loteForm.eficiencia"
                        :class="['input', loteFormAttempted && !loteForm.eficiencia ? 'border-red-500 dark:border-red-500' : '']"
                        placeholder="Ex: 0.85"
                        min="0"
                        max="1"
                        step="0.01"
                      />
                      <span v-if="loteFormAttempted && !loteForm.eficiencia" class="text-xs text-red-500 mt-1">Campo obrigatório</span>
                    </div>
                  </div>

                  <!-- Row 5: Taxa Germinação, Taxa Pureza, Valor Semente -->
                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Taxa de Germinação</label>
                      <input type="number" v-model.number="loteForm.taxa_germinacao" class="input" placeholder="Ex: 0.95" min="0" max="1" step="0.01" />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Taxa de Pureza</label>
                      <input type="number" v-model.number="loteForm.taxa_pureza" class="input" placeholder="Ex: 0.98" min="0" max="1" step="0.01" />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                        Valor Semente (R$) <span class="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        v-model.number="loteForm.valor_semente"
                        :class="['input', loteFormAttempted && !loteForm.valor_semente ? 'border-red-500 dark:border-red-500' : '']"
                        placeholder="Ex: 25.50"
                        min="0"
                        step="0.01"
                      />
                      <span v-if="loteFormAttempted && !loteForm.valor_semente" class="text-xs text-red-500 mt-1">Campo obrigatório</span>
                    </div>
                  </div>

                </div>

                <!-- Footer -->
                <div class="border-t border-border-light dark:border-border-dark px-6 py-4 flex items-center justify-between">
                  <div>
                    <button
                      v-if="isEditingLote"
                      @click="deleteLote"
                      class="btn btn-secondary text-red-600 dark:text-red-400"
                    >
                      <span class="material-icons-outlined text-sm">delete</span>
                      Excluir
                    </button>
                  </div>
                  <div class="flex items-center gap-3">
                    <button @click="closeLoteModal" class="btn btn-secondary">Cancelar</button>
                    <button @click="saveOrUpdateLote" :disabled="savingLote" class="btn btn-primary">
                      <span v-if="savingLote" class="animate-spin material-icons-outlined text-sm">refresh</span>
                      {{ savingLote ? 'Salvando...' : (isEditingLote ? 'Salvar alterações' : 'Salvar lote') }}
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

<script setup>
import { ref, computed, watch } from 'vue'
import { useCurrentCompany } from '~/composables/useCurrentCompany'
import { useToast } from '~/composables/useToast'

const supabase = useSupabaseClient()
const { currentCompany } = useCurrentCompany()
const { success, error: showError } = useToast()

// ===========================
// Estado principal
// ===========================
const loading = ref(false)
const saving = ref(false)
const savingLote = ref(false)
const especies = ref([])

// Modais
const showEspecieModal = ref(false)
const showLoteModal = ref(false)

// Formulário da espécie
const getEmptyEspecie = () => ({
  id: null,
  codigo: '',
  nome: '',
  produto_mix: false,
  ativo: true,
  vida_util_dias: null,
  tempo_buffer_colheita: 0,
  tempo_germinacao: 0,
  tempo_luz: 0,
  notas: '',
  etapas: [],
  imagem_url: null,
  imagePreview: null,
  imageFile: null
})

const especieForm = ref(getEmptyEspecie())
const formAttempted = ref(false)
const isEditing = computed(() => !!especieForm.value.id)

// Lotes
const lotes = ref([])
const especieLoteRecenteMap = ref({})

// Formulário do lote
const getEmptyLote = () => ({
  id: null,
  numero: '',
  safra: '',
  validade: '',
  estoque_inicial: null,
  fornecedor: '',
  pais_origem: '',
  tempo_germinacao: null,
  tempo_luz: null,
  densidade_semeadura: null,
  rendimento_por_bandeja: null,
  margem_seguranca: null,
  eficiencia: null,
  taxa_germinacao: null,
  taxa_pureza: null,
  valor_semente: null,
  observacoes: '',
  status: 'ativo'
})

const loteForm = ref(getEmptyLote())
const loteFormAttempted = ref(false)
const isEditingLote = computed(() => !!loteForm.value.id)

// Paginação
const currentPage = ref(1)
const itemsPerPage = ref(10)
const pageInput = ref('1')

// Filtros
const searchQuery = ref('')
const filterTipo = ref('')

// Ordenação
const sortField = ref('nome')
const sortDirection = ref('asc')

// ===========================
// Computed - Filtros e Paginação
// ===========================
const especieLoteRecente = computed(() => especieLoteRecenteMap.value)

const filteredEspecies = computed(() => {
  let result = especies.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(e =>
      e.codigo.toLowerCase().includes(query) ||
      e.nome.toLowerCase().includes(query)
    )
  }

  if (filterTipo.value) {
    const isMix = filterTipo.value === 'mix'
    result = result.filter(e => e.produto_mix === isMix)
  }

  result = [...result].sort((a, b) => {
    let comparison = 0
    if (sortField.value === 'codigo') {
      comparison = a.codigo.localeCompare(b.codigo)
    } else if (sortField.value === 'nome') {
      comparison = a.nome.localeCompare(b.nome)
    }
    return sortDirection.value === 'asc' ? comparison : -comparison
  })

  return result
})

const totalPages = computed(() => {
  return Math.ceil(filteredEspecies.value.length / itemsPerPage.value) || 1
})

const paginatedEspecies = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredEspecies.value.slice(start, end)
})

// ===========================
// Carregamento de dados
// ===========================
async function loadEspecies() {
  if (!currentCompany.value?.id) return

  loading.value = true
  try {
    const { data, error } = await supabase
      .from('especies')
      .select('*')
      .eq('empresa_id', currentCompany.value.id)
      .order('nome')

    if (error) throw error
    especies.value = data || []

    // Load most recent lote for each species
    if (data && data.length > 0) {
      const ids = data.map(e => e.id)
      const { data: lotesData } = await supabase
        .from('lotes_sementes')
        .select('especie_id, numero')
        .in('especie_id', ids)
        .eq('status', 'ativo')
        .order('created_at', { ascending: false })

      const map = {}
      if (lotesData) {
        for (const lote of lotesData) {
          if (!map[lote.especie_id]) {
            map[lote.especie_id] = lote.numero
          }
        }
      }
      especieLoteRecenteMap.value = map
    }
  } catch (e) {
    console.error('Erro ao carregar espécies:', e)
    showError('Erro ao carregar espécies')
  } finally {
    loading.value = false
  }
}

async function loadLotes(especieId) {
  if (!especieId) {
    lotes.value = []
    return
  }
  try {
    const { data, error } = await supabase
      .from('lotes_sementes')
      .select('*')
      .eq('especie_id', especieId)
      .order('created_at', { ascending: false })

    if (error) throw error
    lotes.value = data || []
  } catch (e) {
    console.error('Erro ao carregar lotes:', e)
    showError('Erro ao carregar lotes')
  }
}

// ===========================
// Ordenação
// ===========================
function sortBy(field) {
  if (sortField.value === field) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortDirection.value = 'asc'
  }
}

// ===========================
// Upload de imagem
// ===========================
function handleImageUpload(event) {
  const file = event.target.files[0]
  if (!file) return

  if (file.size > 2 * 1024 * 1024) {
    showError('Imagem deve ter no máximo 2MB')
    return
  }

  if (!file.type.startsWith('image/')) {
    showError('Arquivo deve ser uma imagem')
    return
  }

  especieForm.value.imageFile = file
  especieForm.value.imagePreview = URL.createObjectURL(file)
}

async function uploadImage(file, especieId) {
  const fileExt = file.name.split('.').pop()
  const fileName = `${especieId}.${fileExt}`
  const filePath = `${currentCompany.value.id}/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('especies')
    .upload(filePath, file, { upsert: true })

  if (uploadError) throw uploadError

  const { data: { publicUrl } } = supabase.storage
    .from('especies')
    .getPublicUrl(filePath)

  return publicUrl
}

// ===========================
// Modal Espécie
// ===========================
async function openEspecieModal(especie) {
  formAttempted.value = false
  lotes.value = []

  if (especie) {
    // Editing existing species
    especieForm.value = {
      ...getEmptyEspecie(),
      ...especie,
      etapas: [],
      imagePreview: null,
      imageFile: null
    }

    // Load etapas
    const { data: etapas } = await supabase
      .from('etapas_cultivo')
      .select('*')
      .eq('especie_id', especie.id)
      .order('ordem')
    especieForm.value.etapas = etapas || []

    // Load lotes
    await loadLotes(especie.id)
  } else {
    // Creating new species
    especieForm.value = getEmptyEspecie()
  }

  showEspecieModal.value = true
}

function closeEspecieModal() {
  showEspecieModal.value = false
  formAttempted.value = false
}

async function saveOrUpdateEspecie() {
  if (isEditing.value) {
    await updateEspecie()
  } else {
    await saveEspecie()
  }
}

async function saveEspecie() {
  if (!currentCompany.value?.id) {
    showError('Nenhuma empresa selecionada')
    return
  }

  formAttempted.value = true
  if (!especieForm.value.codigo || !especieForm.value.nome) {
    showError('Preencha todos os campos obrigatórios')
    return
  }

  saving.value = true
  try {
    const { data, error } = await supabase
      .from('especies')
      .insert({
        empresa_id: currentCompany.value.id,
        codigo: especieForm.value.codigo,
        nome: especieForm.value.nome,
        produto_mix: especieForm.value.produto_mix,
        ativo: especieForm.value.ativo !== false,
        vida_util_dias: especieForm.value.vida_util_dias || null,
        tempo_buffer_colheita: especieForm.value.tempo_buffer_colheita || 0,
        notas: especieForm.value.notas || null
      })
      .select()
      .single()

    if (error) throw error

    // Save etapas de cultivo
    if (data && especieForm.value.etapas && especieForm.value.etapas.length > 0) {
      const etapasData = especieForm.value.etapas.map((e, i) => ({
        especie_id: data.id,
        nome: e.nome,
        ordem: i + 1,
        duracao_dias: e.duracao_dias
      }))
      await supabase.from('etapas_cultivo').insert(etapasData)
    }

    // Upload image if present
    if (especieForm.value.imageFile && data) {
      const imageUrl = await uploadImage(especieForm.value.imageFile, data.id)
      await supabase
        .from('especies')
        .update({ imagem_url: imageUrl })
        .eq('id', data.id)
      data.imagem_url = imageUrl
    }

    success('Espécie criada com sucesso')
    await loadEspecies()

    // Keep modal open, switch to edit mode with lotes section visible
    especieForm.value = {
      ...getEmptyEspecie(),
      ...data,
      etapas: especieForm.value.etapas,
      imagePreview: null,
      imageFile: null
    }
    formAttempted.value = false
    await loadLotes(data.id)
  } catch (e) {
    console.error('Erro ao criar espécie:', e)
    showError(e.message || 'Erro ao criar espécie')
  } finally {
    saving.value = false
  }
}

async function updateEspecie() {
  formAttempted.value = true
  if (!especieForm.value.codigo || !especieForm.value.nome) {
    showError('Preencha todos os campos obrigatórios')
    return
  }

  saving.value = true
  try {
    let imageUrl = especieForm.value.imagem_url

    // Upload new image if present
    if (especieForm.value.imageFile) {
      imageUrl = await uploadImage(especieForm.value.imageFile, especieForm.value.id)
    }

    const { error } = await supabase
      .from('especies')
      .update({
        codigo: especieForm.value.codigo,
        nome: especieForm.value.nome,
        produto_mix: especieForm.value.produto_mix,
        ativo: especieForm.value.ativo,
        imagem_url: imageUrl,
        vida_util_dias: especieForm.value.vida_util_dias || null,
        tempo_buffer_colheita: especieForm.value.tempo_buffer_colheita || 0,
        notas: especieForm.value.notas || null
      })
      .eq('id', especieForm.value.id)

    if (error) throw error

    // Update etapas: delete old, insert new
    await supabase.from('etapas_cultivo').delete().eq('especie_id', especieForm.value.id)
    if (especieForm.value.etapas && especieForm.value.etapas.length > 0) {
      const etapasData = especieForm.value.etapas.map((e, i) => ({
        especie_id: especieForm.value.id,
        nome: e.nome,
        ordem: i + 1,
        duracao_dias: e.duracao_dias
      }))
      await supabase.from('etapas_cultivo').insert(etapasData)
    }

    especieForm.value.imagem_url = imageUrl
    especieForm.value.imageFile = null
    especieForm.value.imagePreview = null

    success('Espécie atualizada com sucesso')
    closeEspecieModal()
    await loadEspecies()
  } catch (e) {
    console.error('Erro ao atualizar espécie:', e)
    showError(e.message || 'Erro ao atualizar espécie')
  } finally {
    saving.value = false
  }
}

async function deleteEspecie() {
  if (!especieForm.value.id) return

  if (!confirm('Tem certeza que deseja excluir esta espécie? Esta ação não pode ser desfeita.')) return

  saving.value = true
  try {
    // Delete etapas first
    await supabase.from('etapas_cultivo').delete().eq('especie_id', especieForm.value.id)

    // Delete lotes
    await supabase.from('lotes_sementes').delete().eq('especie_id', especieForm.value.id)

    // Delete the species
    const { error } = await supabase
      .from('especies')
      .delete()
      .eq('id', especieForm.value.id)

    if (error) throw error

    success('Espécie excluída com sucesso')
    closeEspecieModal()
    await loadEspecies()
  } catch (e) {
    console.error('Erro ao excluir espécie:', e)
    showError(e.message || 'Erro ao excluir espécie')
  } finally {
    saving.value = false
  }
}

// ===========================
// Modal Lote
// ===========================
function openLoteModal(lote) {
  loteFormAttempted.value = false

  if (lote) {
    loteForm.value = {
      ...getEmptyLote(),
      ...lote,
      validade: lote.validade ? lote.validade.substring(0, 10) : ''
    }
  } else {
    loteForm.value = getEmptyLote()
  }

  showLoteModal.value = true
}

function closeLoteModal() {
  showLoteModal.value = false
  loteFormAttempted.value = false
}

async function saveOrUpdateLote() {
  if (isEditingLote.value) {
    await updateLote()
  } else {
    await saveLote()
  }
}

async function saveLote() {
  if (!especieForm.value.id || !currentCompany.value?.id) {
    showError('Espécie ou empresa não selecionada')
    return
  }

  loteFormAttempted.value = true
  if (!loteForm.value.numero || !loteForm.value.estoque_inicial ||
      !loteForm.value.tempo_germinacao || !loteForm.value.tempo_luz ||
      !loteForm.value.densidade_semeadura || !loteForm.value.eficiencia ||
      !loteForm.value.valor_semente) {
    showError('Preencha todos os campos obrigatórios')
    return
  }

  savingLote.value = true
  try {
    const { error } = await supabase
      .from('lotes_sementes')
      .insert({
        empresa_id: currentCompany.value.id,
        especie_id: especieForm.value.id,
        numero: loteForm.value.numero,
        safra: loteForm.value.safra || null,
        validade: loteForm.value.validade || null,
        estoque_inicial: loteForm.value.estoque_inicial,
        estoque_atual: loteForm.value.estoque_inicial,
        fornecedor: loteForm.value.fornecedor || null,
        pais_origem: loteForm.value.pais_origem || null,
        tempo_germinacao: loteForm.value.tempo_germinacao,
        tempo_luz: loteForm.value.tempo_luz,
        densidade_semeadura: loteForm.value.densidade_semeadura,
        rendimento_por_bandeja: loteForm.value.rendimento_por_bandeja || null,
        margem_seguranca: loteForm.value.margem_seguranca || null,
        eficiencia: loteForm.value.eficiencia,
        taxa_germinacao: loteForm.value.taxa_germinacao || null,
        taxa_pureza: loteForm.value.taxa_pureza || null,
        valor_semente: loteForm.value.valor_semente,
        observacoes: loteForm.value.observacoes || null,
        status: 'ativo'
      })

    if (error) throw error

    success('Lote criado com sucesso')
    closeLoteModal()
    await loadLotes(especieForm.value.id)
  } catch (e) {
    console.error('Erro ao criar lote:', e)
    showError(e.message || 'Erro ao criar lote')
  } finally {
    savingLote.value = false
  }
}

async function updateLote() {
  loteFormAttempted.value = true
  if (!loteForm.value.numero || !loteForm.value.estoque_inicial ||
      !loteForm.value.tempo_germinacao || !loteForm.value.tempo_luz ||
      !loteForm.value.densidade_semeadura || !loteForm.value.eficiencia ||
      !loteForm.value.valor_semente) {
    showError('Preencha todos os campos obrigatórios')
    return
  }

  savingLote.value = true
  try {
    const { error } = await supabase
      .from('lotes_sementes')
      .update({
        numero: loteForm.value.numero,
        safra: loteForm.value.safra || null,
        validade: loteForm.value.validade || null,
        estoque_inicial: loteForm.value.estoque_inicial,
        fornecedor: loteForm.value.fornecedor || null,
        pais_origem: loteForm.value.pais_origem || null,
        tempo_germinacao: loteForm.value.tempo_germinacao,
        tempo_luz: loteForm.value.tempo_luz,
        densidade_semeadura: loteForm.value.densidade_semeadura,
        rendimento_por_bandeja: loteForm.value.rendimento_por_bandeja || null,
        margem_seguranca: loteForm.value.margem_seguranca || null,
        eficiencia: loteForm.value.eficiencia,
        taxa_germinacao: loteForm.value.taxa_germinacao || null,
        taxa_pureza: loteForm.value.taxa_pureza || null,
        valor_semente: loteForm.value.valor_semente,
        observacoes: loteForm.value.observacoes || null,
        status: loteForm.value.status
      })
      .eq('id', loteForm.value.id)

    if (error) throw error

    success('Lote atualizado com sucesso')
    closeLoteModal()
    await loadLotes(especieForm.value.id)
  } catch (e) {
    console.error('Erro ao atualizar lote:', e)
    showError(e.message || 'Erro ao atualizar lote')
  } finally {
    savingLote.value = false
  }
}

async function deleteLote() {
  if (!loteForm.value.id) return

  if (!confirm('Tem certeza que deseja excluir este lote? Esta ação não pode ser desfeita.')) return

  savingLote.value = true
  try {
    const { error } = await supabase
      .from('lotes_sementes')
      .delete()
      .eq('id', loteForm.value.id)

    if (error) throw error

    success('Lote excluído com sucesso')
    closeLoteModal()
    await loadLotes(especieForm.value.id)
  } catch (e) {
    console.error('Erro ao excluir lote:', e)
    showError(e.message || 'Erro ao excluir lote')
  } finally {
    savingLote.value = false
  }
}

// ===========================
// Utilitários
// ===========================
function formatNumber(value) {
  if (value == null) return '-'
  return new Intl.NumberFormat('pt-BR').format(value)
}

function formatDate(dateString) {
  if (!dateString) return '-'
  return new Date(dateString + 'T00:00:00').toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

function formatCurrency(value) {
  if (value == null) return '-'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function getValidadeClass(validade) {
  if (!validade) return 'text-text-light dark:text-text-dark'

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const validadeDate = new Date(validade + 'T00:00:00')

  if (validadeDate < today) {
    return 'text-red-600 dark:text-red-400 font-medium'
  }

  const diffMs = validadeDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays <= 30) {
    return 'text-yellow-600 dark:text-yellow-400 font-medium'
  }

  return 'text-text-light dark:text-text-dark'
}

// ===========================
// Watchers
// ===========================
watch(
  () => currentCompany.value?.id,
  (newId) => {
    if (newId) {
      loadEspecies()
    }
  },
  { immediate: true }
)

// Reset page when filters change
watch([searchQuery, filterTipo], () => {
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

function goToPage() {
  const page = parseInt(pageInput.value)
  if (!isNaN(page) && page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  } else {
    pageInput.value = String(currentPage.value)
  }
}
</script>

<style scoped>
.badge-inactive {
  @apply bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300;
}
</style>
