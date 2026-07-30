-- =============================================
-- DIAGNÓSTICO — registros sem loja (loja_id NULL)
--
-- Rode no SQL Editor do Supabase. Este arquivo é APENAS DE CONSULTA:
-- nada é alterado. A correção está no final, comentada, para ser executada
-- conscientemente loja por loja.
--
-- Por que isso importa:
-- A migration 008_multi_tenant.sql adicionou a coluna `loja_id` mas NÃO
-- preencheu as linhas que já existiam. Todo registro criado antes dela ficou
-- com loja_id = NULL. Como a RLS exige `loja_id = get_user_loja_id()`, e em
-- SQL `NULL = qualquer coisa` nunca é verdadeiro, esses registros ficam
-- INVISÍVEIS para usuários comuns e admins de loja — só o SUPER_ADMIN os vê.
--
-- É a explicação mais provável para "o produto está cadastrado e com
-- quantidade, mas na hora de dar baixa aparece como não encontrado".
-- =============================================

-- 1. Quantos registros órfãos existem em cada tabela
SELECT 'produtos'         AS tabela, COUNT(*) AS orfaos FROM produtos         WHERE loja_id IS NULL
UNION ALL SELECT 'fornecedores',     COUNT(*) FROM fornecedores     WHERE loja_id IS NULL
UNION ALL SELECT 'movimentacoes',    COUNT(*) FROM movimentacoes    WHERE loja_id IS NULL
UNION ALL SELECT 'locais',           COUNT(*) FROM locais           WHERE loja_id IS NULL
UNION ALL SELECT 'inventarios',      COUNT(*) FROM inventarios      WHERE loja_id IS NULL
UNION ALL SELECT 'inventario_itens', COUNT(*) FROM inventario_itens WHERE loja_id IS NULL
UNION ALL SELECT 'users',            COUNT(*) FROM users            WHERE loja_id IS NULL
ORDER BY orfaos DESC;

-- 2. Quais produtos estão órfãos (para conferir a qual loja pertencem de fato)
SELECT id, nome, lote, quantidade_atual, codigo_barras, criado_em
FROM produtos
WHERE loja_id IS NULL AND ativo = true
ORDER BY nome;

-- 3. Lojas cadastradas (pegue aqui o UUID da loja de destino)
SELECT id, nome, cnpj, ativo FROM lojas ORDER BY nome;

-- 4. Produtos duplicados por nome entre lojas — a origem do "misturados
--    Lorena e Cunha". O mesmo nome existindo nas duas lojas é normal; o que
--    não pode é a baixa cair na loja errada (isso o app já corrige filtrando
--    pela loja ativa).
SELECT p.nome, COUNT(*) AS qtd_lojas, STRING_AGG(COALESCE(l.nome, '(sem loja)'), ', ') AS lojas
FROM produtos p
LEFT JOIN lojas l ON l.id = p.loja_id
WHERE p.ativo = true
GROUP BY p.nome
HAVING COUNT(*) > 1
ORDER BY qtd_lojas DESC, p.nome;

-- =============================================
-- CORREÇÃO (descomente e execute com atenção)
--
-- Só execute depois de conferir na consulta 2 a qual loja cada produto
-- pertence. Troque 'COLE-AQUI-O-UUID-DA-LOJA' pelo id vindo da consulta 3.
--
-- Opção A — adotar TODOS os órfãos de uma vez para uma loja:
--
-- UPDATE produtos      SET loja_id = 'COLE-AQUI-O-UUID-DA-LOJA' WHERE loja_id IS NULL;
-- UPDATE fornecedores  SET loja_id = 'COLE-AQUI-O-UUID-DA-LOJA' WHERE loja_id IS NULL;
-- UPDATE movimentacoes SET loja_id = 'COLE-AQUI-O-UUID-DA-LOJA' WHERE loja_id IS NULL;
-- UPDATE locais        SET loja_id = 'COLE-AQUI-O-UUID-DA-LOJA' WHERE loja_id IS NULL;
--
-- Opção B — produto a produto (mais seguro quando há duas lojas envolvidas):
--
-- UPDATE produtos SET loja_id = 'COLE-AQUI-O-UUID-DA-LOJA'
-- WHERE id IN ('uuid-do-produto-1', 'uuid-do-produto-2');
--
-- Depois de corrigir os produtos, alinhe as movimentações à loja do produto:
--
-- UPDATE movimentacoes m SET loja_id = p.loja_id
-- FROM produtos p WHERE p.id = m.produto_id AND m.loja_id IS DISTINCT FROM p.loja_id;
-- =============================================
