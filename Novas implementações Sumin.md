# Novas implementações Sumin

Plano técnico para duas correções solicitadas:

1. **SUPER_ADMIN deve conseguir criar usuários reais que atendam a outras lojas** (uso multi-loja).
2. **Cadastro de produto deve funcionar com ou sem código de barras**.

---

## 1. Diagnóstico — o que já existe e o que está quebrado

### 1.1 Multi-tenant (já está parcialmente pronto)

A migration `008_multi_tenant.sql` já criou a infraestrutura:

| Item | Status |
|---|---|
| Tabela `lojas` | OK |
| `loja_id` em `users`, `produtos`, `fornecedores`, `movimentacoes`, `notificacoes`, `logs`, `locais`, `inventarios`, `inventario_itens` | OK |
| Role `SUPER_ADMIN` no CHECK de `users.role` | OK |
| Helpers `get_user_loja_id()` e `is_super_admin()` (SECURITY DEFINER) | OK |
| Policies por loja em todas as tabelas | OK |
| DEFAULT `get_user_loja_id()` ao inserir linhas | OK |
| Trigger de audit já considera `loja_id` | OK |
| Página `SuperAdminPage.jsx` com UI para criar loja e usuário | OK |
| `lojaService.listar / criar / listarUsuariosDaLoja / moverUsuarioParaLoja` | OK |

### 1.2 O que está quebrado em "SUPER_ADMIN cria usuário"

`src/services/lojaService.js:74-117` (`criarUsuarioNaLoja`) **não funciona em produção**. Dois bloqueios:

- **Bloqueio A — Auth Admin API**: o método faz `POST /auth/v1/admin/users` mandando o `access_token` do SUPER_ADMIN logado como `Authorization: Bearer`. Esse endpoint do GoTrue exige um JWT com role `service_role`, **não** o token de usuário comum (nem mesmo do SUPER_ADMIN). A chamada retorna 401/403.
- **Bloqueio B — RLS de INSERT em `users`**: a única policy de INSERT é
  ```sql
  CREATE POLICY "Registro de perfil" ON users FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = id);
  ```
  Mesmo que A funcionasse, o SUPER_ADMIN não conseguiria inserir uma linha com `id` diferente do seu próprio `auth.uid()`. Falha por RLS.

A solução correta **não** é expor `service_role` no frontend (isso vazaria privilégios totais sobre o banco). É mover a operação para uma **Supabase Edge Function** com a `SERVICE_ROLE_KEY` como secret do servidor.

### 1.3 Código de barras — diagnóstico

| Camada | Estado atual | Problema |
|---|---|---|
| DB (`001_create_tables.sql:42`) | `codigo_barras TEXT UNIQUE` (sem NOT NULL) | Permite NULL. UNIQUE no Postgres aceita múltiplos NULLs. Sem mudança de schema. |
| `ProdutoFormPage.jsx:141-149` | Sem `required`, placeholder "Opcional" | Já é opcional na UI. |
| `ProdutoFormPage.jsx:73-81` (`handleSubmit`) | `dados = { ...form, ... }` | **Envia `codigo_barras: ''` (string vazia) quando o campo é deixado em branco.** A segunda inserção com '' viola a UNIQUE constraint. |
| `produtoService.js:42-50` (`criar`) | Repassa `dados` direto | Mesma falha do submit. |
| `produtoService.js:52-57` (`atualizar`) | Mesma situação no update | Atualizar um produto sem barcode também salva '' e pode quebrar. |

Conclusão: **não precisa migration**. Só converter `''` em `null` no payload de criação/atualização.

---

## 2. Correção 1 — SUPER_ADMIN cria usuários para outras lojas

### 2.1 Visão geral da solução

```
Frontend (SuperAdminPage)
    │  POST  /functions/v1/create-store-user
    │  Authorization: Bearer <token do SUPER_ADMIN>
    ▼
Supabase Edge Function "create-store-user"
    1. Lê JWT do header e valida (anon client)
    2. Confirma role SUPER_ADMIN no banco
    3. Usa service_role para:
       a) auth.admin.createUser({ email, password, email_confirm: true })
       b) INSERT em public.users com loja_id correto (bypass RLS)
    4. Retorna o profile
```

### 2.2 Fases de implementação

#### Fase A — Edge Function `create-store-user`

Arquivo novo: `supabase/functions/create-store-user/index.ts`.

Responsabilidades:
- Receber `{ nome, email, senha, role, lojaId }`.
- Criar dois clients Supabase:
  - `userClient` com `SUPABASE_ANON_KEY` + token do chamador → para identificar quem chamou.
  - `adminClient` com `SUPABASE_SERVICE_ROLE_KEY` → para criar o auth user e inserir o profile.
- Verificar autorização:
  - O chamador precisa estar autenticado (`userClient.auth.getUser()` retorna user válido).
  - O perfil do chamador precisa ter `role = 'SUPER_ADMIN'` (consulta via `adminClient`, pois o JWT do chamador pode não enxergar todas as colunas necessárias dependendo das policies, e o resultado é confiável apenas se vier do banco).
  - Opcional fase futura: ADMIN de uma loja pode criar usuários **da própria loja** (`role IN ('USER')`). Por ora restringir a SUPER_ADMIN para reduzir superfície.
- Validar payload (campos obrigatórios, senha >= 8, email formato, role em `{USER, ADMIN}`).
- Criar auth user: `adminClient.auth.admin.createUser({ email, password: senha, email_confirm: true, user_metadata: { nome } })`.
- Inserir perfil:
  ```sql
  INSERT INTO public.users (id, nome, email, role, loja_id)
  VALUES ($id, $nome, $email, $role, $lojaId);
  ```
  Via `adminClient`, bypassa RLS.
- Em caso de erro **após** criar o auth user, fazer rollback: `adminClient.auth.admin.deleteUser(newUser.id)` para não deixar usuário órfão no `auth.users`.
- Resposta: `{ id, email, role, loja_id }` (sem dados sensíveis).
- CORS: liberar `*` (ou domínio Vercel quando for para produção) e tratar OPTIONS.

Secrets que precisam ser configurados no projeto Supabase:
- `SUPABASE_URL` (já vem injetada nas Edge Functions)
- `SUPABASE_ANON_KEY` (já vem injetada)
- `SUPABASE_SERVICE_ROLE_KEY` (já vem injetada; **nunca** colocar em variável `VITE_*`)

Deploy:
```bash
npx supabase functions deploy create-store-user --no-verify-jwt
```
`--no-verify-jwt` porque a função **valida o JWT manualmente** (precisa aceitar a request mesmo se quiser retornar 401 com erro próprio).

#### Fase B — Migration `009_super_admin_user_creation.sql`

Mudanças mínimas no banco:

1. **Política de INSERT em `users` para SUPER_ADMIN** (defesa em profundidade — mesmo que a Edge Function use service_role, a policy fica como cinto e suspensório se alguém migrar a chamada para client-side por engano):
   ```sql
   CREATE POLICY "SUPER_ADMIN cria perfis" ON users FOR INSERT TO authenticated
     WITH CHECK (is_super_admin());
   ```

2. **Política de UPDATE para SUPER_ADMIN sobre `users.loja_id`** (já existe `ADMIN gerencia users da loja`, mas convém ser explícito):
   - Reaproveitar a existente — ela já cobre `is_super_admin()`.

3. **Constraint suave**: garantir que, exceto SUPER_ADMIN, todo usuário tenha `loja_id`. Pode ser feito por trigger BEFORE INSERT/UPDATE para não quebrar o `SUPER_ADMIN` (que normalmente fica com `loja_id NULL`):
   ```sql
   CREATE OR REPLACE FUNCTION enforce_loja_id_on_user()
   RETURNS TRIGGER LANGUAGE plpgsql AS $$
   BEGIN
     IF NEW.role <> 'SUPER_ADMIN' AND NEW.loja_id IS NULL THEN
       RAISE EXCEPTION 'loja_id é obrigatório para usuários que não sejam SUPER_ADMIN';
     END IF;
     RETURN NEW;
   END $$;

   CREATE TRIGGER trg_enforce_loja_id_on_user
     BEFORE INSERT OR UPDATE ON users
     FOR EACH ROW EXECUTE FUNCTION enforce_loja_id_on_user();
   ```

4. **Index único parcial em `users.email`** para evitar conflito case-insensitive (opcional, mas recomendado):
   ```sql
   CREATE UNIQUE INDEX IF NOT EXISTS uniq_users_email_ci ON users (lower(email));
   ```

#### Fase C — Frontend: trocar `lojaService.criarUsuarioNaLoja`

Substituir o corpo do método por chamada à Edge Function (sem alterar a assinatura — `SuperAdminPage.jsx` não muda):

```js
async criarUsuarioNaLoja({ nome, email, senha, role, lojaId }) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Sessão expirada');

  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-store-user`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ nome, email, senha, role, lojaId }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Erro ao criar usuário');
  }
  return res.json();
}
```

Vantagem: o admin **não desloga**, porque nada acontece no client `supabase.auth`.

#### Fase D — Bootstrap da primeira loja e do primeiro SUPER_ADMIN

Como o `SUPER_ADMIN` precisa existir antes de qualquer loja, e como `authService.register` cria o primeiro usuário como `ADMIN` (não como `SUPER_ADMIN`), criar um script `scripts/promote-super-admin.js`:

- Lê `.env.local`.
- Aceita `--email <email>` por argumento.
- Usa `SUPABASE_SERVICE_ROLE_KEY` (lida via `prompt` ou variável de ambiente, **nunca** commitada).
- Faz `UPDATE users SET role = 'SUPER_ADMIN', loja_id = NULL WHERE email = $1`.

Alternativa: rodar uma vez no SQL Editor do Supabase Dashboard.

### 2.3 Fluxo de uso esperado depois das mudanças

1. SUPER_ADMIN faz login.
2. Acessa `/super-admin`.
3. Clica em **Nova Loja**, preenche dados → cria registro em `lojas`.
4. Expande a loja, clica **Novo Usuário** → preenche nome, email, senha, role (USER ou ADMIN).
5. Submit chama `lojaService.criarUsuarioNaLoja` → Edge Function.
6. Edge Function valida SUPER_ADMIN, cria auth user, insere perfil com `loja_id` daquela loja.
7. Usuário criado pode fazer login imediatamente e vê apenas os dados da loja dele (RLS já protege).

### 2.4 Arquivos afetados (correção 1)

| Arquivo | Ação |
|---|---|
| `supabase/functions/create-store-user/index.ts` | **CRIAR** |
| `supabase/migrations/009_super_admin_user_creation.sql` | **CRIAR** |
| `src/services/lojaService.js` | **EDITAR** (substituir `criarUsuarioNaLoja`) |
| `scripts/promote-super-admin.js` | **CRIAR** (utilitário one-off) |
| `.env.example` | Adicionar comentário sobre `SUPABASE_SERVICE_ROLE_KEY` — **só para o script local**, nunca para o build do Vite |
| `src/pages/SuperAdminPage.jsx` | Sem mudança funcional, validar mensagens de erro |

### 2.5 Riscos e mitigação (correção 1)

| Risco | Mitigação |
|---|---|
| Vazamento de `service_role` | Fica apenas como secret da Edge Function. Nunca em código frontend nem em variável `VITE_*`. |
| Auth user criado e perfil falha | Rollback dentro da Edge Function: `auth.admin.deleteUser` em catch. |
| SUPER_ADMIN sem `loja_id` quebra queries | RLS já trata `is_super_admin()` como override em todas as policies. |
| Email duplicado entre lojas | Constraint `UNIQUE(lower(email))` na migration 009. |
| ADMIN comum tenta chamar a Edge Function | A função rejeita quem não for SUPER_ADMIN (`403`). |
| Replay de token | Tokens Supabase têm validade curta; refresh via cliente. Sem ação extra necessária. |

### 2.6 Como testar (correção 1)

1. **Migration**: aplicar `009_super_admin_user_creation.sql` no Supabase Dashboard → SQL Editor (ou via `supabase db push`).
2. **Promover SUPER_ADMIN**: rodar `node scripts/promote-super-admin.js --email contato@digitalwisdom.com.br` (ou UPDATE manual no SQL Editor).
3. **Deploy função**: `npx supabase functions deploy create-store-user --no-verify-jwt`.
4. **Smoke test manual**:
   - Logar como SUPER_ADMIN → criar Loja A e Loja B → criar 1 ADMIN em cada → logar como ADMIN da Loja A → confirmar que vê só produtos/fornecedores/etc da Loja A.
5. **Teste negativo**: logar como ADMIN comum (não SUPER), abrir DevTools, tentar chamar a Edge Function direto → deve retornar 403.
6. **Teste de rollback**: criar usuário com email já existente → confirmar que não fica linha órfã em `auth.users`.

---

## 3. Correção 2 — Cadastro de produto sem código de barras

### 3.1 Mudanças no código

**Sem migration.** UNIQUE em coluna com NULL aceita múltiplas linhas com NULL.

#### A. `src/pages/ProdutoFormPage.jsx` (linhas 70-86)

No `handleSubmit`, normalizar `codigo_barras`:

```js
const dados = {
  ...form,
  quantidade_atual: Number(form.quantidade_atual),
  quantidade_minima: Number(form.quantidade_minima),
  preco_unitario: form.preco_unitario ? Number(form.preco_unitario) : null,
  fornecedor_id: form.fornecedor_id || null,
  data_validade: form.data_validade || null,
  local_id: form.local_id || null,
  codigo_barras: form.codigo_barras?.trim() ? form.codigo_barras.trim() : null,
  lote: form.lote?.trim() ? form.lote.trim() : null,
};
```

Justificativa: `''` em coluna UNIQUE causa colisão entre múltiplos produtos sem código. NULL não. Mesmo tratamento de `lote` por consistência (não é UNIQUE, mas vale o trim).

#### B. `src/services/produtoService.js` (linhas 42-57)

Cinto e suspensório — caso outro lugar do código chame `criar`/`atualizar` direto sem passar pelo form:

```js
function normalizarCodigoBarras(dados) {
  if ('codigo_barras' in dados) {
    const cb = dados.codigo_barras?.toString().trim();
    dados.codigo_barras = cb ? cb : null;
  }
  return dados;
}

async criar(dados) {
  const payload = normalizarCodigoBarras({ ...dados, quantidade_atual: Number(dados.quantidade_atual || 0) });
  const { data, error } = await supabase.from('produtos').insert([payload]).select().single();
  if (error) throw error;
  return data;
},

async atualizar(id, dados) {
  const payload = normalizarCodigoBarras({ ...dados });
  const { data, error } = await supabase.from('produtos').update(payload).eq('id', id).select().single();
  if (error) throw error;
  return data;
},
```

#### C. UX no `ProdutoFormPage.jsx` (opcional, polimento)

- Manter o placeholder "Opcional".
- Adicionar tooltip/hint embaixo do campo: `Deixe em branco se o produto não tiver código de barras impresso`.
- Se o usuário usar o scanner mas quiser limpar, já funciona porque o campo é editável.

### 3.2 Tratamento de busca

`produtoService.listar` faz `or(nome.ilike.%termo%, codigo_barras.ilike.%termo%)`. Com `codigo_barras = NULL`, o `ilike` simplesmente não casa — não gera erro. Sem mudança.

### 3.3 Arquivos afetados (correção 2)

| Arquivo | Ação |
|---|---|
| `src/pages/ProdutoFormPage.jsx` | **EDITAR** (normalizar payload no submit) |
| `src/services/produtoService.js` | **EDITAR** (helper `normalizarCodigoBarras` em `criar` e `atualizar`) |

### 3.4 Riscos e mitigação (correção 2)

| Risco | Mitigação |
|---|---|
| Produtos antigos com `codigo_barras = ''` no banco | Rodar `UPDATE produtos SET codigo_barras = NULL WHERE codigo_barras = '';` uma vez. Pode entrar na migration 009 ou ser uma migration separada `010_normalize_empty_barcodes.sql`. |
| Importação por planilha mantém `''` | Aplicar `normalizarCodigoBarras` também em qualquer rota de import. (Hoje não há, mas registrar no checklist.) |
| Conflito quando o usuário escaneia código já existente | Já é tratado pelo erro do Postgres (chave duplicada). Melhorar mensagem: capturar `error.code === '23505'` em `produtoService.criar` e lançar "Já existe um produto com este código de barras". |

### 3.5 Como testar (correção 2)

1. Cadastrar 2 produtos sem código de barras → ambos salvam.
2. Cadastrar 2 produtos com o mesmo código → segundo falha com mensagem amigável.
3. Editar produto que tinha código → apagar campo → salvar → ver `codigo_barras` virar NULL.
4. Buscar por termo → produtos sem código continuam aparecendo se o nome casar.

---

## 4. Ordem de execução sugerida

1. **Banco**
   - Migration `009_super_admin_user_creation.sql` (policy INSERT, trigger `loja_id`, índice email, normalização de `codigo_barras` antigos).
2. **Frontend — produto (correção 2)**
   - Editar `ProdutoFormPage.jsx` e `produtoService.js`. Deploy e teste rápido — entrega rápida de valor.
3. **Backend — Edge Function (correção 1)**
   - Criar `supabase/functions/create-store-user/index.ts`. Deploy com `supabase functions deploy`.
4. **Frontend — lojaService**
   - Substituir `criarUsuarioNaLoja` para chamar a Edge Function.
5. **Bootstrap**
   - Promover o primeiro SUPER_ADMIN via SQL Editor.
6. **Teste end-to-end**
   - Criar 2 lojas, 1 ADMIN em cada, validar isolamento de dados.

---

## 5. Checklist final

- [ ] Migration 009 aplicada
- [ ] Edge Function `create-store-user` deployada
- [ ] Secret `SUPABASE_SERVICE_ROLE_KEY` configurado no projeto Supabase (já vem por padrão nas functions)
- [ ] `lojaService.criarUsuarioNaLoja` chamando a Edge Function
- [ ] `ProdutoFormPage.handleSubmit` normalizando `codigo_barras` para NULL
- [ ] `produtoService.criar/atualizar` normalizando `codigo_barras` para NULL
- [ ] SUPER_ADMIN bootstrap feito
- [ ] Smoke test: 2 lojas, ADMIN por loja, isolamento de dados confirmado
- [ ] Smoke test: 2+ produtos sem código de barras coexistem
- [ ] Mensagem amigável quando código de barras duplicado (erro 23505 → texto humano)

---

## 6. Observações de segurança

- `SUPABASE_SERVICE_ROLE_KEY` **nunca** deve aparecer no bundle do Vite, no `.env.local` lido pelo frontend, nem em commits. Permanece exclusivamente como secret de Edge Function (já injetado automaticamente pela Supabase).
- A Edge Function `--no-verify-jwt` precisa **obrigatoriamente** validar o JWT manualmente e checar o role no banco antes de qualquer ação. Sem isso, qualquer um cria contas.
- Log de auditoria: adicionar log explícito na tabela `logs` (acao = `CREATE_USER`, entidade = `AUTH`) dentro da Edge Function, populando `loja_id` da loja de destino. Útil para rastreabilidade de quem criou cada conta.
