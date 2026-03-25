// ============================================
// MOVIMENTAÇÕES — Histórico com Export
// ============================================
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import { useMovimentacoes } from '../hooks/useMovimentacoes';
import { exportToCSV, exportToPDF } from '../lib/export';
import { formatarDataHora, tempoRelativo } from '../lib/utils';
import {
  ArrowDownLeft, ArrowUpRight, Package, Filter, ChevronLeft,
  ChevronRight, Search, ArrowLeftRight, Eye, FileDown, FileText,
  ArrowDownCircle, ArrowUpCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

function getTipoBadge(tipo) {
  if (tipo === 'ENTRADA') return 'badge badge-success';
  if (tipo === 'SAIDA') return 'badge badge-danger';
  return 'badge badge-neutral';
}

function getTipoIcon(tipo) {
  if (tipo === 'ENTRADA') return <ArrowDownLeft size={14} />;
  if (tipo === 'SAIDA') return <ArrowUpRight size={14} />;
  return <ArrowLeftRight size={14} />;
}

function SkeletonRows() {
  return Array.from({ length: 5 }).map((_, i) => (
    <tr key={i}>
      <td><div className="skeleton skeleton-text" style={{ width: 120 }} /></td>
      <td><div className="skeleton skeleton-text" style={{ width: 80 }} /></td>
      <td><div className="skeleton skeleton-text" style={{ width: 160 }} /></td>
      <td><div className="skeleton skeleton-text" style={{ width: 70 }} /></td>
      <td><div className="skeleton skeleton-text" style={{ width: 100 }} /></td>
      <td><div className="skeleton skeleton-text short" /></td>
    </tr>
  ));
}

export default function MovimentacoesPage() {
  const navigate = useNavigate();
  const { movimentacoes, loading, paginacao, listar } = useMovimentacoes();
  const [filtros, setFiltros] = useState({ tipo: '', busca: '', pagina: 1, por_pagina: 15 });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const limpos = {};
      Object.entries(filtros).forEach(([k, v]) => { if (v) limpos[k] = v; });
      listar(limpos);
    }, 300);
    return () => clearTimeout(timer);
  }, [filtros, listar]);

  const exportColumns = [
    { key: 'criado_em', label: 'Data/Hora' },
    { key: 'tipo', label: 'Tipo' },
    { key: 'produto.nome', label: 'Produto' },
    { key: 'quantidade', label: 'Quantidade' },
    { key: 'motivo', label: 'Motivo' },
    { key: 'usuario.nome', label: 'Responsável' },
  ];

  function handleExportCSV() {
    exportToCSV(movimentacoes, 'movimentacoes', exportColumns);
    toast.success('CSV exportado!');
  }

  function handleExportPDF() {
    exportToPDF('Relatório de Movimentações', movimentacoes, exportColumns);
  }

  return (
    <MainLayout>
      <div className="page-header">
        <div className="page-header-left">
          <div className="breadcrumb">
            <Link to="/dashboard">Dashboard</Link>
            <span className="text-muted">/</span>
            <span>Movimentações</span>
          </div>
          <h1 className="display-l" style={{ fontSize: 24 }}>Movimentações</h1>
        </div>
        <div className="page-header-right">
          <button className="btn btn-secondary btn-sm" onClick={handleExportCSV}>
            <FileDown size={16} /> <span className="hide-mobile">CSV</span>
          </button>
          <button className="btn btn-secondary btn-sm" onClick={handleExportPDF}>
            <FileText size={16} /> <span className="hide-mobile">PDF</span>
          </button>
          <Link to="/movimentacoes/entrada" className="btn btn-secondary btn-sm">
            <ArrowDownCircle size={16} /> <span className="hide-mobile">Entrada</span>
          </Link>
          <Link to="/movimentacoes/saida" className="btn btn-primary btn-sm">
            <ArrowUpCircle size={16} /> <span className="hide-mobile">Saída</span>
          </Link>
        </div>
      </div>

      <div className="page-body">
        <div className="data-table-container">
          <div className="table-toolbar">
            <div className="table-toolbar-left">
              <div className="table-search">
                <Search size={15} className="search-icon" />
                <input type="text" className="form-input" placeholder="Buscar produto..."
                  value={filtros.busca} onChange={e => setFiltros(p => ({ ...p, busca: e.target.value, pagina: 1 }))} />
              </div>
              <select className="form-select btn-sm" style={{ width: 'auto', minHeight: 32 }}
                value={filtros.tipo} onChange={e => setFiltros(p => ({ ...p, tipo: e.target.value, pagina: 1 }))}>
                <option value="">Todas</option>
                <option value="ENTRADA">Entradas</option>
                <option value="SAIDA">Saídas</option>
              </select>
            </div>
            <div className="table-toolbar-right">
              <span className="body-s">{loading ? 'Carregando...' : `${paginacao.total || 0} registros`}</span>
            </div>
          </div>

          <table className="data-table hide-mobile-table">
            <thead>
              <tr>
                <th>Data / Hora</th>
                <th>Tipo</th>
                <th>Produto</th>
                <th>Qtd.</th>
                <th>Motivo</th>
                <th>Responsável</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <SkeletonRows /> : movimentacoes.length === 0 ? (
                <tr><td colSpan={6}>
                  <div className="empty-state">
                    <div className="empty-state-icon"><ArrowLeftRight size={32} /></div>
                    <h3>Nenhuma movimentação</h3>
                    <p>Registre entradas e saídas para ver o histórico.</p>
                  </div>
                </td></tr>
              ) : movimentacoes.map(mov => (
                <tr key={mov.id}>
                  <td>
                    <span className="mono-s">{formatarDataHora(mov.criado_em)}</span><br />
                    <span className="body-s">{tempoRelativo(mov.criado_em)}</span>
                  </td>
                  <td><span className={getTipoBadge(mov.tipo)}>{getTipoIcon(mov.tipo)} {mov.tipo === 'ENTRADA' ? 'Entrada' : 'Saída'}</span></td>
                  <td>
                    <div className="table-product-cell">
                      <div className="table-product-icon"><Package size={16} /></div>
                      <div className="table-product-info">
                        <span className="name" style={{ cursor: 'pointer', color: 'var(--brand-700)' }}
                          onClick={() => navigate(`/produtos/${mov.produto?.id}`)}>{mov.produto?.nome || '—'}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <strong style={{ color: mov.tipo === 'ENTRADA' ? 'var(--success-600)' : 'var(--destructive-600)' }}>
                      {mov.tipo === 'ENTRADA' ? '+' : '-'}{mov.quantidade} {mov.produto?.unidade_medida}
                    </strong>
                  </td>
                  <td><span className="body-s">{mov.motivo || '—'}</span></td>
                  <td><span className="body-s">{mov.usuario?.nome || 'Sistema'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile cards */}
          <div className="mobile-cards show-mobile-only">
            {movimentacoes.map(mov => (
              <div key={mov.id} className="mobile-product-card">
                <div className="flex items-center justify-between mb-2">
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{mov.produto?.nome || '—'}</span>
                  <span className={getTipoBadge(mov.tipo)} style={{ fontSize: 11 }}>{mov.tipo === 'ENTRADA' ? 'Entrada' : 'Saída'}</span>
                </div>
                <div className="flex items-center justify-between body-s">
                  <span className="text-muted">{tempoRelativo(mov.criado_em)}</span>
                  <strong style={{ color: mov.tipo === 'ENTRADA' ? 'var(--success-600)' : 'var(--destructive-600)' }}>
                    {mov.tipo === 'ENTRADA' ? '+' : '-'}{mov.quantidade} {mov.produto?.unidade_medida}
                  </strong>
                </div>
                <div className="body-s text-muted" style={{ marginTop: 2 }}>{mov.motivo || '—'} · {mov.usuario?.nome || 'Sistema'}</div>
              </div>
            ))}
          </div>

          {!loading && movimentacoes.length > 0 && (
            <div className="table-pagination">
              <span>Mostrando {movimentacoes.length} de {paginacao.total}</span>
              <div className="flex gap-2 items-center">
                <button className="btn btn-secondary btn-icon btn-sm" disabled={paginacao.pagina <= 1}
                  onClick={() => setFiltros(p => ({ ...p, pagina: p.pagina - 1 }))}><ChevronLeft size={15} /></button>
                <span className="body-s">Página {paginacao.pagina} de {paginacao.totalPaginas || 1}</span>
                <button className="btn btn-secondary btn-icon btn-sm" disabled={paginacao.pagina >= paginacao.totalPaginas}
                  onClick={() => setFiltros(p => ({ ...p, pagina: p.pagina + 1 }))}><ChevronRight size={15} /></button>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
