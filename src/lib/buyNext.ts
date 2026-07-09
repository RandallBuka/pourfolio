import {
  canMakeDrink,
  findMatchingBarIngredient,
  getMissingIngredients,
  normalize,
  substitutionPeerGenerics,
} from './matching'
import type { Drink, Ingredient, IngredientMatchContext, RecipeIngredient } from '../types'

export interface BuyNextSuggestion {
  ingredientId: string
  ingredient: Ingredient
  unlocks: number
  sampleDrinks: string[]
}

interface IngredientIndexes {
  byGeneric: Map<string, Ingredient[]>
  byName: Map<string, Ingredient[]>
}

function buildIngredientIndexes(ingredientMap: Map<string, Ingredient>): IngredientIndexes {
  const byGeneric = new Map<string, Ingredient[]>()
  const byName = new Map<string, Ingredient[]>()

  for (const ing of ingredientMap.values()) {
    const g = normalize(ing.genericName)
    const gList = byGeneric.get(g) ?? []
    gList.push(ing)
    byGeneric.set(g, gList)

    const n = normalize(ing.name)
    const nList = byName.get(n) ?? []
    nList.push(ing)
    byName.set(n, nList)
  }

  return { byGeneric, byName }
}

function catalogIngredientsForRequirement(
  req: RecipeIngredient,
  indexes: IngredientIndexes,
  ingredientMap: Map<string, Ingredient>,
  barIds: Set<string>,
  excludeIds: Set<string>
): Ingredient[] {
  const results: Ingredient[] = []
  const seen = new Set<string>()

  const add = (ing: Ingredient) => {
    if (barIds.has(ing.id) || excludeIds.has(ing.id) || seen.has(ing.id)) return
    seen.add(ing.id)
    results.push(ing)
  }

  if (req.brandId) {
    const exact = ingredientMap.get(req.brandId)
    if (exact) add(exact)
    return results
  }

  if (req.brandName) {
    for (const ing of indexes.byName.get(normalize(req.brandName)) ?? []) {
      add(ing)
    }
    return results
  }

  const target = normalize(req.genericName)
  for (const ing of indexes.byGeneric.get(target) ?? []) {
    add(ing)
  }

  if (req.allowGenericSubstitution) {
    for (const peer of substitutionPeerGenerics(req.genericName)) {
      const peerKey = normalize(peer)
      if (peerKey === target) continue
      for (const ing of indexes.byGeneric.get(peerKey) ?? []) {
        add(ing)
      }
    }
  }

  return results
}

/** Drinks that are close to makeable — one new bottle often unlocks these. */
const MAX_MISSING_FOR_UNLOCK = 4
const MAX_CANDIDATES_TO_SCORE = 500

export function rankBuyNextSuggestions(
  allDrinks: Drink[],
  matchContext: IngredientMatchContext,
  ingredientMap: Map<string, Ingredient>,
  options: { limit?: number; excludeIds?: Set<string> } = {}
): BuyNextSuggestion[] {
  const { limit = 12, excludeIds = new Set<string>() } = options
  const barIds = matchContext.barIngredientIds
  const indexes = buildIngredientIndexes(ingredientMap)

  const nearDrinks: Array<{ drink: Drink; missing: RecipeIngredient[] }> = []
  for (const drink of allDrinks) {
    if (canMakeDrink(drink.ingredients, matchContext)) continue
    const missing = getMissingIngredients(drink.ingredients, matchContext)
    if (missing.length > 0 && missing.length <= MAX_MISSING_FOR_UNLOCK) {
      nearDrinks.push({ drink, missing })
    }
  }

  const candidateDrinks = new Map<string, Set<Drink>>()

  for (const { drink, missing } of nearDrinks) {
    for (const req of missing) {
      for (const ing of catalogIngredientsForRequirement(
        req,
        indexes,
        ingredientMap,
        barIds,
        excludeIds
      )) {
        const drinks = candidateDrinks.get(ing.id) ?? new Set<Drink>()
        drinks.add(drink)
        candidateDrinks.set(ing.id, drinks)
      }
    }
  }

  const scored: BuyNextSuggestion[] = []

  const rankedCandidates = [...candidateDrinks.entries()]
    .sort((a, b) => b[1].size - a[1].size)
    .slice(0, MAX_CANDIDATES_TO_SCORE)

  for (const [ingredientId, drinks] of rankedCandidates) {
    const ingredient = ingredientMap.get(ingredientId)
    if (!ingredient) continue

    const simulatedBar = new Set(barIds)
    simulatedBar.add(ingredientId)
    const simulatedContext: IngredientMatchContext = {
      barIngredientIds: simulatedBar,
      allIngredients: ingredientMap,
    }

    const unlocked: string[] = []
    for (const drink of drinks) {
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

export function rankClosestDrinks(
  allDrinks: Drink[],
  matchContext: IngredientMatchContext,
  favoriteIds: Set<string>,
  options: { limit?: number } = {}
): Array<{ drink: Drink; missingCount: number }> {
  const { limit = 12 } = options

  return allDrinks
    .map((drink) => ({
      drink,
      missingCount: drink.ingredients.filter(
        (req) => !req.optional && !findMatchingBarIngredient(req, matchContext)
      ).length,
    }))
    .filter(({ missingCount }) => missingCount > 0)
    .sort((a, b) => {
      const aFav = favoriteIds.has(a.drink.id) ? 0 : 1
      const bFav = favoriteIds.has(b.drink.id) ? 0 : 1
      if (aFav !== bFav) return aFav - bFav
      if (a.missingCount !== b.missingCount) return a.missingCount - b.missingCount
      return a.drink.name.localeCompare(b.drink.name)
    })
    .slice(0, limit)
}
