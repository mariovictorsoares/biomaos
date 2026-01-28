-- =============================================
-- 1. TABELA DE EMPRESAS
-- =============================================
CREATE TABLE empresas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cnpj VARCHAR(18) UNIQUE,
  razao_social VARCHAR(255) NOT NULL,
  nome_fantasia VARCHAR(255),
  logo_url TEXT,
  num_funcionarios INTEGER DEFAULT 0,
  cep VARCHAR(9),
  endereco VARCHAR(255),
  numero VARCHAR(20),
  complemento VARCHAR(100),
  estado VARCHAR(2),
  cidade VARCHAR(100),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_empresas_updated_at
  BEFORE UPDATE ON empresas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Indices para busca
CREATE INDEX idx_empresas_cnpj ON empresas(cnpj);
CREATE INDEX idx_empresas_nome_fantasia ON empresas(nome_fantasia);
