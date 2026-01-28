<template>
  <div>
    <!-- Loading do perfil -->
    <div v-if="loadingPerfil" class="text-center py-20">
      <span class="material-icons text-4xl text-primary animate-spin">refresh</span>
      <p class="text-sm text-subtext-light dark:text-subtext-dark mt-2">Carregando...</p>
    </div>

    <!-- Acesso negado para usuários que não são admin -->
    <div v-else-if="!isAdmin" class="text-center py-20">
      <span class="material-icons-outlined text-6xl text-gray-300 dark:text-gray-600 mb-4">lock</span>
      <h2 class="text-xl font-semibold text-text-light dark:text-text-dark mb-2">Acesso restrito</h2>
      <p class="text-subtext-light dark:text-subtext-dark mb-6">Você não tem permissão para acessar esta página.</p>
      <NuxtLink to="/" class="btn btn-primary">
        <span class="material-icons text-sm">arrow_back</span>
        Voltar ao Dashboard
      </NuxtLink>
    </div>

    <!-- Conteudo para usuario admin -->
    <template v-else>
      <h1 class="text-xl sm:text-2xl font-bold text-text-light dark:text-text-dark mb-4 sm:mb-6">Usuários</h1>

      <!-- Card da Tabela -->
      <div class="card">
        <!-- Header do Card -->
        <div class="p-3 sm:p-4 border-b border-border-light dark:border-border-dark">
          <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between">
              <h2 class="text-xs sm:text-sm font-medium text-subtext-light dark:text-subtext-dark uppercase tracking-wider">Lista de Usuários</h2>
              <!-- Botao Novo Usuario - Desktop -->
              <button @click="openCreateModal" class="hidden sm:flex btn btn-primary shrink-0">
                <span class="material-icons text-sm">add</span>
                Novo usuário
              </button>
            </div>
            <div class="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <!-- Filtro Status -->
              <select v-model="filterStatus" class="input text-sm w-full sm:w-28 shrink-0">
                <option value="">Todos</option>
                <option value="active">Ativos</option>
                <option value="inactive">Inativos</option>
              </select>
              <!-- Filtro Perfil -->
              <select v-model="filterPerfil" class="input text-sm w-full sm:w-40 shrink-0">
                <option value="">Todos perfis</option>
                <option value="admin">Administrador</option>
                <option value="user">Usuário</option>
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
              <!-- Botao Novo Usuario - Mobile -->
              <button @click="openCreateModal" class="sm:hidden btn btn-primary w-full justify-center">
                <span class="material-icons text-sm">add</span>
                Novo usuário
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
                <th class="table-header">Usuário</th>
                <th class="table-header">Perfil de Acesso</th>
                <th class="table-header">Último Acesso</th>
                <th class="table-header text-center w-28">Status</th>
                <th class="table-header text-center w-24">Ações</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border-light dark:divide-border-dark">
              <tr
                v-for="usuario in paginatedUsuarios"
                :key="usuario.user_id"
                class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                @click="openDetailsSlideover(usuario)"
              >
                <td class="table-cell">
                  <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                    {{ getInitials(usuario.nome) }}
                  </div>
                </td>
                <td class="table-cell">
                  <div>
                    <p class="font-medium text-text-light dark:text-text-dark">{{ usuario.nome }}</p>
                    <p class="text-xs text-subtext-light dark:text-subtext-dark">{{ usuario.email }}</p>
                  </div>
                </td>
                <td class="table-cell">
                  <span :class="['badge', getPerfilBadgeClass(usuario.perfil)]">
                    {{ getPerfilLabel(usuario.perfil) }}
                  </span>
                </td>
                <td class="table-cell text-subtext-light dark:text-subtext-dark text-sm">
                  {{ formatDate(usuario.last_sign_in_at) }}
                </td>
                <td class="table-cell text-center">
                  <span :class="['badge', usuario.ativo ? 'badge-success' : 'badge-inactive']">
                    {{ usuario.ativo ? 'Ativo' : 'Inativo' }}
                  </span>
                </td>
                <td class="table-cell text-center" @click.stop>
                  <button
                    @click="openDetailsSlideover(usuario)"
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
            v-for="usuario in paginatedUsuarios"
            :key="usuario.user_id"
            class="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
            @click="openDetailsSlideover(usuario)"
          >
            <div class="flex items-start gap-3">
              <div class="w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 shrink-0">
                {{ getInitials(usuario.nome) }}
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-2">
                  <div class="min-w-0">
                    <p class="font-medium text-text-light dark:text-text-dark truncate">{{ usuario.nome }}</p>
                    <p class="text-xs text-subtext-light dark:text-subtext-dark truncate">{{ usuario.email }}</p>
                  </div>
                  <span :class="['badge shrink-0', usuario.ativo ? 'badge-success' : 'badge-inactive']">
                    {{ usuario.ativo ? 'Ativo' : 'Inativo' }}
                  </span>
                </div>
                <div class="flex items-center gap-2 mt-2">
                  <span :class="['badge text-[10px]', getPerfilBadgeClass(usuario.perfil)]">
                    {{ getPerfilLabel(usuario.perfil) }}
                  </span>
                  <span class="text-xs text-subtext-light dark:text-subtext-dark">
                    {{ formatDate(usuario.last_sign_in_at) }}
                  </span>
                </div>
              </div>
              <button
                @click.stop="openDetailsSlideover(usuario)"
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
        <div v-else-if="filteredUsuarios.length === 0 && !loading" class="text-center py-12 flex flex-col items-center px-4">
          <span class="material-icons-outlined text-4xl text-gray-300 dark:text-gray-600 mb-2">person</span>
          <h3 class="text-lg font-medium text-text-light dark:text-text-dark mb-1">Nenhum usuário encontrado</h3>
          <p class="text-sm text-subtext-light dark:text-subtext-dark mb-4">
            Comece adicionando seu primeiro usuário
          </p>
          <button @click="openCreateModal" class="btn btn-primary">
            <span class="material-icons text-sm">add</span>
            Novo usuário
          </button>
        </div>

        <!-- Paginacao -->
        <div v-if="filteredUsuarios.length > 0" class="p-3 sm:p-4 border-t border-border-light dark:border-border-dark text-xs text-subtext-light dark:text-subtext-dark">
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
              <span class="text-xs">{{ filteredUsuarios.length }} registros</span>
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

      <!-- Card de Convites Pendentes -->
      <div v-if="convitesPendentes.length > 0" class="card mt-6">
        <div class="p-3 sm:p-4 border-b border-border-light dark:border-border-dark">
          <div class="flex items-center gap-2">
            <span class="material-icons text-amber-500 text-xl">schedule</span>
            <h2 class="text-xs sm:text-sm font-medium text-subtext-light dark:text-subtext-dark uppercase tracking-wider">
              Convites Pendentes ({{ convitesPendentes.length }})
            </h2>
          </div>
        </div>

        <!-- Tabela de Convites - Desktop -->
        <div class="hidden md:block overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-gray-50 dark:bg-gray-800 border-b border-border-light dark:border-border-dark">
                <th class="table-header">Usuário</th>
                <th class="table-header">Perfil</th>
                <th class="table-header">Expira em</th>
                <th class="table-header text-center w-32">Ações</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border-light dark:divide-border-dark">
              <tr
                v-for="convite in convitesPendentes"
                :key="convite.id"
                class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <td class="table-cell">
                  <div>
                    <p class="font-medium text-text-light dark:text-text-dark">{{ convite.nome }}</p>
                    <p class="text-xs text-subtext-light dark:text-subtext-dark">{{ convite.email }}</p>
                  </div>
                </td>
                <td class="table-cell">
                  <span :class="['badge', getPerfilBadgeClass(convite.perfil)]">
                    {{ getPerfilLabel(convite.perfil) }}
                  </span>
                </td>
                <td class="table-cell text-sm">
                  <span :class="isExpired(convite.expires_at) ? 'text-red-500' : 'text-subtext-light dark:text-subtext-dark'">
                    {{ isExpired(convite.expires_at) ? 'Expirado' : formatExpiresAt(convite.expires_at) }}
                  </span>
                </td>
                <td class="table-cell text-center">
                  <div class="flex items-center justify-center gap-1">
                    <button
                      @click="resendInvite(convite)"
                      class="p-1.5 text-gray-400 hover:text-primary rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      title="Reenviar convite"
                      :disabled="resendingId === convite.id"
                    >
                      <span v-if="resendingId === convite.id" class="material-icons text-lg animate-spin">refresh</span>
                      <span v-else class="material-icons text-lg">send</span>
                    </button>
                    <button
                      @click="cancelInvite(convite)"
                      class="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      title="Cancelar convite"
                    >
                      <span class="material-icons text-lg">close</span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Cards de Convites - Mobile -->
        <div class="md:hidden divide-y divide-border-light dark:divide-border-dark">
          <div
            v-for="convite in convitesPendentes"
            :key="convite.id"
            class="p-4"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="flex-1 min-w-0">
                <p class="font-medium text-text-light dark:text-text-dark truncate">{{ convite.nome }}</p>
                <p class="text-xs text-subtext-light dark:text-subtext-dark truncate">{{ convite.email }}</p>
                <div class="flex items-center gap-2 mt-2">
                  <span :class="['badge text-[10px]', getPerfilBadgeClass(convite.perfil)]">
                    {{ getPerfilLabel(convite.perfil) }}
                  </span>
                  <span :class="['text-xs', isExpired(convite.expires_at) ? 'text-red-500' : 'text-subtext-light dark:text-subtext-dark']">
                    {{ isExpired(convite.expires_at) ? 'Expirado' : formatExpiresAt(convite.expires_at) }}
                  </span>
                </div>
              </div>
              <div class="flex items-center gap-1 shrink-0">
                <button
                  @click="resendInvite(convite)"
                  class="p-1.5 text-gray-400 hover:text-primary rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  :disabled="resendingId === convite.id"
                >
                  <span v-if="resendingId === convite.id" class="material-icons text-lg animate-spin">refresh</span>
                  <span v-else class="material-icons text-lg">send</span>
                </button>
                <button
                  @click="cancelInvite(convite)"
                  class="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <span class="material-icons text-lg">close</span>
                </button>
              </div>
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
                <div v-if="showCreateModal" class="relative glass-panel rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
                  <!-- Modal Header -->
                  <div class="border-b border-border-light dark:border-border-dark px-6 py-4 flex items-center justify-between shrink-0">
                    <h2 class="text-lg font-semibold text-text-light dark:text-text-dark">Novo usuário</h2>
                    <button @click="closeCreateModal" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                      <span class="material-icons">close</span>
                    </button>
                  </div>

                  <!-- Modal Body -->
                  <div class="p-6 space-y-5 overflow-y-auto flex-1">
                    <!-- Perfil de Acesso -->
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Perfil de acesso <span class="text-red-500">*</span></label>
                      <select v-model="newUsuario.perfil" class="input">
                        <option value="">Selecione...</option>
                        <option value="admin">Administrador</option>
                        <option value="user">Usuário</option>
                      </select>
                      <p class="text-xs text-subtext-light dark:text-subtext-dark mt-1">
                        {{ newUsuario.perfil === 'admin' ? 'Administradores tem acesso total ao sistema' : newUsuario.perfil === 'user' ? 'Usuarios tem acesso limitado as empresas vinculadas' : 'Selecione o nivel de acesso do usuario' }}
                      </p>
                    </div>

                    <!-- Nome Completo -->
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Nome completo <span class="text-red-500">*</span></label>
                      <input type="text" v-model="newUsuario.nome" class="input" placeholder="Digite o nome completo" />
                    </div>

                    <!-- Email e Celular -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">E-mail <span class="text-red-500">*</span></label>
                        <input type="email" v-model="newUsuario.email" class="input" placeholder="email@exemplo.com" />
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Celular</label>
                        <input type="tel" v-model="newUsuario.celular" class="input" placeholder="(00) 0 0000-0000" v-maska data-maska="(##) # ####-####" />
                      </div>
                    </div>

                    <!-- CEP -->
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">CEP</label>
                      <input
                        type="text"
                        v-model="newUsuario.cep"
                        class="input"
                        placeholder="00000-000"
                        v-maska
                        data-maska="#####-###"
                        @blur="buscarCep(newUsuario.cep, 'create')"
                      />
                    </div>

                    <!-- Endereco e Numero -->
                    <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      <div class="sm:col-span-3">
                        <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Endereco</label>
                        <input type="text" v-model="newUsuario.endereco" class="input" placeholder="Rua, Avenida..." />
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Numero</label>
                        <input type="text" v-model="newUsuario.numero" class="input" placeholder="Nº" />
                      </div>
                    </div>

                    <!-- Complemento -->
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Complemento</label>
                      <input type="text" v-model="newUsuario.complemento" class="input" placeholder="Apartamento, sala, etc." />
                    </div>

                    <!-- Estado e Cidade -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Estado</label>
                        <select v-model="newUsuario.estado" class="input">
                          <option value="">Selecione...</option>
                          <option v-for="uf in estados" :key="uf.sigla" :value="uf.sigla">{{ uf.nome }}</option>
                        </select>
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Cidade</label>
                        <input type="text" v-model="newUsuario.cidade" class="input" placeholder="Nome da cidade" />
                      </div>
                    </div>

                    <!-- Aviso sobre convite -->
                    <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800/50">
                      <div class="flex items-start gap-3">
                        <span class="material-icons text-blue-500 text-xl">mail_outline</span>
                        <div>
                          <p class="text-sm font-medium text-blue-800 dark:text-blue-300">Convite por e-mail</p>
                          <p class="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            O usuario recebera um e-mail de convite para criar sua senha e acessar o sistema.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Modal Footer -->
                  <div class="border-t border-border-light dark:border-border-dark px-6 py-4 flex items-center justify-end gap-3 shrink-0">
                    <button @click="closeCreateModal" class="btn btn-secondary" :disabled="saving">Cancelar</button>
                    <button @click="createUsuario" class="btn btn-primary" :disabled="saving || !canCreate">
                      <span v-if="saving" class="material-icons text-sm animate-spin">refresh</span>
                      <span v-else class="material-icons text-sm">send</span>
                      {{ saving ? 'Enviando...' : 'Enviar convite' }}
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
                <div v-if="showEditModal" class="relative glass-panel rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
                  <!-- Modal Header -->
                  <div class="border-b border-border-light dark:border-border-dark px-6 py-4 flex items-center justify-between shrink-0">
                    <h2 class="text-lg font-semibold text-text-light dark:text-text-dark">Editar usuario</h2>
                    <button @click="closeEditModal" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                      <span class="material-icons">close</span>
                    </button>
                  </div>

                  <!-- Modal Body -->
                  <div class="p-6 space-y-5 overflow-y-auto flex-1">
                    <!-- Avatar Preview -->
                    <div class="flex items-center gap-4">
                      <div class="w-16 h-16 rounded-full flex items-center justify-center text-xl font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                        {{ getInitials(editUsuario.nome) }}
                      </div>
                      <div>
                        <p class="text-sm font-medium text-text-light dark:text-text-dark">{{ editUsuario.nome }}</p>
                        <p class="text-xs text-subtext-light dark:text-subtext-dark">{{ editUsuario.email }}</p>
                      </div>
                    </div>

                    <!-- Perfil de Acesso -->
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Perfil de acesso</label>
                      <select v-model="editUsuario.perfil" class="input">
                        <option value="admin">Administrador</option>
                        <option value="user">Usuário</option>
                      </select>
                    </div>

                    <!-- Nome Completo -->
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Nome completo</label>
                      <input type="text" v-model="editUsuario.nome" class="input" />
                    </div>

                    <!-- Celular -->
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Celular</label>
                      <input type="tel" v-model="editUsuario.celular" class="input" />
                    </div>

                    <!-- CEP -->
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">CEP</label>
                      <input
                        type="text"
                        v-model="editUsuario.cep"
                        class="input"
                        placeholder="00000-000"
                        v-maska
                        data-maska="#####-###"
                        @blur="buscarCep(editUsuario.cep, 'edit')"
                      />
                    </div>

                    <!-- Endereco e Numero -->
                    <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      <div class="sm:col-span-3">
                        <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Endereco</label>
                        <input type="text" v-model="editUsuario.endereco" class="input" />
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Numero</label>
                        <input type="text" v-model="editUsuario.numero" class="input" />
                      </div>
                    </div>

                    <!-- Complemento -->
                    <div>
                      <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Complemento</label>
                      <input type="text" v-model="editUsuario.complemento" class="input" />
                    </div>

                    <!-- Estado e Cidade -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Estado</label>
                        <select v-model="editUsuario.estado" class="input">
                          <option value="">Selecione...</option>
                          <option v-for="uf in estados" :key="uf.sigla" :value="uf.sigla">{{ uf.nome }}</option>
                        </select>
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Cidade</label>
                        <input type="text" v-model="editUsuario.cidade" class="input" />
                      </div>
                    </div>

                    <!-- Status -->
                    <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <div>
                        <p class="text-sm font-medium text-text-light dark:text-text-dark">Status do usuario</p>
                        <p class="text-xs text-subtext-light dark:text-subtext-dark">{{ editUsuario.ativo ? 'Usuario ativo no sistema' : 'Usuario desativado' }}</p>
                      </div>
                      <button
                        @click="editUsuario.ativo = !editUsuario.ativo"
                        :class="['relative inline-flex h-6 w-11 items-center rounded-full transition-colors', editUsuario.ativo ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600']"
                      >
                        <span :class="['inline-block h-4 w-4 transform rounded-full bg-white transition-transform', editUsuario.ativo ? 'translate-x-6' : 'translate-x-1']"></span>
                      </button>
                    </div>
                  </div>

                  <!-- Modal Footer -->
                  <div class="border-t border-border-light dark:border-border-dark px-6 py-4 flex items-center justify-end gap-3 shrink-0">
                    <button @click="closeEditModal" class="btn btn-secondary" :disabled="saving">Cancelar</button>
                    <button @click="updateUsuario" class="btn btn-primary" :disabled="saving">
                      <span v-if="saving" class="material-icons text-sm animate-spin">refresh</span>
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
                        <div class="w-10 h-10 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-sm sm:text-lg font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 shrink-0">
                          {{ getInitials(selectedUsuario?.nome) }}
                        </div>
                        <div class="min-w-0 flex-1">
                          <h2 class="text-base sm:text-lg font-semibold text-gray-900 dark:text-text-dark truncate">{{ selectedUsuario?.nome }}</h2>
                          <p class="text-xs sm:text-sm text-gray-500 dark:text-subtext-dark truncate">{{ selectedUsuario?.email }}</p>
                        </div>
                      </div>
                      <button @click="closeDetailsSlideover" class="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shrink-0">
                        <span class="material-icons text-xl">close</span>
                      </button>
                    </div>

                    <!-- Body -->
                    <div class="flex-1 overflow-y-auto">
                      <div class="p-4 sm:p-6 space-y-5 sm:space-y-6">
                        <!-- Status e Perfil -->
                        <div class="flex flex-wrap items-center gap-2">
                          <span :class="['inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium', selectedUsuario?.ativo ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400']">
                            <span :class="['w-1.5 h-1.5 rounded-full mr-1.5', selectedUsuario?.ativo ? 'bg-green-500' : 'bg-gray-400']"></span>
                            {{ selectedUsuario?.ativo ? 'Ativo' : 'Inativo' }}
                          </span>
                          <span :class="['inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium', getPerfilBadgeClassFull(selectedUsuario?.perfil)]">
                            {{ getPerfilLabel(selectedUsuario?.perfil) }}
                          </span>
                        </div>

                        <!-- Informacoes do Usuario -->
                        <div class="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 sm:p-5">
                          <h3 class="text-xs font-semibold text-gray-500 dark:text-subtext-dark uppercase tracking-wider mb-3 sm:mb-4">Informacoes</h3>
                          <div class="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4">
                            <div class="col-span-1 xs:col-span-2">
                              <p class="text-xs text-gray-500 dark:text-subtext-dark mb-1">E-mail</p>
                              <p class="text-sm font-medium text-gray-900 dark:text-text-dark break-all">{{ selectedUsuario?.email }}</p>
                            </div>
                            <div>
                              <p class="text-xs text-gray-500 dark:text-subtext-dark mb-1">Celular</p>
                              <p class="text-sm font-medium text-gray-900 dark:text-text-dark">{{ selectedUsuario?.celular || '-' }}</p>
                            </div>
                            <div>
                              <p class="text-xs text-gray-500 dark:text-subtext-dark mb-1">Perfil</p>
                              <p class="text-sm font-medium text-gray-900 dark:text-text-dark">{{ getPerfilLabel(selectedUsuario?.perfil) }}</p>
                            </div>
                          </div>
                        </div>

                        <!-- Endereco -->
                        <div v-if="selectedUsuario?.endereco || selectedUsuario?.cidade" class="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 sm:p-5">
                          <h3 class="text-xs font-semibold text-gray-500 dark:text-subtext-dark uppercase tracking-wider mb-3 sm:mb-4">Endereco</h3>
                          <div class="space-y-2">
                            <p v-if="selectedUsuario?.endereco" class="text-sm text-gray-900 dark:text-text-dark">
                              {{ selectedUsuario?.endereco }}<span v-if="selectedUsuario?.numero">, {{ selectedUsuario?.numero }}</span>
                              <span v-if="selectedUsuario?.complemento"> - {{ selectedUsuario?.complemento }}</span>
                            </p>
                            <p v-if="selectedUsuario?.cidade" class="text-sm text-gray-600 dark:text-subtext-dark">
                              {{ selectedUsuario?.cidade }}<span v-if="selectedUsuario?.estado"> - {{ selectedUsuario?.estado }}</span>
                              <span v-if="selectedUsuario?.cep"> | CEP: {{ selectedUsuario?.cep }}</span>
                            </p>
                          </div>
                        </div>

                        <!-- Atividade -->
                        <div class="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 sm:p-5">
                          <h3 class="text-xs font-semibold text-gray-500 dark:text-subtext-dark uppercase tracking-wider mb-3 sm:mb-4">Atividade</h3>
                          <div class="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4">
                            <div>
                              <p class="text-xs text-gray-500 dark:text-subtext-dark mb-1">Último acesso</p>
                              <p class="text-sm font-medium text-gray-900 dark:text-text-dark">{{ formatDate(selectedUsuario?.last_sign_in_at) }}</p>
                            </div>
                            <div>
                              <p class="text-xs text-gray-500 dark:text-subtext-dark mb-1">Criado em</p>
                              <p class="text-sm font-medium text-gray-900 dark:text-text-dark">{{ formatDate(selectedUsuario?.created_at) }}</p>
                            </div>
                          </div>
                        </div>

                        <!-- Empresas Vinculadas -->
                        <div>
                          <h3 class="text-xs font-semibold text-gray-500 dark:text-subtext-dark uppercase tracking-wider mb-3 sm:mb-4">
                            Empresas vinculadas ({{ selectedUsuarioEmpresas.length }})
                          </h3>
                          <div v-if="loadingEmpresas" class="text-center py-4">
                            <span class="material-icons text-2xl text-gray-300 animate-spin">refresh</span>
                          </div>
                          <div v-else-if="selectedUsuarioEmpresas.length === 0" class="text-center py-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                            <span class="material-icons-outlined text-3xl text-gray-300 dark:text-gray-600 mb-2">business</span>
                            <p class="text-sm text-gray-500 dark:text-subtext-dark">Nenhuma empresa vinculada</p>
                          </div>
                          <div v-else class="space-y-2">
                            <div
                              v-for="emp in selectedUsuarioEmpresas"
                              :key="emp.empresa_id"
                              class="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50"
                            >
                              <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                                {{ getInitials(emp.empresa_nome) }}
                              </div>
                              <div class="flex-1 min-w-0">
                                <p class="text-sm font-medium text-gray-900 dark:text-text-dark truncate">{{ emp.empresa_nome }}</p>
                                <p class="text-xs text-gray-500 dark:text-subtext-dark">{{ getRoleLabel(emp.role) }}</p>
                              </div>
                              <span :class="['badge text-[10px]', getRoleBadgeClass(emp.role)]">
                                {{ getRoleLabel(emp.role) }}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Footer -->
                    <div class="px-4 sm:px-6 py-4 border-t border-gray-100 dark:border-border-dark">
                      <button @click="openEditFromSlideover" class="w-full btn btn-primary justify-center">
                        <span class="material-icons text-sm">edit</span>
                        Editar usuario
                      </button>
                    </div>
                  </div>
                </div>
              </Transition>
            </div>
          </div>
        </Transition>
      </Teleport>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useToast } from '~/composables/useToast'

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const toast = useToast()

// Email do usuario master (admin padrao)
const MASTER_USER_EMAIL = 'leonardo@fazendasbioma.com.br'

// Perfil do usuario (carregado do banco)
const userPerfil = ref('user')
const loadingPerfil = ref(true)

// Carregar perfil do usuario
async function loadUserPerfil() {
  if (!user.value?.id) {
    loadingPerfil.value = false
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
    loadingPerfil.value = false
  }
}

// Verifica se o usuario logado e admin (master ou perfil admin)
const isAdmin = computed(() => {
  return user.value?.email === MASTER_USER_EMAIL || userPerfil.value === 'admin'
})

// Estado de loading
const loading = ref(false)
const saving = ref(false)
const loadingEmpresas = ref(false)
const resendingId = ref(null)

// Convites pendentes
const convitesPendentes = ref([])

// Estado dos modais
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDetailsSlideover = ref(false)

// Usuario selecionado para detalhes
const selectedUsuario = ref(null)
const selectedUsuarioEmpresas = ref([])

// Paginacao
const currentPage = ref(1)
const itemsPerPage = ref(10)
const pageInput = ref('1')

// Filtros
const searchQuery = ref('')
const filterStatus = ref('')
const filterPerfil = ref('')

// Lista de estados brasileiros
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

// Watchers para resetar pagina
watch([searchQuery, filterStatus, filterPerfil], () => {
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
const usuarios = ref([])

// Form de novo usuario
const newUsuario = ref(getEmptyUsuario())

// Form de edicao
const editUsuario = ref({})

function getEmptyUsuario() {
  return {
    perfil: '',
    nome: '',
    email: '',
    celular: '',
    cep: '',
    endereco: '',
    numero: '',
    complemento: '',
    estado: '',
    cidade: ''
  }
}

// Validacao do form de criacao
const canCreate = computed(() => {
  return newUsuario.value.perfil &&
         newUsuario.value.nome &&
         newUsuario.value.email &&
         newUsuario.value.email.includes('@')
})

// Computed
const filteredUsuarios = computed(() => {
  let result = usuarios.value

  // Filtro de status
  if (filterStatus.value === 'active') {
    result = result.filter(usuario => usuario.ativo === true)
  } else if (filterStatus.value === 'inactive') {
    result = result.filter(usuario => usuario.ativo === false)
  }

  // Filtro de perfil
  if (filterPerfil.value) {
    result = result.filter(usuario => usuario.perfil === filterPerfil.value)
  }

  // Filtro de busca
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(usuario =>
      usuario.nome?.toLowerCase().includes(query) ||
      usuario.email?.toLowerCase().includes(query)
    )
  }

  return result
})

const totalPages = computed(() => {
  return Math.ceil(filteredUsuarios.value.length / itemsPerPage.value) || 1
})

const paginatedUsuarios = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredUsuarios.value.slice(start, end)
})

// Funcoes auxiliares
function getInitials(name) {
  if (!name) return 'US'
  const parts = name.split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

function getPerfilLabel(perfil) {
  const labels = {
    admin: 'Administrador',
    user: 'Usuario'
  }
  return labels[perfil] || 'Usuario'
}

function getPerfilBadgeClass(perfil) {
  const classes = {
    admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    user: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
  }
  return classes[perfil] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
}

function getPerfilBadgeClassFull(perfil) {
  const classes = {
    admin: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    user: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
  }
  return classes[perfil] || 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
}

function getRoleLabel(role) {
  const labels = {
    owner: 'Dono',
    admin: 'Admin',
    member: 'Membro'
  }
  return labels[role] || role || 'Membro'
}

function getRoleBadgeClass(role) {
  const classes = {
    owner: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    member: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
  }
  return classes[role] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
}

function formatDate(dateString) {
  if (!dateString) return 'Nunca'
  const date = new Date(dateString)
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

// Buscar CEP
async function buscarCep(cep, formType) {
  if (!cep || cep.replace(/\D/g, '').length !== 8) return

  try {
    const cepLimpo = cep.replace(/\D/g, '')
    const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
    const data = await response.json()

    if (!data.erro) {
      const target = formType === 'create' ? newUsuario : editUsuario
      target.value.endereco = data.logradouro || ''
      target.value.complemento = data.complemento || ''
      target.value.cidade = data.localidade || ''
      target.value.estado = data.uf || ''
    }
  } catch (error) {
    console.error('Erro ao buscar CEP:', error)
  }
}

// Carregar usuarios do Supabase (usuarios unicos, nao vinculos)
async function loadUsuarios() {
  if (!isAdmin.value) return

  loading.value = true
  try {
    // Tentar buscar da view vw_usuarios primeiro
    const { data, error } = await supabase
      .from('vw_usuarios')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    usuarios.value = data || []
  } catch (error) {
    console.error('Erro ao carregar usuarios:', error)
    // Se a view nao existir ainda, buscar de outra forma
    try {
      const { data: colaboradores, error: colabError } = await supabase
        .from('vw_empresa_colaboradores')
        .select('user_id, email, nome, created_at')

      if (colabError) throw colabError

      // Agrupar por user_id para ter usuarios unicos
      const usuariosMap = new Map()
      colaboradores?.forEach(c => {
        if (!usuariosMap.has(c.user_id)) {
          usuariosMap.set(c.user_id, {
            user_id: c.user_id,
            email: c.email,
            nome: c.nome,
            created_at: c.created_at,
            perfil: c.email === MASTER_USER_EMAIL ? 'admin' : 'user',
            ativo: true
          })
        }
      })

      usuarios.value = Array.from(usuariosMap.values())
    } catch (fallbackError) {
      console.error('Erro no fallback:', fallbackError)
      toast.error('Erro ao carregar usuarios')
    }
  } finally {
    loading.value = false
  }
}

// Carregar empresas do usuario selecionado
async function loadUsuarioEmpresas(userId) {
  loadingEmpresas.value = true
  try {
    const { data, error } = await supabase
      .from('vw_empresa_colaboradores')
      .select('empresa_id, role')
      .eq('user_id', userId)

    if (error) throw error

    // Buscar nomes das empresas
    const empresaIds = data?.map(e => e.empresa_id) || []

    if (empresaIds.length === 0) {
      selectedUsuarioEmpresas.value = []
      return
    }

    const { data: empresasData } = await supabase
      .from('empresas')
      .select('id, razao_social, nome_fantasia')
      .in('id', empresaIds)

    const empresasMap = {}
    empresasData?.forEach(e => {
      empresasMap[e.id] = e.nome_fantasia || e.razao_social
    })

    selectedUsuarioEmpresas.value = data?.map(e => ({
      empresa_id: e.empresa_id,
      empresa_nome: empresasMap[e.empresa_id] || '-',
      role: e.role
    })) || []
  } catch (error) {
    console.error('Erro ao carregar empresas do usuario:', error)
    selectedUsuarioEmpresas.value = []
  } finally {
    loadingEmpresas.value = false
  }
}

// Modal de criacao
function openCreateModal() {
  newUsuario.value = getEmptyUsuario()
  showCreateModal.value = true
}

function closeCreateModal() {
  showCreateModal.value = false
}

async function createUsuario() {
  if (!canCreate.value) {
    toast.error('Preencha todos os campos obrigatorios')
    return
  }

  saving.value = true
  try {
    // Salvar dados do convite temporariamente (sera associado quando o usuario aceitar)
    // Criar convite de usuario via API
    const response = await $fetch('/api/invite-user', {
      method: 'POST',
      body: {
        email: newUsuario.value.email,
        nome: newUsuario.value.nome,
        perfil: newUsuario.value.perfil,
        celular: newUsuario.value.celular || null,
        cep: newUsuario.value.cep || null,
        endereco: newUsuario.value.endereco || null,
        numero: newUsuario.value.numero || null,
        complemento: newUsuario.value.complemento || null,
        estado: newUsuario.value.estado || null,
        cidade: newUsuario.value.cidade || null
      }
    })

    if (response.error) {
      throw new Error(response.error)
    }

    toast.success('Convite enviado com sucesso! O usuario recebera um e-mail para criar sua conta.')
    closeCreateModal()
    await loadUsuarios()
    await loadConvitesPendentes()
  } catch (error) {
    console.error('Erro ao enviar convite:', error)
    if (error.message?.includes('already registered') || error.message?.includes('ja cadastrado')) {
      toast.error('Este email ja esta cadastrado no sistema')
    } else {
      toast.error('Erro ao enviar convite: ' + (error.message || 'Erro desconhecido'))
    }
  } finally {
    saving.value = false
  }
}

// Modal de edicao
function openEditModal(usuario) {
  editUsuario.value = { ...usuario }
  showEditModal.value = true
}

function closeEditModal() {
  showEditModal.value = false
}

async function updateUsuario() {
  saving.value = true
  try {
    // Verificar se ja existe registro para o usuario
    const { data: existing } = await supabase
      .from('user_preferences')
      .select('id')
      .eq('user_id', editUsuario.value.user_id)
      .single()

    let error
    if (existing) {
      // Atualizar registro existente
      const result = await supabase
        .from('user_preferences')
        .update({
          perfil: editUsuario.value.perfil,
          nome_completo: editUsuario.value.nome,
          celular: editUsuario.value.celular || null,
          cep: editUsuario.value.cep || null,
          endereco: editUsuario.value.endereco || null,
          numero: editUsuario.value.numero || null,
          complemento: editUsuario.value.complemento || null,
          estado: editUsuario.value.estado || null,
          cidade: editUsuario.value.cidade || null,
          ativo: editUsuario.value.ativo
        })
        .eq('user_id', editUsuario.value.user_id)
      error = result.error
    } else {
      // Inserir novo registro
      const result = await supabase
        .from('user_preferences')
        .insert({
          user_id: editUsuario.value.user_id,
          perfil: editUsuario.value.perfil,
          nome_completo: editUsuario.value.nome,
          celular: editUsuario.value.celular || null,
          cep: editUsuario.value.cep || null,
          endereco: editUsuario.value.endereco || null,
          numero: editUsuario.value.numero || null,
          complemento: editUsuario.value.complemento || null,
          estado: editUsuario.value.estado || null,
          cidade: editUsuario.value.cidade || null,
          ativo: editUsuario.value.ativo
        })
      error = result.error
    }

    if (error) throw error

    // Atualizar na lista local
    const index = usuarios.value.findIndex(u => u.user_id === editUsuario.value.user_id)
    if (index !== -1) {
      usuarios.value[index] = { ...usuarios.value[index], ...editUsuario.value }
    }

    // Atualizar usuario selecionado se estava aberto no slideover
    if (selectedUsuario.value?.user_id === editUsuario.value.user_id) {
      selectedUsuario.value = { ...selectedUsuario.value, ...editUsuario.value }
    }

    closeEditModal()
    toast.success('Usuario atualizado com sucesso')
  } catch (error) {
    console.error('Erro ao atualizar usuario:', error)
    toast.error('Erro ao atualizar usuario')
  } finally {
    saving.value = false
  }
}

// Slideover de detalhes
function openDetailsSlideover(usuario) {
  selectedUsuario.value = usuario
  selectedUsuarioEmpresas.value = []
  showDetailsSlideover.value = true
  loadUsuarioEmpresas(usuario.user_id)
}

function closeDetailsSlideover() {
  showDetailsSlideover.value = false
}

function openEditFromSlideover() {
  openEditModal(selectedUsuario.value)
}

// Funcoes para convites pendentes
function isExpired(expiresAt) {
  if (!expiresAt) return true
  return new Date(expiresAt) < new Date()
}

function formatExpiresAt(expiresAt) {
  if (!expiresAt) return '-'
  const date = new Date(expiresAt)
  const now = new Date()
  const diffMs = date - now
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)

  if (diffDays > 0) {
    return `${diffDays} dia${diffDays > 1 ? 's' : ''}`
  } else if (diffHours > 0) {
    return `${diffHours} hora${diffHours > 1 ? 's' : ''}`
  } else {
    return 'Menos de 1 hora'
  }
}

async function loadConvitesPendentes() {
  try {
    const { data, error } = await supabase
      .from('convites_usuario')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) throw error

    convitesPendentes.value = data || []
  } catch (error) {
    console.error('Erro ao carregar convites pendentes:', error)
  }
}

async function resendInvite(convite) {
  resendingId.value = convite.id
  try {
    const response = await $fetch('/api/resend-user-invite', {
      method: 'POST',
      body: { conviteId: convite.id }
    })

    if (response.error) {
      throw new Error(response.error)
    }

    toast.success('Convite reenviado com sucesso!')
    await loadConvitesPendentes()
  } catch (error) {
    console.error('Erro ao reenviar convite:', error)
    toast.error('Erro ao reenviar convite: ' + (error.message || 'Erro desconhecido'))
  } finally {
    resendingId.value = null
  }
}

async function cancelInvite(convite) {
  if (!confirm(`Tem certeza que deseja cancelar o convite de ${convite.nome}?`)) {
    return
  }

  try {
    const response = await $fetch('/api/cancel-user-invite', {
      method: 'POST',
      body: { conviteId: convite.id }
    })

    if (response.error) {
      throw new Error(response.error)
    }

    toast.success('Convite cancelado com sucesso!')
    await loadConvitesPendentes()
  } catch (error) {
    console.error('Erro ao cancelar convite:', error)
    toast.error('Erro ao cancelar convite: ' + (error.message || 'Erro desconhecido'))
  }
}

// Lifecycle
onMounted(async () => {
  // Primeiro carrega o perfil do usuario
  await loadUserPerfil()

  // Depois carrega dados se for admin
  if (isAdmin.value) {
    loadUsuarios()
    loadConvitesPendentes()
  }
})
</script>
