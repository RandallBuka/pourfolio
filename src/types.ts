export type IngredientCategory =
  | 'Spirits'
  | 'Liqueurs'
  | 'Mixers'
  | 'Juices'
  | 'Fruits'
  | 'Garnishes'
  | 'Other'

export type DrinkType =
  | 'Cocktail'
  | 'Shot'
  | 'Martini'
  | 'Themed'
  | 'Ordinary Drink'
  | 'Punch'
  | 'Other'

export interface Ingredient {
  id: string
  name: string
  genericName: string
  company?: string
  country?: string
  state?: string
  flavor?: string
  type?: string
  category: IngredientCategory
  image?: string
  barcode?: string
  /** Alcohol by volume, percent (e.g. 40 = 40%) */
  abv?: number
  /** Vintage year — typically for wines */
  vintage?: number
  isCustom?: boolean
  notes?: string
}

export interface RecipeIngredient {
  genericName: string
  amount: string
  brandName?: string
  brandId?: string
  allowGenericSubstitution: boolean
  optional: boolean
  mode: 'premium' | 'generic'
}

export interface Drink {
  id: string
  name: string
  type: DrinkType
  glass: string
  instructions: string
  image?: string
  ingredients: RecipeIngredient[]
  isCustom?: boolean
  clonedFrom?: string
  notes?: string
}

export type StockLevel = 'full' | 'half' | 'low' | 'empty'

export interface BarItemMeta {
  openedOn?: string
  stockLevel?: StockLevel
  /** Vintage of this bottle on the shelf (wines) */
  vintage?: number
}

export interface BarProfile {
  id: string
  name: string
  ingredientIds: string[]
  /** Base64 JPEG photo of the physical bar/shelf */
  image?: string
}

export interface IngredientOverride {
  name?: string
  genericName?: string
  company?: string
  country?: string
  state?: string
  flavor?: string
  type?: string
  category?: IngredientCategory
  image?: string
  barcode?: string
  abv?: number
  vintage?: number
  notes?: string
}

export interface DrinkOverride {
  notes?: string
}

export interface AppState {
  bars: BarProfile[]
  activeBarId: string
  favorites: string[]
  shoppingList: string[]
  customIngredients: Ingredient[]
  customDrinks: Drink[]
  hiddenDrinks: string[]
  hiddenIngredients: string[]
  ingredientOverrides: Record<string, IngredientOverride>
  drinkOverrides?: Record<string, DrinkOverride>
  /** Per-bar ingredient metadata (opened date, stock level) */
  barItemMeta?: Record<string, Record<string, BarItemMeta>>
  /** Shopping list items checked off in store mode */
  shoppingChecked?: string[]
  /** Milliseconds since epoch — used for cloud sync conflict resolution */
  syncUpdatedAt?: number
  /** Soft-deleted catalog items available for individual restore */
  trash?: CatalogTrash
}

export interface MatchResult {
  drink: Drink
  matched: RecipeIngredient[]
  missing: RecipeIngredient[]
  canMake: boolean
}

export interface IngredientMatchContext {
  barIngredientIds: Set<string>
  allIngredients: Map<string, Ingredient>
}

export interface TrashIngredient {
  id: string
  deletedAt: number
  customData?: Ingredient
  /** User edits preserved when a built-in ingredient is deleted */
  override?: IngredientOverride
}

export interface TrashDrink {
  id: string
  deletedAt: number
  customData?: Drink
  /** User edits preserved when a built-in recipe is deleted */
  override?: DrinkOverride
}

export interface CatalogTrash {
  ingredients: TrashIngredient[]
  drinks: TrashDrink[]
}

export interface DeletedCatalogItem {
  id: string
  name: string
  deletedAt: number
  kind: 'ingredient' | 'drink'
  isCustom: boolean
}
