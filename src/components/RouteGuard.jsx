// ============================================
// ROUTE GUARD — Proteção de Rotas
// ============================================
// Componentes para proteger rotas baseado em autenticação e roles.

import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * Protege rotas que exigem autenticação
 * Redireciona para /login se não estiver logado
 */
export function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  console.log('ProtectedRoute: auth:', isAuthenticated, 'loading:', loading);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

/**
 * Protege rotas que exigem role ADMIN
 * Redireciona para /dashboard se não for admin
 */
export function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  console.log('AdminRoute: auth:', isAuthenticated, 'admin:', isAdmin, 'loading:', loading);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

/**
 * Protege rotas que exigem role SUPER_ADMIN
 */
export function SuperAdminRoute({ children }) {
  const { isAuthenticated, isSuperAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isSuperAdmin) return <Navigate to="/dashboard" replace />;

  return children;
}

/**
 * Redireciona para /dashboard se já estiver logado
 * Usado nas páginas de login/registro
 */
export function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  console.log('PublicRoute: auth:', isAuthenticated, 'loading:', loading);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
