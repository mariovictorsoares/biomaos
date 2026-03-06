-- Migration: Adicionar suporte a MIX de espécies em produtos
-- Um produto pode ter uma espécie (simples) ou múltiplas espécies (MIX)

-- Adicionar campo is_mix ao produto
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS is_mix BOOLEAN DEFAULT false;

-- Criar tabela de relacionamento N:N entre produtos e espécies
CREATE TABLE IF NOT EXISTS produto_especies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  especie_id UUID NOT NULL REFERENCES especies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(produto_id, especie_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_produto_especies_produto_id ON produto_especies(produto_id);
CREATE INDEX IF NOT EXISTS idx_produto_especies_especie_id ON produto_especies(especie_id);

-- Migrar dados existentes: se o produto já tem especie_id, criar registro na tabela de relacionamento
INSERT INTO produto_especies (produto_id, especie_id)
SELECT id, especie_id FROM produtos WHERE especie_id IS NOT NULL
ON CONFLICT (produto_id, especie_id) DO NOTHING;
