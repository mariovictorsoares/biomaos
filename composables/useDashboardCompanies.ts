import { ref, computed, watch } from 'vue'

interface Company {
  id: string
  razao_social: string
  nome_fantasia?: string
  cnpj?: string
  ativo: boolean
}

// Estado global para empresas selecionadas no dashboard
const selectedCompanyIds = ref<string[]>([])
const userCompanies = ref<Company[]>([])
const isLoadingCompanies = ref(false)

export function useDashboardCompanies() {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  // Carregar todas as empresas que o usuario tem acesso
  const loadUserCompanies = async () => {
    if (!user.value?.id) {
      userCompanies.value = []
      return
    }

    isLoadingCompanies.value = true
    try {
      const { data, error } = await supabase
        .from('empresa_usuarios')
        .select(`
          empresa_id,
          empresas:empresa_id (
            id,
            razao_social,
            nome_fantasia,
            cnpj,
            ativo
          )
        `)
        .eq('user_id', user.value.id)

      if (error) throw error

      // Extrair empresas do resultado
      userCompanies.value = (data || [])
        .map((item: any) => item.empresas)
        .filter((empresa: Company | null) => empresa !== null && empresa.ativo)

      // Se nenhuma empresa selecionada, selecionar todas por padrao
      if (selectedCompanyIds.value.length === 0 && userCompanies.value.length > 0) {
        selectedCompanyIds.value = userCompanies.value.map(e => e.id)
      }

      // Persistir no localStorage
      if (import.meta.client) {
        localStorage.setItem('dashboardSelectedCompanies', JSON.stringify(selectedCompanyIds.value))
      }
    } catch (e) {
      // Ignora erros silenciosamente
    } finally {
      isLoadingCompanies.value = false
    }
  }

  // Carregar selecao do localStorage
  const loadSavedSelection = () => {
    if (import.meta.client) {
      const saved = localStorage.getItem('dashboardSelectedCompanies')
      if (saved) {
        try {
          selectedCompanyIds.value = JSON.parse(saved)
        } catch (e) {
          // Ignora erros de parse
        }
      }
    }
  }

  // Toggle selecao de uma empresa
  const toggleCompany = (companyId: string) => {
    const index = selectedCompanyIds.value.indexOf(companyId)
    if (index === -1) {
      selectedCompanyIds.value.push(companyId)
    } else {
      // Nao permitir desselecionar todas
      if (selectedCompanyIds.value.length > 1) {
        selectedCompanyIds.value.splice(index, 1)
      }
    }

    // Persistir no localStorage
    if (import.meta.client) {
      localStorage.setItem('dashboardSelectedCompanies', JSON.stringify(selectedCompanyIds.value))
    }
  }

  // Selecionar todas as empresas
  const selectAll = () => {
    selectedCompanyIds.value = userCompanies.value.map(e => e.id)
    if (import.meta.client) {
      localStorage.setItem('dashboardSelectedCompanies', JSON.stringify(selectedCompanyIds.value))
    }
  }

  // Selecionar apenas uma empresa
  const selectOnly = (companyId: string) => {
    selectedCompanyIds.value = [companyId]
    if (import.meta.client) {
      localStorage.setItem('dashboardSelectedCompanies', JSON.stringify(selectedCompanyIds.value))
    }
  }

  // Verificar se empresa esta selecionada
  const isSelected = (companyId: string) => {
    return selectedCompanyIds.value.includes(companyId)
  }

  // Computed para empresas selecionadas
  const selectedCompanies = computed(() => {
    return userCompanies.value.filter(e => selectedCompanyIds.value.includes(e.id))
  })

  // Computed para filtro SQL (para uso em queries)
  const companyFilter = computed(() => {
    return selectedCompanyIds.value
  })

  // Helper para criar query com filtro de multiplas empresas
  const createFilteredQuery = (tableName: string, selectFields: string = '*') => {
    return supabase
      .from(tableName)
      .select(selectFields)
      .in('empresa_id', selectedCompanyIds.value)
  }

  // Buscar dados agregados de multiplas empresas
  const fetchAggregatedData = async <T>(
    tableName: string,
    selectFields: string = '*',
    additionalFilters?: (query: any) => any
  ): Promise<T[]> => {
    if (selectedCompanyIds.value.length === 0) {
      return []
    }

    try {
      let query = supabase
        .from(tableName)
        .select(selectFields)
        .in('empresa_id', selectedCompanyIds.value)

      if (additionalFilters) {
        query = additionalFilters(query)
      }

      const { data, error } = await query

      if (error) throw error

      return (data || []) as T[]
    } catch (e) {
      return []
    }
  }

  // Inicializar
  loadSavedSelection()

  return {
    // Estado
    selectedCompanyIds,
    userCompanies,
    isLoadingCompanies,

    // Computed
    selectedCompanies,
    companyFilter,

    // Metodos
    loadUserCompanies,
    toggleCompany,
    selectAll,
    selectOnly,
    isSelected,
    createFilteredQuery,
    fetchAggregatedData
  }
}
