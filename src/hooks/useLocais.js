import { useState, useCallback } from 'react';
import { localService } from '../services/localService';

export function useLocais() {
  const [locais, setLocais] = useState([]);
  const [local, setLocal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const listar = useCallback(async (filtros = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await localService.listar(filtros);
      setLocais(result.locais);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const listarAtivos = useCallback(async () => {
    try {
      return await localService.listarAtivos();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const buscar = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const result = await localService.buscar(id);
      setLocal(result);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const criar = useCallback(async (dados) => {
    setLoading(true);
    try {
      const result = await localService.criar(dados);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const atualizar = useCallback(async (id, dados) => {
    setLoading(true);
    try {
      const result = await localService.atualizar(id, dados);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const desativar = useCallback(async (id) => {
    setLoading(true);
    try {
      await localService.desativar(id);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reativar = useCallback(async (id) => {
    setLoading(true);
    try {
      await localService.reativar(id);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { locais, local, loading, error, listar, listarAtivos, buscar, criar, atualizar, desativar, reativar };
}
