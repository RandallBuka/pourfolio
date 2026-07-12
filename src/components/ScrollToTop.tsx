import { useEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'
import {
  clearScrollRestoreTimers,
  getPageScrollContainer,
  isListScrollRoute,
  restoreScrollForRoute,
  scrollRouteKey,
} from '../lib/scrollRestoration'

/** Scroll detail/settings pages to top on forward nav; list pages use useListScrollRestoration. */
export function ScrollToTop() {
  const { pathname, search } = useLocation()
  const navigationType = useNavigationType()
  const routeKey = scrollRouteKey(pathname, search)

  useEffect(() => {
    const container = getPageScrollContainer()
    if (!container) {
      window.scrollTo(0, 0)
      return
    }

    if (isListScrollRoute(pathname)) {
      restoreScrollForRoute(container, routeKey)
      return
    }

    clearScrollRestoreTimers()
    if (navigationType === 'POP') return
    container.scrollTop = 0
  }, [routeKey, pathname, navigationType])

  return null
}
