# Guia de Deploy — Sumin Stock

Como colocar mudanças em produção sem quebrar nada. Vale para frontend, Edge Functions e banco.

## Regra nº 1 — o push é sempre pela conta `Felipe-G2R`

O repositório pertence ao **Felipe-G2R**. A máquina tem duas contas do GitHub autenticadas no `gh`, e só uma delas escreve aqui:

| Conta | Permissão neste repo |
|-------|----------------------|
| `Felipe-G2R` | admin — **push liberado** |
| `nextdiamont-studio` | somente leitura — push recusado |

Antes de qualquer push, confirme quem está ativo:

```bash
gh auth status
```

Se a conta ativa não for a `Felipe-G2R`, troque:

```bash
gh auth switch --user Felipe-G2R
```

O remote **não deve** ter token embutido na URL. O correto é:

```
https://github.com/Felipe-G2R/Sumin-Gest-o-de-Estoque-.git
```

Se algum dia o push falhar com `Invalid username or token`, o motivo mais provável é um token colado na URL do remote — o Git usa esse token e ignora o `gh`, e quando ele expira o push para de funcionar sem aviso. Conserto:

```bash
git remote set-url origin https://github.com/Felipe-G2R/Sumin-Gest-o-de-Estoque-.git
gh auth setup-git
git push --dry-run origin main   # deve autenticar sem pedir senha
```

## Coordenadas

| Item | Valor |
|------|-------|
| Repositório | `Felipe-G2R/Sumin-Gest-o-de-Estoque-` (**público**) |
| Branch de produção | `main` |
| Site em produção | https://sumin-estoque.vercel.app |
| Projeto Supabase | ref `dwlaygqmbzidlwzyzkiv` (região `sa-east-1`) |
| CI | nenhum GitHub Actions — quem publica é a integração da Vercel |

Como o repositório é **público**, nunca versione `.env`, `.env.local`, chaves `service_role` ou tokens. Só o `.env.example` deve estar no Git.

## Frontend — push em `main` publica sozinho

Não existe comando de deploy. A Vercel observa a branch `main`: todo push vira um build de produção automático.

**Antes de dar push:**

```bash
npm run build   # precisa terminar sem erro
npm run lint    # ver observação abaixo
```

Sobre o lint: o projeto tem **23 erros pré-existentes** (variáveis não usadas e blocos `catch {}` vazios). O que importa é que esse número **não aumente** com a sua mudança. Se subir, o erro é seu — corrija antes do push.

**Depois do push, confirme que o site serve mesmo o código novo** (e não uma versão em cache):

```bash
# o hash do bundle em produção tem que bater com o do build local
curl -s https://sumin-estoque.vercel.app | grep -o 'assets/index-[A-Za-z0-9_-]*\.js'
ls dist/assets/ | grep -E '^index-.*\.js$'
```

Os dois hashes iguais significam que o deploy chegou. Para conferir uma funcionalidade específica, lembre que o Vite divide o código em chunks: o texto que você procura pode estar em outro arquivo que não o `index-*.js`. Descubra em qual com `grep -l "seu texto" dist/assets/*.js` e baixe esse mesmo arquivo da produção.

O status do build também aparece em `https://vercel.com` ou pela API do GitHub:

```bash
gh api "repos/Felipe-G2R/Sumin-Gest-o-de-Estoque-/deployments?per_page=1" --jq '.[0].sha'
```

**Rollback:** na Vercel, em *Deployments*, use *Promote to Production* no deploy anterior. É instantâneo e não depende de Git.

## Edge Functions — sempre com `--no-verify-jwt`

```bash
export SUPABASE_ACCESS_TOKEN='<sua PAT do Supabase>'
supabase functions deploy create-store-user --project-ref dwlaygqmbzidlwzyzkiv --no-verify-jwt
```

**Por que a flag importa:** `create-store-user` e `delete-store-user` validam o JWT do chamador dentro do próprio código — leem o header `Authorization`, chamam `auth.getUser()` e conferem o papel na tabela `users`. Por isso rodam com `verify_jwt = false` na plataforma. Um deploy sem a flag publicaria com `verify_jwt = true`, o que muda o comportamento em produção e pode derrubar até o preflight CORS.

As seções `[functions.create-store-user]` e `[functions.delete-store-user]` no `supabase/config.toml` já fixam esse valor. **Não as remova.**

**Antes de publicar,** confira que a versão no ar é a que você espera — não vale sobrescrever uma edição feita pelo painel:

```bash
curl -s -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  "https://api.supabase.com/v1/projects/dwlaygqmbzidlwzyzkiv/functions/create-store-user"
```

**Depois de publicar,** valide sem causar efeito colateral:

```bash
URL=https://dwlaygqmbzidlwzyzkiv.supabase.co/functions/v1/create-store-user
curl -s -o /dev/null -w "%{http_code}\n" -X OPTIONS "$URL"        # 200 (CORS ok)
curl -s -X POST "$URL" -H "Content-Type: application/json" -d '{}' # 401 token ausente
```

Confirme também que `verify_jwt` continua `false` e que a `version` subiu em 1.

## Banco — migrations

Aplique **uma por vez, em ordem numérica**, pelo SQL Editor do painel do Supabase, conferindo o resultado antes de passar à próxima. As migrations do projeto são idempotentes e abortam sozinhas quando falta um pré-requisito.

O projeto **não tem PITR nem backups automáticos** no plano atual. Antes de qualquer escrita que não seja trivial, salve um snapshot lógico das linhas que serão alteradas:

```sql
SELECT jsonb_agg(to_jsonb(t)) FROM <tabela> t WHERE <condição>;
```

Guarde o resultado num arquivo antes de rodar o `UPDATE`.

Depois de aplicar, registre no histórico para que `supabase db push` não tente reaplicar:

```sql
INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('015','nome_da_migration') ON CONFLICT (version) DO NOTHING;
```

Para testar uma mudança de RLS ou de trigger sem sujar o banco, rode dentro de `BEGIN; ... ROLLBACK;` simulando o usuário:

```sql
SELECT set_config('request.jwt.claims',
  json_build_object('sub','<uuid do usuário>','role','authenticated')::text, true);
```

### Armadilha de acentuação no Windows

Ao mandar SQL para a Management API pelo Git Bash, **nunca passe o corpo JSON por variável de shell** — acentos viram `U+FFFD` e chegam corrompidos ao banco, inclusive dentro de mensagens de `RAISE EXCEPTION`. Grave o JSON em arquivo pelo Node e envie com `curl --data-binary @arquivo`. Para conferir se algo já entrou torto:

```sql
SELECT nome FROM lojas WHERE nome LIKE '%' || chr(65533) || '%';
```

## Ordem quando a mudança envolve tudo

1. **Migrations primeiro.** O banco precisa aceitar o que o código novo vai enviar.
2. **Edge Functions depois.** Elas validam papéis que dependem do schema.
3. **Frontend por último** (o push em `main`). Assim a interface nunca oferece algo que o backend ainda recusa.

Invertendo essa ordem — frontend antes do banco — a tela oferece opções que o servidor rejeita, e o erro aparece para a usuária final.

## Checklist rápido

- [ ] `gh auth status` mostra `Felipe-G2R` como conta ativa
- [ ] Remote sem token embutido na URL
- [ ] `npm run build` sem erro
- [ ] `npm run lint` não passou de 23 erros
- [ ] Nenhum `.env`, chave ou token no que vai ser commitado
- [ ] Migrations aplicadas e registradas em `schema_migrations`
- [ ] Edge Functions publicadas com `--no-verify-jwt`
- [ ] `git push origin main`
- [ ] Hash do bundle em produção bate com o do `dist/` local
