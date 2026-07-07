import { useMemo } from 'react'
import type { Drink } from '../types'
import {
  DRINK_FILTER_FIELD_LABELS,
  DRINK_FILTER_FIELD_ORDER,
  clearAllDrinkFilters,
  getActiveDrinkFilterCount,
  getDrinkFacetOptions,
  toggleDrinkFilterValue,
  type DrinkFilterContext,
  type DrinkFilterField,
  type DrinkFilters,
} from '../lib/drinkFilter'

interface Props {
  items: Drink[]
  filters: DrinkFilters
  onChange: (filters: DrinkFilters) => void
  onClose: () => void
  readyToPourOnly?: boolean
  onReadyToPourOnlyChange?: (value: boolean) => void
  favoritesOnly?: boolean
  onFavoritesOnlyChange?: (value: boolean) => void
  context?: DrinkFilterContext
  resultCount: number
}

export function DrinkFilterPanel({
  items,
  filters,
  onChange,
  onClose,
  readyToPourOnly,
  onReadyToPourOnlyChange,
  favoritesOnly,
  onFavoritesOnlyChange,
  context,
  resultCount,
}: Props) {
  const activeCount = getActiveDrinkFilterCount(filters, readyToPourOnly, favoritesOnly)
  const options = { readyToPourOnly, favoritesOnly }

  const sections = useMemo(() => {
    return DRINK_FILTER_FIELD_ORDER.map((field) => ({
      field,
      label: DRINK_FILTER_FIELD_LABELS[field],
      options: getDrinkFacetOptions(items, field, filters, options, context),
    })).filter((s) => s.options.length > 0)
  }, [items, filters, readyToPourOnly, favoritesOnly, context])

  const toggle = (field: DrinkFilterField, value: string) => {
    onChange(toggleDrinkFilterValue(filters, field, value))
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="filter-panel" onClick={(e) => e.stopPropagation()}>
        <div className="filter-panel-header">
          <div>
            <h3>Filter recipes</h3>
            <p className="filter-panel-sub">
              {resultCount} match · {activeCount} filter{activeCount !== 1 ? 's' : ''} active
            </p>
          </div>
          <button type="button" className="nav-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {onReadyToPourOnlyChange && (
          <div className="filter-toggle-row">
            <span>Ready to pour</span>
            <button
              type="button"
              className={`toggle ${readyToPourOnly ? 'on' : ''}`}
              onClick={() => onReadyToPourOnlyChange(!readyToPourOnly)}
              aria-pressed={readyToPourOnly}
            />
          </div>
        )}

        {onFavoritesOnlyChange && (
          <div className="filter-toggle-row">
            <span>Favorites only</span>
            <button
              type="button"
              className={`toggle ${favoritesOnly ? 'on' : ''}`}
              onClick={() => onFavoritesOnlyChange(!favoritesOnly)}
              aria-pressed={favoritesOnly}
            />
          </div>
        )}

        <div className="filter-panel-body">
          {sections.map(({ field, label, options: facetOptions }) => (
            <div key={field} className="filter-section">
              <div className="filter-section-label">{label}</div>
              <div className="filter-chips">
                {facetOptions.map(({ value, count }) => {
                  const active = filters[field].includes(value)
                  return (
                    <button
                      key={value}
                      type="button"
                      className={`filter-chip ${active ? 'active' : ''}`}
                      onClick={() => toggle(field, value)}
                    >
                      {value}
                      <span className="filter-chip-count">{count}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="filter-panel-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              onChange(clearAllDrinkFilters())
              onReadyToPourOnlyChange?.(false)
              onFavoritesOnlyChange?.(false)
            }}
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
