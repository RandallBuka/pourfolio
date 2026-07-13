/**
 * Fetches professional drink photos for the full recipe catalog.
 * Skips entries that already have an image unless --all is passed.
 * Run: npm run fetch-drink-images
 * Resume: npm run fetch-drink-images -- --start=50
 */
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { loadAllDrinksForImages } from '../src/data/drinkImageSeed.ts'
import { resolveDrinkImageWithTimeout } from './lib/drinkImageResolver.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '../src/data/drink-images.json')
const SAVE_EVERY = 20
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

function loadExistingMap(): Record<string, string> {
  if (!existsSync(OUT)) return {}
  try {
    return JSON.parse(readFileSync(OUT, 'utf8')) as Record<string, string>
  } catch {
    return {}
  }
}

function saveMap(map: Record<string, string>) {
  const sorted: Record<string, string> = {}
  for (const id of Object.keys(map).sort()) sorted[id] = map[id]
  writeFileSync(OUT, `${JSON.stringify(sorted, null, 2)}\n`)
}

async function main() {
  const startAt = parseIntArg('--start', 1)
  const concurrency = parseIntArg('--concurrency', DEFAULT_CONCURRENCY)
  const onlyEmpty = !process.argv.includes('--all')
  const allDrinks = loadAllDrinksForImages()
  const map = loadExistingMap()

  for (const drink of allDrinks) {
    if (!(drink.id in map)) map[drink.id] = ''
  }

  const work = allDrinks.filter((drink) => {
    if (onlyEmpty && (map[drink.id]?.length ?? 0) > 0) return false
    return true
  })

  let found = Object.values(map).filter((v) => v.length > 0).length
  let newlyFound = 0
  let processed = 0
  const startIndex = Math.max(0, startAt - 1)

  console.log(`Loaded ${found} existing drink images (${allDrinks.length} recipes)`)
  console.log(`Processing ${work.length} recipes${onlyEmpty ? ' (empty only)' : ''} (concurrency ${concurrency})`)
  if (startAt > 1) console.log(`Resuming at item ${startAt}/${work.length}`)

  for (let batchStart = startIndex; batchStart < work.length; batchStart += concurrency) {
    const batch = work.slice(batchStart, batchStart + concurrency)
    const results = await Promise.all(
      batch.map(async (drink) => {
        const url = await resolveDrinkImageWithTimeout(drink)
        return { drink, url }
      })
    )

    for (const { drink, url } of results) {
      processed++
      if (url) {
        map[drink.id] = url
        newlyFound++
      } else {
        map[drink.id] = map[drink.id] ?? ''
      }
    }

    found = Object.values(map).filter((v) => v.length > 0).length
    const last = batch[batch.length - 1]
    const pos = Math.min(batchStart + batch.length, work.length)
    process.stdout.write(`\r[${pos}/${work.length}] ${last.name.slice(0, 36).padEnd(36)} | ${found} total`)

    if (processed % SAVE_EVERY < concurrency) saveMap(map)
    await new Promise((r) => setTimeout(r, 150))
  }

  saveMap(map)
  console.log(`\nResolved ${found}/${allDrinks.length} drink images (+${newlyFound} this run)`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
