// ============================================
// HOOK: useMovimentacoes
// ============================================

import { useState, useCallback } from 'react';
import { movimentacaoService } from '../services/movimentacaoService';
import { useAuth } from './useAuth';

export function useMovimentacoes() {
  const { user } = useAuth();
  const [movimentacoes, setMovimentacoes] = useState([]);
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
      const result = await movimentacaoService.listar(filtros);
      setMovimentacoes(result.movimentacoes);
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

  const registrarEntrada = useCallback(async (dados) => {
    setLoading(true);
    setError(null);
    try {
      const result = await movimentacaoService.registrarEntrada(dados, user.id);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const registrarSaida = useCallback(async (dados) => {
    setLoading(true);
    setError(null);
    try {
      const result = await movimentacaoService.registrarSaida(dados, user.id);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  return {
    movimentacoes,
    loading,
    error,
    paginacao,
    listar,
    registrarEntrada,
    registrarSaida,
  };
}
