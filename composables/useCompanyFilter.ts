import { ref, computed, watch } from 'vue'
import { useCurrentCompany } from './useCurrentCompany'

interface FetchOptions {
  select?: string
  orderBy?: { column: string; ascending?: boolean }
  filters?: Array<{ column: string; operator: string; value: any }>
}

export function useCompanyFilter<T = any>(tableName: string, options: FetchOptions = {}) {
  const supabase = useSupabaseClient()
  const { currentCompany } = useCurrentCompany()

  const data = ref<T[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchData = async () => {
    if (!currentCompany.value?.id) {
      data.value = []
      return
    }

    loading.value = true
    error.value = null

    try {
      let query = supabase
        .from(tableName)
        .select(options.select || '*')
        .eq('empresa_id', currentCompany.value.id)

      // Aplicar filtros adicionais
      if (options.filters) {
        for (const filter of options.filters) {
          if (filter.operator === 'eq') {
            query = query.eq(filter.column, filter.value)
          } else if (filter.operator === 'neq') {
            query = query.neq(filter.column, filter.value)
          } else if (filter.operator === 'gt') {
            query = query.gt(filter.column, filter.value)
          } else if (filter.operator === 'gte') {
            query = query.gte(filter.column, filter.value)
          } else if (filter.operator === 'lt') {
            query = query.lt(filter.column, filter.value)
          } else if (filter.operator === 'lte') {
            query = query.lte(filter.column, filter.value)
          } else if (filter.operator === 'like') {
            query = query.like(filter.column, filter.value)
          } else if (filter.operator === 'ilike') {
            query = query.ilike(filter.column, filter.value)
          } else if (filter.operator === 'in') {
            query = query.in(filter.column, filter.value)
          } else if (filter.operator === 'is') {
            query = query.is(filter.column, filter.value)
          }
        }
      }

      // Aplicar ordenacao
      if (options.orderBy) {
        query = query.order(options.orderBy.column, { ascending: options.orderBy.ascending ?? true })
      }

      const { data: result, error: fetchError } = await query

      if (fetchError) {
        throw fetchError
      }

      data.value = result || []
    } catch (e: any) {
      error.value = e.message || 'Erro ao carregar dados'
    } finally {
      loading.value = false
    }
  }

  // Recarregar quando a empresa mudar
  watch(
    () => currentCompany.value?.id,
    (newId, oldId) => {
      if (newId !== oldId) {
        fetchData()
      }
    },
    { immediate: true }
  )

  const refresh = () => fetchData()

  const isEmpty = computed(() => !loading.value && data.value.length === 0)

  return {
    data,
    loading,
    error,
    refresh,
    isEmpty,
    currentCompanyId: computed(() => currentCompany.value?.id)
  }
}

// Composable para operacoes CRUD com filtro de empresa
export function useCompanyCrud<T extends { id: string }>(tableName: string) {
  const supabase = useSupabaseClient()
  const { currentCompany } = useCurrentCompany()
  const { success, error: showError } = useToast()

  const saving = ref(false)
  const deleting = ref(false)

  const create = async (record: Partial<T>, customMessages?: { success?: string; error?: string }) => {
    if (!currentCompany.value?.id) {
      showError('Nenhuma empresa selecionada')
      return { data: null, error: 'Nenhuma empresa selecionada' }
    }

    saving.value = true
    try {
      const { data, error } = await supabase
        .from(tableName)
        .insert({
          ...record,
          empresa_id: currentCompany.value.id
        })
        .select()
        .single()

      if (error) throw error

      success(customMessages?.success || 'Registro criado com sucesso')
      return { data, error: null }
    } catch (e: any) {
      showError(customMessages?.error || e.message || 'Erro ao criar registro')
      return { data: null, error: e.message }
    } finally {
      saving.value = false
    }
  }

  const update = async (id: string, updates: Partial<T>, customMessages?: { success?: string; error?: string }) => {
    if (!currentCompany.value?.id) {
      showError('Nenhuma empresa selecionada')
      return { data: null, error: 'Nenhuma empresa selecionada' }
    }

    saving.value = true
    try {
      const { data, error } = await supabase
        .from(tableName)
        .update(updates)
        .eq('id', id)
        .eq('empresa_id', currentCompany.value.id)
        .select()
        .single()

      if (error) throw error

      success(customMessages?.success || 'Registro atualizado com sucesso')
      return { data, error: null }
    } catch (e: any) {
      showError(customMessages?.error || e.message || 'Erro ao atualizar registro')
      return { data: null, error: e.message }
    } finally {
      saving.value = false
    }
  }

  const remove = async (id: string, customMessages?: { success?: string; error?: string }) => {
    if (!currentCompany.value?.id) {
      showError('Nenhuma empresa selecionada')
      return { success: false, error: 'Nenhuma empresa selecionada' }
    }

    deleting.value = true
    try {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id)
        .eq('empresa_id', currentCompany.value.id)

      if (error) throw error

      success(customMessages?.success || 'Registro removido com sucesso')
      return { success: true, error: null }
    } catch (e: any) {
      showError(customMessages?.error || e.message || 'Erro ao remover registro')
      return { success: false, error: e.message }
    } finally {
      deleting.value = false
    }
  }

  const getById = async (id: string, select?: string) => {
    if (!currentCompany.value?.id) {
      return { data: null, error: 'Nenhuma empresa selecionada' }
    }

    try {
      const { data, error } = await supabase
        .from(tableName)
        .select(select || '*')
        .eq('id', id)
        .eq('empresa_id', currentCompany.value.id)
        .single()

      if (error) throw error

      return { data, error: null }
    } catch (e: any) {
      return { data: null, error: e.message }
    }
  }

  return {
    saving,
    deleting,
    create,
    update,
    remove,
    getById,
    currentCompanyId: computed(() => currentCompany.value?.id)
  }
}
