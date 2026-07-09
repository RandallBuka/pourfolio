import type { Ingredient, IngredientCategory } from '../types'

const SOLID_CATEGORIES: ReadonlySet<IngredientCategory> = new Set(['Fruits', 'Garnishes'])

/** Pourable bar items suitable for a shot (spirits, liqueurs, mixers, juices, syrups, etc.). */
export function isLiquidIngredient(ingredient: Ingredient): boolean {
  return !SOLID_CATEGORIES.has(ingredient.category)
}
