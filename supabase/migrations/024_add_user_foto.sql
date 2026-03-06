-- =============================================
-- 24. ADICIONAR FOTO DO USUARIO
-- =============================================

-- Adicionar coluna foto_url na tabela user_preferences
ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS foto_url TEXT;

-- Adicionar coluna foto_url na tabela convites_usuario
ALTER TABLE convites_usuario
ADD COLUMN IF NOT EXISTS foto_url TEXT;

-- Atualizar view para incluir foto_url
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
  up.cidade,
  up.foto_url
FROM auth.users u
LEFT JOIN user_preferences up ON up.user_id = u.id;
