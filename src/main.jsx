import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Register Progressive Web App Service Worker for offline capabilities & installability
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('[PWA] AgriRent Service Worker registered with scope:', reg.scope);
      })
      .catch((err) => {
        console.warn('[PWA] Service Worker registration notice:', err);
      });
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
