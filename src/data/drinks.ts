import type { Drink, DrinkType, RecipeIngredient } from '../types'

function ing(
  genericName: string,
  amount: string,
  opts: Partial<RecipeIngredient> = {}
): RecipeIngredient {
  return {
    genericName,
    amount,
    allowGenericSubstitution: true,
    optional: false,
    mode: 'generic',
    ...opts,
  }
}

function shot(
  id: string,
  name: string,
  ingredients: RecipeIngredient[],
  instructions = 'Pour ingredients into a shot glass. Drink in one gulp.'
): Drink {
  return { id, name, type: 'Shot', glass: 'Shot/Shooter Glass', instructions, ingredients }
}

function cocktail(
  id: string,
  name: string,
  ingredients: RecipeIngredient[],
  glass: string,
  instructions: string,
  type: DrinkType = 'Cocktail'
): Drink {
  return { id, name, type, glass, instructions, ingredients }
}

export const SEED_DRINKS: Drink[] = [
  // Shots
  shot('24-karat-nightmare', '24-Karat Nightmare Shot', [
    ing('Cinnamon Schnapps', '1 oz', { brandName: 'Goldschlager', mode: 'premium' }),
    ing('Herbal Liqueur', '1 oz', { brandName: 'Jagermeister', mode: 'premium' }),
  ]),
  shot('b-52', 'B-52', [
    ing('Coffee Liqueur', '1/3 oz'),
    ing('Irish Cream', '1/3 oz'),
    ing('Triple Sec', '1/3 oz'),
  ], 'Layer Kahlua, Baileys, and Triple Sec in a shot glass.'),
  shot('baby-guinness', 'Baby Guinness', [
    ing('Coffee Liqueur', '2/3 oz'),
    ing('Irish Cream', '1/3 oz'),
  ], 'Pour Kahlua, float Baileys on top to resemble a pint of Guinness.'),
  shot('blow-job', 'Blow Job', [
    ing('Amaretto', '1 oz'),
    ing('Whipped Cream', 'top', { optional: true }),
  ]),
  shot('chocolate-cake', 'Chocolate Cake Shot', [
    ing('Vodka', '1 oz'),
    ing('Sugar', 'lemon wedge coated'),
    ing('Lemon', '1 wedge'),
  ]),
  shot('fuzzy-navel-shot', 'Fuzzy Navel Shot', [
    ing('Peach Schnapps', '1 oz'),
    ing('Orange Juice', '1 oz'),
  ]),
  shot('jager-bomb', 'Jager Bomb', [
    ing('Herbal Liqueur', '1 oz', { brandName: 'Jagermeister' }),
    ing('Energy Drink', '1 can', { optional: true }),
  ]),
  shot('kamikaze-shot', 'Kamikaze Shot', [
    ing('Vodka', '1 oz'),
    ing('Triple Sec', '1 oz'),
    ing('Lime Juice', '1 oz'),
  ]),
  shot('lemon-drop', 'Lemon Drop Shot', [
    ing('Vodka', '1 oz'),
    ing('Triple Sec', '1/2 oz'),
    ing('Lemon Juice', '1/2 oz'),
    ing('Sugar', 'rim'),
  ]),
  shot('mind-eraser', 'Mind Eraser', [
    ing('Vodka', '1 oz'),
    ing('Coffee Liqueur', '1 oz'),
    ing('Soda Water', 'top'),
  ]),
  shot('oatmeal-cookie', 'Oatmeal Cookie Shot', [
    ing('Irish Cream', '1 oz'),
    ing('Gold Rum', '1 oz'),
    ing('Butterscotch Schnapps', '1 oz', { allowGenericSubstitution: true }),
  ]),
  shot('orgasm', 'Orgasm Shot', [
    ing('Amaretto', '1/2 oz'),
    ing('Coffee Liqueur', '1/2 oz'),
    ing('Irish Cream', '1/2 oz'),
  ]),
  shot('red-headed-slut', 'Red Headed Slut', [
    ing('Jagermeister', '1/2 oz', { genericName: 'Herbal Liqueur' }),
    ing('Peach Schnapps', '1/2 oz'),
    ing('Cranberry Juice', 'splash'),
  ]),
  shot('slippery-nipple', 'Slippery Nipple', [
    ing('Sambuca', '1/2 oz'),
    ing('Irish Cream', '1/2 oz'),
  ]),
  shot('snakebite', 'Snakebite Shot', [
    ing('Whiskey Liqueur', '1/2 oz'),
    ing('Lime Juice', '1/2 oz'),
  ]),
  shot('washington-apple', 'Washington Apple Shot', [
    ing('Whiskey', '1 oz'),
    ing('Apple Schnapps', '1 oz'),
    ing('Cranberry Juice', 'splash'),
  ]),
  shot('woo-woo', 'Woo Woo Shot', [
    ing('Vodka', '1 oz'),
    ing('Peach Schnapps', '1 oz'),
    ing('Cranberry Juice', '1 oz'),
  ]),
  shot('yukon-jack', 'Yukon Jack Shot', [
    ing('Whiskey Liqueur', '1 oz'),
    ing('Lime Juice', 'splash'),
  ]),

  // Classic Cocktails
  cocktail('old-fashioned', 'Old Fashioned', [
    ing('Bourbon', '2 oz'),
    ing('Bitters', '2 dashes'),
    ing('Sugar', '1 cube'),
    ing('Water', 'splash'),
    ing('Orange', 'garnish', { optional: true }),
  ], 'Rocks glass', 'Muddle sugar, bitters, and water. Add bourbon and ice. Stir. Garnish with orange.'),
  cocktail('manhattan', 'Manhattan', [
    ing('Rye Whiskey', '2 oz', { allowGenericSubstitution: true }),
    ing('Sweet Vermouth', '1 oz'),
    ing('Bitters', '2 dashes'),
    ing('Cherry', 'garnish', { optional: true }),
  ], 'Cocktail glass', 'Stir all ingredients with ice. Strain into chilled glass. Garnish with cherry.'),
  cocktail('negroni', 'Negroni', [
    ing('Gin', '1 oz'),
    ing('Sweet Vermouth', '1 oz'),
    ing('Campari', '1 oz'),
    ing('Orange', 'garnish', { optional: true }),
  ], 'Rocks glass', 'Stir with ice. Strain over fresh ice. Garnish with orange peel.'),
  cocktail('martini', 'Martini', [
    ing('Gin', '2 1/2 oz'),
    ing('Dry Vermouth', '1/2 oz'),
    ing('Olive', 'garnish', { optional: true }),
  ], 'Cocktail glass', 'Stir with ice. Strain into chilled glass.'),
  cocktail('vodka-martini', 'Vodka Martini', [
    ing('Vodka', '2 1/2 oz'),
    ing('Dry Vermouth', '1/2 oz'),
    ing('Olive', 'garnish', { optional: true }),
  ], 'Cocktail glass', 'Stir with ice. Strain into chilled glass.'),
  cocktail('margarita', 'Margarita', [
    ing('Tequila', '1 1/2 oz'),
    ing('Triple Sec', '1 oz'),
    ing('Lime Juice', '1 oz'),
    ing('Salt', 'rim', { optional: true }),
  ], 'Margarita glass', 'Shake with ice. Strain into salt-rimmed glass.'),
  cocktail('daiquiri', 'Daiquiri', [
    ing('Light Rum', '2 oz'),
    ing('Lime Juice', '1 oz'),
    ing('Simple Syrup', '3/4 oz'),
  ], 'Cocktail glass', 'Shake with ice. Strain into chilled glass.'),
  cocktail('mojito', 'Mojito', [
    ing('Light Rum', '2 oz'),
    ing('Lime', '1', { allowGenericSubstitution: true }),
    ing('Mint', '8 leaves'),
    ing('Simple Syrup', '2 tsp'),
    ing('Soda Water', 'top'),
  ], 'Highball glass', 'Muddle mint, lime, and syrup. Add rum and ice. Top with soda.'),
  cocktail('cosmopolitan', 'Cosmopolitan', [
    ing('Vodka', '1 1/2 oz'),
    ing('Triple Sec', '1 oz'),
    ing('Cranberry Juice', '1/2 oz'),
    ing('Lime Juice', '1/4 oz'),
  ], 'Cocktail glass', 'Shake with ice. Strain into chilled glass.'),
  cocktail('whiskey-sour', 'Whiskey Sour', [
    ing('Bourbon', '2 oz', { allowGenericSubstitution: true }),
    ing('Lemon Juice', '3/4 oz'),
    ing('Simple Syrup', '3/4 oz'),
    ing('Egg White', '1', { optional: true }),
  ], 'Rocks glass', 'Shake all ingredients with ice. Strain over fresh ice.'),
  cocktail('sidecar', 'Sidecar', [
    ing('Cognac', '2 oz'),
    ing('Triple Sec', '3/4 oz'),
    ing('Lemon Juice', '3/4 oz'),
  ], 'Cocktail glass', 'Shake with ice. Strain into sugar-rimmed glass.'),
  cocktail('gimlet', 'Gimlet', [
    ing('Gin', '2 oz'),
    ing('Lime Juice', '3/4 oz'),
    ing('Simple Syrup', '3/4 oz'),
  ], 'Cocktail glass', 'Shake with ice. Strain into chilled glass.'),
  cocktail('tom-collins', 'Tom Collins', [
    ing('Gin', '2 oz'),
    ing('Lemon Juice', '1 oz'),
    ing('Simple Syrup', '1/2 oz'),
    ing('Soda Water', 'top'),
  ], 'Collins glass', 'Shake gin, lemon, syrup with ice. Strain. Top with soda.'),
  cocktail('mint-julep', 'Mint Julep', [
    ing('Bourbon', '2 1/2 oz'),
    ing('Mint', '8 leaves'),
    ing('Simple Syrup', '1/2 oz'),
    ing('Water', 'splash'),
  ], 'Julep cup', 'Muddle mint and syrup. Add bourbon and crushed ice. Stir.'),
  cocktail('sazerac', 'Sazerac', [
    ing('Rye Whiskey', '2 oz'),
    ing('Bitters', '3 dashes'),
    ing('Sugar', '1 cube'),
    ing('Absinthe', 'rinse', { optional: true }),
  ], 'Rocks glass', 'Rinse glass with absinthe. Stir rye, bitters, sugar with ice. Strain.'),
  cocktail('boulevardier', 'Boulevardier', [
    ing('Bourbon', '1 1/2 oz'),
    ing('Sweet Vermouth', '1 oz'),
    ing('Campari', '1 oz'),
  ], 'Rocks glass', 'Stir with ice. Strain over fresh ice.'),
  cocktail('americano', 'Americano', [
    ing('Campari', '1 1/2 oz'),
    ing('Sweet Vermouth', '1 1/2 oz'),
    ing('Soda Water', 'top'),
  ], 'Highball glass', 'Build over ice in glass. Top with soda.'),
  cocktail('aperol-spritz', 'Aperol Spritz', [
    ing('Aperol', '2 oz', { genericName: 'Bitter Liqueur' }),
    ing('Prosecco', '3 oz'),
    ing('Soda Water', 'splash'),
  ], 'Wine glass', 'Build over ice. Garnish with orange slice.'),
  cocktail('dark-n-stormy', 'Dark and Stormy', [
    ing('Dark Rum', '2 oz'),
    ing('Ginger Beer', 'top'),
    ing('Lime', 'wedge', { optional: true }),
  ], 'Highball glass', 'Build rum over ice. Top with ginger beer.'),
  cocktail('cuba-libre', 'Cuba Libre', [
    ing('Light Rum', '2 oz'),
    ing('Cola', 'top'),
    ing('Lime', 'wedge'),
  ], 'Highball glass', 'Build over ice. Squeeze lime wedge.'),
  cocktail('long-island', 'Long Island Iced Tea', [
    ing('Vodka', '1/2 oz'),
    ing('Gin', '1/2 oz'),
    ing('Light Rum', '1/2 oz'),
    ing('Tequila', '1/2 oz'),
    ing('Triple Sec', '1/2 oz'),
    ing('Lemon Juice', '1 oz'),
    ing('Cola', 'top'),
  ], 'Highball glass', 'Shake spirits and lemon. Strain over ice. Top with cola.'),
  cocktail('mai-tai', 'Mai Tai', [
    ing('Light Rum', '1 oz'),
    ing('Dark Rum', '1 oz'),
    ing('Triple Sec', '1/2 oz'),
    ing('Lime Juice', '1 oz'),
    ing('Orgeat', '1/2 oz', { allowGenericSubstitution: true, optional: true }),
  ], 'Rocks glass', 'Shake with ice. Strain over crushed ice. Float dark rum.'),
  cocktail('pina-colada', 'Pina Colada', [
    ing('Light Rum', '2 oz'),
    ing('Coconut Cream', '1 oz'),
    ing('Pineapple Juice', '3 oz'),
  ], 'Hurricane glass', 'Blend or shake with ice until smooth.'),
  cocktail('bloody-mary', 'Bloody Mary', [
    ing('Vodka', '1 1/2 oz'),
    ing('Tomato Juice', '3 oz'),
    ing('Lemon Juice', '1/2 oz'),
    ing('Worcestershire Sauce', '2 dashes', { optional: true }),
    ing('Hot Sauce', '2 dashes', { optional: true }),
  ], 'Highball glass', 'Build over ice. Stir gently.'),
  cocktail('moscow-mule', 'Moscow Mule', [
    ing('Vodka', '2 oz'),
    ing('Lime Juice', '1/2 oz'),
    ing('Ginger Beer', 'top'),
  ], 'Copper mug', 'Build over ice. Garnish with lime.'),
  cocktail('gin-tonic', 'Gin and Tonic', [
    ing('Gin', '2 oz'),
    ing('Tonic Water', 'top'),
    ing('Lime', 'wedge', { optional: true }),
  ], 'Highball glass', 'Build over ice. Garnish with lime.'),
  cocktail('tequila-sunrise', 'Tequila Sunrise', [
    ing('Tequila', '1 1/2 oz'),
    ing('Orange Juice', 'top'),
    ing('Grenadine', '1/2 oz'),
  ], 'Highball glass', 'Pour tequila and OJ over ice. Float grenadine.'),
  cocktail('paloma', 'Paloma', [
    ing('Tequila', '2 oz'),
    ing('Grapefruit Juice', '2 oz'),
    ing('Lime Juice', '1/2 oz'),
    ing('Soda Water', 'top'),
  ], 'Highball glass', 'Build over ice. Salt rim optional.'),
  cocktail('white-russian', 'White Russian', [
    ing('Vodka', '2 oz'),
    ing('Coffee Liqueur', '1 oz'),
    ing('Cream', '1 oz'),
  ], 'Rocks glass', 'Build over ice. Stir gently.'),
  cocktail('black-russian', 'Black Russian', [
    ing('Vodka', '2 oz'),
    ing('Coffee Liqueur', '1 oz'),
  ], 'Rocks glass', 'Build over ice. Stir.'),
  cocktail('espresso-martini', 'Espresso Martini', [
    ing('Vodka', '1 1/2 oz'),
    ing('Coffee Liqueur', '1 oz'),
    ing('Espresso', '1 oz', { allowGenericSubstitution: true }),
  ], 'Cocktail glass', 'Shake hard with ice. Strain into chilled glass.'),
  cocktail('french-75', 'French 75', [
    ing('Gin', '1 oz'),
    ing('Lemon Juice', '1/2 oz'),
    ing('Simple Syrup', '1/2 oz'),
    ing('Champagne', 'top'),
  ], 'Champagne flute', 'Shake gin, lemon, syrup. Strain. Top with champagne.'),
  cocktail('aviation', 'Aviation', [
    ing('Gin', '2 oz'),
    ing('Maraschino Liqueur', '1/2 oz', { allowGenericSubstitution: true }),
    ing('Lemon Juice', '3/4 oz'),
  ], 'Cocktail glass', 'Shake with ice. Strain into chilled glass.'),
  cocktail('last-word', 'Last Word', [
    ing('Gin', '3/4 oz'),
    ing('Green Chartreuse', '3/4 oz', { allowGenericSubstitution: true }),
    ing('Maraschino Liqueur', '3/4 oz', { allowGenericSubstitution: true }),
    ing('Lime Juice', '3/4 oz'),
  ], 'Cocktail glass', 'Shake with ice. Strain into chilled glass.'),
  cocktail('penicillin', 'Penicillin', [
    ing('Scotch', '2 oz'),
    ing('Lemon Juice', '3/4 oz'),
    ing('Honey Syrup', '3/4 oz', { allowGenericSubstitution: true }),
    ing('Ginger', 'slice', { optional: true }),
  ], 'Rocks glass', 'Shake scotch, lemon, honey. Strain over ice.'),
  cocktail('paper-plane', 'Paper Plane', [
    ing('Bourbon', '3/4 oz'),
    ing('Aperol', '3/4 oz', { genericName: 'Bitter Liqueur' }),
    ing('Amaro', '3/4 oz', { allowGenericSubstitution: true }),
    ing('Lemon Juice', '3/4 oz'),
  ], 'Cocktail glass', 'Shake with ice. Strain into chilled glass.'),
  cocktail('bee-knees', 'Bee\'s Knees', [
    ing('Gin', '2 oz'),
    ing('Lemon Juice', '3/4 oz'),
    ing('Honey Syrup', '3/4 oz', { allowGenericSubstitution: true }),
  ], 'Cocktail glass', 'Shake with ice. Strain into chilled glass.'),
  cocktail('southside', 'Southside', [
    ing('Gin', '2 oz'),
    ing('Lime Juice', '3/4 oz'),
    ing('Simple Syrup', '3/4 oz'),
    ing('Mint', '5 leaves'),
  ], 'Cocktail glass', 'Muddle mint. Shake all with ice. Strain.'),
  cocktail('caipirinha', 'Caipirinha', [
    ing('Cachaca', '2 oz', { allowGenericSubstitution: true }),
    ing('Lime', '1'),
    ing('Sugar', '2 tsp'),
  ], 'Rocks glass', 'Muddle lime and sugar. Add cachaca and ice.'),
  cocktail('rum-punch', 'Rum Punch', [
    ing('Light Rum', '1 oz'),
    ing('Dark Rum', '1 oz'),
    ing('Orange Juice', '2 oz'),
    ing('Pineapple Juice', '2 oz'),
    ing('Grenadine', 'splash'),
  ], 'Hurricane glass', 'Shake or stir over ice.'),
  cocktail('zombie', 'Zombie', [
    ing('Light Rum', '1 1/2 oz'),
    ing('Gold Rum', '1 1/2 oz'),
    ing('Dark Rum', '1 oz'),
    ing('Apricot Brandy', '1 oz', { allowGenericSubstitution: true }),
    ing('Pineapple Juice', '1 oz'),
    ing('Lime Juice', '1 oz'),
  ], 'Collins glass', 'Shake with ice. Strain over fresh ice.'),
  cocktail('screwdriver', 'Screwdriver', [
    ing('Vodka', '2 oz'),
    ing('Orange Juice', 'top'),
  ], 'Highball glass', 'Build over ice.'),
  cocktail('greyhound', 'Greyhound', [
    ing('Vodka', '2 oz'),
    ing('Grapefruit Juice', 'top'),
  ], 'Highball glass', 'Build over ice.'),
  cocktail('sea-breeze', 'Sea Breeze', [
    ing('Vodka', '1 1/2 oz'),
    ing('Cranberry Juice', '3 oz'),
    ing('Grapefruit Juice', '1 oz'),
  ], 'Highball glass', 'Build over ice.'),
  cocktail('bay-breeze', 'Bay Breeze', [
    ing('Vodka', '1 1/2 oz'),
    ing('Cranberry Juice', '3 oz'),
    ing('Pineapple Juice', '1 oz'),
  ], 'Highball glass', 'Build over ice.'),
  cocktail('godfather', 'Godfather', [
    ing('Scotch', '1 1/2 oz'),
    ing('Amaretto', '1/2 oz'),
  ], 'Rocks glass', 'Build over ice. Stir.'),
  cocktail('godmother', 'Godmother', [
    ing('Vodka', '1 1/2 oz'),
    ing('Amaretto', '1/2 oz'),
  ], 'Rocks glass', 'Build over ice. Stir.'),
  cocktail('rusty-nail', 'Rusty Nail', [
    ing('Scotch', '1 1/2 oz'),
    ing('Drambuie', '1/2 oz', { allowGenericSubstitution: true }),
  ], 'Rocks glass', 'Build over ice. Stir.'),
  cocktail('stinger', 'Stinger', [
    ing('Cognac', '2 oz'),
    ing('White Creme de Menthe', '1/2 oz', { allowGenericSubstitution: true }),
  ], 'Cocktail glass', 'Stir with ice. Strain.'),
  cocktail('brandy-alexander', 'Brandy Alexander', [
    ing('Cognac', '1 oz'),
    ing('Creme de Cacao', '1 oz', { allowGenericSubstitution: true }),
    ing('Cream', '1 oz'),
  ], 'Cocktail glass', 'Shake with ice. Strain. Dust with nutmeg.'),
  cocktail('grasshopper', 'Grasshopper', [
    ing('Green Creme de Menthe', '1 oz', { allowGenericSubstitution: true }),
    ing('White Creme de Menthe', '1 oz', { allowGenericSubstitution: true }),
    ing('Cream', '1 oz'),
  ], 'Cocktail glass', 'Shake with ice. Strain.'),
  cocktail('hurricane', 'Hurricane', [
    ing('Light Rum', '2 oz'),
    ing('Dark Rum', '2 oz'),
    ing('Passion Fruit Syrup', '1 oz', { allowGenericSubstitution: true }),
    ing('Orange Juice', '1 oz'),
    ing('Lime Juice', '1 oz'),
  ], 'Hurricane glass', 'Shake with ice. Strain over fresh ice.'),
  cocktail('planters-punch', 'Planter\'s Punch', [
    ing('Dark Rum', '2 oz'),
    ing('Orange Juice', '1 oz'),
    ing('Pineapple Juice', '1 oz'),
    ing('Grenadine', '1/2 oz'),
    ing('Simple Syrup', '1/2 oz'),
  ], 'Collins glass', 'Shake with ice. Strain over fresh ice.'),
  cocktail('sangria', 'Sangria', [
    ing('Red Wine', '1 bottle'),
    ing('Brandy', '2 oz'),
    ing('Orange Juice', '4 oz'),
    ing('Orange', 'sliced'),
    ing('Lemon', 'sliced'),
  ], 'Pitcher', 'Combine all in pitcher. Chill before serving.'),
  cocktail('hot-toddy', 'Hot Toddy', [
    ing('Whiskey', '2 oz', { allowGenericSubstitution: true }),
    ing('Honey', '1 tbsp', { allowGenericSubstitution: true }),
    ing('Lemon Juice', '1/2 oz'),
    ing('Water', 'hot', { genericName: 'Water' }),
  ], 'Mug', 'Combine in warm mug. Stir.'),
  cocktail('irish-coffee', 'Irish Coffee', [
    ing('Irish Whiskey', '1 1/2 oz', { allowGenericSubstitution: true }),
    ing('Coffee', 'hot'),
    ing('Sugar', '1 tsp'),
    ing('Cream', 'float'),
  ], 'Irish coffee glass', 'Combine whiskey, coffee, sugar. Float cream.'),
  cocktail('mimosa', 'Mimosa', [
    ing('Champagne', '3 oz'),
    ing('Orange Juice', '3 oz'),
  ], 'Champagne flute', 'Pour champagne, top with OJ.'),
  cocktail('bellini', 'Bellini', [
    ing('Prosecco', '3 oz'),
    ing('Peach Puree', '2 oz', { allowGenericSubstitution: true }),
  ], 'Champagne flute', 'Pour prosecco over peach puree.'),
  cocktail('kir-royale', 'Kir Royale', [
    ing('Champagne', '4 oz'),
    ing('Creme de Cassis', '1/2 oz', { allowGenericSubstitution: true }),
  ], 'Champagne flute', 'Pour cassis in flute. Top with champagne.'),
  cocktail('sazerac-rye', 'Sazerac (Rye)', [
    ing('Rye Whiskey', '2 oz'),
    ing('Bitters', '3 dashes'),
    ing('Sugar', '1 cube'),
  ], 'Rocks glass', 'Stir with ice. Strain into absinthe-rinsed glass.'),
]

export const DRINK_CATEGORIES: DrinkType[] = [
  'Cocktail',
  'Shot',
  'Martini',
  'Themed',
  'Ordinary Drink',
  'Punch',
  'Other',
]

export function getDrinkIngredientSummary(drink: Drink): string {
  return drink.ingredients
    .filter((i) => !i.optional)
    .map((i) => i.brandName ?? i.genericName)
    .join(', ')
}
