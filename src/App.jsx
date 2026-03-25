// ============================================
// APP — Configuração de Rotas
// ============================================
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './hooks/useAuth';
import LoginPage from './pages/LoginPage';

// Lazy imports — só carrega quando autenticado
import { lazy, Suspense } from 'react';
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ProdutosPage = lazy(() => import('./pages/ProdutosPage'));
const ProdutoFormPage = lazy(() => import('./pages/ProdutoFormPage'));
const ProdutoDetalhesPage = lazy(() => import('./pages/ProdutoDetalhesPage'));
const FornecedoresPage = lazy(() => import('./pages/FornecedoresPage'));
const FornecedorFormPage = lazy(() => import('./pages/FornecedorFormPage'));
const FornecedorDetalhesPage = lazy(() => import('./pages/FornecedorDetalhesPage'));
const MovimentacoesPage = lazy(() => import('./pages/MovimentacoesPage'));
const MovimentacaoFormPage = lazy(() => import('./pages/MovimentacaoFormPage'));
const NotificacoesPage = lazy(() => import('./pages/NotificacoesPage'));
const AdminLogsPage = lazy(() => import('./pages/AdminLogsPage'));
const AdminUsuariosPage = lazy(() => import('./pages/AdminUsuariosPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const LocaisPage = lazy(() => import('./pages/LocaisPage'));
const LocalFormPage = lazy(() => import('./pages/LocalFormPage'));
const InventarioPage = lazy(() => import('./pages/InventarioPage'));
const InventarioContagemPage = lazy(() => import('./pages/InventarioContagemPage'));
const RelatoriosPage = lazy(() => import('./pages/RelatoriosPage'));
const SugestoesCompraPage = lazy(() => import('./pages/SugestoesCompraPage'));
const SuperAdminPage = lazy(() => import('./pages/SuperAdminPage'));

function LoadingSpinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--neutral-900, #0F172A)' }}>
      <div style={{ width: 40, height: 40, border: '3px solid transparent', borderTopColor: 'var(--brand-500, #0D9488)', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
    </div>
  );
}

// Barreira total: sem login = só vê LoginPage. Ponto.
function AppRoutes() {
  const { isAuthenticated, isAdmin, isSuperAdmin, loading } = useAuth();

  // Carregando auth — mostra spinner por no máximo 3s
  if (loading) return <LoadingSpinner />;

  // NÃO AUTENTICADO — só login existe
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // AUTENTICADO — todas as rotas disponíveis
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {/* Dashboard */}
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/perfil" element={<ProfilePage />} />

        {/* Produtos */}
        <Route path="/produtos" element={<ProdutosPage />} />
        <Route path="/produtos/novo" element={<ProdutoFormPage />} />
        <Route path="/produtos/:id" element={<ProdutoDetalhesPage />} />
        <Route path="/produtos/:id/editar" element={<ProdutoFormPage />} />

        {/* Fornecedores */}
        <Route path="/fornecedores" element={<FornecedoresPage />} />
        <Route path="/fornecedores/novo" element={<FornecedorFormPage />} />
        <Route path="/fornecedores/:id" element={<FornecedorDetalhesPage />} />
        <Route path="/fornecedores/:id/editar" element={<FornecedorFormPage />} />

        {/* Movimentações */}
        <Route path="/movimentacoes" element={<MovimentacoesPage />} />
        <Route path="/movimentacoes/entrada" element={<MovimentacaoFormPage tipo="ENTRADA" />} />
        <Route path="/movimentacoes/saida" element={<MovimentacaoFormPage tipo="SAIDA" />} />

        {/* Locais */}
        <Route path="/locais" element={<LocaisPage />} />
        <Route path="/locais/novo" element={<LocalFormPage />} />
        <Route path="/locais/:id/editar" element={<LocalFormPage />} />

        {/* Inventário */}
        <Route path="/inventario" element={<InventarioPage />} />
        <Route path="/inventario/:id/contagem" element={<InventarioContagemPage />} />

        {/* Relatórios */}
        <Route path="/relatorios" element={<RelatoriosPage />} />
        <Route path="/sugestoes-compra" element={<SugestoesCompraPage />} />

        {/* Notificações */}
        <Route path="/notificacoes" element={<NotificacoesPage />} />

        {/* Admin */}
        {isAdmin && <Route path="/admin/logs" element={<AdminLogsPage />} />}
        {isAdmin && <Route path="/admin/usuarios" element={<AdminUsuariosPage />} />}

        {/* Super Admin */}
        {isSuperAdmin && <Route path="/super-admin" element={<SuperAdminPage />} />}

        {/* Qualquer outra rota → dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{
          style: { fontSize: 13, borderRadius: 'var(--radius-md)' },
          duration: 3000,
        }} />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
