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
    const colheita = new Date(dataColheita + 'T12:00:00')
    colheita.setDate(colheita.getDate() - total)
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
    maiorTempoCultivo
  }
}
