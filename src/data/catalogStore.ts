import { useSyncExternalStore } from 'react'
import type { Drink, Ingredient } from '../types'
import { enrichWithUsState } from './ingredientStates'
import { CORE_SEED_INGREDIENTS, pruneRedundantGenerics } from './ingredients'
import { CORE_SEED_DRINKS } from './drinks'

const CACHE_KEY = 'pourfolio-catalog-v2'

interface CatalogCache {
  version: number
  ingredients: Ingredient[]
  drinks: Drink[]
}

/** Live bindings — importers see updates after loadCatalog() completes. */
export let SEED_INGREDIENTS: Ingredient[] = [...CORE_SEED_INGREDIENTS]
export let SEED_DRINKS: Drink[] = [...CORE_SEED_DRINKS]

let catalogLoaded = false
let catalogRevision = 0
let loadPromise: Promise<void> | null = null
const catalogListeners = new Set<() => void>()

const CATALOG_FETCH_MS = 20_000

function notifyCatalogListeners(): void {
  catalogRevision += 1
  for (const listener of catalogListeners) listener()
}

export function getCatalogRevision(): number {
  return catalogRevision
}

export function subscribeCatalogLoaded(listener: () => void): () => void {
  catalogListeners.add(listener)
  return () => catalogListeners.delete(listener)
}

async function fetchWithTimeout(url: string, ms = CATALOG_FETCH_MS): Promise<Response> {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), ms)
  try {
    return await fetch(url, { signal: controller.signal })
  } finally {
    window.clearTimeout(timer)
  }
}

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
  notifyCatalogListeners()
}

function markCatalogReady(): void {
  if (catalogLoaded) return
  catalogLoaded = true
  notifyCatalogListeners()
}

export function isCatalogLoaded(): boolean {
  return catalogLoaded
}

export function useCatalogReady(): boolean {
  return useSyncExternalStore(
    subscribeCatalogLoaded,
    () => catalogLoaded,
    () => true
  )
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
        fetchWithTimeout(`${base}catalog/version.json`),
        fetchWithTimeout(`${base}catalog/ingredients.json`),
        fetchWithTimeout(`${base}catalog/drinks.json`),
      ])
      if (!ingRes.ok || !drinkRes.ok) {
        markCatalogReady()
        return
      }

      const version = versionRes.ok ? ((await versionRes.json()) as { version?: number }).version : 0
      const extIngredients = (await ingRes.json()) as Ingredient[]
      const extDrinks = (await drinkRes.json()) as Drink[]

      applyCatalog(extIngredients, extDrinks)
      writeCache(version ?? 0, extIngredients, extDrinks)
    } catch {
      markCatalogReady()
    }
  })()

  return loadPromise
}

// Warm catalog from localStorage before React mounts (repeat visits).
hydrateCatalogFromStorage()

function hydrateCatalogFromStorage(): void {
  if (catalogLoaded) return
  const cached = readCache()
  if (cached) applyCatalog(cached.ingredients, cached.drinks)
}

export function getIngredientByGeneric(genericName: string): Ingredient | undefined {
  return SEED_INGREDIENTS.find((i) => i.genericName === genericName && i.name === genericName)
    ?? SEED_INGREDIENTS.find((i) => i.genericName === genericName)
}
