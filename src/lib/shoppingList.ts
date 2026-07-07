import type { Ingredient, RecipeIngredient } from '../types'
import type { IngredientMatchContext } from '../types'
import { findMatchingBarIngredient } from './matching'

export function resolveIngredientIdForRequirement(
  req: RecipeIngredient,
  ingredientMap: Map<string, Ingredient>
): string | undefined {
  if (req.brandId && ingredientMap.has(req.brandId)) return req.brandId
  const byBrand = [...ingredientMap.values()].find((i) => i.name === req.brandName)
  if (byBrand) return byBrand.id
  return [...ingredientMap.values()].find((i) => i.genericName === req.genericName)?.id
}

export function getMissingIngredientIdsForDrink(
  drink: { ingredients: RecipeIngredient[] },
  matchContext: IngredientMatchContext,
  ingredientMap: Map<string, Ingredient>
): string[] {
  const ids = new Set<string>()
  for (const req of drink.ingredients) {
    if (req.optional) continue
    if (findMatchingBarIngredient(req, matchContext)) continue
    const id = resolveIngredientIdForRequirement(req, ingredientMap)
    if (id) ids.add(id)
  }
  return [...ids]
}

export function getMissingIngredientIdsForDrinks(
  drinks: Array<{ ingredients: RecipeIngredient[] }>,
  matchContext: IngredientMatchContext,
  ingredientMap: Map<string, Ingredient>
): string[] {
  const ids = new Set<string>()
  for (const drink of drinks) {
    for (const id of getMissingIngredientIdsForDrink(drink, matchContext, ingredientMap)) {
      ids.add(id)
    }
  }
  return [...ids]
}

export function addIdsToShoppingList(current: string[], ids: string[]): string[] {
  const next = [...current]
  for (const id of ids) {
    if (!next.includes(id)) next.push(id)
  }
  return next
}
