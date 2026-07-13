import type { AppState, BarProfile, IngredientOverride } from '../types'

const STORAGE_KEY = 'pourfolio-state-v1'
const LEGACY_KEY = 'inmybar-state-v1'

/** Remap removed duplicate catalog ids to canonical core seed ids. */
const INGREDIENT_ID_ALIASES: Record<string, string> = {
  'brand-grand-marnier-liqueur': 'brand-grand-marnier',
  'brand-jagermeister-liqueur': 'brand-jagermeister',
  'brand-aperol-liqueur-aperitif': 'brand-aperol',
  'brand-appleton-estate-rum': 'brand-appleton-rum-estate-vx-jamaican',
  'brand-bacardi-solera-rum': 'brand-bacardi-1873-solera-rum',
  'brand-bacardi-superior-white-rum': 'brand-bacardi-superior-rum',
  'brand-baileys-hint-of-coffee': 'brand-baileys-coffee-irish-cream',
  'brand-bakers-7-year-old-single-barrel': 'brand-baker-s-bourbon',
  'brand-bombay-gin': 'brand-bombay-sapphire-gin',
  'brand-bonnet-creme-de-cassis-black-currant': 'brand-pages-creme-de-cassis',
  'brand-bonnet-creme-de-fraise-strawberry': 'brand-pages-creme-de-fraise',
  'brand-bonnet-creme-de-framboise-raspberry': 'brand-pages-creme-de-framboise',
  'brand-bonnet-creme-de-mure-blackberry': 'brand-pages-creme-de-mure',
  'brand-bonnet-creme-de-myrtle-blueberry': 'brand-pages-creme-de-myrtilles',
  'brand-bonnet-creme-de-peche-peach': 'brand-pages-creme-de-peche',
  'brand-pages-parfait-amour-liqueur': 'brand-pages-parfait-amour',
  'brand-broken-bell-single-batch-bourbon': 'brand-broken-bell-small-batch-bourbon',
  'brand-bruichladdich-trilogy-peat': 'brand-bruichladdich-peat',
  'brand-bruichladdich-trilogy-waves': 'brand-bruichladdich-waves',
  'brand-bulleit-straight-rye-whiskey': 'brand-bulleit-rye',
  'brand-bunnahabhain-malt': 'brand-bunnahabhain',
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

function remapIngredientOverrides(
  overrides: Record<string, IngredientOverride>
): Record<string, IngredientOverride> {
  const out: Record<string, import('../types').IngredientOverride> = {}
  for (const [id, override] of Object.entries(overrides)) {
    const mappedId = remapIngredientId(id)
    const merged = { ...out[mappedId], ...override }
    if (
      mappedId === 'brand-broken-bell-small-batch-bourbon' &&
      merged.name &&
      /single\s+batch/i.test(merged.name)
    ) {
      merged.name = 'Broken Bell Small Batch Bourbon'
    }
    if (merged.name && /bruichladdich trilogy/i.test(merged.name)) {
      merged.name = merged.name.replace(/\s*Trilogy\s*/i, ' ').replace(/\s+/g, ' ').trim()
    }
    out[mappedId] = merged
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
    hiddenIngredients: remapIdList(state.hiddenIngredients ?? []),
    ingredientOverrides: remapIngredientOverrides(state.ingredientOverrides ?? {}),
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
