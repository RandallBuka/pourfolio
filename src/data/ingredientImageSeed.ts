/** Full catalog export for image fetch script (core + extended JSON). */
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { CORE_SEED_INGREDIENTS } from './ingredients'
import type { Ingredient } from '../types'

const __dirname = dirname(fileURLToPath(import.meta.url))

function loadAllIngredients(): Array<Pick<Ingredient, 'id' | 'name' | 'genericName' | 'company'>> {
  const byId = new Map<string, Pick<Ingredient, 'id' | 'name' | 'genericName' | 'company'>>()
  for (const ing of CORE_SEED_INGREDIENTS) {
    byId.set(ing.id, { id: ing.id, name: ing.name, genericName: ing.genericName, company: ing.company })
  }
  try {
    const catalogPath = join(__dirname, '../../public/catalog/ingredients.json')
    const catalog = JSON.parse(readFileSync(catalogPath, 'utf8')) as Ingredient[]
    for (const ing of catalog) {
      if (!byId.has(ing.id)) {
        byId.set(ing.id, {
          id: ing.id,
          name: ing.name,
          genericName: ing.genericName,
          company: ing.company,
        })
      }
    }
  } catch {
    /* catalog optional during early setup */
  }
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name))
}

export const INGREDIENT_IMAGE_SEED = loadAllIngredients()
