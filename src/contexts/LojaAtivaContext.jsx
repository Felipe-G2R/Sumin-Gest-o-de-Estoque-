// ============================================
// LOJA ATIVA CONTEXT — Multi-tenant UX layer
// SUPER_ADMIN escolhe loja ativa. Usuários comuns ficam travados na sua loja.
// ============================================
import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { lojaService } from '../services/lojaService';
import { ROLES } from '../lib/constants';

const STORAGE_KEY = 'sumin:loja-ativa';
const GERAL = '__GERAL__';

const LojaAtivaContext = createContext(null);

export function LojaAtivaProvider({ children }) {
  const { profile, isSuperAdmin, isAuthenticated } = useAuth();
  const [lojas, setLojas] = useState([]);
  const [loadingLojas, setLoadingLojas] = useState(false);

  // Persistência da loja ativa (apenas para SUPER_ADMIN).
  const [storedLojaId, setStoredLojaId] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) ?? GERAL; }
    catch { return GERAL; }
  });

  // Carregar lojas só uma vez por sessão autenticada.
  useEffect(() => {
    if (!isAuthenticated) {
      setLojas([]);
      return;
    }
    let cancel = false;
    setLoadingLojas(true);
    lojaService.listar()
      .then(data => { if (!cancel) setLojas(data || []); })
      .catch(() => { if (!cancel) setLojas([]); })
      .finally(() => { if (!cancel) setLoadingLojas(false); });
    return () => { cancel = true; };
  }, [isAuthenticated]);

  // Para usuários comuns, a loja ativa é SEMPRE a do perfil. Sem dropdown.
  const lojaAtivaId = useMemo(() => {
    if (!profile) return null;
    if (profile.role !== ROLES.SUPER_ADMIN) return profile.loja_id ?? null;
    // SUPER_ADMIN — respeita escolha; '__GERAL__' vira null
    if (!storedLojaId || storedLojaId === GERAL) return null;
    return storedLojaId;
  }, [profile, storedLojaId]);

  const modoGeral = isSuperAdmin && lojaAtivaId === null;
  const lojaAtiva = useMemo(
    () => lojas.find(l => l.id === lojaAtivaId) ?? null,
    [lojas, lojaAtivaId]
  );

  const setLojaAtivaId = useCallback((novoId) => {
    if (!isSuperAdmin) return; // travado para os demais
    const valor = novoId ?? GERAL;
    setStoredLojaId(valor);
    try { localStorage.setItem(STORAGE_KEY, valor); } catch { /* */ }
  }, [isSuperAdmin]);

  const value = useMemo(() => ({
    lojas,
    loadingLojas,
    lojaAtivaId,
    lojaAtiva,
    modoGeral,
    setLojaAtivaId,
    podeAlternar: isSuperAdmin,
  }), [lojas, loadingLojas, lojaAtivaId, lojaAtiva, modoGeral, setLojaAtivaId, isSuperAdmin]);

  return (
    <LojaAtivaContext.Provider value={value}>
      {children}
    </LojaAtivaContext.Provider>
  );
}

export function useLojaAtiva() {
  const ctx = useContext(LojaAtivaContext);
  if (!ctx) throw new Error('useLojaAtiva deve ser usado dentro de um LojaAtivaProvider');
  return ctx;
}
