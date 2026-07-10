import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import {
  getPageScrollContainer,
  getSavedScrollPosition,
  restoreScrollPosition,
  saveScrollPosition,
} from '../lib/scrollRestoration'

/**
 * Track scroll per history entry (location.key) so Back returns to the prior offset.
 * Pathname alone is not enough — revisiting /ingredients via Back reuses the same key.
 */
export function ScrollToTop() {
  const location = useLocation()
  const historyKey = location.key

  useEffect(() => {
    const container = getPageScrollContainer()
    if (!container) return

    const onScroll = () => saveScrollPosition(historyKey)
    container.addEventListener('scroll', onScroll, { passive: true })

    const onClick = (event: MouseEvent) => {
      const target = event.target
      if (target instanceof Element && target.closest('a[href], button')) {
        saveScrollPosition(historyKey)
      }
    }
    container.addEventListener('click', onClick, true)

    return () => {
      container.removeEventListener('scroll', onScroll)
      container.removeEventListener('click', onClick, true)
    }
  }, [historyKey])

  useEffect(() => {
    const container = getPageScrollContainer()
    if (!container) {
      window.scrollTo(0, 0)
      return
    }

    const saved = getSavedScrollPosition(historyKey)
    if (saved != null && saved > 0) {
      restoreScrollPosition(container, saved)
      return
    }

    container.scrollTop = 0
  }, [historyKey])

  return null
}
