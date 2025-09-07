// src/main.jsx - Updated Main Entry Point with Error Boundary
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import './index.css';
import './styles/animations.css';

// Enhanced console logging for development
if (import.meta.env.DEV) {
  console.log('🚀 BRO League 4.0 - Starting application...');
  console.log('🔧 Environment:', import.meta.env.MODE);
  console.log('📍 Base URL:', import.meta.env.BASE_URL);
  console.log('🏆 League ID:', import.meta.env.VITE_FPL_LEAGUE_ID);
}

// Performance monitoring
const startTime = performance.now();

// Global error handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  // Prevent the default behavior of logging to console
  event.preventDefault();
});

// Global error handler for JavaScript errors
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
});

// Performance observer for development
if (import.meta.env.DEV && 'PerformanceObserver' in window) {
  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          console.log('📊 Navigation timing:', {
            'DOM Content Loaded': `${entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart}ms`,
            'Load Complete': `${entry.loadEventEnd - entry.loadEventStart}ms`,
            'Total Time': `${entry.loadEventEnd - entry.fetchStart}ms`
          });
        }
      }
    });
    observer.observe({ entryTypes: ['navigation'] });
  } catch (error) {
    // PerformanceObserver not supported or failed
  }
}

// App initialization
const initializeApp = () => {
  const endTime = performance.now();
  if (import.meta.env.DEV) {
    console.log(`⚡ App initialization took ${Math.round(endTime - startTime)}ms`);
  }

  const root = ReactDOM.createRoot(document.getElementById('root'));
  
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
};

// Check if DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// Service Worker registration for future PWA features
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}