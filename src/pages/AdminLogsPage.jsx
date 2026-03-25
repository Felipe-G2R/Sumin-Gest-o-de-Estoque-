// ============================================
// LOGS DE AUDITORIA — Timeline de Atividades
// ============================================
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import { useLogs } from '../hooks/useLogs';
import { formatarDataHora, tempoRelativo } from '../lib/utils';
import { authService } from '../services/authService';
import {
  FileText, Filter, Download, ChevronLeft, ChevronRight,
  ArrowDownLeft, ArrowUpRight, Edit2, Trash2, LogIn, LogOut,
  UserPlus, Package, Building2, ChevronDown, ChevronUp, Printer
} from 'lucide-react';

function acaoConfig(acao) {
  switch (acao) {
    case 'ENTRADA_ESTOQUE':
      return { icon: <ArrowDownLeft size={14} />, class: 'entrada', label: 'Entrada' };
    case 'SAIDA_ESTOQUE':
      return { icon: <ArrowUpRight size={14} />, class: 'saida', label: 'Saída' };
    case 'CREATE':
      return { icon: <UserPlus size={14} />, class: 'create', label: 'Criação' };
    case 'UPDATE':
      return { icon: <Edit2 size={14} />, class: 'update', label: 'Atualização' };
    case 'DELETE':
    case 'DEACTIVATE':
      return { icon: <Trash2 size={14} />, class: 'delete', label: 'Exclusão' };
    case 'LOGIN':
      return { icon: <LogIn size={14} />, class: 'create', label: 'Login' };
    case 'LOGOUT':
      return { icon: <LogOut size={14} />, class: 'update', label: 'Logout' };
    default:
      return { icon: <FileText size={14} />, class: 'update', label: acao };
  }
}

function entidadeIcon(entidade) {
  switch (entidade) {
    case 'produto': return <Package size={14} />;
    case 'fornecedor': return <Building2 size={14} />;
    default: return <FileText size={14} />;
  }
}

function getInitials(nome) {
  if (!nome) return 'SY';
  const parts = nome.trim().split(' ');
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function avatarColor(nome) {
  if (!nome) return { bg: 'var(--neutral-200)', color: 'var(--neutral-600)' };
  const colors = [
    { bg: 'var(--brand-50)', color: 'var(--brand-700)' },
    { bg: 'var(--success-50)', color: 'var(--success-600)' },
    { bg: 'var(--info-50)', color: 'var(--info-500)' },
    { bg: 'var(--warning-50)', color: 'var(--warning-600)' },
  ];
  const idx = nome.charCodeAt(0) % colors.length;
  return colors[idx];
}

function LogDiffView({ dados }) {
  if (!dados) return null;
  const entries = Object.entries(dados);
  if (entries.length === 0) return null;
  return (
    <div className="log-diff">
      {entries.map(([key, value]) => (
        <div key={key} style={{ marginBottom: 4 }}>
          <span style={{ color: 'var(--neutral-500)', textTransform: 'capitalize' }}>{key}: </span>
          <span style={{ color: 'var(--neutral-800)', fontWeight: 500 }}>
            {typeof value === 'object' ? JSON.stringify(value) : String(value ?? '—')}
          </span>
        </div>
      ))}
    </div>
  );
}

function LogItem({ log }) {
  const [expandido, setExpandido] = useState(false);
  const config = acaoConfig(log.acao);
  const initials = getInitials(log.usuario?.nome);
  const colors = avatarColor(log.usuario?.nome);
  const hasDetails = log.dados_anteriores || log.dados_novos;

  let descricao = '';
  if (log.descricao) {
    descricao = log.descricao;
  } else {
    const nome = log.usuario?.nome || 'Sistema';
    switch (log.acao) {
      case 'ENTRADA_ESTOQUE':
        descricao = `${nome} registrou entrada de estoque`;
        break;
      case 'SAIDA_ESTOQUE':
        descricao = `${nome} registrou saída de estoque`;
        break;
      case 'CREATE':
        descricao = `${nome} criou ${log.entidade}`;
        break;
      case 'UPDATE':
        descricao = `${nome} atualizou ${log.entidade}`;
        break;
      case 'DELETE':
      case 'DEACTIVATE':
        descricao = `${nome} desativou ${log.entidade}`;
        break;
      case 'LOGIN':
        descricao = `${nome} fez login no sistema`;
        break;
      case 'LOGOUT':
        descricao = `${nome} fez logout do sistema`;
        break;
      default:
        descricao = `${nome} realizou ação em ${log.entidade}`;
    }
  }

  return (
    <div className="log-item">
      <div
        className="log-avatar"
        style={{ background: colors.bg, color: colors.color }}
      >
        {initials}
      </div>

      <div className="log-details" style={{ width: '100%' }}>
        <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
          <span className={`log-action-badge ${config.class}`}>
            {config.icon}
            {config.label}
          </span>
          <span className="badge badge-neutral" style={{ fontSize: 11 }}>
            {entidadeIcon(log.entidade)}
            {log.entidade}
          </span>
        </div>

        <p className="log-description">
          <strong>{log.usuario?.nome || 'Sistema'}</strong>
          {' — '}
          {descricao}
        </p>

        <div className="log-meta">
          <span>{tempoRelativo(log.criado_em)}</span>
          <span>·</span>
          <span className="mono-s">{formatarDataHora(log.criado_em)}</span>
          {hasDetails && (
            <>
              <span>·</span>
              <button
                className="btn btn-ghost btn-sm"
                style={{ padding: '2px 6px', minHeight: 24, fontSize: 12 }}
                onClick={() => setExpandido(!expandido)}
              >
                {expandido ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                {expandido ? 'Ocultar' : 'Ver'} detalhes
              </button>
            </>
          )}
        </div>

        {expandido && (
          <div style={{ marginTop: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {log.dados_anteriores && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--neutral-500)', marginBottom: 4 }}>
                  Antes:
                </div>
                <LogDiffView dados={log.dados_anteriores} />
              </div>
            )}
            {log.dados_novos && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--neutral-500)', marginBottom: 4 }}>
                  Depois:
                </div>
                <LogDiffView dados={log.dados_novos} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SkeletonLogs() {
  return Array.from({ length: 6 }).map((_, i) => (
    <div key={i} className="log-item">
      <div className="skeleton" style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0 }} />
      <div className="log-details" style={{ flex: 1 }}>
        <div className="skeleton skeleton-text" style={{ width: '30%', marginBottom: 8 }} />
        <div className="skeleton skeleton-text" style={{ width: '60%', marginBottom: 6 }} />
        <div className="skeleton skeleton-text short" />
      </div>
    </div>
  ));
}

export default function AdminLogsPage() {
  const navigate = useNavigate();
  const { logs, loading, paginacao, listar, exportar } = useLogs();
  const [usuarios, setUsuarios] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filtros, setFiltros] = useState({
    usuario_id: '',
    acao: '',
    entidade: '',
    data_inicio: '',
    data_fim: '',
    pagina: 1,
  });

  async function carregarUsuarios() {
    try {
      const data = await authService.listarUsuarios();
      setUsuarios(data);
    } catch { /* ignore */ }
  }

  useEffect(() => {
    carregarUsuarios();
    const limpos = {};
    Object.entries(filtros).forEach(([k, v]) => { if (v) limpos[k] = v; });
    listar(limpos);
  }, [filtros, listar]);

  return (
    <MainLayout>
      {/* Cabeçalho de Impressão (Só aparece no PDF) */}
      <div className="print-only" style={{ display: 'none' }}>
        <style>{`
          @media print {
            .print-only { display: block !important; margin-bottom: 20px; }
            .no-print { display: none !important; }
            .log-item { page-break-inside: avoid; border: 1px solid #eee !important; margin-bottom: 10px !important; padding: 10px !important; }
          }
        `}</style>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #000', paddingBottom: 10 }}>
          <div>
            <h1 style={{ fontSize: 24, margin: 0 }}>SUMIN — Relatório de Auditoria</h1>
            <p style={{ margin: 0 }}>Data do Relatório: {new Date().toLocaleString('pt-BR')}</p>
          </div>
        </div>
      </div>

      <div className="page-header no-print">
        <div className="page-header-left">
          <div className="breadcrumb">
            <span onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>Dashboard</span>
            <span className="text-muted">/</span>
            <span>Logs de Auditoria</span>
          </div>
          <h1 className="display-l flex items-center gap-3">
            <FileText size={28} style={{ color: 'var(--neutral-500)' }} />
            Logs de Auditoria
          </h1>
        </div>
        <div className="page-header-right">
          <button className="btn btn-secondary btn-sm" onClick={() => window.print()}>
            <Printer size={15} />
            Relatório PDF
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowFilters(!showFilters)}>
            <Filter size={15} />
            {showFilters ? 'Ocultar' : 'Mostrar'} Filtros
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => exportar(filtros)} disabled={loading}>
            <Download size={15} />
            Exportar CSV
          </button>
        </div>
      </div>

      <div className="page-body">
        {showFilters && (
          <div className="card mb-4">
            <div className="card-body">
              <div className="flex gap-3" style={{ flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div style={{ minWidth: 180 }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Usuário</label>
                    <select
                      className="form-select"
                      value={filtros.usuario_id}
                      onChange={(e) => setFiltros((p) => ({ ...p, usuario_id: e.target.value, pagina: 1 }))}
                    >
                      <option value="">Todos</option>
                      {usuarios.map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ minWidth: 160 }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Ação</label>
                    <select
                      className="form-select"
                      value={filtros.acao}
                      onChange={(e) => setFiltros((p) => ({ ...p, acao: e.target.value, pagina: 1 }))}
                    >
                      <option value="">Todas</option>
                      <option value="ENTRADA_ESTOQUE">Entrada</option>
                      <option value="SAIDA_ESTOQUE">Saída</option>
                      <option value="CREATE">Criação</option>
                      <option value="UPDATE">Atualização</option>
                      <option value="DEACTIVATE">Desativação</option>
                      <option value="LOGIN">Login</option>
                      <option value="LOGOUT">Logout</option>
                    </select>
                  </div>
                </div>
                <div style={{ minWidth: 160 }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Entidade</label>
                    <select
                      className="form-select"
                      value={filtros.entidade}
                      onChange={(e) => setFiltros((p) => ({ ...p, entidade: e.target.value, pagina: 1 }))}
                    >
                      <option value="">Todas</option>
                      <option value="produto">Produto</option>
                      <option value="fornecedor">Fornecedor</option>
                      <option value="movimentacao">Movimentação</option>
                      <option value="usuario">Usuário</option>
                      <option value="auth">Autenticação</option>
                    </select>
                  </div>
                </div>
                <div style={{ minWidth: 150 }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">De</label>
                    <input
                      type="date"
                      className="form-input"
                      value={filtros.data_inicio}
                      onChange={(e) => setFiltros((p) => ({ ...p, data_inicio: e.target.value, pagina: 1 }))}
                    />
                  </div>
                </div>
                <div style={{ minWidth: 150 }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Até</label>
                    <input
                      type="date"
                      className="form-input"
                      value={filtros.data_fim}
                      onChange={(e) => setFiltros((p) => ({ ...p, data_fim: e.target.value, pagina: 1 }))}
                    />
                  </div>
                </div>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setFiltros({ usuario_id: '', acao: '', entidade: '', data_inicio: '', data_fim: '', pagina: 1 })}
                >
                  Limpar
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="card">
          <div className="card-body" style={{ padding: 0 }}>
            <div style={{ padding: 'var(--space-3) var(--space-5)', borderBottom: '1px solid var(--neutral-200)' }}>
              <span className="body-s">
                {loading ? 'Carregando...' : `${paginacao.total || 0} registros encontrados`}
              </span>
            </div>

            {loading ? (
              <SkeletonLogs />
            ) : logs.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <FileText size={32} />
                </div>
                <h3>Nenhum registro encontrado</h3>
                <p>Não há logs de auditoria para os filtros selecionados.</p>
              </div>
            ) : (
              <ul className="log-timeline">
                {logs.map((log) => (
                  <LogItem key={log.id} log={log} />
                ))}
              </ul>
            )}
          </div>

          {!loading && logs.length > 0 && (
            <div className="table-pagination">
              <span>
                {paginacao.total} registros · Página {paginacao.pagina} de {paginacao.totalPaginas || 1}
              </span>
              <div className="flex gap-2 items-center">
                <button
                  className="btn btn-secondary btn-icon btn-sm"
                  disabled={paginacao.pagina <= 1}
                  onClick={() => setFiltros((p) => ({ ...p, pagina: p.pagina - 1 }))}
                >
                  <ChevronLeft size={15} />
                </button>
                <button
                  className="btn btn-secondary btn-icon btn-sm"
                  disabled={paginacao.pagina >= paginacao.totalPaginas}
                  onClick={() => setFiltros((p) => ({ ...p, pagina: p.pagina + 1 }))}
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
