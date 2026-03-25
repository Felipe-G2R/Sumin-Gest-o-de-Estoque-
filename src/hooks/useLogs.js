// ============================================
// HOOK: useLogs
// ============================================

import { useState, useCallback } from 'react';
import { logService } from '../services/logService';

export function useLogs() {
  const [logs, setLogs] = useState([]);
  const [log, setLog] = useState(null);
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
      const result = await logService.listar(filtros);
      setLogs(result.logs);
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
    setLoading(true);
    setError(null);
    try {
      const result = await logService.buscar(id);
      setLog(result);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const exportar = useCallback(async (filtros = {}) => {
    setLoading(true);
    setError(null);
    try {
      const data = await logService.exportar(filtros);

      // Converte para CSV
      if (data.length === 0) return;

      const headers = [
        'Data/Hora',
        'Usuário',
        'Ação',
        'Entidade',
        'Dados Anteriores',
        'Dados Novos',
      ];

      const rows = data.map((log) => [
        new Date(log.criado_em).toLocaleString('pt-BR'),
        log.usuario?.nome || 'Sistema',
        log.acao,
        log.entidade,
        JSON.stringify(log.dados_anteriores || {}),
        JSON.stringify(log.dados_novos || {}),
      ]);

      const csv = [
        headers.join(';'),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(';')),
      ].join('\n');

      // Download
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `logs_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    logs,
    log,
    loading,
    error,
    paginacao,
    listar,
    buscar,
    exportar,
  };
}
