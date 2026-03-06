# Reestruturacao Producao - Plano de Implementacao

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reestruturar o modulo de producao do BiomaOS com auto-cascade (Pedido -> Plantios -> Tarefas -> Colheitas), recorrencias, excedentes, bandejas perdidas, calendario e relatorio.

**Architecture:** Supabase (PostgreSQL) backend com novas tabelas (plantios, tarefas, colheitas, excedentes, bandejas_perdidas, recorrencias). Frontend Nuxt 3/Vue 3 com tabs na pagina /producao. Composable useProducaoCalc atualizado para receber Lote em vez de Especie nos calculos numericos. Edge Function atualizada para gerar recorrencias.

**Tech Stack:** Nuxt 3, Vue 3, Tailwind CSS (dark mode), Supabase (PostgreSQL), Deno Edge Functions, Chart.js

---

## Fase 1 - Fundacao (Migration + Composable + UI Especies/Lotes)

### 1.1 Migration 034: Mover campos para lotes_sementes + novas tabelas

**Arquivo:** `supabase/migrations/034_reestruturacao_producao.sql`

**O que faz:**

1. Adicionar campos ao `lotes_sementes`:
   - `rendimento_por_bandeja DECIMAL(10,2)` (vem de especies)
   - `margem_seguranca DECIMAL(5,2) DEFAULT 0` (vem de especies)

2. Migrar dados existentes de `especies` -> `lotes_sementes` (UPDATE com subquery)

3. Marcar campos de `especies` como deprecated (comentario SQL, nao remover ainda)

4. Criar tabela `colheitas`:
   - id, empresa_id, data_colheita (UNIQUE por empresa), status, notas, timestamps

5. Criar tabela `plantios`:
   - id, empresa_id, especie_id, lote_semente_id (NOT NULL), pedido_item_id (nullable)
   - plantio_recorrente_id (nullable), colheita_id -> colheitas
   - fazenda_id, bandejas, bandejas_perdidas, semente_necessaria_g
   - rendimento_esperado_g, rendimento_alocado_g, excedente_g
   - status (planejado/em_andamento/colhido/cancelado), etapa_atual
   - data_plantio, data_colheita, data_validade, notas, timestamps

6. Criar tabela `tarefas`:
   - id, empresa_id, plantio_id (nullable), tarefa_recorrente_id (nullable)
   - nome, descricao, tipo (cultivo/manual/recorrente)
   - bandejas, especie_id, data_prevista, data_conclusao, concluida, timestamps

7. Criar tabela `colheita_itens`:
   - id, colheita_id, especie_id, bandejas
   - rendimento_esperado_g, peso_necessario_g, excedente_g
   - colhido (boolean), notas

8. Criar tabela `excedentes`:
   - id, empresa_id, especie_id, plantio_id, pedido_id
   - quantidade_g, bandejas, motivo (arredondamento/pedido_cancelado/pedido_modificado)
   - consumido, consumido_por_pedido_id, data_disponivel, data_validade, timestamps

9. Criar tabela `bandejas_perdidas`:
   - id, empresa_id, plantio_id, especie_id
   - bandejas, motivo (mofo/praga/erro_irrigacao/semente_ruim/outro)
   - notas, data_registro, timestamps

10. Criar tabela `pedidos_recorrentes`:
    - id, empresa_id, cliente_id, nome
    - recorrencia_infinita, data_inicio, data_fim
    - tipo_frequencia (semanal/dia_semana/dia_util_mes), intervalo, dia_semana
    - criar_atrasados, ativo, ultima_geracao, notas, timestamps

11. Criar tabela `pedido_recorrente_itens`:
    - id, pedido_recorrente_id, produto_id, quantidade, preco_unitario, usar_excedentes

12. Criar tabela `plantios_recorrentes`:
    - id, empresa_id, nome, especie_id, lote_semente_id, fazenda_id
    - bandejas, recorrencia_infinita, data_inicio, data_fim
    - tipo_frequencia, intervalo, dia_semana
    - criar_atrasados, ativo, ultima_geracao, notas, timestamps

13. Criar tabela `tarefas_recorrentes`:
    - id, empresa_id, nome, descricao
    - recorrencia_infinita, data_inicio, data_fim
    - tipo_frequencia, intervalo, dia_semana
    - criar_atrasados, ativo, ultima_geracao, timestamps

14. Adicionar em `pedidos`:
    - `usar_excedentes BOOLEAN DEFAULT FALSE`
    - `pedido_recorrente_id UUID REFERENCES pedidos_recorrentes(id)`

15. Indices em todas as FK e campos de filtro frequente

**Nota:** NAO remover a tabela `producao` existente nem seus dados. As novas tabelas `plantios` substituem gradualmente. A tabela `producao` fica como legado ate migracao completa dos dados.

### 1.2 Atualizar useProducaoCalc.ts

**Arquivo:** `composables/useProducaoCalc.ts`

**Mudancas:**
- Adicionar interface `Lote` com: id, rendimento_por_bandeja, densidade_semeadura, margem_seguranca, eficiencia
- Manter interface `Especie` apenas com: id, tempo_germinacao?, tempo_luz? (legado)
- Todas funcoes de calculo numerico passam a receber `lote: Lote` em vez de pegar de `especie`
- `calcularBandejas(quantidade, lote, modalidade, pesoGramas?, unidadeProduto?, unidadesPorBandeja?)`
- `calcularBandejasMix(quantidade, pesoGramas, especiesMixComLote[])` - cada especie no mix agora traz seu lote
- Novas funcoes:
  - `calcularSementeNecessaria(bandejas: number, lote: Lote): number` → bandejas * densidade
  - `calcularRendimentoEsperado(bandejas: number, lote: Lote): number` → bandejas * rendimento
  - `gerarPlantiosFromPedido(pedido, itens, especies, lotes, etapas)` → array de plantios com tarefas calculadas
- Manter funcoes de data (tempoTotalCultivo, calcularDatasEtapas, calcularDataPlantio) - ja recebem Especie/etapas corretamente

### 1.3 Atualizar TabEspecies.vue

**Arquivo:** `components/TabEspecies.vue`

**Mudancas:**
- Remover campos do formulario criar/editar: rendimento_por_bandeja, densidade_semeadura, margem_seguranca
- Manter: vida_util_dias, tempo_buffer_colheita, notas
- Manter: EtapasCultivoEditor (etapas ficam na especie)
- Atualizar query Supabase (nao mais buscar campos removidos)

### 1.4 Atualizar TabLotesSementes.vue

**Arquivo:** `components/TabLotesSementes.vue`

**Mudancas:**
- Adicionar campos no formulario criar/editar: rendimento_por_bandeja, margem_seguranca
- Atualizar interface Lote com novos campos
- Atualizar query Supabase

### 1.5 Commit Fase 1

```
feat: reestruturar fundacao producao - migration, composable, especies/lotes
```

---

## Fase 2 - Auto-cascade (Pedido -> Plantios -> Tarefas -> Colheitas)

### 2.1 Composable useAutoCascade.ts (NOVO)

**Arquivo:** `composables/useAutoCascade.ts`

**Funcao principal: `gerarCascadeFromPedido(pedidoId)`**

Logica:
1. Buscar pedido + pedido_itens (com produto -> especie(s), lote ativo)
2. Para cada item:
   - Se produto single: calcular bandejas com lote da especie
   - Se produto MIX: split por especie (percentual), calcular bandejas cada
   - Se usar_excedentes: buscar excedentes disponiveis, abater
3. Agrupar por (especie_id + data_colheita)
4. Para cada grupo:
   - Criar/atualizar plantio (bandejas, semente, rendimento, datas)
   - Buscar etapas_cultivo da especie
   - Calcular datas reversa das etapas
   - Criar tarefas (1 por etapa)
5. Criar/atualizar colheita (por data_colheita)
6. Criar colheita_itens (por especie na colheita)

**Funcao: `cancelarCascadePedido(pedidoId)`**
- Recalcular bandejas sem o pedido
- Se sobram bandejas: criar excedente
- Se plantio fica vazio: marcar cancelado
- Atualizar colheita_itens

**Funcao: `modificarCascadePedido(pedidoId)`**
- Recalcular tudo e ajustar (delta positivo = mais bandejas, negativo = excedente)

### 2.2 Integrar auto-cascade no fluxo de pedidos

**Arquivos:**
- `components/SlideoverCadastroPedido.vue` - chamar `gerarCascadeFromPedido` apos salvar
- `components/SlideoverAlteracaoPedido.vue` - chamar `modificarCascadePedido` apos alterar
- `components/ModalAlterarStatusPedido.vue` (se cancelar) - chamar `cancelarCascadePedido`

### 2.3 TabPlantios.vue (NOVO)

**Arquivo:** `components/TabPlantios.vue`

**Features:**
- Lista de plantios com colunas: Especie, Bandejas, Status, Etapa Atual, Data Plantio, Data Colheita, Acoes
- Filtros: Status (planejado/em_andamento/colhido), Especie, Fazenda, Data After/Before
- Click em plantio abre detalhe (modal ou slideover) com:
  - Info resumida (como MM: trays, seed needed, expected yield, surplus)
  - Grow Cycle visual (barra de etapas com datas)
  - Lista de tarefas com botao complete
  - Pedidos vinculados
- Botao "Novo Plantio Manual" (sem pedido)

### 2.4 TabColheitas.vue (NOVO)

**Arquivo:** `components/TabColheitas.vue`

**Features:**
- Lista agrupada por data: Data Colheita, Bandejas Total, Especies, Pedidos, Status
- Click abre detalhe com:
  - Por especie: bandejas, rendimento esperado, peso necessario, excedente/deficit
  - Pack List: por pedido mostra cliente, produto, quantidade
  - Botao "Marcar Colhido" por especie
- Filtros: Data After/Before

### 2.5 TabTarefas.vue (NOVO)

**Arquivo:** `components/TabTarefas.vue`

**Features:**
- Lista de tarefas: Nome, Bandejas, Especie, Data, Concluida
- Filtros: Status (pendente/concluida), Nome (etapa), Especie, Data
- Checkbox para marcar concluida (atualiza data_conclusao)

### 2.6 Atualizar pages/producao/index.vue

**Arquivo:** `pages/producao/index.vue`

**Mudancas:**
- Adicionar tabs: Plantios | Colheitas | Tarefas (substituem ou coexistem com Producao legado)
- Importar novos componentes Tab
- Route query: ?tab=plantios, ?tab=colheitas, ?tab=tarefas

### 2.7 Commit Fase 2

```
feat: auto-cascade pedido -> plantios -> tarefas -> colheitas
```

---

## Fase 3 - Recorrencias

### 3.1 TabPedidosRecorrentes.vue (NOVO)

**Arquivo:** `components/TabPedidosRecorrentes.vue`

**Features:**
- Lista: Nome, Cliente, Frequencia, Proxima Geracao, Ativo, Acoes
- Modal criar/editar com campos:
  - Nome, Cliente, Recorrencia Infinita, Data Inicio/Fim
  - Tipo Frequencia (dropdown: Semanal / Dia da semana / Dia util do mes)
  - Intervalo, Dia da Semana
  - Itens do pedido (produto + quantidade + preco)
  - Checkbox: Criar atrasados
- Toggle ativo/inativo

### 3.2 TabPlantiosRecorrentes.vue (NOVO)

**Arquivo:** `components/TabPlantiosRecorrentes.vue`

**Features:**
- Lista: Nome, Especie, Bandejas, Frequencia, Ativo, Acoes
- Modal criar/editar: Nome, Especie, Lote, Fazenda, Bandejas, frequencia (mesmos campos)

### 3.3 TabTarefasRecorrentes.vue (NOVO)

**Arquivo:** `components/TabTarefasRecorrentes.vue`

**Features:**
- Lista: Nome, Frequencia, Ativo, Acoes
- Modal criar/editar: Nome, Descricao, frequencia

### 3.4 Adicionar tabs recorrentes nas paginas

**Arquivos:**
- `pages/comercial/index.vue` - adicionar tab "Recorrentes" (TabPedidosRecorrentes)
- `pages/producao/index.vue` - adicionar tabs "Plantios Recorrentes" e "Tarefas Recorrentes"

### 3.5 Atualizar Edge Function renovar-recorrencias

**Arquivo:** `supabase/functions/renovar-recorrencias/index.ts`

**Mudancas:**
- Processar `pedidos_recorrentes`:
  - Calcular proxima data baseado em tipo_frequencia
  - Criar pedido novo com itens copiados
  - Chamar logica de auto-cascade (via SQL function ou duplicar logica)
  - Atualizar ultima_geracao
- Processar `plantios_recorrentes`:
  - Criar plantio + tarefas
  - Atualizar ultima_geracao
- Processar `tarefas_recorrentes`:
  - Criar tarefa simples
  - Atualizar ultima_geracao
- Manter compatibilidade com recorrencias legadas da tabela `producao`

### 3.6 Commit Fase 3

```
feat: pedidos, plantios e tarefas recorrentes com edge function
```

---

## Fase 4 - Rastreio, Calendario e Relatorios

### 4.1 TabExcedentes.vue (NOVO)

**Arquivo:** `components/TabExcedentes.vue`

**Features:**
- Lista: Especie, Quantidade (g), Bandejas, Motivo, Disponivel, Consumido, Data
- Filtros: Especie, Status (disponivel/consumido), Data
- Excedentes sao auto-gerados pelo cascade, nao tem CRUD manual

### 4.2 TabBandejasPerdidas.vue (NOVO)

**Arquivo:** `components/TabBandejasPerdidas.vue`

**Features:**
- Lista: Especie, Bandejas, Motivo, Data, Notas
- Filtros: Especie, Motivo, Data
- Modal novo incidente: selecionar plantio em andamento, quantidade, motivo, notas
- Ao registrar: atualiza `plantios.bandejas_perdidas` e recalcula rendimento

### 4.3 TabCalendario.vue (NOVO)

**Arquivo:** `components/TabCalendario.vue`

**Features:**
- Visao mensal (grid 7 colunas)
- Mostrar tarefas do dia (nome, crop, bandejas)
- Cores por tipo (plantio = verde, luz = amarelo, colheita = laranja)
- Navegacao mes anterior/proximo
- Click no dia mostra detalhes

### 4.4 TabRelatorioFazenda.vue (NOVO)

**Arquivo:** `components/TabRelatorioFazenda.vue`

**Features:**
- Filtro por periodo (date range)
- Cards: Total Bandejas Plantadas, Total Bandejas Perdidas (%)
- Grafico Chart.js: barras por especie (colhidas vs perdidas)
- Tabela: Especie, Planted, Lost, % Farm, Densidade, Semente Usada

### 4.5 Adicionar tabs na pagina producao

**Arquivo:** `pages/producao/index.vue`

**Tabs finais:** Plantios | Colheitas | Tarefas | Calendario | Excedentes | Bandejas Perdidas | Plantios Recorrentes | Tarefas Recorrentes | Relatorio

**Nota:** Sao muitas tabs. Considerar:
- Agrupar em sub-navegacao ou dropdown
- Ou usar TabsNav com scroll horizontal (ja suporta)
- Ou separar Relatorio em pagina propria

### 4.6 Enriquecer Dashboard (pages/index.vue)

**Arquivo:** `pages/index.vue`

**Adicionar secoes:**
- Tarefas de Hoje (query tarefas WHERE data_prevista = today AND NOT concluida)
- Proximas Colheitas (query colheitas proximos 7 dias)
- Tarefas Atrasadas (query tarefas WHERE data_prevista < today AND NOT concluida)
- Bandejas/Sementes Necessarias (aggregar plantios planejados proximos 7 dias)

### 4.7 Commit Fase 4

```
feat: excedentes, bandejas perdidas, calendario, relatorio, dashboard
```

---

## Resumo de Arquivos

### Novos (16 arquivos)
- `supabase/migrations/034_reestruturacao_producao.sql`
- `composables/useAutoCascade.ts`
- `components/TabPlantios.vue`
- `components/TabColheitas.vue`
- `components/TabTarefas.vue`
- `components/TabPedidosRecorrentes.vue`
- `components/TabPlantiosRecorrentes.vue`
- `components/TabTarefasRecorrentes.vue`
- `components/TabExcedentes.vue`
- `components/TabBandejasPerdidas.vue`
- `components/TabCalendario.vue`
- `components/TabRelatorioFazenda.vue`
- Modais para criar/editar recorrencias (4 modais aprox.)

### Modificados (8 arquivos)
- `composables/useProducaoCalc.ts`
- `components/TabEspecies.vue`
- `components/TabLotesSementes.vue`
- `components/SlideoverCadastroPedido.vue`
- `components/SlideoverAlteracaoPedido.vue`
- `pages/producao/index.vue`
- `pages/comercial/index.vue`
- `pages/index.vue`
- `supabase/functions/renovar-recorrencias/index.ts`

### Nao tocados
- Sidebar, auth, layouts, contratos, usuarios, fazendas, produtos
- Tabelas existentes (producao legado mantido, pedidos/pedido_itens apenas adicionam campos)
