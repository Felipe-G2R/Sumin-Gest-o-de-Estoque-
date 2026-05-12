-- =============================================
-- 009_super_admin_user_creation.sql
-- Habilita SUPER_ADMIN a criar usuários para outras lojas
-- e normaliza códigos de barras vazios herdados de versões anteriores.
-- =============================================

-- ---------------------------------------------
-- 1. Policy de INSERT em users para SUPER_ADMIN
--    (defesa em profundidade — a Edge Function usa
--    service_role e bypassa RLS, mas mantém-se a regra
--    caso alguém migre a chamada para client-side)
-- ---------------------------------------------
DROP POLICY IF EXISTS "SUPER_ADMIN cria perfis" ON users;
CREATE POLICY "SUPER_ADMIN cria perfis" ON users
  FOR INSERT TO authenticated
  WITH CHECK (is_super_admin());

-- ---------------------------------------------
-- 2. Trigger: garantir loja_id em users que não sejam SUPER_ADMIN
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION enforce_loja_id_on_user()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $func$
BEGIN
  IF NEW.role <> 'SUPER_ADMIN' AND NEW.loja_id IS NULL THEN
    RAISE EXCEPTION 'loja_id é obrigatório para usuários que não sejam SUPER_ADMIN';
  END IF;
  RETURN NEW;
END;
$func$;

DROP TRIGGER IF EXISTS trg_enforce_loja_id_on_user ON users;
CREATE TRIGGER trg_enforce_loja_id_on_user
  BEFORE INSERT OR UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION enforce_loja_id_on_user();

-- ---------------------------------------------
-- 3. Normalizar códigos de barras vazios pré-existentes
--    (segurança: UNIQUE com '' bloqueia múltiplos produtos sem código)
-- ---------------------------------------------
UPDATE produtos
  SET codigo_barras = NULL
  WHERE codigo_barras IS NOT NULL
    AND length(trim(codigo_barras)) = 0;

UPDATE produtos
  SET lote = NULL
  WHERE lote IS NOT NULL
    AND length(trim(lote)) = 0;

-- ---------------------------------------------
-- 4. Helper: log de criação de usuário (chamado pela Edge Function)
--    Recebe o id do novo user, a loja de destino e o role aplicado.
--    SECURITY DEFINER permite que a Edge Function (autenticada como
--    o SUPER_ADMIN chamador) registre o log com loja_id da loja-alvo.
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION log_user_created(
  p_new_user_id UUID,
  p_loja_id UUID,
  p_role TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO logs (usuario_id, acao, entidade, entidade_id, dados_novos, loja_id)
  VALUES (
    auth.uid(),
    'CREATE_USER',
    'AUTH',
    p_new_user_id,
    jsonb_build_object('loja_id', p_loja_id, 'role', p_role),
    p_loja_id
  );
END;
$func$;

GRANT EXECUTE ON FUNCTION log_user_created(UUID, UUID, TEXT) TO authenticated;

-- =============================================
-- FIM 009
-- =============================================
