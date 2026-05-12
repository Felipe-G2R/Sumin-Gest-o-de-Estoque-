// ============================================
// HOOK: useDashboard
// ============================================

import { useState, useCallback } from 'react';
import { dashboardService } from '../services/dashboardService';
import { useLojaAtiva } from '../contexts/LojaAtivaContext';

export function useDashboard() {
  const { lojaAtivaId } = useLojaAtiva();
  const [stats, setStats] = useState(null);
  const [grafico, setGrafico] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const carregarStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await dashboardService.getStats(lojaAtivaId);
      setStats(result);
      return result;
    } catch (err) {
      console.error('Erro ao carregar stats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [lojaAtivaId]);

  const carregarGrafico = useCallback(async () => {
    try {
      const result = await dashboardService.getGraficoMovimentacoes(lojaAtivaId);
      setGrafico(result);
      return result;
    } catch (err) {
      console.error('Erro ao carregar gráfico:', err);
      setError(err.message);
    }
  }, [lojaAtivaId]);

  const carregarTudo = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsResult, graficoResult] = await Promise.all([
        dashboardService.getStats(lojaAtivaId),
        dashboardService.getGraficoMovimentacoes(lojaAtivaId),
      ]);
      setStats(statsResult);
      setGrafico(graficoResult);
      return { stats: statsResult, grafico: graficoResult };
    } catch (err) {
      console.error('Erro ao carregar dashboard completo:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [lojaAtivaId]);

  return {
    stats,
    grafico,
    loading,
    error,
    carregarStats,
    carregarGrafico,
    carregarTudo,
  };
}
