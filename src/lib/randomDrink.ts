import type { Drink } from '../types'

const LAST_RANDOM_DRINK_KEY = 'pourfolio-last-random-drink-v1'

function randomIndex(max: number): number {
  if (max <= 1) return 0
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const buf = new Uint32Array(1)
    crypto.getRandomValues(buf)
    return buf[0] % max
  }
  return Math.floor(Math.random() * max)
}

function uniqueDrinks(drinks: Drink[]): Drink[] {
  const seen = new Set<string>()
  return drinks.filter((drink) => {
    if (seen.has(drink.id)) return false
    seen.add(drink.id)
    return true
  })
}

export function pickRandomMakeableDrink(
  drinks: Drink[],
  avoidId?: string | null
): Drink | undefined {
  const pool = uniqueDrinks(drinks)
  if (!pool.length) return undefined
  if (pool.length === 1) return pool[0]

  const storedAvoid = avoidId ?? loadLastRandomDrinkId()
  let candidates = storedAvoid
    ? pool.filter((d) => d.id !== storedAvoid)
    : pool
  if (!candidates.length) candidates = pool

  const picked = candidates[randomIndex(candidates.length)]
  saveLastRandomDrinkId(picked.id)
  return picked
}

export function loadLastRandomDrinkId(): string | null {
  try {
    return sessionStorage.getItem(LAST_RANDOM_DRINK_KEY)
  } catch {
    return null
  }
}

export function saveLastRandomDrinkId(id: string): void {
  try {
    sessionStorage.setItem(LAST_RANDOM_DRINK_KEY, id)
  } catch {
    // ignore storage errors
  }
}
