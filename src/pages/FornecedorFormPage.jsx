// ============================================
// FORNECEDOR FORM — Cadastro/Edição
// ============================================
import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useFornecedores } from '../hooks/useFornecedores';
import MainLayout from '../components/layout/MainLayout';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function FornecedorFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { buscar, criar, atualizar, loading } = useFornecedores();
  const [form, setForm] = useState({ nome: '', cnpj: '', telefone: '', email: '', endereco: '' });

  const carregarFornecedor = useCallback(async () => {
    try {
      const f = await buscar(id);
      setForm({ nome: f.nome || '', cnpj: f.cnpj || '', telefone: f.telefone || '', email: f.email || '', endereco: f.endereco || '' });
    } catch { toast.error('Fornecedor não encontrado'); navigate('/fornecedores'); }
  }, [id, buscar, navigate]);

  useEffect(() => { if (isEdit) carregarFornecedor(); }, [isEdit, carregarFornecedor]);

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (isEdit) { await atualizar(id, form); toast.success('Fornecedor atualizado!'); }
      else { await criar(form); toast.success('Fornecedor cadastrado!'); }
      navigate('/fornecedores');
    } catch (err) { toast.error(err.message); }
  }

  return (
    <MainLayout>
      <div className="page-header">
        <div className="page-header-left">
          <div className="breadcrumb">
            <Link to="/dashboard">Dashboard</Link><span>/</span>
            <Link to="/fornecedores">Fornecedores</Link><span>/</span>
            <span>{isEdit ? 'Editar' : 'Novo'}</span>
          </div>
          <h1 className="display-l" style={{ fontSize: 24 }}>{isEdit ? 'Editar Fornecedor' : 'Novo Fornecedor'}</h1>
        </div>
        <div className="page-header-right">
          <button className="btn btn-ghost" onClick={() => navigate('/fornecedores')}><ArrowLeft size={16} /> Voltar</button>
        </div>
      </div>

      <div className="page-body">
        <form onSubmit={handleSubmit} style={{ maxWidth: 560 }}>
          <div className="card">
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">Nome da Empresa <span className="required">*</span></label>
                <input type="text" className="form-input" value={form.nome}
                  onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} required placeholder="Ex: Dental Cremer" />
              </div>
              <div className="form-group">
                <label className="form-label">CNPJ</label>
                <input type="text" className="form-input" value={form.cnpj}
                  onChange={e => setForm(p => ({ ...p, cnpj: e.target.value }))} placeholder="XX.XXX.XXX/XXXX-XX" />
                <span className="form-hint">Formato: XX.XXX.XXX/XXXX-XX</span>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Telefone</label>
                  <input type="text" className="form-input" value={form.telefone}
                    onChange={e => setForm(p => ({ ...p, telefone: e.target.value }))} placeholder="(11) 99999-9999" />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input type="email" className="form-input" value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="contato@empresa.com" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Endereço</label>
                <textarea className="form-textarea" value={form.endereco}
                  onChange={e => setForm(p => ({ ...p, endereco: e.target.value }))} placeholder="Endereço completo..." />
              </div>
            </div>
          </div>

          <div style={{ marginTop: 'var(--space-6)', display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/fornecedores')}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ minWidth: 160 }}>
              {loading ? <><Loader2 size={16} className="spin" /> Salvando...</> :
                <><Save size={16} /> {isEdit ? 'Salvar' : 'Cadastrar'}</>}
            </button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
