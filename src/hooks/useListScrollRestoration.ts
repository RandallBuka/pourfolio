import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import {
  getPageScrollContainer,
  restoreScrollForRoute,
  saveScrollForRoute,
  scrollRouteKey,
} from '../lib/scrollRestoration'

/**
 * Persist and restore scroll for long alpha-index lists.
 * Re-runs restore when `contentRevision` changes (e.g. catalog rows finish loading).
 */
export function useListScrollRestoration(contentRevision: number): void {
  const { pathname, search } = useLocation()
  const routeKey = scrollRouteKey(pathname, search)
  const routeKeyRef = useRef(routeKey)
  routeKeyRef.current = routeKey

  useEffect(() => {
    const container = getPageScrollContainer()
    if (!container) return

    let raf = 0
    const onScroll = () => {
      window.cancelAnimationFrame(raf)
      raf = window.requestAnimationFrame(() => {
        saveScrollForRoute(routeKeyRef.current)
      })
    }

    const saveNow = () => saveScrollForRoute(routeKeyRef.current)

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return
      if (target.closest('a[href], .list-item, button.dice-btn')) {
        saveNow()
      }
    }

    container.addEventListener('scroll', onScroll, { passive: true })
    container.addEventListener('pointerdown', onPointerDown, true)

    return () => {
      window.cancelAnimationFrame(raf)
      container.removeEventListener('scroll', onScroll)
      container.removeEventListener('pointerdown', onPointerDown, true)
    }
  }, [routeKey])

  useEffect(() => {
    const container = getPageScrollContainer()
    if (!container) return
    restoreScrollForRoute(container, routeKey)
  }, [routeKey, contentRevision])
}
