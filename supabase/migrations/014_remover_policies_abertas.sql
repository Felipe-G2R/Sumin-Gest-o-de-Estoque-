-- =============================================
-- 014_remover_policies_abertas.sql
-- Fecha o vazamento de dados entre lojas em locais e inventários.
--
-- PROBLEMA
-- A migration 007_add_locais_inventario.sql criou policies totalmente abertas,
-- do tipo `USING (true)` / `WITH CHECK (true)`, para as tabelas `locais`,
-- `inventarios` e `inventario_itens`. Elas foram escritas antes do multi-tenant.
--
-- A migration 008_multi_tenant.sql tentou removê-las, mas usou os nomes
-- errados: procurou por "Usuários ativos podem criar locais" quando o nome real
-- criado pela 007 era "Autenticados podem criar locais". Os DROP eram
-- `IF EXISTS`, então não deram erro — simplesmente não removeram nada.
--
-- Resultado: as 10 policies abertas continuam ativas. E como no Postgres as
-- policies permissivas são combinadas com OR, uma única regra `true` anula
-- todas as regras corretas ao lado dela. Na prática, hoje qualquer usuário
-- logado enxerga, cria, edita e apaga locais e inventários de TODAS as lojas —
-- Lorena vê os da Cunha e vice-versa.
--
-- O QUE ESTA MIGRATION FAZ
-- Remove as 10 policies abertas. As regras corretas por loja, criadas pela 008
-- (e ajustadas pela 012), assumem sozinhas o controle de acesso.
--
-- SEGURANÇA: DROP POLICY remove apenas regras de permissão — nenhum dado é
-- apagado. Nenhuma tabela, coluna ou registro é tocado.
-- Idempotente: pode ser executada mais de uma vez.
-- =============================================

-- ---------------------------------------------
-- 0. Pré-checagem — só remove o aberto se o correto já existir no lugar
-- ---------------------------------------------
DO $$
DECLARE
  v_faltando TEXT;
BEGIN
  SELECT string_agg(esperada, ', ')
    INTO v_faltando
  FROM (VALUES
    ('locais',           'Leitura locais da loja'),
    ('locais',           'Criar locais da loja'),
    ('locais',           'Atualizar locais da loja'),
    ('inventarios',      'Leitura inventarios da loja'),
    ('inventarios',      'Criar inventarios da loja'),
    ('inventarios',      'Atualizar inventarios da loja'),
    ('inventario_itens', 'Leitura itens da loja'),
    ('inventario_itens', 'Criar itens da loja'),
    ('inventario_itens', 'Atualizar itens da loja'),
    ('inventario_itens', 'Deletar itens da loja')
  ) AS t(tabela, esperada)
  WHERE NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = t.tabela AND policyname = t.esperada
  );

  IF v_faltando IS NOT NULL THEN
    RAISE EXCEPTION
      'Abortado: as policies por loja ainda não existem (%). Aplique 008_multi_tenant.sql antes — sem elas, remover as policies abertas deixaria as tabelas inacessíveis.',
      v_faltando;
  END IF;
END $$;

-- ---------------------------------------------
-- 1. LOCAIS
-- ---------------------------------------------
DROP POLICY IF EXISTS "Autenticados podem ler locais"       ON locais;
DROP POLICY IF EXISTS "Autenticados podem criar locais"     ON locais;
DROP POLICY IF EXISTS "Autenticados podem atualizar locais" ON locais;

-- ---------------------------------------------
-- 2. INVENTÁRIOS
-- ---------------------------------------------
DROP POLICY IF EXISTS "Autenticados podem ler inventarios"       ON inventarios;
DROP POLICY IF EXISTS "Autenticados podem criar inventarios"     ON inventarios;
DROP POLICY IF EXISTS "Autenticados podem atualizar inventarios" ON inventarios;

-- ---------------------------------------------
-- 3. ITENS DE INVENTÁRIO
-- ---------------------------------------------
DROP POLICY IF EXISTS "Autenticados podem ler inventario_itens"       ON inventario_itens;
DROP POLICY IF EXISTS "Autenticados podem criar inventario_itens"     ON inventario_itens;
DROP POLICY IF EXISTS "Autenticados podem atualizar inventario_itens" ON inventario_itens;
DROP POLICY IF EXISTS "Autenticados podem deletar inventario_itens"   ON inventario_itens;

-- ---------------------------------------------
-- 4. Verificação — deve retornar 0 linhas
-- ---------------------------------------------
DO $$
DECLARE
  v_abertas INT;
BEGIN
  SELECT COUNT(*) INTO v_abertas
  FROM pg_policies
  WHERE schemaname = 'public' AND (qual = 'true' OR with_check = 'true');

  IF v_abertas > 0 THEN
    RAISE WARNING 'Ainda existem % policy(ies) totalmente abertas. Rode a consulta abaixo para ver quais.', v_abertas;
  ELSE
    RAISE NOTICE 'OK: nenhuma policy aberta restante.';
  END IF;
END $$;

-- Consulta de conferência:
-- SELECT tablename, policyname, cmd FROM pg_policies
-- WHERE schemaname = 'public' AND (qual = 'true' OR with_check = 'true');

-- ---------------------------------------------
-- ATENÇÃO — registros órfãos ficam invisíveis a partir daqui
-- Locais e inventários criados antes do multi-tenant podem estar com
-- `loja_id` NULL. Enquanto a policy aberta existia, eles apareciam para todo
-- mundo; com as regras por loja, some. Não são perdidos — só precisam ser
-- atribuídos à loja certa. Confira antes/depois com:
--
-- SELECT 'locais' AS tabela, COUNT(*) FROM locais WHERE loja_id IS NULL
-- UNION ALL SELECT 'inventarios', COUNT(*) FROM inventarios WHERE loja_id IS NULL
-- UNION ALL SELECT 'inventario_itens', COUNT(*) FROM inventario_itens WHERE loja_id IS NULL;
--
-- A correção está em supabase/diagnostico/orfaos-loja.sql.
-- ---------------------------------------------
