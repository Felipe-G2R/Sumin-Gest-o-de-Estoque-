// ============================================
// MAIN LAYOUT — Sidebar Colapsável + Busca Global + Atalhos
// ============================================
import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useNotificacoes } from '../../hooks/useNotificacoes';
import Logo from '../Logo';
import GlobalSearch from '../ui/GlobalSearch';
// PWA desabilitado
import {
  LayoutDashboard, Package, Truck, ArrowLeftRight, Bell, ScrollText,
  Users, LogOut, Menu, X, ShieldCheck, MapPin, ClipboardList,
  BarChart3, ShoppingCart, Search, ChevronLeft, ChevronRight,
  Sun, Moon
} from 'lucide-react';

export default function MainLayout({ children }) {
  const { profile, isAdmin, isSuperAdmin, logout } = useAuth();
  const { naoLidas } = useNotificacoes();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('sidebar-collapsed') === 'true';
  });
  const [searchOpen, setSearchOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  // Apply dark mode
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e) {
      // Ctrl+K = Global search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
      // Don't trigger shortcuts when typing in inputs
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
      if (e.key === 'n' && !e.ctrlKey) { navigate('/produtos/novo'); }
      if (e.key === 'e' && !e.ctrlKey) { navigate('/movimentacoes/entrada'); }
      if (e.key === 's' && !e.ctrlKey && !e.metaKey) { navigate('/movimentacoes/saida'); }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  // Persist sidebar state
  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', sidebarCollapsed);
  }, [sidebarCollapsed]);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  const initials = profile?.nome
    ? profile.nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  return (
    <div className={`app-layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="drawer-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''} ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-brand">
          {sidebarCollapsed ? (
            <Logo size={24} light showText={false} />
          ) : (
            <Logo size={28} light />
          )}
        </div>

        <nav className="sidebar-nav">
          {!sidebarCollapsed && <div className="sidebar-section-title">Principal</div>}

          <NavLink to="/dashboard" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)} title="Dashboard">
            <LayoutDashboard size={18} />
            {!sidebarCollapsed && 'Dashboard'}
          </NavLink>

          <NavLink to="/produtos" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)} title="Inventário">
            <Package size={18} />
            {!sidebarCollapsed && 'Inventário'}
          </NavLink>

          <NavLink to="/movimentacoes" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)} title="Movimentações">
            <ArrowLeftRight size={18} />
            {!sidebarCollapsed && 'Movimentações'}
          </NavLink>

          <NavLink to="/fornecedores" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)} title="Fornecedores">
            <Truck size={18} />
            {!sidebarCollapsed && 'Fornecedores'}
          </NavLink>

          <NavLink to="/locais" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)} title="Locais de Estoque">
            <MapPin size={18} />
            {!sidebarCollapsed && 'Locais'}
          </NavLink>

          <NavLink to="/notificacoes" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)} title="Notificações">
            <Bell size={18} />
            {!sidebarCollapsed && 'Notificações'}
            {naoLidas > 0 && <span className="link-badge">{naoLidas}</span>}
          </NavLink>

          {!sidebarCollapsed && <div className="sidebar-section-title">Inteligência</div>}

          <NavLink to="/relatorios" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)} title="Relatórios">
            <BarChart3 size={18} />
            {!sidebarCollapsed && 'Relatórios'}
          </NavLink>

          <NavLink to="/inventario" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)} title="Inventário Físico">
            <ClipboardList size={18} />
            {!sidebarCollapsed && 'Inventário Físico'}
          </NavLink>

          <NavLink to="/sugestoes-compra" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)} title="Sugestões de Compra">
            <ShoppingCart size={18} />
            {!sidebarCollapsed && 'Compras'}
          </NavLink>

          {isAdmin && (
            <>
              {!sidebarCollapsed && <div className="sidebar-section-title">Administração</div>}

              <NavLink to="/admin/logs" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)} title="Logs de Auditoria">
                <ScrollText size={18} />
                {!sidebarCollapsed && 'Logs de Auditoria'}
              </NavLink>

              <NavLink to="/admin/usuarios" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)} title="Usuários">
                <Users size={18} />
                {!sidebarCollapsed && 'Usuários'}
              </NavLink>
            </>
          )}

          {isSuperAdmin && (
            <>
              {!sidebarCollapsed && <div className="sidebar-section-title">Super Admin</div>}
              <NavLink to="/super-admin" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)} title="Gestão de Lojas">
                <ShieldCheck size={18} />
                {!sidebarCollapsed && 'Gestão de Lojas'}
              </NavLink>
            </>
          )}
        </nav>

        {/* Collapse toggle (desktop only) */}
        <button
          className="sidebar-collapse-btn"
          onClick={() => setSidebarCollapsed(prev => !prev)}
          title={sidebarCollapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        <div className="sidebar-footer">
          <NavLink to="/perfil" className="sidebar-user" title="Meu Perfil">
            <div className="sidebar-user-avatar">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.nome} className="w-full h-full object-cover rounded-full" />
              ) : (
                initials
              )}
            </div>
            {!sidebarCollapsed && (
              <div className="sidebar-user-info">
                <div className="name">{profile?.nome || 'Usuário'}</div>
                <div className="role">{profile?.role === 'ADMIN' ? 'Administrador' : 'Usuário'}</div>
              </div>
            )}
          </NavLink>
          {!sidebarCollapsed && (
            <div className="flex items-center gap-1">
              <button
                className="btn btn-ghost btn-icon"
                onClick={() => setDarkMode(prev => !prev)}
                title={darkMode ? 'Modo claro' : 'Modo escuro'}
                style={{ color: 'var(--neutral-400)' }}
              >
                {darkMode ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <button
                className="btn btn-ghost btn-icon"
                onClick={handleLogout}
                title="Sair"
                style={{ color: 'var(--neutral-400)' }}
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content">
        {/* Top bar */}
        <div className="topbar">
          <button
            className="mobile-menu-btn btn btn-ghost btn-icon"
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu size={20} />
          </button>

          <button
            className="topbar-search-btn"
            onClick={() => setSearchOpen(true)}
            title="Busca rápida (Ctrl+K)"
          >
            <Search size={16} />
            <span>Buscar...</span>
            <kbd>Ctrl+K</kbd>
          </button>

          <div className="topbar-right">
            <button
              className="btn btn-ghost btn-icon btn-sm"
              onClick={() => setDarkMode(prev => !prev)}
              title={darkMode ? 'Modo claro' : 'Modo escuro'}
            >
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <NavLink to="/notificacoes" className="btn btn-ghost btn-icon btn-sm" style={{ position: 'relative' }}>
              <Bell size={16} />
              {naoLidas > 0 && (
                <span className="topbar-badge">{naoLidas}</span>
              )}
            </NavLink>
          </div>
        </div>

        {children}
      </main>

      {/* Global Search Modal */}
      <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-bottom-nav">
        <NavLink to="/dashboard" title="Dashboard">
          <LayoutDashboard size={20} />
          <span>Início</span>
        </NavLink>
        <NavLink to="/produtos" title="Inventário">
          <Package size={20} />
          <span>Estoque</span>
        </NavLink>
        <NavLink to="/movimentacoes" title="Movimentações">
          <ArrowLeftRight size={20} />
          <span>Movimentos</span>
        </NavLink>
        <NavLink to="/notificacoes" title="Notificações">
          <Bell size={20} />
          <span>Alertas</span>
          {naoLidas > 0 && <span className="nav-badge">{naoLidas}</span>}
        </NavLink>
        <NavLink to="/relatorios" title="Relatórios">
          <BarChart3 size={20} />
          <span>Relatórios</span>
        </NavLink>
      </nav>

      {/* PWA Install Prompt */}
      {/* PWA removido */}
    </div>
  );
}
