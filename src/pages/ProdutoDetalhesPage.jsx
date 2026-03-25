// ============================================
// PRODUTO DETALHES — Info + Histórico
// ============================================
import { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useProdutos } from '../hooks/useProdutos';
import { useAuth } from '../hooks/useAuth';
import MainLayout from '../components/layout/MainLayout';
import { formatarData, formatarDataHora, formatarMoeda, statusEstoque, statusVencimento } from '../lib/utils';
import {
  ArrowLeft, Edit2, Trash2, RotateCcw, Package, ArrowDownCircle, ArrowUpCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProdutoDetalhesPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { produto, loading, buscar, desativar, reativar } = useProdutos();
  const { isAdmin } = useAuth();

  useEffect(() => { buscar(id); }, [id, buscar]);

  async function handleDesativar() {
    if (!confirm('Deseja realmente desativar este produto? Ele não aparecerá mais nas listagens.')) return;
    try { await desativar(id); toast.success('Produto desativado'); navigate('/produtos'); }
    catch (err) { toast.error(err.message); }
  }

  async function handleReativar() {
    try { await reativar(id); toast.success('Produto reativado'); buscar(id); }
    catch (err) { toast.error(err.message); }
  }

  if (loading || !produto) {
    return (
      <MainLayout>
        <div className="page-body">
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-card mt-4" style={{ height: 200 }} />
          <div className="skeleton skeleton-card mt-4" style={{ height: 300 }} />
        </div>
      </MainLayout>
    );
  }

  const est = statusEstoque(produto.quantidade_atual, produto.quantidade_minima);
  const val = statusVencimento(produto.data_validade);
  const estBadge = est.cor === 'red' ? 'badge-danger' : est.cor === 'orange' ? 'badge-warning' : 'badge-success';
  const valBadge = val.cor === 'red' ? 'badge-danger' : val.cor === 'orange' ? 'badge-warning' : 'badge-success';

  return (
    <MainLayout>
      <div className="page-header">
        <div className="page-header-left">
          <div className="breadcrumb">
            <Link to="/dashboard">Dashboard</Link><span>/</span>
            <Link to="/produtos">Inventário</Link><span>/</span>
            <span>{produto.nome}</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="display-l" style={{ fontSize: 24 }}>{produto.nome}</h1>
            {!produto.ativo && <span className="badge badge-danger">Desativado</span>}
          </div>
        </div>
        <div className="page-header-right">
          <button className="btn btn-ghost" onClick={() => navigate('/produtos')}>
            <ArrowLeft size={16} /> Voltar
          </button>
          <Link to={`/produtos/${id}/editar`} className="btn btn-secondary">
            <Edit2 size={16} /> Editar
          </Link>
          {isAdmin && produto.ativo && (
            <button className="btn btn-danger" onClick={handleDesativar}>
              <Trash2 size={16} /> Desativar
            </button>
          )}
          {isAdmin && !produto.ativo && (
            <button className="btn btn-primary" onClick={handleReativar}>
              <RotateCcw size={16} /> Reativar
            </button>
          )}
        </div>
      </div>

      <div className="page-body">
        {/* Info cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-4)' }}>
          <div className="card">
            <div className="card-body">
              <h2 className="heading-s mb-4">Informações Gerais</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                {[
                  ['Categoria', produto.categoria || '—'],
                  ['Fornecedor', produto.fornecedor?.nome || '—'],
                  ['Código de Barras', produto.codigo_barras ? <span className="mono-s">{produto.codigo_barras}</span> : '—'],
                  ['Lote', produto.lote ? <span className="mono-s">{produto.lote}</span> : '—'],
                  ['Unidade', produto.unidade_medida],
                  ['Preço Unitário', formatarMoeda(produto.preco_unitario)],
                ].map(([label, value], i) => (
                  <div key={i}>
                    <div className="body-s" style={{ marginBottom: 2 }}>{label}</div>
                    <div style={{ fontWeight: 500, color: 'var(--neutral-800)' }}>{value}</div>
                  </div>
                ))}
              </div>
              {produto.descricao && (
                <div className="mt-4">
                  <div className="body-s" style={{ marginBottom: 2 }}>Descrição</div>
                  <p style={{ color: 'var(--neutral-700)' }}>{produto.descricao}</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="stat-card" style={{ flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div className="stat-card-label">Estoque Atual</div>
              <div className="stat-card-value">{produto.quantidade_atual} <span style={{ fontSize: 14, fontWeight: 400 }}>{produto.unidade_medida}</span></div>
              <span className={`badge ${estBadge}`}><span className="badge-dot" />{est.texto}</span>
              <div className="body-s">Mín: {produto.quantidade_minima} {produto.unidade_medida}</div>
            </div>

            <div className="stat-card" style={{ flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div className="stat-card-label">Validade</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--neutral-800)' }}>
                {formatarData(produto.data_validade)}
              </div>
              <span className={`badge ${valBadge}`}><span className="badge-dot" />{val.texto}</span>
            </div>

            <div className="flex gap-2">
              <Link to="/movimentacoes/entrada" className="btn btn-primary btn-sm" style={{ flex: 1 }}>
                <ArrowDownCircle size={14} /> Entrada
              </Link>
              <Link to="/movimentacoes/saida" className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
                <ArrowUpCircle size={14} /> Saída
              </Link>
            </div>
          </div>
        </div>

        {/* Movement history */}
        <div className="card mt-6">
          <div className="card-body" style={{ paddingBottom: 0 }}>
            <h2 className="heading-s mb-4">Histórico de Movimentações</h2>
          </div>
          {(!produto.movimentacoes || produto.movimentacoes.length === 0) ? (
            <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
              <p className="body-s">Nenhuma movimentação registrada</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Data</th><th>Tipo</th><th>Qtd</th><th>Motivo</th><th>Usuário</th>
                </tr>
              </thead>
              <tbody>
                {produto.movimentacoes.map(mov => (
                  <tr key={mov.id}>
                    <td>{formatarDataHora(mov.criado_em)}</td>
                    <td>
                      <span className={`badge ${mov.tipo === 'ENTRADA' ? 'badge-success' : 'badge-danger'}`}>
                        {mov.tipo === 'ENTRADA' ? <ArrowDownCircle size={12} /> : <ArrowUpCircle size={12} />}
                        {mov.tipo}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{mov.quantidade}</td>
                    <td>{mov.motivo}</td>
                    <td>{mov.usuario?.nome}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
