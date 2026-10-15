/* Main entry point for the application - renders the root React component */
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './main.css'

// Limpeza defensiva de Service Workers obsoletos e CacheStorage antigos deixados por templates/deployments anteriores
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker
    .getRegistrations()
    .then((registrations) => {
      for (const registration of registrations) {
        registration.unregister().catch(() => {
          // Silently ignore unregister errors
        })
      }
    })
    .catch(() => {
      // Silently ignore service worker inspection errors
    })

  if ('caches' in window) {
    caches
      .keys()
      .then((cacheNames) => {
        for (const name of cacheNames) {
          caches.delete(name).catch(() => {
            // Silently ignore cache delete errors
          })
        }
      })
      .catch(() => {
        // Silently ignore cache listing errors
      })
  }
}

// @skip-protected: Do not remove. Required for React rendering.
createRoot(document.getElementById('root')!).render(<App />)
