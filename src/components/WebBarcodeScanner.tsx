import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { normalizeBarcode } from '../lib/ingredientBarcode'

interface Props {
  active: boolean
  onDetected: (barcode: string) => void
  onError?: (message: string) => void
}

async function stopScanner(scanner: Html5Qrcode): Promise<void> {
  try {
    await scanner.stop()
  } catch {
    // Already stopped or never started
  }
  try {
    scanner.clear()
  } catch {
    // Container may already be gone
  }
}

export function WebBarcodeScanner({ active, onDetected, onError }: Props) {
  const containerId = useRef(`barcode-scanner-${Math.random().toString(36).slice(2)}`)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const detectedRef = useRef(false)
  const onDetectedRef = useRef(onDetected)
  const onErrorRef = useRef(onError)
  const [starting, setStarting] = useState(false)

  onDetectedRef.current = onDetected
  onErrorRef.current = onError

  useEffect(() => {
    if (!active) {
      const scanner = scannerRef.current
      scannerRef.current = null
      if (scanner) {
        void stopScanner(scanner)
      }
      return
    }

    let cancelled = false
    detectedRef.current = false
    const scanner = new Html5Qrcode(containerId.current)
    scannerRef.current = scanner
    setStarting(true)

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 260, height: 160 }, aspectRatio: 1.5 },
        (decoded) => {
          if (cancelled || detectedRef.current) return
          const code = normalizeBarcode(decoded)
          if (code.length < 8) return

          detectedRef.current = true
          void stopScanner(scanner).finally(() => {
            if (cancelled) return
            requestAnimationFrame(() => {
              onDetectedRef.current(code)
            })
          })
        },
        () => undefined
      )
      .then(() => {
        if (!cancelled) setStarting(false)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setStarting(false)
          onErrorRef.current?.(err instanceof Error ? err.message : 'Could not access camera')
        }
      })

    return () => {
      cancelled = true
      void stopScanner(scanner)
      if (scannerRef.current === scanner) scannerRef.current = null
    }
  }, [active])

  return (
    <div className="barcode-scanner-wrap">
      <div id={containerId.current} className="barcode-scanner-view" />
      {starting && <p className="barcode-scanner-hint">Starting camera…</p>}
      {!starting && active && (
        <p className="barcode-scanner-hint">Point at the barcode on the bottle label</p>
      )}
    </div>
  )
}
