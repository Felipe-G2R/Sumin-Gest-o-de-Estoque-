import { useState, useCallback } from 'react';
import { inventarioService } from '../services/inventarioService';
import { useAuth } from './useAuth';

export function useInventario() {
  const { user } = useAuth();
  const [inventarios, setInventarios] = useState([]);
  const [inventario, setInventario] = useState(null);
  const [itens, setItens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const listar = useCallback(async (filtros = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await inventarioService.listar(filtros);
      setInventarios(result.inventarios);
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
      const result = await inventarioService.buscar(id);
      setInventario(result);
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
      return await inventarioService.criar({ ...dados, usuario_id: user.id });
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const carregarItens = useCallback(async (inventarioId, localId) => {
    setLoading(true);
    try {
      const result = await inventarioService.carregarProdutosParaContagem(inventarioId, localId);
      setItens(result);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const salvarContagem = useCallback(async (inventarioId, itensContados) => {
    setLoading(true);
    try {
      return await inventarioService.salvarContagem(inventarioId, itensContados);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const finalizar = useCallback(async (inventarioId, aplicarAjustes) => {
    setLoading(true);
    try {
      return await inventarioService.finalizar(inventarioId, aplicarAjustes);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelar = useCallback(async (inventarioId) => {
    setLoading(true);
    try {
      return await inventarioService.cancelar(inventarioId);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { inventarios, inventario, itens, setItens, loading, error, listar, buscar, criar, carregarItens, salvarContagem, finalizar, cancelar };
}
