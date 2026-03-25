// ============================================
// HOOK: useNotificacoes — Polling simples e seguro
// ============================================
import { useState, useCallback, useEffect, useRef } from 'react';
import { notificacaoService } from '../services/notificacaoService';
import { useAuth } from './useAuth';

const POLL_INTERVAL = 120_000; // 2 min

export function useNotificacoes() {
  const { isAuthenticated } = useAuth();
  const [notificacoes, setNotificacoes] = useState([]);
  const [naoLidas, setNaoLidas] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paginacao, setPaginacao] = useState({ total: 0, pagina: 1, totalPaginas: 0 });
  const intervalRef = useRef(null);

  const atualizarContagem = useCallback(async () => {
    try {
      const count = await notificacaoService.contarNaoLidas();
      setNaoLidas(count);
    } catch { /* silêncio */ }
  }, []);

  // Polling único — um setInterval, limpo no unmount
  useEffect(() => {
    if (!isAuthenticated) return;

    atualizarContagem();
    intervalRef.current = setInterval(atualizarContagem, POLL_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isAuthenticated, atualizarContagem]);

  const listar = useCallback(async (filtros = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await notificacaoService.listar(filtros);
      setNotificacoes(result.notificacoes);
      setPaginacao({ total: result.total, pagina: result.pagina, totalPaginas: result.totalPaginas });
      return result;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const marcarComoLida = useCallback(async (id) => {
    try {
      await notificacaoService.marcarComoLida(id);
      setNotificacoes(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n));
      setNaoLidas(prev => Math.max(0, prev - 1));
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const marcarTodasComoLidas = useCallback(async () => {
    try {
      await notificacaoService.marcarTodasComoLidas();
      setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })));
      setNaoLidas(0);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const verificarVencimentos = useCallback(async () => {
    setLoading(true);
    try {
      const result = await notificacaoService.verificarVencimentos();
      await atualizarContagem();
      return result;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [atualizarContagem]);

  return {
    notificacoes, naoLidas, loading, error, paginacao,
    listar, marcarComoLida, marcarTodasComoLidas, verificarVencimentos, atualizarContagem,
  };
}
