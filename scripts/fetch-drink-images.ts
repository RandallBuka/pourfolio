/**
 * Fetches drink photos from TheCocktailDB (and Wikipedia as fallback).
 * Run: npm run fetch-drink-images
 */
import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { SEED_DRINKS } from '../src/data/drinks.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '../src/data/drink-images.json')
const CDB = 'https://www.thecocktaildb.com/api/json/v1/1'

async function headOk(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: 'HEAD', redirect: 'follow' })
    const type = res.headers.get('content-type') || ''
    return res.ok && type.startsWith('image/')
  } catch {
    return false
  }
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

type CdbDrink = { strDrink: string; strDrinkThumb?: string }

async function tryCocktailDb(name: string): Promise<string | null> {
  try {
    const url = `${CDB}/search.php?s=${encodeURIComponent(name)}`
    const res = await fetch(url)
    if (!res.ok) return null
    const data = (await res.json()) as { drinks?: CdbDrink[] | null }
    const drinks = data.drinks ?? []
    if (drinks.length === 0) return null

    const target = name.toLowerCase()
    const exact = drinks.find((d) => d.strDrink.toLowerCase() === target)
    const startsWith = drinks.find((d) => d.strDrink.toLowerCase().startsWith(target))
    const contains = drinks.find((d) => d.strDrink.toLowerCase().includes(target))
    const pick = exact ?? startsWith ?? contains ?? drinks[0]
    const thumb = pick.strDrinkThumb
    if (thumb && (await headOk(thumb))) return thumb
  } catch {
    /* ignore */
  }
  return null
}

async function tryCocktailDbByIngredient(ingredient: string): Promise<string | null> {
  try {
    const url = `${CDB}/filter.php?i=${encodeURIComponent(ingredient)}`
    const res = await fetch(url)
    if (!res.ok) return null
    const data = (await res.json()) as { drinks?: Array<{ strDrinkThumb?: string }> | null }
    const thumb = data.drinks?.[0]?.strDrinkThumb
    if (thumb && (await headOk(thumb))) return thumb
  } catch {
    /* ignore */
  }
  return null
}

/** Last-resort curated images when name search fails */
const MANUAL_IMAGES: Record<string, string> = {
  '24-karat-nightmare': 'https://www.thecocktaildb.com/images/media/drink/yyrwty1468877498.jpg',
  'chocolate-cake': 'https://www.thecocktaildb.com/images/media/drink/bsvmlg1515792693.jpg',
  'blow-job': 'https://www.thecocktaildb.com/images/media/drink/e5zgao1582582378.jpg',
  'jager-bomb': 'https://www.thecocktaildb.com/images/media/drink/yyrwty1468877498.jpg',
  'mind-eraser': 'https://www.thecocktaildb.com/images/media/drink/lmj2yt1504820500.jpg',
  'red-headed-slut': 'https://www.thecocktaildb.com/images/media/drink/wysqut1461867176.jpg',
  'washington-apple': 'https://www.thecocktaildb.com/images/media/drink/66mt9b1619695719.jpg',
  'woo-woo': 'https://www.thecocktaildb.com/images/media/drink/wysqut1461867176.jpg',
  'yukon-jack': 'https://www.thecocktaildb.com/images/media/drink/hbkfsh1589574990.jpg',
  'paper-plane': 'https://www.thecocktaildb.com/images/media/drink/trbplb1606855233.jpg',
  'bee-knees': 'https://www.thecocktaildb.com/images/media/drink/noxp7e1606769224.jpg',
  'southside': 'https://www.thecocktaildb.com/images/media/drink/metwgh1606770327.jpg',
  'bay-breeze': 'https://www.thecocktaildb.com/images/media/drink/7rfuks1504371562.jpg',
}

const INGREDIENT_FALLBACKS: Record<string, string[]> = {
  'blow-job': ['Amaretto'],
  'jager-bomb': ['Jägermeister'],
  'mind-eraser': ['Vodka'],
  'red-headed-slut': ['Peach schnapps', 'Jägermeister'],
  'washington-apple': ['Apple schnapps'],
  'woo-woo': ['Peach schnapps'],
  'yukon-jack': ['Whiskey'],
  'paper-plane': ['Bourbon'],
  'bee-knees': ['Gin'],
  'southside': ['Gin'],
  'bay-breeze': ['Cranberry juice', 'Vodka'],
}

const ALIASES: Record<string, string[]> = {
  '24-Karat Nightmare Shot': ['Goldschlager', 'Jägermeister'],
  'Jager Bomb': ['Jagerbomb', 'Jaegerbomb', 'Jägerbomb'],
  'Dark and Stormy': ["Dark 'n' Stormy", 'Dark n Stormy'],
  'Gin and Tonic': ['Gin Tonic', 'G&T'],
  'Pina Colada': ['Piña Colada', 'Pina colada'],
  "Bee's Knees": ['Bees Knees'],
  "Planter's Punch": ['Planters Punch'],
  'Sazerac (Rye)': ['Sazerac'],
  'Long Island Iced Tea': ['Long Island Tea'],
  'Washington Apple Shot': ['Washington Apple'],
  'Fuzzy Navel Shot': ['Fuzzy Navel'],
  'Kamikaze Shot': ['Kamikaze'],
  'Lemon Drop Shot': ['Lemon Drop'],
  'Chocolate Cake Shot': ['Chocolate Cake'],
  'Snakebite Shot': ['Snakebite'],
  'Woo Woo Shot': ['Woo Woo'],
  'Oatmeal Cookie Shot': ['Oatmeal Cookie'],
  'Orgasm Shot': ['Orgasm'],
  'Yukon Jack Shot': ['Yukon Jack'],
  'Cosmopolitan': ['Cosmopolitan Martini'],
  'Vodka Martini': ['Vodka Martini', 'Kangaroo'],
  'Irish Coffee': ['Irish Coffee'],
  'Hot Toddy': ['Hot Toddy'],
  'Paper Plane': ['Paper Plane'],
  'Penicillin': ['Penicillin Cocktail'],
}

function searchNames(name: string): string[] {
  const set = new Set<string>([name])
  for (const alias of ALIASES[name] ?? []) set.add(alias)

  const withoutShot = name.replace(/\s+Shot$/i, '').trim()
  if (withoutShot !== name) set.add(withoutShot)

  const withoutCocktail = name.replace(/\s+Cocktail$/i, '').trim()
  if (withoutCocktail !== name) set.add(withoutCocktail)

  const paren = name.replace(/\s*\([^)]*\)\s*/g, '').trim()
  if (paren !== name) set.add(paren)

  return [...set]
}

async function resolveImage(drink: { id: string; name: string }) {
  const names = searchNames(drink.name)
  if (MANUAL_IMAGES[drink.id]) return MANUAL_IMAGES[drink.id]
  for (const name of names) {
    const cdb = await tryCocktailDb(name)
    if (cdb) return cdb
  }
  for (const ingredient of INGREDIENT_FALLBACKS[drink.id] ?? []) {
    const byIng = await tryCocktailDbByIngredient(ingredient)
    if (byIng) return byIng
  }
  for (const name of names) {
    const wiki = await tryWikipedia(`${name} cocktail`)
    if (wiki) return wiki
  }
  for (const name of names) {
    const wiki = await tryWikipedia(name)
    if (wiki) return wiki
  }
  return null
}

async function main() {
  const map: Record<string, string> = {}
  let found = 0

  for (let i = 0; i < SEED_DRINKS.length; i++) {
    const drink = SEED_DRINKS[i]
    process.stdout.write(`\r[${i + 1}/${SEED_DRINKS.length}] ${drink.name.slice(0, 36).padEnd(36)}`)

    const url = await resolveImage(drink)
    if (url) {
      map[drink.id] = url
      found++
    }
    await new Promise((r) => setTimeout(r, 150))
  }

  console.log(`\nResolved ${found}/${SEED_DRINKS.length} drink images`)
  writeFileSync(OUT, JSON.stringify(map, null, 2))
}

main().catch(console.error)
