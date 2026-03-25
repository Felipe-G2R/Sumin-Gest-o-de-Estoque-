import { useState, useCallback } from 'react';
import { fornecedorService } from '../services/fornecedorService';
import { useAuth } from './useAuth';

export function useFornecedores() {
  const { user } = useAuth();
  const [fornecedores, setFornecedores] = useState([]);
  const [fornecedor, setFornecedor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paginacao, setPaginacao] = useState({ total: 0, pagina: 1, totalPaginas: 0 });

  const listar = useCallback(async (filtros = {}) => {
    setLoading(true); setError(null);
    try {
      const r = await fornecedorService.listar(filtros);
      setFornecedores(r.fornecedores);
      setPaginacao({ total: r.total, pagina: r.pagina, totalPaginas: r.totalPaginas });
      return r;
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, []);

  const listarAtivos = useCallback(async () => {
    try { return await fornecedorService.listarAtivos(); }
    catch (err) { setError(err.message); return []; }
  }, []);

  const buscar = useCallback(async (id) => {
    if (!id) return null;
    setLoading(true); setError(null);
    try { const r = await fornecedorService.buscar(id); setFornecedor(r); return r; }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, []);

  const criar = useCallback(async (dados) => {
    setLoading(true); setError(null);
    try { return await fornecedorService.criar(dados); }
    catch (err) { setError(err.message); throw err; }
    finally { setLoading(false); }
  }, []);

  const atualizar = useCallback(async (id, dados) => {
    setLoading(true); setError(null);
    try { return await fornecedorService.atualizar(id, dados); }
    catch (err) { setError(err.message); throw err; }
    finally { setLoading(false); }
  }, []);

  const desativar = useCallback(async (id) => {
    setLoading(true); setError(null);
    try { return await fornecedorService.desativar(id); }
    catch (err) { setError(err.message); throw err; }
    finally { setLoading(false); }
  }, []);

  const reativar = useCallback(async (id) => {
    setLoading(true); setError(null);
    try { return await fornecedorService.reativar(id); }
    catch (err) { setError(err.message); throw err; }
    finally { setLoading(false); }
  }, []);

  const excluir = useCallback(async (id) => {
    setLoading(true); setError(null);
    try { await fornecedorService.excluir(id); }
    catch (err) { setError(err.message); throw err; }
    finally { setLoading(false); }
  }, []);

  return { fornecedores, fornecedor, loading, error, paginacao, listar, listarAtivos, buscar, criar, atualizar, desativar, reativar, excluir };
}
