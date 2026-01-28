-- =============================================
-- BIOMA OS - ADICIONAR NOVOS STATUS DE PRODUÇÃO
-- Novos status: germinando, vegetacao, colhendo
-- =============================================

-- Atualizar constraint de status para incluir novos valores
ALTER TABLE producao DROP CONSTRAINT IF EXISTS producao_status_check;
ALTER TABLE producao ADD CONSTRAINT producao_status_check
  CHECK (status IN (
    'planejado',
    'germinando',    -- Após inserir data_plantio_real + quantidade_plantio
    'vegetacao',     -- Após inserir data_luz_real + quantidade_luz
    'colhendo',      -- Após inserir data_colheita_real + quantidade_colhida
    'em_plantio',    -- Mantido para compatibilidade
    'em_luz',        -- Mantido para compatibilidade
    'em_colheita',   -- Mantido para compatibilidade
    'colhido',
    'cancelado',
    'finalizado'
  ));

-- Comentários para documentação
COMMENT ON COLUMN producao.status IS 'Status do plano: planejado -> germinando -> vegetacao -> colhendo -> finalizado';
