// ============================================
// PERFIL — Página Completa com Abas
// ============================================
import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import MainLayout from '../components/layout/MainLayout';
import Tabs from '../components/ui/Tabs';
import {
  Camera, Save, User, Mail, Shield, CheckCircle, ArrowLeft,
  Lock, Key, Clock, Activity, Settings, Bell, Eye, EyeOff,
  Phone, Award, Loader2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { tempoRelativo, formatarDataHora } from '../lib/utils';

// ---- Tab: Dados Pessoais ----
function TabDadosPessoais({ profile, updateProfile, uploadAvatar }) {
  const [nome, setNome] = useState(profile?.nome || '');
  const [telefone, setTelefone] = useState(profile?.telefone || '');
  const [cargo, setCargo] = useState(profile?.cargo || '');
  const [cro, setCro] = useState(profile?.cro || '');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (profile) {
      setNome(profile.nome || '');
      setTelefone(profile.telefone || '');
      setCargo(profile.cargo || '');
      setCro(profile.cro || '');
    }
  }, [profile]);

  const initials = profile?.nome
    ? profile.nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  async function handleSave(e) {
    e.preventDefault();
    if (!nome.trim()) return toast.error('O nome não pode estar vazio');
    setLoading(true);
    try {
      await updateProfile({
        nome: nome.trim(),
        telefone: telefone.trim() || null,
        cargo: cargo.trim() || null,
        cro: cro.trim() || null,
      });
      toast.success('Perfil atualizado com sucesso!');
    } catch {
      toast.error('Erro ao atualizar perfil');
    } finally {
      setLoading(false);
    }
  }

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast.error('Selecione uma imagem válida');
    if (file.size > 2 * 1024 * 1024) return toast.error('A imagem deve ter no máximo 2MB');

    setUploading(true);
    const toastId = toast.loading('Enviando imagem...');
    try {
      const publicUrl = await uploadAvatar(file);
      await updateProfile({ avatar_url: publicUrl });
      toast.success('Foto atualizada!', { id: toastId });
    } catch {
      toast.error('Erro ao enviar imagem', { id: toastId });
    } finally {
      setUploading(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Avatar */}
      <div className="flex flex-col items-center mb-8">
        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
          <div
            className="rounded-full overflow-hidden border-4 shadow-lg flex items-center justify-center relative"
            style={{ width: 110, height: 110, borderColor: 'var(--brand-100)', background: 'var(--brand-50)' }}
          >
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.nome} className="w-full h-full object-cover" />
            ) : (
              <span style={{ fontSize: 32, fontWeight: 700, color: 'var(--brand-600)' }}>{initials}</span>
            )}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'rgba(0,0,0,0.4)' }}>
              <Camera className="text-white" size={24} />
            </div>
          </div>
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="rounded-full border-4 animate-spin" style={{ width: 110, height: 110, borderColor: 'var(--brand-500)', borderTopColor: 'transparent' }} />
            </div>
          )}
          <input type="file" ref={fileInputRef} onChange={handleAvatarChange} className="hidden" accept="image/*" />
        </div>
        <p className="body-s text-muted" style={{ marginTop: 8 }}>Clique para alterar</p>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label"><User size={14} style={{ display: 'inline', marginRight: 4 }} /> Nome Completo</label>
          <input type="text" className="form-input" value={nome} onChange={e => setNome(e.target.value)} required />
        </div>
        <div className="form-group">
          <label className="form-label"><Phone size={14} style={{ display: 'inline', marginRight: 4 }} /> Telefone</label>
          <input type="tel" className="form-input" value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="(00) 00000-0000" />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label"><Award size={14} style={{ display: 'inline', marginRight: 4 }} /> Cargo / Função</label>
          <select className="form-select" value={cargo} onChange={e => setCargo(e.target.value)}>
            <option value="">Selecione</option>
            <option value="Dentista">Dentista</option>
            <option value="Auxiliar">Auxiliar de Saúde Bucal</option>
            <option value="Recepcionista">Recepcionista</option>
            <option value="Gestor">Gestor/Administrador</option>
            <option value="Estagiário">Estagiário</option>
            <option value="Outro">Outro</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label"><Shield size={14} style={{ display: 'inline', marginRight: 4 }} /> CRO (Registro Profissional)</label>
          <input type="text" className="form-input" value={cro} onChange={e => setCro(e.target.value)} placeholder="Ex: CRO-SP 12345" />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label"><Mail size={14} style={{ display: 'inline', marginRight: 4 }} /> E-mail de Acesso</label>
        <div className="flex items-center gap-2 p-3 rounded-md" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
          <Mail size={16} style={{ color: 'var(--neutral-400)' }} />
          <span className="body-m" style={{ color: 'var(--neutral-600)' }}>{profile?.email || 'N/A'}</span>
        </div>
        <p className="form-hint">O e-mail não pode ser alterado.</p>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Nível de Permissão</label>
          <div className="flex items-center gap-2 p-3 rounded-md" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <Shield size={16} style={{ color: 'var(--neutral-400)' }} />
            <span className={`badge ${profile?.role === 'SUPER_ADMIN' ? 'badge-warning' : profile?.role === 'ADMIN' ? 'badge-brand' : 'badge-neutral'}`}>
              {profile?.role === 'SUPER_ADMIN' ? 'Super Admin' : profile?.role === 'ADMIN' ? 'Administrador' : 'Usuário'}
            </span>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Status da Conta</label>
          <div className="flex items-center gap-2 p-3 rounded-md" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <CheckCircle size={16} style={{ color: 'var(--neutral-400)' }} />
            <span className={`badge ${profile?.ativo ? 'badge-success' : 'badge-danger'}`}>
              {profile?.ativo ? 'Ativa' : 'Inativa'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
        <button type="submit" className="btn btn-primary" disabled={loading || uploading} style={{ minWidth: 160 }}>
          {loading ? <><Loader2 size={16} className="spin" /> Salvando...</> : <><Save size={16} /> Salvar Alterações</>}
        </button>
      </div>
    </form>
  );
}

// ---- Tab: Segurança ----
function TabSeguranca({ profile }) {
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  async function handleChangePassword(e) {
    e.preventDefault();
    if (novaSenha.length < 8) return toast.error('A nova senha deve ter no mínimo 8 caracteres');
    if (novaSenha !== confirmarSenha) return toast.error('As senhas não coincidem');

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: novaSenha });
      if (error) throw error;
      toast.success('Senha alterada com sucesso!');
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmarSenha('');
    } catch (err) {
      toast.error(err.message || 'Erro ao alterar senha');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="card" style={{ border: '1px solid var(--border-color)' }}>
        <div className="card-body">
          <h3 className="heading-s flex items-center gap-2 mb-4">
            <Key size={16} /> Alterar Senha
          </h3>
          <form onSubmit={handleChangePassword} className="space-y-4" style={{ maxWidth: 400 }}>
            <div className="form-group">
              <label className="form-label">Nova Senha</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--neutral-400)' }} />
                <input
                  type={showNew ? 'text' : 'password'}
                  className="form-input"
                  style={{ paddingLeft: 36, paddingRight: 36 }}
                  value={novaSenha}
                  onChange={e => setNovaSenha(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  minLength={8}
                  required
                />
                <button type="button" onClick={() => setShowNew(!showNew)}
                  style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neutral-400)', padding: 4 }}>
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Confirmar Nova Senha</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--neutral-400)' }} />
                <input
                  type="password"
                  className="form-input"
                  style={{ paddingLeft: 36 }}
                  value={confirmarSenha}
                  onChange={e => setConfirmarSenha(e.target.value)}
                  placeholder="Repita a nova senha"
                  required
                />
              </div>
              {confirmarSenha && novaSenha !== confirmarSenha && (
                <p className="form-hint" style={{ color: 'var(--destructive-500)' }}>As senhas não coincidem</p>
              )}
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ minWidth: 160 }}>
              {loading ? <><Loader2 size={16} className="spin" /> Alterando...</> : <><Key size={16} /> Alterar Senha</>}
            </button>
          </form>
        </div>
      </div>

      <div className="card" style={{ border: '1px solid var(--border-color)' }}>
        <div className="card-body">
          <h3 className="heading-s flex items-center gap-2 mb-4">
            <Clock size={16} /> Informações da Sessão
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 rounded-md" style={{ background: 'var(--bg-secondary)' }}>
              <span className="body-s">Membro desde</span>
              <span className="mono-s">{profile?.criado_em ? formatarDataHora(profile.criado_em) : 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-md" style={{ background: 'var(--bg-secondary)' }}>
              <span className="body-s">ID da conta</span>
              <span className="mono-s" style={{ fontSize: 11 }}>{profile?.id?.substring(0, 8) || 'N/A'}...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- Tab: Preferências ----
function TabPreferencias() {
  const [prefs, setPrefs] = useState(() => {
    const saved = localStorage.getItem('user-preferences');
    return saved ? JSON.parse(saved) : {
      notificacoes_email: false,
      itens_por_pagina: 20,
      som_notificacao: true,
    };
  });

  function handleSave() {
    localStorage.setItem('user-preferences', JSON.stringify(prefs));
    toast.success('Preferências salvas!');
  }

  return (
    <div className="space-y-6">
      <div className="card" style={{ border: '1px solid var(--border-color)' }}>
        <div className="card-body">
          <h3 className="heading-s flex items-center gap-2 mb-4">
            <Bell size={16} /> Notificações
          </h3>
          <div className="space-y-4">
            <label className="flex items-center justify-between p-3 rounded-md cursor-pointer" style={{ background: 'var(--bg-secondary)' }}>
              <div>
                <div style={{ fontWeight: 500, fontSize: 13 }}>Sons de notificação</div>
                <div className="body-s text-muted">Reproduzir som ao receber alertas</div>
              </div>
              <input
                type="checkbox"
                checked={prefs.som_notificacao}
                onChange={e => setPrefs(p => ({ ...p, som_notificacao: e.target.checked }))}
                className="form-checkbox"
              />
            </label>
          </div>
        </div>
      </div>

      <div className="card" style={{ border: '1px solid var(--border-color)' }}>
        <div className="card-body">
          <h3 className="heading-s flex items-center gap-2 mb-4">
            <Settings size={16} /> Exibição
          </h3>
          <div className="form-group" style={{ maxWidth: 200 }}>
            <label className="form-label">Itens por página</label>
            <select className="form-select" value={prefs.itens_por_pagina}
              onChange={e => setPrefs(p => ({ ...p, itens_por_pagina: Number(e.target.value) }))}>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button className="btn btn-primary" onClick={handleSave} style={{ minWidth: 160 }}>
          <Save size={16} /> Salvar Preferências
        </button>
      </div>
    </div>
  );
}

// ---- Tab: Atividade ----
function TabAtividade({ profile }) {
  const [atividades, setAtividades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregarAtividade() {
      if (!profile?.id) return;
      try {
        const { data } = await supabase.from('logs')
          .select('id, acao, entidade, criado_em, detalhes')
          .eq('usuario_id', profile.id)
          .order('criado_em', { ascending: false })
          .limit(20);
        setAtividades(data || []);
      } catch { /* ignore */ }
      setLoading(false);
    }
    carregarAtividade();
  }, [profile?.id]);

  function getActionIcon(acao) {
    if (acao === 'LOGIN' || acao === 'LOGOUT') return <Key size={14} />;
    if (acao === 'CREATE') return <CheckCircle size={14} />;
    if (acao === 'ENTRADA_ESTOQUE') return <Activity size={14} />;
    if (acao === 'SAIDA_ESTOQUE') return <Activity size={14} />;
    return <Activity size={14} />;
  }

  function getActionLabel(acao) {
    const labels = {
      LOGIN: 'Login no sistema',
      LOGOUT: 'Logout do sistema',
      CREATE: 'Criou registro',
      UPDATE: 'Atualizou registro',
      DELETE: 'Removeu registro',
      ENTRADA_ESTOQUE: 'Entrada de estoque',
      SAIDA_ESTOQUE: 'Saída de estoque',
      ROLE_CHANGED: 'Permissão alterada',
    };
    return labels[acao] || acao;
  }

  return (
    <div>
      <h3 className="heading-s flex items-center gap-2 mb-4">
        <Activity size={16} /> Atividade Recente
      </h3>
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="skeleton skeleton-row" />
          ))}
        </div>
      ) : atividades.length === 0 ? (
        <div className="empty-state">
          <p className="body-s text-muted">Nenhuma atividade registrada</p>
        </div>
      ) : (
        <div className="space-y-2">
          {atividades.map(a => (
            <div key={a.id} className="flex items-center gap-3 p-3 rounded-md" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-md)', background: 'var(--brand-50)', color: 'var(--brand-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {getActionIcon(a.acao)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, fontSize: 13 }}>{getActionLabel(a.acao)}</div>
                <div className="body-s text-muted">
                  {a.entidade && <span>{a.entidade} · </span>}
                  {tempoRelativo(a.criado_em)}
                </div>
              </div>
              <span className="mono-s">{formatarDataHora(a.criado_em)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---- Main Profile Page ----
export default function ProfilePage() {
  const { profile, updateProfile, uploadAvatar, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  if (authLoading && !profile) {
    return (
      <MainLayout>
        <div className="page-body flex items-center justify-center" style={{ minHeight: '60vh' }}>
          <p>Carregando perfil...</p>
        </div>
      </MainLayout>
    );
  }

  const tabs = [
    {
      id: 'dados',
      label: 'Dados Pessoais',
      icon: <User size={15} />,
      content: <TabDadosPessoais profile={profile} updateProfile={updateProfile} uploadAvatar={uploadAvatar} />,
    },
    {
      id: 'seguranca',
      label: 'Segurança',
      icon: <Lock size={15} />,
      content: <TabSeguranca profile={profile} />,
    },
    {
      id: 'preferencias',
      label: 'Preferências',
      icon: <Settings size={15} />,
      content: <TabPreferencias />,
    },
    {
      id: 'atividade',
      label: 'Atividade',
      icon: <Activity size={15} />,
      content: <TabAtividade profile={profile} />,
    },
  ];

  return (
    <MainLayout>
      <div className="page-header">
        <div className="page-header-left">
          <div className="breadcrumb">
            <span onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>Dashboard</span>
            <span className="text-muted">/</span>
            <span>Meu Perfil</span>
          </div>
          <h1 className="display-l flex items-center gap-3" style={{ fontSize: 24 }}>
            <User size={24} style={{ color: 'var(--neutral-500)' }} />
            Meu Perfil
          </h1>
        </div>
        <div className="page-header-right">
          <button onClick={() => navigate(-1)} className="btn btn-secondary btn-sm">
            <ArrowLeft size={16} /> Voltar
          </button>
        </div>
      </div>

      <div className="page-body">
        <div style={{ maxWidth: 780, margin: '0 auto' }}>
          <Tabs tabs={tabs} defaultTab="dados" />
        </div>
      </div>
    </MainLayout>
  );
}
