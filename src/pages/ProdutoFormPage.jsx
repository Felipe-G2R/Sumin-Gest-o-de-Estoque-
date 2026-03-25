// ============================================
// PRODUTO FORM — com Barcode Scanner
// ============================================
import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useProdutos } from '../hooks/useProdutos';
import { useFornecedores } from '../hooks/useFornecedores';
import { useLocais } from '../hooks/useLocais';
import { CATEGORIAS, UNIDADES_MEDIDA } from '../lib/utils';
import MainLayout from '../components/layout/MainLayout';
import BarcodeScanner from '../components/BarcodeScanner';
import { ArrowLeft, Save, Loader2, ScanLine } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProdutoFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { buscar, criar, atualizar, loading } = useProdutos();
  const { listarAtivos } = useFornecedores();
  const { listarAtivos: listarLocaisAtivos } = useLocais();
  const [fornecedoresAtivos, setFornecedoresAtivos] = useState([]);
  const [locaisAtivos, setLocaisAtivos] = useState([]);
  const [showScanner, setShowScanner] = useState(false);

  const [form, setForm] = useState({
    nome: '', descricao: '', codigo_barras: '', fornecedor_id: '',
    categoria: '', unidade_medida: 'UN', quantidade_atual: 0,
    quantidade_minima: 5, preco_unitario: '', lote: '', data_validade: '',
    local_id: '',
  });

  const carregarFornecedores = useCallback(async () => {
    try { setFornecedoresAtivos(await listarAtivos()); } catch { /* */ }
  }, [listarAtivos]);

  const carregarLocais = useCallback(async () => {
    try { setLocaisAtivos(await listarLocaisAtivos()); } catch { /* */ }
  }, [listarLocaisAtivos]);

  const carregarProduto = useCallback(async () => {
    try {
      const p = await buscar(id);
      setForm({
        nome: p.nome || '', descricao: p.descricao || '',
        codigo_barras: p.codigo_barras || '', fornecedor_id: p.fornecedor_id || '',
        categoria: p.categoria || '', unidade_medida: p.unidade_medida || 'UN',
        quantidade_atual: p.quantidade_atual || 0, quantidade_minima: p.quantidade_minima ?? 5,
        preco_unitario: p.preco_unitario || '', lote: p.lote || '',
        data_validade: p.data_validade ? p.data_validade.split('T')[0] : '',
        local_id: p.local_id || '',
      });
    } catch { toast.error('Produto não encontrado'); navigate('/produtos'); }
  }, [id, buscar, navigate]);

  useEffect(() => {
    carregarFornecedores();
    carregarLocais();
    if (isEdit) carregarProduto();
  }, [isEdit, carregarFornecedores, carregarLocais, carregarProduto]);

  function handleChange(campo, valor) { setForm(prev => ({ ...prev, [campo]: valor })); }

  function handleBarcodeScan(code) {
    setShowScanner(false);
    handleChange('codigo_barras', code);
    toast.success(`Código escaneado: ${code}`);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const dados = {
        ...form,
        quantidade_atual: Number(form.quantidade_atual),
        quantidade_minima: Number(form.quantidade_minima),
        preco_unitario: form.preco_unitario ? Number(form.preco_unitario) : null,
        fornecedor_id: form.fornecedor_id || null,
        data_validade: form.data_validade || null,
        local_id: form.local_id || null,
      };
      if (isEdit) { await atualizar(id, dados); toast.success('Produto atualizado!'); }
      else { await criar(dados); toast.success('Produto cadastrado!'); }
      navigate('/produtos');
    } catch (err) { toast.error(err.message); }
  }

  return (
    <MainLayout>
      <div className="page-header">
        <div className="page-header-left">
          <div className="breadcrumb">
            <Link to="/dashboard">Dashboard</Link><span>/</span>
            <Link to="/produtos">Inventário</Link><span>/</span>
            <span>{isEdit ? 'Editar' : 'Novo'}</span>
          </div>
          <h1 className="display-l" style={{ fontSize: 24 }}>{isEdit ? 'Editar Produto' : 'Novo Produto'}</h1>
        </div>
        <div className="page-header-right">
          <button className="btn btn-ghost" onClick={() => navigate('/produtos')}><ArrowLeft size={16} /> Voltar</button>
        </div>
      </div>

      <div className="page-body">
        <form onSubmit={handleSubmit} style={{ maxWidth: 680 }}>
          <div className="card">
            <div className="card-body">
              <h2 className="heading-s mb-4">Informações do Produto</h2>

              <div className="form-group">
                <label className="form-label">Nome <span className="required">*</span></label>
                <input type="text" className="form-input" value={form.nome}
                  onChange={e => handleChange('nome', e.target.value)} required placeholder="Ex: Resina Composta A3" />
              </div>

              <div className="form-group">
                <label className="form-label">Descrição</label>
                <textarea className="form-textarea" value={form.descricao}
                  onChange={e => handleChange('descricao', e.target.value)} placeholder="Observações..." />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Categoria</label>
                  <select className="form-select" value={form.categoria} onChange={e => handleChange('categoria', e.target.value)}>
                    <option value="">Selecione</option>
                    {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Fornecedor</label>
                  <select className="form-select" value={form.fornecedor_id} onChange={e => handleChange('fornecedor_id', e.target.value)}>
                    <option value="">Nenhum</option>
                    {fornecedoresAtivos.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Código de Barras</label>
                  <div className="flex gap-2">
                    <input type="text" className="form-input" value={form.codigo_barras}
                      onChange={e => handleChange('codigo_barras', e.target.value)} placeholder="Opcional" style={{ flex: 1 }} />
                    <button type="button" className="btn btn-secondary btn-icon" onClick={() => setShowScanner(true)} title="Escanear">
                      <ScanLine size={16} />
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Lote</label>
                  <input type="text" className="form-input" value={form.lote}
                    onChange={e => handleChange('lote', e.target.value)} placeholder="Ex: LOT-2026-001" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Local de Estoque</label>
                <select className="form-select" value={form.local_id} onChange={e => handleChange('local_id', e.target.value)}>
                  <option value="">Nenhum (geral)</option>
                  {locaisAtivos.map(l => <option key={l.id} value={l.id}>{l.nome} ({l.tipo})</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="card mt-4">
            <div className="card-body">
              <h2 className="heading-s mb-4">Estoque e Valores</h2>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Unidade de Medida</label>
                  <select className="form-select" value={form.unidade_medida} onChange={e => handleChange('unidade_medida', e.target.value)}>
                    {UNIDADES_MEDIDA.map(u => <option key={u.codigo} value={u.codigo}>{u.codigo} — {u.descricao}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Preço Unitário (R$)</label>
                  <input type="number" step="0.01" min="0" className="form-input" value={form.preco_unitario}
                    onChange={e => handleChange('preco_unitario', e.target.value)} placeholder="0.00" />
                </div>
              </div>

              <div className="form-row">
                {!isEdit && (
                  <div className="form-group">
                    <label className="form-label">Quantidade Inicial</label>
                    <input type="number" min="0" className="form-input" value={form.quantidade_atual}
                      onChange={e => handleChange('quantidade_atual', e.target.value)} />
                    <span className="form-hint">Futuras alterações via Movimentações</span>
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Quantidade Mínima (alerta)</label>
                  <input type="number" min="0" className="form-input" value={form.quantidade_minima}
                    onChange={e => handleChange('quantidade_minima', e.target.value)} />
                  <span className="form-hint">Avisa quando estoque cair abaixo</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Data de Validade</label>
                <input type="date" className="form-input" value={form.data_validade}
                  onChange={e => handleChange('data_validade', e.target.value)} style={{ maxWidth: 200 }} />
              </div>
            </div>
          </div>

          <div style={{ marginTop: 'var(--space-6)', display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/produtos')}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ minWidth: 160 }}>
              {loading ? <><Loader2 size={16} className="spin" /> Salvando...</> :
                <><Save size={16} /> {isEdit ? 'Salvar' : 'Cadastrar'}</>}
            </button>
          </div>
        </form>
      </div>

      {showScanner && <BarcodeScanner onScan={handleBarcodeScan} onClose={() => setShowScanner(false)} />}
    </MainLayout>
  );
}
