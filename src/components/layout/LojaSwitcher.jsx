// ============================================
// LOJA SWITCHER — Dropdown no topbar (só SUPER_ADMIN)
// ============================================
import { useEffect, useRef, useState } from 'react';
import { Building2, ChevronDown, Check, Globe2 } from 'lucide-react';
import { useLojaAtiva } from '../../contexts/LojaAtivaContext';

export default function LojaSwitcher() {
  const { lojas, lojaAtiva, lojaAtivaId, setLojaAtivaId, podeAlternar, modoGeral, loadingLojas } = useLojaAtiva();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  if (!podeAlternar) return null;

  const label = modoGeral
    ? 'Administração Geral'
    : (lojaAtiva?.nome?.trim() || 'Selecione uma loja');

  function escolher(id) {
    setLojaAtivaId(id);
    setOpen(false);
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="loja-switcher-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        title="Trocar loja ativa"
      >
        {modoGeral ? <Globe2 size={14} /> : <Building2 size={14} />}
        <span className="loja-switcher-label">{label}</span>
        <ChevronDown size={14} style={{ opacity: 0.6 }} />
      </button>

      {open && (
        <div className="loja-switcher-menu" role="menu">
          <button
            type="button"
            className={`loja-switcher-item ${modoGeral ? 'active' : ''}`}
            onClick={() => escolher(null)}
          >
            <Globe2 size={14} />
            <div className="loja-switcher-item-info">
              <div className="loja-switcher-item-title">Administração Geral</div>
              <div className="loja-switcher-item-sub">Ver dados de todas as lojas</div>
            </div>
            {modoGeral && <Check size={14} />}
          </button>

          <div className="loja-switcher-divider" />

          {loadingLojas && (
            <div className="loja-switcher-empty">Carregando lojas…</div>
          )}

          {!loadingLojas && lojas.length === 0 && (
            <div className="loja-switcher-empty">Nenhuma loja cadastrada</div>
          )}

          {lojas.map(l => (
            <button
              key={l.id}
              type="button"
              className={`loja-switcher-item ${l.id === lojaAtivaId ? 'active' : ''} ${!l.ativo ? 'inactive' : ''}`}
              onClick={() => escolher(l.id)}
              disabled={!l.ativo}
              title={!l.ativo ? 'Loja inativa' : ''}
            >
              <Building2 size={14} />
              <div className="loja-switcher-item-info">
                <div className="loja-switcher-item-title">{l.nome?.trim()}</div>
                {l.cnpj && <div className="loja-switcher-item-sub">{l.cnpj}</div>}
              </div>
              {l.id === lojaAtivaId && <Check size={14} />}
            </button>
          ))}
        </div>
      )}

      <style>{`
        .loja-switcher-trigger {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 6px 10px;
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: var(--radius-md, 8px);
          background: var(--bg-elevated, #fff);
          color: var(--neutral-700, #374151);
          font-size: 13px; font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
          max-width: 240px;
        }
        .loja-switcher-trigger:hover {
          background: var(--neutral-50, #f9fafb);
          border-color: var(--neutral-300, #d1d5db);
        }
        .loja-switcher-label {
          max-width: 160px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .loja-switcher-menu {
          position: absolute; top: calc(100% + 6px); right: 0;
          min-width: 260px;
          background: var(--bg-elevated, #fff);
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: var(--radius-md, 8px);
          box-shadow: var(--shadow-lg, 0 10px 30px rgba(0,0,0,0.12));
          padding: 4px;
          z-index: 200;
          max-height: 360px;
          overflow-y: auto;
        }
        .loja-switcher-item {
          width: 100%;
          display: flex; align-items: center; gap: 10px;
          padding: 8px 10px;
          background: transparent;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          text-align: left;
          color: var(--neutral-700, #374151);
        }
        .loja-switcher-item:hover:not(:disabled) {
          background: var(--neutral-50, #f9fafb);
        }
        .loja-switcher-item.active {
          background: var(--brand-50, #f0fdfa);
          color: var(--brand-700, #0f766e);
        }
        .loja-switcher-item.inactive {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .loja-switcher-item-info {
          flex: 1; min-width: 0;
        }
        .loja-switcher-item-title {
          font-size: 13px; font-weight: 500;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .loja-switcher-item-sub {
          font-size: 11px;
          color: var(--neutral-500, #6b7280);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .loja-switcher-divider {
          height: 1px; background: var(--border-color, #e5e7eb);
          margin: 4px 0;
        }
        .loja-switcher-empty {
          padding: 10px;
          font-size: 12px;
          color: var(--neutral-500, #6b7280);
          text-align: center;
        }
      `}</style>
    </div>
  );
}
