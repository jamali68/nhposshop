import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ErrorBoundary } from './components/ErrorBoundary';

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

// Register PWA Service Worker (only in production / deployed domains, clean on dev)
if ('serviceWorker' in navigator) {
  const isDevHost =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.includes('run.app');

  if (isDevHost) {
    // Prevent stale caching on dev preview host
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister().catch(() => {});
      }
    });
  } else {
    const registerSW = () => {
      navigator.serviceWorker.register('./sw.js', { scope: './' })
        .then((reg) => {
          reg.update().catch(() => {});
        })
        .catch((err) => {
          console.warn('PWA ServiceWorker registration notice:', err);
        });
    };

    if (document.readyState === 'complete') {
      registerSW();
    } else {
      window.addEventListener('load', registerSW);
    }
  }
}

