-- =============================================
-- 013_baixa_estoque_nao_admin.sql
-- Permite que usuários NÃO administradores (incluindo o OPERADOR_SAIDA das
-- ASBs) alterem a quantidade em estoque ao registrar uma movimentação.
--
-- PROBLEMA (bug silencioso, existe desde a 008)
-- O app dá baixa em dois passos, a partir do navegador:
--   1) UPDATE produtos SET quantidade_atual = ...
--   2) INSERT INTO movimentacoes ...
-- Só que a única policy de escrita em `produtos` é "ADMIN gerencia produtos da
-- loja", restrita a ADMIN/SUPER_ADMIN. Para um usuário comum o passo 1 não
-- atualiza nenhuma linha — e a RLS NÃO devolve erro nesse caso, apenas afeta
-- 0 linhas. Resultado: a movimentação é registrada, o histórico mostra a
-- saída, mas o estoque do produto continua igual.
--
-- Sem esta migration o usuário de saída criado na 012 não funciona: ele
-- consegue registrar a saída, e o estoque não diminui.
--
-- SOLUÇÃO
-- 1. Uma policy de UPDATE para usuários ativos da própria loja.
-- 2. Um trigger que garante que esse usuário só consegue mexer em
--    `quantidade_atual` — nome, preço, validade, `ativo` e todo o resto
--    continuam exclusivos do administrador.
-- 3. Regras extras: operador de saída nunca aumenta estoque; ninguém deixa o
--    estoque negativo.
--
-- PRÉ-REQUISITO: 012_operador_saida.sql (usa is_operador_saida()).
-- SEGURANÇA: não apaga dados. Adiciona uma policy e um trigger de validação.
-- Idempotente: pode ser executada mais de uma vez.
-- =============================================

-- ---------------------------------------------
-- 0. Pré-checagem
-- ---------------------------------------------
DO $$
BEGIN
  IF to_regprocedure('public.is_operador_saida()') IS NULL THEN
    RAISE EXCEPTION 'Pré-requisito ausente: aplique 012_operador_saida.sql antes desta migration.';
  END IF;
END $$;

-- ---------------------------------------------
-- 1. Trigger de proteção de colunas
--    (criado ANTES da policy, para que a permissão nunca exista sem o limite)
-- ---------------------------------------------
-- SECURITY DEFINER: a função precisa consultar auth.uid() e a tabela users.
-- Sem isso ela roda com os privilégios de quem disparou o UPDATE, e um usuário
-- comum não tem acesso ao schema `auth` — o que faria toda baixa de estoque
-- falhar com "permission denied for schema auth".
-- É seguro: a função só valida e devolve NEW, não escreve em lugar nenhum.
CREATE OR REPLACE FUNCTION public.proteger_colunas_produto()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Sem usuário logado no contexto = acesso administrativo ao banco:
  -- SQL Editor do painel, service_role, Edge Functions, scripts de migração.
  -- Esses caminhos não passam por RLS por definição e não podem ser travados
  -- aqui, senão editar um produto pelo painel do Supabase deixaria de funcionar.
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  -- Administrador continua com liberdade total sobre o produto.
  IF get_user_role() IN ('ADMIN', 'SUPER_ADMIN') THEN
    RETURN NEW;
  END IF;

  -- Não-admin: nenhuma coluna além da quantidade pode mudar.
  -- `atualizado_em` é ignorado porque é preenchido por outro trigger.
  IF (to_jsonb(OLD) - 'quantidade_atual' - 'atualizado_em')
     IS DISTINCT FROM
     (to_jsonb(NEW) - 'quantidade_atual' - 'atualizado_em') THEN
    RAISE EXCEPTION 'Sem permissão para editar os dados do produto. Usuários não administradores só podem alterar a quantidade em estoque, e apenas ao registrar uma movimentação.'
      USING ERRCODE = '42501';
  END IF;

  -- Operador de saída (ASB) só reduz estoque — nunca repõe.
  IF is_operador_saida() AND NEW.quantidade_atual > OLD.quantidade_atual THEN
    RAISE EXCEPTION 'Operador de saída não pode aumentar o estoque. Peça a entrada a um administrador.'
      USING ERRCODE = '42501';
  END IF;

  -- Nenhum caminho pode deixar o estoque negativo.
  IF NEW.quantidade_atual < 0 THEN
    RAISE EXCEPTION 'Estoque insuficiente: a quantidade não pode ficar negativa.'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_proteger_colunas_produto ON produtos;
CREATE TRIGGER trg_proteger_colunas_produto
  BEFORE UPDATE ON produtos
  FOR EACH ROW EXECUTE FUNCTION public.proteger_colunas_produto();

-- ---------------------------------------------
-- 2. Policy de UPDATE para usuário da loja
--    O que ela abre é limitado pelo trigger acima.
-- ---------------------------------------------
DROP POLICY IF EXISTS "Usuário da loja atualiza estoque" ON produtos;
CREATE POLICY "Usuário da loja atualiza estoque" ON produtos
  FOR UPDATE TO authenticated
  USING (is_user_active() AND loja_id = get_user_loja_id())
  WITH CHECK (is_user_active() AND loja_id = get_user_loja_id());

-- ---------------------------------------------
-- NOTAS
-- * Um usuário comum já podia registrar ENTRADA e SAÍDA; esta migration só faz
--   o saldo do produto realmente acompanhar o que ele registra. Não amplia o
--   que ele pode fazer no sistema — corrige o que já deveria funcionar.
-- * O trigger vale para QUALQUER caminho de escrita (app, API direta, script),
--   porque roda no banco.
-- * Movimentações antigas registradas enquanto o bug existia NÃO são
--   reprocessadas: o saldo atual do produto pode estar acima do real. Confira
--   pelo inventário físico depois de aplicar. A consulta abaixo mostra os
--   produtos cujo saldo não bate com o histórico de movimentações.
-- ---------------------------------------------

-- Conferência (opcional) — saldo do produto x soma das movimentações.
-- ATENÇÃO ao ler o resultado: a quantidade informada no cadastro do produto
-- NÃO gera movimentação, então uma diferença igual ao estoque inicial é
-- esperada e normal. O que merece atenção é diferença MAIOR que essa —
-- indício de saída registrada que não baixou o saldo.
-- SELECT p.nome,
--        p.quantidade_atual AS saldo_no_sistema,
--        COALESCE(SUM(CASE WHEN m.tipo = 'ENTRADA' THEN m.quantidade
--                          WHEN m.tipo = 'SAIDA'   THEN -m.quantidade END), 0) AS saldo_pelas_movimentacoes,
--        l.nome AS loja
-- FROM produtos p
-- LEFT JOIN movimentacoes m ON m.produto_id = p.id
-- LEFT JOIN lojas l ON l.id = p.loja_id
-- WHERE p.ativo = true
-- GROUP BY p.id, p.nome, p.quantidade_atual, l.nome
-- HAVING p.quantidade_atual <> COALESCE(SUM(CASE WHEN m.tipo = 'ENTRADA' THEN m.quantidade
--                                                WHEN m.tipo = 'SAIDA'   THEN -m.quantidade END), 0)
-- ORDER BY l.nome, p.nome;
