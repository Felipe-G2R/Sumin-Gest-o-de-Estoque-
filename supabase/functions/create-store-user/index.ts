// ============================================
// Edge Function: create-store-user
// SUPER_ADMIN cria um usuário (auth + profile) para uma loja específica.
// Usa SERVICE_ROLE_KEY apenas server-side, nunca exposto ao frontend.
// ============================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.1";

const ALLOWED_ROLES = new Set(["USER", "ADMIN", "OPERADOR_SAIDA"]);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ message: "Método não permitido" }, 405);
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SERVICE_ROLE_KEY) {
    return jsonResponse(
      { message: "Configuração ausente no servidor (variáveis Supabase)" },
      500,
    );
  }

  // 1. Validar JWT do chamador
  const authHeader = req.headers.get("Authorization") ?? "";
  const accessToken = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!accessToken) {
    return jsonResponse({ message: "Token de autenticação ausente" }, 401);
  }

  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false },
  });

  const { data: callerData, error: callerErr } = await userClient.auth.getUser();
  if (callerErr || !callerData?.user) {
    return jsonResponse({ message: "Sessão inválida ou expirada" }, 401);
  }

  const callerId = callerData.user.id;

  // 2. Confirmar que o chamador é SUPER_ADMIN (consulta com service_role para
  //    não depender de policies que possam mascarar a coluna role)
  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const { data: callerProfile, error: profileErr } = await adminClient
    .from("users")
    .select("role, ativo")
    .eq("id", callerId)
    .maybeSingle();

  if (profileErr) {
    return jsonResponse(
      { message: "Erro ao validar permissões: " + profileErr.message },
      500,
    );
  }

  if (!callerProfile || !callerProfile.ativo) {
    return jsonResponse({ message: "Usuário inativo ou não encontrado" }, 403);
  }

  if (callerProfile.role !== "SUPER_ADMIN") {
    return jsonResponse(
      { message: "Apenas SUPER_ADMIN pode criar usuários" },
      403,
    );
  }

  // 3. Validar payload
  let payload: {
    nome?: string;
    email?: string;
    senha?: string;
    role?: string;
    lojaId?: string;
  };
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ message: "Payload JSON inválido" }, 400);
  }

  const nome = payload.nome?.trim();
  const email = payload.email?.trim().toLowerCase();
  const senha = payload.senha ?? "";
  const role = (payload.role ?? "USER").toUpperCase();
  const lojaId = payload.lojaId?.trim();

  if (!nome || !email || !senha || !lojaId) {
    return jsonResponse(
      { message: "Campos obrigatórios: nome, email, senha, lojaId" },
      400,
    );
  }

  if (!ALLOWED_ROLES.has(role)) {
    return jsonResponse(
      { message: "Role inválido (use USER, ADMIN ou OPERADOR_SAIDA)" },
      400,
    );
  }

  if (senha.length < 8) {
    return jsonResponse(
      { message: "Senha deve ter ao menos 8 caracteres" },
      400,
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonResponse({ message: "Email inválido" }, 400);
  }

  // 4. Confirmar que a loja existe e está ativa
  const { data: loja, error: lojaErr } = await adminClient
    .from("lojas")
    .select("id, ativo")
    .eq("id", lojaId)
    .maybeSingle();

  if (lojaErr) {
    return jsonResponse(
      { message: "Erro ao validar loja: " + lojaErr.message },
      500,
    );
  }
  if (!loja) {
    return jsonResponse({ message: "Loja não encontrada" }, 404);
  }
  if (!loja.ativo) {
    return jsonResponse({ message: "Loja está inativa" }, 400);
  }

  // 5. Criar o auth user
  const { data: created, error: createErr } = await adminClient.auth.admin
    .createUser({
      email,
      password: senha,
      email_confirm: true,
      user_metadata: { nome },
    });

  if (createErr || !created?.user) {
    const msg = createErr?.message ?? "Falha ao criar usuário";
    const status = /already.*registered|exists/i.test(msg) ? 409 : 500;
    return jsonResponse({ message: msg }, status);
  }

  const newUserId = created.user.id;

  // 6. Inserir perfil (bypass RLS via service_role)
  const { data: profile, error: insertErr } = await adminClient
    .from("users")
    .insert({
      id: newUserId,
      nome,
      email,
      role,
      loja_id: lojaId,
    })
    .select()
    .single();

  if (insertErr) {
    // Rollback: remover o auth user para não ficar órfão
    await adminClient.auth.admin.deleteUser(newUserId).catch(() => {});
    return jsonResponse(
      { message: "Falha ao salvar perfil: " + insertErr.message },
      500,
    );
  }

  // 7. Log de auditoria (best-effort; falha aqui não invalida a criação)
  try {
    await userClient.rpc("log_user_created", {
      p_new_user_id: newUserId,
      p_loja_id: lojaId,
      p_role: role,
    });
  } catch {
    // silencioso
  }

  return jsonResponse({
    id: profile.id,
    nome: profile.nome,
    email: profile.email,
    role: profile.role,
    loja_id: profile.loja_id,
  }, 201);
});
