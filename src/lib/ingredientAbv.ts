import type { Ingredient } from '../types'

/** Typical ABV by generic type when not set on the bottle */
const DEFAULT_ABV_BY_GENERIC: Record<string, number> = {
  Vodka: 40,
  Gin: 40,
  Rum: 40,
  'Light Rum': 40,
  'Dark Rum': 40,
  Bourbon: 45,
  'Rye Whiskey': 45,
  Whiskey: 43,
  Scotch: 43,
  Tequila: 40,
  Brandy: 40,
  Cognac: 40,
  Liqueur: 25,
  Vermouth: 18,
  Bitters: 44,
  Wine: 12,
  'Red Wine': 13,
  'White Wine': 12,
  Champagne: 12,
  Prosecco: 11,
  Beer: 5,
  Soda: 0,
  Juice: 0,
}

export const ABV_BUCKET_LABELS = [
  'Non-alcoholic (0%)',
  'Low (1–20%)',
  'Standard (21–40%)',
  'High (41%+)',
] as const

export type AbvBucket = (typeof ABV_BUCKET_LABELS)[number]

export function isWineIngredient(ing: Pick<Ingredient, 'genericName' | 'name' | 'category'>): boolean {
  const g = ing.genericName.toLowerCase()
  const n = ing.name.toLowerCase()
  return /wine|champagne|prosecco|cava|sparkling/i.test(g) || /wine|champagne|prosecco|cava|sparkling/i.test(n)
}

export function getIngredientAbv(ing: Ingredient): number | undefined {
  if (ing.abv != null && !Number.isNaN(ing.abv)) return ing.abv
  return DEFAULT_ABV_BY_GENERIC[ing.genericName]
}

export function getAbvBucket(abv: number | undefined): AbvBucket | undefined {
  if (abv == null || Number.isNaN(abv)) return undefined
  if (abv <= 0) return 'Non-alcoholic (0%)'
  if (abv <= 20) return 'Low (1–20%)'
  if (abv <= 40) return 'Standard (21–40%)'
  return 'High (41%+)'
}

export function getIngredientAbvBucket(ing: Ingredient): AbvBucket | undefined {
  return getAbvBucket(getIngredientAbv(ing))
}

export function getEffectiveVintage(
  ing: Ingredient,
  shelfVintage?: number
): number | undefined {
  if (shelfVintage != null) return shelfVintage
  return ing.vintage
}

export function formatAbv(abv: number | undefined): string {
  if (abv == null || Number.isNaN(abv)) return ''
  return `${abv % 1 === 0 ? abv : abv.toFixed(1)}%`
}
