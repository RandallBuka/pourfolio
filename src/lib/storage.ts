import type { AppState, BarProfile } from '../types'

const STORAGE_KEY = 'pourfolio-state-v1'
const LEGACY_KEY = 'inmybar-state-v1'

/** Remap removed duplicate catalog ids to canonical core seed ids. */
const INGREDIENT_ID_ALIASES: Record<string, string> = {
  'brand-grand-marnier-liqueur': 'brand-grand-marnier',
  'brand-jagermeister-liqueur': 'brand-jagermeister',
}

function remapIngredientId(id: string): string {
  return INGREDIENT_ID_ALIASES[id] ?? id
}

function remapIdList(ids: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const id of ids) {
    const mapped = remapIngredientId(id)
    if (seen.has(mapped)) continue
    seen.add(mapped)
    out.push(mapped)
  }
  return out
}

function normalizeState(state: AppState): AppState {
  return {
    ...state,
    bars: state.bars.map((bar) => ({
      ...bar,
      ingredientIds: remapIdList(bar.ingredientIds),
    })),
    shoppingList: remapIdList(state.shoppingList),
  }
}

export const DEFAULT_BAR: BarProfile = {
  id: 'default',
  name: 'Home Bar',
  ingredientIds: [],
}

export function loadState(): AppState {
  try {
    let raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      raw = localStorage.getItem(LEGACY_KEY)
      if (raw) {
        localStorage.setItem(STORAGE_KEY, raw)
        localStorage.removeItem(LEGACY_KEY)
      }
    }
    if (!raw) return createDefaultState()
    const parsed = JSON.parse(raw) as AppState
    if (!parsed.bars?.length) return createDefaultState()
    return normalizeState({
      ...createDefaultState(),
      ...parsed,
      ingredientOverrides: parsed.ingredientOverrides ?? {},
      drinkOverrides: parsed.drinkOverrides ?? {},
      barItemMeta: parsed.barItemMeta ?? {},
      shoppingChecked: parsed.shoppingChecked ?? [],
      trash: parsed.trash ?? { ingredients: [], drinks: [] },
    })
  } catch {
    return createDefaultState()
  }
}

export function saveState(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function createDefaultState(): AppState {
  return {
    bars: [DEFAULT_BAR],
    activeBarId: DEFAULT_BAR.id,
    favorites: [],
    shoppingList: [],
    customIngredients: [],
    customDrinks: [],
    hiddenDrinks: [],
    hiddenIngredients: [],
    ingredientOverrides: {},
    drinkOverrides: {},
    barItemMeta: {},
    shoppingChecked: [],
    trash: { ingredients: [], drinks: [] },
  }
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}
