import { Capacitor } from '@capacitor/core'

/** Strip trailing slash; empty string when served from domain root. */
export function getRouterBasename(): string | undefined {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  return base || undefined
}

/** Hash routing avoids GitHub Pages 404 issues on deep links. */
export function useHashRouter(): boolean {
  return Capacitor.isNativePlatform() || Boolean(getRouterBasename())
}
