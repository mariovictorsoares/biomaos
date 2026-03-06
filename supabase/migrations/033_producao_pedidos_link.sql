-- =============================================
-- BIOMA OS - Vincular Produção a Pedidos
-- Permite rastrear qual pedido gerou qual produção
-- =============================================

-- Tornar especie_id nullable (para Vivo MIX onde especie_id = NULL)
ALTER TABLE producao ALTER COLUMN especie_id DROP NOT NULL;

-- Adicionar campo de origem e produto_id
ALTER TABLE producao
ADD COLUMN IF NOT EXISTS origem VARCHAR(20) DEFAULT 'manual'
  CHECK (origem IN ('manual', 'pedido')),
ADD COLUMN IF NOT EXISTS produto_id UUID REFERENCES produtos(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_producao_produto_id ON producao(produto_id);
CREATE INDEX IF NOT EXISTS idx_producao_origem ON producao(origem);

COMMENT ON COLUMN producao.origem IS 'Origem da produção: manual ou gerada a partir de pedido';
COMMENT ON COLUMN producao.produto_id IS 'Produto associado (para rastreabilidade e vivo MIX)';

-- =============================================
-- Tabela de vínculo Produção <-> Pedido Itens (N:N)
-- =============================================
CREATE TABLE IF NOT EXISTS producao_pedidos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  producao_id UUID NOT NULL REFERENCES producao(id) ON DELETE CASCADE,
  pedido_item_id UUID NOT NULL REFERENCES pedido_itens(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(producao_id, pedido_item_id)
);

CREATE INDEX IF NOT EXISTS idx_producao_pedidos_producao_id ON producao_pedidos(producao_id);
CREATE INDEX IF NOT EXISTS idx_producao_pedidos_pedido_item_id ON producao_pedidos(pedido_item_id);

COMMENT ON TABLE producao_pedidos IS 'Vínculo entre registros de produção e itens de pedido';
