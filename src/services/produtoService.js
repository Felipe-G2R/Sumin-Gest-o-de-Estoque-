// ============================================
// PRODUTO SERVICE — Conectado ao Supabase Real
// ============================================
import { supabase } from '../lib/supabase';

export const produtoService = {
  async listar({ termo = '', categoria = '', ordenacao = 'nome-asc' }) {
    let query = supabase.from('produtos').select('*, fornecedor:fornecedores(nome, id)', { count: 'exact' }).eq('ativo', true);

    if (termo) {
      query = query.or(`nome.ilike.%${termo}%,codigo_barras.ilike.%${termo}%`);
    }
    if (categoria) {
      query = query.eq('categoria', categoria);
    }

    // Ordenação
    if (ordenacao === 'nome-asc') query = query.order('nome', { ascending: true });
    if (ordenacao === 'nome-desc') query = query.order('nome', { ascending: false });
    if (ordenacao === 'estoque-baixo') query = query.order('quantidade_atual', { ascending: true });
    if (ordenacao === 'vencimento') query = query.order('data_validade', { ascending: true, nullsFirst: false });

    const { data, error, count } = await query.limit(200);
    if (error) throw error;

    return {
      produtos: data,
      total: count,
      pagina: 1,
      totalPaginas: 1
    };
  },

  async buscar(id) {
    if (!id) throw new Error('ID do produto não informado');
    const { data, error } = await supabase.from('produtos').select('*, fornecedor:fornecedores(nome, id)').eq('id', id).maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Produto não encontrado');
    return data;
  },

  async criar(dados) {
    const { data: novoProduto, error } = await supabase.from('produtos').insert([{
      ...dados,
      quantidade_atual: Number(dados.quantidade_atual || 0)
    }]).select().single();
    if (error) throw error;

    return novoProduto;
  },

  async atualizar(id, dados) {
    const { data: atualizado, error } = await supabase.from('produtos').update(dados).eq('id', id).select().single();
    if (error) throw error;

    return atualizado;
  },

  async excluir(id) {
    // Soft Delete
    const { error } = await supabase.from('produtos').update({ ativo: false }).eq('id', id);
    if (error) throw error;
  }
};
