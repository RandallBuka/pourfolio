/** Ingredients at/before this id in ingredient-images.json are user-curated — do not modify. */
export const INGREDIENT_IMAGE_ANCHOR_ID = 'brand-black-olives'

export function isAfterIngredientImageAnchor(id: string): boolean {
  return id > INGREDIENT_IMAGE_ANCHOR_ID
}
