import type { Ingredient, RecipeIngredient } from '../types'
import { normalize } from './matching'

/** Catalog bottles that satisfy a premium recipe's brand requirement. */
export function ingredientMatchesBrand(ing: Ingredient, brand: string): boolean {
  const target = normalize(brand)
  const name = normalize(ing.name)
  if (!target || !name) return false
  if (name === target) return true
  if (name.startsWith(`${target} `)) return true
  if (target.startsWith(`${name} `)) return true
  return false
}

export function applyIngredientBrandFilter(items: Ingredient[], brand: string): Ingredient[] {
  if (!brand.trim()) return items
  return items.filter((ing) => ingredientMatchesBrand(ing, brand))
}

export function applyIngredientBrandIdFilter(items: Ingredient[], brandId: string): Ingredient[] {
  if (!brandId.trim()) return items
  return items.filter((ing) => ing.id === brandId)
}

export function getRecipeIngredientBrowseUrl(req: RecipeIngredient): string {
  if (req.mode === 'premium' && req.brandId) {
    return `/ingredients?brandId=${encodeURIComponent(req.brandId)}`
  }
  if (req.mode === 'premium' && req.brandName) {
    return `/ingredients?brand=${encodeURIComponent(req.brandName)}`
  }
  return `/ingredients?genericName=${encodeURIComponent(req.genericName)}`
}
