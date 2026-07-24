import { useLayoutEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import {
  getPageScrollContainer,
  restoreScrollForRoute,
  saveScrollForRoute,
  scrollHistoryKey,
  scrollRouteKey,
} from '../lib/scrollRestoration'

/**
 * Persist and restore scroll for long alpha-index lists.
 * Re-runs restore when `contentRevision` changes (e.g. catalog rows finish loading).
 */
export function useListScrollRestoration(contentRevision: number): void {
  const location = useLocation()
  const routeKey = scrollRouteKey(location.pathname, location.search)
  const historyKey = scrollHistoryKey(location)
  const routeKeyRef = useRef(routeKey)
  const historyKeyRef = useRef(historyKey)
  const lastScrollTopRef = useRef(0)
  routeKeyRef.current = routeKey
  historyKeyRef.current = historyKey

  useLayoutEffect(() => {
    const container = getPageScrollContainer()
    if (!container) return

    let raf = 0
    const persist = (top: number) => {
      lastScrollTopRef.current = top
      saveScrollForRoute(routeKeyRef.current, top)
      saveScrollForRoute(historyKeyRef.current, top)
    }

    const onScroll = () => {
      window.cancelAnimationFrame(raf)
      raf = window.requestAnimationFrame(() => {
        persist(container.scrollTop)
      })
    }

    const saveNow = () => persist(container.scrollTop)

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
      // Use last known scroll — DOM may already be reset when the list unmounts.
      persist(lastScrollTopRef.current)
    }
  }, [routeKey])

  useLayoutEffect(() => {
    const container = getPageScrollContainer()
    if (!container) return
    restoreScrollForRoute(container, historyKey, routeKey)
  }, [historyKey, routeKey, contentRevision])
}
