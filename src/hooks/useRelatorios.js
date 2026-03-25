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
    setLoading(true); setError(null);
    try { const r = await relatorioService.getConsumo(dias); setConsumo(r); return r; }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, []);

  const carregarCurvaABC = useCallback(async (dias = 90) => {
    setLoading(true); setError(null);
    try { const r = await relatorioService.getCurvaABC(dias); setCurvaABC(r); return r; }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, []);

  const carregarPrevisaoVencimento = useCallback(async () => {
    setLoading(true); setError(null);
    try { const r = await relatorioService.getPrevisaoVencimento(); setPrevisaoVencimento(r); return r; }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, []);

  const carregarSugestoesCompra = useCallback(async () => {
    setLoading(true); setError(null);
    try { const r = await relatorioService.getSugestoesCompra(); setSugestoesCompra(r); return r; }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, []);

  const carregarCustoProcedimento = useCallback(async (dias = 30) => {
    setLoading(true); setError(null);
    try { const r = await relatorioService.getCustoPorProcedimento(dias); setCustoProcedimento(r); return r; }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, []);

  const carregarDistribuicaoCategorias = useCallback(async () => {
    setLoading(true); setError(null);
    try { const r = await relatorioService.getDistribuicaoCategorias(); setDistribuicaoCategorias(r); return r; }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, []);

  return {
    consumo, curvaABC, previsaoVencimento, sugestoesCompra, custoProcedimento, distribuicaoCategorias,
    loading, error,
    carregarConsumo, carregarCurvaABC, carregarPrevisaoVencimento,
    carregarSugestoesCompra, carregarCustoProcedimento, carregarDistribuicaoCategorias,
  };
}
