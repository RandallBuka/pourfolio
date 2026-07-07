import type { IngredientCategory } from '../types'

const STORAGE_KEY = 'pourfolio-ocr-learn-v1'
const MAX_ENTRIES = 60

export interface LabelCorrection {
  name: string
  genericName: string
  company?: string
  country?: string
  category: IngredientCategory
  abv?: number
  vintage?: number
}

export interface LabelLearnEntry extends LabelCorrection {
  fingerprint: string
  ocrName: string
  updatedAt: number
  hits: number
}

export interface LabelLearnStore {
  entries: LabelLearnEntry[]
}

export function normalizeLabelFingerprint(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 320)
}

function loadStore(): LabelLearnStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { entries: [] }
    const parsed = JSON.parse(raw) as LabelLearnStore
    return { entries: parsed.entries ?? [] }
  } catch {
    return { entries: [] }
  }
}

function saveStore(store: LabelLearnStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    // ignore quota errors
  }
}

function namesSimilar(a: string, b: string): boolean {
  const x = a.toLowerCase().replace(/[^a-z0-9]/g, '')
  const y = b.toLowerCase().replace(/[^a-z0-9]/g, '')
  if (!x || !y) return false
  if (x === y) return true
  if (x.includes(y) || y.includes(x)) return true
  return false
}

export function recordLabelCorrection(
  rawText: string,
  ocrName: string,
  corrected: LabelCorrection
): void {
  const fingerprint = normalizeLabelFingerprint(rawText)
  if (!fingerprint || fingerprint.length < 8) return
  if (!corrected.name.trim() || !corrected.genericName.trim()) return

  const store = loadStore()
  const now = Date.now()
  const existing = store.entries.find((e) => e.fingerprint === fingerprint)

  const entry: LabelLearnEntry = {
    fingerprint,
    ocrName: ocrName.trim() || corrected.name.trim(),
    name: corrected.name.trim(),
    genericName: corrected.genericName.trim(),
    company: corrected.company?.trim() || undefined,
    country: corrected.country?.trim() || undefined,
    category: corrected.category,
    abv: corrected.abv,
    vintage: corrected.vintage,
    updatedAt: now,
    hits: (existing?.hits ?? 0) + 1,
  }

  const rest = store.entries.filter((e) => e.fingerprint !== fingerprint)
  const entries = [entry, ...rest]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, MAX_ENTRIES)

  saveStore({ entries })
}

export function findLearnedLabel(rawText: string, parsedName: string): LabelCorrection | null {
  const fingerprint = normalizeLabelFingerprint(rawText)
  if (!fingerprint) return null

  const store = loadStore()
  const exact = store.entries.find((e) => e.fingerprint === fingerprint)
  if (exact) return exact

  const fuzzy = store.entries.find((e) =>
    namesSimilar(parsedName, e.ocrName) || namesSimilar(parsedName, e.name)
  )
  return fuzzy ?? null
}

export function getLabelLearnCount(): number {
  return loadStore().entries.length
}
