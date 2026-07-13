import type { Drink } from '../types'
import imageMap from '../data/drink-images.json'
import { isProfessionalDrinkImageUrl } from './drinkImageQuality'

const typedMap = imageMap as Record<string, string>

function isAllowedDrinkImageUrl(drink: Pick<Drink, 'name'>, url: string): boolean {
  if (!url) return false
  return isProfessionalDrinkImageUrl(url, drink.name, drink.name)
}

export function getDrinkImageCandidates(drink: Pick<Drink, 'id' | 'name' | 'image'>): string[] {
  const out: string[] = []

  if (drink.image && isAllowedDrinkImageUrl(drink, drink.image)) out.push(drink.image)
  const mapped = typedMap[drink.id]
  if (mapped && isAllowedDrinkImageUrl(drink, mapped)) out.push(mapped)

  return [...new Set(out)]
}

export function getDrinkImageUrl(drink: Pick<Drink, 'id' | 'name' | 'image'>): string | undefined {
  return getDrinkImageCandidates(drink)[0]
}
