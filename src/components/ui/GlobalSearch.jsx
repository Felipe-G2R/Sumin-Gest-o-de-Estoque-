import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Package, Truck, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function GlobalSearch({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ produtos: [], fornecedores: [], movimentacoes: [] });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
      window.addEventListener('keydown', handleEsc);
      return () => window.removeEventListener('keydown', handleEsc);
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query || query.length < 2) { setResults({ produtos: [], fornecedores: [], movimentacoes: [] }); return; }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const [prodRes, fornRes] = await Promise.all([
          supabase.from('produtos').select('id, nome, categoria, quantidade_atual').eq('ativo', true).ilike('nome', `%${query}%`).limit(5),
          supabase.from('fornecedores').select('id, nome, cnpj').eq('ativo', true).ilike('nome', `%${query}%`).limit(5),
        ]);
        setResults({
          produtos: prodRes.data || [],
          fornecedores: fornRes.data || [],
          movimentacoes: [],
        });
      } catch { /* ignore */ }
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  function handleSelect(path) {
    navigate(path);
    onClose();
    setQuery('');
  }

  if (!isOpen) return null;

  const hasResults = results.produtos.length > 0 || results.fornecedores.length > 0;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ alignItems: 'flex-start', paddingTop: '15vh' }}>
      <div className="global-search-container" onClick={e => e.stopPropagation()}>
        <div className="global-search-input-wrapper">
          <Search size={18} style={{ color: 'var(--neutral-400)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            className="global-search-input"
            placeholder="Buscar produtos, fornecedores..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setQuery('')}>
              <X size={14} />
            </button>
          )}
        </div>

        {query.length >= 2 && (
          <div className="global-search-results">
            {loading && <div style={{ padding: 'var(--space-4)', textAlign: 'center' }}><span className="body-s">Buscando...</span></div>}

            {!loading && !hasResults && (
              <div style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
                <p className="body-s text-muted">Nenhum resultado para "{query}"</p>
              </div>
            )}

            {results.produtos.length > 0 && (
              <div className="search-result-section">
                <div className="search-result-header"><Package size={14} /> Produtos</div>
                {results.produtos.map(p => (
                  <button key={p.id} className="search-result-item" onClick={() => handleSelect(`/produtos/${p.id}`)}>
                    <div>
                      <div style={{ fontWeight: 500 }}>{p.nome}</div>
                      <span className="body-s">{p.categoria || 'Sem categoria'} · Estoque: {p.quantidade_atual}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {results.fornecedores.length > 0 && (
              <div className="search-result-section">
                <div className="search-result-header"><Truck size={14} /> Fornecedores</div>
                {results.fornecedores.map(f => (
                  <button key={f.id} className="search-result-item" onClick={() => handleSelect(`/fornecedores/${f.id}`)}>
                    <div>
                      <div style={{ fontWeight: 500 }}>{f.nome}</div>
                      {f.cnpj && <span className="body-s mono-s">{f.cnpj}</span>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="global-search-footer">
          <span className="body-s text-muted">Dica: use <kbd>Ctrl+K</kbd> para abrir a busca rapida</span>
        </div>
      </div>
    </div>
  );
}
