-- =============================================
-- 6. ATUALIZAR FUNCOES PARA FILTRAR EMPRESAS ATIVAS
-- =============================================

-- Funcao para obter empresa atual do usuario (somente empresas ativas)
CREATE OR REPLACE FUNCTION get_current_empresa()
RETURNS JSON AS $$
DECLARE
  v_empresa RECORD;
BEGIN
  -- Buscar empresa atual do usuario (somente se estiver ativa e usuario tiver acesso)
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
