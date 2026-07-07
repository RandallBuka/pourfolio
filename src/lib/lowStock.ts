import type { BarItemMeta, Ingredient, StockLevel } from '../types'

const LOW_LEVELS: StockLevel[] = ['low', 'empty']

export function isLowStock(meta: BarItemMeta): boolean {
  return !!meta.stockLevel && LOW_LEVELS.includes(meta.stockLevel)
}

export function getLowStockIngredients(
  barIngredientIds: string[],
  ingredientMap: Map<string, Ingredient>,
  getMeta: (id: string) => BarItemMeta
): Ingredient[] {
  return barIngredientIds
    .map((id) => ingredientMap.get(id))
    .filter((i): i is Ingredient => !!i)
    .filter((i) => isLowStock(getMeta(i.id)))
}
