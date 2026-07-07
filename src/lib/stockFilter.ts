import type { BarItemMeta, Ingredient, StockLevel } from '../types'

export type StockLevelFilter = StockLevel | 'unset'

export type OpenedFilter = 'never' | 'last30' | 'last90' | 'last180' | 'older180'

export interface StockFilters {
  stockLevel: StockLevelFilter[]
  opened: OpenedFilter[]
}

export const EMPTY_STOCK_FILTERS: StockFilters = {
  stockLevel: [],
  opened: [],
}

export const STOCK_LEVEL_LABELS: Record<StockLevelFilter, string> = {
  full: 'Full',
  half: 'Half',
  low: 'Low',
  empty: 'Empty',
  unset: 'Not set',
}

export const OPENED_FILTER_LABELS: Record<OpenedFilter, string> = {
  never: 'Never opened',
  last30: 'Opened ≤ 30 days',
  last90: 'Opened ≤ 90 days',
  last180: 'Opened ≤ 6 months',
  older180: 'Opened > 6 months',
}

function daysSince(iso: string): number {
  const opened = new Date(iso)
  const now = new Date()
  return Math.floor((now.getTime() - opened.getTime()) / (1000 * 60 * 60 * 24))
}

function matchesOpened(meta: BarItemMeta, selected: OpenedFilter[]): boolean {
  if (selected.length === 0) return true
  if (!meta.openedOn) return selected.includes('never')
  const days = daysSince(meta.openedOn)
  return selected.some((filter) => {
    switch (filter) {
      case 'never':
        return false
      case 'last30':
        return days <= 30
      case 'last90':
        return days <= 90
      case 'last180':
        return days <= 180
      case 'older180':
        return days > 180
      default:
        return false
    }
  })
}

function matchesStockLevel(meta: BarItemMeta, selected: StockLevelFilter[]): boolean {
  if (selected.length === 0) return true
  const level = meta.stockLevel ?? 'unset'
  return selected.includes(level)
}

export function applyStockFilters(
  items: Ingredient[],
  filters: StockFilters,
  getMeta: (id: string) => BarItemMeta
): Ingredient[] {
  return items.filter((ing) => {
    const meta = getMeta(ing.id)
    return matchesStockLevel(meta, filters.stockLevel) && matchesOpened(meta, filters.opened)
  })
}

export function getStockFilterCount(filters: StockFilters): number {
  return filters.stockLevel.length + filters.opened.length
}

export function formatStockFilterPills(
  filters: StockFilters
): Array<{ key: string; label: string; kind: 'stockLevel' | 'opened'; value: string }> {
  const pills: Array<{ key: string; label: string; kind: 'stockLevel' | 'opened'; value: string }> = []
  for (const value of filters.stockLevel) {
    pills.push({
      key: `stock:${value}`,
      label: `Stock: ${STOCK_LEVEL_LABELS[value]}`,
      kind: 'stockLevel',
      value,
    })
  }
  for (const value of filters.opened) {
    pills.push({
      key: `opened:${value}`,
      label: `Opened: ${OPENED_FILTER_LABELS[value]}`,
      kind: 'opened',
      value,
    })
  }
  return pills
}

export function toggleStockLevelFilter(filters: StockFilters, value: StockLevelFilter): StockFilters {
  const current = filters.stockLevel
  const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value]
  return { ...filters, stockLevel: next }
}

export function toggleOpenedFilter(filters: StockFilters, value: OpenedFilter): StockFilters {
  const current = filters.opened
  const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value]
  return { ...filters, opened: next }
}

export function clearStockFilters(): StockFilters {
  return { ...EMPTY_STOCK_FILTERS }
}

export function getStockLevelFacetCounts(
  items: Ingredient[],
  getMeta: (id: string) => BarItemMeta
): Array<{ value: StockLevelFilter; count: number }> {
  const counts = new Map<StockLevelFilter, number>()
  for (const ing of items) {
    const level = getMeta(ing.id).stockLevel ?? 'unset'
    counts.set(level, (counts.get(level) ?? 0) + 1)
  }
  return (['full', 'half', 'low', 'empty', 'unset'] as StockLevelFilter[])
    .map((value) => ({ value, count: counts.get(value) ?? 0 }))
    .filter((row) => row.count > 0)
}

export function getOpenedFacetCounts(
  items: Ingredient[],
  getMeta: (id: string) => BarItemMeta
): Array<{ value: OpenedFilter; count: number }> {
  const counts: Record<OpenedFilter, number> = {
    never: 0,
    last30: 0,
    last90: 0,
    last180: 0,
    older180: 0,
  }
  for (const ing of items) {
    const meta = getMeta(ing.id)
    if (!meta.openedOn) {
      counts.never += 1
      continue
    }
    const days = daysSince(meta.openedOn)
    if (days <= 30) counts.last30 += 1
    if (days <= 90) counts.last90 += 1
    if (days <= 180) counts.last180 += 1
    if (days > 180) counts.older180 += 1
  }
  return (Object.keys(counts) as OpenedFilter[])
    .map((value) => ({ value, count: counts[value] }))
    .filter((row) => row.count > 0)
}
