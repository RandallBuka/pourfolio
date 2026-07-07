import type { Ingredient, RecipeIngredient } from '../types'
import { normalize } from './matching'

export interface IngredientBrowseParams {
  q?: string
  genericName?: string
}

/** Build Stock tab URL params for a missing recipe ingredient */
export function getIngredientBrowseParams(
  req: RecipeIngredient,
  ingredients: Ingredient[]
): IngredientBrowseParams {
  const generic = req.genericName.trim()
  const display = (req.brandName ?? req.genericName).trim()

  const sameGeneric = ingredients.filter(
    (i) => normalize(i.genericName) === normalize(generic)
  )

  const nameMatches = ingredients.filter((i) => {
    const n = normalize(i.name)
    const g = normalize(generic)
    const d = normalize(display)
    return n === d || n.includes(d) || d.includes(n) || (g.length > 3 && n.includes(g))
  })

  if (req.brandName && nameMatches.length <= 2) {
    return { q: req.brandName }
  }

  if (sameGeneric.length > 1) {
    return { genericName: generic }
  }

  if (nameMatches.length === 1) {
    return { q: nameMatches[0].name }
  }

  if (sameGeneric.length === 1) {
    return { q: sameGeneric[0].name }
  }

  return { q: display }
}

export function buildIngredientBrowsePath(
  req: RecipeIngredient,
  ingredients: Ingredient[]
): string {
  const params = getIngredientBrowseParams(req, ingredients)
  const search = new URLSearchParams()
  if (params.q) search.set('q', params.q)
  if (params.genericName) search.set('genericName', params.genericName)
  const qs = search.toString()
  return qs ? `/ingredients?${qs}` : '/ingredients'
}
