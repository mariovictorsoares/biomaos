<template>
  <!-- Overlay para mobile -->
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-300"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        class="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
        @click="closeSidebar"
      ></div>
    </Transition>
  </Teleport>

  <!-- Tooltip Global via Teleport -->
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-150"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="tooltip.visible && isCollapsed"
        class="fixed z-[9999] px-3 py-2 text-sm font-medium text-white bg-gray-900 dark:bg-gray-700 rounded-lg shadow-lg whitespace-nowrap pointer-events-none"
        :style="{ top: tooltip.top + 'px', left: tooltip.left + 'px' }"
      >
        {{ tooltip.text }}
        <div class="absolute top-1/2 -translate-y-1/2 right-full border-[6px] border-transparent border-r-gray-900 dark:border-r-gray-700"></div>
      </div>
    </Transition>
  </Teleport>

  <!-- Sidebar -->
  <aside
    :class="[
      'sidebar-container',
      isCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded',
      isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
    ]"
  >
    <!-- Header com Logo e Toggle -->
    <div :class="['sidebar-header', isCollapsed ? 'sidebar-header-collapsed' : '']">
      <!-- Logo (apenas quando expandido) -->
      <div v-if="!isCollapsed" class="sidebar-logo-container">
        <img
          src="/images/logo-biomaos.png"
          alt="BiomaOS"
          class="sidebar-logo"
        />
      </div>

      <!-- Botão Toggle Desktop (sempre visível) -->
      <button
        @click="toggleCollapsed"
        :class="[
          'sidebar-toggle-btn hidden lg:flex',
          isCollapsed ? 'sidebar-toggle-btn-centered' : ''
        ]"
        @mouseenter="showTooltip($event, isCollapsed ? 'Expandir menu' : 'Recolher menu')"
        @mouseleave="hideTooltip"
      >
        <span
          class="material-icons text-lg transition-transform duration-300"
          :class="{ 'rotate-180': isCollapsed }"
        >chevron_left</span>
      </button>

      <!-- Botão Fechar Mobile -->
      <button
        @click="closeSidebar"
        class="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <span class="material-icons text-xl">close</span>
      </button>
    </div>

    <!-- Navegação -->
    <nav class="sidebar-nav">
      <div class="sidebar-nav-inner">
        <template v-for="item in menuItems" :key="item.path">
          <NuxtLink
            :to="item.path"
            :class="[
              'sidebar-menu-item group',
              isCollapsed ? 'sidebar-menu-item-collapsed' : '',
              isActive(item.path) ? 'sidebar-menu-item-active' : 'sidebar-menu-item-inactive'
            ]"
            @click="closeSidebar"
            @mouseenter="showTooltip($event, item.label)"
            @mouseleave="hideTooltip"
          >
            <!-- Ícone -->
            <span
              :class="[
                'material-icons-outlined sidebar-menu-icon',
                isActive(item.path) ? 'text-primary' : 'text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-300'
              ]"
            >{{ item.icon }}</span>

            <!-- Label com animação (sempre visível no mobile) -->
            <span :class="['sidebar-menu-label', { 'lg:!hidden': isCollapsed }]">
              {{ item.label }}
            </span>
          </NuxtLink>
        </template>
      </div>
    </nav>

    <!-- Suporte -->
    <div class="sidebar-support">
      <button
        @click="toggleSupport"
        :class="[
          'sidebar-support-toggle group',
          isCollapsed ? 'sidebar-menu-item-collapsed' : ''
        ]"
        @mouseenter="showTooltip($event, 'Suporte')"
        @mouseleave="hideTooltip"
      >
        <span class="material-icons-outlined sidebar-menu-icon text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-300">
          support_agent
        </span>
        <span :class="['sidebar-menu-label', { 'lg:!hidden': isCollapsed }]">Suporte</span>
        <span
          :class="[
            'material-icons text-xs text-gray-400 ml-auto transition-transform duration-200',
            { 'lg:!hidden': isCollapsed, 'rotate-180': showSupportMenu }
          ]"
        >expand_more</span>
      </button>

      <!-- Sub-itens expansíveis -->
      <Transition
        enter-active-class="transition-all duration-200 ease-out"
        enter-from-class="opacity-0 max-h-0"
        enter-to-class="opacity-100 max-h-24"
        leave-active-class="transition-all duration-150 ease-in"
        leave-from-class="opacity-100 max-h-24"
        leave-to-class="opacity-0 max-h-0"
      >
        <div v-if="showSupportMenu && !isCollapsed" class="sidebar-support-items overflow-hidden">
          <button @click="openHelp" class="sidebar-support-item group">
            <span class="material-icons-outlined sidebar-menu-icon text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-300">
              menu_book
            </span>
            <span class="sidebar-menu-label">Central de Ajuda</span>
          </button>
          <button @click="openChat" class="sidebar-support-item group">
            <span class="material-icons-outlined sidebar-menu-icon text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-300">
              chat
            </span>
            <span class="sidebar-menu-label">Falar com Atendente</span>
          </button>
        </div>
      </Transition>
    </div>

    <!-- Footer: Empresa + Usuário -->
    <div class="sidebar-footer">
      <!-- Empresa Atual (abre popover) -->
      <div class="relative">
        <button
          :class="[
            'sidebar-company-card group w-full',
            isCollapsed ? 'sidebar-company-card-collapsed' : ''
          ]"
          @click="toggleCompanyPopover"
          @mouseenter="showTooltip($event, currentCompanyName)"
          @mouseleave="hideTooltip"
        >
          <div class="sidebar-company-avatar">
            <img v-if="currentCompanyLogo" :src="currentCompanyLogo" class="w-full h-full object-cover" alt="Logo" />
            <span v-else>{{ currentCompanyInitials }}</span>
          </div>
          <div :class="['sidebar-company-info', { 'lg:!hidden': isCollapsed }]">
            <p class="sidebar-company-label">Empresa atual</p>
            <p class="sidebar-company-name">{{ currentCompanyName }}</p>
          </div>
          <span :class="['sidebar-company-icon material-icons-outlined transition-transform duration-200', { 'lg:!hidden': isCollapsed, 'rotate-180': showCompanyPopover }]">unfold_more</span>
        </button>

        <!-- Popover de Empresas -->
        <Teleport to="body">
          <Transition
            enter-active-class="transition-all duration-200 ease-out"
            enter-from-class="opacity-0 translate-y-2"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition-all duration-150 ease-in"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 translate-y-2"
          >
            <div
              v-if="showCompanyPopover"
              class="fixed z-[9999]"
              :style="companyPopoverStyle"
            >
              <!-- Backdrop invisivel para fechar -->
              <div class="fixed inset-0" @click="showCompanyPopover = false"></div>

              <!-- Popover -->
              <div class="relative w-72 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-border-light dark:border-border-dark overflow-hidden">
                <!-- Lista de empresas -->
                <div class="max-h-64 overflow-y-auto py-1">
                  <div
                    v-for="empresa in empresas"
                    :key="empresa.id"
                    class="group/item flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <button
                      class="flex items-center gap-3 flex-1 min-w-0 text-left"
                      @click="switchCompany(empresa)"
                    >
                      <div class="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0 overflow-hidden">
                        <img v-if="empresa.logo_url" :src="empresa.logo_url" class="w-full h-full object-cover" />
                        <span v-else>{{ getCompanyInitials(empresa) }}</span>
                      </div>
                      <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-text-light dark:text-text-dark truncate">
                          {{ empresa.nome_fantasia || empresa.razao_social }}
                        </p>
                      </div>
                    </button>
                    <span
                      v-if="currentCompany?.id === empresa.id"
                      class="material-icons text-primary text-lg shrink-0"
                    >check</span>
                    <button
                      @click.stop="openEditEmpresaModal(empresa)"
                      class="p-1 rounded-md text-gray-300 dark:text-gray-600 hover:text-primary hover:bg-primary/10 transition-all opacity-0 group-hover/item:opacity-100 shrink-0"
                      title="Editar empresa"
                    >
                      <span class="material-icons text-base">edit</span>
                    </button>
                  </div>

                  <!-- Empty state -->
                  <div v-if="empresas.length === 0 && !loadingEmpresas" class="px-4 py-6 text-center">
                    <span class="material-icons-outlined text-2xl text-gray-300 dark:text-gray-600">business</span>
                    <p class="text-xs text-subtext-light dark:text-subtext-dark mt-1">Nenhuma empresa</p>
                  </div>

                  <!-- Loading -->
                  <div v-if="loadingEmpresas" class="px-4 py-4 text-center">
                    <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-primary mx-auto"></div>
                  </div>
                </div>

                <!-- Adicionar empresa -->
                <div class="border-t border-border-light dark:border-border-dark">
                  <button
                    class="w-full flex items-center gap-3 px-4 py-3 text-sm text-subtext-light dark:text-subtext-dark hover:text-primary hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    @click="openCreateEmpresaModal"
                  >
                    <span class="material-icons text-lg">add</span>
                    Adicionar empresa
                  </button>
                </div>
              </div>
            </div>
          </Transition>
        </Teleport>
      </div>

      <!-- Separador -->
      <div :class="['sidebar-divider', { 'lg:!hidden': isCollapsed }]"></div>

      <!-- Usuário -->
      <div
        :class="['sidebar-user-card', isCollapsed ? 'sidebar-user-card-collapsed' : '']"
        @mouseenter="showTooltip($event, userName)"
        @mouseleave="hideTooltip"
      >
        <div class="sidebar-user-avatar">
          {{ userInitials }}
        </div>
        <div :class="['sidebar-user-details', { 'lg:!hidden': isCollapsed }]">
          <span class="sidebar-user-name">{{ userName }}</span>
          <span class="sidebar-user-email">{{ userEmail }}</span>
        </div>
        <button
          @click="handleLogout"
          title="Sair"
          :class="['sidebar-logout-btn', { 'lg:!hidden': isCollapsed }]"
        >
          <span class="material-icons-outlined text-lg">logout</span>
        </button>
      </div>
    </div>
  </aside>

  <!-- Modal de Edição de Empresa -->
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="showEditEmpresaModal" class="fixed inset-0 z-[60] overflow-y-auto">
        <div class="fixed inset-0 glass-backdrop" @click="closeEditEmpresaModal"></div>
        <div class="flex min-h-full items-center justify-center p-4">
          <Transition
            enter-active-class="transition-all duration-200"
            enter-from-class="opacity-0 scale-95"
            enter-to-class="opacity-100 scale-100"
            leave-active-class="transition-all duration-200"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-95"
          >
            <div v-if="showEditEmpresaModal" class="relative glass-panel rounded-lg shadow-xl w-full max-w-2xl">
              <!-- Header -->
              <div class="border-b border-border-light dark:border-border-dark px-6 py-4 flex items-center justify-between">
                <h2 class="text-lg font-semibold text-text-light dark:text-text-dark">Editar empresa</h2>
                <button @click="closeEditEmpresaModal" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <span class="material-icons">close</span>
                </button>
              </div>

              <!-- Body -->
              <div class="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
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
                          @click="$refs.editLogoInput.click()"
                        >
                          <img v-if="editLogoPreview || editEmpresaForm.logo_url" :src="editLogoPreview || editEmpresaForm.logo_url" class="w-full h-full object-cover" />
                          <span v-else class="material-icons-outlined text-2xl text-gray-400">add_photo_alternate</span>
                        </div>
                        <div class="flex-1">
                          <input type="file" ref="editLogoInput" class="hidden" accept="image/*" @change="handleLogoChange($event, 'edit')" />
                          <button type="button" @click="$refs.editLogoInput.click()" class="text-primary text-sm hover:underline">
                            Selecionar imagem
                          </button>
                          <p class="text-xs text-subtext-light dark:text-subtext-dark mt-1">PNG, JPG até 2MB</p>
                        </div>
                      </div>
                    </div>

                    <div class="md:col-span-2">
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">CNPJ</label>
                      <div class="flex gap-3 items-center">
                        <input type="text" v-model="editEmpresaForm.cnpj" class="input flex-1" placeholder="00.000.000/0000-00" v-maska data-maska="##.###.###/####-##" />
                        <button type="button" @click="buscarCNPJ('edit')" :disabled="buscandoCNPJ" class="btn btn-secondary shrink-0">
                          <span v-if="buscandoCNPJ" class="material-icons text-sm animate-spin">refresh</span>
                          <span v-else class="material-icons text-sm">search</span>
                          {{ buscandoCNPJ ? 'Buscando...' : 'Buscar' }}
                        </button>
                        <label class="flex items-center gap-2 text-sm text-text-light dark:text-text-dark whitespace-nowrap">
                          <input type="checkbox" v-model="editEmpresaForm.ativo" class="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary" />
                          Ativo
                        </label>
                      </div>
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Razão social <span class="text-red-500">*</span></label>
                      <input type="text" v-model="editEmpresaForm.razao_social" class="input" placeholder="Razão social da empresa" />
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Nome fantasia</label>
                      <input type="text" v-model="editEmpresaForm.nome_fantasia" class="input" placeholder="Nome fantasia" />
                    </div>

                    <div class="md:col-span-2">
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Número de Funcionários</label>
                      <input type="number" v-model="editEmpresaForm.num_funcionarios" class="input" placeholder="0" min="0" />
                    </div>
                  </div>
                </div>

                <!-- Endereço -->
                <div>
                  <h3 class="text-sm font-semibold text-text-light dark:text-text-dark mb-4 pb-2 border-b border-border-light dark:border-border-dark">Endereço</h3>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="md:col-span-2">
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">CEP</label>
                      <input type="text" v-model="editEmpresaForm.cep" class="input" placeholder="00000-000" v-maska data-maska="#####-###" @blur="buscarCep('edit')" />
                    </div>

                    <div class="md:col-span-2 flex gap-4">
                      <div class="flex-1">
                        <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Endereço</label>
                        <input type="text" v-model="editEmpresaForm.endereco" class="input" placeholder="Rua, Avenida..." />
                      </div>
                      <div class="w-28">
                        <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Número</label>
                        <input type="text" v-model="editEmpresaForm.numero" class="input" placeholder="0" />
                      </div>
                    </div>

                    <div class="md:col-span-2">
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Complemento</label>
                      <input type="text" v-model="editEmpresaForm.complemento" class="input" placeholder="Sala, Andar, Bloco..." />
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Estado</label>
                      <select v-model="editEmpresaForm.estado" class="input">
                        <option value="">Selecione o estado</option>
                        <option v-for="estado in estados" :key="estado.sigla" :value="estado.sigla">{{ estado.nome }}</option>
                      </select>
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Cidade</label>
                      <input type="text" v-model="editEmpresaForm.cidade" class="input" placeholder="Cidade" />
                    </div>
                  </div>
                </div>
              </div>

              <!-- Footer -->
              <div class="border-t border-border-light dark:border-border-dark px-6 py-4 flex items-center justify-between">
                <button
                  @click="confirmDeleteEmpresa"
                  class="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  :disabled="savingEmpresa"
                  title="Excluir empresa"
                >
                  <span class="material-icons text-lg">delete</span>
                </button>
                <div class="flex items-center gap-3">
                  <button @click="closeEditEmpresaModal" class="btn btn-secondary" :disabled="savingEmpresa">Cancelar</button>
                  <button @click="updateEmpresa" class="btn btn-primary" :disabled="savingEmpresa">
                    <span v-if="savingEmpresa" class="material-icons text-sm animate-spin">refresh</span>
                    {{ savingEmpresa ? 'Salvando...' : 'Salvar alterações' }}
                  </button>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- Modal de Criação de Empresa -->
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="showCreateEmpresaModal" class="fixed inset-0 z-[60] overflow-y-auto">
        <div class="fixed inset-0 glass-backdrop" @click="closeCreateEmpresaModal"></div>
        <div class="flex min-h-full items-center justify-center p-4">
          <Transition
            enter-active-class="transition-all duration-200"
            enter-from-class="opacity-0 scale-95"
            enter-to-class="opacity-100 scale-100"
            leave-active-class="transition-all duration-200"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-95"
          >
            <div v-if="showCreateEmpresaModal" class="relative glass-panel rounded-lg shadow-xl w-full max-w-2xl">
              <!-- Header -->
              <div class="border-b border-border-light dark:border-border-dark px-6 py-4 flex items-center justify-between">
                <h2 class="text-lg font-semibold text-text-light dark:text-text-dark">Nova empresa</h2>
                <button @click="closeCreateEmpresaModal" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <span class="material-icons">close</span>
                </button>
              </div>

              <!-- Body -->
              <div class="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
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
                          @click="$refs.createLogoInput.click()"
                        >
                          <img v-if="createLogoPreview" :src="createLogoPreview" class="w-full h-full object-cover" />
                          <span v-else class="material-icons-outlined text-2xl text-gray-400">add_photo_alternate</span>
                        </div>
                        <div class="flex-1">
                          <input type="file" ref="createLogoInput" class="hidden" accept="image/*" @change="handleLogoChange($event, 'create')" />
                          <button type="button" @click="$refs.createLogoInput.click()" class="text-primary text-sm hover:underline">
                            Selecionar imagem
                          </button>
                          <p class="text-xs text-subtext-light dark:text-subtext-dark mt-1">PNG, JPG até 2MB</p>
                        </div>
                      </div>
                    </div>

                    <div class="md:col-span-2">
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">CNPJ</label>
                      <div class="flex gap-3 items-center">
                        <input type="text" v-model="createEmpresaForm.cnpj" class="input flex-1" placeholder="00.000.000/0000-00" v-maska data-maska="##.###.###/####-##" />
                        <button type="button" @click="buscarCNPJ('create')" :disabled="buscandoCNPJ" class="btn btn-secondary shrink-0">
                          <span v-if="buscandoCNPJ" class="material-icons text-sm animate-spin">refresh</span>
                          <span v-else class="material-icons text-sm">search</span>
                          {{ buscandoCNPJ ? 'Buscando...' : 'Buscar' }}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Razão social <span class="text-red-500">*</span></label>
                      <input type="text" v-model="createEmpresaForm.razao_social" class="input" placeholder="Razão social da empresa" />
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Nome fantasia</label>
                      <input type="text" v-model="createEmpresaForm.nome_fantasia" class="input" placeholder="Nome fantasia" />
                    </div>

                    <div class="md:col-span-2">
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Número de Funcionários</label>
                      <input type="number" v-model="createEmpresaForm.num_funcionarios" class="input" placeholder="0" min="0" />
                    </div>
                  </div>
                </div>

                <!-- Endereço -->
                <div>
                  <h3 class="text-sm font-semibold text-text-light dark:text-text-dark mb-4 pb-2 border-b border-border-light dark:border-border-dark">Endereço</h3>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="md:col-span-2">
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">CEP</label>
                      <input type="text" v-model="createEmpresaForm.cep" class="input" placeholder="00000-000" v-maska data-maska="#####-###" @blur="buscarCep('create')" />
                    </div>

                    <div class="md:col-span-2 flex gap-4">
                      <div class="flex-1">
                        <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Endereço</label>
                        <input type="text" v-model="createEmpresaForm.endereco" class="input" placeholder="Rua, Avenida..." />
                      </div>
                      <div class="w-28">
                        <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Número</label>
                        <input type="text" v-model="createEmpresaForm.numero" class="input" placeholder="0" />
                      </div>
                    </div>

                    <div class="md:col-span-2">
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Complemento</label>
                      <input type="text" v-model="createEmpresaForm.complemento" class="input" placeholder="Sala, Andar, Bloco..." />
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Estado</label>
                      <select v-model="createEmpresaForm.estado" class="input">
                        <option value="">Selecione o estado</option>
                        <option v-for="estado in estados" :key="estado.sigla" :value="estado.sigla">{{ estado.nome }}</option>
                      </select>
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Cidade</label>
                      <input type="text" v-model="createEmpresaForm.cidade" class="input" placeholder="Cidade" />
                    </div>
                  </div>
                </div>
              </div>

              <!-- Footer -->
              <div class="border-t border-border-light dark:border-border-dark px-6 py-4 flex items-center justify-end gap-3">
                <button @click="closeCreateEmpresaModal" class="btn btn-secondary" :disabled="savingEmpresa">Cancelar</button>
                <button @click="saveEmpresa" class="btn btn-primary" :disabled="savingEmpresa || !createEmpresaForm.razao_social">
                  <span v-if="savingEmpresa" class="material-icons text-sm animate-spin">refresh</span>
                  {{ savingEmpresa ? 'Criando...' : 'Criar empresa' }}
                </button>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { useSidebar } from '~/composables/useSidebar'
import { useCurrentCompany } from '~/composables/useCurrentCompany'
import { useToast } from '~/composables/useToast'

const route = useRoute()
const router = useRouter()
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const toast = useToast()

// Email do usuario master que pode ver a pagina de usuarios
const MASTER_USER_EMAIL = 'leonardo@fazendasbioma.com.br'

// Perfil do usuario (carregado do banco)
const userPerfil = ref('user')

// Verifica se o usuario logado e admin (master ou perfil admin)
const isAdmin = computed(() => {
  return user.value?.email === MASTER_USER_EMAIL || userPerfil.value === 'admin'
})

// Manter compatibilidade com isMasterUser
const isMasterUser = computed(() => {
  return isAdmin.value
})

// Controle do sidebar
const { isOpen, closeSidebar, isCollapsed, toggleCollapsed } = useSidebar()

// Empresa atual
const { currentCompany, currentCompanyName, currentCompanyInitials, currentCompanyLogo, loadCurrentCompany, setCurrentCompany } = useCurrentCompany()

// Popover de empresas
const showCompanyPopover = ref(false)
const companyPopoverStyle = ref({})
const empresas = ref([])
const loadingEmpresas = ref(false)
const companyCardRef = ref(null)

function getCompanyInitials(empresa) {
  const name = empresa.nome_fantasia || empresa.razao_social
  if (!name) return 'EM'
  const parts = name.split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

function toggleCompanyPopover() {
  if (showCompanyPopover.value) {
    showCompanyPopover.value = false
    return
  }

  // Calcular posicao do popover baseado no botao
  const btn = document.querySelector('.sidebar-company-card')
  if (btn) {
    const rect = btn.getBoundingClientRect()
    companyPopoverStyle.value = {
      bottom: (window.innerHeight - rect.top + 8) + 'px',
      left: rect.left + 'px'
    }
  }

  showCompanyPopover.value = true
  loadEmpresas()
}

async function loadEmpresas() {
  loadingEmpresas.value = true
  try {
    let result = []

    if (isAdmin.value) {
      // Admin ve todas as empresas ativas
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .eq('ativo', true)
      if (error) throw error
      result = data || []
    } else {
      // Usuario normal ve apenas empresas vinculadas
      const { data, error } = await supabase
        .from('empresa_usuarios')
        .select('empresa:empresas(*)')
        .eq('user_id', user.value?.id)
      if (error) throw error
      result = (data || [])
        .map(d => d.empresa)
        .filter(e => e && e.ativo)
    }

    empresas.value = result.sort((a, b) =>
      (a.nome_fantasia || a.razao_social).localeCompare(b.nome_fantasia || b.razao_social)
    )
  } catch (e) {
    console.error('Erro ao carregar empresas:', e)
  } finally {
    loadingEmpresas.value = false
  }
}

async function switchCompany(empresa) {
  try {
    // Persistir no banco de dados primeiro
    const { error } = await supabase.rpc('set_current_empresa', {
      p_empresa_id: empresa.id
    })
    if (error) throw error
  } catch (e) {
    console.error('Erro ao definir empresa atual:', e)
  }
  setCurrentCompany(empresa)
  showCompanyPopover.value = false
  // Recarregar pagina atual para atualizar dados da nova empresa
  window.location.reload()
}

// ========== Modais de Empresa ==========
const showEditEmpresaModal = ref(false)
const showCreateEmpresaModal = ref(false)
const savingEmpresa = ref(false)
const buscandoCNPJ = ref(false)

// Form de edição
const editEmpresaForm = ref({})
const editLogoPreview = ref(null)
const editLogoFile = ref(null)

// Form de criação
const createEmpresaForm = ref(getEmptyEmpresa())
const createLogoPreview = ref(null)
const createLogoFile = ref(null)

// Estados brasileiros
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

function getEmptyEmpresa() {
  return {
    cnpj: '', razao_social: '', nome_fantasia: '', num_funcionarios: 0,
    cep: '', endereco: '', numero: '', complemento: '', estado: '', cidade: '', ativo: true
  }
}

// Edição
function openEditEmpresaModal(empresa) {
  editEmpresaForm.value = { ...empresa }
  editLogoPreview.value = null
  editLogoFile.value = null
  showCompanyPopover.value = false
  showEditEmpresaModal.value = true
}

function closeEditEmpresaModal() {
  showEditEmpresaModal.value = false
}

async function updateEmpresa() {
  if (!editEmpresaForm.value.razao_social) {
    toast.error('Razão social é obrigatória')
    return
  }

  savingEmpresa.value = true
  try {
    let logoUrl = editEmpresaForm.value.logo_url
    if (editLogoFile.value) {
      const newLogoUrl = await uploadLogo(editLogoFile.value, editEmpresaForm.value.id)
      if (newLogoUrl) logoUrl = newLogoUrl
    }

    const { error } = await supabase
      .from('empresas')
      .update({
        cnpj: editEmpresaForm.value.cnpj?.replace(/\D/g, '') || null,
        razao_social: editEmpresaForm.value.razao_social,
        nome_fantasia: editEmpresaForm.value.nome_fantasia || null,
        num_funcionarios: editEmpresaForm.value.num_funcionarios || 0,
        cep: editEmpresaForm.value.cep?.replace(/\D/g, '') || null,
        endereco: editEmpresaForm.value.endereco || null,
        numero: editEmpresaForm.value.numero || null,
        complemento: editEmpresaForm.value.complemento || null,
        estado: editEmpresaForm.value.estado || null,
        cidade: editEmpresaForm.value.cidade || null,
        ativo: editEmpresaForm.value.ativo,
        logo_url: logoUrl
      })
      .eq('id', editEmpresaForm.value.id)

    if (error) throw error

    // Atualizar empresa atual se for a mesma
    if (currentCompany.value?.id === editEmpresaForm.value.id) {
      setCurrentCompany({ ...editEmpresaForm.value, logo_url: logoUrl })
    }

    closeEditEmpresaModal()
    await loadEmpresas()
    toast.success('Empresa atualizada com sucesso')
  } catch (e) {
    console.error('Erro ao atualizar empresa:', e)
    toast.error('Erro ao atualizar empresa')
  } finally {
    savingEmpresa.value = false
  }
}

// Exclusão
async function confirmDeleteEmpresa() {
  const nome = editEmpresaForm.value.nome_fantasia || editEmpresaForm.value.razao_social
  if (!confirm(`Tem certeza que deseja excluir a empresa "${nome}"? Esta ação não pode ser desfeita.`)) return

  savingEmpresa.value = true
  try {
    const { error } = await supabase
      .from('empresas')
      .delete()
      .eq('id', editEmpresaForm.value.id)

    if (error) throw error

    closeEditEmpresaModal()
    await loadEmpresas()

    // Se excluiu a empresa atual, recarregar
    if (currentCompany.value?.id === editEmpresaForm.value.id) {
      window.location.reload()
    }

    toast.success('Empresa excluída com sucesso')
  } catch (e) {
    console.error('Erro ao excluir empresa:', e)
    toast.error('Erro ao excluir empresa. Verifique se não há dados vinculados.')
  } finally {
    savingEmpresa.value = false
  }
}

// Criação
function openCreateEmpresaModal() {
  createEmpresaForm.value = getEmptyEmpresa()
  createLogoPreview.value = null
  createLogoFile.value = null
  showCompanyPopover.value = false
  showCreateEmpresaModal.value = true
}

function closeCreateEmpresaModal() {
  showCreateEmpresaModal.value = false
}

async function saveEmpresa() {
  if (!createEmpresaForm.value.razao_social) {
    toast.error('Razão social é obrigatória')
    return
  }

  savingEmpresa.value = true
  try {
    const { data: empresaId, error } = await supabase.rpc('create_empresa_with_owner', {
      p_cnpj: createEmpresaForm.value.cnpj?.replace(/\D/g, '') || null,
      p_razao_social: createEmpresaForm.value.razao_social,
      p_nome_fantasia: createEmpresaForm.value.nome_fantasia || null,
      p_num_funcionarios: createEmpresaForm.value.num_funcionarios || 0,
      p_cep: createEmpresaForm.value.cep?.replace(/\D/g, '') || null,
      p_endereco: createEmpresaForm.value.endereco || null,
      p_numero: createEmpresaForm.value.numero || null,
      p_complemento: createEmpresaForm.value.complemento || null,
      p_estado: createEmpresaForm.value.estado || null,
      p_cidade: createEmpresaForm.value.cidade || null
    })

    if (error) throw error

    // Upload logo se tiver
    if (createLogoFile.value && empresaId) {
      const logoUrl = await uploadLogo(createLogoFile.value, empresaId)
      if (logoUrl) {
        await supabase.from('empresas').update({ logo_url: logoUrl }).eq('id', empresaId)
      }
    }

    closeCreateEmpresaModal()
    await loadEmpresas()
    toast.success('Empresa criada com sucesso')
  } catch (e) {
    console.error('Erro ao criar empresa:', e)
    toast.error('Erro ao criar empresa')
  } finally {
    savingEmpresa.value = false
  }
}

// Upload de logo
function handleLogoChange(event, type) {
  const file = event.target.files?.[0]
  if (!file) return

  if (file.size > 2 * 1024 * 1024) {
    toast.error('A imagem deve ter no máximo 2MB')
    return
  }
  if (!file.type.startsWith('image/')) {
    toast.error('Selecione uma imagem válida')
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    if (type === 'create') {
      createLogoPreview.value = e.target.result
      createLogoFile.value = file
    } else {
      editLogoPreview.value = e.target.result
      editLogoFile.value = file
    }
  }
  reader.readAsDataURL(file)
}

async function uploadLogo(file, empresaId) {
  if (!file) return null

  const fileExt = file.name.split('.').pop()
  const fileName = `${empresaId}.${fileExt}`
  const filePath = `logos/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('empresas')
    .upload(filePath, file, { upsert: true })

  if (uploadError) {
    toast.error('Erro ao fazer upload da logo: ' + uploadError.message)
    return null
  }

  const { data: { publicUrl } } = supabase.storage
    .from('empresas')
    .getPublicUrl(filePath)

  return `${publicUrl}?t=${Date.now()}`
}

// Busca CNPJ
async function buscarCNPJ(type) {
  const form = type === 'create' ? createEmpresaForm : editEmpresaForm
  const cnpj = form.value.cnpj?.replace(/\D/g, '')
  if (!cnpj || cnpj.length !== 14) {
    toast.error('Digite um CNPJ válido')
    return
  }

  buscandoCNPJ.value = true
  try {
    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`)
    if (!response.ok) throw new Error('CNPJ não encontrado')

    const data = await response.json()
    form.value.razao_social = data.razao_social || form.value.razao_social
    form.value.nome_fantasia = data.nome_fantasia || form.value.nome_fantasia
    if (data.cep) form.value.cep = data.cep
    if (data.logradouro) form.value.endereco = data.logradouro
    if (data.numero) form.value.numero = data.numero
    if (data.complemento) form.value.complemento = data.complemento
    if (data.uf) form.value.estado = data.uf
    if (data.municipio) form.value.cidade = data.municipio
    toast.success('Dados do CNPJ carregados')
  } catch (e) {
    toast.error('Não foi possível buscar o CNPJ')
  } finally {
    buscandoCNPJ.value = false
  }
}

// Busca CEP
async function buscarCep(type) {
  const form = type === 'create' ? createEmpresaForm : editEmpresaForm
  const cep = form.value.cep?.replace(/\D/g, '')
  if (!cep || cep.length !== 8) return

  try {
    const response = await fetch(`https://brasilapi.com.br/api/cep/v1/${cep}`)
    if (!response.ok) return

    const data = await response.json()
    if (data.street) form.value.endereco = data.street
    if (data.state) form.value.estado = data.state
    if (data.city) form.value.cidade = data.city
  } catch (e) {
    // Silencioso - CEP não encontrado
  }
}

// Sistema de Tooltip
const tooltip = reactive({
  visible: false,
  text: '',
  top: 0,
  left: 0
})

let tooltipTimeout = null

function showTooltip(event, text) {
  if (!isCollapsed.value) return

  // Limpar timeout anterior
  if (tooltipTimeout) {
    clearTimeout(tooltipTimeout)
  }

  const rect = event.currentTarget.getBoundingClientRect()

  tooltip.text = text
  tooltip.top = rect.top + rect.height / 2 - 16 // Centralizar verticalmente (16 = altura aproximada / 2)
  tooltip.left = rect.right + 12 // 12px de espaçamento
  tooltip.visible = true
}

function hideTooltip() {
  tooltipTimeout = setTimeout(() => {
    tooltip.visible = false
  }, 50)
}

// Carregar perfil do usuario
async function loadUserPerfil() {
  if (!user.value?.id) return

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
  }
}

// Carregar empresa salva ao iniciar
onMounted(() => {
  loadCurrentCompany()
  loadUserPerfil()
})

const userName = computed(() => {
  if (!user.value) return 'Usuário'
  return user.value.user_metadata?.full_name || user.value.email?.split('@')[0] || 'Usuário'
})

const userEmail = computed(() => {
  return user.value?.email || ''
})

const userInitials = computed(() => {
  const name = userName.value
  if (!name) return 'U'
  const parts = name.split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
})

const handleLogout = async () => {
  await supabase.auth.signOut()
  router.push('/auth/login')
}

// Itens base do menu
const baseMenuItems = [
  { label: 'Dashboard', path: '/', icon: 'home' },
  { label: 'Comercial', path: '/comercial', icon: 'storefront' },
{ label: 'Clientes', path: '/clientes', icon: 'people' },
  { label: 'Produção', path: '/producao', icon: 'factory' },
  { label: 'Produtos', path: '/produtos', icon: 'local_florist' },
  { label: 'Fazendas', path: '/fazendas', icon: 'agriculture' },
  { label: 'Sementes', path: '/sementes', icon: 'grass' },
]

// Menu (sem itens exclusivos por enquanto)
const menuItems = computed(() => {
  return baseMenuItems
})

const isActive = (path) => {
  if (path === '/') {
    return route.path === '/'
  }
  return route.path.startsWith(path)
}

// Fechar sidebar ao mudar de rota
watch(() => route.path, () => {
  closeSidebar()
})

// ========== Suporte (Featurebase) ==========
const { $featurebase } = useNuxtApp()
const showSupportMenu = ref(false)

function toggleSupport() {
  if (isCollapsed.value) {
    toggleCollapsed()
    showSupportMenu.value = true
  } else {
    showSupportMenu.value = !showSupportMenu.value
  }
}

function openHelp() {
  console.log('[Featurebase] openHelp - $featurebase:', $featurebase)
  console.log('[Featurebase] window.Featurebase type:', typeof window.Featurebase)
  $featurebase?.showHelp()
  closeSidebar()
}

function openChat() {
  console.log('[Featurebase] openChat - $featurebase:', $featurebase)
  console.log('[Featurebase] window.Featurebase type:', typeof window.Featurebase)
  $featurebase?.showMessages()
  closeSidebar()
}
</script>

<style scoped>
/* Container Principal */
.sidebar-container {
  @apply fixed lg:relative inset-y-0 left-0 z-50;
  @apply bg-sidebar-light dark:bg-sidebar-dark;
  @apply border-r border-border-light dark:border-border-dark;
  @apply flex flex-col h-full shrink-0;
  @apply transition-all duration-300 ease-in-out;
  @apply w-[85vw] max-w-[320px] lg:w-64 lg:max-w-none;
}

.sidebar-expanded {
  @apply lg:w-64;
}

.sidebar-collapsed {
  @apply lg:w-[72px];
}

/* Header */
.sidebar-header {
  @apply px-4 py-4 flex items-center justify-between;
  @apply border-b border-border-light dark:border-border-dark dark:border-opacity-10;
  @apply h-[60px];
}

.sidebar-header-collapsed {
  @apply lg:justify-center lg:px-0;
}

.sidebar-logo-container {
  @apply flex-1 overflow-hidden flex items-center;
}

.sidebar-logo {
  @apply h-8 w-auto dark:invert;
  @apply transition-all duration-300 ease-in-out;
}

/* Botão Toggle */
.sidebar-toggle-btn {
  @apply w-8 h-8 rounded-lg;
  @apply items-center justify-center;
  @apply text-gray-400 hover:text-gray-600 dark:hover:text-gray-300;
  @apply hover:bg-gray-100 dark:hover:bg-gray-800;
  @apply transition-all duration-200;
}

.sidebar-toggle-btn-centered {
  @apply mx-auto;
}

/* Navegação */
.sidebar-nav {
  @apply flex-1 overflow-y-auto overflow-x-hidden;
  @apply py-3;
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}

.sidebar-nav::-webkit-scrollbar {
  display: none;  /* Chrome, Safari and Opera */
}

.sidebar-nav-inner {
  @apply px-3 space-y-1;
}

/* Item do Menu */
.sidebar-menu-item {
  @apply flex items-center gap-3 px-3 py-2 rounded-lg;
  @apply transition-all duration-200 ease-in-out;
  @apply min-h-[40px];
}

.sidebar-menu-item-collapsed {
  @apply lg:justify-center lg:px-2 lg:overflow-hidden;
}

.sidebar-menu-item-inactive {
  @apply text-subtext-light dark:text-subtext-dark;
  @apply hover:bg-gray-100 dark:hover:bg-gray-800;
}

.sidebar-menu-item-active {
  @apply text-primary bg-primary-light dark:bg-primary/20;
}

.sidebar-menu-icon {
  @apply text-xl transition-colors duration-200 shrink-0;
}

/* Label do Menu */
.sidebar-menu-label {
  @apply text-sm font-medium whitespace-nowrap;
}

/* Footer */
.sidebar-footer {
  @apply border-t border-border-light dark:border-border-dark dark:border-opacity-10;
}

/* Card da Empresa */
.sidebar-company-card {
  @apply flex items-center gap-3 px-3 py-3;
  @apply hover:bg-gray-50 dark:hover:bg-gray-800/50;
  @apply transition-colors cursor-pointer;
  @apply border-b border-border-light dark:border-border-dark dark:border-opacity-10;
}

.sidebar-company-card-collapsed {
  @apply lg:justify-center lg:px-2 lg:overflow-hidden;
}

.sidebar-company-avatar {
  @apply w-9 h-9 rounded-lg bg-primary/10;
  @apply flex items-center justify-center;
  @apply text-xs font-bold text-primary;
  @apply shrink-0 overflow-hidden;
}

.sidebar-company-info {
  @apply flex-1 min-w-0;
}

.sidebar-company-label {
  @apply text-[10px] text-subtext-light dark:text-subtext-dark uppercase tracking-wider;
}

.sidebar-company-name {
  @apply text-xs font-medium text-text-light dark:text-text-dark truncate;
}

.sidebar-company-icon {
  @apply text-gray-400 group-hover:text-primary text-sm;
  @apply transition-colors duration-200;
}

/* Separador */
.sidebar-divider {
  @apply h-px bg-border-light dark:bg-border-dark dark:opacity-10;
}

/* Card do Usuário */
.sidebar-user-card {
  @apply px-3 py-3 flex items-center gap-3;
}

.sidebar-user-card-collapsed {
  @apply lg:justify-center lg:px-2 lg:overflow-hidden;
}

.sidebar-user-avatar {
  @apply w-9 h-9 rounded-full;
  @apply bg-primary-light dark:bg-primary/20;
  @apply flex items-center justify-center;
  @apply text-xs font-medium text-primary;
  @apply shrink-0;
}

.sidebar-user-details {
  @apply flex-1 flex flex-col overflow-hidden min-w-0;
}

.sidebar-user-name {
  @apply text-xs font-medium text-text-light dark:text-text-dark truncate;
}

.sidebar-user-email {
  @apply text-[10px] text-subtext-light dark:text-subtext-dark truncate;
}

.sidebar-logout-btn {
  @apply p-2 rounded-lg;
  @apply text-gray-400 hover:text-red-500;
  @apply hover:bg-red-50 dark:hover:bg-red-900/20;
  @apply transition-colors shrink-0;
}

/* Suporte */
.sidebar-support {
  @apply border-t border-border-light dark:border-border-dark dark:border-opacity-10;
}

.sidebar-support-toggle {
  @apply w-full flex items-center gap-3 px-3 py-2 rounded-none;
  @apply text-subtext-light dark:text-subtext-dark;
  @apply hover:bg-gray-100 dark:hover:bg-gray-800;
  @apply transition-all duration-200;
  @apply min-h-[40px];
}

.sidebar-support-items {
  @apply px-3 pb-2 space-y-0.5;
}

.sidebar-support-item {
  @apply w-full flex items-center gap-3 pl-6 pr-3 py-2 rounded-lg;
  @apply text-subtext-light dark:text-subtext-dark;
  @apply hover:bg-gray-100 dark:hover:bg-gray-800;
  @apply transition-all duration-200;
  @apply min-h-[36px];
}
</style>
