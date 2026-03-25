// ============================================
// INVENTARIO CONTAGEM — Fluxo de Contagem Fisica
// ============================================
import { useEffect, useState, useCallback, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useInventario } from '../hooks/useInventario';
import MainLayout from '../components/layout/MainLayout';
import ConfirmModal from '../components/ui/ConfirmModal';
import { STATUS_INVENTARIO } from '../lib/constants';
import {
  ClipboardList, Save, CheckCircle2, Search, Package, AlertTriangle,
  ArrowLeft, Loader2, TrendingUp, TrendingDown, Minus
} from 'lucide-react';
import toast from 'react-hot-toast';

function SkeletonRows() {
  return Array.from({ length: 6 }).map((_, i) => (
    <tr key={i}>
      <td><div className="skeleton skeleton-text" style={{ width: 160 }} /></td>
      <td><div className="skeleton skeleton-text" style={{ width: 100 }} /></td>
      <td><div className="skeleton skeleton-text" style={{ width: 80 }} /></td>
      <td><div className="skeleton skeleton-text" style={{ width: 80 }} /></td>
      <td><div className="skeleton skeleton-text" style={{ width: 60 }} /></td>
      <td><div className="skeleton skeleton-text" style={{ width: 60 }} /></td>
      <td><div className="skeleton skeleton-text" style={{ width: 60 }} /></td>
      <td><div className="skeleton skeleton-text" style={{ width: 120 }} /></td>
    </tr>
  ));
}

export default function InventarioContagemPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { inventario, itens, setItens, loading, buscar, carregarItens, salvarContagem, finalizar } = useInventario();
  const [busca, setBusca] = useState('');
  const [saving, setSaving] = useState(false);
  const [finalizando, setFinalizando] = useState(false);
  const [confirmFinalizar, setConfirmFinalizar] = useState(false);

  const carregarDados = useCallback(async () => {
    try {
      const inv = await buscar(id);
      if (inv) {
        await carregarItens(id, inv.local_id);
      }
    } catch {
      toast.error('Erro ao carregar inventario');
      navigate('/inventario');
    }
  }, [id, buscar, carregarItens, navigate]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const isFinalizado = inventario?.status === STATUS_INVENTARIO.FINALIZADO;
  const isCancelado = inventario?.status === STATUS_INVENTARIO.CANCELADO;
  const isReadOnly = isFinalizado || isCancelado;

  const itensFiltrados = useMemo(() => {
    if (!busca) return itens;
    const termo = busca.toLowerCase();
    return itens.filter(item =>
      item.produto_nome?.toLowerCase().includes(termo) ||
      item.codigo_barras?.toLowerCase().includes(termo) ||
      item.lote?.toLowerCase().includes(termo) ||
      item.categoria?.toLowerCase().includes(termo)
    );
  }, [itens, busca]);

  const resumo = useMemo(() => {
    const totalProdutos = itens.length;
    const contados = itens.filter(i => i.quantidade_contada !== null && i.quantidade_contada !== undefined && i.quantidade_contada !== '').length;
    const comDiferenca = itens.filter(i => {
      const contada = Number(i.quantidade_contada);
      if (isNaN(contada)) return false;
      return contada !== i.quantidade_sistema;
    }).length;
    let diferencaPositiva = 0;
    let diferencaNegativa = 0;
    itens.forEach(i => {
      const contada = Number(i.quantidade_contada);
      if (isNaN(contada)) return;
      const diff = contada - i.quantidade_sistema;
      if (diff > 0) diferencaPositiva += diff;
      if (diff < 0) diferencaNegativa += diff;
    });
    return { totalProdutos, contados, comDiferenca, diferencaPositiva, diferencaNegativa };
  }, [itens]);

  function handleQuantidadeChange(index, valor) {
    if (isReadOnly) return;
    const novoItens = [...itens];
    novoItens[index] = { ...novoItens[index], quantidade_contada: valor };
    setItens(novoItens);
  }

  function handleObservacaoChange(index, valor) {
    if (isReadOnly) return;
    const novoItens = [...itens];
    novoItens[index] = { ...novoItens[index], observacao: valor };
    setItens(novoItens);
  }

  function getDiferenca(item) {
    const contada = Number(item.quantidade_contada);
    if (isNaN(contada) || item.quantidade_contada === '' || item.quantidade_contada === null || item.quantidade_contada === undefined) {
      return null;
    }
    return contada - item.quantidade_sistema;
  }

  function getDiferencaStyle(diff) {
    if (diff === null) return {};
    if (diff > 0) return { color: 'var(--success-600)', fontWeight: 600 };
    if (diff < 0) return { color: 'var(--destructive-600)', fontWeight: 600 };
    return { color: 'var(--neutral-500)' };
  }

  function getDiferencaIcon(diff) {
    if (diff === null) return null;
    if (diff > 0) return <TrendingUp size={14} />;
    if (diff < 0) return <TrendingDown size={14} />;
    return <Minus size={14} />;
  }

  async function handleSalvar() {
    setSaving(true);
    try {
      const itensContados = itens
        .filter(i => i.quantidade_contada !== null && i.quantidade_contada !== undefined && i.quantidade_contada !== '')
        .map(i => ({
          produto_id: i.produto_id,
          quantidade_contada: Number(i.quantidade_contada),
          observacao: i.observacao || null,
        }));
      await salvarContagem(id, itensContados);
      toast.success('Contagem salva com sucesso!');
    } catch (err) {
      toast.error(err.message || 'Erro ao salvar contagem');
    } finally {
      setSaving(false);
    }
  }

  async function handleFinalizar() {
    setFinalizando(true);
    try {
      await finalizar(id, true);
      toast.success('Inventario finalizado! Ajustes aplicados ao estoque.');
      carregarDados();
    } catch (err) {
      toast.error(err.message || 'Erro ao finalizar inventario');
    } finally {
      setFinalizando(false);
    }
  }

  return (
    <MainLayout>
      <div className="page-header">
        <div className="page-header-left">
          <div className="breadcrumb">
            <Link to="/dashboard">Dashboard</Link>
            <span>/</span>
            <Link to="/inventario">Inventario</Link>
            <span>/</span>
            <span>Contagem</span>
          </div>
          <h1 className="display-l" style={{ fontSize: 24 }}>
            {inventario?.nome || 'Contagem de Inventario'}
          </h1>
          {inventario && (
            <div className="flex items-center gap-3" style={{ marginTop: 'var(--space-1)' }}>
              <span className={`badge ${
                inventario.status === STATUS_INVENTARIO.EM_ANDAMENTO ? 'badge-warning' :
                inventario.status === STATUS_INVENTARIO.FINALIZADO ? 'badge-success' :
                'badge-danger'
              }`}>
                {inventario.status === STATUS_INVENTARIO.EM_ANDAMENTO ? 'Em Andamento' :
                 inventario.status === STATUS_INVENTARIO.FINALIZADO ? 'Finalizado' : 'Cancelado'}
              </span>
              {inventario.local && (
                <span className="body-s text-muted">Local: {inventario.local.nome}</span>
              )}
            </div>
          )}
        </div>
        <div className="page-header-right">
          <button className="btn btn-ghost" onClick={() => navigate('/inventario')}>
            <ArrowLeft size={16} /> Voltar
          </button>
        </div>
      </div>

      <div className="page-body">
        {/* Summary Cards */}
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          <div className="stat-card">
            <div className="stat-card-info">
              <div className="stat-card-label">Total Produtos</div>
              <div className="stat-card-value">{resumo.totalProdutos}</div>
            </div>
            <div className="stat-card-icon brand">
              <Package size={22} />
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-info">
              <div className="stat-card-label">Contados</div>
              <div className="stat-card-value">{resumo.contados}</div>
            </div>
            <div className="stat-card-icon info">
              <ClipboardList size={22} />
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-info">
              <div className="stat-card-label">Com Diferenca</div>
              <div className="stat-card-value">{resumo.comDiferenca}</div>
            </div>
            <div className={`stat-card-icon ${resumo.comDiferenca > 0 ? 'warning' : 'brand'}`}>
              <AlertTriangle size={22} />
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-info">
              <div className="stat-card-label">Diferenca (+/-)</div>
              <div className="stat-card-value" style={{ fontSize: 16 }}>
                <span style={{ color: 'var(--success-600)' }}>+{resumo.diferencaPositiva}</span>
                {' / '}
                <span style={{ color: 'var(--destructive-600)' }}>{resumo.diferencaNegativa}</span>
              </div>
            </div>
            <div className="stat-card-icon neutral">
              <TrendingUp size={22} />
            </div>
          </div>
        </div>

        {/* Action buttons */}
        {!isReadOnly && (
          <div className="flex gap-3 mb-4" style={{ justifyContent: 'flex-end' }}>
            <button
              className="btn btn-secondary"
              disabled={saving}
              onClick={handleSalvar}
            >
              {saving ? <><Loader2 size={16} className="spin" /> Salvando...</> : <><Save size={16} /> Salvar Contagem</>}
            </button>
            <button
              className="btn btn-primary"
              disabled={finalizando || resumo.contados === 0}
              onClick={() => setConfirmFinalizar(true)}
            >
              {finalizando ? <><Loader2 size={16} className="spin" /> Finalizando...</> : <><CheckCircle2 size={16} /> Finalizar Inventario</>}
            </button>
          </div>
        )}

        {isFinalizado && (
          <div className="card mb-4" style={{ borderLeft: '3px solid var(--success-500)' }}>
            <div className="card-body">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} style={{ color: 'var(--success-500)' }} />
                <strong>Inventario finalizado.</strong>
                <span className="body-s text-muted">Os ajustes foram aplicados ao estoque. Visualizacao somente leitura.</span>
              </div>
            </div>
          </div>
        )}

        {/* Products Table */}
        <div className="data-table-container">
          <div className="table-toolbar">
            <div className="table-toolbar-left">
              <div className="table-search">
                <Search size={16} className="search-icon" />
                <input
                  className="form-input"
                  style={{ paddingLeft: 36 }}
                  type="text"
                  placeholder="Buscar produto por nome, codigo, lote..."
                  value={busca}
                  onChange={e => setBusca(e.target.value)}
                />
              </div>
            </div>
            <div className="table-toolbar-right">
              <span className="body-s text-muted">
                {itensFiltrados.length} de {itens.length} produto(s)
              </span>
            </div>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Codigo Barras</th>
                <th>Lote</th>
                <th>Categoria</th>
                <th style={{ textAlign: 'center' }}>Qtd Sistema</th>
                <th style={{ textAlign: 'center' }}>Qtd Contada</th>
                <th style={{ textAlign: 'center' }}>Diferenca</th>
                <th>Observacao</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows />
              ) : itensFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                    <div className="empty-state">
                      <div className="empty-state-icon">
                        <Package size={32} />
                      </div>
                      <h3>Nenhum produto encontrado</h3>
                      <p>{busca ? 'Tente uma busca diferente.' : 'Nao ha produtos para contagem neste inventario.'}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                itensFiltrados.map((item, idx) => {
                  const realIdx = itens.indexOf(item);
                  const diff = getDiferenca(item);
                  return (
                    <tr key={item.produto_id || idx}>
                      <td>
                        <div className="flex items-center gap-2">
                          <div style={{
                            width: 32, height: 32, borderRadius: 'var(--radius-md)',
                            background: 'var(--neutral-100)', color: 'var(--neutral-500)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                          }}>
                            <Package size={14} />
                          </div>
                          <strong className="body-s">{item.produto_nome || '—'}</strong>
                        </div>
                      </td>
                      <td>
                        <span className="mono-s">{item.codigo_barras || '—'}</span>
                      </td>
                      <td>
                        <span className="mono-s">{item.lote || '—'}</span>
                      </td>
                      <td>
                        <span className="body-s">{item.categoria || '—'}</span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <strong>{item.quantidade_sistema}</strong>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {isReadOnly ? (
                          <strong>{item.quantidade_contada ?? '—'}</strong>
                        ) : (
                          <input
                            type="number"
                            min="0"
                            className="form-input"
                            style={{ width: 80, textAlign: 'center', margin: '0 auto' }}
                            value={item.quantidade_contada ?? ''}
                            onChange={e => handleQuantidadeChange(realIdx, e.target.value)}
                            placeholder="—"
                          />
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {diff !== null ? (
                          <span className="flex items-center gap-1" style={{ ...getDiferencaStyle(diff), justifyContent: 'center' }}>
                            {getDiferencaIcon(diff)}
                            {diff > 0 ? `+${diff}` : diff}
                          </span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td>
                        {isReadOnly ? (
                          <span className="body-s">{item.observacao || '—'}</span>
                        ) : (
                          <input
                            type="text"
                            className="form-input"
                            style={{ minWidth: 120 }}
                            value={item.observacao || ''}
                            onChange={e => handleObservacaoChange(realIdx, e.target.value)}
                            placeholder="Obs..."
                          />
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

      <ConfirmModal
        isOpen={confirmFinalizar}
        onClose={() => setConfirmFinalizar(false)}
        onConfirm={handleFinalizar}
        title="Finalizar Inventario"
        message="Deseja finalizar o inventario e aplicar os ajustes ao estoque? As quantidades do sistema serao atualizadas com base na contagem. Esta acao nao pode ser desfeita."
        confirmText="Finalizar e Aplicar"
        cancelText="Cancelar"
        variant="default"
      />
    </MainLayout>
  );
}
