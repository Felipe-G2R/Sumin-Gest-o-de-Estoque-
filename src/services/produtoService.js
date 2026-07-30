// ============================================
// PRODUTO SERVICE — Conectado ao Supabase Real
// ============================================
import { supabase } from '../lib/supabase';
import { aplicarFiltroLoja, exigirLojaParaCriar } from '../lib/queryHelpers';

function normalizarPayload(dados) {
  const out = { ...dados };
  if ('codigo_barras' in out) {
    const cb = out.codigo_barras?.toString().trim();
    out.codigo_barras = cb ? cb : null;
  }
  if ('lote' in out) {
    const lt = out.lote?.toString().trim();
    out.lote = lt ? lt : null;
  }
  return out;
}

function traduzirErroSupabase(error) {
  if (error?.code === '23505' && /codigo_barras/i.test(error.message || '')) {
    return new Error('Já existe um produto cadastrado com este código de barras.');
  }
  return error;
}

export const produtoService = {
  async listar({ termo = '', categoria = '', ordenacao = 'nome-asc', lojaId = null } = {}) {
    let query = supabase
      .from('produtos')
      .select('*, fornecedor:fornecedores(nome, id), loja:lojas(id, nome)', { count: 'exact' })
      .eq('ativo', true);

    query = aplicarFiltroLoja(query, lojaId);

    if (termo) {
      // Busca no servidor por nome, código de barras ou lote — não depende do
      // limite de 200 registros carregados na tela.
      query = query.or(`nome.ilike.%${termo}%,codigo_barras.ilike.%${termo}%,lote.ilike.%${termo}%`);
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

  async criar(dados, lojaId = null) {
    const payload = normalizarPayload(
      exigirLojaParaCriar(
        { ...dados, quantidade_atual: Number(dados.quantidade_atual || 0) },
        lojaId ?? dados.loja_id
      )
    );
    const { data: novoProduto, error } = await supabase.from('produtos').insert([payload]).select().single();
    if (error) throw traduzirErroSupabase(error);

    return novoProduto;
  },

  async atualizar(id, dados) {
    const payload = normalizarPayload(dados);
    const { data: atualizado, error } = await supabase.from('produtos').update(payload).eq('id', id).select().single();
    if (error) throw traduzirErroSupabase(error);

    return atualizado;
  },

  async excluir(id) {
    // Soft Delete
    const { error } = await supabase.from('produtos').update({ ativo: false }).eq('id', id);
    if (error) throw error;
  }
};
