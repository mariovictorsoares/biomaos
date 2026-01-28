-- =============================================
-- BIOMA OS - TABELAS ADICIONAIS
-- Execute no SQL Editor do Supabase
-- =============================================

-- =============================================
-- 1. CLIENTES
-- =============================================
CREATE TABLE IF NOT EXISTS clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  cnpj_cpf VARCHAR(18),
  pessoa_fisica BOOLEAN DEFAULT false,
  razao_social VARCHAR(255) NOT NULL,
  nome_fantasia VARCHAR(255),
  email VARCHAR(255),
  telefone VARCHAR(20),
  whatsapp VARCHAR(20),
  cep VARCHAR(9),
  endereco VARCHAR(255),
  numero VARCHAR(20),
  complemento VARCHAR(100),
  bairro VARCHAR(100),
  estado VARCHAR(2),
  cidade VARCHAR(100),
  responsavel_financeiro VARCHAR(255),
  email_financeiro VARCHAR(255),
  telefone_financeiro VARCHAR(20),
  pagamento_pix BOOLEAN DEFAULT false,
  pagamento_boleto BOOLEAN DEFAULT false,
  pagamento_cartao BOOLEAN DEFAULT false,
  observacoes_financeiro TEXT,
  responsavel_pedido VARCHAR(255),
  email_pedido VARCHAR(255),
  telefone_pedido VARCHAR(20),
  cep_entrega VARCHAR(9),
  logradouro_entrega VARCHAR(255),
  numero_entrega VARCHAR(20),
  complemento_entrega VARCHAR(100),
  bairro_entrega VARCHAR(100),
  cidade_entrega VARCHAR(100),
  estado_entrega VARCHAR(2),
  dia_segunda BOOLEAN DEFAULT false,
  dia_terca BOOLEAN DEFAULT false,
  dia_quarta BOOLEAN DEFAULT false,
  dia_quinta BOOLEAN DEFAULT false,
  dia_sexta BOOLEAN DEFAULT false,
  hora_manha_inicio TIME,
  hora_manha_fim TIME,
  hora_tarde_inicio TIME,
  hora_tarde_fim TIME,
  observacoes_entrega TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clientes_empresa_id ON clientes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_clientes_cnpj_cpf ON clientes(cnpj_cpf);

CREATE TRIGGER update_clientes_updated_at
  BEFORE UPDATE ON clientes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 2. FAZENDAS
-- =============================================
CREATE TABLE IF NOT EXISTS fazendas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  codigo VARCHAR(20) NOT NULL,
  nome VARCHAR(100) NOT NULL,
  unidades_por_bandeja INTEGER DEFAULT 6,
  numero_andares INTEGER DEFAULT 1,
  bandejas_por_andar INTEGER DEFAULT 6,
  capacidade INTEGER GENERATED ALWAYS AS (unidades_por_bandeja * numero_andares * bandejas_por_andar) STORED,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(empresa_id, codigo)
);

CREATE INDEX IF NOT EXISTS idx_fazendas_empresa_id ON fazendas(empresa_id);

CREATE TRIGGER update_fazendas_updated_at
  BEFORE UPDATE ON fazendas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 3. ESPECIES
-- =============================================
CREATE TABLE IF NOT EXISTS especies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  codigo VARCHAR(10) NOT NULL,
  nome VARCHAR(100) NOT NULL,
  imagem_url TEXT,
  produto_mix BOOLEAN DEFAULT false,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(empresa_id, codigo)
);

CREATE INDEX IF NOT EXISTS idx_especies_empresa_id ON especies(empresa_id);

CREATE TRIGGER update_especies_updated_at
  BEFORE UPDATE ON especies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 4. PRODUTOS
-- =============================================
CREATE TABLE IF NOT EXISTS produtos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  codigo VARCHAR(20) NOT NULL,
  nome VARCHAR(100) NOT NULL,
  unidade VARCHAR(10) DEFAULT 'und',
  preco_padrao DECIMAL(10,2) DEFAULT 0,
  especie_id UUID REFERENCES especies(id) ON DELETE SET NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(empresa_id, codigo)
);

CREATE INDEX IF NOT EXISTS idx_produtos_empresa_id ON produtos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_produtos_especie_id ON produtos(especie_id);

CREATE TRIGGER update_produtos_updated_at
  BEFORE UPDATE ON produtos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 5. LOTES_SEMENTES
-- =============================================
CREATE TABLE IF NOT EXISTS lotes_sementes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  especie_id UUID NOT NULL REFERENCES especies(id) ON DELETE CASCADE,
  numero VARCHAR(50) NOT NULL,
  estoque_inicial DECIMAL(12,2) DEFAULT 0,
  estoque_atual DECIMAL(12,2) DEFAULT 0,
  validade DATE,
  tempo_germinacao INTEGER,
  tempo_luz INTEGER,
  densidade_semeadura DECIMAL(10,2),
  safra VARCHAR(20),
  eficiencia DECIMAL(5,2),
  taxa_germinacao DECIMAL(5,2),
  taxa_pureza DECIMAL(5,2),
  pais_origem VARCHAR(100),
  fornecedor VARCHAR(255),
  valor_semente DECIMAL(10,2),
  observacoes TEXT,
  status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lotes_sementes_empresa_id ON lotes_sementes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_lotes_sementes_especie_id ON lotes_sementes(especie_id);

CREATE TRIGGER update_lotes_sementes_updated_at
  BEFORE UPDATE ON lotes_sementes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 6. ESTOQUE
-- =============================================
CREATE TABLE IF NOT EXISTS estoque (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  quantidade INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(empresa_id, produto_id)
);

CREATE INDEX IF NOT EXISTS idx_estoque_empresa_id ON estoque(empresa_id);
CREATE INDEX IF NOT EXISTS idx_estoque_produto_id ON estoque(produto_id);

CREATE TRIGGER update_estoque_updated_at
  BEFORE UPDATE ON estoque
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 7. MOVIMENTACOES_ESTOQUE
-- =============================================
CREATE TABLE IF NOT EXISTS movimentacoes_estoque (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('entrada', 'saida', 'ajuste')),
  quantidade INTEGER NOT NULL,
  quantidade_anterior INTEGER,
  quantidade_nova INTEGER,
  motivo TEXT,
  usuario_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_movimentacoes_estoque_empresa_id ON movimentacoes_estoque(empresa_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_estoque_produto_id ON movimentacoes_estoque(produto_id);

-- =============================================
-- 8. TABELAS_PRECO
-- =============================================
CREATE TABLE IF NOT EXISTS tabelas_preco (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tabelas_preco_empresa_id ON tabelas_preco(empresa_id);

CREATE TRIGGER update_tabelas_preco_updated_at
  BEFORE UPDATE ON tabelas_preco
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 9. TABELA_PRECO_ITENS
-- =============================================
CREATE TABLE IF NOT EXISTS tabela_preco_itens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tabela_preco_id UUID NOT NULL REFERENCES tabelas_preco(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  preco DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tabela_preco_id, produto_id)
);

CREATE INDEX IF NOT EXISTS idx_tabela_preco_itens_tabela_id ON tabela_preco_itens(tabela_preco_id);
CREATE INDEX IF NOT EXISTS idx_tabela_preco_itens_produto_id ON tabela_preco_itens(produto_id);

CREATE TRIGGER update_tabela_preco_itens_updated_at
  BEFORE UPDATE ON tabela_preco_itens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 10. PEDIDOS
-- =============================================
CREATE TABLE IF NOT EXISTS pedidos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  codigo SERIAL,
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  tabela_preco_id UUID REFERENCES tabelas_preco(id) ON DELETE SET NULL,
  data_abertura DATE DEFAULT CURRENT_DATE,
  previsao_entrega DATE,
  responsavel VARCHAR(255),
  status VARCHAR(20) DEFAULT 'Previsto' CHECK (status IN ('Previsto', 'Confirmado', 'Finalizado', 'Cancelado')),
  valor_total DECIMAL(12,2) DEFAULT 0,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pedidos_empresa_id ON pedidos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente_id ON pedidos(cliente_id);

CREATE TRIGGER update_pedidos_updated_at
  BEFORE UPDATE ON pedidos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 11. PEDIDO_ITENS
-- =============================================
CREATE TABLE IF NOT EXISTS pedido_itens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  quantidade INTEGER NOT NULL DEFAULT 1,
  valor_unitario DECIMAL(10,2) NOT NULL,
  valor_total DECIMAL(12,2) GENERATED ALWAYS AS (quantidade * valor_unitario) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pedido_itens_pedido_id ON pedido_itens(pedido_id);
CREATE INDEX IF NOT EXISTS idx_pedido_itens_produto_id ON pedido_itens(produto_id);

-- =============================================
-- 12. CONTRATOS
-- =============================================
CREATE TABLE IF NOT EXISTS contratos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  plano VARCHAR(100) NOT NULL,
  tipo_plano VARCHAR(20) DEFAULT 'Recorrente' CHECK (tipo_plano IN ('Recorrente', 'Anual', 'Mensal')),
  primeira_entrega DATE,
  entrega_final DATE,
  total_entregas INTEGER DEFAULT 0,
  entregas_realizadas INTEGER DEFAULT 0,
  valor_mensal DECIMAL(12,2),
  status VARCHAR(20) DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Pausado', 'Cancelado', 'Finalizado')),
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contratos_empresa_id ON contratos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_contratos_cliente_id ON contratos(cliente_id);

CREATE TRIGGER update_contratos_updated_at
  BEFORE UPDATE ON contratos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 13. CONTRATO_ITENS
-- =============================================
CREATE TABLE IF NOT EXISTS contrato_itens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contrato_id UUID NOT NULL REFERENCES contratos(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  quantidade_por_entrega INTEGER NOT NULL DEFAULT 1,
  valor_unitario DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contrato_itens_contrato_id ON contrato_itens(contrato_id);
CREATE INDEX IF NOT EXISTS idx_contrato_itens_produto_id ON contrato_itens(produto_id);

-- =============================================
-- 14. PRODUCAO
-- =============================================
CREATE TABLE IF NOT EXISTS producao (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  codigo SERIAL,
  fazenda_id UUID NOT NULL REFERENCES fazendas(id) ON DELETE CASCADE,
  especie_id UUID NOT NULL REFERENCES especies(id) ON DELETE CASCADE,
  lote_semente_id UUID REFERENCES lotes_sementes(id) ON DELETE SET NULL,
  quantia_planejada INTEGER NOT NULL,
  bandejas INTEGER,
  plantio_planejado DATE,
  luz_planejado DATE,
  colheita_planejada DATE,
  plantio_realizado DATE,
  quantia_plantio_realizado INTEGER,
  luz_realizado DATE,
  quantia_luz INTEGER,
  perda_luz INTEGER DEFAULT 0,
  colheita_realizada DATE,
  quantia_colheita INTEGER,
  perda_colheita INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'planejado' CHECK (status IN ('planejado', 'em_andamento', 'atrasado', 'finalizado', 'cancelado')),
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_producao_empresa_id ON producao(empresa_id);
CREATE INDEX IF NOT EXISTS idx_producao_fazenda_id ON producao(fazenda_id);
CREATE INDEX IF NOT EXISTS idx_producao_especie_id ON producao(especie_id);

CREATE TRIGGER update_producao_updated_at
  BEFORE UPDATE ON producao
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 15. VENDAS
-- =============================================
CREATE TABLE IF NOT EXISTS vendas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  pedido_id UUID REFERENCES pedidos(id) ON DELETE SET NULL,
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  data_venda DATE DEFAULT CURRENT_DATE,
  data_entrega DATE,
  valor_total DECIMAL(12,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'Previsto' CHECK (status IN ('Previsto', 'Confirmado', 'Entregue', 'Cancelado')),
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vendas_empresa_id ON vendas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_vendas_cliente_id ON vendas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_vendas_pedido_id ON vendas(pedido_id);

CREATE TRIGGER update_vendas_updated_at
  BEFORE UPDATE ON vendas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 16. VENDA_ITENS
-- =============================================
CREATE TABLE IF NOT EXISTS venda_itens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  venda_id UUID NOT NULL REFERENCES vendas(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  quantidade INTEGER NOT NULL DEFAULT 1,
  valor_unitario DECIMAL(10,2) NOT NULL,
  valor_total DECIMAL(12,2) GENERATED ALWAYS AS (quantidade * valor_unitario) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_venda_itens_venda_id ON venda_itens(venda_id);
CREATE INDEX IF NOT EXISTS idx_venda_itens_produto_id ON venda_itens(produto_id);

-- =============================================
-- 17. CAPACIDADE_FAZENDAS
-- =============================================
CREATE TABLE IF NOT EXISTS capacidade_fazendas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  fazenda_id UUID NOT NULL REFERENCES fazendas(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  capacidade_total INTEGER NOT NULL,
  capacidade_ocupada INTEGER DEFAULT 0,
  capacidade_livre INTEGER GENERATED ALWAYS AS (capacidade_total - capacidade_ocupada) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(fazenda_id, data)
);

CREATE INDEX IF NOT EXISTS idx_capacidade_fazendas_empresa_id ON capacidade_fazendas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_capacidade_fazendas_fazenda_id ON capacidade_fazendas(fazenda_id);

CREATE TRIGGER update_capacidade_fazendas_updated_at
  BEFORE UPDATE ON capacidade_fazendas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 18. PREVISAO_COLHEITA
-- =============================================
CREATE TABLE IF NOT EXISTS previsao_colheita (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  producao_id UUID NOT NULL REFERENCES producao(id) ON DELETE CASCADE,
  especie_id UUID NOT NULL REFERENCES especies(id) ON DELETE CASCADE,
  data_prevista DATE NOT NULL,
  quantidade_prevista INTEGER NOT NULL,
  quantidade_colhida INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_previsao_colheita_empresa_id ON previsao_colheita(empresa_id);
CREATE INDEX IF NOT EXISTS idx_previsao_colheita_producao_id ON previsao_colheita(producao_id);

CREATE TRIGGER update_previsao_colheita_updated_at
  BEFORE UPDATE ON previsao_colheita
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- RLS POLICIES (Row Level Security)
-- =============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE fazendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE especies ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE lotes_sementes ENABLE ROW LEVEL SECURITY;
ALTER TABLE estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimentacoes_estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE tabelas_preco ENABLE ROW LEVEL SECURITY;
ALTER TABLE tabela_preco_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedido_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE contratos ENABLE ROW LEVEL SECURITY;
ALTER TABLE contrato_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE producao ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE venda_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE capacidade_fazendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE previsao_colheita ENABLE ROW LEVEL SECURITY;

-- Funcao auxiliar para verificar se usuario tem acesso a empresa
CREATE OR REPLACE FUNCTION user_has_access_to_empresa(empresa_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM empresa_usuarios
    WHERE empresa_usuarios.empresa_id = $1
    AND empresa_usuarios.user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies para CLIENTES
CREATE POLICY "Users can view clientes of their empresas" ON clientes
  FOR SELECT USING (user_has_access_to_empresa(empresa_id));
CREATE POLICY "Users can insert clientes to their empresas" ON clientes
  FOR INSERT WITH CHECK (user_has_access_to_empresa(empresa_id));
CREATE POLICY "Users can update clientes of their empresas" ON clientes
  FOR UPDATE USING (user_has_access_to_empresa(empresa_id));
CREATE POLICY "Users can delete clientes of their empresas" ON clientes
  FOR DELETE USING (user_has_access_to_empresa(empresa_id));

-- Policies para FAZENDAS
CREATE POLICY "Users can view fazendas of their empresas" ON fazendas
  FOR SELECT USING (user_has_access_to_empresa(empresa_id));
CREATE POLICY "Users can insert fazendas to their empresas" ON fazendas
  FOR INSERT WITH CHECK (user_has_access_to_empresa(empresa_id));
CREATE POLICY "Users can update fazendas of their empresas" ON fazendas
  FOR UPDATE USING (user_has_access_to_empresa(empresa_id));
CREATE POLICY "Users can delete fazendas of their empresas" ON fazendas
  FOR DELETE USING (user_has_access_to_empresa(empresa_id));

-- Policies para ESPECIES
CREATE POLICY "Users can view especies of their empresas" ON especies
  FOR SELECT USING (user_has_access_to_empresa(empresa_id));
CREATE POLICY "Users can insert especies to their empresas" ON especies
  FOR INSERT WITH CHECK (user_has_access_to_empresa(empresa_id));
CREATE POLICY "Users can update especies of their empresas" ON especies
  FOR UPDATE USING (user_has_access_to_empresa(empresa_id));
CREATE POLICY "Users can delete especies of their empresas" ON especies
  FOR DELETE USING (user_has_access_to_empresa(empresa_id));

-- Policies para PRODUTOS
CREATE POLICY "Users can view produtos of their empresas" ON produtos
  FOR SELECT USING (user_has_access_to_empresa(empresa_id));
CREATE POLICY "Users can insert produtos to their empresas" ON produtos
  FOR INSERT WITH CHECK (user_has_access_to_empresa(empresa_id));
CREATE POLICY "Users can update produtos of their empresas" ON produtos
  FOR UPDATE USING (user_has_access_to_empresa(empresa_id));
CREATE POLICY "Users can delete produtos of their empresas" ON produtos
  FOR DELETE USING (user_has_access_to_empresa(empresa_id));

-- Policies para LOTES_SEMENTES
CREATE POLICY "Users can view lotes_sementes of their empresas" ON lotes_sementes
  FOR SELECT USING (user_has_access_to_empresa(empresa_id));
CREATE POLICY "Users can insert lotes_sementes to their empresas" ON lotes_sementes
  FOR INSERT WITH CHECK (user_has_access_to_empresa(empresa_id));
CREATE POLICY "Users can update lotes_sementes of their empresas" ON lotes_sementes
  FOR UPDATE USING (user_has_access_to_empresa(empresa_id));
CREATE POLICY "Users can delete lotes_sementes of their empresas" ON lotes_sementes
  FOR DELETE USING (user_has_access_to_empresa(empresa_id));

-- Policies para ESTOQUE
CREATE POLICY "Users can view estoque of their empresas" ON estoque
  FOR SELECT USING (user_has_access_to_empresa(empresa_id));
CREATE POLICY "Users can insert estoque to their empresas" ON estoque
  FOR INSERT WITH CHECK (user_has_access_to_empresa(empresa_id));
CREATE POLICY "Users can update estoque of their empresas" ON estoque
  FOR UPDATE USING (user_has_access_to_empresa(empresa_id));
CREATE POLICY "Users can delete estoque of their empresas" ON estoque
  FOR DELETE USING (user_has_access_to_empresa(empresa_id));

-- Policies para MOVIMENTACOES_ESTOQUE
CREATE POLICY "Users can view movimentacoes_estoque of their empresas" ON movimentacoes_estoque
  FOR SELECT USING (user_has_access_to_empresa(empresa_id));
CREATE POLICY "Users can insert movimentacoes_estoque to their empresas" ON movimentacoes_estoque
  FOR INSERT WITH CHECK (user_has_access_to_empresa(empresa_id));

-- Policies para TABELAS_PRECO
CREATE POLICY "Users can view tabelas_preco of their empresas" ON tabelas_preco
  FOR SELECT USING (user_has_access_to_empresa(empresa_id));
CREATE POLICY "Users can insert tabelas_preco to their empresas" ON tabelas_preco
  FOR INSERT WITH CHECK (user_has_access_to_empresa(empresa_id));
CREATE POLICY "Users can update tabelas_preco of their empresas" ON tabelas_preco
  FOR UPDATE USING (user_has_access_to_empresa(empresa_id));
CREATE POLICY "Users can delete tabelas_preco of their empresas" ON tabelas_preco
  FOR DELETE USING (user_has_access_to_empresa(empresa_id));

-- Policies para TABELA_PRECO_ITENS (via tabelas_preco)
CREATE POLICY "Users can view tabela_preco_itens of their empresas" ON tabela_preco_itens
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM tabelas_preco tp
    WHERE tp.id = tabela_preco_itens.tabela_preco_id
    AND user_has_access_to_empresa(tp.empresa_id)
  ));
CREATE POLICY "Users can insert tabela_preco_itens to their empresas" ON tabela_preco_itens
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM tabelas_preco tp
    WHERE tp.id = tabela_preco_itens.tabela_preco_id
    AND user_has_access_to_empresa(tp.empresa_id)
  ));
CREATE POLICY "Users can update tabela_preco_itens of their empresas" ON tabela_preco_itens
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM tabelas_preco tp
    WHERE tp.id = tabela_preco_itens.tabela_preco_id
    AND user_has_access_to_empresa(tp.empresa_id)
  ));
CREATE POLICY "Users can delete tabela_preco_itens of their empresas" ON tabela_preco_itens
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM tabelas_preco tp
    WHERE tp.id = tabela_preco_itens.tabela_preco_id
    AND user_has_access_to_empresa(tp.empresa_id)
  ));

-- Policies para PEDIDOS
CREATE POLICY "Users can view pedidos of their empresas" ON pedidos
  FOR SELECT USING (user_has_access_to_empresa(empresa_id));
CREATE POLICY "Users can insert pedidos to their empresas" ON pedidos
  FOR INSERT WITH CHECK (user_has_access_to_empresa(empresa_id));
CREATE POLICY "Users can update pedidos of their empresas" ON pedidos
  FOR UPDATE USING (user_has_access_to_empresa(empresa_id));
CREATE POLICY "Users can delete pedidos of their empresas" ON pedidos
  FOR DELETE USING (user_has_access_to_empresa(empresa_id));

-- Policies para PEDIDO_ITENS (via pedidos)
CREATE POLICY "Users can view pedido_itens of their empresas" ON pedido_itens
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM pedidos p
    WHERE p.id = pedido_itens.pedido_id
    AND user_has_access_to_empresa(p.empresa_id)
  ));
CREATE POLICY "Users can insert pedido_itens to their empresas" ON pedido_itens
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM pedidos p
    WHERE p.id = pedido_itens.pedido_id
    AND user_has_access_to_empresa(p.empresa_id)
  ));
CREATE POLICY "Users can update pedido_itens of their empresas" ON pedido_itens
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM pedidos p
    WHERE p.id = pedido_itens.pedido_id
    AND user_has_access_to_empresa(p.empresa_id)
  ));
CREATE POLICY "Users can delete pedido_itens of their empresas" ON pedido_itens
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM pedidos p
    WHERE p.id = pedido_itens.pedido_id
    AND user_has_access_to_empresa(p.empresa_id)
  ));

-- Policies para CONTRATOS
CREATE POLICY "Users can view contratos of their empresas" ON contratos
  FOR SELECT USING (user_has_access_to_empresa(empresa_id));
CREATE POLICY "Users can insert contratos to their empresas" ON contratos
  FOR INSERT WITH CHECK (user_has_access_to_empresa(empresa_id));
CREATE POLICY "Users can update contratos of their empresas" ON contratos
  FOR UPDATE USING (user_has_access_to_empresa(empresa_id));
CREATE POLICY "Users can delete contratos of their empresas" ON contratos
  FOR DELETE USING (user_has_access_to_empresa(empresa_id));

-- Policies para CONTRATO_ITENS (via contratos)
CREATE POLICY "Users can view contrato_itens of their empresas" ON contrato_itens
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM contratos c
    WHERE c.id = contrato_itens.contrato_id
    AND user_has_access_to_empresa(c.empresa_id)
  ));
CREATE POLICY "Users can insert contrato_itens to their empresas" ON contrato_itens
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM contratos c
    WHERE c.id = contrato_itens.contrato_id
    AND user_has_access_to_empresa(c.empresa_id)
  ));
CREATE POLICY "Users can update contrato_itens of their empresas" ON contrato_itens
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM contratos c
    WHERE c.id = contrato_itens.contrato_id
    AND user_has_access_to_empresa(c.empresa_id)
  ));
CREATE POLICY "Users can delete contrato_itens of their empresas" ON contrato_itens
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM contratos c
    WHERE c.id = contrato_itens.contrato_id
    AND user_has_access_to_empresa(c.empresa_id)
  ));

-- Policies para PRODUCAO
CREATE POLICY "Users can view producao of their empresas" ON producao
  FOR SELECT USING (user_has_access_to_empresa(empresa_id));
CREATE POLICY "Users can insert producao to their empresas" ON producao
  FOR INSERT WITH CHECK (user_has_access_to_empresa(empresa_id));
CREATE POLICY "Users can update producao of their empresas" ON producao
  FOR UPDATE USING (user_has_access_to_empresa(empresa_id));
CREATE POLICY "Users can delete producao of their empresas" ON producao
  FOR DELETE USING (user_has_access_to_empresa(empresa_id));

-- Policies para VENDAS
CREATE POLICY "Users can view vendas of their empresas" ON vendas
  FOR SELECT USING (user_has_access_to_empresa(empresa_id));
CREATE POLICY "Users can insert vendas to their empresas" ON vendas
  FOR INSERT WITH CHECK (user_has_access_to_empresa(empresa_id));
CREATE POLICY "Users can update vendas of their empresas" ON vendas
  FOR UPDATE USING (user_has_access_to_empresa(empresa_id));
CREATE POLICY "Users can delete vendas of their empresas" ON vendas
  FOR DELETE USING (user_has_access_to_empresa(empresa_id));

-- Policies para VENDA_ITENS (via vendas)
CREATE POLICY "Users can view venda_itens of their empresas" ON venda_itens
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM vendas v
    WHERE v.id = venda_itens.venda_id
    AND user_has_access_to_empresa(v.empresa_id)
  ));
CREATE POLICY "Users can insert venda_itens to their empresas" ON venda_itens
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM vendas v
    WHERE v.id = venda_itens.venda_id
    AND user_has_access_to_empresa(v.empresa_id)
  ));
CREATE POLICY "Users can update venda_itens of their empresas" ON venda_itens
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM vendas v
    WHERE v.id = venda_itens.venda_id
    AND user_has_access_to_empresa(v.empresa_id)
  ));
CREATE POLICY "Users can delete venda_itens of their empresas" ON venda_itens
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM vendas v
    WHERE v.id = venda_itens.venda_id
    AND user_has_access_to_empresa(v.empresa_id)
  ));

-- Policies para CAPACIDADE_FAZENDAS
CREATE POLICY "Users can view capacidade_fazendas of their empresas" ON capacidade_fazendas
  FOR SELECT USING (user_has_access_to_empresa(empresa_id));
CREATE POLICY "Users can insert capacidade_fazendas to their empresas" ON capacidade_fazendas
  FOR INSERT WITH CHECK (user_has_access_to_empresa(empresa_id));
CREATE POLICY "Users can update capacidade_fazendas of their empresas" ON capacidade_fazendas
  FOR UPDATE USING (user_has_access_to_empresa(empresa_id));
CREATE POLICY "Users can delete capacidade_fazendas of their empresas" ON capacidade_fazendas
  FOR DELETE USING (user_has_access_to_empresa(empresa_id));

-- Policies para PREVISAO_COLHEITA
CREATE POLICY "Users can view previsao_colheita of their empresas" ON previsao_colheita
  FOR SELECT USING (user_has_access_to_empresa(empresa_id));
CREATE POLICY "Users can insert previsao_colheita to their empresas" ON previsao_colheita
  FOR INSERT WITH CHECK (user_has_access_to_empresa(empresa_id));
CREATE POLICY "Users can update previsao_colheita of their empresas" ON previsao_colheita
  FOR UPDATE USING (user_has_access_to_empresa(empresa_id));
CREATE POLICY "Users can delete previsao_colheita of their empresas" ON previsao_colheita
  FOR DELETE USING (user_has_access_to_empresa(empresa_id));

-- =============================================
-- STORAGE BUCKETS ADICIONAIS
-- =============================================

-- Bucket para imagens de especies
INSERT INTO storage.buckets (id, name, public)
VALUES ('especies', 'especies', true)
ON CONFLICT (id) DO NOTHING;

-- Policy para upload de imagens de especies
CREATE POLICY "Authenticated users can upload especies images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'especies');

CREATE POLICY "Anyone can view especies images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'especies');

CREATE POLICY "Authenticated users can update especies images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'especies');

CREATE POLICY "Authenticated users can delete especies images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'especies');
