// ============================================
// Helpers para queries multi-tenant
// ============================================

/**
 * Aplica filtro por loja_id em uma query do supabase-js.
 * Quando lojaId é null/undefined, retorna a query inalterada — modo "Administração Geral".
 */
export function aplicarFiltroLoja(query, lojaId) {
  if (lojaId === null || lojaId === undefined) return query;
  return query.eq('loja_id', lojaId);
}

/**
 * Injeta loja_id no payload de criação. Lança se chamado sem lojaId
 * (modo Geral não pode criar — UI deve impedir antes disto).
 */
export function exigirLojaParaCriar(dados, lojaId) {
  if (!lojaId) {
    throw new Error('Selecione uma loja específica antes de cadastrar. "Administração Geral" é apenas para visualização.');
  }
  return { ...dados, loja_id: lojaId };
}
