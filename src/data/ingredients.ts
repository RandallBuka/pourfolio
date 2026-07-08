import type { Ingredient } from '../types'
import { enrichWithUsState } from './ingredientStates'
import { INMYBAR_SEED_INGREDIENTS } from './seeds/inmybarIngredients'

const spiritBrands: Array<Omit<Ingredient, 'id' | 'category'> & { category?: Ingredient['category'] }> = [
  // Bourbon
  { name: '1792 Bourbon Aged 12 Years', genericName: 'Bourbon', company: 'Bardstown', country: 'USA', type: 'Whiskey', category: 'Spirits' },
  { name: 'Jim Beam Bourbon', genericName: 'Bourbon', company: 'Jim Beam', country: 'USA', category: 'Spirits' },
  { name: 'Jim Beam Red Stag Bourbon', genericName: 'Bourbon', company: 'Jim Beam', country: 'USA', category: 'Spirits' },
  { name: 'Maker\'s Mark Bourbon', genericName: 'Bourbon', company: 'Maker\'s Mark', country: 'USA', category: 'Spirits' },
  { name: 'Woodford Reserve Bourbon', genericName: 'Bourbon', company: 'Brown-Forman', country: 'USA', category: 'Spirits' },
  { name: 'Bulleit Bourbon', genericName: 'Bourbon', company: 'Diageo', country: 'USA', category: 'Spirits' },
  { name: 'Wild Turkey Bourbon', genericName: 'Bourbon', company: 'Campari', country: 'USA', category: 'Spirits' },
  // Rye
  { name: 'Rittenhouse Rye', genericName: 'Rye Whiskey', company: 'Heaven Hill', country: 'USA', category: 'Spirits' },
  { name: 'Bulleit Rye', genericName: 'Rye Whiskey', company: 'Diageo', country: 'USA', category: 'Spirits' },
  // Vodka
  { name: 'Absolut Vodka', genericName: 'Vodka', company: 'Pernod Ricard', country: 'Sweden', category: 'Spirits' },
  { name: 'Grey Goose Vodka', genericName: 'Vodka', company: 'Bacardi', country: 'France', category: 'Spirits' },
  { name: 'Ketel One Vodka', genericName: 'Vodka', company: 'Diageo', country: 'Netherlands', category: 'Spirits' },
  { name: 'Smirnoff Vodka', genericName: 'Vodka', company: 'Diageo', country: 'UK', category: 'Spirits' },
  { name: 'Smirnoff Coconut Vodka', genericName: 'Vodka', company: 'Diageo', country: 'UK', flavor: 'Coconut', category: 'Spirits' },
  { name: 'Pinnacle Cookie Dough Vodka', genericName: 'Vodka', company: 'Beam Suntory', country: 'USA', flavor: 'Cookie Dough', category: 'Spirits' },
  { name: 'Three Olives Vanilla Vodka', genericName: 'Vodka', company: 'Proximo', country: 'USA', flavor: 'Vanilla', category: 'Spirits' },
  { name: 'Stoli Hot Vodka', genericName: 'Vodka', company: 'SPI Group', country: 'Russia', flavor: 'Hot', category: 'Spirits' },
  { name: 'Indiana Vodka', genericName: 'Vodka', company: 'Indiana', country: 'USA', category: 'Spirits' },
  // Gin
  { name: 'Tanqueray Gin', genericName: 'Gin', company: 'Diageo', country: 'UK', category: 'Spirits' },
  { name: 'Hendrick\'s Gin', genericName: 'Gin', company: 'William Grant', country: 'Scotland', category: 'Spirits' },
  { name: 'Bombay Sapphire Gin', genericName: 'Gin', company: 'Bacardi', country: 'UK', category: 'Spirits' },
  { name: 'Seagram\'s Raspberry Twisted Gin', genericName: 'Gin', company: 'Diageo', country: 'USA', flavor: 'Raspberry', category: 'Spirits' },
  { name: 'Zephyr Blu Gin', genericName: 'Gin', company: 'Zephyr', country: 'USA', category: 'Spirits' },
  // Rum
  { name: '10 Cane Rum', genericName: 'Rum', company: 'Moet Hennessy', country: 'Trinidad', category: 'Spirits' },
  { name: 'Bacardi Superior Rum', genericName: 'Light Rum', company: 'Bacardi', country: 'Puerto Rico', category: 'Spirits' },
  { name: 'Bacardi 151 Rum', genericName: 'Rum', company: 'Bacardi', country: 'Puerto Rico', category: 'Spirits' },
  { name: 'Bacardi Black Rum', genericName: 'Dark Rum', company: 'Bacardi', country: 'Puerto Rico', category: 'Spirits' },
  { name: 'Bacardi Black Razz Rum', genericName: 'Rum', company: 'Bacardi', country: 'Puerto Rico', flavor: 'Black Raspberry', category: 'Spirits' },
  { name: 'Bacardi Wolf Berry Rum', genericName: 'Rum', company: 'Bacardi', country: 'Puerto Rico', category: 'Spirits' },
  { name: 'Malibu Coconut Rum', genericName: 'Rum', company: 'Pernod Ricard', country: 'Barbados', flavor: 'Coconut', category: 'Spirits' },
  { name: 'Malibu Red Rum', genericName: 'Rum', company: 'Pernod Ricard', country: 'Barbados', category: 'Spirits' },
  { name: 'Captain Morgan Spiced Rum', genericName: 'Rum', company: 'Diageo', country: 'Jamaica', category: 'Spirits' },
  { name: 'Mount Gay Black Rum', genericName: 'Dark Rum', company: 'Remy Cointreau', country: 'Barbados', category: 'Spirits' },
  { name: 'Cruzan Aged Dark Rum', genericName: 'Dark Rum', company: 'Beam Suntory', country: 'USVI', category: 'Spirits' },
  { name: 'Cruzan 151 Rum', genericName: 'Rum', company: 'Beam Suntory', country: 'USVI', category: 'Spirits' },
  { name: 'Coconut Jack Coconut Rum', genericName: 'Rum', company: 'Coconut Jack', country: 'USA', flavor: 'Coconut', category: 'Spirits' },
  { name: 'Seagram\'s Citrus Rum', genericName: 'Rum', company: 'Diageo', country: 'USA', flavor: 'Citrus', category: 'Spirits' },
  // Tequila
  { name: 'Patron Silver Tequila', genericName: 'Tequila', company: 'Bacardi', country: 'Mexico', category: 'Spirits' },
  { name: 'Patron XO Dark Cocoa Liqueur', genericName: 'Liqueur', company: 'Bacardi', country: 'Mexico', category: 'Liqueurs' },
  { name: 'Jose Cuervo Especial Gold', genericName: 'Tequila', company: 'Proximo', country: 'Mexico', category: 'Spirits' },
  { name: 'Jose Cuervo Classico Tequila', genericName: 'Tequila', company: 'Proximo', country: 'Mexico', category: 'Spirits' },
  { name: '1800 Coconut Tequila', genericName: 'Tequila', company: 'Beam Suntory', country: 'Mexico', flavor: 'Coconut', category: 'Spirits' },
  // Scotch
  { name: 'Glenfiddich 12 Year', genericName: 'Scotch', company: 'William Grant', country: 'Scotland', category: 'Spirits' },
  { name: 'Johnnie Walker Black Label', genericName: 'Scotch', company: 'Diageo', country: 'Scotland', category: 'Spirits' },
  { name: 'Macallan 12 Year', genericName: 'Scotch', company: 'Edrington', country: 'Scotland', category: 'Spirits' },
  // Brandy
  { name: 'Hennessy VS Cognac', genericName: 'Cognac', company: 'Moet Hennessy', country: 'France', category: 'Spirits' },
  { name: 'Courvoisier VSOP', genericName: 'Cognac', company: 'Beam Suntory', country: 'France', category: 'Spirits' },
  // Liqueurs
  { name: 'Goldschlager', genericName: 'Cinnamon Schnapps', company: 'Sazerac', country: 'Switzerland', category: 'Liqueurs' },
  { name: 'Jagermeister', genericName: 'Herbal Liqueur', company: 'Mast-Jagermeister', country: 'Germany', category: 'Liqueurs' },
  { name: 'Kahlua Coffee Liqueur', genericName: 'Coffee Liqueur', company: 'Pernod Ricard', country: 'Mexico', category: 'Liqueurs' },
  { name: 'Baileys Irish Cream', genericName: 'Irish Cream', company: 'Diageo', country: 'Ireland', category: 'Liqueurs' },
  { name: 'Cointreau', genericName: 'Triple Sec', company: 'Remy Cointreau', country: 'France', category: 'Liqueurs' },
  { name: 'Grand Marnier', genericName: 'Orange Liqueur', company: 'Marnier Lapostolle', country: 'France', category: 'Liqueurs' },
  { name: 'Campari', genericName: 'Bitter Liqueur', company: 'Campari', country: 'Italy', category: 'Liqueurs' },
  { name: 'Aperol', genericName: 'Bitter Liqueur', company: 'Campari', country: 'Italy', category: 'Liqueurs' },
  { name: 'Amaretto Di Saronno', genericName: 'Amaretto', company: 'Illva Saronno', country: 'Italy', category: 'Liqueurs' },
  { name: 'DeKuyper Apple Barrel Schnapps', genericName: 'Schnapps', company: 'Beam Suntory', country: 'USA', flavor: 'Apple', category: 'Liqueurs' },
  { name: '99 Whipped Cream Schnapps', genericName: 'Schnapps', company: 'Sazerac', country: 'USA', flavor: 'Whipped Cream', category: 'Liqueurs' },
  { name: 'Southern Comfort Cherry', genericName: 'Whiskey Liqueur', company: 'Sazerac', country: 'USA', flavor: 'Cherry', category: 'Liqueurs' },
  { name: 'Vincent Van Gogh PB & J Vodka', genericName: 'Vodka', company: 'Vincent Van Gogh', country: 'Netherlands', flavor: 'PB&J', category: 'Spirits' },
  // Vermouth & bitters
  { name: 'Carpano Antica Sweet Vermouth', genericName: 'Sweet Vermouth', company: 'Fratelli Branca', country: 'Italy', category: 'Mixers' },
  { name: 'Dolin Dry Vermouth', genericName: 'Dry Vermouth', company: 'Dolin', country: 'France', category: 'Mixers' },
  { name: 'Angostura Bitters', genericName: 'Bitters', company: 'Angostura', country: 'Trinidad', category: 'Mixers' },
]

const genericIngredients: Array<Omit<Ingredient, 'id'>> = [
  { name: 'Gin', genericName: 'Gin', category: 'Spirits' },
  { name: 'Vodka', genericName: 'Vodka', category: 'Spirits' },
  { name: 'Rum', genericName: 'Rum', category: 'Spirits' },
  { name: 'Light Rum', genericName: 'Light Rum', category: 'Spirits' },
  { name: 'Dark Rum', genericName: 'Dark Rum', category: 'Spirits' },
  { name: 'Tequila', genericName: 'Tequila', category: 'Spirits' },
  { name: 'Bourbon', genericName: 'Bourbon', category: 'Spirits' },
  { name: 'Rye Whiskey', genericName: 'Rye Whiskey', category: 'Spirits' },
  { name: 'Scotch', genericName: 'Scotch', category: 'Spirits' },
  { name: 'Brandy', genericName: 'Brandy', category: 'Spirits' },
  { name: 'Triple Sec', genericName: 'Triple Sec', category: 'Liqueurs' },
  { name: 'Coffee Liqueur', genericName: 'Coffee Liqueur', category: 'Liqueurs' },
  { name: 'Irish Cream', genericName: 'Irish Cream', category: 'Liqueurs' },
  { name: 'Sweet Vermouth', genericName: 'Sweet Vermouth', category: 'Mixers' },
  { name: 'Dry Vermouth', genericName: 'Dry Vermouth', category: 'Mixers' },
  { name: 'Bitters', genericName: 'Bitters', category: 'Mixers' },
  { name: 'Simple Syrup', genericName: 'Simple Syrup', category: 'Mixers' },
  { name: 'Grenadine', genericName: 'Grenadine', category: 'Mixers' },
  { name: 'Soda Water', genericName: 'Soda Water', category: 'Mixers' },
  { name: 'Tonic Water', genericName: 'Tonic Water', category: 'Mixers' },
  { name: 'Ginger Beer', genericName: 'Ginger Beer', category: 'Mixers' },
  { name: 'Cherry Coke', genericName: 'Cola', company: 'Coca-Cola', country: 'USA', flavor: 'Cherry', category: 'Mixers' },
  { name: 'Moxie', genericName: 'Soda', company: 'Moxie', country: 'USA', category: 'Mixers' },
  { name: 'Orange Juice', genericName: 'Orange Juice', category: 'Juices' },
  { name: 'Cranberry Juice', genericName: 'Cranberry Juice', category: 'Juices' },
  { name: 'Pineapple Juice', genericName: 'Pineapple Juice', category: 'Juices' },
  { name: 'Grapefruit Juice', genericName: 'Grapefruit Juice', category: 'Juices' },
  { name: 'Tomato Juice', genericName: 'Tomato Juice', category: 'Juices' },
  { name: 'Lime Juice', genericName: 'Lime Juice', category: 'Juices' },
  { name: 'Lemon Juice', genericName: 'Lemon Juice', category: 'Juices' },
  { name: 'Lime', genericName: 'Lime', category: 'Fruits' },
  { name: 'Lemon', genericName: 'Lemon', category: 'Fruits' },
  { name: 'Orange', genericName: 'Orange', category: 'Fruits' },
  { name: 'Mint', genericName: 'Mint', category: 'Garnishes' },
  { name: 'Cherry', genericName: 'Cherry', category: 'Garnishes' },
  { name: 'Olive', genericName: 'Olive', category: 'Garnishes' },
  { name: 'Sugar', genericName: 'Sugar', category: 'Other' },
  { name: 'Water', genericName: 'Water', category: 'Other' },
  { name: 'Egg White', genericName: 'Egg White', category: 'Other' },
  { name: 'Heavy Cream', genericName: 'Cream', category: 'Other' },
  { name: 'Milk', genericName: 'Milk', category: 'Other' },
  { name: 'Champagne', genericName: 'Champagne', category: 'Spirits' },
  { name: 'Prosecco', genericName: 'Prosecco', category: 'Spirits' },
  { name: 'Beer', genericName: 'Beer', category: 'Spirits' },
  { name: 'Wine', genericName: 'Wine', category: 'Spirits' },
  { name: 'Red Wine', genericName: 'Red Wine', category: 'Spirits' },
  { name: 'White Wine', genericName: 'White Wine', category: 'Spirits' },
  { name: 'Stirrings Simple Syrup', genericName: 'Simple Syrup', company: 'Stirrings', country: 'USA', category: 'Mixers' },
]

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function normalizeIngredientName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim()
}

/** Remove generic catalog rows when branded rows already cover that genericName. */
function pruneRedundantGenerics(ingredients: Ingredient[]): Ingredient[] {
  const brandCountByGeneric = new Map<string, number>()
  for (const ing of ingredients) {
    if (normalizeIngredientName(ing.name) !== normalizeIngredientName(ing.genericName)) {
      const key = normalizeIngredientName(ing.genericName)
      brandCountByGeneric.set(key, (brandCountByGeneric.get(key) ?? 0) + 1)
    }
  }
  return ingredients.filter((ing) => {
    const nameKey = normalizeIngredientName(ing.name)
    const genericKey = normalizeIngredientName(ing.genericName)
    if (nameKey !== genericKey) return true
    return (brandCountByGeneric.get(genericKey) ?? 0) === 0
  })
}

export const SEED_INGREDIENTS: Ingredient[] = pruneRedundantGenerics([
  ...spiritBrands.map((b) => enrichWithUsState({
    ...b,
    id: `brand-${slugify(b.name)}`,
    category: b.category ?? 'Spirits',
  })),
  ...genericIngredients.map((g) => enrichWithUsState({
    ...g,
    id: `gen-${slugify(g.name)}`,
  })),
  ...INMYBAR_SEED_INGREDIENTS,
])

export function getIngredientByGeneric(genericName: string): Ingredient | undefined {
  return SEED_INGREDIENTS.find((i) => i.genericName === genericName && i.name === genericName)
    ?? SEED_INGREDIENTS.find((i) => i.genericName === genericName)
}
