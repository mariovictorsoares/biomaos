-- =============================================
-- 12. TABELA DE CONVITES DE USUARIO
-- =============================================

-- Criar tabela para armazenar convites de novos usuarios
CREATE TABLE IF NOT EXISTS convites_usuario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  nome VARCHAR(255) NOT NULL,
  perfil VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (perfil IN ('admin', 'user')),
  celular VARCHAR(20),
  cep VARCHAR(10),
  endereco VARCHAR(255),
  numero VARCHAR(20),
  complemento VARCHAR(100),
  estado VARCHAR(2),
  cidade VARCHAR(100),
  token VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'cancelled', 'expired')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_convites_usuario_email ON convites_usuario(email);
CREATE INDEX IF NOT EXISTS idx_convites_usuario_token ON convites_usuario(token);
CREATE INDEX IF NOT EXISTS idx_convites_usuario_status ON convites_usuario(status);

-- Desabilitar RLS (temporariamente para desenvolvimento)
ALTER TABLE convites_usuario DISABLE ROW LEVEL SECURITY;

-- Habilitar RLS com policies permissivas
ALTER TABLE convites_usuario ENABLE ROW LEVEL SECURITY;

-- Policy: Admins podem ver todos os convites
CREATE POLICY "Admins can view all user invites"
ON convites_usuario FOR SELECT
USING (is_user_admin());

-- Policy: Admins podem criar convites
CREATE POLICY "Admins can create user invites"
ON convites_usuario FOR INSERT
WITH CHECK (is_user_admin());

-- Policy: Admins podem atualizar convites
CREATE POLICY "Admins can update user invites"
ON convites_usuario FOR UPDATE
USING (is_user_admin());

-- Policy: Qualquer um pode verificar convite por token (para aceitar)
CREATE POLICY "Anyone can check invite by token"
ON convites_usuario FOR SELECT
USING (true);
