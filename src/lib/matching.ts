import type { Ingredient, RecipeIngredient, IngredientMatchContext } from '../types'

/** Substitution groups — owning any member satisfies any other when substitution allowed */
const SUBSTITUTION_GROUPS: string[][] = [
  ['Bourbon', 'Rye Whiskey', 'Whiskey', 'Canadian Whisky', 'Scotch'],
  ['Vodka'],
  ['Gin'],
  ['Rum', 'Light Rum', 'Dark Rum', 'White Rum', 'Gold Rum'],
  ['Tequila', 'Blanco Tequila', 'Gold Tequila'],
  ['Brandy', 'Cognac'],
  ['Lime', 'Lime Juice'],
  ['Lemon', 'Lemon Juice'],
  ['Orange', 'Orange Juice'],
  ['Simple Syrup', 'Sugar', 'Sugar Syrup'],
  ['Bitters', 'Angostura Bitters'],
  ['Champagne', 'Prosecco', 'Sparkling Wine'],
  ['Coffee', 'Coffee Liqueur', 'Kahlua'],
  ['Cream', 'Heavy Cream', 'Half-and-half'],
  ['Water', 'Soda Water', 'Club Soda', 'Sparkling Water'],
  ['Triple Sec', 'Cointreau', 'Orange Liqueur', 'Curacao'],
  ['Vermouth', 'Sweet Vermouth', 'Dry Vermouth'],
]

const groupIndex = new Map<string, number>()
SUBSTITUTION_GROUPS.forEach((group, i) => {
  group.forEach((name) => groupIndex.set(normalize(name), i))
})

export function normalize(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function sameSubstitutionGroup(a: string, b: string): boolean {
  const ga = groupIndex.get(normalize(a))
  const gb = groupIndex.get(normalize(b))
  return ga !== undefined && gb !== undefined && ga === gb
}

export interface MatchExplanation {
  kind: 'exact-brand' | 'brand-name' | 'generic' | 'substitution'
  message: string
}

export function explainMatch(required: RecipeIngredient, matched: Ingredient): MatchExplanation {
  if (required.brandId && matched.id === required.brandId) {
    return { kind: 'exact-brand', message: `Exact bottle on your shelf (${matched.name})` }
  }
  if (required.brandName && normalize(matched.name) === normalize(required.brandName)) {
    return { kind: 'brand-name', message: `Matches the specified brand (${matched.name})` }
  }
  if (normalize(matched.genericName) === normalize(required.genericName)) {
    return { kind: 'generic', message: `Matches as ${required.genericName} — you have ${matched.name}` }
  }
  if (sameSubstitutionGroup(matched.genericName, required.genericName)) {
    return {
      kind: 'substitution',
      message: `Works as a substitute: your ${matched.name} (${matched.genericName}) stands in for ${required.genericName}`,
    }
  }
  return { kind: 'generic', message: `On your shelf as ${matched.name}` }
}

export function findSubstituteOptions(
  required: RecipeIngredient,
  ctx: IngredientMatchContext
): Ingredient[] {
  if (findMatchingBarIngredient(required, ctx)) return []

  const barIngredients = [...ctx.barIngredientIds]
    .map((id) => ctx.allIngredients.get(id))
    .filter((i): i is Ingredient => !!i)

  return barIngredients.filter((owned) => {
    if (genericsMatch(owned.genericName, required.genericName)) return false
    if (!required.allowGenericSubstitution) return false
    return sameSubstitutionGroup(owned.genericName, required.genericName)
  })
}

export function substitutionPeerGenerics(genericName: string): string[] {
  const groupId = groupIndex.get(normalize(genericName))
  if (groupId === undefined) return [genericName]
  return SUBSTITUTION_GROUPS[groupId]
}

export function genericsMatch(a: string, b: string): boolean {
  const na = normalize(a)
  const nb = normalize(b)
  if (na === nb) return true
  if (na.includes(nb) || nb.includes(na)) return true

  const ga = groupIndex.get(na)
  const gb = groupIndex.get(nb)
  if (ga !== undefined && gb !== undefined && ga === gb) return true

  return false
}

export function barHasIngredient(
  required: RecipeIngredient,
  ctx: IngredientMatchContext
): boolean {
  const barIngredients = [...ctx.barIngredientIds]
    .map((id) => ctx.allIngredients.get(id))
    .filter((i): i is Ingredient => !!i)

  // Exact brand match
  if (required.brandId && ctx.barIngredientIds.has(required.brandId)) {
    return true
  }

  if (required.brandName) {
    const brandMatch = barIngredients.some(
      (i) => normalize(i.name) === normalize(required.brandName!)
    )
    if (brandMatch) return true
  }

  // Generic match
  const genericMatch = barIngredients.some((i) =>
    genericsMatch(i.genericName, required.genericName)
  )
  if (genericMatch) return true

  if (!required.allowGenericSubstitution) return false

  // Broader substitution within bar
  return barIngredients.some((owned) => {
    if (!required.allowGenericSubstitution) return false
    return genericsMatch(owned.genericName, required.genericName)
  })
}

export function findMatchingBarIngredient(
  required: RecipeIngredient,
  ctx: IngredientMatchContext
): Ingredient | undefined {
  const barIngredients = [...ctx.barIngredientIds]
    .map((id) => ctx.allIngredients.get(id))
    .filter((i): i is Ingredient => !!i)

  if (required.brandId) {
    const exact = barIngredients.find((i) => i.id === required.brandId)
    if (exact) return exact
  }

  if (required.brandName) {
    const brand = barIngredients.find(
      (i) => normalize(i.name) === normalize(required.brandName!)
    )
    if (brand) return brand
  }

  return barIngredients.find((i) =>
    genericsMatch(i.genericName, required.genericName)
  )
}

export function getMissingIngredients(
  required: RecipeIngredient[],
  ctx: IngredientMatchContext
): RecipeIngredient[] {
  return required.filter((r) => !r.optional && !barHasIngredient(r, ctx))
}

export function canMakeDrink(
  ingredients: RecipeIngredient[],
  ctx: IngredientMatchContext
): boolean {
  return getMissingIngredients(ingredients, ctx).length === 0
}
