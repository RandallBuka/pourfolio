/**
 * Clear image URLs for alcoholic ingredients (Spirits/Liqueurs) whose names start with C–Z.
 * Run: npm run clear-cz-alcohol-images
 */
import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { CORE_SEED_INGREDIENTS } from '../src/data/ingredients.ts'
import type { Ingredient } from '../src/types'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '../src/data/ingredient-images.json')
const CATALOG = join(__dirname, '../public/catalog/ingredients.json')

const ALCOHOL_CATEGORIES = new Set<Ingredient['category']>(['Spirits', 'Liqueurs'])

function firstAlpha(name: string): string | null {
  const match = name.trim().match(/[A-Za-z]/)
  return match ? match[0].toUpperCase() : null
}

function isCzAlcohol(ing: Pick<Ingredient, 'name' | 'category'>): boolean {
  if (!ALCOHOL_CATEGORIES.has(ing.category)) return false
  const letter = firstAlpha(ing.name)
  return letter != null && letter >= 'C' && letter <= 'Z'
}

function loadAllIngredients(): Ingredient[] {
  const byId = new Map<string, Ingredient>()
  for (const ing of CORE_SEED_INGREDIENTS) {
    byId.set(ing.id, ing)
  }
  const catalog = JSON.parse(readFileSync(CATALOG, 'utf8')) as Ingredient[]
  for (const ing of catalog) {
    if (!byId.has(ing.id)) byId.set(ing.id, ing)
  }
  return [...byId.values()]
}

function main() {
  const images = JSON.parse(readFileSync(OUT, 'utf8')) as Record<string, string>
  const ingredients = loadAllIngredients()

  let cleared = 0
  let kept = 0

  for (const ing of ingredients) {
    if (!isCzAlcohol(ing)) continue
    if (!images[ing.id]) continue
    if (images[ing.id].length > 0) {
      images[ing.id] = ''
      cleared++
    } else {
      kept++
    }
  }

  const sorted: Record<string, string> = {}
  for (const id of Object.keys(images).sort()) {
    sorted[id] = images[id]
  }

  writeFileSync(OUT, `${JSON.stringify(sorted, null, 2)}\n`)
  const withUrl = Object.values(sorted).filter((v) => v.length > 0).length
  console.log(`Cleared ${cleared} C–Z alcohol images`)
  console.log(`Remaining images: ${withUrl}`)
}

main()
