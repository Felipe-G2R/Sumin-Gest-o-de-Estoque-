// ============================================
// LOCAIS — Gerenciamento de Locais de Estoque
// ============================================
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLocais } from '../hooks/useLocais';
import MainLayout from '../components/layout/MainLayout';
import ConfirmModal from '../components/ui/ConfirmModal';
import { TIPO_LOCAL } from '../lib/constants';
import {
  MapPin, Plus, Search, Edit2, ToggleLeft, ToggleRight, Building, Archive
} from 'lucide-react';
import toast from 'react-hot-toast';

const TIPO_LABELS = {
  SALA: 'Sala',
  ARMARIO: 'Armario',
  DEPOSITO: 'Deposito',
  FILIAL: 'Filial',
};

function getTipoBadge(tipo) {
  switch (tipo) {
    case 'SALA': return 'badge-brand';
    case 'ARMARIO': return 'badge-neutral';
    case 'DEPOSITO': return 'badge-warning';
    case 'FILIAL': return 'badge-success';
    default: return 'badge-neutral';
  }
}

function SkeletonCards() {
  return (
    <div className="stats-grid">
      {[1, 2, 3, 4].map(i => (
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
  return Array.from({ length: 5 }).map((_, i) => (
    <tr key={i}>
      <td><div className="skeleton skeleton-text" style={{ width: 160 }} /></td>
      <td><div className="skeleton skeleton-text" style={{ width: 80 }} /></td>
      <td><div className="skeleton skeleton-text" style={{ width: 200 }} /></td>
      <td><div className="skeleton skeleton-text" style={{ width: 70 }} /></td>
      <td><div className="skeleton skeleton-text" style={{ width: 100 }} /></td>
    </tr>
  ));
}

export default function LocaisPage() {
  const navigate = useNavigate();
  const { locais, loading, listar, desativar, reativar } = useLocais();
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null, nome: '', action: '' });

  useEffect(() => {
    const timer = setTimeout(() => {
      listar({ busca: busca || undefined });
    }, 300);
    return () => clearTimeout(timer);
  }, [busca, listar]);

  const locaisFiltrados = locais.filter(l => {
    if (filtroStatus === 'ativo' && !l.ativo) return false;
    if (filtroStatus === 'inativo' && l.ativo) return false;
    return true;
  });

  const totalLocais = locais.length;
  const ativos = locais.filter(l => l.ativo).length;
  const inativos = locais.filter(l => !l.ativo).length;
  const tiposCount = Object.values(TIPO_LOCAL).reduce((acc, tipo) => {
    acc[tipo] = locais.filter(l => l.tipo === tipo && l.ativo).length;
    return acc;
  }, {});
  const tipoMaisUsado = Object.entries(tiposCount).sort((a, b) => b[1] - a[1])[0];

  function handleToggle(local) {
    if (local.ativo) {
      setConfirmModal({
        isOpen: true,
        id: local.id,
        nome: local.nome,
        action: 'desativar',
      });
    } else {
      handleReativar(local.id, local.nome);
    }
  }

  async function handleDesativar() {
    try {
      await desativar(confirmModal.id);
      toast.success(`Local "${confirmModal.nome}" desativado`);
      listar({ busca: busca || undefined });
    } catch {
      toast.error('Erro ao desativar local');
    }
  }

  async function handleReativar(id, nome) {
    try {
      await reativar(id);
      toast.success(`Local "${nome}" reativado`);
      listar({ busca: busca || undefined });
    } catch {
      toast.error('Erro ao reativar local');
    }
  }

  return (
    <MainLayout>
      <div className="page-header">
        <div className="page-header-left">
          <div className="breadcrumb">
            <Link to="/dashboard">Dashboard</Link>
            <span>/</span>
            <span>Locais</span>
          </div>
          <h1 className="display-l" style={{ fontSize: 24 }}>Locais de Estoque</h1>
        </div>
        <div className="page-header-right">
          <Link to="/locais/novo" className="btn btn-primary">
            <Plus size={16} />
            Novo Local
          </Link>
        </div>
      </div>

      <div className="page-body">
        {/* Stats Cards */}
        {loading && !locais.length ? (
          <SkeletonCards />
        ) : (
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <div className="stat-card">
              <div className="stat-card-info">
                <div className="stat-card-label">Total de Locais</div>
                <div className="stat-card-value">{totalLocais}</div>
              </div>
              <div className="stat-card-icon brand">
                <MapPin size={22} />
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-card-info">
                <div className="stat-card-label">Ativos</div>
                <div className="stat-card-value">{ativos}</div>
              </div>
              <div className="stat-card-icon success">
                <ToggleRight size={22} />
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-card-info">
                <div className="stat-card-label">Inativos</div>
                <div className="stat-card-value">{inativos}</div>
              </div>
              <div className="stat-card-icon danger">
                <ToggleLeft size={22} />
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-card-info">
                <div className="stat-card-label">Tipo Principal</div>
                <div className="stat-card-value" style={{ fontSize: 18 }}>
                  {tipoMaisUsado ? `${TIPO_LABELS[tipoMaisUsado[0]] || tipoMaisUsado[0]} (${tipoMaisUsado[1]})` : '—'}
                </div>
              </div>
              <div className="stat-card-icon info">
                <Building size={22} />
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && locais.length === 0 && !busca && (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Archive size={32} />
            </div>
            <h3>Nenhum local cadastrado</h3>
            <p>Cadastre os locais de armazenamento do seu estoque para organizar melhor seus produtos.</p>
            <Link to="/locais/novo" className="btn btn-primary">
              <Plus size={16} />
              Cadastrar local
            </Link>
          </div>
        )}

        {/* Table */}
        {(loading || locais.length > 0 || busca) && (
          <div className="data-table-container">
            <div className="table-toolbar">
              <div className="table-toolbar-left">
                <div className="table-search">
                  <Search size={16} className="search-icon" />
                  <input
                    className="form-input"
                    style={{ paddingLeft: 36 }}
                    type="text"
                    placeholder="Buscar por nome ou descricao..."
                    value={busca}
                    onChange={e => setBusca(e.target.value)}
                  />
                </div>
              </div>
              <div className="table-toolbar-right">
                <select
                  className="form-select btn-sm"
                  style={{ width: 'auto', minHeight: 32 }}
                  value={filtroStatus}
                  onChange={e => setFiltroStatus(e.target.value)}
                >
                  <option value="todos">Todos</option>
                  <option value="ativo">Ativos</option>
                  <option value="inativo">Inativos</option>
                </select>
              </div>
            </div>

            {loading && (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Tipo</th>
                    <th>Descricao</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  <SkeletonRows />
                </tbody>
              </table>
            )}

            {!loading && (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Tipo</th>
                    <th>Descricao</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {locaisFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                        <p className="body-s">Nenhum local encontrado para sua busca</p>
                      </td>
                    </tr>
                  ) : (
                    locaisFiltrados.map(local => (
                      <tr key={local.id} style={!local.ativo ? { opacity: 0.5 } : {}}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div style={{
                              width: 36, height: 36, borderRadius: 'var(--radius-md)',
                              background: 'var(--brand-50)', color: 'var(--brand-500)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                              <MapPin size={16} />
                            </div>
                            <strong>{local.nome}</strong>
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${getTipoBadge(local.tipo)}`}>
                            {TIPO_LABELS[local.tipo] || local.tipo}
                          </span>
                        </td>
                        <td>
                          <span className="body-s">{local.descricao || '—'}</span>
                        </td>
                        <td>
                          <span className={`badge ${local.ativo ? 'badge-success' : 'badge-neutral'}`}>
                            {local.ativo ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="flex items-center gap-1" style={{ justifyContent: 'flex-end' }}>
                            <button
                              className="btn btn-ghost btn-icon btn-sm"
                              title="Editar"
                              aria-label={`Editar ${local.nome}`}
                              onClick={() => navigate(`/locais/${local.id}/editar`)}
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              className={`btn btn-ghost btn-icon btn-sm ${local.ativo ? 'text-danger' : ''}`}
                              title={local.ativo ? 'Desativar' : 'Reativar'}
                              aria-label={local.ativo ? `Desativar ${local.nome}` : `Reativar ${local.nome}`}
                              onClick={() => handleToggle(local)}
                            >
                              {local.ativo ? <ToggleLeft size={15} /> : <ToggleRight size={15} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, id: null, nome: '', action: '' })}
        onConfirm={handleDesativar}
        title="Desativar local"
        message={`Tem certeza que deseja desativar o local "${confirmModal.nome}"? Ele nao podera ser usado em novas movimentacoes.`}
        confirmText="Desativar"
        cancelText="Cancelar"
        variant="danger"
      />
    </MainLayout>
  );
}
