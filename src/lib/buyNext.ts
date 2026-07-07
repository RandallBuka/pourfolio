import { canMakeDrink } from './matching'
import type { Drink, Ingredient, IngredientMatchContext } from '../types'

export interface BuyNextSuggestion {
  ingredientId: string
  ingredient: Ingredient
  unlocks: number
  sampleDrinks: string[]
}

export function rankBuyNextSuggestions(
  allDrinks: Drink[],
  matchContext: IngredientMatchContext,
  ingredientMap: Map<string, Ingredient>,
  options: { limit?: number; excludeIds?: Set<string> } = {}
): BuyNextSuggestion[] {
  const { limit = 12, excludeIds = new Set<string>() } = options
  const barIds = matchContext.barIngredientIds
  const notMakeable = allDrinks.filter((d) => !canMakeDrink(d.ingredients, matchContext))

  const candidateIds = new Set<string>()
  for (const drink of notMakeable) {
    for (const req of drink.ingredients) {
      if (req.optional) continue
      for (const ing of ingredientMap.values()) {
        if (barIds.has(ing.id) || excludeIds.has(ing.id)) continue
        const gMatch = ing.genericName.toLowerCase() === req.genericName.toLowerCase()
        const bMatch = req.brandName && ing.name.toLowerCase() === req.brandName.toLowerCase()
        if (gMatch || bMatch) candidateIds.add(ing.id)
      }
    }
  }

  const scored: BuyNextSuggestion[] = []

  for (const ingredientId of candidateIds) {
    const ingredient = ingredientMap.get(ingredientId)
    if (!ingredient) continue

    const simulatedBar = new Set(barIds)
    simulatedBar.add(ingredientId)
    const simulatedContext: IngredientMatchContext = {
      barIngredientIds: simulatedBar,
      allIngredients: ingredientMap,
    }

    const unlocked: string[] = []
    for (const drink of notMakeable) {
      if (canMakeDrink(drink.ingredients, simulatedContext)) {
        unlocked.push(drink.name)
      }
    }

    if (unlocked.length === 0) continue

    scored.push({
      ingredientId,
      ingredient,
      unlocks: unlocked.length,
      sampleDrinks: unlocked.slice(0, 3),
    })
  }

  return scored
    .sort((a, b) => b.unlocks - a.unlocks || a.ingredient.name.localeCompare(b.ingredient.name))
    .slice(0, limit)
}
