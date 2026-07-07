import { findLearnedLabel } from './labelOcrLearning'
import type { IngredientCategory } from '../types'

const TYPE_RULES: Array<{
  pattern: RegExp
  genericName: string
  category: IngredientCategory
  type?: string
}> = [
  { pattern: /vodka/i, genericName: 'Vodka', category: 'Spirits', type: 'Vodka' },
  { pattern: /gin/i, genericName: 'Gin', category: 'Spirits', type: 'Gin' },
  { pattern: /bourbon/i, genericName: 'Bourbon', category: 'Spirits', type: 'Whiskey' },
  { pattern: /rye/i, genericName: 'Rye Whiskey', category: 'Spirits', type: 'Whiskey' },
  { pattern: /scotch|single malt/i, genericName: 'Scotch', category: 'Spirits', type: 'Whiskey' },
  { pattern: /whisk(e)?y/i, genericName: 'Whiskey', category: 'Spirits', type: 'Whiskey' },
  { pattern: /tequila|mezcal/i, genericName: 'Tequila', category: 'Spirits', type: 'Tequila' },
  { pattern: /brandy|cognac/i, genericName: 'Brandy', category: 'Spirits', type: 'Brandy' },
  { pattern: /rum/i, genericName: 'Rum', category: 'Spirits', type: 'Rum' },
  { pattern: /liqueur|schnapps|amaretto|kahlua|baileys/i, genericName: 'Liqueur', category: 'Liqueurs' },
  { pattern: /vermouth/i, genericName: 'Vermouth', category: 'Spirits' },
  { pattern: /bitters/i, genericName: 'Bitters', category: 'Mixers' },
  { pattern: /champagne|prosecco|cava|sparkling/i, genericName: 'Champagne', category: 'Spirits' },
  { pattern: /red wine/i, genericName: 'Red Wine', category: 'Spirits' },
  { pattern: /white wine/i, genericName: 'White Wine', category: 'Spirits' },
  { pattern: /wine/i, genericName: 'Wine', category: 'Spirits' },
  { pattern: /beer|ale|lager|cider/i, genericName: 'Beer', category: 'Mixers' },
  { pattern: /juice/i, genericName: 'Juice', category: 'Juices' },
  { pattern: /syrup/i, genericName: 'Simple Syrup', category: 'Mixers' },
]

const SKIP_NAME = [
  /government warning/i,
  /surgeon general/i,
  /contains sulfites/i,
  /^\d+\s*ml$/i,
  /^[\d.%\s/\\-]+$/,
  /^product of\b/i,
  /^distilled/i,
  /^produced/i,
  /^bottled/i,
  /^imported/i,
  /^alcohol by volume/i,
  /^alc\.?\s*\d/i,
]

export interface ParsedLabel {
  name: string
  genericName: string
  company?: string
  country?: string
  abv?: number
  vintage?: number
  category: IngredientCategory
  type?: string
  rawText: string
  confidence: 'low' | 'medium' | 'high'
}

function cleanLine(line: string): string {
  return line.replace(/\s+/g, ' ').replace(/[|]/g, 'I').trim()
}

function inferType(text: string) {
  for (const rule of TYPE_RULES) {
    if (rule.pattern.test(text)) {
      return {
        genericName: rule.genericName,
        category: rule.category,
        type: rule.type,
      }
    }
  }
  return { genericName: 'Spirit', category: 'Spirits' as IngredientCategory, type: undefined }
}

function extractAbv(text: string): number | undefined {
  const patterns = [
    /(\d{1,2}(?:\.\d+)?)\s*%\s*(?:alc|abv|vol|alcohol)/i,
    /(?:alc|abv|alcohol)[^\d]{0,12}(\d{1,2}(?:\.\d+)?)\s*%/i,
    /\b(\d{1,2}(?:\.\d+)?)\s*%\s*by\s*vol/i,
  ]
  for (const re of patterns) {
    const m = text.match(re)
    if (m) {
      const n = Number(m[1])
      if (n >= 0 && n <= 100) return n
    }
  }
  return undefined
}

function extractVintage(text: string, isWine: boolean): number | undefined {
  const years = [...text.matchAll(/\b(19[5-9]\d|20[0-3]\d)\b/g)].map((m) => Number(m[1]))
  if (years.length === 0) return undefined
  if (isWine) {
    const reasonable = years.filter((y) => y >= 1950 && y <= new Date().getFullYear() + 1)
    return reasonable.sort((a, b) => b - a)[0]
  }
  return undefined
}

function extractCompany(lines: string[]): string | undefined {
  for (const line of lines) {
    const m = line.match(/(?:distilled|produced|bottled|manufactured|imported)\s+by[:\s]+(.+)/i)
    if (m) return cleanLine(m[1]).slice(0, 80)
  }
  for (const line of lines) {
    const m = line.match(/(?:dist\.|prod\.|bottled)\s*by[:\s]+(.+)/i)
    if (m) return cleanLine(m[1]).slice(0, 80)
  }
  return undefined
}

function extractCountry(text: string): string | undefined {
  const m = text.match(/(?:product of|made in|bottled in)\s+([a-zA-Z\s.'-]{2,40})/i)
  if (!m) return undefined
  return cleanLine(m[1].replace(/\.$/, ''))
}

function pickName(lines: string[], fullText: string): string {
  const candidates = lines
    .map(cleanLine)
    .filter((l) => l.length >= 3 && l.length <= 72)
    .filter((l) => /[a-zA-Z]/.test(l))
    .filter((l) => !SKIP_NAME.some((re) => re.test(l)))

  const typed = inferType(fullText)

  for (const line of candidates) {
    if (typed.genericName !== 'Spirit' && new RegExp(typed.genericName, 'i').test(line) && line.length > typed.genericName.length + 2) {
      return line
    }
  }

  const scored = candidates.map((line) => {
    let score = line.length
    if (/^[A-Z0-9][A-Za-z0-9'&.\-\s]{2,}$/.test(line)) score += 8
    if (/\d{1,2}\s*ml/i.test(line)) score -= 20
    if (line.split(' ').length > 8) score -= 6
    return { line, score }
  })

  scored.sort((a, b) => b.score - a.score)
  return scored[0]?.line ?? candidates[0] ?? ''
}

export function parseLabelText(rawText: string): ParsedLabel {
  const normalized = rawText.replace(/\r/g, '\n')
  const lines = normalized.split('\n').map(cleanLine).filter(Boolean)
  const fullText = lines.join(' ')

  const inferred = inferType(fullText)
  const isWine = /wine|champagne|prosecco|cava/i.test(fullText)
  const abv = extractAbv(fullText)
  const vintage = extractVintage(fullText, isWine)
  const company = extractCompany(lines)
  const country = extractCountry(fullText)
  const name = pickName(lines, fullText)

  let confidence: ParsedLabel['confidence'] = 'low'
  if (name && inferred.genericName !== 'Spirit') confidence = 'medium'
  if (name && (abv != null || company || inferred.genericName !== 'Spirit')) confidence = 'high'

  let parsed: ParsedLabel = {
    name,
    genericName: inferred.genericName,
    company,
    country,
    abv,
    vintage,
    category: inferred.category,
    type: inferred.type,
    rawText: normalized.trim(),
    confidence,
  }

  const learned = findLearnedLabel(parsed.rawText, parsed.name)
  if (learned) {
    parsed = {
      ...parsed,
      name: learned.name,
      genericName: learned.genericName,
      company: learned.company ?? parsed.company,
      country: learned.country ?? parsed.country,
      category: learned.category,
      abv: learned.abv ?? parsed.abv,
      vintage: learned.vintage ?? parsed.vintage,
      confidence: 'high',
    }
  }

  return parsed
}
