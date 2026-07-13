/**
 * Clear image URLs for alcoholic ingredients (Spirits/Liqueurs) whose ids come
 * after brand-black-velvet-canadian-whiskey in ingredient-images.json.
 *
 * Run: npm run clear-cz-alcohol-images
 */
import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { CORE_SEED_INGREDIENTS } from '../src/data/ingredients.ts'
import type { Ingredient } from '../types'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '../src/data/ingredient-images.json')
const CATALOG = join(__dirname, '../public/catalog/ingredients.json')

const ANCHOR_ID = 'brand-black-velvet-canadian-whiskey'
const ALCOHOL_CATEGORIES = new Set<Ingredient['category']>(['Spirits', 'Liqueurs'])

function isAlcohol(ing: Pick<Ingredient, 'category'>): boolean {
  return ALCOHOL_CATEGORIES.has(ing.category)
}

function loadAllIngredients(): Map<string, Ingredient> {
  const byId = new Map<string, Ingredient>()
  for (const ing of CORE_SEED_INGREDIENTS) {
    byId.set(ing.id, ing)
  }
  const catalog = JSON.parse(readFileSync(CATALOG, 'utf8')) as Ingredient[]
  for (const ing of catalog) {
    if (!byId.has(ing.id)) byId.set(ing.id, ing)
  }
  return byId
}

function main() {
  const images = JSON.parse(readFileSync(OUT, 'utf8')) as Record<string, string>
  const ingredients = loadAllIngredients()

  let cleared = 0
  let skippedNonAlcohol = 0
  let skippedBeforeAnchor = 0

  for (const id of Object.keys(images).sort()) {
    if (id <= ANCHOR_ID) {
      skippedBeforeAnchor++
      continue
    }

    const ing = ingredients.get(id)
    if (!ing || !isAlcohol(ing)) {
      skippedNonAlcohol++
      continue
    }

    if (images[id].length > 0) {
      images[id] = ''
      cleared++
    }
  }

  const sorted: Record<string, string> = {}
  for (const id of Object.keys(images).sort()) {
    sorted[id] = images[id]
  }

  writeFileSync(OUT, `${JSON.stringify(sorted, null, 2)}\n`)
  const withUrl = Object.values(sorted).filter((v) => v.length > 0).length
  console.log(`Anchor: ${ANCHOR_ID}`)
  console.log(`Cleared ${cleared} alcohol images after anchor`)
  console.log(`Kept ${skippedBeforeAnchor} entries at/before anchor`)
  console.log(`Skipped ${skippedNonAlcohol} non-alcohol entries after anchor`)
  console.log(`Remaining images: ${withUrl}`)
}

main()
