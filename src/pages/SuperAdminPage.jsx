// ============================================
// SUPER ADMIN — Gestão de Lojas e Usuários
// ============================================
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import { lojaService } from '../services/lojaService';
import { useAuth } from '../hooks/useAuth';
import { ROLES } from '../lib/constants';
import { formatarDataHora } from '../lib/utils';
import {
  Building2, Users, Plus, Edit2, UserPlus, ChevronDown, ChevronUp,
  Shield, ShieldCheck, Store, Mail, Phone, MapPin, UserCheck, UserX,
  Eye, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';

function roleLabel(role) {
  if (role === ROLES.SUPER_ADMIN) return { label: 'Super Admin', class: 'badge-warning' };
  if (role === ROLES.ADMIN) return { label: 'Admin', class: 'badge-brand' };
  return { label: 'Usuário', class: 'badge-neutral' };
}

export default function SuperAdminPage() {
  const navigate = useNavigate();
  const { isSuperAdmin } = useAuth();
  const [lojas, setLojas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedLoja, setExpandedLoja] = useState(null);
  const [lojaUsers, setLojaUsers] = useState({});
  const [loadingUsers, setLoadingUsers] = useState({});

  // Modal states
  const [showNovaLoja, setShowNovaLoja] = useState(false);
  const [showNovoUser, setShowNovoUser] = useState(null); // lojaId
  const [saving, setSaving] = useState(false);

  // Form states
  const [lojaForm, setLojaForm] = useState({ nome: '', cnpj: '', endereco: '', telefone: '', email: '' });
  const [userForm, setUserForm] = useState({ nome: '', email: '', senha: '', role: 'USER' });

  useEffect(() => {
    if (!isSuperAdmin) { navigate('/dashboard'); return; }
    carregarLojas();
  }, [isSuperAdmin, navigate]);

  async function carregarLojas() {
    setLoading(true);
    try {
      const data = await lojaService.listar();
      setLojas(data);
    } catch (err) {
      toast.error('Erro ao carregar lojas: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function toggleExpandLoja(lojaId) {
    if (expandedLoja === lojaId) {
      setExpandedLoja(null);
      return;
    }
    setExpandedLoja(lojaId);
    if (!lojaUsers[lojaId]) {
      setLoadingUsers(prev => ({ ...prev, [lojaId]: true }));
      try {
        const users = await lojaService.listarUsuariosDaLoja(lojaId);
        setLojaUsers(prev => ({ ...prev, [lojaId]: users }));
      } catch (err) {
        toast.error('Erro ao carregar usuários: ' + err.message);
      } finally {
        setLoadingUsers(prev => ({ ...prev, [lojaId]: false }));
      }
    }
  }

  async function handleCriarLoja(e) {
    e.preventDefault();
    if (!lojaForm.nome.trim()) return toast.error('Nome é obrigatório');
    setSaving(true);
    try {
      await lojaService.criar(lojaForm);
      toast.success('Loja criada com sucesso!');
      setShowNovaLoja(false);
      setLojaForm({ nome: '', cnpj: '', endereco: '', telefone: '', email: '' });
      await carregarLojas();
    } catch (err) {
      toast.error('Erro: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleCriarUser(e) {
    e.preventDefault();
    if (!userForm.nome || !userForm.email || !userForm.senha) {
      return toast.error('Preencha todos os campos obrigatórios');
    }
    if (userForm.senha.length < 6) {
      return toast.error('Senha deve ter no mínimo 6 caracteres');
    }
    setSaving(true);
    try {
      await lojaService.criarUsuarioNaLoja({
        nome: userForm.nome,
        email: userForm.email,
        senha: userForm.senha,
        role: userForm.role,
        lojaId: showNovoUser,
      });
      toast.success('Usuário criado com sucesso!');
      setShowNovoUser(null);
      setUserForm({ nome: '', email: '', senha: '', role: 'USER' });
      // Refresh users da loja
      const users = await lojaService.listarUsuariosDaLoja(showNovoUser);
      setLojaUsers(prev => ({ ...prev, [showNovoUser]: users }));
    } catch (err) {
      toast.error('Erro: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  const totalUsers = Object.values(lojaUsers).flat().length;

  return (
    <MainLayout>
      <div className="page-header">
        <div className="page-header-left">
          <div className="breadcrumb">
            <span onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>Dashboard</span>
            <span className="text-muted">/</span>
            <span>Super Admin</span>
          </div>
          <h1 className="display-l flex items-center gap-3">
            <Building2 size={28} style={{ color: 'var(--neutral-500)' }} />
            Gestão de Lojas
          </h1>
        </div>
        <div className="page-header-right">
          <button className="btn btn-primary" onClick={() => setShowNovaLoja(true)}>
            <Plus size={16} /> Nova Loja
          </button>
        </div>
      </div>

      <div className="page-body">
        {/* Stats */}
        <div className="stats-grid mb-6">
          <div className="stat-card">
            <div className="stat-card-info">
              <div className="stat-card-label">Lojas</div>
              <div className="stat-card-value">{lojas.length}</div>
            </div>
            <div className="stat-card-icon brand"><Store size={20} /></div>
          </div>
          <div className="stat-card" style={{ borderLeft: '3px solid var(--success-500)' }}>
            <div className="stat-card-info">
              <div className="stat-card-label">Lojas Ativas</div>
              <div className="stat-card-value">{lojas.filter(l => l.ativo).length}</div>
            </div>
            <div className="stat-card-icon success"><Building2 size={20} /></div>
          </div>
        </div>

        {/* Lista de Lojas */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Loader2 size={24} className="spin" />
          </div>
        ) : lojas.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Store size={32} /></div>
            <h3>Nenhuma loja cadastrada</h3>
            <p>Crie a primeira loja para começar.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {lojas.map(loja => (
              <div key={loja.id} className="card" style={{ overflow: 'hidden' }}>
                {/* Loja Header */}
                <div
                  onClick={() => toggleExpandLoja(loja.id)}
                  style={{
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    background: expandedLoja === loja.id ? 'var(--neutral-50)' : 'transparent',
                    transition: 'background 0.15s',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div style={{
                      width: 44, height: 44, borderRadius: 'var(--radius-md)',
                      background: loja.ativo ? 'var(--brand-100)' : 'var(--neutral-100)',
                      color: loja.ativo ? 'var(--brand-700)' : 'var(--neutral-500)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Store size={22} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--neutral-800)' }}>
                          {loja.nome}
                        </span>
                        <span className={`badge ${loja.ativo ? 'badge-success' : 'badge-danger'}`}>
                          <span className="badge-dot" />
                          {loja.ativo ? 'Ativa' : 'Inativa'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4" style={{ marginTop: 2 }}>
                        {loja.cnpj && <span className="body-s">{loja.cnpj}</span>}
                        {loja.email && (
                          <span className="body-s flex items-center gap-1">
                            <Mail size={11} /> {loja.email}
                          </span>
                        )}
                        {loja.telefone && (
                          <span className="body-s flex items-center gap-1">
                            <Phone size={11} /> {loja.telefone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="body-s text-muted">
                      {lojaUsers[loja.id]?.length ?? '...'} usuários
                    </span>
                    {expandedLoja === loja.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </div>

                {/* Loja Expanded Content */}
                {expandedLoja === loja.id && (
                  <div style={{ borderTop: '1px solid var(--border-color)', padding: '16px 20px' }}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="display-s flex items-center gap-2" style={{ margin: 0 }}>
                        <Users size={16} /> Usuários desta loja
                      </h3>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={(e) => { e.stopPropagation(); setShowNovoUser(loja.id); }}
                      >
                        <UserPlus size={14} /> Novo Usuário
                      </button>
                    </div>

                    {loadingUsers[loja.id] ? (
                      <div style={{ textAlign: 'center', padding: 20 }}>
                        <Loader2 size={18} className="spin" />
                      </div>
                    ) : !lojaUsers[loja.id] || lojaUsers[loja.id].length === 0 ? (
                      <div style={{ textAlign: 'center', padding: 20, color: 'var(--neutral-400)' }}>
                        Nenhum usuário nesta loja
                      </div>
                    ) : (
                      <table className="data-table" style={{ margin: 0 }}>
                        <thead>
                          <tr>
                            <th>Nome</th>
                            <th>Email</th>
                            <th>Permissão</th>
                            <th>Status</th>
                            <th>Cadastrado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {lojaUsers[loja.id].map(u => {
                            const rl = roleLabel(u.role);
                            return (
                              <tr key={u.id} style={{ opacity: u.ativo ? 1 : 0.5 }}>
                                <td style={{ fontWeight: 500 }}>{u.nome}</td>
                                <td>
                                  <span className="body-s flex items-center gap-1">
                                    <Mail size={12} style={{ color: 'var(--neutral-400)' }} />
                                    {u.email}
                                  </span>
                                </td>
                                <td><span className={`badge ${rl.class}`}>{rl.label}</span></td>
                                <td>
                                  <span className={`badge ${u.ativo ? 'badge-success' : 'badge-danger'}`}>
                                    <span className="badge-dot" />
                                    {u.ativo ? 'Ativo' : 'Inativo'}
                                  </span>
                                </td>
                                <td><span className="mono-s">{formatarDataHora(u.criado_em)}</span></td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Nova Loja */}
      {showNovaLoja && (
        <div className="modal-overlay" onClick={() => setShowNovaLoja(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <h2 className="display-m flex items-center gap-2 mb-4">
              <Store size={20} /> Nova Loja
            </h2>
            <form onSubmit={handleCriarLoja}>
              <div className="form-group">
                <label className="form-label">Nome *</label>
                <input className="form-input" value={lojaForm.nome}
                  onChange={e => setLojaForm(p => ({ ...p, nome: e.target.value }))}
                  placeholder="Ex: Clínica Centro" required />
              </div>
              <div className="form-group">
                <label className="form-label">CNPJ</label>
                <input className="form-input" value={lojaForm.cnpj}
                  onChange={e => setLojaForm(p => ({ ...p, cnpj: e.target.value }))}
                  placeholder="00.000.000/0000-00" />
              </div>
              <div className="form-group">
                <label className="form-label">Endereço</label>
                <input className="form-input" value={lojaForm.endereco}
                  onChange={e => setLojaForm(p => ({ ...p, endereco: e.target.value }))}
                  placeholder="Rua, número, cidade" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Telefone</label>
                  <input className="form-input" value={lojaForm.telefone}
                    onChange={e => setLojaForm(p => ({ ...p, telefone: e.target.value }))}
                    placeholder="(00) 00000-0000" />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" value={lojaForm.email}
                    onChange={e => setLojaForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="contato@loja.com" />
                </div>
              </div>
              <div className="flex items-center gap-3 mt-4" style={{ justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowNovaLoja(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><Loader2 size={14} className="spin" /> Criando...</> : 'Criar Loja'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Novo Usuário na Loja */}
      {showNovoUser && (
        <div className="modal-overlay" onClick={() => setShowNovoUser(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <h2 className="display-m flex items-center gap-2 mb-4">
              <UserPlus size={20} /> Novo Usuário
            </h2>
            <p className="body-s mb-4" style={{ color: 'var(--neutral-500)' }}>
              Loja: <strong>{lojas.find(l => l.id === showNovoUser)?.nome}</strong>
            </p>
            <form onSubmit={handleCriarUser}>
              <div className="form-group">
                <label className="form-label">Nome *</label>
                <input className="form-input" value={userForm.nome}
                  onChange={e => setUserForm(p => ({ ...p, nome: e.target.value }))}
                  placeholder="Nome completo" required />
              </div>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input className="form-input" type="email" value={userForm.email}
                  onChange={e => setUserForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="email@exemplo.com" required />
              </div>
              <div className="form-group">
                <label className="form-label">Senha *</label>
                <input className="form-input" type="password" value={userForm.senha}
                  onChange={e => setUserForm(p => ({ ...p, senha: e.target.value }))}
                  placeholder="Mínimo 6 caracteres" required minLength={6} />
              </div>
              <div className="form-group">
                <label className="form-label">Permissão</label>
                <select className="form-input" value={userForm.role}
                  onChange={e => setUserForm(p => ({ ...p, role: e.target.value }))}>
                  <option value="USER">Usuário</option>
                  <option value="ADMIN">Administrador da Loja</option>
                </select>
              </div>
              <div className="flex items-center gap-3 mt-4" style={{ justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowNovoUser(null)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><Loader2 size={14} className="spin" /> Criando...</> : 'Criar Usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .modal-overlay {
          position: fixed; inset: 0; z-index: 1000;
          background: rgba(0,0,0,0.5);
          display: flex; align-items: center; justify-content: center;
          padding: 20px;
        }
        .modal-content {
          background: var(--bg-elevated);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-lg);
          padding: 24px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
        }
      `}</style>
    </MainLayout>
  );
}
