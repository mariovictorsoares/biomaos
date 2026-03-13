# Produtos Page Redesign

**Date**: 2026-03-13
**Status**: Draft

## Summary

Redesign the products page modal and add price table management. Key changes:
- Remove `tipo_produto_id` field from product modal AND listing table
- Make `codigo` (max 5 chars) and `nome` manual inputs (no auto-generation)
- Add price table CRUD modal accessible from page header and within product modal
- Add mandatory price inputs per price table inside the product modal
- Enforce MIX species limits by modalidade (vivo: max 2, cortado: unlimited)
- Migrate downstream consumers (pedidos, vendas, contratos) from `preco_padrao` to `tabela_preco_itens`

## Current State

`TabProdutos.vue` (1062 lines) handles product listing, creation, editing, and inventory management. Products have auto-generated `codigo` and `nome` based on species + tipo_produto. Price tables exist in the database (`tabelas_preco` + `tabela_preco_itens`) but are not managed from the products page. `preco_padrao` is used as a price fallback in pedidos, vendas, and contratos components.

## Changes

### 1. Product Modal - Field Changes

**Remove:**
- `tipo_produto_id` select field and its column from the listing table (desktop + mobile)
- Auto-generation logic (`generateAutoCodigo`, `generateAutoNome`)
- "Gerenciar Tipos de Produto" button/modal link
- Remove dead code: `loadTiposProduto()`, `getTipoNome()`, related watchers/data

**Modify:**
- `codigo`: free text input, `maxlength="5"`, required, user types manually
- `nome`: free text input, required, user types manually

**Keep unchanged:**
- `modalidade` (vivo/cortado) radio/select
- `is_mix` toggle
- Species selection (single or multi)
- `peso_gramas` (for cortado)
- `substrato_id` select
- `embalagem_id` select
- `ativo` toggle

**Add:**
- "Precos" section at the bottom of the modal (see section 4)

### 2. MIX Species Rules by Modalidade

**Produto Vivo (`modalidade = 'vivo'`):**
- MIX allows maximum 2 species
- After selecting 2 species, disable the species dropdown
- Show message: "Maximo 2 especies para produto vivo"
- No percentuais for vivo MIX (implicit 50/50 for 2 species)

**Produto Cortado (`modalidade = 'cortado'`):**
- MIX allows unlimited species (no change from current behavior)
- Percentuais shown and must sum to 100% (existing behavior)

**Modalidade switch (cortado -> vivo) with >2 species:**
- Auto-remove excess species (keep first 2 in selection order)
- Show toast warning: "Especies excedentes removidas. Produto vivo permite no maximo 2 especies."

### 3. Price Table Management Modal

**Access points:**
1. Button "Tabelas de Preco" in the page header (next to "Novo Produto")
2. Small button (+ icon) next to the prices section inside the product modal

**Modal functionality:**
- List all `tabelas_preco` for the current `empresa_id`
- Create new table: single `nome` field (required)
- Edit table name (inline edit or simple sub-modal)
- Delete table with confirmation dialog (DB cascade handles `tabela_preco_itens` automatically)
- Visual pattern: same as existing `ModalListaSubstratos`, `ModalListaEmbalagens`

**Refresh flow:** When creating a price table from within the product modal, the "Precos" section refreshes to include the new table with an empty price input.

**Component architecture:** `ModalListaTabelasPreco.vue` already exists but is a "dumb" emit-based component. Convert to self-contained component with internal Supabase calls (matching `ModalListaSubstratos` pattern). Add delete functionality with confirmation.

### 4. Price Inputs in Product Modal

**On modal open (create or edit):**
1. Fetch all active `tabelas_preco` for the empresa
2. If editing, fetch existing `tabela_preco_itens` for the product
3. Display "Precos" section with one row per price table:
   - Layout: `[Table Name Label] [R$ ___.__]`
   - Input uses Maska monetary mask (R$ format, Brazilian decimal separator `,`)
   - All fields required — cannot save product without filling all prices

**On save:**
- Upsert `tabela_preco_itens` for each price table using `onConflict: 'tabela_preco_id, produto_id'`
- Delete any `tabela_preco_itens` for tables that no longer exist

**Editing existing products without prices:**
- When editing a product that has no `tabela_preco_itens`, all price fields appear empty and must be filled before saving. The user cannot save any changes without filling all prices.

**Empty state (no price tables exist):**
- Show message: "Nenhuma tabela de preco cadastrada"
- Show button: "Criar tabela de preco" that opens the price table management modal
- Block product save until at least one price table exists and is filled (intentional UX)

### 5. Product Code Validation

- Client-side: `maxlength="5"` on input
- DB constraint: `produtos.codigo` is `VARCHAR(50)` in DB (after migration 008), UI enforces max 5
- Uniqueness check: validate `codigo` is unique per `empresa_id` before saving (existing behavior)
- No format restrictions (letters, numbers, symbols allowed)

### 6. Migrate Downstream Consumers from `preco_padrao` to `tabela_preco_itens`

Components that use `preco_padrao` need to use price tables instead. The `pedidos` table already has `tabela_preco_id` (migration 017), so the price table is selected at order level.

**Already migrated (use tabela_preco first, fallback to preco_padrao):**
- `components/ModalCadastroPedido.vue` — already looks up `precoTabela` first
- `components/ModalEditarPedido.vue` — already looks up `precoTabela` first
- `pages/contratos/index.vue` — already has `getPrecoFromTabela()` with fallback

**Need migration (only use preco_padrao today):**
- `components/SlideoverCadastroPedido.vue` — add tabela_preco lookup matching Modal pattern. Needs: fetch `tabela_preco_itens` data, add lookup function, add watcher on `tabela_preco_id` change.
- `components/SlideoverAlteracaoPedido.vue` — same as above. Needs full data fetching infrastructure (not just a lookup function).

**Out of scope (future task):**
- `components/TabVendas.vue` — vendas table has no `tabela_preco_id` column. Stays using `preco_padrao` for now.
- `components/TabPedidos.vue` — passes `preco_padrao` in product interface to sub-components but delegates actual price resolution to Modal/Slideover components. No changes needed here since sub-components handle lookup.

**Price resolution logic (for components being migrated):**
1. Get `tabela_preco_id` from the pedido being created/edited
2. Fetch `tabela_preco_itens` WHERE `tabela_preco_id` matches
3. On product selection, look up price from fetched items by `produto_id`
4. If found, use that price
5. If not found, fall back to `preco_padrao` (backward compat with legacy products)
6. If neither exists, show price as 0

**Note:** Price table is assigned per pedido/contrato, not per customer. No new migration needed.

## Files to Modify

| File | Changes |
|------|---------|
| `components/TabProdutos.vue` | Remove tipo_produto_id (field + listing column + dead code). Manual codigo/nome. Prices section. MIX validation by modalidade. Price table modal trigger. |
| `components/ModalListaTabelasPreco.vue` | **MODIFY** - Convert from emit-based to self-contained. Add delete with confirmation. Add inline edit. |
| `components/SlideoverCadastroPedido.vue` | Add tabela_preco_itens fetch + lookup function + watcher (matching ModalCadastroPedido pattern) |
| `components/SlideoverAlteracaoPedido.vue` | Add tabela_preco_itens fetch + lookup function + watcher (matching ModalEditarPedido pattern) |

## Database Changes

None required. Existing schema supports all changes:
- `tabelas_preco` and `tabela_preco_itens` tables already exist
- `pedidos.tabela_preco_id` already exists (migration 017)
- `contratos.tabela_preco_id` already exists (migration 016)
- `tipo_produto_id` column remains in DB (nullable) but is not set by the UI
- `preco_padrao` column remains in DB for backward compatibility

## Migration Considerations

- Existing products with `tipo_produto_id` set keep their data (not cleared)
- Existing products without prices in `tabela_preco_itens` must have prices added when edited
- `preco_padrao` remains as fallback in downstream components for legacy products
- No new DB migration needed
