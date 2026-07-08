/**
 * Fetches ingredient bottle images with strict matching (no generic spirit placeholders for brands).
 * Run: npm run fetch-images
 * Resume: npm run fetch-images -- --start=87
 */
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { INGREDIENT_IMAGE_SEED } from '../src/data/ingredientImageSeed.ts'
import { resolveIngredientImageWithTimeout } from './lib/ingredientImageResolver.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '../src/data/ingredient-images.json')
const SAVE_EVERY = 25

function parseStartArg(): number {
  for (const arg of process.argv) {
    if (arg.startsWith('--start=')) {
      const value = Number.parseInt(arg.slice('--start='.length), 10)
      if (Number.isFinite(value) && value >= 1) return value
    }
  }
  const idx = process.argv.indexOf('--start')
  if (idx !== -1) {
    const value = Number.parseInt(process.argv[idx + 1] ?? '1', 10)
    if (Number.isFinite(value) && value >= 1) return value
  }
  return 1
}

function loadExistingMap(): Record<string, string> {
  if (!existsSync(OUT)) return {}
  try {
    return JSON.parse(readFileSync(OUT, 'utf8')) as Record<string, string>
  } catch {
    return {}
  }
}

function saveMap(map: Record<string, string>) {
  writeFileSync(OUT, JSON.stringify(map, null, 2))
}

async function main() {
  const startAt = parseStartArg()
  const startIndex = startAt - 1
  const map = loadExistingMap()
  let found = Object.keys(map).length
  let processed = 0

  console.log(`Loaded ${found} existing images`)
  if (startAt > 1) {
    console.log(`Resuming at item ${startAt}/${INGREDIENT_IMAGE_SEED.length}`)
  }

  for (let i = startIndex; i < INGREDIENT_IMAGE_SEED.length; i++) {
    const ing = INGREDIENT_IMAGE_SEED[i]
    process.stdout.write(`\r[${i + 1}/${INGREDIENT_IMAGE_SEED.length}] ${ing.name.slice(0, 36).padEnd(36)}`)

    const url = await resolveIngredientImageWithTimeout(ing)
    processed++

    if (url) {
      map[ing.id] = url
      found = Object.keys(map).length
    } else if (map[ing.id]) {
      delete map[ing.id]
      found = Object.keys(map).length
    }

    if (processed % SAVE_EVERY === 0) {
      saveMap(map)
    }

    await new Promise((r) => setTimeout(r, 180))
  }

  saveMap(map)
  console.log(`\nResolved ${found}/${INGREDIENT_IMAGE_SEED.length} images`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
