// ============================================
// AUTH CONTEXT & HOOK — Versão estável
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
  const processingRef = useRef(false);
  const currentUidRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    async function loadProfile(uid) {
      try {
        const perfil = await authService.getProfile(uid);
        return perfil || null;
      } catch {
        return null;
      }
    }

    async function handleSession(newSession) {
      if (!mounted) return;

      // Sem sessão — limpar tudo
      if (!newSession?.user) {
        currentUidRef.current = null;
        setUser(null);
        setProfile(null);
        setSession(null);
        setLoading(false);
        return;
      }

      const uid = newSession.user.id;

      // Mesmo user que já está carregado — ignorar (evita loop)
      if (uid === currentUidRef.current && profile) {
        setLoading(false);
        return;
      }

      // Evitar processamento duplicado
      if (processingRef.current) return;
      processingRef.current = true;

      const perfil = await loadProfile(uid);

      if (!mounted) { processingRef.current = false; return; }

      if (perfil) {
        currentUidRef.current = uid;
        setSession(newSession);
        setUser(newSession.user);
        setProfile(perfil);
      } else {
        // User não existe no banco — sessão órfã
        currentUidRef.current = null;
        try { await supabase.auth.signOut(); } catch {}
        setUser(null);
        setProfile(null);
        setSession(null);
      }

      processingRef.current = false;
      if (mounted) setLoading(false);
    }

    // Listener único
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => { handleSession(newSession); }
    );

    // Safety
    const safety = setTimeout(() => { if (mounted) setLoading(false); }, 3000);

    return () => {
      mounted = false;
      clearTimeout(safety);
      subscription?.unsubscribe();
    };
  }, []);

  async function login({ email, senha }) {
    processingRef.current = false; // Reset para permitir processamento
    currentUidRef.current = null;
    return await authService.login({ email, senha });
  }

  async function logout() {
    currentUidRef.current = null;
    processingRef.current = false;
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
    const updatedProfile = await authService.updateProfile(profile.id, updates);
    setProfile(updatedProfile);
    return updatedProfile;
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
