import { scaleAmount } from './recipeScale'
import type { Drink } from '../types'

export function formatRecipeForShare(drink: Drink, guests = 1): string {
  const lines: string[] = [
    drink.name,
    `${drink.type} · ${drink.glass}`,
    '',
    'Ingredients:',
    ...drink.ingredients.map((req) => {
      const amount = scaleAmount(req.amount, guests)
      const name = req.brandName ?? req.genericName
      const suffix = req.optional ? ' (optional)' : ''
      return `- ${amount ? `${amount} ` : ''}${name}${suffix}`
    }),
    '',
    'Instructions:',
    drink.instructions,
  ]
  return lines.join('\n')
}

export async function shareRecipe(drink: Drink, guests = 1): Promise<'shared' | 'copied'> {
  const text = formatRecipeForShare(drink, guests)
  const title = `${drink.name} — Pourfolio`

  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ title, text })
      return 'shared'
    } catch (err) {
      if ((err as Error).name === 'AbortError') throw err
    }
  }

  await navigator.clipboard.writeText(text)
  return 'copied'
}
