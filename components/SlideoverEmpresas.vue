<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-300"
      leave-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div v-if="modelValue" class="fixed inset-0 z-[70] overflow-hidden">
        <div class="fixed inset-0 glass-backdrop" @click="closeSlideover"></div>

        <div class="fixed inset-y-0 right-0 flex max-w-full">
          <Transition
            enter-active-class="transform transition ease-in-out duration-300"
            leave-active-class="transform transition ease-in-out duration-300"
            enter-from-class="translate-x-full"
            leave-to-class="translate-x-full"
          >
            <div v-if="modelValue" class="w-screen max-w-full sm:max-w-2xl">
              <div class="h-full flex flex-col glass-panel shadow-2xl">

                <!-- Header Dinamico -->
                <div class="px-4 sm:px-6 py-4 border-b border-border-light dark:border-border-dark flex items-center gap-3 shrink-0">
                  <button
                    v-if="currentView !== 'list'"
                    @click="goBack"
                    class="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <span class="material-icons text-xl">arrow_back</span>
                  </button>
                  <h2 class="text-lg font-semibold text-text-light dark:text-text-dark flex-1">{{ viewTitle }}</h2>
                  <button
                    @click="closeSlideover"
                    class="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <span class="material-icons">close</span>
                  </button>
                </div>

                <!-- Conteudo scrollavel -->
                <div class="flex-1 overflow-y-auto">

                  <!-- ==================== VIEW: LISTA ==================== -->
                  <div v-if="currentView === 'list'" class="p-4 sm:p-6">
                    <div class="card">
                      <!-- Header do Card -->
                      <div class="p-3 sm:p-4 border-b border-border-light dark:border-border-dark">
                        <div class="flex flex-col gap-3">
                          <div class="flex items-center justify-between">
                            <h2 class="text-xs sm:text-sm font-medium text-subtext-light dark:text-subtext-dark uppercase tracking-wider">Lista Empresas</h2>
                            <button v-if="isMasterUser" @click="navigateTo('create')" class="hidden sm:flex btn btn-primary shrink-0">
                              <span class="material-icons text-sm">add</span>
                              Nova empresa
                            </button>
                          </div>
                          <div class="flex flex-col sm:flex-row gap-2 sm:gap-3">
                            <select v-model="filterStatus" class="input text-sm w-full sm:w-28 shrink-0">
                              <option value="ativa">Ativas</option>
                              <option value="inativa">Inativas</option>
                              <option value="">Todas</option>
                            </select>
                            <div class="relative flex-1">
                              <span class="absolute left-3 top-1/2 -translate-y-1/2 material-icons-outlined text-gray-400 text-base sm:text-lg">search</span>
                              <input v-model="searchQuery" type="text" placeholder="Pesquise aqui..." class="input w-full text-sm pl-9 sm:pl-10" />
                            </div>
                            <button v-if="isMasterUser" @click="navigateTo('create')" class="sm:hidden btn btn-primary w-full justify-center">
                              <span class="material-icons text-sm">add</span>
                              Nova empresa
                            </button>
                          </div>
                        </div>
                      </div>

                      <!-- Lista de Empresas -->
                      <div class="divide-y divide-border-light dark:divide-border-dark">
                        <div
                          v-for="empresa in paginatedEmpresas"
                          :key="empresa.id"
                          class="p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                          @click="openDetails(empresa)"
                        >
                          <div class="flex items-center gap-3">
                            <div class="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary overflow-hidden shrink-0">
                              <img v-if="empresa.logo_url" :src="empresa.logo_url" class="w-full h-full object-cover" />
                              <span v-else>{{ getInitials(empresa.nome_fantasia || empresa.razao_social) }}</span>
                            </div>
                            <div class="flex-1 min-w-0">
                              <p class="text-sm font-medium text-text-light dark:text-text-dark truncate">{{ empresa.nome_fantasia || empresa.razao_social }}</p>
                              <p v-if="empresa.nome_fantasia" class="text-xs text-subtext-light dark:text-subtext-dark truncate">{{ empresa.razao_social }}</p>
                            </div>
                            <span v-if="empresa.cnpj" class="hidden sm:block text-xs text-subtext-light dark:text-subtext-dark">{{ formatCNPJ(empresa.cnpj) }}</span>
                            <span :class="['badge shrink-0', empresa.ativo ? 'badge-success' : 'badge-inactive']">
                              {{ empresa.ativo ? 'Ativa' : 'Inativa' }}
                            </span>
                            <span class="material-icons-outlined text-gray-400 text-lg">chevron_right</span>
                          </div>
                        </div>
                      </div>

                      <!-- Loading -->
                      <div v-if="loading" class="text-center py-12">
                        <span class="material-icons text-4xl text-gray-300 dark:text-gray-600 animate-spin">refresh</span>
                        <p class="text-sm text-subtext-light dark:text-subtext-dark mt-2">Carregando...</p>
                      </div>

                      <!-- Empty -->
                      <div v-else-if="filteredEmpresas.length === 0 && !loading" class="text-center py-12 flex flex-col items-center px-4">
                        <span class="material-icons-outlined text-4xl text-gray-300 dark:text-gray-600 mb-2">business</span>
                        <h3 class="text-lg font-medium text-text-light dark:text-text-dark mb-1">Nenhuma empresa encontrada</h3>
                        <p class="text-sm text-subtext-light dark:text-subtext-dark mb-4">
                          {{ isMasterUser ? 'Comece criando sua primeira empresa' : 'Você ainda não tem acesso a nenhuma empresa' }}
                        </p>
                        <button v-if="isMasterUser" @click="navigateTo('create')" class="btn btn-primary">
                          <span class="material-icons text-sm">add</span>
                          Nova empresa
                        </button>
                      </div>

                      <!-- Paginacao -->
                      <div v-if="filteredEmpresas.length > 0" class="p-3 sm:p-4 border-t border-border-light dark:border-border-dark text-xs text-subtext-light dark:text-subtext-dark">
                        <div class="flex items-center justify-between">
                          <div class="flex items-center gap-2">
                            <select v-model="itemsPerPage" class="border border-border-light dark:border-border-dark rounded px-2 py-1 bg-white dark:bg-gray-800 text-xs cursor-pointer">
                              <option :value="10">10</option>
                              <option :value="25">25</option>
                              <option :value="50">50</option>
                            </select>
                            <span>{{ filteredEmpresas.length }} registros</span>
                          </div>
                          <div class="flex items-center gap-1.5">
                            <button @click="currentPage--" :disabled="currentPage === 1" class="p-1 border border-border-light dark:border-border-dark rounded hover:bg-gray-50 dark:hover:bg-gray-800 bg-white dark:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                              <span class="material-icons text-sm">chevron_left</span>
                            </button>
                            <span>{{ currentPage }} de {{ totalPages }}</span>
                            <button @click="currentPage++" :disabled="currentPage === totalPages" class="p-1 border border-border-light dark:border-border-dark rounded hover:bg-gray-50 dark:hover:bg-gray-800 bg-white dark:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                              <span class="material-icons text-sm">chevron_right</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- ==================== VIEW: DETALHES ==================== -->
                  <div v-else-if="currentView === 'details'" class="p-4 sm:p-6 space-y-5">
                    <!-- Status e Acoes -->
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
                      <div class="flex items-center gap-2">
                        <button v-if="!isCurrentCompany" @click="selectAsCurrentCompany" class="text-sm text-primary hover:underline">
                          Definir como atual
                        </button>
                        <button @click="openEdit" class="text-sm text-primary hover:underline flex items-center gap-1">
                          <span class="material-icons text-sm">edit</span>
                          Editar
                        </button>
                      </div>
                    </div>

                    <!-- Info da Empresa -->
                    <div class="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 sm:p-5">
                      <div class="flex items-center gap-4 mb-4">
                        <div class="w-14 h-14 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-lg font-bold text-primary overflow-hidden shrink-0">
                          <img v-if="selectedEmpresa?.logo_url" :src="selectedEmpresa.logo_url" class="w-full h-full object-cover" />
                          <span v-else class="text-gray-400">{{ getInitials(selectedEmpresa?.nome_fantasia || selectedEmpresa?.razao_social) }}</span>
                        </div>
                        <div class="min-w-0">
                          <h3 class="text-base font-semibold text-text-light dark:text-text-dark truncate">{{ selectedEmpresa?.nome_fantasia || selectedEmpresa?.razao_social }}</h3>
                          <p v-if="selectedEmpresa?.nome_fantasia" class="text-sm text-subtext-light dark:text-subtext-dark truncate">{{ selectedEmpresa?.razao_social }}</p>
                        </div>
                      </div>
                      <div class="grid grid-cols-2 gap-3">
                        <div>
                          <p class="text-xs text-gray-500 dark:text-subtext-dark mb-1">CNPJ</p>
                          <p class="text-sm font-medium text-gray-900 dark:text-text-dark">{{ formatCNPJ(selectedEmpresa?.cnpj) || '-' }}</p>
                        </div>
                        <div>
                          <p class="text-xs text-gray-500 dark:text-subtext-dark mb-1">Funcionários</p>
                          <p class="text-sm font-medium text-gray-900 dark:text-text-dark">{{ selectedEmpresa?.num_funcionarios || 0 }}</p>
                        </div>
                        <div v-if="selectedEmpresa?.endereco" class="col-span-2">
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
                        <button @click="navigateTo('invite')" class="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors">
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
                        <button @click="navigateTo('invite')" class="text-sm text-primary hover:underline">Convidar primeiro</button>
                      </div>

                      <div v-else class="space-y-2">
                        <div v-for="colaborador in colaboradores" :key="colaborador.id" class="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                          <div class="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary shrink-0">
                            {{ getInitials(colaborador.nome) }}
                          </div>
                          <div class="flex-1 min-w-0">
                            <p class="text-sm font-medium text-gray-900 dark:text-text-dark truncate">{{ colaborador.nome }}</p>
                            <p class="text-xs text-gray-500 dark:text-subtext-dark truncate">{{ colaborador.email }}</p>
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
                          <div v-for="convite in convitesPendentes" :key="convite.id" class="flex items-center gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50">
                            <div class="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-xs font-medium text-amber-600 shrink-0">
                              <span class="material-icons text-base">mail</span>
                            </div>
                            <div class="flex-1 min-w-0">
                              <p class="text-sm text-gray-900 dark:text-text-dark truncate">{{ convite.email }}</p>
                              <p class="text-xs text-gray-500 dark:text-subtext-dark">{{ convite.role === 'admin' ? 'Administrador' : 'Membro' }}</p>
                            </div>
                            <button @click="copyInviteLink(convite.token)" class="p-1.5 text-gray-400 hover:text-primary rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-colors" title="Copiar link">
                              <span class="material-icons text-base">content_copy</span>
                            </button>
                            <button @click="cancelInvite(convite.id)" class="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-colors" title="Cancelar">
                              <span class="material-icons text-base">close</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- ==================== VIEW: CRIAR ==================== -->
                  <div v-else-if="currentView === 'create'" class="p-4 sm:p-6 space-y-6">
                    <!-- Dados da Empresa -->
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
                            <button type="button" @click="buscarCNPJ('new')" :disabled="buscandoCNPJ" class="btn btn-secondary shrink-0">
                              <span v-if="buscandoCNPJ" class="material-icons text-sm animate-spin">refresh</span>
                              <span v-else class="material-icons text-sm">search</span>
                              {{ buscandoCNPJ ? 'Buscando...' : 'Buscar' }}
                            </button>
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
                    <!-- Endereco -->
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

                  <!-- ==================== VIEW: EDITAR ==================== -->
                  <div v-else-if="currentView === 'edit'" class="p-4 sm:p-6 space-y-6">
                    <!-- Dados da Empresa -->
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
                            <button type="button" @click="buscarCNPJ('edit')" :disabled="buscandoCNPJ" class="btn btn-secondary shrink-0">
                              <span v-if="buscandoCNPJ" class="material-icons text-sm animate-spin">refresh</span>
                              <span v-else class="material-icons text-sm">search</span>
                              {{ buscandoCNPJ ? 'Buscando...' : 'Buscar' }}
                            </button>
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
                    <!-- Endereco -->
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

                  <!-- ==================== VIEW: CONVIDAR ==================== -->
                  <div v-else-if="currentView === 'invite'" class="p-4 sm:p-6 space-y-4">
                    <p class="text-sm text-subtext-light dark:text-subtext-dark">
                      Convidar colaborador para <strong class="text-text-light dark:text-text-dark">{{ selectedEmpresa?.nome_fantasia || selectedEmpresa?.razao_social }}</strong>
                    </p>
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

                </div><!-- fim overflow-y-auto -->

                <!-- Footer Dinamico -->
                <div v-if="currentView === 'create'" class="px-4 sm:px-6 py-4 border-t border-border-light dark:border-border-dark flex items-center justify-end gap-3 shrink-0">
                  <button @click="goBack" class="btn btn-secondary" :disabled="saving">Cancelar</button>
                  <button @click="saveEmpresa" class="btn btn-primary" :disabled="saving">
                    <span v-if="saving" class="material-icons text-sm animate-spin">refresh</span>
                    {{ saving ? 'Salvando...' : 'Salvar empresa' }}
                  </button>
                </div>

                <div v-else-if="currentView === 'edit'" class="px-4 sm:px-6 py-4 border-t border-border-light dark:border-border-dark flex items-center justify-end gap-3 shrink-0">
                  <button @click="goBack" class="btn btn-secondary" :disabled="saving">Cancelar</button>
                  <button @click="updateEmpresa" class="btn btn-primary" :disabled="saving">
                    <span v-if="saving" class="material-icons text-sm animate-spin">refresh</span>
                    {{ saving ? 'Salvando...' : 'Salvar alterações' }}
                  </button>
                </div>

                <div v-else-if="currentView === 'invite'" class="px-4 sm:px-6 py-4 border-t border-border-light dark:border-border-dark flex items-center justify-end gap-3 shrink-0">
                  <button @click="goBack" class="btn btn-secondary" :disabled="sendingInvite">Cancelar</button>
                  <button @click="sendInvite" class="btn btn-primary" :disabled="sendingInvite || !inviteEmail">
                    <span v-if="sendingInvite" class="material-icons text-sm animate-spin">refresh</span>
                    <span v-else class="material-icons text-sm">send</span>
                    {{ sendingInvite ? 'Enviando...' : 'Enviar convite' }}
                  </button>
                </div>

              </div><!-- fim flex-col -->
            </div><!-- fim w-screen -->
          </Transition>
        </div><!-- fim fixed right -->
      </div><!-- fim fixed inset -->
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useCurrentCompany } from '~/composables/useCurrentCompany'
import { useToast } from '~/composables/useToast'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const toast = useToast()

// ==================== NAVEGACAO POR VIEWS ====================
const currentView = ref('list') // 'list' | 'details' | 'create' | 'edit' | 'invite'
const viewHistory = ref([])

const viewTitle = computed(() => {
  switch (currentView.value) {
    case 'list': return 'Gerenciar Empresas'
    case 'details': return selectedEmpresa.value?.nome_fantasia || selectedEmpresa.value?.razao_social || 'Detalhes'
    case 'create': return 'Nova empresa'
    case 'edit': return 'Editar empresa'
    case 'invite': return 'Convidar colaborador'
    default: return 'Empresas'
  }
})

function navigateTo(view) {
  viewHistory.value.push(currentView.value)
  currentView.value = view
}

function goBack() {
  const previous = viewHistory.value.pop()
  currentView.value = previous || 'list'
}

function closeSlideover() {
  emit('update:modelValue', false)
  // Reset ao fechar
  setTimeout(() => {
    currentView.value = 'list'
    viewHistory.value = []
  }, 300)
}

// ==================== AUTH / ADMIN ====================
const MASTER_USER_EMAIL = 'leonardo@fazendasbioma.com.br'
const userPerfil = ref('user')
const perfilLoaded = ref(false)

const isAdmin = computed(() => {
  return user.value?.email === MASTER_USER_EMAIL || userPerfil.value === 'admin'
})

const isMasterUser = computed(() => isAdmin.value)

async function loadUserPerfil() {
  if (!user.value?.id) { perfilLoaded.value = true; return }
  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('perfil')
      .eq('user_id', user.value.id)
      .single()
    if (!error && data) userPerfil.value = data.perfil || 'user'
  } catch (error) {
    console.error('Erro ao carregar perfil:', error)
  } finally {
    perfilLoaded.value = true
  }
}

// ==================== EMPRESA ATUAL ====================
const { currentCompany, setCurrentCompany } = useCurrentCompany()

// ==================== ESTADO ====================
const loading = ref(false)
const saving = ref(false)
const loadingColaboradores = ref(false)
const sendingInvite = ref(false)
const buscandoCNPJ = ref(false)

const selectedEmpresa = ref(null)
const colaboradores = ref([])
const convitesPendentes = ref([])
const inviteEmail = ref('')
const inviteRole = ref('member')

const newLogoPreview = ref(null)
const editLogoPreview = ref(null)
const newLogoFile = ref(null)
const editLogoFile = ref(null)

const currentPage = ref(1)
const itemsPerPage = ref(10)
const searchQuery = ref('')
const filterStatus = ref('ativa')

const empresas = ref([])
const newEmpresa = ref(getEmptyEmpresa())
const editEmpresa = ref({})

// ==================== WATCHERS ====================
watch([searchQuery, filterStatus], () => { currentPage.value = 1 })
watch(itemsPerPage, () => { currentPage.value = 1 })

// ==================== COMPUTED ====================
const filteredEmpresas = computed(() => {
  let result = empresas.value
  if (filterStatus.value === 'ativa') result = result.filter(e => e.ativo === true)
  else if (filterStatus.value === 'inativa') result = result.filter(e => e.ativo === false)
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(e =>
      e.razao_social?.toLowerCase().includes(q) ||
      e.nome_fantasia?.toLowerCase().includes(q) ||
      e.cnpj?.includes(q)
    )
  }
  return result
})

const totalPages = computed(() => Math.ceil(filteredEmpresas.value.length / itemsPerPage.value) || 1)

const paginatedEmpresas = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  return filteredEmpresas.value.slice(start, start + itemsPerPage.value)
})

const isCurrentCompany = computed(() => currentCompany.value?.id === selectedEmpresa.value?.id)

// ==================== HELPERS ====================
function getEmptyEmpresa() {
  return { cnpj: '', razao_social: '', nome_fantasia: '', num_funcionarios: 0, cep: '', endereco: '', numero: '', complemento: '', estado: '', cidade: '', ativo: true }
}

function getInitials(name) {
  if (!name) return 'EM'
  const parts = name.split(' ')
  return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : name.substring(0, 2).toUpperCase()
}

function formatCNPJ(cnpj) {
  if (!cnpj) return null
  const c = cnpj.replace(/\D/g, '')
  if (c.length !== 14) return cnpj
  return c.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
}

function getRoleBadgeClass(role) {
  if (role === 'owner') return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
  if (role === 'admin') return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
  return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
}

function getRoleLabel(role) {
  if (role === 'owner') return 'Dono'
  if (role === 'admin') return 'Admin'
  return 'Membro'
}

const estados = [
  { sigla: 'AC', nome: 'Acre' }, { sigla: 'AL', nome: 'Alagoas' }, { sigla: 'AP', nome: 'Amapá' },
  { sigla: 'AM', nome: 'Amazonas' }, { sigla: 'BA', nome: 'Bahia' }, { sigla: 'CE', nome: 'Ceará' },
  { sigla: 'DF', nome: 'Distrito Federal' }, { sigla: 'ES', nome: 'Espírito Santo' }, { sigla: 'GO', nome: 'Goiás' },
  { sigla: 'MA', nome: 'Maranhão' }, { sigla: 'MT', nome: 'Mato Grosso' }, { sigla: 'MS', nome: 'Mato Grosso do Sul' },
  { sigla: 'MG', nome: 'Minas Gerais' }, { sigla: 'PA', nome: 'Pará' }, { sigla: 'PB', nome: 'Paraíba' },
  { sigla: 'PR', nome: 'Paraná' }, { sigla: 'PE', nome: 'Pernambuco' }, { sigla: 'PI', nome: 'Piauí' },
  { sigla: 'RJ', nome: 'Rio de Janeiro' }, { sigla: 'RN', nome: 'Rio Grande do Norte' }, { sigla: 'RS', nome: 'Rio Grande do Sul' },
  { sigla: 'RO', nome: 'Rondônia' }, { sigla: 'RR', nome: 'Roraima' }, { sigla: 'SC', nome: 'Santa Catarina' },
  { sigla: 'SP', nome: 'São Paulo' }, { sigla: 'SE', nome: 'Sergipe' }, { sigla: 'TO', nome: 'Tocantins' }
]

// ==================== CARREGAR DADOS ====================
async function loadEmpresas() {
  loading.value = true
  try {
    if (isAdmin.value) {
      const { data, error } = await supabase.from('empresas').select('*').order('created_at', { ascending: false })
      if (error) throw error
      empresas.value = data || []
      return
    }
    const { data: userEmpresas, error: ueError } = await supabase
      .from('empresa_usuarios').select('empresa_id').eq('user_id', user.value?.id)
    if (ueError) throw ueError
    if (!userEmpresas || userEmpresas.length === 0) { empresas.value = []; return }
    const ids = userEmpresas.map(eu => eu.empresa_id)
    const { data, error } = await supabase.from('empresas').select('*').in('id', ids).order('created_at', { ascending: false })
    if (error) throw error
    empresas.value = data || []
  } catch (error) {
    console.error('Erro ao carregar empresas:', error)
  } finally {
    loading.value = false
  }
}

async function loadColaboradores(empresaId) {
  loadingColaboradores.value = true
  try {
    const { data, error } = await supabase.from('vw_empresa_colaboradores').select('*').eq('empresa_id', empresaId)
    if (error) throw error
    colaboradores.value = data || []
    const { data: convites, error: cError } = await supabase.from('convites').select('*').eq('empresa_id', empresaId).eq('status', 'pending')
    if (!cError) convitesPendentes.value = convites || []
  } catch (error) {
    console.error('Erro ao carregar colaboradores:', error)
  } finally {
    loadingColaboradores.value = false
  }
}

// ==================== LOGO ====================
function handleLogoChange(event, type) {
  const file = event.target.files?.[0]
  if (!file) return
  if (file.size > 2 * 1024 * 1024) { toast.error('A imagem deve ter no máximo 2MB'); return }
  if (!file.type.startsWith('image/')) { toast.error('Selecione uma imagem válida'); return }
  const reader = new FileReader()
  reader.onload = (e) => {
    if (type === 'new') { newLogoPreview.value = e.target.result; newLogoFile.value = file }
    else { editLogoPreview.value = e.target.result; editLogoFile.value = file }
  }
  reader.readAsDataURL(file)
}

async function uploadLogo(file, empresaId) {
  if (!file) return null
  const fileExt = file.name.split('.').pop()
  const filePath = `logos/${empresaId}.${fileExt}`
  const { error: uploadError } = await supabase.storage.from('empresas').upload(filePath, file, { upsert: true })
  if (uploadError) { toast.error('Erro ao fazer upload da logo: ' + uploadError.message); return null }
  const { data: { publicUrl } } = supabase.storage.from('empresas').getPublicUrl(filePath)
  return `${publicUrl}?t=${Date.now()}`
}

// ==================== NAVEGACAO ENTRE VIEWS ====================
function openDetails(empresa) {
  selectedEmpresa.value = empresa
  loadColaboradores(empresa.id)
  navigateTo('details')
}

function openEdit() {
  editEmpresa.value = { ...selectedEmpresa.value }
  editLogoPreview.value = null
  editLogoFile.value = null
  navigateTo('edit')
}

// ==================== CRUD ====================
async function saveEmpresa() {
  if (!newEmpresa.value.razao_social) { toast.error('Razão social é obrigatória'); return }
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
    if (newLogoFile.value && empresaId) {
      const logoUrl = await uploadLogo(newLogoFile.value, empresaId)
      if (logoUrl) await supabase.from('empresas').update({ logo_url: logoUrl }).eq('id', empresaId)
    }
    goBack()
    newEmpresa.value = getEmptyEmpresa()
    newLogoPreview.value = null
    newLogoFile.value = null
    await loadEmpresas()
    toast.success('Empresa criada com sucesso')
  } catch (error) {
    console.error('Erro ao criar empresa:', error)
    toast.error('Erro ao criar empresa')
  } finally {
    saving.value = false
  }
}

async function updateEmpresa() {
  if (!editEmpresa.value.razao_social) { toast.error('Razão social é obrigatória'); return }
  saving.value = true
  try {
    let logoUrl = editEmpresa.value.logo_url
    if (editLogoFile.value) {
      const newUrl = await uploadLogo(editLogoFile.value, editEmpresa.value.id)
      if (newUrl) logoUrl = newUrl
    }
    const { error } = await supabase.from('empresas').update({
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
    }).eq('id', editEmpresa.value.id)
    if (error) throw error
    // Atualizar empresa selecionada e atual se necessario
    const updated = { ...editEmpresa.value, logo_url: logoUrl }
    if (selectedEmpresa.value?.id === editEmpresa.value.id) selectedEmpresa.value = updated
    if (currentCompany.value?.id === editEmpresa.value.id) setCurrentCompany(updated)
    goBack()
    await loadEmpresas()
    toast.success('Empresa atualizada com sucesso')
  } catch (error) {
    console.error('Erro ao atualizar empresa:', error)
    toast.error('Erro ao atualizar empresa')
  } finally {
    saving.value = false
  }
}

async function selectAsCurrentCompany() {
  if (!selectedEmpresa.value) return
  try {
    const { error } = await supabase.rpc('set_current_empresa', { p_empresa_id: selectedEmpresa.value.id })
    if (error) throw error
    setCurrentCompany(selectedEmpresa.value)
    toast.success('Empresa definida como atual')
  } catch (error) {
    console.error('Erro ao definir empresa atual:', error)
    toast.error('Erro ao definir empresa atual')
  }
}

// ==================== CONVITES ====================
async function sendInvite() {
  if (!inviteEmail.value || !selectedEmpresa.value) return
  sendingInvite.value = true
  try {
    const token = crypto.randomUUID()
    const { error: dbError } = await supabase.from('convites').insert({
      empresa_id: selectedEmpresa.value.id,
      email: inviteEmail.value,
      role: inviteRole.value,
      token: token,
      invited_by: user.value?.id
    })
    if (dbError) throw dbError
    const response = await $fetch('/api/send-invite', {
      method: 'POST',
      body: {
        email: inviteEmail.value,
        token: token,
        empresaNome: selectedEmpresa.value.nome_fantasia || selectedEmpresa.value.razao_social,
        role: inviteRole.value
      }
    })
    goBack()
    await loadColaboradores(selectedEmpresa.value.id)
    if (response.emailSent === false) toast.warning('Convite criado. Email não enviado (domínio não verificado)')
    else toast.success('Convite enviado com sucesso')
  } catch (error) {
    console.error('Erro ao enviar convite:', error)
    toast.error('Erro ao enviar convite')
  } finally {
    sendingInvite.value = false
  }
}

async function cancelInvite(conviteId) {
  try {
    const { error } = await supabase.from('convites').update({ status: 'cancelled' }).eq('id', conviteId)
    if (error) throw error
    await loadColaboradores(selectedEmpresa.value.id)
    toast.success('Convite cancelado')
  } catch (error) {
    console.error('Erro ao cancelar convite:', error)
    toast.error('Erro ao cancelar convite')
  }
}

function copyInviteLink(token) {
  const link = `${window.location.origin}/auth/accept-invite?token=${token}`
  navigator.clipboard.writeText(link).then(() => toast.success('Link copiado')).catch(() => toast.error('Erro ao copiar link'))
}

// ==================== BUSCA CNPJ / CEP ====================
async function buscarCNPJ(type) {
  const cnpj = (type === 'new' ? newEmpresa.value.cnpj : editEmpresa.value.cnpj)?.replace(/\D/g, '')
  if (cnpj?.length !== 14) { toast.error('CNPJ inválido'); return }
  buscandoCNPJ.value = true
  try {
    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`)
    const data = await response.json()
    if (!data.message) {
      const target = type === 'new' ? newEmpresa.value : editEmpresa.value
      target.razao_social = data.razao_social || ''
      target.nome_fantasia = data.nome_fantasia || ''
      target.cep = data.cep ? data.cep.replace(/(\d{5})(\d{3})/, '$1-$2') : ''
      target.endereco = data.logradouro || ''
      target.numero = data.numero || ''
      target.complemento = data.complemento || ''
      target.cidade = data.municipio || ''
      target.estado = data.uf || ''
      toast.success('Dados do CNPJ carregados')
    } else {
      toast.error('CNPJ não encontrado')
    }
  } catch (error) {
    toast.error('Erro ao buscar CNPJ')
  } finally {
    buscandoCNPJ.value = false
  }
}

async function buscarCep(type) {
  const cep = (type === 'new' ? newEmpresa.value.cep : editEmpresa.value.cep)?.replace(/\D/g, '')
  if (cep?.length !== 8) return
  try {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
    const data = await response.json()
    if (!data.erro) {
      const target = type === 'new' ? newEmpresa.value : editEmpresa.value
      target.endereco = data.logradouro
      target.cidade = data.localidade
      target.estado = data.uf
    }
  } catch (error) {
    console.error('Erro ao buscar CEP:', error)
  }
}

// ==================== LIFECYCLE ====================
// Reset view ao abrir
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    currentView.value = 'list'
    viewHistory.value = []
    newEmpresa.value = getEmptyEmpresa()
    inviteEmail.value = ''
    inviteRole.value = 'member'
  }
})

onMounted(async () => {
  await loadUserPerfil()
  loadEmpresas()
})
</script>
