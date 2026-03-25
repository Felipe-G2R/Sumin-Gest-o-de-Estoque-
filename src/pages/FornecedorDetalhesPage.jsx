// ============================================
// FORNECEDOR DETALHES
// ============================================
import { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useFornecedores } from '../hooks/useFornecedores';
import { useAuth } from '../hooks/useAuth';
import MainLayout from '../components/layout/MainLayout';
import { ArrowLeft, Edit2, Trash2, Phone, Mail, MapPin, Package, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

export default function FornecedorDetalhesPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fornecedor, loading, buscar, desativar } = useFornecedores();
  const { isAdmin } = useAuth();

  useEffect(() => { buscar(id); }, [id, buscar]);

  async function handleDesativar() {
    if (!confirm('Deseja desativar este fornecedor?')) return;
    try { await desativar(id); toast.success('Fornecedor desativado'); navigate('/fornecedores'); }
    catch (err) { toast.error(err.message); }
  }

  if (loading || !fornecedor) {
    return (
      <MainLayout>
        <div className="page-body">
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-card mt-4" style={{ height: 200 }} />
        </div>
      </MainLayout>
    );
  }

  const produtosAtivos = fornecedor.produtos?.filter(p => p.ativo) || [];
  const initials = fornecedor.nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

  return (
    <MainLayout>
      <div className="page-header">
        <div className="page-header-left">
          <div className="breadcrumb">
            <Link to="/dashboard">Dashboard</Link><span>/</span>
            <Link to="/fornecedores">Fornecedores</Link><span>/</span>
            <span>{fornecedor.nome}</span>
          </div>
          <h1 className="display-l" style={{ fontSize: 24 }}>{fornecedor.nome}</h1>
        </div>
        <div className="page-header-right">
          <button className="btn btn-ghost" onClick={() => navigate('/fornecedores')}><ArrowLeft size={16} /> Voltar</button>
          <Link to={`/fornecedores/${id}/editar`} className="btn btn-secondary"><Edit2 size={16} /> Editar</Link>
          {isAdmin && fornecedor.ativo && (
            <button className="btn btn-danger" onClick={handleDesativar}><Trash2 size={16} /> Desativar</button>
          )}
        </div>
      </div>

      <div className="page-body">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
          {/* Info card */}
          <div className="card">
            <div className="card-body">
              <div className="flex items-center gap-4 mb-6">
                <div className="supplier-avatar" style={{ width: 56, height: 56, fontSize: 20 }}>{initials}</div>
                <div>
                  <h2 className="heading-m">{fornecedor.nome}</h2>
                  {fornecedor.cnpj && <span className="mono-s">{fornecedor.cnpj}</span>}
                </div>
              </div>

              <div className="supplier-contact" style={{ gap: 'var(--space-3)' }}>
                {fornecedor.telefone && (
                  <a href={`tel:${fornecedor.telefone}`} className="supplier-contact-item" style={{ textDecoration: 'none' }}>
                    <Phone size={16} /> {fornecedor.telefone} <ExternalLink size={12} style={{ opacity: 0.5 }} />
                  </a>
                )}
                {fornecedor.email && (
                  <a href={`mailto:${fornecedor.email}`} className="supplier-contact-item" style={{ textDecoration: 'none' }}>
                    <Mail size={16} /> {fornecedor.email} <ExternalLink size={12} style={{ opacity: 0.5 }} />
                  </a>
                )}
                {fornecedor.endereco && (
                  <div className="supplier-contact-item">
                    <MapPin size={16} /> {fornecedor.endereco}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Products linked */}
          <div className="card">
            <div className="card-body">
              <div className="flex items-center justify-between mb-4">
                <h2 className="heading-s">
                  <Package size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: '-2px' }} />
                  Produtos Vinculados ({produtosAtivos.length})
                </h2>
              </div>
              {produtosAtivos.length === 0 ? (
                <p className="body-s" style={{ textAlign: 'center', padding: 'var(--space-6)' }}>Nenhum produto vinculado</p>
              ) : (
                <ul className="activity-list">
                  {produtosAtivos.map(p => (
                    <li key={p.id} className="activity-item" style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/produtos/${p.id}`)}>
                      <div className="table-product-icon" style={{ width: 32, height: 32 }}>
                        <Package size={14} />
                      </div>
                      <div className="activity-text">
                        <strong>{p.nome}</strong>
                        <br />
                        <span className="body-s">{p.categoria || 'Sem categoria'} · {p.quantidade_atual} un.</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
