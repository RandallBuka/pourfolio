import type { Ingredient } from '../types'
import { isUsCountry } from '../data/usStates'
import { getIngredientAbvBucket, isWineIngredient } from './ingredientAbv'

export type IngredientFilterField =
  | 'category'
  | 'genericName'
  | 'company'
  | 'country'
  | 'state'
  | 'flavor'
  | 'type'
  | 'abv'
  | 'vintage'

export const FILTER_FIELD_LABELS: Record<IngredientFilterField, string> = {
  category: 'Category',
  genericName: 'Generic type',
  company: 'Company',
  country: 'Country',
  state: 'State (USA)',
  flavor: 'Flavor',
  type: 'Spirit type',
  abv: 'ABV',
  vintage: 'Vintage',
}

export const FILTER_FIELD_ORDER: IngredientFilterField[] = [
  'category',
  'genericName',
  'type',
  'abv',
  'vintage',
  'country',
  'state',
  'company',
  'flavor',
]

export interface IngredientFilters {
  category: string[]
  genericName: string[]
  company: string[]
  country: string[]
  state: string[]
  flavor: string[]
  type: string[]
  abv: string[]
  vintage: string[]
}

export interface IngredientFilterOptions {
  onShelfOnly?: boolean
}

export const EMPTY_INGREDIENT_FILTERS: IngredientFilters = {
  category: [],
  genericName: [],
  company: [],
  country: [],
  state: [],
  flavor: [],
  type: [],
  abv: [],
  vintage: [],
}

function fieldValue(ing: Ingredient, field: IngredientFilterField): string | undefined {
  switch (field) {
    case 'category':
      return ing.category
    case 'genericName':
      return ing.genericName
    case 'company':
      return ing.company
    case 'country':
      return ing.country
    case 'state':
      return isUsCountry(ing.country) ? ing.state : undefined
    case 'flavor':
      return ing.flavor
    case 'type':
      return ing.type
    case 'abv':
      return getIngredientAbvBucket(ing)
    case 'vintage':
      return isWineIngredient(ing) && ing.vintage != null ? String(ing.vintage) : undefined
    default:
      return undefined
  }
}

function matchesField(ing: Ingredient, field: IngredientFilterField, selected: string[]): boolean {
  if (selected.length === 0) return true
  const val = fieldValue(ing, field)
  if (!val) return false
  return selected.includes(val)
}

export function applyIngredientFilters(
  items: Ingredient[],
  filters: IngredientFilters,
  options: IngredientFilterOptions = {},
  onShelfIds?: Set<string>
): Ingredient[] {
  return items.filter((ing) => {
    if (options.onShelfOnly && onShelfIds && !onShelfIds.has(ing.id)) return false
    return (
      matchesField(ing, 'category', filters.category) &&
      matchesField(ing, 'genericName', filters.genericName) &&
      matchesField(ing, 'company', filters.company) &&
      matchesField(ing, 'country', filters.country) &&
      matchesField(ing, 'state', filters.state) &&
      matchesField(ing, 'flavor', filters.flavor) &&
      matchesField(ing, 'type', filters.type) &&
      matchesField(ing, 'abv', filters.abv) &&
      matchesField(ing, 'vintage', filters.vintage)
    )
  })
}

export function applyIngredientSearch(items: Ingredient[], query: string): Ingredient[] {
  if (!query.trim()) return items
  const q = query.toLowerCase()
  return items.filter((ing) => {
    const haystack = [
      ing.name,
      ing.genericName,
      ing.company,
      ing.country,
      ing.state,
      ing.flavor,
      ing.type,
      ing.category,
      ing.abv != null ? `${ing.abv}%` : '',
      ing.vintage != null ? String(ing.vintage) : '',
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    return haystack.includes(q)
  })
}

export function getActiveFilterCount(filters: IngredientFilters, onShelfOnly?: boolean): number {
  let n = Object.values(filters).reduce((sum, arr) => sum + arr.length, 0)
  if (onShelfOnly) n += 1
  return n
}

export function getFacetOptions(
  items: Ingredient[],
  field: IngredientFilterField,
  filters: IngredientFilters,
  options: IngredientFilterOptions = {},
  onShelfIds?: Set<string>
): Array<{ value: string; count: number }> {
  const filtersWithoutField = { ...filters, [field]: [] as string[] }
  const pool = applyIngredientFilters(items, filtersWithoutField, options, onShelfIds)

  const counts = new Map<string, number>()
  for (const ing of pool) {
    const val = fieldValue(ing, field)
    if (!val) continue
    counts.set(val, (counts.get(val) ?? 0) + 1)
  }

  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => a.value.localeCompare(b.value))
}

export function toggleFilterValue(
  filters: IngredientFilters,
  field: IngredientFilterField,
  value: string
): IngredientFilters {
  const current = filters[field]
  const next = current.includes(value)
    ? current.filter((v) => v !== value)
    : [...current, value]
  return { ...filters, [field]: next }
}

export function clearAllFilters(): IngredientFilters {
  return { ...EMPTY_INGREDIENT_FILTERS }
}

export function formatActiveFilters(
  filters: IngredientFilters,
  onShelfOnly?: boolean
): Array<{ key: string; label: string; field?: IngredientFilterField; value?: string }> {
  const pills: Array<{ key: string; label: string; field?: IngredientFilterField; value?: string }> = []
  if (onShelfOnly) {
    pills.push({ key: 'onShelf', label: 'On shelf only' })
  }
  for (const field of FILTER_FIELD_ORDER) {
    for (const value of filters[field]) {
      pills.push({
        key: `${field}:${value}`,
        label: `${FILTER_FIELD_LABELS[field]}: ${value}`,
        field,
        value,
      })
    }
  }
  return pills
}
