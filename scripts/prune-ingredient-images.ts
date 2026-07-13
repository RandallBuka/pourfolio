/**
 * Remove low-quality image URLs AFTER brand-black-olives only.
 * Entries at/before the anchor are never modified.
 * Run: npm run prune-ingredient-images
 */
import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { isProfessionalIngredientImageUrl } from '../src/lib/ingredientImageQuality.ts'
import { INGREDIENT_IMAGE_ANCHOR_ID, isAfterIngredientImageAnchor } from '../src/lib/ingredientImageAnchor.ts'
import { CORE_SEED_INGREDIENTS } from '../src/data/ingredients.ts'
import type { Ingredient } from '../types'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '../src/data/ingredient-images.json')
const CATALOG = join(__dirname, '../public/catalog/ingredients.json')

function loadAllIngredients(): Map<string, Pick<Ingredient, 'name'>> {
  const byId = new Map<string, Pick<Ingredient, 'name'>>()
  for (const ing of CORE_SEED_INGREDIENTS) byId.set(ing.id, ing)
  const catalog = JSON.parse(readFileSync(CATALOG, 'utf8')) as Ingredient[]
  for (const ing of catalog) {
    if (!byId.has(ing.id)) byId.set(ing.id, ing)
  }
  return byId
}

function main() {
  const images = JSON.parse(readFileSync(OUT, 'utf8')) as Record<string, string>
  const ingredients = loadAllIngredients()
  let kept = 0
  let pruned = 0
  let protectedCount = 0

  for (const id of Object.keys(images)) {
    const url = images[id] ?? ''
    if (!isAfterIngredientImageAnchor(id)) {
      if (url) protectedCount++
      continue
    }
    if (!url) continue
    if (isProfessionalIngredientImageUrl(url, ingredients.get(id)?.name ?? '')) {
      kept++
      continue
    }
    images[id] = ''
    pruned++
  }

  const sorted: Record<string, string> = {}
  for (const id of Object.keys(images).sort()) {
    sorted[id] = images[id]
  }

  writeFileSync(OUT, `${JSON.stringify(sorted, null, 2)}\n`)
  console.log(`Anchor (protected): ${INGREDIENT_IMAGE_ANCHOR_ID}`)
  console.log(`Protected ${protectedCount} images at/before anchor`)
  console.log(`Kept ${kept} professional images after anchor`)
  console.log(`Pruned ${pruned} low-quality images after anchor`)
  console.log(`Empty: ${Object.values(sorted).filter((v) => !v).length}`)
}

main()
