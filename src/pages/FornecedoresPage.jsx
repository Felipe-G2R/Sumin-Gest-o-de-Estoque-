// ============================================
// FORNECEDORES — Grid de Cards com Export + ConfirmModal
// ============================================
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFornecedores } from '../hooks/useFornecedores';
import MainLayout from '../components/layout/MainLayout';
import ConfirmModal from '../components/ui/ConfirmModal';
import { exportToCSV, exportToPDF } from '../lib/export';
import { Search, Plus, Phone, Mail, MapPin, Truck, Trash2, FileDown, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

export default function FornecedoresPage() {
  const navigate = useNavigate();
  const { fornecedores, loading, listar, excluir } = useFornecedores();
  const [busca, setBusca] = useState('');
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null, nome: '' });

  useEffect(() => {
    const timer = setTimeout(() => {
      listar({ busca: busca || undefined, status: 'ativo', por_pagina: 100 });
    }, 300);
    return () => clearTimeout(timer);
  }, [busca, listar]);

  function handleExcluir(e, id, nome) {
    e.stopPropagation();
    setConfirmModal({ isOpen: true, id, nome });
  }

  async function confirmarExclusao() {
    try {
      await excluir(confirmModal.id);
      toast.success('Fornecedor excluído');
      listar({ busca: busca || undefined, status: 'ativo', por_pagina: 100 });
    } catch { /* hook handles */ }
  }

  const exportColumns = [
    { key: 'nome', label: 'Nome' },
    { key: 'cnpj', label: 'CNPJ' },
    { key: 'email', label: 'Email' },
    { key: 'telefone', label: 'Telefone' },
    { key: 'endereco', label: 'Endereço' },
  ];

  function handleExportCSV() {
    exportToCSV(fornecedores, 'fornecedores', exportColumns);
    toast.success('CSV exportado!');
  }

  function handleExportPDF() {
    exportToPDF('Relatório de Fornecedores', fornecedores, exportColumns);
  }

  function getInitials(nome) {
    return nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }

  return (
    <MainLayout>
      <div className="page-header">
        <div className="page-header-left">
          <div className="breadcrumb">
            <Link to="/dashboard">Dashboard</Link><span>/</span>
            <span>Fornecedores</span>
          </div>
          <h1 className="display-l" style={{ fontSize: 24 }}>Fornecedores</h1>
        </div>
        <div className="page-header-right">
          <button className="btn btn-secondary btn-sm" onClick={handleExportCSV}>
            <FileDown size={16} /> <span className="hide-mobile">CSV</span>
          </button>
          <button className="btn btn-secondary btn-sm" onClick={handleExportPDF}>
            <FileText size={16} /> <span className="hide-mobile">PDF</span>
          </button>
          <Link to="/fornecedores/novo" className="btn btn-primary">
            <Plus size={16} /> Novo Fornecedor
          </Link>
        </div>
      </div>

      <div className="page-body">
        <div style={{ marginBottom: 'var(--space-6)', maxWidth: 400 }}>
          <div className="table-search" style={{ maxWidth: '100%' }}>
            <Search size={16} className="search-icon" />
            <input className="form-input" style={{ paddingLeft: 36 }} type="text"
              placeholder="Buscar por nome, CNPJ ou email..." value={busca}
              onChange={e => setBusca(e.target.value)} />
          </div>
        </div>

        {loading && (
          <div className="supplier-grid">
            {[1, 2, 3].map(i => (
              <div key={i} className="card" style={{ padding: 'var(--space-5)' }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 'var(--radius-lg)' }} />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton skeleton-text" style={{ width: '70%' }} />
                    <div className="skeleton skeleton-text" style={{ width: '40%' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && fornecedores.length === 0 && !busca && (
          <div className="empty-state">
            <div className="empty-state-icon"><Truck size={32} /></div>
            <h3>Nenhum fornecedor cadastrado</h3>
            <p>Cadastre seus fornecedores para vincular aos produtos.</p>
            <Link to="/fornecedores/novo" className="btn btn-primary"><Plus size={16} /> Cadastrar fornecedor</Link>
          </div>
        )}

        {!loading && fornecedores.length === 0 && busca && (
          <div className="empty-state">
            <h3>Nenhum resultado</h3>
            <p>Nenhum fornecedor encontrado para "{busca}".</p>
          </div>
        )}

        {!loading && fornecedores.length > 0 && (
          <div className="supplier-grid">
            {fornecedores.map(f => (
              <div key={f.id} className="supplier-card" onClick={() => navigate(`/fornecedores/${f.id}`)}>
                <div className="supplier-card-header">
                  <div className="supplier-avatar">{getInitials(f.nome)}</div>
                  <div className="supplier-info" style={{ flex: 1 }}>
                    <h3>{f.nome}</h3>
                    {f.cnpj && <p className="mono-s">{f.cnpj}</p>}
                  </div>
                  <button className="btn btn-ghost btn-icon btn-sm text-danger"
                    onClick={(e) => handleExcluir(e, f.id, f.nome)} title="Excluir">
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="supplier-contact">
                  {f.telefone && <div className="supplier-contact-item"><Phone size={14} /><a href={`tel:${f.telefone}`} onClick={e => e.stopPropagation()}>{f.telefone}</a></div>}
                  {f.email && <div className="supplier-contact-item"><Mail size={14} /><a href={`mailto:${f.email}`} onClick={e => e.stopPropagation()}>{f.email}</a></div>}
                  {f.endereco && <div className="supplier-contact-item"><MapPin size={14} /><span>{f.endereco}</span></div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, id: null, nome: '' })}
        onConfirm={confirmarExclusao}
        title="Excluir Fornecedor"
        message={`Tem certeza que deseja excluir o fornecedor "${confirmModal.nome}"?`}
        confirmText="Excluir"
        variant="danger"
      />
    </MainLayout>
  );
}
