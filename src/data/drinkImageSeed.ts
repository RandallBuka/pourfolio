/** Full catalog export for drink image fetch script (core + extended JSON). */
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { CORE_SEED_DRINKS } from './drinks'
import type { Drink } from '../types'

const __dirname = dirname(fileURLToPath(import.meta.url))

export function loadAllDrinksForImages(): Array<Pick<Drink, 'id' | 'name'>> {
  const byId = new Map<string, Pick<Drink, 'id' | 'name'>>()
  for (const drink of CORE_SEED_DRINKS) {
    byId.set(drink.id, { id: drink.id, name: drink.name })
  }
  try {
    const catalogPath = join(__dirname, '../../public/catalog/drinks.json')
    const catalog = JSON.parse(readFileSync(catalogPath, 'utf8')) as Drink[]
    for (const drink of catalog) {
      if (!byId.has(drink.id)) {
        byId.set(drink.id, { id: drink.id, name: drink.name })
      }
    }
  } catch {
    /* catalog optional during early setup */
  }
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name))
}
