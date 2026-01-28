-- =============================================
-- BIOMA OS - ATUALIZACAO TABELA PEDIDOS
-- Adiciona campos extras para gestao completa de pedidos
-- =============================================

-- Adicionar campo responsavel
ALTER TABLE pedidos
ADD COLUMN IF NOT EXISTS responsavel VARCHAR(255);

-- Adicionar campo tabela_preco_id (se nao existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pedidos' AND column_name = 'tabela_preco_id'
  ) THEN
    ALTER TABLE pedidos ADD COLUMN tabela_preco_id UUID REFERENCES tabelas_preco(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Adicionar campos de entrega
ALTER TABLE pedidos
ADD COLUMN IF NOT EXISTS logistica VARCHAR(50),
ADD COLUMN IF NOT EXISTS documento VARCHAR(50),
ADD COLUMN IF NOT EXISTS valor_frete DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS tipo VARCHAR(50),
ADD COLUMN IF NOT EXISTS nota_fiscal VARCHAR(100),
ADD COLUMN IF NOT EXISTS valor_nf DECIMAL(12,2);

-- Criar indice para tabela_preco_id
CREATE INDEX IF NOT EXISTS idx_pedidos_tabela_preco_id ON pedidos(tabela_preco_id);

-- Comentarios nas colunas
COMMENT ON COLUMN pedidos.responsavel IS 'Nome do responsavel pelo pedido';
COMMENT ON COLUMN pedidos.tabela_preco_id IS 'Referencia para tabela de precos utilizada';
COMMENT ON COLUMN pedidos.logistica IS 'Tipo de logistica: transporte, retirada, correios';
COMMENT ON COLUMN pedidos.documento IS 'Tipo de documento: nf, boleto, recibo';
COMMENT ON COLUMN pedidos.valor_frete IS 'Valor do frete';
COMMENT ON COLUMN pedidos.tipo IS 'Tipo do pedido: venda, consignacao, bonificacao';
COMMENT ON COLUMN pedidos.nota_fiscal IS 'Numero da nota fiscal';
COMMENT ON COLUMN pedidos.valor_nf IS 'Valor da nota fiscal';
