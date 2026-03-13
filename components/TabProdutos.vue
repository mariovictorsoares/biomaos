<template>
  <div>
    <!-- Toolbar: Busca + Ações -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-4 mb-4">
      <!-- Esquerda: Busca -->
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
        <div class="relative">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 material-icons-outlined text-gray-400 text-base">search</span>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar produtos..."
            class="input w-full sm:w-64 text-sm pl-9"
          />
        </div>
      </div>
      <!-- Direita: Botões -->
      <div class="flex items-center gap-2">
        <button @click="openMovimentacaoModal" class="btn btn-secondary shrink-0 justify-center sm:justify-start">
          <span class="material-icons text-sm">swap_horiz</span>
          Movimentação
        </button>
        <button @click="openModal(null)" class="btn btn-primary shrink-0 justify-center sm:justify-start">
          <span class="material-icons-outlined text-sm">add</span>
          Novo produto
        </button>
      </div>
    </div>

    <!-- Card da Tabela -->
    <div class="card overflow-hidden">
      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>

      <!-- Tabela - Desktop -->
      <div v-if="!loading" class="hidden md:block overflow-x-auto">
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
              <th class="table-header cursor-pointer hover:text-text-light dark:hover:text-text-dark" @click="sortBy('nome')">
                <div class="flex items-center gap-1">
                  Nome
                  <span v-if="sortField === 'nome'" class="material-icons-outlined text-xs">
                    {{ sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward' }}
                  </span>
                </div>
              </th>
              <th class="table-header">Espécie</th>
              <th class="table-header text-center w-24">Modalidade</th>
              <th class="table-header text-right w-24">Estoque</th>
              <th class="table-header text-center w-24 rounded-tr-lg">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-light dark:divide-border-dark">
            <tr
              v-for="produto in paginatedProdutos"
              :key="produto.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer h-14"
              @click="openModal(produto)"
            >
              <td class="table-cell w-24 font-medium text-primary max-w-[180px] truncate">{{ produto.codigo }}</td>
              <td class="table-cell font-medium max-w-[280px] truncate">{{ produto.nome }}</td>
              <td class="table-cell">
                <div class="flex items-center gap-1.5 flex-nowrap overflow-hidden">
                  <span v-if="produto.is_mix" class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 shrink-0">
                    MIX
                  </span>
                  <template v-if="produto.especies && produto.especies.length > 0">
                    <span
                      v-for="esp in produto.especies.slice(0, 2)"
                      :key="esp.id"
                      class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 shrink-0 truncate max-w-[120px]"
                    >
                      {{ esp.nome }}
                    </span>
                    <span
                      v-if="produto.especies.length > 2"
                      class="text-xs text-subtext-light dark:text-subtext-dark shrink-0"
                    >
                      +{{ produto.especies.length - 2 }}
                    </span>
                  </template>
                  <span v-else class="text-xs text-subtext-light dark:text-subtext-dark">-</span>
                </div>
              </td>
              <td class="table-cell text-center">
                <span :class="[
                  'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                  produto.modalidade === 'vivo'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                ]">
                  {{ produto.modalidade === 'vivo' ? 'Vivo' : 'Cortado' }}
                </span>
              </td>
              <td class="table-cell text-right">
                <div class="flex items-center justify-end gap-2">
                  <span :class="['text-sm font-medium', getEstoqueClassForProduto(produto)]">
                    {{ getEstoqueQtdForProduto(produto) }}
                  </span>
                  <span :class="['inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium', getEstoqueBadgeForProduto(produto)]">
                    {{ getEstoqueLabelForProduto(produto) }}
                  </span>
                </div>
              </td>
              <td class="table-cell text-center">
                <button
                  @click.stop="openModal(produto)"
                  class="text-gray-400 hover:text-primary transition-colors"
                  title="Ver produto"
                >
                  <span class="material-icons-outlined text-sm">visibility</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Cards - Mobile -->
      <div v-if="!loading" class="md:hidden divide-y divide-border-light dark:divide-border-dark">
        <div
          v-for="produto in paginatedProdutos"
          :key="produto.id"
          class="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
          @click="openModal(produto)"
        >
          <div class="flex items-center justify-between gap-3">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <span class="text-xs font-medium text-primary">{{ produto.codigo }}</span>
                <span v-if="produto.is_mix" class="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                  MIX
                </span>
              </div>
              <p class="font-medium text-text-light dark:text-text-dark truncate">{{ produto.nome }}</p>
              <div class="flex items-center gap-2 mt-1">
                <div v-if="produto.especies && produto.especies.length > 0" class="flex items-center gap-1 flex-wrap">
                  <span
                    v-for="esp in produto.especies.slice(0, 2)"
                    :key="esp.id"
                    class="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  >
                    {{ esp.nome }}
                  </span>
                  <span
                    v-if="produto.especies.length > 2"
                    class="text-[10px] text-subtext-light dark:text-subtext-dark"
                  >
                    +{{ produto.especies.length - 2 }}
                  </span>
                </div>
                <span class="text-[10px] text-subtext-light dark:text-subtext-dark">•</span>
                <span :class="['text-xs font-medium', getEstoqueClassForProduto(produto)]">
                  Est: {{ getEstoqueQtdForProduto(produto) }}
                </span>
              </div>
            </div>
            <button
              @click.stop="openModal(produto)"
              class="text-gray-400 hover:text-primary transition-colors shrink-0"
            >
              <span class="material-icons-outlined text-xl">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="!loading && filteredProdutos.length === 0" class="flex flex-col items-center justify-center text-center py-12">
        <span class="material-icons-outlined text-4xl text-gray-300 dark:text-gray-600 mb-2">inventory_2</span>
        <h3 class="text-lg font-medium text-text-light dark:text-text-dark mb-1">Nenhum produto encontrado</h3>
        <p class="text-sm text-subtext-light dark:text-subtext-dark mb-4">Comece cadastrando seu primeiro produto</p>
        <button @click="openModal(null)" class="btn btn-primary">
          <span class="material-icons-outlined text-sm">add</span>
          Novo produto
        </button>
      </div>

      <!-- Paginacao -->
      <div v-if="filteredProdutos.length > 0" class="p-4 flex flex-col sm:flex-row items-center justify-between border-t border-border-light dark:border-border-dark text-xs text-subtext-light dark:text-subtext-dark gap-4">
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2">
            <span>Mostrar</span>
            <select v-model="itemsPerPage" class="border border-border-light dark:border-border-dark rounded px-2 py-1 bg-white dark:bg-gray-800 text-sm">
              <option :value="10">10</option>
              <option :value="25">25</option>
              <option :value="50">50</option>
            </select>
          </div>
          <span>{{ filteredProdutos.length }} registros</span>
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
            class="w-12 text-center border border-border-light dark:border-border-dark rounded px-2 py-1 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
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

    <!-- Modal Unificado (Criar/Editar) -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-200"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="showModal" class="fixed inset-0 z-[60] overflow-y-auto">
          <div class="fixed inset-0 glass-backdrop" @click="closeModal"></div>
          <div class="flex min-h-full items-center justify-center p-4">
            <Transition
              enter-active-class="transition-all duration-200"
              enter-from-class="opacity-0 scale-95"
              enter-to-class="opacity-100 scale-100"
              leave-active-class="transition-all duration-200"
              leave-from-class="opacity-100 scale-100"
              leave-to-class="opacity-0 scale-95"
            >
              <div v-if="showModal" class="relative glass-panel rounded-lg shadow-xl w-full max-w-2xl">
                <!-- Modal Header -->
                <div class="border-b border-border-light dark:border-border-dark px-6 py-4 flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center shrink-0">
                    <span class="material-icons-outlined text-primary text-lg">inventory_2</span>
                  </div>
                  <h2 class="text-lg font-semibold text-text-light dark:text-text-dark flex-1">
                    {{ isEditing ? 'Editar produto' : 'Novo produto' }}
                  </h2>
                  <button @click="closeModal" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <span class="material-icons-outlined">close</span>
                  </button>
                </div>

                <!-- Modal Body -->
                <div class="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                  <!-- Modalidade -->
                  <div>
                    <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Modalidade</label>
                    <div class="flex gap-2">
                      <button
                        type="button"
                        @click="form.modalidade = 'vivo'"
                        :class="[
                          'flex-1 py-2 px-3 rounded-lg text-sm font-medium border-2 transition-all',
                          form.modalidade === 'vivo'
                            ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 dark:border-green-500'
                            : 'border-border-light dark:border-border-dark text-subtext-light dark:text-subtext-dark hover:border-gray-400'
                        ]"
                      >
                        <span class="material-icons-outlined text-sm mr-1">park</span>
                        Vivo
                      </button>
                      <button
                        type="button"
                        @click="form.modalidade = 'cortado'"
                        :class="[
                          'flex-1 py-2 px-3 rounded-lg text-sm font-medium border-2 transition-all',
                          form.modalidade === 'cortado'
                            ? 'border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-500'
                            : 'border-border-light dark:border-border-dark text-subtext-light dark:text-subtext-dark hover:border-gray-400'
                        ]"
                      >
                        <span class="material-icons-outlined text-sm mr-1">content_cut</span>
                        Cortado
                      </button>
                    </div>
                  </div>

                  <!-- Peso da Embalagem (apenas cortado) -->
                  <div v-if="form.modalidade === 'cortado'">
                    <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                      Peso da Embalagem (g) <span class="text-red-500">*</span>
                    </label>
                    <input type="number" step="0.01" v-model.number="form.peso_gramas" class="input" placeholder="Ex: 200" />
                  </div>

                  <!-- Toggle MIX -->
                  <div class="flex items-center justify-between">
                    <div>
                      <label class="text-sm font-medium text-text-light dark:text-text-dark">MIX</label>
                      <p class="text-xs text-subtext-light dark:text-subtext-dark">Composto por múltiplas espécies</p>
                    </div>
                    <button
                      type="button"
                      @click="form.is_mix = !form.is_mix"
                      :class="[
                        'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                        form.is_mix ? 'bg-purple-600' : 'bg-gray-200 dark:bg-gray-700'
                      ]"
                    >
                      <span
                        :class="[
                          'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                          form.is_mix ? 'translate-x-5' : 'translate-x-0'
                        ]"
                      ></span>
                    </button>
                  </div>

                  <!-- Seleção de Espécie (simples) -->
                  <div v-if="!form.is_mix">
                    <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                      Espécie
                    </label>
                    <select v-model="form.especie_ids[0]" class="input">
                      <option :value="undefined">Selecione uma espécie</option>
                      <option v-for="esp in especiesAtivas" :key="esp.id" :value="esp.id">
                        {{ esp.codigo }} - {{ esp.nome }}
                      </option>
                    </select>
                  </div>

                  <!-- Seleção de Espécies (MIX) - Dropdown multiselect -->
                  <div v-if="form.is_mix">
                    <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                      Espécies do MIX
                    </label>
                    <div class="relative" ref="dropdownRef">
                      <button
                        type="button"
                        @click="showEspeciesDropdown = !showEspeciesDropdown"
                        class="input w-full text-left flex items-start justify-between gap-2 !h-auto min-h-[38px] py-2"
                      >
                        <span v-if="form.especie_ids.length === 0" class="text-sm text-gray-400">Selecione as espécies...</span>
                        <div v-else class="flex items-center gap-1 flex-wrap flex-1 min-w-0">
                          <span
                            v-for="id in form.especie_ids"
                            :key="id"
                            class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                          >
                            {{ getEspecieNome(id) }}
                            <button type="button" @click.stop="removeEspecie(id)" class="hover:text-purple-900 dark:hover:text-purple-200">
                              <span class="material-icons-outlined text-xs">close</span>
                            </button>
                          </span>
                        </div>
                        <span class="material-icons-outlined text-sm text-gray-400 shrink-0 mt-0.5">expand_more</span>
                      </button>
                      <div
                        v-if="showEspeciesDropdown"
                        class="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-border-light dark:border-border-dark rounded-lg shadow-lg max-h-48 overflow-y-auto"
                      >
                        <label
                          v-for="esp in especiesAtivas"
                          :key="esp.id"
                          class="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer text-sm"
                        >
                          <input
                            type="checkbox"
                            :value="esp.id"
                            v-model="form.especie_ids"
                            class="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                          <span class="text-text-light dark:text-text-dark">{{ esp.nome }}</span>
                          <span class="text-xs text-subtext-light dark:text-subtext-dark">{{ esp.codigo }}</span>
                        </label>
                        <div v-if="especiesAtivas.length === 0" class="px-3 py-3 text-center text-sm text-subtext-light dark:text-subtext-dark">
                          Nenhuma espécie cadastrada
                        </div>
                      </div>
                    </div>

                    <!-- Percentuais do MIX (cortado) -->
                    <div v-if="form.especie_ids.length > 0 && form.modalidade === 'cortado'" class="mt-3 space-y-2">
                      <p class="text-xs font-medium text-subtext-light dark:text-subtext-dark">Proporção por espécie (deve somar 100%)</p>
                      <div v-for="id in form.especie_ids" :key="'pct-'+id" class="flex items-center gap-2">
                        <span class="text-sm text-text-light dark:text-text-dark flex-1 truncate">{{ getEspecieNome(id) }}</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          :value="form.especie_percentuais[id] || ''"
                          @input="form.especie_percentuais[id] = parseFloat($event.target.value) || 0"
                          class="input w-20 text-center text-sm"
                          placeholder="0"
                        />
                        <span class="text-xs text-subtext-light dark:text-subtext-dark">%</span>
                      </div>
                      <p v-if="mixPercentualTotal !== 100" class="text-xs text-red-500">
                        Total: {{ mixPercentualTotal.toFixed(1) }}% (deve ser 100%)
                      </p>
                      <p v-else class="text-xs text-green-600 dark:text-green-400">Total: 100%</p>
                    </div>
                  </div>

                  <!-- Tipo -->
                  <div>
                    <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                      Tipo
                    </label>
                    <div class="flex gap-2">
                      <select v-model="form.tipo_produto_id" class="input flex-1">
                        <option :value="null">Selecione...</option>
                        <option v-for="tipo in tiposAtivos" :key="tipo.id" :value="tipo.id">
                          {{ tipo.codigo ? `${tipo.codigo} - ${tipo.nome}` : tipo.nome }}
                        </option>
                      </select>
                      <button
                        type="button"
                        @click="openListaTiposModal"
                        class="w-[38px] h-[38px] flex items-center justify-center border border-border-light dark:border-border-dark rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shrink-0"
                        title="Gerenciar tipos"
                      >
                        <span class="material-icons-outlined text-sm text-subtext-light dark:text-subtext-dark">settings</span>
                      </button>
                    </div>
                  </div>

                  <!-- Substrato e Embalagem -->
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                        Substrato
                      </label>
                      <div class="flex gap-2">
                        <select v-model="form.substrato_id" class="input flex-1">
                          <option :value="null">Selecione...</option>
                          <option v-for="sub in substratosAtivos" :key="sub.id" :value="sub.id">
                            {{ sub.nome }} - {{ formatCurrency(sub.valor_unitario) }}
                          </option>
                        </select>
                        <button
                          type="button"
                          @click="openListaSubstratosModal"
                          class="w-[38px] h-[38px] flex items-center justify-center border border-border-light dark:border-border-dark rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shrink-0"
                          title="Gerenciar substratos"
                        >
                          <span class="material-icons-outlined text-sm text-subtext-light dark:text-subtext-dark">settings</span>
                        </button>
                      </div>
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                        Embalagem
                      </label>
                      <div class="flex gap-2">
                        <select v-model="form.embalagem_id" class="input flex-1">
                          <option :value="null">Selecione...</option>
                          <option v-for="emb in embalagensAtivas" :key="emb.id" :value="emb.id">
                            {{ emb.nome }} - {{ formatCurrency(emb.valor_unitario) }}
                          </option>
                        </select>
                        <button
                          type="button"
                          @click="openListaEmbalagensModal"
                          class="w-[38px] h-[38px] flex items-center justify-center border border-border-light dark:border-border-dark rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shrink-0"
                          title="Gerenciar embalagens"
                        >
                          <span class="material-icons-outlined text-sm text-subtext-light dark:text-subtext-dark">settings</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <!-- Codigo e Nome (auto-gerados) -->
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                        Código
                        <span class="text-xs text-subtext-light dark:text-subtext-dark font-normal">(auto)</span>
                      </label>
                      <input type="text" v-model="form.codigo" class="input" placeholder="Gerado automaticamente" />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                        Nome do Produto
                        <span class="text-xs text-subtext-light dark:text-subtext-dark font-normal">(auto)</span>
                      </label>
                      <input type="text" v-model="form.nome" class="input" placeholder="Gerado automaticamente" />
                    </div>
                  </div>


                  <!-- === SEÇÃO ESTOQUE (apenas ao editar) === -->
                  <div v-if="isEditing && form.especie_ids.length > 0" class="border-t border-border-light dark:border-border-dark pt-4">
                    <div class="flex items-center justify-between mb-3">
                      <h3 class="text-sm font-semibold text-text-light dark:text-text-dark flex items-center gap-1.5">
                        <span class="material-icons text-base text-primary">inventory</span>
                        Estoque por Espécie
                      </h3>
                      <button
                        type="button"
                        @click="openMovimentacaoFromModal"
                        class="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1"
                      >
                        <span class="material-icons text-sm">swap_horiz</span>
                        Movimentação
                      </button>
                    </div>

                    <!-- Cards de estoque por espécie -->
                    <div class="space-y-2">
                      <div
                        v-for="especieId in form.especie_ids"
                        :key="'est-' + especieId"
                        class="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                        @click="openEstoqueDetalhe(especieId)"
                      >
                        <div class="flex items-center gap-3 min-w-0">
                          <div class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <span class="material-icons text-primary text-sm">eco</span>
                          </div>
                          <div class="min-w-0">
                            <p class="text-sm font-medium text-text-light dark:text-text-dark truncate">{{ getEspecieNome(especieId) }}</p>
                            <p class="text-xs text-subtext-light dark:text-subtext-dark">{{ getEspecieCodigo(especieId) }}</p>
                          </div>
                        </div>
                        <div class="flex items-center gap-2 shrink-0">
                          <span :class="['text-lg font-bold', getEstoqueClassForEspecie(especieId)]">
                            {{ getEstoqueQtdForEspecie(especieId) }}
                          </span>
                          <span :class="['inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium', getEstoqueBadgeForEspecie(especieId)]">
                            {{ getEstoqueLabelForEspecie(especieId) }}
                          </span>
                          <span class="material-icons text-gray-400 text-sm">chevron_right</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Modal Footer -->
                <div class="border-t border-border-light dark:border-border-dark px-6 py-4 flex items-center gap-3">
                  <!-- Delete + Toggle Status (esquerda) -->
                  <div class="flex items-center gap-2 mr-auto">
                    <button
                      v-if="isEditing"
                      @click="deleteProduto"
                      :disabled="saving"
                      class="btn btn-secondary text-red-600 dark:text-red-400"
                      title="Excluir produto"
                    >
                      <span class="material-icons-outlined text-sm">delete</span>
                      Excluir
                    </button>
                    <button
                      v-if="isEditing"
                      @click="toggleStatus"
                      :disabled="saving"
                      :class="[
                        'btn btn-secondary text-sm',
                        form.ativo
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      ]"
                    >
                      <span class="material-icons-outlined text-sm">
                        {{ form.ativo ? 'block' : 'check_circle' }}
                      </span>
                      {{ form.ativo ? 'Desativar' : 'Ativar' }}
                    </button>
                  </div>

                  <button @click="closeModal" class="btn btn-secondary" :disabled="saving">Cancelar</button>
                  <button @click="saveOrUpdate" :disabled="saving" class="btn btn-primary">
                    <span v-if="saving" class="animate-spin material-icons-outlined text-sm">refresh</span>
                    {{ saving ? 'Salvando...' : (isEditing ? 'Salvar alterações' : 'Salvar produto') }}
                  </button>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Modal de Movimentação de Estoque -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-200"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="showMovimentacaoModal" class="fixed inset-0 z-[70] overflow-y-auto">
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
                      <option v-for="especie in especiesAtivas" :key="especie.id" :value="especie.id">
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

    <!-- Modal de Detalhe do Estoque por Espécie -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-200"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="showEstoqueDetalheModal" class="fixed inset-0 z-[70] overflow-y-auto">
          <div class="fixed inset-0 glass-backdrop" @click="closeEstoqueDetalhe"></div>
          <div class="flex min-h-full items-center justify-center p-4">
            <Transition
              enter-active-class="transition-all duration-200"
              enter-from-class="opacity-0 scale-95"
              enter-to-class="opacity-100 scale-100"
              leave-active-class="transition-all duration-200"
              leave-from-class="opacity-100 scale-100"
              leave-to-class="opacity-0 scale-95"
            >
              <div v-if="showEstoqueDetalheModal && selectedEstoque" class="relative glass-panel rounded-lg shadow-xl w-full max-w-lg">
                <!-- Modal Header -->
                <div class="border-b border-border-light dark:border-border-dark px-6 py-4 flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <span class="material-icons text-primary text-xl">inventory_2</span>
                  </div>
                  <div class="flex-1 min-w-0">
                    <h2 class="text-lg font-semibold text-text-light dark:text-text-dark truncate">
                      {{ selectedEstoque.especies?.nome || 'N/A' }}
                    </h2>
                    <p class="text-xs text-subtext-light dark:text-subtext-dark">
                      {{ selectedEstoque.especies?.codigo || '-' }}
                    </p>
                  </div>
                  <button @click="closeEstoqueDetalhe" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <span class="material-icons">close</span>
                  </button>
                </div>

                <!-- Modal Body -->
                <div class="p-6 space-y-5 max-h-[65vh] overflow-y-auto">
                  <!-- Cards de Status -->
                  <div class="grid grid-cols-2 gap-3">
                    <div class="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                      <p class="text-xs text-subtext-light dark:text-subtext-dark mb-1">Quantidade Atual</p>
                      <p :class="['text-2xl font-bold', getQuantidadeClass(selectedEstoque)]">{{ selectedEstoque.quantidade || 0 }}</p>
                      <span :class="['badge mt-2', getEstoqueStatusClass(selectedEstoque)]">
                        {{ getEstoqueStatusLabel(selectedEstoque) }}
                      </span>
                    </div>
                    <div class="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                      <p class="text-xs text-subtext-light dark:text-subtext-dark mb-1">Estoque Mínimo</p>
                      <input
                        type="number"
                        v-model.number="estoqueMinimo"
                        class="text-2xl font-bold bg-transparent border-none p-0 w-full text-text-light dark:text-text-dark focus:outline-none focus:ring-0"
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
                      <h3 class="text-sm font-semibold text-text-light dark:text-text-dark">Movimentações</h3>
                      <!-- Filtro de Range de Data -->
                      <div class="flex flex-wrap items-center gap-2">
                        <div class="flex items-center gap-2">
                          <label class="text-xs text-subtext-light dark:text-subtext-dark">De:</label>
                          <input type="date" v-model="filterDataInicio" class="input text-xs py-1 px-2" />
                        </div>
                        <div class="flex items-center gap-2">
                          <label class="text-xs text-subtext-light dark:text-subtext-dark">Até:</label>
                          <input type="date" v-model="filterDataFim" class="input text-xs py-1 px-2" />
                        </div>
                        <button @click="aplicarFiltroData" class="btn btn-secondary text-xs py-1 px-2">
                          <span class="material-icons text-sm">filter_alt</span>
                          Filtrar
                        </button>
                        <button v-if="filterDataInicio || filterDataFim" @click="limparFiltroData" class="btn btn-secondary text-xs py-1 px-2">
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
                        @click="openDetalhesMovModal(mov)"
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
                                <p class="text-sm font-medium text-text-light dark:text-text-dark">
                                  {{ mov.tipo === 'entrada' ? 'Entrada' : 'Saída' }}
                                </p>
                                <span v-if="mov.cancelado" class="badge badge-inactive text-xs">Cancelado</span>
                              </div>
                              <p class="text-xs text-subtext-light dark:text-subtext-dark">
                                {{ mov.motivo || 'Sem motivo' }} <span v-if="mov.usuario_nome">• {{ mov.usuario_nome }}</span>
                              </p>
                              <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                {{ formatDateTime(mov.created_at) }}
                              </p>
                            </div>
                          </div>
                          <span :class="[
                            'font-semibold shrink-0',
                            mov.cancelado ? 'text-gray-400 line-through' : mov.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'
                          ]">
                            {{ mov.tipo === 'entrada' ? '+' : '-' }}{{ mov.quantidade }}
                          </span>
                        </div>
                      </div>

                      <!-- Paginacao Movimentações -->
                      <div v-if="totalPagesMovimentacoes > 1" class="flex items-center justify-between pt-4 border-t border-border-light dark:border-border-dark">
                        <span class="text-xs text-subtext-light dark:text-subtext-dark">{{ movimentacoes.length }} movimentações</span>
                        <div class="flex items-center gap-2">
                          <button
                            @click="currentPageMovimentacoes--"
                            :disabled="currentPageMovimentacoes === 1"
                            class="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                          >
                            <span class="material-icons text-sm">chevron_left</span>
                          </button>
                          <span class="text-xs text-subtext-light dark:text-subtext-dark">{{ currentPageMovimentacoes }} / {{ totalPagesMovimentacoes }}</span>
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
                      <p class="text-sm text-subtext-light dark:text-subtext-dark">Nenhuma movimentação</p>
                    </div>
                  </div>
                </div>

                <!-- Footer -->
                <div class="border-t border-border-light dark:border-border-dark px-6 py-4">
                  <button @click="openMovimentacaoForEspecie()" class="w-full btn btn-primary justify-center">
                    <span class="material-icons text-sm">swap_horiz</span>
                    Nova Movimentação
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
        <div v-if="showDetalhesMovModal" class="fixed inset-0 z-[80] overflow-y-auto">
          <div class="fixed inset-0 glass-backdrop" @click="closeDetalhesMovModal"></div>
          <div class="flex min-h-full items-center justify-center p-4">
            <Transition
              enter-active-class="transition-all duration-200"
              enter-from-class="opacity-0 scale-95"
              enter-to-class="opacity-100 scale-100"
              leave-active-class="transition-all duration-200"
              leave-from-class="opacity-100 scale-100"
              leave-to-class="opacity-0 scale-95"
            >
              <div v-if="showDetalhesMovModal && selectedMovimentacao" class="relative glass-panel rounded-lg shadow-xl w-full max-w-md">
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
                  <button @click="closeDetalhesMovModal" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
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
                  <button @click="closeDetalhesMovModal" class="btn btn-secondary">Fechar</button>
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

    <!-- Modal Lista Tipos -->
    <Teleport to="body">
      <ModalListaTiposProduto
        v-if="showListaTiposModal"
        :tipos="tiposProduto"
        @close="closeListaTiposModal"
        @novo-tipo="openTipoModal(null)"
        @editar-tipo="openTipoModal"
      />
    </Teleport>

    <!-- Modal Tipo Produto (criar/editar) -->
    <Teleport to="body">
      <ModalTipoProduto
        v-if="showTipoModal"
        :tipo="editingTipo"
        @close="closeTipoModal"
        @save="saveTipo"
      />
    </Teleport>

    <!-- Modal Lista Substratos -->
    <Teleport to="body">
      <ModalListaSubstratos
        v-if="showListaSubstratosModal"
        :substratos="substratos"
        @close="closeListaSubstratosModal"
        @novo-substrato="openSubstratoModal(null)"
        @editar-substrato="openSubstratoModal"
      />
    </Teleport>

    <!-- Modal Substrato (criar/editar) -->
    <Teleport to="body">
      <ModalSubstrato
        v-if="showSubstratoModal"
        :substrato="editingSubstrato"
        @close="closeSubstratoModal"
        @save="saveSubstrato"
      />
    </Teleport>

    <!-- Modal Lista Embalagens -->
    <Teleport to="body">
      <ModalListaEmbalagens
        v-if="showListaEmbalagensModal"
        :embalagens="embalagens"
        @close="closeListaEmbalagensModal"
        @nova-embalagem="openEmbalagemModal(null)"
        @editar-embalagem="openEmbalagemModal"
      />
    </Teleport>

    <!-- Modal Embalagem (criar/editar) -->
    <Teleport to="body">
      <ModalEmbalagem
        v-if="showEmbalagemModal"
        :embalagem="editingEmbalagem"
        @close="closeEmbalagemModal"
        @save="saveEmbalagem"
      />
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useCurrentCompany } from '~/composables/useCurrentCompany'
import { useToast } from '~/composables/useToast'

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const { currentCompany } = useCurrentCompany()
const { success, error: showError } = useToast()

// === ESTADO - PRODUTOS ===
const loading = ref(false)
const saving = ref(false)
const produtos = ref([])
const especies = ref([])
const tiposProduto = ref([])
const substratos = ref([])
const embalagens = ref([])

// Modal unificado
const showModal = ref(false)

// Modais auxiliares - Tipos
const showListaTiposModal = ref(false)
const showTipoModal = ref(false)
const editingTipo = ref(null)

// Modais auxiliares - Substratos
const showListaSubstratosModal = ref(false)
const showSubstratoModal = ref(false)
const editingSubstrato = ref(null)

// Modais auxiliares - Embalagens
const showListaEmbalagensModal = ref(false)
const showEmbalagemModal = ref(false)
const editingEmbalagem = ref(null)

// Dropdown multiselect espécies
const showEspeciesDropdown = ref(false)
const dropdownRef = ref(null)

// Paginacao
const currentPage = ref(1)
const itemsPerPage = ref(10)
const pageInput = ref('1')

// Filtros
const searchQuery = ref('')

// Ordenacao (default: mais recentes primeiro)
const sortField = ref('created_at')
const sortDirection = ref('desc')

// === ESTADO - ESTOQUE ===
const estoqueData = ref([])
const movimentacoes = ref([])
const loadingMovimentacoes = ref(false)

// Modais estoque
const showMovimentacaoModal = ref(false)
const showEstoqueDetalheModal = ref(false)
const showDetalhesMovModal = ref(false)
const selectedEstoque = ref(null)
const selectedMovimentacao = ref(null)

// Formulario movimentação
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

// Filtros movimentacoes
const filterDataInicio = ref('')
const filterDataFim = ref('')

// Paginacao Movimentacoes
const currentPageMovimentacoes = ref(1)
const itemsPerPageMovimentacoes = 10

// Form unificado
const getEmptyForm = () => ({
  id: null,
  codigo: '',
  nome: '',
  tipo_produto_id: null,
  substrato_id: null,
  embalagem_id: null,
  is_mix: false,
  especie_ids: [],
  modalidade: 'cortado',
  peso_gramas: null,
  especie_percentuais: {},
  ativo: true
})

const form = ref(getEmptyForm())

const isEditing = computed(() => !!form.value.id)

// === COMPUTED ===

// Validacao movimentacao
const isMovimentacaoValid = computed(() => {
  return movimentacao.value.especie_id && movimentacao.value.quantidade > 0
})

// Percentuais MIX
const mixPercentualTotal = computed(() => {
  return (form.value.especie_ids || []).reduce((sum, id) => sum + (form.value.especie_percentuais?.[id] || 0), 0)
})

// Especies ativas
const especiesAtivas = computed(() => {
  return especies.value.filter(e => e.ativo)
})

// Tipos ativos
const tiposAtivos = computed(() => {
  return tiposProduto.value.filter(t => t.ativo)
})

// Substratos ativos
const substratosAtivos = computed(() => {
  return substratos.value.filter(s => s.ativo)
})

// Embalagens ativas
const embalagensAtivas = computed(() => {
  return embalagens.value.filter(e => e.ativo)
})

// Filtros produtos
const filteredProdutos = computed(() => {
  let result = produtos.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(p =>
      p.codigo?.toLowerCase().includes(query) ||
      p.nome?.toLowerCase().includes(query)
    )
  }

  result = [...result].sort((a, b) => {
    let comparison = 0
    if (sortField.value === 'codigo') {
      comparison = (a.codigo || '').localeCompare(b.codigo || '')
    } else if (sortField.value === 'nome') {
      comparison = (a.nome || '').localeCompare(b.nome || '')
    } else if (sortField.value === 'created_at') {
      comparison = new Date(a.created_at || 0) - new Date(b.created_at || 0)
    }
    return sortDirection.value === 'asc' ? comparison : -comparison
  })

  return result
})

const totalPages = computed(() => {
  return Math.ceil(filteredProdutos.value.length / itemsPerPage.value) || 1
})

const paginatedProdutos = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredProdutos.value.slice(start, end)
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

// === HELPERS ===

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
}

function formatDateTime(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString('pt-BR')
}

function getTipoNome(tipoId) {
  if (!tipoId) return '-'
  const tipo = tiposProduto.value.find(t => t.id === tipoId)
  return tipo?.nome || '-'
}

function getTipoCodigo(tipoId) {
  if (!tipoId) return ''
  const tipo = tiposProduto.value.find(t => t.id === tipoId)
  return tipo?.codigo || ''
}

function getSubstratoNome(substratoId) {
  if (!substratoId) return '-'
  const sub = substratos.value.find(s => s.id === substratoId)
  return sub?.nome || '-'
}

function getEmbalagemNome(embalagemId) {
  if (!embalagemId) return '-'
  const emb = embalagens.value.find(e => e.id === embalagemId)
  return emb?.nome || '-'
}

function getEspecieNome(especieId) {
  const esp = especies.value.find(e => e.id === especieId)
  return esp?.nome || '-'
}

function getEspecieCodigo(especieId) {
  const esp = especies.value.find(e => e.id === especieId)
  return esp?.codigo || '-'
}

function getEspecie(especieId) {
  return especies.value.find(e => e.id === especieId)
}

function removeEspecie(id) {
  form.value.especie_ids = form.value.especie_ids.filter(eid => eid !== id)
}

// === ESTOQUE HELPERS ===

function getEstoqueForEspecie(especieId) {
  return estoqueData.value.find(e => e.especie_id === especieId)
}

function getEstoqueQtdForEspecie(especieId) {
  const est = getEstoqueForEspecie(especieId)
  return est?.quantidade || 0
}

function getEstoqueClassForEspecie(especieId) {
  const est = getEstoqueForEspecie(especieId)
  if (!est || est.quantidade <= 0) return 'text-red-600'
  if (est.quantidade <= (est.estoque_minimo || 0)) return 'text-yellow-600'
  return 'text-text-light dark:text-text-dark'
}

function getEstoqueLabelForEspecie(especieId) {
  const est = getEstoqueForEspecie(especieId)
  if (!est || est.quantidade <= 0) return 'Esgotado'
  if (est.quantidade <= (est.estoque_minimo || 0)) return 'Baixo'
  return 'Normal'
}

function getEstoqueBadgeForEspecie(especieId) {
  const est = getEstoqueForEspecie(especieId)
  if (!est || est.quantidade <= 0) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
  if (est.quantidade <= (est.estoque_minimo || 0)) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
  return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
}

// Estoque para produto (agrega espécies)
function getEstoqueQtdForProduto(produto) {
  const especieIds = (produto.especies || []).map(e => e.id)
  if (especieIds.length === 0) return '-'
  if (especieIds.length === 1) return getEstoqueQtdForEspecie(especieIds[0])
  // MIX: mostrar menor estoque entre as espécies
  const qtds = especieIds.map(id => getEstoqueQtdForEspecie(id))
  return Math.min(...qtds)
}

function getEstoqueClassForProduto(produto) {
  const especieIds = (produto.especies || []).map(e => e.id)
  if (especieIds.length === 0) return 'text-subtext-light dark:text-subtext-dark'
  if (especieIds.length === 1) return getEstoqueClassForEspecie(especieIds[0])
  // MIX: pior status
  const hasEsgotado = especieIds.some(id => {
    const est = getEstoqueForEspecie(id)
    return !est || est.quantidade <= 0
  })
  if (hasEsgotado) return 'text-red-600'
  const hasBaixo = especieIds.some(id => {
    const est = getEstoqueForEspecie(id)
    return est && est.quantidade <= (est.estoque_minimo || 0)
  })
  if (hasBaixo) return 'text-yellow-600'
  return 'text-text-light dark:text-text-dark'
}

function getEstoqueLabelForProduto(produto) {
  const especieIds = (produto.especies || []).map(e => e.id)
  if (especieIds.length === 0) return '-'
  if (especieIds.length === 1) return getEstoqueLabelForEspecie(especieIds[0])
  const hasEsgotado = especieIds.some(id => {
    const est = getEstoqueForEspecie(id)
    return !est || est.quantidade <= 0
  })
  if (hasEsgotado) return 'Esgotado'
  const hasBaixo = especieIds.some(id => {
    const est = getEstoqueForEspecie(id)
    return est && est.quantidade <= (est.estoque_minimo || 0)
  })
  if (hasBaixo) return 'Baixo'
  return 'Normal'
}

function getEstoqueBadgeForProduto(produto) {
  const label = getEstoqueLabelForProduto(produto)
  if (label === 'Esgotado') return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
  if (label === 'Baixo') return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
  if (label === 'Normal') return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
  return 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
}

// Helpers para detalhe estoque
function getQuantidadeClass(item) {
  if (item.quantidade <= 0) return 'text-red-600'
  if (item.quantidade <= (item.estoque_minimo || 0)) return 'text-yellow-600'
  return 'text-text-light dark:text-text-dark'
}

function getEstoqueStatusLabel(item) {
  if (item.quantidade <= 0) return 'Esgotado'
  if (item.quantidade <= (item.estoque_minimo || 0)) return 'Baixo'
  return 'Normal'
}

function getEstoqueStatusClass(item) {
  if (item.quantidade <= 0) return 'badge-inactive'
  if (item.quantidade <= (item.estoque_minimo || 0)) return 'badge-warning'
  return 'badge-success'
}

// === AUTO-GERAÇÃO DE NOME E CÓDIGO ===

function generateAutoNome(produtoData) {
  const especieIds = (produtoData.especie_ids || []).filter(id => id)
  const tipoNome = getTipoNome(produtoData.tipo_produto_id)
  const tipoStr = tipoNome !== '-' ? tipoNome : ''

  if (produtoData.is_mix && especieIds.length > 0) {
    const nomes = especieIds.map(id => getEspecieNome(id)).filter(n => n !== '-')
    const especiesStr = nomes.join('/')
    return ['MIX', especiesStr, tipoStr].filter(Boolean).join(' ')
  } else if (especieIds.length > 0) {
    const especieNome = getEspecieNome(especieIds[0])
    return [especieNome !== '-' ? especieNome : '', tipoStr].filter(Boolean).join(' ')
  }

  return tipoStr || ''
}

function generateAutoCodigo(produtoData) {
  const especieIds = (produtoData.especie_ids || []).filter(id => id)
  const tipoCodigo = getTipoCodigo(produtoData.tipo_produto_id)

  if (produtoData.is_mix && especieIds.length > 0) {
    const prefixes = especieIds.map(id => {
      const esp = getEspecie(id)
      return esp ? esp.codigo || esp.nome.substring(0, 3).toUpperCase() : ''
    }).filter(Boolean)
    const base = 'MIX-' + prefixes.join('-')
    return tipoCodigo ? `${base}-${tipoCodigo}` : base
  } else if (especieIds.length > 0) {
    const esp = getEspecie(especieIds[0])
    const especieCodigo = esp ? (esp.codigo || esp.nome.substring(0, 3).toUpperCase()) : ''
    return tipoCodigo ? `${especieCodigo}-${tipoCodigo}` : especieCodigo
  }

  return tipoCodigo || ''
}

// Fechar dropdown ao clicar fora
function handleClickOutside(e) {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target)) {
    showEspeciesDropdown.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})

// === CARREGAMENTO ===

async function loadEspecies() {
  if (!currentCompany.value?.id) return

  try {
    const { data, error } = await supabase
      .from('especies')
      .select('id, codigo, nome, imagem_url, ativo')
      .eq('empresa_id', currentCompany.value.id)
      .order('nome')

    if (error) throw error
    especies.value = data || []
  } catch (e) {
    console.error('Erro ao carregar espécies:', e)
  }
}

async function loadTiposProduto() {
  if (!currentCompany.value?.id) return

  try {
    const { data, error } = await supabase
      .from('tipos_produto')
      .select('*')
      .eq('empresa_id', currentCompany.value.id)
      .order('nome')

    if (error) throw error
    tiposProduto.value = data || []
  } catch (e) {
    console.error('Erro ao carregar tipos de produto:', e)
  }
}

async function loadSubstratos() {
  if (!currentCompany.value?.id) return

  try {
    const { data, error } = await supabase
      .from('substratos')
      .select('*')
      .eq('empresa_id', currentCompany.value.id)
      .order('nome')

    if (error) throw error
    substratos.value = data || []
  } catch (e) {
    console.error('Erro ao carregar substratos:', e)
  }
}

async function loadEmbalagens() {
  if (!currentCompany.value?.id) return

  try {
    const { data, error } = await supabase
      .from('embalagens')
      .select('*')
      .eq('empresa_id', currentCompany.value.id)
      .order('nome')

    if (error) throw error
    embalagens.value = data || []
  } catch (e) {
    console.error('Erro ao carregar embalagens:', e)
  }
}

async function loadProdutos() {
  if (!currentCompany.value?.id) return

  loading.value = true
  try {
    const { data, error } = await supabase
      .from('produtos')
      .select('*, produto_especies(especie_id, especies(id, codigo, nome, imagem_url))')
      .eq('empresa_id', currentCompany.value.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    produtos.value = (data || []).map(p => ({
      ...p,
      especies: (p.produto_especies || []).map(pe => pe.especies).filter(Boolean)
    }))
  } catch (e) {
    console.error('Erro ao carregar produtos:', e)
    showError('Erro ao carregar produtos')
  } finally {
    loading.value = false
  }
}

async function loadEstoque() {
  if (!currentCompany.value?.id) return

  try {
    const { data: estData, error: estError } = await supabase
      .from('estoque')
      .select(`
        *,
        especies:especie_id (id, codigo, nome)
      `)
      .eq('empresa_id', currentCompany.value.id)

    if (estError) throw estError

    // Buscar todas as espécies ativas
    const especiesAtiv = especies.value.filter(e => e.ativo)

    // Criar mapa de estoque por espécie
    const estoqueEspecieMap = new Map(
      (estData || []).filter(e => e.especie_id && !e.produto_id).map(e => [e.especie_id, e])
    )

    // Criar lista combinada - todas as espécies com estoque
    const combined = especiesAtiv.map(especie => {
      const estoqueExistente = estoqueEspecieMap.get(especie.id)
      if (estoqueExistente) return estoqueExistente
      return {
        id: `virtual_especie_${especie.id}`,
        empresa_id: currentCompany.value.id,
        especie_id: especie.id,
        quantidade: 0,
        estoque_minimo: 0,
        especies: especie
      }
    })

    estoqueData.value = combined
  } catch (e) {
    console.error('Erro ao carregar estoque:', e)
  }
}

async function loadMovimentacoes(especieId) {
  if (!currentCompany.value?.id || !especieId) return

  loadingMovimentacoes.value = true
  currentPageMovimentacoes.value = 1

  try {
    let query = supabase
      .from('movimentacoes_estoque')
      .select('*')
      .eq('empresa_id', currentCompany.value.id)
      .eq('especie_id', especieId)
      .order('created_at', { ascending: false })

    if (filterDataInicio.value) {
      query = query.gte('created_at', `${filterDataInicio.value}T00:00:00`)
    }
    if (filterDataFim.value) {
      query = query.lte('created_at', `${filterDataFim.value}T23:59:59`)
    }

    const { data, error } = await query.limit(100)

    if (error) throw error

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
  } catch (e) {
    console.error('Erro ao carregar movimentações:', e)
  } finally {
    loadingMovimentacoes.value = false
  }
}

// === ORDENACAO ===

function sortBy(field) {
  if (sortField.value === field) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortDirection.value = 'asc'
  }
}

// === MODAL PRODUTO ===

async function openModal(produto) {
  showEspeciesDropdown.value = false

  if (produto) {
    const especieIds = (produto.especies || []).map(e => e.id)

    const especie_percentuais = {}
    if (produto.is_mix && especieIds.length > 0) {
      const { data: rels } = await supabase
        .from('produto_especies')
        .select('especie_id, percentual')
        .eq('produto_id', produto.id)
      if (rels) {
        rels.forEach(r => {
          if (r.percentual) especie_percentuais[r.especie_id] = r.percentual
        })
      }
    }

    form.value = {
      ...produto,
      is_mix: produto.is_mix || false,
      tipo_produto_id: produto.tipo_produto_id || null,
      substrato_id: produto.substrato_id || null,
      embalagem_id: produto.embalagem_id || null,
      especie_ids: especieIds,
      modalidade: produto.modalidade || 'cortado',
      peso_gramas: produto.peso_gramas || null,
      especie_percentuais,
      ativo: produto.ativo !== false
    }
  } else {
    form.value = getEmptyForm()
  }

  showModal.value = true
}

function closeModal() {
  showModal.value = false
  showEspeciesDropdown.value = false
}

async function saveOrUpdate() {
  if (!currentCompany.value?.id) {
    showError('Nenhuma empresa selecionada')
    return
  }

  saving.value = true
  try {
    const especieIds = (form.value.especie_ids || []).filter(id => id)

    if (isEditing.value) {
      const { error: updateError } = await supabase
        .from('produtos')
        .update({
          codigo: form.value.codigo || null,
          nome: form.value.nome || null,
          tipo_produto_id: form.value.tipo_produto_id || null,
          substrato_id: form.value.substrato_id || null,
          embalagem_id: form.value.embalagem_id || null,
          is_mix: form.value.is_mix,
          especie_id: !form.value.is_mix && especieIds.length > 0 ? especieIds[0] : null,
          modalidade: form.value.modalidade,
          peso_gramas: form.value.modalidade === 'cortado' ? (form.value.peso_gramas || null) : null,
          ativo: form.value.ativo
        })
        .eq('id', form.value.id)

      if (updateError) throw updateError

      const { error: deleteError } = await supabase
        .from('produto_especies')
        .delete()
        .eq('produto_id', form.value.id)

      if (deleteError) throw deleteError

      if (especieIds.length > 0) {
        const { error: relError } = await supabase
          .from('produto_especies')
          .insert(especieIds.map(especieId => ({
            produto_id: form.value.id,
            especie_id: especieId,
            percentual: form.value.is_mix && form.value.modalidade === 'cortado'
              ? (form.value.especie_percentuais?.[especieId] || null)
              : null
          })))

        if (relError) throw relError
      }

      success('Produto atualizado com sucesso')
    } else {
      const { data: produtoData, error: produtoError } = await supabase
        .from('produtos')
        .insert({
          empresa_id: currentCompany.value.id,
          codigo: form.value.codigo || null,
          nome: form.value.nome || null,
          tipo_produto_id: form.value.tipo_produto_id || null,
          substrato_id: form.value.substrato_id || null,
          embalagem_id: form.value.embalagem_id || null,
          is_mix: form.value.is_mix,
          especie_id: !form.value.is_mix && especieIds.length > 0 ? especieIds[0] : null,
          modalidade: form.value.modalidade,
          peso_gramas: form.value.modalidade === 'cortado' ? (form.value.peso_gramas || null) : null
        })
        .select('id')
        .single()

      if (produtoError) throw produtoError

      if (especieIds.length > 0) {
        const { error: relError } = await supabase
          .from('produto_especies')
          .insert(especieIds.map(especieId => ({
            produto_id: produtoData.id,
            especie_id: especieId,
            percentual: form.value.is_mix && form.value.modalidade === 'cortado'
              ? (form.value.especie_percentuais?.[especieId] || null)
              : null
          })))

        if (relError) throw relError
      }

      success('Produto criado com sucesso')
      currentPage.value = 1
      pageInput.value = '1'
    }

    closeModal()
    await loadProdutos()
  } catch (e) {
    console.error('Erro ao salvar produto:', e)
    showError(e.message || 'Erro ao salvar produto')
  } finally {
    saving.value = false
  }
}

async function toggleStatus() {
  if (!form.value.id) return
  const newStatus = !form.value.ativo
  const label = newStatus ? 'ativar' : 'desativar'

  if (!confirm(`Tem certeza que deseja ${label} este produto?`)) return

  saving.value = true
  try {
    const { error } = await supabase
      .from('produtos')
      .update({ ativo: newStatus })
      .eq('id', form.value.id)

    if (error) throw error

    success(`Produto ${newStatus ? 'ativado' : 'desativado'} com sucesso`)
    closeModal()
    await loadProdutos()
  } catch (e) {
    console.error('Erro ao alterar status:', e)
    showError(e.message || 'Erro ao alterar status')
  } finally {
    saving.value = false
  }
}

async function deleteProduto() {
  if (!form.value.id) return

  if (!confirm('Tem certeza que deseja excluir este produto?')) return

  saving.value = true
  try {
    const { error: relError } = await supabase
      .from('produto_especies')
      .delete()
      .eq('produto_id', form.value.id)

    if (relError) throw relError

    const { error } = await supabase
      .from('produtos')
      .delete()
      .eq('id', form.value.id)

    if (error) throw error

    success('Produto excluído com sucesso')
    closeModal()
    await loadProdutos()
  } catch (e) {
    console.error('Erro ao excluir produto:', e)
    showError(e.message || 'Erro ao excluir produto')
  } finally {
    saving.value = false
  }
}

// === MODAIS ESTOQUE ===

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

function openMovimentacaoFromModal() {
  // Abre movimentação pré-selecionando a primeira espécie do produto
  const especieId = form.value.especie_ids.length === 1 ? form.value.especie_ids[0] : ''
  movimentacao.value = {
    especie_id: especieId,
    tipo: 'entrada',
    quantidade: 0,
    motivo: '',
    observacoes: ''
  }
  showMovimentacaoModal.value = true
}

function openMovimentacaoForEspecie() {
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

function openEstoqueDetalhe(especieId) {
  const est = getEstoqueForEspecie(especieId)
  if (est) {
    selectedEstoque.value = est
  } else {
    // Criar virtual
    const esp = getEspecie(especieId)
    selectedEstoque.value = {
      id: `virtual_especie_${especieId}`,
      empresa_id: currentCompany.value?.id,
      especie_id: especieId,
      quantidade: 0,
      estoque_minimo: 0,
      especies: esp ? { id: esp.id, codigo: esp.codigo, nome: esp.nome } : null
    }
  }
  estoqueMinimo.value = selectedEstoque.value.estoque_minimo || 0
  filterDataInicio.value = ''
  filterDataFim.value = ''
  showEstoqueDetalheModal.value = true
  loadMovimentacoes(especieId)
}

function closeEstoqueDetalhe() {
  showEstoqueDetalheModal.value = false
  selectedEstoque.value = null
  movimentacoes.value = []
}

function openDetalhesMovModal(mov) {
  selectedMovimentacao.value = mov
  motivoCancelamento.value = ''
  showDetalhesMovModal.value = true
}

function closeDetalhesMovModal() {
  showDetalhesMovModal.value = false
  selectedMovimentacao.value = null
  motivoCancelamento.value = ''
}

// === CRUD ESTOQUE ===

async function saveMovimentacao() {
  if (!currentCompany.value?.id) return

  saving.value = true
  try {
    const userId = user.value?.id

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

    const estoqueAtual = estoqueData.value.find(e => e.especie_id === movimentacao.value.especie_id)
    const quantidadeAtual = estoqueAtual?.quantidade || 0
    const novaQuantidade = movimentacao.value.tipo === 'entrada'
      ? quantidadeAtual + movimentacao.value.quantidade
      : quantidadeAtual - movimentacao.value.quantidade

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
    await loadEstoque()

    // Atualizar detalhe se aberto
    if (selectedEstoque.value?.especie_id === movimentacao.value.especie_id) {
      loadMovimentacoes(movimentacao.value.especie_id)
      selectedEstoque.value.quantidade = novaQuantidade
    }
  } catch (e) {
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
    closeDetalhesMovModal()
    loadMovimentacoes(selectedEstoque.value.especie_id)
    loadEstoque()
  } catch (e) {
    showError('Erro ao cancelar movimentação: ' + e.message)
  } finally {
    saving.value = false
  }
}

async function saveEstoqueMinimo() {
  if (!currentCompany.value?.id || !selectedEstoque.value) return

  try {
    const isVirtual = selectedEstoque.value.id.startsWith('virtual_')

    if (isVirtual) {
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

      if (data) {
        selectedEstoque.value.id = data.id
      }
    } else {
      const { error } = await supabase
        .from('estoque')
        .update({ estoque_minimo: estoqueMinimo.value })
        .eq('id', selectedEstoque.value.id)
        .eq('empresa_id', currentCompany.value.id)

      if (error) throw error
    }

    success('Estoque mínimo atualizado')
    selectedEstoque.value.estoque_minimo = estoqueMinimo.value
    loadEstoque()
  } catch (e) {
    showError('Erro ao atualizar estoque mínimo: ' + e.message)
  }
}

// Filtro de data movimentacoes
function aplicarFiltroData() {
  if (selectedEstoque.value) {
    loadMovimentacoes(selectedEstoque.value.especie_id)
  }
}

function limparFiltroData() {
  filterDataInicio.value = ''
  filterDataFim.value = ''
  if (selectedEstoque.value) {
    loadMovimentacoes(selectedEstoque.value.especie_id)
  }
}

// === TIPOS PRODUTO ===

function openListaTiposModal() {
  showListaTiposModal.value = true
}

function closeListaTiposModal() {
  showListaTiposModal.value = false
}

function openTipoModal(tipo) {
  editingTipo.value = tipo
  showTipoModal.value = true
}

function closeTipoModal() {
  showTipoModal.value = false
  editingTipo.value = null
}

async function saveTipo(data) {
  if (!currentCompany.value?.id) return

  try {
    if (data.id) {
      const { error } = await supabase
        .from('tipos_produto')
        .update({ nome: data.nome, codigo: data.codigo })
        .eq('id', data.id)

      if (error) throw error
      success('Tipo atualizado com sucesso')
    } else {
      const { error } = await supabase
        .from('tipos_produto')
        .insert({
          empresa_id: currentCompany.value.id,
          nome: data.nome,
          codigo: data.codigo
        })

      if (error) throw error
      success('Tipo criado com sucesso')
    }

    closeTipoModal()
    await loadTiposProduto()
  } catch (e) {
    console.error('Erro ao salvar tipo:', e)
    showError(e.message || 'Erro ao salvar tipo')
  }
}

// === SUBSTRATOS ===

function openListaSubstratosModal() {
  showListaSubstratosModal.value = true
}

function closeListaSubstratosModal() {
  showListaSubstratosModal.value = false
}

function openSubstratoModal(substrato) {
  editingSubstrato.value = substrato
  showSubstratoModal.value = true
}

function closeSubstratoModal() {
  showSubstratoModal.value = false
  editingSubstrato.value = null
}

async function saveSubstrato(data) {
  if (!currentCompany.value?.id) return

  try {
    if (data.id) {
      const { error } = await supabase
        .from('substratos')
        .update({ nome: data.nome, valor_unitario: data.valor_unitario })
        .eq('id', data.id)

      if (error) throw error
      success('Substrato atualizado com sucesso')
    } else {
      const { error } = await supabase
        .from('substratos')
        .insert({
          empresa_id: currentCompany.value.id,
          nome: data.nome,
          valor_unitario: data.valor_unitario
        })

      if (error) throw error
      success('Substrato criado com sucesso')
    }

    closeSubstratoModal()
    await loadSubstratos()
  } catch (e) {
    console.error('Erro ao salvar substrato:', e)
    showError(e.message || 'Erro ao salvar substrato')
  }
}

// === EMBALAGENS ===

function openListaEmbalagensModal() {
  showListaEmbalagensModal.value = true
}

function closeListaEmbalagensModal() {
  showListaEmbalagensModal.value = false
}

function openEmbalagemModal(embalagem) {
  editingEmbalagem.value = embalagem
  showEmbalagemModal.value = true
}

function closeEmbalagemModal() {
  showEmbalagemModal.value = false
  editingEmbalagem.value = null
}

async function saveEmbalagem(data) {
  if (!currentCompany.value?.id) return

  try {
    if (data.id) {
      const { error } = await supabase
        .from('embalagens')
        .update({ nome: data.nome, valor_unitario: data.valor_unitario })
        .eq('id', data.id)

      if (error) throw error
      success('Embalagem atualizada com sucesso')
    } else {
      const { error } = await supabase
        .from('embalagens')
        .insert({
          empresa_id: currentCompany.value.id,
          nome: data.nome,
          valor_unitario: data.valor_unitario
        })

      if (error) throw error
      success('Embalagem criada com sucesso')
    }

    closeEmbalagemModal()
    await loadEmbalagens()
  } catch (e) {
    console.error('Erro ao salvar embalagem:', e)
    showError(e.message || 'Erro ao salvar embalagem')
  }
}

// === WATCHERS ===

// Auto-gerar nome e código ao alterar seleções
watch(
  () => [form.value.is_mix, form.value.especie_ids, form.value.tipo_produto_id],
  (newVals, oldVals) => {
    if (oldVals && JSON.stringify(newVals) !== JSON.stringify(oldVals)) {
      const autoNome = generateAutoNome(form.value)
      const autoCodigo = generateAutoCodigo(form.value)
      if (autoNome) form.value.nome = autoNome
      if (autoCodigo) form.value.codigo = autoCodigo
    }
  },
  { deep: true }
)

// Limpar especie_ids quando toggle MIX muda
watch(() => form.value.is_mix, (newVal, oldVal) => {
  if (oldVal !== undefined && newVal !== oldVal) {
    form.value.especie_ids = []
  }
})

// Watch para recarregar quando a empresa mudar
watch(
  () => currentCompany.value?.id,
  (newId) => {
    if (newId) {
      loadEspecies()
      loadTiposProduto()
      loadSubstratos()
      loadEmbalagens()
      loadProdutos()
      loadEstoque()
    }
  },
  { immediate: true }
)

// Reset da pagina quando filtros mudam
watch(searchQuery, () => {
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
</script>
