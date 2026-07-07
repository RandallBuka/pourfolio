import type { AppState } from '../types'
import { createDefaultState } from './storage'

const SNAPSHOT_KEY = 'pourfolio-undo-v1'

export type UndoAction = 'delete-all-ingredients' | 'delete-all-recipes' | 'reset-all'

export interface UndoSnapshot {
  savedAt: number
  action: UndoAction
  state: AppState
}

export function saveUndoSnapshot(action: UndoAction, state: AppState): void {
  const snapshot: UndoSnapshot = {
    savedAt: Date.now(),
    action,
    state: JSON.parse(JSON.stringify(state)) as AppState,
  }
  try {
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot))
  } catch {
    // Storage full — still proceed with delete; user can use export backup
  }
}

export function loadUndoSnapshot(): UndoSnapshot | null {
  try {
    const raw = localStorage.getItem(SNAPSHOT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as UndoSnapshot
    if (!parsed.state?.bars?.length || !parsed.savedAt || !parsed.action) return null
    return {
      ...parsed,
      state: {
        ...createDefaultState(),
        ...parsed.state,
        ingredientOverrides: parsed.state.ingredientOverrides ?? {},
        drinkOverrides: parsed.state.drinkOverrides ?? {},
        barItemMeta: parsed.state.barItemMeta ?? {},
        shoppingChecked: parsed.state.shoppingChecked ?? [],
        trash: parsed.state.trash ?? { ingredients: [], drinks: [] },
      },
    }
  } catch {
    return null
  }
}

export function clearUndoSnapshot(): void {
  localStorage.removeItem(SNAPSHOT_KEY)
}

export function undoActionLabel(action: UndoAction): string {
  switch (action) {
    case 'delete-all-ingredients':
      return 'ingredients & shelves'
    case 'delete-all-recipes':
      return 'custom recipes'
    case 'reset-all':
      return 'all data'
  }
}

export function formatSnapshotTime(savedAt: number): string {
  const diffMs = Date.now() - savedAt
  if (diffMs < 60_000) return 'just now'
  if (diffMs < 3_600_000) {
    const mins = Math.round(diffMs / 60_000)
    return `${mins} minute${mins === 1 ? '' : 's'} ago`
  }
  return new Date(savedAt).toLocaleString()
}
