// ============================================
// AUTH CONTEXT & HOOK
// ============================================
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authService } from '../services/authService';
import { ROLES } from '../lib/constants';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (uid, userObj) => {
    try {
      const perfil = await authService.getProfile(uid);
      if (perfil) { setProfile(perfil); return perfil; }
    } catch { /* silêncio */ }
    if (userObj) {
      const fallback = {
        id: uid,
        nome: userObj.user_metadata?.nome || 'Usuário',
        email: userObj.email,
        role: 'USER',
        ativo: true,
      };
      setProfile(fallback);
      return fallback;
    }
    return null;
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

        setSession(newSession);

        if (newSession?.user) {
          setUser(newSession.user);
          await fetchProfile(newSession.user.id, newSession.user);
        } else {
          setUser(null);
          setProfile(null);
        }

        setLoading(false);
      }
    );

    // Safety timeout silencioso
    const safety = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 3000);

    return () => {
      mounted = false;
      clearTimeout(safety);
      subscription?.unsubscribe();
    };
  }, [fetchProfile]);

  async function login({ email, senha }) {
    return await authService.login({ email, senha });
  }

  async function register({ nome, email, senha }) {
    return await authService.register({ nome, email, senha });
  }

  async function logout() {
    try { await authService.logout(); } catch { /* silêncio */ }
    setUser(null);
    setProfile(null);
    setSession(null);
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
  const isAuthenticated = !!session && !!user;
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
