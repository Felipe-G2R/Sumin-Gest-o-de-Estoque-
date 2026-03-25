// ============================================
// NOTIFICACAO SERVICE — Conectado ao Supabase Real
// ============================================
import { supabase } from '../lib/supabase';

export const notificacaoService = {
  async listar(filtros = {}) {
    let query = supabase.from('notificacoes').select('*, produto:produtos(id, nome)', { count: 'exact' });

    if (filtros.lida !== undefined) {
      query = query.eq('lida', filtros.lida);
    }

    const { data, error, count } = await query.order('criado_em', { ascending: false });
    if (error) throw error;

    return {
      notificacoes: data,
      total: count,
      pagina: 1,
      totalPaginas: 1
    };
  },

  async contarNaoLidas() {
    const { count, error } = await supabase.from('notificacoes').select('*', { count: 'exact', head: true }).eq('lida', false);
    if (error) throw error;
    return count || 0;
  },

  async marcarComoLida(id) {
    const { error } = await supabase.from('notificacoes').update({ lida: true }).eq('id', id);
    if (error) throw error;
  },

  async marcarTodasComoLidas() {
    const { error } = await supabase.from('notificacoes').update({ lida: true }).eq('lida', false);
    if (error) throw error;
  },

  async verificarVencimentos() {
    // Dispara a function `verificar_vencimentos()` criada na migration
    const { data, error } = await supabase.rpc('verificar_vencimentos');
    if (error) {
      console.error('[notificacaoService] Erro ao verificar vencimentos:', error.message);
      throw error;
    }
    return { total_alertas: data ?? 0 };
  }
};
