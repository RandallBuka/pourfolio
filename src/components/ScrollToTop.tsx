import { useEffect, useLayoutEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'
import {
  getPageScrollContainer,
  getSavedScrollPosition,
  restoreScrollPosition,
  saveScrollPosition,
  scrollRouteKey,
} from '../lib/scrollRestoration'

/** Scroll to top on forward navigation; restore position when using back/forward. */
export function ScrollToTop() {
  const { pathname, search } = useLocation()
  const navigationType = useNavigationType()
  const routeKey = scrollRouteKey(pathname, search)

  useEffect(() => {
    const container = getPageScrollContainer()
    if (!container) return

    const onScroll = () => saveScrollPosition(routeKey)
    container.addEventListener('scroll', onScroll, { passive: true })
    return () => container.removeEventListener('scroll', onScroll)
  }, [routeKey])

  useLayoutEffect(() => {
    const container = getPageScrollContainer()
    if (!container) {
      window.scrollTo(0, 0)
      return
    }

    const saved = getSavedScrollPosition(routeKey)
    if (navigationType === 'POP' && saved != null) {
      restoreScrollPosition(container, saved)
      return
    }

    container.scrollTop = 0
  }, [routeKey, navigationType])

  return null
}
