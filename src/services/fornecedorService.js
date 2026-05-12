// ============================================
// FORNECEDOR SERVICE — Conectado ao Supabase Real
// ============================================
import { supabase } from '../lib/supabase';
import { aplicarFiltroLoja, exigirLojaParaCriar } from '../lib/queryHelpers';

export const fornecedorService = {
  async listar(filtros = {}) {
    let query = supabase
      .from('fornecedores')
      .select('*, loja:lojas(id, nome)', { count: 'exact' })
      .eq('ativo', true);

    query = aplicarFiltroLoja(query, filtros.lojaId);

    if (filtros.busca) {
      query = query.or(`nome.ilike.%${filtros.busca}%,cnpj.ilike.%${filtros.busca}%`);
    }

    const { data, error, count } = await query.order('nome').limit(200);
    if (error) throw error;

    return {
      fornecedores: data,
      total: count,
      pagina: 1,
      totalPaginas: 1
    };
  },

  async listarAtivos(lojaId = null) {
    let query = supabase.from('fornecedores').select('id, nome').eq('ativo', true);
    query = aplicarFiltroLoja(query, lojaId);
    const { data, error } = await query.order('nome');
    if (error) throw error;
    return data;
  },

  async buscar(id) {
    if (!id) throw new Error('ID do fornecedor não informado');
    const { data, error } = await supabase.from('fornecedores').select('*, produtos(id, nome, quantidade_atual, ativo)').eq('id', id).maybeSingle();
    if (!data) throw new Error('Fornecedor não encontrado');
    if (error) throw error;
    return data;
  },

  async criar(dados, lojaId = null) {
    const payload = exigirLojaParaCriar(dados, lojaId ?? dados.loja_id);
    const { data: novoFornecedor, error } = await supabase.from('fornecedores').insert([payload]).select().single();
    if (error) throw error;

    return novoFornecedor;
  },

  async atualizar(id, dados) {
    const { data: atualizado, error } = await supabase.from('fornecedores').update(dados).eq('id', id).select().single();
    if (error) throw error;

    return atualizado;
  },

  async excluir(id) {
    // Soft Delete
    const { error } = await supabase.from('fornecedores').update({ ativo: false }).eq('id', id);
    if (error) throw error;
  },

  async desativar(id) {
    const { error } = await supabase.from('fornecedores').update({ ativo: false }).eq('id', id);
    if (error) throw error;
  },

  async reativar(id) {
    const { error } = await supabase.from('fornecedores').update({ ativo: true }).eq('id', id);
    if (error) throw error;
  }
};
