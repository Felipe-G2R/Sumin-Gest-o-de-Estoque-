// ============================================
// AUTH SERVICE — Conectado ao Supabase Real
// ============================================
import { supabase } from '../lib/supabase';
import { ROLES } from '../lib/constants';

export const authService = {
  async register({ nome, email, senha }) {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: senha,
      options: { data: { nome } }
    });
    if (authError) throw authError;

    // Garante que o usuário vá para a tabela pública de perfis
    const { data: usersData } = await supabase.from('users').select('id', { count: 'exact' });
    const isFirst = !usersData || usersData.length === 0;

    const { error: profileError } = await supabase.from('users').insert({
      id: authData.user.id,
      nome,
      email,
      role: isFirst ? ROLES.ADMIN : ROLES.USER
    });
    
    if (profileError) throw profileError;

    return authData;
  },

  async login({ email, senha }) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) throw new Error('Email ou senha inválidos');
    
    // Verifica se está ativo
    const { data: profile } = await supabase.from('users').select('ativo').eq('id', data.user.id).single();
    if (profile && profile.ativo === false) {
      await this.logoutSemLog();
      throw new Error('Sua conta está desativada');
    }

    // Registra evento de auth em background (não bloqueia o login)
    supabase.rpc('log_auth_event', { p_acao: 'LOGIN' }).catch((err) =>
      console.warn('[Auth] Falha ao registrar evento de login:', err.message)
    );

    return data;
  },

  async logoutSemLog() {
    await supabase.auth.signOut();
  },

  async logout() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      supabase.rpc('log_auth_event', { p_acao: 'LOGOUT' }).catch((err) =>
        console.warn('[Auth] Falha ao registrar evento de logout:', err.message)
      );
    }
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;

    const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single();
    return { ...user, profile };
  },

  async getProfile(userId) {
    try {
      const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
      if (error) {
        console.warn('Perfil não encontrado para o usuário:', userId);
        return null;
      }
      return data;
    } catch (err) {
      console.error('Erro crítico ao buscar perfil:', err);
      return null;
    }
  },

  async listarUsuarios() {
    const { data, error } = await supabase.from('users').select('*').order('criado_em', { ascending: false });
    if (error) throw error;
    return data;
  },

  async updateRole(userId, novoRole) {
    const roleNormalizada = String(novoRole).trim().toUpperCase();
    const { data, error } = await supabase.from('users').update({ role: roleNormalizada }).eq('id', userId).select().single();
    if (error) throw error;
    return data;
  },

  async deactivateUser(userId) {
    const { data, error } = await supabase.from('users').update({ ativo: false }).eq('id', userId).select().single();
    if (error) throw error;
    return data;
  },

  async reactivateUser(userId) {
    const { data, error } = await supabase.from('users').update({ ativo: true }).eq('id', userId).select().single();
    if (error) throw error;
    return data;
  },

  async uploadAvatar(userId, file) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return data.publicUrl;
  },

  async updateProfile(userId, updates) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback);
  }
};
