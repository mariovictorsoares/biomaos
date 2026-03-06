# Consolidar Paginas do Menu Lateral

## Objetivo
Reduzir o numero de itens no sidebar de 14 para 12, agrupando paginas relacionadas com tabs internas.

## Consolidacoes

### 1. Sementes (Especies + Lotes de Sementes)
- Rota: `/sementes` (tab default: especies), `/sementes?tab=lotes`
- Icon sidebar: `grass`
- Tabs: "Especies" | "Lotes de Sementes"
- Conteudo de cada tab: identico ao que existe hoje nas paginas individuais

### 2. Fazendas (Fazendas + Capacidade Fazendas)
- Rota: `/fazendas` (tab default: fazendas), `/fazendas?tab=capacidade`
- Icon sidebar: `agriculture` (mantido)
- Tabs: "Fazendas" | "Capacidade"
- Conteudo de cada tab: identico ao que existe hoje

## Componente TabsNav.vue
- Props: `tabs` (array {key, label, count?}), `modelValue`
- Underline animada (2px, cor primary, transition 200ms)
- Dark mode
- Responsivo (scroll horizontal no mobile)
- Contagem opcional

## Sidebar atualizado
Remove: Especies, Lotes de Sementes, Cap. Fazendas
Adiciona: Sementes
Mantém: Fazendas (agora com tabs internas)

## Paginas removidas
- `pages/especies/index.vue` → conteudo movido para componente
- `pages/lotes-sementes/index.vue` → conteudo movido para componente
- `pages/capacidade-fazendas/index.vue` → conteudo movido para componente

## O que NAO muda
- Modais, slideovers, funcionalidade CRUD
- Banco de dados / migrations
- Composables e server API
