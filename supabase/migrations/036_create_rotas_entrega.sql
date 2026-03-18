-- 036_create_rotas_entrega.sql
-- Modulo de gestao de rotas de entrega: motoristas, rotas e paradas

-- Motoristas
CREATE TABLE motoristas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id),
  nome TEXT NOT NULL,
  telefone TEXT,
  veiculo TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_motoristas_empresa_id ON motoristas(empresa_id);

-- Rotas de entrega
CREATE TABLE rotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id),
  data_rota DATE NOT NULL,
  motorista_id UUID REFERENCES motoristas(id),
  status TEXT NOT NULL DEFAULT 'planejada'
    CHECK (status IN ('planejada', 'em_andamento', 'finalizada')),
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_rotas_empresa_data ON rotas(empresa_id, data_rota);

-- Paradas da rota (entregas individuais)
CREATE TABLE rota_paradas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rota_id UUID NOT NULL REFERENCES rotas(id) ON DELETE CASCADE,
  pedido_id UUID NOT NULL REFERENCES pedidos(id),
  cliente_id UUID NOT NULL REFERENCES clientes(id),
  ordem INTEGER NOT NULL DEFAULT 0,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_rota_paradas_rota_id ON rota_paradas(rota_id);
