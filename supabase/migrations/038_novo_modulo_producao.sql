-- ============================================================
-- Migration 038: Novo Modulo de Producao
-- ============================================================
-- Cria tabelas novas para o modulo de producao redesenhado.
-- Tabelas legado (producao, plantios, colheitas, etc.) ficam intactas.
-- Unidade base: unidades (nao bandejas/gramas).
-- Status: planejado → germinando → luz → colhendo → finalizado / cancelado
-- ============================================================

-- 1. Tabela principal de producoes
CREATE TABLE IF NOT EXISTS producoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  tipo VARCHAR(10) NOT NULL DEFAULT 'simples' CHECK (tipo IN ('simples', 'mix')),
  fazenda_id UUID REFERENCES fazendas(id) ON DELETE SET NULL,
  quantidade_planejada INTEGER NOT NULL,
  recorrente BOOLEAN DEFAULT FALSE,
  producao_recorrente_id UUID, -- FK adicionada apos criacao de producoes_recorrentes
  status VARCHAR(20) NOT NULL DEFAULT 'planejado' CHECK (status IN (
    'planejado', 'germinando', 'luz', 'colhendo', 'finalizado', 'cancelado'
  )),

  -- Timestamps de cada transicao de status (para metricas)
  data_planejado TIMESTAMPTZ DEFAULT NOW(),
  data_germinando TIMESTAMPTZ,
  data_luz TIMESTAMPTZ,
  data_colhendo TIMESTAMPTZ,
  data_finalizado TIMESTAMPTZ,
  data_cancelado TIMESTAMPTZ,

  -- Datas previstas (calculadas a partir do lote de semente)
  data_plantio_prevista DATE,
  data_luz_prevista DATE,
  data_colheita_prevista DATE,

  -- Datas reais (preenchidas nas transicoes)
  data_plantio_real DATE,
  data_luz_real DATE,

  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_producoes_empresa_id ON producoes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_producoes_status ON producoes(status);
CREATE INDEX IF NOT EXISTS idx_producoes_fazenda_id ON producoes(fazenda_id);
CREATE INDEX IF NOT EXISTS idx_producoes_data_colheita ON producoes(data_colheita_prevista);
CREATE INDEX IF NOT EXISTS idx_producoes_recorrente_id ON producoes(producao_recorrente_id);

CREATE TRIGGER update_producoes_updated_at
  BEFORE UPDATE ON producoes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- 2. Dados por especie dentro de cada producao
-- Simples: 1 linha. Mix: 2 linhas (50/50).
CREATE TABLE IF NOT EXISTS producao_especies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  producao_id UUID NOT NULL REFERENCES producoes(id) ON DELETE CASCADE,
  especie_id UUID NOT NULL REFERENCES especies(id) ON DELETE CASCADE,
  lote_semente_id UUID REFERENCES lotes_sementes(id) ON DELETE SET NULL,

  -- Quantidades em unidades
  quantidade_planejada INTEGER NOT NULL,       -- simples=total, mix=total/2
  quantidade_plantada INTEGER,                  -- preenchido ao registrar plantio
  quantidade_germinada INTEGER,                 -- preenchido ao registrar luz
  perda_germinacao INTEGER DEFAULT 0,           -- plantada - germinada

  -- Colheita (totalizador atualizado a cada colheita)
  total_colhido INTEGER DEFAULT 0,              -- soma de producao_colheitas
  perda_final INTEGER DEFAULT 0,                -- germinada - total_colhido (calculado ao finalizar)

  -- Datas previstas por especie (podem diferir no mix por tempos diferentes)
  data_plantio_prevista DATE,
  data_luz_prevista DATE,

  UNIQUE(producao_id, especie_id)
);

CREATE INDEX IF NOT EXISTS idx_producao_especies_producao_id ON producao_especies(producao_id);
CREATE INDEX IF NOT EXISTS idx_producao_especies_especie_id ON producao_especies(especie_id);
CREATE INDEX IF NOT EXISTS idx_producao_especies_lote_id ON producao_especies(lote_semente_id);


-- 3. Registros individuais de colheita (multiplas por producao)
-- A 1a colheita muda o status da producao para 'colhendo'.
CREATE TABLE IF NOT EXISTS producao_colheitas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  producao_id UUID NOT NULL REFERENCES producoes(id) ON DELETE CASCADE,
  especie_id UUID NOT NULL REFERENCES especies(id) ON DELETE CASCADE,
  data_colheita DATE NOT NULL,
  quantidade INTEGER NOT NULL,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_producao_colheitas_producao_id ON producao_colheitas(producao_id);
CREATE INDEX IF NOT EXISTS idx_producao_colheitas_especie_id ON producao_colheitas(especie_id);
CREATE INDEX IF NOT EXISTS idx_producao_colheitas_data ON producao_colheitas(data_colheita);


-- 4. Templates de producao recorrente
CREATE TABLE IF NOT EXISTS producoes_recorrentes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  tipo VARCHAR(10) NOT NULL DEFAULT 'simples' CHECK (tipo IN ('simples', 'mix')),
  especie_id_1 UUID NOT NULL REFERENCES especies(id),
  especie_id_2 UUID REFERENCES especies(id),
  lote_semente_id_1 UUID REFERENCES lotes_sementes(id),
  lote_semente_id_2 UUID REFERENCES lotes_sementes(id),
  quantidade INTEGER NOT NULL,
  fazenda_id UUID REFERENCES fazendas(id) ON DELETE SET NULL,
  intervalo_dias INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ativa' CHECK (status IN ('ativa', 'pausada', 'encerrada')),
  ultima_geracao DATE,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_producoes_recorrentes_empresa_id ON producoes_recorrentes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_producoes_recorrentes_status ON producoes_recorrentes(status);

CREATE TRIGGER update_producoes_recorrentes_updated_at
  BEFORE UPDATE ON producoes_recorrentes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- 5. Adicionar FK de producoes → producoes_recorrentes (agora que a tabela existe)
ALTER TABLE producoes
ADD CONSTRAINT fk_producoes_recorrente
FOREIGN KEY (producao_recorrente_id) REFERENCES producoes_recorrentes(id) ON DELETE SET NULL;
