// ============================================
// LOJA SERVICE — Gestão Multi-Tenant
// ============================================
import { supabase } from '../lib/supabase';

// Campos opcionais que, quando vazios, DEVEM virar null.
// `cnpj` é UNIQUE: strings vazias ('') colidiriam entre si e impediriam
// cadastrar mais de uma loja sem CNPJ (em Postgres, vários NULL são aceitos).
const CAMPOS_OPCIONAIS = ['cnpj', 'endereco', 'telefone', 'email'];

function normalizarLoja(dados) {
  const out = { ...dados };
  for (const campo of CAMPOS_OPCIONAIS) {
    if (campo in out) {
      const valor = out[campo]?.toString().trim();
      out[campo] = valor ? valor : null;
    }
  }
  return out;
}

export const lojaService = {
  async listar() {
    const { data, error } = await supabase
      .from('lojas')
      .select('*')
      .order('criado_em', { ascending: true });
    if (error) throw error;
    return data;
  },

  async buscar(id) {
    const { data, error } = await supabase
      .from('lojas')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async criar({ nome, cnpj, endereco, telefone, email }) {
    const { data, error } = await supabase
      .from('lojas')
      .insert(normalizarLoja({ nome, cnpj, endereco, telefone, email }))
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async atualizar(id, updates) {
    const { data, error } = await supabase
      .from('lojas')
      .update(normalizarLoja(updates))
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async desativar(id) {
    return this.atualizar(id, { ativo: false });
  },

  async reativar(id) {
    return this.atualizar(id, { ativo: true });
  },

  async contarUsuariosPorLoja(lojaId) {
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('loja_id', lojaId);
    if (error) throw error;
    return count || 0;
  },

  async listarUsuariosDaLoja(lojaId) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('loja_id', lojaId)
      .order('criado_em', { ascending: false });
    if (error) throw error;
    return data;
  },

  async criarUsuarioNaLoja({ nome, email, senha, role, lojaId }) {
    // Delega para a Edge Function que tem acesso à SERVICE_ROLE_KEY.
    // O admin atual NÃO desloga porque não usamos supabase.auth.signUp aqui.
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Você precisa estar logado para criar usuários');

    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-store-user`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          nome,
          email,
          senha,
          role: role || 'USER',
          lojaId,
        }),
      }
    );

    let body = null;
    try { body = await res.json(); } catch { /* sem body */ }

    if (!res.ok) {
      throw new Error(body?.message || `Erro ao criar usuário (${res.status})`);
    }

    return body;
  },

  async moverUsuarioParaLoja(userId, novaLojaId) {
    const { data, error } = await supabase
      .from('users')
      .update({ loja_id: novaLojaId })
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async desativarUsuario(userId) {
    const { data, error } = await supabase
      .from('users')
      .update({ ativo: false })
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async reativarUsuario(userId) {
    const { data, error } = await supabase
      .from('users')
      .update({ ativo: true })
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async excluirUsuario(userId) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Sessão expirada');

    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-store-user`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ userId }),
      }
    );

    let body = null;
    try { body = await res.json(); } catch { /* */ }

    if (!res.ok) {
      throw new Error(body?.message || `Erro ao excluir usuário (${res.status})`);
    }
    return body;
  },
};
