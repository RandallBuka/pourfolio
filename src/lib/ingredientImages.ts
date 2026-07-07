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

const typedMap = imageMap as Record<string, string>

function encodeCdb(name: string): string {
  return encodeURIComponent(name.trim())
}

export function cocktailDbImageUrl(name: string, size: 'Small' | 'Medium' = 'Medium'): string {
  return `https://www.thecocktaildb.com/images/ingredients/${encodeCdb(name)}-${size}.png`
}

function candidatesFor(ingredient: Ingredient): string[] {
  const out: string[] = []

  if (ingredient.image) out.push(ingredient.image)
  if (typedMap[ingredient.id]) out.push(typedMap[ingredient.id])

  const names = new Set<string>([
    ingredient.name,
    ingredient.genericName,
    ...(COCKTAILDB_ALIASES[ingredient.genericName] ?? []),
    ...(COCKTAILDB_ALIASES[ingredient.name] ?? []),
  ])

  // Brand: try first two words (e.g. "Jim Beam")
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
