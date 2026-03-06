# Reestruturacao do Modulo de Producao - Inspirado no Microgreen Manager

## 1. Resumo

Reestruturar o modulo de producao do BiomaOS inspirado no Microgreen Manager (MM), implementando:
- Separacao clara Especie (biologia) vs Lote de Sementes (numeros operacionais)
- Auto-cascade: Pedido -> Plantios -> Tarefas -> Colheitas
- Recorrencias (pedidos e plantios recorrentes)
- Rastreio de excedentes, deficits e bandejas perdidas
- Pack List (lista de embalagem por colheita)
- Calendario e Relatorio da Fazenda

## 2. Modelo do Microgreen Manager (Referencia)

### 2.1 Entidades Principais

**Crop (Especie)**
- Nome, ID
- Grow Timeline: N etapas customizaveis (ex: Germinacao 3d, Sob Luz 10d, Colheita)
- Expected Yield per Tray (g)
- Shelf Life (dias)
- Sow Density (g/bandeja)
- Safety Margin (%)
- Produtos vinculados (ex: 3oz, 6oz, 8oz)

**Blend (Mistura/MIX)**
- Nome
- N especies com percentuais (soma = 100%)
- Produtos com peso e preco

**Order (Pedido)**
- Customer, Date
- Line items: Crop/Blend + Produto + Quantidade + Unidade + Preco
- Checkbox "Use Surpluses" (aproveitar excedentes)
- Checkbox "Create Overdue Plantings"
- Auto-gera: Plantings, Tasks, Harvest

**Recurring Order (Pedido Recorrente)**
- Customer, Start Date, Recur Forever/End Date
- Frequency: A cada N semanas / A cada N-esimo dia da semana / A cada N-esimo dia util do mes
- Line items iguais a Orders

**Planting (Plantio)**
- Agrupado por "Planting Group" (mesmo crop + mesma data colheita)
- Campos: Crop, Trays, Status (Planned/In Progress/Complete), Current Stage
- Detalhe: Assigned Trays, Surplus Trays, Lost Trays, Seed Needed, Expected Yield, Allocated Yield, Surplus Yield
- Grow Cycle visual com datas por etapa
- Tasks auto-geradas (1 por etapa)
- Link com Orders de origem

**Recurring Planting (Plantio Recorrente)**
- Crop, Trays, Frequency (mesmos tipos do Recurring Order)
- Independente de pedido (producao especulativa)

**Harvest (Colheita)**
- Agrupada por DATA (todas as especies/plantios do mesmo dia)
- Por crop: Trays, Expected Yield, Required Weight, Surplus/Deficit
- Pack List: por pedido mostra Customer + Crop/Blend + Amount
- Secoes: Surpluses, Deficits, Remaining Tasks, Completed Tasks
- Botao "Mark Harvested" por crop

**Task (Tarefa)**
- Auto-gerada das etapas do plantio (1 task por etapa por crop)
- Name, Trays, Crop, Date, Complete checkbox
- Aparecem no Dashboard e Calendar

**Recurring Task (Tarefa Recorrente)**
- Tarefas nao-cultivo (limpeza, manutencao, inventario)

**Surplus (Excedente)**
- Originam de: pedidos cancelados/modificados, arredondamento de bandejas
- Podem ser consumidos por novos pedidos ("Use Surpluses")

**Lost Tray (Bandeja Perdida)**
- Registrado a partir de plantios "em progresso"
- Filtro por Crop e Reason (motivo)
- Reduz bandejas disponiveis do plantio

**Calendar** - Visao mensal com todas as tasks nas suas datas
**Farm Report** - Total Trays Planted/Lost, grafico por crop, Seed Used
**Dashboard** - Tasks do dia, proximos 7 dias, bandejas/sementes necessarias

### 2.2 Fluxo Principal: Order -> Auto-cascade

```
Pedido criado (Customer, Date, Items)
  |
  v
Para cada line item (crop ou blend):
  |-- Calcula bandejas necessarias
  |-- Se blend: split por especie (percentual)
  |
  v
Agrupa por (crop + harvest_date):
  |-- Cria/atualiza Planting Group
  |-- Calcula data plantio = harvest_date - total_grow_time
  |
  v
Para cada etapa do crop:
  |-- Cria Task com data calculada reversa
  |
  v
Cria/atualiza Harvest (agrupada por data)
  |-- Pack List vincula pedidos a colheita
```

### 2.3 Calculos Chave

**Bandejas (cortado/cut):**
`ceil((quantidade * peso_gramas) / rendimento_por_bandeja * (1 + margem))`

**Bandejas (vivo/live):**
`ceil(quantidade * (1 + margem))` ou `ceil((quantidade / unidades_por_bandeja) * (1 + margem))`

**Bandejas (blend cortado):**
Por especie: `ceil((gramas_total * percentual / 100) / rendimento * (1 + margem))`

**Semente necessaria:**
`bandejas * densidade_semeadura` (g)

**Yield esperado:**
`bandejas * rendimento_por_bandeja` (g)

**Data plantio:**
`data_colheita - soma(duracao_dias de todas etapas)`

**Data por etapa (reverso):**
Ultima etapa termina na data_colheita, cada etapa anterior termina onde a proxima comeca.

## 3. Decisoes de Design (ja validadas)

| Decisao | Escolha |
|---------|---------|
| Onde ficam etapas de cultivo? | Na Especie (biologia do crescimento) |
| Onde ficam numeros operacionais? | No Lote de Sementes (rendimento, densidade, margem, eficiencia) |
| De onde vem margem de seguranca? | Do Lote |
| vida_util_dias e tempo_buffer? | Ficam na Especie |
| Lote obrigatorio para producao? | Sim, sem fallback |
| RLS no Supabase? | Nao |

## 4. Reestruturacao de Dados

### 4.1 Especie (mantém biologia + etapas)

Campos que FICAM:
- nome, nome_cientifico, tipo_cultivo, foto_url
- vida_util_dias, tempo_buffer_colheita, notas
- empresa_id, created_at, updated_at

Campos que SAEM (movem para Lote):
- rendimento_por_bandeja -> lotes_sementes
- densidade_semeadura -> lotes_sementes
- margem_seguranca -> lotes_sementes

Campos LEGADOS mantidos temporariamente (readonly, deprecated):
- tempo_germinacao, tempo_luz (substituidos por etapas_cultivo)

### 4.2 Lote de Sementes (numeros operacionais)

Campos existentes:
- numero, especie_id, empresa_id
- estoque_inicial, estoque_atual, validade, safra, status
- fornecedor, pais_origem, valor_semente
- taxa_germinacao, taxa_pureza
- tempo_germinacao, tempo_luz (legado)
- densidade_semeadura, eficiencia
- observacoes

Campos NOVOS (vindos da Especie):
- rendimento_por_bandeja DECIMAL(10,2)
- margem_seguranca DECIMAL(5,2) DEFAULT 0

### 4.3 Etapas de Cultivo (sem mudanca)

Tabela etapas_cultivo ja existe vinculada a especie_id. Sem alteracao.

### 4.4 Novas Tabelas

**plantios (Plantings)**
```sql
CREATE TABLE plantios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES empresas(id),
  especie_id UUID NOT NULL REFERENCES especies(id),
  lote_semente_id UUID REFERENCES lotes_sementes(id),
  pedido_item_id UUID REFERENCES pedido_itens(id),
  plantio_recorrente_id UUID REFERENCES plantios_recorrentes(id),
  colheita_id UUID REFERENCES colheitas(id),
  fazenda_id UUID REFERENCES fazendas(id),
  bandejas DECIMAL(10,2) NOT NULL,
  bandejas_perdidas DECIMAL(10,2) DEFAULT 0,
  semente_necessaria_g DECIMAL(10,2),
  rendimento_esperado_g DECIMAL(10,2),
  rendimento_alocado_g DECIMAL(10,2),
  excedente_g DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'planejado',
  -- planejado, em_andamento, colhido, cancelado
  etapa_atual VARCHAR(100),
  data_plantio DATE,
  data_colheita DATE NOT NULL,
  data_validade DATE,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**tarefas (Tasks)**
```sql
CREATE TABLE tarefas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES empresas(id),
  plantio_id UUID REFERENCES plantios(id),
  tarefa_recorrente_id UUID REFERENCES tarefas_recorrentes(id),
  nome VARCHAR(200) NOT NULL,
  descricao TEXT,
  tipo VARCHAR(20) DEFAULT 'cultivo',
  -- cultivo (auto-gerada), manual, recorrente
  bandejas DECIMAL(10,2),
  especie_id UUID REFERENCES especies(id),
  data_prevista DATE NOT NULL,
  data_conclusao DATE,
  concluida BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**colheitas (Harvests)**
```sql
CREATE TABLE colheitas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES empresas(id),
  data_colheita DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'pendente',
  -- pendente, parcial, concluida
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(empresa_id, data_colheita)
);
```

**colheita_itens (Harvest Items - por crop)**
```sql
CREATE TABLE colheita_itens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  colheita_id UUID NOT NULL REFERENCES colheitas(id) ON DELETE CASCADE,
  especie_id UUID NOT NULL REFERENCES especies(id),
  bandejas DECIMAL(10,2) NOT NULL,
  rendimento_esperado_g DECIMAL(10,2),
  peso_necessario_g DECIMAL(10,2),
  excedente_g DECIMAL(10,2) DEFAULT 0,
  colhido BOOLEAN DEFAULT FALSE,
  notas TEXT
);
```

**excedentes (Surpluses)**
```sql
CREATE TABLE excedentes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES empresas(id),
  especie_id UUID NOT NULL REFERENCES especies(id),
  plantio_id UUID REFERENCES plantios(id),
  pedido_id UUID REFERENCES pedidos(id),
  quantidade_g DECIMAL(10,2) NOT NULL,
  bandejas DECIMAL(10,2),
  motivo VARCHAR(50),
  -- arredondamento, pedido_cancelado, pedido_modificado
  consumido BOOLEAN DEFAULT FALSE,
  consumido_por_pedido_id UUID REFERENCES pedidos(id),
  data_disponivel DATE NOT NULL,
  data_validade DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**bandejas_perdidas (Lost Trays)**
```sql
CREATE TABLE bandejas_perdidas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES empresas(id),
  plantio_id UUID NOT NULL REFERENCES plantios(id),
  especie_id UUID NOT NULL REFERENCES especies(id),
  bandejas DECIMAL(10,2) NOT NULL,
  motivo VARCHAR(100),
  -- mofo, praga, erro_irrigacao, semente_ruim, outro
  notas TEXT,
  data_registro DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**pedidos_recorrentes (Recurring Orders)**
```sql
CREATE TABLE pedidos_recorrentes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES empresas(id),
  cliente_id UUID NOT NULL REFERENCES clientes(id),
  nome VARCHAR(200),
  recorrencia_infinita BOOLEAN DEFAULT TRUE,
  data_inicio DATE NOT NULL,
  data_fim DATE,
  tipo_frequencia VARCHAR(30) NOT NULL,
  -- semanal, dia_semana, dia_util_mes
  intervalo INTEGER DEFAULT 1,
  dia_semana INTEGER, -- 0=dom, 1=seg, ..., 6=sab
  criar_atrasados BOOLEAN DEFAULT TRUE,
  ativo BOOLEAN DEFAULT TRUE,
  ultima_geracao DATE,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**pedido_recorrente_itens**
```sql
CREATE TABLE pedido_recorrente_itens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_recorrente_id UUID NOT NULL REFERENCES pedidos_recorrentes(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES produtos(id),
  quantidade INTEGER NOT NULL,
  preco_unitario DECIMAL(10,2),
  usar_excedentes BOOLEAN DEFAULT FALSE
);
```

**plantios_recorrentes (Recurring Plantings)**
```sql
CREATE TABLE plantios_recorrentes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES empresas(id),
  nome VARCHAR(200) NOT NULL,
  especie_id UUID NOT NULL REFERENCES especies(id),
  lote_semente_id UUID REFERENCES lotes_sementes(id),
  fazenda_id UUID REFERENCES fazendas(id),
  bandejas DECIMAL(10,2) NOT NULL,
  recorrencia_infinita BOOLEAN DEFAULT TRUE,
  data_inicio DATE NOT NULL,
  data_fim DATE,
  tipo_frequencia VARCHAR(30) NOT NULL,
  intervalo INTEGER DEFAULT 1,
  dia_semana INTEGER,
  criar_atrasados BOOLEAN DEFAULT TRUE,
  ativo BOOLEAN DEFAULT TRUE,
  ultima_geracao DATE,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**tarefas_recorrentes (Recurring Tasks)**
```sql
CREATE TABLE tarefas_recorrentes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES empresas(id),
  nome VARCHAR(200) NOT NULL,
  descricao TEXT,
  recorrencia_infinita BOOLEAN DEFAULT TRUE,
  data_inicio DATE NOT NULL,
  data_fim DATE,
  tipo_frequencia VARCHAR(30) NOT NULL,
  intervalo INTEGER DEFAULT 1,
  dia_semana INTEGER,
  criar_atrasados BOOLEAN DEFAULT TRUE,
  ativo BOOLEAN DEFAULT TRUE,
  ultima_geracao DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.5 Alteracoes em Tabelas Existentes

**pedidos** - adicionar:
- usar_excedentes BOOLEAN DEFAULT FALSE
- pedido_recorrente_id UUID REFERENCES pedidos_recorrentes(id)

**pedido_itens** (se nao existir, criar) - normalizar itens do pedido:
- pedido_id, produto_id, quantidade, preco_unitario, usar_excedentes

## 5. Composable useProducaoCalc - Atualizacao

Interface Especie perde campos numericos. Nova interface Lote:

```typescript
interface Lote {
  id: string
  rendimento_por_bandeja: number | null
  densidade_semeadura: number | null
  margem_seguranca: number | null
  eficiencia: number | null
}
```

Funcoes atualizadas recebem `lote: Lote` em vez de `especie: Especie` para calculos numericos.
Especie continua fornecendo etapas de cultivo (via etapas_cultivo).

Nova funcao: `calcularSementeNecessaria(bandejas, lote) => gramas`
Nova funcao: `calcularRendimentoEsperado(bandejas, lote) => gramas`

## 6. Auto-cascade: Pedido -> Plantios -> Tarefas -> Colheita

### 6.1 Ao salvar um pedido:

```
1. Para cada item do pedido:
   a. Obter produto -> especie(s) + lote ativo
   b. Calcular bandejas necessarias (usando lote)
   c. Se usar_excedentes: verificar excedentes disponiveis, abater

2. Agrupar por (especie + data_colheita):
   a. Criar ou atualizar Plantio
   b. Preencher: bandejas, semente_necessaria, rendimento_esperado, data_plantio

3. Para cada Plantio criado:
   a. Buscar etapas da especie (etapas_cultivo)
   b. Calcular datas de cada etapa (reverso a partir da data_colheita)
   c. Criar Tarefas (1 por etapa)

4. Criar ou atualizar Colheita (agrupada por data):
   a. Criar colheita_itens por especie
   b. Calcular rendimento esperado, peso necessario, excedente
```

### 6.2 Ao cancelar/modificar pedido:

```
1. Recalcular bandejas necessarias
2. Se sobram bandejas: criar Excedente
3. Se plantio fica sem pedidos: marcar como cancelado
4. Atualizar colheita_itens
```

## 7. Modulos de UI

### 7.1 Pagina Comercial (existente, com novas tabs)
- Tab Pedidos: adicionar auto-cascade ao salvar
- Tab Vendas: manter existente
- Nova tab: Pedidos Recorrentes

### 7.2 Pagina Producao (reestruturar)
- Tab Plantios: lista com status, crop, bandejas, etapa atual, datas
- Tab Colheitas: lista agrupada por data, com Pack List
- Tab Tarefas: lista com filtros (status, nome, crop, data)
- Tab Calendario: visao mensal com tarefas
- Tab Plantios Recorrentes
- Tab Excedentes
- Tab Bandejas Perdidas

### 7.3 Dashboard (enriquecer)
- Tarefas de hoje e proximos 7 dias
- Bandejas e sementes necessarias
- Colheitas proximas
- Pedidos proximos
- Tarefas atrasadas

### 7.4 Relatorio da Fazenda (nova pagina ou tab)
- Filtro por periodo
- Total bandejas plantadas / perdidas
- Grafico por especie
- Tabela: Especie, Planted, Lost, % Farm, Densidade, Semente Usada

## 8. Edge Function: Gerar Recorrencias

Atualizar `supabase/functions/renovar-recorrencias/index.ts` para processar:
- pedidos_recorrentes -> gerar novos pedidos (que disparam auto-cascade)
- plantios_recorrentes -> gerar novos plantios + tarefas
- tarefas_recorrentes -> gerar novas tarefas

## 9. O que NAO muda

- Autenticacao (Supabase Auth)
- Multi-empresa (empresa_id em tudo)
- Clientes, Fazendas, Contratos
- Sidebar consolidado (design anterior)
- Tabelas de preco
- Modais de CRUD basico (criar/editar cliente, produto, etc.)

## 10. Prioridade de Implementacao

### Fase 1 - Fundacao (critica)
1. Migration: mover campos para lotes_sementes, novas tabelas
2. Atualizar useProducaoCalc com interface Lote
3. Atualizar TabEspecies (remover campos numericos)
4. Atualizar TabLotesSementes (adicionar campos novos)

### Fase 2 - Auto-cascade
5. Criar logica de auto-cascade (pedido -> plantios -> tarefas -> colheitas)
6. Pagina de Plantios (lista + detalhe)
7. Pagina de Colheitas (lista + detalhe + Pack List)
8. Pagina de Tarefas (lista + filtros + complete)

### Fase 3 - Recorrencias
9. Pedidos Recorrentes (CRUD + Edge Function)
10. Plantios Recorrentes (CRUD + Edge Function)
11. Tarefas Recorrentes (CRUD + Edge Function)

### Fase 4 - Rastreio e Relatorios
12. Excedentes (auto + consumo)
13. Bandejas Perdidas (registro + impacto)
14. Calendario (visao mensal)
15. Relatorio da Fazenda
16. Dashboard enriquecido
