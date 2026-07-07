import { useMemo } from 'react'
import type { Ingredient, IngredientCategory } from '../types'
import {
  EMPTY_SHOPPING_FILTERS,
  formatShoppingFilterPills,
  getShoppingFacetOptions,
  getShoppingFilterCount,
  toggleShoppingFilter,
  type ShoppingFilters,
} from '../lib/shoppingFilter'

interface Props {
  items: Ingredient[]
  filters: ShoppingFilters
  onChange: (filters: ShoppingFilters) => void
  onClose: () => void
  resultCount: number
}

export function ShoppingFilterPanel({ items, filters, onChange, onClose, resultCount }: Props) {
  const categoryOptions = useMemo(
    () => getShoppingFacetOptions(items, 'category', filters),
    [items, filters]
  )
  const genericOptions = useMemo(
    () => getShoppingFacetOptions(items, 'genericName', filters),
    [items, filters]
  )

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="filter-panel" onClick={(e) => e.stopPropagation()}>
        <div className="filter-panel-header">
          <div>
            <h3>Filter shopping list</h3>
            <p className="filter-panel-sub">{resultCount} items match</p>
          </div>
          <button type="button" className="nav-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {categoryOptions.length > 0 && (
          <div className="filter-section">
            <h4>Category</h4>
            <div className="filter-chips">
              {categoryOptions.map(({ value, count }) => (
                <button
                  key={value}
                  type="button"
                  className={`filter-chip ${filters.category.includes(value as IngredientCategory) ? 'active' : ''}`}
                  onClick={() => onChange(toggleShoppingFilter(filters, 'category', value))}
                >
                  {value} ({count})
                </button>
              ))}
            </div>
          </div>
        )}

        {genericOptions.length > 0 && (
          <div className="filter-section">
            <h4>Generic type</h4>
            <div className="filter-chips">
              {genericOptions.map(({ value, count }) => (
                <button
                  key={value}
                  type="button"
                  className={`filter-chip ${filters.genericName.includes(value) ? 'active' : ''}`}
                  onClick={() => onChange(toggleShoppingFilter(filters, 'genericName', value))}
                >
                  {value} ({count})
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="filter-panel-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => onChange({ ...EMPTY_SHOPPING_FILTERS })}
          >
            Clear all
          </button>
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Show {resultCount}
          </button>
        </div>
      </div>
    </div>
  )
}

export { formatShoppingFilterPills, getShoppingFilterCount, EMPTY_SHOPPING_FILTERS }
export type { ShoppingFilters }
