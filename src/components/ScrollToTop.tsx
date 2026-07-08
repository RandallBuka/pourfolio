import { useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'

export function ScrollToTop() {
  const { pathname } = useLocation()

  useLayoutEffect(() => {
    const container = document.querySelector('.page-content')
    if (container instanceof HTMLElement) {
      container.scrollTop = 0
    } else {
      window.scrollTo(0, 0)
    }
  }, [pathname])

  return null
}
