import type {
  ProducaoCompleta,
  ProducaoFiltros,
  NovaProducaoForm,
  RegistroPlantioForm,
  RegistroLuzForm,
  RegistroColheitaForm,
  NovaRecorrenteForm,
  ProducaoRecorrente,
  ProducaoStatus,
  ProducaoLog
} from '~/composables/types/producao'

export function useProducao() {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()
  const { currentCompany } = useCurrentCompany()
  const calc = useProducaoCalc()
  const toast = useToast()

  // ============================================================
  // Log helper (fire-and-forget)
  // ============================================================

  function criarLog(producaoId: string, acao: string, dados: Record<string, any>): void {
    const userId = user.value?.id
    const userEmail = user.value?.email
    if (!userId) return

    supabase
      .from('producao_logs')
      .insert({
        producao_id: producaoId,
        usuario_id: userId,
        usuario_email: userEmail || null,
        acao,
        dados
      })
      .then(({ error }) => {
        if (error) console.error('Erro ao criar log:', error)
      })
  }

  async function carregarLogs(producaoId: string): Promise<ProducaoLog[]> {
    const { data, error } = await supabase
      .from('producao_logs')
      .select('*')
      .eq('producao_id', producaoId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao carregar logs:', error)
      return []
    }
    return (data || []) as ProducaoLog[]
  }

  // ============================================================
  // CRUD
  // ============================================================

  /**
   * Lista producoes com joins (especies, lotes, fazenda).
   */
  async function listarProducoes(filtros?: ProducaoFiltros): Promise<ProducaoCompleta[]> {
    if (!currentCompany.value?.id) return []

    let query = supabase
      .from('producoes')
      .select(`
        *,
        fazendas(id, nome, codigo),
        producoes_recorrentes(id, intervalo_dias),
        producao_especies(
          *,
          especies(id, nome, codigo, tempo_germinacao, tempo_luz, vida_util_dias, tempo_buffer_colheita),
          lotes_sementes(id, numero, tempo_germinacao, tempo_luz, rendimento_por_bandeja, densidade_semeadura, margem_seguranca)
        ),
        producao_colheitas(
          *,
          especies(id, nome, codigo)
        )
      `)
      .eq('empresa_id', currentCompany.value.id)
      .order('created_at', { ascending: false })

    if (filtros?.status) {
      query = query.eq('status', filtros.status)
    }
    if (filtros?.fazenda_id) {
      query = query.eq('fazenda_id', filtros.fazenda_id)
    }
    if (filtros?.data_inicio) {
      query = query.gte('data_colheita_prevista', filtros.data_inicio)
    }
    if (filtros?.data_fim) {
      query = query.lte('data_colheita_prevista', filtros.data_fim)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro ao listar producoes:', error)
      toast.error('Erro ao carregar produções')
      return []
    }

    return (data || []) as ProducaoCompleta[]
  }

  /**
   * Busca uma producao por ID com todos os dados.
   */
  async function buscarProducao(id: string): Promise<ProducaoCompleta | null> {
    const { data, error } = await supabase
      .from('producoes')
      .select(`
        *,
        fazendas(id, nome, codigo),
        producoes_recorrentes(id, intervalo_dias),
        producao_especies(
          *,
          especies(id, nome, codigo, tempo_germinacao, tempo_luz, vida_util_dias, tempo_buffer_colheita),
          lotes_sementes(id, numero, tempo_germinacao, tempo_luz, rendimento_por_bandeja, densidade_semeadura, margem_seguranca)
        ),
        producao_colheitas(
          *,
          especies(id, nome, codigo)
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Erro ao buscar producao:', error)
      return null
    }

    return data as ProducaoCompleta
  }

  /**
   * Cria uma nova producao com suas especies.
   */
  async function criarProducao(form: NovaProducaoForm): Promise<string | null> {
    if (!currentCompany.value?.id) return null

    try {
      // Resolver tempos do lote/especie para calcular datas previstas
      const primeiraEspecie = form.especies[0]
      let tempoGerminacao = 0
      let tempoLuz = 0

      if (primeiraEspecie.lote_semente_id) {
        const { data: lote } = await supabase
          .from('lotes_sementes')
          .select('tempo_germinacao, tempo_luz')
          .eq('id', primeiraEspecie.lote_semente_id)
          .single()

        if (lote) {
          tempoGerminacao = lote.tempo_germinacao || 0
          tempoLuz = lote.tempo_luz || 0
        }
      }

      // Se lote nao tem tempos, tentar da especie
      if (tempoGerminacao === 0 || tempoLuz === 0) {
        const { data: especie } = await supabase
          .from('especies')
          .select('tempo_germinacao, tempo_luz')
          .eq('id', primeiraEspecie.especie_id)
          .single()

        if (especie) {
          if (tempoGerminacao === 0) tempoGerminacao = especie.tempo_germinacao || 0
          if (tempoLuz === 0) tempoLuz = especie.tempo_luz || 0
        }
      }

      // Para mix, usar o maior tempo entre as 2 especies
      if (form.tipo === 'mix' && form.especies.length > 1) {
        const segunda = form.especies[1]
        let tg2 = 0, tl2 = 0

        if (segunda.lote_semente_id) {
          const { data: lote2 } = await supabase
            .from('lotes_sementes')
            .select('tempo_germinacao, tempo_luz')
            .eq('id', segunda.lote_semente_id)
            .single()
          if (lote2) { tg2 = lote2.tempo_germinacao || 0; tl2 = lote2.tempo_luz || 0 }
        }
        if (tg2 === 0 || tl2 === 0) {
          const { data: esp2 } = await supabase
            .from('especies')
            .select('tempo_germinacao, tempo_luz')
            .eq('id', segunda.especie_id)
            .single()
          if (esp2) {
            if (tg2 === 0) tg2 = esp2.tempo_germinacao || 0
            if (tl2 === 0) tl2 = esp2.tempo_luz || 0
          }
        }
        tempoGerminacao = Math.max(tempoGerminacao, tg2)
        tempoLuz = Math.max(tempoLuz, tl2)
      }

      const datas = calc.calcularDatasProducao(form.data_plantio_prevista, tempoGerminacao, tempoLuz)

      // Gerar codigo sequencial (0001, 0002, ...)
      const { data: lastProd } = await supabase
        .from('producoes')
        .select('codigo')
        .eq('empresa_id', currentCompany.value.id)
        .not('codigo', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)

      let nextCode = 1
      if (lastProd?.[0]?.codigo) {
        const match = lastProd[0].codigo.match(/\d+/)
        if (match) nextCode = parseInt(match[0]) + 1
      }
      const codigo = String(nextCode).padStart(4, '0')

      // Inserir producao principal
      const { data: producao, error: errProd } = await supabase
        .from('producoes')
        .insert({
          empresa_id: currentCompany.value.id,
          codigo,
          tipo: form.tipo,
          fazenda_id: form.fazenda_id || null,
          quantidade_planejada: form.quantidade_planejada,
          recorrente: form.recorrente,
          status: 'planejado',
          data_plantio_prevista: datas.data_plantio_prevista,
          data_luz_prevista: datas.data_luz_prevista,
          data_colheita_prevista: datas.data_colheita_prevista,
          observacoes: form.observacoes || null
        })
        .select('id')
        .single()

      if (errProd) throw errProd

      // Inserir especies da producao
      const especiesInsert = form.especies.map((esp, i) => ({
        producao_id: producao.id,
        especie_id: esp.especie_id,
        lote_semente_id: esp.lote_semente_id || null,
        quantidade_planejada: form.tipo === 'mix'
          ? Math.floor(form.quantidade_planejada / 2)
          : form.quantidade_planejada,
        data_plantio_prevista: datas.data_plantio_prevista,
        data_luz_prevista: datas.data_luz_prevista
      }))

      const { error: errEsp } = await supabase
        .from('producao_especies')
        .insert(especiesInsert)

      if (errEsp) throw errEsp

      criarLog(producao.id, 'criacao', {
        tipo: form.tipo,
        quantidade_planejada: form.quantidade_planejada,
        data_plantio_prevista: form.data_plantio_prevista,
        especies: form.especies.map(e => e.especie_id)
      })

      toast.success('Produção criada com sucesso')
      return producao.id
    } catch (e: any) {
      console.error('Erro ao criar producao:', e)
      toast.error(e.message || 'Erro ao criar produção')
      return null
    }
  }

  /**
   * Atualiza campos editaveis de uma producao (observacoes, fazenda, lote).
   */
  async function editarProducao(id: string, dados: Partial<{ fazenda_id: string | null; observacoes: string }>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('producoes')
        .update(dados)
        .eq('id', id)

      if (error) throw error
      toast.success('Produção atualizada')
      return true
    } catch (e: any) {
      console.error('Erro ao editar producao:', e)
      toast.error(e.message || 'Erro ao atualizar produção')
      return false
    }
  }

  /**
   * Cancela uma producao (de qualquer status nao-final).
   */
  async function cancelarProducao(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('producoes')
        .update({
          status: 'cancelado',
          data_cancelado: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error
      criarLog(id, 'cancelado', {})
      toast.success('Produção cancelada')
      return true
    } catch (e: any) {
      console.error('Erro ao cancelar producao:', e)
      toast.error(e.message || 'Erro ao cancelar produção')
      return false
    }
  }

  // ============================================================
  // Transicoes de Status
  // ============================================================

  /**
   * Registra plantio: planejado → germinando.
   * Preenche data real e quantidades por especie.
   */
  async function registrarPlantio(producaoId: string, form: RegistroPlantioForm): Promise<boolean> {
    try {
      // Atualizar producao principal
      const { error: errProd } = await supabase
        .from('producoes')
        .update({
          status: 'germinando',
          data_germinando: new Date().toISOString(),
          data_plantio_real: form.data_plantio
        })
        .eq('id', producaoId)
        .eq('status', 'planejado') // Garante que so muda se estiver planejado

      if (errProd) throw errProd

      // Atualizar quantidades por especie
      for (const item of form.quantidades) {
        const { error: errEsp } = await supabase
          .from('producao_especies')
          .update({ quantidade_plantada: item.quantidade })
          .eq('producao_id', producaoId)
          .eq('especie_id', item.especie_id)

        if (errEsp) throw errEsp
      }

      // Verificar rolling window se for recorrente
      await verificarRollingWindow(producaoId)

      criarLog(producaoId, 'plantio', { data_plantio: form.data_plantio, quantidades: form.quantidades })
      toast.success('Plantio registrado com sucesso')
      return true
    } catch (e: any) {
      console.error('Erro ao registrar plantio:', e)
      toast.error(e.message || 'Erro ao registrar plantio')
      return false
    }
  }

  /**
   * Registra passagem para luz: germinando → luz.
   * Registra perda ou germinadas por especie.
   */
  async function registrarLuz(producaoId: string, form: RegistroLuzForm): Promise<boolean> {
    try {
      // Atualizar producao principal
      const { error: errProd } = await supabase
        .from('producoes')
        .update({
          status: 'luz',
          data_luz: new Date().toISOString(),
          data_luz_real: form.data_luz
        })
        .eq('id', producaoId)
        .eq('status', 'germinando')

      if (errProd) throw errProd

      // Atualizar cada especie
      for (const item of form.valores) {
        // Buscar quantidade_plantada da especie
        const { data: espData } = await supabase
          .from('producao_especies')
          .select('quantidade_plantada')
          .eq('producao_id', producaoId)
          .eq('especie_id', item.especie_id)
          .single()

        const plantada = espData?.quantidade_plantada || 0
        const { germinada, perda } = calc.calcularPerdaGerminacao(plantada, item.valor, item.isPerda)

        const { error: errEsp } = await supabase
          .from('producao_especies')
          .update({
            quantidade_germinada: germinada,
            perda_germinacao: perda
          })
          .eq('producao_id', producaoId)
          .eq('especie_id', item.especie_id)

        if (errEsp) throw errEsp
      }

      criarLog(producaoId, 'luz', { data_luz: form.data_luz, valores: form.valores })
      toast.success('Passagem para luz registrada')
      return true
    } catch (e: any) {
      console.error('Erro ao registrar luz:', e)
      toast.error(e.message || 'Erro ao registrar passagem para luz')
      return false
    }
  }

  /**
   * Registra uma colheita (pode ter multiplas).
   * Na 1a colheita, muda status para 'colhendo'.
   */
  async function registrarColheita(producaoId: string, form: RegistroColheitaForm): Promise<boolean> {
    try {
      // Verificar status atual
      const { data: prod } = await supabase
        .from('producoes')
        .select('status')
        .eq('id', producaoId)
        .single()

      if (!prod || !['luz', 'colhendo'].includes(prod.status)) {
        toast.error('Produção não está no status correto para colheita')
        return false
      }

      // Inserir registros de colheita
      const colheitasInsert = form.colheitas
        .filter(c => c.quantidade > 0)
        .map(c => ({
          producao_id: producaoId,
          especie_id: c.especie_id,
          data_colheita: form.data_colheita,
          quantidade: c.quantidade,
          observacoes: form.observacoes || null,
          usuario_email: user.value?.email || null
        }))

      if (colheitasInsert.length === 0) {
        toast.error('Informe a quantidade colhida')
        return false
      }

      const { error: errCol } = await supabase
        .from('producao_colheitas')
        .insert(colheitasInsert)

      if (errCol) throw errCol

      // Atualizar total_colhido em producao_especies
      for (const item of form.colheitas) {
        if (item.quantidade <= 0) continue

        // Buscar total atual
        const { data: espData } = await supabase
          .from('producao_especies')
          .select('total_colhido')
          .eq('producao_id', producaoId)
          .eq('especie_id', item.especie_id)
          .single()

        const novoTotal = (espData?.total_colhido || 0) + item.quantidade

        const { error: errEsp } = await supabase
          .from('producao_especies')
          .update({ total_colhido: novoTotal })
          .eq('producao_id', producaoId)
          .eq('especie_id', item.especie_id)

        if (errEsp) throw errEsp
      }

      // Se status era 'luz', mudar para 'colhendo' (1a colheita)
      if (prod.status === 'luz') {
        const { error: errStatus } = await supabase
          .from('producoes')
          .update({
            status: 'colhendo',
            data_colhendo: new Date().toISOString()
          })
          .eq('id', producaoId)

        if (errStatus) throw errStatus
      }

      criarLog(producaoId, 'colheita', { data_colheita: form.data_colheita, colheitas: form.colheitas })
      toast.success('Colheita registrada com sucesso')
      return true
    } catch (e: any) {
      console.error('Erro ao registrar colheita:', e)
      toast.error(e.message || 'Erro ao registrar colheita')
      return false
    }
  }

  /**
   * Finaliza uma producao: colhendo → finalizado.
   * Calcula perda_final para cada especie.
   */
  async function finalizarProducao(producaoId: string): Promise<boolean> {
    try {
      // Buscar especies da producao
      const { data: especies } = await supabase
        .from('producao_especies')
        .select('especie_id, quantidade_germinada, total_colhido')
        .eq('producao_id', producaoId)

      if (!especies) throw new Error('Espécies não encontradas')

      // Calcular e atualizar perda_final para cada especie
      for (const esp of especies) {
        const perdaFinal = calc.calcularPerdaFinal(
          esp.quantidade_germinada || 0,
          esp.total_colhido || 0
        )

        const { error: errEsp } = await supabase
          .from('producao_especies')
          .update({ perda_final: perdaFinal })
          .eq('producao_id', producaoId)
          .eq('especie_id', esp.especie_id)

        if (errEsp) throw errEsp
      }

      // Atualizar status
      const { error: errProd } = await supabase
        .from('producoes')
        .update({
          status: 'finalizado',
          data_finalizado: new Date().toISOString()
        })
        .eq('id', producaoId)
        .eq('status', 'colhendo')

      if (errProd) throw errProd

      criarLog(producaoId, 'finalizado', {})
      toast.success('Produção finalizada com sucesso')
      return true
    } catch (e: any) {
      console.error('Erro ao finalizar producao:', e)
      toast.error(e.message || 'Erro ao finalizar produção')
      return false
    }
  }

  // ============================================================
  // Edicao de etapas anteriores
  // ============================================================

  async function editarDadosPlantio(producaoId: string, form: RegistroPlantioForm): Promise<boolean> {
    try {
      // Capturar dados anteriores
      const { data: prodAntes } = await supabase
        .from('producoes')
        .select('data_plantio_real')
        .eq('id', producaoId)
        .single()

      const { data: espAntes } = await supabase
        .from('producao_especies')
        .select('especie_id, quantidade_plantada, especies(nome)')
        .eq('producao_id', producaoId)

      const { error: errProd } = await supabase
        .from('producoes')
        .update({ data_plantio_real: form.data_plantio })
        .eq('id', producaoId)

      if (errProd) throw errProd

      for (const item of form.quantidades) {
        const { error: errEsp } = await supabase
          .from('producao_especies')
          .update({ quantidade_plantada: item.quantidade })
          .eq('producao_id', producaoId)
          .eq('especie_id', item.especie_id)

        if (errEsp) throw errEsp
      }

      // Montar diff antes/depois
      const antes: Record<string, any> = { data_plantio: prodAntes?.data_plantio_real }
      const depois: Record<string, any> = { data_plantio: form.data_plantio }
      const quantidadesAntes = (espAntes || []).map((e: any) => ({
        especie_id: e.especie_id,
        nome: e.especies?.nome,
        quantidade: e.quantidade_plantada
      }))
      const quantidadesDepois = form.quantidades.map(q => {
        const ea = quantidadesAntes.find((a: any) => a.especie_id === q.especie_id)
        return { especie_id: q.especie_id, nome: ea?.nome, quantidade: q.quantidade }
      })

      criarLog(producaoId, 'edicao_plantio', { antes: { ...antes, quantidades: quantidadesAntes }, depois: { ...depois, quantidades: quantidadesDepois } })
      toast.success('Dados de plantio atualizados')
      return true
    } catch (e: any) {
      console.error('Erro ao editar plantio:', e)
      toast.error(e.message || 'Erro ao editar plantio')
      return false
    }
  }

  async function editarDadosLuz(producaoId: string, form: RegistroLuzForm): Promise<boolean> {
    try {
      // Capturar dados anteriores
      const { data: prodAntes } = await supabase
        .from('producoes')
        .select('data_luz_real')
        .eq('id', producaoId)
        .single()

      const { data: espAntes } = await supabase
        .from('producao_especies')
        .select('especie_id, quantidade_germinada, perda_germinacao, quantidade_plantada, especies(nome)')
        .eq('producao_id', producaoId)

      const { error: errProd } = await supabase
        .from('producoes')
        .update({ data_luz_real: form.data_luz })
        .eq('id', producaoId)

      if (errProd) throw errProd

      const valoresDepois: any[] = []

      for (const item of form.valores) {
        const espAnt = (espAntes || []).find((e: any) => e.especie_id === item.especie_id)
        const plantada = espAnt?.quantidade_plantada || 0
        const { germinada, perda } = calc.calcularPerdaGerminacao(plantada, item.valor, item.isPerda)

        valoresDepois.push({
          especie_id: item.especie_id,
          nome: espAnt?.especies?.nome,
          germinada,
          perda
        })

        const { error: errEsp } = await supabase
          .from('producao_especies')
          .update({
            quantidade_germinada: germinada,
            perda_germinacao: perda
          })
          .eq('producao_id', producaoId)
          .eq('especie_id', item.especie_id)

        if (errEsp) throw errEsp
      }

      // Montar diff antes/depois
      const valoresAntes = (espAntes || []).map((e: any) => ({
        especie_id: e.especie_id,
        nome: e.especies?.nome,
        germinada: e.quantidade_germinada,
        perda: e.perda_germinacao
      }))

      criarLog(producaoId, 'edicao_luz', {
        antes: { data_luz: prodAntes?.data_luz_real, valores: valoresAntes },
        depois: { data_luz: form.data_luz, valores: valoresDepois }
      })
      toast.success('Dados de germinação atualizados')
      return true
    } catch (e: any) {
      console.error('Erro ao editar luz:', e)
      toast.error(e.message || 'Erro ao editar germinação')
      return false
    }
  }

  // ============================================================
  // Recorrencia
  // ============================================================

  /**
   * Cria um template recorrente e gera as 3 primeiras producoes.
   */
  async function criarRecorrente(form: NovaRecorrenteForm, primeiraProducaoId?: string): Promise<string | null> {
    if (!currentCompany.value?.id) return null

    try {
      const { data: recorrente, error: errRec } = await supabase
        .from('producoes_recorrentes')
        .insert({
          empresa_id: currentCompany.value.id,
          tipo: form.tipo,
          especie_id_1: form.especies[0].especie_id,
          especie_id_2: form.especies.length > 1 ? form.especies[1].especie_id : null,
          lote_semente_id_1: form.especies[0].lote_semente_id || null,
          lote_semente_id_2: form.especies.length > 1 ? (form.especies[1].lote_semente_id || null) : null,
          quantidade: form.quantidade,
          fazenda_id: form.fazenda_id || null,
          intervalo_dias: form.intervalo_dias,
          observacoes: form.observacoes || null
        })
        .select('id')
        .single()

      if (errRec) throw errRec

      // Vincular a primeira producao (se ja criada) ao template
      if (primeiraProducaoId) {
        await supabase
          .from('producoes')
          .update({
            recorrente: true,
            producao_recorrente_id: recorrente.id
          })
          .eq('id', primeiraProducaoId)
      }

      // Gerar producoes futuras para manter janela de 3
      await gerarProducoesRecorrentes(recorrente.id)

      return recorrente.id
    } catch (e: any) {
      console.error('Erro ao criar recorrente:', e)
      toast.error(e.message || 'Erro ao criar produção recorrente')
      return null
    }
  }

  /**
   * Gera producoes para manter a janela deslizante de 3 planejadas.
   */
  async function gerarProducoesRecorrentes(recorrenteId: string): Promise<void> {
    try {
      // Buscar template
      const { data: template } = await supabase
        .from('producoes_recorrentes')
        .select('*')
        .eq('id', recorrenteId)
        .single()

      if (!template || template.status !== 'ativa') return

      // Contar producoes 'planejado' existentes vinculadas
      const { count } = await supabase
        .from('producoes')
        .select('id', { count: 'exact', head: true })
        .eq('producao_recorrente_id', recorrenteId)
        .eq('status', 'planejado')

      const planejadas = count || 0
      const faltam = 3 - planejadas
      if (faltam <= 0) return

      // Buscar a ultima producao gerada (pela data prevista mais recente)
      const { data: ultimaProducao } = await supabase
        .from('producoes')
        .select('data_plantio_prevista')
        .eq('producao_recorrente_id', recorrenteId)
        .order('data_plantio_prevista', { ascending: false })
        .limit(1)
        .single()

      let proximaData: Date
      if (ultimaProducao?.data_plantio_prevista) {
        proximaData = new Date(ultimaProducao.data_plantio_prevista + 'T12:00:00')
        proximaData.setDate(proximaData.getDate() + template.intervalo_dias)
      } else {
        // Primeira geracao: comecar de hoje
        proximaData = new Date()
        proximaData.setHours(12, 0, 0, 0)
      }

      // Gerar producoes faltantes
      for (let i = 0; i < faltam; i++) {
        const dataPlantio = proximaData.toISOString().split('T')[0]

        await criarProducaoFromTemplate(template, dataPlantio, recorrenteId)

        proximaData.setDate(proximaData.getDate() + template.intervalo_dias)
      }

      // Atualizar ultima_geracao
      await supabase
        .from('producoes_recorrentes')
        .update({ ultima_geracao: new Date().toISOString().split('T')[0] })
        .eq('id', recorrenteId)

    } catch (e: any) {
      console.error('Erro ao gerar producoes recorrentes:', e)
    }
  }

  /**
   * Helper: cria uma producao a partir de um template recorrente.
   */
  async function criarProducaoFromTemplate(
    template: any,
    dataPlantio: string,
    recorrenteId: string
  ): Promise<void> {
    const form: NovaProducaoForm = {
      tipo: template.tipo,
      fazenda_id: template.fazenda_id,
      quantidade_planejada: template.quantidade,
      data_plantio_prevista: dataPlantio,
      observacoes: '',
      recorrente: true,
      intervalo_dias: template.intervalo_dias,
      especies: [
        { especie_id: template.especie_id_1, lote_semente_id: template.lote_semente_id_1 },
        ...(template.especie_id_2
          ? [{ especie_id: template.especie_id_2, lote_semente_id: template.lote_semente_id_2 }]
          : [])
      ]
    }

    const producaoId = await criarProducao(form)

    // Vincular ao template (criarProducao nao sabe do recorrente_id)
    if (producaoId) {
      await supabase
        .from('producoes')
        .update({ producao_recorrente_id: recorrenteId, recorrente: true })
        .eq('id', producaoId)
    }
  }

  /**
   * Verifica e gera producoes se necessario apos uma transicao planejado → germinando.
   */
  async function verificarRollingWindow(producaoId: string): Promise<void> {
    try {
      const { data: prod } = await supabase
        .from('producoes')
        .select('producao_recorrente_id')
        .eq('id', producaoId)
        .single()

      if (prod?.producao_recorrente_id) {
        await gerarProducoesRecorrentes(prod.producao_recorrente_id)
      }
    } catch (e: any) {
      console.error('Erro ao verificar rolling window:', e)
    }
  }

  /**
   * Pausa um template recorrente (para de gerar novas).
   */
  async function pausarRecorrente(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('producoes_recorrentes')
        .update({ status: 'pausada' })
        .eq('id', id)

      if (error) throw error
      toast.success('Produção recorrente pausada')
      return true
    } catch (e: any) {
      toast.error(e.message || 'Erro ao pausar recorrente')
      return false
    }
  }

  /**
   * Retoma um template recorrente pausado.
   */
  async function retomarRecorrente(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('producoes_recorrentes')
        .update({ status: 'ativa' })
        .eq('id', id)

      if (error) throw error

      // Gerar producoes para preencher a janela
      await gerarProducoesRecorrentes(id)

      toast.success('Produção recorrente retomada')
      return true
    } catch (e: any) {
      toast.error(e.message || 'Erro ao retomar recorrente')
      return false
    }
  }

  /**
   * Encerra definitivamente um template recorrente.
   */
  async function encerrarRecorrente(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('producoes_recorrentes')
        .update({ status: 'encerrada' })
        .eq('id', id)

      if (error) throw error
      toast.success('Produção recorrente encerrada')
      return true
    } catch (e: any) {
      toast.error(e.message || 'Erro ao encerrar recorrente')
      return false
    }
  }

  /**
   * Edita template recorrente (so afeta producoes futuras).
   */
  async function editarRecorrente(id: string, dados: Partial<{
    quantidade: number
    intervalo_dias: number
    fazenda_id: string | null
    lote_semente_id_1: string | null
    lote_semente_id_2: string | null
    observacoes: string
  }>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('producoes_recorrentes')
        .update(dados)
        .eq('id', id)

      if (error) throw error
      toast.success('Recorrente atualizada')
      return true
    } catch (e: any) {
      toast.error(e.message || 'Erro ao editar recorrente')
      return false
    }
  }

  /**
   * Lista templates recorrentes da empresa.
   */
  async function listarRecorrentes(): Promise<ProducaoRecorrente[]> {
    if (!currentCompany.value?.id) return []

    const { data, error } = await supabase
      .from('producoes_recorrentes')
      .select(`
        *,
        especie1:especies!producoes_recorrentes_especie_id_1_fkey(id, nome, codigo),
        especie2:especies!producoes_recorrentes_especie_id_2_fkey(id, nome, codigo),
        fazendas(id, nome)
      `)
      .eq('empresa_id', currentCompany.value.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao listar recorrentes:', error)
      return []
    }

    return (data || []) as ProducaoRecorrente[]
  }

  /**
   * Atualiza lote de semente de uma especie na producao.
   */
  async function atualizarLoteEspecie(producaoId: string, especieId: string, loteId: string | null): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('producao_especies')
        .update({ lote_semente_id: loteId })
        .eq('producao_id', producaoId)
        .eq('especie_id', especieId)

      if (error) throw error
      toast.success('Lote atualizado')
      return true
    } catch (e: any) {
      toast.error(e.message || 'Erro ao atualizar lote')
      return false
    }
  }

  return {
    // CRUD
    listarProducoes,
    buscarProducao,
    criarProducao,
    editarProducao,
    cancelarProducao,
    // Transicoes
    registrarPlantio,
    registrarLuz,
    registrarColheita,
    finalizarProducao,
    // Recorrencia
    criarRecorrente,
    gerarProducoesRecorrentes,
    verificarRollingWindow,
    pausarRecorrente,
    retomarRecorrente,
    encerrarRecorrente,
    editarRecorrente,
    listarRecorrentes,
    // Helpers
    atualizarLoteEspecie,
    // Logs
    carregarLogs,
    // Edicao
    editarDadosPlantio,
    editarDadosLuz,
    // Log
    criarLog
  }
}
