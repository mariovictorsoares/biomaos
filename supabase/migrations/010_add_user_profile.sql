-- =============================================
-- 10. ADICIONAR PERFIL GLOBAL DO USUARIO
-- =============================================

-- Adicionar coluna de perfil na tabela user_preferences
-- perfil: 'admin' = Administrador (pode tudo), 'user' = Usuario (acesso limitado)
ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS perfil VARCHAR(20) DEFAULT 'user' CHECK (perfil IN ('admin', 'user'));

-- Adicionar campos extras para o perfil do usuario
ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS nome_completo VARCHAR(255),
ADD COLUMN IF NOT EXISTS celular VARCHAR(20),
ADD COLUMN IF NOT EXISTS cep VARCHAR(10),
ADD COLUMN IF NOT EXISTS endereco VARCHAR(255),
ADD COLUMN IF NOT EXISTS numero VARCHAR(20),
ADD COLUMN IF NOT EXISTS complemento VARCHAR(100),
ADD COLUMN IF NOT EXISTS estado VARCHAR(2),
ADD COLUMN IF NOT EXISTS cidade VARCHAR(100),
ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT true;

-- Definir leonardo@fazendasbioma.com.br como admin
-- (sera feito manualmente ou via seed)

-- Criar view para listar usuarios com seus dados
CREATE OR REPLACE VIEW vw_usuarios AS
SELECT
  u.id as user_id,
  u.email,
  u.created_at,
  u.last_sign_in_at,
  COALESCE(u.raw_user_meta_data->>'full_name', up.nome_completo, split_part(u.email, '@', 1)) as nome,
  COALESCE(up.perfil, 'user') as perfil,
  COALESCE(up.ativo, true) as ativo,
  up.celular,
  up.cep,
  up.endereco,
  up.numero,
  up.complemento,
  up.estado,
  up.cidade
FROM auth.users u
LEFT JOIN user_preferences up ON up.user_id = u.id;

-- Funcao para verificar se usuario e admin
CREATE OR REPLACE FUNCTION is_user_admin(p_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
  v_perfil VARCHAR;
BEGIN
  v_user_id := COALESCE(p_user_id, auth.uid());

  SELECT perfil INTO v_perfil
  FROM user_preferences
  WHERE user_id = v_user_id;

  RETURN COALESCE(v_perfil, 'user') = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
