import type { Ingredient } from '../types'
import { isUsCountry } from './usStates'

/** Distillery / brand HQ state for USA catalog ingredients (by seed id) */
export const INGREDIENT_US_STATES: Record<string, string> = {
  // Kentucky bourbon & rye
  'brand-1792-bourbon-aged-12-years': 'Kentucky',
  'brand-jim-beam-bourbon': 'Kentucky',
  'brand-jim-beam-red-stag-bourbon': 'Kentucky',
  'brand-maker-s-mark-bourbon': 'Kentucky',
  'brand-woodford-reserve-bourbon': 'Kentucky',
  'brand-bulleit-bourbon': 'Kentucky',
  'brand-wild-turkey-bourbon': 'Kentucky',
  'brand-rittenhouse-rye': 'Kentucky',
  'brand-bulleit-rye': 'Kentucky',

  // Other spirits
  'brand-indiana-vodka': 'Indiana',
  'brand-pinnacle-cookie-dough-vodka': 'Indiana',
  'brand-three-olives-vanilla-vodka': 'California',
  'brand-seagram-s-raspberry-twisted-gin': 'Illinois',
  'brand-zephyr-blu-gin': 'California',
  'brand-coconut-jack-coconut-rum': 'Florida',
  'brand-seagram-s-citrus-rum': 'Illinois',

  // Liqueurs
  'brand-dekuyper-apple-barrel-schnapps': 'Connecticut',
  'brand-99-whipped-cream-schnapps': 'Louisiana',
  'brand-southern-comfort-cherry': 'Louisiana',

  // Mixers
  'gen-cherry-coke': 'Georgia',
  'brand-moxie': 'Maine',
  'gen-stirrings-simple-syrup': 'Massachusetts',
}

/** Fallback: company name → US state when id not in map */
const COMPANY_US_STATES: Record<string, string> = {
  'Jim Beam': 'Kentucky',
  "Maker's Mark": 'Kentucky',
  'Brown-Forman': 'Kentucky',
  'Heaven Hill': 'Kentucky',
  'Bardstown': 'Kentucky',
  'Campari': 'Kentucky',
  'Sazerac': 'Louisiana',
  'Beam Suntory': 'Illinois',
  'Proximo': 'California',
  'Moxie': 'Maine',
  'Stirrings': 'Massachusetts',
  'Coca-Cola': 'Georgia',
  'Indiana': 'Indiana',
  'Coconut Jack': 'Florida',
  'Zephyr': 'California',
}

export function resolveUsState(ing: Pick<Ingredient, 'id' | 'company' | 'country'>): string | undefined {
  if (!isUsCountry(ing.country)) return undefined
  if (INGREDIENT_US_STATES[ing.id]) return INGREDIENT_US_STATES[ing.id]
  if (ing.company && COMPANY_US_STATES[ing.company]) return COMPANY_US_STATES[ing.company]
  return undefined
}

export function enrichWithUsState<T extends Ingredient>(ing: T): T {
  if (ing.state) return ing
  const state = resolveUsState(ing)
  return state ? { ...ing, state } : ing
}
