# Dashboard Redesign — "Command Center"

## Context

Redesign total do dashboard principal (`pages/index.vue`) do BiomaOS. O dashboard atual tem ~1200 linhas, mistura muitas seções sem hierarquia clara, e usa charts genéricos. O objetivo é criar um dashboard que cause impacto visual imediato ("UAU") com dados mocados, focando em design antes de integrar dados reais.

## Requirements

### Obrigatórios
- **Eficiência por Produto** — ranking top 10
- **Mais Vendidos por Produto** — ranking top 10
- **Margem por Produto** — ranking top 10
- **Remover Tarefas** — eliminar seções de tarefas de hoje, atrasadas, próximas colheitas

### Decisões de Design
- Dados 100% mocados (sem Supabase por enquanto)
- Manter seletor de empresas e período no header
- Dark mode obrigatório (sistema já suporta)

## Architecture

### Layout — 4 Seções Verticais

```
┌─────────────────────────────────────────────────────┐
│  HERO KPIs (5 cards em linha)                       │
│  [Faturamento] [Vendas] [Produção] [Margem] [Efic.] │
├────────────────────────┬────────────────────────────┤
│  RANKINGS POR PRODUTO  │  PRODUÇÃO                  │
│  Tab: Efic|Vend|Marg   │  Donut + 4 mini-cards      │
│  Top 10 barras horiz.  │                            │
├────────────────────────┬────────────────────────────┤
│  VENDAS MENSAIS        │  FAZENDAS                  │
│  Bar chart 12 meses    │  Tabela com progress bars  │
└────────────────────────┴────────────────────────────┘
```

### Seção 1 — Hero KPIs

5 cards responsivos (`grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5`):

| KPI | Valor Mock | Sparkline | Variação |
|-----|-----------|-----------|----------|
| Faturamento Previsto | R$ 24.580 | 4 semanas | +12% |
| Unidades Vendidas | 1.842 un | 4 semanas | +8% |
| Produção Ativa | 156 bandejas | 4 semanas | -3% |
| Margem Bruta | 42% | 4 semanas | +2pp |
| Eficiência Geral | 87% | 4 semanas | +5pp |

Cada card:
- Label: `text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400`
- Valor: `text-2xl font-bold text-gray-900 dark:text-white`
- Sparkline: SVG inline ~60x24px, polyline com `stroke-width: 1.5`, fill area abaixo da linha até baseline com opacity 10%
- Badge variação: pill verde/vermelho com seta

Counter animado: interpola de 0 ao valor em ~600ms com easing `ease-out`. Formata em cada frame (R$, %, un).

### Seção 2a — Rankings por Produto (esquerda)

Card com 3 tabs: `Eficiência` | `Mais Vendidos` | `Margem`

Cada tab mostra Top 10 como barras horizontais:
- Linha: nome do produto (esquerda) + barra + valor (direita)
- Barra: largura proporcional ao valor max, cor gradiente baseada na posição
- Cores das barras por posição no ranking: posição 1 = verde (#22C55E), posição 5 = amarelo (#EAB308), posição 10 = vermelho (#EF4444), interpolando entre elas
- Animação: barras crescem da esquerda com stagger delay (50ms entre cada)
- Transição entre tabs: crossfade suave (opacity + transform)

Dados mock (10 produtos):
```
Rabanete, Girassol, Ervilha, Beterraba, Coentro,
Mostarda, Rúcula, Brócolis, Repolho Roxo, Cenoura
```

### Seção 2b — Produção (direita)

Donut chart central (Chart.js Doughnut):
- 4 fases: Plantio (azul), Luz (amarelo), Colheita (verde), Concluído (cinza)
- cutout: 70% (donut fino)
- Centro: número total de produções (`text-3xl font-bold text-gray-900 dark:text-white`)

4 mini-cards dispostos em grid 2x2 abaixo do donut:
- Total Produções: ícone + número
- Perdas: vermelho
- Previstos: azul
- Atrasados: laranja/vermelho

### Seção 3a — Vendas Mensais (esquerda)

Bar chart vertical (Chart.js Bar):
- 12 meses (Mar 2025 → Fev 2026)
- Barras com `borderRadius: 4` e gradiente verde (mais escuro na base)
- Grid Y sutil, sem grid X
- Hover tooltip com valor formatado em BRL
- `maintainAspectRatio: false`, altura fixa ~280px

### Seção 3b — Fazendas (direita)

Tabela clean sem bordas de célula:
- Colunas: Nome | Ocupação | Eficiência
- Ocupação: barra de progresso inline
  - Verde: <70%
  - Amarelo: 70-90%
  - Vermelho: >90%
- Eficiência: badge pill colorido
- Row hover com `bg-gray-50 dark:bg-gray-800/50`
- 5-6 fazendas mock

## Visual System

### Cards
```css
bg-white dark:bg-[#1e1e1e]
border border-gray-100 dark:border-gray-800
rounded-xl
shadow-sm
p-5
```

### Tipografia
- Hero numbers: `text-2xl sm:text-3xl font-bold`
- Section titles: `text-lg font-semibold`
- Labels: `text-xs uppercase tracking-wider text-gray-500`
- Table text: `text-sm`

### Cores
- Primária: #549E54 (verde existente)
- Sucesso/positivo: #22C55E
- Alerta: #EAB308
- Perigo/negativo: #EF4444
- Sparkline fill: primária com opacity 10%
- Chart palette: ['#3B82F6', '#EAB308', '#22C55E', '#9CA3AF']

### Animações
- **Counter**: 0 → valor, 600ms, ease-out (requestAnimationFrame)
- **Barras ranking**: width 0% → N%, stagger 50ms, 400ms, ease-out
- **Cards entrada**: opacity 0→1 + translateY 8px→0, stagger 100ms, 500ms
- **Tab switch**: opacity crossfade 200ms

### Responsivo
- `xl` (1280+): layout completo 5 cols hero, 2 cols seções
- `lg` (1024+): 4 cols hero (último quebra), 2 cols seções
- `md` (768+): 3 cols hero, seções empilham
- `sm` (640+): 2 cols hero
- Base: 1 col tudo empilhado, charts full-width

## Data Structure (Mock)

```typescript
// Hero KPIs
const heroKpis = ref([
  { label: 'Faturamento Previsto', value: 24580, format: 'currency', sparkline: [18200, 21400, 22800, 24580], change: 12 },
  { label: 'Unidades Vendidas', value: 1842, format: 'number', suffix: 'un', sparkline: [1520, 1680, 1750, 1842], change: 8 },
  { label: 'Produção Total', value: 156, format: 'number', suffix: 'bdj', sparkline: [168, 172, 160, 156], change: -3 },
  { label: 'Margem Bruta', value: 42, format: 'percent', sparkline: [38, 39, 41, 42], change: 2 },
  { label: 'Eficiência Geral', value: 87, format: 'percent', sparkline: [78, 82, 84, 87], change: 5 },
])

// Rankings
const rankingTabs = ['Eficiência', 'Mais Vendidos', 'Margem']
const rankings = ref({
  eficiencia: [
    { nome: 'Rabanete', valor: 96 }, { nome: 'Girassol', valor: 93 },
    { nome: 'Ervilha', valor: 89 }, { nome: 'Mostarda', valor: 86 },
    { nome: 'Rúcula', valor: 82 }, { nome: 'Beterraba', valor: 78 },
    { nome: 'Coentro', valor: 74 }, { nome: 'Brócolis', valor: 69 },
    { nome: 'Repolho Roxo', valor: 63 }, { nome: 'Cenoura', valor: 58 },
  ],
  vendidos: [
    { nome: 'Rúcula', valor: 342 }, { nome: 'Rabanete', valor: 298 },
    { nome: 'Girassol', valor: 256 }, { nome: 'Coentro', valor: 214 },
    { nome: 'Mostarda', valor: 187 }, { nome: 'Ervilha', valor: 165 },
    { nome: 'Beterraba', valor: 142 }, { nome: 'Brócolis', valor: 118 },
    { nome: 'Cenoura', valor: 95 }, { nome: 'Repolho Roxo', valor: 78 },
  ],
  margem: [
    { nome: 'Girassol', valor: 58 }, { nome: 'Mostarda', valor: 52 },
    { nome: 'Rabanete', valor: 48 }, { nome: 'Ervilha', valor: 45 },
    { nome: 'Rúcula', valor: 41 }, { nome: 'Beterraba', valor: 38 },
    { nome: 'Coentro', valor: 34 }, { nome: 'Brócolis', valor: 29 },
    { nome: 'Repolho Roxo', valor: 24 }, { nome: 'Cenoura', valor: 19 },
  ]
})

// Produção
const producao = ref({
  total: 156, perdas: 8, previstos: 42, atrasados: 3,
  fases: { plantio: 38, luz: 45, colheita: 28, concluido: 45 }
})

// Vendas Mensais (12 meses)
const vendasMensais = ref([
  { mes: 'Mar/25', valor: 15200 }, { mes: 'Abr/25', valor: 17800 },
  { mes: 'Mai/25', valor: 16400 }, { mes: 'Jun/25', valor: 19200 },
  { mes: 'Jul/25', valor: 21500 }, { mes: 'Ago/25', valor: 20100 },
  { mes: 'Set/25', valor: 22800 }, { mes: 'Out/25', valor: 24200 },
  { mes: 'Nov/25', valor: 23100 }, { mes: 'Dez/25', valor: 18900 },
  { mes: 'Jan/26', valor: 20400 }, { mes: 'Fev/26', valor: 24580 },
])

// Fazendas
const fazendas = ref([
  { nome: 'Fazenda Central', ocupacao: 85, eficiencia: 92 },
  { nome: 'Fazenda Norte', ocupacao: 62, eficiencia: 88 },
  { nome: 'Fazenda Sul', ocupacao: 94, eficiencia: 76 },
  { nome: 'Fazenda Leste', ocupacao: 45, eficiencia: 95 },
  { nome: 'Fazenda Oeste', ocupacao: 73, eficiencia: 83 },
  { nome: 'Fazenda Horizonte', ocupacao: 58, eficiencia: 90 },
])
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `pages/index.vue` | Rewrite | Dashboard completo com dados mock |

Single file change. Tudo fica em `pages/index.vue` — sem componentes novos, sem composables novos. Os dados mock, animações e chart configs ficam no mesmo arquivo. Quando for integrar dados reais depois, basta substituir os `ref()` mock por fetches.

## What's NOT Included
- Fetch ao Supabase (dados mocados)
- Seletor de empresas funcional (mantém UI mas sem lógica)
- Seletor de período funcional (mantém UI mas sem lógica)
- Testes
- Seção de Tarefas (removida conforme solicitado)
