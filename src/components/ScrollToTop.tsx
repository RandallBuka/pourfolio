import { useLayoutEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'
import {
  clearScrollRestoreTimers,
  getPageScrollContainer,
  isListScrollRoute,
} from '../lib/scrollRestoration'

/** Scroll detail/settings pages to top on forward nav; list pages restore via useListScrollRestoration. */
export function ScrollToTop() {
  const { pathname } = useLocation()
  const navigationType = useNavigationType()

  useLayoutEffect(() => {
    const container = getPageScrollContainer()
    if (!container) {
      window.scrollTo(0, 0)
      return
    }

    if (isListScrollRoute(pathname)) {
      return
    }

    clearScrollRestoreTimers()
    if (navigationType === 'POP') return
    container.scrollTop = 0
  }, [pathname, navigationType])

  return null
}
