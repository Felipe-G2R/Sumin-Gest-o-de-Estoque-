// ============================================
// ROUTE GUARD — Proteção de Rotas
// ============================================
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useState, useEffect } from 'react';

// Spinner com timeout: se demorar mais que 3s, manda pro login
function AuthLoading() {
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (timedOut) return <Navigate to="/login" replace />;

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--neutral-900, #0F172A)' }}>
      <div className="animate-spin rounded-full" style={{ width: 40, height: 40, border: '3px solid transparent', borderTopColor: 'var(--brand-500, #0D9488)', borderRadius: '50%' }} />
    </div>
  );
}

export function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <AuthLoading />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return children;
}

export function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) return <AuthLoading />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  return children;
}

export function SuperAdminRoute({ children }) {
  const { isAuthenticated, isSuperAdmin, loading } = useAuth();

  if (loading) return <AuthLoading />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isSuperAdmin) return <Navigate to="/dashboard" replace />;

  return children;
}

export function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <AuthLoading />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return children;
}
