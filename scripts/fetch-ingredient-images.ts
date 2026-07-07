/**
 * Fetches ingredient images from TheCocktailDB, Wikipedia, and Open Food Facts.
 * Run: npm run fetch-images
 */
import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { INGREDIENT_IMAGE_SEED } from '../src/data/ingredientImageSeed.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '../src/data/ingredient-images.json')

async function headOk(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: 'HEAD', redirect: 'follow' })
    const type = res.headers.get('content-type') || ''
    return res.ok && type.startsWith('image/')
  } catch {
    return false
  }
}

async function tryCocktailDb(name: string): Promise<string | null> {
  for (const size of ['Medium', 'Small']) {
    const url = `https://www.thecocktaildb.com/images/ingredients/${encodeURIComponent(name)}-${size}.png`
    if (await headOk(url)) return url
  }
  return null
}

async function tryWikipedia(title: string): Promise<string | null> {
  try {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
    const res = await fetch(url, { headers: { 'User-Agent': 'Pourfolio/1.0 (home bar app)' } })
    if (!res.ok) return null
    const data = (await res.json()) as { thumbnail?: { source?: string } }
    const src = data.thumbnail?.source
    if (src && (await headOk(src))) return src
  } catch {
    /* ignore */
  }
  return null
}

async function tryOpenFoodFacts(query: string): Promise<string | null> {
  try {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=3`
    const res = await fetch(url, { headers: { 'User-Agent': 'Pourfolio/1.0' } })
    if (!res.ok) return null
    const data = (await res.json()) as { products?: Array<{ image_front_url?: string; image_url?: string; image_small_url?: string }> }
    for (const p of data.products ?? []) {
      const img = p.image_front_url || p.image_url || p.image_small_url
      if (img && (await headOk(img))) return img
    }
  } catch {
    /* ignore */
  }
  return null
}

const ALIASES: Record<string, string[]> = {
  'Rye Whiskey': ['Rye', 'Rye whiskey'],
  'Light Rum': ['Light rum', 'Bacardi'],
  'Dark Rum': ['Dark rum'],
  'Coffee Liqueur': ['Kahlua'],
  'Irish Cream': ['Baileys irish cream'],
  'Herbal Liqueur': ['Jägermeister', 'Jagermeister'],
  'Cinnamon Schnapps': ['Goldschlager'],
  'Triple Sec': ['Cointreau'],
  'Bitter Liqueur': ['Campari', 'Aperol'],
  Bitters: ['Angostura bitters', 'Bitters'],
  'Soda Water': ['Carbonated water'],
  Cola: ['Coca-Cola'],
  Cognac: ['Hennessy', 'Cognac'],
  Scotch: ['Scotch whisky', 'Johnnie Walker'],
  Champagne: ['Champagne'],
  Prosecco: ['Prosecco'],
  'Simple Syrup': ['Grenadine'],
  Cream: ['Heavy cream'],
  'Egg White': ['Egg white'],
}

function searchNames(ing: { name: string; genericName: string }): string[] {
  const set = new Set([ing.name, ing.genericName])
  for (const a of ALIASES[ing.genericName] ?? []) set.add(a)
  for (const a of ALIASES[ing.name] ?? []) set.add(a)
  const parts = ing.name.split(/\s+/)
  if (parts.length > 2) set.add(`${parts[0]} ${parts[1]}`)
  return [...set]
}

async function resolveImage(ing: { name: string; genericName: string }) {
  const names = searchNames(ing)
  const isBrand = ing.name !== ing.genericName

  // Brands: try Wikipedia & product DB first for actual bottle photos
  if (isBrand) {
    for (const name of [ing.name, ...names]) {
      const wiki = await tryWikipedia(name)
      if (wiki) return wiki
    }
    for (const name of [ing.name, ...names]) {
      const off = await tryOpenFoodFacts(name)
      if (off) return off
    }
  }

  for (const name of names) {
    const cdb = await tryCocktailDb(name)
    if (cdb) return cdb
  }

  if (!isBrand) {
    for (const name of names) {
      const wiki = await tryWikipedia(name)
      if (wiki) return wiki
    }
  }

  return null
}

async function main() {
  const map: Record<string, string> = {}
  let found = 0

  for (let i = 0; i < INGREDIENT_IMAGE_SEED.length; i++) {
    const ing = INGREDIENT_IMAGE_SEED[i]
    process.stdout.write(`\r[${i + 1}/${INGREDIENT_IMAGE_SEED.length}] ${ing.name.slice(0, 36).padEnd(36)}`)

    const url = await resolveImage(ing)
    if (url) {
      map[ing.id] = url
      found++
    }
    await new Promise((r) => setTimeout(r, 120))
  }

  console.log(`\nResolved ${found}/${INGREDIENT_IMAGE_SEED.length} images`)
  writeFileSync(OUT, JSON.stringify(map, null, 2))
}

main().catch(console.error)
