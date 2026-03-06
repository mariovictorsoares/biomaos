<template>
  <div>
    <h1 class="text-lg font-medium text-text-light/70 dark:text-text-dark/70 tracking-wide uppercase mb-12">Contratos</h1>

    <!-- Toolbar: Filtros + Ação -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-4 mb-4">
      <!-- Esquerda: Filtros -->
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
        <!-- Filtro Cliente -->
        <select v-model="filterCliente" class="input text-sm w-full sm:w-48 shrink-0">
          <option value="">Todos clientes</option>
          <option v-for="cliente in clientes" :key="cliente.id" :value="cliente.id">
            {{ cliente.nome_fantasia || cliente.razao_social }}
          </option>
        </select>
        <!-- Toggle Visualizar Cancelados -->
        <label class="flex items-center gap-2 cursor-pointer shrink-0">
          <input
            type="checkbox"
            v-model="showCancelados"
            class="w-4 h-4 text-primary bg-white border-gray-300 rounded focus:ring-primary dark:bg-gray-800 dark:border-gray-600"
          />
          <span class="text-sm text-subtext-light dark:text-subtext-dark whitespace-nowrap">Visualizar Cancelados</span>
        </label>
      </div>
      <!-- Direita: Botão -->
      <button @click="openCreateModal" class="btn btn-primary shrink-0 justify-center sm:justify-start">
        <span class="material-icons text-sm">add</span>
        Novo contrato
      </button>
    </div>

    <!-- Card da Tabela -->
    <div class="card">
      <!-- Loading -->
      <div v-if="loading" class="p-8 text-center">
        <span class="material-icons text-4xl text-gray-300 dark:text-gray-600 animate-spin">refresh</span>
        <p class="text-sm text-subtext-light dark:text-subtext-dark mt-2">Carregando...</p>
      </div>

      <!-- Tabela - Desktop -->
      <div v-else-if="filteredContratos.length > 0" class="hidden md:block overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-[#F9FAFB] dark:bg-gray-800 border-b border-border-light dark:border-border-dark">
              <th class="table-header text-xs font-medium text-subtext-light dark:text-subtext-dark uppercase tracking-wider">Cliente</th>
              <th class="table-header text-xs font-medium text-subtext-light dark:text-subtext-dark uppercase tracking-wider text-center">Plano</th>
              <th class="table-header text-xs font-medium text-subtext-light dark:text-subtext-dark uppercase tracking-wider text-center">Primeira entrega</th>
              <th class="table-header text-xs font-medium text-subtext-light dark:text-subtext-dark uppercase tracking-wider text-center">Entrega final</th>
              <th class="table-header text-xs font-medium text-subtext-light dark:text-subtext-dark uppercase tracking-wider text-center">Progresso das entregas</th>
              <th class="table-header text-xs font-medium text-subtext-light dark:text-subtext-dark uppercase tracking-wider text-center">Status</th>
              <th class="table-header w-12"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-light dark:divide-border-dark">
            <tr
              v-for="contrato in paginatedContratos"
              :key="contrato.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
              @click="openDetailsModal(contrato)"
            >
              <!-- Cliente -->
              <td class="table-cell">
                <span class="text-text-light dark:text-text-dark">
                  {{ contrato.clientes?.nome_fantasia || contrato.clientes?.razao_social || '-' }}
                </span>
              </td>

              <!-- Plano -->
              <td class="table-cell text-center">
                <div class="flex flex-col items-center">
                  <span class="text-text-light dark:text-text-dark font-medium">{{ getTipoPlanoLabel(contrato.tipo_plano) }}</span>
                  <span class="text-xs text-subtext-light dark:text-subtext-dark">{{ getModalidadeLabel(contrato.modalidade) }}</span>
                </div>
              </td>

              <!-- Primeira entrega -->
              <td class="table-cell text-center text-text-light dark:text-text-dark">
                {{ formatDate(contrato.primeira_entrega || contrato.data_inicio) }}
              </td>

              <!-- Entrega final -->
              <td class="table-cell text-center">
                <span v-if="contrato.modalidade === 'recorrente'" class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                  Recorrente
                </span>
                <span v-else class="text-text-light dark:text-text-dark">
                  {{ formatDate(contrato.entrega_final || contrato.data_fim) }}
                </span>
              </td>

              <!-- Progresso das entregas -->
              <td class="table-cell">
                <div class="flex items-center gap-2 justify-center">
                  <div class="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      class="h-full rounded-full transition-all"
                      :class="getProgressoEntregas(contrato) > 0 ? 'bg-primary' : ''"
                      :style="{ width: getProgressoEntregas(contrato) + '%' }"
                    ></div>
                  </div>
                  <span class="text-sm text-subtext-light dark:text-subtext-dark min-w-[20px] text-right">
                    {{ contrato.entregas_realizadas || 0 }}
                  </span>
                </div>
              </td>

              <!-- Status -->
              <td class="table-cell text-center">
                <span :class="['badge', getStatusClass(contrato.status)]">
                  {{ getStatusLabel(contrato.status) }}
                </span>
              </td>

              <!-- Acoes -->
              <td class="table-cell text-center" @click.stop>
                <button
                  @click="openDetailsModal(contrato)"
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
      <div v-else-if="filteredContratos.length > 0" class="md:hidden divide-y divide-border-light dark:divide-border-dark">
        <div
          v-for="contrato in paginatedContratos"
          :key="contrato.id"
          class="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
          @click="openDetailsModal(contrato)"
        >
          <div class="flex items-start gap-3">
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <p class="font-medium text-text-light dark:text-text-dark truncate">
                    {{ contrato.clientes?.nome_fantasia || contrato.clientes?.razao_social || '-' }}
                  </p>
                  <p class="text-xs text-subtext-light dark:text-subtext-dark">
                    {{ getTipoPlanoLabel(contrato.tipo_plano) }} - {{ getModalidadeLabel(contrato.modalidade) }}
                  </p>
                </div>
                <span :class="['badge shrink-0', getStatusClass(contrato.status)]">
                  {{ getStatusLabel(contrato.status) }}
                </span>
              </div>
              <div class="flex items-center gap-4 mt-2 text-xs text-subtext-light dark:text-subtext-dark">
                <span>Início: {{ formatDate(contrato.primeira_entrega || contrato.data_inicio) }}</span>
                <span>Entregas: {{ contrato.entregas_realizadas || 0 }}</span>
              </div>
            </div>
            <button
              @click.stop="openDetailsModal(contrato)"
              class="text-gray-400 hover:text-primary transition-colors shrink-0"
            >
              <span class="material-icons-outlined text-xl">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="!loading" class="text-center py-12 flex flex-col items-center px-4">
        <span class="material-icons-outlined text-4xl text-gray-300 dark:text-gray-600 mb-2">description</span>
        <h3 class="text-lg font-medium text-text-light dark:text-text-dark mb-1">Nenhum contrato encontrado</h3>
        <p class="text-sm text-subtext-light dark:text-subtext-dark mb-4">
          {{ filterCliente || showCancelados ? 'Tente ajustar os filtros' : 'Comece criando seu primeiro contrato' }}
        </p>
        <button v-if="!filterCliente" @click="openCreateModal" class="btn btn-primary">
          <span class="material-icons text-sm">add</span>
          Novo contrato
        </button>
      </div>

      <!-- Paginacao -->
      <div v-if="filteredContratos.length > 0" class="p-3 sm:p-4 border-t border-border-light dark:border-border-dark text-xs text-subtext-light dark:text-subtext-dark">
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
            <span class="text-xs">{{ filteredContratos.length }} registros</span>
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

    <!-- Modal de Criação - Novo Design Multi-Etapas -->
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
            <div class="sticky top-0 glass-panel border-b border-border-light dark:border-border-dark px-6 py-4 z-10">
              <h2 class="text-2xl font-semibold text-text-light dark:text-text-dark mb-4">Cadastro de contrato</h2>

              <!-- Navegação das Etapas -->
              <div class="flex items-center justify-center gap-4">
                <button
                  v-for="step in 5"
                  :key="step"
                  @click="goToStep(step)"
                  :class="[
                    'px-4 py-2 text-sm font-medium transition-colors',
                    currentStep === step
                      ? 'text-text-light dark:text-text-dark border-b-2 border-primary'
                      : 'text-subtext-light dark:text-subtext-dark hover:text-text-light dark:hover:text-text-dark',
                    !canGoToStep(step) ? 'opacity-50 cursor-not-allowed' : ''
                  ]"
                  :disabled="!canGoToStep(step)"
                >
                  Etapa {{ step }}
                </button>
              </div>
            </div>

            <!-- Modal Body -->
            <div class="p-6">
              <!-- Etapa 1 - Informações de Contrato -->
              <div v-show="currentStep === 1">
                <h3 class="text-base font-medium text-text-light dark:text-text-dark mb-6">Etapa 1 - Informações de Contrato</h3>

                <div class="space-y-4">
                  <!-- Linha 1: Cliente (largura total) -->
                  <div>
                    <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Cliente</label>
                    <select v-model="newContrato.cliente_id" class="input" @change="onClienteChangeCreate">
                      <option value="">Selecione o cliente</option>
                      <option v-for="cliente in clientes" :key="cliente.id" :value="cliente.id">
                        {{ cliente.nome_fantasia || cliente.razao_social }}
                      </option>
                    </select>
                  </div>

                  <!-- Linha 2: Tipo de plano, Modalidade, Bonificação, Início -->
                  <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Tipo de plano</label>
                      <select v-model="newContrato.tipo_plano" class="input" @change="onTipoPlanoChange">
                        <option value="">Selecione</option>
                        <option value="clube_bioma_light">Clube Bioma Light</option>
                        <option value="clube_bioma_pro">Clube Bioma Pro</option>
                        <option value="pedido_recorrente">Pedido recorrente</option>
                      </select>
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Modalidade</label>
                      <select
                        v-model="newContrato.modalidade"
                        class="input"
                        :class="{ 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed': newContrato.tipo_plano !== 'clube_bioma_pro' }"
                        :disabled="newContrato.tipo_plano !== 'clube_bioma_pro'"
                        @change="onModalidadeChange"
                      >
                        <option v-if="newContrato.tipo_plano !== 'clube_bioma_pro'" value="recorrente">Recorrente</option>
                        <option v-if="newContrato.tipo_plano === 'clube_bioma_pro'" value="mensal">Mensal</option>
                        <option v-if="newContrato.tipo_plano === 'clube_bioma_pro'" value="trimestral">Trimestral</option>
                        <option v-if="newContrato.tipo_plano === 'clube_bioma_pro'" value="semestral">Semestral</option>
                      </select>
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Bonificação (%)</label>
                      <input
                        type="number"
                        v-model.number="newContrato.bonificacao"
                        class="input"
                        :class="{ 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed': newContrato.tipo_plano !== 'clube_bioma_pro' }"
                        step="0.01"
                        min="0"
                        max="100"
                        placeholder="0"
                        :disabled="newContrato.tipo_plano !== 'clube_bioma_pro'"
                      />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Início do plano</label>
                      <input type="date" v-model="newContrato.data_inicio" class="input" @change="calcularDataFim" />
                    </div>
                  </div>

                  <!-- Linha 3: Fim do plano e Credito -->
                  <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Fim do plano</label>
                      <input
                        type="date"
                        v-model="newContrato.data_fim"
                        class="input"
                        :class="{ 'bg-gray-100 dark:bg-gray-700': newContrato.tipo_plano === 'clube_bioma_pro' }"
                        :readonly="newContrato.tipo_plano === 'clube_bioma_pro'"
                      />
                      <p v-if="newContrato.tipo_plano === 'clube_bioma_pro'" class="text-xs text-subtext-light dark:text-subtext-dark mt-1">
                        Calculado automaticamente
                      </p>
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Possui crédito anterior?</label>
                      <select v-model="newContrato.possui_credito_anterior" class="input">
                        <option value="">Selecione</option>
                        <option :value="true">Sim</option>
                        <option :value="false">Não</option>
                      </select>
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Valor do crédito</label>
                      <input
                        type="number"
                        v-model.number="newContrato.valor_credito"
                        class="input"
                        :class="{ 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed': newContrato.possui_credito_anterior !== true }"
                        :disabled="newContrato.possui_credito_anterior !== true"
                        placeholder="0,00"
                        step="0.01"
                        min="0"
                      />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Valor frete/entrega</label>
                      <input
                        type="number"
                        v-model.number="newContrato.valor_frete_entrega"
                        class="input"
                        placeholder="0,00"
                        step="0.01"
                        min="0"
                      />
                    </div>
                  </div>

                  <!-- Linha 4: Tabela de preço -->
                  <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div class="md:col-span-2">
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Tabela de preço</label>
                      <div class="flex gap-2">
                        <select v-model="newContrato.tabela_preco_id" class="input flex-1" @change="onTabelaPrecoChangeCreate">
                          <option value="">Selecione</option>
                          <option v-for="tabela in tabelasPreco" :key="tabela.id" :value="tabela.id">
                            {{ tabela.nome }}
                          </option>
                        </select>
                        <button
                          type="button"
                          @click="showTabelaPrecoModal = true"
                          class="p-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shrink-0"
                          title="Gerenciar tabelas de preço"
                        >
                          <span class="material-icons text-lg">add</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <!-- Linha 5: Endereço de entrega (largura total) -->
                  <div>
                    <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Endereço de entrega</label>
                    <input
                      type="text"
                      :value="enderecoEntregaCliente"
                      class="input bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                      disabled
                      placeholder="Selecione um cliente"
                    />
                  </div>

                  <!-- Linha 5: Observações (largura total) -->
                  <div>
                    <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Observações</label>
                    <textarea
                      v-model="newContrato.observacoes"
                      class="input min-h-[80px] resize-y"
                      placeholder="Digite aqui observações sobre o contrato..."
                    ></textarea>
                  </div>
                </div>
              </div>

              <!-- Etapa 2 - Microverdes entregues por semana -->
              <div v-show="currentStep === 2">
                <h3 class="text-base font-medium text-text-light dark:text-text-dark mb-4">Etapa 2 - Microverdes entregues por semana</h3>

                <!-- Formulário de adição de item -->
                <div class="grid grid-cols-12 gap-3 items-end mb-4">
                  <!-- Dia da semana -->
                  <div class="col-span-6 sm:col-span-2">
                    <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Dia da semana</label>
                    <select v-model="weeklyItemForm.dia_semana" class="input">
                      <option value="">Selecione</option>
                      <option value="segunda">Segunda</option>
                      <option value="terca">Terça</option>
                      <option value="quarta">Quarta</option>
                      <option value="quinta">Quinta</option>
                      <option value="sexta">Sexta</option>
                      <option value="sabado">Sábado</option>
                    </select>
                  </div>

                  <!-- Quantidade -->
                  <div class="col-span-6 sm:col-span-2">
                    <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Quantidade</label>
                    <input type="number" v-model.number="weeklyItemForm.quantidade" class="input" min="1" />
                  </div>

                  <!-- Produto -->
                  <div class="col-span-12 sm:col-span-4">
                    <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Produto</label>
                    <select v-model="weeklyItemForm.produto_id" @change="onWeeklyProductChange" class="input">
                      <option value="">Selecione</option>
                      <option v-for="produto in produtos" :key="produto.id" :value="produto.id">
                        {{ produto.nome }}
                      </option>
                    </select>
                  </div>

                  <!-- Valor unitario - Editavel -->
                  <div class="col-span-10 sm:col-span-3">
                    <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Valor unitário</label>
                    <input
                      type="number"
                      v-model.number="weeklyItemForm.valor_unitario"
                      class="input"
                      placeholder="0,00"
                      step="0.01"
                      min="0"
                    />
                  </div>

                  <!-- Botão adicionar -->
                  <div class="col-span-2 sm:col-span-1">
                    <button
                      @click="addWeeklyItem"
                      class="w-full h-[42px] bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center"
                    >
                      <span class="material-icons">add</span>
                    </button>
                  </div>
                </div>

                <!-- Lista de itens adicionados -->
                <div v-if="newContrato.weekly_items.length > 0" class="border border-border-light dark:border-border-dark rounded-lg overflow-hidden mb-4">
                  <table class="w-full">
                    <thead class="bg-gray-50 dark:bg-gray-800 text-xs uppercase tracking-wider">
                      <tr>
                        <th class="px-4 py-3 text-left font-medium text-subtext-light dark:text-subtext-dark">Dia da semana</th>
                        <th class="px-4 py-3 text-center font-medium text-subtext-light dark:text-subtext-dark">Quantidade</th>
                        <th class="px-4 py-3 text-left font-medium text-subtext-light dark:text-subtext-dark">Produto</th>
                        <th class="px-4 py-3 text-right font-medium text-subtext-light dark:text-subtext-dark">Valor unitário</th>
                        <th class="px-4 py-3 w-12"></th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-border-light dark:divide-border-dark">
                      <tr v-for="item in newContrato.weekly_items" :key="item.id" class="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td class="px-4 py-3 text-text-light dark:text-text-dark">{{ getDiaSemanaLabel(item.dia_semana) }}</td>
                        <td class="px-4 py-3 text-center text-text-light dark:text-text-dark font-medium">{{ item.quantidade }}</td>
                        <td class="px-4 py-3 text-text-light dark:text-text-dark">{{ item.produto_nome }}</td>
                        <td class="px-4 py-3 text-right text-text-light dark:text-text-dark">{{ formatCurrency(item.valor_unitario) }}</td>
                        <td class="px-4 py-3 text-center">
                          <button @click="removeWeeklyItem(item.id)" class="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
                            <span class="material-icons text-lg">delete_outline</span>
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div v-else class="text-center py-12 text-subtext-light dark:text-subtext-dark border border-dashed border-border-light dark:border-border-dark rounded-lg mb-4">
                  <span class="material-icons-outlined text-4xl mb-2 text-gray-300 dark:text-gray-600">calendar_month</span>
                  <p class="font-medium">Nenhum item adicionado</p>
                  <p class="text-sm">Adicione os microverdes que serão entregues semanalmente</p>
                </div>

                <!-- Totais -->
                <div class="grid grid-cols-3 gap-3 text-sm">
                  <div class="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <span class="material-icons text-primary">local_shipping</span>
                    <div>
                      <p class="text-xs text-subtext-light dark:text-subtext-dark">Entregas/semana</p>
                      <p class="font-semibold text-text-light dark:text-text-dark">{{ totalEntregasSemana }}</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <span class="material-icons text-primary">eco</span>
                    <div>
                      <p class="text-xs text-subtext-light dark:text-subtext-dark">Produtos únicos</p>
                      <p class="font-semibold text-text-light dark:text-text-dark">{{ totalProdutosUnicos }}</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <span class="material-icons text-primary">inventory_2</span>
                    <div>
                      <p class="text-xs text-subtext-light dark:text-subtext-dark">Produtos/semana</p>
                      <p class="font-semibold text-text-light dark:text-text-dark">{{ totalProdutosSemana }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Etapa 3 - Previsão de entrega -->
              <div v-show="currentStep === 3">
                <h3 class="text-base font-medium text-text-light dark:text-text-dark mb-6">Etapa 3 - Previsão de entrega</h3>

                <!-- Lista de entregas -->
                <div v-if="newContrato.delivery_schedule.length > 0" class="space-y-2 max-h-96 overflow-y-auto mb-6">
                  <div
                    v-for="item in newContrato.delivery_schedule"
                    :key="item.id"
                    class="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                  >
                    <!-- Data e Dia -->
                    <div class="w-28 shrink-0">
                      <div class="flex items-center gap-2">
                        <span class="font-medium text-text-light dark:text-text-dark">{{ formatDate(item.data_entrega) }}</span>
                        <button @click="openEditDateModal(item.id)" class="text-gray-400 hover:text-primary p-0.5">
                          <span class="material-icons text-sm">edit</span>
                        </button>
                      </div>
                      <p class="text-sm text-subtext-light dark:text-subtext-dark">{{ item.dia_semana }}</p>
                    </div>

                    <!-- Quantidade, Produto, Valor -->
                    <div class="flex-1 flex items-center gap-4">
                      <span class="text-text-light dark:text-text-dark font-medium">{{ item.quantidade }}</span>
                      <span class="text-text-light dark:text-text-dark flex-1">{{ item.produto_nome }}</span>
                      <span class="text-text-light dark:text-text-dark">
                        {{ item.is_bonificacao ? 'Bonificação' : formatCurrency(item.valor_unitario) }}
                      </span>
                    </div>

                    <!-- Acoes -->
                    <div class="flex items-center gap-1 shrink-0">
                      <button @click="openEditDeliveryModal(item.id)" class="text-gray-400 hover:text-primary p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded" title="Editar item">
                        <span class="material-icons text-lg">edit_note</span>
                      </button>
                      <button @click="removeDeliveryItem(item.id)" class="text-gray-400 hover:text-red-500 p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded" title="Remover item">
                        <span class="material-icons text-lg">delete_outline</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div v-else class="text-center py-8 text-subtext-light dark:text-subtext-dark border border-dashed border-border-light dark:border-border-dark rounded-lg mb-6">
                  <span class="material-icons-outlined text-3xl mb-2">event_busy</span>
                  <p>Nenhuma entrega prevista</p>
                  <p class="text-sm">Volte à etapa anterior e adicione os itens semanais</p>
                </div>

                <!-- Botão adicionar entrega manual -->
                <button @click="openAddDeliveryModal" class="btn btn-secondary text-sm mb-6">
                  <span class="material-icons text-sm">add</span>
                  Adicionar microverde
                </button>

                <!-- Resumo financeiro -->
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-sm">
                  <div class="p-3 bg-white dark:bg-gray-800 rounded-lg">
                    <p class="text-xs text-subtext-light dark:text-subtext-dark flex items-center gap-1">
                      <span class="material-icons text-primary text-sm">local_shipping</span>
                      Total de entregas
                    </p>
                    <p class="text-lg font-semibold text-text-light dark:text-text-dark">{{ totalEntregas }}</p>
                  </div>
                  <div class="p-3 bg-white dark:bg-gray-800 rounded-lg">
                    <p class="text-xs text-subtext-light dark:text-subtext-dark flex items-center gap-1">
                      <span class="material-icons text-primary text-sm">eco</span>
                      Total de produtos
                    </p>
                    <p class="text-lg font-semibold text-text-light dark:text-text-dark">{{ totalProdutos }}</p>
                  </div>
                  <div class="p-3 bg-white dark:bg-gray-800 rounded-lg">
                    <p class="text-xs text-subtext-light dark:text-subtext-dark flex items-center gap-1">
                      <span class="material-icons text-primary text-sm">attach_money</span>
                      Valor de produtos
                    </p>
                    <p class="text-lg font-semibold text-text-light dark:text-text-dark">{{ formatCurrency(valorProdutos) }}</p>
                  </div>
                  <div class="p-3 bg-white dark:bg-gray-800 rounded-lg">
                    <p class="text-xs text-subtext-light dark:text-subtext-dark flex items-center gap-1">
                      <span class="material-icons text-primary text-sm">card_giftcard</span>
                      Valor da bonificação
                    </p>
                    <p class="text-lg font-semibold text-primary">{{ formatCurrency(valorBonificacao) }}</p>
                  </div>
                  <div class="p-3 bg-white dark:bg-gray-800 rounded-lg">
                    <p class="text-xs text-subtext-light dark:text-subtext-dark flex items-center gap-1">
                      <span class="material-icons text-primary text-sm">account_balance_wallet</span>
                      Valor total de créditos
                    </p>
                    <p class="text-lg font-semibold text-text-light dark:text-text-dark">{{ formatCurrency(valorTotalCreditos) }}</p>
                  </div>
                  <div class="p-3 bg-white dark:bg-gray-800 rounded-lg">
                    <p class="text-xs text-subtext-light dark:text-subtext-dark flex items-center gap-1">
                      <span class="material-icons text-primary text-sm">redeem</span>
                      Valor total a receber
                    </p>
                    <p class="text-lg font-semibold text-primary">{{ formatCurrency(valorTotalMicroverdesReceber) }}</p>
                  </div>
                  <div class="p-3 bg-white dark:bg-gray-800 rounded-lg">
                    <p class="text-xs text-subtext-light dark:text-subtext-dark flex items-center gap-1">
                      <span class="material-icons text-primary text-sm">shopping_cart</span>
                      Valor previsto uso
                    </p>
                    <p class="text-lg font-semibold text-text-light dark:text-text-dark">{{ formatCurrency(valorMicroverdesUtilizacao) }}</p>
                  </div>
                  <div class="p-3 bg-white dark:bg-gray-800 rounded-lg">
                    <p class="text-xs text-subtext-light dark:text-subtext-dark flex items-center gap-1">
                      <span class="material-icons text-primary text-sm">savings</span>
                      Valor residual crédito
                    </p>
                    <p class="text-lg font-semibold text-text-light dark:text-text-dark">{{ formatCurrency(valorResidualCredito) }}</p>
                  </div>
                </div>
              </div>

              <!-- Etapa 4 - Forma de Pagamento -->
              <div v-show="currentStep === 4">
                <h3 class="text-base font-medium text-text-light dark:text-text-dark mb-6">Etapa 4 - Forma de Pagamento</h3>

                <!-- Resumo de valores -->
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                  <div class="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-center">
                    <p class="text-sm text-subtext-light dark:text-subtext-dark mb-2 flex items-center justify-center gap-2">
                      <span class="material-icons text-primary">local_shipping</span>
                      Valor do frete por entrega
                    </p>
                    <p class="text-2xl font-bold text-text-light dark:text-text-dark">{{ formatCurrency(valorFreteEntrega) }}</p>
                  </div>
                  <div class="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-center">
                    <p class="text-sm text-subtext-light dark:text-subtext-dark mb-2 flex items-center justify-center gap-2">
                      <span class="material-icons text-primary">inventory</span>
                      Valor total do frete
                    </p>
                    <p class="text-2xl font-bold text-text-light dark:text-text-dark">{{ formatCurrency(valorTotalFrete) }}</p>
                    <p class="text-xs text-subtext-light dark:text-subtext-dark mt-1">({{ totalEntregas }} entregas)</p>
                  </div>
                  <div class="p-6 bg-primary/10 border-2 border-primary rounded-lg text-center">
                    <p class="text-sm text-subtext-light dark:text-subtext-dark mb-2 flex items-center justify-center gap-2">
                      <span class="material-icons text-primary">payments</span>
                      Valor a pagar (microverdes + frete)
                    </p>
                    <p class="text-2xl font-bold text-primary">{{ formatCurrency(valorAPagar) }}</p>
                  </div>
                </div>

                <!-- Seleção de forma de pagamento -->
                <div class="max-w-md">
                  <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-2">Forma de pagamento</label>
                  <select v-model="newContrato.forma_pagamento" class="input">
                    <option value="">Selecione</option>
                    <option value="cartao_credito">Cartão de crédito</option>
                    <option value="boleto_1x">Boleto 1x</option>
                    <option value="boleto_2x">Boleto 2x</option>
                    <option value="boleto_3x">Boleto 3x</option>
                    <option value="pix">PIX</option>
                  </select>
                </div>
              </div>

              <!-- Etapa 5 - Resumo -->
              <div v-show="currentStep === 5">
                <h3 class="text-base font-medium text-text-light dark:text-text-dark mb-6">Etapa 5 - Resumo</h3>

                <div class="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg space-y-5">
                  <!-- Cliente -->
                  <div>
                    <p class="text-sm text-subtext-light dark:text-subtext-dark">Cliente:</p>
                    <p class="font-semibold text-text-light dark:text-text-dark">{{ getClienteNome(newContrato.cliente_id) }}</p>
                  </div>

                  <!-- Plano -->
                  <div>
                    <p class="text-sm text-subtext-light dark:text-subtext-dark">Plano:</p>
                    <p class="font-semibold text-text-light dark:text-text-dark">{{ getTipoPlanoLabel(newContrato.tipo_plano) }} - {{ getModalidadeLabel(newContrato.modalidade) }}</p>
                  </div>

                  <!-- Inicio e Fim das entregas -->
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <p class="text-sm text-subtext-light dark:text-subtext-dark">Início das entregas:</p>
                      <p class="font-semibold text-text-light dark:text-text-dark">{{ getDiaSemanaFromDate(newContrato.data_inicio) }} - {{ formatDate(newContrato.data_inicio) }}</p>
                    </div>
                    <div>
                      <p class="text-sm text-subtext-light dark:text-subtext-dark">Fim das entregas:</p>
                      <p class="font-semibold text-text-light dark:text-text-dark">{{ getDiaSemanaFromDate(newContrato.data_fim) }} - {{ formatDate(newContrato.data_fim) }}</p>
                    </div>
                  </div>

                  <!-- Quantidade microverdes por produto -->
                  <div>
                    <p class="text-sm text-subtext-light dark:text-subtext-dark">Quantidade microverdes por produto:</p>
                    <div v-for="(qtd, nome) in produtosPorTipo" :key="nome">
                      <p class="font-semibold text-text-light dark:text-text-dark">{{ qtd }} - {{ nome }}</p>
                    </div>
                  </div>

                  <!-- Quantidade total, Numero de entregas, Valor frete -->
                  <div class="grid grid-cols-3 gap-4">
                    <div>
                      <p class="text-sm text-subtext-light dark:text-subtext-dark">Quantidade total de microverdes:</p>
                      <p class="font-semibold text-text-light dark:text-text-dark">{{ totalProdutos }} + {{ totalBonificacaoQtd }} (bonificação) = {{ totalProdutos + totalBonificacaoQtd }}</p>
                    </div>
                    <div>
                      <p class="text-sm text-subtext-light dark:text-subtext-dark">Número de entregas:</p>
                      <p class="font-semibold text-text-light dark:text-text-dark">{{ totalEntregas }}</p>
                    </div>
                    <div>
                      <p class="text-sm text-subtext-light dark:text-subtext-dark">Valor unitário do frete:</p>
                      <p class="font-semibold text-text-light dark:text-text-dark">{{ formatCurrency(valorFreteEntrega) }}</p>
                    </div>
                  </div>

                  <!-- Valor total a receber e Valor previsto -->
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <p class="text-sm text-subtext-light dark:text-subtext-dark">Valor total de microverdes a receber:</p>
                      <p class="font-semibold text-text-light dark:text-text-dark">{{ formatCurrency(valorTotalMicroverdesReceber) }}</p>
                    </div>
                    <div>
                      <p class="text-sm text-subtext-light dark:text-subtext-dark">Valor de microverdes previstos de utilização:</p>
                      <p class="font-semibold text-text-light dark:text-text-dark">{{ formatCurrency(valorMicroverdesUtilizacao) }}</p>
                    </div>
                  </div>

                  <!-- Valor a pagar e Forma de pagamento -->
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <p class="text-sm text-subtext-light dark:text-subtext-dark">Valor a pagar (microverdes + frete):</p>
                      <p class="font-semibold text-text-light dark:text-text-dark">{{ formatCurrency(valorAPagar) }}</p>
                    </div>
                    <div>
                      <p class="text-sm text-subtext-light dark:text-subtext-dark">Forma de pagamento:</p>
                      <p class="font-semibold text-text-light dark:text-text-dark">{{ getFormaPagamentoLabel(newContrato.forma_pagamento) }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Modal Footer -->
            <div class="sticky bottom-0 glass-panel border-t border-border-light dark:border-border-dark px-6 py-4 flex items-center justify-between gap-3">
              <!-- Botão Voltar -->
              <button
                v-if="currentStep > 1"
                @click="currentStep--"
                class="btn btn-secondary"
                :disabled="saving"
              >
                <span class="material-icons text-sm">chevron_left</span>
                Voltar
              </button>
              <div v-else></div>

              <!-- Botoes da direita -->
              <div class="flex items-center gap-3">
                <button @click="closeCreateModal" class="btn btn-secondary" :disabled="saving">Cancelar</button>
                <button
                  v-if="currentStep < 5"
                  @click="nextStep"
                  class="btn btn-primary"
                  :disabled="!canAdvanceStep"
                >
                  Avançar
                  <span class="material-icons text-sm">chevron_right</span>
                </button>
                <button
                  v-else
                  @click="saveContrato"
                  class="btn btn-primary"
                  :disabled="saving || !canAdvanceStep"
                >
                  <span v-if="saving" class="material-icons animate-spin text-sm">refresh</span>
                  {{ saving ? 'Salvando...' : 'Finalizar' }}
                </button>
              </div>
            </div>
              </div>
            </Transition>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Modal de Adicionar Microverdes -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-200"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="showAddDeliveryModal" class="fixed inset-0 z-[70] overflow-y-auto">
          <div class="fixed inset-0 glass-backdrop" @click="showAddDeliveryModal = false"></div>
          <div class="flex min-h-full items-center justify-center p-4">
            <Transition
              enter-active-class="transition-all duration-200"
              enter-from-class="opacity-0 scale-95"
              enter-to-class="opacity-100 scale-100"
              leave-active-class="transition-all duration-200"
              leave-from-class="opacity-100 scale-100"
              leave-to-class="opacity-0 scale-95"
            >
              <div v-if="showAddDeliveryModal" class="relative glass-panel rounded-lg shadow-xl w-full max-w-md">
                <!-- Header com icone -->
                <div class="p-6 pb-0">
                  <div class="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center mb-4">
                    <span class="material-icons text-orange-600 dark:text-orange-400 text-2xl">add</span>
                  </div>
                  <h3 class="text-xl font-semibold text-text-light dark:text-text-dark">Adicionar Microverdes</h3>
                  <p class="text-sm text-subtext-light dark:text-subtext-dark">Complete os campos abaixo</p>
                </div>

                <!-- Modal Body -->
                <div class="p-6 space-y-4">
                  <!-- Campo de Datas - Multi-select -->
                  <div>
                    <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Datas</label>
                    <div class="relative">
                      <!-- Overlay para fechar dropdown ao clicar fora -->
                      <div
                        v-if="showDatasDropdown"
                        class="fixed inset-0 z-[5]"
                        @click="showDatasDropdown = false"
                      ></div>
                      <!-- Tags das datas selecionadas -->
                      <div
                        class="input min-h-[80px] p-2 flex flex-wrap gap-1 cursor-pointer relative z-[6]"
                        @click="toggleDatasDropdown"
                      >
                        <span
                          v-for="data in newDeliveryForm.datas_selecionadas"
                          :key="data"
                          class="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-sm rounded"
                        >
                          {{ formatDate(data) }}
                          <button
                            @click.stop="removeDataSelecionada(data)"
                            class="hover:text-red-500"
                          >
                            <span class="material-icons text-sm">close</span>
                          </button>
                        </span>
                        <span v-if="newDeliveryForm.datas_selecionadas.length === 0" class="text-gray-400 text-sm py-1">
                          Selecione as datas
                        </span>
                      </div>
                      <!-- Dropdown de datas -->
                      <div
                        v-if="showDatasDropdown"
                        class="absolute z-[10] mt-1 w-full bg-white dark:bg-gray-800 border border-border-light dark:border-border-dark rounded-lg shadow-lg max-h-48 overflow-y-auto"
                      >
                        <!-- Header do dropdown com botao fechar -->
                        <div class="sticky top-0 bg-gray-50 dark:bg-gray-700 px-3 py-2 border-b border-border-light dark:border-border-dark flex items-center justify-between">
                          <span class="text-xs font-medium text-subtext-light dark:text-subtext-dark">Selecione as datas</span>
                          <button @click.stop="showDatasDropdown = false" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                            <span class="material-icons text-sm">close</span>
                          </button>
                        </div>
                        <div
                          v-for="data in datasDisponiveisOrdenadas"
                          :key="data"
                          @click.stop="toggleDataSelection(data)"
                          class="px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between"
                          :class="{ 'bg-primary/10': newDeliveryForm.datas_selecionadas.includes(data) }"
                        >
                          <span class="text-sm text-text-light dark:text-text-dark">{{ formatDate(data) }}</span>
                          <span v-if="newDeliveryForm.datas_selecionadas.includes(data)" class="material-icons text-primary text-sm">check</span>
                        </div>
                        <div v-if="datasDisponiveisOrdenadas.length === 0" class="px-3 py-2 text-sm text-gray-400">
                          Nenhuma data disponível
                        </div>
                      </div>
                    </div>
                    <!-- Botão adicionar todas as datas -->
                    <button
                      @click="adicionarTodasAsDatas"
                      class="mt-2 text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1"
                    >
                      Adicionar todas as datas
                    </button>
                  </div>

                  <!-- Quantidade e Produto -->
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Quantidade</label>
                      <input type="number" v-model.number="newDeliveryForm.quantidade" class="input" min="1" />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Produto</label>
                      <select v-model="newDeliveryForm.produto_id" @change="onNewDeliveryProductChange" class="input">
                        <option value="">Selecione</option>
                        <option v-for="produto in produtos" :key="produto.id" :value="produto.id">
                          {{ produto.nome }}
                        </option>
                      </select>
                    </div>
                  </div>

                  <!-- É bonificação e Valor -->
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">É bonificação?</label>
                      <select v-model="newDeliveryForm.is_bonificacao" class="input">
                        <option :value="false">Não</option>
                        <option :value="true">Sim</option>
                      </select>
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Valor</label>
                      <input
                        type="number"
                        v-model.number="newDeliveryForm.valor_unitario"
                        class="input"
                        :class="{ 'bg-gray-100 dark:bg-gray-700': newDeliveryForm.is_bonificacao }"
                        :disabled="newDeliveryForm.is_bonificacao"
                        step="0.01"
                        min="0"
                      />
                    </div>
                  </div>
                </div>

                <!-- Modal Footer -->
                <div class="border-t border-border-light dark:border-border-dark px-6 py-4 flex items-center justify-end gap-3">
                  <button @click="closeAddDeliveryModal" class="btn btn-secondary">Cancelar</button>
                  <button @click="addDeliveryItems" class="btn btn-primary">Salvar</button>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Modal de Editar Data -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-200"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="showEditDateModal" class="fixed inset-0 z-[70] overflow-y-auto">
          <div class="fixed inset-0 glass-backdrop" @click="showEditDateModal = false"></div>
          <div class="flex min-h-full items-center justify-center p-4">
            <Transition
              enter-active-class="transition-all duration-200"
              enter-from-class="opacity-0 scale-95"
              enter-to-class="opacity-100 scale-100"
              leave-active-class="transition-all duration-200"
              leave-from-class="opacity-100 scale-100"
              leave-to-class="opacity-0 scale-95"
            >
              <div v-if="showEditDateModal" class="relative glass-panel rounded-lg shadow-xl w-full max-w-sm">
                <!-- Header com icone -->
                <div class="p-6 pb-0">
                  <div class="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                    <span class="material-icons text-primary text-2xl">edit_calendar</span>
                  </div>
                  <h3 class="text-xl font-semibold text-text-light dark:text-text-dark">Editar Data</h3>
                  <p class="text-sm text-subtext-light dark:text-subtext-dark">Selecione uma data no calendário.</p>
                </div>

                <!-- Modal Body -->
                <div class="p-6">
                  <input
                    type="date"
                    v-model="editDateForm.data_entrega"
                    class="input"
                  />
                </div>

                <!-- Modal Footer -->
                <div class="border-t border-border-light dark:border-border-dark px-6 py-4 flex items-center justify-end gap-3">
                  <button @click="showEditDateModal = false" class="btn btn-secondary">Cancelar</button>
                  <button @click="saveEditDate" class="btn btn-primary">Salvar</button>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Modal de Editar Microverdes (item completo) -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-200"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="showEditDeliveryModal" class="fixed inset-0 z-[70] overflow-y-auto">
          <div class="fixed inset-0 glass-backdrop" @click="showEditDeliveryModal = false"></div>
          <div class="flex min-h-full items-center justify-center p-4">
            <Transition
              enter-active-class="transition-all duration-200"
              enter-from-class="opacity-0 scale-95"
              enter-to-class="opacity-100 scale-100"
              leave-active-class="transition-all duration-200"
              leave-from-class="opacity-100 scale-100"
              leave-to-class="opacity-0 scale-95"
            >
              <div v-if="showEditDeliveryModal" class="relative glass-panel rounded-lg shadow-xl w-full max-w-md">
                <!-- Header com icone -->
                <div class="p-6 pb-0">
                  <div class="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                    <span class="material-icons text-primary text-2xl">edit</span>
                  </div>
                  <h3 class="text-xl font-semibold text-text-light dark:text-text-dark">Editar microverdes</h3>
                  <p class="text-sm text-subtext-light dark:text-subtext-dark">Complete os campos abaixo</p>
                </div>

                <!-- Modal Body -->
                <div class="p-6 space-y-4">
                  <!-- Produto (readonly) -->
                  <div>
                    <p class="text-sm text-subtext-light dark:text-subtext-dark">Produto</p>
                    <p class="font-medium text-text-light dark:text-text-dark">{{ editDeliveryForm.produto_nome }}</p>
                  </div>

                  <!-- Data de entrega (readonly) -->
                  <div>
                    <p class="text-sm text-subtext-light dark:text-subtext-dark">Data de entrega</p>
                    <p class="font-medium text-text-light dark:text-text-dark">{{ editDeliveryForm.dia_semana }} - {{ formatDate(editDeliveryForm.data_entrega) }}</p>
                  </div>

                  <!-- Quantidade e Valor -->
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Quantidade</label>
                      <input type="number" v-model.number="editDeliveryForm.quantidade" class="input" min="1" />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Valor</label>
                      <input
                        type="number"
                        v-model.number="editDeliveryForm.valor_unitario"
                        class="input"
                        step="0.01"
                        min="0"
                      />
                    </div>
                  </div>
                </div>

                <!-- Modal Footer -->
                <div class="border-t border-border-light dark:border-border-dark px-6 py-4 flex items-center justify-end gap-3">
                  <button @click="showEditDeliveryModal = false" class="btn btn-secondary">Cancelar</button>
                  <button @click="saveEditDelivery" class="btn btn-primary">Salvar</button>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Modal de Tabelas de Preco - Lista -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-200"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="showTabelaPrecoModal" class="fixed inset-0 z-[70] overflow-y-auto">
          <div class="fixed inset-0 glass-backdrop" @click="showTabelaPrecoModal = false"></div>
          <div class="flex min-h-full items-center justify-center p-4">
            <Transition
              enter-active-class="transition-all duration-200"
              enter-from-class="opacity-0 scale-95"
              enter-to-class="opacity-100 scale-100"
              leave-active-class="transition-all duration-200"
              leave-from-class="opacity-100 scale-100"
              leave-to-class="opacity-0 scale-95"
            >
              <div v-if="showTabelaPrecoModal" class="relative glass-panel rounded-lg shadow-xl w-full max-w-lg">
                <!-- Header com icone -->
                <div class="p-6 pb-0">
                  <div class="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <span class="material-icons text-primary text-2xl">attach_money</span>
                  </div>
                  <h3 class="text-xl font-semibold text-text-light dark:text-text-dark">Tabelas de preco</h3>
                  <p class="text-sm text-subtext-light dark:text-subtext-dark">Cadastro de tabelas de precos</p>
                </div>

                <!-- Lista de tabelas -->
                <div class="p-6">
                  <p class="text-sm font-medium text-text-light dark:text-text-dark mb-3">Tabelas</p>
                  <div class="space-y-2 max-h-64 overflow-y-auto">
                    <div
                      v-for="tabela in tabelasPreco"
                      :key="tabela.id"
                      class="flex items-center justify-between p-3 border border-border-light dark:border-border-dark rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <span class="text-text-light dark:text-text-dark">{{ tabela.nome }}</span>
                      <button
                        @click="openTabelaPrecoEdit(tabela)"
                        class="text-gray-400 hover:text-primary p-1"
                        title="Editar tabela"
                      >
                        <span class="material-icons text-xl">edit_note</span>
                      </button>
                    </div>
                    <div v-if="tabelasPreco.length === 0" class="text-center py-4 text-subtext-light dark:text-subtext-dark">
                      Nenhuma tabela cadastrada
                    </div>
                  </div>
                </div>

                <!-- Footer -->
                <div class="p-6 pt-0 flex gap-3">
                  <button @click="showTabelaPrecoModal = false" class="flex-1 btn btn-secondary">Fechar</button>
                  <button @click="openTabelaPrecoCreate" class="flex-1 btn btn-primary">Nova tabela</button>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Modal de Tabelas de Preco - Editar -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-200"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="showTabelaPrecoEditModal" class="fixed inset-0 z-[80] overflow-y-auto">
          <div class="fixed inset-0 glass-backdrop" @click="closeTabelaPrecoEdit"></div>
          <div class="flex min-h-full items-center justify-center p-4">
            <Transition
              enter-active-class="transition-all duration-200"
              enter-from-class="opacity-0 scale-95"
              enter-to-class="opacity-100 scale-100"
              leave-active-class="transition-all duration-200"
              leave-from-class="opacity-100 scale-100"
              leave-to-class="opacity-0 scale-95"
            >
              <div v-if="showTabelaPrecoEditModal" class="relative glass-panel rounded-lg shadow-xl w-full max-w-lg">
                <!-- Header com icone -->
                <div class="p-6 pb-0">
                  <div class="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <span class="material-icons text-primary text-2xl">attach_money</span>
                  </div>
                  <h3 class="text-xl font-semibold text-text-light dark:text-text-dark">Tabelas de preco</h3>
                  <p class="text-sm text-subtext-light dark:text-subtext-dark">Cadastro de tabelas de precos</p>
                </div>

                <!-- Conteúdo -->
                <div class="p-6">
                  <!-- Nome da tabela -->
                  <div class="mb-4">
                    <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Nome da tabela</label>
                    <input
                      type="text"
                      v-model="selectedTabelaPreco!.nome"
                      class="input"
                      placeholder="Nome da tabela"
                    />
                  </div>

                  <!-- Adicionar produto -->
                  <div class="flex gap-2 mb-4">
                    <div class="flex-1">
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Adicionar produto</label>
                      <select v-model="newTabelaPrecoItemForm.produto_id" class="input text-sm">
                        <option value="">Selecione</option>
                        <option v-for="produto in produtos" :key="produto.id" :value="produto.id">
                          {{ produto.nome }}
                        </option>
                      </select>
                    </div>
                    <div class="w-28">
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Valor</label>
                      <input
                        type="text"
                        v-model="newTabelaPrecoItemForm.preco"
                        class="input text-sm"
                        placeholder="0,00"
                      />
                    </div>
                    <div class="flex items-end">
                      <button
                        @click="addTabelaPrecoItem"
                        class="p-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                      >
                        <span class="material-icons">add</span>
                      </button>
                    </div>
                  </div>

                  <!-- Lista de itens -->
                  <div class="mb-4">
                    <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-2">Itens da tabela</label>
                    <div class="space-y-2 max-h-48 overflow-y-auto">
                      <div
                        v-for="item in selectedTabelaPrecoItens"
                        :key="item.id"
                        class="flex items-center justify-between p-3 border border-border-light dark:border-border-dark rounded-lg"
                      >
                        <span class="text-sm text-text-light dark:text-text-dark">{{ item.produtos?.nome || 'Produto' }}</span>
                        <div class="flex items-center gap-2">
                          <input
                            type="text"
                            :value="formatCurrencyInput(item.preco)"
                            @blur="updateTabelaPrecoItemPreco(item.id, $event)"
                            class="input text-sm w-24 text-right"
                          />
                          <button
                            @click="removeTabelaPrecoItem(item.id)"
                            class="text-gray-400 hover:text-red-500 p-1"
                          >
                            <span class="material-icons">delete</span>
                          </button>
                        </div>
                      </div>
                      <div v-if="selectedTabelaPrecoItens.length === 0" class="text-center py-4 text-subtext-light dark:text-subtext-dark text-sm">
                        Nenhum item na tabela
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Footer -->
                <div class="p-6 pt-0">
                  <button @click="closeTabelaPrecoEdit" class="w-full btn btn-secondary">Voltar</button>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Modal de Tabelas de Preco - Criar Nova -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-200"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="showTabelaPrecoCreateModal" class="fixed inset-0 z-[80] overflow-y-auto">
          <div class="fixed inset-0 glass-backdrop" @click="showTabelaPrecoCreateModal = false"></div>
          <div class="flex min-h-full items-center justify-center p-4">
            <Transition
              enter-active-class="transition-all duration-200"
              enter-from-class="opacity-0 scale-95"
              enter-to-class="opacity-100 scale-100"
              leave-active-class="transition-all duration-200"
              leave-from-class="opacity-100 scale-100"
              leave-to-class="opacity-0 scale-95"
            >
              <div v-if="showTabelaPrecoCreateModal" class="relative glass-panel rounded-lg shadow-xl w-full max-w-lg">
                <!-- Header com icone -->
                <div class="p-6 pb-0">
                  <div class="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <span class="material-icons text-primary text-2xl">attach_money</span>
                  </div>
                  <h3 class="text-xl font-semibold text-text-light dark:text-text-dark">Tabelas de preco</h3>
                  <p class="text-sm text-subtext-light dark:text-subtext-dark">Cadastro de tabelas de precos</p>
                </div>

                <!-- Conteúdo -->
                <div class="p-6">
                  <div>
                    <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Nome da tabela</label>
                    <input
                      type="text"
                      v-model="newTabelaPrecoNome"
                      class="input"
                      placeholder="Ex: Varejo, Distribuidor..."
                    />
                  </div>
                </div>

                <!-- Footer -->
                <div class="p-6 pt-0 flex gap-3">
                  <button @click="showTabelaPrecoCreateModal = false" class="flex-1 btn btn-secondary">Voltar</button>
                  <button @click="createTabelaPreco" class="flex-1 btn btn-primary" :disabled="!newTabelaPrecoNome.trim()">Cadastrar</button>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Modal de Edição -->
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
              <div v-if="showEditModal" class="relative glass-panel rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            <!-- Modal Header -->
            <div class="sticky top-0 glass-panel border-b border-border-light dark:border-border-dark px-6 py-4 flex items-center justify-between z-10">
              <h2 class="text-lg font-semibold text-text-light dark:text-text-dark">Editar Contrato</h2>
              <button @click="closeEditModal" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <span class="material-icons">close</span>
              </button>
            </div>

            <!-- Modal Body -->
            <div class="p-6">
              <!-- Dados do Contrato -->
              <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Numero *</label>
                  <input type="text" v-model="editContrato.numero" class="input" required />
                </div>
                <div class="md:col-span-2">
                  <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Cliente *</label>
                  <select v-model="editContrato.cliente_id" class="input" required>
                    <option value="">Selecione o cliente</option>
                    <option v-for="cliente in clientes" :key="cliente.id" :value="cliente.id">
                      {{ cliente.nome_fantasia || cliente.razao_social }}
                    </option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Tipo *</label>
                  <select v-model="editContrato.tipo" class="input" required>
                    <option value="recorrente">Recorrente</option>
                    <option value="avulso">Avulso</option>
                  </select>
                </div>
                <div class="md:col-span-2">
                  <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Plano</label>
                  <input type="text" v-model="editContrato.plano" class="input" placeholder="Ex: Clube Bioma Light" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Data Inicio *</label>
                  <input type="date" v-model="editContrato.data_inicio" class="input" required />
                </div>
                <div>
                  <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Data Fim</label>
                  <input type="date" v-model="editContrato.data_fim" class="input" :disabled="editContrato.tipo === 'recorrente'" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Valor Mensal</label>
                  <input type="number" v-model.number="editContrato.valor_mensal" class="input" step="0.01" min="0" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Frequencia Entrega</label>
                  <select v-model="editContrato.frequencia_entrega" class="input">
                    <option value="semanal">Semanal</option>
                    <option value="quinzenal">Quinzenal</option>
                    <option value="mensal">Mensal</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Dia da Semana</label>
                  <select v-model="editContrato.dia_entrega" class="input">
                    <option value="">Selecione</option>
                    <option value="segunda">Segunda</option>
                    <option value="terca">Terca</option>
                    <option value="quarta">Quarta</option>
                    <option value="quinta">Quinta</option>
                    <option value="sexta">Sexta</option>
                    <option value="sabado">Sabado</option>
                  </select>
                </div>
                <div class="md:col-span-4">
                  <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Observações</label>
                  <textarea v-model="editContrato.observacoes" class="input min-h-[60px] resize-y" placeholder="Observações sobre o contrato"></textarea>
                </div>
              </div>

              <!-- Itens do Contrato -->
              <div class="border-t border-border-light dark:border-border-dark pt-4">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="text-sm font-semibold text-text-light dark:text-text-dark">Itens do Contrato</h3>
                  <button @click="addItemEdit" class="btn btn-secondary text-sm">
                    <span class="material-icons text-sm">add</span>
                    Adicionar Item
                  </button>
                </div>

                <div v-if="editContrato.itens && editContrato.itens.length > 0" class="space-y-2">
                  <div v-for="(item, index) in editContrato.itens" :key="index" class="flex items-end gap-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div class="flex-1">
                      <label class="block text-xs text-subtext-light dark:text-subtext-dark mb-1">Produto</label>
                      <select v-model="item.produto_id" class="input text-sm">
                        <option value="">Selecione</option>
                        <option v-for="produto in produtos" :key="produto.id" :value="produto.id">
                          {{ produto.codigo }} - {{ produto.nome }}
                        </option>
                      </select>
                    </div>
                    <div class="w-24">
                      <label class="block text-xs text-subtext-light dark:text-subtext-dark mb-1">Qtd</label>
                      <input type="number" v-model.number="item.quantidade" class="input text-sm" min="0" step="0.01" />
                    </div>
                    <div class="w-28">
                      <label class="block text-xs text-subtext-light dark:text-subtext-dark mb-1">Valor Unit.</label>
                      <input type="number" v-model.number="item.valor_unitario" class="input text-sm" min="0" step="0.01" />
                    </div>
                    <button @click="removeItemEdit(index)" class="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
                      <span class="material-icons text-sm">delete</span>
                    </button>
                  </div>
                </div>
                <p v-else class="text-sm text-subtext-light dark:text-subtext-dark text-center py-4">
                  Nenhum item adicionado
                </p>
              </div>
            </div>

            <!-- Modal Footer -->
            <div class="sticky bottom-0 glass-panel border-t border-border-light dark:border-border-dark px-6 py-4 flex items-center justify-end gap-3">
              <button @click="closeEditModal" class="btn btn-secondary" :disabled="saving">Cancelar</button>
              <button @click="updateContrato" class="btn btn-primary" :disabled="saving || !isEditFormValid">
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

    <!-- Modal de Detalhes -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-200"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="showDetailsModal" class="fixed inset-0 z-50 overflow-y-auto">
          <div class="fixed inset-0 glass-backdrop" @click="closeDetailsModal"></div>
          <div class="flex min-h-full items-center justify-center p-4">
            <Transition
              enter-active-class="transition-all duration-200"
              enter-from-class="opacity-0 scale-95"
              enter-to-class="opacity-100 scale-100"
              leave-active-class="transition-all duration-200"
              leave-from-class="opacity-100 scale-100"
              leave-to-class="opacity-0 scale-95"
            >
              <div v-if="showDetailsModal" class="relative glass-panel rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <!-- Modal Header -->
              <div class="sticky top-0 glass-panel border-b border-border-light dark:border-border-dark px-6 py-4 flex items-center justify-between z-10">
                <div>
                  <h2 class="text-lg font-semibold text-text-light dark:text-text-dark">Detalhes do Contrato</h2>
                  <p class="text-sm text-subtext-light dark:text-subtext-dark">Contrato #{{ selectedContrato?.numero }}</p>
                </div>
                <div class="flex items-center gap-2">
                  <button @click="openEditFromDetails" class="btn btn-secondary">
                    <span class="material-icons text-sm">edit</span>
                    Editar
                  </button>
                  <button @click="closeDetailsModal" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <span class="material-icons">close</span>
                  </button>
                </div>
              </div>

              <!-- Modal Body -->
              <div v-if="selectedContrato">

                <!-- Tab: Resumo do Contrato -->
                <div class="p-6">
                  <!-- Status -->
                  <div class="mb-6">
                    <span :class="['badge text-base px-4 py-2', getStatusClass(selectedContrato.status)]">
                      {{ getStatusLabel(selectedContrato.status) }}
                    </span>
                  </div>

                  <!-- Informações do Contrato -->
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <!-- Dados do Contrato -->
                    <div class="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                      <h3 class="text-sm font-semibold text-text-light dark:text-text-dark mb-3 flex items-center gap-2">
                        <span class="material-icons text-primary text-sm">description</span>
                        Dados do Contrato
                      </h3>
                      <dl class="space-y-2 text-sm">
                        <div class="flex justify-between">
                          <dt class="text-subtext-light dark:text-subtext-dark">Numero:</dt>
                          <dd class="font-medium text-text-light dark:text-text-dark">{{ selectedContrato.numero }}</dd>
                        </div>
                        <div class="flex justify-between">
                          <dt class="text-subtext-light dark:text-subtext-dark">Plano:</dt>
                          <dd class="font-medium text-text-light dark:text-text-dark">{{ selectedContrato.plano || '-' }}</dd>
                        </div>
                        <div class="flex justify-between">
                          <dt class="text-subtext-light dark:text-subtext-dark">Tipo:</dt>
                          <dd class="font-medium text-text-light dark:text-text-dark">{{ selectedContrato.tipo === 'recorrente' ? 'Recorrente' : 'Avulso' }}</dd>
                        </div>
                      </dl>
                    </div>

                    <!-- Cliente -->
                    <div class="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                      <h3 class="text-sm font-semibold text-text-light dark:text-text-dark mb-3 flex items-center gap-2">
                        <span class="material-icons text-primary text-sm">person</span>
                        Cliente
                      </h3>
                      <dl class="space-y-2 text-sm">
                        <div>
                          <dt class="text-subtext-light dark:text-subtext-dark">Nome:</dt>
                          <dd class="font-medium text-text-light dark:text-text-dark">
                            {{ selectedContrato.clientes?.nome_fantasia || selectedContrato.clientes?.razao_social || '-' }}
                          </dd>
                        </div>
                      </dl>
                    </div>

                    <!-- Datas e Valores -->
                    <div class="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                      <h3 class="text-sm font-semibold text-text-light dark:text-text-dark mb-3 flex items-center gap-2">
                        <span class="material-icons text-primary text-sm">event</span>
                        Periodo e Valores
                      </h3>
                      <dl class="space-y-2 text-sm">
                        <div class="flex justify-between">
                          <dt class="text-subtext-light dark:text-subtext-dark">Inicio:</dt>
                          <dd class="font-medium text-text-light dark:text-text-dark">{{ formatDate(selectedContrato.data_inicio) }}</dd>
                        </div>
                        <div class="flex justify-between">
                          <dt class="text-subtext-light dark:text-subtext-dark">Fim:</dt>
                          <dd class="font-medium text-text-light dark:text-text-dark">
                            {{ selectedContrato.tipo === 'recorrente' ? 'Recorrente' : formatDate(selectedContrato.data_fim) }}
                          </dd>
                        </div>
                        <div class="flex justify-between">
                          <dt class="text-subtext-light dark:text-subtext-dark">Valor Mensal:</dt>
                          <dd class="font-semibold text-text-light dark:text-text-dark">{{ formatCurrency(selectedContrato.valor_mensal || 0) }}</dd>
                        </div>
                      </dl>
                    </div>

                    <!-- Entrega -->
                    <div class="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                      <h3 class="text-sm font-semibold text-text-light dark:text-text-dark mb-3 flex items-center gap-2">
                        <span class="material-icons text-primary text-sm">local_shipping</span>
                        Entrega
                      </h3>
                      <dl class="space-y-2 text-sm">
                        <div class="flex justify-between">
                          <dt class="text-subtext-light dark:text-subtext-dark">Frequencia:</dt>
                          <dd class="font-medium text-text-light dark:text-text-dark capitalize">{{ selectedContrato.frequencia_entrega || '-' }}</dd>
                        </div>
                        <div class="flex justify-between">
                          <dt class="text-subtext-light dark:text-subtext-dark">Dia:</dt>
                          <dd class="font-medium text-text-light dark:text-text-dark capitalize">{{ selectedContrato.dia_entrega || '-' }}</dd>
                        </div>
                      </dl>
                    </div>
                  </div>

                  <!-- Observações -->
                  <div v-if="selectedContrato.observacoes" class="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 mb-6">
                    <h3 class="text-sm font-semibold text-text-light dark:text-text-dark mb-3 flex items-center gap-2">
                      <span class="material-icons text-primary text-sm">notes</span>
                      Observações
                    </h3>
                    <p class="text-sm text-text-light dark:text-text-dark whitespace-pre-wrap">{{ selectedContrato.observacoes }}</p>
                  </div>

                  <!-- Accordion: Previsao de Entrega -->
                  <div class="border border-border-light dark:border-border-dark rounded-lg mb-6">
                    <button
                      @click="showPrevisaoEntrega = !showPrevisaoEntrega"
                      class="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <div class="flex items-center gap-2">
                        <span class="material-icons text-primary">calendar_month</span>
                        <span class="font-semibold text-text-light dark:text-text-dark">Previsao de Entrega</span>
                        <span class="text-sm text-subtext-light dark:text-subtext-dark">({{ pedidosContrato.length }} entregas)</span>
                      </div>
                      <span class="material-icons text-subtext-light dark:text-subtext-dark transition-transform" :class="{ 'rotate-180': showPrevisaoEntrega }">
                        expand_more
                      </span>
                    </button>
                    <div v-if="showPrevisaoEntrega" class="border-t border-border-light dark:border-border-dark">
                      <div v-if="loadingPedidosContrato" class="p-4 text-center">
                        <span class="material-icons text-2xl text-gray-300 dark:text-gray-600 animate-spin">refresh</span>
                      </div>
                      <div v-else-if="pedidosContrato.length > 0" class="overflow-x-auto">
                        <table class="w-full text-sm">
                          <thead>
                            <tr class="bg-gray-100 dark:bg-gray-700">
                              <th class="text-left px-4 py-2">Data</th>
                              <th class="text-left px-4 py-2">Dia</th>
                              <th class="text-left px-4 py-2">Produtos</th>
                              <th class="text-right px-4 py-2">Valor</th>
                              <th class="text-center px-4 py-2">Status</th>
                            </tr>
                          </thead>
                          <tbody class="divide-y divide-border-light dark:divide-border-dark">
                            <tr v-for="pedido in pedidosContrato" :key="pedido.id" class="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                              <td class="px-4 py-3">{{ formatDate(pedido.data_entrega) }}</td>
                              <td class="px-4 py-3 capitalize">{{ getDiaSemana(pedido.data_entrega) }}</td>
                              <td class="px-4 py-3">
                                <span v-if="pedido.pedido_itens?.length">
                                  {{ pedido.pedido_itens.map((i: any) => i.produtos?.nome || 'Produto').join(', ') }}
                                </span>
                                <span v-else class="text-subtext-light dark:text-subtext-dark">-</span>
                              </td>
                              <td class="px-4 py-3 text-right">{{ formatCurrency(pedido.valor_total || 0) }}</td>
                              <td class="px-4 py-3 text-center">
                                <span :class="['badge text-xs', getPedidoStatusClass(pedido.status)]">
                                  {{ getPedidoStatusLabel(pedido.status) }}
                                </span>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <div v-else class="p-4 text-center text-sm text-subtext-light dark:text-subtext-dark">
                        Nenhuma entrega programada para este contrato
                      </div>
                    </div>
                  </div>

                  <!-- Itens do Contrato -->
                  <div class="border-t border-border-light dark:border-border-dark pt-6">
                    <h3 class="text-sm font-semibold text-text-light dark:text-text-dark mb-4 flex items-center gap-2">
                      <span class="material-icons text-primary text-sm">list</span>
                      Itens do Contrato ({{ contratoItens.length }})
                    </h3>

                    <div v-if="contratoItens.length > 0" class="overflow-x-auto">
                      <table class="w-full text-sm">
                        <thead>
                          <tr class="bg-gray-100 dark:bg-gray-700">
                            <th class="text-left px-4 py-2">Produto</th>
                            <th class="text-right px-4 py-2">Qtd</th>
                            <th class="text-right px-4 py-2">Valor Unit.</th>
                          </tr>
                        </thead>
                        <tbody class="divide-y divide-border-light dark:divide-border-dark">
                          <tr v-for="item in contratoItens" :key="item.id">
                            <td class="px-4 py-3">
                              {{ item.produtos?.codigo }} - {{ item.produtos?.nome }}
                            </td>
                            <td class="px-4 py-3 text-right">{{ item.quantidade }}</td>
                            <td class="px-4 py-3 text-right">{{ formatCurrency(item.valor_unitario) }}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <p v-else class="text-sm text-subtext-light dark:text-subtext-dark text-center py-4">
                      Nenhum item neste contrato
                    </p>
                  </div>

                  <!-- Metadados -->
                  <div class="mt-6 pt-4 border-t border-border-light dark:border-border-dark">
                    <div class="flex flex-wrap gap-4 text-xs text-subtext-light dark:text-subtext-dark">
                      <span>Criado em: {{ formatDateTime(selectedContrato.created_at) }}</span>
                      <span>Atualizado em: {{ formatDateTime(selectedContrato.updated_at) }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Modal Footer - Botões de Ação -->
              <div class="sticky bottom-0 glass-panel border-t border-border-light dark:border-border-dark px-6 py-4">
                <div class="flex gap-3">
                  <button
                    @click="abrirModalEnviarEmail"
                    class="btn btn-primary flex-1"
                  >
                    <span class="material-icons text-sm mr-2">email</span>
                    Enviar por E-mail
                  </button>
                  <button
                    v-if="selectedContrato?.status?.toLowerCase() !== 'cancelado' && selectedContrato?.status?.toLowerCase() !== 'finalizado'"
                    @click="showCancelarContratoModal = true"
                    class="btn bg-red-500 hover:bg-red-600 text-white flex-1"
                  >
                    <span class="material-icons text-sm mr-2">cancel</span>
                    Cancelar Contrato
                  </button>
                </div>
              </div>
              </div>
            </Transition>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Modal de Enviar Contrato por E-mail -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-200"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="showEnviarEmailModal" class="fixed inset-0 z-[80] overflow-y-auto">
          <div class="fixed inset-0 glass-backdrop" @click="showEnviarEmailModal = false"></div>
          <div class="flex min-h-full items-center justify-center p-4">
            <Transition
              enter-active-class="transition-all duration-200"
              enter-from-class="opacity-0 scale-95"
              enter-to-class="opacity-100 scale-100"
              leave-active-class="transition-all duration-200"
              leave-from-class="opacity-100 scale-100"
              leave-to-class="opacity-0 scale-95"
            >
              <div v-if="showEnviarEmailModal" class="relative glass-panel rounded-lg shadow-xl w-full max-w-md">
                <!-- Header com icone -->
                <div class="p-6 pb-0">
                  <div class="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                    <span class="material-icons text-primary text-2xl">email</span>
                  </div>
                  <h3 class="text-xl font-semibold text-text-light dark:text-text-dark">Enviar Contrato por E-mail</h3>
                  <p class="text-sm text-subtext-light dark:text-subtext-dark mt-1">Complete os campos abaixo</p>
                </div>

                <!-- Modal Body -->
                <div class="p-6 space-y-4">
                  <!-- Info do Cliente -->
                  <div class="flex justify-between text-sm">
                    <span class="text-subtext-light dark:text-subtext-dark">Cliente:</span>
                    <span class="font-medium text-text-light dark:text-text-dark">
                      {{ selectedContrato?.clientes?.nome_fantasia || selectedContrato?.clientes?.razao_social }}
                    </span>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span class="text-subtext-light dark:text-subtext-dark">Data de criacao:</span>
                    <span class="font-medium text-text-light dark:text-text-dark">
                      {{ formatDate(selectedContrato?.created_at) }}
                    </span>
                  </div>

                  <!-- Link da proposta -->
                  <div>
                    <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-2">
                      Link da proposta:
                    </label>
                    <div class="flex gap-2">
                      <input
                        type="text"
                        :value="contratoLink"
                        readonly
                        class="input flex-1 bg-gray-50 dark:bg-gray-800 text-sm"
                      />
                      <button
                        @click="copiarLink"
                        class="btn btn-secondary"
                        title="Copiar link"
                      >
                        <span class="material-icons text-sm">content_copy</span>
                      </button>
                    </div>
                  </div>

                  <!-- Chave de Acesso -->
                  <div>
                    <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-2">
                      Chave de acesso:
                    </label>
                    <div class="flex gap-2">
                      <input
                        type="text"
                        :value="contratoChaveAcesso"
                        readonly
                        :class="[
                          'input flex-1 bg-gray-50 dark:bg-gray-800',
                          selectedContrato?.chave_acesso ? 'font-mono tracking-wider' : 'text-gray-400 italic text-sm'
                        ]"
                      />
                      <button
                        @click="copiarChaveAcesso"
                        class="btn btn-secondary"
                        title="Copiar chave"
                        :disabled="!selectedContrato?.chave_acesso"
                      >
                        <span class="material-icons text-sm">content_copy</span>
                      </button>
                    </div>
                  </div>

                  <!-- E-mail do cliente -->
                  <div>
                    <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-2">
                      E-mail do cliente:
                    </label>
                    <input
                      type="email"
                      v-model="emailDestinatario"
                      placeholder="Digite o e-mail do destinatário"
                      class="input w-full"
                    />
                  </div>

                  <!-- Histórico de Envio -->
                  <div v-if="selectedContrato?.email_enviado_em" class="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div class="flex items-start gap-2">
                      <span class="material-icons text-green-500 text-base">check_circle</span>
                      <div>
                        <p class="text-xs font-medium text-green-800 dark:text-green-200">E-mail enviado anteriormente</p>
                        <p class="text-xs text-green-600 dark:text-green-300">
                          Para {{ selectedContrato.email_enviado_para }} em {{ formatDateTime(selectedContrato.email_enviado_em) }}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Modal Footer -->
                <div class="border-t border-border-light dark:border-border-dark px-6 py-4 flex items-center justify-end gap-3">
                  <button @click="showEnviarEmailModal = false" class="btn btn-secondary">Fechar</button>
                  <button
                    @click="enviarContratoPorEmail"
                    :disabled="enviandoEmail"
                    class="btn btn-primary"
                  >
                    <span v-if="enviandoEmail" class="material-icons text-sm animate-spin mr-2">refresh</span>
                    <span class="material-icons text-sm mr-2" v-else>send</span>
                    {{ enviandoEmail ? 'Enviando...' : 'Enviar' }}
                  </button>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Modal de Cancelar Contrato -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-200"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="showCancelarContratoModal" class="fixed inset-0 z-[80] overflow-y-auto">
          <div class="fixed inset-0 glass-backdrop" @click="showCancelarContratoModal = false"></div>
          <div class="flex min-h-full items-center justify-center p-4">
            <Transition
              enter-active-class="transition-all duration-200"
              enter-from-class="opacity-0 scale-95"
              enter-to-class="opacity-100 scale-100"
              leave-active-class="transition-all duration-200"
              leave-from-class="opacity-100 scale-100"
              leave-to-class="opacity-0 scale-95"
            >
              <div v-if="showCancelarContratoModal" class="relative glass-panel rounded-lg shadow-xl w-full max-w-md">
                <!-- Header com icone -->
                <div class="p-6 pb-0">
                  <div class="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center mb-4">
                    <span class="material-icons text-red-500 text-2xl">warning</span>
                  </div>
                  <h3 class="text-xl font-semibold text-text-light dark:text-text-dark">Cancelar Contrato</h3>
                  <p class="text-sm text-subtext-light dark:text-subtext-dark mt-1">Esta acao nao pode ser desfeita</p>
                </div>

                <!-- Modal Body -->
                <div class="p-6 space-y-4">
                  <!-- Alerta -->
                  <div class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p class="text-sm text-red-700 dark:text-red-300">
                      Ao cancelar este contrato, todas as entregas futuras serao canceladas e o cliente nao recebera mais os produtos programados.
                    </p>
                  </div>

                  <!-- Resumo do contrato -->
                  <div class="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                    <h4 class="font-medium text-text-light dark:text-text-dark mb-3 text-sm">Resumo do contrato</h4>
                    <dl class="space-y-2 text-sm">
                      <div class="flex justify-between">
                        <dt class="text-subtext-light dark:text-subtext-dark">Contrato:</dt>
                        <dd class="font-medium text-text-light dark:text-text-dark">#{{ selectedContrato?.numero }}</dd>
                      </div>
                      <div class="flex justify-between">
                        <dt class="text-subtext-light dark:text-subtext-dark">Cliente:</dt>
                        <dd class="font-medium text-text-light dark:text-text-dark">
                          {{ selectedContrato?.clientes?.nome_fantasia || selectedContrato?.clientes?.razao_social }}
                        </dd>
                      </div>
                      <div class="flex justify-between">
                        <dt class="text-subtext-light dark:text-subtext-dark">Entregas pendentes:</dt>
                        <dd class="font-medium text-text-light dark:text-text-dark">{{ entregasPendentes }}</dd>
                      </div>
                    </dl>
                  </div>

                  <!-- Motivo do cancelamento -->
                  <div>
                    <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-2">
                      Motivo do cancelamento (opcional)
                    </label>
                    <textarea
                      v-model="motivoCancelamento"
                      rows="3"
                      class="input w-full resize-none"
                      placeholder="Descreva o motivo do cancelamento..."
                    ></textarea>
                  </div>
                </div>

                <!-- Modal Footer -->
                <div class="border-t border-border-light dark:border-border-dark px-6 py-4 flex items-center justify-end gap-3">
                  <button @click="showCancelarContratoModal = false" class="btn btn-secondary">Voltar</button>
                  <button
                    @click="confirmarCancelamento"
                    :disabled="saving"
                    class="btn bg-red-500 hover:bg-red-600 text-white"
                  >
                    <span v-if="saving" class="material-icons text-sm animate-spin mr-2">refresh</span>
                    <span class="material-icons text-sm mr-2" v-else>cancel</span>
                    {{ saving ? 'Cancelando...' : 'Confirmar Cancelamento' }}
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

interface Cliente {
  id: string
  razao_social: string
  nome_fantasia: string | null
  email?: string | null
}

interface Produto {
  id: string
  codigo: string
  nome: string
  preco_padrao: number | null
}

interface ContratoItem {
  id?: string
  contrato_id?: string
  produto_id: string
  quantidade: number
  valor_unitario: number
  produtos?: Produto
}

interface TabelaPreco {
  id: string
  nome: string
  descricao: string | null
  ativo: boolean
}

interface TabelaPrecoItem {
  id: string
  tabela_preco_id: string
  produto_id: string
  preco: number
  produtos?: Produto
}

interface WeeklyDeliveryItem {
  id: string
  dia_semana: 'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta' | 'sabado'
  quantidade: number
  produto_id: string
  valor_unitario: number
  produto_nome?: string
}

interface DeliveryScheduleItem {
  id: string
  data_entrega: string
  dia_semana: string
  quantidade: number
  produto_id: string
  valor_unitario: number
  produto_nome?: string
  editando_data?: boolean
  is_bonificacao?: boolean
}

interface ClienteEndereco {
  id: string
  cliente_id: string
  nome: string
  cep: string | null
  logradouro: string | null
  numero: string | null
  complemento: string | null
  bairro: string | null
  cidade: string | null
  estado: string | null
  principal: boolean
  ativo: boolean
}

interface Contrato {
  id: string
  empresa_id: string
  cliente_id: string | null
  numero: string
  plano: string | null
  tipo: string
  tipo_plano: string | null
  modalidade: string | null
  bonificacao: number | null
  possui_credito_anterior: boolean
  valor_credito: number | null
  usar_endereco_entrega_cliente: boolean
  endereco_entrega_customizado: string | null
  valor_frete_entrega: number | null
  tabela_preco_id: string | null
  produto_referencia_id: string | null
  data_inicio: string
  data_fim: string | null
  valor_mensal: number | null
  frequencia_entrega: string | null
  dia_entrega: string | null
  status: string
  observacoes: string | null
  created_at: string
  updated_at: string
  chave_acesso: string | null
  email_enviado_em: string | null
  email_enviado_para: string | null
  clientes?: Cliente
}

const supabase = useSupabaseClient()
const { currentCompany } = useCurrentCompany()
const { success, error: showError } = useToast()

// Estado
const contratos = ref<Contrato[]>([])
const clientes = ref<Cliente[]>([])
const produtos = ref<Produto[]>([])
const tabelasPreco = ref<TabelaPreco[]>([])
const contratoItens = ref<ContratoItem[]>([])
const tabelaPrecoItens = ref<TabelaPrecoItem[]>([])
const clienteEnderecos = ref<ClienteEndereco[]>([])
const loading = ref(false)
const saving = ref(false)
const loadingTabelaPrecoItens = ref(false)

// Formulario da etapa 2 - item semanal
const weeklyItemForm = ref({
  dia_semana: '' as string,
  quantidade: 1,
  produto_id: '',
  valor_unitario: 0
})

// Modal e formulario para adicionar entrega manual na etapa 3
const showAddDeliveryModal = ref(false)
const newDeliveryForm = ref({
  datas_selecionadas: [] as string[],
  quantidade: 1,
  produto_id: '',
  valor_unitario: 0,
  is_bonificacao: false
})

// Modal de edição de data
const showEditDateModal = ref(false)
const editDateForm = ref({
  item_id: '',
  data_entrega: ''
})

// Modal de edição de microverdes (item completo)
const showEditDeliveryModal = ref(false)
const editDeliveryForm = ref({
  item_id: '',
  produto_id: '',
  produto_nome: '',
  data_entrega: '',
  dia_semana: '',
  quantidade: 1,
  valor_unitario: 0
})

// Dropdown de datas para multi-select
const showDatasDropdown = ref(false)

// Computed para datas disponíveis (todas as datas do período)
const datasDisponiveis = computed(() => {
  const datas: string[] = []
  if (!newContrato.value.data_inicio || !newContrato.value.data_fim) return datas

  const startDate = new Date(newContrato.value.data_inicio + 'T00:00:00')
  const endDate = new Date(newContrato.value.data_fim + 'T00:00:00')
  const currentDate = new Date(startDate)

  while (currentDate <= endDate) {
    datas.push(currentDate.toISOString().split('T')[0])
    currentDate.setDate(currentDate.getDate() + 1)
  }

  return datas
})

// Computed para datas ordenadas para exibição no dropdown
const datasDisponiveisOrdenadas = computed(() => {
  return [...datasDisponiveis.value].sort()
})

// Etapa atual do formulario multi-etapas
const currentStep = ref(1)

// Modais
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDetailsModal = ref(false)
const selectedContrato = ref<Contrato | null>(null)

// Modal Detalhes - Estados
const showPrevisaoEntrega = ref(false)
const pedidosContrato = ref<any[]>([])
const loadingPedidosContrato = ref(false)

// Modal de Envio por E-mail
const showEnviarEmailModal = ref(false)
const emailDestinatario = ref('')
const enviandoEmail = ref(false)

// Modal de Cancelamento
const showCancelarContratoModal = ref(false)
const motivoCancelamento = ref('')

// Paginacao
const currentPage = ref(1)
const itemsPerPage = ref(10)
const pageInput = ref('1')

// Filtros
const searchQuery = ref('')
const filterCliente = ref('')
const filterStatus = ref('Ativo')
const showCancelados = ref(false)

// Ordenacao
const sortField = ref<string>('data_inicio')
const sortDirection = ref<'asc' | 'desc'>('desc')

// Formularios
const getEmptyContrato = () => ({
  numero: '',
  cliente_id: '',
  plano: '',
  tipo: 'recorrente',
  tipo_plano: '' as string,
  modalidade: '' as string,
  bonificacao: 0 as number,
  possui_credito_anterior: '' as boolean | string,
  valor_credito: 0 as number,
  usar_endereco_entrega_cliente: '' as boolean | string,
  endereco_entrega_customizado: '',
  endereco_entrega_id: '' as string,
  valor_frete_entrega: 0 as number,
  tabela_preco_id: '' as string,
  produto_referencia_id: '' as string,
  data_inicio: new Date().toISOString().split('T')[0],
  data_fim: '',
  valor_mensal: null as number | null,
  frequencia_entrega: 'semanal',
  dia_entrega: '',
  observacoes: '',
  itens: [] as ContratoItem[],
  // Campos para etapas 2-5
  weekly_items: [] as WeeklyDeliveryItem[],
  delivery_schedule: [] as DeliveryScheduleItem[],
  forma_pagamento: '' as string
})

const newContrato = ref(getEmptyContrato())
const editContrato = ref<any>({})

// Modal de tabelas de preco
const showTabelaPrecoModal = ref(false)
const showTabelaPrecoEditModal = ref(false)
const showTabelaPrecoCreateModal = ref(false)
const selectedTabelaPreco = ref<TabelaPreco | null>(null)
const selectedTabelaPrecoItens = ref<TabelaPrecoItem[]>([])
const newTabelaPrecoNome = ref('')
const newTabelaPrecoItemForm = ref({ produto_id: '', preco: 0 })
const loadingTabelaPreco = ref(false)

// Computed
const hasActiveFilters = computed(() => {
  return filterCliente.value || filterStatus.value !== 'ativo' || filterTipo.value
})

// Endereco de entrega do cliente selecionado
const enderecoEntregaCliente = computed(() => {
  if (!newContrato.value.cliente_id) return ''
  const cliente = clientes.value.find(c => c.id === newContrato.value.cliente_id) as any
  if (!cliente) return ''

  // Montar endereco a partir dos campos do cliente
  const partes = []
  if (cliente.logradouro_entrega) partes.push(cliente.logradouro_entrega)
  if (cliente.numero_entrega) partes.push(cliente.numero_entrega)
  if (cliente.bairro_entrega) partes.push(cliente.bairro_entrega)
  if (cliente.cidade_entrega) partes.push(cliente.cidade_entrega)
  if (cliente.estado_entrega) partes.push(cliente.estado_entrega)

  if (partes.length === 0) {
    // Tentar endereco principal
    if (cliente.logradouro) partes.push(cliente.logradouro)
    if (cliente.numero) partes.push(cliente.numero)
    if (cliente.bairro) partes.push(cliente.bairro)
    if (cliente.cidade) partes.push(cliente.cidade)
    if (cliente.estado) partes.push(cliente.estado)
  }

  return partes.join(', ') || 'Endereço não cadastrado'
})

// Computed para modal detalhes - Link e chave de acesso do contrato
const contratoLink = computed(() => {
  if (!selectedContrato.value) return ''
  // Link para página pública de visualização do contrato
  const baseUrl = window?.location?.origin || 'https://app.fazendasbioma.com.br'
  return `${baseUrl}/contrato/${selectedContrato.value.id}`
})

const contratoChaveAcesso = computed(() => {
  if (!selectedContrato.value) return ''
  // Usar chave de acesso do banco de dados
  return selectedContrato.value.chave_acesso || 'Gerando...'
})

const emailClientePadrao = computed(() => {
  if (!selectedContrato.value?.clientes) return ''
  const cliente = selectedContrato.value.clientes as any
  return cliente.email || ''
})

const entregasPendentes = computed(() => {
  return pedidosContrato.value.filter(p =>
    p.status?.toLowerCase() === 'previsto' || p.status?.toLowerCase() === 'confirmado'
  ).length
})

const filteredContratos = computed(() => {
  let result = [...contratos.value]

  // Filtro por cliente
  if (filterCliente.value) {
    result = result.filter(contrato => contrato.cliente_id === filterCliente.value)
  }

  // Filtro por cancelados - só mostra cancelados se toggle estiver ativo
  if (!showCancelados.value) {
    result = result.filter(contrato => contrato.status?.toLowerCase() !== 'cancelado')
  }

  // Ordenacao por primeira entrega (mais recente primeiro)
  result.sort((a, b) => {
    const dateA = new Date(a.primeira_entrega || a.data_inicio || '').getTime()
    const dateB = new Date(b.primeira_entrega || b.data_inicio || '').getTime()
    return dateB - dateA
  })

  return result
})

const totalPages = computed(() => Math.ceil(filteredContratos.value.length / itemsPerPage.value) || 1)

const paginatedContratos = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  return filteredContratos.value.slice(start, start + itemsPerPage.value)
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

const isCreateFormValid = computed(() => {
  return newContrato.value.cliente_id && newContrato.value.data_inicio
})

const isEditFormValid = computed(() => {
  return editContrato.value.numero && editContrato.value.cliente_id && editContrato.value.data_inicio
})

// Computed properties para Etapa 2 - Totais semanais
const totalEntregasSemana = computed(() => {
  const diasUnicos = new Set(newContrato.value.weekly_items.map(item => item.dia_semana))
  return diasUnicos.size
})

const totalProdutosUnicos = computed(() => {
  const produtosUnicos = new Set(newContrato.value.weekly_items.map(item => item.produto_id))
  return produtosUnicos.size
})

const totalProdutosSemana = computed(() => {
  return newContrato.value.weekly_items.reduce((sum, item) => sum + item.quantidade, 0)
})

// Computed properties para Etapa 3 - Totais de entregas
const totalEntregas = computed(() => {
  return newContrato.value.delivery_schedule.length
})

const totalProdutos = computed(() => {
  return newContrato.value.delivery_schedule
    .filter(item => !item.is_bonificacao)
    .reduce((sum, item) => sum + item.quantidade, 0)
})

const totalBonificacaoQtd = computed(() => {
  return newContrato.value.delivery_schedule
    .filter(item => item.is_bonificacao)
    .reduce((sum, item) => sum + item.quantidade, 0)
})

const valorProdutos = computed(() => {
  return newContrato.value.delivery_schedule.reduce(
    (sum, item) => sum + (item.quantidade * item.valor_unitario), 0
  )
})

const valorBonificacao = computed(() => {
  const bonificacaoPercent = newContrato.value.bonificacao || 0
  return valorProdutos.value * (bonificacaoPercent / 100)
})

const valorTotalCreditos = computed(() => {
  return newContrato.value.possui_credito_anterior === true ? (newContrato.value.valor_credito || 0) : 0
})

const valorTotalMicroverdesReceber = computed(() => {
  return valorProdutos.value + valorBonificacao.value
})

const valorMicroverdesUtilizacao = computed(() => {
  return valorProdutos.value
})

const valorResidualCredito = computed(() => {
  return valorBonificacao.value + valorTotalCreditos.value
})

// Computed properties para Etapa 4 - Pagamento
const valorFreteEntrega = computed(() => {
  return newContrato.value.valor_frete_entrega || 0
})

const valorTotalFrete = computed(() => {
  return totalEntregas.value * valorFreteEntrega.value
})

const valorAPagar = computed(() => {
  return valorMicroverdesUtilizacao.value + valorTotalFrete.value
})

// Computed para produtos agrupados por tipo (resumo)
const produtosPorTipo = computed(() => {
  const grupos: Record<string, number> = {}
  newContrato.value.delivery_schedule.forEach(item => {
    const nome = item.produto_nome || 'Produto'
    grupos[nome] = (grupos[nome] || 0) + item.quantidade
  })
  return grupos
})

// Validacao por etapa
const isStep1Valid = computed(() => {
  const baseValid = !!(
    newContrato.value.cliente_id &&
    newContrato.value.tipo_plano &&
    newContrato.value.data_inicio &&
    newContrato.value.data_fim &&
    newContrato.value.tabela_preco_id
  )

  // Para Clube Bioma Pro, bonificacao é obrigatória
  if (newContrato.value.tipo_plano === 'clube_bioma_pro') {
    return baseValid && newContrato.value.bonificacao > 0
  }

  return baseValid
})

const isStep2Valid = computed(() => {
  return newContrato.value.weekly_items.length > 0
})

const isStep3Valid = computed(() => {
  return newContrato.value.delivery_schedule.length > 0
})

const isStep4Valid = computed(() => {
  return !!newContrato.value.forma_pagamento
})

const canAdvanceStep = computed(() => {
  switch (currentStep.value) {
    case 1: return isStep1Valid.value
    case 2: return isStep2Valid.value
    case 3: return isStep3Valid.value
    case 4: return isStep4Valid.value
    default: return true
  }
})

// Funcoes auxiliares
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

function getStatusClass(status: string): string {
  switch (status?.toLowerCase()) {
    case 'ativo': return 'badge-success'
    case 'pausado': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
    case 'cancelado': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    case 'finalizado': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    case 'draft': return 'badge-inactive'
    default: return 'badge-inactive'
  }
}

function getStatusLabel(status: string): string {
  switch (status?.toLowerCase()) {
    case 'ativo': return 'Ativo'
    case 'pausado': return 'Pausado'
    case 'cancelado': return 'Cancelado'
    case 'finalizado': return 'Finalizado'
    case 'draft': return 'Draft'
    default: return status || 'Draft'
  }
}

function getTipoPlanoLabel(tipo: string): string {
  switch (tipo) {
    case 'clube_bioma_light': return 'Clube Bioma Light'
    case 'clube_bioma_pro': return 'Clube Bioma Pro'
    case 'pedido_recorrente': return 'Pedido recorrente'
    default: return tipo || '-'
  }
}

function getModalidadeLabel(modalidade: string): string {
  switch (modalidade) {
    case 'recorrente': return 'Recorrente'
    case 'mensal': return 'Mensal'
    case 'trimestral': return 'Trimestral'
    case 'semestral': return 'Semestral'
    default: return modalidade || 'Recorrente'
  }
}

function getProgressoEntregas(contrato: any): number {
  const realizadas = contrato.entregas_realizadas || 0
  const total = contrato.total_entregas || 0
  if (total === 0) return 0
  return Math.min(100, (realizadas / total) * 100)
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
  filterCliente.value = ''
  filterStatus.value = 'ativo'
  filterTipo.value = ''
  currentPage.value = 1
}

// Funcoes para o formulario multi-etapas
function onTipoPlanoChange() {
  const tipoPlano = newContrato.value.tipo_plano

  // Resetar modalidade e bonificacao ao trocar tipo de plano
  if (tipoPlano === 'clube_bioma_light') {
    newContrato.value.modalidade = 'recorrente'
    newContrato.value.bonificacao = 0
  } else if (tipoPlano === 'pedido_recorrente') {
    newContrato.value.modalidade = 'recorrente'
    newContrato.value.bonificacao = 0
  } else if (tipoPlano === 'clube_bioma_pro') {
    // Clube Bioma Pro: modalidade selecionavel, bonificacao digitavel
    newContrato.value.modalidade = 'semestral' // default
    newContrato.value.bonificacao = 0
  } else {
    newContrato.value.modalidade = ''
    newContrato.value.bonificacao = 0
  }

  // Atualizar o campo plano com o nome legivel
  updatePlanoName()

  // Calcular data fim se for Clube Bioma Pro
  calcularDataFim()
}

function onModalidadeChange() {
  // Atualiza o nome do plano
  updatePlanoName()

  // Recalcular data fim se for Clube Bioma Pro
  calcularDataFim()
}

// Calcular data fim automaticamente para Clube Bioma Pro
function calcularDataFim() {
  // Só calcula automaticamente para Clube Bioma Pro
  if (newContrato.value.tipo_plano !== 'clube_bioma_pro') {
    return
  }

  // Precisa ter data de inicio
  if (!newContrato.value.data_inicio) {
    return
  }

  const dataInicio = new Date(newContrato.value.data_inicio + 'T00:00:00')
  let dataFim: Date

  switch (newContrato.value.modalidade) {
    case 'mensal':
      dataFim = new Date(dataInicio)
      dataFim.setMonth(dataFim.getMonth() + 1)
      break
    case 'trimestral':
      dataFim = new Date(dataInicio)
      dataFim.setMonth(dataFim.getMonth() + 3)
      break
    case 'semestral':
    default:
      dataFim = new Date(dataInicio)
      dataFim.setMonth(dataFim.getMonth() + 6)
      break
  }

  newContrato.value.data_fim = dataFim.toISOString().split('T')[0]
}

function updatePlanoName() {
  const tipoPlano = newContrato.value.tipo_plano
  switch (tipoPlano) {
    case 'clube_bioma_light':
      newContrato.value.plano = 'Clube Bioma Light'
      break
    case 'clube_bioma_pro':
      newContrato.value.plano = 'Clube Bioma Pro'
      break
    case 'pedido_recorrente':
      newContrato.value.plano = 'Pedido Recorrente'
      break
    default:
      newContrato.value.plano = ''
  }
}

function formatCurrencyInput(value: number | null): string {
  if (value === null || value === undefined || value === 0) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function parseCurrencyInput(event: Event): number {
  const input = event.target as HTMLInputElement
  const value = input.value.replace(/[^\d,]/g, '').replace(',', '.')
  return parseFloat(value) || 0
}

// Funcoes para input de moeda melhorado
function formatCurrencyDisplay(value: number | null): string {
  if (value === null || value === undefined || value === 0) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function onCurrencyFocus(event: Event, field: string) {
  const input = event.target as HTMLInputElement
  const value = (newContrato.value as any)[field] || 0
  // Mostrar apenas o numero ao focar
  input.value = value > 0 ? value.toString().replace('.', ',') : ''
}

function onCurrencyBlur(event: Event, field: string) {
  const input = event.target as HTMLInputElement
  const value = (newContrato.value as any)[field] || 0
  // Mostrar formatado ao sair
  input.value = formatCurrencyDisplay(value)
}

function onCurrencyInput(event: Event, field: string) {
  const input = event.target as HTMLInputElement
  // Permitir apenas numeros e virgula
  let value = input.value.replace(/[^\d,]/g, '')
  // Garantir apenas uma virgula
  const parts = value.split(',')
  if (parts.length > 2) {
    value = parts[0] + ',' + parts.slice(1).join('')
  }
  // Limitar casas decimais
  if (parts.length === 2 && parts[1].length > 2) {
    value = parts[0] + ',' + parts[1].substring(0, 2)
  }
  input.value = value
  // Converter para numero
  const numValue = parseFloat(value.replace(',', '.')) || 0;
  (newContrato.value as any)[field] = numValue
}

// Itens do contrato
function addItemCreate() {
  newContrato.value.itens.push({
    produto_id: '',
    quantidade: 1,
    valor_unitario: 0
  })
}

function removeItemCreate(index: number) {
  newContrato.value.itens.splice(index, 1)
}

function addItemEdit() {
  if (!editContrato.value.itens) editContrato.value.itens = []
  editContrato.value.itens.push({
    produto_id: '',
    quantidade: 1,
    valor_unitario: 0
  })
}

function removeItemEdit(index: number) {
  editContrato.value.itens.splice(index, 1)
}

// Funcoes para gerenciar tabelas de preco
async function openTabelaPrecoEdit(tabela: TabelaPreco) {
  selectedTabelaPreco.value = { ...tabela }
  loadingTabelaPreco.value = true

  try {
    const { data, error } = await supabase
      .from('tabela_preco_itens')
      .select('*, produtos(id, codigo, nome)')
      .eq('tabela_preco_id', tabela.id)
      .order('created_at', { ascending: true })

    if (error) throw error
    selectedTabelaPrecoItens.value = data || []
  } catch (e: any) {
    console.error('Erro ao carregar itens da tabela:', e)
    selectedTabelaPrecoItens.value = []
  } finally {
    loadingTabelaPreco.value = false
  }

  showTabelaPrecoModal.value = false
  showTabelaPrecoEditModal.value = true
}

function closeTabelaPrecoEdit() {
  showTabelaPrecoEditModal.value = false
  showTabelaPrecoModal.value = true
  selectedTabelaPreco.value = null
  selectedTabelaPrecoItens.value = []
}

function openTabelaPrecoCreate() {
  newTabelaPrecoNome.value = ''
  showTabelaPrecoModal.value = false
  showTabelaPrecoCreateModal.value = true
}

async function createTabelaPreco() {
  if (!currentCompany.value?.id || !newTabelaPrecoNome.value.trim()) return

  try {
    const { data, error } = await supabase
      .from('tabelas_preco')
      .insert({
        empresa_id: currentCompany.value.id,
        nome: newTabelaPrecoNome.value.trim(),
        ativo: true
      })
      .select()
      .single()

    if (error) throw error

    success('Tabela de preço criada com sucesso')
    await loadTabelasPreco()
    showTabelaPrecoCreateModal.value = false
    showTabelaPrecoModal.value = true
  } catch (e: any) {
    console.error('Erro ao criar tabela de preço:', e)
    showError('Erro ao criar tabela de preço')
  }
}

async function addTabelaPrecoItem() {
  if (!selectedTabelaPreco.value?.id || !newTabelaPrecoItemForm.value.produto_id) {
    showError('Selecione um produto')
    return
  }

  // Verificar se produto ja existe na tabela
  const existe = selectedTabelaPrecoItens.value.some(i => i.produto_id === newTabelaPrecoItemForm.value.produto_id)
  if (existe) {
    showError('Produto já existe na tabela')
    return
  }

  try {
    const preco = typeof newTabelaPrecoItemForm.value.preco === 'string'
      ? parseFloat((newTabelaPrecoItemForm.value.preco as string).replace(',', '.')) || 0
      : newTabelaPrecoItemForm.value.preco || 0

    const { data, error } = await supabase
      .from('tabela_preco_itens')
      .insert({
        tabela_preco_id: selectedTabelaPreco.value.id,
        produto_id: newTabelaPrecoItemForm.value.produto_id,
        preco: preco
      })
      .select('*, produtos(id, codigo, nome)')
      .single()

    if (error) throw error

    selectedTabelaPrecoItens.value.push(data)
    newTabelaPrecoItemForm.value = { produto_id: '', preco: 0 }
  } catch (e: any) {
    console.error('Erro ao adicionar item:', e)
    showError('Erro ao adicionar item')
  }
}

async function removeTabelaPrecoItem(itemId: string) {
  try {
    const { error } = await supabase
      .from('tabela_preco_itens')
      .delete()
      .eq('id', itemId)

    if (error) throw error

    selectedTabelaPrecoItens.value = selectedTabelaPrecoItens.value.filter(i => i.id !== itemId)
  } catch (e: any) {
    console.error('Erro ao remover item:', e)
    showError('Erro ao remover item')
  }
}

async function updateTabelaPrecoItemPreco(itemId: string, event: Event) {
  const input = event.target as HTMLInputElement
  const value = input.value.replace(/[^\d,]/g, '').replace(',', '.')
  const preco = parseFloat(value) || 0

  try {
    const { error } = await supabase
      .from('tabela_preco_itens')
      .update({ preco })
      .eq('id', itemId)

    if (error) throw error

    const item = selectedTabelaPrecoItens.value.find(i => i.id === itemId)
    if (item) item.preco = preco
  } catch (e: any) {
    console.error('Erro ao atualizar preco:', e)
  }
}

// Carregar dados
async function loadContratos() {
  if (!currentCompany.value?.id) {
    contratos.value = []
    return
  }

  loading.value = true
  try {
    const { data, error } = await supabase
      .from('contratos')
      .select('*, clientes(id, razao_social, nome_fantasia, email)')
      .eq('empresa_id', currentCompany.value.id)
      .order('data_inicio', { ascending: false })

    if (error) throw error
    contratos.value = data || []
  } catch (e: any) {
    console.error('Erro ao carregar contratos:', e)
    showError('Erro ao carregar contratos')
  } finally {
    loading.value = false
  }
}

async function loadClientes() {
  if (!currentCompany.value?.id) {
    clientes.value = []
    return
  }

  try {
    const { data, error } = await supabase
      .from('clientes')
      .select('id, razao_social, nome_fantasia, email, logradouro, numero, bairro, cidade, estado, cep_entrega, logradouro_entrega, numero_entrega, bairro_entrega, cidade_entrega, estado_entrega')
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
      .select('id, codigo, nome, preco_padrao')
      .eq('empresa_id', currentCompany.value.id)
      .eq('ativo', true)
      .order('nome', { ascending: true })

    if (error) throw error
    produtos.value = data || []
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
      .select('id, nome, descricao, ativo')
      .eq('empresa_id', currentCompany.value.id)
      .eq('ativo', true)
      .order('nome', { ascending: true })

    if (error) throw error
    tabelasPreco.value = data || []
  } catch (e: any) {
    console.error('Erro ao carregar tabelas de preco:', e)
  }
}

async function loadContratoItens(contratoId: string) {
  try {
    const { data, error } = await supabase
      .from('contrato_itens')
      .select('*, produtos(id, codigo, nome)')
      .eq('contrato_id', contratoId)
      .order('created_at', { ascending: true })

    if (error) throw error
    contratoItens.value = data || []
  } catch (e: any) {
    console.error('Erro ao carregar itens do contrato:', e)
    contratoItens.value = []
  }
}

// Carregar itens da tabela de preco selecionada
async function loadTabelaPrecoItens(tabelaPrecoId: string) {
  if (!tabelaPrecoId) {
    tabelaPrecoItens.value = []
    return
  }

  loadingTabelaPrecoItens.value = true
  try {
    const { data, error } = await supabase
      .from('tabela_preco_itens')
      .select('*, produtos(id, codigo, nome)')
      .eq('tabela_preco_id', tabelaPrecoId)

    if (error) throw error
    tabelaPrecoItens.value = data || []
  } catch (e: any) {
    console.error('Erro ao carregar itens da tabela de preco:', e)
    tabelaPrecoItens.value = []
  } finally {
    loadingTabelaPrecoItens.value = false
  }
}

// Carregar enderecos do cliente selecionado
async function loadClienteEnderecos(clienteId: string) {
  if (!clienteId) {
    clienteEnderecos.value = []
    return
  }

  try {
    const { data, error } = await supabase
      .from('cliente_enderecos')
      .select('*')
      .eq('cliente_id', clienteId)
      .eq('ativo', true)
      .order('principal', { ascending: false })

    if (error) throw error
    clienteEnderecos.value = data || []
  } catch (e: any) {
    console.error('Erro ao carregar enderecos do cliente:', e)
    clienteEnderecos.value = []
  }
}

// Obter preco de um produto da tabela de precos selecionada
function getPrecoFromTabela(produtoId: string): number {
  const item = tabelaPrecoItens.value.find(i => i.produto_id === produtoId)
  if (item) return item.preco
  // Fallback para preco padrao do produto
  const produto = produtos.value.find(p => p.id === produtoId)
  return produto?.preco_padrao || 0
}

// Gerar ID unico para itens temporarios
function generateId(): string {
  return Math.random().toString(36).substring(2, 11)
}

// Obter label do dia da semana
function getDiaSemanaLabel(dia: string): string {
  const labels: Record<string, string> = {
    segunda: 'Segunda',
    terca: 'Terca',
    quarta: 'Quarta',
    quinta: 'Quinta',
    sexta: 'Sexta',
    sabado: 'Sabado'
  }
  return labels[dia] || dia
}

// Obter dia da semana a partir de uma data
function getDiaSemanaFromDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  const days = ['Domingo', 'Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado']
  return days[date.getDay()]
}

// Handler para mudanca de tabela de preco
async function onTabelaPrecoChangeCreate() {
  await loadTabelaPrecoItens(newContrato.value.tabela_preco_id)
  // Limpar itens semanais quando trocar tabela de preco
  newContrato.value.weekly_items = []
  newContrato.value.delivery_schedule = []
}

// Handler para mudanca de cliente
async function onClienteChangeCreate() {
  await loadClienteEnderecos(newContrato.value.cliente_id)
  newContrato.value.endereco_entrega_id = ''
}

// Handler para selecao de produto no formulario semanal
function onWeeklyProductChange() {
  if (weeklyItemForm.value.produto_id) {
    weeklyItemForm.value.valor_unitario = getPrecoFromTabela(weeklyItemForm.value.produto_id)
  } else {
    weeklyItemForm.value.valor_unitario = 0
  }
}

// Adicionar item semanal (Etapa 2)
function addWeeklyItem() {
  if (!weeklyItemForm.value.dia_semana || !weeklyItemForm.value.produto_id || weeklyItemForm.value.quantidade <= 0) {
    showError('Preencha todos os campos')
    return
  }

  const produto = produtos.value.find(p => p.id === weeklyItemForm.value.produto_id)

  newContrato.value.weekly_items.push({
    id: generateId(),
    dia_semana: weeklyItemForm.value.dia_semana as WeeklyDeliveryItem['dia_semana'],
    quantidade: weeklyItemForm.value.quantidade,
    produto_id: weeklyItemForm.value.produto_id,
    valor_unitario: weeklyItemForm.value.valor_unitario,
    produto_nome: produto?.nome
  })

  // Reset form
  weeklyItemForm.value = {
    dia_semana: '',
    quantidade: 1,
    produto_id: '',
    valor_unitario: 0
  }
}

// Remover item semanal
function removeWeeklyItem(id: string) {
  const index = newContrato.value.weekly_items.findIndex(item => item.id === id)
  if (index !== -1) {
    newContrato.value.weekly_items.splice(index, 1)
  }
}

// Gerar cronograma de entregas (Etapa 3)
function generateDeliverySchedule() {
  const schedule: DeliveryScheduleItem[] = []

  if (!newContrato.value.data_inicio || !newContrato.value.data_fim || newContrato.value.weekly_items.length === 0) {
    newContrato.value.delivery_schedule = []
    return
  }

  const startDate = new Date(newContrato.value.data_inicio + 'T00:00:00')
  const endDate = new Date(newContrato.value.data_fim + 'T00:00:00')

  // Map dia da semana para numero JS (0=Domingo, 1=Segunda, etc.)
  const dayMap: Record<string, number> = {
    domingo: 0,
    segunda: 1,
    terca: 2,
    quarta: 3,
    quinta: 4,
    sexta: 5,
    sabado: 6
  }

  // Iterar por cada dia no periodo
  const currentDate = new Date(startDate)
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay()

    // Encontrar itens semanais para este dia
    newContrato.value.weekly_items.forEach(item => {
      if (dayMap[item.dia_semana] === dayOfWeek) {
        schedule.push({
          id: generateId(),
          data_entrega: currentDate.toISOString().split('T')[0],
          dia_semana: getDiaSemanaLabel(item.dia_semana),
          quantidade: item.quantidade,
          produto_id: item.produto_id,
          valor_unitario: item.valor_unitario,
          produto_nome: item.produto_nome,
          editando_data: false,
          is_bonificacao: false
        })
      }
    })

    // Proximo dia
    currentDate.setDate(currentDate.getDate() + 1)
  }

  // Ordenar por data
  schedule.sort((a, b) => a.data_entrega.localeCompare(b.data_entrega))

  newContrato.value.delivery_schedule = schedule
}

// Remover item de entrega
function removeDeliveryItem(id: string) {
  const index = newContrato.value.delivery_schedule.findIndex(item => item.id === id)
  if (index !== -1) {
    newContrato.value.delivery_schedule.splice(index, 1)
  }
}

// Handler para selecao de produto no formulario de adicao manual
function onNewDeliveryProductChange() {
  if (newDeliveryForm.value.produto_id) {
    newDeliveryForm.value.valor_unitario = getPrecoFromTabela(newDeliveryForm.value.produto_id)
  } else {
    newDeliveryForm.value.valor_unitario = 0
  }
}

// Toggle dropdown de datas
function toggleDatasDropdown() {
  showDatasDropdown.value = !showDatasDropdown.value
}

// Toggle selecao de data individual
function toggleDataSelection(data: string) {
  const index = newDeliveryForm.value.datas_selecionadas.indexOf(data)
  if (index === -1) {
    newDeliveryForm.value.datas_selecionadas.push(data)
  } else {
    newDeliveryForm.value.datas_selecionadas.splice(index, 1)
  }
}

// Remover data selecionada
function removeDataSelecionada(data: string) {
  const index = newDeliveryForm.value.datas_selecionadas.indexOf(data)
  if (index !== -1) {
    newDeliveryForm.value.datas_selecionadas.splice(index, 1)
  }
}

// Adicionar todas as datas disponíveis
function adicionarTodasAsDatas() {
  newDeliveryForm.value.datas_selecionadas = [...datasDisponiveisOrdenadas.value]
}

// Abrir modal de adicionar microverdes
function openAddDeliveryModal() {
  newDeliveryForm.value = {
    datas_selecionadas: [],
    quantidade: 1,
    produto_id: '',
    valor_unitario: 0,
    is_bonificacao: false
  }
  showDatasDropdown.value = false
  showAddDeliveryModal.value = true
}

// Fechar modal de adicionar e resetar formulário
function closeAddDeliveryModal() {
  showAddDeliveryModal.value = false
  showDatasDropdown.value = false
  newDeliveryForm.value = {
    datas_selecionadas: [],
    quantidade: 1,
    produto_id: '',
    valor_unitario: 0,
    is_bonificacao: false
  }
}

// Adicionar múltiplas entregas (Etapa 3)
function addDeliveryItems() {
  if (newDeliveryForm.value.datas_selecionadas.length === 0 || !newDeliveryForm.value.produto_id || newDeliveryForm.value.quantidade <= 0) {
    showError('Preencha todos os campos')
    return
  }

  const produto = produtos.value.find(p => p.id === newDeliveryForm.value.produto_id)
  const valorUnitario = newDeliveryForm.value.is_bonificacao ? 0 : (newDeliveryForm.value.valor_unitario || getPrecoFromTabela(newDeliveryForm.value.produto_id))

  // Adicionar uma entrega para cada data selecionada
  newDeliveryForm.value.datas_selecionadas.forEach(data => {
    newContrato.value.delivery_schedule.push({
      id: generateId(),
      data_entrega: data,
      dia_semana: getDiaSemanaFromDate(data),
      quantidade: newDeliveryForm.value.quantidade,
      produto_id: newDeliveryForm.value.produto_id,
      valor_unitario: valorUnitario,
      produto_nome: produto?.nome,
      editando_data: false,
      is_bonificacao: newDeliveryForm.value.is_bonificacao
    })
  })

  // Ordenar
  newContrato.value.delivery_schedule.sort((a, b) => a.data_entrega.localeCompare(b.data_entrega))

  // Mostrar sucesso e fechar modal
  const totalAdicionadas = newDeliveryForm.value.datas_selecionadas.length
  closeAddDeliveryModal()
  success(`${totalAdicionadas} entrega(s) adicionada(s)`)
}

// Abrir modal de edição de data
function openEditDateModal(itemId: string) {
  const item = newContrato.value.delivery_schedule.find(i => i.id === itemId)
  if (item) {
    editDateForm.value = {
      item_id: itemId,
      data_entrega: item.data_entrega
    }
    showEditDateModal.value = true
  }
}

// Salvar edição de data
function saveEditDate() {
  const item = newContrato.value.delivery_schedule.find(i => i.id === editDateForm.value.item_id)
  if (item && editDateForm.value.data_entrega) {
    item.data_entrega = editDateForm.value.data_entrega
    item.dia_semana = getDiaSemanaFromDate(editDateForm.value.data_entrega)
    // Re-ordenar
    newContrato.value.delivery_schedule.sort((a, b) => a.data_entrega.localeCompare(b.data_entrega))
  }
  showEditDateModal.value = false
}

// Abrir modal de edição de microverdes (item completo)
function openEditDeliveryModal(itemId: string) {
  const item = newContrato.value.delivery_schedule.find(i => i.id === itemId)
  if (item) {
    editDeliveryForm.value = {
      item_id: itemId,
      produto_id: item.produto_id,
      produto_nome: item.produto_nome || '',
      data_entrega: item.data_entrega,
      dia_semana: item.dia_semana,
      quantidade: item.quantidade,
      valor_unitario: item.valor_unitario
    }
    showEditDeliveryModal.value = true
  }
}

// Salvar edição de microverdes
function saveEditDelivery() {
  const item = newContrato.value.delivery_schedule.find(i => i.id === editDeliveryForm.value.item_id)
  if (item) {
    item.quantidade = editDeliveryForm.value.quantidade
    item.valor_unitario = editDeliveryForm.value.valor_unitario
  }
  showEditDeliveryModal.value = false
}

// Obter nome do cliente pelo ID
function getClienteNome(clienteId: string): string {
  const cliente = clientes.value.find(c => c.id === clienteId)
  return cliente?.nome_fantasia || cliente?.razao_social || '-'
}

// Obter label da forma de pagamento
function getFormaPagamentoLabel(forma: string): string {
  const labels: Record<string, string> = {
    cartao_credito: 'Cartão de crédito',
    boleto_1x: 'Boleto 1x',
    boleto_2x: 'Boleto 2x',
    boleto_3x: 'Boleto 3x',
    pix: 'PIX'
  }
  return labels[forma] || forma || '-'
}

// Modal de criacao
function openCreateModal() {
  newContrato.value = getEmptyContrato()
  currentStep.value = 1
  tabelaPrecoItens.value = []
  clienteEnderecos.value = []
  showCreateModal.value = true
}

function closeCreateModal() {
  showCreateModal.value = false
}

// Verificar se pode ir para uma etapa especifica
function canGoToStep(step: number): boolean {
  // Pode sempre voltar para etapas anteriores
  if (step <= currentStep.value) return true

  // Para avançar, precisa ter completado todas as etapas anteriores
  for (let i = 1; i < step; i++) {
    if (!isStepCompleted(i)) return false
  }
  return true
}

// Verificar se uma etapa esta completa
function isStepCompleted(step: number): boolean {
  switch (step) {
    case 1: return isStep1Valid.value
    case 2: return isStep2Valid.value
    case 3: return isStep3Valid.value
    case 4: return isStep4Valid.value
    default: return true
  }
}

// Ir para uma etapa especifica
function goToStep(step: number) {
  if (!canGoToStep(step)) {
    showError('Complete as etapas anteriores primeiro')
    return
  }

  // Se esta indo da etapa 2 para a 3, gerar cronograma
  if (currentStep.value === 2 && step >= 3) {
    generateDeliverySchedule()
  }

  currentStep.value = step
}

// Função para avançar etapa com validação
function nextStep() {
  if (!canAdvanceStep.value) {
    showError('Complete os campos obrigatórios antes de avançar')
    return
  }

  // Ao avançar da etapa 2 para 3, gerar cronograma
  if (currentStep.value === 2) {
    generateDeliverySchedule()
  }

  if (currentStep.value < 5) {
    currentStep.value++
  }
}

async function saveContrato() {
  if (!currentCompany.value?.id) {
    showError('Nenhuma empresa selecionada')
    return
  }

  // Validar todas as etapas
  if (!isStep1Valid.value || !isStep2Valid.value || !isStep3Valid.value || !isStep4Valid.value) {
    showError('Complete todas as etapas antes de salvar')
    return
  }

  saving.value = true
  try {
    // Gerar numero do contrato
    const contratoNumero = await generateContratoNumero()

    // Criar o contrato
    const { data: contratoData, error: contratoError } = await supabase
      .from('contratos')
      .insert({
        empresa_id: currentCompany.value.id,
        cliente_id: newContrato.value.cliente_id || null,
        numero: contratoNumero,
        plano: newContrato.value.plano || null,
        tipo: newContrato.value.modalidade === 'recorrente' ? 'recorrente' : 'avulso',
        tipo_plano: newContrato.value.tipo_plano || null,
        modalidade: newContrato.value.modalidade || null,
        bonificacao: newContrato.value.bonificacao || 0,
        possui_credito_anterior: newContrato.value.possui_credito_anterior === true,
        valor_credito: newContrato.value.valor_credito || 0,
        usar_endereco_entrega_cliente: !newContrato.value.endereco_entrega_id,
        endereco_entrega_id: newContrato.value.endereco_entrega_id || null,
        endereco_entrega_customizado: newContrato.value.endereco_entrega_customizado || null,
        valor_frete_entrega: newContrato.value.valor_frete_entrega || 0,
        tabela_preco_id: newContrato.value.tabela_preco_id || null,
        produto_referencia_id: newContrato.value.produto_referencia_id || null,
        data_inicio: newContrato.value.data_inicio,
        data_fim: newContrato.value.data_fim || null,
        valor_mensal: valorAPagar.value,
        frequencia_entrega: newContrato.value.frequencia_entrega || null,
        dia_entrega: newContrato.value.dia_entrega || null,
        status: 'ativo',
        observacoes: newContrato.value.observacoes || null,
        forma_pagamento: newContrato.value.forma_pagamento || null
      })
      .select()
      .single()

    if (contratoError) throw contratoError

    // Criar os itens do contrato (delivery schedule)
    if (newContrato.value.delivery_schedule.length > 0 && contratoData) {
      const itensToInsert = newContrato.value.delivery_schedule.map(item => ({
        contrato_id: contratoData.id,
        produto_id: item.produto_id,
        quantidade: item.quantidade,
        valor_unitario: item.valor_unitario,
        data_entrega: item.data_entrega,
        dia_semana: item.dia_semana.toLowerCase()
      }))

      const { error: itensError } = await supabase
        .from('contrato_itens')
        .insert(itensToInsert)

      if (itensError) throw itensError

      // Calcular total de entregas (datas únicas)
      const datasUnicas = new Set(itensToInsert.map(i => i.data_entrega))
      await supabase
        .from('contratos')
        .update({ total_entregas: datasUnicas.size })
        .eq('id', contratoData.id)
    }

    // Gerar pedidos automaticamente
    await criarPedidosDoContrato(contratoData.id)

    success('Contrato criado com sucesso')
    closeCreateModal()
    await loadContratos()
  } catch (e: any) {
    console.error('Erro ao criar contrato:', e)
    showError(e.message || 'Erro ao criar contrato')
  } finally {
    saving.value = false
  }
}

// Gerar numero sequencial do contrato
async function generateContratoNumero(): Promise<string> {
  try {
    const { data } = await supabase
      .from('contratos')
      .select('numero')
      .eq('empresa_id', currentCompany.value?.id)
      .order('created_at', { ascending: false })
      .limit(1)

    if (data && data.length > 0) {
      const lastNum = parseInt(data[0].numero) || 1000
      return String(lastNum + 1)
    }
    return '1001'
  } catch {
    return String(Date.now()).slice(-6)
  }
}

// Criar pedidos automaticamente a partir do contrato
async function criarPedidosDoContrato(contratoId: string) {
  if (!currentCompany.value?.id || newContrato.value.delivery_schedule.length === 0) {
    return
  }

  // Agrupar entregas por data
  const entregarPorData: Record<string, DeliveryScheduleItem[]> = {}
  newContrato.value.delivery_schedule.forEach(item => {
    if (!entregarPorData[item.data_entrega]) {
      entregarPorData[item.data_entrega] = []
    }
    entregarPorData[item.data_entrega].push(item)
  })

  // Criar um pedido para cada data de entrega
  for (const [dataEntrega, itens] of Object.entries(entregarPorData)) {
    // Calcular valor total do pedido
    const valorTotal = itens.reduce((sum, item) => sum + (item.quantidade * item.valor_unitario), 0)

    // Gerar numero do pedido
    const pedidoNumero = await generatePedidoNumero()

    // Criar pedido
    const { data: pedido, error: pedidoError } = await supabase
      .from('pedidos')
      .insert({
        empresa_id: currentCompany.value.id,
        numero: pedidoNumero,
        cliente_id: newContrato.value.cliente_id,
        contrato_id: contratoId,
        data_pedido: new Date().toISOString().split('T')[0],
        data_entrega: dataEntrega,
        status: 'previsto',
        valor_total: valorTotal,
        tabela_preco_id: newContrato.value.tabela_preco_id || null,
        valor_frete: newContrato.value.valor_frete_entrega || 0,
        observacoes: `Pedido gerado automaticamente do contrato`
      })
      .select()
      .single()

    if (pedidoError) {
      console.error('Erro ao criar pedido:', pedidoError)
      continue
    }

    // Criar itens do pedido
    if (pedido) {
      const pedidoItens = itens.map(item => ({
        pedido_id: pedido.id,
        produto_id: item.produto_id,
        quantidade: item.quantidade,
        valor_unitario: item.valor_unitario,
        valor_total: item.quantidade * item.valor_unitario
      }))

      const { error: itensError } = await supabase
        .from('pedido_itens')
        .insert(pedidoItens)

      if (itensError) {
        console.error('Erro ao criar itens do pedido:', itensError)
      }
    }
  }
}

// Gerar numero sequencial do pedido
async function generatePedidoNumero(): Promise<string> {
  try {
    const { data } = await supabase
      .from('pedidos')
      .select('numero')
      .eq('empresa_id', currentCompany.value?.id)
      .order('created_at', { ascending: false })
      .limit(1)

    if (data && data.length > 0) {
      const lastNum = parseInt(data[0].numero) || 1000
      return String(lastNum + 1)
    }
    return '1001'
  } catch {
    return String(Date.now()).slice(-6)
  }
}

// Modal de edicao
async function openEditModal(contrato: Contrato) {
  // Carregar itens do contrato
  const { data: itens } = await supabase
    .from('contrato_itens')
    .select('*')
    .eq('contrato_id', contrato.id)

  editContrato.value = {
    ...contrato,
    itens: itens || []
  }
  showEditModal.value = true
}

function closeEditModal() {
  showEditModal.value = false
}

function openEditFromDetails() {
  if (selectedContrato.value) {
    openEditModal(selectedContrato.value)
  }
}

async function updateContrato() {
  if (!currentCompany.value?.id || !editContrato.value.id) {
    showError('Erro ao atualizar contrato')
    return
  }

  if (!isEditFormValid.value) {
    showError('Preencha todos os campos obrigatórios')
    return
  }

  saving.value = true
  try {
    // Atualizar o contrato
    const { error: contratoError } = await supabase
      .from('contratos')
      .update({
        cliente_id: editContrato.value.cliente_id || null,
        numero: editContrato.value.numero,
        plano: editContrato.value.plano || null,
        tipo: editContrato.value.tipo,
        data_inicio: editContrato.value.data_inicio,
        data_fim: editContrato.value.tipo === 'recorrente' ? null : (editContrato.value.data_fim || null),
        valor_mensal: editContrato.value.valor_mensal,
        frequencia_entrega: editContrato.value.frequencia_entrega || null,
        dia_entrega: editContrato.value.dia_entrega || null,
        observacoes: editContrato.value.observacoes || null
      })
      .eq('id', editContrato.value.id)
      .eq('empresa_id', currentCompany.value.id)

    if (contratoError) throw contratoError

    // Deletar itens antigos
    await supabase
      .from('contrato_itens')
      .delete()
      .eq('contrato_id', editContrato.value.id)

    // Inserir novos itens
    if (editContrato.value.itens && editContrato.value.itens.length > 0) {
      const itensToInsert = editContrato.value.itens
        .filter((item: ContratoItem) => item.produto_id)
        .map((item: ContratoItem) => ({
          contrato_id: editContrato.value.id,
          produto_id: item.produto_id,
          quantidade: item.quantidade,
          valor_unitario: item.valor_unitario
        }))

      if (itensToInsert.length > 0) {
        const { error: itensError } = await supabase
          .from('contrato_itens')
          .insert(itensToInsert)

        if (itensError) throw itensError
      }
    }

    success('Contrato atualizado com sucesso')
    closeEditModal()
    await loadContratos()

    // Atualizar modal de detalhes se estiver aberto
    if (selectedContrato.value?.id === editContrato.value.id) {
      const updated = contratos.value.find(c => c.id === editContrato.value.id)
      if (updated) {
        selectedContrato.value = updated
        await loadContratoItens(updated.id)
      }
    }
  } catch (e: any) {
    console.error('Erro ao atualizar contrato:', e)
    showError(e.message || 'Erro ao atualizar contrato')
  } finally {
    saving.value = false
  }
}

// Modal de detalhes
async function openDetailsModal(contrato: Contrato) {
  selectedContrato.value = contrato
  showDetailsModal.value = true
  showPrevisaoEntrega.value = false
  motivoCancelamento.value = ''
  emailDestinatario.value = ''
  await loadContratoItens(contrato.id)
  await loadPedidosContrato(contrato.id)
}

function closeDetailsModal() {
  showDetailsModal.value = false
  selectedContrato.value = null
  contratoItens.value = []
  pedidosContrato.value = []
}

// Carregar pedidos do contrato
async function loadPedidosContrato(contratoId: string) {
  loadingPedidosContrato.value = true
  try {
    const { data, error } = await supabase
      .from('pedidos')
      .select('*, pedido_itens(*, produtos(id, codigo, nome))')
      .eq('contrato_id', contratoId)
      .order('data_entrega', { ascending: true })

    if (error) throw error
    pedidosContrato.value = data || []
  } catch (e: any) {
    console.error('Erro ao carregar pedidos do contrato:', e)
    pedidosContrato.value = []
  } finally {
    loadingPedidosContrato.value = false
  }
}

// Helpers para pedidos
function getDiaSemana(dateStr: string): string {
  if (!dateStr) return '-'
  const date = new Date(dateStr + 'T00:00:00')
  const dias = ['Domingo', 'Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado']
  return dias[date.getDay()]
}

function getPedidoStatusClass(status: string): string {
  const statusLower = status?.toLowerCase() || ''
  switch (statusLower) {
    case 'previsto': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
    case 'confirmado': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
    case 'em_producao': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
    case 'entregue': return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
    case 'cancelado': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
    default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
  }
}

function getPedidoStatusLabel(status: string): string {
  const statusLower = status?.toLowerCase() || ''
  switch (statusLower) {
    case 'previsto': return 'Previsto'
    case 'confirmado': return 'Confirmado'
    case 'em_producao': return 'Em Producao'
    case 'entregue': return 'Entregue'
    case 'cancelado': return 'Cancelado'
    default: return status || '-'
  }
}

// Envio por e-mail
async function abrirModalEnviarEmail() {
  if (!selectedContrato.value || !currentCompany.value?.id) return

  emailDestinatario.value = ''
  showEnviarEmailModal.value = true

  // Se nao tem chave de acesso, gerar uma
  if (!selectedContrato.value.chave_acesso) {
    // Gerar chave aleatoria de 5 caracteres
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let chave = ''
    for (let i = 0; i < 5; i++) {
      chave += chars.charAt(Math.floor(Math.random() * chars.length))
    }

    // Salvar no banco
    const { error } = await supabase
      .from('contratos')
      .update({ chave_acesso: chave })
      .eq('id', selectedContrato.value.id)
      .eq('empresa_id', currentCompany.value.id)

    if (!error) {
      selectedContrato.value.chave_acesso = chave
    }
  }
}

function copiarLink() {
  navigator.clipboard.writeText(contratoLink.value)
  success('Link copiado para a área de transferência')
}

function copiarChaveAcesso() {
  if (!selectedContrato.value?.chave_acesso) return
  navigator.clipboard.writeText(contratoChaveAcesso.value)
  success('Chave de acesso copiada')
}

async function enviarContratoPorEmail() {
  if (!selectedContrato.value || !currentCompany.value?.id) return

  const email = emailDestinatario.value || emailClientePadrao.value
  if (!email) {
    showError('Informe um e-mail para envio')
    return
  }

  enviandoEmail.value = true
  try {
    const response = await $fetch('/api/send-contract-email', {
      method: 'POST',
      body: {
        contratoId: selectedContrato.value.id,
        email: email
      }
    })

    if (response.success) {
      // Atualizar contrato localmente com os novos dados
      if (selectedContrato.value) {
        selectedContrato.value.chave_acesso = response.chaveAcesso
        selectedContrato.value.email_enviado_em = new Date().toISOString()
        selectedContrato.value.email_enviado_para = email
      }

      if (response.emailSent) {
        success(`E-mail enviado para ${email}`)
        showEnviarEmailModal.value = false
      } else {
        success(`Contrato atualizado. Chave de acesso: ${response.chaveAcesso}`)
        if (response.emailError) {
          showError(`Aviso: ${response.emailError}`)
        }
      }
      emailDestinatario.value = ''
    }
  } catch (e: any) {
    console.error('Erro ao enviar e-mail:', e)
    showError(e.statusMessage || 'Erro ao enviar e-mail')
  } finally {
    enviandoEmail.value = false
  }
}

// Cancelamento
async function confirmarCancelamento() {
  if (!selectedContrato.value || !currentCompany.value?.id) return

  saving.value = true
  try {
    // Atualizar status do contrato para cancelado
    const updateData: any = {
      status: 'cancelado'
    }

    if (motivoCancelamento.value) {
      updateData.observacoes = `${selectedContrato.value.observacoes || ''}\n\n[CANCELAMENTO] ${motivoCancelamento.value}`.trim()
    }

    const { data, error: contratoError } = await supabase
      .from('contratos')
      .update(updateData)
      .eq('id', selectedContrato.value.id)
      .select()

    console.log('Resultado cancelamento:', { data, contratoError })

    if (contratoError) throw contratoError

    // Cancelar todos os pedidos previstos/confirmados do contrato
    const { error: pedidosError } = await supabase
      .from('pedidos')
      .update({ status: 'cancelado' })
      .eq('contrato_id', selectedContrato.value.id)
      .in('status', ['previsto', 'confirmado'])

    if (pedidosError) {
      console.error('Erro ao cancelar pedidos:', pedidosError)
    }

    success('Contrato cancelado com sucesso')
    showCancelarContratoModal.value = false
    motivoCancelamento.value = ''
    closeDetailsModal()
    await loadContratos()
  } catch (e: any) {
    console.error('Erro ao cancelar contrato:', e)
    showError('Erro ao cancelar contrato')
  } finally {
    saving.value = false
  }
}

async function changeStatus(newStatus: string) {
  if (!selectedContrato.value || !currentCompany.value?.id) return

  saving.value = true
  try {
    const { error } = await supabase
      .from('contratos')
      .update({ status: newStatus })
      .eq('id', selectedContrato.value.id)
      .eq('empresa_id', currentCompany.value.id)

    if (error) throw error

    selectedContrato.value.status = newStatus
    success(`Status alterado para ${getStatusLabel(newStatus)}`)
    await loadContratos()
  } catch (e: any) {
    console.error('Erro ao alterar status:', e)
    showError('Erro ao alterar status do contrato')
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
      loadContratos()
      loadClientes()
      loadProdutos()
      loadTabelasPreco()
    }
  },
  { immediate: true }
)

// Watch para resetar paginacao quando filtros mudam
watch([filterCliente, showCancelados], () => {
  currentPage.value = 1
  pageInput.value = '1'
})

watch(currentPage, (newVal) => {
  pageInput.value = String(newVal)
})

watch(itemsPerPage, () => {
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

// Inicializacao
onMounted(() => {
  loadContratos()
  loadClientes()
  loadProdutos()
  loadTabelasPreco()
})
</script>
