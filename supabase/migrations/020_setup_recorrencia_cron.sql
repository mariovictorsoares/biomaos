-- =============================================
-- BIOMA OS - CONFIGURAÇÃO DE RECORRÊNCIA
-- Setup do cron job para renovação automática
-- de planos de produção recorrentes
-- =============================================

-- =============================================
-- 1. GARANTIR ÍNDICE PARA RECORRENCIA_ID
-- =============================================

CREATE INDEX IF NOT EXISTS idx_producao_recorrencia_id ON producao(recorrencia_id);
CREATE INDEX IF NOT EXISTS idx_producao_recorrente ON producao(recorrente);
CREATE INDEX IF NOT EXISTS idx_producao_data_colheita_prevista ON producao(data_colheita_prevista);

-- =============================================
-- 2. HABILITAR EXTENSÃO PG_CRON (se disponível)
-- =============================================

-- Nota: pg_cron precisa ser habilitado no Dashboard do Supabase
-- Settings > Database > Extensions > pg_cron

-- =============================================
-- 3. CRIAR FUNÇÃO PARA CHAMAR EDGE FUNCTION
-- =============================================

-- Esta função será chamada pelo cron job
-- Ela faz uma requisição HTTP para a Edge Function
CREATE OR REPLACE FUNCTION invocar_renovacao_recorrencias()
RETURNS void AS $$
DECLARE
  resultado json;
BEGIN
  -- Chamar a Edge Function via HTTP
  -- A URL será substituída pela URL real do projeto
  SELECT content::json INTO resultado
  FROM http_post(
    current_setting('app.supabase_url') || '/functions/v1/renovar-recorrencias',
    '{}',
    'application/json'
  );

  -- Log do resultado (opcional - para debug)
  RAISE NOTICE 'Renovação de recorrências executada: %', resultado;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION invocar_renovacao_recorrencias IS 'Invoca a Edge Function de renovação de recorrências';

-- =============================================
-- 4. INSTRUÇÕES PARA CONFIGURAR O CRON JOB
-- =============================================

-- Para configurar o cron job, execute no SQL Editor do Supabase:
--
-- SELECT cron.schedule(
--   'renovar-recorrencias-diario',  -- nome do job
--   '0 6 * * *',                     -- todo dia às 6h da manhã
--   $$
--   SELECT net.http_post(
--     url := 'https://SEU_PROJECT_REF.supabase.co/functions/v1/renovar-recorrencias',
--     headers := '{"Authorization": "Bearer SEU_ANON_KEY"}'::jsonb,
--     body := '{}'::jsonb
--   ) AS request_id;
--   $$
-- );
--
-- Para verificar jobs agendados:
-- SELECT * FROM cron.job;
--
-- Para remover um job:
-- SELECT cron.unschedule('renovar-recorrencias-diario');

-- =============================================
-- 5. COMENTÁRIOS PARA DOCUMENTAÇÃO
-- =============================================

COMMENT ON COLUMN producao.recorrencia_id IS 'UUID que agrupa todos os planos de uma mesma recorrência semanal';
COMMENT ON COLUMN producao.recorrente IS 'Indica se este plano faz parte de uma recorrência (true/false)';
