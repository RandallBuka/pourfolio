/** Mission Liquor Shopify store — clean single-bottle product shots on white backgrounds. */
export const MISSION_LIQUOR_SHOPIFY_STORE = '/s/files/1/0144/7703/3526/'

const REJECTED_URL_RE =
  /(wikimedia|wikipedia|thecocktaildb|openfoodfacts|wine_glass|cocktail|in_glass|_glass\.|hands?|people|person|lineup|shelf|smirnoff|distillery|panoramio|geograph|pinimg|pinterest|i\.pinimg)/i

const MULTI_PRODUCT_RE =
  /\b(6pk|multipack|pack of|sampler|gift set|variety|tasting set|3-pack|3 pack|4-pack|lineup|collection|assortment)\b/i

/** If present in the image URL path but not the ingredient name, the bottle is likely the wrong variant. */
const VARIANT_TERMS = [
  'soccer', 'nba', 'nfl', 'winter', 'christmas', 'halloween', 'holiday', 'commemorative',
  'collaboration', 'gift-set', 'gift_set', '6pk', 'multipack', 'swarovski', 'sparkles', 'esotico',
]

/** Shopify product CDN paths from liquor retailers — typically white-bg bottle photography. */
const TRUSTED_PRODUCT_CDN_RE =
  /(missionliquor\.com\/cdn\/shop\/|cdn\.shopify\.com\/s\/files\/[^/]+\/(?:products|files)\/)/i

const WHITE_BG_HINT_RE = /\b(white\s*background|isolated|product\s*shot|highres|high-res|on\s*white)\b/i

function urlVariantMismatch(url: string, ingredientName: string): boolean {
  const path = url.toLowerCase()
  const name = ingredientName.toLowerCase()
  for (const term of VARIANT_TERMS) {
    if (path.includes(term) && !name.includes(term)) return true
  }
  return false
}

/**
 * Strict quality gate for ingredients AFTER the black-olives anchor.
 * Accepts Mission Liquor and similar retailer product shots on white backgrounds.
 */
export function isProfessionalIngredientImageUrl(url: string, ingredientName = '', label = ''): boolean {
  if (!url?.trim()) return false
  if (REJECTED_URL_RE.test(url)) return false
  if (MULTI_PRODUCT_RE.test(`${label} ${url}`)) return false

  const trustedCdn = TRUSTED_PRODUCT_CDN_RE.test(url)
  const whiteHint = WHITE_BG_HINT_RE.test(`${label} ${url}`)

  if (!trustedCdn && !whiteHint) return false
  if (ingredientName && urlVariantMismatch(url, ingredientName)) return false

  return true
}
