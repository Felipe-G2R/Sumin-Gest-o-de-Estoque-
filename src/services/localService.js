import { supabase } from '../lib/supabase';
import { aplicarFiltroLoja, exigirLojaParaCriar } from '../lib/queryHelpers';

export const localService = {
  async listar(filtros = {}) {
    let query = supabase.from('locais').select('*, loja:lojas(id, nome)', { count: 'exact' });
    query = aplicarFiltroLoja(query, filtros.lojaId);

    if (filtros.ativo !== undefined) query = query.eq('ativo', filtros.ativo);
    if (filtros.tipo) query = query.eq('tipo', filtros.tipo);
    if (filtros.busca) query = query.ilike('nome', `%${filtros.busca}%`);

    const { data, error, count } = await query.order('nome');
    if (error) throw error;
    return { locais: data, total: count };
  },

  async listarAtivos(lojaId = null) {
    let query = supabase.from('locais').select('*').eq('ativo', true);
    query = aplicarFiltroLoja(query, lojaId);
    const { data, error } = await query.order('nome');
    if (error) throw error;
    return data;
  },

  async buscar(id) {
    if (!id) throw new Error('ID do local não informado');
    const { data, error } = await supabase.from('locais').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Local não encontrado');
    return data;
  },

  async criar(dados, lojaId = null) {
    const payload = exigirLojaParaCriar(dados, lojaId ?? dados.loja_id);
    const { data, error } = await supabase.from('locais').insert([payload]).select().single();
    if (error) throw error;
    return data;
  },

  async atualizar(id, dados) {
    const { data, error } = await supabase.from('locais').update(dados).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async desativar(id) {
    const { error } = await supabase.from('locais').update({ ativo: false }).eq('id', id);
    if (error) throw error;
  },

  async reativar(id) {
    const { error } = await supabase.from('locais').update({ ativo: true }).eq('id', id);
    if (error) throw error;
  }
};
