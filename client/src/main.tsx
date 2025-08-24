import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { ThemeProvider } from './hooks/use-theme'
import ErrorBoundary from './dev/ErrorBoundary'
import './index.css'

const el = document.getElementById('root')
if (!el) {
  const div = document.createElement('pre')
  div.textContent = 'FATAL: #root element not found'
  div.style.cssText = 'color:#fff;background:#c00;padding:12px'
  document.body.appendChild(div)
  throw new Error('Root element #root not found')
}

// ensure all fetch requests include credentials
const originalFetch = window.fetch
window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
  const finalInit: RequestInit = { ...init, credentials: 'include' }
  return originalFetch(input, finalInit)
}

ReactDOM.createRoot(el).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>
)
