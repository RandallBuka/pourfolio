import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { NavBar } from '../components/NavBar'
import { BarcodeScanModal } from '../components/BarcodeScanModal'
import {
  EMPTY_SHOPPING_FILTERS,
  ShoppingFilterPanel,
  formatShoppingFilterPills,
  getShoppingFilterCount,
  type ShoppingFilters,
} from '../components/ShoppingFilterPanel'
import { FilterPills, ListFilterToolbar } from '../components/ListFilterToolbar'
import { IngredientThumb } from '../lib/ui'
import { applyShoppingListFilters } from '../lib/shoppingFilter'
import { useApp } from '../context/AppContext'
import { findIngredientByBarcode } from '../lib/ingredientBarcode'

export function ShoppingListPage() {
  const navigate = useNavigate()
  const {
    state,
    allIngredients,
    ingredientMap,
    toggleShopping,
    toggleShoppingChecked,
    isShoppingChecked,
    clearShoppingChecked,
    clearShoppingList,
    addToBar,
    isInBar,
  } = useApp()
  const [showScan, setShowScan] = useState(false)
  const [scanMessage, setScanMessage] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<ShoppingFilters>({ ...EMPTY_SHOPPING_FILTERS })
  const [showFilters, setShowFilters] = useState(false)

  const items = useMemo(() => {
    return state.shoppingList
      .map((id) => ingredientMap.get(id))
      .filter((i): i is NonNullable<typeof i> => !!i)
  }, [state.shoppingList, ingredientMap])

  const filtered = useMemo(
    () => applyShoppingListFilters(items, filters, search),
    [items, filters, search]
  )

  const filterCount = getShoppingFilterCount(filters)
  const activePills = formatShoppingFilterPills(filters)

  const checkedCount = (state.shoppingChecked ?? []).length
  const pending = filtered.filter((i) => !isShoppingChecked(i.id))

  const removePill = (pill: { field: 'category' | 'genericName'; value: string }) => {
    setFilters((f) => ({
      ...f,
      [pill.field]: f[pill.field].filter((v) => v !== pill.value),
    }))
  }

  const markFoundAndCheck = (ingredientId: string) => {
    toggleShoppingChecked(ingredientId)
    if (!isInBar(ingredientId)) addToBar(ingredientId)
    setScanMessage('Added to shelf and checked off!')
  }

  return (
    <div className="page">
      <NavBar title="Shopping List" onBack={() => navigate(-1)} />

      <div className="shopping-summary">
        <p>
          {items.length === 0
            ? 'Your list is empty'
            : `${pending.length} shown · ${checkedCount} in cart · ${items.length} total`}
        </p>
        {items.length > 0 && (
          <div className="shopping-summary-actions">
            {checkedCount > 0 && (
              <button type="button" className="btn btn-sm btn-secondary" onClick={clearShoppingChecked}>
                Uncheck all
              </button>
            )}
            <button type="button" className="btn btn-sm btn-secondary" onClick={clearShoppingList}>
              Clear list
            </button>
          </div>
        )}
      </div>

      {items.length > 0 && (
        <ListFilterToolbar
          search={search}
          onSearchChange={setSearch}
          placeholder="Search shopping list..."
          filterCount={filterCount}
          onFilterClick={() => setShowFilters(true)}
        >
          <FilterPills
            pills={activePills.map((p) => ({ key: p.key, label: p.label, field: p.field, value: p.value }))}
            onRemove={(pill) => {
              if (pill.field && pill.value) {
                removePill({ field: pill.field as 'category' | 'genericName', value: pill.value })
              }
            }}
          />
        </ListFilterToolbar>
      )}

      {scanMessage && <p className="shopping-flash">{scanMessage}</p>}

      {items.length === 0 ? (
        <div className="empty-state">
          <div className="icon">🛒</div>
          <h3>Nothing to buy</h3>
          <p>Add missing ingredients from What I&apos;m Missing or any drink recipe</p>
          <Link to="/need" className="btn btn-primary empty-state-cta">
            What I&apos;m Missing
          </Link>
        </div>
      ) : (
        <>
          <div className="section-header">{filtered.length} items</div>

          <div className="list-container">
            {filtered.map((ing) => {
              const checked = isShoppingChecked(ing.id)
              return (
                <div key={ing.id} className={`list-item shopping-item ${checked ? 'shopping-item--checked' : ''}`}>
                  <button
                    type="button"
                    className={`shopping-check ${checked ? 'checked' : ''}`}
                    onClick={() => toggleShoppingChecked(ing.id)}
                    aria-label={checked ? 'Uncheck' : 'Mark found'}
                  >
                    {checked ? '✓' : ''}
                  </button>
                  <Link to={`/ingredients/${ing.id}`} className="shopping-item-link">
                    <IngredientThumb ingredient={ing} />
                    <div className="item-info">
                      <div className="item-name">{ing.name}</div>
                      <div className="item-subtitle">{ing.genericName}</div>
                    </div>
                  </Link>
                  <button type="button" className="btn btn-sm btn-secondary" onClick={() => toggleShopping(ing.id)}>
                    Remove
                  </button>
                </div>
              )
            })}
          </div>

          {filtered.length === 0 && (
            <p className="shopping-flash">No items match your search or filters.</p>
          )}

          <div className="detail-actions">
            <button type="button" className="btn btn-primary" onClick={() => { setScanMessage(null); setShowScan(true) }}>
              Scan to check off
            </button>
          </div>
        </>
      )}

      {showFilters && (
        <ShoppingFilterPanel
          items={items}
          filters={filters}
          onChange={setFilters}
          onClose={() => setShowFilters(false)}
          resultCount={filtered.length}
        />
      )}

      {showScan && (
        <BarcodeScanModal
          onClose={() => setShowScan(false)}
          onScanned={(barcode) => {
            const ing = findIngredientByBarcode(allIngredients, barcode)
            if (ing && state.shoppingList.includes(ing.id)) {
              markFoundAndCheck(ing.id)
              setShowScan(false)
              return true
            }
            setScanMessage('Scanned item is not on your shopping list')
            return false
          }}
        />
      )}
    </div>
  )
}
