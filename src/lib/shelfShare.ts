import type { BarProfile, Ingredient } from '../types'

export interface SharedShelfItem {
  name: string
  genericName: string
  company?: string
  category?: string
}

export interface SharedShelfData {
  v: 1
  name: string
  sharedAt: string
  items: SharedShelfItem[]
}

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  bytes.forEach((b) => { binary += String.fromCharCode(b) })
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(encoded: string): string {
  const padded = encoded.replace(/-/g, '+').replace(/_/g, '/')
  const pad = padded.length % 4 === 0 ? padded : padded + '='.repeat(4 - (padded.length % 4))
  const binary = atob(pad)
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

export function buildSharedShelf(bar: BarProfile, ingredientMap: Map<string, Ingredient>): SharedShelfData {
  const items = bar.ingredientIds
    .map((id) => ingredientMap.get(id))
    .filter((i): i is Ingredient => !!i)
    .map((i) => ({
      name: i.name,
      genericName: i.genericName,
      company: i.company,
      category: i.category,
    }))
    .sort((a, b) => a.name.localeCompare(b.name))

  return {
    v: 1,
    name: bar.name,
    sharedAt: new Date().toISOString(),
    items,
  }
}

export function encodeSharedShelf(data: SharedShelfData): string {
  return toBase64Url(JSON.stringify(data))
}

export function decodeSharedShelf(encoded: string): SharedShelfData | null {
  try {
    const json = fromBase64Url(encoded)
    const data = JSON.parse(json) as SharedShelfData
    if (data.v !== 1 || !data.name || !Array.isArray(data.items)) return null
    return data
  } catch {
    return null
  }
}

export function getShareUrl(encoded: string): string {
  const base = `${window.location.origin}${window.location.pathname}`
  return `${base}#/share/${encoded}`
}

export function getShareQrUrl(shareUrl: string): string {
  return `https://quickchart.io/qr?size=240&margin=1&text=${encodeURIComponent(shareUrl)}`
}
