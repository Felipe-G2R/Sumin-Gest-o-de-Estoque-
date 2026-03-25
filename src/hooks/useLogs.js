import { useState, useCallback } from 'react';
import { logService } from '../services/logService';

export function useLogs() {
  const [logs, setLogs] = useState([]);
  const [log, setLog] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paginacao, setPaginacao] = useState({ total: 0, pagina: 1, totalPaginas: 0 });

  const listar = useCallback(async (filtros = {}) => {
    setLoading(true); setError(null);
    try {
      const r = await logService.listar(filtros);
      setLogs(r.logs);
      setPaginacao({ total: r.total, pagina: r.pagina, totalPaginas: r.totalPaginas });
      return r;
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, []);

  const buscar = useCallback(async (id) => {
    if (!id) return null;
    setLoading(true); setError(null);
    try { const r = await logService.buscar(id); setLog(r); return r; }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, []);

  const exportar = useCallback(async (filtros = {}) => {
    setLoading(true); setError(null);
    try {
      const data = await logService.exportar(filtros);
      if (!data || data.length === 0) return;

      const headers = ['Data/Hora', 'Usuário', 'Ação', 'Entidade', 'Dados Anteriores', 'Dados Novos'];
      const rows = data.map(l => [
        new Date(l.criado_em).toLocaleString('pt-BR'),
        l.usuario?.nome || 'Sistema',
        l.acao, l.entidade,
        JSON.stringify(l.dados_anteriores || {}),
        JSON.stringify(l.dados_novos || {}),
      ]);

      const csv = [headers.join(';'), ...rows.map(r => r.map(c => `"${c}"`).join(';'))].join('\n');
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `logs_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, []);

  return { logs, log, loading, error, paginacao, listar, buscar, exportar };
}
