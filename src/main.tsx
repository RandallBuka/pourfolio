import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { initNativeShell } from './lib/native'
import { initTheme } from './lib/theme'
import './index.css'

initTheme()

initNativeShell()

if (import.meta.env.PROD && import.meta.env.BASE_URL !== '/' && !window.location.hash) {
  window.location.replace(`${import.meta.env.BASE_URL}#/`)
}

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    const swUrl = `${import.meta.env.BASE_URL}sw.js`
    void navigator.serviceWorker
      .register(swUrl)
      .then((registration) => {
        registration.addEventListener('updatefound', () => {
          const worker = registration.installing
          if (!worker) return
          worker.addEventListener('statechange', () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) {
              worker.postMessage({ type: 'SKIP_WAITING' })
              window.location.reload()
            }
          })
        })
      })
      .catch(() => undefined)
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
