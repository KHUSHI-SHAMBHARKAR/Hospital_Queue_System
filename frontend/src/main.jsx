import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider, useTheme } from './context/ThemeContext'
import App from './App'
import './index.css'

// Toaster reads the current theme from DOM
function ThemedToaster() {
  const { isDark } = useTheme()
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: isDark ? '#1e293b' : '#ffffff',
          color: isDark ? '#f1f5f9' : '#0f172a',
          border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
          borderRadius: '12px',
          fontSize: '14px',
          fontFamily: 'DM Sans, system-ui, sans-serif',
          boxShadow: isDark
            ? '0 4px 24px rgba(0,0,0,0.4)'
            : '0 4px 24px rgba(0,0,0,0.08)',
        },
        success: { iconTheme: { primary: '#14b8a6', secondary: isDark ? '#042f2e' : '#f0fdfa' } },
        error:   { iconTheme: { primary: '#f87171', secondary: isDark ? '#450a0a' : '#fef2f2' } },
        duration: 4000,
      }}
    />
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <App />
        <ThemedToaster />
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
)