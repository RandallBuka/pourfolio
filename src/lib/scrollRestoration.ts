const scrollPositions = new Map<string, number>()

export function scrollRouteKey(pathname: string, search: string): string {
  return `${pathname}${search}`
}

export function getPageScrollContainer(): HTMLElement | null {
  const container = document.querySelector('.page-content')
  return container instanceof HTMLElement ? container : null
}

export function saveScrollPosition(routeKey: string): void {
  const container = getPageScrollContainer()
  if (!container) return
  scrollPositions.set(routeKey, container.scrollTop)
}

export function getSavedScrollPosition(routeKey: string): number | undefined {
  return scrollPositions.get(routeKey)
}

export function restoreScrollPosition(container: HTMLElement, top: number): void {
  container.scrollTop = top
  // Large lists may grow after the first paint — re-apply once layout settles.
  requestAnimationFrame(() => {
    container.scrollTop = top
  })
}
