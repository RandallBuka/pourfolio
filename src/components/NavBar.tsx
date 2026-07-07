import { AppWordmark } from './AppWordmark'

interface NavBarProps {
  title: string
  brand?: boolean
  onBack?: () => void
  actions?: React.ReactNode
}

export function NavBar({ title, brand, onBack, actions }: NavBarProps) {
  const showBack = !!onBack

  return (
    <header className={`nav-bar${brand ? ' nav-bar--brand' : ''}`}>
      <div className="nav-bar-slot nav-bar-slot--start">
        {showBack && (
          <button className="back-btn" onClick={onBack} type="button">
            ← Back
          </button>
        )}
      </div>
      <h1 className={`nav-bar-title${brand ? ' nav-bar-title--brand' : ''}`}>
        {brand ? <AppWordmark /> : title}
      </h1>
      <div className="nav-bar-slot nav-bar-slot--end">
        {actions ? <div className="nav-actions">{actions}</div> : null}
      </div>
    </header>
  )
}
