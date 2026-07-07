import type { Drink, RecipeIngredient } from '../types'

const INSTRUCTION_MARKERS = /^instructions?:?\s*$/i

function parseIngredientLine(line: string): RecipeIngredient | null {
  const trimmed = line.replace(/^[-•*]\s*/, '').trim()
  if (!trimmed) return null

  const match = trimmed.match(
    /^([\d¼½¾./\s]+(?:oz|ml|dash(?:es)?|cup|cups|tsp|tbsp|slice|slices|cube|cubes|piece|pieces|sprig|sprigs)?\.?)\s+(.+)$/i
  )

  if (match) {
    return {
      genericName: match[2].trim(),
      amount: match[1].trim(),
      allowGenericSubstitution: true,
      optional: false,
      mode: 'generic',
    }
  }

  return {
    genericName: trimmed,
    amount: '',
    allowGenericSubstitution: true,
    optional: false,
    mode: 'generic',
  }
}

export function parseRecipeText(text: string): Omit<Drink, 'id' | 'isCustom'> | null {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  if (lines.length < 2) return null

  const name = lines[0]
  const ingredients: RecipeIngredient[] = []
  const instructionLines: string[] = []
  let inInstructions = false

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    if (INSTRUCTION_MARKERS.test(line)) {
      inInstructions = true
      continue
    }
    if (inInstructions) {
      instructionLines.push(line)
      continue
    }
    if (/^instructions?:/i.test(line)) {
      inInstructions = true
      const rest = line.replace(/^instructions?:\s*/i, '').trim()
      if (rest) instructionLines.push(rest)
      continue
    }
    const ing = parseIngredientLine(line)
    if (ing) ingredients.push(ing)
  }

  if (ingredients.length === 0) return null

  return {
    name,
    type: 'Cocktail',
    glass: 'Glass',
    instructions: instructionLines.join('\n').trim() || 'Combine ingredients and serve.',
    ingredients,
  }
}
