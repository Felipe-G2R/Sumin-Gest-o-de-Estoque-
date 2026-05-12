// ============================================
// Edge Function: delete-store-user
// SUPER_ADMIN exclui um usuário (auth + profile via CASCADE).
// Bloqueia auto-exclusão e exclusão do último SUPER_ADMIN ativo.
// ============================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.1";

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
  try {
    return await handle(req);
  } catch (e) {
    console.error("[delete-store-user] erro não tratado:", e);
    return jsonResponse({
      message: "Erro interno: " + (e instanceof Error ? e.message : String(e)),
    }, 500);
  }
});

async function handle(req: Request) {
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

  // 2. Confirmar que o chamador é SUPER_ADMIN
  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const { data: callerProfile, error: profileErr } = await adminClient
    .from("users").select("role, ativo").eq("id", callerId).maybeSingle();

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
      { message: "Apenas SUPER_ADMIN pode excluir usuários" },
      403,
    );
  }

  // 3. Validar payload
  let payload: { userId?: string };
  try { payload = await req.json(); }
  catch { return jsonResponse({ message: "Payload JSON inválido" }, 400); }

  const targetId = payload.userId?.trim();
  if (!targetId) {
    return jsonResponse({ message: "Campo obrigatório: userId" }, 400);
  }

  // 4. Não pode excluir a si mesmo
  if (targetId === callerId) {
    return jsonResponse(
      { message: "Você não pode excluir sua própria conta." },
      400,
    );
  }

  // 5. Buscar alvo e validar
  const { data: target, error: targetErr } = await adminClient
    .from("users").select("id, role, email, nome, loja_id, ativo").eq("id", targetId).maybeSingle();

  if (targetErr) {
    return jsonResponse(
      { message: "Erro ao localizar usuário: " + targetErr.message },
      500,
    );
  }
  if (!target) {
    return jsonResponse({ message: "Usuário não encontrado" }, 404);
  }

  // 6. Se o alvo for SUPER_ADMIN, garantir que não é o último ativo
  if (target.role === "SUPER_ADMIN") {
    const { count, error: countErr } = await adminClient
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("role", "SUPER_ADMIN")
      .eq("ativo", true);

    if (countErr) {
      return jsonResponse(
        { message: "Erro ao validar SUPER_ADMINs: " + countErr.message },
        500,
      );
    }
    if ((count ?? 0) <= 1) {
      return jsonResponse(
        { message: "Não é possível excluir o último SUPER_ADMIN ativo do sistema." },
        400,
      );
    }
  }

  // 7. Coletar contagem de histórico afetado (informativo no log de auditoria).
  //    Após migration 010, FKs em movimentacoes/logs/inventarios são ON DELETE SET NULL,
  //    então a deleção do auth user não é bloqueada — as referências viram NULL.
  const [movRes, logRes, invRes] = await Promise.all([
    adminClient.from("movimentacoes").select("id", { count: "exact", head: true }).eq("usuario_id", targetId),
    adminClient.from("logs").select("id", { count: "exact", head: true }).eq("usuario_id", targetId),
    adminClient.from("inventarios").select("id", { count: "exact", head: true }).eq("usuario_id", targetId),
  ]);
  const refsAnonimizadas = {
    movimentacoes: movRes.count ?? 0,
    logs: logRes.count ?? 0,
    inventarios: invRes.count ?? 0,
  };

  // 8. Deletar do auth (CASCADE no public.users + SET NULL nas tabelas históricas).
  const { error: delErr } = await adminClient.auth.admin.deleteUser(targetId);
  if (delErr) {
    const msg = delErr.message ?? "Falha ao excluir usuário";
    console.error("[delete-store-user] auth.admin.deleteUser falhou", {
      targetId, callerId, error: msg,
    });
    if (/foreign key|violates|23503|database error/i.test(msg)) {
      return jsonResponse({
        message: "Não foi possível excluir por restrição de integridade. Contate o suporte.",
      }, 409);
    }
    return jsonResponse({ message: msg }, 500);
  }

  // 9. Log de auditoria (best-effort)
  try {
    await adminClient.from("logs").insert({
      usuario_id: callerId,
      acao: "DELETE_USER",
      entidade: "AUTH",
      entidade_id: targetId,
      dados_anteriores: {
        email: target.email,
        nome: target.nome,
        role: target.role,
        loja_id: target.loja_id,
        ativo: target.ativo,
        refs_anonimizadas: refsAnonimizadas,
      },
      loja_id: target.loja_id,
    });
  } catch { /* silencioso */ }

  return jsonResponse({
    ok: true,
    deletedId: targetId,
    anonimizado: refsAnonimizadas,
  }, 200);
}
