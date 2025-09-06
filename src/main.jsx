// src/main.jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import './App.css'

console.log('🚀 BRO League 4.0 - Starting application...')
console.log('🔗 Current URL:', window.location.href)
console.log('🌐 Base URL:', import.meta.env.BASE_URL)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)