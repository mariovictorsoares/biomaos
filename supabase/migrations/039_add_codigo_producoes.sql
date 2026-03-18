-- =============================================
-- Migration 039: Adicionar coluna codigo em producoes
-- =============================================

ALTER TABLE producoes ADD COLUMN IF NOT EXISTS codigo VARCHAR(10);

CREATE INDEX IF NOT EXISTS idx_producoes_codigo ON producoes(empresa_id, codigo);
