// ============================================
// HOOK: useProdutos
// ============================================
// Gerencia estado e operações de produtos no componente.

import { useState, useCallback } from 'react';
import { produtoService } from '../services/produtoService';
import { useAuth } from './useAuth';

export function useProdutos() {
  const { user } = useAuth();
  const [produtos, setProdutos] = useState([]);
  const [produto, setProduto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paginacao, setPaginacao] = useState({
    total: 0,
    pagina: 1,
    totalPaginas: 0,
  });

  const listar = useCallback(async (filtros = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await produtoService.listar(filtros);
      setProdutos(result.produtos);
      setPaginacao({
        total: result.total,
        pagina: result.pagina,
        totalPaginas: result.totalPaginas,
      });
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const buscar = useCallback(async (id) => {
    if (!id) return null;
    setLoading(true);
    setError(null);
    try {
      const result = await produtoService.buscar(id);
      setProduto(result);
      return result;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const criar = useCallback(async (dados) => {
    setLoading(true);
    setError(null);
    try {
      const result = await produtoService.criar(dados, user.id);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const atualizar = useCallback(async (id, dados) => {
    setLoading(true);
    setError(null);
    try {
      const result = await produtoService.atualizar(id, dados, user.id);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const desativar = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const result = await produtoService.desativar(id, user.id);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const reativar = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const result = await produtoService.reativar(id, user.id);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const excluir = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      await produtoService.excluir(id, user.id);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const gerarRelatorioImpressao = useCallback(() => {
    window.print();
  }, []);

  return {
    produtos,
    produto,
    loading,
    error,
    paginacao,
    listar,
    buscar,
    criar,
    atualizar,
    desativar,
    reativar,
    excluir,
    gerarRelatorioImpressao
  };
}
