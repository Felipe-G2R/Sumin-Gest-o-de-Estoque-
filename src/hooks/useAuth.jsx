// ============================================
// AUTH CONTEXT & HOOK — v3 blindado
// ============================================
import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { authService } from '../services/authService';
import { supabase } from '../lib/supabase';
import { ROLES } from '../lib/constants';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const currentUidRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    let processing = false;

    async function handleSession(newSession) {
      if (!mounted) return;

      // Sem sessão
      if (!newSession?.user) {
        currentUidRef.current = null;
        setUser(null);
        setProfile(null);
        setSession(null);
        setLoading(false);
        return;
      }

      const uid = newSession.user.id;

      // Mesmo user já carregado — só atualizar sessão
      if (uid === currentUidRef.current) {
        setSession(newSession);
        setLoading(false);
        return;
      }

      // Evitar duplicado — mas SEMPRE liberar o lock no finally
      if (processing) return;
      processing = true;

      try {
        let perfil = null;
        try {
          perfil = await authService.getProfile(uid);
        } catch { /* silêncio */ }

        if (!mounted) return;

        if (perfil) {
          currentUidRef.current = uid;
          setSession(newSession);
          setUser(newSession.user);
          setProfile(perfil);
        } else {
          currentUidRef.current = null;
          try { await supabase.auth.signOut(); } catch {}
          setUser(null);
          setProfile(null);
          setSession(null);
        }
      } finally {
        processing = false;
        if (mounted) setLoading(false);
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => { handleSession(newSession); }
    );

    const safety = setTimeout(() => { if (mounted) setLoading(false); }, 3000);

    return () => {
      mounted = false;
      processing = false;
      clearTimeout(safety);
      subscription?.unsubscribe();
    };
  }, []);

  async function login({ email, senha }) {
    currentUidRef.current = null;
    return await authService.login({ email, senha });
  }

  async function logout() {
    currentUidRef.current = null;
    try { await supabase.auth.signOut(); } catch {}
    setUser(null);
    setProfile(null);
    setSession(null);
  }

  async function register({ nome, email, senha }) {
    return await authService.register({ nome, email, senha });
  }

  async function updateProfile(updates) {
    if (!profile?.id) return;
    const updated = await authService.updateProfile(profile.id, updates);
    setProfile(updated);
    return updated;
  }

  async function uploadAvatar(file) {
    if (!profile?.id) return;
    return await authService.uploadAvatar(profile.id, file);
  }

  const isSuperAdmin = profile?.role === ROLES.SUPER_ADMIN;
  const isAdmin = isSuperAdmin || profile?.role === ROLES.ADMIN;
  const isAuthenticated = !!session && !!user && !!profile;
  const lojaId = profile?.loja_id;

  return (
    <AuthContext.Provider value={{
      user, profile, session, loading,
      isAdmin, isSuperAdmin, isAuthenticated, lojaId,
      login, register, logout, updateProfile, uploadAvatar,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  return context;
}
