// Script para aplicar multi-tenant no Supabase remoto
const API = "https://api.supabase.com/v1/projects/dwlaygqmbzidlwzyzkiv/database/query";
const TOKEN = "Bearer sbp_e7675df354085e3383bd5be8fcf02b47328446d8";

async function execSQL(sql, label) {
  const res = await fetch(API, {
    method: "POST",
    headers: { "Authorization": TOKEN, "Content-Type": "application/json" },
    body: JSON.stringify({ query: sql })
  });
  if (res.ok) { console.log("✅", label); }
  else { const e = await res.text(); console.log("❌", label, "→", e.substring(0, 300)); }
}

async function run() {
  // 1. Fix role constraint
  await execSQL(`
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
    ALTER TABLE users ADD CONSTRAINT users_role_check
      CHECK (role IN ('USER', 'ADMIN', 'ADM', 'SUPER_ADMIN'));
  `, "Fix role constraint");

  await execSQL(`
    UPDATE users SET role = 'SUPER_ADMIN' WHERE email = 'lemescoproduto@gmail.com';
  `, "lemescoproduto → SUPER_ADMIN");

  // 2. RLS lojas
  await execSQL(`
    CREATE POLICY "Leitura de lojas" ON lojas FOR SELECT TO authenticated
      USING (is_super_admin() OR id = get_user_loja_id());
    CREATE POLICY "SUPER_ADMIN gerencia lojas" ON lojas FOR ALL TO authenticated
      USING (is_super_admin()) WITH CHECK (is_super_admin());
  `, "RLS lojas");

  // 3. RLS users
  await execSQL(`
    DROP POLICY IF EXISTS "User vê próprio perfil" ON users;
    DROP POLICY IF EXISTS "Usuário vê seu próprio perfil" ON users;
    DROP POLICY IF EXISTS "Leitura de perfis restrita" ON users;
    DROP POLICY IF EXISTS "Admin vê todos os perfis" ON users;
    DROP POLICY IF EXISTS "Usuário atualiza apenas dados básicos próprios" ON users;
    DROP POLICY IF EXISTS "Apenas ADMINs podem gerenciar usuários livremente" ON users;
    DROP POLICY IF EXISTS "Criação de perfil no registro" ON users;
    DROP POLICY IF EXISTS "Users da mesma loja" ON users;
    DROP POLICY IF EXISTS "SUPER_ADMIN vê todos" ON users;
    DROP POLICY IF EXISTS "User atualiza próprio perfil" ON users;
    DROP POLICY IF EXISTS "ADMIN gerencia users da loja" ON users;
    DROP POLICY IF EXISTS "Registro de perfil" ON users;
  `, "Drop old users policies");

  await execSQL(`
    CREATE POLICY "User vê próprio perfil" ON users FOR SELECT TO authenticated
      USING (auth.uid() = id);
    CREATE POLICY "Users da mesma loja" ON users FOR SELECT TO authenticated
      USING (is_user_active() AND loja_id = get_user_loja_id());
    CREATE POLICY "SUPER_ADMIN vê todos" ON users FOR SELECT TO authenticated
      USING (is_super_admin());
  `, "RLS users SELECT");

  await execSQL(`
    CREATE POLICY "User atualiza próprio perfil" ON users FOR UPDATE TO authenticated
      USING (auth.uid() = id AND is_user_active())
      WITH CHECK (auth.uid() = id AND is_user_active());
    CREATE POLICY "ADMIN gerencia users da loja" ON users FOR UPDATE TO authenticated
      USING (get_user_role() IN ('ADMIN', 'SUPER_ADMIN') AND (is_super_admin() OR loja_id = get_user_loja_id()));
    CREATE POLICY "Registro de perfil" ON users FOR INSERT TO authenticated
      WITH CHECK (auth.uid() = id);
  `, "RLS users INSERT/UPDATE");

  // 4. RLS produtos
  await execSQL(`
    DROP POLICY IF EXISTS "Usuários ativos podem ler produtos" ON produtos;
    DROP POLICY IF EXISTS "Apenas ADMINs gerenciam produtos" ON produtos;
    DROP POLICY IF EXISTS "Leitura produtos da loja" ON produtos;
    DROP POLICY IF EXISTS "ADMIN gerencia produtos da loja" ON produtos;

    CREATE POLICY "Leitura produtos da loja" ON produtos FOR SELECT TO authenticated
      USING (is_super_admin() OR (is_user_active() AND loja_id = get_user_loja_id()));
    CREATE POLICY "ADMIN gerencia produtos da loja" ON produtos FOR ALL TO authenticated
      USING (is_super_admin() OR (get_user_role() IN ('ADMIN', 'SUPER_ADMIN') AND loja_id = get_user_loja_id()))
      WITH CHECK (is_super_admin() OR (get_user_role() IN ('ADMIN', 'SUPER_ADMIN') AND loja_id = get_user_loja_id()));
  `, "RLS produtos");

  // 5. RLS fornecedores
  await execSQL(`
    DROP POLICY IF EXISTS "Usuários ativos podem ler fornecedores" ON fornecedores;
    DROP POLICY IF EXISTS "Apenas ADMINs gerenciam fornecedores" ON fornecedores;
    DROP POLICY IF EXISTS "Leitura fornecedores da loja" ON fornecedores;
    DROP POLICY IF EXISTS "ADMIN gerencia fornecedores da loja" ON fornecedores;

    CREATE POLICY "Leitura fornecedores da loja" ON fornecedores FOR SELECT TO authenticated
      USING (is_super_admin() OR (is_user_active() AND loja_id = get_user_loja_id()));
    CREATE POLICY "ADMIN gerencia fornecedores da loja" ON fornecedores FOR ALL TO authenticated
      USING (is_super_admin() OR (get_user_role() IN ('ADMIN', 'SUPER_ADMIN') AND loja_id = get_user_loja_id()))
      WITH CHECK (is_super_admin() OR (get_user_role() IN ('ADMIN', 'SUPER_ADMIN') AND loja_id = get_user_loja_id()));
  `, "RLS fornecedores");

  // 6. RLS movimentacoes
  await execSQL(`
    DROP POLICY IF EXISTS "Usuários ativos podem ler movimentações" ON movimentacoes;
    DROP POLICY IF EXISTS "Usuários ativos podem criar movimentações" ON movimentacoes;
    DROP POLICY IF EXISTS "Leitura movimentações da loja" ON movimentacoes;
    DROP POLICY IF EXISTS "Criar movimentações da loja" ON movimentacoes;

    CREATE POLICY "Leitura movimentações da loja" ON movimentacoes FOR SELECT TO authenticated
      USING (is_super_admin() OR (is_user_active() AND loja_id = get_user_loja_id()));
    CREATE POLICY "Criar movimentações da loja" ON movimentacoes FOR INSERT TO authenticated
      WITH CHECK (is_super_admin() OR (is_user_active() AND auth.uid() = usuario_id AND loja_id = get_user_loja_id()));
  `, "RLS movimentacoes");

  // 7. RLS notificacoes
  await execSQL(`
    DROP POLICY IF EXISTS "Usuários ativos podem ler notificações" ON notificacoes;
    DROP POLICY IF EXISTS "Usuários ativos podem atualizar notificações (marcar lida)" ON notificacoes;
    DROP POLICY IF EXISTS "Leitura notificações da loja" ON notificacoes;
    DROP POLICY IF EXISTS "Atualizar notificações da loja" ON notificacoes;

    CREATE POLICY "Leitura notificações da loja" ON notificacoes FOR SELECT TO authenticated
      USING (is_super_admin() OR (is_user_active() AND loja_id = get_user_loja_id()));
    CREATE POLICY "Atualizar notificações da loja" ON notificacoes FOR UPDATE TO authenticated
      USING (is_super_admin() OR (is_user_active() AND loja_id = get_user_loja_id()));
  `, "RLS notificacoes");

  // 8. RLS logs
  await execSQL(`
    DROP POLICY IF EXISTS "Apenas ADMINs podem ler logs" ON logs;
    DROP POLICY IF EXISTS "ADMIN lê logs da loja" ON logs;

    CREATE POLICY "ADMIN lê logs da loja" ON logs FOR SELECT TO authenticated
      USING (is_super_admin() OR (get_user_role() IN ('ADMIN', 'SUPER_ADMIN') AND loja_id = get_user_loja_id()));
  `, "RLS logs");

  // 9. RLS locais
  await execSQL(`
    DROP POLICY IF EXISTS "Usuários ativos podem ler locais" ON locais;
    DROP POLICY IF EXISTS "Usuários ativos podem criar locais" ON locais;
    DROP POLICY IF EXISTS "Usuários ativos podem atualizar locais" ON locais;

    CREATE POLICY "Leitura locais da loja" ON locais FOR SELECT TO authenticated
      USING (is_super_admin() OR (is_user_active() AND loja_id = get_user_loja_id()));
    CREATE POLICY "Criar locais da loja" ON locais FOR INSERT TO authenticated
      WITH CHECK (is_super_admin() OR (is_user_active() AND loja_id = get_user_loja_id()));
    CREATE POLICY "Atualizar locais da loja" ON locais FOR UPDATE TO authenticated
      USING (is_super_admin() OR (is_user_active() AND loja_id = get_user_loja_id()));
  `, "RLS locais");

  // 10. RLS inventarios
  await execSQL(`
    DROP POLICY IF EXISTS "Usuários ativos podem ler inventarios" ON inventarios;
    DROP POLICY IF EXISTS "Usuários ativos podem criar inventarios" ON inventarios;
    DROP POLICY IF EXISTS "Usuários ativos podem atualizar inventarios" ON inventarios;

    CREATE POLICY "Leitura inventarios da loja" ON inventarios FOR SELECT TO authenticated
      USING (is_super_admin() OR (is_user_active() AND loja_id = get_user_loja_id()));
    CREATE POLICY "Criar inventarios da loja" ON inventarios FOR INSERT TO authenticated
      WITH CHECK (is_super_admin() OR (is_user_active() AND loja_id = get_user_loja_id()));
    CREATE POLICY "Atualizar inventarios da loja" ON inventarios FOR UPDATE TO authenticated
      USING (is_super_admin() OR (is_user_active() AND loja_id = get_user_loja_id()));
  `, "RLS inventarios");

  // 11. RLS inventario_itens
  await execSQL(`
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
  `, "RLS inventario_itens");

  // 12. Atualizar audit_log_trigger para incluir loja_id
  await execSQL(`
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
  `, "Trigger audit_log com loja_id");

  // 13. Atualizar log_auth_event para incluir loja_id
  await execSQL(`
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
  `, "RPC log_auth_event com loja_id");

  // 14. Atualizar verificar_vencimentos para incluir loja_id
  await execSQL(`
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
  `, "RPC verificar_vencimentos com loja_id");

  console.log("\n=== MULTI-TENANT COMPLETO NO BANCO ===");
}
run();
