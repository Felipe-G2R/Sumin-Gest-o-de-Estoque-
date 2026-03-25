// ============================================
// REGISTER — Auth UI
// ============================================
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Logo from '../components/Logo';
import { User, Mail, Lock, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ nome: '', email: '', senha: '', confirmar: '' });
  const [loading, setLoading] = useState(false);

  function handleChange(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.senha.length < 8) return toast.error('A senha deve ter pelo menos 8 caracteres');
    if (form.senha !== form.confirmar) return toast.error('As senhas não coincidem');
    setLoading(true);
    try {
      await register({ nome: form.nome, email: form.email, senha: form.senha });
      toast.success('Conta criada! Faça login para continuar.');
      navigate('/login');
    } catch (err) {
      toast.error(err.message || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  }

  const fields = [
    { key: 'nome', label: 'Nome completo', type: 'text', icon: User, placeholder: 'Seu nome', min: undefined },
    { key: 'email', label: 'Email', type: 'email', icon: Mail, placeholder: 'seu@email.com', min: undefined },
    { key: 'senha', label: 'Senha', type: 'password', icon: Lock, placeholder: 'Mínimo 8 caracteres', min: 8 },
    { key: 'confirmar', label: 'Confirmar senha', type: 'password', icon: Lock, placeholder: 'Repita a senha', min: 8 },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, var(--neutral-900) 0%, var(--neutral-800) 100%)',
      padding: 'var(--space-4)',
    }}>
      <div style={{
        background: 'var(--bg-elevated)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-lg)',
        width: '100%', maxWidth: 420, padding: 0, overflow: 'hidden',
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
          <p className="body-s" style={{ marginTop: 8 }}>Preencha os dados para começar</p>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '0 var(--space-8) var(--space-8)' }}>
          {fields.map(f => (
            <div className="form-group" key={f.key}>
              <label className="form-label">{f.label}</label>
              <div style={{ position: 'relative' }}>
                <f.icon size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--neutral-400)' }} />
                <input
                  type={f.type}
                  className="form-input"
                  style={{ paddingLeft: 36 }}
                  placeholder={f.placeholder}
                  value={form[f.key]}
                  onChange={e => handleChange(f.key, e.target.value)}
                  required
                  minLength={f.min}
                />
              </div>
            </div>
          ))}
          <button type="submit" className="btn btn-primary w-full" disabled={loading} style={{ height: 44 }}>
            {loading ? <><Loader2 size={16} className="spin" /> Criando...</> : 'Criar conta'}
          </button>
        </form>

        <div style={{ padding: 'var(--space-4) var(--space-8)', textAlign: 'center', borderTop: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
          <span className="body-s">Já tem conta? </span>
          <Link to="/login" style={{ fontSize: 13, fontWeight: 600 }}>Fazer login</Link>
        </div>
      </div>
    </div>
  );
}
