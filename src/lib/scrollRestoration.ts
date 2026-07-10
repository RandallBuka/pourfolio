const scrollPositions = new Map<string, number>()

export function getPageScrollContainer(): HTMLElement | null {
  const container = document.querySelector('.page-content')
  return container instanceof HTMLElement ? container : null
}

export function saveScrollPosition(historyKey: string): void {
  const container = getPageScrollContainer()
  if (!container) return
  scrollPositions.set(historyKey, container.scrollTop)
}

export function getSavedScrollPosition(historyKey: string): number | undefined {
  return scrollPositions.get(historyKey)
}

/** Re-apply until content height allows the target offset (large lists paint async). */
export function restoreScrollPosition(container: HTMLElement, top: number): void {
  let attempts = 0
  const maxAttempts = 16

  const apply = () => {
    container.scrollTop = top
    attempts += 1
    const maxScroll = container.scrollHeight - container.clientHeight
    if (attempts < maxAttempts && top > 0 && container.scrollTop < Math.min(top, maxScroll) - 1) {
      requestAnimationFrame(apply)
    }
  }

  apply()
  window.setTimeout(apply, 0)
  window.setTimeout(apply, 50)
  window.setTimeout(apply, 150)
}
