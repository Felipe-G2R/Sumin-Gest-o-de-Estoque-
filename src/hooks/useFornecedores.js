// ============================================
// HOOK: useFornecedores
// ============================================

import { useState, useCallback } from 'react';
import { fornecedorService } from '../services/fornecedorService';
import { useAuth } from './useAuth';

export function useFornecedores() {
  const { user } = useAuth();
  const [fornecedores, setFornecedores] = useState([]);
  const [fornecedor, setFornecedor] = useState(null);
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
      const result = await fornecedorService.listar(filtros);
      setFornecedores(result.fornecedores);
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

  const listarAtivos = useCallback(async () => {
    try {
      return await fornecedorService.listarAtivos();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const buscar = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fornecedorService.buscar(id);
      setFornecedor(result);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const criar = useCallback(async (dados) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fornecedorService.criar(dados, user.id);
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
      const result = await fornecedorService.atualizar(id, dados, user.id);
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
      const result = await fornecedorService.desativar(id, user.id);
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
      const result = await fornecedorService.reativar(id, user.id);
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
      await fornecedorService.excluir(id, user.id);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  return {
    fornecedores,
    fornecedor,
    loading,
    error,
    paginacao,
    listar,
    listarAtivos,
    buscar,
    criar,
    atualizar,
    desativar,
    reativar,
    excluir,
  };
}
