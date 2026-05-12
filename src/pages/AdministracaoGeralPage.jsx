// ============================================
// ADMINISTRAÇÃO GERAL — Dashboard agregado de todas as lojas
// Visível apenas para SUPER_ADMIN.
// ============================================
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import { useAuth } from '../hooks/useAuth';
import { useLojaAtiva } from '../contexts/LojaAtivaContext';
import { dashboardService } from '../services/dashboardService';
import { formatarMoeda } from '../lib/utils';
import {
  Globe2, Building2, Package, AlertTriangle, TrendingUp, Loader2,
  ArrowRight, BarChart3, Bell
} from 'lucide-react';

export default function AdministracaoGeralPage() {
  const navigate = useNavigate();
  const { isSuperAdmin } = useAuth();
  const { lojas, loadingLojas, setLojaAtivaId } = useLojaAtiva();
  const [statsPorLoja, setStatsPorLoja] = useState({});
  const [statsGlobais, setStatsGlobais] = useState(null);
  const [loading, setLoading] = useState(true);

  // Redirect se não for SUPER_ADMIN
  useEffect(() => {
    if (!isSuperAdmin) navigate('/dashboard', { replace: true });
  }, [isSuperAdmin, navigate]);

  const carregar = useCallback(async () => {
    if (!isSuperAdmin || lojas.length === 0) return;
    setLoading(true);
    try {
      // Stats globais (sem filtro de loja)
      const globais = await dashboardService.getStats(null);
      setStatsGlobais(globais);

      // Stats por loja, em paralelo
      const entradas = await Promise.all(
        lojas.map(l => dashboardService.getStats(l.id).then(s => [l.id, s]))
      );
      setStatsPorLoja(Object.fromEntries(entradas));
    } catch (err) {
      console.error('Erro ao carregar Administração Geral:', err);
    } finally {
      setLoading(false);
    }
  }, [isSuperAdmin, lojas]);

  useEffect(() => { carregar(); }, [carregar]);

  function entrarNaLoja(lojaId) {
    setLojaAtivaId(lojaId);
    navigate('/dashboard');
  }

  if (!isSuperAdmin) return null;

  return (
    <MainLayout>
      <div className="page-header">
        <div className="page-header-left">
          <div className="breadcrumb">
            <span>Administração Geral</span>
          </div>
          <h1 className="display-l flex items-center gap-3">
            <Globe2 size={28} style={{ color: 'var(--brand-500)' }} />
            Visão consolidada de todas as lojas
          </h1>
        </div>
      </div>

      <div className="page-body">
        {loadingLojas || loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
            <Loader2 size={32} className="spin" />
          </div>
        ) : (
          <>
            {/* Cards globais */}
            {statsGlobais && (
              <>
                <h2 className="heading-s mb-3" style={{ color: 'var(--neutral-600)' }}>
                  Resumo consolidado
                </h2>
                <div className="stats-grid mb-6">
                  <div className="stat-card">
                    <div className="stat-card-info">
                      <div className="stat-card-label">Produtos (todas)</div>
                      <div className="stat-card-value">{statsGlobais.cards.totalProdutos}</div>
                    </div>
                    <div className="stat-card-icon brand"><Package size={20} /></div>
                  </div>
                  <div className="stat-card" style={{ borderLeft: '3px solid var(--danger-500)' }}>
                    <div className="stat-card-info">
                      <div className="stat-card-label">Vencidos</div>
                      <div className="stat-card-value">{statsGlobais.cards.produtosVencidos}</div>
                    </div>
                    <div className="stat-card-icon danger"><AlertTriangle size={20} /></div>
                  </div>
                  <div className="stat-card" style={{ borderLeft: '3px solid var(--warning-500)' }}>
                    <div className="stat-card-info">
                      <div className="stat-card-label">Estoque baixo</div>
                      <div className="stat-card-value">{statsGlobais.cards.estoqueBaixo}</div>
                    </div>
                    <div className="stat-card-icon warning"><TrendingUp size={20} /></div>
                  </div>
                  <div className="stat-card" style={{ borderLeft: '3px solid var(--success-500)' }}>
                    <div className="stat-card-info">
                      <div className="stat-card-label">Valor total</div>
                      <div className="stat-card-value">{formatarMoeda(statsGlobais.cards.valorTotalEstoque)}</div>
                    </div>
                    <div className="stat-card-icon success"><BarChart3 size={20} /></div>
                  </div>
                </div>
              </>
            )}

            {/* Painel por loja */}
            <h2 className="heading-s mb-3" style={{ color: 'var(--neutral-600)' }}>
              Por loja ({lojas.length})
            </h2>

            {lojas.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon"><Building2 size={32} /></div>
                <h3>Nenhuma loja cadastrada</h3>
                <p>Crie a primeira loja em <button className="btn btn-ghost btn-sm" onClick={() => navigate('/super-admin')}>Gestão de Lojas</button></p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                {lojas.map(loja => {
                  const s = statsPorLoja[loja.id];
                  return (
                    <div key={loja.id} className="card" style={{ overflow: 'hidden', opacity: loja.ativo ? 1 : 0.6 }}>
                      <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-color)' }}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Building2 size={18} style={{ color: 'var(--brand-500)' }} />
                            <span style={{ fontWeight: 600 }}>{loja.nome?.trim()}</span>
                          </div>
                          <span className={`badge ${loja.ativo ? 'badge-success' : 'badge-danger'}`}>
                            <span className="badge-dot" />
                            {loja.ativo ? 'Ativa' : 'Inativa'}
                          </span>
                        </div>
                        {loja.cnpj && <div className="body-s mt-1">{loja.cnpj}</div>}
                      </div>

                      <div style={{ padding: 16 }}>
                        {!s ? (
                          <div className="body-s text-muted">Carregando dados…</div>
                        ) : (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <MetricMini icon={<Package size={14} />} label="Produtos" value={s.cards.totalProdutos} />
                            <MetricMini icon={<AlertTriangle size={14} />} label="Vencidos" value={s.cards.produtosVencidos} tone="danger" />
                            <MetricMini icon={<TrendingUp size={14} />} label="Est. baixo" value={s.cards.estoqueBaixo} tone="warning" />
                            <MetricMini icon={<Bell size={14} />} label="Alertas" value={s.notificacoesPendentes?.length || 0} />
                            <div style={{ gridColumn: '1 / -1', marginTop: 4, paddingTop: 10, borderTop: '1px dashed var(--border-color)' }}>
                              <div className="body-s text-muted">Valor estoque</div>
                              <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--neutral-800)' }}>
                                {formatarMoeda(s.cards.valorTotalEstoque)}
                              </div>
                            </div>
                          </div>
                        )}

                        <button
                          className="btn btn-secondary btn-sm mt-4"
                          style={{ width: '100%' }}
                          onClick={() => entrarNaLoja(loja.id)}
                          disabled={!loja.ativo}
                        >
                          Entrar na loja <ArrowRight size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
}

function MetricMini({ icon, label, value, tone }) {
  const color =
    tone === 'danger' ? 'var(--danger-600)' :
    tone === 'warning' ? 'var(--warning-600)' :
    'var(--neutral-800)';
  return (
    <div>
      <div className="body-s flex items-center gap-1 text-muted" style={{ fontSize: 11 }}>
        {icon}{label}
      </div>
      <div style={{ fontSize: 18, fontWeight: 600, color }}>{value ?? 0}</div>
    </div>
  );
}
