import { useEffect, useState } from 'react'
import { Capacitor } from '@capacitor/core'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

function isIosSafari(): boolean {
  const ua = window.navigator.userAgent
  const isIos = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua)
  return isIos && isSafari
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(() => localStorage.getItem('pourfolio-install-dismissed') === '1')
  const [installed, setInstalled] = useState(false)
  const [showIosHelp, setShowIosHelp] = useState(false)

  useEffect(() => {
    if (Capacitor.isNativePlatform()) return

    if (isStandalone()) {
      setInstalled(true)
      return
    }

    if (isIosSafari() && !dismissed) {
      setShowIosHelp(true)
    }

    const onPrompt = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [dismissed])

  const dismiss = () => {
    localStorage.setItem('pourfolio-install-dismissed', '1')
    setDismissed(true)
    setShowIosHelp(false)
  }

  if (Capacitor.isNativePlatform() || installed || dismissed) return null

  if (showIosHelp && !deferred) {
    return (
      <div className="install-banner">
        <div className="install-banner-text">
          <strong>Install Pourfolio</strong>
          <span>Tap Share, then &ldquo;Add to Home Screen&rdquo; to open it like an app.</span>
        </div>
        <div className="install-banner-actions">
          <button type="button" className="btn btn-sm btn-secondary" onClick={dismiss}>
            Got it
          </button>
        </div>
      </div>
    )
  }

  if (!deferred) return null

  return (
    <div className="install-banner">
      <div className="install-banner-text">
        <strong>Install Pourfolio</strong>
        <span>Add to your home screen for quick access and offline use.</span>
      </div>
      <div className="install-banner-actions">
        <button
          type="button"
          className="btn btn-sm btn-primary"
          onClick={() => {
            void deferred.prompt().then(() => {
              setDeferred(null)
              setInstalled(true)
            })
          }}
        >
          Install
        </button>
        <button type="button" className="btn btn-sm btn-secondary" onClick={dismiss}>
          Not now
        </button>
      </div>
    </div>
  )
}
