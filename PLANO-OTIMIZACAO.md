# Plano de Otimização — Sumin Stock

> Baseado no feedback da cliente (Dra. Tamires) em `otimizações.md`.
> Cada item foi mapeado à causa raiz no código (`arquivo:linha`).
>
> Decisões já tomadas:
> - **Código de barras:** código interno sequencial (Code128).
> - **Usuário ASB (só saída):** pode registrar saída **e** consultar estoque da loja; sem acesso a admin, fornecedores, relatórios ou edição.

---

## Visão geral por prioridade

| # | Item da cliente | Tipo | Causa raiz | Esforço |
|---|-----------------|------|------------|---------|
| 1 | Baixa cai na loja errada (Lorena/Cunha) | 🔴 Bug crítico | Tela de movimentação não filtra pela loja ativa | Baixo |
| 2 | Não consigo cadastrar 2º fornecedor sem CNPJ | 🔴 Bug crítico | CNPJ vazio salvo como `""` colide na constraint `UNIQUE` | Muito baixo |
| 3 | Produto "não encontrado" ao dar baixa | 🟠 Bug médio | Produto de outra loja bloqueado pela RLS na hora da baixa | Baixo |
| 4 | Impressão da sugestão não agrupa por fornecedor | 🟠 Bug médio | Exportação ignora o estado `groupByFornecedor` | Baixo |
| 5 | Usuário só de saída (ASBs) | 🟢 Feature | Não existe role com permissão restrita | Médio |
| 6 | Sistema gerar código de barras | 🟢 Feature | Só existe leitor (scanner), falta gerador | Médio |

---

## 🔴 Onda 1 — Bugs críticos de dados (prioridade máxima)

### Item 1 — Baixa cai na loja errada
**Causa raiz:** `src/pages/MovimentacaoFormPage.jsx:34` carrega produtos com
`produtoService.listar({ status: 'ativo', por_pagina: 1000 })` — **sem passar a loja ativa**.
Para usuário que enxerga mais de uma loja (super admin / dona), aparecem produtos da Lorena
**e** da Cunha misturados. Ao selecionar um produto de mesmo nome, em
`src/services/movimentacaoService.js:46` a baixa é gravada em `produto.loja_id` — a loja do
produto escolhido, não a loja em operação.

**Solução:**
- Conectar a tela ao `LojaAtivaContext` e passar `lojaId: lojaAtivaId` em `carregarProdutos()`.
- Exibir o nome da loja ao lado de cada produto na lista de busca (desambiguação visual).
- Mostrar "Saída na loja: **Lorena**" no resumo antes de confirmar.

**Arquivos:** `MovimentacaoFormPage.jsx`, `produtoService.js`, `LojaAtivaContext.jsx`
**Risco:** baixo · **Impacto:** elimina lançamentos na loja errada.

### Item 2 — Não consigo cadastrar fornecedor sem CNPJ
**Causa raiz (não é o que parece):** o CNPJ **não é obrigatório** no código
(`FornecedorFormPage.jsx:62` sem `required`) nem no banco (`001_create_tables.sql:26` =
`cnpj TEXT UNIQUE`, sem `NOT NULL`). O formulário salva o campo vazio como **string vazia `""`**
(`FornecedorFormPage.jsx:16`), e a constraint `UNIQUE` do Postgres **rejeita dois `""` iguais**:
- 1º fornecedor sem CNPJ → salva `""` → OK
- 2º fornecedor sem CNPJ → tenta `""` de novo → erro de duplicidade → interpretado como "CNPJ obrigatório".

**Solução:**
- Em `fornecedorService.criar/atualizar`, converter `cnpj` (e telefone/email/endereço) vazio para `null` antes de gravar (Postgres permite múltiplos `NULL` em coluna `UNIQUE`).
- Migration de limpeza: transformar os `""` já existentes no banco em `NULL`.
- Tratar erro `23505` com mensagem clara ("Já existe um fornecedor com este CNPJ").

**Arquivos:** `fornecedorService.js`, nova migration em `supabase/migrations/`
**Risco:** muito baixo · **Impacto:** desbloqueia cadastro de vários fornecedores sem CNPJ.

### Item 3 — Produto "não encontrado" ao dar baixa
**Causa raiz:** o produto aparece listado (via relação do fornecedor, que não filtra por loja),
mas na baixa o `movimentacaoService.registrar` faz `.eq('id', produto_id).maybeSingle()`
(`movimentacaoService.js:39-44`). Se o produto é de outra loja, a **RLS bloqueia** e retorna
vazio → "Produto não encontrado". Ligado diretamente ao Item 1.

**Solução:**
- Garantir que toda listagem de produtos (inclusive dentro de fornecedores) passe pela loja ativa.
- Mensagem de erro útil: "Este produto pertence a outra loja. Troque a loja ativa para dar baixa."
- Resolver junto com o Item 1.

**Arquivos:** `movimentacaoService.js`, `fornecedorService.js`, `FornecedorDetalhesPage.jsx`
**Risco:** baixo.

---

## 🟠 Onda 2 — Correções de comportamento

### Item 4 — Impressão da sugestão não agrupa por fornecedor
**Causa raiz:** em `SugestoesCompraPage.jsx`, o agrupamento (`groupByFornecedor`) só afeta a
**tela**. `handleExportCSV` e `handleExportPDF` (~linhas 86-92) enviam sempre a lista crua
`sugestoesCompra` para `src/lib/export.js`, ignorando o agrupamento.

**Solução:**
- Quando o agrupamento estiver ativo, estruturar os dados por fornecedor antes de exportar, com cabeçalho de seção e subtotal por fornecedor no PDF.
- Ajustar `export.js` para aceitar dados agrupados (seções) além da lista simples.

**Arquivos:** `SugestoesCompraPage.jsx`, `export.js`
**Risco:** baixo.

---

## 🟢 Onda 3 — Funcionalidades novas

### Item 5 — Usuário só de saída (ASBs) — "saída + ver estoque"
Hoje só existem 3 papéis (`USER`, `ADMIN`, `SUPER_ADMIN` em `constants.js`).
Novo papel **`OPERADOR_SAIDA`**, que pode: registrar **saída** e **consultar** a lista/quantidade
de produtos da sua loja. **Não** acessa: admin, fornecedores, relatórios, dashboard de gestão,
nem edição de produtos; e **não** registra entrada.

**Mudanças:**
- `constants.js` — adicionar `OPERADOR_SAIDA`.
- `008_multi_tenant.sql` (constraint de role) — incluir `OPERADOR_SAIDA` no `CHECK`.
- `create-store-user/index.ts:8` — incluir em `ALLOWED_ROLES`.
- `MainLayout.jsx` — menu reduzido (só Saída + lista de produtos).
- `App.jsx` — rotas protegidas; `MovimentacaoFormPage` força `tipo='SAIDA'`.
- **Nova migration RLS** (segurança real no banco): permitir a esse papel apenas `INSERT` de
  saída e `SELECT` de produtos da sua loja; bloquear o resto mesmo via API.
- `AdminUsuariosPage.jsx` — opção para atribuir o papel ao criar/editar usuário.

**Esforço:** médio · **Atenção:** fazer a segurança no banco (RLS), não só esconder botões.

### Item 6 — Gerar código de barras (código interno sequencial, Code128)
O campo `codigo_barras` já existe (`produtos`) e há scanner de **leitura** (`html5-qrcode`).
Falta o **gerador**.

**Mudanças:**
- Adicionar lib de geração visual (`jsbarcode`).
- Função geradora de código interno sequencial (ex.: prefixo `SUM-` + sequência por loja),
  garantindo unicidade.
- Botão "Gerar código" no `ProdutoFormPage`, ao lado do scanner, com preview visual.
- Opção de imprimir a etiqueta para colar no produto.

**Arquivos:** `ProdutoFormPage.jsx`, novo `src/lib/barcodeGenerator.js`, `package.json`
**Esforço:** médio.

---

## Sequência recomendada de execução
1. **Itens 2 + 1 + 3** juntos (mesma raiz: loja + dados) — maior impacto no dia a dia.
2. **Item 4** (impressão) — rápido e visível.
3. **Item 5** (usuário-saída) — requer RLS e testes.
4. **Item 6** (gerar código) — implementação isolada.

## Notas de validação
- Todas as alterações de banco entram como **novas migrations** (nunca editar migrations já aplicadas).
- Testar cada onda com as duas lojas (Lorena e Cunha) antes de subir para produção.
- Confirmar comportamento da RLS com um usuário não-super-admin de cada loja.
