import { Link } from 'react-router-dom'
import { NavBar } from '../components/NavBar'
import { DrinkThumb } from '../lib/ui'
import { useApp } from '../context/AppContext'

export function FavoritesPage() {
  const { favorites, getDrinkSummary, canMake } = useApp()
  const favDrinks = favorites

  return (
    <div className="page">
      <NavBar title="Saved" />

      {favDrinks.length === 0 ? (
        <div className="empty-state">
          <div className="icon">⭐</div>
          <h3>No favorites yet</h3>
          <p>Star drinks from any recipe to add them here</p>
          <Link to="/drinks" className="btn btn-primary" style={{ marginTop: 16, display: 'inline-block' }}>
            Browse Drinks
          </Link>
        </div>
      ) : (
        <>
          <div className="section-header">{favDrinks.length} favorite drinks</div>
          {favDrinks.map((drink) => (
            <Link key={drink.id} to={`/drinks/${drink.id}`} className="list-item">
              <DrinkThumb drink={drink} />
              <div className="item-info">
                <div className="item-name">{drink.name}</div>
                <div className="item-subtitle">{getDrinkSummary(drink)}</div>
                {canMake(drink) && (
                  <div className="item-meta item-meta--success">✓ Ready to pour</div>
                )}
              </div>
              <span className="favorite-btn active">★</span>
            </Link>
          ))}
        </>
      )}
    </div>
  )
}
