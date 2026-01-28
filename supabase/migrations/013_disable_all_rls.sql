-- =============================================
-- 13. DESABILITAR RLS DE TODAS AS TABELAS
-- Para desenvolvimento - sem regras de seguranca
-- =============================================

-- Dropar todas as policies da tabela convites_usuario
DROP POLICY IF EXISTS "Admins can view all user invites" ON convites_usuario;
DROP POLICY IF EXISTS "Admins can create user invites" ON convites_usuario;
DROP POLICY IF EXISTS "Admins can update user invites" ON convites_usuario;
DROP POLICY IF EXISTS "Anyone can check invite by token" ON convites_usuario;

-- Desabilitar RLS completamente na tabela convites_usuario
ALTER TABLE convites_usuario DISABLE ROW LEVEL SECURITY;

-- Dropar todas as policies da tabela user_preferences
DROP POLICY IF EXISTS "Users can view their own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can insert their own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can update their own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Admins can manage all preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can view own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can insert own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can update preferences" ON user_preferences;
DROP POLICY IF EXISTS "Admins can delete preferences" ON user_preferences;

-- Desabilitar RLS completamente na tabela user_preferences
ALTER TABLE user_preferences DISABLE ROW LEVEL SECURITY;

-- Desabilitar RLS em outras tabelas se existirem
ALTER TABLE IF EXISTS empresas DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS empresa_colaboradores DISABLE ROW LEVEL SECURITY;
