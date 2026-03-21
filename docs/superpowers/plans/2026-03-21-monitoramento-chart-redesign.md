# Monitoramento Chart Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the monitoring modal to have a unified dual-axis gradient chart with toggle pills and device status in the header.

**Architecture:** Single-file edit to `components/SlideoverMonitoramentoFazenda.vue`. Replace two separate Chart.js line charts with one dual-axis chart using an inline plugin for canvas gradients. Add toggle pills for series visibility and a device online badge in the header.

**Tech Stack:** Vue 3, Chart.js 4.x, vue-chartjs 5.x, Tailwind CSS

**Spec:** `docs/superpowers/specs/2026-03-21-monitoramento-chart-redesign.md`

---

### Task 1: Add device online badge to header

**Files:**
- Modify: `components/SlideoverMonitoramentoFazenda.vue:20-33` (header section)

- [ ] **Step 1: Add badge between farm name and close button**

Replace the header's right side (currently just the close button) with a flex container holding the badge and close button. The badge reuses the existing `dispositivosOnline` computed and `dispositivos` ref.

In the template, replace lines 29-32:
```html
<button @click="$emit('close')" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
  <span class="material-icons-outlined">close</span>
</button>
```

With:
```html
<div class="flex items-center gap-3">
  <span
    class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
    :class="dispositivosOnline > 0
      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'"
  >
    <span class="w-2 h-2 rounded-full" :class="dispositivosOnline > 0 ? 'bg-green-500 animate-pulse' : 'bg-gray-400'"></span>
    <span class="material-icons-outlined text-sm">sensors</span>
    {{ dispositivosOnline }}/{{ dispositivos.length }}
  </span>
  <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
    <span class="material-icons-outlined">close</span>
  </button>
</div>
```

- [ ] **Step 2: Verify visually** — open the modal and confirm badge shows in header right side with correct count and green/gray styling.

- [ ] **Step 3: Commit**

```bash
git add components/SlideoverMonitoramentoFazenda.vue
git commit -m "feat(monitoramento): add device online badge to modal header"
```

---

### Task 2: Add toggle state and pills UI

**Files:**
- Modify: `components/SlideoverMonitoramentoFazenda.vue:246-253` (state section) and `components/SlideoverMonitoramentoFazenda.vue:64-80` (chart header row)

- [ ] **Step 1: Add toggle refs**

In the `<script setup>` state section (after line 253 `const deviceToAdd = ref('')`), add:

```js
const showTemp = ref(true)
const showUmid = ref(true)
```

- [ ] **Step 2: Add toggle function**

Below the new refs, add a toggle function that enforces "at least one active":

```js
function toggleSerie(serie) {
  if (serie === 'temp') {
    if (showTemp.value && !showUmid.value) return // can't disable last one
    showTemp.value = !showTemp.value
  } else {
    if (showUmid.value && !showTemp.value) return
    showUmid.value = !showUmid.value
  }
}
```

- [ ] **Step 3: Replace the chart header row**

Replace the current "Historico" header row (lines 65-79) with the new layout containing toggle pills and period selector:

```html
<div class="flex items-center justify-between mb-4 flex-wrap gap-2">
  <div class="flex items-center gap-2">
    <h3 class="text-sm font-semibold text-text-light dark:text-text-dark mr-1">Histórico</h3>
    <!-- Toggle pills -->
    <button
      @click="toggleSerie('temp')"
      class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200"
      :class="showTemp
        ? 'bg-red-500 text-white shadow-sm shadow-red-500/25'
        : 'bg-transparent border border-red-300 dark:border-red-700 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'"
      :disabled="showTemp && !showUmid"
    >
      <span class="material-icons-outlined text-sm">thermostat</span>
      Temperatura
    </button>
    <button
      @click="toggleSerie('umid')"
      class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200"
      :class="showUmid
        ? 'bg-blue-500 text-white shadow-sm shadow-blue-500/25'
        : 'bg-transparent border border-blue-300 dark:border-blue-700 text-blue-500 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'"
      :disabled="showUmid && !showTemp"
    >
      <span class="material-icons-outlined text-sm">water_drop</span>
      Umidade
    </button>
  </div>
  <div class="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 border border-border-light dark:border-border-dark rounded-lg p-0.5">
    <button
      v-for="p in periodos"
      :key="p.value"
      @click="periodo = p.value"
      class="px-3 py-1.5 text-xs font-medium rounded-md transition-colors"
      :class="periodo === p.value
        ? 'bg-primary text-white'
        : 'text-subtext-light dark:text-subtext-dark hover:text-text-light dark:hover:text-text-dark'"
    >
      {{ p.label }}
    </button>
  </div>
</div>
```

- [ ] **Step 4: Verify visually** — toggle pills appear, clicking toggles changes styles, last active pill is not clickable.

- [ ] **Step 5: Commit**

```bash
git add components/SlideoverMonitoramentoFazenda.vue
git commit -m "feat(monitoramento): add toggle pills for temperature/humidity series"
```

---

### Task 3: Replace two charts with unified dual-axis chart

**Files:**
- Modify: `components/SlideoverMonitoramentoFazenda.vue:87-131` (chart template) and `components/SlideoverMonitoramentoFazenda.vue:320-383` (chart computeds)

- [ ] **Step 1: Add gradient plugin and color helper**

In the `<script setup>`, after the `formatTimeLabel` function (~line 318), add:

```js
// Gradient plugin - creates dynamic canvas gradients using chartArea dimensions
const gradientPlugin = {
  id: 'customGradient',
  beforeDatasetsDraw(chart) {
    const { ctx, chartArea } = chart
    if (!chartArea) return

    chart.data.datasets.forEach((dataset) => {
      if (!dataset.borderColor || !dataset.fill) return
      const hex = dataset.borderColor
      const r = parseInt(hex.slice(1, 3), 16)
      const g = parseInt(hex.slice(3, 5), 16)
      const b = parseInt(hex.slice(5, 7), 16)
      const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
      gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.15)`)
      gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`)
      dataset.backgroundColor = gradient
    })
  }
}
```

- [ ] **Step 2: Replace chartTempData and chartUmidData with unified chartData**

Remove `chartTempData` and `chartUmidData` computeds. Replace with:

```js
const chartData = computed(() => ({
  labels: leituras.value.map(l => formatTimeLabel(l.registrado_em)),
  datasets: [
    showTemp.value && {
      label: 'Temperatura (°C)',
      data: leituras.value.map(l => l.temperatura),
      yAxisID: 'y',
      borderColor: '#EF4444',
      borderWidth: 2,
      fill: true,
      tension: 0.4,
      pointRadius: 0,
      pointHoverRadius: 5,
      pointHoverBackgroundColor: '#EF4444',
    },
    showUmid.value && {
      label: 'Umidade (%)',
      data: leituras.value.map(l => l.umidade),
      yAxisID: 'y1',
      borderColor: '#3B82F6',
      borderWidth: 2,
      fill: true,
      tension: 0.4,
      pointRadius: 0,
      pointHoverRadius: 5,
      pointHoverBackgroundColor: '#3B82F6',
    },
  ].filter(Boolean)
}))
```

- [ ] **Step 3: Replace chartOptions with dual-axis version**

Replace the existing `chartOptions` computed with:

```js
const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index',
    intersect: false,
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: isDark.value ? '#1f2937' : '#ffffff',
      titleColor: isDark.value ? '#e5e7eb' : '#111827',
      bodyColor: isDark.value ? '#d1d5db' : '#4b5563',
      borderColor: isDark.value ? '#374151' : '#e5e7eb',
      borderWidth: 1,
      padding: 12,
      cornerRadius: 8,
      boxPadding: 4,
      usePointStyle: true,
      callbacks: {
        label(ctx) {
          const label = ctx.dataset.label || ''
          const val = ctx.parsed.y
          if (label.includes('Temperatura')) return ` ${label}: ${val?.toFixed(1)}°`
          if (label.includes('Umidade')) return ` ${label}: ${val?.toFixed(0)}%`
          return ` ${label}: ${val}`
        }
      }
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: {
        color: isDark.value ? '#9ca3af' : '#6b7280',
        font: { size: 10 },
        maxTicksLimit: 10,
      },
    },
    y: {
      position: 'left',
      display: showTemp.value,
      beginAtZero: false,
      grid: {
        drawOnChartArea: !showUmid.value || showTemp.value,
        color: isDark.value ? '#374151' : '#f3f4f6',
      },
      ticks: {
        color: '#EF4444',
        font: { size: 11 },
        callback: (v) => v + '°',
      },
    },
    y1: {
      position: 'right',
      display: showUmid.value,
      beginAtZero: false,
      grid: {
        drawOnChartArea: showUmid.value && !showTemp.value,
        color: isDark.value ? '#374151' : '#f3f4f6',
      },
      ticks: {
        color: '#3B82F6',
        font: { size: 11 },
        callback: (v) => v + '%',
      },
    },
  },
}))
```

- [ ] **Step 4: Replace chart template section**

Replace the `<template v-else-if="leituras.length > 0">` block (lines 87-131) with:

```html
<template v-else-if="leituras.length > 0">
  <div class="card p-5">
    <!-- Min/Max row -->
    <div class="flex items-center gap-4 mb-4 text-xs font-medium">
      <div v-if="showTemp" class="flex items-center gap-2">
        <span class="text-sky-600 dark:text-sky-400">
          <span class="material-icons-outlined text-xs align-middle">arrow_downward</span>
          {{ minTemp !== null ? minTemp.toFixed(1) + '°' : '-' }}
        </span>
        <span class="text-red-600 dark:text-red-400">
          <span class="material-icons-outlined text-xs align-middle">arrow_upward</span>
          {{ maxTemp !== null ? maxTemp.toFixed(1) + '°' : '-' }}
        </span>
      </div>
      <span v-if="showTemp && showUmid" class="text-gray-300 dark:text-gray-600">&middot;</span>
      <div v-if="showUmid" class="flex items-center gap-2">
        <span class="text-sky-600 dark:text-sky-400">
          <span class="material-icons-outlined text-xs align-middle">arrow_downward</span>
          {{ minHumid !== null ? minHumid.toFixed(0) + '%' : '-' }}
        </span>
        <span class="text-blue-600 dark:text-blue-400">
          <span class="material-icons-outlined text-xs align-middle">arrow_upward</span>
          {{ maxHumid !== null ? maxHumid.toFixed(0) + '%' : '-' }}
        </span>
      </div>
    </div>
    <!-- Unified chart -->
    <div class="relative h-[280px]">
      <Line :data="chartData" :options="chartOptions" :plugins="[gradientPlugin]" />
    </div>
  </div>
</template>
```

- [ ] **Step 5: Verify visually** — single chart with both series, gradients, dual axes, tooltip shows both values.

- [ ] **Step 6: Test toggles** — disable temperature pill, verify only humidity shows with right axis grid. Re-enable, disable humidity, verify only temperature shows.

- [ ] **Step 7: Commit**

```bash
git add components/SlideoverMonitoramentoFazenda.vue
git commit -m "feat(monitoramento): unified dual-axis gradient chart with toggle pills"
```

---

### Task 4: Clean up removed code

**Files:**
- Modify: `components/SlideoverMonitoramentoFazenda.vue` (script section)

- [ ] **Step 1: Remove old chartTempData and chartUmidData computeds**

Delete the `chartTempData` computed (was lines 320-333) and `chartUmidData` computed (was lines 335-348) if they still exist. They were replaced by `chartData` in Task 3.

- [ ] **Step 2: Verify build** — run `npx nuxt build` to confirm no template references to removed computeds.

- [ ] **Step 3: Commit**

```bash
git add components/SlideoverMonitoramentoFazenda.vue
git commit -m "chore(monitoramento): remove old separate chart computeds"
```
