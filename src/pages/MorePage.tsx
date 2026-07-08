import { Link } from 'react-router-dom'
import { ThemeSelector } from '../components/ThemeSelector'
import { NavBar } from '../components/NavBar'
import { APP_NAME, APP_TAGLINE } from '../lib/brand'
import { useApp } from '../context/AppContext'

export function MorePage() {
  const {
    state,
    activeBar,
    allDrinks,
    deletedIngredients,
    deletedDrinks,
  } = useApp()

  return (
    <div className="page">
      <NavBar title="Settings" />

      <div className="card">
        <div className="card-header">
          <h3 className="text-primary" style={{ fontWeight: 700 }}>About {APP_NAME}</h3>
        </div>
        <div className="card-body" style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--pf-text-muted)' }}>
          <p>{APP_TAGLINE}</p>
          <p style={{ marginTop: 8 }}>
            Track bottles on your shelf, see what you can pour tonight, and build a shopping list for what's missing.
          </p>
        </div>
      </div>

      <ThemeSelector />

      <Link to="/more/bars" className="list-item settings-cta">
        <div className="item-info">
          <div className="item-name">Manage bars</div>
          <div className="item-subtitle">
            {state.bars.length} bar{state.bars.length !== 1 ? 's' : ''} · {activeBar.name} active · {allDrinks.length} recipes
          </div>
        </div>
        <span className="settings-cta-chevron" aria-hidden>›</span>
      </Link>

      <Link to="/more/recipes" className="list-item settings-cta">
        <div className="item-info">
          <div className="item-name">Manage recipes</div>
          <div className="item-subtitle">
            {state.customDrinks.length} custom recipe{state.customDrinks.length !== 1 ? 's' : ''} · edit or delete
          </div>
        </div>
        <span className="settings-cta-chevron" aria-hidden>›</span>
      </Link>

      <Link to="/more/deleted" className="list-item settings-cta">
        <div className="item-info">
          <div className="item-name">Deleted items</div>
          <div className="item-subtitle">
            {deletedIngredients.length} ingredient{deletedIngredients.length !== 1 ? 's' : ''} ·{' '}
            {deletedDrinks.length} recipe{deletedDrinks.length !== 1 ? 's' : ''} · restore individually
          </div>
        </div>
        <span className="settings-cta-chevron" aria-hidden>›</span>
      </Link>

      <Link to="/more/advanced" className="list-item settings-cta">
        <div className="item-info">
          <div className="item-name">Advanced settings</div>
          <div className="item-subtitle">Share, backup, cloud sync, app cache, and data tools</div>
        </div>
        <span className="settings-cta-chevron" aria-hidden>›</span>
      </Link>
    </div>
  )
}
