import type { Ingredient } from '../types'

export function normalizeBarcode(raw: string): string {
  return raw.replace(/\D/g, '')
}

export function findIngredientByBarcode(
  ingredients: Ingredient[],
  barcode: string
): Ingredient | undefined {
  const normalized = normalizeBarcode(barcode)
  if (!normalized) return undefined
  return ingredients.find((ing) => ing.barcode === normalized)
}

export function findIngredientByNameHint(
  ingredients: Ingredient[],
  name: string,
  company?: string
): Ingredient | undefined {
  const target = name.toLowerCase()
  const companyTarget = company?.toLowerCase()

  const exact = ingredients.find(
    (ing) => ing.name.toLowerCase() === target
  )
  if (exact) return exact

  return ingredients.find((ing) => {
    const nameMatch = ing.name.toLowerCase().includes(target) || target.includes(ing.name.toLowerCase())
    if (!nameMatch) return false
    if (!companyTarget || !ing.company) return nameMatch
    return ing.company.toLowerCase().includes(companyTarget) || companyTarget.includes(ing.company.toLowerCase())
  })
}
