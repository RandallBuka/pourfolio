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
  const registerSw = () => {
    const swUrl = `${import.meta.env.BASE_URL}sw.js`
    void navigator.serviceWorker.register(swUrl).catch(() => undefined)
  }

  // Register after first paint — never compete with initial JS download/execute.
  window.setTimeout(registerSw, 3_000)
}

bootstrap().catch(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  )
})
