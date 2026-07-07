import type { Ingredient, IngredientCategory } from '../types'
import { applyIngredientSearch } from './ingredientFilter'

export interface ShoppingFilters {
  category: IngredientCategory[]
  genericName: string[]
}

export const EMPTY_SHOPPING_FILTERS: ShoppingFilters = {
  category: [],
  genericName: [],
}

export function applyShoppingFilters(items: Ingredient[], filters: ShoppingFilters): Ingredient[] {
  return items.filter((ing) => {
    if (filters.category.length && !filters.category.includes(ing.category)) return false
    if (filters.genericName.length && !filters.genericName.includes(ing.genericName)) return false
    return true
  })
}

export function applyShoppingListFilters(
  items: Ingredient[],
  filters: ShoppingFilters,
  search: string
): Ingredient[] {
  let result = applyShoppingFilters(items, filters)
  result = applyIngredientSearch(result, search)
  return result
}

export function getShoppingFacetOptions(
  items: Ingredient[],
  field: 'category' | 'genericName',
  filters: ShoppingFilters
): Array<{ value: string; count: number }> {
  const filtersWithoutField: ShoppingFilters = {
    category: field === 'category' ? [] : [...filters.category],
    genericName: field === 'genericName' ? [] : [...filters.genericName],
  }
  const pool = applyShoppingFilters(items, filtersWithoutField)

  const counts = new Map<string, number>()
  for (const ing of pool) {
    const val = field === 'category' ? ing.category : ing.genericName
    counts.set(val, (counts.get(val) ?? 0) + 1)
  }

  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => a.value.localeCompare(b.value))
}

export function getShoppingFilterCount(filters: ShoppingFilters): number {
  return filters.category.length + filters.genericName.length
}

export function formatShoppingFilterPills(
  filters: ShoppingFilters
): Array<{ key: string; label: string; field: 'category' | 'genericName'; value: string }> {
  const pills: Array<{ key: string; label: string; field: 'category' | 'genericName'; value: string }> = []
  for (const value of filters.category) {
    pills.push({ key: `category:${value}`, label: `Category: ${value}`, field: 'category', value })
  }
  for (const value of filters.genericName) {
    pills.push({ key: `generic:${value}`, label: `Type: ${value}`, field: 'genericName', value })
  }
  return pills
}

export function toggleShoppingFilter(
  filters: ShoppingFilters,
  field: 'category' | 'genericName',
  value: string
): ShoppingFilters {
  const current = filters[field] as string[]
  const next = current.includes(value)
    ? current.filter((v) => v !== value)
    : [...current, value]
  return { ...filters, [field]: next as never }
}
