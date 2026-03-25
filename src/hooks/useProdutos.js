import { useState, useCallback } from 'react';
import { produtoService } from '../services/produtoService';

export function useProdutos() {
  const [produtos, setProdutos] = useState([]);
  const [produto, setProduto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paginacao, setPaginacao] = useState({ total: 0, pagina: 1, totalPaginas: 0 });

  const listar = useCallback(async (filtros = {}) => {
    setLoading(true); setError(null);
    try {
      const r = await produtoService.listar(filtros);
      setProdutos(r.produtos);
      setPaginacao({ total: r.total, pagina: r.pagina, totalPaginas: r.totalPaginas });
      return r;
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, []);

  const buscar = useCallback(async (id) => {
    if (!id) return null;
    setLoading(true); setError(null);
    try { const r = await produtoService.buscar(id); setProduto(r); return r; }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, []);

  const criar = useCallback(async (dados) => {
    setLoading(true); setError(null);
    try { return await produtoService.criar(dados); }
    catch (err) { setError(err.message); throw err; }
    finally { setLoading(false); }
  }, []);

  const atualizar = useCallback(async (id, dados) => {
    setLoading(true); setError(null);
    try { return await produtoService.atualizar(id, dados); }
    catch (err) { setError(err.message); throw err; }
    finally { setLoading(false); }
  }, []);

  const excluir = useCallback(async (id) => {
    setLoading(true); setError(null);
    try { await produtoService.excluir(id); }
    catch (err) { setError(err.message); throw err; }
    finally { setLoading(false); }
  }, []);

  return { produtos, produto, loading, error, paginacao, listar, buscar, criar, atualizar, excluir };
}
