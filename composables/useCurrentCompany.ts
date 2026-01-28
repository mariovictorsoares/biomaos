import { ref, computed } from 'vue'

interface Company {
  id: string
  razao_social: string
  nome_fantasia?: string
  cnpj?: string
  ativo: boolean
  logo_url?: string
}

// Estado global para a empresa atual
const currentCompany = ref<Company | null>(null)
const isLoading = ref(false)

export function useCurrentCompany() {
  const supabase = useSupabaseClient()

  const setCurrentCompany = (company: Company | null) => {
    currentCompany.value = company
    // Salvar no localStorage para persistir
    if (import.meta.client) {
      if (company) {
        localStorage.setItem('currentCompany', JSON.stringify(company))
      } else {
        localStorage.removeItem('currentCompany')
      }
    }
  }

  const loadCurrentCompany = async () => {
    // Primeiro tenta carregar do localStorage para resposta rapida
    if (import.meta.client) {
      const saved = localStorage.getItem('currentCompany')
      if (saved) {
        try {
          currentCompany.value = JSON.parse(saved)
        } catch (e) {
          // Ignora erros de parse
        }
      }
    }

    // Depois carrega do banco para garantir dados atualizados
    isLoading.value = true
    try {
      const { data, error } = await supabase.rpc('get_current_empresa')

      if (error) {
        // Em caso de erro, limpa a empresa atual
        setCurrentCompany(null)
        return
      }

      // Sempre atualiza com o valor do banco (pode ser null se usuário não tem acesso)
      setCurrentCompany(data)
    } catch (error) {
      setCurrentCompany(null)
    } finally {
      isLoading.value = false
    }
  }

  const currentCompanyName = computed(() => {
    return currentCompany.value?.nome_fantasia || currentCompany.value?.razao_social || 'Selecione uma empresa'
  })

  const currentCompanyInitials = computed(() => {
    const name = currentCompany.value?.nome_fantasia || currentCompany.value?.razao_social
    if (!name) return 'EM'
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  })

  const currentCompanyLogo = computed(() => {
    return currentCompany.value?.logo_url || null
  })

  return {
    currentCompany,
    isLoading,
    setCurrentCompany,
    loadCurrentCompany,
    currentCompanyName,
    currentCompanyInitials,
    currentCompanyLogo
  }
}
