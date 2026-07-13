/** Mission Liquor Shopify store — clean single-bottle product shots on white backgrounds. */
export const MISSION_LIQUOR_SHOPIFY_STORE = '/s/files/1/0144/7703/3526/'

const REJECTED_URL_RE =
  /(wikimedia|wikipedia|thecocktaildb|openfoodfacts|wine_glass|cocktail|in_glass|_glass\.|hands?|people|person|lineup|shelf|smirnoff|distillery|panoramio|geograph|pinimg|pinterest|i\.pinimg|alamy|ftcdn|dreamstime|freepik|gettyimages|shutterstock|123rf|pngtree|envato)/i

const MULTI_PRODUCT_RE =
  /\b(6pk|multipack|pack of|sampler|gift set|variety|tasting set|3-pack|3 pack|4-pack|lineup|collection|assortment)\b/i

/** If present in the image URL path but not the ingredient name, the bottle is likely the wrong variant. */
const VARIANT_TERMS = [
  'soccer', 'nba', 'nfl', 'winter', 'christmas', 'halloween', 'holiday', 'commemorative',
  'collaboration', 'gift-set', 'gift_set', '6pk', 'multipack', 'swarovski', 'sparkles', 'esotico',
]

/** Shopify product CDN paths from liquor retailers — typically white-bg bottle photography. */
const TRUSTED_PRODUCT_CDN_RE =
  /(missionliquor\.com\/cdn\/shop\/|cdn\.shopify\.com\/s\/files\/(?:[^/]+\/)*(?:products|files)\/)/i

const WHITE_BG_HINT_RE = /\b(white\s*background|isolated|product\s*shot|highres|high-res|on\s*white)\b/i

const NAME_STOP_WORDS = new Set([
  'the', 'and', 'or', 'of', 'a', 'an', 'year', 'years', 'old', 'aged', 'proof', 'reserve',
  'straight', 'bottled', 'in', 'bond', 'single', 'barrel', 'batch', 'small', 'select',
  'premium', 'original', 'classic', 'special', 'limited', 'edition', 'brand', 'product',
  'liqueur', 'liquor', 'spirit', 'spirits', 'ml', 'liter', 'litre',
])

function distinctiveTokens(ingredientName: string): string[] {
  return ingredientName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2 && !NAME_STOP_WORDS.has(t))
}

/** Non-retailer URLs must include a product-specific token from the ingredient name. */
function urlMatchesIngredient(url: string, ingredientName: string, label = ''): boolean {
  if (!ingredientName.trim()) return true
  const haystack = `${label} ${url}`.toLowerCase()
  const tokens = distinctiveTokens(ingredientName)
  if (tokens.length === 0) return true

  const brand = tokens[0]
  const productTokens = tokens.slice(1)
  if (productTokens.length === 0) return haystack.includes(brand)

  return productTokens.some((token) => haystack.includes(token))
}

const PRODUCT_WORDS = [
  'advocaat', 'amaretto', 'apricot', 'banana', 'blackberry', 'blue', 'bourbon', 'brandy', 'butterscotch',
  'cassis', 'cherry', 'cognac', 'curacao', 'genever', 'gin', 'goldstrike', 'pomegranate', 'pumpkin',
  'rum', 'rye', 'schnapps', 'scotch', 'strawberry', 'tequila', 'triple', 'vodka', 'whiskey', 'whisky',
]

/** Reject URLs that clearly depict a different product variant than the ingredient name. */
function urlProductConflict(url: string, ingredientName: string, label = ''): boolean {
  const haystack = `${label} ${url}`.toLowerCase()
  const name = ingredientName.toLowerCase()
  for (const word of PRODUCT_WORDS) {
    if (haystack.includes(word) && !name.includes(word)) return true
  }
  return false
}

function urlVariantMismatch(url: string, ingredientName: string): boolean {
  const path = url.toLowerCase()
  const name = ingredientName.toLowerCase()
  for (const term of VARIANT_TERMS) {
    if (path.includes(term) && !name.includes(term)) return true
  }
  return false
}

/**
 * Quality gate for ingredient image URLs at write time (fetch/prune scripts).
 * The app shows whatever is stored in ingredient-images.json without re-filtering.
 */
export function isProfessionalIngredientImageUrl(url: string, ingredientName = '', label = ''): boolean {
  if (!url?.trim()) return false
  if (REJECTED_URL_RE.test(url)) return false
  if (MULTI_PRODUCT_RE.test(`${label} ${url}`)) return false
  if (ingredientName && urlProductConflict(url, ingredientName, label)) return false
  if (ingredientName && urlVariantMismatch(url, ingredientName)) return false

  // User-curated Google thumbnails — no product metadata in the URL path.
  if (/encrypted-tbn0\.gstatic\.com/i.test(url)) return true

  const trustedCdn = TRUSTED_PRODUCT_CDN_RE.test(url)
  const whiteHint = WHITE_BG_HINT_RE.test(`${label} ${url}`)

  if (!trustedCdn && !whiteHint) return false
  if (!trustedCdn && !urlMatchesIngredient(url, ingredientName, label)) return false

  return true
}
