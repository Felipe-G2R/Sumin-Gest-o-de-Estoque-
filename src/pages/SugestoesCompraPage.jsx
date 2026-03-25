// ============================================
// SUGESTOES DE COMPRA — Lista Automatica
// ============================================
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useRelatorios } from '../hooks/useRelatorios';
import MainLayout from '../components/layout/MainLayout';
import { exportToCSV, exportToPDF } from '../lib/export';
import { formatarMoeda } from '../lib/utils';
import {
  ShoppingCart, RefreshCw, FileDown, FileText, AlertTriangle, Package,
  DollarSign, Layers, Loader2
} from 'lucide-react';

function getUrgenciaBadge(urgencia) {
  switch (urgencia) {
    case 'CRITICA': return 'badge-danger';
    case 'ALTA': return 'badge-warning';
    case 'MEDIA': return 'badge-neutral';
    default: return 'badge-neutral';
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
  return Array.from({ length: 5 }).map((_, i) => (
    <tr key={i}>
      <td><div className="skeleton skeleton-text" style={{ width: 150 }} /></td>
      <td><div className="skeleton skeleton-text" style={{ width: 80 }} /></td>
      <td><div className="skeleton skeleton-text" style={{ width: 60 }} /></td>
      <td><div className="skeleton skeleton-text" style={{ width: 60 }} /></td>
      <td><div className="skeleton skeleton-text" style={{ width: 60 }} /></td>
      <td><div className="skeleton skeleton-text" style={{ width: 60 }} /></td>
      <td><div className="skeleton skeleton-text" style={{ width: 80 }} /></td>
      <td><div className="skeleton skeleton-text" style={{ width: 100 }} /></td>
      <td><div className="skeleton skeleton-text" style={{ width: 70 }} /></td>
    </tr>
  ));
}

export default function SugestoesCompraPage() {
  const { sugestoesCompra, loading, carregarSugestoesCompra } = useRelatorios();
  const [refreshing, setRefreshing] = useState(false);
  const [groupByFornecedor, setGroupByFornecedor] = useState(false);

  useEffect(() => {
    carregarSugestoesCompra();
  }, [carregarSugestoesCompra]);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await carregarSugestoesCompra();
    } finally {
      setRefreshing(false);
    }
  }

  const exportColumns = [
    { key: 'nome', label: 'Produto' },
    { key: 'categoria', label: 'Categoria' },
    { key: 'quantidade_atual', label: 'Estoque Atual' },
    { key: 'quantidade_minima', label: 'Mínimo' },
    { key: 'consumo_mensal', label: 'Consumo Mensal' },
    { key: 'quantidade_sugerida', label: 'Qtd Sugerida' },
    { key: 'custo_estimado', label: 'Custo Estimado (R$)' },
    { key: 'fornecedor_nome', label: 'Fornecedor' },
    { key: 'urgencia', label: 'Urgência' },
  ];

  function handleExportCSV() {
    exportToCSV(sugestoesCompra, 'sugestoes-compra', exportColumns);
  }

  function handleExportPDF() {
    exportToPDF('Sugestões de Compra', sugestoesCompra, exportColumns);
  }

  const totalSugestoes = sugestoesCompra.length;
  const criticas = sugestoesCompra.filter(s => s.urgencia === 'CRITICA').length;
  const custoTotal = sugestoesCompra.reduce((acc, s) => acc + (Number(s.custo_estimado) || 0), 0);

  // Group by fornecedor
  const fornecedoresAgrupados = {};
  if (groupByFornecedor) {
    sugestoesCompra.forEach(s => {
      const nome = s.fornecedor_nome || 'Sem fornecedor';
      if (!fornecedoresAgrupados[nome]) {
        fornecedoresAgrupados[nome] = [];
      }
      fornecedoresAgrupados[nome].push(s);
    });
  }

  function renderTable(items) {
    return (
      <table className="data-table">
        <thead>
          <tr>
            <th>Produto</th>
            <th>Categoria</th>
            <th style={{ textAlign: 'right' }}>Estoque Atual</th>
            <th style={{ textAlign: 'right' }}>Minimo</th>
            <th style={{ textAlign: 'right' }}>Consumo Mensal</th>
            <th style={{ textAlign: 'right' }}>Qtd Sugerida</th>
            <th style={{ textAlign: 'right' }}>Custo Estimado</th>
            {!groupByFornecedor && <th>Fornecedor</th>}
            <th>Urgencia</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={idx}>
              <td>
                <div className="flex items-center gap-2">
                  <div style={{
                    width: 32, height: 32, borderRadius: 'var(--radius-md)',
                    background: 'var(--neutral-100)', color: 'var(--neutral-500)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    <Package size={14} />
                  </div>
                  <strong className="body-s">{item.nome}</strong>
                </div>
              </td>
              <td><span className="body-s">{item.categoria || '—'}</span></td>
              <td style={{ textAlign: 'right' }}>
                <span style={{
                  color: item.quantidade_atual === 0 ? 'var(--destructive-600)' :
                         item.quantidade_atual <= item.quantidade_minima ? 'var(--warning-600)' : 'var(--neutral-700)',
                  fontWeight: 600
                }}>
                  {item.quantidade_atual}
                </span>
              </td>
              <td style={{ textAlign: 'right' }}>{item.quantidade_minima}</td>
              <td style={{ textAlign: 'right' }}>{Number(item.consumo_mensal || 0).toFixed(1)}</td>
              <td style={{ textAlign: 'right' }}>
                <strong style={{ color: 'var(--brand-700)' }}>{item.quantidade_sugerida}</strong>
              </td>
              <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatarMoeda(item.custo_estimado)}</td>
              {!groupByFornecedor && (
                <td><span className="body-s">{item.fornecedor_nome || '—'}</span></td>
              )}
              <td>
                <span className={`badge ${getUrgenciaBadge(item.urgencia)}`}>
                  {item.urgencia}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  return (
    <MainLayout>
      <div className="page-header">
        <div className="page-header-left">
          <div className="breadcrumb">
            <Link to="/dashboard">Dashboard</Link>
            <span>/</span>
            <span>Sugestoes de Compra</span>
          </div>
          <h1 className="display-l" style={{ fontSize: 24 }}>Sugestoes de Compra</h1>
        </div>
        <div className="page-header-right">
          <button
            className="btn btn-secondary"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? <Loader2 size={16} className="spin" /> : <RefreshCw size={16} />}
            Atualizar
          </button>
          <button className="btn btn-secondary" onClick={handleExportCSV} disabled={!sugestoesCompra.length}>
            <FileDown size={16} /> CSV
          </button>
          <button className="btn btn-secondary" onClick={handleExportPDF} disabled={!sugestoesCompra.length}>
            <FileText size={16} /> PDF
          </button>
        </div>
      </div>

      <div className="page-body">
        {/* Stats Cards */}
        {loading && !sugestoesCompra.length ? (
          <SkeletonCards />
        ) : (
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <div className="stat-card">
              <div className="stat-card-info">
                <div className="stat-card-label">Total Sugestoes</div>
                <div className="stat-card-value">{totalSugestoes}</div>
              </div>
              <div className="stat-card-icon brand">
                <ShoppingCart size={22} />
              </div>
            </div>
            <div className={`stat-card ${criticas > 0 ? 'danger' : ''}`}>
              <div className="stat-card-info">
                <div className="stat-card-label">Urgencia Critica</div>
                <div className="stat-card-value">{criticas}</div>
              </div>
              <div className={`stat-card-icon ${criticas > 0 ? 'danger' : 'brand'}`}>
                <AlertTriangle size={22} />
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-card-info">
                <div className="stat-card-label">Custo Total Estimado</div>
                <div className="stat-card-value" style={{ fontSize: 20 }}>{formatarMoeda(custoTotal)}</div>
              </div>
              <div className="stat-card-icon info">
                <DollarSign size={22} />
              </div>
            </div>
          </div>
        )}

        {/* Group toggle */}
        <div className="flex items-center justify-between mb-4">
          <span className="body-s text-muted">
            {totalSugestoes} produto(s) precisam de reposicao
          </span>
          <button
            className={`btn btn-sm ${groupByFornecedor ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setGroupByFornecedor(!groupByFornecedor)}
          >
            <Layers size={14} />
            {groupByFornecedor ? 'Agrupar: Fornecedor' : 'Agrupar por Fornecedor'}
          </button>
        </div>

        {/* Empty State */}
        {!loading && sugestoesCompra.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">
              <ShoppingCart size={32} />
            </div>
            <h3>Nenhuma sugestao de compra</h3>
            <p>Todos os produtos estao com estoque adequado. Nenhuma reposicao necessaria no momento.</p>
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && sugestoesCompra.length === 0 && (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Categoria</th>
                  <th>Estoque Atual</th>
                  <th>Minimo</th>
                  <th>Consumo Mensal</th>
                  <th>Qtd Sugerida</th>
                  <th>Custo Estimado</th>
                  <th>Fornecedor</th>
                  <th>Urgencia</th>
                </tr>
              </thead>
              <tbody>
                <SkeletonRows />
              </tbody>
            </table>
          </div>
        )}

        {/* Table - Flat view */}
        {!loading && sugestoesCompra.length > 0 && !groupByFornecedor && (
          <div className="data-table-container">
            {renderTable(sugestoesCompra)}
          </div>
        )}

        {/* Table - Grouped by Fornecedor */}
        {!loading && sugestoesCompra.length > 0 && groupByFornecedor && (
          <div>
            {Object.entries(fornecedoresAgrupados).map(([fornecedor, items]) => {
              const subtotal = items.reduce((acc, i) => acc + (Number(i.custo_estimado) || 0), 0);
              return (
                <div key={fornecedor} className="mb-4">
                  <div className="card">
                    <div className="card-body" style={{ paddingBottom: 0 }}>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="heading-s">{fornecedor}</h3>
                        <span className="body-s" style={{ fontWeight: 600 }}>
                          {items.length} item(s) - Subtotal: {formatarMoeda(subtotal)}
                        </span>
                      </div>
                    </div>
                    <div className="data-table-container" style={{ border: 'none', borderRadius: 0 }}>
                      {renderTable(items)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
