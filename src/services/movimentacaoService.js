// ============================================
// MOVIMENTACAO SERVICE — Conectado ao Supabase Real
// ============================================
import { supabase } from '../lib/supabase';

export const movimentacaoService = {
  async listar(filtros = {}) {
    let query = supabase.from('movimentacoes').select('id, tipo, quantidade, motivo, observacao, criado_em, produto:produtos(nome, unidade_medida), usuario:users(nome)', { count: 'exact' });

    if (filtros.tipo) query = query.eq('tipo', filtros.tipo);
    if (filtros.produto_id) query = query.eq('produto_id', filtros.produto_id);

    const { data, error, count } = await query.order('criado_em', { ascending: false }).limit(200);
    if (error) throw error;

    return {
      movimentacoes: data,
      total: count,
      pagina: 1,
      totalPaginas: 1
    };
  },

  async registrarEntrada(dados, usuarioId) {
    return this.registrar({ ...dados, tipo: 'ENTRADA', usuario_id: usuarioId || dados.usuario_id });
  },

  async registrarSaida(dados, usuarioId) {
    return this.registrar({ ...dados, tipo: 'SAIDA', usuario_id: usuarioId || dados.usuario_id });
  },

  async registrar({ produto_id, usuario_id, tipo, quantidade, motivo, observacao }) {
    // 1. Busca estoque atual
    const { data: produto, error: errProd } = await supabase.from('produtos').select('quantidade_atual, nome').eq('id', produto_id).maybeSingle();
    if (errProd) throw new Error('Produto não encontrado');

    const quant = Number(quantidade);
    const estoqueAnterior = produto.quantidade_atual;

    if (tipo === 'SAIDA' && estoqueAnterior < quant) {
      throw new Error('Estoque insuficiente para esta saída');
    }

    const estoqueNovo = tipo === 'ENTRADA' ? estoqueAnterior + quant : estoqueAnterior - quant;

    // 2. Atualiza o produto
    const { error: errUpdate } = await supabase.from('produtos').update({ quantidade_atual: estoqueNovo }).eq('id', produto_id);
    if (errUpdate) throw errUpdate;

    // 3. Registra a movimentação (A Trigger do banco cuidará dos logs automaticamente)
    const { data: novaMov, error: errMov } = await supabase.from('movimentacoes').insert([{
      produto_id,
      usuario_id,
      tipo,
      quantidade: quant,
      motivo,
      observacao
    }]).select().single();
    
    if (errMov) throw errMov;

    return { ...novaMov, estoque_anterior: estoqueAnterior, estoque_novo: estoqueNovo };
  }
};
