-- =============================================
-- 6. STORAGE BUCKET PARA LOGOS DAS EMPRESAS
-- =============================================

-- Criar bucket para logos (executar via Supabase Dashboard ou CLI)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('empresas', 'empresas', true);

-- Nota: O bucket deve ser criado manualmente via Supabase Dashboard:
-- 1. Va em Storage no painel do Supabase
-- 2. Clique em "New bucket"
-- 3. Nome: empresas
-- 4. Marque "Public bucket" para permitir acesso publico as logos

-- Politica para permitir upload (sem RLS por enquanto)
-- Como estamos sem RLS, qualquer usuario autenticado pode fazer upload
