// ============================================
// APP — Configuração de Rotas (Atualizado)
// ============================================
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './hooks/useAuth';
import { ProtectedRoute, AdminRoute, SuperAdminRoute, PublicRoute } from './components/RouteGuard';

// --- Páginas ---
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProdutosPage from './pages/ProdutosPage';
import ProdutoFormPage from './pages/ProdutoFormPage';
import ProdutoDetalhesPage from './pages/ProdutoDetalhesPage';
import FornecedoresPage from './pages/FornecedoresPage';
import FornecedorFormPage from './pages/FornecedorFormPage';
import FornecedorDetalhesPage from './pages/FornecedorDetalhesPage';
import MovimentacoesPage from './pages/MovimentacoesPage';
import MovimentacaoFormPage from './pages/MovimentacaoFormPage';
import NotificacoesPage from './pages/NotificacoesPage';
import AdminLogsPage from './pages/AdminLogsPage';
import AdminUsuariosPage from './pages/AdminUsuariosPage';
import ProfilePage from './pages/ProfilePage';

// --- Novas Páginas ---
import LocaisPage from './pages/LocaisPage';
import LocalFormPage from './pages/LocalFormPage';
import InventarioPage from './pages/InventarioPage';
import InventarioContagemPage from './pages/InventarioContagemPage';
import RelatoriosPage from './pages/RelatoriosPage';
import SugestoesCompraPage from './pages/SugestoesCompraPage';
import SuperAdminPage from './pages/SuperAdminPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{
          style: { fontSize: 13, borderRadius: 'var(--radius-md)' },
          duration: 3000,
        }} />
        <Routes>
          {/* Rotas Públicas */}
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

          {/* Rotas Protegidas (USER + ADMIN) */}
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/perfil" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

          {/* Produtos */}
          <Route path="/produtos" element={<ProtectedRoute><ProdutosPage /></ProtectedRoute>} />
          <Route path="/produtos/novo" element={<ProtectedRoute><ProdutoFormPage /></ProtectedRoute>} />
          <Route path="/produtos/:id" element={<ProtectedRoute><ProdutoDetalhesPage /></ProtectedRoute>} />
          <Route path="/produtos/:id/editar" element={<ProtectedRoute><ProdutoFormPage /></ProtectedRoute>} />

          {/* Fornecedores */}
          <Route path="/fornecedores" element={<ProtectedRoute><FornecedoresPage /></ProtectedRoute>} />
          <Route path="/fornecedores/novo" element={<ProtectedRoute><FornecedorFormPage /></ProtectedRoute>} />
          <Route path="/fornecedores/:id" element={<ProtectedRoute><FornecedorDetalhesPage /></ProtectedRoute>} />
          <Route path="/fornecedores/:id/editar" element={<ProtectedRoute><FornecedorFormPage /></ProtectedRoute>} />

          {/* Movimentações */}
          <Route path="/movimentacoes" element={<ProtectedRoute><MovimentacoesPage /></ProtectedRoute>} />
          <Route path="/movimentacoes/entrada" element={<ProtectedRoute><MovimentacaoFormPage tipo="ENTRADA" /></ProtectedRoute>} />
          <Route path="/movimentacoes/saida" element={<ProtectedRoute><MovimentacaoFormPage tipo="SAIDA" /></ProtectedRoute>} />

          {/* Locais de Estoque */}
          <Route path="/locais" element={<ProtectedRoute><LocaisPage /></ProtectedRoute>} />
          <Route path="/locais/novo" element={<ProtectedRoute><LocalFormPage /></ProtectedRoute>} />
          <Route path="/locais/:id/editar" element={<ProtectedRoute><LocalFormPage /></ProtectedRoute>} />

          {/* Inventário Físico */}
          <Route path="/inventario" element={<ProtectedRoute><InventarioPage /></ProtectedRoute>} />
          <Route path="/inventario/:id/contagem" element={<ProtectedRoute><InventarioContagemPage /></ProtectedRoute>} />

          {/* Relatórios e Inteligência */}
          <Route path="/relatorios" element={<ProtectedRoute><RelatoriosPage /></ProtectedRoute>} />
          <Route path="/sugestoes-compra" element={<ProtectedRoute><SugestoesCompraPage /></ProtectedRoute>} />

          {/* Notificações */}
          <Route path="/notificacoes" element={<ProtectedRoute><NotificacoesPage /></ProtectedRoute>} />

          {/* Rotas Admin */}
          <Route path="/admin/logs" element={<AdminRoute><AdminLogsPage /></AdminRoute>} />
          <Route path="/admin/usuarios" element={<AdminRoute><AdminUsuariosPage /></AdminRoute>} />

          {/* Rotas Super Admin */}
          <Route path="/super-admin" element={<SuperAdminRoute><SuperAdminPage /></SuperAdminRoute>} />

          {/* Rota padrão */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
