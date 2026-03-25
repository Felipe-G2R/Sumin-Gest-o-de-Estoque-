// ============================================
// LOCAL FORM — Cadastro/Edicao de Local
// ============================================
import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useLocais } from '../hooks/useLocais';
import { TIPO_LOCAL } from '../lib/constants';
import MainLayout from '../components/layout/MainLayout';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const TIPO_OPTIONS = [
  { value: TIPO_LOCAL.SALA, label: 'Sala' },
  { value: TIPO_LOCAL.ARMARIO, label: 'Armario' },
  { value: TIPO_LOCAL.DEPOSITO, label: 'Deposito' },
  { value: TIPO_LOCAL.FILIAL, label: 'Filial' },
];

export default function LocalFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { buscar, criar, atualizar, loading } = useLocais();

  const [form, setForm] = useState({
    nome: '',
    tipo: 'SALA',
    descricao: '',
  });

  const carregarLocal = useCallback(async () => {
    try {
      const l = await buscar(id);
      setForm({
        nome: l.nome || '',
        tipo: l.tipo || 'SALA',
        descricao: l.descricao || '',
      });
    } catch {
      toast.error('Local nao encontrado');
      navigate('/locais');
    }
  }, [id, buscar, navigate]);

  useEffect(() => {
    if (isEdit) carregarLocal();
  }, [isEdit, carregarLocal]);

  function handleChange(campo, valor) {
    setForm(prev => ({ ...prev, [campo]: valor }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const dados = {
        nome: form.nome.trim(),
        tipo: form.tipo,
        descricao: form.descricao.trim() || null,
      };
      if (isEdit) {
        await atualizar(id, dados);
        toast.success('Local atualizado!');
      } else {
        await criar(dados);
        toast.success('Local cadastrado!');
      }
      navigate('/locais');
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <MainLayout>
      <div className="page-header">
        <div className="page-header-left">
          <div className="breadcrumb">
            <Link to="/dashboard">Dashboard</Link>
            <span>/</span>
            <Link to="/locais">Locais</Link>
            <span>/</span>
            <span>{isEdit ? 'Editar' : 'Novo'}</span>
          </div>
          <h1 className="display-l" style={{ fontSize: 24 }}>
            {isEdit ? 'Editar Local' : 'Novo Local'}
          </h1>
        </div>
        <div className="page-header-right">
          <button className="btn btn-ghost" onClick={() => navigate('/locais')}>
            <ArrowLeft size={16} /> Voltar
          </button>
        </div>
      </div>

      <div className="page-body">
        <form onSubmit={handleSubmit} style={{ maxWidth: 680 }}>
          <div className="card">
            <div className="card-body">
              <h2 className="heading-s mb-4">Informacoes do Local</h2>

              <div className="form-group">
                <label className="form-label">Nome <span className="required">*</span></label>
                <input
                  type="text"
                  className="form-input"
                  value={form.nome}
                  onChange={e => handleChange('nome', e.target.value)}
                  required
                  placeholder="Ex: Sala de Procedimentos 1"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Tipo</label>
                <select
                  className="form-select"
                  value={form.tipo}
                  onChange={e => handleChange('tipo', e.target.value)}
                >
                  {TIPO_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Descricao</label>
                <textarea
                  className="form-textarea"
                  value={form.descricao}
                  onChange={e => handleChange('descricao', e.target.value)}
                  placeholder="Observacoes ou detalhes sobre o local..."
                />
              </div>
            </div>
          </div>

          <div style={{ marginTop: 'var(--space-6)', display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/locais')}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ minWidth: 160 }}>
              {loading ? (
                <><Loader2 size={16} className="spin" /> Salvando...</>
              ) : (
                <><Save size={16} /> {isEdit ? 'Salvar Alteracoes' : 'Cadastrar'}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
