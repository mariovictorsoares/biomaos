-- =============================================
-- BIOMA OS - ATUALIZAÇÃO PARA WIZARD DE CONTRATOS
-- Migration: 021_update_contratos_delivery_schedule.sql
-- =============================================

-- 1. Tabela de endereços adicionais do cliente
CREATE TABLE IF NOT EXISTS cliente_enderecos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  nome VARCHAR(100) NOT NULL,
  cep VARCHAR(9),
  logradouro VARCHAR(255),
  numero VARCHAR(20),
  complemento VARCHAR(100),
  bairro VARCHAR(100),
  cidade VARCHAR(100),
  estado VARCHAR(2),
  principal BOOLEAN DEFAULT false,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cliente_enderecos_cliente_id ON cliente_enderecos(cliente_id);

-- 2. Adicionar colunas em contrato_itens
ALTER TABLE contrato_itens
ADD COLUMN IF NOT EXISTS data_entrega DATE;

ALTER TABLE contrato_itens
ADD COLUMN IF NOT EXISTS dia_semana VARCHAR(20);

-- 3. Adicionar colunas em contratos
ALTER TABLE contratos
ADD COLUMN IF NOT EXISTS forma_pagamento VARCHAR(50);

ALTER TABLE contratos
ADD COLUMN IF NOT EXISTS endereco_entrega_id UUID REFERENCES cliente_enderecos(id) ON DELETE SET NULL;

-- 4. Adicionar contrato_id em pedidos para vincular pedidos gerados
ALTER TABLE pedidos
ADD COLUMN IF NOT EXISTS contrato_id UUID REFERENCES contratos(id) ON DELETE SET NULL;

-- 5. Índices
CREATE INDEX IF NOT EXISTS idx_contrato_itens_data_entrega ON contrato_itens(data_entrega);
CREATE INDEX IF NOT EXISTS idx_contratos_endereco_entrega_id ON contratos(endereco_entrega_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_contrato_id ON pedidos(contrato_id);

-- 6. Comentários
COMMENT ON TABLE cliente_enderecos IS 'Endereços adicionais de entrega do cliente';
COMMENT ON COLUMN contrato_itens.data_entrega IS 'Data específica da entrega';
COMMENT ON COLUMN contrato_itens.dia_semana IS 'Dia da semana para entregas recorrentes';
COMMENT ON COLUMN contratos.forma_pagamento IS 'Forma de pagamento: pix, boleto, cartao_credito, etc.';
COMMENT ON COLUMN contratos.endereco_entrega_id IS 'Referência ao endereço de entrega alternativo';
COMMENT ON COLUMN pedidos.contrato_id IS 'Contrato de origem do pedido (quando gerado automaticamente)';
