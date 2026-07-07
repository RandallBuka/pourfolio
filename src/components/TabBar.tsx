import { Link, useLocation } from 'react-router-dom'
import { TabIcon } from './TabIcons'

const tabs = [
  { path: '/', label: 'Home', icon: 'home' as const },
  { path: '/favorites', label: 'Saved', icon: 'saved' as const },
  { path: '/ingredients', label: 'Stock', icon: 'stock' as const },
  { path: '/drinks', label: 'Recipes', icon: 'recipes' as const },
  { path: '/more', label: 'Settings', icon: 'settings' as const },
]

export function TabBar() {
  const location = useLocation()

  return (
    <nav className="tab-bar">
      {tabs.map((tab) => {
        const active = tab.path === '/'
          ? location.pathname === '/'
          : location.pathname.startsWith(tab.path)
        return (
          <Link
            key={tab.path}
            to={tab.path}
            className={`tab-item ${active ? 'active' : ''}`}
          >
            <span className="tab-icon"><TabIcon kind={tab.icon} /></span>
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
