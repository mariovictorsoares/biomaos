-- Tabela de logs/historico de acoes na producao
CREATE TABLE IF NOT EXISTS producao_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  producao_id UUID NOT NULL REFERENCES producoes(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL,
  usuario_email TEXT,
  acao TEXT NOT NULL,
  dados JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_producao_logs_producao_id ON producao_logs(producao_id);
CREATE INDEX IF NOT EXISTS idx_producao_logs_created_at ON producao_logs(created_at);
