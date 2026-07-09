import type { Ingredient } from '../types'
import { isLiquidIngredient } from './ingredientLiquid'

function randomIndex(max: number): number {
  if (max <= 1) return 0
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const buf = new Uint32Array(1)
    crypto.getRandomValues(buf)
    return buf[0] % max
  }
  return Math.floor(Math.random() * max)
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = randomIndex(i + 1)
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export type RandomShotResult =
  | { ok: true; ingredients: Ingredient[] }
  | { ok: false; reason: 'empty-bar' | 'no-liquids' }

/**
 * Pick a random shot combo from the bar. Always includes at least one liquid.
 * Count is clamped to available bar ingredients (minimum 1).
 */
export function pickRandomShotIngredients(
  ingredients: Ingredient[],
  count: number
): RandomShotResult {
  if (!ingredients.length) {
    return { ok: false, reason: 'empty-bar' }
  }

  const liquids = ingredients.filter(isLiquidIngredient)
  if (!liquids.length) {
    return { ok: false, reason: 'no-liquids' }
  }

  const targetCount = Math.min(Math.max(1, count), ingredients.length)
  const liquidPick = liquids[randomIndex(liquids.length)]

  if (targetCount === 1) {
    return { ok: true, ingredients: [liquidPick] }
  }

  const pool = ingredients.filter((ing) => ing.id !== liquidPick.id)
  const extra: Ingredient[] = []

  while (extra.length < targetCount - 1 && pool.length) {
    const idx = randomIndex(pool.length)
    extra.push(pool[idx])
    pool.splice(idx, 1)
  }

  return { ok: true, ingredients: shuffle([liquidPick, ...extra]) }
}
