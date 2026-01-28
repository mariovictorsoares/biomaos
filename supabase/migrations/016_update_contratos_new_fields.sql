-- =============================================
-- BIOMA OS - ATUALIZAÇÃO CONTRATOS
-- Novos campos para o formulário de cadastro de contrato
-- =============================================

-- =============================================
-- ADICIONAR NOVOS CAMPOS NA TABELA CONTRATOS
-- =============================================

-- Tipo de plano: Clube Bioma Light, Clube Bioma Pro, Pedido recorrente
ALTER TABLE contratos
ADD COLUMN IF NOT EXISTS tipo_plano VARCHAR(50) DEFAULT 'clube_bioma_light'
  CHECK (tipo_plano IN ('clube_bioma_light', 'clube_bioma_pro', 'pedido_recorrente'));

-- Modalidade: depende do tipo de plano
-- Para Clube Bioma Light: Recorrente
-- Para Clube Bioma Pro: Mensal, Trimestral, Semestral
-- Para Pedido recorrente: Recorrente
ALTER TABLE contratos
ADD COLUMN IF NOT EXISTS modalidade VARCHAR(20) DEFAULT 'recorrente'
  CHECK (modalidade IN ('recorrente', 'mensal', 'trimestral', 'semestral'));

-- Bonificacao em percentual (ex: 5, 7, 10)
ALTER TABLE contratos
ADD COLUMN IF NOT EXISTS bonificacao DECIMAL(5,2) DEFAULT 0;

-- Possui credito de contratos anteriores?
ALTER TABLE contratos
ADD COLUMN IF NOT EXISTS possui_credito_anterior BOOLEAN DEFAULT false;

-- Valor do credito de contratos anteriores
ALTER TABLE contratos
ADD COLUMN IF NOT EXISTS valor_credito DECIMAL(12,2) DEFAULT 0;

-- Endereco de entrega (referencia ao cliente - pode ter multiplos enderecos)
-- Por enquanto, vamos usar um campo simples que indica qual endereco usar
ALTER TABLE contratos
ADD COLUMN IF NOT EXISTS usar_endereco_entrega_cliente BOOLEAN DEFAULT true;

-- Endereco de entrega customizado (caso nao use o do cliente)
ALTER TABLE contratos
ADD COLUMN IF NOT EXISTS endereco_entrega_customizado TEXT;

-- Valor do frete por entrega
ALTER TABLE contratos
ADD COLUMN IF NOT EXISTS valor_frete_entrega DECIMAL(10,2) DEFAULT 0;

-- Tabela de preco a ser usada
ALTER TABLE contratos
ADD COLUMN IF NOT EXISTS tabela_preco_id UUID REFERENCES tabelas_preco(id) ON DELETE SET NULL;

-- Produto de referencia para calculos
ALTER TABLE contratos
ADD COLUMN IF NOT EXISTS produto_referencia_id UUID REFERENCES produtos(id) ON DELETE SET NULL;

-- =============================================
-- CRIAR INDICES PARA OS NOVOS CAMPOS
-- =============================================

CREATE INDEX IF NOT EXISTS idx_contratos_tipo_plano ON contratos(tipo_plano);
CREATE INDEX IF NOT EXISTS idx_contratos_modalidade ON contratos(modalidade);
CREATE INDEX IF NOT EXISTS idx_contratos_tabela_preco_id ON contratos(tabela_preco_id);
CREATE INDEX IF NOT EXISTS idx_contratos_produto_referencia_id ON contratos(produto_referencia_id);

-- =============================================
-- COMENTARIOS NOS CAMPOS PARA DOCUMENTACAO
-- =============================================

COMMENT ON COLUMN contratos.tipo_plano IS 'Tipo do plano: clube_bioma_light, clube_bioma_pro, pedido_recorrente';
COMMENT ON COLUMN contratos.modalidade IS 'Modalidade do contrato: recorrente (Light/Pedido), mensal/trimestral/semestral (Pro)';
COMMENT ON COLUMN contratos.bonificacao IS 'Percentual de bonificacao. Para Clube Bioma Pro: Mensal=5%, Trimestral=7%, Semestral=10%';
COMMENT ON COLUMN contratos.possui_credito_anterior IS 'Se o cliente possui credito de contratos anteriores';
COMMENT ON COLUMN contratos.valor_credito IS 'Valor do credito de contratos anteriores em R$';
COMMENT ON COLUMN contratos.usar_endereco_entrega_cliente IS 'Se deve usar o endereco de entrega cadastrado no cliente';
COMMENT ON COLUMN contratos.endereco_entrega_customizado IS 'Endereco de entrega customizado quando nao usar o do cliente';
COMMENT ON COLUMN contratos.valor_frete_entrega IS 'Valor do frete por entrega em R$';
COMMENT ON COLUMN contratos.tabela_preco_id IS 'Referencia a tabela de precos a ser usada neste contrato';
COMMENT ON COLUMN contratos.produto_referencia_id IS 'Produto de referencia para calculos do contrato';
