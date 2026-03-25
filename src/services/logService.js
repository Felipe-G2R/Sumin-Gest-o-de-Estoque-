// ============================================
// LOG SERVICE — Conectado ao Supabase Real
// ============================================
import { supabase } from '../lib/supabase';

export const logService = {
  async registrar(dados) {
    const { data, error } = await supabase.from('logs').insert(dados).select().single();
    if (error) throw error;
    return data;
  },

  async listar(filtros = {}) {
    let query = supabase.from('logs').select('*, usuario:users(nome, email)', { count: 'exact' });

    if (filtros.usuario_id) query = query.eq('usuario_id', filtros.usuario_id);
    if (filtros.acao) query = query.eq('acao', filtros.acao);
    if (filtros.entidade) query = query.eq('entidade', filtros.entidade);
    
    // As políticas do Postgres (RLS) bloqueiam a query aqui se o usuário logado não for ADMIN.
    // Isso cumpre sua regra de negócio nativamente pelo banco.

    const { data, error, count } = await query.order('criado_em', { ascending: false }).limit(200);

    if (error) throw error;

    return {
      logs: data,
      total: count,
      pagina: 1,
      totalPaginas: 1
    };
  },

  async buscar(id) {
    const { data, error } = await supabase.from('logs').select('*, usuario:users(nome, email)').eq('id', id).single();
    if (error) throw error;
    return data;
  },

  async exportar(filtros = {}) {
    const result = await this.listar(filtros);
    return result.logs;
  }
};
