// ============================================
// ADMIN — Gestão de Usuários
// ============================================
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import { authService } from '../services/authService';
import { useAuth } from '../hooks/useAuth';
import { formatarDataHora, tempoRelativo } from '../lib/utils';
import { ROLES } from '../lib/constants';
import {
  Users, Shield, ShieldCheck, UserX, UserCheck, Search,
  Eye, Edit2, MoreHorizontal, ChevronDown, Mail, CalendarDays
} from 'lucide-react';
import toast from 'react-hot-toast';

function getInitials(nome) {
  if (!nome) return '??';
  const parts = nome.trim().split(' ');
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function roleConfig(role) {
  if (role === ROLES.SUPER_ADMIN) {
    return {
      label: 'Super Admin',
      class: 'badge-warning',
      icon: <ShieldCheck size={12} />,
    };
  }
  if (role === ROLES.ADMIN) {
    return {
      label: 'Administrador',
      class: 'badge-brand',
      icon: <ShieldCheck size={12} />,
    };
  }
  return {
    label: 'Usuário',
    class: 'badge-neutral',
    icon: <Shield size={12} />,
  };
}

function statusConfig(ativo) {
  if (ativo) {
    return { label: 'Ativo', class: 'badge-success', dot: true };
  }
  return { label: 'Inativo', class: 'badge-danger', dot: true };
}

function SkeletonRows() {
  return Array.from({ length: 5 }).map((_, i) => (
    <tr key={i}>
      <td>
        <div className="flex items-center gap-3">
          <div className="skeleton" style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0 }} />
          <div>
            <div className="skeleton skeleton-text" style={{ width: 140 }} />
            <div className="skeleton skeleton-text short" />
          </div>
        </div>
      </td>
      <td><div className="skeleton skeleton-text" style={{ width: 200 }} /></td>
      <td><div className="skeleton skeleton-text short" /></td>
      <td><div className="skeleton skeleton-text short" /></td>
      <td><div className="skeleton skeleton-text" style={{ width: 130 }} /></td>
      <td><div className="skeleton skeleton-text short" /></td>
    </tr>
  ));
}

export default function AdminUsuariosPage() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);

  useEffect(() => {
    carregarUsuarios();
  }, []);

  async function carregarUsuarios() {
    setLoading(true);
    try {
      const data = await authService.listarUsuarios();
      setUsuarios(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleMudarRole(userId, novoRole) {
    try {
      await authService.updateRole(userId, novoRole);
      toast.success('Permissão atualizada!');
      carregarUsuarios();
    } catch (err) {
      toast.error(err.message);
    }
    setOpenMenuId(null);
  }

  async function handleDesativar(userId) {
    try {
      await authService.deactivateUser(userId);
      toast.success('Usuário desativado');
      carregarUsuarios();
    } catch (err) {
      toast.error(err.message);
    }
    setOpenMenuId(null);
  }

  async function handleReativar(userId) {
    try {
      await authService.reactivateUser(userId);
      toast.success('Usuário reativado');
      carregarUsuarios();
    } catch (err) {
      toast.error(err.message);
    }
    setOpenMenuId(null);
  }

  const filtrados = usuarios.filter((u) => {
    if (!busca) return true;
    const b = busca.toLowerCase();
    return (
      u.nome?.toLowerCase().includes(b) ||
      u.email?.toLowerCase().includes(b) ||
      u.role?.toLowerCase().includes(b)
    );
  });

  const stats = {
    total: usuarios.length,
    ativos: usuarios.filter((u) => u.ativo).length,
    inativos: usuarios.filter((u) => !u.ativo).length,
    admins: usuarios.filter((u) => u.role === ROLES.ADMIN && u.ativo).length,
  };

  return (
    <MainLayout>
      <div className="page-header">
        <div className="page-header-left">
          <div className="breadcrumb">
            <span onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>Dashboard</span>
            <span className="text-muted">/</span>
            <span>Gestão de Usuários</span>
          </div>
          <h1 className="display-l flex items-center gap-3">
            <Users size={28} style={{ color: 'var(--neutral-500)' }} />
            Gestão de Usuários
          </h1>
        </div>
        <div className="page-header-right">
          <span className="body-s text-muted">
            {filtrados.length} usuário{filtrados.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div className="page-body">
        <div className="stats-grid mb-6">
          <div className="stat-card">
            <div className="stat-card-info">
              <div className="stat-card-label">Total</div>
              <div className="stat-card-value">{stats.total}</div>
            </div>
            <div className="stat-card-icon brand"><Users size={20} /></div>
          </div>
          <div className="stat-card" style={{ borderLeft: '3px solid var(--success-500)' }}>
            <div className="stat-card-info">
              <div className="stat-card-label">Ativos</div>
              <div className="stat-card-value">{stats.ativos}</div>
            </div>
            <div className="stat-card-icon success"><UserCheck size={20} /></div>
          </div>
          <div className="stat-card" style={{ borderLeft: '3px solid var(--destructive-500)' }}>
            <div className="stat-card-info">
              <div className="stat-card-label">Inativos</div>
              <div className="stat-card-value">{stats.inativos}</div>
            </div>
            <div className="stat-card-icon danger"><UserX size={20} /></div>
          </div>
          <div className="stat-card" style={{ borderLeft: '3px solid var(--brand-500)' }}>
            <div className="stat-card-info">
              <div className="stat-card-label">Administradores</div>
              <div className="stat-card-value">{stats.admins}</div>
            </div>
            <div className="stat-card-icon brand"><ShieldCheck size={20} /></div>
          </div>
        </div>

        <div className="data-table-container">
          <div className="table-toolbar">
            <div className="table-toolbar-left">
              <div className="table-search">
                <Search size={15} className="search-icon" />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Buscar por nome, email ou role..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                />
              </div>
            </div>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Usuário</th>
                <th>Email</th>
                <th>Permissão</th>
                <th>Status</th>
                <th>Cadastrado</th>
                <th style={{ width: 80 }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows />
              ) : filtrados.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">
                      <div className="empty-state-icon">
                        <Users size={32} />
                      </div>
                      <h3>Nenhum usuário encontrado</h3>
                      <p>Tente ajustar os filtros de busca.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtrados.map((u) => {
                  const role = roleConfig(u.role);
                  const status = statusConfig(u.ativo);
                  const isMe = u.id === currentUser.id;

                  return (
                    <tr
                      key={u.id}
                      style={{ opacity: u.ativo ? 1 : 0.6 }}
                    >
                      <td>
                        <div className="flex items-center gap-3">
                          <div
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: '50%',
                              background: isMe ? 'var(--brand-100)' : 'var(--neutral-100)',
                              color: isMe ? 'var(--brand-700)' : 'var(--neutral-600)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: 14,
                              flexShrink: 0,
                            }}
                          >
                            {getInitials(u.nome)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span style={{ fontWeight: 500, color: 'var(--neutral-800)' }}>
                                {u.nome}
                              </span>
                              {isMe && (
                                <span className="badge badge-brand" style={{ fontSize: 10 }}>você</span>
                              )}
                            </div>
                            <span className="body-s">{u.email}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <Mail size={13} style={{ color: 'var(--neutral-400)' }} />
                          <span className="body-s">{u.email}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${role.class}`}>
                          {role.icon}
                          {role.label}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${status.class}`}>
                          <span className="badge-dot" />
                          {status.label}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <CalendarDays size={13} style={{ color: 'var(--neutral-400)' }} />
                          <div>
                            <span className="mono-s">{formatarDataHora(u.criado_em)}</span>
                            <br />
                            <span className="body-s">{tempoRelativo(u.criado_em)}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        {isMe ? (
                          <span className="body-s text-muted">—</span>
                        ) : (
                          <div style={{ position: 'relative' }}>
                            <button
                              className="btn btn-ghost btn-icon btn-sm"
                              onClick={() => setOpenMenuId(openMenuId === u.id ? null : u.id)}
                            >
                              <MoreHorizontal size={15} />
                            </button>
                            {openMenuId === u.id && (
                              <div
                                style={{
                                  position: 'absolute',
                                  right: 0,
                                  top: '100%',
                                  marginTop: 4,
                                  background: 'var(--bg-elevated)',
                                  border: '1px solid var(--border-color)',
                                  borderRadius: 'var(--radius-md)',
                                  boxShadow: 'var(--shadow-md)',
                                  zIndex: 100,
                                  minWidth: 180,
                                  overflow: 'hidden',
                                }}
                              >
                                {u.role === ROLES.USER ? (
                                  <button
                                    className="dropdown-item"
                                    onClick={() => handleMudarRole(u.id, ROLES.ADMIN)}
                                  >
                                    <ShieldCheck size={14} />
                                    Tornar Administrador
                                  </button>
                                ) : (
                                  <button
                                    className="dropdown-item"
                                    onClick={() => handleMudarRole(u.id, ROLES.USER)}
                                  >
                                    <Shield size={14} />
                                    Tornar Usuário
                                  </button>
                                )}
                                {u.ativo ? (
                                  <button
                                    className="dropdown-item danger"
                                    onClick={() => handleDesativar(u.id)}
                                  >
                                    <UserX size={14} />
                                    Desativar
                                  </button>
                                ) : (
                                  <button
                                    className="dropdown-item success"
                                    onClick={() => handleReativar(u.id)}
                                  >
                                    <UserCheck size={14} />
                                    Reativar
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .dropdown-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-2) var(--space-4);
          font-size: 13px;
          font-weight: 500;
          color: var(--neutral-700);
          background: none;
          border: none;
          cursor: pointer;
          text-align: left;
          transition: background var(--transition-fast);
          font-family: var(--font-family);
        }
        .dropdown-item:hover { background: var(--neutral-50); }
        .dropdown-item.danger { color: var(--destructive-600); }
        .dropdown-item.danger:hover { background: var(--destructive-50); }
        .dropdown-item.success { color: var(--success-600); }
        .dropdown-item.success:hover { background: var(--success-50); }
      `}</style>
    </MainLayout>
  );
}
