import type { AppState } from '../types'
import { createDefaultState } from './storage'

const BACKUP_VERSION = 1

export interface BackupFile {
  version: number
  exportedAt: string
  app: 'pourfolio'
  state: AppState
}

export function buildBackup(state: AppState): BackupFile {
  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    app: 'pourfolio',
    state,
  }
}

export function serializeBackup(state: AppState): string {
  return JSON.stringify(buildBackup(state), null, 2)
}

export function parseBackup(raw: string): AppState {
  const parsed = JSON.parse(raw) as BackupFile | AppState
  const state = 'state' in parsed && parsed.state ? parsed.state : (parsed as AppState)
  if (!state.bars?.length) {
    throw new Error('Invalid backup file')
  }
  return {
    ...createDefaultState(),
    ...state,
    ingredientOverrides: state.ingredientOverrides ?? {},
    drinkOverrides: state.drinkOverrides ?? {},
    barItemMeta: state.barItemMeta ?? {},
    shoppingChecked: state.shoppingChecked ?? [],
    trash: state.trash ?? { ingredients: [], drinks: [] },
  }
}

export function downloadBackup(state: AppState, filename?: string): void {
  const blob = new Blob([serializeBackup(state)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename ?? `pourfolio-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}
