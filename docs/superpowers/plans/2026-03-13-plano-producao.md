# Plano de Produção — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow users to create speculative production plans (independent of orders) by specifying species, quantity in units, farm, and harvest date — system auto-calculates trays, planting date, and seed needs.

**Architecture:** New migration adds `quantidade_unidades` and `mix_grupo_id` to existing `plantios` table. A new `ModalPlanoProducao.vue` component handles the form + calculations. `TabProducao.vue` gets a "Novo Plano" button and a secondary fetch from `plantios` to display the new records alongside legacy `producao` data.

**Tech Stack:** Nuxt 3, Vue 3 (Composition API), Supabase (PostgreSQL), Tailwind CSS (dark mode)

**Spec:** `docs/superpowers/specs/2026-03-13-plano-producao-design.md`

---

## Chunk 1: Database + Calculation Updates

### Task 1: Create migration 035

**Files:**
- Create: `supabase/migrations/035_plantios_plano_producao.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- 035_plantios_plano_producao.sql
-- Adiciona campos para plano de produção manual (especulativo)

ALTER TABLE plantios ADD COLUMN IF NOT EXISTS quantidade_unidades INTEGER;
ALTER TABLE plantios ADD COLUMN IF NOT EXISTS mix_grupo_id UUID;

CREATE INDEX IF NOT EXISTS idx_plantios_mix_grupo_id ON plantios(mix_grupo_id);

COMMENT ON COLUMN plantios.quantidade_unidades IS 'Quantidade original em unidades (celulas/blocos) informada pelo usuario';
COMMENT ON COLUMN plantios.mix_grupo_id IS 'UUID compartilhado entre 2 plantios mix que dividem as mesmas bandejas';
```

- [ ] **Step 2: Apply migration locally**

Run: `npx supabase db push` (or apply via Supabase dashboard)
Expected: Migration applies without errors.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/035_plantios_plano_producao.sql
git commit -m "feat(producao): add quantidade_unidades and mix_grupo_id to plantios"
```

---

### Task 2: Update `calcularDataPlantio` to support `tempo_buffer_colheita`

**Files:**
- Modify: `composables/useProducaoCalc.ts:104-113`

- [ ] **Step 1: Update the function signature and logic**

In `composables/useProducaoCalc.ts`, change `calcularDataPlantio` from:

```typescript
function calcularDataPlantio(
  dataColheita: string,
  etapas: EtapaCultivo[] | null,
  especie?: Especie
): string {
  const total = tempoTotalCultivo(etapas, especie)
  const colheita = new Date(dataColheita + 'T12:00:00')
  colheita.setDate(colheita.getDate() - total)
  return formatDateISO(colheita)
}
```

To:

```typescript
function calcularDataPlantio(
  dataColheita: string,
  etapas: EtapaCultivo[] | null,
  especie?: Especie
): string {
  const total = tempoTotalCultivo(etapas, especie)
  const buffer = especie?.tempo_buffer_colheita ?? 0
  const colheita = new Date(dataColheita + 'T12:00:00')
  colheita.setDate(colheita.getDate() - total - buffer)
  return formatDateISO(colheita)
}
```

This is backward-compatible: existing callers pass `especie` which may or may not have `tempo_buffer_colheita`. If undefined/null, defaults to 0 (no change in behavior).

- [ ] **Step 2: Verify no regressions**

Run: `npx nuxt build`
Expected: Builds without errors.

- [ ] **Step 3: Commit**

```bash
git add composables/useProducaoCalc.ts
git commit -m "feat(producao): include tempo_buffer_colheita in calcularDataPlantio"
```

---

### Task 3: Add `calcularBandejasPlano` function

**Files:**
- Modify: `composables/useProducaoCalc.ts` (add function + export)

- [ ] **Step 1: Add the function before the `return` block**

Add after `maiorTempoCultivo` function (around line 235), before `// --- Helpers internos ---`:

```typescript
/**
 * Calcula bandejas para plano de producao manual (baseado em unidades).
 * Diferente de calcularBandejas que é orientado a produto (vivo/cortado).
 */
function calcularBandejasPlano(
  quantidadeUnidades: number,
  unidadesPorBandeja: number,
  margem: number
): number {
  if (unidadesPorBandeja <= 0) return 0
  return Math.ceil((quantidadeUnidades / unidadesPorBandeja) * (1 + margem))
}
```

- [ ] **Step 2: Export the function**

Add `calcularBandejasPlano` to the return object:

```typescript
return {
  tempoTotalCultivo,
  calcularDatasEtapas,
  calcularDataPlantio,
  calcularDataValidade,
  calcularBandejas,
  calcularBandejasMix,
  calcularBandejasMixVivo,
  calcularSementeNecessaria,
  calcularRendimentoEsperado,
  maiorMargem,
  maiorTempoCultivo,
  calcularBandejasPlano
}
```

- [ ] **Step 3: Verify build**

Run: `npx nuxt build`
Expected: Builds without errors.

- [ ] **Step 4: Commit**

```bash
git add composables/useProducaoCalc.ts
git commit -m "feat(producao): add calcularBandejasPlano for unit-based tray calculation"
```

---

## Chunk 2: Modal Component

### Task 4: Create `ModalPlanoProducao.vue`

**Files:**
- Create: `components/ModalPlanoProducao.vue`

**Context needed:**
- Modal pattern: See `components/ModalCadastroProducao.vue` — uses Teleport to body, fixed z-50, max-w-3xl, bg-card-light/dark
- Supabase access: `useSupabaseClient()`, `useCurrentCompany()`, `useToast()`
- Calculation: `useProducaoCalc()` for `calcularBandejasPlano`, `calcularDataPlantio`, `calcularSementeNecessaria`, `calcularRendimentoEsperado`, `calcularDataValidade`, `tempoTotalCultivo`, `maiorMargem`, `calcularDatasEtapas`
- UUID: `crypto.randomUUID()`

- [ ] **Step 1: Create the component file**

```vue
<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 overflow-y-auto">
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-black/50 transition-opacity" @click="$emit('close')"></div>

      <!-- Modal -->
      <div class="flex min-h-full items-center justify-center p-4">
        <div class="relative w-full max-w-2xl bg-card-light dark:bg-card-dark rounded-xl shadow-xl transform transition-all">
          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-border-light dark:border-border-dark">
            <h2 class="text-lg font-semibold text-text-light dark:text-text-dark">Novo Plano de Produção</h2>
            <div class="flex items-center gap-2">
              <button @click="$emit('close')" class="btn btn-secondary">Voltar</button>
              <button @click="handleSalvar" class="btn btn-primary" :disabled="saving || !isFormValid">
                <span v-if="saving" class="animate-spin material-icons text-sm">refresh</span>
                {{ saving ? 'Salvando...' : 'Salvar' }}
              </button>
            </div>
          </div>

          <!-- Content -->
          <div class="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
            <!-- Toggle Tipo: Simples / Mix -->
            <div class="flex gap-2">
              <button
                type="button"
                @click="form.tipo = 'simples'"
                :class="[
                  'flex-1 py-2 px-3 rounded-lg text-sm font-medium border-2 transition-all text-center',
                  form.tipo === 'simples'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border-light dark:border-border-dark text-subtext-light dark:text-subtext-dark hover:border-gray-400'
                ]"
              >
                Simples
              </button>
              <button
                type="button"
                @click="form.tipo = 'mix'"
                :class="[
                  'flex-1 py-2 px-3 rounded-lg text-sm font-medium border-2 transition-all text-center',
                  form.tipo === 'mix'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border-light dark:border-border-dark text-subtext-light dark:text-subtext-dark hover:border-gray-400'
                ]"
              >
                Mix (2 espécies)
              </button>
            </div>

            <!-- Espécie(s) -->
            <div :class="form.tipo === 'mix' ? 'grid grid-cols-2 gap-4' : ''">
              <div>
                <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">
                  {{ form.tipo === 'mix' ? 'Espécie 1' : 'Espécie' }}
                </label>
                <select v-model="form.especie_id_1" :class="['input', attempted && !form.especie_id_1 ? 'border-red-500' : '']">
                  <option value="">Escolha a espécie</option>
                  <option v-for="esp in especiesAtivas" :key="esp.id" :value="esp.id">
                    {{ esp.nome }}
                  </option>
                </select>
                <span v-if="attempted && !form.especie_id_1" class="text-xs text-red-500 mt-1">Campo obrigatório</span>
                <!-- Lote ativo info -->
                <p v-if="loteAtivo1" class="text-[11px] text-subtext-light dark:text-subtext-dark mt-1">
                  Lote: {{ loteAtivo1.numero }} | Margem: {{ ((loteAtivo1.margem_seguranca || 0) * 100).toFixed(0) }}%
                </p>
                <p v-else-if="form.especie_id_1 && !loteAtivo1" class="text-[11px] text-red-500 mt-1">
                  <span class="material-icons text-[11px] align-middle">warning</span>
                  Sem lote ativo para esta espécie
                </p>
              </div>
              <div v-if="form.tipo === 'mix'">
                <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Espécie 2</label>
                <select v-model="form.especie_id_2" :class="['input', attempted && form.tipo === 'mix' && !form.especie_id_2 ? 'border-red-500' : '']">
                  <option value="">Escolha a espécie</option>
                  <option v-for="esp in especiesAtivas.filter(e => e.id !== form.especie_id_1)" :key="esp.id" :value="esp.id">
                    {{ esp.nome }}
                  </option>
                </select>
                <span v-if="attempted && form.tipo === 'mix' && !form.especie_id_2" class="text-xs text-red-500 mt-1">Campo obrigatório</span>
                <p v-if="loteAtivo2" class="text-[11px] text-subtext-light dark:text-subtext-dark mt-1">
                  Lote: {{ loteAtivo2.numero }} | Margem: {{ ((loteAtivo2.margem_seguranca || 0) * 100).toFixed(0) }}%
                </p>
                <p v-else-if="form.especie_id_2 && !loteAtivo2" class="text-[11px] text-red-500 mt-1">
                  <span class="material-icons text-[11px] align-middle">warning</span>
                  Sem lote ativo para esta espécie
                </p>
              </div>
            </div>

            <!-- Quantidade + Fazenda -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Quantidade (unidades)</label>
                <input
                  type="number"
                  v-model.number="form.quantidade"
                  min="1"
                  :step="form.tipo === 'mix' ? 2 : 1"
                  placeholder="Ex: 100"
                  :class="['input', attempted && quantidadeError ? 'border-red-500' : '']"
                />
                <span v-if="attempted && quantidadeError" class="text-xs text-red-500 mt-1">{{ quantidadeError }}</span>
              </div>
              <div>
                <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Fazenda</label>
                <select v-model="form.fazenda_id" :class="['input', attempted && !form.fazenda_id ? 'border-red-500' : '']">
                  <option value="">Escolha a fazenda</option>
                  <option v-for="faz in fazendasAtivas" :key="faz.id" :value="faz.id">
                    {{ faz.nome }}
                  </option>
                </select>
                <span v-if="attempted && !form.fazenda_id" class="text-xs text-red-500 mt-1">Campo obrigatório</span>
              </div>
            </div>

            <!-- Data Colheita -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">Data de Colheita</label>
                <input type="date" v-model="form.dataColheita" :class="['input', attempted && (!form.dataColheita || !colheitaNoFuturo) ? 'border-red-500' : '']" />
                <span v-if="attempted && !form.dataColheita" class="text-xs text-red-500 mt-1">Campo obrigatório</span>
                <span v-else-if="form.dataColheita && !colheitaNoFuturo" class="text-xs text-red-500 mt-1">Data deve ser no futuro</span>
              </div>
              <div></div>
            </div>

            <!-- Info Calculada -->
            <div v-if="showPreview" class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg space-y-2">
              <p class="text-xs font-medium text-blue-700 dark:text-blue-300 mb-2">Cálculos Automáticos</p>

              <div class="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <div class="flex justify-between">
                  <span class="text-blue-600 dark:text-blue-400">Bandejas:</span>
                  <span class="font-medium text-blue-800 dark:text-blue-200">{{ preview.bandejas }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-blue-600 dark:text-blue-400">Margem:</span>
                  <span class="font-medium text-blue-800 dark:text-blue-200">{{ (preview.margem * 100).toFixed(0) }}%</span>
                </div>

                <!-- Data plantio (simples) -->
                <template v-if="form.tipo === 'simples'">
                  <div class="flex justify-between">
                    <span class="text-blue-600 dark:text-blue-400">Data plantio:</span>
                    <span class="font-medium text-blue-800 dark:text-blue-200">{{ formatDateBR(preview.dataPlantio1) }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-blue-600 dark:text-blue-400">Semente:</span>
                    <span class="font-medium text-blue-800 dark:text-blue-200">
                      {{ preview.semente1 > 0 ? preview.semente1.toFixed(1) + ' g' : 'N/D' }}
                      <span v-if="preview.semente1 === 0" class="material-icons text-[11px] text-amber-500 align-middle">warning</span>
                    </span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-blue-600 dark:text-blue-400">Rendimento esperado:</span>
                    <span class="font-medium text-blue-800 dark:text-blue-200">
                      {{ preview.rendimento1 > 0 ? preview.rendimento1.toFixed(1) + ' g' : 'N/D' }}
                      <span v-if="preview.rendimento1 === 0" class="material-icons text-[11px] text-amber-500 align-middle">warning</span>
                    </span>
                  </div>
                </template>

                <!-- Data plantio (mix — 2 linhas) -->
                <template v-if="form.tipo === 'mix'">
                  <div class="flex justify-between">
                    <span class="text-blue-600 dark:text-blue-400">Plantio esp. 1:</span>
                    <span class="font-medium text-blue-800 dark:text-blue-200">{{ formatDateBR(preview.dataPlantio1) }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-blue-600 dark:text-blue-400">Plantio esp. 2:</span>
                    <span class="font-medium text-blue-800 dark:text-blue-200">{{ formatDateBR(preview.dataPlantio2) }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-blue-600 dark:text-blue-400">Semente esp. 1:</span>
                    <span class="font-medium text-blue-800 dark:text-blue-200">
                      {{ preview.semente1 > 0 ? preview.semente1.toFixed(1) + ' g' : 'N/D' }}
                    </span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-blue-600 dark:text-blue-400">Semente esp. 2:</span>
                    <span class="font-medium text-blue-800 dark:text-blue-200">
                      {{ preview.semente2 > 0 ? preview.semente2.toFixed(1) + ' g' : 'N/D' }}
                    </span>
                  </div>
                </template>
              </div>

              <!-- Data plantio no passado warning -->
              <p v-if="preview.plantioNoPassado" class="text-xs text-red-500 mt-2">
                <span class="material-icons text-[11px] align-middle">error</span>
                A data de plantio calculada está no passado!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  close: []
  saved: []
}>()

const supabase = useSupabaseClient()
const { currentCompany } = useCurrentCompany()
const { success, error: showError } = useToast()
const {
  calcularBandejasPlano,
  calcularDataPlantio,
  calcularDataValidade,
  calcularSementeNecessaria,
  calcularRendimentoEsperado,
  tempoTotalCultivo,
  maiorMargem
} = useProducaoCalc()

// Form state
const form = reactive({
  tipo: 'simples' as 'simples' | 'mix',
  especie_id_1: '',
  especie_id_2: '',
  quantidade: null as number | null,
  fazenda_id: '',
  dataColheita: ''
})
const attempted = ref(false)
const saving = ref(false)

// Data
const especies = ref<any[]>([])
const fazendas = ref<any[]>([])
const lotes = ref<any[]>([])
const etapasMap = ref<Record<string, any[]>>({})

// Load data on mount
onMounted(async () => {
  if (!currentCompany.value?.id) return
  const empresaId = currentCompany.value.id

  const [especiesRes, fazendasRes, lotesRes, etapasRes] = await Promise.all([
    supabase.from('especies').select('id, codigo, nome, tempo_germinacao, tempo_luz, vida_util_dias, tempo_buffer_colheita')
      .eq('empresa_id', empresaId).eq('ativo', true).order('nome'),
    supabase.from('fazendas').select('id, nome, unidades_por_bandeja')
      .eq('empresa_id', empresaId).eq('ativo', true).order('nome'),
    supabase.from('lotes_sementes').select('id, numero, especie_id, rendimento_por_bandeja, densidade_semeadura, margem_seguranca')
      .eq('empresa_id', empresaId).eq('status', 'ativo').order('created_at', { ascending: false }),
    supabase.from('etapas_cultivo').select('especie_id, nome, ordem, duracao_dias')
      .order('ordem', { ascending: true })
  ])

  especies.value = especiesRes.data || []
  fazendas.value = fazendasRes.data || []
  lotes.value = lotesRes.data || []

  // Build etapas map: especie_id -> etapas[]
  const map: Record<string, any[]> = {}
  for (const e of etapasRes.data || []) {
    if (!map[e.especie_id]) map[e.especie_id] = []
    map[e.especie_id].push(e)
  }
  etapasMap.value = map
})

// Computed: filtered lists
const especiesAtivas = computed(() => especies.value)
const fazendasAtivas = computed(() => fazendas.value)

// Computed: lote ativo for selected species
const loteAtivo1 = computed(() => {
  if (!form.especie_id_1) return null
  return lotes.value.find(l => l.especie_id === form.especie_id_1) || null
})
const loteAtivo2 = computed(() => {
  if (!form.especie_id_2) return null
  return lotes.value.find(l => l.especie_id === form.especie_id_2) || null
})

// Computed: fazenda selected
const fazendaSelecionada = computed(() => fazendas.value.find(f => f.id === form.fazenda_id))

// Computed: especie objects
const especie1 = computed(() => especies.value.find(e => e.id === form.especie_id_1))
const especie2 = computed(() => especies.value.find(e => e.id === form.especie_id_2))

// Computed: quantidade validation
const quantidadeError = computed(() => {
  if (!form.quantidade || form.quantidade <= 0) return 'Campo obrigatório'
  if (form.tipo === 'mix' && form.quantidade % 2 !== 0) return 'Para mix, quantidade deve ser par'
  return ''
})

// Computed: preview calculations
const showPreview = computed(() => {
  const hasSpecies = form.tipo === 'simples' ? !!form.especie_id_1 : (!!form.especie_id_1 && !!form.especie_id_2)
  const hasLote = form.tipo === 'simples' ? !!loteAtivo1.value : (!!loteAtivo1.value && !!loteAtivo2.value)
  return hasSpecies && hasLote && form.quantidade && form.quantidade > 0 && form.fazenda_id && form.dataColheita
})

const preview = computed(() => {
  if (!showPreview.value) return { bandejas: 0, margem: 0, dataPlantio1: '', dataPlantio2: '', semente1: 0, semente2: 0, rendimento1: 0, rendimento2: 0, plantioNoPassado: false }

  const faz = fazendaSelecionada.value
  const upb = faz?.unidades_por_bandeja || 6

  if (form.tipo === 'simples') {
    const lote = loteAtivo1.value!
    const esp = especie1.value!
    const etapas = etapasMap.value[esp.id] || null
    const margem = lote.margem_seguranca || 0
    const bandejas = calcularBandejasPlano(form.quantidade!, upb, margem)
    const dataPlantio = calcularDataPlantio(form.dataColheita, etapas, esp)
    const semente = calcularSementeNecessaria(bandejas, lote)
    const rendimento = calcularRendimentoEsperado(bandejas, lote)
    const plantioNoPassado = new Date(dataPlantio) < new Date(new Date().toISOString().split('T')[0])

    return { bandejas, margem, dataPlantio1: dataPlantio, dataPlantio2: '', semente1: semente, semente2: 0, rendimento1: rendimento, rendimento2: 0, plantioNoPassado }
  }

  // Mix
  const lote1 = loteAtivo1.value!
  const lote2 = loteAtivo2.value!
  const esp1 = especie1.value!
  const esp2 = especie2.value!
  const etapas1 = etapasMap.value[esp1.id] || null
  const etapas2 = etapasMap.value[esp2.id] || null
  const margem = maiorMargem([lote1, lote2])
  const bandejas = calcularBandejasPlano(form.quantidade!, upb, margem)
  const dataPlantio1 = calcularDataPlantio(form.dataColheita, etapas1, esp1)
  const dataPlantio2 = calcularDataPlantio(form.dataColheita, etapas2, esp2)
  const halfBandejas = bandejas / 2
  const semente1 = calcularSementeNecessaria(halfBandejas, lote1)
  const semente2 = calcularSementeNecessaria(halfBandejas, lote2)
  const rendimento1 = calcularRendimentoEsperado(halfBandejas, lote1)
  const rendimento2 = calcularRendimentoEsperado(halfBandejas, lote2)
  const plantioNoPassado = new Date(dataPlantio1) < new Date(new Date().toISOString().split('T')[0]) || new Date(dataPlantio2) < new Date(new Date().toISOString().split('T')[0])

  return { bandejas, margem, dataPlantio1, dataPlantio2, semente1, semente2, rendimento1, rendimento2, plantioNoPassado }
})

// Computed: colheita no futuro
const colheitaNoFuturo = computed(() => {
  if (!form.dataColheita) return false
  return new Date(form.dataColheita) >= new Date(new Date().toISOString().split('T')[0])
})

// Form valid
const isFormValid = computed(() => {
  if (!form.especie_id_1 || !form.fazenda_id || !form.dataColheita) return false
  if (!colheitaNoFuturo.value) return false
  if (!form.quantidade || form.quantidade <= 0) return false
  if (form.tipo === 'mix') {
    if (!form.especie_id_2 || form.especie_id_1 === form.especie_id_2) return false
    if (form.quantidade % 2 !== 0) return false
    if (!loteAtivo2.value) return false
  }
  if (!loteAtivo1.value) return false
  if (preview.value.plantioNoPassado) return false
  return true
})

// Save
async function handleSalvar() {
  attempted.value = true
  if (!isFormValid.value || !currentCompany.value?.id) return

  saving.value = true
  try {
    const empresaId = currentCompany.value.id
    const faz = fazendaSelecionada.value!
    const upb = faz.unidades_por_bandeja || 6

    if (form.tipo === 'simples') {
      const lote = loteAtivo1.value!
      const esp = especie1.value!
      const etapas = etapasMap.value[esp.id] || null
      const margem = lote.margem_seguranca || 0
      const bandejas = calcularBandejasPlano(form.quantidade!, upb, margem)
      const dataPlantio = calcularDataPlantio(form.dataColheita, etapas, esp)
      const dataValidade = calcularDataValidade(form.dataColheita, esp)
      const semente = calcularSementeNecessaria(bandejas, lote)
      const rendimento = calcularRendimentoEsperado(bandejas, lote)

      const { error } = await supabase.from('plantios').insert({
        empresa_id: empresaId,
        especie_id: esp.id,
        lote_semente_id: lote.id,
        fazenda_id: faz.id,
        quantidade_unidades: form.quantidade,
        bandejas,
        data_colheita: form.dataColheita,
        data_plantio: dataPlantio,
        data_validade: dataValidade,
        semente_necessaria_g: semente,
        rendimento_esperado_g: rendimento,
        status: 'planejado'
      })
      if (error) throw error
    } else {
      // Mix: 2 inserts with shared mix_grupo_id
      const mixGrupoId = crypto.randomUUID()
      const lote1 = loteAtivo1.value!
      const lote2 = loteAtivo2.value!
      const esp1 = especie1.value!
      const esp2 = especie2.value!
      const etapas1 = etapasMap.value[esp1.id] || null
      const etapas2 = etapasMap.value[esp2.id] || null
      const margem = maiorMargem([lote1, lote2])
      const bandejas = calcularBandejasPlano(form.quantidade!, upb, margem)
      const unidadesPorEspecie = form.quantidade! / 2
      const halfBandejas = bandejas / 2

      const records = [
        {
          empresa_id: empresaId,
          especie_id: esp1.id,
          lote_semente_id: lote1.id,
          fazenda_id: faz.id,
          quantidade_unidades: unidadesPorEspecie,
          bandejas,
          mix_grupo_id: mixGrupoId,
          data_colheita: form.dataColheita,
          data_plantio: calcularDataPlantio(form.dataColheita, etapas1, esp1),
          data_validade: calcularDataValidade(form.dataColheita, esp1),
          semente_necessaria_g: calcularSementeNecessaria(halfBandejas, lote1),
          rendimento_esperado_g: calcularRendimentoEsperado(halfBandejas, lote1),
          status: 'planejado'
        },
        {
          empresa_id: empresaId,
          especie_id: esp2.id,
          lote_semente_id: lote2.id,
          fazenda_id: faz.id,
          quantidade_unidades: unidadesPorEspecie,
          bandejas,
          mix_grupo_id: mixGrupoId,
          data_colheita: form.dataColheita,
          data_plantio: calcularDataPlantio(form.dataColheita, etapas2, esp2),
          data_validade: calcularDataValidade(form.dataColheita, esp2),
          semente_necessaria_g: calcularSementeNecessaria(halfBandejas, lote2),
          rendimento_esperado_g: calcularRendimentoEsperado(halfBandejas, lote2),
          status: 'planejado'
        }
      ]

      const { error } = await supabase.from('plantios').insert(records)
      if (error) throw error
    }

    success(form.tipo === 'mix' ? 'Plano mix criado com sucesso!' : 'Plano de produção criado!')
    emit('saved')
    emit('close')
  } catch (e: any) {
    showError('Erro ao salvar: ' + e.message)
  } finally {
    saving.value = false
  }
}

// Helpers
function formatDateBR(dateStr: string): string {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}
</script>
```

- [ ] **Step 2: Verify build**

Run: `npx nuxt build`
Expected: Builds without errors.

- [ ] **Step 3: Commit**

```bash
git add components/ModalPlanoProducao.vue
git commit -m "feat(producao): create ModalPlanoProducao component for speculative production"
```

---

## Chunk 3: Integration with TabProducao

### Task 5: Add "Novo Plano" button and modal to TabProducao

**Files:**
- Modify: `components/TabProducao.vue`

- [ ] **Step 1: Add modal state variable**

In script section, near the other modal refs (around line 1622), add:

```typescript
const showPlanoModal = ref(false)
```

- [ ] **Step 2: Add the "Novo Plano" button next to existing "Cadastrar Produção" buttons**

In the template, find the desktop button (line 111):

```html
<button @click="openCadastroModal" class="hidden sm:flex btn btn-primary shrink-0">
  Cadastrar Produção
</button>
```

Add a new button BEFORE it (so both are in the same flex container):

```html
<button @click="showPlanoModal = true" class="hidden sm:flex btn btn-secondary shrink-0">
  <span class="material-icons text-sm mr-1">add_circle_outline</span>
  Novo Plano
</button>
<button @click="openCadastroModal" class="hidden sm:flex btn btn-primary shrink-0">
  Cadastrar Produção
</button>
```

And find the mobile button (line 115):

```html
<button @click="openCadastroModal" class="sm:hidden btn btn-primary w-full justify-center">
  Cadastrar Produção
</button>
```

Add a new button BEFORE it:

```html
<button @click="showPlanoModal = true" class="sm:hidden btn btn-secondary w-full justify-center">
  <span class="material-icons text-sm mr-1">add_circle_outline</span>
  Novo Plano
</button>
<button @click="openCadastroModal" class="sm:hidden btn btn-primary w-full justify-center">
  Cadastrar Produção
</button>
```

- [ ] **Step 3: Add modal component at the end of the template**

At the end of the template (before closing `</div>` of root), add:

```html
<!-- Modal Plano de Produção -->
<ModalPlanoProducao
  v-if="showPlanoModal"
  @close="showPlanoModal = false"
  @saved="loadProducao()"
/>
```

- [ ] **Step 4: Verify build**

Run: `npx nuxt build`
Expected: Builds without errors.

- [ ] **Step 5: Commit**

```bash
git add components/TabProducao.vue
git commit -m "feat(producao): add 'Novo Plano' button and modal integration to TabProducao"
```

---

### Task 6: Add `plantios` data fetch and rendering to TabProducao

**Files:**
- Modify: `components/TabProducao.vue`

- [ ] **Step 1: Add plantios data ref**

Near the other data refs (around line 1589-1600), add:

```typescript
const plantiosManual = ref<any[]>([])
```

- [ ] **Step 2: Add loadPlantiosManual function**

Near `loadLotes()` function (around line 2589), add:

```typescript
async function loadPlantiosManual() {
  if (!currentCompany.value?.id) return
  const { data, error } = await supabase
    .from('plantios')
    .select(`*, fazendas:fazenda_id (id, nome), especies:especie_id (id, codigo, nome, tempo_germinacao, tempo_luz), lotes_sementes:lote_semente_id (id, numero)`)
    .eq('empresa_id', currentCompany.value.id)
    .is('pedido_item_id', null)
    .order('data_colheita', { ascending: true })
  if (error) {
    console.error('Erro ao carregar plantios manuais:', error.message)
    return
  }
  plantiosManual.value = data || []
}
```

- [ ] **Step 3: Add a normalizer function to map plantios to producao shape**

The existing table renders `producao` fields. To merge plantios into the same list, normalize their field names. Add near `loadPlantiosManual`:

```typescript
function normalizePlantiosToProducao(plantios: any[]): any[] {
  return plantios.map(p => ({
    ...p,
    // Map plantios fields to producao column names used by the table
    quantidade_bandeja: p.quantidade_unidades,
    data_plantio_previsto: p.data_plantio,
    data_colheita_prevista: p.data_colheita,
    data_semeadura: p.data_plantio,
    lote_id: p.lote_semente_id,
    // Flag to identify as manual plantio
    _isPlantio: true,
    _origem: 'manual'
  }))
}
```

- [ ] **Step 4: Create computed that merges both data sources**

Add a computed property that combines `producao` and normalized `plantiosManual`:

```typescript
const producaoComPlantios = computed(() => {
  const normalized = normalizePlantiosToProducao(plantiosManual.value)
  return [...producao.value, ...normalized]
})
```

Then, in the template where the table iterates over items (the existing `v-for` that loops over filtered/paginated producao), replace the data source to use `producaoComPlantios` instead of `producao`. Look for the computed that filters `producao.value` (likely a `filteredProducao` or similar computed) and include the normalized plantios in it.

**Note:** The exact location depends on how the existing filtering/pagination computed is structured. The implementer should find the computed property that feeds the table rows and merge `normalizePlantiosToProducao(plantiosManual.value)` into it before filtering.

- [ ] **Step 5: Add visual badge for manual plantios**

In the table row template, find where `fazenda` or `origem` is displayed (around line 165-175 based on the exploration — the column that shows fazenda name with an `origem` icon). Add a badge for manual plantios:

```html
<span v-if="item._isPlantio" class="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 ml-1">
  Plano
</span>
```

This renders a small "Plano" badge next to items that came from the `plantios` table.

- [ ] **Step 6: Call loadPlantiosManual on init and refresh**

Find where `loadProducao()` is called on mount or company change, and add `loadPlantiosManual()` alongside it.

Also update the `@saved` handler for the modal (from Task 5 Step 3): change:
```html
@saved="loadProducao()"
```
to:
```html
@saved="loadProducao(); loadPlantiosManual()"
```

- [ ] **Step 7: Verify build**

Run: `npx nuxt build`
Expected: Builds without errors.

- [ ] **Step 8: Commit**

```bash
git add components/TabProducao.vue
git commit -m "feat(producao): fetch and display plantios manuais in legacy tab with 'Plano' badge"
```

---

### Task 7: Final verification

- [ ] **Step 1: Verify build passes**

Run: `npx nuxt build`
Expected: Builds without errors.

- [ ] **Step 2: Manual testing checklist**

1. Navigate to Produção > Legado tab
2. Verify "Novo Plano" button appears next to "Cadastrar Produção"
3. Click "Novo Plano" — modal opens
4. Toggle between Simples and Mix
5. Select a species — verify lote info appears below
6. Enter quantity, select fazenda, pick harvest date
7. Verify calculated info panel shows bandejas, planting date, seed, yield
8. For mix: verify 2 species selects, even-number validation, 2 planting dates
9. Save — verify success toast
10. Verify no console errors
