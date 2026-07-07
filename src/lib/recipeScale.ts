const FRACTIONS: Record<string, number> = {
  '¼': 0.25,
  '½': 0.5,
  '¾': 0.75,
  '⅓': 1 / 3,
  '⅔': 2 / 3,
  '⅛': 0.125,
}

function parseQuantity(token: string): number | null {
  const trimmed = token.trim()
  if (!trimmed) return null
  if (FRACTIONS[trimmed] !== undefined) return FRACTIONS[trimmed]

  const slash = trimmed.match(/^(\d+)\s*\/\s*(\d+)$/)
  if (slash) return Number(slash[1]) / Number(slash[2])

  const mixed = trimmed.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)$/)
  if (mixed) return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3])

  const n = Number(trimmed)
  return Number.isFinite(n) ? n : null
}

function formatQuantity(value: number): string {
  if (Math.abs(value - Math.round(value)) < 0.001) return String(Math.round(value))
  const quarters = Math.round(value * 4) / 4
  if (Math.abs(quarters - value) < 0.02) {
    const whole = Math.floor(quarters)
    const frac = quarters - whole
    const fracMap: Record<number, string> = { 0.25: '¼', 0.5: '½', 0.75: '¾' }
    const sym = fracMap[frac]
    if (sym) return whole > 0 ? `${whole} ${sym}` : sym
  }
  return value.toFixed(2).replace(/\.?0+$/, '')
}

/** Scale a recipe amount string by servings multiplier */
export function scaleAmount(amount: string, servings: number): string {
  if (servings === 1) return amount
  const lower = amount.toLowerCase()
  if (
    !amount.trim() ||
    lower.includes('to taste') ||
    lower.includes('garnish') ||
    lower.includes('top') ||
    lower.includes('fill') ||
    lower.includes('rim') ||
    lower.includes('coat') ||
    lower.includes('splash') ||
    lower.includes('dash') && !/\d/.test(amount)
  ) {
    return amount
  }

  const match = amount.match(/^([\d¼½¾⅓⅔⅛./\s]+)\s*(.*)$/)
  if (!match) return amount

  const qty = parseQuantity(match[1].trim())
  if (qty === null) return amount

  const scaled = qty * servings
  const unit = match[2].trim()
  const formatted = formatQuantity(scaled)
  return unit ? `${formatted} ${unit}` : formatted
}
