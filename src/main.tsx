import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { initNativeShell } from './lib/native'
import { initTheme } from './lib/theme'
import { isSupabaseConfigured } from './lib/supabaseClient'
import {
  cleanAuthParamsFromUrl,
  hasAuthCallbackInUrl,
  initSupabaseAuth,
} from './lib/supabaseAuth'
import './index.css'

initTheme()

initNativeShell()

async function bootstrap() {
  const authCallback = hasAuthCallbackInUrl()

  if (isSupabaseConfigured()) {
    try {
      await initSupabaseAuth()
    } catch {
      // App still works offline without sync
    }
    if (authCallback) {
      cleanAuthParamsFromUrl()
    }
  }

  if (
    import.meta.env.PROD &&
    import.meta.env.BASE_URL !== '/' &&
    !window.location.hash &&
    !authCallback
  ) {
    window.location.replace(`${import.meta.env.BASE_URL}#/`)
    return
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  )
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

void bootstrap()
