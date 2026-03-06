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
        // Em caso de erro (ex: auth nao pronta), manter valor do localStorage
        // Se ja tem do localStorage, usa esse; senao tenta auto-selecionar
        if (!currentCompany.value) {
          await autoSelectFirstCompany()
        }
        return
      }

      if (data) {
        // Atualizar com valor do banco
        setCurrentCompany(data)
      } else if (!currentCompany.value) {
        // Nenhuma empresa no banco nem no localStorage - auto-selecionar
        await autoSelectFirstCompany()
      }
    } catch (error) {
      // Em caso de excecao, tentar auto-selecionar se nao tem nada
      if (!currentCompany.value) {
        await autoSelectFirstCompany()
      }
    } finally {
      isLoading.value = false
    }
  }

  const autoSelectFirstCompany = async () => {
    try {
      // Buscar empresas vinculadas ao usuario
      const { data, error } = await supabase
        .from('empresa_usuarios')
        .select('empresa:empresas(*)')
        .order('created_at', { ascending: true })
        .limit(1)

      if (error) {
        // Fallback: tentar buscar direto da tabela empresas
        const { data: empresas, error: err2 } = await supabase
          .from('empresas')
          .select('*')
          .eq('ativo', true)
          .order('created_at', { ascending: true })
          .limit(1)

        if (!err2 && empresas?.length) {
          await persistCompanySelection(empresas[0])
        }
        return
      }

      const empresa = data?.[0]?.empresa
      if (empresa && empresa.ativo) {
        await persistCompanySelection(empresa)
      }
    } catch (e) {
      // Silencioso - nao conseguiu auto-selecionar
    }
  }

  const persistCompanySelection = async (company: Company) => {
    setCurrentCompany(company)
    // Persistir no banco tambem
    try {
      await supabase.rpc('set_current_empresa', {
        p_empresa_id: company.id
      })
    } catch (e) {
      // localStorage ja foi salvo pelo setCurrentCompany
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
