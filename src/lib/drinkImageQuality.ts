/** Trusted CocktailDB drink photography. */
export const COCKTAILDB_DRINK_MEDIA_RE = /thecocktaildb\.com\/images\/media\/drink\//i

const REJECTED_URL_RE =
  /(pinimg|pinterest|istockphoto|shutterstock|gettyimages|alamy|dreamstime|hands?|holding|bartender|server|selfie|people|person|portrait|headshot|crowd|bar back|backbar|lineup|shelf|warehouse|logo|distillery|factory|building|cityscape|landscape|panoramio|geograph|\.svg|\.pdf|gun|magnum\.jpg|fleming007|earthrise|evening_light|arnoldpalmer\.jpg\/330)/i

const REJECTED_LABEL_RE =
  /\b(hand|hands|holding|bartender|server|selfie|people|person|portrait|recipe card|menu board|bar interior|cityscape|landscape|movie|poster|actor|gun|firearm)\b/i

const TRUSTED_COCKTAIL_CDN_RE =
  /(thecocktaildb\.com\/images\/media\/drink\/|liquor\.com\/thmb\/|seriouseats\.com\/|diffordsguide\.com\/|cocktailpartyapp\.com\/|thespruceeats\.com\/|foodandwine\.com\/|tastingtable\.com\/)/i

export function normalizeDrinkName(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[''`]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function drinkNameMatchScore(target: string, candidate: string): number {
  const targetTokens = normalizeDrinkName(target).split(' ').filter((t) => t.length > 1)
  const candidateTokens = new Set(normalizeDrinkName(candidate).split(' ').filter((t) => t.length > 1))
  if (targetTokens.length === 0 || candidateTokens.size === 0) return 0
  let hits = 0
  for (const token of targetTokens) {
    if (candidateTokens.has(token)) hits++
  }
  return hits / targetTokens.length
}

export function isProfessionalDrinkImageUrl(url: string, drinkName = '', label = ''): boolean {
  if (!url?.trim()) return false
  if (REJECTED_URL_RE.test(url)) return false
  if (REJECTED_LABEL_RE.test(label)) return false

  if (COCKTAILDB_DRINK_MEDIA_RE.test(url)) return true
  if (TRUSTED_COCKTAIL_CDN_RE.test(url)) {
    if (drinkName && drinkNameMatchScore(drinkName, label) < 0.35) return false
    return true
  }

  // Allow other URLs only with strong name match in the result label.
  if (drinkName && label && drinkNameMatchScore(drinkName, label) >= 0.55) {
    if (REJECTED_URL_RE.test(label)) return false
    return !REJECTED_LABEL_RE.test(label)
  }

  return false
}

export function drinkSearchQueries(name: string): string[] {
  const set = new Set<string>()
  set.add(name)
  set.add(`${name} cocktail`)
  set.add(`${name} drink`)

  const withoutShot = name.replace(/\s+(Shot|Shooter)$/i, '').trim()
  if (withoutShot !== name) {
    set.add(withoutShot)
    set.add(`${withoutShot} cocktail`)
  }

  const withoutCocktail = name.replace(/\s+Cocktail$/i, '').trim()
  if (withoutCocktail !== name) set.add(withoutCocktail)

  const paren = name.replace(/\s*\([^)]*\)\s*/g, '').trim()
  if (paren !== name) {
    set.add(paren)
    set.add(`${paren} cocktail`)
  }

  const noNumber = name.replace(/\s*#\d+\s*/g, ' ').replace(/\s+/g, ' ').trim()
  if (noNumber !== name) {
    set.add(noNumber)
    set.add(`${noNumber} cocktail`)
  }

  return [...set]
}
