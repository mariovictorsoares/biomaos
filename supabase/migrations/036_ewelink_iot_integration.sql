-- =============================================
-- BIOMA OS - INTEGRAÇÃO IoT eWeLink
-- Tabelas para monitoramento ambiental via
-- dispositivos Sonoff (TH10/TH16, SNZB-02)
-- =============================================

-- =============================================
-- 1. CONTAS eWeLink (por empresa)
-- =============================================

CREATE TABLE IF NOT EXISTS contas_ewelink (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  regiao VARCHAR(10) NOT NULL DEFAULT 'us'
    CHECK (regiao IN ('us', 'eu', 'cn', 'as')),
  access_token TEXT,
  refresh_token TEXT,
  user_apikey VARCHAR(100),
  token_expira_em TIMESTAMPTZ,
  ultimo_sync TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'ativo'
    CHECK (status IN ('ativo', 'inativo', 'erro_auth')),
  erro_mensagem TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(empresa_id, email)
);

CREATE INDEX IF NOT EXISTS idx_contas_ewelink_empresa_id ON contas_ewelink(empresa_id);
CREATE INDEX IF NOT EXISTS idx_contas_ewelink_status ON contas_ewelink(status);

CREATE TRIGGER update_contas_ewelink_updated_at
  BEFORE UPDATE ON contas_ewelink
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE contas_ewelink IS 'Contas eWeLink conectadas para monitoramento IoT';

-- =============================================
-- 2. DISPOSITIVOS IoT (mapeados a fazendas)
-- =============================================

CREATE TABLE IF NOT EXISTS dispositivos_iot (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  conta_ewelink_id UUID NOT NULL REFERENCES contas_ewelink(id) ON DELETE CASCADE,
  fazenda_id UUID REFERENCES fazendas(id) ON DELETE SET NULL,
  device_id VARCHAR(100) NOT NULL,
  nome VARCHAR(200) NOT NULL,
  nome_personalizado VARCHAR(200),
  modelo VARCHAR(100),
  uiid INTEGER,
  marca VARCHAR(100),
  online BOOLEAN DEFAULT false,
  tem_temperatura BOOLEAN DEFAULT false,
  tem_umidade BOOLEAN DEFAULT false,
  temperatura_atual DECIMAL(5,2),
  umidade_atual DECIMAL(5,2),
  ultima_leitura TIMESTAMPTZ,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(empresa_id, device_id)
);

CREATE INDEX IF NOT EXISTS idx_dispositivos_iot_empresa_id ON dispositivos_iot(empresa_id);
CREATE INDEX IF NOT EXISTS idx_dispositivos_iot_conta_id ON dispositivos_iot(conta_ewelink_id);
CREATE INDEX IF NOT EXISTS idx_dispositivos_iot_fazenda_id ON dispositivos_iot(fazenda_id);
CREATE INDEX IF NOT EXISTS idx_dispositivos_iot_ativo ON dispositivos_iot(ativo);

CREATE TRIGGER update_dispositivos_iot_updated_at
  BEFORE UPDATE ON dispositivos_iot
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE dispositivos_iot IS 'Dispositivos IoT eWeLink (Sonoff TH10/TH16, SNZB-02) mapeados a fazendas';

-- =============================================
-- 3. LEITURAS DE SENSORES (serie temporal)
-- =============================================

CREATE TABLE IF NOT EXISTS leituras_sensores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  dispositivo_id UUID NOT NULL REFERENCES dispositivos_iot(id) ON DELETE CASCADE,
  temperatura DECIMAL(5,2),
  umidade DECIMAL(5,2),
  registrado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fonte VARCHAR(20) DEFAULT 'api'
    CHECK (fonte IN ('api', 'websocket', 'manual'))
);

CREATE INDEX IF NOT EXISTS idx_leituras_empresa_id ON leituras_sensores(empresa_id);
CREATE INDEX IF NOT EXISTS idx_leituras_dispositivo_id ON leituras_sensores(dispositivo_id);
CREATE INDEX IF NOT EXISTS idx_leituras_registrado_em ON leituras_sensores(registrado_em DESC);
CREATE INDEX IF NOT EXISTS idx_leituras_dispositivo_tempo ON leituras_sensores(dispositivo_id, registrado_em DESC);
CREATE INDEX IF NOT EXISTS idx_leituras_busca_principal ON leituras_sensores(empresa_id, dispositivo_id, registrado_em DESC);

COMMENT ON TABLE leituras_sensores IS 'Serie temporal de leituras de temperatura e umidade dos sensores IoT';

-- NOTA: Para retencao de dados, configurar cron job:
-- DELETE FROM leituras_sensores WHERE registrado_em < NOW() - INTERVAL '90 days';

-- =============================================
-- 4. CONFIGURAÇÃO DE ALERTAS IoT
-- =============================================

CREATE TABLE IF NOT EXISTS alertas_config_iot (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  dispositivo_id UUID NOT NULL REFERENCES dispositivos_iot(id) ON DELETE CASCADE,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('temperatura', 'umidade')),
  limite_min DECIMAL(5,2),
  limite_max DECIMAL(5,2),
  ativo BOOLEAN DEFAULT true,
  notificar_email BOOLEAN DEFAULT false,
  email_destino VARCHAR(255),
  cooldown_minutos INTEGER DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(dispositivo_id, tipo)
);

CREATE INDEX IF NOT EXISTS idx_alertas_config_empresa_id ON alertas_config_iot(empresa_id);
CREATE INDEX IF NOT EXISTS idx_alertas_config_dispositivo_id ON alertas_config_iot(dispositivo_id);

CREATE TRIGGER update_alertas_config_iot_updated_at
  BEFORE UPDATE ON alertas_config_iot
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE alertas_config_iot IS 'Limiares de alerta (min/max) por dispositivo e tipo de sensor';

-- =============================================
-- 5. HISTÓRICO DE ALERTAS IoT
-- =============================================

CREATE TABLE IF NOT EXISTS alertas_historico_iot (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  dispositivo_id UUID NOT NULL REFERENCES dispositivos_iot(id) ON DELETE CASCADE,
  alerta_config_id UUID REFERENCES alertas_config_iot(id) ON DELETE SET NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('temperatura', 'umidade')),
  valor_lido DECIMAL(5,2) NOT NULL,
  limite_violado VARCHAR(10) NOT NULL CHECK (limite_violado IN ('min', 'max')),
  limite_valor DECIMAL(5,2) NOT NULL,
  lido BOOLEAN DEFAULT false,
  notificacao_enviada BOOLEAN DEFAULT false,
  registrado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alertas_hist_empresa_id ON alertas_historico_iot(empresa_id);
CREATE INDEX IF NOT EXISTS idx_alertas_hist_dispositivo_id ON alertas_historico_iot(dispositivo_id);
CREATE INDEX IF NOT EXISTS idx_alertas_hist_registrado_em ON alertas_historico_iot(registrado_em DESC);
CREATE INDEX IF NOT EXISTS idx_alertas_hist_nao_lido ON alertas_historico_iot(empresa_id, lido) WHERE lido = false;

COMMENT ON TABLE alertas_historico_iot IS 'Log de alertas disparados quando leituras ultrapassam limiares configurados';

-- =============================================
-- 6. DESABILITAR RLS (padrao do projeto)
-- =============================================

ALTER TABLE contas_ewelink DISABLE ROW LEVEL SECURITY;
ALTER TABLE dispositivos_iot DISABLE ROW LEVEL SECURITY;
ALTER TABLE leituras_sensores DISABLE ROW LEVEL SECURITY;
ALTER TABLE alertas_config_iot DISABLE ROW LEVEL SECURITY;
ALTER TABLE alertas_historico_iot DISABLE ROW LEVEL SECURITY;
