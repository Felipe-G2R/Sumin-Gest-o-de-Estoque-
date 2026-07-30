# Como aplicar as migrations 011 a 014

Correções pedidas pela Dra. Tamires (`correcoes.md`), mais dois bugs que apareceram durante a validação. São quatro arquivos, aplicados **nesta ordem**.

> As quatro foram testadas num Postgres 16 limpo, aplicando todo o histórico do banco (001 → 014) e simulando as sessões de administrador, usuário comum e operador de saída com RLS ativa. Os 16 cenários de teste passaram, e reaplicar as migrações não altera nem duplica nada.

## Antes de começar

1. **Faça backup.** Supabase → *Database* → *Backups* → *Create backup*. Leva menos de um minuto e é o seguro de tudo que vem a seguir.
2. Abra o **SQL Editor** do painel do Supabase.
3. Aplique um arquivo por vez: cole o conteúdo inteiro, execute, confira o resultado, só então passe para o próximo.

Todas as três são **idempotentes** — rodar duas vezes não causa dano. Nenhuma apaga dados.

---

## Ordem de aplicação

| Ordem | Arquivo | Resolve | Depende de |
|-------|---------|---------|------------|
| 1º | `011_normalizar_cnpj_vazio.sql` | Fornecedor sem CNPJ | — |
| 2º | `012_operador_saida.sql` | Usuário só de saída (ASBs) | `008_multi_tenant.sql` |
| 3º | `013_baixa_estoque_nao_admin.sql` | A baixa realmente descontar do estoque | `012` |
| 4º | `014_remover_policies_abertas.sql` | Locais e inventários vazando entre lojas | `008` |

**012, 013 e 014 andam juntas.** Sem a 013, o usuário de saída registra a movimentação mas o estoque não diminui. Sem a 014, ele consegue criar e editar locais e inventários de qualquer loja. Não pare no meio.

---

### 1º — `011_normalizar_cnpj_vazio.sql`

Troca CNPJ em branco (`''`) por `NULL` nos fornecedores e lojas já cadastrados e instala um trigger que faz isso sozinho daqui em diante.

**Por que era necessário:** a coluna CNPJ é única. O Postgres aceita vários registros com CNPJ `NULL`, mas não aceita dois com o texto vazio — por isso o segundo fornecedor sem CNPJ era recusado.

**Como saber se deu certo:** cadastre dois fornecedores sem CNPJ. Os dois devem entrar.

---

### 2º — `012_operador_saida.sql`

Cria o papel `OPERADOR_SAIDA` e as regras de acesso dele no banco.

Se aparecer um aviso `WARNING: Policy "..." não encontrada`, **anote e me mande** — significa que alguma regra da migration 008 tem nome diferente no seu banco e aquele ajuste específico não foi aplicado.

**Como saber se deu certo:**
```sql
SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = 'users_role_check';
```
O resultado precisa incluir `OPERADOR_SAIDA`.

---

### 3º — `013_baixa_estoque_nao_admin.sql`

Corrige um bug silencioso que já existia: quem não é administrador registrava a saída, mas o estoque não baixava — a movimentação aparecia no histórico e o saldo do produto ficava igual.

Depois de aplicar, quem não é administrador passa a alterar **apenas** a quantidade em estoque. Nome, preço, validade e desativação do produto continuam exclusivos do administrador — isso é garantido por um trigger no banco, então vale inclusive para quem tentar pela API.

**Como saber se deu certo:** entre com um usuário comum, registre uma saída de 1 unidade e confira se o estoque do produto diminuiu.

---

### 4º — `014_remover_policies_abertas.sql`

Remove 10 regras de permissão abertas (`true`) que a migration 007 criou antes do sistema virar multi-loja. A 008 tentou removê-las, mas procurou por nomes que não conferiam — o comando era `IF EXISTS`, então passou em silêncio sem remover nada.

Como o Postgres combina regras de permissão com "ou", uma única regra aberta anula todas as regras corretas ao lado. Na prática, hoje **qualquer pessoa logada enxerga, cria, edita e apaga locais e inventários de todas as lojas** — a Lorena mexe nos da Cunha e vice-versa. Foi o que apareceu no teste do operador de saída: as regras da 012 estavam certas, mas a regra aberta passava por cima.

**Como saber se deu certo:** a própria migration avisa no final — deve aparecer `OK: nenhuma policy aberta restante.`

**Efeito colateral esperado:** locais e inventários que estejam sem loja definida deixam de aparecer para quem não é super admin. Não somem do banco — precisam ser atribuídos à loja certa (item **c** abaixo). A consulta para conferir está no rodapé do arquivo.

---

## Depois das quatro migrations

**a) Publicar a Edge Function** — sem isso o Supabase recusa o papel novo na hora de criar o usuário da ASB:

```bash
supabase functions deploy create-store-user
```

**b) Criar o usuário da ASB** — no sistema, em *Super Admin* → *Usuários* → papel **"Operador (somente saída — ASB)"**. Usuários que já existem podem ser convertidos em *Gestão de Usuários*, no menu de cada linha.

**c) Rodar o diagnóstico de produtos sem loja** — `supabase/diagnostico/orfaos-loja.sql`.

Isso é consulta pura, não altera nada. É a provável causa do "produto está cadastrado, tem quantidade, mas aparece como não encontrado": a migration 008 criou a coluna `loja_id` mas não preencheu os registros que já existiam, e produto sem loja fica invisível para quem não é super admin. A correção está no fim do arquivo, comentada, para você decidir produto a produto — deixei manual de propósito, porque mandar automaticamente um produto da Cunha para a Lorena seria pior que o problema.

**d) Conferir os saldos** — a consulta comentada no fim da `013` mostra produtos cujo saldo não bate com o histórico. Movimentações feitas enquanto o bug existia não são reprocessadas, então o saldo de alguns produtos pode estar acima do real. Um inventário físico resolve.

---

## Se algo der errado

As migrations abortam sozinhas quando falta um pré-requisito, com mensagem explicando o quê. Nesse caso nada foi alterado — aplique o que falta e rode de novo.

Para desfazer a `013`:

```sql
DROP POLICY IF EXISTS "Usuário da loja atualiza estoque" ON produtos;
DROP TRIGGER IF EXISTS trg_proteger_colunas_produto ON produtos;
```

Para desfazer a `014` — só faz sentido se algo tiver sumido de locais/inventários e você precisar de tempo para atribuir a loja certa. Reabre o acesso entre lojas, então é medida temporária:

```sql
CREATE POLICY "Autenticados podem ler locais" ON locais FOR SELECT TO authenticated USING (true);
CREATE POLICY "Autenticados podem ler inventarios" ON inventarios FOR SELECT TO authenticated USING (true);
CREATE POLICY "Autenticados podem ler inventario_itens" ON inventario_itens FOR SELECT TO authenticated USING (true);
```

A `011` e a `012` não têm efeito a desfazer.
