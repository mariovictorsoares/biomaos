# Plano de Produção — Design Spec

**Data:** 2026-03-13
**Status:** Aprovado

## Contexto

O sistema precisa de uma forma de criar produção especulativa (sem vínculo com pedidos). O produtor decide o que plantar baseado em demanda estimada, informando espécie, quantidade em unidades, fazenda e data de colheita desejada.

## Decisões de Design

| Decisão | Escolha | Motivo |
|---------|---------|--------|
| Independente de pedidos? | Sim | Produção especulativa |
| Tabela nova vs plantios? | Direto em `plantios` | Mais simples; `pedido_item_id = NULL` indica origem manual |
| Unidade de entrada | Unidades (células/blocos na bandeja) | Modelo mental do produtor |
| Lote de semente | Automático (lote ativo mais recente) | Sem seleção manual |
| Data de referência | Data de colheita | Sistema calcula data de plantio retroativamente |
| Mix | Exatamente 2 espécies, 50/50, mesma bandeja | Sempre proporção igual |
| Recorrência | Fase futura | Não implementado agora |
| Tarefas automáticas | Fase futura | Não implementado agora |
| Localização UI | Aba Legado (TabProducao) | Botão novo, SEM alterar layout existente |
| Formulário | Modal central | Botão "Novo Plano" abre modal |

## Schema: Ajustes na tabela `plantios`

Nova migration adicionando 2 campos:

```sql
ALTER TABLE plantios ADD COLUMN IF NOT EXISTS quantidade_unidades INTEGER;
ALTER TABLE plantios ADD COLUMN IF NOT EXISTS mix_grupo_id UUID;
CREATE INDEX IF NOT EXISTS idx_plantios_mix_grupo_id ON plantios(mix_grupo_id);
```

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `quantidade_unidades` | `INTEGER` nullable | Quantidade original em unidades informada pelo usuário |
| `mix_grupo_id` | `UUID` nullable | Quando mix, 2 plantios compartilham o mesmo UUID |

Campos existentes usados:
- `empresa_id`, `especie_id`, `lote_semente_id`, `fazenda_id`
- `bandejas` (calculado), `data_colheita`, `data_plantio` (calculado), `data_validade` (calculado)
- `semente_necessaria_g` (calculado), `rendimento_esperado_g` (calculado)
- `status = 'planejado'`
- `pedido_item_id = NULL` (indica produção manual)

## Cálculos

### Espécie simples

```
bandejas = ceil(quantidade_unidades / fazenda.unidades_por_bandeja)
data_plantio = data_colheita - tempo_total_cultivo(especie)
semente_necessaria_g = bandejas * lote.densidade_semeadura
rendimento_esperado_g = bandejas * lote.rendimento_por_bandeja
data_validade = data_colheita + especie.vida_util_dias
```

Onde `tempo_total_cultivo` = soma de `duracao_dias` das `etapas_cultivo` da espécie (ou `tempo_germinacao + tempo_luz` legado).

### Mix (2 espécies)

```
unidades_por_especie = quantidade_total / 2
bandejas_compartilhadas = ceil(quantidade_total / fazenda.unidades_por_bandeja)
```

Para cada espécie:
- `quantidade_unidades = unidades_por_especie`
- `bandejas = bandejas_compartilhadas` (ambos registram o total, pois compartilham)
- `data_plantio` calculado individualmente pela espécie (podem diferir)
- `semente_necessaria_g = (bandejas / 2) * lote.densidade_semeadura` (usa metade das bandejas pois divide espaço)
- `rendimento_esperado_g = (bandejas / 2) * lote.rendimento_por_bandeja`
- Ambos recebem o mesmo `mix_grupo_id`

### Seleção automática de lote

Para cada espécie, busca o lote ativo mais recente:

```sql
SELECT * FROM lotes_sementes
WHERE especie_id = :especie_id
  AND empresa_id = :empresa_id
  AND status = 'ativo'
ORDER BY created_at DESC
LIMIT 1
```

Se não houver lote ativo, exibe erro no modal impedindo salvar.

## UI: Modal "Novo Plano de Produção"

### Campos do formulário

1. **Tipo** — toggle/segmented: `Simples` | `Mix`
2. **Espécie** — select (1 para simples; quando mix, 2 selects lado a lado: "Espécie 1" e "Espécie 2")
3. **Quantidade (unidades)** — input numérico inteiro positivo
4. **Fazenda** — select (filtra fazendas ativas da empresa)
5. **Data de Colheita** — date picker

### Informações calculadas (tempo real)

Exibidas abaixo do formulário conforme o usuário preenche:

- **Bandejas necessárias:** X bandejas
- **Data de plantio:** DD/MM/YYYY (para mix, pode mostrar 2 datas se diferentes)
- **Lote ativo:** nome/número do lote selecionado automaticamente
- **Semente necessária:** X g
- **Rendimento esperado:** X g

### Validações

- Espécie obrigatória (ambas no mix)
- No mix, as 2 espécies devem ser diferentes
- Quantidade > 0
- Fazenda obrigatória
- Data de colheita obrigatória e no futuro
- Lote ativo deve existir para a(s) espécie(s)
- Data de plantio calculada não pode estar no passado

### Ao salvar

**Simples:**
- Cria 1 registro em `plantios` com status `planejado`

**Mix:**
- Gera um UUID para `mix_grupo_id`
- Cria 2 registros em `plantios`, ambos com o mesmo `mix_grupo_id`
- Ambos com status `planejado`

### Localização

Botão "Novo Plano" na aba Legado (TabProducao), ao lado dos controles existentes. **Não alterar o layout/tabela existente** — os plantios criados aparecem naturalmente na tabela já existente.

## Fora do escopo (fases futuras)

- Recorrência de planos de produção
- Geração automática de tarefas a partir de etapas de cultivo
- Visualização especial de pares mix na tabela
- Edição de planos existentes
