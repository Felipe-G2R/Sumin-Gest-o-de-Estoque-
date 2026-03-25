// ============================================
// LOJA SERVICE — Gestão Multi-Tenant
// ============================================
import { supabase } from '../lib/supabase';

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
      .insert({ nome, cnpj, endereco, telefone, email })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async atualizar(id, updates) {
    const { data, error } = await supabase
      .from('lojas')
      .update(updates)
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
    // Usar fetch direto na API do Supabase Auth Admin para não deslogar o admin atual
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Você precisa estar logado para criar usuários');

    // Criar user via API admin do GoTrue (usando o token do admin logado)
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        email,
        password: senha,
        email_confirm: true,
        user_metadata: { nome },
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.msg || err.message || 'Erro ao criar usuário');
    }

    const newUser = await res.json();

    // Inserir perfil com loja_id específica
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .insert({
        id: newUser.id,
        nome,
        email,
        role: role || 'USER',
        loja_id: lojaId,
      })
      .select()
      .single();
    if (profileError) throw profileError;

    return { auth: newUser, profile };
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
};
