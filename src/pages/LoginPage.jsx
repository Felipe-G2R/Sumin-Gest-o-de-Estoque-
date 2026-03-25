// ============================================
// LOGIN — "The Sterile Tech" Auth UI
// ============================================
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Logo from '../components/Logo';
import { Mail, Lock, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !senha) return toast.error('Preencha todos os campos');
    setLoading(true);
    try {
      await login({ email, senha });
      toast.success('Bem-vindo de volta!');
      // PublicRoute redireciona automaticamente quando isAuthenticated fica true
    } catch (err) {
      toast.error(err.message || 'Credenciais inválidas');
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, var(--neutral-900) 0%, var(--neutral-800) 100%)',
      padding: 'var(--space-4)',
    }}>
      <div style={{
        background: 'var(--bg-elevated)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-lg)',
        width: '100%',
        maxWidth: 420,
        padding: 0,
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: 'var(--space-8) var(--space-8) var(--space-6)',
          textAlign: 'center',
        }}>
          <div style={{ marginBottom: 'var(--space-5)' }}>
            <Logo size={48} showText={false} />
          </div>
          <Logo size={32} />
          <p className="body-s" style={{ marginTop: 8 }}>Sistema de Gestão de Estoque Odontológico</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '0 var(--space-8) var(--space-8)' }}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--neutral-400)' }} />
              <input
                type="email"
                className="form-input"
                style={{ paddingLeft: 36 }}
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Senha</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--neutral-400)' }} />
              <input
                type="password"
                className="form-input"
                style={{ paddingLeft: 36 }}
                placeholder="Mínimo 8 caracteres"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                minLength={8}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={loading}
            style={{ marginTop: 'var(--space-2)', height: 44 }}
          >
            {loading ? <><Loader2 size={16} className="spin" /> Entrando...</> : 'Entrar'}
          </button>
        </form>

        {/* Footer */}
        <div style={{
          padding: 'var(--space-4) var(--space-8)',
          textAlign: 'center',
          borderTop: '1px solid var(--border-color)',
          background: 'var(--bg-secondary)',
        }}>
          <span className="body-s" style={{ color: 'var(--neutral-400)' }}>Acesso restrito. Solicite ao administrador.</span>
        </div>
      </div>
    </div>
  );
}
