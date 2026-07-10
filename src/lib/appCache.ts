import { clearCatalogCache } from '../data/catalogStore'

export interface ClearAppCacheResult {
  clearedCaches: number
  unregisteredWorkers: number
  clearedCatalogCache: boolean
}

/** Clears PWA/service worker caches and stale catalog JSON. Does not remove bar data in localStorage. */
export async function clearAppCache(): Promise<ClearAppCacheResult> {
  let clearedCaches = 0
  let unregisteredWorkers = 0

  if ('caches' in window) {
    const keys = await caches.keys()
    await Promise.all(
      keys.map(async (key) => {
        if (await caches.delete(key)) clearedCaches++
      })
    )
  }

  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations()
    await Promise.all(
      registrations.map(async (registration) => {
        if (await registration.unregister()) unregisteredWorkers++
      })
    )
  }

  clearCatalogCache()

  return { clearedCaches, unregisteredWorkers, clearedCatalogCache: true }
}
