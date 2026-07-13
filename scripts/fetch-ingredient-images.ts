/**
 * Fetches white-background bottle images for ingredients AFTER brand-black-olives only.
 * Skips user-curated entries at/before the anchor. Never modifies those URLs.
 * Run: npm run fetch-images
 * Resume: npm run fetch-images -- --start=87
 */
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { INGREDIENT_IMAGE_SEED } from '../src/data/ingredientImageSeed.ts'
import { INGREDIENT_IMAGE_ANCHOR_ID } from '../src/lib/ingredientImageAnchor.ts'
import { isAfterIngredientImageAnchor } from '../src/lib/ingredientImageAnchor.ts'
import { resolveIngredientImageWithTimeout } from './lib/ingredientImageResolver.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '../src/data/ingredient-images.json')
const SAVE_EVERY = 25
const DEFAULT_CONCURRENCY = 3

function parseIntArg(flag: string, fallback: number): number {
  for (const arg of process.argv) {
    if (arg.startsWith(`${flag}=`)) {
      const value = Number.parseInt(arg.slice(flag.length + 1), 10)
      if (Number.isFinite(value) && value >= 1) return value
    }
  }
  const idx = process.argv.indexOf(flag)
  if (idx !== -1) {
    const value = Number.parseInt(process.argv[idx + 1] ?? String(fallback), 10)
    if (Number.isFinite(value) && value >= 1) return value
  }
  return fallback
}

function parseStartArg(): number {
  return parseIntArg('--start', 1)
}

function parseConcurrencyArg(): number {
  return parseIntArg('--concurrency', DEFAULT_CONCURRENCY)
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
  const concurrency = parseConcurrencyArg()
  const onlyEmpty = !process.argv.includes('--all')
  const map = loadExistingMap()
  for (const ing of INGREDIENT_IMAGE_SEED) {
    if (!(ing.id in map)) map[ing.id] = ''
  }

  const work = INGREDIENT_IMAGE_SEED.filter((ing) => {
    if (!isAfterIngredientImageAnchor(ing.id)) return false
    if (onlyEmpty && (map[ing.id]?.length ?? 0) > 0) return false
    return true
  })

  let found = Object.values(map).filter((v) => v.length > 0).length
  let newlyFound = 0
  let processed = 0
  const startIndex = Math.max(0, startAt - 1)

  console.log(`Anchor (protected): ${INGREDIENT_IMAGE_ANCHOR_ID}`)
  console.log(`Loaded ${found} existing images (${INGREDIENT_IMAGE_SEED.length} catalog keys)`)
  console.log(`Processing ${work.length} ingredients after anchor${onlyEmpty ? ' (empty only)' : ''} (concurrency ${concurrency})`)
  if (startAt > 1) {
    console.log(`Resuming at item ${startAt}/${work.length}`)
  }

  for (let batchStart = startIndex; batchStart < work.length; batchStart += concurrency) {
    const batch = work.slice(batchStart, batchStart + concurrency)
    const results = await Promise.all(
      batch.map(async (ing) => {
        const url = await resolveIngredientImageWithTimeout(ing, 30_000)
        return { ing, url }
      })
    )

    for (const { ing, url } of results) {
      processed++
      if (url) {
        map[ing.id] = url
        newlyFound++
      } else if (isAfterIngredientImageAnchor(ing.id)) {
        map[ing.id] = map[ing.id] ?? ''
      }
    }

    found = Object.values(map).filter((v) => v.length > 0).length
    const last = batch[batch.length - 1]
    const pos = Math.min(batchStart + batch.length, work.length)
    process.stdout.write(`\r[${pos}/${work.length}] ${last.name.slice(0, 36).padEnd(36)} | ${found} total`)

    if (processed % SAVE_EVERY < concurrency) {
      saveMap(map)
    }

    await new Promise((r) => setTimeout(r, 200))
  }

  saveMap(map)
  console.log(`\nResolved ${found}/${INGREDIENT_IMAGE_SEED.length} images (+${newlyFound} this run, after anchor only)`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
