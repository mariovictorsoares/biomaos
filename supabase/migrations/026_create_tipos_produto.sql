-- Migration: Criar tabela tipos_produto
-- Tipos de produto gerenciáveis por empresa (ex: Bandeja, Saco, Caixa, etc.)

CREATE TABLE IF NOT EXISTS tipos_produto (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nome VARCHAR(100) NOT NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(empresa_id, nome)
);

CREATE INDEX IF NOT EXISTS idx_tipos_produto_empresa_id ON tipos_produto(empresa_id);

-- Adicionar campo tipo_produto_id na tabela produtos
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS tipo_produto_id UUID REFERENCES tipos_produto(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_produtos_tipo_produto_id ON produtos(tipo_produto_id);
