import type { Ingredient } from '../types'
import imageMap from '../data/ingredient-images.json'

/** CocktailDB uses ingredient names with spaces, often lowercased */
const COCKTAILDB_ALIASES: Record<string, string[]> = {
  'Rye Whiskey': ['Rye', 'Rye Whiskey', 'Blended whiskey'],
  'Light Rum': ['Light rum', 'Rum', 'White rum'],
  'Dark Rum': ['Dark rum', 'Rum'],
  'Coffee Liqueur': ['Kahlua', 'Coffee liqueur', 'Coffee brandy'],
  'Irish Cream': ['Baileys irish cream', 'Irish cream'],
  'Herbal Liqueur': ['Jägermeister', 'Jagermeister'],
  'Cinnamon Schnapps': ['Goldschlager'],
  'Triple Sec': ['Cointreau', 'Triple sec'],
  'Orange Liqueur': ['Grand Marnier', 'Blue Curacao'],
  'Bitter Liqueur': ['Campari', 'Aperol'],
  'Sweet Vermouth': ['Sweet Vermouth', 'Dubonnet Rouge'],
  'Dry Vermouth': ['Dry Vermouth'],
  'Bitters': ['Bitters', 'Angostura'],
  'Soda Water': ['Carbonated water', 'Soda water'],
  'Cola': ['Coca-Cola', 'Cola'],
  'Cognac': ['Cognac', 'Brandy'],
  'Scotch': ['Scotch', 'Blended Scotch', 'Johnnie Walker'],
  'Prosecco': ['Champagne', 'Prosecco'],
  'Simple Syrup': ['Grenadine', 'Sugar syrup'],
  'Cream': ['Heavy cream', 'Milk'],
  Egg: ['Egg', 'Egg white'],
  'Egg White': ['Egg white', 'Egg'],
}

const GENERIC_CDB_SPIRITS =
  /\/ingredients\/(Vodka|Gin|Rum|Bourbon|Whiskey|Whisky|Scotch|Tequila|Brandy|Cognac|Liqueur|Schnapps|Vermouth|Bitters|Champagne|Prosecco|Wine|Cider|Beer)-(?:Medium|Small)\.png/i

const BAD_IMAGE_URL =
  /(wine_glass|cocktail|in_glass|_glass\.|hands?|people|person|lineup|shelf|smirnoff|distillery|panoramio|geograph)/i

const typedMap = imageMap as Record<string, string>

function encodeCdb(name: string): string {
  return encodeURIComponent(name.trim())
}

export function cocktailDbImageUrl(name: string, size: 'Small' | 'Medium' = 'Medium'): string {
  return `https://www.thecocktaildb.com/images/ingredients/${encodeCdb(name)}-${size}.png`
}

function isBranded(ingredient: Ingredient): boolean {
  return ingredient.name.trim().toLowerCase() !== ingredient.genericName.trim().toLowerCase()
}

function isAllowedImageUrl(ingredient: Ingredient, url: string): boolean {
  if (!url) return false
  if (BAD_IMAGE_URL.test(url)) return false
  if (isBranded(ingredient) && GENERIC_CDB_SPIRITS.test(url)) return false
  return true
}

function candidatesFor(ingredient: Ingredient): string[] {
  const out: string[] = []

  if (ingredient.image && isAllowedImageUrl(ingredient, ingredient.image)) {
    out.push(ingredient.image)
  }

  const mapped = typedMap[ingredient.id]
  if (mapped && isAllowedImageUrl(ingredient, mapped)) {
    out.push(mapped)
  }

  // Branded bottles: never fall back to generic spirit icons or alias guesses.
  if (isBranded(ingredient)) {
    out.push(cocktailDbImageUrl(ingredient.name, 'Medium'))
    out.push(cocktailDbImageUrl(ingredient.name, 'Small'))
    return [...new Set(out)]
  }

  const names = new Set<string>([
    ingredient.name,
    ingredient.genericName,
    ...(COCKTAILDB_ALIASES[ingredient.genericName] ?? []),
    ...(COCKTAILDB_ALIASES[ingredient.name] ?? []),
  ])

  const parts = ingredient.name.split(/\s+/)
  if (parts.length > 2) names.add(`${parts[0]} ${parts[1]}`)

  for (const n of names) {
    out.push(cocktailDbImageUrl(n, 'Medium'))
    out.push(cocktailDbImageUrl(n, 'Small'))
  }

  return [...new Set(out)]
}

export function getIngredientImageCandidates(ingredient: Ingredient): string[] {
  return candidatesFor(ingredient)
}

export function getIngredientImageUrl(ingredient: Ingredient): string | undefined {
  return candidatesFor(ingredient)[0]
}
