import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X } from 'lucide-react';

export default function BarcodeScanner({ onScan, onClose }) {
  const [error, setError] = useState(null);
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    let html5QrCode = null;

    async function startScanner() {
      try {
        html5QrCode = new Html5Qrcode('barcode-reader');
        scannerRef.current = html5QrCode;
        setScanning(true);

        await html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 280, height: 150 },
            aspectRatio: 1.777,
          },
          (decodedText) => {
            onScan(decodedText);
            stopScanner();
          },
          () => {} // ignore scan failures
        );
      } catch (err) {
        console.error('Scanner error:', err);
        setError('Nao foi possivel acessar a camera. Verifique as permissoes.');
        setScanning(false);
      }
    }

    async function stopScanner() {
      if (html5QrCode && html5QrCode.isScanning) {
        try { await html5QrCode.stop(); } catch { /* ignore */ }
      }
    }

    startScanner();
    return () => { stopScanner(); };
  }, [onScan]);

  function handleClose() {
    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current.stop().catch(() => {});
    }
    onClose();
  }

  return (
    <div className="modal-overlay" style={{ zIndex: 200 }}>
      <div className="modal-content" style={{ maxWidth: 480, padding: 0, overflow: 'hidden' }}>
        <div className="modal-header" style={{ padding: 'var(--space-3) var(--space-4)' }}>
          <div className="flex items-center gap-2">
            <Camera size={18} style={{ color: 'var(--brand-500)' }} />
            <h3 className="heading-s" style={{ margin: 0 }}>Escanear Codigo de Barras</h3>
          </div>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={handleClose}><X size={16} /></button>
        </div>

        <div ref={containerRef} style={{ position: 'relative', background: '#000', minHeight: 300 }}>
          <div id="barcode-reader" style={{ width: '100%' }} />
          {scanning && (
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none', textAlign: 'center' }}>
              <div className="scanner-line" />
            </div>
          )}
        </div>

        {error && (
          <div style={{ padding: 'var(--space-4)', background: 'var(--destructive-50)', color: 'var(--destructive-600)', textAlign: 'center' }}>
            <p className="body-s" style={{ fontWeight: 500 }}>{error}</p>
          </div>
        )}

        <div style={{ padding: 'var(--space-3) var(--space-4)', background: 'var(--neutral-50)', textAlign: 'center', borderTop: '1px solid var(--neutral-200)' }}>
          <p className="body-s text-muted">Posicione o codigo de barras na area de leitura</p>
        </div>
      </div>
    </div>
  );
}
