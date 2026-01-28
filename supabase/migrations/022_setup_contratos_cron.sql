-- =============================================
-- BIOMA OS - CONFIGURACAO CRON PARA RENOVACAO DE CONTRATOS
-- Migration: 022_setup_contratos_cron.sql
-- =============================================

-- IMPORTANTE: Este arquivo contem as instrucoes para configurar
-- o cron job no Supabase Dashboard. O pg_cron precisa ser
-- habilitado manualmente nas configuracoes do projeto.

-- ==============================================
-- PASSO 1: Habilitar pg_cron no Supabase Dashboard
-- ==============================================
-- 1. Acesse o Supabase Dashboard do seu projeto
-- 2. Va em Database > Extensions
-- 3. Procure por "pg_cron" e habilite

-- ==============================================
-- PASSO 2: Executar no SQL Editor do Supabase
-- ==============================================

-- Agendar renovacao de contratos diariamente as 6h da manha (horario UTC)
-- A funcao renovar-contratos sera chamada via HTTP

/*
-- Execute este SQL no SQL Editor do Supabase:

SELECT cron.schedule(
  'renovar-contratos-diario',
  '0 9 * * *',  -- 9h UTC = 6h Brasilia
  $$
  SELECT
    net.http_post(
      url:='https://SEU_PROJECT_REF.supabase.co/functions/v1/renovar-contratos',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer SEU_ANON_KEY"}'::jsonb,
      body:='{}'::jsonb
    ) AS request_id;
  $$
);

-- Para verificar jobs agendados:
SELECT * FROM cron.job;

-- Para remover um job:
-- SELECT cron.unschedule('renovar-contratos-diario');

*/

-- ==============================================
-- ALTERNATIVA: Usar Supabase Edge Functions Scheduler
-- ==============================================
-- Se preferir, voce pode configurar o scheduler diretamente
-- no Supabase Dashboard em Edge Functions > Schedules

-- ==============================================
-- DOCUMENTACAO
-- ==============================================
-- A Edge Function renovar-contratos:
-- 1. Busca todos os contratos com status = 'Ativo' e modalidade = 'recorrente'
-- 2. Para cada contrato, busca os itens com dia_semana definido
-- 3. Gera pedidos para as proximas 4 semanas
-- 4. Cada pedido e criado com status = 'previsto'
-- 5. Os pedidos sao vinculados ao contrato via contrato_id
--
-- Frequencia: Diariamente as 6h da manha (horario de Brasilia)
--
-- Campos importantes em contrato_itens:
-- - dia_semana: 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'
-- - quantidade_por_entrega: quantidade do produto por entrega
-- - valor_unitario: preco unitario do produto
