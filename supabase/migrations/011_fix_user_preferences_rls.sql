-- =============================================
-- 11. CORRIGIR RLS DA TABELA USER_PREFERENCES
-- =============================================

-- Desabilitar RLS na tabela user_preferences (temporariamente para desenvolvimento)
ALTER TABLE user_preferences DISABLE ROW LEVEL SECURITY;

-- Dropar TODAS as policies existentes (incluindo as novas)
DROP POLICY IF EXISTS "Users can view their own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can insert their own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can update their own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Admins can manage all preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can view own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can insert own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can update preferences" ON user_preferences;
DROP POLICY IF EXISTS "Admins can delete preferences" ON user_preferences;

-- Criar policies mais permissivas para admin
-- Primeiro, re-habilitar RLS mas com policies permissivas
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Policy: Usuarios podem ver suas proprias preferencias
CREATE POLICY "Users can view own preferences"
ON user_preferences FOR SELECT
USING (auth.uid() = user_id OR is_user_admin());

-- Policy: Usuarios podem inserir suas proprias preferencias
CREATE POLICY "Users can insert own preferences"
ON user_preferences FOR INSERT
WITH CHECK (auth.uid() = user_id OR is_user_admin());

-- Policy: Usuarios podem atualizar suas proprias preferencias (admins podem atualizar todas)
CREATE POLICY "Users can update preferences"
ON user_preferences FOR UPDATE
USING (auth.uid() = user_id OR is_user_admin());

-- Policy: Admins podem deletar preferencias
CREATE POLICY "Admins can delete preferences"
ON user_preferences FOR DELETE
USING (is_user_admin());

-- Garantir que o usuario master seja admin
UPDATE user_preferences
SET perfil = 'admin'
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'leonardo@fazendasbioma.com.br');

-- Se nao existir registro para o master, criar
INSERT INTO user_preferences (user_id, perfil, ativo)
SELECT id, 'admin', true
FROM auth.users
WHERE email = 'leonardo@fazendasbioma.com.br'
ON CONFLICT (user_id) DO UPDATE SET perfil = 'admin';
