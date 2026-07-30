-- =============================================
-- 012_operador_saida.sql
-- Novo papel OPERADOR_SAIDA (ASBs).
--
-- O QUE O OPERADOR PODE FAZER
--   * Registrar SAÍDA de estoque na sua loja.
--   * Consultar produtos, fornecedores e o histórico de movimentações da loja.
--
-- O QUE ELE NÃO PODE
--   * Registrar ENTRADA.
--   * Criar/editar produtos, fornecedores, locais ou inventários.
--   * Ver outras lojas.
--
-- A restrição é aplicada no BANCO (RLS), não só escondendo botões na tela —
-- assim vale também para quem chamar a API diretamente.
--
-- PRÉ-REQUISITO: 008_multi_tenant.sql já aplicada (cria as policies alteradas
-- aqui e as funções is_super_admin / is_user_active / get_user_loja_id).
--
-- SEGURANÇA: não usa DROP de tabela/policy nem apaga dados. As policies
-- existentes são ajustadas com ALTER POLICY, dentro de blocos que verificam a
-- existência antes — se alguma não existir, a migration avisa e segue, em vez
-- de abortar no meio.
-- Idempotente: pode ser executada mais de uma vez.
-- =============================================

-- ---------------------------------------------
-- 0. Pré-checagem — falha cedo e com mensagem clara
-- ---------------------------------------------
DO $$
BEGIN
  IF to_regprocedure('public.get_user_loja_id()') IS NULL THEN
    RAISE EXCEPTION 'Pré-requisito ausente: aplique 008_multi_tenant.sql antes desta migration.';
  END IF;
END $$;

-- ---------------------------------------------
-- 1. Permitir o novo papel na constraint de role
--    (substitui uma regra de validação por outra mais ampla — nada é apagado)
-- ---------------------------------------------
DO $$
BEGIN
  EXECUTE 'ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check';
  EXECUTE 'ALTER TABLE users ADD CONSTRAINT users_role_check '
       || 'CHECK (role IN (''USER'', ''ADMIN'', ''ADM'', ''SUPER_ADMIN'', ''OPERADOR_SAIDA''))';
END $$;

-- ---------------------------------------------
-- 2. Helper: o usuário atual é OPERADOR_SAIDA?
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION public.is_operador_saida()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(
    (SELECT role = 'OPERADOR_SAIDA' FROM users WHERE id = auth.uid()),
    false
  );
$$;

-- ---------------------------------------------
-- 3. Helper interno: aplica ALTER POLICY só se a policy existir
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION public._alterar_policy_se_existir(
  p_tabela TEXT,
  p_policy TEXT,
  p_clausula TEXT,   -- 'USING' ou 'WITH CHECK'
  p_expressao TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = p_tabela AND policyname = p_policy
  ) THEN
    EXECUTE format('ALTER POLICY %I ON %I %s (%s)', p_policy, p_tabela, p_clausula, p_expressao);
  ELSE
    RAISE WARNING 'Policy "%" não encontrada em "%" — ajuste ignorado. Confira se 008_multi_tenant.sql foi aplicada.',
      p_policy, p_tabela;
  END IF;
END;
$$;

-- ---------------------------------------------
-- 4. MOVIMENTAÇÕES — operador só insere SAÍDA (nunca ENTRADA)
-- ---------------------------------------------
SELECT public._alterar_policy_se_existir(
  'movimentacoes', 'Criar movimentações da loja', 'WITH CHECK',
  $expr$
    is_super_admin() OR (
      is_user_active()
      AND auth.uid() = usuario_id
      AND loja_id = get_user_loja_id()
      AND (NOT is_operador_saida() OR tipo = 'SAIDA')
    )
  $expr$
);

-- ---------------------------------------------
-- 5. LOCAIS — operador não cria nem edita
-- ---------------------------------------------
SELECT public._alterar_policy_se_existir(
  'locais', 'Criar locais da loja', 'WITH CHECK',
  $expr$ is_super_admin() OR (is_user_active() AND NOT is_operador_saida() AND loja_id = get_user_loja_id()) $expr$
);
SELECT public._alterar_policy_se_existir(
  'locais', 'Atualizar locais da loja', 'USING',
  $expr$ is_super_admin() OR (is_user_active() AND NOT is_operador_saida() AND loja_id = get_user_loja_id()) $expr$
);

-- ---------------------------------------------
-- 6. INVENTÁRIOS — operador não cria nem edita
-- ---------------------------------------------
SELECT public._alterar_policy_se_existir(
  'inventarios', 'Criar inventarios da loja', 'WITH CHECK',
  $expr$ is_super_admin() OR (is_user_active() AND NOT is_operador_saida() AND loja_id = get_user_loja_id()) $expr$
);
SELECT public._alterar_policy_se_existir(
  'inventarios', 'Atualizar inventarios da loja', 'USING',
  $expr$ is_super_admin() OR (is_user_active() AND NOT is_operador_saida() AND loja_id = get_user_loja_id()) $expr$
);

-- ---------------------------------------------
-- 7. ITENS DE INVENTÁRIO — operador não cria, edita nem apaga
-- ---------------------------------------------
SELECT public._alterar_policy_se_existir(
  'inventario_itens', 'Criar itens da loja', 'WITH CHECK',
  $expr$ is_super_admin() OR (is_user_active() AND NOT is_operador_saida() AND loja_id = get_user_loja_id()) $expr$
);
SELECT public._alterar_policy_se_existir(
  'inventario_itens', 'Atualizar itens da loja', 'USING',
  $expr$ is_super_admin() OR (is_user_active() AND NOT is_operador_saida() AND loja_id = get_user_loja_id()) $expr$
);
SELECT public._alterar_policy_se_existir(
  'inventario_itens', 'Deletar itens da loja', 'USING',
  $expr$ is_super_admin() OR (is_user_active() AND NOT is_operador_saida() AND loja_id = get_user_loja_id()) $expr$
);

-- Helper temporário não é mais necessário depois da execução
DROP FUNCTION IF EXISTS public._alterar_policy_se_existir(TEXT, TEXT, TEXT, TEXT);

-- ---------------------------------------------
-- NOTAS
-- * Leitura (SELECT) de produtos/fornecedores/movimentações/locais da loja
--   segue liberada para o operador — ele PRECISA ver o estoque.
-- * Criar/editar produtos e fornecedores já era restrito a ADMIN/SUPER_ADMIN
--   pela 008, então o operador continua bloqueado ali sem ajuste adicional.
-- * A baixa de estoque em si depende da 013 — sem ela o operador registra a
--   movimentação mas a quantidade do produto não diminui. Aplique as duas.
-- ---------------------------------------------

-- Verificação (opcional): confirma que o papel é aceito pela constraint
-- SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = 'users_role_check';
