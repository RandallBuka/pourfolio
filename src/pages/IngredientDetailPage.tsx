import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { NavBar } from '../components/NavBar'
import { IngredientEditModal } from '../components/IngredientEditModal'
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal'
import { CatalogNotesSection } from '../components/CatalogNotesSection'
import { IngredientThumb } from '../lib/ui'
import { formatAbv, getEffectiveVintage, getIngredientAbv, isWineIngredient } from '../lib/ingredientAbv'
import { useApp } from '../context/AppContext'

import type { StockLevel } from '../types'

const STOCK_LEVELS: StockLevel[] = ['full', 'half', 'low', 'empty']
const STOCK_LABELS: Record<StockLevel, string> = {
  full: 'Full',
  half: 'Half',
  low: 'Low',
  empty: 'Empty',
}

export function IngredientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const {
    ingredientMap,
    isInBar,
    addToBar,
    removeFromBar,
    toggleShopping,
    isInShoppingList,
    allDrinks,
    canMake,
    updateIngredient,
    resetIngredient,
    isIngredientEdited,
    getOriginalIngredient,
    getBarItemMeta,
    setBarItemMeta,
    deleteIngredient,
    setIngredientNotes,
  } = useApp()

  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const ingredient = id ? ingredientMap.get(id) : undefined
  const original = id ? getOriginalIngredient(id) : undefined
  const edited = id ? isIngredientEdited(id) : false

  const drinksWithIngredient = useMemo(() => {
    if (!ingredient) return []
    return allDrinks.filter((d) =>
      d.ingredients.some((req) => {
        if (req.brandName && req.brandName === ingredient.name) return true
        return req.genericName.toLowerCase() === ingredient.genericName.toLowerCase()
      })
    )
  }, [allDrinks, ingredient])

  const makeableWith = useMemo(
    () => drinksWithIngredient.filter((d) => canMake(d)),
    [drinksWithIngredient, canMake]
  )

  if (!ingredient) {
    return (
      <div className="page">
        <NavBar title="Ingredient" onBack={() => navigate(-1)} />
        <div className="empty-state"><h3>Ingredient not found</h3></div>
      </div>
    )
  }

  const inBar = isInBar(ingredient.id)
  const shelfMeta = getBarItemMeta(ingredient.id)
  const abv = getIngredientAbv(ingredient)
  const vintage = getEffectiveVintage(ingredient, shelfMeta.vintage)
  const wine = isWineIngredient(ingredient)

  return (
    <div className="page">
      <NavBar
        title={ingredient.name}
        onBack={() => navigate(-1)}
        actions={
          <button type="button" className="nav-btn" title="Edit" onClick={() => setEditing(true)}>
            ✎
          </button>
        }
      />

      <div className="detail-hero">
        <IngredientThumb ingredient={ingredient} size="lg" expandable />
        <div className="item-name">{ingredient.name}</div>
        {edited && (
          <span className="item-badge" style={{ display: 'inline-block', marginTop: 8 }}>
            Customized
          </span>
        )}
        {ingredient.company && (
          <p className="text-muted" style={{ marginTop: 4 }}>{ingredient.company}</p>
        )}
      </div>

      <div className="detail-meta">
        <div className="detail-row">
          <span className="detail-label">Generic type</span>
          <span className="detail-value">
            {ingredient.genericName}
            {original && original.genericName !== ingredient.genericName && (
              <span className="text-muted" style={{ fontWeight: 400, fontSize: 13 }}>
                {' '}(was {original.genericName})
              </span>
            )}
          </span>
        </div>
        {ingredient.company && (
          <div className="detail-row">
            <span className="detail-label">Company</span>
            <span className="detail-value">{ingredient.company}</span>
          </div>
        )}
        {ingredient.country && (
          <div className="detail-row">
            <span className="detail-label">Country</span>
            <span className="detail-value">
              {ingredient.country}
              {ingredient.state && `, ${ingredient.state}`}
            </span>
          </div>
        )}
        {ingredient.flavor && (
          <div className="detail-row">
            <span className="detail-label">Flavor</span>
            <span className="detail-value">{ingredient.flavor}</span>
          </div>
        )}
        {ingredient.type && (
          <div className="detail-row">
            <span className="detail-label">Spirit type</span>
            <span className="detail-value">{ingredient.type}</span>
          </div>
        )}
        <div className="detail-row">
          <span className="detail-label">Category</span>
          <span className="detail-value">{ingredient.category}</span>
        </div>
        {abv != null && (
          <div className="detail-row">
            <span className="detail-label">ABV</span>
            <span className="detail-value">{formatAbv(abv)}</span>
          </div>
        )}
        {(wine || vintage != null || ingredient.vintage != null) && (
          <div className="detail-row">
            <span className="detail-label">Vintage</span>
            <span className="detail-value">
              {inBar && wine ? (
                <input
                  type="number"
                  min={1900}
                  max={2100}
                  className="inline-date-input vintage-input"
                  placeholder="Year"
                  value={shelfMeta.vintage ?? ingredient.vintage ?? ''}
                  onChange={(e) => {
                    const raw = e.target.value
                    setBarItemMeta(ingredient.id, {
                      vintage: raw ? Math.round(Number(raw)) : undefined,
                    })
                  }}
                />
              ) : (
                vintage ?? ingredient.vintage ?? '—'
              )}
            </span>
          </div>
        )}
        {inBar && (
          <>
            <div className="detail-row">
              <span className="detail-label">Opened</span>
              <span className="detail-value">
                <input
                  type="date"
                  className="inline-date-input"
                  value={shelfMeta.openedOn?.slice(0, 10) ?? ''}
                  onChange={(e) => setBarItemMeta(ingredient.id, {
                    openedOn: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                  })}
                />
              </span>
            </div>
            <div className="detail-row detail-row--stack">
              <span className="detail-label">Stock level</span>
              <div className="stock-level-pills">
                {STOCK_LEVELS.map((level) => (
                  <button
                    key={level}
                    type="button"
                    className={`stock-pill ${shelfMeta.stockLevel === level ? 'active' : ''}`}
                    onClick={() => setBarItemMeta(ingredient.id, {
                      stockLevel: shelfMeta.stockLevel === level ? undefined : level,
                    })}
                  >
                    {STOCK_LABELS[level]}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="detail-actions">
        <button type="button" className="btn btn-primary" onClick={() => setEditing(true)}>
          Edit details
        </button>
        {inBar ? (
          <button type="button" className="btn btn-secondary" onClick={() => removeFromBar(ingredient.id)}>
            Remove from shelf
          </button>
        ) : (
          <button type="button" className="btn btn-secondary" onClick={() => addToBar(ingredient.id)}>
            Add to shelf
          </button>
        )}
        <Link
          to={`/drinks?ingredient=${encodeURIComponent(ingredient.genericName)}`}
          className="btn btn-secondary"
          style={{ textAlign: 'center', textDecoration: 'none' }}
        >
          Find recipes ({drinksWithIngredient.length})
        </Link>
        <button type="button" className="btn btn-secondary" onClick={() => toggleShopping(ingredient.id)}>
          {isInShoppingList(ingredient.id) ? 'Remove from shopping list' : 'Add to shopping list'}
        </button>
        <button
          type="button"
          className="btn btn-secondary btn-danger-outline"
          onClick={() => setConfirmDelete(true)}
        >
          Delete ingredient
        </button>
      </div>

      <CatalogNotesSection
        value={ingredient.notes ?? ''}
        onSave={(notes) => setIngredientNotes(ingredient.id, notes)}
        placeholder="Tasting notes, where you bought it, how you use it…"
      />

      {makeableWith.length > 0 && (
        <>
          <div className="section-header">Ready to pour ({makeableWith.length})</div>
          {makeableWith.slice(0, 10).map((d) => (
            <Link key={d.id} to={`/drinks/${d.id}`} className="list-item">
              <div className="item-name" style={{ fontSize: 15 }}>{d.name}</div>
            </Link>
          ))}
        </>
      )}

      {confirmDelete && (
        <ConfirmDeleteModal
          title={`Delete ${ingredient.name}?`}
          message="Removes this ingredient from your catalog and shelf. Restore it anytime from Settings → Deleted items."
          confirmLabel="Delete ingredient"
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => {
            deleteIngredient(ingredient.id)
            setConfirmDelete(false)
            navigate('/ingredients')
          }}
        />
      )}

      {editing && (
        <IngredientEditModal
          ingredient={ingredient}
          original={original}
          onSave={(patch) => updateIngredient(ingredient.id, patch)}
          onReset={original && edited ? () => resetIngredient(ingredient.id) : undefined}
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  )
}
