// ============================================
// NOTIFICAÇÕES — Centro de Alertas
// ============================================
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import { useNotificacoes } from '../hooks/useNotificacoes';
import { formatarDataHora, tempoRelativo } from '../lib/utils';
import {
  Bell, BellRing, AlertTriangle, XCircle, CheckCircle2,
  CalendarClock, Package, Check, RefreshCw, Filter, X
} from 'lucide-react';
import toast from 'react-hot-toast';

function tipoConfig(tipo) {
  switch (tipo) {
    case 'VENCIMENTO':
      return {
        icon: <CalendarClock size={18} />,
        color: 'var(--warning-500)',
        bg: 'var(--warning-50)',
        border: 'var(--warning-500)',
        label: 'Vencimento',
        badgeClass: 'badge-warning',
      };
    case 'ESTOQUE_BAIXO':
      return {
        icon: <AlertTriangle size={18} />,
        color: 'var(--warning-600)',
        bg: 'var(--warning-50)',
        border: 'var(--warning-600)',
        label: 'Estoque Baixo',
        badgeClass: 'badge-warning',
      };
    case 'SEM_ESTOQUE':
      return {
        icon: <XCircle size={18} />,
        color: 'var(--destructive-500)',
        bg: 'var(--destructive-50)',
        border: 'var(--destructive-500)',
        label: 'Sem Estoque',
        badgeClass: 'badge-danger pulse',
      };
    default:
      return {
        icon: <Bell size={18} />,
        color: 'var(--neutral-500)',
        bg: 'var(--neutral-50)',
        border: 'var(--neutral-300)',
        label: 'Alerta',
        badgeClass: 'badge-neutral',
      };
  }
}

function NotificationItem({ notif, onMarcarLida, onNavigate }) {
  const config = tipoConfig(notif.tipo);

  return (
    <div
      className={`alert-item ${!notif.lida ? 'unread' : ''} ${notif.tipo === 'SEM_ESTOQUE' ? 'critical' : notif.tipo === 'ESTOQUE_BAIXO' || notif.tipo === 'VENCIMENTO' ? 'warning' : ''}`}
      style={{
        background: notif.lida ? undefined : config.bg,
        borderLeft: `3px solid ${notif.lida ? 'var(--neutral-200)' : config.border}`,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: config.bg,
          color: config.color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {config.icon}
      </div>

      <div className="alert-item-content">
        <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
          <span className={`badge ${config.badgeClass}`}>
            {notif.lida && <span className="badge-dot" />}
            {config.label}
          </span>
          {!notif.lida && (
            <span className="badge badge-brand" style={{ fontSize: 11 }}>
              Novo
            </span>
          )}
        </div>
        <p className="alert-item-text">
          {notif.mensagem}
          {notif.produto && (
            <span
              style={{ color: 'var(--brand-600)', cursor: 'pointer', marginLeft: 4 }}
              onClick={() => onNavigate(`/produtos/${notif.produto.id}`)}
            >
              — Ver {notif.produto.nome}
            </span>
          )}
        </p>
        <div className="alert-item-time">
          {tempoRelativo(notif.criado_em)} · {formatarDataHora(notif.criado_em)}
        </div>
      </div>

      <div className="flex gap-2">
        {!notif.lida && (
          <button
            className="btn btn-ghost btn-icon btn-sm"
            onClick={() => onMarcarLida(notif.id)}
            title="Marcar como lida"
          >
            <Check size={15} />
          </button>
        )}
      </div>
    </div>
  );
}

function SkeletonItems() {
  return Array.from({ length: 4 }).map((_, i) => (
    <div key={i} className="alert-item" style={{ opacity: 0.6 }}>
      <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div className="skeleton skeleton-text" style={{ width: '50%', marginBottom: 8 }} />
        <div className="skeleton skeleton-text" style={{ width: '80%', marginBottom: 6 }} />
        <div className="skeleton skeleton-text short" />
      </div>
    </div>
  ));
}

export default function NotificacoesPage() {
  const navigate = useNavigate();
  const {
    notificacoes, naoLidas, loading, paginacao,
    listar, marcarComoLida, marcarTodasComoLidas, verificarVencimentos
  } = useNotificacoes();
  const [filtroTipo, setFiltroTipo] = useState('');
  const [verificando, setVerificando] = useState(false);

  useEffect(() => {
    listar({ tipo: filtroTipo || undefined });
  }, [filtroTipo, listar]);

  async function handleMarcarLida(id) {
    try {
      await marcarComoLida(id);
      toast.success('Marcada como lida');
      listar({ tipo: filtroTipo || undefined });
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleMarcarTodasLidas() {
    try {
      await marcarTodasComoLidas();
      toast.success('Todas marcadas como lidas');
      listar({ tipo: filtroTipo || undefined });
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleVerificarVencimentos() {
    setVerificando(true);
    try {
      const result = await verificarVencimentos();
      toast.success(`Verificação concluída. ${result.length} notificações geradas.`);
      listar({ tipo: filtroTipo || undefined });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setVerificando(false);
    }
  }

  return (
    <MainLayout>
      <div className="page-header">
        <div className="page-header-left">
          <div className="breadcrumb">
            <span onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>Dashboard</span>
            <span className="text-muted">/</span>
            <span>Notificações</span>
          </div>
          <h1 className="display-l flex items-center gap-3">
            {naoLidas > 0 ? (
              <BellRing size={28} style={{ color: 'var(--warning-500)' }} />
            ) : (
              <Bell size={28} style={{ color: 'var(--neutral-400)' }} />
            )}
            Notificações
            {naoLidas > 0 && (
              <span className="badge badge-danger">
                {naoLidas} não lida{naoLidas !== 1 ? 's' : ''}
              </span>
            )}
          </h1>
        </div>
        <div className="page-header-right">
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleVerificarVencimentos}
            disabled={verificando}
          >
            <RefreshCw size={15} className={verificando ? 'spinning' : ''} />
            Verificar Vencimentos
          </button>
          {naoLidas > 0 && (
            <button className="btn btn-primary btn-sm" onClick={handleMarcarTodasLidas}>
              <CheckCircle2 size={15} />
              Marcar todas lidas
            </button>
          )}
        </div>
      </div>

      <div className="page-body">
        <div style={{ maxWidth: 720 }}>
          <div className="card">
            <div className="card-body" style={{ padding: 'var(--space-3)' }}>
              <div className="flex items-center gap-3" style={{ padding: 'var(--space-3) var(--space-4)' }}>
                <Filter size={15} style={{ color: 'var(--neutral-400)' }} />
                <span className="body-s">Filtrar por tipo:</span>
                {['', 'VENCIMENTO', 'ESTOQUE_BAIXO', 'SEM_ESTOQUE'].map((tipo) => (
                  <button
                    key={tipo}
                    className={`btn btn-sm ${filtroTipo === tipo ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setFiltroTipo(tipo)}
                  >
                    {tipo === '' ? 'Todas' : tipoConfig(tipo).label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="card mt-4">
            {loading ? (
              <div style={{ padding: 'var(--space-4)' }}>
                <SkeletonItems />
              </div>
            ) : notificacoes.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <CheckCircle2 size={32} style={{ color: 'var(--success-500)' }} />
                </div>
                <h3>Tudo em dia!</h3>
                <p>Não há notificações no momento. O sistema continua monitorando estoque e vencimentos.</p>
              </div>
            ) : (
              <div style={{ padding: 'var(--space-2)' }}>
                {notificacoes.map((notif) => (
                  <NotificationItem
                    key={notif.id}
                    notif={notif}
                    onMarcarLida={handleMarcarLida}
                    onNavigate={navigate}
                  />
                ))}
              </div>
            )}
          </div>

          {!loading && paginacao.totalPaginas > 1 && (
            <div className="flex justify-between items-center mt-4">
              <span className="body-s text-muted">
                {paginacao.total} notificações · Página {paginacao.pagina} de {paginacao.totalPaginas}
              </span>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spinning { animation: spin 1s linear infinite; }
      `}</style>
    </MainLayout>
  );
}
