-- =============================================
-- BIOMA OS - ESTOQUE POR ESPÉCIE
-- Adicionar suporte a especie_id nas tabelas de estoque
-- e vincular movimentações à produção
-- =============================================

-- =============================================
-- 1. ATUALIZAR TABELA ESTOQUE
-- =============================================

-- Adicionar coluna especie_id (opcional, para compatibilidade)
ALTER TABLE estoque
ADD COLUMN IF NOT EXISTS especie_id UUID REFERENCES especies(id) ON DELETE CASCADE;

-- Tornar produto_id opcional (pode ser NULL se for estoque por espécie)
ALTER TABLE estoque
ALTER COLUMN produto_id DROP NOT NULL;

-- Criar índice para especie_id
CREATE INDEX IF NOT EXISTS idx_estoque_especie_id ON estoque(especie_id);

-- Remover constraint única antiga e criar nova que permite estoque por espécie OU produto
ALTER TABLE estoque DROP CONSTRAINT IF EXISTS estoque_empresa_id_produto_id_key;

-- Criar constraint única composta (permite NULL em produto_id ou especie_id)
-- Um registro de estoque pode ser por produto OU por espécie, não ambos obrigatórios
CREATE UNIQUE INDEX IF NOT EXISTS idx_estoque_empresa_especie_unique
ON estoque(empresa_id, especie_id)
WHERE especie_id IS NOT NULL AND produto_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_estoque_empresa_produto_unique
ON estoque(empresa_id, produto_id)
WHERE produto_id IS NOT NULL;

-- =============================================
-- 2. ATUALIZAR TABELA MOVIMENTACOES_ESTOQUE
-- =============================================

-- Adicionar coluna especie_id
ALTER TABLE movimentacoes_estoque
ADD COLUMN IF NOT EXISTS especie_id UUID REFERENCES especies(id) ON DELETE CASCADE;

-- Adicionar coluna producao_id para rastreabilidade
ALTER TABLE movimentacoes_estoque
ADD COLUMN IF NOT EXISTS producao_id UUID REFERENCES producao(id) ON DELETE SET NULL;

-- Tornar produto_id opcional
ALTER TABLE movimentacoes_estoque
ALTER COLUMN produto_id DROP NOT NULL;

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_movimentacoes_estoque_especie_id ON movimentacoes_estoque(especie_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_estoque_producao_id ON movimentacoes_estoque(producao_id);

-- =============================================
-- 3. COMENTÁRIOS PARA DOCUMENTAÇÃO
-- =============================================

COMMENT ON COLUMN estoque.especie_id IS 'ID da espécie para estoque por espécie (alternativo a produto_id)';
COMMENT ON COLUMN movimentacoes_estoque.especie_id IS 'ID da espécie para movimentação por espécie';
COMMENT ON COLUMN movimentacoes_estoque.producao_id IS 'ID da produção que originou esta movimentação (para rastreabilidade)';

-- =============================================
-- 4. FUNÇÃO PARA REGISTRAR ENTRADA DE COLHEITA
-- =============================================

CREATE OR REPLACE FUNCTION registrar_colheita_estoque(
  p_empresa_id UUID,
  p_especie_id UUID,
  p_producao_id UUID,
  p_quantidade DECIMAL(12,2),
  p_usuario_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_estoque_id UUID;
  v_quantidade_anterior DECIMAL(12,2);
  v_movimentacao_id UUID;
BEGIN
  -- Buscar ou criar registro de estoque para a espécie
  SELECT id, quantidade INTO v_estoque_id, v_quantidade_anterior
  FROM estoque
  WHERE empresa_id = p_empresa_id AND especie_id = p_especie_id AND produto_id IS NULL;

  IF v_estoque_id IS NULL THEN
    -- Criar novo registro de estoque
    INSERT INTO estoque (empresa_id, especie_id, quantidade)
    VALUES (p_empresa_id, p_especie_id, p_quantidade)
    RETURNING id INTO v_estoque_id;

    v_quantidade_anterior := 0;
  ELSE
    -- Atualizar estoque existente
    UPDATE estoque
    SET quantidade = quantidade + p_quantidade,
        updated_at = NOW()
    WHERE id = v_estoque_id;
  END IF;

  -- Registrar movimentação
  INSERT INTO movimentacoes_estoque (
    empresa_id,
    especie_id,
    producao_id,
    tipo,
    quantidade,
    quantidade_anterior,
    quantidade_nova,
    motivo,
    usuario_id
  ) VALUES (
    p_empresa_id,
    p_especie_id,
    p_producao_id,
    'entrada',
    p_quantidade,
    v_quantidade_anterior,
    v_quantidade_anterior + p_quantidade,
    'producao',
    p_usuario_id
  ) RETURNING id INTO v_movimentacao_id;

  RETURN v_movimentacao_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION registrar_colheita_estoque IS 'Registra entrada no estoque a partir de uma colheita de produção';
