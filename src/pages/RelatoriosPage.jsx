// ============================================
// RELATÓRIOS — Dashboard Analítico com Tabs
// ============================================
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useRelatorios } from '../hooks/useRelatorios';
import MainLayout from '../components/layout/MainLayout';
import Tabs from '../components/ui/Tabs';
import CategoriasPieChart from '../components/charts/CategoriasPieChart';
import { exportToCSV, exportToPDF } from '../lib/export';
import { formatarMoeda, formatarData } from '../lib/utils';
import {
  BarChart3, FileDown, FileText, TrendingUp, AlertTriangle, DollarSign,
  PieChart, Package
} from 'lucide-react';

// ---- Tab: Consumo ----
function ConsumoTab({ carregarConsumo, consumo, loading }) {
  const [dias, setDias] = useState(30);

  useEffect(() => {
    carregarConsumo(dias);
  }, [dias, carregarConsumo]);

  const columns = [
    { key: 'nome', label: 'Produto' },
    { key: 'categoria', label: 'Categoria' },
    { key: 'unidade_medida', label: 'Unidade' },
    { key: 'total_quantidade', label: 'Qtd Consumida' },
    { key: 'movimentacoes', label: 'Movimentações' },
    { key: 'total_valor', label: 'Valor Total (R$)' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4" style={{ flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div className="flex items-center gap-2">
          <span className="body-s text-muted">Período:</span>
          {[7, 30, 90].map(d => (
            <button key={d} className={`btn btn-sm ${dias === d ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setDias(d)}>{d} dias</button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-secondary btn-sm" onClick={() => exportToCSV(consumo, 'relatorio-consumo', columns)} disabled={!consumo.length}>
            <FileDown size={14} /> CSV
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => exportToPDF(`Relatório de Consumo — ${dias} dias`, consumo, columns)} disabled={!consumo.length}>
            <FileText size={14} /> PDF
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 'var(--space-4)' }}>
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="skeleton skeleton-row" />)}
        </div>
      ) : consumo.length === 0 ? (
        <div className="empty-state">
          <h3>Sem dados de consumo</h3>
          <p>Não há registros de saída no período selecionado.</p>
        </div>
      ) : (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Categoria</th>
                <th>Unidade</th>
                <th style={{ textAlign: 'right' }}>Qtd Consumida</th>
                <th style={{ textAlign: 'right' }}>Movimentações</th>
                <th style={{ textAlign: 'right' }}>Valor Total</th>
              </tr>
            </thead>
            <tbody>
              {consumo.map((item, idx) => (
                <tr key={item.produto_id || idx}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="table-product-icon" style={{ width: 28, height: 28 }}>
                        <Package size={13} />
                      </div>
                      <strong>{item.nome}</strong>
                    </div>
                  </td>
                  <td><span className="badge badge-neutral">{item.categoria || '—'}</span></td>
                  <td><span className="mono-s">{item.unidade_medida}</span></td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{item.total_quantidade}</td>
                  <td style={{ textAlign: 'right' }}>{item.movimentacoes}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--brand-700)' }}>{formatarMoeda(item.total_valor)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: 'var(--neutral-50)' }}>
                <td colSpan={3} style={{ fontWeight: 600 }}>Total</td>
                <td style={{ textAlign: 'right', fontWeight: 700 }}>{consumo.reduce((s, i) => s + i.total_quantidade, 0)}</td>
                <td style={{ textAlign: 'right', fontWeight: 700 }}>{consumo.reduce((s, i) => s + i.movimentacoes, 0)}</td>
                <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--brand-700)' }}>{formatarMoeda(consumo.reduce((s, i) => s + i.total_valor, 0))}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

// ---- Tab: Curva ABC ----
function CurvaABCTab({ carregarCurvaABC, curvaABC, loading }) {
  useEffect(() => {
    carregarCurvaABC(90);
  }, [carregarCurvaABC]);

  function getClassBadge(c) {
    if (c === 'A') return 'badge-danger';
    if (c === 'B') return 'badge-warning';
    return 'badge-neutral';
  }

  const columns = [
    { key: 'nome', label: 'Produto' },
    { key: 'categoria', label: 'Categoria' },
    { key: 'classificacao', label: 'Classe' },
    { key: 'total_valor', label: 'Valor Total (R$)' },
    { key: 'percentual', label: '% do Total' },
    { key: 'percentual_acumulado', label: '% Acumulado' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4" style={{ flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <p className="body-s text-muted">
          Classificação por valor de consumo (90 dias): <strong>A</strong> = 80% do valor, <strong>B</strong> = 15%, <strong>C</strong> = 5%.
        </p>
        <div className="flex items-center gap-2">
          <button className="btn btn-secondary btn-sm" onClick={() => exportToCSV(curvaABC, 'curva-abc', columns)} disabled={!curvaABC.length}>
            <FileDown size={14} /> CSV
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => exportToPDF('Relatório Curva ABC', curvaABC, columns)} disabled={!curvaABC.length}>
            <FileText size={14} /> PDF
          </button>
        </div>
      </div>

      {/* Summary cards */}
      {!loading && curvaABC.length > 0 && (
        <div className="stats-grid mb-6" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {['A', 'B', 'C'].map(cls => {
            const items = curvaABC.filter(i => i.classificacao === cls);
            const valor = items.reduce((s, i) => s + i.total_valor, 0);
            return (
              <div key={cls} className="stat-card" style={{ borderLeft: `3px solid var(--${cls === 'A' ? 'destructive' : cls === 'B' ? 'warning' : 'neutral'}-500)` }}>
                <div className="stat-card-info">
                  <div className="stat-card-label">Classe {cls} — {items.length} itens</div>
                  <div className="stat-card-value" style={{ fontSize: 20 }}>{formatarMoeda(valor)}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {loading ? (
        <div style={{ padding: 'var(--space-4)' }}>
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="skeleton skeleton-row" />)}
        </div>
      ) : curvaABC.length === 0 ? (
        <div className="empty-state">
          <h3>Sem dados para Curva ABC</h3>
          <p>Não há movimentações suficientes para calcular a curva.</p>
        </div>
      ) : (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Categoria</th>
                <th>Classe</th>
                <th style={{ textAlign: 'right' }}>Valor Total</th>
                <th style={{ textAlign: 'right' }}>%</th>
                <th>Barra</th>
              </tr>
            </thead>
            <tbody>
              {curvaABC.map((item, idx) => (
                <tr key={item.produto_id || idx}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="table-product-icon" style={{ width: 28, height: 28 }}>
                        <Package size={13} />
                      </div>
                      <strong>{item.nome}</strong>
                    </div>
                  </td>
                  <td><span className="body-s">{item.categoria || '—'}</span></td>
                  <td>
                    <span className={`badge ${getClassBadge(item.classificacao)}`} style={{ minWidth: 32, textAlign: 'center' }}>
                      {item.classificacao}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatarMoeda(item.total_valor)}</td>
                  <td style={{ textAlign: 'right' }}>{Number(item.percentual || 0).toFixed(1)}%</td>
                  <td>
                    <div style={{ width: '100%', maxWidth: 160, height: 8, background: 'var(--neutral-100)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{
                        width: `${Math.min(Number(item.percentual || 0), 100)}%`,
                        height: '100%', borderRadius: 4,
                        background: item.classificacao === 'A' ? 'var(--destructive-500)' : item.classificacao === 'B' ? 'var(--warning-500)' : 'var(--neutral-400)',
                      }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ---- Tab: Previsão de Vencimento ----
function PrevisaoVencimentoTab({ carregarPrevisaoVencimento, previsaoVencimento, loading }) {
  useEffect(() => {
    carregarPrevisaoVencimento();
  }, [carregarPrevisaoVencimento]);

  function getStatusBadge(status) {
    switch (status) {
      case 'VENCIDO': return 'badge-danger';
      case 'CRITICO': return 'badge-danger';
      case 'ALERTA': return 'badge-warning';
      default: return 'badge-success';
    }
  }
  function getStatusLabel(status) {
    switch (status) {
      case 'VENCIDO': return 'Vencido';
      case 'CRITICO': return 'Crítico';
      case 'ALERTA': return 'Alerta';
      default: return 'OK';
    }
  }

  const columns = [
    { key: 'nome', label: 'Produto' },
    { key: 'categoria', label: 'Categoria' },
    { key: 'data_validade', label: 'Validade' },
    { key: 'dias_para_vencer', label: 'Dias p/ Vencer' },
    { key: 'quantidade_atual', label: 'Qtd Atual' },
    { key: 'consumo_diario', label: 'Consumo Médio/Dia' },
    { key: 'quantidade_em_risco', label: 'Qtd em Risco' },
    { key: 'valor_em_risco', label: 'Valor em Risco (R$)' },
    { key: 'status', label: 'Status' },
  ];

  const emRisco = previsaoVencimento.filter(i => i.vai_vencer_antes);
  const valorRiscoTotal = previsaoVencimento.reduce((s, i) => s + (i.valor_em_risco || 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4" style={{ flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <p className="body-s text-muted">
          Produtos que podem vencer antes de serem consumidos, com base no consumo médio de 90 dias.
        </p>
        <div className="flex items-center gap-2">
          <button className="btn btn-secondary btn-sm" onClick={() => exportToCSV(previsaoVencimento, 'previsao-vencimento', columns)} disabled={!previsaoVencimento.length}>
            <FileDown size={14} /> CSV
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => exportToPDF('Relatório Previsão de Vencimento', previsaoVencimento, columns)} disabled={!previsaoVencimento.length}>
            <FileText size={14} /> PDF
          </button>
        </div>
      </div>

      {/* Alert summary */}
      {!loading && previsaoVencimento.length > 0 && (
        <div className="stats-grid mb-6" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <div className="stat-card">
            <div className="stat-card-info">
              <div className="stat-card-label">Total com validade</div>
              <div className="stat-card-value" style={{ fontSize: 22 }}>{previsaoVencimento.length}</div>
            </div>
          </div>
          <div className="stat-card" style={{ borderLeft: '3px solid var(--destructive-500)' }}>
            <div className="stat-card-info">
              <div className="stat-card-label">Em risco de perda</div>
              <div className="stat-card-value" style={{ fontSize: 22 }}>{emRisco.length}</div>
            </div>
          </div>
          <div className="stat-card" style={{ borderLeft: '3px solid var(--warning-500)' }}>
            <div className="stat-card-info">
              <div className="stat-card-label">Valor em risco</div>
              <div className="stat-card-value" style={{ fontSize: 18 }}>{formatarMoeda(valorRiscoTotal)}</div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ padding: 'var(--space-4)' }}>
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="skeleton skeleton-row" />)}
        </div>
      ) : previsaoVencimento.length === 0 ? (
        <div className="empty-state">
          <h3>Nenhum produto com validade</h3>
          <p>Cadastre produtos com data de validade para ver previsões.</p>
        </div>
      ) : (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Validade</th>
                <th style={{ textAlign: 'center' }}>Dias p/ Vencer</th>
                <th style={{ textAlign: 'right' }}>Estoque</th>
                <th style={{ textAlign: 'right' }}>Consumo/Dia</th>
                <th style={{ textAlign: 'right' }}>Em Risco</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {previsaoVencimento.map((item, idx) => (
                <tr key={item.id || idx} style={item.vai_vencer_antes ? { background: 'var(--destructive-50)' } : {}}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="table-product-icon" style={{ width: 28, height: 28 }}>
                        <Package size={13} />
                      </div>
                      <div>
                        <strong>{item.nome}</strong>
                        <div className="body-s text-muted">{item.categoria || '—'}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="mono-s">{formatarData(item.data_validade)}</span></td>
                  <td style={{ textAlign: 'center' }}>
                    <strong style={{
                      color: item.dias_para_vencer <= 0 ? 'var(--destructive-600)' :
                        item.dias_para_vencer <= 7 ? 'var(--destructive-500)' :
                          item.dias_para_vencer <= 30 ? 'var(--warning-600)' : 'var(--neutral-700)'
                    }}>
                      {item.dias_para_vencer <= 0 ? 'Vencido' : item.dias_para_vencer}
                    </strong>
                  </td>
                  <td style={{ textAlign: 'right' }}>{item.quantidade_atual} {item.unidade_medida}</td>
                  <td style={{ textAlign: 'right' }}>{item.consumo_diario.toFixed(1)}</td>
                  <td style={{ textAlign: 'right', fontWeight: item.quantidade_em_risco > 0 ? 700 : 400, color: item.quantidade_em_risco > 0 ? 'var(--destructive-600)' : 'var(--neutral-500)' }}>
                    {item.quantidade_em_risco > 0 ? `${item.quantidade_em_risco} (${formatarMoeda(item.valor_em_risco)})` : '—'}
                  </td>
                  <td>
                    <span className={`badge ${getStatusBadge(item.status)}`}>
                      {getStatusLabel(item.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ---- Tab: Custo por Procedimento ----
function CustoProcedimentoTab({ carregarCustoProcedimento, custoProcedimento, loading }) {
  const [dias, setDias] = useState(30);

  useEffect(() => {
    carregarCustoProcedimento(dias);
  }, [dias, carregarCustoProcedimento]);

  const custoTotal = custoProcedimento.reduce((s, i) => s + i.total_valor, 0);

  const csvData = custoProcedimento.map(p => ({
    procedimento: p.procedimento,
    total_itens: p.total_itens,
    total_valor: p.total_valor.toFixed(2),
    custo_medio: p.total_itens > 0 ? (p.total_valor / p.total_itens).toFixed(2) : '0',
  }));
  const columns = [
    { key: 'procedimento', label: 'Procedimento' },
    { key: 'total_itens', label: 'Total Itens' },
    { key: 'total_valor', label: 'Custo Total (R$)' },
    { key: 'custo_medio', label: 'Custo Médio/Item (R$)' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4" style={{ flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div className="flex items-center gap-2">
          <span className="body-s text-muted">Período:</span>
          {[7, 30, 90].map(d => (
            <button key={d} className={`btn btn-sm ${dias === d ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setDias(d)}>{d} dias</button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-secondary btn-sm" onClick={() => exportToCSV(csvData, 'custo-procedimento', columns)} disabled={!custoProcedimento.length}>
            <FileDown size={14} /> CSV
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => exportToPDF(`Custo por Procedimento — ${dias} dias`, csvData, columns)} disabled={!custoProcedimento.length}>
            <FileText size={14} /> PDF
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 'var(--space-4)' }}>
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton skeleton-row" />)}
        </div>
      ) : custoProcedimento.length === 0 ? (
        <div className="empty-state">
          <h3>Sem dados de custo</h3>
          <p>Não há movimentações de saída no período.</p>
        </div>
      ) : (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Procedimento / Motivo</th>
                <th style={{ textAlign: 'right' }}>Total Itens</th>
                <th style={{ textAlign: 'right' }}>Custo Total</th>
                <th style={{ textAlign: 'right' }}>Custo Médio/Item</th>
                <th>Produtos Utilizados</th>
              </tr>
            </thead>
            <tbody>
              {custoProcedimento.map((item, idx) => (
                <tr key={idx}>
                  <td><strong>{item.procedimento}</strong></td>
                  <td style={{ textAlign: 'right' }}>{item.total_itens}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatarMoeda(item.total_valor)}</td>
                  <td style={{ textAlign: 'right' }}>{formatarMoeda(item.total_itens > 0 ? item.total_valor / item.total_itens : 0)}</td>
                  <td>
                    <div className="flex gap-1" style={{ flexWrap: 'wrap' }}>
                      {(item.produtos || []).slice(0, 3).map((p, pi) => (
                        <span key={pi} className="badge badge-neutral" style={{ fontSize: 11 }}>
                          {p.nome} ({p.quantidade})
                        </span>
                      ))}
                      {(item.produtos || []).length > 3 && (
                        <span className="badge badge-neutral" style={{ fontSize: 11 }}>+{item.produtos.length - 3}</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: 'var(--neutral-50)' }}>
                <td style={{ fontWeight: 600 }}>Total Geral</td>
                <td style={{ textAlign: 'right', fontWeight: 700 }}>{custoProcedimento.reduce((s, i) => s + i.total_itens, 0)}</td>
                <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--brand-700)' }}>{formatarMoeda(custoTotal)}</td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

// ---- Tab: Categorias ----
function CategoriasTab({ carregarDistribuicaoCategorias, distribuicaoCategorias, loading }) {
  useEffect(() => {
    carregarDistribuicaoCategorias();
  }, [carregarDistribuicaoCategorias]);

  const valorTotal = distribuicaoCategorias.reduce((s, i) => s + (i.valor || 0), 0);
  const enriched = distribuicaoCategorias.map(i => ({
    ...i,
    percentual: valorTotal > 0 ? ((i.valor / valorTotal) * 100).toFixed(1) : '0',
  }));

  const columns = [
    { key: 'categoria', label: 'Categoria' },
    { key: 'itens', label: 'Qtd Produtos' },
    { key: 'quantidade', label: 'Qtd Total Estoque' },
    { key: 'valor', label: 'Valor Total (R$)' },
    { key: 'percentual', label: '% do Valor' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4" style={{ flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <p className="body-s text-muted">Distribuição de produtos e valores por categoria.</p>
        <div className="flex items-center gap-2">
          <button className="btn btn-secondary btn-sm" onClick={() => exportToCSV(enriched, 'categorias', columns)} disabled={!distribuicaoCategorias.length}>
            <FileDown size={14} /> CSV
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => exportToPDF('Distribuição por Categoria', enriched, columns)} disabled={!distribuicaoCategorias.length}>
            <FileText size={14} /> PDF
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 'var(--space-4)' }}>
          <div className="skeleton" style={{ width: '100%', height: 300, borderRadius: 'var(--radius-md)' }} />
        </div>
      ) : distribuicaoCategorias.length === 0 ? (
        <div className="empty-state">
          <h3>Sem dados de categorias</h3>
          <p>Cadastre produtos com categorias para ver a distribuição.</p>
        </div>
      ) : (
        <div>
          <div style={{ maxWidth: 500, margin: '0 auto', marginBottom: 'var(--space-6)' }}>
            <CategoriasPieChart data={distribuicaoCategorias} />
          </div>
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Categoria</th>
                  <th style={{ textAlign: 'right' }}>Produtos</th>
                  <th style={{ textAlign: 'right' }}>Qtd Estoque</th>
                  <th style={{ textAlign: 'right' }}>Valor Total</th>
                  <th style={{ textAlign: 'right' }}>%</th>
                </tr>
              </thead>
              <tbody>
                {enriched.map((item, idx) => (
                  <tr key={idx}>
                    <td><strong>{item.categoria}</strong></td>
                    <td style={{ textAlign: 'right' }}>{item.itens}</td>
                    <td style={{ textAlign: 'right' }}>{item.quantidade}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatarMoeda(item.valor)}</td>
                    <td style={{ textAlign: 'right' }}>{item.percentual}%</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: 'var(--neutral-50)' }}>
                  <td style={{ fontWeight: 600 }}>Total</td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }}>{enriched.reduce((s, i) => s + i.itens, 0)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }}>{enriched.reduce((s, i) => s + i.quantidade, 0)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--brand-700)' }}>{formatarMoeda(valorTotal)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }}>100%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Main Page ----
export default function RelatoriosPage() {
  const {
    consumo, curvaABC, previsaoVencimento, custoProcedimento, distribuicaoCategorias,
    loading,
    carregarConsumo, carregarCurvaABC, carregarPrevisaoVencimento,
    carregarCustoProcedimento, carregarDistribuicaoCategorias,
  } = useRelatorios();

  const tabs = [
    {
      id: 'consumo', label: 'Consumo', icon: <TrendingUp size={16} />,
      content: <ConsumoTab carregarConsumo={carregarConsumo} consumo={consumo} loading={loading} />,
    },
    {
      id: 'curva-abc', label: 'Curva ABC', icon: <BarChart3 size={16} />,
      content: <CurvaABCTab carregarCurvaABC={carregarCurvaABC} curvaABC={curvaABC} loading={loading} />,
    },
    {
      id: 'vencimento', label: 'Previsão Vencimento', icon: <AlertTriangle size={16} />,
      content: <PrevisaoVencimentoTab carregarPrevisaoVencimento={carregarPrevisaoVencimento} previsaoVencimento={previsaoVencimento} loading={loading} />,
    },
    {
      id: 'custo', label: 'Custo por Procedimento', icon: <DollarSign size={16} />,
      content: <CustoProcedimentoTab carregarCustoProcedimento={carregarCustoProcedimento} custoProcedimento={custoProcedimento} loading={loading} />,
    },
    {
      id: 'categorias', label: 'Categorias', icon: <PieChart size={16} />,
      content: <CategoriasTab carregarDistribuicaoCategorias={carregarDistribuicaoCategorias} distribuicaoCategorias={distribuicaoCategorias} loading={loading} />,
    },
  ];

  return (
    <MainLayout>
      <div className="page-header">
        <div className="page-header-left">
          <div className="breadcrumb">
            <Link to="/dashboard">Dashboard</Link>
            <span>/</span>
            <span>Relatórios</span>
          </div>
          <h1 className="display-l" style={{ fontSize: 24 }}>Relatórios e Análises</h1>
        </div>
      </div>

      <div className="page-body">
        <Tabs tabs={tabs} defaultTab="consumo" />
      </div>
    </MainLayout>
  );
}
