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
import { loadCatalog } from './data/catalogStore'
import './index.css'

initTheme()
initNativeShell()

function bootstrap() {
  const authCallback = hasAuthCallbackInUrl()

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

  void loadCatalog()

  if (authCallback && isSupabaseConfigured()) {
    void initSupabaseAuth()
      .catch(() => undefined)
      .finally(() => cleanAuthParamsFromUrl())
  }
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
            if (worker.state !== 'installed' || !navigator.serviceWorker.controller) return
            worker.postMessage({ type: 'SKIP_WAITING' })
            // Reload only after the app has painted — avoids trapping users on the boot splash.
            const reloadWhenReady = () => {
              if (document.querySelector('.app-shell')) {
                window.location.reload()
                return
              }
              window.requestAnimationFrame(reloadWhenReady)
            }
            reloadWhenReady()
          })
        })
      })
      .catch(() => undefined)
  })
}

bootstrap().catch(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  )
})
