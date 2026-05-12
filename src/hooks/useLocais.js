import { useState, useCallback } from 'react';
import { localService } from '../services/localService';
import { useLojaAtiva } from '../contexts/LojaAtivaContext';

export function useLocais() {
  const { lojaAtivaId } = useLojaAtiva();
  const [locais, setLocais] = useState([]);
  const [local, setLocal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const listar = useCallback(async (filtros = {}) => {
    setLoading(true); setError(null);
    try {
      const r = await localService.listar({ ...filtros, lojaId: filtros.lojaId ?? lojaAtivaId });
      setLocais(r.locais);
      return r;
    }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [lojaAtivaId]);

  const listarAtivos = useCallback(async () => {
    try { return await localService.listarAtivos(lojaAtivaId); }
    catch (err) { setError(err.message); return []; }
  }, [lojaAtivaId]);

  const buscar = useCallback(async (id) => {
    if (!id) return null;
    setLoading(true); setError(null);
    try { const r = await localService.buscar(id); setLocal(r); return r; }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, []);

  const criar = useCallback(async (dados) => {
    setLoading(true); setError(null);
    try { return await localService.criar(dados, lojaAtivaId); }
    catch (err) { setError(err.message); throw err; }
    finally { setLoading(false); }
  }, [lojaAtivaId]);

  const atualizar = useCallback(async (id, dados) => {
    setLoading(true); setError(null);
    try { return await localService.atualizar(id, dados); }
    catch (err) { setError(err.message); throw err; }
    finally { setLoading(false); }
  }, []);

  const desativar = useCallback(async (id) => {
    setLoading(true); setError(null);
    try { await localService.desativar(id); }
    catch (err) { setError(err.message); throw err; }
    finally { setLoading(false); }
  }, []);

  const reativar = useCallback(async (id) => {
    setLoading(true); setError(null);
    try { await localService.reativar(id); }
    catch (err) { setError(err.message); throw err; }
    finally { setLoading(false); }
  }, []);

  return { locais, local, loading, error, listar, listarAtivos, buscar, criar, atualizar, desativar, reativar };
}
