-- Migration: Criar tabela embalagens
-- Embalagens gerenciáveis por empresa (ex: Bandeja 200g, Saco 500g, etc.)

CREATE TABLE IF NOT EXISTS embalagens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nome VARCHAR(100) NOT NULL,
  valor_unitario DECIMAL(10,2) NOT NULL DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(empresa_id, nome)
);

CREATE INDEX IF NOT EXISTS idx_embalagens_empresa_id ON embalagens(empresa_id);

-- Adicionar campo embalagem_id na tabela produtos
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS embalagem_id UUID REFERENCES embalagens(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_produtos_embalagem_id ON produtos(embalagem_id);
