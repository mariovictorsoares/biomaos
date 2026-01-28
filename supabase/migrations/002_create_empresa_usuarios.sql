-- =============================================
-- 2. TABELA DE RELACIONAMENTO EMPRESA-USUARIO (COLABORADORES)
-- =============================================
CREATE TABLE empresa_usuarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(empresa_id, user_id)
);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_empresa_usuarios_updated_at
  BEFORE UPDATE ON empresa_usuarios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Indices
CREATE INDEX idx_empresa_usuarios_empresa_id ON empresa_usuarios(empresa_id);
CREATE INDEX idx_empresa_usuarios_user_id ON empresa_usuarios(user_id);
