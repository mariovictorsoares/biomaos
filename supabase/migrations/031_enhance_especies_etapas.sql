-- =============================================
-- BIOMA OS - Enriquecer Espécies + Etapas de Cultivo
-- Adiciona dados de cultivo no estilo Microgreen Manager
-- =============================================

-- Novos campos na tabela especies para dados de cultivo
ALTER TABLE especies
ADD COLUMN IF NOT EXISTS rendimento_por_bandeja DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS densidade_semeadura DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS margem_seguranca DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS vida_util_dias INTEGER,
ADD COLUMN IF NOT EXISTS tempo_buffer_colheita INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS notas TEXT;

COMMENT ON COLUMN especies.rendimento_por_bandeja IS 'Gramas colhidas por bandeja (yield per tray)';
COMMENT ON COLUMN especies.densidade_semeadura IS 'Gramas de semente por bandeja (sow density)';
COMMENT ON COLUMN especies.margem_seguranca IS 'Margem de segurança para produção (ex: 0.10 = 10%)';
COMMENT ON COLUMN especies.vida_util_dias IS 'Vida útil em dias após colheita (shelf life)';
COMMENT ON COLUMN especies.tempo_buffer_colheita IS 'Dias extras antes da colheita (harvest buffer)';
COMMENT ON COLUMN especies.notas IS 'Notas e observações sobre a espécie';

-- =============================================
-- Tabela de Etapas de Cultivo (Grow Timeline)
-- Substitui os campos fixos tempo_germinacao + tempo_luz
-- por N etapas customizáveis por espécie
-- =============================================
CREATE TABLE IF NOT EXISTS etapas_cultivo (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  especie_id UUID NOT NULL REFERENCES especies(id) ON DELETE CASCADE,
  nome VARCHAR(100) NOT NULL,
  ordem INTEGER NOT NULL,
  duracao_dias INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(especie_id, ordem)
);

CREATE INDEX IF NOT EXISTS idx_etapas_cultivo_especie_id ON etapas_cultivo(especie_id);

COMMENT ON TABLE etapas_cultivo IS 'Etapas customizáveis do ciclo de cultivo de cada espécie';
COMMENT ON COLUMN etapas_cultivo.nome IS 'Nome da etapa (ex: Germinação, Blackout, Sob Luz)';
COMMENT ON COLUMN etapas_cultivo.ordem IS 'Ordem sequencial da etapa (1 = primeira)';
COMMENT ON COLUMN etapas_cultivo.duracao_dias IS 'Duração da etapa em dias';
