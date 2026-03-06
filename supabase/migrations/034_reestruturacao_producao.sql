-- =============================================
-- BIOMA OS - Reestruturacao do Modulo de Producao
-- Mover campos operacionais para lotes_sementes
-- Criar tabelas: plantios, tarefas, colheitas, excedentes, etc.
-- =============================================

-- =============================================
-- 1. Adicionar campos operacionais ao lotes_sementes
-- (rendimento e margem vem de especies)
-- =============================================
ALTER TABLE lotes_sementes
ADD COLUMN IF NOT EXISTS rendimento_por_bandeja DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS margem_seguranca DECIMAL(5,2) DEFAULT 0;

COMMENT ON COLUMN lotes_sementes.rendimento_por_bandeja IS 'Gramas colhidas por bandeja (yield per tray) - antes ficava em especies';
COMMENT ON COLUMN lotes_sementes.margem_seguranca IS 'Margem de seguranca para producao (ex: 0.10 = 10%) - antes ficava em especies';

-- =============================================
-- 2. Migrar dados existentes de especies -> lotes_sementes
-- Copia valores default para lotes que ainda nao tem
-- =============================================
UPDATE lotes_sementes ls
SET
  rendimento_por_bandeja = COALESCE(ls.rendimento_por_bandeja, e.rendimento_por_bandeja),
  margem_seguranca = COALESCE(ls.margem_seguranca, e.margem_seguranca)
FROM especies e
WHERE ls.especie_id = e.id
  AND (ls.rendimento_por_bandeja IS NULL OR ls.margem_seguranca IS NULL OR ls.margem_seguranca = 0);

-- Nota: campos em especies (rendimento_por_bandeja, densidade_semeadura, margem_seguranca)
-- ficam como deprecated. Serao removidos em migration futura apos validacao.

-- =============================================
-- 3. Colheitas (agrupadas por data)
-- =============================================
CREATE TABLE IF NOT EXISTS colheitas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  data_colheita DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'parcial', 'concluida')),
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(empresa_id, data_colheita)
);

CREATE INDEX IF NOT EXISTS idx_colheitas_empresa_id ON colheitas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_colheitas_data ON colheitas(data_colheita);
CREATE INDEX IF NOT EXISTS idx_colheitas_status ON colheitas(status);

COMMENT ON TABLE colheitas IS 'Colheitas agrupadas por data - cada data tem uma unica colheita por empresa';

-- =============================================
-- 4. Plantios (substituem tabela producao gradualmente)
-- =============================================
CREATE TABLE IF NOT EXISTS plantios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  especie_id UUID NOT NULL REFERENCES especies(id) ON DELETE CASCADE,
  lote_semente_id UUID NOT NULL REFERENCES lotes_sementes(id) ON DELETE RESTRICT,
  pedido_item_id UUID REFERENCES pedido_itens(id) ON DELETE SET NULL,
  plantio_recorrente_id UUID, -- FK adicionada apos criar plantios_recorrentes
  colheita_id UUID REFERENCES colheitas(id) ON DELETE SET NULL,
  fazenda_id UUID REFERENCES fazendas(id) ON DELETE SET NULL,
  bandejas DECIMAL(10,2) NOT NULL,
  bandejas_perdidas DECIMAL(10,2) DEFAULT 0,
  semente_necessaria_g DECIMAL(10,2),
  rendimento_esperado_g DECIMAL(10,2),
  rendimento_alocado_g DECIMAL(10,2),
  excedente_g DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'planejado' CHECK (status IN (
    'planejado', 'em_andamento', 'colhido', 'cancelado'
  )),
  etapa_atual VARCHAR(100),
  data_plantio DATE,
  data_colheita DATE NOT NULL,
  data_validade DATE,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plantios_empresa_id ON plantios(empresa_id);
CREATE INDEX IF NOT EXISTS idx_plantios_especie_id ON plantios(especie_id);
CREATE INDEX IF NOT EXISTS idx_plantios_lote_id ON plantios(lote_semente_id);
CREATE INDEX IF NOT EXISTS idx_plantios_colheita_id ON plantios(colheita_id);
CREATE INDEX IF NOT EXISTS idx_plantios_fazenda_id ON plantios(fazenda_id);
CREATE INDEX IF NOT EXISTS idx_plantios_status ON plantios(status);
CREATE INDEX IF NOT EXISTS idx_plantios_data_colheita ON plantios(data_colheita);
CREATE INDEX IF NOT EXISTS idx_plantios_data_plantio ON plantios(data_plantio);
CREATE INDEX IF NOT EXISTS idx_plantios_pedido_item_id ON plantios(pedido_item_id);

COMMENT ON TABLE plantios IS 'Plantios individuais - substituem tabela producao. Lote obrigatorio.';

-- =============================================
-- 5. Tarefas (auto-geradas das etapas ou manuais)
-- =============================================
CREATE TABLE IF NOT EXISTS tarefas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  plantio_id UUID REFERENCES plantios(id) ON DELETE CASCADE,
  tarefa_recorrente_id UUID, -- FK adicionada apos criar tarefas_recorrentes
  nome VARCHAR(200) NOT NULL,
  descricao TEXT,
  tipo VARCHAR(20) DEFAULT 'cultivo' CHECK (tipo IN ('cultivo', 'manual', 'recorrente')),
  bandejas DECIMAL(10,2),
  especie_id UUID REFERENCES especies(id) ON DELETE SET NULL,
  data_prevista DATE NOT NULL,
  data_conclusao DATE,
  concluida BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tarefas_empresa_id ON tarefas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_plantio_id ON tarefas(plantio_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_especie_id ON tarefas(especie_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_data_prevista ON tarefas(data_prevista);
CREATE INDEX IF NOT EXISTS idx_tarefas_concluida ON tarefas(concluida);
CREATE INDEX IF NOT EXISTS idx_tarefas_tipo ON tarefas(tipo);

COMMENT ON TABLE tarefas IS 'Tarefas de cultivo (auto-geradas das etapas) ou manuais';

-- =============================================
-- 6. Colheita Itens (detalhe por especie dentro de uma colheita)
-- =============================================
CREATE TABLE IF NOT EXISTS colheita_itens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  colheita_id UUID NOT NULL REFERENCES colheitas(id) ON DELETE CASCADE,
  especie_id UUID NOT NULL REFERENCES especies(id) ON DELETE CASCADE,
  bandejas DECIMAL(10,2) NOT NULL,
  rendimento_esperado_g DECIMAL(10,2),
  peso_necessario_g DECIMAL(10,2),
  excedente_g DECIMAL(10,2) DEFAULT 0,
  colhido BOOLEAN DEFAULT FALSE,
  notas TEXT,
  UNIQUE(colheita_id, especie_id)
);

CREATE INDEX IF NOT EXISTS idx_colheita_itens_colheita_id ON colheita_itens(colheita_id);
CREATE INDEX IF NOT EXISTS idx_colheita_itens_especie_id ON colheita_itens(especie_id);

COMMENT ON TABLE colheita_itens IS 'Detalhe por especie de cada colheita - bandejas, rendimento, excedente';

-- =============================================
-- 7. Excedentes (surpluses)
-- =============================================
CREATE TABLE IF NOT EXISTS excedentes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  especie_id UUID NOT NULL REFERENCES especies(id) ON DELETE CASCADE,
  plantio_id UUID REFERENCES plantios(id) ON DELETE SET NULL,
  pedido_id UUID REFERENCES pedidos(id) ON DELETE SET NULL,
  quantidade_g DECIMAL(10,2) NOT NULL,
  bandejas DECIMAL(10,2),
  motivo VARCHAR(50) CHECK (motivo IN (
    'arredondamento', 'pedido_cancelado', 'pedido_modificado'
  )),
  consumido BOOLEAN DEFAULT FALSE,
  consumido_por_pedido_id UUID REFERENCES pedidos(id) ON DELETE SET NULL,
  data_disponivel DATE NOT NULL,
  data_validade DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_excedentes_empresa_id ON excedentes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_excedentes_especie_id ON excedentes(especie_id);
CREATE INDEX IF NOT EXISTS idx_excedentes_consumido ON excedentes(consumido);
CREATE INDEX IF NOT EXISTS idx_excedentes_data_disponivel ON excedentes(data_disponivel);

COMMENT ON TABLE excedentes IS 'Excedentes de producao - arredondamento de bandejas ou pedidos cancelados/modificados';

-- =============================================
-- 8. Bandejas Perdidas (lost trays)
-- =============================================
CREATE TABLE IF NOT EXISTS bandejas_perdidas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  plantio_id UUID NOT NULL REFERENCES plantios(id) ON DELETE CASCADE,
  especie_id UUID NOT NULL REFERENCES especies(id) ON DELETE CASCADE,
  bandejas DECIMAL(10,2) NOT NULL,
  motivo VARCHAR(100) CHECK (motivo IN (
    'mofo', 'praga', 'erro_irrigacao', 'semente_ruim', 'outro'
  )),
  notas TEXT,
  data_registro DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bandejas_perdidas_empresa_id ON bandejas_perdidas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_bandejas_perdidas_plantio_id ON bandejas_perdidas(plantio_id);
CREATE INDEX IF NOT EXISTS idx_bandejas_perdidas_especie_id ON bandejas_perdidas(especie_id);
CREATE INDEX IF NOT EXISTS idx_bandejas_perdidas_data ON bandejas_perdidas(data_registro);

COMMENT ON TABLE bandejas_perdidas IS 'Registro de bandejas perdidas por plantio em andamento';

-- =============================================
-- 9. Pedidos Recorrentes
-- =============================================
CREATE TABLE IF NOT EXISTS pedidos_recorrentes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  nome VARCHAR(200),
  recorrencia_infinita BOOLEAN DEFAULT TRUE,
  data_inicio DATE NOT NULL,
  data_fim DATE,
  tipo_frequencia VARCHAR(30) NOT NULL CHECK (tipo_frequencia IN (
    'semanal', 'dia_semana', 'dia_util_mes'
  )),
  intervalo INTEGER DEFAULT 1,
  dia_semana INTEGER CHECK (dia_semana BETWEEN 0 AND 6),
  criar_atrasados BOOLEAN DEFAULT TRUE,
  ativo BOOLEAN DEFAULT TRUE,
  ultima_geracao DATE,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pedidos_recorrentes_empresa_id ON pedidos_recorrentes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_recorrentes_cliente_id ON pedidos_recorrentes(cliente_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_recorrentes_ativo ON pedidos_recorrentes(ativo);

COMMENT ON TABLE pedidos_recorrentes IS 'Pedidos recorrentes - geram pedidos automaticamente por frequencia';
COMMENT ON COLUMN pedidos_recorrentes.tipo_frequencia IS 'semanal=a cada N semanas, dia_semana=a cada N-esimo dia da semana, dia_util_mes=a cada N-esimo dia util do mes';
COMMENT ON COLUMN pedidos_recorrentes.dia_semana IS '0=domingo, 1=segunda, ..., 6=sabado';

-- =============================================
-- 10. Pedido Recorrente Itens
-- =============================================
CREATE TABLE IF NOT EXISTS pedido_recorrente_itens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_recorrente_id UUID NOT NULL REFERENCES pedidos_recorrentes(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  quantidade DECIMAL(12,2) NOT NULL DEFAULT 1,
  preco_unitario DECIMAL(10,2),
  usar_excedentes BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_ped_rec_itens_pedido_id ON pedido_recorrente_itens(pedido_recorrente_id);
CREATE INDEX IF NOT EXISTS idx_ped_rec_itens_produto_id ON pedido_recorrente_itens(produto_id);

-- =============================================
-- 11. Plantios Recorrentes
-- =============================================
CREATE TABLE IF NOT EXISTS plantios_recorrentes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nome VARCHAR(200) NOT NULL,
  especie_id UUID NOT NULL REFERENCES especies(id) ON DELETE CASCADE,
  lote_semente_id UUID REFERENCES lotes_sementes(id) ON DELETE SET NULL,
  fazenda_id UUID REFERENCES fazendas(id) ON DELETE SET NULL,
  bandejas DECIMAL(10,2) NOT NULL,
  recorrencia_infinita BOOLEAN DEFAULT TRUE,
  data_inicio DATE NOT NULL,
  data_fim DATE,
  tipo_frequencia VARCHAR(30) NOT NULL CHECK (tipo_frequencia IN (
    'semanal', 'dia_semana', 'dia_util_mes'
  )),
  intervalo INTEGER DEFAULT 1,
  dia_semana INTEGER CHECK (dia_semana BETWEEN 0 AND 6),
  criar_atrasados BOOLEAN DEFAULT TRUE,
  ativo BOOLEAN DEFAULT TRUE,
  ultima_geracao DATE,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plantios_recorrentes_empresa_id ON plantios_recorrentes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_plantios_recorrentes_ativo ON plantios_recorrentes(ativo);

COMMENT ON TABLE plantios_recorrentes IS 'Plantios recorrentes - producao especulativa sem pedido';

-- =============================================
-- 12. Tarefas Recorrentes
-- =============================================
CREATE TABLE IF NOT EXISTS tarefas_recorrentes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nome VARCHAR(200) NOT NULL,
  descricao TEXT,
  recorrencia_infinita BOOLEAN DEFAULT TRUE,
  data_inicio DATE NOT NULL,
  data_fim DATE,
  tipo_frequencia VARCHAR(30) NOT NULL CHECK (tipo_frequencia IN (
    'semanal', 'dia_semana', 'dia_util_mes'
  )),
  intervalo INTEGER DEFAULT 1,
  dia_semana INTEGER CHECK (dia_semana BETWEEN 0 AND 6),
  criar_atrasados BOOLEAN DEFAULT TRUE,
  ativo BOOLEAN DEFAULT TRUE,
  ultima_geracao DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tarefas_recorrentes_empresa_id ON tarefas_recorrentes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_recorrentes_ativo ON tarefas_recorrentes(ativo);

COMMENT ON TABLE tarefas_recorrentes IS 'Tarefas recorrentes nao-cultivo (limpeza, manutencao, inventario)';

-- =============================================
-- 13. Adicionar FK de recorrentes nos plantios e tarefas
-- =============================================
ALTER TABLE plantios
ADD CONSTRAINT fk_plantios_recorrente
FOREIGN KEY (plantio_recorrente_id) REFERENCES plantios_recorrentes(id) ON DELETE SET NULL;

ALTER TABLE tarefas
ADD CONSTRAINT fk_tarefas_recorrente
FOREIGN KEY (tarefa_recorrente_id) REFERENCES tarefas_recorrentes(id) ON DELETE SET NULL;

-- =============================================
-- 14. Campos adicionais em pedidos
-- =============================================
ALTER TABLE pedidos
ADD COLUMN IF NOT EXISTS usar_excedentes BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS pedido_recorrente_id UUID REFERENCES pedidos_recorrentes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_pedidos_recorrente_id ON pedidos(pedido_recorrente_id);
