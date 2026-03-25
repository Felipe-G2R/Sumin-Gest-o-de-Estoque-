import { supabase } from '../lib/supabase';

export const inventarioService = {
  async listar(filtros = {}) {
    let query = supabase.from('inventarios')
      .select('*, usuario:users(nome), local:locais(nome)', { count: 'exact' });

    if (filtros.status) query = query.eq('status', filtros.status);
    if (filtros.local_id) query = query.eq('local_id', filtros.local_id);

    const { data, error, count } = await query.order('criado_em', { ascending: false });
    if (error) throw error;
    return { inventarios: data, total: count };
  },

  async buscar(id) {
    const { data, error } = await supabase.from('inventarios')
      .select('*, usuario:users(nome), local:locais(nome)')
      .eq('id', id).single();
    if (error) throw error;
    return data;
  },

  async criar(dados) {
    const { data, error } = await supabase.from('inventarios')
      .insert([{ ...dados, status: 'EM_ANDAMENTO', data_inicio: new Date().toISOString() }])
      .select().single();
    if (error) throw error;
    return data;
  },

  async listarItens(inventarioId) {
    const { data, error } = await supabase.from('inventario_itens')
      .select('*, produto:produtos(nome, unidade_medida, codigo_barras, lote, categoria)')
      .eq('inventario_id', inventarioId)
      .order('produto(nome)');
    if (error) throw error;
    return data;
  },

  async carregarProdutosParaContagem(inventarioId, localId) {
    let prodQuery = supabase.from('produtos').select('id, nome, unidade_medida, quantidade_atual, codigo_barras, lote, categoria').eq('ativo', true);
    if (localId) prodQuery = prodQuery.eq('local_id', localId);

    // Paralelizar as duas queries
    const [{ data: produtos, error: errProd }, { data: itensExistentes, error: errItens }] = await Promise.all([
      prodQuery.order('nome'),
      supabase.from('inventario_itens').select('produto_id, quantidade_contada').eq('inventario_id', inventarioId),
    ]);
    if (errProd) throw errProd;
    if (errItens) throw errItens;

    const existentesMap = new Map(itensExistentes?.map(i => [i.produto_id, i.quantidade_contada]) || []);

    return produtos.map(p => ({
      produto_id: p.id,
      nome: p.nome,
      unidade_medida: p.unidade_medida,
      quantidade_sistema: p.quantidade_atual,
      quantidade_contada: existentesMap.get(p.id) ?? null,
      codigo_barras: p.codigo_barras,
      lote: p.lote,
      categoria: p.categoria,
    }));
  },

  async salvarContagem(inventarioId, itens) {
    // itens = [{ produto_id, quantidade_sistema, quantidade_contada, observacao }]
    // Upsert items
    const registros = itens.filter(i => i.quantidade_contada !== null).map(i => ({
      inventario_id: inventarioId,
      produto_id: i.produto_id,
      quantidade_sistema: i.quantidade_sistema,
      quantidade_contada: Number(i.quantidade_contada),
      diferenca: Number(i.quantidade_contada) - i.quantidade_sistema,
      observacao: i.observacao || null,
    }));

    if (registros.length === 0) return [];

    // Delete existing items for this inventory and re-insert
    await supabase.from('inventario_itens').delete().eq('inventario_id', inventarioId);

    const { data, error } = await supabase.from('inventario_itens').insert(registros).select();
    if (error) throw error;
    return data;
  },

  async finalizar(inventarioId, aplicarAjustes = false) {
    if (aplicarAjustes) {
      // Get all items with differences
      const { data: itens, error: errItens } = await supabase.from('inventario_itens')
        .select('produto_id, quantidade_contada, diferenca')
        .eq('inventario_id', inventarioId)
        .neq('diferenca', 0);
      if (errItens) throw errItens;

      // Apply adjustments to products
      for (const item of (itens || [])) {
        const { error } = await supabase.from('produtos')
          .update({ quantidade_atual: item.quantidade_contada })
          .eq('id', item.produto_id);
        if (error) throw error;
      }
    }

    const { data, error } = await supabase.from('inventarios')
      .update({ status: 'FINALIZADO', data_fim: new Date().toISOString() })
      .eq('id', inventarioId)
      .select().single();
    if (error) throw error;
    return data;
  },

  async cancelar(inventarioId) {
    const { data, error } = await supabase.from('inventarios')
      .update({ status: 'CANCELADO', data_fim: new Date().toISOString() })
      .eq('id', inventarioId)
      .select().single();
    if (error) throw error;
    return data;
  }
};
