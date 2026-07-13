/**
 * Remove low-quality drink image URLs from drink-images.json.
 * Run: npm run prune-drink-images
 */
import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { isProfessionalDrinkImageUrl } from '../src/lib/drinkImageQuality.ts'
import { loadAllDrinksForImages } from '../src/data/drinkImageSeed.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '../src/data/drink-images.json')

function main() {
  const images = JSON.parse(readFileSync(OUT, 'utf8')) as Record<string, string>
  const drinks = new Map(loadAllDrinksForImages().map((d) => [d.id, d.name]))
  let kept = 0
  let pruned = 0

  for (const [id, url] of Object.entries(images)) {
    if (!url) continue
    const name = drinks.get(id) ?? ''
    if (isProfessionalDrinkImageUrl(url, name, name)) {
      kept++
      continue
    }
    images[id] = ''
    pruned++
  }

  const sorted: Record<string, string> = {}
  for (const id of Object.keys(images).sort()) sorted[id] = images[id]
  writeFileSync(OUT, `${JSON.stringify(sorted, null, 2)}\n`)
  console.log(`Kept ${kept} professional drink images`)
  console.log(`Pruned ${pruned} low-quality drink images`)
}

main()
