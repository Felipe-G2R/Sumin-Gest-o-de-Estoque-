import { useState, useCallback } from 'react';
import { movimentacaoService } from '../services/movimentacaoService';
import { useAuth } from './useAuth';

export function useMovimentacoes() {
  const { user } = useAuth();
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paginacao, setPaginacao] = useState({ total: 0, pagina: 1, totalPaginas: 0 });

  const listar = useCallback(async (filtros = {}) => {
    setLoading(true); setError(null);
    try {
      const r = await movimentacaoService.listar(filtros);
      setMovimentacoes(r.movimentacoes);
      setPaginacao({ total: r.total, pagina: r.pagina, totalPaginas: r.totalPaginas });
      return r;
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, []);

  const registrarEntrada = useCallback(async (dados) => {
    setLoading(true); setError(null);
    try { return await movimentacaoService.registrarEntrada(dados, user?.id); }
    catch (err) { setError(err.message); throw err; }
    finally { setLoading(false); }
  }, [user]);

  const registrarSaida = useCallback(async (dados) => {
    setLoading(true); setError(null);
    try { return await movimentacaoService.registrarSaida(dados, user?.id); }
    catch (err) { setError(err.message); throw err; }
    finally { setLoading(false); }
  }, [user]);

  return { movimentacoes, loading, error, paginacao, listar, registrarEntrada, registrarSaida };
}
