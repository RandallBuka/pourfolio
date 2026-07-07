import type { Drink } from '../types'
import imageMap from '../data/drink-images.json'

const typedMap = imageMap as Record<string, string>

export function getDrinkImageCandidates(drink: Pick<Drink, 'id' | 'name' | 'image'>): string[] {
  const out: string[] = []

  if (drink.image) out.push(drink.image)
  if (typedMap[drink.id]) out.push(typedMap[drink.id])

  return [...new Set(out)]
}

export function getDrinkImageUrl(drink: Pick<Drink, 'id' | 'name' | 'image'>): string | undefined {
  return getDrinkImageCandidates(drink)[0]
}
