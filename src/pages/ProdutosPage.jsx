// ============================================
// INVENTÁRIO — Grid de Dados com Export + Barcode
// ============================================
import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useProdutos } from '../hooks/useProdutos';
import MainLayout from '../components/layout/MainLayout';
import ConfirmModal from '../components/ui/ConfirmModal';
import BarcodeScanner from '../components/BarcodeScanner';
import { exportToCSV, exportToPDF } from '../lib/export';
import {
  formatarData, formatarMoeda, statusEstoque, statusVencimento,
  CATEGORIAS
} from '../lib/utils';
import {
  Search, Plus, Filter, Package, ChevronLeft, ChevronRight,
  PackageOpen, Eye, Edit2, Trash2, FileDown, FileText, ScanLine
} from 'lucide-react';
import toast from 'react-hot-toast';

function getBadgeClass(status) {
  if (status.cor === 'red') return 'badge-danger';
  if (status.cor === 'orange') return 'badge-warning';
  if (status.cor === 'green') return 'badge-success';
  return 'badge-neutral';
}

function getStockBadge(qtd, min) {
  return getBadgeClass(statusEstoque(qtd, min));
}

export default function ProdutosPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { produtos, loading, paginacao, listar, excluir } = useProdutos();
  const [filtros, setFiltros] = useState({
    busca: '',
    categoria: '',
    status: 'ativo',
    estoque: searchParams.get('estoque') || '',
    vencimento: searchParams.get('vencimento') || '',
    pagina: 1,
    por_pagina: 20,
  });
  const [showFilters, setShowFilters] = useState(!!filtros.estoque || !!filtros.vencimento);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null, nome: '' });
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const filtrosLimpos = {};
      Object.entries(filtros).forEach(([k, v]) => { if (v) filtrosLimpos[k] = v; });
      listar(filtrosLimpos);
    }, 300);
    return () => clearTimeout(timer);
  }, [filtros, listar]);

  function handleFiltro(campo, valor) {
    setFiltros(prev => ({ ...prev, [campo]: valor, pagina: 1 }));
  }

  function handleExcluir(id, nome) {
    setConfirmModal({ isOpen: true, id, nome });
  }

  async function confirmarExclusao() {
    try {
      await excluir(confirmModal.id);
      toast.success('Produto excluído com sucesso');
      listar(filtros);
    } catch {
      toast.error('Erro ao excluir produto');
    }
  }

  function handleBarcodeScan(code) {
    setShowScanner(false);
    handleFiltro('busca', code);
    toast.success(`Código detectado: ${code}`);
  }

  const exportColumns = [
    { key: 'nome', label: 'Produto' },
    { key: 'categoria', label: 'Categoria' },
    { key: 'lote', label: 'Lote' },
    { key: 'data_validade', label: 'Validade' },
    { key: 'quantidade_atual', label: 'Qtd Atual' },
    { key: 'quantidade_minima', label: 'Qtd Mínima' },
    { key: 'unidade_medida', label: 'Unidade' },
    { key: 'preco_unitario', label: 'Preço Unitário' },
    { key: 'fornecedor.nome', label: 'Fornecedor' },
  ];

  function handleExportCSV() {
    exportToCSV(produtos, 'inventario', exportColumns);
    toast.success('CSV exportado!');
  }

  function handleExportPDF() {
    exportToPDF('Relatório de Inventário', produtos, exportColumns);
  }

  const activeFilterCount = [filtros.categoria, filtros.estoque, filtros.vencimento].filter(Boolean).length;

  return (
    <MainLayout>
      <div className="page-header no-print">
        <div className="page-header-left">
          <div className="breadcrumb">
            <Link to="/dashboard">Dashboard</Link>
            <span>/</span>
            <span>Inventário</span>
          </div>
          <h1 className="display-l" style={{ fontSize: 24 }}>Inventário</h1>
        </div>
        <div className="page-header-right">
          <button className="btn btn-secondary btn-sm" onClick={() => setShowScanner(true)} title="Escanear código de barras">
            <ScanLine size={16} />
            <span className="hide-mobile">Escanear</span>
          </button>
          <button className="btn btn-secondary btn-sm" onClick={handleExportCSV} title="Exportar CSV">
            <FileDown size={16} />
            <span className="hide-mobile">CSV</span>
          </button>
          <button className="btn btn-secondary btn-sm" onClick={handleExportPDF} title="Exportar PDF">
            <FileText size={16} />
            <span className="hide-mobile">PDF</span>
          </button>
          <Link to="/produtos/novo" className="btn btn-primary">
            <Plus size={16} />
            Novo Produto
          </Link>
        </div>
      </div>

      <div className="page-body">
        {!loading && produtos.length === 0 && !filtros.busca && !filtros.categoria && !filtros.estoque && !filtros.vencimento && (
          <div className="empty-state">
            <div className="empty-state-icon"><PackageOpen size={32} /></div>
            <h3>Seu estoque está vazio</h3>
            <p>Cadastre seu primeiro produto para começar a gerenciar seu inventário.</p>
            <Link to="/produtos/novo" className="btn btn-primary"><Plus size={16} /> Cadastrar produto</Link>
          </div>
        )}

        {(loading || produtos.length > 0 || filtros.busca || filtros.categoria || filtros.estoque || filtros.vencimento) && (
          <div className="data-table-container">
            <div className="table-toolbar">
              <div className="table-toolbar-left">
                <div className="table-search">
                  <Search size={16} className="search-icon" />
                  <input className="form-input" style={{ paddingLeft: 36 }} type="text"
                    placeholder="Buscar por nome, código de barras..."
                    value={filtros.busca} onChange={e => handleFiltro('busca', e.target.value)} />
                </div>
                <button className={`btn btn-secondary btn-sm ${showFilters ? 'active' : ''}`}
                  onClick={() => setShowFilters(!showFilters)}
                  style={showFilters ? { borderColor: 'var(--brand-500)', color: 'var(--brand-600)' } : {}}>
                  <Filter size={14} /> Filtros
                  {activeFilterCount > 0 && (
                    <span className="badge badge-brand" style={{ marginLeft: 4, padding: '0 6px', fontSize: 11 }}>{activeFilterCount}</span>
                  )}
                </button>
              </div>
              <div className="table-toolbar-right">
                <select className="form-select btn-sm" style={{ width: 'auto', minHeight: 32 }}
                  value={filtros.status} onChange={e => handleFiltro('status', e.target.value)}>
                  <option value="ativo">Ativos</option>
                  <option value="inativo">Inativos</option>
                  <option value="todos">Todos</option>
                </select>
              </div>
            </div>

            {showFilters && (
              <div style={{ padding: 'var(--space-3) var(--space-4)', background: 'var(--neutral-50)', borderBottom: '1px solid var(--neutral-200)', display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
                <select className="form-select" style={{ width: 'auto', minHeight: 32, fontSize: 13 }}
                  value={filtros.categoria} onChange={e => handleFiltro('categoria', e.target.value)}>
                  <option value="">Todas as categorias</option>
                  {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select className="form-select" style={{ width: 'auto', minHeight: 32, fontSize: 13 }}
                  value={filtros.estoque} onChange={e => handleFiltro('estoque', e.target.value)}>
                  <option value="">Todo estoque</option>
                  <option value="baixo">Estoque baixo</option>
                  <option value="zerado">Sem estoque</option>
                </select>
                <select className="form-select" style={{ width: 'auto', minHeight: 32, fontSize: 13 }}
                  value={filtros.vencimento} onChange={e => handleFiltro('vencimento', e.target.value)}>
                  <option value="">Toda validade</option>
                  <option value="proximo">Vencendo (30d)</option>
                  <option value="vencido">Vencidos</option>
                </select>
                {(filtros.categoria || filtros.estoque || filtros.vencimento) && (
                  <button className="btn btn-ghost btn-sm" onClick={() => setFiltros(prev => ({
                    ...prev, categoria: '', estoque: '', vencimento: '', pagina: 1
                  }))}>Limpar filtros</button>
                )}
              </div>
            )}

            {loading && (
              <div style={{ padding: 'var(--space-2)' }}>
                {[1, 2, 3, 4, 5].map(i => <div key={i} className="skeleton skeleton-row" />)}
              </div>
            )}

            {!loading && (
              <>
                {/* Desktop table */}
                <table className="data-table hide-mobile-table">
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>Produto</th>
                      <th>Lote</th>
                      <th>Validade</th>
                      <th>Qtd Atual</th>
                      <th>Preço Un.</th>
                      <th>Valor Total</th>
                      <th style={{ textAlign: 'right' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {produtos.map(prod => {
                      const est = statusEstoque(prod.quantidade_atual, prod.quantidade_minima);
                      const val = statusVencimento(prod.data_validade);
                      const worstStatus = est.urgencia >= val.urgencia ? est : val;
                      return (
                        <tr key={prod.id} style={!prod.ativo ? { opacity: 0.5 } : {}}>
                          <td>
                            <span className={`badge ${getBadgeClass(worstStatus)}`}>
                              <span className="badge-dot" />
                              {worstStatus.texto}
                            </span>
                          </td>
                          <td>
                            <div className="table-product-cell">
                              <div className="table-product-icon"><Package size={16} /></div>
                              <div className="table-product-info">
                                <div className="name">{prod.nome}</div>
                                <div className="sub">{prod.categoria || 'Sem categoria'} · {prod.fornecedor?.nome || 'Sem fornecedor'}</div>
                              </div>
                            </div>
                          </td>
                          <td><span className="mono-s">{prod.lote || '—'}</span></td>
                          <td>
                            <span style={{ color: `var(--${val.cor === 'red' ? 'destructive' : val.cor === 'orange' ? 'warning' : val.cor === 'green' ? 'success' : 'neutral'}-500)` }}>
                              {prod.data_validade ? formatarData(prod.data_validade) : '—'}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${getStockBadge(prod.quantidade_atual, prod.quantidade_minima)}`}>
                              {prod.quantidade_atual} {prod.unidade_medida}
                            </span>
                          </td>
                          <td>{formatarMoeda(prod.preco_unitario)}</td>
                          <td style={{ fontWeight: 600, color: 'var(--neutral-800)' }}>
                            {formatarMoeda((prod.preco_unitario || 0) * (prod.quantidade_atual || 0))}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div className="flex items-center gap-1" style={{ justifyContent: 'flex-end' }}>
                              <button className="btn btn-ghost btn-icon btn-sm" title="Ver" onClick={() => navigate(`/produtos/${prod.id}`)}><Eye size={15} /></button>
                              <button className="btn btn-ghost btn-icon btn-sm" title="Editar" onClick={() => navigate(`/produtos/${prod.id}/editar`)}><Edit2 size={15} /></button>
                              <button className="btn btn-ghost btn-icon btn-sm text-danger" title="Excluir" onClick={() => handleExcluir(prod.id, prod.nome)}><Trash2 size={15} /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {produtos.length === 0 && (
                      <tr><td colSpan="8" style={{ textAlign: 'center', padding: 'var(--space-8)' }}><p className="body-s">Nenhum resultado</p></td></tr>
                    )}
                  </tbody>
                </table>

                {/* Mobile cards */}
                <div className="mobile-cards show-mobile-only">
                  {produtos.map(prod => {
                    const est = statusEstoque(prod.quantidade_atual, prod.quantidade_minima);
                    const val = statusVencimento(prod.data_validade);
                    const worstStatus = est.urgencia >= val.urgencia ? est : val;
                    return (
                      <div key={prod.id} className="mobile-product-card" onClick={() => navigate(`/produtos/${prod.id}`)}>
                        <div className="flex items-center justify-between mb-2">
                          <span style={{ fontWeight: 600, fontSize: 14 }}>{prod.nome}</span>
                          <span className={`badge ${getBadgeClass(worstStatus)}`} style={{ fontSize: 11 }}>{worstStatus.texto}</span>
                        </div>
                        <div className="flex items-center justify-between body-s text-muted">
                          <span>{prod.categoria || 'Sem categoria'}</span>
                          <span style={{ fontWeight: 600, color: 'var(--neutral-800)' }}>{prod.quantidade_atual} {prod.unidade_medida}</span>
                        </div>
                        <div className="flex items-center justify-between body-s text-muted" style={{ marginTop: 4 }}>
                          <span>Lote: {prod.lote || '—'}</span>
                          <span>{formatarMoeda(prod.preco_unitario)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="table-pagination">
                  <span>{paginacao.total} produto{paginacao.total !== 1 ? 's' : ''}</span>
                  <div className="flex items-center gap-2">
                    <span className="body-s">Página {paginacao.pagina} de {paginacao.totalPaginas || 1}</span>
                    <button className="btn btn-ghost btn-icon btn-sm" disabled={paginacao.pagina <= 1}
                      onClick={() => setFiltros(p => ({ ...p, pagina: p.pagina - 1 }))}><ChevronLeft size={16} /></button>
                    <button className="btn btn-ghost btn-icon btn-sm" disabled={paginacao.pagina >= paginacao.totalPaginas}
                      onClick={() => setFiltros(p => ({ ...p, pagina: p.pagina + 1 }))}><ChevronRight size={16} /></button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, id: null, nome: '' })}
        onConfirm={confirmarExclusao}
        title="Excluir Produto"
        message={`Tem certeza que deseja excluir o produto "${confirmModal.nome}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        variant="danger"
      />

      {showScanner && (
        <BarcodeScanner
          onScan={handleBarcodeScan}
          onClose={() => setShowScanner(false)}
        />
      )}
    </MainLayout>
  );
}
