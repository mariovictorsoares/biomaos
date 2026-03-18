-- =============================================
-- BIOMA OS - CONFIGURAÇÃO CRON IoT
-- Setup do cron job para coleta automática
-- de leituras de temperatura/umidade
-- =============================================

-- =============================================
-- 1. INSTRUÇÕES PARA CONFIGURAR O CRON JOB
-- =============================================

-- Para configurar o cron job, execute no SQL Editor do Supabase:
--
-- SELECT cron.schedule(
--   'coletar-leituras-iot',           -- nome do job
--   '*/5 * * * *',                     -- a cada 5 minutos
--   $$
--   SELECT net.http_post(
--     url := 'https://SEU_PROJECT_REF.supabase.co/functions/v1/coletar-leituras-iot',
--     headers := '{"Authorization": "Bearer SEU_ANON_KEY"}'::jsonb,
--     body := '{}'::jsonb
--   ) AS request_id;
--   $$
-- );

-- =============================================
-- 2. VERIFICAR / GERENCIAR JOBS
-- =============================================

-- Para verificar jobs agendados:
-- SELECT * FROM cron.job;
--
-- Para verificar execuções recentes:
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;
--
-- Para remover o job:
-- SELECT cron.unschedule('coletar-leituras-iot');

-- =============================================
-- 3. RETENÇÃO DE DADOS (OPCIONAL)
-- =============================================

-- Para limpar leituras antigas (ex: manter 90 dias):
--
-- SELECT cron.schedule(
--   'limpar-leituras-antigas',
--   '0 3 * * 0',                       -- todo domingo às 3h da manhã
--   $$
--   DELETE FROM leituras_sensores
--   WHERE registrado_em < NOW() - INTERVAL '90 days';
--   $$
-- );
