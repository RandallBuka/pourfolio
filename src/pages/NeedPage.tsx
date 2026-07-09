import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { NavBar } from '../components/NavBar'
import { PageSubtitle } from '../components/PageSubtitle'
import { DrinkThumb } from '../lib/ui'
import { getRecipeIngredientBrowseUrl } from '../lib/ingredientBrowse'
import { rankBuyNextSuggestions, rankClosestDrinks, type BuyNextSuggestion } from '../lib/buyNext'
import { useApp } from '../context/AppContext'
import { findMatchingBarIngredient } from '../lib/matching'
import { resolveIngredientIdForRequirement } from '../lib/shoppingList'
import type { Drink } from '../types'

export function NeedPage() {
  const {
    activeBar,
    allDrinks,
    state,
    matchContext,
    toggleShopping,
    isInShoppingList,
    ingredientMap,
    addAllMissingToShopping,
    addMissingToShopping,
  } = useApp()
  const navigate = useNavigate()
  const [addedMsg, setAddedMsg] = useState<string | null>(null)
  const [buyNext, setBuyNext] = useState<BuyNextSuggestion[]>([])
  const [closestDrinks, setClosestDrinks] = useState<Array<{ drink: Drink; missingCount: number }>>([])
  const [ranking, setRanking] = useState(true)

  const favoriteIds = useMemo(() => new Set(state.favorites), [state.favorites])
  const shoppingKey = state.shoppingList.join('|')

  useEffect(() => {
    setRanking(true)
    const timer = window.setTimeout(() => {
      setBuyNext(
        rankBuyNextSuggestions(allDrinks, matchContext, ingredientMap, {
          limit: 8,
          excludeIds: new Set(state.shoppingList),
        })
      )
      setClosestDrinks(
        rankClosestDrinks(allDrinks, matchContext, favoriteIds, { limit: 12 })
      )
      setRanking(false)
    }, 0)

    return () => window.clearTimeout(timer)
  }, [allDrinks, matchContext, ingredientMap, shoppingKey, favoriteIds])

  const addAllMissing = () => {
    const drinks = closestDrinks.map((entry) => entry.drink)
    const n = addAllMissingToShopping(drinks)
    setAddedMsg(
      n > 0
        ? `Added ${n} item${n !== 1 ? 's' : ''} to shopping list`
        : 'All missing items already on your list'
    )
  }

  return (
    <div className="page">
      <NavBar title="What I'm Missing" onBack={() => navigate('/')} />

      <PageSubtitle
        title={activeBar.name}
        description="Buy what unlocks the most recipes — saved drinks shown first when you're close."
      />

      {ranking && (
        <p className="buy-next-hint" role="status">
          Finding best buys for your bar…
        </p>
      )}

      {!ranking && buyNext.length > 0 && (
        <>
          <div className="section-header">Best next buy</div>
          <p className="buy-next-hint">
            One bottle from the catalog that opens the most new recipes for your bar.
          </p>
          {buyNext.map((item) => (
            <div key={item.ingredientId} className="list-item buy-next-row">
              <div className="item-info">
                <div className="item-name">{item.ingredient.name}</div>
                <div className="item-subtitle">
                  Unlocks {item.unlocks} drink{item.unlocks !== 1 ? 's' : ''}
                  {item.sampleDrinks.length > 0 ? ` — e.g. ${item.sampleDrinks.join(', ')}` : ''}
                </div>
              </div>
              <div className="buy-next-actions">
                <Link
                  to={`/ingredients/${item.ingredientId}`}
                  className="btn btn-sm btn-secondary buy-next-link"
                >
                  View
                </Link>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={() => toggleShopping(item.ingredientId)}
                >
                  {isInShoppingList(item.ingredientId) ? 'In list' : 'Add to list'}
                </button>
              </div>
            </div>
          ))}
        </>
      )}

      {!ranking && closestDrinks.length > 0 && (
        <div className="detail-actions" style={{ marginTop: buyNext.length > 0 ? 12 : 0 }}>
          <button type="button" className="btn btn-primary" onClick={addAllMissing}>
            Add all missing to shopping list
          </button>
          <Link to="/shopping" className="btn btn-secondary" style={{ textAlign: 'center', textDecoration: 'none' }}>
            Open shopping list ({state.shoppingList.length})
          </Link>
        </div>
      )}

      {addedMsg && <p className="shopping-flash">{addedMsg}</p>}

      {!ranking && closestDrinks.length > 0 && (
        <div className="section-header" style={{ marginTop: 16 }}>
          Closest recipes
        </div>
      )}

      {!ranking && closestDrinks.map(({ drink, missingCount }) => {
        const missing = drink.ingredients.filter(
          (req) => !req.optional && !findMatchingBarIngredient(req, matchContext)
        )

        return (
          <div key={drink.id} className="card">
            <Link to={`/drinks/${drink.id}`} className="list-item" style={{ border: 'none' }}>
              <DrinkThumb drink={drink} />
              <div className="item-info">
                <div className="item-name">{drink.name}</div>
                <div className="item-subtitle">
                  {missingCount} missing
                  {favoriteIds.has(drink.id) ? ' · Saved' : ''}
                </div>
              </div>
            </Link>
            <div style={{ padding: '0 16px 8px' }}>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={() => {
                  const n = addMissingToShopping(drink)
                  setAddedMsg(n > 0 ? `Added ${n} for ${drink.name}` : 'Already on shopping list')
                }}
              >
                Add missing for this drink
              </button>
            </div>
            <div style={{ padding: '0 16px 12px' }}>
              {drink.ingredients.filter((i) => !i.optional).map((req, idx) => {
                const have = findMatchingBarIngredient(req, matchContext)
                const catalogId = resolveIngredientIdForRequirement(req, ingredientMap)
                return (
                  <div key={idx} className={have ? 'have' : 'missing'} style={{ fontSize: 14, padding: '4px 0' }}>
                    {have ? '✓' : '✗'}{' '}
                    {!have ? (
                      <Link
                        to={getRecipeIngredientBrowseUrl(req)}
                        className="missing-ingredient-link"
                      >
                        {req.brandName ?? req.genericName}
                      </Link>
                    ) : (
                      req.brandName ?? req.genericName
                    )}
                    {req.amount && <span style={{ color: 'var(--bar-text-muted)', marginLeft: 8 }}>{req.amount}</span>}
                    {!have && catalogId && (
                      <button
                        type="button"
                        className="btn btn-sm btn-secondary"
                        style={{ marginLeft: 8, padding: '2px 8px', fontSize: 11 }}
                        onClick={() => toggleShopping(catalogId)}
                      >
                        {isInShoppingList(catalogId) ? 'In list' : '+ List'}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {!ranking && buyNext.length === 0 && closestDrinks.length === 0 && (
        <div className="empty-state">
          <h3>Your bar is well stocked</h3>
          <p>Browse recipes to find your next project — or add bottles to unlock more.</p>
          <Link to="/drinks" className="btn btn-primary empty-state-cta">
            Browse recipes
          </Link>
        </div>
      )}
    </div>
  )
}
