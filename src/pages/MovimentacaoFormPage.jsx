// ============================================
// MOVIMENTAÇÃO FORM — Entrada e Saída
// ============================================
import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMovimentacoes } from '../hooks/useMovimentacoes';
import { produtoService } from '../services/produtoService';
import { MOTIVOS_ENTRADA, MOTIVOS_SAIDA } from '../lib/utils';
import MainLayout from '../components/layout/MainLayout';
import { 
  ArrowLeft, ArrowDownCircle, ArrowUpCircle, 
  Package, Info, Save, Loader2, Search, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function MovimentacaoFormPage({ tipo = 'ENTRADA' }) {
  const navigate = useNavigate();
  const { registrarEntrada, registrarSaida, loading } = useMovimentacoes();
  const [produtosAtivos, setProdutosAtivos] = useState([]);
  const [busca, setBusca] = useState('');

  const isEntrada = tipo === 'ENTRADA';
  const motivos = isEntrada ? MOTIVOS_ENTRADA : MOTIVOS_SAIDA;

  const [form, setForm] = useState({
    produto_id: '',
    quantidade: '',
    motivo: '',
    observacao: '',
  });

  async function carregarProdutos() {
    try {
      const result = await produtoService.listar({ status: 'ativo', por_pagina: 1000 });
      setProdutosAtivos(result.produtos);
    } catch { /* ignore */ }
  }

  useEffect(() => {
    carregarProdutos();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.produto_id) return toast.error('Selecione um produto');
    
    try {
      const dados = {
        produto_id: form.produto_id,
        quantidade: Number(form.quantidade),
        motivo: form.motivo,
        observacao: form.observacao || null,
      };

      if (isEntrada) {
        await registrarEntrada(dados);
        toast.success('Entrada de estoque registrada!');
      } else {
        await registrarSaida(dados);
        toast.success('Saída de estoque registrada!');
      }

      navigate('/movimentacoes');
    } catch (err) {
      toast.error(err.message);
    }
  }

  const produtoSelecionado = produtosAtivos.find((p) => p.id === form.produto_id);
  
  const produtosFiltrados = produtosAtivos.filter(p => 
    p.nome.toLowerCase().includes(busca.toLowerCase()) || 
    p.lote?.toLowerCase().includes(busca.toLowerCase())
  ).slice(0, 5);

  return (
    <MainLayout>
      <div className="page-header">
        <div className="page-header-left">
          <div className="breadcrumb">
            <Link to="/dashboard">Dashboard</Link>
            <span>/</span>
            <Link to="/movimentacoes">Movimentações</Link>
            <span>/</span>
            <span>Nova {isEntrada ? 'Entrada' : 'Saída'}</span>
          </div>
          <h1 className="display-l flex items-center gap-3">
            {isEntrada ? (
              <ArrowDownCircle size={28} className="text-success-500" />
            ) : (
              <ArrowUpCircle size={28} className="text-destructive-500" />
            )}
            Registrar {isEntrada ? 'Entrada' : 'Saída'}
          </h1>
        </div>
        <div className="page-header-right">
          <button className="btn btn-ghost" onClick={() => navigate('/movimentacoes')}>
            <ArrowLeft size={16} /> Voltar
          </button>
        </div>
      </div>

      <div className="page-body">
        <div className="dashboard-grid" style={{ gridTemplateColumns: '1.2fr 1fr' }}>
          {/* Formulário Principal */}
          <form onSubmit={handleSubmit}>
            <div className="card">
              <div className="card-body">
                <h2 className="heading-s mb-4">Dados da Movimentação</h2>
                
                {/* Seleção de Produto */}
                <div className="form-group">
                  <label className="form-label">Buscar Produto <span className="required">*</span></label>
                  <div className="table-search" style={{ maxWidth: '100%', marginBottom: 'var(--space-2)' }}>
                    <Search size={15} className="search-icon" />
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Busque por nome ou lote..."
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    {produtosFiltrados.map(p => (
                      <div 
                        key={p.id}
                        onClick={() => { setForm(f => ({ ...f, produto_id: p.id })); setBusca(''); }}
                        className={`alert-item ${form.produto_id === p.id ? 'unread' : ''}`}
                        style={{ 
                          cursor: 'pointer', 
                          padding: 'var(--space-2) var(--space-4)',
                          borderLeft: form.produto_id === p.id ? '3px solid var(--brand-500)' : '3px solid transparent'
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{p.nome}</div>
                          <div className="body-s">Lote: {p.lote || 'N/A'} | Estoque: {p.quantidade_atual} {p.unidade_medida}</div>
                        </div>
                      </div>
                    ))}
                    {busca && produtosFiltrados.length === 0 && (
                      <p className="body-s" style={{ padding: 'var(--space-2)' }}>Nenhum produto encontrado.</p>
                    )}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Quantidade <span className="required">*</span></label>
                    <input
                      type="number"
                      min="1"
                      className="form-input"
                      placeholder="0"
                      value={form.quantidade}
                      onChange={(e) => setForm((p) => ({ ...p, quantidade: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Motivo <span className="required">*</span></label>
                    <select
                      className="form-select"
                      value={form.motivo}
                      onChange={(e) => setForm((p) => ({ ...p, motivo: e.target.value }))}
                      required
                    >
                      <option value="">Selecione o motivo</option>
                      {motivos.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Observação</label>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    placeholder="Informações adicionais sobre esta movimentação..."
                    value={form.observacao}
                    onChange={(e) => setForm((p) => ({ ...p, observacao: e.target.value }))}
                  />
                </div>

                <div className="mt-6 flex gap-3">
                  <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                    {loading ? <Loader2 size={18} className="spin" /> : <Save size={18} />}
                    Confirmar {isEntrada ? 'Entrada' : 'Saída'}
                  </button>
                </div>
              </div>
            </div>
          </form>

          {/* Resumo do Produto Selecionado */}
          <div>
            {!produtoSelecionado ? (
              <div className="card" style={{ height: '100%', borderStyle: 'dashed', background: 'var(--neutral-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="empty-state">
                  <Package size={40} className="text-muted mb-3" />
                  <p className="body-s">Selecione um produto ao lado para ver os detalhes do estoque atual.</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className={`card ${!isEntrada && produtoSelecionado.quantidade_atual === 0 ? 'danger' : ''}`}>
                  <div className="card-body">
                    <h2 className="heading-s mb-4">Resumo do Produto</h2>
                    
                    <div className="flex items-center gap-4 mb-6">
                      <div className="stat-card-icon brand" style={{ width: 48, height: 48 }}>
                        <Package size={24} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 16 }}>{produtoSelecionado.nome}</div>
                        <div className="body-s">SKU: {produtoSelecionado.id.toUpperCase()}</div>
                      </div>
                    </div>

                    <div className="stats-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                      <div className="stat-card" style={{ padding: 'var(--space-3)' }}>
                        <div className="stat-card-info">
                          <div className="stat-card-label" style={{ fontSize: 11 }}>Estoque Atual</div>
                          <div className="stat-card-value" style={{ fontSize: 20 }}>{produtoSelecionado.quantidade_atual}</div>
                        </div>
                      </div>
                      <div className="stat-card" style={{ padding: 'var(--space-3)' }}>
                        <div className="stat-card-info">
                          <div className="stat-card-label" style={{ fontSize: 11 }}>Unidade</div>
                          <div className="stat-card-value" style={{ fontSize: 20 }}>{produtoSelecionado.unidade_medida}</div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 p-3 rounded-lg" style={{ background: 'var(--neutral-50)', border: '1px solid var(--neutral-200)' }}>
                      <div className="flex justify-between body-s mb-1">
                        <span>Lote:</span>
                        <span className="mono-s">{produtoSelecionado.lote || '—'}</span>
                      </div>
                      <div className="flex justify-between body-s">
                        <span>Validade:</span>
                        <span className={new Date(produtoSelecionado.data_validade) < new Date() ? 'text-danger' : ''}>
                          {new Date(produtoSelecionado.data_validade).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>

                    {!isEntrada && produtoSelecionado.quantidade_atual <= 0 && (
                      <div className="mt-4 p-3 rounded-lg flex gap-2 items-center" style={{ background: 'var(--destructive-50)', color: 'var(--destructive-600)', border: '1px solid var(--destructive-100)' }}>
                        <AlertCircle size={16} />
                        <span className="body-s" style={{ fontWeight: 600 }}>Atenção: Produto sem estoque disponível para saída.</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="card" style={{ background: 'var(--brand-50)', borderColor: 'var(--brand-200)' }}>
                  <div className="card-body flex gap-3">
                    <Info size={20} className="text-brand" />
                    <p className="body-s" style={{ color: 'var(--brand-800)' }}>
                      {isEntrada 
                        ? 'As entradas aumentam o saldo do estoque e devem ser realizadas em casos de novas compras ou devoluções.' 
                        : 'As saídas reduzem o saldo e devem ser registradas para cada consumo ou descarte realizado.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
