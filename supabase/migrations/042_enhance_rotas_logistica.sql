-- 042_enhance_rotas_logistica.sql
-- Aprimoramento do modulo de rotas com campos operacionais baseados no fluxo real de entrega

-- =============================================
-- 1. NOVOS CAMPOS NA TABELA rotas
-- =============================================
ALTER TABLE rotas
  ADD COLUMN IF NOT EXISTS km_inicio INTEGER,
  ADD COLUMN IF NOT EXISTS km_termino INTEGER,
  ADD COLUMN IF NOT EXISTS horario_inicio TIME,
  ADD COLUMN IF NOT EXISTS horario_termino TIME;

-- =============================================
-- 2. NOVOS CAMPOS NA TABELA rota_paradas
-- =============================================
ALTER TABLE rota_paradas
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pendente'
    CHECK (status IN ('pendente', 'entregue', 'nao_entregue')),
  ADD COLUMN IF NOT EXISTS canhoto TEXT,
  ADD COLUMN IF NOT EXISTS pedido_pronto BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS conferido_chegada BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS entregue BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS secao TEXT;

-- =============================================
-- 3. NOVOS CAMPOS NA TABELA clientes
-- =============================================
ALTER TABLE clientes
  ADD COLUMN IF NOT EXISTS rotulo_embalagem TEXT
    CHECK (rotulo_embalagem IS NULL OR rotulo_embalagem IN ('C', 'E')),
  ADD COLUMN IF NOT EXISTS embalagem_secundaria TEXT
    CHECK (embalagem_secundaria IS NULL OR embalagem_secundaria IN ('S', 'C', 'S/C', 'CPL')),
  ADD COLUMN IF NOT EXISTS corte_semeadura TEXT;
