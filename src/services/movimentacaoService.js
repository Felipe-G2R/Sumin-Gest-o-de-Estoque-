// ============================================
// MOVIMENTACAO SERVICE — Conectado ao Supabase Real
// ============================================
import { supabase } from '../lib/supabase';
import { aplicarFiltroLoja, exigirLojaParaCriar } from '../lib/queryHelpers';

export const movimentacaoService = {
  async listar(filtros = {}) {
    let query = supabase
      .from('movimentacoes')
      .select('id, tipo, quantidade, motivo, observacao, criado_em, loja_id, produto:produtos(nome, unidade_medida), usuario:users(nome), loja:lojas(id, nome)', { count: 'exact' });

    query = aplicarFiltroLoja(query, filtros.lojaId);

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

  async registrarEntrada(dados, usuarioId, lojaId = null) {
    return this.registrar({ ...dados, tipo: 'ENTRADA', usuario_id: usuarioId || dados.usuario_id }, lojaId);
  },

  async registrarSaida(dados, usuarioId, lojaId = null) {
    return this.registrar({ ...dados, tipo: 'SAIDA', usuario_id: usuarioId || dados.usuario_id }, lojaId);
  },

  async registrar({ produto_id, usuario_id, tipo, quantidade, motivo, observacao, loja_id }, lojaIdArg = null) {
    // Determinar loja para o INSERT — preferir a loja do produto (fonte mais confiável)
    const { data: produto, error: errProd } = await supabase
      .from('produtos')
      .select('quantidade_atual, nome, loja_id')
      .eq('id', produto_id)
      .maybeSingle();
    if (errProd || !produto) throw new Error('Produto não encontrado');

    const lojaIdFinal = produto.loja_id ?? loja_id ?? lojaIdArg;

    const quant = Number(quantidade);
    const estoqueAnterior = produto.quantidade_atual;

    if (tipo === 'SAIDA' && estoqueAnterior < quant) {
      throw new Error('Estoque insuficiente para esta saída');
    }

    const estoqueNovo = tipo === 'ENTRADA' ? estoqueAnterior + quant : estoqueAnterior - quant;

    // 2. Atualiza o produto
    const { error: errUpdate } = await supabase.from('produtos').update({ quantidade_atual: estoqueNovo }).eq('id', produto_id);
    if (errUpdate) throw errUpdate;

    // 3. Registra a movimentação com loja_id explícita (mesma loja do produto)
    const payload = exigirLojaParaCriar({
      produto_id,
      usuario_id,
      tipo,
      quantidade: quant,
      motivo,
      observacao,
    }, lojaIdFinal);

    const { data: novaMov, error: errMov } = await supabase.from('movimentacoes').insert([payload]).select().single();
    if (errMov) throw errMov;

    return { ...novaMov, estoque_anterior: estoqueAnterior, estoque_novo: estoqueNovo };
  }
};
