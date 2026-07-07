import { SEED_DRINKS } from '../data/drinks'
import { getSeedIngredient } from './ingredientEdit'
import type { AppState, CatalogTrash, TrashDrink, TrashIngredient } from '../types'

export function getSeedDrink(id: string) {
  return SEED_DRINKS.find((d) => d.id === id)
}

export function emptyTrash(): CatalogTrash {
  return { ingredients: [], drinks: [] }
}

function stripIngredientFromState(s: AppState, id: string): AppState {
  const barMeta = { ...(s.barItemMeta ?? {}) }
  for (const barId of Object.keys(barMeta)) {
    const shelf = { ...barMeta[barId] }
    delete shelf[id]
    barMeta[barId] = shelf
  }

  const overrides = { ...s.ingredientOverrides }
  delete overrides[id]

  return {
    ...s,
    bars: s.bars.map((b) => ({
      ...b,
      ingredientIds: b.ingredientIds.filter((iid) => iid !== id),
    })),
    shoppingList: s.shoppingList.filter((iid) => iid !== id),
    shoppingChecked: (s.shoppingChecked ?? []).filter((iid) => iid !== id),
    ingredientOverrides: overrides,
    barItemMeta: barMeta,
  }
}

export function buildTrashIngredientEntry(s: AppState, id: string): TrashIngredient | null {
  if (s.hiddenIngredients.includes(id)) return null
  if (s.trash?.ingredients.some((entry) => entry.id === id)) return null

  const custom = s.customIngredients.find((c) => c.id === id)
  if (!custom && !getSeedIngredient(id)) return null

  return {
    id,
    deletedAt: Date.now(),
    customData: custom ? { ...custom } : undefined,
    override: !custom && s.ingredientOverrides[id]
      ? { ...s.ingredientOverrides[id] }
      : undefined,
  }
}

export function applyDeleteIngredient(s: AppState, id: string): AppState {
  const entry = buildTrashIngredientEntry(s, id)
  if (!entry) return s

  const next = stripIngredientFromState(s, id)
  return {
    ...next,
    hiddenIngredients: [...next.hiddenIngredients, id],
    customIngredients: next.customIngredients.filter((c) => c.id !== id),
    trash: {
      ingredients: [...(next.trash?.ingredients ?? []), entry],
      drinks: next.trash?.drinks ?? [],
    },
  }
}

export function applyRestoreIngredient(s: AppState, id: string): AppState {
  const entry = s.trash?.ingredients.find((t) => t.id === id)
  if (!entry) return s

  const overrides = { ...s.ingredientOverrides }
  if (entry.override) {
    overrides[id] = entry.override
  }

  let customIngredients = s.customIngredients
  if (entry.customData) {
    customIngredients = [
      ...customIngredients.filter((c) => c.id !== id),
      entry.customData,
    ]
  }

  return {
    ...s,
    hiddenIngredients: s.hiddenIngredients.filter((iid) => iid !== id),
    customIngredients,
    ingredientOverrides: overrides,
    trash: {
      ingredients: (s.trash?.ingredients ?? []).filter((t) => t.id !== id),
      drinks: s.trash?.drinks ?? [],
    },
  }
}

export function buildTrashDrinkEntry(s: AppState, id: string): TrashDrink | null {
  if (s.hiddenDrinks.includes(id)) return null
  if (s.trash?.drinks.some((entry) => entry.id === id)) return null

  const custom = s.customDrinks.find((d) => d.id === id)
  if (!custom && !getSeedDrink(id)) return null

  const override = !custom && s.drinkOverrides?.[id]
    ? { ...s.drinkOverrides[id] }
    : undefined

  return {
    id,
    deletedAt: Date.now(),
    customData: custom ? { ...custom } : undefined,
    override,
  }
}

export function applyDeleteDrink(s: AppState, id: string): AppState {
  const entry = buildTrashDrinkEntry(s, id)
  if (!entry) return s

  const drinkOverrides = { ...(s.drinkOverrides ?? {}) }
  delete drinkOverrides[id]

  return {
    ...s,
    hiddenDrinks: [...s.hiddenDrinks, id],
    customDrinks: s.customDrinks.filter((d) => d.id !== id),
    favorites: s.favorites.filter((fid) => fid !== id),
    drinkOverrides,
    trash: {
      ingredients: s.trash?.ingredients ?? [],
      drinks: [...(s.trash?.drinks ?? []), entry],
    },
  }
}

export function applyRestoreDrink(s: AppState, id: string): AppState {
  const entry = s.trash?.drinks.find((t) => t.id === id)
  if (!entry) return s

  let customDrinks = s.customDrinks
  if (entry.customData) {
    customDrinks = [
      ...customDrinks.filter((d) => d.id !== id),
      entry.customData,
    ]
  }

  const drinkOverrides = { ...(s.drinkOverrides ?? {}) }
  if (entry.override) {
    drinkOverrides[id] = entry.override
  }

  return {
    ...s,
    hiddenDrinks: s.hiddenDrinks.filter((did) => did !== id),
    customDrinks,
    drinkOverrides,
    trash: {
      ingredients: s.trash?.ingredients ?? [],
      drinks: (s.trash?.drinks ?? []).filter((t) => t.id !== id),
    },
  }
}

export function applyRestoreAllTrash(s: AppState): AppState {
  let next = s
  for (const entry of [...(s.trash?.ingredients ?? [])]) {
    next = applyRestoreIngredient(next, entry.id)
  }
  for (const entry of [...(s.trash?.drinks ?? [])]) {
    next = applyRestoreDrink(next, entry.id)
  }
  return next
}

export function applyRestoreAllTrashIngredients(s: AppState): AppState {
  let next = s
  for (const entry of [...(s.trash?.ingredients ?? [])]) {
    next = applyRestoreIngredient(next, entry.id)
  }
  return next
}

export function applyRestoreAllTrashDrinks(s: AppState): AppState {
  let next = s
  for (const entry of [...(s.trash?.drinks ?? [])]) {
    next = applyRestoreDrink(next, entry.id)
  }
  return next
}

export function trashIngredientLabel(entry: TrashIngredient): string {
  return entry.customData?.name ?? getSeedIngredient(entry.id)?.name ?? entry.id
}

export function trashDrinkLabel(entry: TrashDrink): string {
  return entry.customData?.name ?? getSeedDrink(entry.id)?.name ?? entry.id
}

export function isTrashIngredientCustom(entry: TrashIngredient): boolean {
  return !!entry.customData?.isCustom
}

export function isTrashDrinkCustom(entry: TrashDrink): boolean {
  return !!entry.customData?.isCustom
}
