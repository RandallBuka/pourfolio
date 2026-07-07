import type { Drink } from '../types'

export type DrinkFilterField = 'type' | 'glass' | 'ingredient'

export const DRINK_FILTER_FIELD_LABELS: Record<DrinkFilterField, string> = {
  type: 'Type',
  glass: 'Glass',
  ingredient: 'Ingredient',
}

export const DRINK_FILTER_FIELD_ORDER: DrinkFilterField[] = ['type', 'glass', 'ingredient']

export interface DrinkFilters {
  type: string[]
  glass: string[]
  ingredient: string[]
}

export interface DrinkFilterOptions {
  readyToPourOnly?: boolean
  favoritesOnly?: boolean
}

export interface DrinkFilterContext {
  canMake?: (drink: Drink) => boolean
  favoriteIds?: Set<string>
}

export const EMPTY_DRINK_FILTERS: DrinkFilters = {
  type: [],
  glass: [],
  ingredient: [],
}

function fieldValues(drink: Drink, field: DrinkFilterField): string[] {
  switch (field) {
    case 'type':
      return drink.type ? [drink.type] : []
    case 'glass':
      return drink.glass ? [drink.glass] : []
    case 'ingredient':
      return [...new Set(drink.ingredients.map((i) => i.genericName))]
    default:
      return []
  }
}

function matchesField(drink: Drink, field: DrinkFilterField, selected: string[]): boolean {
  if (selected.length === 0) return true
  const vals = fieldValues(drink, field)
  return vals.some((v) => selected.includes(v))
}

export function applyDrinkFilters(
  items: Drink[],
  filters: DrinkFilters,
  options: DrinkFilterOptions = {},
  context: DrinkFilterContext = {}
): Drink[] {
  return items.filter((drink) => {
    if (options.readyToPourOnly && context.canMake && !context.canMake(drink)) return false
    if (options.favoritesOnly && context.favoriteIds && !context.favoriteIds.has(drink.id)) {
      return false
    }
    return (
      matchesField(drink, 'type', filters.type) &&
      matchesField(drink, 'glass', filters.glass) &&
      matchesField(drink, 'ingredient', filters.ingredient)
    )
  })
}

export function applyDrinkSearch(items: Drink[], query: string): Drink[] {
  if (!query.trim()) return items
  const q = query.toLowerCase()
  return items.filter((drink) => {
    const haystack = [
      drink.name,
      drink.type,
      drink.glass,
      drink.instructions,
      ...drink.ingredients.map((i) => i.genericName),
      ...drink.ingredients.map((i) => i.brandName).filter(Boolean),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    return haystack.includes(q)
  })
}

export function getActiveDrinkFilterCount(
  filters: DrinkFilters,
  readyToPourOnly?: boolean,
  favoritesOnly?: boolean
): number {
  let n = Object.values(filters).reduce((sum, arr) => sum + arr.length, 0)
  if (readyToPourOnly) n += 1
  if (favoritesOnly) n += 1
  return n
}

export function getDrinkFacetOptions(
  items: Drink[],
  field: DrinkFilterField,
  filters: DrinkFilters,
  options: DrinkFilterOptions = {},
  context: DrinkFilterContext = {}
): Array<{ value: string; count: number }> {
  const filtersWithoutField = { ...filters, [field]: [] as string[] }
  const pool = applyDrinkFilters(items, filtersWithoutField, options, context)

  const counts = new Map<string, number>()
  for (const drink of pool) {
    for (const val of fieldValues(drink, field)) {
      counts.set(val, (counts.get(val) ?? 0) + 1)
    }
  }

  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => a.value.localeCompare(b.value))
}

export function toggleDrinkFilterValue(
  filters: DrinkFilters,
  field: DrinkFilterField,
  value: string
): DrinkFilters {
  const current = filters[field]
  const next = current.includes(value)
    ? current.filter((v) => v !== value)
    : [...current, value]
  return { ...filters, [field]: next }
}

export function clearAllDrinkFilters(): DrinkFilters {
  return { ...EMPTY_DRINK_FILTERS }
}

export function formatActiveDrinkFilters(
  filters: DrinkFilters,
  readyToPourOnly?: boolean,
  favoritesOnly?: boolean
): Array<{ key: string; label: string; field?: DrinkFilterField; value?: string }> {
  const pills: Array<{ key: string; label: string; field?: DrinkFilterField; value?: string }> = []
  if (readyToPourOnly) {
    pills.push({ key: 'readyToPour', label: 'Ready to pour' })
  }
  if (favoritesOnly) {
    pills.push({ key: 'favorites', label: 'Favorites only' })
  }
  for (const field of DRINK_FILTER_FIELD_ORDER) {
    for (const value of filters[field]) {
      pills.push({
        key: `${field}:${value}`,
        label: `${DRINK_FILTER_FIELD_LABELS[field]}: ${value}`,
        field,
        value,
      })
    }
  }
  return pills
}
