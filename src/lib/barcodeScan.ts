import { Capacitor } from '@capacitor/core'
import { normalizeBarcode } from './ingredientBarcode'

export function isBarcodeScanSupported(): boolean {
  if (Capacitor.isNativePlatform()) return true
  if (typeof window !== 'undefined' && 'BarcodeDetector' in window) return true
  return typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia
}

export async function scanBarcodeNative(): Promise<string | null> {
  if (!Capacitor.isNativePlatform()) return null

  try {
    const { BarcodeScanner } = await import('@capacitor-mlkit/barcode-scanning')
    const supported = await BarcodeScanner.isSupported()
    if (!supported.supported) return null

    const permissions = await BarcodeScanner.requestPermissions()
    if (permissions.camera !== 'granted' && permissions.camera !== 'limited') {
      throw new Error('Camera permission denied')
    }

    const result = await BarcodeScanner.scan()
    const raw = result.barcodes?.[0]?.rawValue ?? result.barcodes?.[0]?.displayValue
    return raw ? normalizeBarcode(raw) : null
  } catch (err) {
    if (err instanceof Error && err.message === 'Camera permission denied') throw err
    return null
  }
}

export async function requestCameraPermissionNative(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return true
  try {
    const { BarcodeScanner } = await import('@capacitor-mlkit/barcode-scanning')
    const permissions = await BarcodeScanner.requestPermissions()
    return permissions.camera === 'granted' || permissions.camera === 'limited'
  } catch {
    return false
  }
}
