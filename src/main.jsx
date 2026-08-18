import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import './index.css';

if (import.meta.env.DEV) {
  console.log('🚀 BRO League 4.0 - Starting application...');
}

// Service worker registration is handled by src/components/PWAUpdate.jsx via
// vite-plugin-pwa's `virtual:pwa-register`, not here — see vite.config.js's
// `injectRegister: null`.

const root = document.getElementById('root');

if (root) {
  createRoot(root).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>
  );
} else {
  console.error('Root element not found');
}