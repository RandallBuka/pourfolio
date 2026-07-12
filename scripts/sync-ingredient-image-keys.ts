/**
 * Ensure ingredient-images.json has a key for every catalog ingredient.
 * Existing URLs are preserved; missing entries get "".
 *
 * Run: npm run sync-image-keys
 */
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { INGREDIENT_IMAGE_SEED } from '../src/data/ingredientImageSeed.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '../src/data/ingredient-images.json')

function loadExistingMap(): Record<string, string> {
  if (!existsSync(OUT)) return {}
  try {
    return JSON.parse(readFileSync(OUT, 'utf8')) as Record<string, string>
  } catch {
    return {}
  }
}

function main() {
  const existing = loadExistingMap()
  const next: Record<string, string> = {}

  const sortedIds = INGREDIENT_IMAGE_SEED.map((ing) => ing.id).sort()
  for (const id of sortedIds) {
    next[id] = existing[id] ?? ''
  }

  const withUrl = Object.values(next).filter((v) => v.length > 0).length
  writeFileSync(OUT, `${JSON.stringify(next, null, 2)}\n`)
  console.log(`Wrote ${INGREDIENT_IMAGE_SEED.length} keys (${withUrl} with images)`)
}

main()
