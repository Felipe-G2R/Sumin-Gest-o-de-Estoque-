# LogControl 1.0 — Sistema de Gestão de Estoque Odontológico

## 🚀 Setup Rápido

### 1. Criar projeto no Supabase
1. Acesse [supabase.com](https://supabase.com) e crie um novo projeto
2. Vá em **Settings → API** e copie:
   - `Project URL` 
   - `anon public key`

### 2. Configurar variáveis de ambiente
```bash
cp .env.example .env.local
```
Edite `.env.local` com suas credenciais do Supabase.

### 3. Criar tabelas no banco
1. No Supabase Dashboard, vá em **SQL Editor**
2. Clique em **New query**
3. Cole o conteúdo do arquivo `supabase/migrations/001_create_tables.sql`
4. Execute o script

### 4. Instalar dependências e rodar
```bash
npm install
npm run dev
```

### 5. Primeiro acesso
- Acesse `http://localhost:5173`
- Crie uma conta — o **primeiro usuário** será automaticamente **ADMIN**

---

## 📁 Estrutura do Projeto

```
src/
├── lib/              # Configurações e utilitários
│   ├── supabase.js   # Cliente Supabase
│   ├── utils.js      # Funções auxiliares (formatação, validação, etc.)
│   └── constants.js  # Constantes do sistema (roles, tipos, etc.)
│
├── services/         # Lógica de negócio (camada de dados)
│   ├── authService.js          # Autenticação e autorização
│   ├── produtoService.js       # CRUD de produtos
│   ├── fornecedorService.js    # CRUD de fornecedores
│   ├── movimentacaoService.js  # Entradas e saídas de estoque
│   ├── notificacaoService.js   # Alertas automáticos
│   ├── dashboardService.js     # Dados do painel principal
│   └── logService.js           # Auditoria (registro de ações)
│
├── hooks/            # React hooks customizados
│   ├── useAuth.jsx        # Context de autenticação global
│   ├── useProdutos.js     # Estado e operações de produtos
│   ├── useFornecedores.js # Estado e operações de fornecedores
│   ├── useMovimentacoes.js# Estado e operações de movimentações
│   ├── useNotificacoes.js # Estado e operações de notificações
│   ├── useDashboard.js    # Dados do dashboard
│   └── useLogs.js         # Logs de auditoria + exportação CSV
│
├── components/       # Componentes React reutilizáveis
│   └── RouteGuard.jsx     # Proteção de rotas (auth + roles)
│
├── pages/            # Páginas da aplicação (esqueleto funcional)
│   ├── LoginPage.jsx
│   ├── RegisterPage.jsx
│   ├── DashboardPage.jsx
│   ├── ProdutosPage.jsx
│   ├── ProdutoFormPage.jsx
│   ├── ProdutoDetalhesPage.jsx
│   ├── FornecedoresPage.jsx
│   ├── FornecedorFormPage.jsx
│   ├── FornecedorDetalhesPage.jsx
│   ├── MovimentacoesPage.jsx
│   ├── MovimentacaoFormPage.jsx
│   ├── NotificacoesPage.jsx
│   ├── AdminLogsPage.jsx
│   └── AdminUsuariosPage.jsx
│
├── App.jsx           # Configuração de rotas
└── main.jsx          # Entry point

supabase/
└── migrations/
    └── 001_create_tables.sql  # Script SQL completo
```

---

## 🔧 Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React + Vite |
| Backend | Supabase (PostgreSQL + Auth + RLS) |
| Roteamento | React Router DOM |
| Notificações UI | React Hot Toast |
| Gráficos | Recharts (pronto para uso) |
| Datas | date-fns (pronto para uso) |

---

## 📋 Funcionalidades Implementadas

- ✅ Autenticação (login, registro, logout, sessões)
- ✅ Roles (USER / ADMIN) com primeiro usuário = ADMIN
- ✅ CRUD de Produtos com filtros, categorias e soft delete
- ✅ CRUD de Fornecedores com validação de CNPJ
- ✅ Movimentações de estoque (entradas e saídas atômicas)
- ✅ Notificações automáticas (vencimento, estoque baixo, sem estoque)
- ✅ Dashboard com estatísticas
- ✅ Logs de auditoria com diff antes/depois
- ✅ Painel admin (logs + gestão de usuários)
- ✅ Exportação de logs em CSV
- ✅ Proteção de rotas (auth + roles)

## 🔮 Preparado para integração futura

- 🔲 OCR de notas fiscais (módulo Python + IA) — estrutura pronta para receber dados
- 🔲 Design de interface (UI/UX) — páginas são esqueletos funcionais
