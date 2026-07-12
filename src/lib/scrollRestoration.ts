const STORAGE_KEY = 'pourfolio-scroll-positions-v1'

const LIST_SCROLL_ROUTES = new Set([
  '/ingredients',
  '/drinks',
  '/my-ingredients',
  '/favorites',
  '/can-make',
  '/need',
  '/shopping',
])

type ScrollCache = Record<string, number>

let memoryCache: ScrollCache | null = null

function readCache(): ScrollCache {
  if (memoryCache) return memoryCache
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    memoryCache = raw ? (JSON.parse(raw) as ScrollCache) : {}
  } catch {
    memoryCache = {}
  }
  return memoryCache
}

function writeCache(cache: ScrollCache): void {
  memoryCache = cache
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(cache))
  } catch {
    // private mode
  }
}

export function scrollRouteKey(pathname: string, search: string): string {
  return `${pathname}${search}`
}

export function isListScrollRoute(pathname: string): boolean {
  return LIST_SCROLL_ROUTES.has(pathname)
}

export function getPageScrollContainer(): HTMLElement | null {
  const container = document.querySelector('.page-content')
  return container instanceof HTMLElement ? container : null
}

export function saveScrollForRoute(routeKey: string, top?: number): void {
  const container = getPageScrollContainer()
  if (!container) return
  const value = top ?? container.scrollTop
  const cache = readCache()
  cache[routeKey] = value
  writeCache(cache)
}

export function getScrollForRoute(routeKey: string): number | undefined {
  const value = readCache()[routeKey]
  return typeof value === 'number' ? value : undefined
}

export function clearScrollRestoreTimers(): void {
  for (const timer of activeRestoreTimers) {
    window.clearTimeout(timer)
  }
  activeRestoreTimers = []
  activeResizeObserver?.disconnect()
  activeResizeObserver = null
}

let activeRestoreTimers: number[] = []
let activeResizeObserver: ResizeObserver | null = null

/** Re-apply saved offset until list content is tall enough (images, catalog rows). */
export function restoreScrollForRoute(container: HTMLElement, routeKey: string): boolean {
  const saved = getScrollForRoute(routeKey)
  if (saved == null || saved <= 0) return false

  clearScrollRestoreTimers()

  const apply = () => {
    container.scrollTop = saved
  }

  apply()

  activeResizeObserver = new ResizeObserver(() => apply())
  activeResizeObserver.observe(container)
  const list = container.querySelector('.list-container')
  if (list instanceof HTMLElement) {
    activeResizeObserver.observe(list)
  }

  for (const delay of [0, 16, 50, 100, 200, 400, 800, 1200]) {
    activeRestoreTimers.push(window.setTimeout(apply, delay))
  }

  activeRestoreTimers.push(
    window.setTimeout(() => {
      clearScrollRestoreTimers()
    }, 1400)
  )

  return true
}

export function clearScrollForRoute(routeKey: string): void {
  const cache = readCache()
  delete cache[routeKey]
  writeCache(cache)
}
