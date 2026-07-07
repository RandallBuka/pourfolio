import { useMemo, useState } from 'react'
import type { Drink } from '../types'
import { Link, useNavigate } from 'react-router-dom'
import { NavBar } from '../components/NavBar'
import { PageSubtitle } from '../components/PageSubtitle'
import { DrinkFilterPanel } from '../components/DrinkFilterPanel'
import { FilterPills, ListFilterToolbar } from '../components/ListFilterToolbar'
import { DrinkThumb } from '../lib/ui'
import { useApp } from '../context/AppContext'
import { pickRandomMakeableDrink } from '../lib/randomDrink'
import {
  EMPTY_DRINK_FILTERS,
  applyDrinkFilters,
  applyDrinkSearch,
  formatActiveDrinkFilters,
  getActiveDrinkFilterCount,
  type DrinkFilterField,
  type DrinkFilters,
} from '../lib/drinkFilter'

export function CanMakePage() {
  const { activeBar, makeableDrinks, state, getDrinkSummary } = useApp()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<DrinkFilters>({ ...EMPTY_DRINK_FILTERS })
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const favoriteIds = useMemo(() => new Set(state.favorites), [state.favorites])
  const filterContext = useMemo(
    () => ({ canMake: () => true, favoriteIds }),
    [favoriteIds]
  )

  const filtered = useMemo(() => {
    let items = [...makeableDrinks].sort((a, b) => a.name.localeCompare(b.name))
    items = applyDrinkFilters(items, filters, { favoritesOnly }, filterContext)
    items = applyDrinkSearch(items, search)
    return items
  }, [makeableDrinks, search, filters, favoritesOnly, filterContext])

  const activePills = formatActiveDrinkFilters(filters, false, favoritesOnly)
  const filterCount = getActiveDrinkFilterCount(filters, false, favoritesOnly)

  const removePill = (pill: { key: string; field?: string; value?: string }) => {
    if (pill.key === 'favorites') {
      setFavoritesOnly(false)
      return
    }
    if (pill.field && pill.value) {
      const field = pill.field as DrinkFilterField
      setFilters((f) => ({
        ...f,
        [field]: f[field].filter((v) => v !== pill.value),
      }))
    }
  }

  return (
    <div className="page">
      <NavBar title="Drinks I Can Make" onBack={() => navigate('/')} />

      <PageSubtitle title={activeBar.name} />

      {makeableDrinks.length === 0 ? (
        <div className="empty-state">
          <div className="icon">🍹</div>
          <h3>No drinks yet</h3>
          <p>Add more ingredients to your bar to unlock recipes</p>
          <Link to="/ingredients" className="btn btn-primary" style={{ marginTop: 16, display: 'inline-block' }}>
            Add Ingredients
          </Link>
        </div>
      ) : (
        <>
          <ListFilterToolbar
            search={search}
            onSearchChange={setSearch}
            placeholder="Search ready drinks..."
            filterCount={filterCount}
            onFilterClick={() => setShowFilters(true)}
            trailing={
              <button
                type="button"
                className="dice-btn"
                title="Random drink"
                aria-label="Random drink"
                onClick={() => {
                  const pool = filtered.length ? filtered : makeableDrinks
                  const drink = pickRandomMakeableDrink(pool)
                  if (drink) {
                    navigate(`/drinks/${drink.id}`, { state: { randomPick: Date.now() } })
                  }
                }}
              >
                🎲
              </button>
            }
          >
            <FilterPills pills={activePills} onRemove={removePill} />
          </ListFilterToolbar>

          <div className="section-header">{filtered.length} ready drinks</div>

          {filtered.map((drink) => (
            <DrinkRow key={drink.id} drink={drink} summary={getDrinkSummary(drink)} />
          ))}

          {filtered.length === 0 && (
            <p className="shopping-flash">No drinks match your search or filters.</p>
          )}
        </>
      )}

      {showFilters && (
        <DrinkFilterPanel
          items={makeableDrinks}
          filters={filters}
          onChange={setFilters}
          onClose={() => setShowFilters(false)}
          favoritesOnly={favoritesOnly}
          onFavoritesOnlyChange={setFavoritesOnly}
          context={filterContext}
          resultCount={filtered.length}
        />
      )}
    </div>
  )
}

function DrinkRow({ drink, summary }: { drink: Pick<Drink, 'id' | 'name' | 'type' | 'image'>; summary: string }) {
  return (
    <Link to={`/drinks/${drink.id}`} className="list-item">
      <DrinkThumb drink={drink} />
      <div className="item-info">
        <div className="item-name">{drink.name}</div>
        <div className="item-subtitle">{summary}</div>
      </div>
    </Link>
  )
}
