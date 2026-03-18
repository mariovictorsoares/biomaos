// ============================================================
// Tipos do novo modulo de producao
// ============================================================

export type ProducaoTipo = 'simples' | 'mix'

export type ProducaoStatus =
  | 'planejado'
  | 'germinando'
  | 'luz'
  | 'colhendo'
  | 'finalizado'
  | 'cancelado'

export type RecorrenteStatus = 'ativa' | 'pausada' | 'encerrada'

// --- Entidades do banco ---

export interface Producao {
  id: string
  empresa_id: string
  tipo: ProducaoTipo
  fazenda_id: string | null
  quantidade_planejada: number
  recorrente: boolean
  producao_recorrente_id: string | null
  status: ProducaoStatus
  data_planejado: string
  data_germinando: string | null
  data_luz: string | null
  data_colhendo: string | null
  data_finalizado: string | null
  data_cancelado: string | null
  data_plantio_prevista: string | null
  data_luz_prevista: string | null
  data_colheita_prevista: string | null
  data_plantio_real: string | null
  data_luz_real: string | null
  observacoes: string | null
  created_at: string
  updated_at: string
}

export interface ProducaoEspecie {
  id: string
  producao_id: string
  especie_id: string
  lote_semente_id: string | null
  quantidade_planejada: number
  quantidade_plantada: number | null
  quantidade_germinada: number | null
  perda_germinacao: number
  total_colhido: number
  perda_final: number
  data_plantio_prevista: string | null
  data_luz_prevista: string | null
  // Joins
  especies?: {
    id: string
    nome: string
    codigo: string
    tempo_germinacao: number | null
    tempo_luz: number | null
    vida_util_dias: number | null
    tempo_buffer_colheita: number | null
  }
  lotes_sementes?: {
    id: string
    numero: string
    tempo_germinacao: number | null
    tempo_luz: number | null
    rendimento_por_bandeja: number | null
    densidade_semeadura: number | null
    margem_seguranca: number | null
  }
}

export interface ProducaoColheita {
  id: string
  producao_id: string
  especie_id: string
  data_colheita: string
  quantidade: number
  observacoes: string | null
  created_at: string
  // Join
  especies?: {
    id: string
    nome: string
    codigo: string
  }
}

export interface ProducaoLog {
  id: string
  producao_id: string
  usuario_id: string
  usuario_email: string | null
  acao: string
  dados: Record<string, any>
  created_at: string
}

export interface ProducaoRecorrente {
  id: string
  empresa_id: string
  tipo: ProducaoTipo
  especie_id_1: string
  especie_id_2: string | null
  lote_semente_id_1: string | null
  lote_semente_id_2: string | null
  quantidade: number
  fazenda_id: string | null
  intervalo_dias: number
  status: RecorrenteStatus
  ultima_geracao: string | null
  observacoes: string | null
  created_at: string
  updated_at: string
  // Joins
  especie1?: { id: string; nome: string; codigo: string }
  especie2?: { id: string; nome: string; codigo: string }
  fazendas?: { id: string; nome: string }
}

// --- Tipos compostos (com joins) ---

export interface ProducaoCompleta extends Producao {
  producao_especies: ProducaoEspecie[]
  producao_colheitas?: ProducaoColheita[]
  producao_logs?: ProducaoLog[]
  fazendas?: { id: string; nome: string; codigo: string } | null
  producoes_recorrentes?: { id: string; intervalo_dias: number } | null
}

// --- Forms ---

export interface NovaProducaoForm {
  tipo: ProducaoTipo
  fazenda_id: string | null
  quantidade_planejada: number
  data_plantio_prevista: string
  observacoes: string
  // Especies (1 ou 2)
  especies: Array<{
    especie_id: string
    lote_semente_id: string | null
  }>
  // Recorrencia (opcional)
  recorrente: boolean
  intervalo_dias: number | null
}

export interface RegistroPlantioForm {
  data_plantio: string
  quantidades: Array<{
    especie_id: string
    quantidade: number
  }>
}

export interface RegistroLuzForm {
  data_luz: string
  valores: Array<{
    especie_id: string
    valor: number
    isPerda: boolean // true = informou perda, false = informou germinadas
  }>
}

export interface RegistroColheitaForm {
  data_colheita: string
  colheitas: Array<{
    especie_id: string
    quantidade: number
  }>
  observacoes: string
}

export interface NovaRecorrenteForm {
  tipo: ProducaoTipo
  fazenda_id: string | null
  quantidade: number
  intervalo_dias: number
  observacoes: string
  especies: Array<{
    especie_id: string
    lote_semente_id: string | null
  }>
}

// --- Filtros ---

export interface ProducaoFiltros {
  status?: ProducaoStatus | null
  fazenda_id?: string | null
  especie_id?: string | null
  busca?: string
  data_inicio?: string | null
  data_fim?: string | null
}

// --- Helpers ---

export const PRODUCAO_STATUS_CONFIG: Record<ProducaoStatus, { label: string; cor: string; icon: string }> = {
  planejado: { label: 'Planejado', cor: 'blue', icon: 'event_note' },
  germinando: { label: 'Germinando', cor: 'amber', icon: 'grass' },
  luz: { label: 'Luz', cor: 'emerald', icon: 'wb_sunny' },
  colhendo: { label: 'Colhendo', cor: 'orange', icon: 'content_cut' },
  finalizado: { label: 'Finalizado', cor: 'green', icon: 'check_circle' },
  cancelado: { label: 'Cancelado', cor: 'red', icon: 'cancel' },
}

export const RECORRENTE_STATUS_CONFIG: Record<RecorrenteStatus, { label: string; cor: string }> = {
  ativa: { label: 'Ativa', cor: 'green' },
  pausada: { label: 'Pausada', cor: 'amber' },
  encerrada: { label: 'Encerrada', cor: 'gray' },
}
