<template>
  <div>
    <h1 class="text-lg font-medium text-text-light/70 dark:text-text-dark/70 tracking-wide uppercase mb-12">Clientes</h1>

    <!-- Toolbar: Filtros + Ação -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-4 mb-4">
      <!-- Esquerda: Busca + Filtro -->
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
        <!-- Busca -->
        <div class="relative">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 material-icons-outlined text-gray-400 text-base">search</span>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Pesquise aqui..."
            class="input w-full sm:w-64 text-sm pl-9"
          />
        </div>
        <!-- Filtro Status -->
        <select v-model="filterStatus" class="input text-sm w-full sm:w-28 shrink-0">
          <option value="ativo">Ativos</option>
          <option value="inativo">Inativos</option>
          <option value="">Todos</option>
        </select>
      </div>
      <!-- Direita: Botão -->
      <button @click="openCreateModal" class="btn btn-primary shrink-0 justify-center sm:justify-start">
        <span class="material-icons text-sm">add</span>
        Novo cliente
      </button>
    </div>

    <!-- Card da Tabela -->
    <div class="card overflow-hidden">
      <!-- Tabela - Desktop -->
      <div class="hidden md:block overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-50 dark:bg-gray-800 border-b border-border-light dark:border-border-dark">
              <th class="table-header">Cliente</th>
              <th class="table-header">Localidade</th>
              <th class="table-header text-center">Pedidos em aberto</th>
              <th class="table-header text-center">Total de pedidos</th>
              <th class="table-header text-center w-24">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-light dark:divide-border-dark">
            <tr
              v-for="cliente in paginatedClientes"
              :key="cliente.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
              @click="openDetailsModal(cliente)"
            >
              <td class="table-cell">
                <p class="font-medium text-text-light dark:text-text-dark">{{ cliente.nome_fantasia || cliente.razao_social }}</p>
              </td>
              <td class="table-cell text-subtext-light dark:text-subtext-dark">
                <span v-if="cliente.cidade || cliente.estado">
                  {{ cliente.cidade }}{{ cliente.cidade && cliente.estado ? ' / ' : '' }}{{ cliente.estado }}
                </span>
                <span v-else>-</span>
              </td>
              <td class="table-cell text-center text-subtext-light dark:text-subtext-dark">{{ getPedidosEmAberto(cliente.id) }}</td>
              <td class="table-cell text-center text-subtext-light dark:text-subtext-dark">{{ getTotalPedidos(cliente.id) }}</td>
              <td class="table-cell text-center" @click.stop>
                <button
                  @click="openDetailsModal(cliente)"
                  class="text-gray-400 hover:text-primary transition-colors"
                  title="Ver cliente"
                >
                  <span class="material-icons-outlined text-sm">visibility</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Cards - Mobile -->
      <div class="md:hidden divide-y divide-border-light dark:divide-border-dark">
        <div
          v-for="cliente in paginatedClientes"
          :key="cliente.id"
          class="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
          @click="openDetailsModal(cliente)"
        >
          <div class="flex items-start gap-3">
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <p class="font-medium text-text-light dark:text-text-dark truncate">{{ cliente.nome_fantasia || cliente.razao_social }}</p>
                  <p v-if="cliente.nome_fantasia" class="text-xs text-subtext-light dark:text-subtext-dark truncate">{{ cliente.razao_social }}</p>
                </div>
                <span :class="['badge shrink-0', cliente.ativo ? 'badge-success' : 'badge-inactive']">
                  {{ cliente.ativo ? 'Ativo' : 'Inativo' }}
                </span>
              </div>
              <p class="text-xs text-subtext-light dark:text-subtext-dark mt-1">
                {{ formatDocument(cliente.cnpj_cpf) }}
              </p>
              <p v-if="cliente.cidade || cliente.estado" class="text-xs text-subtext-light dark:text-subtext-dark">
                {{ cliente.cidade }}{{ cliente.cidade && cliente.estado ? ' / ' : '' }}{{ cliente.estado }}
              </p>
            </div>
            <button
              @click.stop="openDetailsModal(cliente)"
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
      <div v-else-if="filteredClientes.length === 0 && !loading" class="text-center py-12 flex flex-col items-center px-4">
        <span class="material-icons-outlined text-4xl text-gray-300 dark:text-gray-600 mb-2">people</span>
        <h3 class="text-lg font-medium text-text-light dark:text-text-dark mb-1">Nenhum cliente encontrado</h3>
        <p class="text-sm text-subtext-light dark:text-subtext-dark mb-4">
          {{ searchQuery ? 'Tente ajustar a busca' : 'Comece cadastrando seu primeiro cliente' }}
        </p>
        <button v-if="!searchQuery" @click="openCreateModal" class="btn btn-primary">
          <span class="material-icons text-sm">add</span>
          Novo cliente
        </button>
      </div>

      <!-- Paginação -->
      <div v-if="filteredClientes.length > 0" class="p-3 sm:p-4 border-t border-border-light dark:border-border-dark text-xs text-subtext-light dark:text-subtext-dark">
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
            <span class="text-xs">{{ filteredClientes.length }} registros</span>
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

    <!-- Modal de Criação/Edição -->
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
              <div v-if="showModal" class="relative glass-panel rounded-lg shadow-xl w-full max-w-3xl">
                <!-- Modal Header -->
                <div class="border-b border-border-light dark:border-border-dark px-6 py-4 flex items-center justify-between">
                  <h2 class="text-lg font-semibold text-text-light dark:text-text-dark">
                    {{ isEditing ? 'Editar cliente' : 'Cadastro de cliente' }}
                  </h2>
                  <button @click="closeModal" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <span class="material-icons">close</span>
                  </button>
                </div>

                <!-- Tabs -->
                <div class="border-b border-border-light dark:border-border-dark">
                  <div class="flex justify-center">
                    <button
                      v-for="tab in tabs"
                      :key="tab.id"
                      @click="activeTab = tab.id"
                      class="px-6 py-3 text-sm font-medium transition-colors relative"
                      :class="activeTab === tab.id
                        ? 'text-text-light dark:text-text-dark'
                        : 'text-subtext-light dark:text-subtext-dark hover:text-text-light dark:hover:text-text-dark'"
                    >
                      {{ tab.label }}
                      <span
                        v-if="activeTab === tab.id"
                        class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                      ></span>
                    </button>
                  </div>
                </div>

                <!-- Modal Body -->
                <div class="p-6 max-h-[60vh] overflow-y-auto">
                  <!-- Tab: Dados Gerais -->
                  <div v-show="activeTab === 'dados-gerais'" class="space-y-5">
                    <!-- CNPJ -->
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">CNPJ</label>
                      <div class="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        <input
                          type="text"
                          v-model="formData.cnpj_cpf"
                          placeholder="00.000.000/0000-00"
                          class="input flex-1 w-full"
                          v-maska
                          :data-maska="formData.pessoa_fisica ? '###.###.###-##' : '##.###.###/####-##'"
                        />
                        <button @click="buscarCNPJ" class="btn btn-secondary whitespace-nowrap" :disabled="buscandoCNPJ">
                          <span v-if="buscandoCNPJ" class="material-icons text-sm animate-spin">refresh</span>
                          {{ buscandoCNPJ ? 'Buscando...' : 'Buscar CNPJ' }}
                        </button>
                        <label class="flex items-center gap-2 text-sm text-text-light dark:text-text-dark whitespace-nowrap">
                          <input
                            type="checkbox"
                            v-model="formData.pessoa_fisica"
                            class="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                          />
                          Pessoa Física
                        </label>
                      </div>
                    </div>

                    <!-- Razao Social / Nome Fantasia -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Razão social <span class="text-red-500">*</span></label>
                        <input type="text" v-model="formData.razao_social" class="input" />
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Nome fantasia</label>
                        <input type="text" v-model="formData.nome_fantasia" class="input" />
                      </div>
                    </div>

                    <!-- E-mail / Telefone -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">E-mail</label>
                        <input type="email" v-model="formData.email" class="input" />
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Telefone</label>
                        <input type="text" v-model="formData.telefone" class="input" v-maska data-maska="(##) #####-####" />
                      </div>
                    </div>

                    <!-- Contato WhatsApp -->
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Contato WhatsApp</label>
                      <input
                        type="text"
                        v-model="formData.whatsapp"
                        placeholder="Número de WhatsApp para envio de notificações"
                        class="input"
                        v-maska
                        data-maska="(##) #####-####"
                      />
                    </div>

                    <!-- CEP -->
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">CEP</label>
                      <div class="flex items-center gap-3">
                        <input
                          type="text"
                          v-model="formData.cep"
                          placeholder="00000-000"
                          class="input w-48"
                          v-maska
                          data-maska="#####-###"
                          @blur="buscarCep"
                        />
                        <span v-if="buscandoCep" class="text-sm text-subtext-light dark:text-subtext-dark">
                          <span class="material-icons text-sm animate-spin">refresh</span>
                          Buscando...
                        </span>
                      </div>
                    </div>

                    <!-- Endereço / Número -->
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div class="md:col-span-3">
                        <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Endereço</label>
                        <input type="text" v-model="formData.logradouro" class="input" />
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Número</label>
                        <input type="text" v-model="formData.numero" class="input" />
                      </div>
                    </div>

                    <!-- Complemento -->
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Complemento</label>
                      <input type="text" v-model="formData.complemento" class="input" />
                    </div>

                    <!-- Bairro / Estado / Cidade -->
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Bairro</label>
                        <input type="text" v-model="formData.bairro" class="input" />
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Estado</label>
                        <select v-model="formData.estado" class="input">
                          <option value="">Selecione o estado</option>
                          <option v-for="estado in estados" :key="estado.sigla" :value="estado.sigla">{{ estado.nome }}</option>
                        </select>
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Cidade</label>
                        <input type="text" v-model="formData.cidade" class="input" />
                      </div>
                    </div>
                  </div>

                  <!-- Tab: Financeiro -->
                  <div v-show="activeTab === 'financeiro'" class="space-y-5">
                    <!-- Responsável Financeiro -->
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Responsável Financeiro</label>
                      <input
                        type="text"
                        v-model="formData.responsavel_financeiro"
                        placeholder="Nome do responsável"
                        class="input"
                      />
                    </div>

                    <!-- E-mail / Telefone Financeiro -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">E-mail</label>
                        <input
                          type="email"
                          v-model="formData.email_financeiro"
                          placeholder="E-mail responsável financeiro"
                          class="input"
                        />
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Telefone</label>
                        <input
                          type="text"
                          v-model="formData.telefone_financeiro"
                          placeholder="Telefone responsável financeiro"
                          class="input"
                          v-maska
                          data-maska="(##) #####-####"
                        />
                      </div>
                    </div>

                    <!-- Preferências de Pagamento -->
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-3">Preferências de Pagamento</label>
                      <div class="flex flex-wrap items-center gap-4 sm:gap-6">
                        <label class="flex items-center gap-2 text-sm text-text-light dark:text-text-dark">
                          <input
                            type="checkbox"
                            v-model="formData.pagamento_pix"
                            class="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                          />
                          Pix
                        </label>
                        <label class="flex items-center gap-2 text-sm text-text-light dark:text-text-dark">
                          <input
                            type="checkbox"
                            v-model="formData.pagamento_boleto"
                            class="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                          />
                          Boleto
                        </label>
                        <label class="flex items-center gap-2 text-sm text-text-light dark:text-text-dark">
                          <input
                            type="checkbox"
                            v-model="formData.pagamento_cartao"
                            class="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                          />
                          Cartão
                        </label>
                      </div>
                    </div>

                    <!-- Observações Gerais -->
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Observações Gerais</label>
                      <textarea
                        v-model="formData.observacoes_financeiro"
                        rows="4"
                        placeholder="Observações"
                        class="input resize-none"
                      ></textarea>
                    </div>
                  </div>

                  <!-- Tab: Entrega -->
                  <div v-show="activeTab === 'entrega'" class="space-y-6">
                    <!-- Responsável pelo Pedido -->
                    <div>
                      <div class="space-y-4">
                        <div>
                          <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Responsável Pedido</label>
                          <input
                            type="text"
                            v-model="formData.responsavel_pedido"
                            placeholder="Nome do responsável"
                            class="input"
                          />
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">E-mail</label>
                            <input type="email" v-model="formData.email_pedido" class="input" />
                          </div>
                          <div>
                            <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Telefone</label>
                            <input type="text" v-model="formData.telefone_pedido" class="input" v-maska data-maska="(##) #####-####" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Endereço de Entrega -->
                    <div>
                      <h3 class="text-sm font-semibold text-text-light dark:text-text-dark mb-4 pb-2 border-b border-border-light dark:border-border-dark">Endereço de Entrega</h3>
                      <div class="space-y-4">
                        <!-- CEP / Logradouro -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">CEP</label>
                            <div class="flex gap-2">
                              <input
                                type="text"
                                v-model="formData.cep_entrega"
                                placeholder="CEP de entrega"
                                class="input flex-1"
                                v-maska
                                data-maska="#####-###"
                                @blur="buscarCepEntrega"
                              />
                              <button @click="buscarCepEntrega" class="btn btn-primary px-3">
                                <span class="material-icons text-sm">search</span>
                              </button>
                            </div>
                          </div>
                          <div>
                            <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Logradouro</label>
                            <input type="text" v-model="formData.logradouro_entrega" class="input" />
                          </div>
                        </div>

                        <!-- Numero / Complemento / Bairro -->
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Número</label>
                            <input type="text" v-model="formData.numero_entrega" class="input" />
                          </div>
                          <div>
                            <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Complemento</label>
                            <input type="text" v-model="formData.complemento_entrega" class="input" />
                          </div>
                          <div>
                            <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Bairro</label>
                            <input type="text" v-model="formData.bairro_entrega" class="input" />
                          </div>
                        </div>

                        <!-- Cidade / Estado -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Cidade</label>
                            <input type="text" v-model="formData.cidade_entrega" class="input" />
                          </div>
                          <div>
                            <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Estado</label>
                            <select v-model="formData.estado_entrega" class="input">
                              <option value="">Selecione o estado</option>
                              <option v-for="estado in estados" :key="estado.sigla" :value="estado.sigla">{{ estado.nome }}</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Preferências de Entrega -->
                    <div>
                      <h3 class="text-sm font-semibold text-text-light dark:text-text-dark mb-4 pb-2 border-b border-border-light dark:border-border-dark">Preferências de Entrega</h3>
                      <div class="space-y-4">
                        <!-- Dia da Semana -->
                        <div>
                          <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-3">Dia da Semana</label>
                          <div class="flex flex-wrap items-center gap-3 sm:gap-6">
                            <label class="flex items-center gap-2 text-sm text-text-light dark:text-text-dark">
                              <input type="checkbox" v-model="formData.dia_segunda" class="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary" />
                              Segunda
                            </label>
                            <label class="flex items-center gap-2 text-sm text-text-light dark:text-text-dark">
                              <input type="checkbox" v-model="formData.dia_terca" class="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary" />
                              Terça
                            </label>
                            <label class="flex items-center gap-2 text-sm text-text-light dark:text-text-dark">
                              <input type="checkbox" v-model="formData.dia_quarta" class="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary" />
                              Quarta
                            </label>
                            <label class="flex items-center gap-2 text-sm text-text-light dark:text-text-dark">
                              <input type="checkbox" v-model="formData.dia_quinta" class="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary" />
                              Quinta
                            </label>
                            <label class="flex items-center gap-2 text-sm text-text-light dark:text-text-dark">
                              <input type="checkbox" v-model="formData.dia_sexta" class="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary" />
                              Sexta
                            </label>
                          </div>
                        </div>

                        <!-- Horarios -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <!-- Horário Turno Manhã -->
                          <div>
                            <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-3">Horário Turno Manhã</label>
                            <div class="grid grid-cols-2 gap-3">
                              <div>
                                <label class="block text-xs text-subtext-light dark:text-subtext-dark mb-1">A partir</label>
                                <select v-model="formData.hora_manha_inicio" class="input">
                                  <option value="">Horário início</option>
                                  <option value="06:00">06:00</option>
                                  <option value="07:00">07:00</option>
                                  <option value="08:00">08:00</option>
                                  <option value="09:00">09:00</option>
                                  <option value="10:00">10:00</option>
                                  <option value="11:00">11:00</option>
                                </select>
                              </div>
                              <div>
                                <label class="block text-xs text-subtext-light dark:text-subtext-dark mb-1">Até as</label>
                                <select v-model="formData.hora_manha_fim" class="input">
                                  <option value="">Horário fim</option>
                                  <option value="08:00">08:00</option>
                                  <option value="09:00">09:00</option>
                                  <option value="10:00">10:00</option>
                                  <option value="11:00">11:00</option>
                                  <option value="12:00">12:00</option>
                                </select>
                              </div>
                            </div>
                          </div>

                          <!-- Horário Turno Tarde -->
                          <div>
                            <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-3">Horário Turno Tarde</label>
                            <div class="grid grid-cols-2 gap-3">
                              <div>
                                <label class="block text-xs text-subtext-light dark:text-subtext-dark mb-1">A partir</label>
                                <select v-model="formData.hora_tarde_inicio" class="input">
                                  <option value="">Horário início</option>
                                  <option value="12:00">12:00</option>
                                  <option value="13:00">13:00</option>
                                  <option value="14:00">14:00</option>
                                  <option value="15:00">15:00</option>
                                  <option value="16:00">16:00</option>
                                </select>
                              </div>
                              <div>
                                <label class="block text-xs text-subtext-light dark:text-subtext-dark mb-1">Até as</label>
                                <select v-model="formData.hora_tarde_fim" class="input">
                                  <option value="">Horário fim</option>
                                  <option value="15:00">15:00</option>
                                  <option value="16:00">16:00</option>
                                  <option value="17:00">17:00</option>
                                  <option value="18:00">18:00</option>
                                  <option value="19:00">19:00</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        </div>

                        <!-- Observacoes -->
                        <div>
                          <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Observações de Entrega</label>
                          <textarea
                            v-model="formData.observacoes_entrega"
                            rows="3"
                            placeholder="Observações sobre a entrega"
                            class="input resize-none"
                          ></textarea>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Modal Footer -->
                <div class="border-t border-border-light dark:border-border-dark px-6 py-4 flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <button
                      v-if="isEditing"
                      @click="toggleStatusFromModal"
                      :disabled="saving"
                      :class="[
                        'btn btn-secondary text-sm',
                        editingCliente?.ativo
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      ]"
                    >
                      <span class="material-icons-outlined text-sm">
                        {{ editingCliente?.ativo ? 'block' : 'check_circle' }}
                      </span>
                      {{ editingCliente?.ativo ? 'Desativar' : 'Ativar' }}
                    </button>
                  </div>
                  <div class="flex items-center gap-3">
                    <button @click="closeModal" class="btn btn-secondary" :disabled="saving">Cancelar</button>
                    <button @click="saveCliente" class="btn btn-primary" :disabled="saving || !isFormValid">
                      <span v-if="saving" class="material-icons text-sm animate-spin">refresh</span>
                      {{ saving ? 'Salvando...' : (isEditing ? 'Salvar alterações' : 'Cadastrar cliente') }}
                    </button>
                  </div>
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
              <div v-if="showDetailsModal" class="relative glass-panel rounded-lg shadow-xl w-full max-w-3xl">
                <!-- Modal Header -->
                <div class="border-b border-border-light dark:border-border-dark px-6 py-4 flex items-center justify-between gap-3">
                  <div class="flex items-center gap-4 min-w-0 flex-1">
                    <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                      {{ getInitials(selectedCliente?.nome_fantasia || selectedCliente?.razao_social) }}
                    </div>
                    <div class="min-w-0 flex-1">
                      <h2 class="text-lg font-semibold text-text-light dark:text-text-dark truncate">{{ selectedCliente?.nome_fantasia || selectedCliente?.razao_social }}</h2>
                      <p v-if="selectedCliente?.nome_fantasia" class="text-sm text-subtext-light dark:text-subtext-dark truncate">{{ selectedCliente?.razao_social }}</p>
                    </div>
                  </div>
                  <button @click="closeDetailsModal" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <span class="material-icons">close</span>
                  </button>
                </div>

                <!-- Modal Body -->
                <div class="p-6 max-h-[60vh] overflow-y-auto">
                  <!-- Status + Resumo -->
                  <div class="flex flex-wrap items-center justify-between gap-2 mb-5">
                    <div class="flex items-center gap-3">
                      <span :class="['inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium', selectedCliente?.ativo ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400']">
                        <span :class="['w-1.5 h-1.5 rounded-full mr-1.5', selectedCliente?.ativo ? 'bg-green-500' : 'bg-gray-400']"></span>
                        {{ selectedCliente?.ativo ? 'Ativo' : 'Inativo' }}
                      </span>
                      <span class="text-xs text-subtext-light dark:text-subtext-dark">{{ formatDocument(selectedCliente?.cnpj_cpf) }}</span>
                    </div>
                  </div>

                  <!-- Layout 2 colunas -->
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <!-- Coluna Esquerda -->
                    <div class="space-y-4">
                      <!-- Contato -->
                      <div class="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                        <h3 class="text-xs font-semibold text-subtext-light dark:text-subtext-dark uppercase tracking-wider mb-3">Contato</h3>
                        <div class="space-y-2.5">
                          <div v-if="selectedCliente?.telefone" class="flex items-center gap-2">
                            <span class="material-icons-outlined text-sm text-subtext-light dark:text-subtext-dark">phone</span>
                            <span class="text-sm text-text-light dark:text-text-dark">{{ selectedCliente.telefone }}</span>
                          </div>
                          <div v-if="selectedCliente?.email" class="flex items-center gap-2">
                            <span class="material-icons-outlined text-sm text-subtext-light dark:text-subtext-dark">mail</span>
                            <span class="text-sm text-text-light dark:text-text-dark truncate">{{ selectedCliente.email }}</span>
                          </div>
                          <div v-if="selectedCliente?.whatsapp" class="flex items-center gap-2">
                            <span class="material-icons-outlined text-sm text-subtext-light dark:text-subtext-dark">chat</span>
                            <span class="text-sm text-text-light dark:text-text-dark">{{ selectedCliente.whatsapp }}</span>
                          </div>
                          <div v-if="!selectedCliente?.telefone && !selectedCliente?.email && !selectedCliente?.whatsapp" class="text-sm text-subtext-light dark:text-subtext-dark">Nenhum contato cadastrado</div>
                        </div>
                      </div>

                      <!-- Endereço Sede -->
                      <div v-if="selectedCliente?.logradouro || selectedCliente?.cidade" class="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                        <h3 class="text-xs font-semibold text-subtext-light dark:text-subtext-dark uppercase tracking-wider mb-3">Endereço</h3>
                        <div class="flex gap-2">
                          <span class="material-icons-outlined text-sm text-subtext-light dark:text-subtext-dark mt-0.5 shrink-0">location_on</span>
                          <div class="text-sm text-text-light dark:text-text-dark leading-relaxed">
                            <p v-if="selectedCliente?.logradouro">
                              {{ selectedCliente.logradouro }}{{ selectedCliente.numero ? ', ' + selectedCliente.numero : '' }}
                            </p>
                            <p v-if="selectedCliente?.complemento" class="text-subtext-light dark:text-subtext-dark">{{ selectedCliente.complemento }}</p>
                            <p v-if="selectedCliente?.bairro">{{ selectedCliente.bairro }}</p>
                            <p>
                              {{ selectedCliente?.cidade }}{{ selectedCliente?.cidade && selectedCliente?.estado ? '/' : '' }}{{ selectedCliente?.estado }}
                              <span v-if="selectedCliente?.cep" class="text-subtext-light dark:text-subtext-dark"> - {{ selectedCliente.cep }}</span>
                            </p>
                          </div>
                        </div>
                      </div>

                      <!-- Financeiro -->
                      <div class="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                        <h3 class="text-xs font-semibold text-subtext-light dark:text-subtext-dark uppercase tracking-wider mb-3">Financeiro</h3>
                        <div class="space-y-2.5">
                          <div v-if="selectedCliente?.responsavel_financeiro">
                            <p class="text-xs text-subtext-light dark:text-subtext-dark">Responsável</p>
                            <p class="text-sm text-text-light dark:text-text-dark">{{ selectedCliente.responsavel_financeiro }}</p>
                          </div>
                          <div v-if="selectedCliente?.email_financeiro || selectedCliente?.telefone_financeiro" class="flex flex-wrap gap-x-4 gap-y-1">
                            <span v-if="selectedCliente?.email_financeiro" class="text-xs text-subtext-light dark:text-subtext-dark">{{ selectedCliente.email_financeiro }}</span>
                            <span v-if="selectedCliente?.telefone_financeiro" class="text-xs text-subtext-light dark:text-subtext-dark">{{ selectedCliente.telefone_financeiro }}</span>
                          </div>
                          <div>
                            <p class="text-xs text-subtext-light dark:text-subtext-dark mb-1.5">Pagamento</p>
                            <div class="flex flex-wrap gap-1.5">
                              <span v-if="selectedCliente?.pagamento_pix" class="badge badge-success">Pix</span>
                              <span v-if="selectedCliente?.pagamento_boleto" class="badge badge-success">Boleto</span>
                              <span v-if="selectedCliente?.pagamento_cartao" class="badge badge-success">Cartão</span>
                              <span v-if="!selectedCliente?.pagamento_pix && !selectedCliente?.pagamento_boleto && !selectedCliente?.pagamento_cartao" class="text-xs text-subtext-light dark:text-subtext-dark">Não definido</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Coluna Direita -->
                    <div class="space-y-4">
                      <!-- Entrega - Responsável + Endereço -->
                      <div class="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                        <h3 class="text-xs font-semibold text-subtext-light dark:text-subtext-dark uppercase tracking-wider mb-3">Entrega</h3>
                        <div class="space-y-3">
                          <!-- Responsável -->
                          <div v-if="selectedCliente?.responsavel_pedido">
                            <p class="text-xs text-subtext-light dark:text-subtext-dark">Responsável</p>
                            <p class="text-sm text-text-light dark:text-text-dark">
                              {{ selectedCliente.responsavel_pedido }}
                              <span v-if="selectedCliente?.telefone_pedido" class="text-subtext-light dark:text-subtext-dark"> - {{ selectedCliente.telefone_pedido }}</span>
                            </p>
                          </div>

                          <!-- Endereço de Entrega -->
                          <div v-if="selectedCliente?.logradouro_entrega" class="flex gap-2">
                            <span class="material-icons-outlined text-sm text-subtext-light dark:text-subtext-dark mt-0.5 shrink-0">local_shipping</span>
                            <div class="text-sm text-text-light dark:text-text-dark leading-relaxed">
                              <p>{{ selectedCliente.logradouro_entrega }}{{ selectedCliente.numero_entrega ? ', ' + selectedCliente.numero_entrega : '' }}</p>
                              <p v-if="selectedCliente?.bairro_entrega">{{ selectedCliente.bairro_entrega }}</p>
                              <p>{{ selectedCliente?.cidade_entrega }}{{ selectedCliente?.cidade_entrega && selectedCliente?.estado_entrega ? '/' : '' }}{{ selectedCliente?.estado_entrega }}</p>
                            </div>
                          </div>

                          <!-- Dias de Entrega -->
                          <div v-if="selectedCliente?.dia_segunda || selectedCliente?.dia_terca || selectedCliente?.dia_quarta || selectedCliente?.dia_quinta || selectedCliente?.dia_sexta">
                            <p class="text-xs text-subtext-light dark:text-subtext-dark mb-1.5">Dias</p>
                            <div class="flex gap-1.5">
                              <span :class="['inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-medium', selectedCliente?.dia_segunda ? 'bg-primary/10 text-primary' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500']">S</span>
                              <span :class="['inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-medium', selectedCliente?.dia_terca ? 'bg-primary/10 text-primary' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500']">T</span>
                              <span :class="['inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-medium', selectedCliente?.dia_quarta ? 'bg-primary/10 text-primary' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500']">Q</span>
                              <span :class="['inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-medium', selectedCliente?.dia_quinta ? 'bg-primary/10 text-primary' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500']">Q</span>
                              <span :class="['inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-medium', selectedCliente?.dia_sexta ? 'bg-primary/10 text-primary' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500']">S</span>
                            </div>
                          </div>

                          <!-- Horários -->
                          <div v-if="selectedCliente?.hora_manha_inicio || selectedCliente?.hora_tarde_inicio" class="flex flex-wrap gap-3">
                            <div v-if="selectedCliente?.hora_manha_inicio" class="flex items-center gap-1.5">
                              <span class="material-icons-outlined text-xs text-subtext-light dark:text-subtext-dark">wb_sunny</span>
                              <span class="text-xs text-text-light dark:text-text-dark">{{ selectedCliente.hora_manha_inicio }} - {{ selectedCliente.hora_manha_fim }}</span>
                            </div>
                            <div v-if="selectedCliente?.hora_tarde_inicio" class="flex items-center gap-1.5">
                              <span class="material-icons-outlined text-xs text-subtext-light dark:text-subtext-dark">wb_twilight</span>
                              <span class="text-xs text-text-light dark:text-text-dark">{{ selectedCliente.hora_tarde_inicio }} - {{ selectedCliente.hora_tarde_fim }}</span>
                            </div>
                          </div>

                          <div v-if="!selectedCliente?.responsavel_pedido && !selectedCliente?.logradouro_entrega" class="text-sm text-subtext-light dark:text-subtext-dark">
                            Nenhuma informação de entrega
                          </div>
                        </div>
                      </div>

                      <!-- Pedidos -->
                      <div class="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                        <h3 class="text-xs font-semibold text-subtext-light dark:text-subtext-dark uppercase tracking-wider mb-3">Pedidos</h3>
                        <div class="flex items-center gap-6">
                          <div>
                            <p class="text-2xl font-bold text-primary">{{ getPedidosEmAberto(selectedCliente?.id) }}</p>
                            <p class="text-xs text-subtext-light dark:text-subtext-dark">Em aberto</p>
                          </div>
                          <div class="w-px h-10 bg-border-light dark:bg-border-dark"></div>
                          <div>
                            <p class="text-2xl font-bold text-text-light dark:text-text-dark">{{ getTotalPedidos(selectedCliente?.id) }}</p>
                            <p class="text-xs text-subtext-light dark:text-subtext-dark">Total</p>
                          </div>
                        </div>
                      </div>

                      <!-- Observações -->
                      <div v-if="selectedCliente?.observacoes_financeiro || selectedCliente?.observacoes_entrega" class="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                        <h3 class="text-xs font-semibold text-subtext-light dark:text-subtext-dark uppercase tracking-wider mb-3">Observações</h3>
                        <div class="space-y-2">
                          <div v-if="selectedCliente?.observacoes_financeiro">
                            <p class="text-[10px] uppercase tracking-wider text-subtext-light dark:text-subtext-dark mb-0.5">Financeiro</p>
                            <p class="text-sm text-text-light dark:text-text-dark whitespace-pre-wrap leading-relaxed">{{ selectedCliente.observacoes_financeiro }}</p>
                          </div>
                          <div v-if="selectedCliente?.observacoes_entrega">
                            <p class="text-[10px] uppercase tracking-wider text-subtext-light dark:text-subtext-dark mb-0.5">Entrega</p>
                            <p class="text-sm text-text-light dark:text-text-dark whitespace-pre-wrap leading-relaxed">{{ selectedCliente.observacoes_entrega }}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Metadados -->
                  <div class="text-xs text-gray-400 dark:text-gray-600 flex flex-wrap gap-4 mt-4 pt-3 border-t border-border-light dark:border-border-dark">
                    <span>Criado em: {{ formatDateTime(selectedCliente?.created_at) }}</span>
                    <span>Atualizado em: {{ formatDateTime(selectedCliente?.updated_at) }}</span>
                  </div>
                </div>

                <!-- Modal Footer -->
                <div class="border-t border-border-light dark:border-border-dark px-6 py-4 flex items-center justify-between">
                  <div>
                    <button
                      @click="toggleStatus"
                      :disabled="saving"
                      :class="[
                        'btn btn-secondary text-sm',
                        selectedCliente?.ativo
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      ]"
                    >
                      <span class="material-icons-outlined text-sm">
                        {{ selectedCliente?.ativo ? 'block' : 'check_circle' }}
                      </span>
                      {{ selectedCliente?.ativo ? 'Desativar' : 'Ativar' }}
                    </button>
                  </div>
                  <div class="flex items-center gap-3">
                    <button @click="closeDetailsModal" class="btn btn-secondary">Fechar</button>
                    <button @click="openEditFromDetails" class="btn btn-primary">
                      <span class="material-icons text-sm">edit</span>
                      Editar cliente
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
import { useToast } from '~/composables/useToast'

interface Cliente {
  id: string
  empresa_id: string
  cnpj_cpf: string
  razao_social: string
  nome_fantasia: string | null
  pessoa_fisica: boolean
  telefone: string | null
  email: string | null
  whatsapp: string | null
  cep: string | null
  logradouro: string | null
  numero: string | null
  complemento: string | null
  bairro: string | null
  cidade: string | null
  estado: string | null
  // Financeiro
  responsavel_financeiro: string | null
  email_financeiro: string | null
  telefone_financeiro: string | null
  pagamento_pix: boolean
  pagamento_boleto: boolean
  pagamento_cartao: boolean
  observacoes_financeiro: string | null
  // Entrega
  responsavel_pedido: string | null
  email_pedido: string | null
  telefone_pedido: string | null
  cep_entrega: string | null
  logradouro_entrega: string | null
  numero_entrega: string | null
  complemento_entrega: string | null
  bairro_entrega: string | null
  cidade_entrega: string | null
  estado_entrega: string | null
  dia_segunda: boolean
  dia_terca: boolean
  dia_quarta: boolean
  dia_quinta: boolean
  dia_sexta: boolean
  hora_manha_inicio: string | null
  hora_manha_fim: string | null
  hora_tarde_inicio: string | null
  hora_tarde_fim: string | null
  observacoes_entrega: string | null
  ativo: boolean
  created_at: string
  updated_at: string
}

const supabase = useSupabaseClient()
const { currentCompany } = useCurrentCompany()
const toast = useToast()

// Estados brasileiros completos
const estados = [
  { sigla: 'AC', nome: 'Acre' },
  { sigla: 'AL', nome: 'Alagoas' },
  { sigla: 'AP', nome: 'Amapá' },
  { sigla: 'AM', nome: 'Amazonas' },
  { sigla: 'BA', nome: 'Bahia' },
  { sigla: 'CE', nome: 'Ceará' },
  { sigla: 'DF', nome: 'Distrito Federal' },
  { sigla: 'ES', nome: 'Espírito Santo' },
  { sigla: 'GO', nome: 'Goiás' },
  { sigla: 'MA', nome: 'Maranhão' },
  { sigla: 'MT', nome: 'Mato Grosso' },
  { sigla: 'MS', nome: 'Mato Grosso do Sul' },
  { sigla: 'MG', nome: 'Minas Gerais' },
  { sigla: 'PA', nome: 'Pará' },
  { sigla: 'PB', nome: 'Paraíba' },
  { sigla: 'PR', nome: 'Paraná' },
  { sigla: 'PE', nome: 'Pernambuco' },
  { sigla: 'PI', nome: 'Piauí' },
  { sigla: 'RJ', nome: 'Rio de Janeiro' },
  { sigla: 'RN', nome: 'Rio Grande do Norte' },
  { sigla: 'RS', nome: 'Rio Grande do Sul' },
  { sigla: 'RO', nome: 'Rondônia' },
  { sigla: 'RR', nome: 'Roraima' },
  { sigla: 'SC', nome: 'Santa Catarina' },
  { sigla: 'SP', nome: 'São Paulo' },
  { sigla: 'SE', nome: 'Sergipe' },
  { sigla: 'TO', nome: 'Tocantins' }
]

// Tabs do modal
const tabs = [
  { id: 'dados-gerais', label: 'Dados Gerais' },
  { id: 'financeiro', label: 'Financeiro' },
  { id: 'entrega', label: 'Entrega' }
]

interface Pedido {
  id: string
  cliente_id: string
  status: string
}

// Estado
const clientes = ref<Cliente[]>([])
const pedidos = ref<Pedido[]>([])
const loading = ref(false)
const saving = ref(false)
const buscandoCep = ref(false)
const buscandoCNPJ = ref(false)

// Modais
const showModal = ref(false)
const showDetailsModal = ref(false)
const isEditing = ref(false)
const activeTab = ref('dados-gerais')
const selectedCliente = ref<Cliente | null>(null)

// Páginacao
const currentPage = ref(1)
const itemsPerPage = ref(10)
const pageInput = ref('1')

// Filtros
const searchQuery = ref('')
const filterStatus = ref('ativo')

// Ordenacao
const sortField = ref<string>('razao_social')
const sortDirection = ref<'asc' | 'desc'>('asc')

// Form vazio
const getEmptyForm = () => ({
  cnpj_cpf: '',
  razao_social: '',
  nome_fantasia: '',
  pessoa_fisica: false,
  telefone: '',
  email: '',
  whatsapp: '',
  cep: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado: '',
  // Financeiro
  responsavel_financeiro: '',
  email_financeiro: '',
  telefone_financeiro: '',
  pagamento_pix: false,
  pagamento_boleto: false,
  pagamento_cartao: false,
  observacoes_financeiro: '',
  // Entrega
  responsavel_pedido: '',
  email_pedido: '',
  telefone_pedido: '',
  cep_entrega: '',
  logradouro_entrega: '',
  numero_entrega: '',
  complemento_entrega: '',
  bairro_entrega: '',
  cidade_entrega: '',
  estado_entrega: '',
  dia_segunda: false,
  dia_terca: false,
  dia_quarta: false,
  dia_quinta: false,
  dia_sexta: false,
  hora_manha_inicio: '',
  hora_manha_fim: '',
  hora_tarde_inicio: '',
  hora_tarde_fim: '',
  observacoes_entrega: ''
})

const formData = ref(getEmptyForm())
const editingId = ref<string | null>(null)
const editingCliente = ref<Cliente | null>(null)

// Computed
const filteredClientes = computed(() => {
  let result = [...clientes.value]

  // Filtro de status
  if (filterStatus.value === 'ativo') {
    result = result.filter(c => c.ativo === true)
  } else if (filterStatus.value === 'inativo') {
    result = result.filter(c => c.ativo === false)
  }

  // Busca por texto
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(c =>
      c.cnpj_cpf?.toLowerCase().includes(query) ||
      c.razao_social?.toLowerCase().includes(query) ||
      c.nome_fantasia?.toLowerCase().includes(query) ||
      c.cidade?.toLowerCase().includes(query) ||
      c.email?.toLowerCase().includes(query)
    )
  }

  // Ordenacao
  result.sort((a, b) => {
    let aVal: any = a[sortField.value as keyof Cliente]
    let bVal: any = b[sortField.value as keyof Cliente]

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

const totalPages = computed(() => Math.ceil(filteredClientes.value.length / itemsPerPage.value) || 1)

const paginatedClientes = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  return filteredClientes.value.slice(start, start + itemsPerPage.value)
})

const isFormValid = computed(() => {
  return formData.value.cnpj_cpf && formData.value.razao_social
})

// Funcoes auxiliares
function getInitials(name: string | null | undefined): string {
  if (!name) return 'CL'
  const parts = name.split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

function formatDocument(doc: string | null): string {
  if (!doc) return '-'
  const numbers = doc.replace(/\D/g, '')
  if (numbers.length === 11) {
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }
  if (numbers.length === 14) {
    return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  }
  return doc
}

function formatClienteComCnpj(cliente: Cliente): string {
  const doc = cliente.cnpj_cpf?.replace(/\D/g, '') || ''
  const prefix = doc.length >= 8 ? doc.substring(0, 8).replace(/(\d{2})(\d{3})(\d{3})/, '$1.$2.$3') : ''
  const nome = cliente.razao_social || ''
  return prefix ? `${prefix} ${nome}` : nome
}

function getPedidosEmAberto(clienteId: string): number {
  return pedidos.value.filter(p =>
    p.cliente_id === clienteId &&
    p.status !== 'Finalizado' &&
    p.status !== 'Cancelado'
  ).length
}

function getTotalPedidos(clienteId: string): number {
  return pedidos.value.filter(p => p.cliente_id === clienteId).length
}

function formatTimeForSelect(time: string | null | undefined): string {
  if (!time) return ''
  // Remove segundos se existirem (converte "08:00:00" para "08:00")
  return time.substring(0, 5)
}

function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString('pt-BR')
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

function goToPage() {
  const page = parseInt(pageInput.value)
  if (!isNaN(page) && page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  } else {
    pageInput.value = String(currentPage.value)
  }
}

// Carregar clientes e pedidos
async function loadClientes() {
  if (!currentCompany.value?.id) {
    clientes.value = []
    pedidos.value = []
    return
  }

  loading.value = true
  try {
    // Carregar clientes e pedidos em paralelo
    const [clientesResult, pedidosResult] = await Promise.all([
      supabase
        .from('clientes')
        .select('*')
        .eq('empresa_id', currentCompany.value.id)
        .order('razao_social', { ascending: true }),
      supabase
        .from('pedidos')
        .select('id, cliente_id, status')
        .eq('empresa_id', currentCompany.value.id)
    ])

    if (clientesResult.error) throw clientesResult.error
    if (pedidosResult.error) throw pedidosResult.error

    clientes.value = clientesResult.data || []
    pedidos.value = pedidosResult.data || []
  } catch (e: any) {
    console.error('Erro ao carregar clientes:', e)
    toast.error('Erro ao carregar clientes')
  } finally {
    loading.value = false
  }
}

// Modal
function openCreateModal() {
  formData.value = getEmptyForm()
  editingId.value = null
  editingCliente.value = null
  isEditing.value = false
  activeTab.value = 'dados-gerais'
  showModal.value = true
}

function openEditModal(cliente: Cliente) {
  formData.value = {
    cnpj_cpf: cliente.cnpj_cpf || '',
    razao_social: cliente.razao_social || '',
    nome_fantasia: cliente.nome_fantasia || '',
    pessoa_fisica: cliente.pessoa_fisica || false,
    telefone: cliente.telefone || '',
    email: cliente.email || '',
    whatsapp: cliente.whatsapp || '',
    cep: cliente.cep || '',
    logradouro: cliente.logradouro || '',
    numero: cliente.numero || '',
    complemento: cliente.complemento || '',
    bairro: cliente.bairro || '',
    cidade: cliente.cidade || '',
    estado: cliente.estado || '',
    responsavel_financeiro: cliente.responsavel_financeiro || '',
    email_financeiro: cliente.email_financeiro || '',
    telefone_financeiro: cliente.telefone_financeiro || '',
    pagamento_pix: cliente.pagamento_pix || false,
    pagamento_boleto: cliente.pagamento_boleto || false,
    pagamento_cartao: cliente.pagamento_cartao || false,
    observacoes_financeiro: cliente.observacoes_financeiro || '',
    responsavel_pedido: cliente.responsavel_pedido || '',
    email_pedido: cliente.email_pedido || '',
    telefone_pedido: cliente.telefone_pedido || '',
    cep_entrega: cliente.cep_entrega || '',
    logradouro_entrega: cliente.logradouro_entrega || '',
    numero_entrega: cliente.numero_entrega || '',
    complemento_entrega: cliente.complemento_entrega || '',
    bairro_entrega: cliente.bairro_entrega || '',
    cidade_entrega: cliente.cidade_entrega || '',
    estado_entrega: cliente.estado_entrega || '',
    dia_segunda: cliente.dia_segunda || false,
    dia_terca: cliente.dia_terca || false,
    dia_quarta: cliente.dia_quarta || false,
    dia_quinta: cliente.dia_quinta || false,
    dia_sexta: cliente.dia_sexta || false,
    hora_manha_inicio: formatTimeForSelect(cliente.hora_manha_inicio),
    hora_manha_fim: formatTimeForSelect(cliente.hora_manha_fim),
    hora_tarde_inicio: formatTimeForSelect(cliente.hora_tarde_inicio),
    hora_tarde_fim: formatTimeForSelect(cliente.hora_tarde_fim),
    observacoes_entrega: cliente.observacoes_entrega || ''
  }
  editingId.value = cliente.id
  editingCliente.value = cliente
  isEditing.value = true
  activeTab.value = 'dados-gerais'
  showModal.value = true
}

function closeModal() {
  showModal.value = false
}

async function saveCliente() {
  if (!currentCompany.value?.id) {
    toast.error('Nenhuma empresa selecionada')
    return
  }

  if (!isFormValid.value) {
    toast.error('Preencha todos os campos obrigatórios')
    return
  }

  saving.value = true
  try {
    const clienteData = {
      empresa_id: currentCompany.value.id,
      cnpj_cpf: formData.value.cnpj_cpf,
      razao_social: formData.value.razao_social,
      nome_fantasia: formData.value.nome_fantasia || null,
      pessoa_fisica: formData.value.pessoa_fisica,
      telefone: formData.value.telefone || null,
      email: formData.value.email || null,
      whatsapp: formData.value.whatsapp || null,
      cep: formData.value.cep || null,
      logradouro: formData.value.logradouro || null,
      numero: formData.value.numero || null,
      complemento: formData.value.complemento || null,
      bairro: formData.value.bairro || null,
      cidade: formData.value.cidade || null,
      estado: formData.value.estado || null,
      responsavel_financeiro: formData.value.responsavel_financeiro || null,
      email_financeiro: formData.value.email_financeiro || null,
      telefone_financeiro: formData.value.telefone_financeiro || null,
      pagamento_pix: formData.value.pagamento_pix,
      pagamento_boleto: formData.value.pagamento_boleto,
      pagamento_cartao: formData.value.pagamento_cartao,
      observacoes_financeiro: formData.value.observacoes_financeiro || null,
      responsavel_pedido: formData.value.responsavel_pedido || null,
      email_pedido: formData.value.email_pedido || null,
      telefone_pedido: formData.value.telefone_pedido || null,
      cep_entrega: formData.value.cep_entrega || null,
      logradouro_entrega: formData.value.logradouro_entrega || null,
      numero_entrega: formData.value.numero_entrega || null,
      complemento_entrega: formData.value.complemento_entrega || null,
      bairro_entrega: formData.value.bairro_entrega || null,
      cidade_entrega: formData.value.cidade_entrega || null,
      estado_entrega: formData.value.estado_entrega || null,
      dia_segunda: formData.value.dia_segunda,
      dia_terca: formData.value.dia_terca,
      dia_quarta: formData.value.dia_quarta,
      dia_quinta: formData.value.dia_quinta,
      dia_sexta: formData.value.dia_sexta,
      hora_manha_inicio: formData.value.hora_manha_inicio || null,
      hora_manha_fim: formData.value.hora_manha_fim || null,
      hora_tarde_inicio: formData.value.hora_tarde_inicio || null,
      hora_tarde_fim: formData.value.hora_tarde_fim || null,
      observacoes_entrega: formData.value.observacoes_entrega || null
    }

    if (isEditing.value && editingId.value) {
      const { error } = await supabase
        .from('clientes')
        .update(clienteData)
        .eq('id', editingId.value)
        .eq('empresa_id', currentCompany.value.id)

      if (error) throw error
      toast.success('Cliente atualizado com sucesso')

      // Atualizar selectedCliente se estiver aberto
      if (selectedCliente.value?.id === editingId.value) {
        const updated = clientes.value.find(c => c.id === editingId.value)
        if (updated) selectedCliente.value = updated
      }
    } else {
      const { error } = await supabase
        .from('clientes')
        .insert({ ...clienteData, ativo: true })

      if (error) throw error
      toast.success('Cliente criado com sucesso')
    }

    closeModal()
    await loadClientes()

    // Atualizar selectedCliente se estiver aberto
    if (selectedCliente.value?.id === editingId.value) {
      const updated = clientes.value.find(c => c.id === editingId.value)
      if (updated) selectedCliente.value = updated
    }
  } catch (e: any) {
    console.error('Erro ao salvar cliente:', e)
    toast.error(e.message || 'Erro ao salvar cliente')
  } finally {
    saving.value = false
  }
}

// Modal de Detalhes
function openDetailsModal(cliente: Cliente) {
  selectedCliente.value = cliente
  showDetailsModal.value = true
}

function closeDetailsModal() {
  showDetailsModal.value = false
}

function openEditFromDetails() {
  if (selectedCliente.value) {
    openEditModal(selectedCliente.value)
  }
}

async function toggleStatus() {
  if (!selectedCliente.value || !currentCompany.value?.id) return
  const newStatus = !selectedCliente.value.ativo
  const label = newStatus ? 'ativar' : 'desativar'

  if (!confirm(`Tem certeza que deseja ${label} este cliente?`)) return

  saving.value = true
  try {
    const { error } = await supabase
      .from('clientes')
      .update({ ativo: newStatus })
      .eq('id', selectedCliente.value.id)
      .eq('empresa_id', currentCompany.value.id)

    if (error) throw error

    selectedCliente.value.ativo = newStatus
    toast.success(`Cliente ${newStatus ? 'ativado' : 'desativado'} com sucesso`)
    closeDetailsModal()
    await loadClientes()
  } catch (e: any) {
    console.error('Erro ao alterar status:', e)
    toast.error('Erro ao alterar status do cliente')
  } finally {
    saving.value = false
  }
}

async function toggleStatusFromModal() {
  if (!editingCliente.value || !currentCompany.value?.id) return
  const newStatus = !editingCliente.value.ativo
  const label = newStatus ? 'ativar' : 'desativar'

  if (!confirm(`Tem certeza que deseja ${label} este cliente?`)) return

  saving.value = true
  try {
    const { error } = await supabase
      .from('clientes')
      .update({ ativo: newStatus })
      .eq('id', editingCliente.value.id)
      .eq('empresa_id', currentCompany.value.id)

    if (error) throw error

    editingCliente.value.ativo = newStatus
    toast.success(`Cliente ${newStatus ? 'ativado' : 'desativado'} com sucesso`)
    closeModal()
    await loadClientes()
  } catch (e: any) {
    console.error('Erro ao alterar status:', e)
    toast.error('Erro ao alterar status do cliente')
  } finally {
    saving.value = false
  }
}

// Busca CEP
async function buscarCep() {
  const cep = formData.value.cep?.replace(/\D/g, '')
  if (cep?.length !== 8) return

  buscandoCep.value = true
  try {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
    const data = await response.json()

    if (!data.erro) {
      formData.value.logradouro = data.logradouro
      formData.value.bairro = data.bairro
      formData.value.cidade = data.localidade
      formData.value.estado = data.uf
    }
  } catch (error) {
    console.error('Erro ao buscar CEP:', error)
  } finally {
    buscandoCep.value = false
  }
}

async function buscarCepEntrega() {
  const cep = formData.value.cep_entrega?.replace(/\D/g, '')
  if (cep?.length !== 8) return

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
    const data = await response.json()

    if (!data.erro) {
      formData.value.logradouro_entrega = data.logradouro
      formData.value.bairro_entrega = data.bairro
      formData.value.cidade_entrega = data.localidade
      formData.value.estado_entrega = data.uf
    }
  } catch (error) {
    console.error('Erro ao buscar CEP:', error)
  }
}

// Busca CNPJ
async function buscarCNPJ() {
  const cnpj = formData.value.cnpj_cpf?.replace(/\D/g, '')
  if (cnpj?.length !== 14) {
    toast.error('CNPJ inválido')
    return
  }

  buscandoCNPJ.value = true
  try {
    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`)
    const data = await response.json()

    if (!data.message) {
      formData.value.razao_social = data.razao_social || ''
      formData.value.nome_fantasia = data.nome_fantasia || ''
      formData.value.email = data.email || ''
      formData.value.telefone = data.ddd_telefone_1 || ''
      formData.value.cep = data.cep || ''
      formData.value.logradouro = data.logradouro || ''
      formData.value.numero = data.numero || ''
      formData.value.complemento = data.complemento || ''
      formData.value.bairro = data.bairro || ''
      formData.value.cidade = data.municipio || ''
      formData.value.estado = data.uf || ''
      toast.success('Dados do CNPJ carregados')
    } else {
      toast.error('CNPJ não encontrado')
    }
  } catch (error) {
    console.error('Erro ao buscar CNPJ:', error)
    toast.error('Erro ao buscar CNPJ')
  } finally {
    buscandoCNPJ.value = false
  }
}

// Watchers
watch(
  () => currentCompany.value?.id,
  (newId, oldId) => {
    if (newId !== oldId) {
      currentPage.value = 1
      loadClientes()
    }
  },
  { immediate: true }
)

watch([searchQuery, filterStatus], () => {
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

// Inicializacao
onMounted(() => {
  loadClientes()
})
</script>
