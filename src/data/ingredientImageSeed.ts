/** Minimal export for image fetch script */
import { SEED_INGREDIENTS } from './ingredients'

export const INGREDIENT_IMAGE_SEED = SEED_INGREDIENTS.map(({ id, name, genericName }) => ({
  id,
  name,
  genericName,
}))
