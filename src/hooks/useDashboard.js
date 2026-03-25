// ============================================
// HOOK: useDashboard
// ============================================

import { useState, useCallback } from 'react';
import { dashboardService } from '../services/dashboardService';

export function useDashboard() {
  const [stats, setStats] = useState(null);
  const [grafico, setGrafico] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const carregarStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await dashboardService.getStats();
      setStats(result);
      return result;
    } catch (err) {
      console.error('Erro ao carregar stats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const carregarGrafico = useCallback(async () => {
    try {
      const result = await dashboardService.getGraficoMovimentacoes();
      setGrafico(result);
      return result;
    } catch (err) {
      console.error('Erro ao carregar gráfico:', err);
      setError(err.message);
    }
  }, []);

  const carregarTudo = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsResult, graficoResult] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getGraficoMovimentacoes(),
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
  }, []);

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
