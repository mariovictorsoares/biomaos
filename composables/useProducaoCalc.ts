interface Especie {
  id: string
  tempo_germinacao?: number | null
  tempo_luz?: number | null
  vida_util_dias?: number | null
  tempo_buffer_colheita?: number | null
}

interface Lote {
  id: string
  rendimento_por_bandeja?: number | null
  densidade_semeadura?: number | null
  margem_seguranca?: number | null
  eficiencia?: number | null
}

interface EtapaCultivo {
  nome: string
  ordem: number
  duracao_dias: number
}

interface EspecieMix {
  especie: Especie
  lote: Lote
  percentual: number
  etapas?: EtapaCultivo[]
}

interface ResultadoBandejas {
  especie_id: string | null
  especie_nome?: string
  bandejas: number
  gramas_necessarias?: number
  semente_necessaria?: number
}

interface EtapaComDatas {
  nome: string
  ordem: number
  duracao_dias: number
  data_inicio: string
  data_fim: string
}

export function useProducaoCalc() {

  /**
   * Calcula tempo total de cultivo usando etapas customizadas ou campos legados
   */
  function tempoTotalCultivo(etapas: EtapaCultivo[] | null, especie?: Especie): number {
    if (etapas && etapas.length > 0) {
      return etapas.reduce((total, e) => total + e.duracao_dias, 0)
    }
    // Fallback: campos legados
    if (especie) {
      return (especie.tempo_germinacao || 0) + (especie.tempo_luz || 0)
    }
    return 0
  }

  /**
   * Calcula datas das etapas de forma reversa a partir da data de colheita
   */
  function calcularDatasEtapas(
    dataColheita: string,
    etapas: EtapaCultivo[] | null,
    especie?: Especie
  ): EtapaComDatas[] {
    const colheita = new Date(dataColheita + 'T12:00:00')

    const etapasOrdenadas = etapas && etapas.length > 0
      ? [...etapas].sort((a, b) => a.ordem - b.ordem)
      : criarEtapasLegadas(especie)

    if (etapasOrdenadas.length === 0) return []

    const resultado: EtapaComDatas[] = []
    let dataFim = new Date(colheita)

    for (let i = etapasOrdenadas.length - 1; i >= 0; i--) {
      const etapa = etapasOrdenadas[i]
      const fim = new Date(dataFim)
      const inicio = new Date(fim)
      inicio.setDate(inicio.getDate() - etapa.duracao_dias)

      resultado.unshift({
        nome: etapa.nome,
        ordem: etapa.ordem,
        duracao_dias: etapa.duracao_dias,
        data_inicio: formatDateISO(inicio),
        data_fim: formatDateISO(fim)
      })

      dataFim = inicio
    }

    return resultado
  }

  /**
   * Calcula data de inicio do plantio a partir da data de colheita
   */
  function calcularDataPlantio(
    dataColheita: string,
    etapas: EtapaCultivo[] | null,
    especie?: Especie
  ): string {
    const total = tempoTotalCultivo(etapas, especie)
    const buffer = especie?.tempo_buffer_colheita ?? 0
    const colheita = new Date(dataColheita + 'T12:00:00')
    colheita.setDate(colheita.getDate() - total - buffer)
    return formatDateISO(colheita)
  }

  /**
   * Calcula data de validade a partir da data de colheita
   */
  function calcularDataValidade(dataColheita: string, especie: Especie): string | null {
    if (!especie.vida_util_dias) return null
    const colheita = new Date(dataColheita + 'T12:00:00')
    colheita.setDate(colheita.getDate() + especie.vida_util_dias)
    return formatDateISO(colheita)
  }

  /**
   * Calcula bandejas para produto single (vivo ou cortado)
   * Agora recebe Lote em vez de Especie para dados numericos
   */
  function calcularBandejas(
    quantidade: number,
    lote: Lote,
    modalidade: 'vivo' | 'cortado',
    pesoGramas?: number | null,
    unidadeProduto?: string,
    unidadesPorBandeja?: number
  ): number {
    const margem = lote.margem_seguranca || 0

    if (modalidade === 'vivo') {
      if (unidadeProduto === 'und' && unidadesPorBandeja && unidadesPorBandeja > 0) {
        return Math.ceil((quantidade / unidadesPorBandeja) * (1 + margem))
      }
      return Math.ceil(quantidade * (1 + margem))
    }

    // Cortado: precisa de rendimento do lote
    const rendimento = lote.rendimento_por_bandeja
    if (!rendimento || rendimento <= 0 || !pesoGramas) return 0

    const gramasTotal = quantidade * pesoGramas
    return Math.ceil((gramasTotal / rendimento) * (1 + margem))
  }

  /**
   * Calcula bandejas para produto MIX cortado (1 resultado por especie)
   * Cada especie no mix agora traz seu proprio lote
   */
  function calcularBandejasMix(
    quantidade: number,
    pesoGramas: number,
    especiesMix: EspecieMix[]
  ): ResultadoBandejas[] {
    const gramasTotal = quantidade * pesoGramas

    return especiesMix.map(({ especie, lote, percentual }) => {
      const gramasEspecie = gramasTotal * (percentual / 100)
      const rendimento = lote.rendimento_por_bandeja
      const margem = lote.margem_seguranca || 0

      if (!rendimento || rendimento <= 0) {
        return {
          especie_id: especie.id,
          bandejas: 0,
          gramas_necessarias: gramasEspecie,
          semente_necessaria: 0
        }
      }

      const bandejas = Math.ceil((gramasEspecie / rendimento) * (1 + margem))
      return {
        especie_id: especie.id,
        bandejas,
        gramas_necessarias: gramasEspecie,
        semente_necessaria: calcularSementeNecessaria(bandejas, lote)
      }
    })
  }

  /**
   * Calcula bandejas para produto MIX vivo (todas especies compartilham bandeja)
   */
  function calcularBandejasMixVivo(
    quantidade: number,
    margemMaior: number,
    unidadeProduto?: string,
    unidadesPorBandeja?: number
  ): number {
    if (unidadeProduto === 'und' && unidadesPorBandeja && unidadesPorBandeja > 0) {
      return Math.ceil((quantidade / unidadesPorBandeja) * (1 + margemMaior))
    }
    return Math.ceil(quantidade * (1 + margemMaior))
  }

  /**
   * Calcula gramas de semente necessarias
   */
  function calcularSementeNecessaria(bandejas: number, lote: Lote): number {
    if (!lote.densidade_semeadura || lote.densidade_semeadura <= 0) return 0
    return bandejas * lote.densidade_semeadura
  }

  /**
   * Calcula rendimento esperado em gramas
   */
  function calcularRendimentoEsperado(bandejas: number, lote: Lote): number {
    if (!lote.rendimento_por_bandeja || lote.rendimento_por_bandeja <= 0) return 0
    return bandejas * lote.rendimento_por_bandeja
  }

  /**
   * Para vivo MIX: pega a maior margem de seguranca entre os lotes
   */
  function maiorMargem(lotes: Lote[]): number {
    return Math.max(...lotes.map(l => l.margem_seguranca || 0), 0)
  }

  /**
   * Para vivo MIX: pega o maior tempo total de cultivo entre as especies
   */
  function maiorTempoCultivo(especiesComEtapas: { especie: Especie, etapas: EtapaCultivo[] | null }[]): number {
    return Math.max(
      ...especiesComEtapas.map(({ especie, etapas }) => tempoTotalCultivo(etapas, especie)),
      0
    )
  }

  /**
   * Calcula bandejas para plano de producao manual (baseado em unidades).
   * Diferente de calcularBandejas que é orientado a produto (vivo/cortado).
   */
  function calcularBandejasPlano(
    quantidadeUnidades: number,
    unidadesPorBandeja: number,
    margem: number
  ): number {
    if (unidadesPorBandeja <= 0) return 0
    return Math.ceil((quantidadeUnidades / unidadesPorBandeja) * (1 + margem))
  }

  // ============================================================
  // Novo modulo de producao — funcoes adicionais
  // ============================================================

  /**
   * Calcula datas previstas da producao (pra frente a partir da data de plantio).
   * Usa tempos do lote de semente (com fallback para especie).
   */
  function calcularDatasProducao(
    dataPlantio: string,
    tempoGerminacao: number,
    tempoLuz: number
  ): { data_plantio_prevista: string; data_luz_prevista: string; data_colheita_prevista: string } {
    const plantio = new Date(dataPlantio + 'T12:00:00')

    const luz = new Date(plantio)
    luz.setDate(luz.getDate() + tempoGerminacao)

    const colheita = new Date(luz)
    colheita.setDate(colheita.getDate() + tempoLuz)

    return {
      data_plantio_prevista: formatDateISO(plantio),
      data_luz_prevista: formatDateISO(luz),
      data_colheita_prevista: formatDateISO(colheita)
    }
  }

  /**
   * Verifica se uma producao esta atrasada baseado no status atual e datas previstas.
   * Retorna dias de atraso (>0 = atrasado, 0 = no prazo).
   */
  function calcularAtraso(
    status: string,
    datasReais: { data_plantio_real?: string | null; data_luz_real?: string | null },
    datasPrevistas: { data_plantio_prevista?: string | null; data_luz_prevista?: string | null; data_colheita_prevista?: string | null }
  ): { atrasado: boolean; diasAtraso: number; etapaAtrasada: string | null } {
    const hoje = new Date()
    hoje.setHours(12, 0, 0, 0)

    let dataPrevista: Date | null = null
    let etapa: string | null = null

    if (status === 'planejado' && datasPrevistas.data_plantio_prevista) {
      dataPrevista = new Date(datasPrevistas.data_plantio_prevista + 'T12:00:00')
      etapa = 'plantio'
    } else if (status === 'germinando' && datasPrevistas.data_luz_prevista) {
      dataPrevista = new Date(datasPrevistas.data_luz_prevista + 'T12:00:00')
      etapa = 'luz'
    } else if ((status === 'luz' || status === 'colhendo') && datasPrevistas.data_colheita_prevista) {
      dataPrevista = new Date(datasPrevistas.data_colheita_prevista + 'T12:00:00')
      etapa = 'colheita'
    }

    if (!dataPrevista) {
      return { atrasado: false, diasAtraso: 0, etapaAtrasada: null }
    }

    const diff = Math.floor((hoje.getTime() - dataPrevista.getTime()) / (1000 * 60 * 60 * 24))

    return {
      atrasado: diff > 0,
      diasAtraso: Math.max(0, diff),
      etapaAtrasada: diff > 0 ? etapa : null
    }
  }

  /**
   * Calcula perda de germinacao.
   * O usuario informa perda OU germinadas, e o sistema calcula o outro valor.
   */
  function calcularPerdaGerminacao(
    plantada: number,
    valor: number,
    isPerda: boolean
  ): { germinada: number; perda: number } {
    if (isPerda) {
      return { germinada: plantada - valor, perda: valor }
    }
    return { germinada: valor, perda: plantada - valor }
  }

  /**
   * Calcula perda final na finalizacao: germinada - total colhido.
   */
  function calcularPerdaFinal(germinada: number, totalColhido: number): number {
    return Math.max(0, germinada - totalColhido)
  }

  // --- Helpers internos ---

  function criarEtapasLegadas(especie?: Especie): EtapaCultivo[] {
    if (!especie) return []
    const etapas: EtapaCultivo[] = []
    if (especie.tempo_germinacao && especie.tempo_germinacao > 0) {
      etapas.push({ nome: 'Germinação', ordem: 1, duracao_dias: especie.tempo_germinacao })
    }
    if (especie.tempo_luz && especie.tempo_luz > 0) {
      etapas.push({ nome: 'Sob Luz', ordem: 2, duracao_dias: especie.tempo_luz })
    }
    return etapas
  }

  function formatDateISO(date: Date): string {
    return date.toISOString().split('T')[0]
  }

  return {
    tempoTotalCultivo,
    calcularDatasEtapas,
    calcularDataPlantio,
    calcularDataValidade,
    calcularBandejas,
    calcularBandejasMix,
    calcularBandejasMixVivo,
    calcularSementeNecessaria,
    calcularRendimentoEsperado,
    maiorMargem,
    maiorTempoCultivo,
    calcularBandejasPlano,
    // Novo modulo
    calcularDatasProducao,
    calcularAtraso,
    calcularPerdaGerminacao,
    calcularPerdaFinal
  }
}
