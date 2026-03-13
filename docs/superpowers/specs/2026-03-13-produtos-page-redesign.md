# Produtos Page Redesign

**Date**: 2026-03-13
**Status**: Draft

## Summary

Redesign the products page modal and add price table management. Key changes:
- Remove `tipo_produto_id` field from product modal
- Make `codigo` (max 5 chars) and `nome` manual inputs (no auto-generation)
- Add price table CRUD modal accessible from page header and within product modal
- Add mandatory price inputs per price table inside the product modal
- Enforce MIX species limits by modalidade (vivo: max 2, cortado: unlimited)

## Current State

`TabProdutos.vue` (1062 lines) handles product listing, creation, editing, and inventory management. Products have auto-generated `codigo` and `nome` based on species + tipo_produto. Price tables exist in the database (`tabelas_preco` + `tabela_preco_itens`) but are not managed from the products page.

## Changes

### 1. Product Modal - Field Changes

**Remove:**
- `tipo_produto_id` select field
- Auto-generation logic (`generateAutoCodigo`, `generateAutoNome`)
- "Gerenciar Tipos de Produto" button/modal link (keep the `ModalListaTiposProduto` component for now but don't reference it)

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
- Show tooltip/message: "Maximo 2 especies para produto vivo"

**Produto Cortado (`modalidade = 'cortado'`):**
- MIX allows unlimited species (no change from current behavior)

**Modalidade switch (cortado -> vivo) with >2 species:**
- Auto-remove excess species (keep first 2)
- Show toast warning: "Especies excedentes removidas. Produto vivo permite no maximo 2 especies."

**Percentuais:** continue working as today (must sum to 100%)

### 3. Price Table Management Modal

**Access points:**
1. Button "Tabelas de Preco" in the page header (next to "Novo Produto")
2. Small button (+ icon) next to the prices section inside the product modal

**Modal functionality:**
- List all `tabelas_preco` for the current `empresa_id`
- Create new table: single `nome` field (required)
- Edit table name (inline edit or simple sub-modal)
- Delete table with confirmation dialog — cascades to delete all `tabela_preco_itens`
- Visual pattern: same as existing `ModalListaTiposProduto`, `ModalListaSubstratos`, `ModalListaEmbalagens`

**Database operations:**
- INSERT into `tabelas_preco` (id, empresa_id, nome, ativo, created_at, updated_at)
- UPDATE `tabelas_preco` SET nome WHERE id
- DELETE FROM `tabela_preco_itens` WHERE tabela_preco_id, then DELETE FROM `tabelas_preco` WHERE id

### 4. Price Inputs in Product Modal

**On modal open (create or edit):**
1. Fetch all active `tabelas_preco` for the empresa
2. If editing, fetch existing `tabela_preco_itens` for the product
3. Display "Precos" section with one row per price table:
   - Layout: `[Table Name Label] [R$ ___.__]`
   - Input uses Maska monetary mask (R$ format)
   - All fields required — cannot save product without filling all prices

**On save:**
- Upsert `tabela_preco_itens` for each price table (key: `tabela_preco_id` + `produto_id`)
- Delete any `tabela_preco_itens` for tables that no longer exist

**Empty state (no price tables exist):**
- Show message: "Nenhuma tabela de preco cadastrada"
- Show button: "Criar tabela de preco" that opens the price table management modal
- Block product save until at least one price table exists and is filled

**Legacy field:** `preco_padrao` column remains in DB but is not displayed in the modal.

### 5. Product Code Validation

- Client-side: `maxlength="5"` on input
- Uniqueness check: validate `codigo` is unique per `empresa_id` before saving (existing behavior)
- No format restrictions (letters, numbers, symbols allowed)

## Files to Modify

| File | Changes |
|------|---------|
| `components/TabProdutos.vue` | Remove tipo_produto_id, auto-gen logic. Add manual codigo/nome. Add prices section. Add MIX validation by modalidade. Add price table modal trigger. |
| `components/ModalListaTabelasPreco.vue` | **NEW** - Price table CRUD modal (list, create, edit, delete) |

## Database Changes

None required. Existing schema supports all changes:
- `tabelas_preco` and `tabela_preco_itens` tables already exist
- `produtos.codigo` is already TEXT type (no length constraint in DB, enforced in UI)
- `tipo_produto_id` column remains in DB (nullable) but is not set by the UI

## Migration Considerations

- Existing products with `tipo_produto_id` set will keep their data (not cleared)
- Existing products without prices in `tabela_preco_itens` will need prices added when edited
- No breaking changes to other parts of the system that reference `tipo_produto_id`
