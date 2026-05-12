// ============================================
// NOVO BOTÃO — Link de cadastro que desabilita em modo Geral
// ============================================
import { Link } from 'react-router-dom';
import { useLojaAtiva } from '../../contexts/LojaAtivaContext';

/**
 * Renderiza um Link de cadastro. Em modo "Administração Geral",
 * troca para um botão desabilitado com tooltip explicativo.
 *
 * Props:
 *   to       — rota destino quando habilitado
 *   children — conteúdo (ícone + texto)
 *   ...rest  — repassado ao Link/botão (className, style, title)
 */
export default function NovoBotao({ to, children, className = '', style, title, ...rest }) {
  const { modoGeral } = useLojaAtiva();

  if (modoGeral) {
    return (
      <button
        type="button"
        className={className}
        style={{ ...style, opacity: 0.55, cursor: 'not-allowed' }}
        title="Selecione uma loja no topo para cadastrar"
        disabled
        {...rest}
      >
        {children}
      </button>
    );
  }

  return (
    <Link to={to} className={className} style={style} title={title} {...rest}>
      {children}
    </Link>
  );
}
