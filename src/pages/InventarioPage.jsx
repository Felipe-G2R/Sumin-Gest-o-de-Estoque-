// ============================================
// INVENTARIO — Sessoes de Inventario Fisico
// ============================================
import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useInventario } from '../hooks/useInventario';
import { useLocais } from '../hooks/useLocais';
import MainLayout from '../components/layout/MainLayout';
import ConfirmModal from '../components/ui/ConfirmModal';
import { STATUS_INVENTARIO } from '../lib/constants';
import { formatarData, formatarDataHora } from '../lib/utils';
import {
  ClipboardList, Plus, Search, Play, X as XIcon, CheckCircle2,
  Clock, Loader2, MapPin
} from 'lucide-react';
import toast from 'react-hot-toast';

function getStatusBadge(status) {
  switch (status) {
    case STATUS_INVENTARIO.EM_ANDAMENTO: return 'badge-warning';
    case STATUS_INVENTARIO.FINALIZADO: return 'badge-success';
    case STATUS_INVENTARIO.CANCELADO: return 'badge-danger';
    default: return 'badge-neutral';
  }
}

function getStatusLabel(status) {
  switch (status) {
    case STATUS_INVENTARIO.EM_ANDAMENTO: return 'Em Andamento';
    case STATUS_INVENTARIO.FINALIZADO: return 'Finalizado';
    case STATUS_INVENTARIO.CANCELADO: return 'Cancelado';
    default: return status;
  }
}

function SkeletonCards() {
  return (
    <div className="stats-grid">
      {[1, 2, 3].map(i => (
        <div key={i} className="stat-card">
          <div className="stat-card-info">
            <div className="skeleton skeleton-text short" />
            <div className="skeleton skeleton-title" style={{ width: '50%', height: 32 }} />
          </div>
          <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)' }} />
        </div>
      ))}
    </div>
  );
}

function SkeletonRows() {
  return Array.from({ length: 4 }).map((_, i) => (
    <tr key={i}>
      <td><div className="skeleton skeleton-text" style={{ width: 150 }} /></td>
      <td><div className="skeleton skeleton-text" style={{ width: 100 }} /></td>
      <td><div className="skeleton skeleton-text" style={{ width: 80 }} /></td>
      <td><div className="skeleton skeleton-text" style={{ width: 100 }} /></td>
      <td><div className="skeleton skeleton-text" style={{ width: 100 }} /></td>
      <td><div className="skeleton skeleton-text" style={{ width: 80 }} /></td>
      <td><div className="skeleton skeleton-text" style={{ width: 100 }} /></td>
    </tr>
  ));
}

export default function InventarioPage() {
  const navigate = useNavigate();
  const { inventarios, loading, listar, criar, cancelar } = useInventario();
  const { listarAtivos } = useLocais();
  const [locaisAtivos, setLocaisAtivos] = useState([]);
  const [busca, setBusca] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({ nome: '', local_id: '' });
  const [creating, setCreating] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null, nome: '' });

  const carregarLocais = useCallback(async () => {
    try {
      const result = await listarAtivos();
      setLocaisAtivos(result || []);
    } catch (e) {
      console.warn('Erro ao carregar locais:', e);
    }
  }, [listarAtivos]);

  useEffect(() => {
    listar();
    carregarLocais();
  }, [listar, carregarLocais]);

  const inventariosFiltrados = inventarios.filter(inv => {
    if (!busca) return true;
    const termo = busca.toLowerCase();
    return (
      inv.nome?.toLowerCase().includes(termo) ||
      inv.local?.nome?.toLowerCase().includes(termo)
    );
  });

  const total = inventarios.length;
  const emAndamento = inventarios.filter(i => i.status === STATUS_INVENTARIO.EM_ANDAMENTO).length;
  const finalizados = inventarios.filter(i => i.status === STATUS_INVENTARIO.FINALIZADO).length;

  async function handleCriar(e) {
    e.preventDefault();
    if (!createForm.nome.trim()) {
      toast.error('Informe o nome do inventario');
      return;
    }
    setCreating(true);
    try {
      const dados = {
        nome: createForm.nome.trim(),
        local_id: createForm.local_id || null,
      };
      await criar(dados);
      toast.success('Inventario criado com sucesso!');
      setCreateForm({ nome: '', local_id: '' });
      setShowCreateForm(false);
      listar();
    } catch (err) {
      toast.error(err.message || 'Erro ao criar inventario');
    } finally {
      setCreating(false);
    }
  }

  async function handleCancelar() {
    try {
      await cancelar(confirmModal.id);
      toast.success(`Inventario "${confirmModal.nome}" cancelado`);
      listar();
    } catch {
      toast.error('Erro ao cancelar inventario');
    }
  }

  return (
    <MainLayout>
      <div className="page-header">
        <div className="page-header-left">
          <div className="breadcrumb">
            <Link to="/dashboard">Dashboard</Link>
            <span>/</span>
            <span>Inventario</span>
          </div>
          <h1 className="display-l" style={{ fontSize: 24 }}>Inventario Fisico</h1>
        </div>
        <div className="page-header-right">
          <button
            className="btn btn-primary"
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            <Plus size={16} />
            Novo Inventario
          </button>
        </div>
      </div>

      <div className="page-body">
        {/* Stats Cards */}
        {loading && !inventarios.length ? (
          <SkeletonCards />
        ) : (
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <div className="stat-card">
              <div className="stat-card-info">
                <div className="stat-card-label">Total</div>
                <div className="stat-card-value">{total}</div>
              </div>
              <div className="stat-card-icon brand">
                <ClipboardList size={22} />
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-card-info">
                <div className="stat-card-label">Em Andamento</div>
                <div className="stat-card-value">{emAndamento}</div>
              </div>
              <div className="stat-card-icon warning">
                <Clock size={22} />
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-card-info">
                <div className="stat-card-label">Finalizados</div>
                <div className="stat-card-value">{finalizados}</div>
              </div>
              <div className="stat-card-icon success">
                <CheckCircle2 size={22} />
              </div>
            </div>
          </div>
        )}

        {/* Create Form */}
        {showCreateForm && (
          <div className="card mb-4">
            <div className="card-body">
              <h2 className="heading-s mb-4">Criar Novo Inventario</h2>
              <form onSubmit={handleCriar}>
                <div className="flex gap-3" style={{ flexWrap: 'wrap', alignItems: 'flex-end' }}>
                  <div className="form-group" style={{ flex: 2, minWidth: 200, marginBottom: 0 }}>
                    <label className="form-label">Nome do Inventario <span className="required">*</span></label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ex: Inventario Mensal - Marco 2026"
                      value={createForm.nome}
                      onChange={e => setCreateForm(prev => ({ ...prev, nome: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1, minWidth: 180, marginBottom: 0 }}>
                    <label className="form-label">Local (opcional)</label>
                    <select
                      className="form-select"
                      value={createForm.local_id}
                      onChange={e => setCreateForm(prev => ({ ...prev, local_id: e.target.value }))}
                    >
                      <option value="">Todos os locais</option>
                      {locaisAtivos.map(l => (
                        <option key={l.id} value={l.id}>{l.nome}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2" style={{ marginBottom: 0 }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => { setShowCreateForm(false); setCreateForm({ nome: '', local_id: '' }); }}
                    >
                      Cancelar
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={creating}>
                      {creating ? <><Loader2 size={16} className="spin" /> Criando...</> : 'Criar'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && inventarios.length === 0 && !showCreateForm && (
          <div className="empty-state">
            <div className="empty-state-icon">
              <ClipboardList size={32} />
            </div>
            <h3>Nenhum inventario registrado</h3>
            <p>Crie um inventario fisico para conferir os produtos do seu estoque e identificar diferencas.</p>
            <button className="btn btn-primary" onClick={() => setShowCreateForm(true)}>
              <Plus size={16} />
              Criar primeiro inventario
            </button>
          </div>
        )}

        {/* Table */}
        {(loading || inventarios.length > 0) && (
          <div className="data-table-container">
            <div className="table-toolbar">
              <div className="table-toolbar-left">
                <div className="table-search">
                  <Search size={16} className="search-icon" />
                  <input
                    className="form-input"
                    style={{ paddingLeft: 36 }}
                    type="text"
                    placeholder="Buscar por nome ou local..."
                    value={busca}
                    onChange={e => setBusca(e.target.value)}
                  />
                </div>
              </div>
              <div className="table-toolbar-right">
                <span className="body-s text-muted">{inventariosFiltrados.length} inventario(s)</span>
              </div>
            </div>

            <table className="data-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Local</th>
                  <th>Status</th>
                  <th>Data Inicio</th>
                  <th>Data Fim</th>
                  <th>Responsavel</th>
                  <th style={{ textAlign: 'right' }}>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <SkeletonRows />
                ) : inventariosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                      <p className="body-s">Nenhum inventario encontrado</p>
                    </td>
                  </tr>
                ) : (
                  inventariosFiltrados.map(inv => (
                    <tr key={inv.id}>
                      <td>
                        <strong
                          style={{ cursor: 'pointer', color: 'var(--brand-700)' }}
                          onClick={() => {
                            if (inv.status !== STATUS_INVENTARIO.CANCELADO) {
                              navigate(`/inventario/${inv.id}/contagem`);
                            }
                          }}
                        >
                          {inv.nome}
                        </strong>
                      </td>
                      <td>
                        {inv.local ? (
                          <div className="flex items-center gap-1">
                            <MapPin size={14} style={{ color: 'var(--neutral-400)' }} />
                            <span className="body-s">{inv.local.nome}</span>
                          </div>
                        ) : (
                          <span className="body-s text-muted">Todos</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadge(inv.status)}`}>
                          {getStatusLabel(inv.status)}
                        </span>
                      </td>
                      <td>
                        <span className="mono-s">{formatarDataHora(inv.criado_em)}</span>
                      </td>
                      <td>
                        <span className="mono-s">{inv.finalizado_em ? formatarDataHora(inv.finalizado_em) : '—'}</span>
                      </td>
                      <td>
                        <span className="body-s">{inv.usuario?.nome || '—'}</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="flex items-center gap-1" style={{ justifyContent: 'flex-end' }}>
                          {inv.status === STATUS_INVENTARIO.EM_ANDAMENTO && (
                            <>
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => navigate(`/inventario/${inv.id}/contagem`)}
                                title="Iniciar Contagem"
                              >
                                <Play size={14} />
                                Contagem
                              </button>
                              <button
                                className="btn btn-ghost btn-icon btn-sm text-danger"
                                title="Cancelar inventario"
                                onClick={() => setConfirmModal({ isOpen: true, id: inv.id, nome: inv.nome })}
                              >
                                <XIcon size={15} />
                              </button>
                            </>
                          )}
                          {inv.status === STATUS_INVENTARIO.FINALIZADO && (
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => navigate(`/inventario/${inv.id}/contagem`)}
                              title="Ver resultado"
                            >
                              <CheckCircle2 size={14} />
                              Ver Resultado
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, id: null, nome: '' })}
        onConfirm={handleCancelar}
        title="Cancelar inventario"
        message={`Tem certeza que deseja cancelar o inventario "${confirmModal.nome}"? Esta acao nao pode ser desfeita.`}
        confirmText="Cancelar Inventario"
        cancelText="Voltar"
        variant="danger"
      />
    </MainLayout>
  );
}
