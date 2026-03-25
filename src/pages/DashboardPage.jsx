// ============================================
// DASHBOARD — Control Tower com Gráficos
// ============================================
import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDashboard } from '../hooks/useDashboard';
import { useRelatorios } from '../hooks/useRelatorios';
import { useAuth } from '../hooks/useAuth';
import MainLayout from '../components/layout/MainLayout';
import MovimentacoesChart from '../components/charts/MovimentacoesChart';
import CategoriasPieChart from '../components/charts/CategoriasPieChart';
import { tempoRelativo } from '../lib/utils';
import {
  AlertTriangle, PackageX, CalendarClock, Package,
  ArrowDownCircle, ArrowUpCircle, TrendingUp, Bell, ArrowLeftRight,
  BarChart3, ShoppingCart, ClipboardList, Truck
} from 'lucide-react';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

function SkeletonCards() {
  return (
    <div className="stats-grid">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="stat-card">
          <div className="stat-card-info">
            <div className="skeleton skeleton-text short" />
            <div className="skeleton skeleton-title" style={{ width: '50%', height: 32 }} />
          </div>
          <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)' }} />
        </div>
      ))}
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="card">
      <div className="card-body">
        <div className="skeleton skeleton-text" style={{ width: '40%', marginBottom: 16 }} />
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="skeleton skeleton-row" />
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { stats, grafico, loading, carregarTudo } = useDashboard();
  const { distribuicaoCategorias, carregarDistribuicaoCategorias } = useRelatorios();
  const { profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([carregarTudo(), carregarDistribuicaoCategorias()]);
  }, [carregarTudo, carregarDistribuicaoCategorias]);

  function getMovIcon(tipo) {
    if (tipo === 'ENTRADA') return <ArrowDownCircle size={16} />;
    return <ArrowUpCircle size={16} />;
  }

  function getMovClass(tipo) {
    return tipo === 'ENTRADA' ? 'entrada' : 'saida';
  }

  const isFirstTime = stats && stats.cards.totalProdutos === 0;

  return (
    <MainLayout>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="display-l" style={{ fontSize: 24 }}>Dashboard</h1>
          <p className="body-s">{getGreeting()}, {profile?.nome?.split(' ')[0]}. Aqui está o resumo do seu estoque.</p>
        </div>
      </div>

      <div className="page-body">
        {/* Onboarding: Empty State */}
        {!loading && isFirstTime && (
          <div className="empty-state" style={{ padding: 'var(--space-12) var(--space-8)' }}>
            <div className="empty-state-icon" style={{ width: 80, height: 80 }}>
              <Package size={36} />
            </div>
            <h3>Bem-vindo ao LogControl!</h3>
            <p>Seu estoque está vazio. Comece cadastrando seu primeiro produto para ter controle total do seu inventário.</p>
            <Link to="/produtos/novo" className="btn btn-primary" style={{ height: 48, paddingInline: 'var(--space-8)' }}>
              <Package size={18} />
              Cadastrar meu primeiro produto
            </Link>
          </div>
        )}

        {/* Loading: Skeleton */}
        {loading && !stats && (
          <>
            <SkeletonCards />
            <div className="dashboard-grid">
              <SkeletonList />
              <SkeletonList />
            </div>
          </>
        )}

        {/* Loaded Data */}
        {stats && !isFirstTime && (
          <>
            {/* Ações Rápidas */}
            <div className="quick-actions-grid">
              <Link to="/produtos/novo" className="quick-action-card">
                <Package size={22} className="text-brand" />
                <span>Novo Produto</span>
              </Link>
              <Link to="/movimentacoes/entrada" className="quick-action-card">
                <ArrowDownCircle size={22} style={{ color: 'var(--success-500)' }} />
                <span>Entrada</span>
              </Link>
              <Link to="/movimentacoes/saida" className="quick-action-card">
                <ArrowUpCircle size={22} style={{ color: 'var(--destructive-500)' }} />
                <span>Saída</span>
              </Link>
              <Link to="/fornecedores/novo" className="quick-action-card">
                <Truck size={22} style={{ color: 'var(--info-500)' }} />
                <span>Fornecedor</span>
              </Link>
              <Link to="/inventario" className="quick-action-card">
                <ClipboardList size={22} style={{ color: 'var(--warning-500)' }} />
                <span>Inventário</span>
              </Link>
              <Link to="/relatorios" className="quick-action-card">
                <BarChart3 size={22} style={{ color: 'var(--brand-600)' }} />
                <span>Relatórios</span>
              </Link>
            </div>

            {/* Cards de Indicadores — Clicáveis */}
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
              <div className="stat-card clickable" style={{ borderLeft: '3px solid var(--info-500)' }} onClick={() => navigate('/produtos')}>
                <div className="stat-card-info">
                  <div className="stat-card-label">Valor do Estoque</div>
                  <div className="stat-card-value" style={{ fontSize: 22 }}>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.cards.valorTotalEstoque)}
                  </div>
                </div>
                <div className="stat-card-icon info">
                  <TrendingUp size={22} />
                </div>
              </div>

              <div className={`stat-card clickable ${stats.cards.produtosVencidos > 0 ? 'danger' : ''}`}
                onClick={() => navigate('/produtos?vencimento=vencido')}>
                <div className="stat-card-info">
                  <div className="stat-card-label">Vencidos</div>
                  <div className="stat-card-value">{stats.cards.produtosVencidos}</div>
                </div>
                <div className={`stat-card-icon ${stats.cards.produtosVencidos > 0 ? 'danger' : 'brand'}`}>
                  <AlertTriangle size={22} />
                </div>
              </div>

              <div className={`stat-card clickable ${stats.cards.semEstoque > 0 ? 'warning' : ''}`}
                onClick={() => navigate('/produtos?estoque=zerado')}>
                <div className="stat-card-info">
                  <div className="stat-card-label">Sem Estoque</div>
                  <div className="stat-card-value">{stats.cards.semEstoque}</div>
                </div>
                <div className={`stat-card-icon ${stats.cards.semEstoque > 0 ? 'danger' : 'brand'}`}>
                  <PackageX size={22} />
                </div>
              </div>

              <div className={`stat-card clickable ${stats.cards.estoqueBaixo > 0 ? 'warning' : ''}`}
                onClick={() => navigate('/sugestoes-compra')}>
                <div className="stat-card-info">
                  <div className="stat-card-label">Estoque Baixo</div>
                  <div className="stat-card-value">{stats.cards.estoqueBaixo}</div>
                </div>
                <div className={`stat-card-icon ${stats.cards.estoqueBaixo > 0 ? 'warning' : 'brand'}`}>
                  <ShoppingCart size={22} />
                </div>
              </div>

              <div className="stat-card clickable" onClick={() => navigate('/relatorios')}>
                <div className="stat-card-info">
                  <div className="stat-card-label">Vencem em 30 dias</div>
                  <div className="stat-card-value">{stats.cards.produtosVencendo}</div>
                </div>
                <div className="stat-card-icon info">
                  <CalendarClock size={22} />
                </div>
              </div>
            </div>

            {/* Gráficos */}
            <div className="dashboard-grid">
              <div className="card">
                <div className="card-body">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="heading-s">
                      <BarChart3 size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: '-2px' }} />
                      Movimentações (7 dias)
                    </h2>
                  </div>
                  <MovimentacoesChart data={grafico} />
                </div>
              </div>

              <div className="card">
                <div className="card-body">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="heading-s">
                      <Package size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: '-2px' }} />
                      Distribuição por Categoria
                    </h2>
                  </div>
                  <CategoriasPieChart data={distribuicaoCategorias} />
                </div>
              </div>
            </div>

            {/* Alertas + Atividade */}
            <div className="dashboard-grid">
              <div className="card">
                <div className="card-body" style={{ paddingBottom: 0 }}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="heading-s">
                      <Bell size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: '-2px' }} />
                      Alertas Pendentes
                    </h2>
                    <Link to="/notificacoes" className="btn btn-ghost btn-sm">Ver todos</Link>
                  </div>
                </div>
                <div>
                  {stats.notificacoesPendentes.length === 0 ? (
                    <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
                      <p className="body-s" style={{ color: 'var(--success-500)' }}>Nenhum alerta pendente</p>
                    </div>
                  ) : (
                    stats.notificacoesPendentes.slice(0, 5).map(notif => (
                      <Link to={`/produtos/${notif.produto?.id}`} key={notif.id}
                        className={`alert-item ${notif.tipo === 'SEM_ESTOQUE' ? 'critical' : 'warning'} unread`}
                        style={{ textDecoration: 'none' }}>
                        <div style={{
                          width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                          background: notif.tipo === 'SEM_ESTOQUE' ? 'var(--destructive-500)' : 'var(--warning-500)'
                        }} />
                        <div className="alert-item-content">
                          <div className="alert-item-text">{notif.mensagem}</div>
                          <div className="alert-item-time">{tempoRelativo(notif.criado_em)}</div>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>

              <div className="card">
                <div className="card-body" style={{ paddingBottom: 0 }}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="heading-s">
                      <ArrowLeftRight size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: '-2px' }} />
                      Atividade Recente
                    </h2>
                    <Link to="/movimentacoes" className="btn btn-ghost btn-sm">Ver tudo</Link>
                  </div>
                </div>
                <ul className="activity-list">
                  {stats.movimentacoesRecentes.length === 0 ? (
                    <li style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
                      <p className="body-s">Nenhuma movimentação registrada ainda</p>
                    </li>
                  ) : (
                    stats.movimentacoesRecentes.slice(0, 7).map(mov => (
                      <li key={mov.id} className="activity-item">
                        <div className={`activity-icon ${getMovClass(mov.tipo)}`}>
                          {getMovIcon(mov.tipo)}
                        </div>
                        <div className="activity-text">
                          <strong>{mov.usuario?.nome || 'Sistema'}</strong>{' '}
                          {mov.tipo === 'ENTRADA' ? 'registrou entrada de' : 'retirou'}{' '}
                          <strong>{mov.quantidade} {mov.produto?.unidade_medida}</strong> de{' '}
                          <strong>{mov.produto?.nome}</strong>
                        </div>
                        <span className="activity-time">{tempoRelativo(mov.criado_em)}</span>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}
