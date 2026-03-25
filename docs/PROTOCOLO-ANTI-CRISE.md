# Protocolo Anti-Crise — LogControl/Sumin

## Cenários de Falha Mapeados e Soluções

---

### 1. TELA BRANCA / SPINNER INFINITO
**Sintoma:** Página não carrega, fica em branco ou com spinner girando.
**Causa:** `loading` preso em `true`, service worker cacheando JS antigo.
**Solução:**
1. F12 → Application → Storage → **Clear site data**
2. Ctrl+Shift+R (hard refresh)
3. Se persistir: abrir em aba anônima para confirmar que é cache

**Prevenção no código:**
- Safety timeout de 3s no useAuth (força `loading = false`)
- PWA removido (sem service worker cacheando)
- `main.jsx` limpa service workers antigos no boot

---

### 2. LOGIN NÃO FUNCIONA / VOLTA PRO LOGIN
**Sintoma:** Digita credenciais, clica login, mas volta pro login ou nada acontece.
**Causa:** Token antigo no localStorage de user deletado.
**Solução:**
1. F12 → Application → Local Storage → deletar tudo com `sb-`
2. Recarregar página
3. Tentar login novamente

**Prevenção no código:**
- useAuth detecta sessão órfã (user sem perfil) e faz signOut automático
- `isAuthenticated` exige session + user + profile (os 3)

---

### 3. DASHBOARD CARREGA MAS DADOS NÃO APARECEM (SKELETONS)
**Sintoma:** Dashboard mostra, mas cards ficam em skeleton forever.
**Causa:** Queries falhando silenciosamente (RLS, sessão inválida).
**Solução:**
1. Verificar console (F12) — se tem erros 403/406
2. Se 403: user não tem permissão (RLS). Verificar role no Supabase
3. Se 406: query retorna 0 rows. Verificar se loja_id está setado

**Verificar no Supabase Dashboard:**
```sql
SELECT id, email, role, loja_id, ativo FROM users;
```

**Prevenção no código:**
- dashboardService tem try/catch em tudo
- Queries com `.maybeSingle()` em vez de `.single()`

---

### 4. ERRO 403 (PERMISSION DENIED) EM QUALQUER OPERAÇÃO
**Sintoma:** "new row violates row-level security policy"
**Causa:** RLS bloqueando. User sem `loja_id`, ou policy faltando.
**Solução:**
1. Verificar se o user tem `loja_id` na tabela `users`
2. Verificar se as policies existem:
```sql
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'TABELA';
```
3. Se não tem policies: executar migration 008_multi_tenant.sql

**Prevenção no código:**
- Todas as tabelas têm `DEFAULT get_user_loja_id()` no INSERT
- RLS usa `is_super_admin() OR (is_user_active() AND loja_id = get_user_loja_id())`

---

### 5. ADMIN DESLOGADO AO CRIAR USUÁRIO
**Sintoma:** Super Admin cria user na tela de Gestão de Lojas e é deslogado.
**Causa:** `supabase.auth.signUp()` substitui a sessão atual.
**Solução:** Já corrigido — usa Admin API via fetch direto.
**Se voltar:** Verificar `lojaService.criarUsuarioNaLoja` — NÃO pode usar `supabase.auth.signUp()`.

---

### 6. LOOP DE RE-LOGIN (FICA LOGANDO E DESLOGANDO)
**Sintoma:** Página fica piscando entre login e dashboard.
**Causa:** `onAuthStateChange` disparando múltiplas vezes, cada uma triggering novo processamento.
**Solução:**
1. Limpar localStorage (F12 → Application)
2. Hard refresh

**Prevenção no código:**
- `currentUidRef` — se mesmo user já está carregado, ignora evento
- `processing` flag com try/finally — nunca trava
- useEffect com `[]` — nunca recria o listener

---

### 7. ERRO 406 (NOT ACCEPTABLE)
**Sintoma:** Console mostra "Failed to load resource: 406"
**Causa:** `.single()` retorna 406 quando query retorna 0 rows.
**Solução:** Já corrigido — todos os SELECTs por ID usam `.maybeSingle()`.
**Se voltar:** Grep por `.single()` nos services e trocar por `.maybeSingle()` nos SELECTs.

---

### 8. UNCAUGHT (IN PROMISE) OBJECT
**Sintoma:** Console vermelho com "Uncaught (in promise) Object"
**Causa:** Promise rejeitada sem `.catch()`. Geralmente de extensões do browser ou RPCs.
**Solução:**
1. Verificar se é de extensão (content.js, background.js) → ignorar
2. Se é de código nosso → adicionar try/catch

**Prevenção no código:**
- Todos os RPCs fire-and-forget têm try/catch
- Hooks não fazem `throw err` em funções que não são awaited

---

### 9. DADOS DE OUTRA LOJA APARECENDO
**Sintoma:** User vê produtos/dados que não são da loja dele.
**Causa:** RLS com `is_super_admin()` retornando true por engano, ou `loja_id` null.
**Solução:**
```sql
-- Verificar loja_id em todas as tabelas
SELECT id, nome, loja_id FROM produtos WHERE loja_id IS NULL;
SELECT id, nome, loja_id FROM fornecedores WHERE loja_id IS NULL;
-- Corrigir
UPDATE produtos SET loja_id = 'UUID-DA-LOJA' WHERE loja_id IS NULL;
```

---

### 10. POLÍTICAS RLS SUMIRAM
**Sintoma:** Todas as queries retornam vazio ou 403.
**Causa:** Migration ou script dropou policies sem recriar.
**Solução:** Verificar e recriar:
```sql
-- Ver policies existentes
SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename;

-- Se users não tem policies:
CREATE POLICY "User vê próprio perfil" ON users FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users da mesma loja" ON users FOR SELECT TO authenticated USING (is_user_active() AND loja_id = get_user_loja_id());
CREATE POLICY "SUPER_ADMIN vê todos" ON users FOR SELECT TO authenticated USING (is_super_admin());
CREATE POLICY "User atualiza próprio perfil" ON users FOR UPDATE TO authenticated USING (auth.uid() = id AND is_user_active()) WITH CHECK (auth.uid() = id AND is_user_active());
CREATE POLICY "ADMIN gerencia users da loja" ON users FOR UPDATE TO authenticated USING (get_user_role() IN ('ADMIN', 'SUPER_ADMIN') AND (is_super_admin() OR loja_id = get_user_loja_id()));
CREATE POLICY "Registro de perfil" ON users FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
```

---

## Checklist Pré-Deploy

- [ ] `npx vite build` sem erros
- [ ] Variáveis de ambiente na Vercel (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
- [ ] Verificar policies RLS existem no Supabase
- [ ] Todos os users têm `loja_id` não-null
- [ ] Testar login/logout/F5 em aba anônima
- [ ] Console limpo (sem Uncaught errors do nosso código)

---

## Contatos de Emergência

| Ação | Comando |
|------|---------|
| Ver policies | `SELECT * FROM pg_policies WHERE schemaname = 'public';` |
| Ver users | `SELECT email, role, loja_id, ativo FROM users;` |
| Recriar user | `node scripts/apply-multi-tenant.js` |
| Limpar cache browser | F12 → Application → Clear site data |
| Build local | `npx vite build` |
| Testar sem cache | Aba anônima (Ctrl+Shift+N) |
