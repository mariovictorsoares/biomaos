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
        <button @click="showListaTabelasPrecoModal = true" class="btn btn-secondary shrink-0 justify-center sm:justify-start">
          <span class="material-icons-outlined text-sm">payments</span>
          Tabelas de preços
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
              <th class="table-header text-center w-24">Modalidade</th>
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
              <td class="table-cell text-center">
                <div class="flex items-center justify-center gap-2">
                  <button
                    @click.stop="openModal(produto)"
                    class="text-gray-400 hover:text-primary transition-colors"
                    title="Ver produto"
                  >
                    <span class="material-icons-outlined text-sm">visibility</span>
                  </button>
                </div>
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
            </div>
            <div class="flex items-center gap-3 shrink-0">
              <button
                @click.stop="openModal(produto)"
                class="text-gray-400 hover:text-primary transition-colors"
              >
                <span class="material-icons-outlined text-xl">chevron_right</span>
              </button>
            </div>
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
                            :disabled="!form.especie_ids.includes(esp.id) && !canAddMoreEspecies"
                            class="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 disabled:opacity-50"
                          />
                          <span class="text-text-light dark:text-text-dark">{{ esp.nome }}</span>
                          <span class="text-xs text-subtext-light dark:text-subtext-dark">{{ esp.codigo }}</span>
                        </label>
                        <div v-if="especiesAtivas.length === 0" class="px-3 py-3 text-center text-sm text-subtext-light dark:text-subtext-dark">
                          Nenhuma espécie cadastrada
                        </div>
                      </div>
                    </div>
                    <p v-if="form.is_mix && form.modalidade === 'vivo' && form.especie_ids.length >= 2" class="text-xs text-amber-600 dark:text-amber-400 mt-1">
                      Máximo 2 espécies para produto vivo
                    </p>

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

                  <!-- Codigo e Nome (manual) -->
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                        Código <span class="text-red-500">*</span>
                      </label>
                      <input type="text" v-model="form.codigo" class="input" placeholder="Ex: RUC" />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                        Nome do Produto <span class="text-red-500">*</span>
                      </label>
                      <input type="text" v-model="form.nome" class="input" placeholder="Nome do produto" />
                    </div>
                  </div>

                  <!-- === SEÇÃO PREÇOS === -->
                  <div class="border-t border-border-light dark:border-border-dark pt-4">
                    <div class="flex items-center justify-between mb-3">
                      <h3 class="text-sm font-semibold text-text-light dark:text-text-dark flex items-center gap-1.5">
                        <span class="material-icons-outlined text-base text-primary">payments</span>
                        Tabela de preços <span class="text-red-500">*</span>
                      </h3>
                      <button
                        type="button"
                        @click="showListaTabelasPrecoModal = true"
                        class="w-[38px] h-[38px] flex items-center justify-center border border-border-light dark:border-border-dark rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shrink-0"
                        title="Gerenciar tabelas de preços"
                      >
                        <span class="material-icons-outlined text-sm text-subtext-light dark:text-subtext-dark">settings</span>
                      </button>
                    </div>

                    <div v-if="tabelasPreco.length > 0" class="space-y-2">
                      <div v-for="tabela in tabelasPreco" :key="tabela.id" class="flex items-center gap-3">
                        <label class="text-sm text-text-light dark:text-text-dark flex-1 truncate">{{ tabela.nome }}</label>
                        <div class="relative w-32">
                          <span class="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-subtext-light dark:text-subtext-dark">R$</span>
                          <input
                            type="text"
                            :value="formatPrecoInput(formPrecos[tabela.id])"
                            @input="onPrecoInput(tabela.id, $event)"
                            class="input text-sm text-right pl-8"
                            placeholder="0,00"
                          />
                        </div>
                      </div>
                    </div>

                    <div v-else class="text-center py-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                      <p class="text-xs text-subtext-light dark:text-subtext-dark mb-2">Nenhuma tabela de preço cadastrada</p>
                      <button type="button" @click="showListaTabelasPrecoModal = true" class="text-xs text-primary hover:text-primary/80 font-medium">
                        Criar tabela de preco
                      </button>
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

    <!-- Modal Lista Tabelas Preço -->
    <Teleport to="body">
      <ModalListaTabelasPreco
        :show="showListaTabelasPrecoModal"
        @close="showListaTabelasPrecoModal = false"
        @updated="loadTabelasPreco"
      />
    </Teleport>

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useCurrentCompany } from '~/composables/useCurrentCompany'
import { useToast } from '~/composables/useToast'

const supabase = useSupabaseClient()
const { currentCompany } = useCurrentCompany()
const { success, error: showError } = useToast()

// === ESTADO - PRODUTOS ===
const loading = ref(false)
const saving = ref(false)
const produtos = ref([])
const especies = ref([])
const substratos = ref([])
const embalagens = ref([])

// Modal unificado
const showModal = ref(false)

// Modais auxiliares - Substratos
const showListaSubstratosModal = ref(false)
const showSubstratoModal = ref(false)
const editingSubstrato = ref(null)

// Modais auxiliares - Embalagens
const showListaEmbalagensModal = ref(false)
const showEmbalagemModal = ref(false)
const editingEmbalagem = ref(null)

// Tabelas de preço
const tabelasPreco = ref([])
const formPrecos = ref({}) // { [tabela_preco_id]: price_value }
const showListaTabelasPrecoModal = ref(false)

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


// Form unificado
const getEmptyForm = () => ({
  id: null,
  codigo: '',
  nome: '',
  substrato_id: null,
  embalagem_id: null,
  is_mix: false,
  especie_ids: [],
  modalidade: 'cortado',
  peso_gramas: null,
  ativo: true
})

const form = ref(getEmptyForm())

const isEditing = computed(() => !!form.value.id)

// === COMPUTED ===

// Especies ativas
const especiesAtivas = computed(() => {
  return especies.value.filter(e => e.ativo)
})

const maxEspeciesMix = computed(() => {
  return form.value.modalidade === 'vivo' ? 2 : Infinity
})

const canAddMoreEspecies = computed(() => {
  return form.value.especie_ids.length < maxEspeciesMix.value
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

// === HELPERS ===

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
}

function formatPrecoInput(value) {
  if (value === undefined || value === null || value === '') return ''
  const cents = Math.round(Number(value) * 100)
  const reais = (cents / 100).toFixed(2)
  const [intPart, decPart] = reais.split('.')
  const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${formatted},${decPart}`
}

function onPrecoInput(tabelaId, event) {
  // Formatação estilo banco: só aceita dígitos, preenche da direita pra esquerda
  const raw = event.target.value.replace(/\D/g, '')
  if (!raw) {
    formPrecos.value[tabelaId] = null
    event.target.value = ''
    return
  }
  const cents = parseInt(raw, 10)
  const reais = cents / 100
  formPrecos.value[tabelaId] = reais
  const fixed = reais.toFixed(2)
  const [intPart, decPart] = fixed.split('.')
  const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  event.target.value = `${formatted},${decPart}`
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
  } catch (e) {
    console.error('Erro ao carregar tabelas de preço:', e)
  }
}

async function loadProdutoPrecos(produtoId) {
  if (!produtoId) {
    formPrecos.value = {}
    return
  }
  try {
    const { data, error } = await supabase
      .from('tabela_preco_itens')
      .select('tabela_preco_id, preco')
      .eq('produto_id', produtoId)
    if (error) throw error
    const map = {}
    ;(data || []).forEach(item => { map[item.tabela_preco_id] = item.preco })
    formPrecos.value = map
  } catch (e) {
    console.error('Erro ao carregar preços do produto:', e)
    formPrecos.value = {}
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

    form.value = {
      ...produto,
      is_mix: produto.is_mix || false,
      substrato_id: produto.substrato_id || null,
      embalagem_id: produto.embalagem_id || null,
      especie_ids: especieIds,
      modalidade: produto.modalidade || 'cortado',
      peso_gramas: produto.peso_gramas || null,
      ativo: produto.ativo !== false
    }
    await loadProdutoPrecos(produto.id)
  } else {
    form.value = getEmptyForm()
    formPrecos.value = {}
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

    // Check codigo uniqueness
    if (form.value.codigo) {
      let query = supabase
        .from('produtos')
        .select('id')
        .eq('empresa_id', currentCompany.value.id)
        .eq('codigo', form.value.codigo)
        .limit(1)

      if (isEditing.value) {
        query = query.neq('id', form.value.id)
      }

      const { data: existing } = await query
      if (existing && existing.length > 0) {
        showError('Já existe um produto com este código')
        saving.value = false
        return
      }
    }

    // Validate prices
    if (tabelasPreco.value.length > 0) {
      const missingPrices = tabelasPreco.value.filter(t => !formPrecos.value[t.id] && formPrecos.value[t.id] !== 0)
      if (missingPrices.length > 0) {
        showError('Preencha o preco em todas as tabelas de preco')
        saving.value = false
        return
      }
    }
    if (tabelasPreco.value.length === 0) {
      showError('Cadastre pelo menos uma tabela de preco antes de salvar o produto')
      saving.value = false
      return
    }

    if (isEditing.value) {
      const { error: updateError } = await supabase
        .from('produtos')
        .update({
          codigo: form.value.codigo || null,
          nome: form.value.nome || null,
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
            percentual: form.value.is_mix && especieIds.length > 1
              ? parseFloat((100 / especieIds.length).toFixed(2))
              : null
          })))

        if (relError) throw relError
      }

      // Save prices (update path)
      if (tabelasPreco.value.length > 0) {
        const precoRows = tabelasPreco.value.map(t => ({
          tabela_preco_id: t.id,
          produto_id: form.value.id,
          preco: formPrecos.value[t.id] || 0
        }))
        const { error: precoError } = await supabase
          .from('tabela_preco_itens')
          .upsert(precoRows, { onConflict: 'tabela_preco_id,produto_id' })
        if (precoError) throw precoError
      }

      success('Produto atualizado com sucesso')
    } else {
      const { data: produtoData, error: produtoError } = await supabase
        .from('produtos')
        .insert({
          empresa_id: currentCompany.value.id,
          codigo: form.value.codigo || null,
          nome: form.value.nome || null,
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
            percentual: form.value.is_mix && especieIds.length > 1
              ? parseFloat((100 / especieIds.length).toFixed(2))
              : null
          })))

        if (relError) throw relError
      }

      // Save prices (create path)
      if (tabelasPreco.value.length > 0) {
        const precoRows = tabelasPreco.value.map(t => ({
          tabela_preco_id: t.id,
          produto_id: produtoData.id,
          preco: formPrecos.value[t.id] || 0
        }))
        const { error: precoError } = await supabase
          .from('tabela_preco_itens')
          .upsert(precoRows, { onConflict: 'tabela_preco_id,produto_id' })
        if (precoError) throw precoError
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

// Limpar especie_ids quando toggle MIX muda
watch(() => form.value.is_mix, (newVal, oldVal) => {
  if (oldVal !== undefined && newVal !== oldVal) {
    form.value.especie_ids = []
  }
})

// Limitar espécies ao trocar modalidade para vivo (max 2)
watch(() => form.value.modalidade, (newVal, oldVal) => {
  if (newVal === 'vivo' && form.value.is_mix && form.value.especie_ids.length > 2) {
    form.value.especie_ids = form.value.especie_ids.slice(0, 2)
    success('Espécies excedentes removidas. Produto vivo permite no máximo 2 espécies.')
  }
})

// Watch para recarregar quando a empresa mudar
watch(
  () => currentCompany.value?.id,
  (newId) => {
    if (newId) {
      loadEspecies()
      loadSubstratos()
      loadEmbalagens()
      loadTabelasPreco()
      loadProdutos()
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

