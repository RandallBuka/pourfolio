/** Minimal export for image fetch script */
import { CORE_SEED_INGREDIENTS } from './ingredients'

export const INGREDIENT_IMAGE_SEED = CORE_SEED_INGREDIENTS.map(({ id, name, genericName }) => ({
  id,
  name,
  genericName,
}))
