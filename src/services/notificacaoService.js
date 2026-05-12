// ============================================
// NOTIFICACAO SERVICE — Conectado ao Supabase Real
// ============================================
import { supabase } from '../lib/supabase';
import { aplicarFiltroLoja } from '../lib/queryHelpers';

export const notificacaoService = {
  async listar(filtros = {}) {
    let query = supabase
      .from('notificacoes')
      .select('*, produto:produtos(id, nome), loja:lojas(id, nome)', { count: 'exact' });

    query = aplicarFiltroLoja(query, filtros.lojaId);

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

  async contarNaoLidas(lojaId = null) {
    let query = supabase.from('notificacoes').select('*', { count: 'exact', head: true }).eq('lida', false);
    query = aplicarFiltroLoja(query, lojaId);
    const { count, error } = await query;
    if (error) throw error;
    return count || 0;
  },

  async marcarComoLida(id) {
    const { error } = await supabase.from('notificacoes').update({ lida: true }).eq('id', id);
    if (error) throw error;
  },

  async marcarTodasComoLidas(lojaId = null) {
    let query = supabase.from('notificacoes').update({ lida: true }).eq('lida', false);
    query = aplicarFiltroLoja(query, lojaId);
    const { error } = await query;
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
