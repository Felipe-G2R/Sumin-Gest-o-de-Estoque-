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
    // 1. Criar no Auth via admin (precisa service_role, então usamos signUp normal)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: senha,
      options: { data: { nome } }
    });
    if (authError) throw authError;

    // 2. Inserir perfil com loja_id específica
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        nome,
        email,
        role: role || 'USER',
        loja_id: lojaId,
      })
      .select()
      .single();
    if (profileError) throw profileError;

    return { auth: authData, profile };
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
