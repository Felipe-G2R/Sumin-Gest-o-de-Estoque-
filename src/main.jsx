import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Limpar service workers e caches antigos que causam problemas
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(r => r.unregister());
  });
}
if ('caches' in window) {
  caches.keys().then(names => {
    names.forEach(name => caches.delete(name));
  });
}

createRoot(document.getElementById('root')).render(<App />)
