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

    <!-- Footer: Empresa + Usuário -->
    <div class="sidebar-footer">
      <!-- Empresa Atual -->
      <NuxtLink
        to="/empresas"
        :class="[
          'sidebar-company-card group',
          isCollapsed ? 'sidebar-company-card-collapsed' : ''
        ]"
        @click="closeSidebar"
        @mouseenter="showTooltip($event, currentCompanyName)"
        @mouseleave="hideTooltip"
      >
        <div class="sidebar-company-avatar">
          <img v-if="currentCompanyLogo" :src="currentCompanyLogo" class="w-full h-full object-cover" alt="Logo" />
          <span v-else>{{ currentCompanyInitials }}</span>
        </div>
        <div :class="['sidebar-company-info', { 'lg:!hidden': isCollapsed }]">
          <p class="sidebar-company-label">Empresa</p>
          <p class="sidebar-company-name">{{ currentCompanyName }}</p>
        </div>
        <span :class="['sidebar-company-icon material-icons-outlined', { 'lg:!hidden': isCollapsed }]">unfold_more</span>
      </NuxtLink>

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
</template>

<script setup>
import { useSidebar } from '~/composables/useSidebar'
import { useCurrentCompany } from '~/composables/useCurrentCompany'

const route = useRoute()
const router = useRouter()
const supabase = useSupabaseClient()
const user = useSupabaseUser()

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
const { currentCompanyName, currentCompanyInitials, currentCompanyLogo, loadCurrentCompany } = useCurrentCompany()

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
  { label: 'Vendas', path: '/vendas', icon: 'trending_up' },
  { label: 'Pedidos', path: '/pedidos', icon: 'inventory_2' },
  { label: 'Contratos', path: '/contratos', icon: 'description' },
  { label: 'Clientes', path: '/clientes', icon: 'people' },
  { label: 'Produção', path: '/producao', icon: 'factory' },
  { label: 'Estoque', path: '/estoque', icon: 'inventory' },
  { label: 'Prev. de Colheita', path: '/previsao-colheita', icon: 'calendar_today' },
  { label: 'Cap. Fazendas', path: '/capacidade-fazendas', icon: 'store' },
  { label: 'Fazendas', path: '/fazendas', icon: 'agriculture' },
  { label: 'Produtos', path: '/produtos', icon: 'local_florist' },
  { label: 'Espécies', path: '/especies', icon: 'eco' },
  { label: 'Lotes de Sementes', path: '/lotes-sementes', icon: 'grain' },
  { label: 'Empresas', path: '/empresas', icon: 'business' },
]

// Itens exclusivos do master
const masterMenuItems = [
  { label: 'Usuários', path: '/usuarios', icon: 'person_search' },
]

// Menu filtrado baseado no usuario
const menuItems = computed(() => {
  if (isMasterUser.value) {
    // Inserir Usuarios antes de Empresas
    const items = [...baseMenuItems]
    const empresasIndex = items.findIndex(item => item.path === '/empresas')
    items.splice(empresasIndex, 0, ...masterMenuItems)
    return items
  }
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
</style>
