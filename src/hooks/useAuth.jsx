// ============================================
// AUTH CONTEXT & HOOK
// ============================================
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authService } from '../services/authService';
import { supabase } from '../lib/supabase';
import { ROLES } from '../lib/constants';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Busca perfil REAL no banco. Retorna null se não existe.
  const fetchProfile = useCallback(async (uid) => {
    try {
      const perfil = await authService.getProfile(uid);
      if (perfil) { setProfile(perfil); return perfil; }
    } catch { /* silêncio */ }
    return null;
  }, []);

  // Força logout local (limpa tudo sem chamar RPC)
  const forceLocalLogout = useCallback(async () => {
    try { await supabase.auth.signOut(); } catch { /* */ }
    setUser(null);
    setProfile(null);
    setSession(null);
  }, []);

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = authService.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return;

        if (event === 'TOKEN_REFRESHED') {
          setSession(newSession);
          if (newSession?.user) setUser(newSession.user);
          return;
        }

        if (newSession?.user) {
          // Tem sessão — verificar se o user existe no banco
          const perfil = await fetchProfile(newSession.user.id);

          if (!mounted) return;

          if (perfil) {
            // User válido — setar tudo
            setSession(newSession);
            setUser(newSession.user);
          } else {
            // SESSÃO ÓRFÃ — user não existe no banco. Limpar tudo.
            await forceLocalLogout();
          }
        } else {
          // Sem sessão — limpar estado
          setUser(null);
          setProfile(null);
          setSession(null);
        }

        if (mounted) setLoading(false);
      }
    );

    // Safety timeout
    const safety = setTimeout(() => { if (mounted) setLoading(false); }, 3000);

    return () => {
      mounted = false;
      clearTimeout(safety);
      subscription?.unsubscribe();
    };
  }, [fetchProfile, forceLocalLogout]);

  async function login({ email, senha }) {
    return await authService.login({ email, senha });
  }

  async function register({ nome, email, senha }) {
    return await authService.register({ nome, email, senha });
  }

  async function logout() {
    await forceLocalLogout();
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
