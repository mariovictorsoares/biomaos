# Monitoramento Chart Redesign

**Data:** 2026-03-21
**Componente:** `components/SlideoverMonitoramentoFazenda.vue`
**Abordagem:** Chart.js com dual Y-axis (sem dependencias novas)

## Objetivo

Redesign do modal de monitoramento da fazenda para ter um grafico unificado profissional com visual "uau" (gradiente suave), toggles para selecionar series (temperatura/umidade), e status de dispositivos online no header.

## Mudancas

### 1. Header - Badge de dispositivos online

Adicionar badge no header do modal (lado direito, antes do botao fechar). Reutilizar o computed `dispositivosOnline` existente.

```
[agriculture icon] Campeche              [sensors] 2/3 online  [X]
                   CAMP · Monitoramento
```

- Badge com icone `sensors`, dot pulsante verde se algum online, texto `{online}/{total}`
- Cores: verde se algum online, cinza se todos offline

### 2. Grafico unificado com dual Y-axis

Substituir os dois graficos separados (temperatura e umidade) por um unico grafico:

- **Eixo Y esquerdo:** Temperatura (°C) - cor `#EF4444` (vermelho)
- **Eixo Y direito:** Umidade (%) - cor `#3B82F6` (azul)
- **Linhas:** `tension: 0.4`, `borderWidth: 2`
- **Preenchimento gradiente:** Via Chart.js inline plugin (ver secao tecnica)
- **Altura:** 280px
- **Points:** `pointRadius: 0`, `pointHoverRadius: 5` com hover effect
- **Tooltip unificado:** Mostra ambos valores com icones coloridos, fundo glass (branco/dark adaptado)
- **X axis:** Manter `CategoryScale` com labels formatados via `formatTimeLabel()` (sem TimeScale)

### 3. Toggle pills para series

Linha do historico reorganizada:

```
Historico  [thermostat Temperatura] [water_drop Umidade]   [24h | 7 dias | 30 dias]
```

- Toggle pills com icone Material + texto
- Estado ativo: fundo colorido (vermelho/azul) com texto branco
- Estado inativo: fundo transparente, borda, texto colorido
- Ambas ativas por default
- Ao desativar: serie some do grafico, eixo Y correspondente esconde
- Pelo menos uma deve estar ativa: pill da ultima serie ativa fica disabled (nao clicavel)

Comportamento do eixo quando so uma serie ativa:
- Eixo da serie inativa: `display: false`
- Eixo da serie ativa: `display: true`, `grid.drawOnChartArea: true` (grid normal)
- Quando ambas ativas: eixo Y direito (umidade) tem `grid.drawOnChartArea: false` pra nao duplicar grid

### 4. Min/Max consolidado

Linha compacta entre toggles e grafico mostrando min/max das series ativas:

```
arrow_downward 18.2°  arrow_upward 27.5°  ·  arrow_downward 45%  arrow_upward 78%
```

- So mostra min/max das series que estao ativas nos toggles
- Cores correspondentes a cada serie
- **Quando `leituras.length === 0`:** linha inteira fica oculta (o empty state card ja cobre esse caso)

### 5. Sem mudancas

- KPI cards (temperatura media, umidade media, online) no topo do body
- Secao de dispositivos (lista, vincular/desvincular)
- Logica de fetch de dados (fetchDispositivos, fetchAllDevices, fetchLeituras)
- Estrutura de periodos (24h, 7 dias, 30 dias)
- Props, emits, watchers

## Implementacao tecnica

### Gradiente via Chart.js inline plugin

Usar um inline plugin no componente `<Line>` que cria gradientes dinamicamente usando `chart.chartArea` (funciona em qualquer DPI):

```js
const gradientPlugin = {
  id: 'customGradient',
  beforeDatasetsDraw(chart) {
    const { ctx, chartArea } = chart
    if (!chartArea) return

    chart.data.datasets.forEach((dataset, i) => {
      const color = dataset.borderColor
      const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
      gradient.addColorStop(0, colorWithAlpha(color, 0.15))
      gradient.addColorStop(1, colorWithAlpha(color, 0))
      dataset.backgroundColor = gradient
    })
  }
}
```

Passar como prop `plugins` do componente `<Line>`: `:plugins="[gradientPlugin]"`

### Dual Y-axis config

```js
scales: {
  x: {
    // manter CategoryScale com formatTimeLabel()
    grid: { display: false },
    ticks: { maxTicksLimit: 10 }
  },
  y: {   // temperatura - esquerdo
    position: 'left',
    display: showTemp.value,
    grid: {
      drawOnChartArea: showTemp.value && !showUmid.value ? true : showTemp.value,
      color: isDark ? '#374151' : '#f3f4f6'
    },
    ticks: { color: '#EF4444' },
  },
  y1: {  // umidade - direito
    position: 'right',
    display: showUmid.value,
    grid: {
      drawOnChartArea: showUmid.value && !showTemp.value,
      color: isDark ? '#374151' : '#f3f4f6'
    },
    ticks: { color: '#3B82F6' },
  }
}
```

### Estado dos toggles

```js
const showTemp = ref(true)
const showUmid = ref(true)
```

### Datasets unificados

```js
datasets: [
  showTemp.value && {
    label: 'Temperatura',
    data: leituras.map(l => l.temperatura),
    yAxisID: 'y',
    borderColor: '#EF4444',
    fill: true,
    // backgroundColor sera preenchido pelo gradientPlugin
  },
  showUmid.value && {
    label: 'Umidade',
    data: leituras.map(l => l.umidade),
    yAxisID: 'y1',
    borderColor: '#3B82F6',
    fill: true,
    // backgroundColor sera preenchido pelo gradientPlugin
  },
].filter(Boolean)
```

## Arquivos modificados

1. `components/SlideoverMonitoramentoFazenda.vue` - unico arquivo alterado
