import { useMemo } from 'react'
import type { BarItemMeta, Ingredient } from '../types'
import {
  FILTER_FIELD_LABELS,
  FILTER_FIELD_ORDER,
  clearAllFilters,
  getActiveFilterCount,
  getFacetOptions,
  toggleFilterValue,
  type IngredientFilterField,
  type IngredientFilters,
} from '../lib/ingredientFilter'
import {
  OPENED_FILTER_LABELS,
  STOCK_LEVEL_LABELS,
  clearStockFilters,
  getOpenedFacetCounts,
  getStockFilterCount,
  getStockLevelFacetCounts,
  toggleOpenedFilter,
  toggleStockLevelFilter,
  type OpenedFilter,
  type StockFilters,
} from '../lib/stockFilter'

interface Props {
  items: Ingredient[]
  filters: IngredientFilters
  onChange: (filters: IngredientFilters) => void
  onClose: () => void
  onShelfOnly?: boolean
  onShelfOnlyChange?: (value: boolean) => void
  onShelfIds?: Set<string>
  resultCount: number
  stockFilters?: StockFilters
  onStockFiltersChange?: (filters: StockFilters) => void
  getBarItemMeta?: (id: string) => BarItemMeta
}
export function IngredientFilterPanel({
  items,
  filters,
  onChange,
  onClose,
  onShelfOnly,
  onShelfOnlyChange,
  onShelfIds,
  resultCount,
  stockFilters,
  onStockFiltersChange,
  getBarItemMeta,
}: Props) {
  const activeCount = getActiveFilterCount(filters, onShelfOnly)
  const stockCount = stockFilters ? getStockFilterCount(stockFilters) : 0
  const showStock = !!stockFilters && !!onStockFiltersChange && !!getBarItemMeta

  const stockLevelOptions = useMemo(() => {
    if (!showStock) return []
    return getStockLevelFacetCounts(items, getBarItemMeta!)
  }, [items, showStock, getBarItemMeta])

  const openedOptions = useMemo(() => {
    if (!showStock) return []
    return getOpenedFacetCounts(items, getBarItemMeta!)
  }, [items, showStock, getBarItemMeta])
  const sections = useMemo(() => {
    return FILTER_FIELD_ORDER.map((field) => ({
      field,
      label: FILTER_FIELD_LABELS[field],
      options: getFacetOptions(items, field, filters, { onShelfOnly }, onShelfIds),
    })).filter((s) => s.options.length > 0)
  }, [items, filters, onShelfOnly, onShelfIds])

  const toggle = (field: IngredientFilterField, value: string) => {
    onChange(toggleFilterValue(filters, field, value))
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="filter-panel" onClick={(e) => e.stopPropagation()}>
        <div className="filter-panel-header">
          <div>
            <h3>Filter ingredients</h3>
            <p className="filter-panel-sub">
              {resultCount} match · {activeCount + stockCount} filter{activeCount + stockCount !== 1 ? 's' : ''} active
            </p>
          </div>
          <button type="button" className="nav-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {onShelfOnlyChange && (
          <div className="filter-toggle-row">
            <span>On shelf only</span>
            <button
              type="button"
              className={`toggle ${onShelfOnly ? 'on' : ''}`}
              onClick={() => onShelfOnlyChange(!onShelfOnly)}
              aria-pressed={onShelfOnly}
            />
          </div>
        )}

        <div className="filter-panel-body">
          {showStock && stockFilters && (
            <>
              <div className="filter-section">
                <div className="filter-section-label">Stock level</div>
                <div className="filter-chips">
                  {stockLevelOptions.map(({ value, count }) => {
                    const active = stockFilters.stockLevel.includes(value)
                    return (
                      <button
                        key={value}
                        type="button"
                        className={`filter-chip ${active ? 'active' : ''}`}
                        onClick={() => onStockFiltersChange!(toggleStockLevelFilter(stockFilters, value))}
                      >
                        {STOCK_LEVEL_LABELS[value]}
                        <span className="filter-chip-count">{count}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="filter-section">
                <div className="filter-section-label">Opened date</div>
                <div className="filter-chips">
                  {openedOptions.map(({ value, count }) => {
                    const active = stockFilters.opened.includes(value)
                    return (
                      <button
                        key={value}
                        type="button"
                        className={`filter-chip ${active ? 'active' : ''}`}
                        onClick={() => onStockFiltersChange!(toggleOpenedFilter(stockFilters, value as OpenedFilter))}
                      >
                        {OPENED_FILTER_LABELS[value as OpenedFilter]}
                        <span className="filter-chip-count">{count}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </>
          )}

          {sections.map(({ field, label, options }) => (
            <div key={field} className="filter-section">
              <div className="filter-section-label">{label}</div>
              <div className="filter-chips">
                {options.map(({ value, count }) => {
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
              onChange(clearAllFilters())
              onShelfOnlyChange?.(false)
              if (stockFilters && onStockFiltersChange) onStockFiltersChange(clearStockFilters())
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
