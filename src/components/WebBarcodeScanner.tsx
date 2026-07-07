import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { normalizeBarcode } from '../lib/ingredientBarcode'

interface Props {
  active: boolean
  onDetected: (barcode: string) => void
  onError?: (message: string) => void
}

export function WebBarcodeScanner({ active, onDetected, onError }: Props) {
  const containerId = useRef(`barcode-scanner-${Math.random().toString(36).slice(2)}`)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    if (!active) {
      const scanner = scannerRef.current
      scannerRef.current = null
      if (scanner) {
        void scanner.stop().then(() => scanner.clear()).catch(() => undefined)
      }
      return
    }

    let cancelled = false
    const scanner = new Html5Qrcode(containerId.current)
    scannerRef.current = scanner
    setStarting(true)

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 260, height: 160 }, aspectRatio: 1.5 },
        (decoded) => {
          const code = normalizeBarcode(decoded)
          if (code.length >= 8) {
            void scanner.stop().then(() => {
              onDetected(code)
            }).catch(() => onDetected(code))
          }
        },
        () => undefined
      )
      .then(() => {
        if (!cancelled) setStarting(false)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setStarting(false)
          onError?.(err instanceof Error ? err.message : 'Could not access camera')
        }
      })

    return () => {
      cancelled = true
      void scanner.stop().then(() => scanner.clear()).catch(() => undefined)
      if (scannerRef.current === scanner) scannerRef.current = null
    }
  }, [active, onDetected, onError])

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
