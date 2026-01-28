import { ref, onMounted } from 'vue'

// Estado mobile (aberto/fechado)
const isOpen = ref(false)

// Estado collapsed (retraído/expandido) - persiste no localStorage
const isCollapsed = ref(false)

// Flag para saber se já carregou do localStorage
const isHydrated = ref(false)

export function useSidebar() {
  // Carregar estado do localStorage no cliente
  onMounted(() => {
    if (!isHydrated.value) {
      const saved = localStorage.getItem('sidebar-collapsed')
      if (saved !== null) {
        isCollapsed.value = saved === 'true'
      }
      isHydrated.value = true
    }
  })

  // Funções para controle mobile
  const openSidebar = () => {
    isOpen.value = true
  }

  const closeSidebar = () => {
    isOpen.value = false
  }

  const toggleSidebar = () => {
    isOpen.value = !isOpen.value
  }

  // Funções para controle collapsed (desktop)
  const collapseSidebar = () => {
    isCollapsed.value = true
    localStorage.setItem('sidebar-collapsed', 'true')
  }

  const expandSidebar = () => {
    isCollapsed.value = false
    localStorage.setItem('sidebar-collapsed', 'false')
  }

  const toggleCollapsed = () => {
    isCollapsed.value = !isCollapsed.value
    localStorage.setItem('sidebar-collapsed', String(isCollapsed.value))
  }

  return {
    // Estado mobile
    isOpen,
    openSidebar,
    closeSidebar,
    toggleSidebar,
    // Estado collapsed
    isCollapsed,
    collapseSidebar,
    expandSidebar,
    toggleCollapsed
  }
}
