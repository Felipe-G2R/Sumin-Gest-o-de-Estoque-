-- =============================================
-- 011_normalizar_cnpj_vazio.sql
-- Corrige o cadastro de fornecedores (e lojas) sem CNPJ.
--
-- PROBLEMA
-- As colunas `fornecedores.cnpj` e `lojas.cnpj` são UNIQUE. Quando o
-- formulário gravava o CNPJ vazio como string '' (em vez de NULL), o
-- 2º fornecedor sem CNPJ colidia na constraint UNIQUE e o cadastro era
-- recusado — dando a impressão de que o CNPJ era obrigatório.
-- Em Postgres, vários NULL convivem numa coluna UNIQUE; várias strings '' não.
--
-- O QUE ESTA MIGRATION FAZ
-- 1. Normaliza os dados já existentes ('' -> NULL).
-- 2. Instala um trigger que normaliza automaticamente todo INSERT/UPDATE
--    futuro, garantindo a correção no próprio banco — independente do
--    frontend, de importações manuais ou de acesso direto pela API.
--
-- SEGURANÇA: não remove nenhum registro. Apenas troca '' por NULL em campos
-- opcionais, o que é semanticamente o mesmo valor ("não informado").
-- Idempotente: pode ser executada mais de uma vez sem efeito colateral.
-- =============================================

-- ---------------------------------------------
-- 1. Normalização dos dados existentes
-- ---------------------------------------------
UPDATE fornecedores SET cnpj     = NULL WHERE btrim(cnpj)     = '';
UPDATE fornecedores SET telefone = NULL WHERE btrim(telefone) = '';
UPDATE fornecedores SET email    = NULL WHERE btrim(email)    = '';
UPDATE fornecedores SET endereco = NULL WHERE btrim(endereco) = '';

UPDATE lojas SET cnpj     = NULL WHERE btrim(cnpj)     = '';
UPDATE lojas SET telefone = NULL WHERE btrim(telefone) = '';
UPDATE lojas SET email    = NULL WHERE btrim(email)    = '';
UPDATE lojas SET endereco = NULL WHERE btrim(endereco) = '';

-- ---------------------------------------------
-- 2. Prevenção definitiva — trigger de normalização
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION public.normalizar_campos_opcionais()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- NULLIF(btrim(x), '') => campo em branco (ou só espaços) vira NULL
  NEW.cnpj     := NULLIF(btrim(NEW.cnpj), '');
  NEW.telefone := NULLIF(btrim(NEW.telefone), '');
  NEW.email    := NULLIF(btrim(NEW.email), '');
  NEW.endereco := NULLIF(btrim(NEW.endereco), '');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_normalizar_fornecedor ON fornecedores;
CREATE TRIGGER trg_normalizar_fornecedor
  BEFORE INSERT OR UPDATE ON fornecedores
  FOR EACH ROW EXECUTE FUNCTION public.normalizar_campos_opcionais();

DROP TRIGGER IF EXISTS trg_normalizar_loja ON lojas;
CREATE TRIGGER trg_normalizar_loja
  BEFORE INSERT OR UPDATE ON lojas
  FOR EACH ROW EXECUTE FUNCTION public.normalizar_campos_opcionais();

-- ---------------------------------------------
-- 3. Verificação (opcional) — deve retornar 0 em todas as linhas
-- ---------------------------------------------
-- SELECT 'fornecedores.cnpj vazio' AS check, COUNT(*) FROM fornecedores WHERE cnpj = ''
-- UNION ALL SELECT 'lojas.cnpj vazio', COUNT(*) FROM lojas WHERE cnpj = '';
