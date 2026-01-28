-- =============================================
-- BIOMA OS - ADICIONAR STATUS RESERVADO EM PEDIDOS
-- =============================================

-- Atualizar constraint de status para incluir 'reservado'
ALTER TABLE pedidos DROP CONSTRAINT IF EXISTS pedidos_status_check;
ALTER TABLE pedidos ADD CONSTRAINT pedidos_status_check
  CHECK (status IN (
    'previsto',
    'reservado',
    'confirmado',
    'em_producao',
    'finalizado',
    'cancelado'
  ));

-- Comentário para documentação
COMMENT ON COLUMN pedidos.status IS 'Status do pedido: previsto -> reservado -> confirmado -> em_producao -> finalizado';
