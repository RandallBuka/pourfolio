import { THEME_MODE_LABELS, type ThemeMode } from '../lib/theme'
import { useTheme } from '../context/ThemeContext'

const MODES: ThemeMode[] = ['light', 'dark', 'system']

export function ThemeSelector() {
  const { themeMode, setThemeMode } = useTheme()

  return (
    <div className="card" style={{ marginTop: 0 }}>
      <div className="card-header">
        <h3 className="text-primary" style={{ fontWeight: 700 }}>Appearance</h3>
      </div>
      <div className="card-body">
        <p className="theme-selector-hint">
          Choose light or dark mode, or match your device setting.
        </p>
        <div className="theme-segment" role="group" aria-label="Theme">
          {MODES.map((mode) => (
            <button
              key={mode}
              type="button"
              className={`theme-segment-btn ${themeMode === mode ? 'active' : ''}`}
              aria-pressed={themeMode === mode}
              onClick={() => setThemeMode(mode)}
            >
              {THEME_MODE_LABELS[mode]}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
