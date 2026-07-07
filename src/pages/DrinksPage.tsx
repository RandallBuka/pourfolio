import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { NavBar } from '../components/NavBar'
import { DrinkFilterPanel } from '../components/DrinkFilterPanel'
import { FilterPills, ListFilterToolbar } from '../components/ListFilterToolbar'
import { RecipeImportModal } from '../components/RecipeImportModal'
import { DrinkThumb, getAlphaIndex, filterByAlpha } from '../lib/ui'
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

export function DrinksPage() {
  const { allDrinks, makeableDrinks, getDrinkSummary, canMake, state } = useApp()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const ingredientFilter = searchParams.get('ingredient')
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<DrinkFilters>({ ...EMPTY_DRINK_FILTERS })
  const [readyToPourOnly, setReadyToPourOnly] = useState(false)
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [alpha, setAlpha] = useState<string | null>(null)

  useEffect(() => {
    if (ingredientFilter) {
      setFilters((f) => ({
        ...f,
        ingredient: f.ingredient.includes(ingredientFilter)
          ? f.ingredient
          : [...f.ingredient, ingredientFilter],
      }))
    }
  }, [ingredientFilter])

  const favoriteIds = useMemo(() => new Set(state.favorites), [state.favorites])
  const filterContext = useMemo(
    () => ({ canMake, favoriteIds }),
    [canMake, favoriteIds]
  )

  const filtered = useMemo(() => {
    let items = [...allDrinks].sort((a, b) => a.name.localeCompare(b.name))
    items = applyDrinkFilters(
      items,
      filters,
      { readyToPourOnly, favoritesOnly },
      filterContext
    )
    items = applyDrinkSearch(items, search)
    if (alpha) items = filterByAlpha(items, alpha)
    return items
  }, [allDrinks, search, filters, readyToPourOnly, favoritesOnly, filterContext, alpha])

  const alphaLetters = useMemo(() => getAlphaIndex(filtered), [filtered])
  const activePills = formatActiveDrinkFilters(filters, readyToPourOnly, favoritesOnly)
  const filterCount = getActiveDrinkFilterCount(filters, readyToPourOnly, favoritesOnly)

  const removePill = (pill: { key: string; field?: string; value?: string }) => {
    if (pill.key === 'readyToPour') {
      setReadyToPourOnly(false)
      return
    }
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

  const pickRandomDrink = () => {
    const pool = readyToPourOnly
      ? (filtered.length ? filtered : makeableDrinks)
      : (filtered.length ? filtered : allDrinks)
    const drink = pickRandomMakeableDrink(pool)
    if (drink) {
      navigate(`/drinks/${drink.id}`, { state: { randomPick: Date.now() } })
    }
  }

  return (
    <div className="page">
      <NavBar
        title={ingredientFilter ? `Recipes with ${ingredientFilter}` : 'Recipes'}
        actions={
          <button type="button" className="nav-btn" onClick={() => setShowImport(true)} title="Import recipe" aria-label="Import recipe">
            ↧
          </button>
        }
      />

      <ListFilterToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="Search name, type, glass, ingredients..."
        filterCount={filterCount}
        onFilterClick={() => setShowFilters(true)}
        trailing={
          <button
            type="button"
            className="dice-btn"
            title="Random recipe"
            aria-label="Random recipe"
            onClick={pickRandomDrink}
          >
            🎲
          </button>
        }
      >
        <FilterPills pills={activePills} onRemove={removePill} />
      </ListFilterToolbar>

      <div className="section-header">{filtered.length} drinks</div>

      <div className="list-container">
        {filtered.map((drink) => (
          <Link key={drink.id} to={`/drinks/${drink.id}`} className="list-item">
            <DrinkThumb drink={drink} />
            <div className="item-info">
              <div className="item-name">{drink.name}</div>
              <div className="item-subtitle">{getDrinkSummary(drink)}</div>
              {canMake(drink) && (
                <div className="item-meta item-meta--success">
                  ✓ Ready to pour
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>

      {alphaLetters.length > 0 && (
        <div className="alpha-index">
          {alphaLetters.map((l) => (
            <button key={l} type="button" onClick={() => setAlpha(alpha === l ? null : l)}>{l}</button>
          ))}
        </div>
      )}

      {showFilters && (
        <DrinkFilterPanel
          items={allDrinks}
          filters={filters}
          onChange={setFilters}
          onClose={() => setShowFilters(false)}
          readyToPourOnly={readyToPourOnly}
          onReadyToPourOnlyChange={setReadyToPourOnly}
          favoritesOnly={favoritesOnly}
          onFavoritesOnlyChange={setFavoritesOnly}
          context={filterContext}
          resultCount={filtered.length}
        />
      )}

      {showImport && <RecipeImportModal onClose={() => setShowImport(false)} />}
    </div>
  )
}
