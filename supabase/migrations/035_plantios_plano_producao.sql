-- 035_plantios_plano_producao.sql
-- Adiciona campos para plano de produção manual (especulativo)

ALTER TABLE plantios ADD COLUMN IF NOT EXISTS quantidade_unidades INTEGER;
ALTER TABLE plantios ADD COLUMN IF NOT EXISTS mix_grupo_id UUID;

CREATE INDEX IF NOT EXISTS idx_plantios_mix_grupo_id ON plantios(mix_grupo_id);

COMMENT ON COLUMN plantios.quantidade_unidades IS 'Quantidade original em unidades (celulas/blocos) informada pelo usuario';
COMMENT ON COLUMN plantios.mix_grupo_id IS 'UUID compartilhado entre 2 plantios mix que dividem as mesmas bandejas';
