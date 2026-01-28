-- =============================================
-- BIOMA OS - ATUALIZAÇÃO TABELA PRODUCAO
-- Novo fluxo: Colheita -> Luz -> Plantio
-- Com suporte a edição inline e recorrência
-- =============================================

-- Adicionar novos campos para o fluxo Plantio -> Luz -> Colheita
ALTER TABLE producao
ADD COLUMN IF NOT EXISTS data_plantio_previsto DATE,
ADD COLUMN IF NOT EXISTS data_plantio_real DATE,
ADD COLUMN IF NOT EXISTS data_luz_prevista DATE,
ADD COLUMN IF NOT EXISTS data_luz_real DATE,
ADD COLUMN IF NOT EXISTS quantidade_plantio INTEGER,
ADD COLUMN IF NOT EXISTS quantidade_luz INTEGER,
ADD COLUMN IF NOT EXISTS perda_plantio INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS perda_luz INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS perda_colheita INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS recorrente BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS recorrencia_id UUID;

-- Criar índice para recorrência
CREATE INDEX IF NOT EXISTS idx_producao_recorrencia_id ON producao(recorrencia_id);
CREATE INDEX IF NOT EXISTS idx_producao_recorrente ON producao(recorrente);
CREATE INDEX IF NOT EXISTS idx_producao_data_plantio_previsto ON producao(data_plantio_previsto);
CREATE INDEX IF NOT EXISTS idx_producao_data_luz_prevista ON producao(data_luz_prevista);

-- Renomear data_semeadura para data_plantio_previsto (para manter compatibilidade)
-- Primeiro, copiar os dados existentes
UPDATE producao
SET data_plantio_previsto = data_semeadura
WHERE data_plantio_previsto IS NULL AND data_semeadura IS NOT NULL;

-- Atualizar status para incluir novos valores
ALTER TABLE producao DROP CONSTRAINT IF EXISTS producao_status_check;
ALTER TABLE producao ADD CONSTRAINT producao_status_check
  CHECK (status IN ('planejado', 'em_plantio', 'em_luz', 'em_colheita', 'colhido', 'cancelado', 'finalizado'));

-- Migrar status antigos para novos
UPDATE producao SET status = 'em_plantio' WHERE status = 'em_andamento';

-- Comentários nas colunas para documentação
COMMENT ON COLUMN producao.data_plantio_previsto IS 'Data prevista para o plantio (calculada a partir da colheita)';
COMMENT ON COLUMN producao.data_plantio_real IS 'Data real em que o plantio foi realizado';
COMMENT ON COLUMN producao.data_luz_prevista IS 'Data prevista para ir para a luz (calculada)';
COMMENT ON COLUMN producao.data_luz_real IS 'Data real em que foi para a luz';
COMMENT ON COLUMN producao.quantidade_plantio IS 'Quantidade de bandejas no plantio realizado';
COMMENT ON COLUMN producao.quantidade_luz IS 'Quantidade de bandejas após fase de luz';
COMMENT ON COLUMN producao.perda_plantio IS 'Perdas durante o plantio';
COMMENT ON COLUMN producao.perda_luz IS 'Perdas durante a fase de luz';
COMMENT ON COLUMN producao.perda_colheita IS 'Perdas durante a colheita';
COMMENT ON COLUMN producao.recorrente IS 'Se este plano faz parte de uma recorrência';
COMMENT ON COLUMN producao.recorrencia_id IS 'ID que agrupa planos da mesma recorrência';

-- Função para calcular datas baseado na data de colheita
CREATE OR REPLACE FUNCTION calcular_datas_producao(
  p_data_colheita DATE,
  p_tempo_germinacao INTEGER,
  p_tempo_luz INTEGER
) RETURNS TABLE (
  data_plantio DATE,
  data_luz DATE
) AS $$
BEGIN
  -- Data de luz = Colheita - tempo_luz
  data_luz := p_data_colheita - p_tempo_luz;
  -- Data de plantio = Data de luz - tempo_germinacao
  data_plantio := data_luz - p_tempo_germinacao;

  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calcular_datas_producao IS 'Calcula as datas de plantio e luz baseado na data de colheita desejada';
