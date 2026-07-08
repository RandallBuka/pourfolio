export interface IngredientImageQuery {
  id: string
  name: string
  genericName: string
  company?: string
}

const USER_AGENT = 'Pourfolio/1.0 (https://github.com/randallbuka/pourfolio)'
const REQUEST_TIMEOUT_MS = 12_000

async function fetchTimed(url: string, init: RequestInit = {}): Promise<Response | null> {
  try {
    return await fetch(url, {
      ...init,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
  } catch {
    return null
  }
}

const GENERIC_CDB_SPIRITS = new Set([
  'vodka', 'gin', 'rum', 'bourbon', 'whiskey', 'whisky', 'scotch', 'tequila', 'mezcal',
  'brandy', 'cognac', 'liqueur', 'schnapps', 'vermouth', 'bitters', 'wine', 'champagne',
  'prosecco', 'beer', 'cider', 'absinthe', 'amaretto', 'campari', 'aperol', 'sherry',
  'port', 'rye', 'moonshine', 'soju', 'shochu', 'cachaca', 'pisco', 'aquavit',
])

const BAD_FILE_RE =
  /\b(logo|distillery|factory|building|map|location|panoramio|geograph|wine glass|red wine glass|cocktail|martini|drink in|in glass|tasting|hand|hands|finger|selfie|shelf|lineup|collection|variety|parade|memorial|category class|portal class|symbol |\.svg|\.pdf|restaurant|menu board|sign only|tap handle|beer tap|mug|pint|party|crowd|people|person|portrait|headshot|banner|advertisement|ad campaign|store front|shop front|warehouse|pallet|carton|box set|gift set|multiple bottles|assortment|selection of|range of|group of|row of|line of|display case|bar back|backbar|bartender|server|holding|pouring|serving|cheers|toast)\b/i

const BAD_URL_RE =
  /(\/Vodka-Medium\.png|\/Vodka-Small\.png|\/Gin-Medium\.png|\/Gin-Small\.png|\/Rum-Medium\.png|\/Rum-Small\.png|\/Bourbon-Medium\.png|\/Bourbon-Small\.png|\/Whiskey-Medium\.png|\/Whiskey-Small\.png|\/Scotch-Medium\.png|\/Scotch-Small\.png|\/Tequila-Medium\.png|\/Brandy-Medium\.png|\/Cognac-Medium\.png|\/Liqueur-Medium\.png|wine_glass|cocktail|in_glass|_glass\.|hands?|people|person|lineup|shelf|smirnoff)/i

const BOTTLE_HINT_RE =
  /\b(bottle|bottled|product|label|spirit|single malt|blended|straight|reserve|edition|proof|ml|liter|litre|750|700ml|1l)\b/i

export function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['']/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function tokens(value: string): string[] {
  const stop = new Set([
    'the', 'and', 'or', 'of', 'a', 'an', 'year', 'years', 'old', 'aged', 'proof', 'reserve',
    'straight', 'bottled', 'in', 'bond', 'single', 'barrel', 'batch', 'small', 'select',
    'premium', 'original', 'classic', 'special', 'limited', 'edition', 'brand', 'product',
  ])
  return normalizeName(value)
    .split(' ')
    .filter((t) => t.length > 1 && !stop.has(t))
}

export function nameMatchScore(target: string, candidate: string): number {
  const targetTokens = tokens(target)
  const candidateTokens = new Set(tokens(candidate))
  if (targetTokens.length === 0 || candidateTokens.size === 0) return 0
  let hits = 0
  for (const token of targetTokens) {
    if (candidateTokens.has(token)) hits++
  }
  return hits / targetTokens.length
}

export function isBrandedIngredient(ing: IngredientImageQuery): boolean {
  return normalizeName(ing.name) !== normalizeName(ing.genericName)
}

export function isGenericCdbIngredientUrl(url: string): boolean {
  const match = url.match(/\/ingredients\/([^-]+)-(?:Medium|Small)\.png/i)
  if (!match) return false
  return GENERIC_CDB_SPIRITS.has(match[1].toLowerCase())
}

export function scoreImageCandidate(
  ing: IngredientImageQuery,
  label: string,
  url: string,
  source: 'commons' | 'wikipedia' | 'off' | 'cdb' | 'other'
): number {
  const combined = `${label} ${url}`
  const normalizedLabel = normalizeName(label)
  const normalizedUrl = url.toLowerCase()

  if (BAD_FILE_RE.test(combined)) return -1
  if (/\.svg(\.|$)/i.test(normalizedUrl)) return -1
  if (isBrandedIngredient(ing)) {
    if (BAD_URL_RE.test(normalizedUrl)) return -1
    if (isGenericCdbIngredientUrl(url)) return -1
  }

  let score = nameMatchScore(ing.name, label)
  if (ing.company && nameMatchScore(ing.company, label) >= 0.5) score += 0.15

  const brandHint = tokens(ing.name.split(/\s+/).slice(0, 2).join(' ')).join(' ')
  if (brandHint && normalizedLabel.includes(brandHint.split(' ')[0])) score += 0.1

  if (BOTTLE_HINT_RE.test(combined)) score += 0.12
  if (/\bbottle\b/i.test(combined)) score += 0.18
  if (source === 'off' && /image_front/i.test(url)) score += 0.2
  if (source === 'cdb' && normalizeName(label) !== normalizeName(ing.name)) score -= 0.35

  // Penalize wrong-brand wikipedia/commons picks (e.g. Bowmore for Aberlour)
  const labelTokens = tokens(label)
  const nameTokens = tokens(ing.name)
  const primaryBrand = nameTokens[0]
  if (
    primaryBrand &&
    labelTokens.length > 0 &&
    !labelTokens.includes(primaryBrand) &&
    source !== 'off'
  ) {
    const labelBrand = labelTokens[0]
    if (labelBrand && labelBrand !== primaryBrand && nameMatchScore(ing.name, label) < 0.45) {
      score -= 0.55
    }
  }

  if (/\b(distillery|factory|building|panoramio|geograph)\b/i.test(combined)) score -= 0.8
  if (/\b(glass|cocktail|drink)\b/i.test(combined)) score -= 0.65

  return score
}

export function isAcceptableIngredientImage(
  ing: IngredientImageQuery,
  label: string,
  url: string,
  source: 'commons' | 'wikipedia' | 'off' | 'cdb' | 'other'
): boolean {
  return scoreImageCandidate(ing, label, url, source) >= 0.42
}

async function headOk(url: string): Promise<boolean> {
  try {
    const res = await fetchTimed(url, { method: 'HEAD', redirect: 'follow', headers: { 'User-Agent': USER_AGENT } })
    if (!res) return false
    const type = res.headers.get('content-type') || ''
    return res.ok && type.startsWith('image/')
  } catch {
    return false
  }
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetchTimed(url, { headers: { 'User-Agent': USER_AGENT } })
    if (!res?.ok) return null
    const text = await res.text()
    if (text.trimStart().startsWith('<!')) return null
    return JSON.parse(text) as T
  } catch {
    return null
  }
}

async function tryCocktailDbExact(name: string): Promise<string | null> {
  for (const size of ['Medium', 'Small']) {
    const url = `https://www.thecocktaildb.com/images/ingredients/${encodeURIComponent(name)}-${size}.png`
    if (await headOk(url)) return url
  }
  return null
}

type OffProduct = {
  product_name?: string
  brands?: string
  image_front_url?: string
  image_url?: string
  image_small_url?: string
}

async function tryOpenFoodFacts(ing: IngredientImageQuery): Promise<string | null> {
  const hosts = ['https://world.openfoodfacts.org', 'https://us.openfoodfacts.org']
  let best: { url: string; score: number; label: string } | null = null

  for (const host of hosts) {
    const url =
      `${host}/cgi/search.pl?search_terms=${encodeURIComponent(ing.name)}` +
      '&search_simple=1&action=process&json=1&page_size=12'
    const data = await fetchJson<{ products?: OffProduct[] }>(url)
    for (const product of data?.products ?? []) {
      const label = [product.brands, product.product_name].filter(Boolean).join(' ')
      const img = product.image_front_url || product.image_url || product.image_small_url
      if (!img) continue
      const score = scoreImageCandidate(ing, label, img, 'off')
      if (score < 0.5) continue
      if (!best || score > best.score) best = { url: img, score, label }
    }
  }

  if (!best) return null
  if (!(await headOk(best.url))) return null
  return best.url
}

type WikiSearchHit = { title: string }
type WikiPage = {
  title?: string
  thumbnail?: { source?: string }
  images?: Array<{ title: string }>
}

async function wikiPageImages(title: string): Promise<Array<{ title: string; url: string }>> {
  const api =
    'https://en.wikipedia.org/w/api.php?action=query&prop=images&titles=' +
    `${encodeURIComponent(title)}&format=json&origin=*`
  const data = await fetchJson<{ query?: { pages?: Record<string, WikiPage> } }>(api)
  const page = Object.values(data?.query?.pages ?? {})[0]
  const files = (page?.images ?? [])
    .map((img) => img.title)
    .filter((title) => title.startsWith('File:') && !BAD_FILE_RE.test(title))

  const out: Array<{ title: string; url: string }> = []
  for (const fileTitle of files.slice(0, 6)) {
    const infoUrl =
      'https://commons.wikimedia.org/w/api.php?action=query&titles=' +
      `${encodeURIComponent(fileTitle)}&prop=imageinfo&iiprop=url|mime&iiurlwidth=500&format=json&origin=*`
    const info = await fetchJson<{ query?: { pages?: Record<string, { imageinfo?: Array<{ thumburl?: string; mime?: string }> }> } }>(
      infoUrl
    )
    const imageinfo = Object.values(info?.query?.pages ?? {})[0]?.imageinfo?.[0]
    const url = imageinfo?.thumburl
    const mime = imageinfo?.mime ?? ''
    if (!url || mime.includes('svg')) continue
    out.push({ title: fileTitle, url })
  }
  return out
}

async function tryWikipediaImages(ing: IngredientImageQuery): Promise<string | null> {
  const queries = [
    ing.name,
    `${ing.name} ${ing.genericName}`,
    ing.company ? `${ing.company} ${ing.genericName}` : '',
  ].filter(Boolean)

  let best: { url: string; score: number; label: string } | null = null

  for (const query of queries) {
    const searchUrl =
      'https://en.wikipedia.org/w/api.php?action=query&list=search' +
      `&srsearch=${encodeURIComponent(query)}&srlimit=5&format=json&origin=*`
    const data = await fetchJson<{ query?: { search?: WikiSearchHit[] } }>(searchUrl)
    for (const hit of data?.query?.search ?? []) {
      if (nameMatchScore(ing.name, hit.title) < 0.25 && !normalizeName(hit.title).includes(tokens(ing.name)[0] ?? '')) {
        continue
      }
      const images = await wikiPageImages(hit.title)
      for (const image of images) {
        const score = scoreImageCandidate(ing, `${hit.title} ${image.title}`, image.url, 'wikipedia')
        if (score < 0.42) continue
        if (!best || score > best.score) best = { url: image.url, score, label: image.title }
      }
    }
  }

  if (!best) return null
  if (!(await headOk(best.url))) return null
  return best.url
}

async function tryCommonsSearch(ing: IngredientImageQuery): Promise<string | null> {
  const brand = tokens(ing.name)[0] ?? ''
  const queries = isBrandedIngredient(ing)
    ? [
        `${ing.name} bottle`,
        `${brand} ${ing.genericName} bottle`,
        `${brand} single malt bottle`,
        `${brand} whisky bottle`,
        `${brand} ${ing.genericName}`,
        ing.name,
      ]
    : [`${ing.name} bottle`, ing.name]
  let best: { url: string; score: number; label: string } | null = null

  for (const query of queries) {
    const api =
      'https://commons.wikimedia.org/w/api.php?action=query&list=search' +
      `&srsearch=${encodeURIComponent(query)}&srnamespace=6&srlimit=12&format=json&origin=*`
    const data = await fetchJson<{ query?: { search?: Array<{ title: string }> } }>(api)
    for (const hit of data?.query?.search ?? []) {
      if (BAD_FILE_RE.test(hit.title) || /\.pdf$/i.test(hit.title)) continue
      const infoUrl =
        'https://commons.wikimedia.org/w/api.php?action=query&titles=' +
        `${encodeURIComponent(hit.title)}&prop=imageinfo&iiprop=url|mime&iiurlwidth=500&format=json&origin=*`
      const info = await fetchJson<{ query?: { pages?: Record<string, { imageinfo?: Array<{ thumburl?: string; mime?: string }> }> } }>(
        infoUrl
      )
      const imageinfo = Object.values(info?.query?.pages ?? {})[0]?.imageinfo?.[0]
      const url = imageinfo?.thumburl
      const mime = imageinfo?.mime ?? ''
      if (!url || mime.includes('svg')) continue
      const score = scoreImageCandidate(ing, hit.title, url, 'commons')
      if (score < 0.42) continue
      if (!best || score > best.score) best = { url, score, label: hit.title }
    }
  }

  if (!best) return null
  if (!(await headOk(best.url))) return null
  return best.url
}

async function tryBrandParentBottle(ing: IngredientImageQuery): Promise<string | null> {
  const brand = tokens(ing.name)[0]
  if (!brand) return null
  const query = `${brand} ${ing.genericName} bottle`
  const api =
    'https://commons.wikimedia.org/w/api.php?action=query&list=search' +
    `&srsearch=${encodeURIComponent(query)}&srnamespace=6&srlimit=10&format=json&origin=*`
  const data = await fetchJson<{ query?: { search?: Array<{ title: string }> } }>(api)

  let best: { url: string; score: number } | null = null
  for (const hit of data?.query?.search ?? []) {
    if (!normalizeName(hit.title).includes(brand)) continue
    if (BAD_FILE_RE.test(hit.title)) continue
    const infoUrl =
      'https://commons.wikimedia.org/w/api.php?action=query&titles=' +
      `${encodeURIComponent(hit.title)}&prop=imageinfo&iiprop=url|mime&iiurlwidth=500&format=json&origin=*`
    const info = await fetchJson<{ query?: { pages?: Record<string, { imageinfo?: Array<{ thumburl?: string; mime?: string }> }> } }>(
      infoUrl
    )
    const imageinfo = Object.values(info?.query?.pages ?? {})[0]?.imageinfo?.[0]
    const url = imageinfo?.thumburl
    const mime = imageinfo?.mime ?? ''
    if (!url || mime.includes('svg')) continue
    const score = scoreImageCandidate(ing, hit.title, url, 'commons')
    if (score < 0.48) continue
    if (!best || score > best.score) best = { url, score }
  }

  if (!best) return null
  if (!(await headOk(best.url))) return null
  return best.url
}

async function tryGenericFallback(ing: IngredientImageQuery): Promise<string | null> {
  const cdb = await tryCocktailDbExact(ing.genericName)
  if (!cdb) return null
  if (!isAcceptableIngredientImage(ing, ing.genericName, cdb, 'cdb')) return null
  return cdb
}

export async function resolveIngredientImage(ing: IngredientImageQuery): Promise<string | null> {
  const branded = isBrandedIngredient(ing)
  const attempts: Array<() => Promise<string | null>> = branded
    ? [
        () => tryOpenFoodFacts(ing),
        () => tryCommonsSearch(ing),
        () => tryWikipediaImages(ing),
        () => tryBrandParentBottle(ing),
        () => tryCocktailDbExact(ing.name),
      ]
    : [
        () => tryCocktailDbExact(ing.genericName),
        () => tryCommonsSearch(ing),
        () => tryWikipediaImages(ing),
        () => tryOpenFoodFacts(ing),
      ]

  for (const attempt of attempts) {
    const url = await attempt()
    if (!url) continue
    const label = ing.name
    if (isAcceptableIngredientImage(ing, label, url, branded ? 'other' : 'cdb')) {
      return url
    }
  }

  if (branded) return null
  return tryGenericFallback(ing)
}

const INGREDIENT_RESOLVE_TIMEOUT_MS = 45_000

export async function resolveIngredientImageWithTimeout(
  ing: IngredientImageQuery,
  timeoutMs = INGREDIENT_RESOLVE_TIMEOUT_MS
): Promise<string | null> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      resolveIngredientImage(ing),
      new Promise<null>((resolve) => {
        timer = setTimeout(() => resolve(null), timeoutMs)
      }),
    ])
  } catch {
    return null
  } finally {
    if (timer) clearTimeout(timer)
  }
}

export function shouldUseIngredientImageUrl(ing: IngredientImageQuery, url: string): boolean {
  if (!url) return false
  if (isBrandedIngredient(ing) && isGenericCdbIngredientUrl(url)) return false
  return isAcceptableIngredientImage(ing, ing.name, url, 'other')
}
