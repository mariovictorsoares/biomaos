-- =============================================
-- BIOMA OS - SISTEMA DE ENVIO DE CONTRATOS POR E-MAIL
-- Migration: 023_contratos_email_system.sql
-- =============================================

-- 1. Adicionar campos para controle de envio de e-mail
ALTER TABLE contratos
ADD COLUMN IF NOT EXISTS chave_acesso VARCHAR(10);

ALTER TABLE contratos
ADD COLUMN IF NOT EXISTS email_enviado_em TIMESTAMPTZ;

ALTER TABLE contratos
ADD COLUMN IF NOT EXISTS email_enviado_para VARCHAR(255);

-- 2. Criar indice unico para chave de acesso (apenas para chaves nao nulas)
CREATE UNIQUE INDEX IF NOT EXISTS idx_contratos_chave_acesso
  ON contratos(chave_acesso) WHERE chave_acesso IS NOT NULL;

-- 3. Comentarios para documentacao
COMMENT ON COLUMN contratos.chave_acesso IS 'Chave unica de 5 caracteres para acesso publico ao contrato';
COMMENT ON COLUMN contratos.email_enviado_em IS 'Data e hora do ultimo envio de e-mail do contrato';
COMMENT ON COLUMN contratos.email_enviado_para IS 'E-mail do destinatario do ultimo envio';

-- 4. Funcao para gerar chave de acesso aleatoria
CREATE OR REPLACE FUNCTION generate_contrato_access_key()
RETURNS VARCHAR(5) AS $$
DECLARE
  chars VARCHAR := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result VARCHAR := '';
  i INTEGER;
BEGIN
  FOR i IN 1..5 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_contrato_access_key() IS 'Gera chave de acesso de 5 caracteres sem caracteres ambiguos (0, O, 1, I)';

-- 5. Adicionar campo para registro de aceite do contrato
ALTER TABLE contratos
ADD COLUMN IF NOT EXISTS aceito_em TIMESTAMPTZ;

COMMENT ON COLUMN contratos.aceito_em IS 'Data e hora em que o cliente aceitou o contrato';

-- 6. Adicionar campos de controle de entregas (caso nao existam)
ALTER TABLE contratos
ADD COLUMN IF NOT EXISTS total_entregas INTEGER DEFAULT 0;

ALTER TABLE contratos
ADD COLUMN IF NOT EXISTS entregas_realizadas INTEGER DEFAULT 0;

COMMENT ON COLUMN contratos.total_entregas IS 'Total de entregas previstas no contrato';
COMMENT ON COLUMN contratos.entregas_realizadas IS 'Quantidade de entregas ja realizadas';

-- 8. Funcao para incrementar entregas realizadas
CREATE OR REPLACE FUNCTION increment_entregas_realizadas(contrato_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE contratos
  SET entregas_realizadas = COALESCE(entregas_realizadas, 0) + 1
  WHERE id = contrato_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Funcao para decrementar entregas realizadas
CREATE OR REPLACE FUNCTION decrement_entregas_realizadas(contrato_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE contratos
  SET entregas_realizadas = GREATEST(0, COALESCE(entregas_realizadas, 0) - 1)
  WHERE id = contrato_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Atualizar total_entregas para contratos existentes
UPDATE contratos c
SET total_entregas = (
  SELECT COUNT(DISTINCT data_entrega)
  FROM contrato_itens
  WHERE contrato_id = c.id
)
WHERE total_entregas = 0 OR total_entregas IS NULL;

-- 11. Atualizar entregas_realizadas para contratos existentes
UPDATE contratos c
SET entregas_realizadas = (
  SELECT COUNT(*)
  FROM pedidos
  WHERE contrato_id = c.id
  AND status IN ('entregue', 'finalizado')
)
WHERE entregas_realizadas = 0 OR entregas_realizadas IS NULL;
