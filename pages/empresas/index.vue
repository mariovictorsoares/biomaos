<template>
  <div>
    <h1 class="text-xl sm:text-2xl font-bold text-text-light dark:text-text-dark mb-4 sm:mb-6">Empresas</h1>

    <!-- Card da Tabela -->
    <div class="card">
      <!-- Header do Card -->
      <div class="p-3 sm:p-4 border-b border-border-light dark:border-border-dark">
        <div class="flex flex-col gap-3">
          <div class="flex items-center justify-between">
            <h2 class="text-xs sm:text-sm font-medium text-subtext-light dark:text-subtext-dark uppercase tracking-wider">Lista Empresas</h2>
            <!-- Botao Nova Empresa - Desktop -->
            <button v-if="isMasterUser" @click="openCreateModal" class="hidden sm:flex btn btn-primary shrink-0">
              <span class="material-icons text-sm">add</span>
              Nova empresa
            </button>
          </div>
          <div class="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <!-- Filtro Status -->
            <select v-model="filterStatus" class="input text-sm w-full sm:w-28 shrink-0">
              <option value="ativa">Ativas</option>
              <option value="inativa">Inativas</option>
              <option value="">Todas</option>
            </select>
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
            <!-- Botao Nova Empresa - Mobile -->
            <button v-if="isMasterUser" @click="openCreateModal" class="sm:hidden btn btn-primary w-full justify-center">
              <span class="material-icons text-sm">add</span>
              Nova empresa
            </button>
          </div>
        </div>
      </div>

      <!-- Tabela - Desktop -->
      <div class="hidden md:block overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-50 dark:bg-gray-800 border-b border-border-light dark:border-border-dark">
              <th class="table-header w-16"></th>
              <th class="table-header">Nome</th>
              <th class="table-header">CNPJ</th>
              <th class="table-header text-center w-28">Status</th>
              <th class="table-header text-center w-24">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-light dark:divide-border-dark">
            <tr
              v-for="empresa in paginatedEmpresas"
              :key="empresa.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
              @click="openDetailsSlideover(empresa)"
            >
              <td class="table-cell">
                <div class="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-xs font-bold text-primary overflow-hidden">
                  <img v-if="empresa.logo_url" :src="empresa.logo_url" class="w-full h-full object-cover" />
                  <span v-else>{{ getInitials(empresa.nome_fantasia || empresa.razao_social) }}</span>
                </div>
              </td>
              <td class="table-cell">
                <div>
                  <p class="font-medium text-text-light dark:text-text-dark">{{ empresa.nome_fantasia || empresa.razao_social }}</p>
                  <p v-if="empresa.nome_fantasia" class="text-xs text-subtext-light dark:text-subtext-dark">{{ empresa.razao_social }}</p>
                </div>
              </td>
              <td class="table-cell text-subtext-light dark:text-subtext-dark">{{ formatCNPJ(empresa.cnpj) || '-' }}</td>
              <td class="table-cell text-center">
                <span :class="['badge', empresa.ativo ? 'badge-success' : 'badge-inactive']">
                  {{ empresa.ativo ? 'Ativa' : 'Inativa' }}
                </span>
              </td>
              <td class="table-cell text-center" @click.stop>
                <button
                  @click="openDetailsSlideover(empresa)"
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
          v-for="empresa in paginatedEmpresas"
          :key="empresa.id"
          class="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
          @click="openDetailsSlideover(empresa)"
        >
          <div class="flex items-start gap-3">
            <div class="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary overflow-hidden shrink-0">
              <img v-if="empresa.logo_url" :src="empresa.logo_url" class="w-full h-full object-cover" />
              <span v-else>{{ getInitials(empresa.nome_fantasia || empresa.razao_social) }}</span>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <p class="font-medium text-text-light dark:text-text-dark truncate">{{ empresa.nome_fantasia || empresa.razao_social }}</p>
                  <p v-if="empresa.nome_fantasia" class="text-xs text-subtext-light dark:text-subtext-dark truncate">{{ empresa.razao_social }}</p>
                </div>
                <span :class="['badge shrink-0', empresa.ativo ? 'badge-success' : 'badge-inactive']">
                  {{ empresa.ativo ? 'Ativa' : 'Inativa' }}
                </span>
              </div>
              <p v-if="empresa.cnpj" class="text-xs text-subtext-light dark:text-subtext-dark mt-1">
                CNPJ: {{ formatCNPJ(empresa.cnpj) }}
              </p>
            </div>
            <button
              @click.stop="openDetailsSlideover(empresa)"
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
      <div v-else-if="filteredEmpresas.length === 0 && !loading" class="text-center py-12 flex flex-col items-center px-4">
        <span class="material-icons-outlined text-4xl text-gray-300 dark:text-gray-600 mb-2">business</span>
        <h3 class="text-lg font-medium text-text-light dark:text-text-dark mb-1">Nenhuma empresa encontrada</h3>
        <p class="text-sm text-subtext-light dark:text-subtext-dark mb-4">
          {{ isMasterUser ? 'Comece criando sua primeira empresa' : 'Você ainda não tem acesso a nenhuma empresa' }}
        </p>
        <button v-if="isMasterUser" @click="openCreateModal" class="btn btn-primary">
          <span class="material-icons text-sm">add</span>
          Nova empresa
        </button>
      </div>

      <!-- Páginacao -->
      <div v-if="filteredEmpresas.length > 0" class="p-3 sm:p-4 border-t border-border-light dark:border-border-dark text-xs text-subtext-light dark:text-subtext-dark">
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
            <span class="text-xs">{{ filteredEmpresas.length }} registros</span>
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
              <div v-if="showCreateModal" class="relative glass-panel rounded-lg shadow-xl w-full max-w-2xl">
                <!-- Modal Header -->
                <div class="border-b border-border-light dark:border-border-dark px-6 py-4 flex items-center justify-between">
                  <h2 class="text-lg font-semibold text-text-light dark:text-text-dark">Nova empresa</h2>
                  <button @click="closeCreateModal" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <span class="material-icons">close</span>
                  </button>
                </div>

                <!-- Modal Body -->
                <div class="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                  <!-- Secao: Dados da Empresa -->
                  <div>
                    <h3 class="text-sm font-semibold text-text-light dark:text-text-dark mb-4 pb-2 border-b border-border-light dark:border-border-dark">Dados da empresa</h3>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <!-- Logo -->
                      <div class="md:col-span-2">
                        <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-2">Logo da empresa</label>
                        <div class="flex items-center gap-4">
                          <div
                            class="w-20 h-20 rounded-lg border-2 border-dashed border-border-light dark:border-border-dark flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-800 cursor-pointer hover:border-primary transition-colors"
                            @click="$refs.logoInputNew.click()"
                          >
                            <img v-if="newLogoPreview" :src="newLogoPreview" class="w-full h-full object-cover" />
                            <span v-else class="material-icons-outlined text-2xl text-gray-400">add_photo_alternate</span>
                          </div>
                          <div class="flex-1">
                            <input type="file" ref="logoInputNew" class="hidden" accept="image/*" @change="handleLogoChange($event, 'new')" />
                            <button type="button" @click="$refs.logoInputNew.click()" class="text-primary text-sm hover:underline">
                              Selecionar imagem
                            </button>
                            <p class="text-xs text-subtext-light dark:text-subtext-dark mt-1">PNG, JPG até 2MB</p>
                          </div>
                        </div>
                      </div>

                      <div class="md:col-span-2">
                        <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">CNPJ</label>
                        <div class="flex gap-3 items-center">
                          <input type="text" v-model="newEmpresa.cnpj" class="input flex-1" placeholder="00.000.000/0000-00" v-maska data-maska="##.###.###/####-##" />
                          <label class="flex items-center gap-2 text-sm text-text-light dark:text-text-dark whitespace-nowrap">
                            <input type="checkbox" v-model="newEmpresa.ativo" class="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary" />
                            Ativo
                          </label>
                        </div>
                      </div>

                      <div>
                        <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Razão social <span class="text-red-500">*</span></label>
                        <input type="text" v-model="newEmpresa.razao_social" class="input" placeholder="Razão social da empresa" />
                      </div>

                      <div>
                        <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Nome fantasia</label>
                        <input type="text" v-model="newEmpresa.nome_fantasia" class="input" placeholder="Nome fantasia" />
                      </div>

                      <div class="md:col-span-2">
                        <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Número de Funcionários</label>
                        <input type="number" v-model="newEmpresa.num_funcionarios" class="input" placeholder="0" min="0" />
                      </div>
                    </div>
                  </div>

                  <!-- Secao: Endereco -->
                  <div>
                    <h3 class="text-sm font-semibold text-text-light dark:text-text-dark mb-4 pb-2 border-b border-border-light dark:border-border-dark">Endereço</h3>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div class="md:col-span-2">
                        <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">CEP</label>
                        <input type="text" v-model="newEmpresa.cep" class="input" placeholder="00000-000" v-maska data-maska="#####-###" @blur="buscarCep('new')" />
                      </div>

                      <div class="md:col-span-2 flex gap-4">
                        <div class="flex-1">
                          <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Endereço</label>
                          <input type="text" v-model="newEmpresa.endereco" class="input" placeholder="Rua, Avenida..." />
                        </div>
                        <div class="w-28">
                          <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Número</label>
                          <input type="text" v-model="newEmpresa.numero" class="input" placeholder="0" />
                        </div>
                      </div>

                      <div class="md:col-span-2">
                        <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Complemento</label>
                        <input type="text" v-model="newEmpresa.complemento" class="input" placeholder="Sala, Andar, Bloco..." />
                      </div>

                      <div>
                        <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Estado</label>
                        <select v-model="newEmpresa.estado" class="input">
                          <option value="">Selecione o estado</option>
                          <option v-for="estado in estados" :key="estado.sigla" :value="estado.sigla">{{ estado.nome }}</option>
                        </select>
                      </div>

                      <div>
                        <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Cidade</label>
                        <input type="text" v-model="newEmpresa.cidade" class="input" placeholder="Cidade" />
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Modal Footer -->
                <div class="border-t border-border-light dark:border-border-dark px-6 py-4 flex items-center justify-end gap-3">
                  <button @click="closeCreateModal" class="btn btn-secondary" :disabled="saving">Cancelar</button>
                  <button @click="saveEmpresa" class="btn btn-primary" :disabled="saving">
                    <span v-if="saving" class="material-icons text-sm animate-spin">refresh</span>
                    {{ saving ? 'Salvando...' : 'Salvar empresa' }}
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
              <div v-if="showEditModal" class="relative glass-panel rounded-lg shadow-xl w-full max-w-2xl">
                <!-- Modal Header -->
                <div class="border-b border-border-light dark:border-border-dark px-6 py-4 flex items-center justify-between">
                  <h2 class="text-lg font-semibold text-text-light dark:text-text-dark">Editar empresa</h2>
                  <button @click="closeEditModal" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <span class="material-icons">close</span>
                  </button>
                </div>

                <!-- Modal Body -->
                <div class="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                  <!-- Secao: Dados da Empresa -->
                  <div>
                    <h3 class="text-sm font-semibold text-text-light dark:text-text-dark mb-4 pb-2 border-b border-border-light dark:border-border-dark">Dados da empresa</h3>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <!-- Logo -->
                      <div class="md:col-span-2">
                        <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-2">Logo da empresa</label>
                        <div class="flex items-center gap-4">
                          <div
                            class="w-20 h-20 rounded-lg border-2 border-dashed border-border-light dark:border-border-dark flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-800 cursor-pointer hover:border-primary transition-colors"
                            @click="$refs.logoInputEdit.click()"
                          >
                            <img v-if="editLogoPreview || editEmpresa.logo_url" :src="editLogoPreview || editEmpresa.logo_url" class="w-full h-full object-cover" />
                            <span v-else class="material-icons-outlined text-2xl text-gray-400">add_photo_alternate</span>
                          </div>
                          <div class="flex-1">
                            <input type="file" ref="logoInputEdit" class="hidden" accept="image/*" @change="handleLogoChange($event, 'edit')" />
                            <button type="button" @click="$refs.logoInputEdit.click()" class="text-primary text-sm hover:underline">
                              Selecionar imagem
                            </button>
                            <p class="text-xs text-subtext-light dark:text-subtext-dark mt-1">PNG, JPG até 2MB</p>
                          </div>
                        </div>
                      </div>

                      <div class="md:col-span-2">
                        <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">CNPJ</label>
                        <div class="flex gap-3 items-center">
                          <input type="text" v-model="editEmpresa.cnpj" class="input flex-1" placeholder="00.000.000/0000-00" v-maska data-maska="##.###.###/####-##" />
                          <label class="flex items-center gap-2 text-sm text-text-light dark:text-text-dark whitespace-nowrap">
                            <input type="checkbox" v-model="editEmpresa.ativo" class="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary" />
                            Ativo
                          </label>
                        </div>
                      </div>

                      <div>
                        <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Razão social <span class="text-red-500">*</span></label>
                        <input type="text" v-model="editEmpresa.razao_social" class="input" placeholder="Razão social da empresa" />
                      </div>

                      <div>
                        <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Nome fantasia</label>
                        <input type="text" v-model="editEmpresa.nome_fantasia" class="input" placeholder="Nome fantasia" />
                      </div>

                      <div class="md:col-span-2">
                        <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Número de Funcionários</label>
                        <input type="number" v-model="editEmpresa.num_funcionarios" class="input" placeholder="0" min="0" />
                      </div>
                    </div>
                  </div>

                  <!-- Secao: Endereco -->
                  <div>
                    <h3 class="text-sm font-semibold text-text-light dark:text-text-dark mb-4 pb-2 border-b border-border-light dark:border-border-dark">Endereço</h3>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div class="md:col-span-2">
                        <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">CEP</label>
                        <input type="text" v-model="editEmpresa.cep" class="input" placeholder="00000-000" v-maska data-maska="#####-###" @blur="buscarCep('edit')" />
                      </div>

                      <div class="md:col-span-2 flex gap-4">
                        <div class="flex-1">
                          <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Endereço</label>
                          <input type="text" v-model="editEmpresa.endereco" class="input" placeholder="Rua, Avenida..." />
                        </div>
                        <div class="w-28">
                          <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Número</label>
                          <input type="text" v-model="editEmpresa.numero" class="input" placeholder="0" />
                        </div>
                      </div>

                      <div class="md:col-span-2">
                        <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Complemento</label>
                        <input type="text" v-model="editEmpresa.complemento" class="input" placeholder="Sala, Andar, Bloco..." />
                      </div>

                      <div>
                        <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Estado</label>
                        <select v-model="editEmpresa.estado" class="input">
                          <option value="">Selecione o estado</option>
                          <option v-for="estado in estados" :key="estado.sigla" :value="estado.sigla">{{ estado.nome }}</option>
                        </select>
                      </div>

                      <div>
                        <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Cidade</label>
                        <input type="text" v-model="editEmpresa.cidade" class="input" placeholder="Cidade" />
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Modal Footer -->
                <div class="border-t border-border-light dark:border-border-dark px-6 py-4 flex items-center justify-end gap-3">
                  <button @click="closeEditModal" class="btn btn-secondary" :disabled="saving">Cancelar</button>
                  <button @click="updateEmpresa" class="btn btn-primary" :disabled="saving">
                    <span v-if="saving" class="material-icons text-sm animate-spin">refresh</span>
                    {{ saving ? 'Salvando...' : 'Salvar alterações' }}
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
                      <div class="w-10 h-10 sm:w-14 sm:h-14 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-sm sm:text-lg font-bold text-primary overflow-hidden shrink-0">
                        <img v-if="selectedEmpresa?.logo_url" :src="selectedEmpresa.logo_url" class="w-full h-full object-cover" />
                        <span v-else class="text-gray-400">{{ getInitials(selectedEmpresa?.nome_fantasia || selectedEmpresa?.razao_social) }}</span>
                      </div>
                      <div class="min-w-0 flex-1">
                        <h2 class="text-base sm:text-lg font-semibold text-gray-900 dark:text-text-dark truncate">{{ selectedEmpresa?.nome_fantasia || selectedEmpresa?.razao_social }}</h2>
                        <p v-if="selectedEmpresa?.nome_fantasia" class="text-xs sm:text-sm text-gray-500 dark:text-subtext-dark truncate">{{ selectedEmpresa?.razao_social }}</p>
                      </div>
                    </div>
                    <button @click="closeDetailsSlideover" class="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shrink-0">
                      <span class="material-icons text-xl">close</span>
                    </button>
                  </div>

                  <!-- Body -->
                  <div class="flex-1 overflow-y-auto">
                    <div class="p-4 sm:p-6 space-y-5 sm:space-y-6">
                      <!-- Status e Ações Rapidas -->
                      <div class="flex flex-wrap items-center justify-between gap-2">
                        <div class="flex items-center gap-2">
                          <span :class="['inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium', selectedEmpresa?.ativo ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400']">
                            <span :class="['w-1.5 h-1.5 rounded-full mr-1.5', selectedEmpresa?.ativo ? 'bg-green-500' : 'bg-gray-400']"></span>
                            {{ selectedEmpresa?.ativo ? 'Ativa' : 'Inativa' }}
                          </span>
                          <span v-if="isCurrentCompany" class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            Empresa atual
                          </span>
                        </div>
                        <button
                          v-if="!isCurrentCompany"
                          @click="selectAsCurrentCompany"
                          class="text-sm text-primary hover:underline"
                        >
                          Definir como atual
                        </button>
                      </div>

                      <!-- Dados da Empresa -->
                      <div class="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 sm:p-5">
                        <h3 class="text-xs font-semibold text-gray-500 dark:text-subtext-dark uppercase tracking-wider mb-3 sm:mb-4">Informações</h3>
                        <div class="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4">
                          <div>
                            <p class="text-xs text-gray-500 dark:text-subtext-dark mb-1">CNPJ</p>
                            <p class="text-sm font-medium text-gray-900 dark:text-text-dark">{{ formatCNPJ(selectedEmpresa?.cnpj) || '-' }}</p>
                          </div>
                          <div>
                            <p class="text-xs text-gray-500 dark:text-subtext-dark mb-1">Funcionários</p>
                            <p class="text-sm font-medium text-gray-900 dark:text-text-dark">{{ selectedEmpresa?.num_funcionarios || 0 }}</p>
                          </div>
                          <div v-if="selectedEmpresa?.endereco" class="col-span-1 xs:col-span-2">
                            <p class="text-xs text-gray-500 dark:text-subtext-dark mb-1">Endereço</p>
                            <p class="text-sm text-gray-900 dark:text-text-dark">
                              {{ selectedEmpresa.endereco }}<span v-if="selectedEmpresa.numero">, {{ selectedEmpresa.numero }}</span>
                            </p>
                            <p class="text-sm text-gray-500 dark:text-subtext-dark">
                              {{ selectedEmpresa.cidade }}<span v-if="selectedEmpresa.estado">/{{ selectedEmpresa.estado }}</span>
                              <span v-if="selectedEmpresa.cep"> - {{ selectedEmpresa.cep }}</span>
                            </p>
                          </div>
                        </div>
                      </div>

                      <!-- Colaboradores -->
                      <div>
                        <div class="flex items-center justify-between mb-4">
                          <div class="flex items-center gap-2">
                            <h3 class="text-sm font-semibold text-gray-900 dark:text-text-dark">Colaboradores</h3>
                            <span class="text-xs text-gray-500 dark:text-subtext-dark bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                              {{ colaboradores.length }}
                            </span>
                          </div>
                          <button @click="openInviteModal" class="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                            <span class="material-icons text-base">person_add</span>
                            Convidar
                          </button>
                        </div>

                        <div v-if="loadingColaboradores" class="text-center py-8">
                          <span class="material-icons text-2xl text-gray-300 animate-spin">refresh</span>
                        </div>

                        <div v-else-if="colaboradores.length === 0" class="text-center py-8 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                          <span class="material-icons-outlined text-3xl text-gray-300 dark:text-gray-600 mb-2">group</span>
                          <p class="text-sm text-gray-500 dark:text-subtext-dark mb-2">Nenhum colaborador</p>
                          <button @click="openInviteModal" class="text-sm text-primary hover:underline">Convidar primeiro</button>
                        </div>

                        <div v-else class="space-y-2">
                          <div v-for="colaborador in colaboradores" :key="colaborador.id" class="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                            <div class="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary shrink-0">
                              {{ getInitials(colaborador.nome) }}
                            </div>
                            <div class="flex-1 min-w-0">
                              <p class="text-xs sm:text-sm font-medium text-gray-900 dark:text-text-dark truncate">{{ colaborador.nome }}</p>
                              <p class="text-[10px] sm:text-xs text-gray-500 dark:text-subtext-dark truncate">{{ colaborador.email }}</p>
                            </div>
                            <span :class="['text-[10px] font-medium px-2 py-1 rounded-full whitespace-nowrap', getRoleBadgeClass(colaborador.role)]">
                              {{ getRoleLabel(colaborador.role) }}
                            </span>
                          </div>
                        </div>

                        <!-- Convites Pendentes -->
                        <div v-if="convitesPendentes.length > 0" class="mt-4 pt-4 border-t border-gray-100 dark:border-border-dark">
                          <p class="text-xs font-medium text-gray-500 dark:text-subtext-dark mb-3 flex items-center gap-1.5">
                            <span class="material-icons text-amber-500 text-sm">schedule</span>
                            Convites pendentes
                          </p>
                          <div class="space-y-2">
                            <div v-for="convite in convitesPendentes" :key="convite.id" class="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50">
                              <div class="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-xs font-medium text-amber-600 shrink-0">
                                <span class="material-icons text-sm sm:text-base">mail</span>
                              </div>
                              <div class="flex-1 min-w-0">
                                <p class="text-xs sm:text-sm text-gray-900 dark:text-text-dark truncate">{{ convite.email }}</p>
                                <p class="text-[10px] sm:text-xs text-gray-500 dark:text-subtext-dark">{{ convite.role === 'admin' ? 'Administrador' : 'Membro' }}</p>
                              </div>
                              <button @click="copyInviteLink(convite.token)" class="p-1 sm:p-1.5 text-gray-400 hover:text-primary rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-colors" title="Copiar link">
                                <span class="material-icons text-sm sm:text-base">content_copy</span>
                              </button>
                              <button @click="cancelInvite(convite.id)" class="p-1 sm:p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-colors" title="Cancelar">
                                <span class="material-icons text-sm sm:text-base">close</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Footer -->
                  <div class="px-4 sm:px-6 py-4 border-t border-gray-100 dark:border-border-dark">
                    <button @click="openEditFromSlideover" class="w-full btn btn-primary justify-center">
                      <span class="material-icons text-sm">edit</span>
                      Editar empresa
                    </button>
                  </div>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Modal de Convite -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-200"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="showInviteModal" class="fixed inset-0 z-[70] overflow-y-auto">
          <div class="fixed inset-0 glass-backdrop" @click="closeInviteModal"></div>
          <div class="flex min-h-full items-center justify-center p-4">
            <div class="relative glass-panel rounded-lg shadow-xl w-full max-w-md">
              <!-- Modal Header -->
              <div class="border-b border-border-light dark:border-border-dark px-6 py-4 flex items-center justify-between">
                <h2 class="text-lg font-semibold text-text-light dark:text-text-dark">Convidar colaborador</h2>
                <button @click="closeInviteModal" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <span class="material-icons">close</span>
                </button>
              </div>

              <!-- Modal Body -->
              <div class="p-6 space-y-4">
                <div>
                  <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Email <span class="text-red-500">*</span></label>
                  <input type="email" v-model="inviteEmail" class="input" placeholder="email@exemplo.com" />
                </div>

                <div>
                  <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Função</label>
                  <select v-model="inviteRole" class="input">
                    <option value="member">Membro</option>
                    <option value="admin">Administrador</option>
                  </select>
                  <p class="text-xs text-subtext-light dark:text-subtext-dark mt-1">
                    {{ inviteRole === 'admin' ? 'Administradores podem gerenciar a empresa e convidar membros' : 'Membros têm acesso aos dados da empresa' }}
                  </p>
                </div>
              </div>

              <!-- Modal Footer -->
              <div class="border-t border-border-light dark:border-border-dark px-6 py-4 flex items-center justify-end gap-3">
                <button @click="closeInviteModal" class="btn btn-secondary" :disabled="sendingInvite">Cancelar</button>
                <button @click="sendInvite" class="btn btn-primary" :disabled="sendingInvite || !inviteEmail">
                  <span v-if="sendingInvite" class="material-icons text-sm animate-spin">refresh</span>
                  <span v-else class="material-icons text-sm">send</span>
                  {{ sendingInvite ? 'Enviando...' : 'Enviar convite' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useCurrentCompany } from '~/composables/useCurrentCompany'
import { useToast } from '~/composables/useToast'

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const toast = useToast()

// Email do usuario master que pode criar empresas
const MASTER_USER_EMAIL = 'leonardo@fazendasbioma.com.br'

// Perfil do usuario (carregado do banco)
const userPerfil = ref('user')
const perfilLoaded = ref(false)

// Verifica se o usuario logado e admin (master ou perfil admin)
const isAdmin = computed(() => {
  return user.value?.email === MASTER_USER_EMAIL || userPerfil.value === 'admin'
})

// Verifica se o usuario logado pode criar empresas (admin ou master)
const canCreateCompany = computed(() => {
  return isAdmin.value
})

// Manter compatibilidade com isMasterUser para outras verificacoes
const isMasterUser = computed(() => {
  return isAdmin.value
})

// Carregar perfil do usuario
async function loadUserPerfil() {
  if (!user.value?.id) {
    perfilLoaded.value = true
    return
  }

  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('perfil')
      .eq('user_id', user.value.id)
      .single()

    if (!error && data) {
      userPerfil.value = data.perfil || 'user'
    }
  } catch (error) {
    console.error('Erro ao carregar perfil do usuario:', error)
  } finally {
    perfilLoaded.value = true
  }
}

// Empresa atual
const { currentCompany, setCurrentCompany } = useCurrentCompany()

// Estado de loading
const loading = ref(false)
const saving = ref(false)
const loadingColaboradores = ref(false)
const sendingInvite = ref(false)

// Estado dos modais
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDetailsSlideover = ref(false)
const showInviteModal = ref(false)

// Empresa selecionada para detalhes
const selectedEmpresa = ref(null)

// Colaboradores e convites
const colaboradores = ref([])
const convitesPendentes = ref([])

// Convite
const inviteEmail = ref('')
const inviteRole = ref('member')

// Logo upload
const newLogoPreview = ref(null)
const editLogoPreview = ref(null)
const newLogoFile = ref(null)
const editLogoFile = ref(null)

// Páginacao
const currentPage = ref(1)
const itemsPerPage = ref(10)
const pageInput = ref('1')

// Filtros
const searchQuery = ref('')
const filterStatus = ref('ativa')

// Watchers para resetar pagina
watch([searchQuery, filterStatus], () => {
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

// Funcao para ir para pagina especifica
function goToPage() {
  const page = parseInt(pageInput.value)
  if (!isNaN(page) && page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  } else {
    pageInput.value = String(currentPage.value)
  }
}

// Dados
const empresas = ref([])

// Estados brasileiros
const estados = [
  { sigla: 'AC', nome: 'Acre' },
  { sigla: 'AL', nome: 'Alagoas' },
  { sigla: 'AP', nome: 'Amapa' },
  { sigla: 'AM', nome: 'Amazonas' },
  { sigla: 'BA', nome: 'Bahia' },
  { sigla: 'CE', nome: 'Ceara' },
  { sigla: 'DF', nome: 'Distrito Federal' },
  { sigla: 'ES', nome: 'Espirito Santo' },
  { sigla: 'GO', nome: 'Goias' },
  { sigla: 'MA', nome: 'Maranhao' },
  { sigla: 'MT', nome: 'Mato Grosso' },
  { sigla: 'MS', nome: 'Mato Grosso do Sul' },
  { sigla: 'MG', nome: 'Minas Gerais' },
  { sigla: 'PA', nome: 'Para' },
  { sigla: 'PB', nome: 'Paraiba' },
  { sigla: 'PR', nome: 'Parana' },
  { sigla: 'PE', nome: 'Pernambuco' },
  { sigla: 'PI', nome: 'Piaui' },
  { sigla: 'RJ', nome: 'Rio de Janeiro' },
  { sigla: 'RN', nome: 'Rio Grande do Norte' },
  { sigla: 'RS', nome: 'Rio Grande do Sul' },
  { sigla: 'RO', nome: 'Rondonia' },
  { sigla: 'RR', nome: 'Roraima' },
  { sigla: 'SC', nome: 'Santa Catarina' },
  { sigla: 'SP', nome: 'Sao Paulo' },
  { sigla: 'SE', nome: 'Sergipe' },
  { sigla: 'TO', nome: 'Tocantins' }
]

// Form de nova empresa
const newEmpresa = ref(getEmptyEmpresa())

// Form de edicao
const editEmpresa = ref({})

function getEmptyEmpresa() {
  return {
    cnpj: '',
    razao_social: '',
    nome_fantasia: '',
    num_funcionarios: 0,
    cep: '',
    endereco: '',
    numero: '',
    complemento: '',
    estado: '',
    cidade: '',
    ativo: true
  }
}

// Computed
const filteredEmpresas = computed(() => {
  let result = empresas.value

  // Filtro de status
  if (filterStatus.value === 'ativa') {
    result = result.filter(empresa => empresa.ativo === true)
  } else if (filterStatus.value === 'inativa') {
    result = result.filter(empresa => empresa.ativo === false)
  }

  // Filtro de busca
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(empresa =>
      empresa.razao_social?.toLowerCase().includes(query) ||
      empresa.nome_fantasia?.toLowerCase().includes(query) ||
      empresa.cnpj?.includes(query)
    )
  }

  return result
})

const totalPages = computed(() => {
  return Math.ceil(filteredEmpresas.value.length / itemsPerPage.value) || 1
})

const paginatedEmpresas = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredEmpresas.value.slice(start, end)
})

const isCurrentCompany = computed(() => {
  return currentCompany.value?.id === selectedEmpresa.value?.id
})

// Funcoes auxiliares
function getInitials(name) {
  if (!name) return 'EM'
  const parts = name.split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

function formatCNPJ(cnpj) {
  if (!cnpj) return null
  const cleaned = cnpj.replace(/\D/g, '')
  if (cleaned.length !== 14) return cnpj
  return cleaned.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
}

function getRoleBadgeClass(role) {
  switch (role) {
    case 'owner':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
    case 'admin':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
    default:
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
  }
}

function getRoleLabel(role) {
  switch (role) {
    case 'owner': return 'Dono'
    case 'admin': return 'Admin'
    default: return 'Membro'
  }
}

// Carregar empresas
async function loadEmpresas() {
  loading.value = true
  console.log('loadEmpresas - isAdmin:', isAdmin.value, 'userPerfil:', userPerfil.value, 'email:', user.value?.email)
  try {
    // Se for admin, carrega TODAS as empresas
    if (isAdmin.value) {
      console.log('Carregando TODAS as empresas (admin)')
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .order('created_at', { ascending: false })

      console.log('Empresas carregadas:', data?.length, error)
      if (error) throw error
      empresas.value = data || []
      return
    }

    // Para usuarios normais, buscar apenas empresas vinculadas
    const { data: userEmpresas, error: userEmpresasError } = await supabase
      .from('empresa_usuarios')
      .select('empresa_id')
      .eq('user_id', user.value?.id)

    if (userEmpresasError) throw userEmpresasError

    // Se o usuario nao tem acesso a nenhuma empresa, retorna vazio
    if (!userEmpresas || userEmpresas.length === 0) {
      empresas.value = []
      return
    }

    // Extrair os IDs das empresas
    const empresaIds = userEmpresas.map(eu => eu.empresa_id)

    // Buscar apenas as empresas que o usuario tem acesso
    const { data, error } = await supabase
      .from('empresas')
      .select('*')
      .in('id', empresaIds)
      .order('created_at', { ascending: false })

    if (error) throw error
    empresas.value = data || []
  } catch (error) {
    console.error('Erro ao carregar empresas:', error)
  } finally {
    loading.value = false
  }
}

// Carregar colaboradores
async function loadColaboradores(empresaId) {
  loadingColaboradores.value = true
  try {
    const { data, error } = await supabase
      .from('vw_empresa_colaboradores')
      .select('*')
      .eq('empresa_id', empresaId)

    if (error) throw error
    colaboradores.value = data || []

    // Carregar convites pendentes
    const { data: convites, error: convitesError } = await supabase
      .from('convites')
      .select('*')
      .eq('empresa_id', empresaId)
      .eq('status', 'pending')

    if (!convitesError) {
      convitesPendentes.value = convites || []
    }
  } catch (error) {
    console.error('Erro ao carregar colaboradores:', error)
  } finally {
    loadingColaboradores.value = false
  }
}

// Funcao para manipular upload de logo
function handleLogoChange(event, type) {
  const file = event.target.files?.[0]
  if (!file) return

  // Validar tamanho (2MB max)
  if (file.size > 2 * 1024 * 1024) {
    toast.error('A imagem deve ter no maximo 2MB')
    return
  }

  // Validar tipo
  if (!file.type.startsWith('image/')) {
    toast.error('Selecione uma imagem valida')
    return
  }

  // Criar preview
  const reader = new FileReader()
  reader.onload = (e) => {
    if (type === 'new') {
      newLogoPreview.value = e.target.result
      newLogoFile.value = file
    } else {
      editLogoPreview.value = e.target.result
      editLogoFile.value = file
    }
  }
  reader.readAsDataURL(file)
}

// Funcao para upload de logo ao Supabase Storage
async function uploadLogo(file, empresaId) {
  if (!file) {
    console.log('Nenhum arquivo para upload')
    return null
  }

  const fileExt = file.name.split('.').pop()
  const fileName = `${empresaId}.${fileExt}`
  const filePath = `logos/${fileName}`

  console.log('Fazendo upload para:', filePath)
  console.log('Arquivo:', file.name, file.size, file.type)

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('empresas')
    .upload(filePath, file, { upsert: true })

  console.log('Resultado do upload:', { uploadData, uploadError })

  if (uploadError) {
    console.error('Erro no upload:', uploadError)
    toast.error('Erro ao fazer upload da logo: ' + uploadError.message)
    return null
  }

  const { data: { publicUrl } } = supabase.storage
    .from('empresas')
    .getPublicUrl(filePath)

  console.log('Public URL:', publicUrl)

  // Adiciona timestamp para evitar cache do navegador
  return `${publicUrl}?t=${Date.now()}`
}

// Modal de criacao
function openCreateModal() {
  newEmpresa.value = getEmptyEmpresa()
  newLogoPreview.value = null
  newLogoFile.value = null
  showCreateModal.value = true
}

function closeCreateModal() {
  showCreateModal.value = false
}

async function saveEmpresa() {
  if (!newEmpresa.value.razao_social) {
    toast.error('Razão social e obrigatoria')
    return
  }

  saving.value = true
  try {
    const { data: empresaId, error } = await supabase.rpc('create_empresa_with_owner', {
      p_cnpj: newEmpresa.value.cnpj?.replace(/\D/g, '') || null,
      p_razao_social: newEmpresa.value.razao_social,
      p_nome_fantasia: newEmpresa.value.nome_fantasia || null,
      p_num_funcionarios: newEmpresa.value.num_funcionarios || 0,
      p_cep: newEmpresa.value.cep?.replace(/\D/g, '') || null,
      p_endereco: newEmpresa.value.endereco || null,
      p_numero: newEmpresa.value.numero || null,
      p_complemento: newEmpresa.value.complemento || null,
      p_estado: newEmpresa.value.estado || null,
      p_cidade: newEmpresa.value.cidade || null
    })

    if (error) throw error

    console.log('Empresa criada com ID:', empresaId)
    console.log('Logo file:', newLogoFile.value)

    // Upload logo se tiver
    if (newLogoFile.value && empresaId) {
      console.log('Iniciando upload da logo...')
      const logoUrl = await uploadLogo(newLogoFile.value, empresaId)
      console.log('Logo URL retornada:', logoUrl)
      if (logoUrl) {
        const { error: updateError } = await supabase
          .from('empresas')
          .update({ logo_url: logoUrl })
          .eq('id', empresaId)

        if (updateError) {
          console.error('Erro ao atualizar logo_url:', updateError)
        } else {
          console.log('Logo URL salva com sucesso')
        }
      }
    }

    closeCreateModal()
    await loadEmpresas()
    toast.success('Empresa criada com sucesso')
  } catch (error) {
    console.error('Erro ao criar empresa:', error)
    toast.error('Erro ao criar empresa')
  } finally {
    saving.value = false
  }
}

// Modal de edicao
function openEditModal(empresa) {
  editEmpresa.value = { ...empresa }
  editLogoPreview.value = null
  editLogoFile.value = null
  showEditModal.value = true
}

function closeEditModal() {
  showEditModal.value = false
}

async function updateEmpresa() {
  if (!editEmpresa.value.razao_social) {
    toast.error('Razão social e obrigatoria')
    return
  }

  saving.value = true
  try {
    // Upload nova logo se tiver
    let logoUrl = editEmpresa.value.logo_url
    if (editLogoFile.value) {
      const newLogoUrl = await uploadLogo(editLogoFile.value, editEmpresa.value.id)
      if (newLogoUrl) {
        logoUrl = newLogoUrl
      }
    }

    const { error } = await supabase
      .from('empresas')
      .update({
        cnpj: editEmpresa.value.cnpj?.replace(/\D/g, '') || null,
        razao_social: editEmpresa.value.razao_social,
        nome_fantasia: editEmpresa.value.nome_fantasia || null,
        num_funcionarios: editEmpresa.value.num_funcionarios || 0,
        cep: editEmpresa.value.cep?.replace(/\D/g, '') || null,
        endereco: editEmpresa.value.endereco || null,
        numero: editEmpresa.value.numero || null,
        complemento: editEmpresa.value.complemento || null,
        estado: editEmpresa.value.estado || null,
        cidade: editEmpresa.value.cidade || null,
        ativo: editEmpresa.value.ativo,
        logo_url: logoUrl
      })
      .eq('id', editEmpresa.value.id)

    if (error) throw error

    closeEditModal()
    await loadEmpresas()

    // Atualizar empresa selecionada se estava aberta no slideover
    if (selectedEmpresa.value?.id === editEmpresa.value.id) {
      selectedEmpresa.value = { ...editEmpresa.value, logo_url: logoUrl }
    }

    // Atualizar empresa atual se for a mesma
    if (currentCompany.value?.id === editEmpresa.value.id) {
      setCurrentCompany({ ...editEmpresa.value, logo_url: logoUrl })
    }

    toast.success('Empresa atualizada com sucesso')
  } catch (error) {
    console.error('Erro ao atualizar empresa:', error)
    toast.error('Erro ao atualizar empresa')
  } finally {
    saving.value = false
  }
}

// Slideover de detalhes
function openDetailsSlideover(empresa) {
  selectedEmpresa.value = empresa
  showDetailsSlideover.value = true
  loadColaboradores(empresa.id)
}

function closeDetailsSlideover() {
  showDetailsSlideover.value = false
}

function openEditFromSlideover() {
  openEditModal(selectedEmpresa.value)
}

async function selectAsCurrentCompany() {
  if (selectedEmpresa.value) {
    try {
      const { error } = await supabase.rpc('set_current_empresa', {
        p_empresa_id: selectedEmpresa.value.id
      })

      if (error) throw error

      setCurrentCompany(selectedEmpresa.value)
      toast.success('Empresa definida como atual')
    } catch (error) {
      console.error('Erro ao definir empresa atual:', error)
      toast.error('Erro ao definir empresa atual')
    }
  }
}

// Modal de convite
function openInviteModal() {
  inviteEmail.value = ''
  inviteRole.value = 'member'
  showInviteModal.value = true
}

function closeInviteModal() {
  showInviteModal.value = false
}

async function sendInvite() {
  if (!inviteEmail.value || !selectedEmpresa.value) return

  sendingInvite.value = true
  try {
    // Gerar token unico
    const token = crypto.randomUUID()

    // Criar convite no banco
    const { error: dbError } = await supabase
      .from('convites')
      .insert({
        empresa_id: selectedEmpresa.value.id,
        email: inviteEmail.value,
        role: inviteRole.value,
        token: token,
        invited_by: user.value?.id
      })

    if (dbError) throw dbError

    // Enviar email via API do Resend
    const response = await $fetch('/api/send-invite', {
      method: 'POST',
      body: {
        email: inviteEmail.value,
        token: token,
        empresaNome: selectedEmpresa.value.nome_fantasia || selectedEmpresa.value.razao_social,
        role: inviteRole.value
      }
    })

    closeInviteModal()
    await loadColaboradores(selectedEmpresa.value.id)

    // Verificar se o email foi enviado com sucesso
    if (response.emailSent === false) {
      toast.warning('Convite criado. Email nao enviado (dominio nao verificado)')
    } else {
      toast.success('Convite enviado com sucesso')
    }
  } catch (error) {
    console.error('Erro ao enviar convite:', error)
    toast.error('Erro ao enviar convite')
  } finally {
    sendingInvite.value = false
  }
}

async function cancelInvite(conviteId) {
  try {
    const { error } = await supabase
      .from('convites')
      .update({ status: 'cancelled' })
      .eq('id', conviteId)

    if (error) throw error

    await loadColaboradores(selectedEmpresa.value.id)
    toast.success('Convite cancelado')
  } catch (error) {
    console.error('Erro ao cancelar convite:', error)
    toast.error('Erro ao cancelar convite')
  }
}

// Copiar link do convite
function copyInviteLink(token) {
  const baseUrl = window.location.origin
  const link = `${baseUrl}/auth/accept-invite?token=${token}`

  navigator.clipboard.writeText(link).then(() => {
    toast.success('Link copiado')
  }).catch(() => {
    toast.error('Erro ao copiar link')
  })
}

// Busca de CEP
async function buscarCep(type) {
  const cep = type === 'new'
    ? newEmpresa.value.cep?.replace(/\D/g, '')
    : editEmpresa.value.cep?.replace(/\D/g, '')

  if (cep?.length !== 8) return

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
    const data = await response.json()

    if (!data.erro) {
      if (type === 'new') {
        newEmpresa.value.endereco = data.logradouro
        newEmpresa.value.cidade = data.localidade
        newEmpresa.value.estado = data.uf
      } else {
        editEmpresa.value.endereco = data.logradouro
        editEmpresa.value.cidade = data.localidade
        editEmpresa.value.estado = data.uf
      }
    }
  } catch (error) {
    console.error('Erro ao buscar CEP:', error)
  }
}

// Lifecycle
onMounted(async () => {
  // Primeiro carrega o perfil para saber se e admin
  await loadUserPerfil()
  // Depois carrega as empresas (admin ve todas, usuario normal ve so as vinculadas)
  loadEmpresas()
})
</script>
