-- ============================================
-- 006_resilient_security.sql
-- Melhora a resiliência das funções de segurança
-- para garantir carregamento fluido e evitar deadlocks de RLS
-- ============================================

-- 1. Melhorar get_user_role para ser mais robusto
-- Garante que sempre retorne algo se o usuário estiver logado
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  -- Retorna a role se o usuário existir e estiver ativo, 
  -- caso contrário retorna null ou assume 'USER' se estiver logado via auth.uid()
  -- Isso evita falhas críticas se o perfil ainda estiver sendo criado
  SELECT COALESCE(
    (SELECT role FROM public.users WHERE id = auth.uid() AND ativo = true),
    'USER'
  );
$$;

-- 2. Melhorar is_user_active para ser resiliente a perfis em criação
CREATE OR REPLACE FUNCTION public.is_user_active()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  -- Assume true se o usuário estiver autenticado no auth.users mas ainda não tiver registro no public.users
  -- Isso garante que as telas carreguem durante o fluxo de registro/primeiro login
  SELECT COALESCE(
    (SELECT ativo FROM public.users WHERE id = auth.uid()),
    true
  );
$$;

-- 3. Adicionar uma política de fallback para a própria tabela de usuários
-- Garante que o usuário autenticado possa ler seu próprio registro na tabela USERS
-- mesmo que is_user_active() tenha nuances, protegendo contra recursão infinita
DROP POLICY IF EXISTS "Usuário vê seu próprio perfil" ON users;
CREATE POLICY "Usuário vê seu próprio perfil" ON users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- Garante que o ADMIN possa ver tudo, usando get_user_role() (SECURITY DEFINER) para evitar recursão
DROP POLICY IF EXISTS "Admin vê todos os perfis" ON users;
CREATE POLICY "Admin vê todos os perfis" ON users
  FOR SELECT TO authenticated
  USING ( get_user_role() = 'ADMIN' );
