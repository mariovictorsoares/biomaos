# Produtos Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the products page to use manual code/name, price tables, and MIX species limits by modalidade.

**Architecture:** Modify `TabProdutos.vue` (remove tipo, add manual fields + prices section), convert `ModalListaTabelasPreco.vue` to self-contained CRUD, and migrate two slideover components to use `tabela_preco_itens` for price lookup.

**Tech Stack:** Nuxt 3, Vue 3, Supabase, Tailwind CSS dark mode, Maska (input masks)

**Spec:** `docs/superpowers/specs/2026-03-13-produtos-page-redesign.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `components/TabProdutos.vue` | Modify | Product listing + CRUD modal. Remove tipo, add manual code/name, prices section, MIX validation |
| `components/ModalListaTabelasPreco.vue` | Rewrite | Self-contained price table CRUD (list, create inline, edit inline, delete with confirm) |
| `components/SlideoverCadastroPedido.vue` | Modify | Add tabela_preco_itens fetch + lookup for price resolution |
| `components/SlideoverAlteracaoPedido.vue` | Modify | Add tabela_preco_itens fetch + lookup for price resolution |

---

## Chunk 1: ModalListaTabelasPreco.vue - Self-Contained CRUD

### Task 1: Rewrite ModalListaTabelasPreco as self-contained component

**Files:**
- Rewrite: `components/ModalListaTabelasPreco.vue`

- [ ] **Step 1: Read the existing component and the pattern to follow**

Read `components/ModalListaTabelasPreco.vue` (current emit-based, 105 lines) and `components/ModalListaSubstratos.vue` (pattern reference). The new component must:
- Accept only `show` (Boolean) prop instead of `tabelas` array
- Fetch its own data from Supabase
- Handle create, edit (inline), delete internally
- Emit only `close` and `updated` events

- [ ] **Step 2: Rewrite the component**

Replace `components/ModalListaTabelasPreco.vue` with a self-contained component:

```vue
<template>
  <div v-if="show" class="fixed inset-0 z-[60] overflow-y-auto">
    <!-- Backdrop -->
    <div class="fixed inset-0 glass-backdrop transition-opacity" @click="$emit('close')"></div>

    <!-- Modal -->
    <div class="flex min-h-full items-center justify-center p-2 sm:p-4">
      <div class="relative w-full max-w-md glass-panel rounded-xl shadow-xl transform transition-all max-h-[90vh] flex flex-col">
        <!-- Header -->
        <div class="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span class="material-icons-outlined text-primary text-xl sm:text-2xl">payments</span>
          </div>
          <div class="min-w-0">
            <h2 class="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Tabelas de Preço</h2>
            <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Gerenciar tabelas de preço</p>
          </div>
        </div>

        <!-- Content -->
        <div class="px-4 sm:px-6 py-4 sm:py-6 overflow-y-auto flex-1">
          <!-- Loading -->
          <div v-if="loading" class="flex items-center justify-center py-8">
            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>

          <template v-else>
            <!-- Lista -->
            <div v-if="tabelas.length > 0" class="space-y-2">
              <div
                v-for="tabela in tabelas"
                :key="tabela.id"
                class="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <!-- Inline edit mode -->
                <template v-if="editingId === tabela.id">
                  <input
                    v-model="editingNome"
                    type="text"
                    class="input flex-1 mr-2 text-sm"
                    placeholder="Nome da tabela"
                    @keyup.enter="saveEdit(tabela.id)"
                    @keyup.escape="cancelEdit"
                    :ref="el => { if (el && editingId === tabela.id) el.focus() }"
                  />
                  <div class="flex items-center gap-1 shrink-0">
                    <button @click="saveEdit(tabela.id)" class="w-8 h-8 flex items-center justify-center text-green-600 hover:text-green-700 transition-colors" title="Salvar">
                      <span class="material-icons text-lg">check</span>
                    </button>
                    <button @click="cancelEdit" class="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors" title="Cancelar">
                      <span class="material-icons text-lg">close</span>
                    </button>
                  </div>
                </template>

                <!-- Normal display mode -->
                <template v-else>
                  <span class="text-sm font-medium text-gray-900 dark:text-white truncate pr-2">{{ tabela.nome }}</span>
                  <div class="flex items-center gap-1 shrink-0">
                    <button @click="startEdit(tabela)" class="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-primary transition-colors" title="Editar">
                      <span class="material-icons text-lg">edit</span>
                    </button>
                    <button @click="confirmDelete(tabela)" class="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors" title="Excluir">
                      <span class="material-icons text-lg">delete</span>
                    </button>
                  </div>
                </template>
              </div>
            </div>

            <!-- Empty State -->
            <div v-else class="text-center py-6 sm:py-8 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
              <span class="material-icons-outlined text-4xl text-gray-300 dark:text-gray-600 mb-2">payments</span>
              <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Nenhuma tabela cadastrada</p>
            </div>

            <!-- Inline create form -->
            <div v-if="showCreateForm" class="mt-3 flex items-center gap-2">
              <input
                v-model="newNome"
                type="text"
                class="input flex-1 text-sm"
                placeholder="Nome da nova tabela"
                @keyup.enter="createTabela"
                @keyup.escape="showCreateForm = false"
                ref="createInput"
              />
              <button @click="createTabela" :disabled="!newNome.trim() || saving" class="btn btn-primary text-sm py-2 px-3">
                <span v-if="saving" class="material-icons animate-spin text-sm">refresh</span>
                <span v-else class="material-icons text-sm">check</span>
              </button>
              <button @click="showCreateForm = false" class="btn btn-secondary text-sm py-2 px-3">
                <span class="material-icons text-sm">close</span>
              </button>
            </div>
          </template>
        </div>

        <!-- Footer -->
        <div class="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 dark:border-gray-700 flex gap-2 sm:gap-3 flex-shrink-0">
          <button @click="$emit('close')" class="flex-1 btn btn-secondary justify-center text-sm">Fechar</button>
          <button @click="openCreateForm" class="flex-1 btn btn-primary justify-center text-sm">Nova tabela</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import { useCurrentCompany } from '~/composables/useCurrentCompany'
import { useToast } from '~/composables/useToast'

const props = defineProps({
  show: { type: Boolean, default: false }
})

const emit = defineEmits(['close', 'updated'])

const supabase = useSupabaseClient()
const { currentCompany } = useCurrentCompany()
const { success, error: showError } = useToast()

const loading = ref(false)
const saving = ref(false)
const tabelas = ref([])

// Create
const showCreateForm = ref(false)
const newNome = ref('')
const createInput = ref(null)

// Edit
const editingId = ref(null)
const editingNome = ref('')

// Load tabelas
async function loadTabelas() {
  if (!currentCompany.value?.id) return
  loading.value = true
  try {
    const { data, error } = await supabase
      .from('tabelas_preco')
      .select('id, nome, ativo')
      .eq('empresa_id', currentCompany.value.id)
      .eq('ativo', true)
      .order('nome')
    if (error) throw error
    tabelas.value = data || []
  } catch (e) {
    console.error('Erro ao carregar tabelas de preço:', e)
    showError('Erro ao carregar tabelas de preço')
  } finally {
    loading.value = false
  }
}

// Create
function openCreateForm() {
  showCreateForm.value = true
  newNome.value = ''
  nextTick(() => createInput.value?.focus())
}

async function createTabela() {
  if (!newNome.value.trim() || !currentCompany.value?.id) return
  saving.value = true
  try {
    const { error } = await supabase
      .from('tabelas_preco')
      .insert({ empresa_id: currentCompany.value.id, nome: newNome.value.trim() })
    if (error) throw error
    success('Tabela de preço criada')
    showCreateForm.value = false
    newNome.value = ''
    await loadTabelas()
    emit('updated')
  } catch (e) {
    showError(e.message || 'Erro ao criar tabela')
  } finally {
    saving.value = false
  }
}

// Edit
function startEdit(tabela) {
  editingId.value = tabela.id
  editingNome.value = tabela.nome
  // Focus is handled by the :ref function in the template
}

function cancelEdit() {
  editingId.value = null
  editingNome.value = ''
}

async function saveEdit(id) {
  if (!editingNome.value.trim()) return
  saving.value = true
  try {
    const { error } = await supabase
      .from('tabelas_preco')
      .update({ nome: editingNome.value.trim() })
      .eq('id', id)
    if (error) throw error
    success('Tabela atualizada')
    cancelEdit()
    await loadTabelas()
    emit('updated')
  } catch (e) {
    showError(e.message || 'Erro ao atualizar tabela')
  } finally {
    saving.value = false
  }
}

// Delete
async function confirmDelete(tabela) {
  if (!confirm(`Excluir a tabela "${tabela.nome}"? Os preços vinculados serão removidos.`)) return
  saving.value = true
  try {
    const { error } = await supabase
      .from('tabelas_preco')
      .delete()
      .eq('id', tabela.id)
    if (error) throw error
    success('Tabela excluída')
    await loadTabelas()
    emit('updated')
  } catch (e) {
    showError(e.message || 'Erro ao excluir tabela')
  } finally {
    saving.value = false
  }
}

// Watch show prop to reload
watch(() => props.show, (val) => {
  if (val) loadTabelas()
})
</script>
```

- [ ] **Step 3: Verify no build errors**

Run: `npx nuxi build --no-nitro 2>&1 | head -50` (or just check for import/template errors)

- [ ] **Step 4: Commit**

```bash
git add components/ModalListaTabelasPreco.vue
git commit -m "feat(produtos): rewrite ModalListaTabelasPreco as self-contained CRUD"
```

---

## Chunk 2: TabProdutos.vue - Remove Tipo + Manual Code/Name

### Task 2: Remove tipo_produto_id from listing table

**Files:**
- Modify: `components/TabProdutos.vue`

- [ ] **Step 1: Remove Tipo column header from desktop table**

In `TabProdutos.vue`, remove the `<th>` at line 60:
```html
<th class="table-header w-32">Tipo</th>
```

- [ ] **Step 2: Remove Tipo cell from desktop table rows**

Remove line 107:
```html
<td class="table-cell max-w-[160px] truncate">{{ getTipoNome(produto.tipo_produto_id) }}</td>
```

- [ ] **Step 3: Remove Tipo from mobile cards**

At line 144, remove:
```html
<span class="text-xs text-subtext-light dark:text-subtext-dark">{{ getTipoNome(produto.tipo_produto_id) }}</span>
```

- [ ] **Step 4: Commit**

```bash
git add components/TabProdutos.vue
git commit -m "feat(produtos): remove Tipo column from product listing"
```

### Task 3: Remove tipo_produto_id from product modal

**Files:**
- Modify: `components/TabProdutos.vue`

- [ ] **Step 1: Remove the Tipo select + settings button from modal**

Remove lines 422-443 (the entire `<!-- Tipo -->` section with `<select v-model="form.tipo_produto_id">` and the settings button).

- [ ] **Step 2: Remove tipo_produto_id from form and save logic**

In `getEmptyForm()` (line 1153-1166), remove `tipo_produto_id: null`.

In `saveOrUpdate()`, remove `tipo_produto_id: form.value.tipo_produto_id || null` from both insert (line 1768) and update (line 1726).

In `openModal()` (line 1686-1697), remove `tipo_produto_id: produto.tipo_produto_id || null`.

- [ ] **Step 3: Remove dead code for tipos**

Remove:
- `tiposProduto` ref (line 1079)
- `showListaTiposModal`, `showTipoModal`, `editingTipo` refs (lines 1087-1089)
- `tiposAtivos` computed (lines 1190-1192)
- `getTipoNome()` function (lines 1263-1267)
- `getTipoCodigo()` function (lines 1269-1273)
- `generateAutoNome()` function (lines 1411-1426)
- `generateAutoCodigo()` function (lines 1428-1446)
- `loadTiposProduto()` function (lines 1482-1497)
- The watcher that auto-generates nome/codigo (lines 2284-2296)
- `loadTiposProduto()` call from company watcher (line 2311)
- `openListaTiposModal`, `closeListaTiposModal`, `openTipoModal`, `closeTipoModal`, `saveTipo` functions (lines 2125-2174)
- Template: `ModalListaTiposProduto` and `ModalTipoProduto` teleport blocks (lines 999-1018)

- [ ] **Step 4: Commit**

```bash
git add components/TabProdutos.vue
git commit -m "feat(produtos): remove tipo_produto_id from modal and dead code"
```

### Task 4: Make codigo and nome manual inputs

**Files:**
- Modify: `components/TabProdutos.vue`

- [ ] **Step 1: Update codigo input**

Replace the codigo input section (lines 491-499) with:
```html
<!-- Codigo e Nome (manual) -->
<div class="grid grid-cols-2 gap-4">
  <div>
    <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
      Código <span class="text-red-500">*</span>
    </label>
    <input type="text" v-model="form.codigo" class="input" maxlength="5" placeholder="Ex: RUC" />
    <p class="text-xs text-subtext-light dark:text-subtext-dark mt-1">Máx. 5 caracteres</p>
  </div>
```

- [ ] **Step 2: Update nome input**

Replace the nome input section (lines 500-507) with:
```html
  <div>
    <label class="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
      Nome do Produto <span class="text-red-500">*</span>
    </label>
    <input type="text" v-model="form.nome" class="input" placeholder="Nome do produto" />
  </div>
</div>
```

- [ ] **Step 3: Add codigo uniqueness validation to saveOrUpdate**

Since codigo is now manually typed (previously auto-generated and likely unique by construction), add explicit uniqueness check. In `saveOrUpdate()`, after the empty checks but before the DB insert/update, add:

```js
// Check codigo uniqueness
if (form.value.codigo) {
  let query = supabase
    .from('produtos')
    .select('id')
    .eq('empresa_id', currentCompany.value.id)
    .eq('codigo', form.value.codigo)
    .limit(1)

  if (isEditing.value) {
    query = query.neq('id', form.value.id)
  }

  const { data: existing } = await query
  if (existing && existing.length > 0) {
    showError('Já existe um produto com este código')
    saving.value = false
    return
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add components/TabProdutos.vue
git commit -m "feat(produtos): make codigo and nome manual inputs with uniqueness check"
```

---

## Chunk 3: TabProdutos.vue - MIX Validation + Price Tables

### Task 5: Add MIX species limit by modalidade

**Files:**
- Modify: `components/TabProdutos.vue`

- [ ] **Step 1: Add computed for max species**

In the script section, add after the `especiesAtivas` computed:
```js
const maxEspeciesMix = computed(() => {
  return form.value.modalidade === 'vivo' ? 2 : Infinity
})

const canAddMoreEspecies = computed(() => {
  return form.value.especie_ids.length < maxEspeciesMix.value
})
```

- [ ] **Step 2: Disable species dropdown when limit reached**

In the MIX species dropdown (template around line 378), add `:disabled` to each checkbox. Note: in Vue 3 templates, refs are auto-unwrapped, so use `form.especie_ids` not `form.value.especie_ids`:
```html
<input
  type="checkbox"
  :value="esp.id"
  v-model="form.especie_ids"
  :disabled="!form.especie_ids.includes(esp.id) && !canAddMoreEspecies"
  class="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 disabled:opacity-50"
/>
```

- [ ] **Step 3: Add limit message**

After the dropdown (after line 396), add:
```html
<p v-if="form.is_mix && form.modalidade === 'vivo' && form.especie_ids.length >= 2" class="text-xs text-amber-600 dark:text-amber-400 mt-1">
  Máximo 2 espécies para produto vivo
</p>
```

- [ ] **Step 4: Hide percentuais for vivo MIX**

The existing condition at line 399 already only shows percentuais for `form.modalidade === 'cortado'`, so no change needed here.

- [ ] **Step 5: Add modalidade switch watcher**

Add a new watcher to handle cortado→vivo switch when >2 species selected:
```js
watch(() => form.value.modalidade, (newVal, oldVal) => {
  if (newVal === 'vivo' && form.value.is_mix && form.value.especie_ids.length > 2) {
    form.value.especie_ids = form.value.especie_ids.slice(0, 2)
    success('Espécies excedentes removidas. Produto vivo permite no máximo 2 espécies.')
  }
})
```

- [ ] **Step 6: Commit**

```bash
git add components/TabProdutos.vue
git commit -m "feat(produtos): add MIX species limit by modalidade"
```

### Task 6: Add price tables state and loading

**Files:**
- Modify: `components/TabProdutos.vue`

- [ ] **Step 1: Add state variables for price tables**

In the state section, add:
```js
// Tabelas de preço
const tabelasPreco = ref([])
const formPrecos = ref({}) // { [tabela_preco_id]: price_value }
const showListaTabelasPrecoModal = ref(false)
```

- [ ] **Step 2: Add loadTabelasPreco function**

```js
async function loadTabelasPreco() {
  if (!currentCompany.value?.id) return
  try {
    const { data, error } = await supabase
      .from('tabelas_preco')
      .select('id, nome')
      .eq('empresa_id', currentCompany.value.id)
      .eq('ativo', true)
      .order('nome')
    if (error) throw error
    tabelasPreco.value = data || []
  } catch (e) {
    console.error('Erro ao carregar tabelas de preço:', e)
  }
}
```

- [ ] **Step 3: Add loadProdutoPrecos function (for editing)**

```js
async function loadProdutoPrecos(produtoId) {
  if (!produtoId) {
    formPrecos.value = {}
    return
  }
  try {
    const { data, error } = await supabase
      .from('tabela_preco_itens')
      .select('tabela_preco_id, preco')
      .eq('produto_id', produtoId)
    if (error) throw error
    const map = {}
    ;(data || []).forEach(item => { map[item.tabela_preco_id] = item.preco })
    formPrecos.value = map
  } catch (e) {
    console.error('Erro ao carregar preços do produto:', e)
    formPrecos.value = {}
  }
}
```

- [ ] **Step 4: Call loadTabelasPreco in company watcher**

In the watch for `currentCompany.value?.id` (around line 2306), add `loadTabelasPreco()` call.

- [ ] **Step 5: Load prices when opening edit modal**

In `openModal()`, after setting form values for edit (around line 1697), add:
```js
if (produto) {
  await loadProdutoPrecos(produto.id)
} else {
  formPrecos.value = {}
}
```

- [ ] **Step 6: Commit**

```bash
git add components/TabProdutos.vue
git commit -m "feat(produtos): add price tables state and loading"
```

### Task 7: Add prices section to product modal template

**Files:**
- Modify: `components/TabProdutos.vue`

- [ ] **Step 1: Add "Tabelas de Preço" button to page header**

In the toolbar (around line 18), add before the "Novo produto" button:
```html
<button @click="showListaTabelasPrecoModal = true" class="btn btn-secondary shrink-0 justify-center sm:justify-start">
  <span class="material-icons text-sm">payments</span>
  Tabelas de Preço
</button>
```

- [ ] **Step 2: Add prices section to the product modal body**

Before the estoque section (before line 510 `<!-- === SEÇÃO ESTOQUE ===`), add:
```html
<!-- === SEÇÃO PREÇOS === -->
<div class="border-t border-border-light dark:border-border-dark pt-4">
  <div class="flex items-center justify-between mb-3">
    <h3 class="text-sm font-semibold text-text-light dark:text-text-dark flex items-center gap-1.5">
      <span class="material-icons text-base text-primary">payments</span>
      Preços <span class="text-red-500">*</span>
    </h3>
    <button
      type="button"
      @click="showListaTabelasPrecoModal = true"
      class="w-[28px] h-[28px] flex items-center justify-center border border-border-light dark:border-border-dark rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shrink-0"
      title="Gerenciar tabelas de preço"
    >
      <span class="material-icons-outlined text-sm text-subtext-light dark:text-subtext-dark">add</span>
    </button>
  </div>

  <div v-if="tabelasPreco.length > 0" class="space-y-2">
    <div v-for="tabela in tabelasPreco" :key="tabela.id" class="flex items-center gap-3">
      <label class="text-sm text-text-light dark:text-text-dark flex-1 truncate">{{ tabela.nome }}</label>
      <div class="relative w-32">
        <span class="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-subtext-light dark:text-subtext-dark">R$</span>
        <input
          type="text"
          :value="formatPrecoInput(formPrecos[tabela.id])"
          @input="onPrecoInput(tabela.id, $event)"
          class="input text-sm text-right pl-8"
          placeholder="0,00"
        />
      </div>
    </div>
  </div>

  <div v-else class="text-center py-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
    <p class="text-xs text-subtext-light dark:text-subtext-dark mb-2">Nenhuma tabela de preço cadastrada</p>
    <button type="button" @click="showListaTabelasPrecoModal = true" class="text-xs text-primary hover:text-primary/80 font-medium">
      Criar tabela de preço
    </button>
  </div>
</div>
```

- [ ] **Step 3: Add price input helper functions**

In the script section, add:
```js
function formatPrecoInput(value) {
  if (value === undefined || value === null || value === '') return ''
  return Number(value).toFixed(2).replace('.', ',')
}

function onPrecoInput(tabelaId, event) {
  let val = event.target.value.replace(/[^\d,]/g, '').replace(',', '.')
  formPrecos.value[tabelaId] = val ? parseFloat(val) : null
}
```

- [ ] **Step 4: Add ModalListaTabelasPreco to template**

After the embalagem modal teleport block (after line 1060), add:
```html
<!-- Modal Lista Tabelas Preço -->
<Teleport to="body">
  <ModalListaTabelasPreco
    :show="showListaTabelasPrecoModal"
    @close="showListaTabelasPrecoModal = false"
    @updated="loadTabelasPreco"
  />
</Teleport>
```

- [ ] **Step 5: Commit**

```bash
git add components/TabProdutos.vue
git commit -m "feat(produtos): add prices section and price table modal trigger"
```

### Task 8: Save prices on product save

**Files:**
- Modify: `components/TabProdutos.vue`

- [ ] **Step 1: Add price validation before save**

At the start of `saveOrUpdate()`, after the company check, add:
```js
// Validate prices
if (tabelasPreco.value.length > 0) {
  const missingPrices = tabelasPreco.value.filter(t => !formPrecos.value[t.id] && formPrecos.value[t.id] !== 0)
  if (missingPrices.length > 0) {
    showError('Preencha o preço em todas as tabelas de preço')
    return
  }
}
if (tabelasPreco.value.length === 0) {
  showError('Cadastre pelo menos uma tabela de preço antes de salvar o produto')
  return
}
```

- [ ] **Step 2: Add price save logic after product save**

The price save code must be added in **both** the update and create branches separately, right before `success()`:

**In the UPDATE branch** (after the `produto_especies` insert, before `success('Produto atualizado')`):
```js
// Save prices (update path)
if (tabelasPreco.value.length > 0) {
  const precoRows = tabelasPreco.value.map(t => ({
    tabela_preco_id: t.id,
    produto_id: form.value.id,
    preco: formPrecos.value[t.id] || 0
  }))
  const { error: precoError } = await supabase
    .from('tabela_preco_itens')
    .upsert(precoRows, { onConflict: 'tabela_preco_id,produto_id' })
  if (precoError) throw precoError
}
```

**In the CREATE branch** (after the `produto_especies` insert, before `success('Produto criado')`):
```js
// Save prices (create path)
if (tabelasPreco.value.length > 0) {
  const precoRows = tabelasPreco.value.map(t => ({
    tabela_preco_id: t.id,
    produto_id: produtoData.id,
    preco: formPrecos.value[t.id] || 0
  }))
  const { error: precoError } = await supabase
    .from('tabela_preco_itens')
    .upsert(precoRows, { onConflict: 'tabela_preco_id,produto_id' })
  if (precoError) throw precoError
}
```

- [ ] **Step 3: Commit**

```bash
git add components/TabProdutos.vue
git commit -m "feat(produtos): save price table items on product save"
```

---

## Chunk 4: Slideover Pedido Migration

### Task 9: Migrate SlideoverCadastroPedido price lookup

**Files:**
- Modify: `components/SlideoverCadastroPedido.vue`

- [ ] **Step 1: Read the file and the reference pattern**

Read `components/SlideoverCadastroPedido.vue` and `components/ModalCadastroPedido.vue` (lines 430-467) to understand the existing pattern.

- [ ] **Step 2: Add state and fetch function**

In the script section, add:
```ts
const tabelaPrecoItens = ref<Array<{ tabela_preco_id: string, produto_id: string, preco: number }>>([])

async function loadTabelaPrecoItens() {
  if (!form.value.tabelaPrecoId) {
    tabelaPrecoItens.value = []
    return
  }
  try {
    const { data, error } = await supabase
      .from('tabela_preco_itens')
      .select('tabela_preco_id, produto_id, preco')
      .eq('tabela_preco_id', form.value.tabelaPrecoId)
    if (error) throw error
    tabelaPrecoItens.value = data || []
  } catch (e) {
    console.error('Erro ao carregar itens da tabela de preco:', e)
    tabelaPrecoItens.value = []
  }
}

function getPrecoFromTabela(produtoId: string): number | null {
  const item = tabelaPrecoItens.value.find(i => i.produto_id === produtoId)
  return item ? item.preco : null
}
```

- [ ] **Step 3: Add watcher for tabelaPrecoId**

```ts
watch(() => form.value.tabelaPrecoId, () => {
  loadTabelaPrecoItens()
}, { immediate: true })
```

- [ ] **Step 4: Update onProdutoChange to use tabela_preco lookup**

Replace the existing `onProdutoChange()` function (lines 316-321):
```ts
function onProdutoChange() {
  const produto = props.produtos.find(p => p.id === itemForm.value.produtoId)
  const precoTabela = getPrecoFromTabela(itemForm.value.produtoId)

  if (precoTabela !== null) {
    itemForm.value.valorUnitario = precoTabela
  } else if (produto?.preco_padrao) {
    itemForm.value.valorUnitario = produto.preco_padrao
  } else {
    itemForm.value.valorUnitario = 0
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add components/SlideoverCadastroPedido.vue
git commit -m "feat(pedidos): migrate SlideoverCadastroPedido to tabela_preco lookup"
```

### Task 10: Migrate SlideoverAlteracaoPedido price lookup

**Files:**
- Modify: `components/SlideoverAlteracaoPedido.vue`

- [ ] **Step 1: Read the file**

Read `components/SlideoverAlteracaoPedido.vue` to understand its structure.

- [ ] **Step 2: Add state, fetch function, and lookup helper**

Same pattern as Task 9 Step 2. Add `tabelaPrecoItens` ref, `loadTabelaPrecoItens()`, and `getPrecoFromTabela()`.

- [ ] **Step 3: Add watcher for tabelaPrecoId**

Same as Task 9 Step 3.

- [ ] **Step 4: Update onProdutoChange**

Replace lines 510-515:
```ts
function onProdutoChange() {
  const produto = props.produtos.find(p => p.id === itemForm.value.produtoId)
  const precoTabela = getPrecoFromTabela(itemForm.value.produtoId)

  if (precoTabela !== null) {
    itemForm.value.valorUnitario = precoTabela
  } else if (produto?.preco_padrao) {
    itemForm.value.valorUnitario = produto.preco_padrao
  } else {
    itemForm.value.valorUnitario = 0
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add components/SlideoverAlteracaoPedido.vue
git commit -m "feat(pedidos): migrate SlideoverAlteracaoPedido to tabela_preco lookup"
```

---

## Chunk 5: Build Verification

### Task 11: Build verification and final check

**Files:** All modified files

- [ ] **Step 1: Run build to verify**

Run: `npx nuxi build 2>&1 | tail -20`
Expected: Build succeeds without errors.

- [ ] **Step 2: Fix any build errors**

If errors, fix them and re-run build.

- [ ] **Step 3: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix(produtos): resolve build errors from produtos redesign"
```
