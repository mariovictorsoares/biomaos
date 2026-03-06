-- Migration: Adicionar campo codigo na tabela tipos_produto
-- Para permitir códigos curtos como "100g", "BP", "BG" ao invés de nomes completos

ALTER TABLE tipos_produto ADD COLUMN IF NOT EXISTS codigo VARCHAR(20);

-- Criar índice único para empresa_id + codigo
CREATE UNIQUE INDEX IF NOT EXISTS idx_tipos_produto_empresa_codigo
  ON tipos_produto(empresa_id, codigo)
  WHERE codigo IS NOT NULL;
