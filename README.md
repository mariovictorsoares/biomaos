# Bioma OS

Sistema de gestão para Fazendas Bioma.

## Tecnologias

- **Nuxt.js 3** - Framework Vue.js
- **Tailwind CSS** - Estilização
- **Supabase** - Backend e banco de dados

## Setup

1. Instalar dependências:
```bash
npm install
```

2. Configurar variáveis de ambiente:
```bash
cp .env.example .env
```
Edite o arquivo `.env` com suas credenciais do Supabase.

3. Executar em desenvolvimento:
```bash
npm run dev
```

O projeto estará disponível em `http://localhost:3000`

## Estrutura

```
├── assets/          # CSS e assets estáticos
├── components/      # Componentes Vue reutilizáveis
├── layouts/         # Layouts da aplicação
├── pages/          # Páginas (rotas automáticas)
│   ├── index.vue           # Dashboard
│   └── empresas/
│       └── index.vue       # Listagem de empresas
└── nuxt.config.ts  # Configuração do Nuxt
```

## Features Implementadas

- ✅ Dashboard com estatísticas
- ✅ Menu lateral com navegação
- ✅ Página de listagem de empresas
- ✅ Design clean e moderno
- ✅ Busca e filtros
- ✅ Cards responsivos

## Próximos Passos

- [ ] Integração com Supabase
- [ ] CRUD completo de empresas
- [ ] Páginas de fazendas
- [ ] Páginas de propriedades
- [ ] Sistema de autenticação
- [ ] Relatórios
