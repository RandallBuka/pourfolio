import { SEED_INGREDIENTS } from '../data/ingredients'
import { enrichWithUsState } from '../data/ingredientStates'
import type { Ingredient, IngredientCategory, IngredientOverride } from '../types'

export type { IngredientOverride }

export function mergeIngredient(base: Ingredient, override?: IngredientOverride): Ingredient {
  if (!override) return base
  const merged = {
    ...base,
    ...override,
    id: base.id,
    isCustom: base.isCustom,
  }
  return enrichWithUsState(merged)
}

export function buildIngredientCatalog(
  customIngredients: Ingredient[],
  overrides: Record<string, IngredientOverride>,
  hiddenIds: string[]
): Ingredient[] {
  const hidden = new Set(hiddenIds)
  const catalog = SEED_INGREDIENTS.map((base) => mergeIngredient(base, overrides[base.id]))
  const custom = customIngredients.map((c) => enrichWithUsState({ ...c, isCustom: true as const }))
  return [...catalog, ...custom].filter((i) => !hidden.has(i.id))
}

export function isIngredientCustomized(
  id: string,
  overrides: Record<string, IngredientOverride>,
  customIngredients: Ingredient[]
): boolean {
  if (overrides[id]) return true
  return customIngredients.some((c) => c.id === id)
}

export function getSeedIngredient(id: string): Ingredient | undefined {
  return SEED_INGREDIENTS.find((i) => i.id === id)
}

export const GENERIC_NAME_SUGGESTIONS = [
  ...new Set(SEED_INGREDIENTS.map((i) => i.genericName)),
].sort()

export const INGREDIENT_CATEGORIES: IngredientCategory[] = [
  'Spirits',
  'Liqueurs',
  'Mixers',
  'Juices',
  'Fruits',
  'Garnishes',
  'Other',
]

export type IngredientEditForm = {
  name: string
  genericName: string
  company: string
  country: string
  state: string
  flavor: string
  type: string
  category: IngredientCategory
  abv: string
  vintage: string
  notes: string
}

export function ingredientToForm(ing: Ingredient): IngredientEditForm {
  return {
    name: ing.name,
    genericName: ing.genericName,
    company: ing.company ?? '',
    country: ing.country ?? '',
    state: ing.state ?? '',
    flavor: ing.flavor ?? '',
    type: ing.type ?? '',
    category: ing.category,
    abv: ing.abv != null ? String(ing.abv) : '',
    vintage: ing.vintage != null ? String(ing.vintage) : '',
    notes: ing.notes ?? '',
  }
}

export function formToPatch(form: IngredientEditForm): IngredientOverride {
  const country = form.country.trim() || undefined
  const isUs = country?.toLowerCase() === 'usa' || country?.toLowerCase() === 'us' || country?.toLowerCase() === 'united states'
  const abvRaw = form.abv.trim()
  const abv = abvRaw ? Number(abvRaw) : undefined
  const vintageRaw = form.vintage.trim()
  const vintage = vintageRaw ? Number(vintageRaw) : undefined
  return {
    name: form.name.trim(),
    genericName: form.genericName.trim(),
    company: form.company.trim() || undefined,
    country,
    state: isUs ? (form.state.trim() || undefined) : undefined,
    flavor: form.flavor.trim() || undefined,
    type: form.type.trim() || undefined,
    category: form.category,
    abv: abv != null && !Number.isNaN(abv) ? abv : undefined,
    vintage: vintage != null && !Number.isNaN(vintage) ? Math.round(vintage) : undefined,
    notes: form.notes.trim() || undefined,
  }
}
