-- ============================================
-- 002_security_hardening.sql
-- Aplicação de Segurança Estrita (RLS e Triggers)
-- ============================================

-- 1. FUNÇÕES DE SEGURANÇA (SECURITY DEFINER)
-- Estas funções executam com privilégios elevados para checar a role/status do usuário
-- sem causar loops infinitos nas políticas de RLS da própria tabela 'users'.
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM users WHERE id = auth.uid() AND ativo = true;
$$;

CREATE OR REPLACE FUNCTION public.is_user_active()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT ativo FROM users WHERE id = auth.uid();
$$;

-- 2. REMOVER POLÍTICAS ANTIGAS E VULNERÁVEIS
DROP POLICY IF EXISTS "Users podem ver todos os perfis" ON users;
DROP POLICY IF EXISTS "Users podem atualizar seu próprio perfil" ON users;
DROP POLICY IF EXISTS "Users podem inserir seu perfil" ON users;
DROP POLICY IF EXISTS "Admin pode atualizar qualquer user" ON users;

DROP POLICY IF EXISTS "Autenticados podem ler fornecedores" ON fornecedores;
DROP POLICY IF EXISTS "Autenticados podem criar fornecedores" ON fornecedores;
DROP POLICY IF EXISTS "Autenticados podem atualizar fornecedores" ON fornecedores;

DROP POLICY IF EXISTS "Autenticados podem ler produtos" ON produtos;
DROP POLICY IF EXISTS "Autenticados podem criar produtos" ON produtos;
DROP POLICY IF EXISTS "Autenticados podem atualizar produtos" ON produtos;

DROP POLICY IF EXISTS "Autenticados podem ler movimentacoes" ON movimentacoes;
DROP POLICY IF EXISTS "Autenticados podem criar movimentacoes" ON movimentacoes;

DROP POLICY IF EXISTS "Autenticados podem ler notificacoes" ON notificacoes;
DROP POLICY IF EXISTS "Autenticados podem criar notificacoes" ON notificacoes;
DROP POLICY IF EXISTS "Autenticados podem atualizar notificacoes" ON notificacoes;

DROP POLICY IF EXISTS "Autenticados podem criar logs" ON logs;
DROP POLICY IF EXISTS "Admin pode ler logs" ON logs;

-- 3. NOVAS POLÍTICAS DE RLS ESTILIZADAS (HARDENED)

-- USERS
CREATE POLICY "Leitura de perfis restrita" ON users
  FOR SELECT TO authenticated
  USING (is_user_active() = true);

CREATE POLICY "Usuário atualiza apenas dados básicos próprios" ON users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id AND is_user_active() = true)
  WITH CHECK (auth.uid() = id AND is_user_active() = true);

CREATE POLICY "Apenas ADMINs podem gerenciar usuários livremente" ON users
  FOR UPDATE TO authenticated
  USING (get_user_role() = 'ADMIN');

CREATE POLICY "Criação de perfil no registro" ON users
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- FORNECEDORES
CREATE POLICY "Usuários ativos podem ler fornecedores" ON fornecedores
  FOR SELECT TO authenticated USING (is_user_active() = true);

CREATE POLICY "Apenas ADMINs gerenciam fornecedores" ON fornecedores
  FOR ALL TO authenticated
  USING (get_user_role() = 'ADMIN')
  WITH CHECK (get_user_role() = 'ADMIN');

-- PRODUTOS
CREATE POLICY "Usuários ativos podem ler produtos" ON produtos
  FOR SELECT TO authenticated USING (is_user_active() = true);

CREATE POLICY "Apenas ADMINs gerenciam produtos" ON produtos
  FOR ALL TO authenticated
  USING (get_user_role() = 'ADMIN')
  WITH CHECK (get_user_role() = 'ADMIN');

-- MOVIMENTACOES
CREATE POLICY "Usuários ativos podem ler movimentações" ON movimentacoes
  FOR SELECT TO authenticated USING (is_user_active() = true);

CREATE POLICY "Usuários ativos podem criar movimentações" ON movimentacoes
  FOR INSERT TO authenticated WITH CHECK (is_user_active() = true AND auth.uid() = usuario_id);

-- Movimentações são imutáveis (sem UPDATE/DELETE)

-- NOTIFICACOES
CREATE POLICY "Usuários ativos podem ler notificações" ON notificacoes
  FOR SELECT TO authenticated USING (is_user_active() = true);

CREATE POLICY "Usuários ativos podem atualizar notificações (marcar lida)" ON notificacoes
  FOR UPDATE TO authenticated USING (is_user_active() = true);

-- LOGS
CREATE POLICY "Apenas ADMINs podem ler logs" ON logs
  FOR SELECT TO authenticated USING (get_user_role() = 'ADMIN');
-- Ninguém pode inserir logs diretamente via API/Cliente! Apenas triggers e funções seguras.

-- 4. TRIGGERS DE AUDITORIA AUTOMÁTICA
CREATE OR REPLACE FUNCTION public.audit_log_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_acao TEXT;
  v_entidade TEXT;
BEGIN
  v_user_id := auth.uid();
  v_entidade := UPPER(TG_TABLE_NAME);

  -- Se não houver usuário no contexto (ex: trigger disparada por serviço interno), usa NULL
  IF v_user_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF TG_OP = 'INSERT' THEN
    v_acao := 'CREATE';
    INSERT INTO public.logs (usuario_id, acao, entidade, entidade_id, dados_novos)
    VALUES (v_user_id, v_acao, v_entidade, NEW.id, to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    v_acao := 'UPDATE';
    -- Grava apenas se houver mudança real para evitar logs de 'touch'
    IF to_jsonb(OLD) IS DISTINCT FROM to_jsonb(NEW) THEN
      INSERT INTO public.logs (usuario_id, acao, entidade, entidade_id, dados_anteriores, dados_novos)
      VALUES (v_user_id, v_acao, v_entidade, NEW.id, to_jsonb(OLD), to_jsonb(NEW));
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    v_acao := 'DELETE';
    INSERT INTO public.logs (usuario_id, acao, entidade, entidade_id, dados_anteriores)
    VALUES (v_user_id, v_acao, v_entidade, OLD.id, to_jsonb(OLD));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS audit_produtos_trigger ON produtos;
CREATE TRIGGER audit_produtos_trigger
  AFTER INSERT OR UPDATE OR DELETE ON produtos
  FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();

DROP TRIGGER IF EXISTS audit_fornecedores_trigger ON fornecedores;
CREATE TRIGGER audit_fornecedores_trigger
  AFTER INSERT OR UPDATE OR DELETE ON fornecedores
  FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();

DROP TRIGGER IF EXISTS audit_users_trigger ON users;
CREATE TRIGGER audit_users_trigger
  AFTER UPDATE OR DELETE ON users
  FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();

DROP TRIGGER IF EXISTS audit_movimentacoes_trigger ON movimentacoes;
CREATE TRIGGER audit_movimentacoes_trigger
  AFTER INSERT ON movimentacoes
  FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();

-- 5. FUNÇÃO SEGURA PARA LOGS DE AUTENTICAÇÃO
CREATE OR REPLACE FUNCTION log_auth_event(p_acao TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_acao IN ('LOGIN', 'LOGOUT') AND auth.uid() IS NOT NULL THEN
    INSERT INTO logs (usuario_id, acao, entidade, entidade_id)
    VALUES (auth.uid(), p_acao, 'AUTH', auth.uid());
  END IF;
END;
$$;