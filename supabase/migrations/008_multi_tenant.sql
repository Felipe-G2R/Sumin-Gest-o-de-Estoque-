-- =============================================
-- 008_multi_tenant.sql
-- Arquitetura Multi-Tenant com isolamento por loja_id
-- =============================================

-- 1. Tabela de lojas
CREATE TABLE IF NOT EXISTS lojas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cnpj TEXT UNIQUE,
  endereco TEXT,
  telefone TEXT,
  email TEXT,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE lojas ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE TRIGGER trigger_lojas_atualizado
    BEFORE UPDATE ON lojas
    FOR EACH ROW EXECUTE FUNCTION update_atualizado_em();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Atualizar constraint de role para incluir SUPER_ADMIN
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('USER', 'ADMIN', 'ADM', 'SUPER_ADMIN'));

-- 3. Adicionar loja_id em todas as tabelas
ALTER TABLE users ADD COLUMN IF NOT EXISTS loja_id UUID REFERENCES lojas(id);
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS loja_id UUID REFERENCES lojas(id);
ALTER TABLE fornecedores ADD COLUMN IF NOT EXISTS loja_id UUID REFERENCES lojas(id);
ALTER TABLE movimentacoes ADD COLUMN IF NOT EXISTS loja_id UUID REFERENCES lojas(id);
ALTER TABLE notificacoes ADD COLUMN IF NOT EXISTS loja_id UUID REFERENCES lojas(id);
ALTER TABLE logs ADD COLUMN IF NOT EXISTS loja_id UUID REFERENCES lojas(id);
ALTER TABLE locais ADD COLUMN IF NOT EXISTS loja_id UUID REFERENCES lojas(id);
ALTER TABLE inventarios ADD COLUMN IF NOT EXISTS loja_id UUID REFERENCES lojas(id);
ALTER TABLE inventario_itens ADD COLUMN IF NOT EXISTS loja_id UUID REFERENCES lojas(id);

-- 4. Helper: pegar loja_id do user atual (SECURITY DEFINER bypassa RLS)
CREATE OR REPLACE FUNCTION get_user_loja_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT loja_id FROM users WHERE id = auth.uid();
$$;

-- 5. Helper: verificar se user é SUPER_ADMIN
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(
    (SELECT role = 'SUPER_ADMIN' FROM users WHERE id = auth.uid()),
    false
  );
$$;

-- 6. Atualizar get_user_role para reconhecer SUPER_ADMIN
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.users WHERE id = auth.uid() AND ativo = true),
    'USER'
  );
$$;

-- 7. Setar DEFAULT get_user_loja_id() em todas as tabelas (exceto users)
ALTER TABLE produtos ALTER COLUMN loja_id SET DEFAULT get_user_loja_id();
ALTER TABLE fornecedores ALTER COLUMN loja_id SET DEFAULT get_user_loja_id();
ALTER TABLE movimentacoes ALTER COLUMN loja_id SET DEFAULT get_user_loja_id();
ALTER TABLE notificacoes ALTER COLUMN loja_id SET DEFAULT get_user_loja_id();
ALTER TABLE logs ALTER COLUMN loja_id SET DEFAULT get_user_loja_id();
ALTER TABLE locais ALTER COLUMN loja_id SET DEFAULT get_user_loja_id();
ALTER TABLE inventarios ALTER COLUMN loja_id SET DEFAULT get_user_loja_id();
ALTER TABLE inventario_itens ALTER COLUMN loja_id SET DEFAULT get_user_loja_id();

-- 8. Indexes para performance
CREATE INDEX IF NOT EXISTS idx_users_loja ON users(loja_id);
CREATE INDEX IF NOT EXISTS idx_produtos_loja ON produtos(loja_id);
CREATE INDEX IF NOT EXISTS idx_fornecedores_loja ON fornecedores(loja_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_loja ON movimentacoes(loja_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_loja ON notificacoes(loja_id);
CREATE INDEX IF NOT EXISTS idx_logs_loja ON logs(loja_id);
CREATE INDEX IF NOT EXISTS idx_locais_loja ON locais(loja_id);
CREATE INDEX IF NOT EXISTS idx_inventarios_loja ON inventarios(loja_id);
CREATE INDEX IF NOT EXISTS idx_inventario_itens_loja ON inventario_itens(loja_id);

-- =============================================
-- 9. RLS POLICIES — Todas com filtro de loja_id
-- Padrão: is_super_admin() OR (condição AND loja_id = get_user_loja_id())
-- =============================================

-- LOJAS
CREATE POLICY "Leitura de lojas" ON lojas FOR SELECT TO authenticated
  USING (is_super_admin() OR id = get_user_loja_id());
CREATE POLICY "SUPER_ADMIN gerencia lojas" ON lojas FOR ALL TO authenticated
  USING (is_super_admin()) WITH CHECK (is_super_admin());

-- USERS (drop old + create new)
DROP POLICY IF EXISTS "Usuário vê seu próprio perfil" ON users;
DROP POLICY IF EXISTS "Leitura de perfis restrita" ON users;
DROP POLICY IF EXISTS "Admin vê todos os perfis" ON users;
DROP POLICY IF EXISTS "Usuário atualiza apenas dados básicos próprios" ON users;
DROP POLICY IF EXISTS "Apenas ADMINs podem gerenciar usuários livremente" ON users;
DROP POLICY IF EXISTS "Criação de perfil no registro" ON users;

CREATE POLICY "User vê próprio perfil" ON users FOR SELECT TO authenticated
  USING (auth.uid() = id);
CREATE POLICY "Users da mesma loja" ON users FOR SELECT TO authenticated
  USING (is_user_active() AND loja_id = get_user_loja_id());
CREATE POLICY "SUPER_ADMIN vê todos" ON users FOR SELECT TO authenticated
  USING (is_super_admin());
CREATE POLICY "User atualiza próprio perfil" ON users FOR UPDATE TO authenticated
  USING (auth.uid() = id AND is_user_active())
  WITH CHECK (auth.uid() = id AND is_user_active());
CREATE POLICY "ADMIN gerencia users da loja" ON users FOR UPDATE TO authenticated
  USING (get_user_role() IN ('ADMIN', 'SUPER_ADMIN') AND (is_super_admin() OR loja_id = get_user_loja_id()));
CREATE POLICY "Registro de perfil" ON users FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- PRODUTOS
DROP POLICY IF EXISTS "Usuários ativos podem ler produtos" ON produtos;
DROP POLICY IF EXISTS "Apenas ADMINs gerenciam produtos" ON produtos;

CREATE POLICY "Leitura produtos da loja" ON produtos FOR SELECT TO authenticated
  USING (is_super_admin() OR (is_user_active() AND loja_id = get_user_loja_id()));
CREATE POLICY "ADMIN gerencia produtos da loja" ON produtos FOR ALL TO authenticated
  USING (is_super_admin() OR (get_user_role() IN ('ADMIN', 'SUPER_ADMIN') AND loja_id = get_user_loja_id()))
  WITH CHECK (is_super_admin() OR (get_user_role() IN ('ADMIN', 'SUPER_ADMIN') AND loja_id = get_user_loja_id()));

-- FORNECEDORES
DROP POLICY IF EXISTS "Usuários ativos podem ler fornecedores" ON fornecedores;
DROP POLICY IF EXISTS "Apenas ADMINs gerenciam fornecedores" ON fornecedores;

CREATE POLICY "Leitura fornecedores da loja" ON fornecedores FOR SELECT TO authenticated
  USING (is_super_admin() OR (is_user_active() AND loja_id = get_user_loja_id()));
CREATE POLICY "ADMIN gerencia fornecedores da loja" ON fornecedores FOR ALL TO authenticated
  USING (is_super_admin() OR (get_user_role() IN ('ADMIN', 'SUPER_ADMIN') AND loja_id = get_user_loja_id()))
  WITH CHECK (is_super_admin() OR (get_user_role() IN ('ADMIN', 'SUPER_ADMIN') AND loja_id = get_user_loja_id()));

-- MOVIMENTACOES
DROP POLICY IF EXISTS "Usuários ativos podem ler movimentações" ON movimentacoes;
DROP POLICY IF EXISTS "Usuários ativos podem criar movimentações" ON movimentacoes;

CREATE POLICY "Leitura movimentações da loja" ON movimentacoes FOR SELECT TO authenticated
  USING (is_super_admin() OR (is_user_active() AND loja_id = get_user_loja_id()));
CREATE POLICY "Criar movimentações da loja" ON movimentacoes FOR INSERT TO authenticated
  WITH CHECK (is_super_admin() OR (is_user_active() AND auth.uid() = usuario_id AND loja_id = get_user_loja_id()));

-- NOTIFICACOES
DROP POLICY IF EXISTS "Usuários ativos podem ler notificações" ON notificacoes;
DROP POLICY IF EXISTS "Usuários ativos podem atualizar notificações (marcar lida)" ON notificacoes;

CREATE POLICY "Leitura notificações da loja" ON notificacoes FOR SELECT TO authenticated
  USING (is_super_admin() OR (is_user_active() AND loja_id = get_user_loja_id()));
CREATE POLICY "Atualizar notificações da loja" ON notificacoes FOR UPDATE TO authenticated
  USING (is_super_admin() OR (is_user_active() AND loja_id = get_user_loja_id()));

-- LOGS
DROP POLICY IF EXISTS "Apenas ADMINs podem ler logs" ON logs;

CREATE POLICY "ADMIN lê logs da loja" ON logs FOR SELECT TO authenticated
  USING (is_super_admin() OR (get_user_role() IN ('ADMIN', 'SUPER_ADMIN') AND loja_id = get_user_loja_id()));

-- LOCAIS
DROP POLICY IF EXISTS "Usuários ativos podem ler locais" ON locais;
DROP POLICY IF EXISTS "Usuários ativos podem criar locais" ON locais;
DROP POLICY IF EXISTS "Usuários ativos podem atualizar locais" ON locais;

CREATE POLICY "Leitura locais da loja" ON locais FOR SELECT TO authenticated
  USING (is_super_admin() OR (is_user_active() AND loja_id = get_user_loja_id()));
CREATE POLICY "Criar locais da loja" ON locais FOR INSERT TO authenticated
  WITH CHECK (is_super_admin() OR (is_user_active() AND loja_id = get_user_loja_id()));
CREATE POLICY "Atualizar locais da loja" ON locais FOR UPDATE TO authenticated
  USING (is_super_admin() OR (is_user_active() AND loja_id = get_user_loja_id()));

-- INVENTARIOS
DROP POLICY IF EXISTS "Usuários ativos podem ler inventarios" ON inventarios;
DROP POLICY IF EXISTS "Usuários ativos podem criar inventarios" ON inventarios;
DROP POLICY IF EXISTS "Usuários ativos podem atualizar inventarios" ON inventarios;

CREATE POLICY "Leitura inventarios da loja" ON inventarios FOR SELECT TO authenticated
  USING (is_super_admin() OR (is_user_active() AND loja_id = get_user_loja_id()));
CREATE POLICY "Criar inventarios da loja" ON inventarios FOR INSERT TO authenticated
  WITH CHECK (is_super_admin() OR (is_user_active() AND loja_id = get_user_loja_id()));
CREATE POLICY "Atualizar inventarios da loja" ON inventarios FOR UPDATE TO authenticated
  USING (is_super_admin() OR (is_user_active() AND loja_id = get_user_loja_id()));

-- INVENTARIO_ITENS
DROP POLICY IF EXISTS "Usuários ativos podem ler itens" ON inventario_itens;
DROP POLICY IF EXISTS "Usuários ativos podem criar itens" ON inventario_itens;
DROP POLICY IF EXISTS "Usuários ativos podem atualizar itens" ON inventario_itens;
DROP POLICY IF EXISTS "Usuários ativos podem deletar itens" ON inventario_itens;

CREATE POLICY "Leitura itens da loja" ON inventario_itens FOR SELECT TO authenticated
  USING (is_super_admin() OR (is_user_active() AND loja_id = get_user_loja_id()));
CREATE POLICY "Criar itens da loja" ON inventario_itens FOR INSERT TO authenticated
  WITH CHECK (is_super_admin() OR (is_user_active() AND loja_id = get_user_loja_id()));
CREATE POLICY "Atualizar itens da loja" ON inventario_itens FOR UPDATE TO authenticated
  USING (is_super_admin() OR (is_user_active() AND loja_id = get_user_loja_id()));
CREATE POLICY "Deletar itens da loja" ON inventario_itens FOR DELETE TO authenticated
  USING (is_super_admin() OR (is_user_active() AND loja_id = get_user_loja_id()));

-- =============================================
-- 10. Atualizar trigger e RPCs
-- =============================================

-- Audit trigger com loja_id
CREATE OR REPLACE FUNCTION public.audit_log_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  v_user_id UUID;
  v_acao TEXT;
  v_entidade TEXT;
  v_loja_id UUID;
BEGIN
  v_user_id := auth.uid();
  v_entidade := UPPER(TG_TABLE_NAME);
  v_loja_id := get_user_loja_id();

  IF v_user_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF TG_OP = 'INSERT' THEN
    v_acao := 'CREATE';
    INSERT INTO public.logs (usuario_id, acao, entidade, entidade_id, dados_novos, loja_id)
    VALUES (v_user_id, v_acao, v_entidade, NEW.id, to_jsonb(NEW), v_loja_id);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    v_acao := 'UPDATE';
    IF to_jsonb(OLD) IS DISTINCT FROM to_jsonb(NEW) THEN
      INSERT INTO public.logs (usuario_id, acao, entidade, entidade_id, dados_anteriores, dados_novos, loja_id)
      VALUES (v_user_id, v_acao, v_entidade, NEW.id, to_jsonb(OLD), to_jsonb(NEW), v_loja_id);
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    v_acao := 'DELETE';
    INSERT INTO public.logs (usuario_id, acao, entidade, entidade_id, dados_anteriores, loja_id)
    VALUES (v_user_id, v_acao, v_entidade, OLD.id, to_jsonb(OLD), v_loja_id);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$func$;

-- Log auth event com loja_id
CREATE OR REPLACE FUNCTION log_auth_event(p_acao TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
BEGIN
  IF p_acao IN ('LOGIN', 'LOGOUT') AND auth.uid() IS NOT NULL THEN
    INSERT INTO logs (usuario_id, acao, entidade, entidade_id, loja_id)
    VALUES (auth.uid(), p_acao, 'AUTH', auth.uid(), get_user_loja_id());
  END IF;
END;
$func$;

-- Verificar vencimentos com loja_id
CREATE OR REPLACE FUNCTION verificar_vencimentos()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
BEGIN
  INSERT INTO notificacoes (produto_id, tipo, mensagem, loja_id)
  SELECT p.id, 'VENCIMENTO',
    CASE
      WHEN p.data_validade < CURRENT_DATE THEN 'VENCIDO: ' || p.nome || ' venceu em ' || p.data_validade
      WHEN p.data_validade <= CURRENT_DATE + 1 THEN 'URGENTE: ' || p.nome || ' vence amanhã'
      WHEN p.data_validade <= CURRENT_DATE + 3 THEN 'ALERTA: ' || p.nome || ' vence em 3 dias'
      WHEN p.data_validade <= CURRENT_DATE + 7 THEN 'ATENÇÃO: ' || p.nome || ' vence em 7 dias'
      WHEN p.data_validade <= CURRENT_DATE + 15 THEN 'AVISO: ' || p.nome || ' vence em 15 dias'
      ELSE 'INFO: ' || p.nome || ' vence em 30 dias'
    END,
    p.loja_id
  FROM produtos p
  WHERE p.ativo = true
    AND p.data_validade IS NOT NULL
    AND p.data_validade <= CURRENT_DATE + 30
    AND NOT EXISTS (
      SELECT 1 FROM notificacoes n
      WHERE n.produto_id = p.id
        AND n.tipo = 'VENCIMENTO'
        AND n.criado_em::date = CURRENT_DATE
    );
END;
$func$;
