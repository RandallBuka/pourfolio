import {
  COCKTAILDB_DRINK_MEDIA_RE,
  drinkNameMatchScore,
  drinkSearchQueries,
  isProfessionalDrinkImageUrl,
  normalizeDrinkName,
} from '../../src/lib/drinkImageQuality.ts'

export interface DrinkImageQuery {
  id: string
  name: string
}

const USER_AGENT = 'Pourfolio/1.0 (https://github.com/randallbuka/pourfolio)'
const CDB = 'https://www.thecocktaildb.com/api/json/v1/1'
const REQUEST_TIMEOUT_MS = 12_000

async function fetchTimed(url: string, init: RequestInit = {}): Promise<Response | null> {
  try {
    return await fetch(url, {
      ...init,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
  } catch {
    return null
  }
}

async function headOk(url: string): Promise<boolean> {
  const res = await fetchTimed(url, { method: 'HEAD', redirect: 'follow', headers: { 'User-Agent': USER_AGENT } })
  if (!res) return false
  const type = res.headers.get('content-type') || ''
  return res.ok && type.startsWith('image/')
}

type CdbDrink = { strDrink: string; strDrinkThumb?: string }

async function tryCocktailDb(name: string, drink: DrinkImageQuery): Promise<string | null> {
  const res = await fetchTimed(`${CDB}/search.php?s=${encodeURIComponent(name)}`)
  if (!res?.ok) return null
  const data = (await res.json()) as { drinks?: CdbDrink[] | null }
  const drinks = data.drinks ?? []
  if (drinks.length === 0) return null

  const target = normalizeDrinkName(drink.name)
  const targetCore = normalizeDrinkName(name)

  let best: { url: string; score: number; label: string } | null = null
  for (const pick of drinks) {
    const thumb = pick.strDrinkThumb
    if (!thumb || !COCKTAILDB_DRINK_MEDIA_RE.test(thumb)) continue
    const normalized = normalizeDrinkName(pick.strDrink)
    let score = drinkNameMatchScore(drink.name, pick.strDrink)
    if (normalized === target || normalized === targetCore) score += 0.35
    if (normalized.startsWith(targetCore) || targetCore.startsWith(normalized)) score += 0.15
    if (!isProfessionalDrinkImageUrl(thumb, drink.name, pick.strDrink)) continue
    if (!best || score > best.score) best = { url: thumb, score, label: pick.strDrink }
  }

  if (!best || best.score < 0.45) return null
  if (!(await headOk(best.url))) return null
  return best.url
}

async function tryDuckDuckGoImages(drink: DrinkImageQuery): Promise<string | null> {
  const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  let best: { url: string; score: number; label: string } | null = null

  for (const query of drinkSearchQueries(drink.name)) {
    try {
      const pageRes = await fetchTimed(
        `https://duckduckgo.com/?${new URLSearchParams({ q: query, ia: 'images' })}`,
        { headers: { 'User-Agent': UA } }
      )
      if (!pageRes?.ok) continue
      const html = await pageRes.text()
      const vqdMatch = html.match(/vqd=['"](\d+-\d+(?:-\d+)?)['"]/) ?? html.match(/vqd=(\d+-\d+(?:-\d+)?)/)
      if (!vqdMatch) continue

      const imgRes = await fetchTimed(
        `https://duckduckgo.com/i.js?${new URLSearchParams({
          l: 'us-en',
          o: 'json',
          q: query,
          vqd: vqdMatch[1],
          p: '-1',
        })}`,
        { headers: { 'User-Agent': UA, referer: 'https://duckduckgo.com/' } }
      )
      if (!imgRes?.ok) continue
      const data = (await imgRes.json()) as { results?: Array<{ title?: string; image?: string }> }

      for (const hit of data.results ?? []) {
        const url = hit.image
        const label = hit.title ?? ''
        if (!url) continue
        const score = drinkNameMatchScore(drink.name, label)
        if (score < 0.4) continue
        if (!isProfessionalDrinkImageUrl(url, drink.name, label)) continue
        if (!best || score > best.score) best = { url, score, label }
      }
    } catch {
      continue
    }
    if (best && best.score >= 0.6) break
    await new Promise((r) => setTimeout(r, 1200))
  }

  if (!best) return null
  if (!(await headOk(best.url))) return null
  return best.url
}

/** Last-resort curated images when automated search fails */
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
  Cosmopolitan: ['Cosmopolitan Martini'],
  'Vodka Martini': ['Vodka Martini', 'Kangaroo'],
  'Irish Coffee': ['Irish Coffee'],
  'Hot Toddy': ['Hot Toddy'],
  'Paper Plane': ['Paper Plane'],
  Penicillin: ['Penicillin Cocktail'],
  '57 Chevy Shooter': ['57 Chevy', '57 Chevy with a White License Plate'],
  "A Gilligan's Island": ["Gilligan's Island", 'Gilligans Island'],
  'A Fuzzy Thing': ['Fuzzy Navel', 'Fuzzy Thing'],
}

function allSearchNames(drink: DrinkImageQuery): string[] {
  const set = new Set(drinkSearchQueries(drink.name))
  for (const alias of ALIASES[drink.name] ?? []) {
    for (const q of drinkSearchQueries(alias)) set.add(q)
  }
  return [...set]
}

export async function resolveDrinkImage(drink: DrinkImageQuery): Promise<string | null> {
  if (MANUAL_IMAGES[drink.id]) {
    const url = MANUAL_IMAGES[drink.id]
    if (isProfessionalDrinkImageUrl(url, drink.name, drink.name)) return url
  }

  for (const name of allSearchNames(drink)) {
    const clean = name.replace(/\s+cocktail$/i, '').replace(/\s+drink$/i, '').trim()
    const cdb = await tryCocktailDb(clean, drink)
    if (cdb) return cdb
  }

  return tryDuckDuckGoImages(drink)
}

const DRINK_RESOLVE_TIMEOUT_MS = 35_000

export async function resolveDrinkImageWithTimeout(
  drink: DrinkImageQuery,
  timeoutMs = DRINK_RESOLVE_TIMEOUT_MS
): Promise<string | null> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      resolveDrinkImage(drink),
      new Promise<null>((resolve) => {
        timer = setTimeout(() => resolve(null), timeoutMs)
      }),
    ])
  } catch {
    return null
  } finally {
    if (timer) clearTimeout(timer)
  }
}
