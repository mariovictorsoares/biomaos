-- Adicionar campos de cancelamento na tabela movimentacoes_estoque
ALTER TABLE movimentacoes_estoque
ADD COLUMN IF NOT EXISTS cancelado BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS cancelado_em TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cancelado_por UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS motivo_cancelamento TEXT;

-- Criar index para filtrar movimentacoes canceladas
CREATE INDEX IF NOT EXISTS idx_movimentacoes_estoque_cancelado ON movimentacoes_estoque(cancelado);

-- Comentarios
COMMENT ON COLUMN movimentacoes_estoque.cancelado IS 'Indica se a movimentacao foi cancelada';
COMMENT ON COLUMN movimentacoes_estoque.cancelado_em IS 'Data e hora do cancelamento';
COMMENT ON COLUMN movimentacoes_estoque.cancelado_por IS 'Usuario que cancelou a movimentacao';
COMMENT ON COLUMN movimentacoes_estoque.motivo_cancelamento IS 'Motivo do cancelamento da movimentacao';
