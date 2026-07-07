import type { IngredientCategory } from '../types'

const OFF_BASE = 'https://world.openfoodfacts.org/api/v2/product'
const USER_AGENT = 'Pourfolio/1.0 (home bar app; contact: local)'

export interface ScannedProduct {
  barcode: string
  name: string
  genericName: string
  company?: string
  country?: string
  category: IngredientCategory
  type?: string
  flavor?: string
  image?: string
}

interface OffProduct {
  product_name?: string
  product_name_en?: string
  brands?: string
  categories?: string
  categories_tags?: string[]
  countries?: string
  countries_tags?: string[]
  image_front_url?: string
  image_url?: string
  quantity?: string
}

const GENERIC_FROM_TAGS: Array<{ pattern: RegExp; genericName: string; category: IngredientCategory; type?: string }> = [
  { pattern: /vodka/i, genericName: 'Vodka', category: 'Spirits', type: 'Vodka' },
  { pattern: /gin/i, genericName: 'Gin', category: 'Spirits', type: 'Gin' },
  { pattern: /rum/i, genericName: 'Rum', category: 'Spirits', type: 'Rum' },
  { pattern: /bourbon/i, genericName: 'Bourbon', category: 'Spirits', type: 'Whiskey' },
  { pattern: /whisk(e)?y|scotch|rye/i, genericName: 'Whiskey', category: 'Spirits', type: 'Whiskey' },
  { pattern: /tequila|mezcal/i, genericName: 'Tequila', category: 'Spirits', type: 'Tequila' },
  { pattern: /brandy|cognac/i, genericName: 'Brandy', category: 'Spirits', type: 'Brandy' },
  { pattern: /liqueur|schnapps|amaretto|kahlua|baileys/i, genericName: 'Liqueur', category: 'Liqueurs' },
  { pattern: /vermouth/i, genericName: 'Vermouth', category: 'Spirits' },
  { pattern: /bitters/i, genericName: 'Bitters', category: 'Mixers' },
  { pattern: /wine|prosecco|champagne/i, genericName: 'Wine', category: 'Spirits' },
  { pattern: /beer|ale|lager|cider/i, genericName: 'Beer', category: 'Mixers' },
  { pattern: /soda|tonic|cola|mixer/i, genericName: 'Soda', category: 'Mixers' },
  { pattern: /juice/i, genericName: 'Juice', category: 'Juices' },
  { pattern: /syrup/i, genericName: 'Simple Syrup', category: 'Mixers' },
  { pattern: /spirit/i, genericName: 'Spirit', category: 'Spirits' },
]

function haystackFromProduct(product: OffProduct): string {
  return [
    product.product_name,
    product.product_name_en,
    product.categories,
    ...(product.categories_tags ?? []).map((t) => t.replace(/^en:/, '').replace(/-/g, ' ')),
  ]
    .filter(Boolean)
    .join(' ')
}

function inferFromText(text: string): Pick<ScannedProduct, 'genericName' | 'category' | 'type'> {
  for (const rule of GENERIC_FROM_TAGS) {
    if (rule.pattern.test(text)) {
      return { genericName: rule.genericName, category: rule.category, type: rule.type }
    }
  }
  return { genericName: 'Spirit', category: 'Spirits' }
}

function parseCountry(product: OffProduct): string | undefined {
  const raw = product.countries?.split(',')[0]?.trim()
  if (raw) return raw
  const tag = product.countries_tags?.[0]
  if (!tag) return undefined
  return tag.replace(/^en:/, '').replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function cleanName(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

export function mapOpenFoodFactsProduct(barcode: string, product: OffProduct): ScannedProduct | null {
  const name = cleanName(product.product_name_en || product.product_name || '')
  if (!name) return null

  const text = haystackFromProduct(product)
  const inferred = inferFromText(text)
  const company = product.brands?.split(',')[0]?.trim()

  return {
    barcode,
    name,
    genericName: inferred.genericName,
    company: company || undefined,
    country: parseCountry(product),
    category: inferred.category,
    type: inferred.type,
    image: product.image_front_url || product.image_url || undefined,
  }
}

export async function lookupBarcode(barcode: string): Promise<ScannedProduct | null> {
  const normalized = barcode.replace(/\D/g, '')
  if (normalized.length < 8) return null

  try {
    const res = await fetch(`${OFF_BASE}/${normalized}.json`, {
      headers: { 'User-Agent': USER_AGENT },
    })
    if (!res.ok) return null
    const data = (await res.json()) as { status?: number; product?: OffProduct }
    if (data.status !== 1 || !data.product) return null
    return mapOpenFoodFactsProduct(normalized, data.product)
  } catch {
    return null
  }
}
