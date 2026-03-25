// ============================================
// HOOK: useNotificacoes
// ============================================
// Polling resiliente com retry, backoff, detecção
// online/offline e visibilidade de aba.

import { useState, useCallback, useEffect, useRef } from 'react';
import { notificacaoService } from '../services/notificacaoService';
import { useAuth } from './useAuth';

const POLLING_INTERVAL = 120_000;      // 120s normal (2 min)
const MAX_BACKOFF_INTERVAL = 300_000;  // 5min máximo entre retries
const MAX_CONSECUTIVE_ERRORS = 5;      // Após 5 erros, entra em backoff máximo

export function useNotificacoes() {
  const { isAuthenticated } = useAuth();
  const [notificacoes, setNotificacoes] = useState([]);
  const [naoLidas, setNaoLidas] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pollingStatus, setPollingStatus] = useState('idle'); // idle | active | paused | error
  const [paginacao, setPaginacao] = useState({
    total: 0,
    pagina: 1,
    totalPaginas: 0,
  });

  const consecutiveErrors = useRef(0);
  const intervalRef = useRef(null);
  const isOnline = useRef(navigator.onLine);
  const isVisible = useRef(!document.hidden);

  // Calcula intervalo com backoff exponencial
  const getBackoffInterval = useCallback(() => {
    if (consecutiveErrors.current === 0) return POLLING_INTERVAL;
    const backoff = POLLING_INTERVAL * Math.pow(2, consecutiveErrors.current);
    return Math.min(backoff, MAX_BACKOFF_INTERVAL);
  }, []);

  // Busca contagem de não lidas com tratamento de erro
  const atualizarContagem = useCallback(async () => {
    try {
      const count = await notificacaoService.contarNaoLidas();
      setNaoLidas(count);

      // Reset de erros consecutivos em caso de sucesso
      if (consecutiveErrors.current > 0) {
        console.info('[Notificacoes] Polling recuperado após', consecutiveErrors.current, 'erro(s)');
        consecutiveErrors.current = 0;
        setPollingStatus('active');
      }

      return true;
    } catch (err) {
      consecutiveErrors.current += 1;

      if (consecutiveErrors.current === 1) {
        console.warn('[Notificacoes] Erro no polling:', err.message || err);
      } else if (consecutiveErrors.current <= MAX_CONSECUTIVE_ERRORS) {
        console.warn(
          `[Notificacoes] Erro consecutivo #${consecutiveErrors.current}:`,
          err.message || err
        );
      } else if (consecutiveErrors.current === MAX_CONSECUTIVE_ERRORS + 1) {
        console.error(
          `[Notificacoes] ${MAX_CONSECUTIVE_ERRORS} erros consecutivos. Backoff máximo ativado (${MAX_BACKOFF_INTERVAL / 1000}s).`
        );
      }

      setPollingStatus('error');
      return false;
    }
  }, []);

  // Inicia/reinicia o polling com intervalo adaptativo
  const startPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    const interval = getBackoffInterval();
    setPollingStatus('active');

    intervalRef.current = setInterval(async () => {
      // Só executa se online E aba visível
      if (!isOnline.current || !isVisible.current) return;

      const success = await atualizarContagem();

      // Se houve erro, reinicia com novo intervalo (backoff)
      if (!success) {
        const newInterval = getBackoffInterval();
        if (newInterval !== interval) {
          clearInterval(intervalRef.current);
          intervalRef.current = setInterval(async () => {
            if (!isOnline.current || !isVisible.current) return;
            await atualizarContagem();
          }, newInterval);
        }
      }
    }, interval);

    return () => clearInterval(intervalRef.current);
  }, [atualizarContagem, getBackoffInterval]);

  // Efeito principal: gerencia polling baseado em auth
  useEffect(() => {
    if (!isAuthenticated) {
      setPollingStatus('idle');
      return;
    }

    // Execução imediata
    atualizarContagem();
    const cleanup = startPolling();

    return () => {
      cleanup();
      intervalRef.current = null;
    };
  }, [isAuthenticated, atualizarContagem, startPolling]);

  // Efeito: detecta online/offline
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleOnline = () => {
      isOnline.current = true;
      console.info('[Notificacoes] Conexão restaurada. Retomando polling...');
      consecutiveErrors.current = 0;
      atualizarContagem();
      startPolling();
    };

    const handleOffline = () => {
      isOnline.current = false;
      setPollingStatus('paused');
      console.warn('[Notificacoes] Sem conexão. Polling pausado.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isAuthenticated, atualizarContagem, startPolling]);

  // Efeito: detecta visibilidade da aba
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleVisibilityChange = () => {
      isVisible.current = !document.hidden;

      if (!document.hidden) {
        // Aba voltou ao foco — atualiza imediatamente e reinicia polling
        consecutiveErrors.current = 0;
        atualizarContagem();
        startPolling();
      } else {
        setPollingStatus('paused');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isAuthenticated, atualizarContagem, startPolling]);

  const listar = useCallback(async (filtros = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await notificacaoService.listar(filtros);
      setNotificacoes(result.notificacoes);
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

  const marcarComoLida = useCallback(async (id) => {
    try {
      await notificacaoService.marcarComoLida(id);
      setNotificacoes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, lida: true } : n))
      );
      setNaoLidas((prev) => Math.max(0, prev - 1));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const marcarTodasComoLidas = useCallback(async () => {
    try {
      await notificacaoService.marcarTodasComoLidas();
      setNotificacoes((prev) => prev.map((n) => ({ ...n, lida: true })));
      setNaoLidas(0);
    } catch (err) {
      setError(err.message);
      throw err;
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
      throw err;
    } finally {
      setLoading(false);
    }
  }, [atualizarContagem]);

  return {
    notificacoes,
    naoLidas,
    loading,
    error,
    pollingStatus,
    paginacao,
    listar,
    marcarComoLida,
    marcarTodasComoLidas,
    verificarVencimentos,
    atualizarContagem,
  };
}
