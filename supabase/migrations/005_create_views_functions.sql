-- =============================================
-- 5. VIEWS E FUNCOES AUXILIARES
-- =============================================

-- View para listar colaboradores com dados do usuario
CREATE OR REPLACE VIEW vw_empresa_colaboradores AS
SELECT
  eu.id,
  eu.empresa_id,
  eu.user_id,
  eu.role,
  eu.created_at,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)) as nome
FROM empresa_usuarios eu
JOIN auth.users u ON u.id = eu.user_id;

-- Funcao para criar empresa e adicionar usuario como owner
CREATE OR REPLACE FUNCTION create_empresa_with_owner(
  p_cnpj VARCHAR,
  p_razao_social VARCHAR,
  p_nome_fantasia VARCHAR DEFAULT NULL,
  p_num_funcionarios INTEGER DEFAULT 0,
  p_cep VARCHAR DEFAULT NULL,
  p_endereco VARCHAR DEFAULT NULL,
  p_numero VARCHAR DEFAULT NULL,
  p_complemento VARCHAR DEFAULT NULL,
  p_estado VARCHAR DEFAULT NULL,
  p_cidade VARCHAR DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_empresa_id UUID;
BEGIN
  -- Criar empresa
  INSERT INTO empresas (
    cnpj, razao_social, nome_fantasia, num_funcionarios,
    cep, endereco, numero, complemento, estado, cidade
  ) VALUES (
    p_cnpj, p_razao_social, p_nome_fantasia, p_num_funcionarios,
    p_cep, p_endereco, p_numero, p_complemento, p_estado, p_cidade
  )
  RETURNING id INTO v_empresa_id;

  -- Adicionar usuario como owner
  INSERT INTO empresa_usuarios (empresa_id, user_id, role)
  VALUES (v_empresa_id, auth.uid(), 'owner');

  -- Definir como empresa atual se for a primeira
  INSERT INTO user_preferences (user_id, current_empresa_id)
  VALUES (auth.uid(), v_empresa_id)
  ON CONFLICT (user_id) DO UPDATE
  SET current_empresa_id = COALESCE(user_preferences.current_empresa_id, v_empresa_id);

  RETURN v_empresa_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funcao para aceitar convite
CREATE OR REPLACE FUNCTION accept_invite(p_token VARCHAR)
RETURNS JSON AS $$
DECLARE
  v_convite RECORD;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();

  -- Buscar convite
  SELECT * INTO v_convite
  FROM convites
  WHERE token = p_token
    AND status = 'pending'
    AND expires_at > NOW();

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Convite invalido ou expirado');
  END IF;

  -- Verificar se email do usuario bate com o convite
  IF v_convite.email != (SELECT email FROM auth.users WHERE id = v_user_id) THEN
    RETURN json_build_object('success', false, 'error', 'Este convite foi enviado para outro email');
  END IF;

  -- Adicionar usuario a empresa
  INSERT INTO empresa_usuarios (empresa_id, user_id, role)
  VALUES (v_convite.empresa_id, v_user_id, v_convite.role)
  ON CONFLICT (empresa_id, user_id) DO NOTHING;

  -- Atualizar status do convite
  UPDATE convites
  SET status = 'accepted', accepted_at = NOW()
  WHERE id = v_convite.id;

  RETURN json_build_object('success', true, 'empresa_id', v_convite.empresa_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funcao para obter empresa atual do usuario (somente empresas ativas)
CREATE OR REPLACE FUNCTION get_current_empresa()
RETURNS JSON AS $$
DECLARE
  v_empresa RECORD;
BEGIN
  -- Buscar empresa atual do usuario (somente se estiver ativa)
  SELECT e.* INTO v_empresa
  FROM empresas e
  JOIN user_preferences up ON up.current_empresa_id = e.id
  JOIN empresa_usuarios eu ON eu.empresa_id = e.id AND eu.user_id = auth.uid()
  WHERE up.user_id = auth.uid()
    AND e.ativo = true;

  IF NOT FOUND THEN
    -- Se nao tem empresa atual ativa, pegar a primeira empresa ativa que o usuario tem acesso
    SELECT e.* INTO v_empresa
    FROM empresas e
    JOIN empresa_usuarios eu ON eu.empresa_id = e.id
    WHERE eu.user_id = auth.uid()
      AND e.ativo = true
    LIMIT 1;
  END IF;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  RETURN row_to_json(v_empresa);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funcao para definir empresa atual (somente empresas ativas)
CREATE OR REPLACE FUNCTION set_current_empresa(p_empresa_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Verificar se usuario tem acesso a empresa E se ela esta ativa
  IF NOT EXISTS (
    SELECT 1 FROM empresa_usuarios eu
    JOIN empresas e ON e.id = eu.empresa_id
    WHERE eu.empresa_id = p_empresa_id
      AND eu.user_id = auth.uid()
      AND e.ativo = true
  ) THEN
    RETURN false;
  END IF;

  -- Atualizar ou inserir preferencia
  INSERT INTO user_preferences (user_id, current_empresa_id)
  VALUES (auth.uid(), p_empresa_id)
  ON CONFLICT (user_id) DO UPDATE
  SET current_empresa_id = p_empresa_id, updated_at = NOW();

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
