-- =============================================
-- BIOMA OS - Modalidade em Produtos + Percentual no MIX
-- Vivo = vendido na bandeja (unidade/bandeja)
-- Cortado = colhido e vendido por peso (gramas)
-- =============================================

-- Adicionar modalidade e peso nos produtos
ALTER TABLE produtos
ADD COLUMN IF NOT EXISTS modalidade VARCHAR(10) DEFAULT 'cortado'
  CHECK (modalidade IN ('vivo', 'cortado')),
ADD COLUMN IF NOT EXISTS peso_gramas DECIMAL(10,2);

COMMENT ON COLUMN produtos.modalidade IS 'Modalidade de venda: vivo (bandeja plantada) ou cortado (colhido em gramas)';
COMMENT ON COLUMN produtos.peso_gramas IS 'Peso da embalagem em gramas (obrigatório para cortado)';

-- Adicionar percentual na tabela de relacionamento produto-espécies (para MIX)
ALTER TABLE produto_especies
ADD COLUMN IF NOT EXISTS percentual DECIMAL(5,2);

COMMENT ON COLUMN produto_especies.percentual IS 'Proporção da espécie no MIX (ex: 40.00 = 40%). Soma deve = 100%';
