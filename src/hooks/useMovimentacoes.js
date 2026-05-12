import { useState, useCallback } from 'react';
import { movimentacaoService } from '../services/movimentacaoService';
import { useAuth } from './useAuth';
import { useLojaAtiva } from '../contexts/LojaAtivaContext';

export function useMovimentacoes() {
  const { user } = useAuth();
  const { lojaAtivaId } = useLojaAtiva();
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paginacao, setPaginacao] = useState({ total: 0, pagina: 1, totalPaginas: 0 });

  const listar = useCallback(async (filtros = {}) => {
    setLoading(true); setError(null);
    try {
      const r = await movimentacaoService.listar({ ...filtros, lojaId: filtros.lojaId ?? lojaAtivaId });
      setMovimentacoes(r.movimentacoes);
      setPaginacao({ total: r.total, pagina: r.pagina, totalPaginas: r.totalPaginas });
      return r;
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [lojaAtivaId]);

  const registrarEntrada = useCallback(async (dados) => {
    setLoading(true); setError(null);
    try { return await movimentacaoService.registrarEntrada(dados, user?.id, lojaAtivaId); }
    catch (err) { setError(err.message); throw err; }
    finally { setLoading(false); }
  }, [user, lojaAtivaId]);

  const registrarSaida = useCallback(async (dados) => {
    setLoading(true); setError(null);
    try { return await movimentacaoService.registrarSaida(dados, user?.id, lojaAtivaId); }
    catch (err) { setError(err.message); throw err; }
    finally { setLoading(false); }
  }, [user, lojaAtivaId]);

  return { movimentacoes, loading, error, paginacao, listar, registrarEntrada, registrarSaida };
}
