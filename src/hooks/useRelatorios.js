import { useState, useCallback } from 'react';
import { relatorioService } from '../services/relatorioService';

export function useRelatorios() {
  const [consumo, setConsumo] = useState([]);
  const [curvaABC, setCurvaABC] = useState([]);
  const [previsaoVencimento, setPrevisaoVencimento] = useState([]);
  const [sugestoesCompra, setSugestoesCompra] = useState([]);
  const [custoProcedimento, setCustoProcedimento] = useState([]);
  const [distribuicaoCategorias, setDistribuicaoCategorias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const carregarConsumo = useCallback(async (dias = 30) => {
    setLoading(true);
    setError(null);
    try {
      const result = await relatorioService.getConsumo(dias);
      setConsumo(result);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const carregarCurvaABC = useCallback(async (dias = 90) => {
    setLoading(true);
    setError(null);
    try {
      const result = await relatorioService.getCurvaABC(dias);
      setCurvaABC(result);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const carregarPrevisaoVencimento = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await relatorioService.getPrevisaoVencimento();
      setPrevisaoVencimento(result);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const carregarSugestoesCompra = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await relatorioService.getSugestoesCompra();
      setSugestoesCompra(result);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const carregarCustoProcedimento = useCallback(async (dias = 30) => {
    setLoading(true);
    setError(null);
    try {
      const result = await relatorioService.getCustoPorProcedimento(dias);
      setCustoProcedimento(result);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const carregarDistribuicaoCategorias = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await relatorioService.getDistribuicaoCategorias();
      setDistribuicaoCategorias(result);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    consumo, curvaABC, previsaoVencimento, sugestoesCompra, custoProcedimento, distribuicaoCategorias,
    loading, error,
    carregarConsumo, carregarCurvaABC, carregarPrevisaoVencimento,
    carregarSugestoesCompra, carregarCustoProcedimento, carregarDistribuicaoCategorias,
  };
}
