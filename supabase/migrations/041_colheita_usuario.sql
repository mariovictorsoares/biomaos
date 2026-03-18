-- Adicionar campo de usuario nas colheitas
ALTER TABLE producao_colheitas ADD COLUMN IF NOT EXISTS usuario_email TEXT;
