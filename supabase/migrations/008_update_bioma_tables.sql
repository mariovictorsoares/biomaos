-- =============================================
-- BIOMA OS - ATUALIZAÇÕES E CORREÇÕES
-- Execute APÓS o 007_create_bioma_tables.sql
-- =============================================

-- =============================================
-- ATUALIZAÇÕES NA TABELA FAZENDAS
-- =============================================
ALTER TABLE fazendas
ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS capacidade_bandejas INTEGER DEFAULT 0;

-- Atualizar capacidade_bandejas baseado na coluna calculada existente
UPDATE fazendas SET capacidade_bandejas = COALESCE(capacidade, 0) WHERE capacidade_bandejas = 0 OR capacidade_bandejas IS NULL;

-- =============================================
-- ATUALIZAÇÕES NA TABELA ESPECIES
-- =============================================
ALTER TABLE especies
ADD COLUMN IF NOT EXISTS tempo_germinacao INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS tempo_luz INTEGER DEFAULT 0;

-- =============================================
-- ATUALIZAÇÕES NA TABELA CLIENTES
-- =============================================
ALTER TABLE clientes
ADD COLUMN IF NOT EXISTS inscricao_estadual VARCHAR(20),
ADD COLUMN IF NOT EXISTS contato VARCHAR(255),
ADD COLUMN IF NOT EXISTS logradouro VARCHAR(255);

-- Renomear endereco para logradouro se necessário
UPDATE clientes SET logradouro = endereco WHERE logradouro IS NULL AND endereco IS NOT NULL;

-- =============================================
-- ATUALIZAÇÕES NA TABELA ESTOQUE
-- =============================================
ALTER TABLE estoque
ADD COLUMN IF NOT EXISTS estoque_minimo INTEGER DEFAULT 0;

-- Alterar tipo de quantidade para DECIMAL
ALTER TABLE estoque
ALTER COLUMN quantidade TYPE DECIMAL(12,2) USING quantidade::DECIMAL(12,2);

-- =============================================
-- ATUALIZAÇÕES NA TABELA MOVIMENTACOES_ESTOQUE
-- =============================================
ALTER TABLE movimentacoes_estoque
ADD COLUMN IF NOT EXISTS observacoes TEXT;

-- Alterar tipo de quantidade para DECIMAL
ALTER TABLE movimentacoes_estoque
ALTER COLUMN quantidade TYPE DECIMAL(12,2) USING quantidade::DECIMAL(12,2);

-- =============================================
-- RECRIAR TABELA PRODUCAO COM CAMPOS CORRETOS
-- =============================================
-- Primeiro fazer backup e dropar dependências
DROP TABLE IF EXISTS previsao_colheita CASCADE;

-- Dropar e recriar producao
DROP TABLE IF EXISTS producao CASCADE;

CREATE TABLE producao (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  codigo VARCHAR(50),
  fazenda_id UUID REFERENCES fazendas(id) ON DELETE SET NULL,
  especie_id UUID REFERENCES especies(id) ON DELETE SET NULL,
  lote_id UUID REFERENCES lotes_sementes(id) ON DELETE SET NULL,
  produto_id UUID REFERENCES produtos(id) ON DELETE SET NULL,
  data_semeadura DATE,
  data_colheita_prevista DATE,
  data_colheita_real DATE,
  quantidade_bandeja INTEGER DEFAULT 0,
  quantidade_colhida DECIMAL(12,2),
  status VARCHAR(20) DEFAULT 'planejado' CHECK (status IN ('planejado', 'em_andamento', 'colhido', 'cancelado')),
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_producao_empresa_id ON producao(empresa_id);
CREATE INDEX idx_producao_fazenda_id ON producao(fazenda_id);
CREATE INDEX idx_producao_especie_id ON producao(especie_id);
CREATE INDEX idx_producao_status ON producao(status);
CREATE INDEX idx_producao_data_semeadura ON producao(data_semeadura);
CREATE INDEX idx_producao_data_colheita_prevista ON producao(data_colheita_prevista);

CREATE TRIGGER update_producao_updated_at
  BEFORE UPDATE ON producao
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS para producao
ALTER TABLE producao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view producao of their empresas" ON producao
  FOR SELECT USING (user_has_access_to_empresa(empresa_id));
CREATE POLICY "Users can insert producao to their empresas" ON producao
  FOR INSERT WITH CHECK (user_has_access_to_empresa(empresa_id));
CREATE POLICY "Users can update producao of their empresas" ON producao
  FOR UPDATE USING (user_has_access_to_empresa(empresa_id));
CREATE POLICY "Users can delete producao of their empresas" ON producao
  FOR DELETE USING (user_has_access_to_empresa(empresa_id));

-- =============================================
-- RECRIAR TABELA PEDIDOS COM CAMPOS CORRETOS
-- =============================================
DROP TABLE IF EXISTS pedido_itens CASCADE;
DROP TABLE IF EXISTS pedidos CASCADE;

CREATE TABLE pedidos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  numero VARCHAR(50),
  cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
  data_pedido DATE DEFAULT CURRENT_DATE,
  data_entrega DATE,
  status VARCHAR(20) DEFAULT 'previsto' CHECK (status IN ('previsto', 'confirmado', 'em_producao', 'finalizado', 'cancelado')),
  valor_total DECIMAL(12,2) DEFAULT 0,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pedidos_empresa_id ON pedidos(empresa_id);
CREATE INDEX idx_pedidos_cliente_id ON pedidos(cliente_id);
CREATE INDEX idx_pedidos_status ON pedidos(status);
CREATE INDEX idx_pedidos_data_pedido ON pedidos(data_pedido);

CREATE TRIGGER update_pedidos_updated_at
  BEFORE UPDATE ON pedidos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS para pedidos
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view pedidos of their empresas" ON pedidos
  FOR SELECT USING (user_has_access_to_empresa(empresa_id));
CREATE POLICY "Users can insert pedidos to their empresas" ON pedidos
  FOR INSERT WITH CHECK (user_has_access_to_empresa(empresa_id));
CREATE POLICY "Users can update pedidos of their empresas" ON pedidos
  FOR UPDATE USING (user_has_access_to_empresa(empresa_id));
CREATE POLICY "Users can delete pedidos of their empresas" ON pedidos
  FOR DELETE USING (user_has_access_to_empresa(empresa_id));

-- =============================================
-- TABELA PEDIDO_ITENS
-- =============================================
CREATE TABLE pedido_itens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  produto_id UUID REFERENCES produtos(id) ON DELETE SET NULL,
  quantidade DECIMAL(12,2) NOT NULL DEFAULT 1,
  valor_unitario DECIMAL(10,2) NOT NULL DEFAULT 0,
  valor_total DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pedido_itens_pedido_id ON pedido_itens(pedido_id);
CREATE INDEX idx_pedido_itens_produto_id ON pedido_itens(produto_id);

-- RLS para pedido_itens
ALTER TABLE pedido_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view pedido_itens of their empresas" ON pedido_itens
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM pedidos p WHERE p.id = pedido_itens.pedido_id AND user_has_access_to_empresa(p.empresa_id)
  ));
CREATE POLICY "Users can insert pedido_itens to their empresas" ON pedido_itens
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM pedidos p WHERE p.id = pedido_itens.pedido_id AND user_has_access_to_empresa(p.empresa_id)
  ));
CREATE POLICY "Users can update pedido_itens of their empresas" ON pedido_itens
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM pedidos p WHERE p.id = pedido_itens.pedido_id AND user_has_access_to_empresa(p.empresa_id)
  ));
CREATE POLICY "Users can delete pedido_itens of their empresas" ON pedido_itens
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM pedidos p WHERE p.id = pedido_itens.pedido_id AND user_has_access_to_empresa(p.empresa_id)
  ));

-- =============================================
-- RECRIAR TABELA CONTRATOS COM CAMPOS CORRETOS
-- =============================================
DROP TABLE IF EXISTS contrato_itens CASCADE;
DROP TABLE IF EXISTS contratos CASCADE;

CREATE TABLE contratos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  numero VARCHAR(50),
  cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
  plano VARCHAR(100),
  tipo VARCHAR(20) DEFAULT 'recorrente' CHECK (tipo IN ('recorrente', 'avulso')),
  data_inicio DATE,
  data_fim DATE,
  valor_mensal DECIMAL(12,2) DEFAULT 0,
  frequencia_entrega VARCHAR(20) DEFAULT 'semanal' CHECK (frequencia_entrega IN ('semanal', 'quinzenal', 'mensal')),
  dia_entrega VARCHAR(20),
  status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'pausado', 'cancelado', 'finalizado')),
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_contratos_empresa_id ON contratos(empresa_id);
CREATE INDEX idx_contratos_cliente_id ON contratos(cliente_id);
CREATE INDEX idx_contratos_status ON contratos(status);

CREATE TRIGGER update_contratos_updated_at
  BEFORE UPDATE ON contratos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS para contratos
ALTER TABLE contratos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view contratos of their empresas" ON contratos
  FOR SELECT USING (user_has_access_to_empresa(empresa_id));
CREATE POLICY "Users can insert contratos to their empresas" ON contratos
  FOR INSERT WITH CHECK (user_has_access_to_empresa(empresa_id));
CREATE POLICY "Users can update contratos of their empresas" ON contratos
  FOR UPDATE USING (user_has_access_to_empresa(empresa_id));
CREATE POLICY "Users can delete contratos of their empresas" ON contratos
  FOR DELETE USING (user_has_access_to_empresa(empresa_id));

-- =============================================
-- TABELA CONTRATO_ITENS
-- =============================================
CREATE TABLE contrato_itens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contrato_id UUID NOT NULL REFERENCES contratos(id) ON DELETE CASCADE,
  produto_id UUID REFERENCES produtos(id) ON DELETE SET NULL,
  quantidade DECIMAL(12,2) NOT NULL DEFAULT 1,
  valor_unitario DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_contrato_itens_contrato_id ON contrato_itens(contrato_id);
CREATE INDEX idx_contrato_itens_produto_id ON contrato_itens(produto_id);

-- RLS para contrato_itens
ALTER TABLE contrato_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view contrato_itens of their empresas" ON contrato_itens
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM contratos c WHERE c.id = contrato_itens.contrato_id AND user_has_access_to_empresa(c.empresa_id)
  ));
CREATE POLICY "Users can insert contrato_itens to their empresas" ON contrato_itens
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM contratos c WHERE c.id = contrato_itens.contrato_id AND user_has_access_to_empresa(c.empresa_id)
  ));
CREATE POLICY "Users can update contrato_itens of their empresas" ON contrato_itens
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM contratos c WHERE c.id = contrato_itens.contrato_id AND user_has_access_to_empresa(c.empresa_id)
  ));
CREATE POLICY "Users can delete contrato_itens of their empresas" ON contrato_itens
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM contratos c WHERE c.id = contrato_itens.contrato_id AND user_has_access_to_empresa(c.empresa_id)
  ));

-- =============================================
-- RECRIAR TABELA VENDAS COM CAMPOS CORRETOS
-- =============================================
DROP TABLE IF EXISTS venda_itens CASCADE;
DROP TABLE IF EXISTS vendas CASCADE;

CREATE TABLE vendas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  numero VARCHAR(50),
  cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
  data_venda DATE DEFAULT CURRENT_DATE,
  status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'confirmado', 'entregue', 'cancelado')),
  valor_total DECIMAL(12,2) DEFAULT 0,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vendas_empresa_id ON vendas(empresa_id);
CREATE INDEX idx_vendas_cliente_id ON vendas(cliente_id);
CREATE INDEX idx_vendas_status ON vendas(status);
CREATE INDEX idx_vendas_data_venda ON vendas(data_venda);

CREATE TRIGGER update_vendas_updated_at
  BEFORE UPDATE ON vendas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS para vendas
ALTER TABLE vendas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view vendas of their empresas" ON vendas
  FOR SELECT USING (user_has_access_to_empresa(empresa_id));
CREATE POLICY "Users can insert vendas to their empresas" ON vendas
  FOR INSERT WITH CHECK (user_has_access_to_empresa(empresa_id));
CREATE POLICY "Users can update vendas of their empresas" ON vendas
  FOR UPDATE USING (user_has_access_to_empresa(empresa_id));
CREATE POLICY "Users can delete vendas of their empresas" ON vendas
  FOR DELETE USING (user_has_access_to_empresa(empresa_id));

-- =============================================
-- TABELA VENDA_ITENS
-- =============================================
CREATE TABLE venda_itens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  venda_id UUID NOT NULL REFERENCES vendas(id) ON DELETE CASCADE,
  produto_id UUID REFERENCES produtos(id) ON DELETE SET NULL,
  quantidade DECIMAL(12,2) NOT NULL DEFAULT 1,
  valor_unitario DECIMAL(10,2) NOT NULL DEFAULT 0,
  valor_total DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_venda_itens_venda_id ON venda_itens(venda_id);
CREATE INDEX idx_venda_itens_produto_id ON venda_itens(produto_id);

-- RLS para venda_itens
ALTER TABLE venda_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view venda_itens of their empresas" ON venda_itens
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM vendas v WHERE v.id = venda_itens.venda_id AND user_has_access_to_empresa(v.empresa_id)
  ));
CREATE POLICY "Users can insert venda_itens to their empresas" ON venda_itens
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM vendas v WHERE v.id = venda_itens.venda_id AND user_has_access_to_empresa(v.empresa_id)
  ));
CREATE POLICY "Users can update venda_itens of their empresas" ON venda_itens
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM vendas v WHERE v.id = venda_itens.venda_id AND user_has_access_to_empresa(v.empresa_id)
  ));
CREATE POLICY "Users can delete venda_itens of their empresas" ON venda_itens
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM vendas v WHERE v.id = venda_itens.venda_id AND user_has_access_to_empresa(v.empresa_id)
  ));
