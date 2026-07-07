import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  applyResolvedTheme,
  initTheme,
  loadThemeMode,
  resolveTheme,
  saveThemeMode,
  type ThemeMode,
} from '../lib/theme'

interface ThemeContextValue {
  themeMode: ThemeMode
  resolvedTheme: 'light' | 'dark'
  setThemeMode: (mode: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => initTheme())
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => resolveTheme(loadThemeMode()))

  const setThemeMode = (mode: ThemeMode) => {
    saveThemeMode(mode)
    setThemeModeState(mode)
    const resolved = resolveTheme(mode)
    setResolvedTheme(resolved)
    applyResolvedTheme(resolved)
  }

  useEffect(() => {
    if (themeMode !== 'system') return

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const sync = () => {
      const resolved = resolveTheme('system')
      setResolvedTheme(resolved)
      applyResolvedTheme(resolved)
    }

    sync()
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [themeMode])

  return (
    <ThemeContext.Provider value={{ themeMode, resolvedTheme, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
