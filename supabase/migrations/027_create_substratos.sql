-- Migration: Criar tabela substratos
-- Substratos gerenciáveis por empresa (ex: Turfa, Fibra de Coco, etc.)

CREATE TABLE IF NOT EXISTS substratos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nome VARCHAR(100) NOT NULL,
  valor_unitario DECIMAL(10,2) NOT NULL DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(empresa_id, nome)
);

CREATE INDEX IF NOT EXISTS idx_substratos_empresa_id ON substratos(empresa_id);

-- Adicionar campo substrato_id na tabela produtos
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS substrato_id UUID REFERENCES substratos(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_produtos_substrato_id ON produtos(substrato_id);
