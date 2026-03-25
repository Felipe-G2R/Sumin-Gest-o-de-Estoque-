// ============================================
// PWA Install Prompt — Banner de instalação
// ============================================
import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Não mostra se já instalou ou já dispensou recentemente
    const dismissed = localStorage.getItem('pwa-dismissed');
    if (dismissed && Date.now() - Number(dismissed) < 7 * 24 * 60 * 60 * 1000) return;

    // Detecta se já está como PWA
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    function handleBeforeInstall(e) {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  }

  function handleDismiss() {
    setShowBanner(false);
    localStorage.setItem('pwa-dismissed', String(Date.now()));
  }

  if (!showBanner) return null;

  return (
    <div className="pwa-install-banner">
      <div className="pwa-install-content">
        <Download size={20} />
        <div>
          <strong>Instalar LogControl</strong>
          <span>Acesse direto da tela inicial do seu celular</span>
        </div>
      </div>
      <div className="pwa-install-actions">
        <button className="btn btn-primary btn-sm" onClick={handleInstall}>
          Instalar
        </button>
        <button className="btn btn-ghost btn-icon btn-sm" onClick={handleDismiss}>
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
