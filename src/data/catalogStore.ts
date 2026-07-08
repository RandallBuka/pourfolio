import type { Drink, Ingredient } from '../types'
import { enrichWithUsState } from './ingredientStates'
import { CORE_SEED_INGREDIENTS, pruneRedundantGenerics } from './ingredients'
import { CORE_SEED_DRINKS } from './drinks'

const CACHE_KEY = 'pourfolio-catalog-v1'

interface CatalogCache {
  version: number
  ingredients: Ingredient[]
  drinks: Drink[]
}

/** Live bindings — importers see updates after loadCatalog() completes. */
export let SEED_INGREDIENTS: Ingredient[] = [...CORE_SEED_INGREDIENTS]
export let SEED_DRINKS: Drink[] = [...CORE_SEED_DRINKS]

let catalogLoaded = false
let loadPromise: Promise<void> | null = null

function readCache(): CatalogCache | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CatalogCache
    if (!parsed?.ingredients?.length || !parsed?.drinks?.length || parsed.version == null) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

function writeCache(version: number, ingredients: Ingredient[], drinks: Drink[]): void {
  try {
    const payload: CatalogCache = { version, ingredients, drinks }
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload))
  } catch {
    // Quota or private mode — still works without cache
  }
}

function applyCatalog(extIngredients: Ingredient[], extDrinks: Drink[]): void {
  SEED_INGREDIENTS = pruneRedundantGenerics([
    ...CORE_SEED_INGREDIENTS,
    ...extIngredients.map((item) => enrichWithUsState(item)),
  ])
  SEED_DRINKS = [...CORE_SEED_DRINKS, ...extDrinks]
  catalogLoaded = true
}

export function isCatalogLoaded(): boolean {
  return catalogLoaded
}

export async function loadCatalog(): Promise<void> {
  if (catalogLoaded) return
  if (loadPromise) return loadPromise

  loadPromise = (async () => {
    const base = import.meta.env.BASE_URL

    const cached = readCache()
    if (cached) {
      applyCatalog(cached.ingredients, cached.drinks)
      return
    }

    try {
      const [versionRes, ingRes, drinkRes] = await Promise.all([
        fetch(`${base}catalog/version.json`),
        fetch(`${base}catalog/ingredients.json`),
        fetch(`${base}catalog/drinks.json`),
      ])
      if (!ingRes.ok || !drinkRes.ok) {
        catalogLoaded = true
        return
      }

      const version = versionRes.ok ? ((await versionRes.json()) as { version?: number }).version : 0
      const extIngredients = (await ingRes.json()) as Ingredient[]
      const extDrinks = (await drinkRes.json()) as Drink[]

      applyCatalog(extIngredients, extDrinks)
      writeCache(version ?? 0, extIngredients, extDrinks)
    } catch {
      catalogLoaded = true
    }
  })()

  return loadPromise
}

export function getIngredientByGeneric(genericName: string): Ingredient | undefined {
  return SEED_INGREDIENTS.find((i) => i.genericName === genericName && i.name === genericName)
    ?? SEED_INGREDIENTS.find((i) => i.genericName === genericName)
}
