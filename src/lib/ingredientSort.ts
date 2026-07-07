import type { BarItemMeta, Ingredient, StockLevel } from '../types'

export type StockSortOption =
  | 'name'
  | 'name-desc'
  | 'stock-low'
  | 'stock-high'
  | 'opened-new'
  | 'opened-old'

export const STOCK_SORT_LABELS: Record<StockSortOption, string> = {
  name: 'Name (A–Z)',
  'name-desc': 'Name (Z–A)',
  'stock-low': 'Low stock first',
  'stock-high': 'Full bottles first',
  'opened-new': 'Recently opened',
  'opened-old': 'Oldest opened',
}

const STOCK_RANK: Record<StockLevel | 'unset', number> = {
  empty: 0,
  low: 1,
  half: 2,
  full: 3,
  unset: 4,
}

function openedTimestamp(meta: BarItemMeta): number {
  if (!meta.openedOn) return 0
  const ts = Date.parse(meta.openedOn)
  return Number.isFinite(ts) ? ts : 0
}

export function sortBarIngredients(
  items: Ingredient[],
  sort: StockSortOption,
  getMeta: (id: string) => BarItemMeta
): Ingredient[] {
  const copy = [...items]
  switch (sort) {
    case 'name':
      return copy.sort((a, b) => a.name.localeCompare(b.name))
    case 'name-desc':
      return copy.sort((a, b) => b.name.localeCompare(a.name))
    case 'stock-low':
      return copy.sort((a, b) => {
        const ra = STOCK_RANK[getMeta(a.id).stockLevel ?? 'unset']
        const rb = STOCK_RANK[getMeta(b.id).stockLevel ?? 'unset']
        return ra - rb || a.name.localeCompare(b.name)
      })
    case 'stock-high':
      return copy.sort((a, b) => {
        const ra = STOCK_RANK[getMeta(a.id).stockLevel ?? 'unset']
        const rb = STOCK_RANK[getMeta(b.id).stockLevel ?? 'unset']
        return rb - ra || a.name.localeCompare(b.name)
      })
    case 'opened-new':
      return copy.sort((a, b) => {
        const ta = openedTimestamp(getMeta(a.id))
        const tb = openedTimestamp(getMeta(b.id))
        return tb - ta || a.name.localeCompare(b.name)
      })
    case 'opened-old':
      return copy.sort((a, b) => {
        const ta = openedTimestamp(getMeta(a.id))
        const tb = openedTimestamp(getMeta(b.id))
        if (ta === 0 && tb === 0) return a.name.localeCompare(b.name)
        if (ta === 0) return 1
        if (tb === 0) return -1
        return ta - tb || a.name.localeCompare(b.name)
      })
    default:
      return copy
  }
}
