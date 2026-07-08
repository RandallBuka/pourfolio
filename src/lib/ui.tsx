import { useState } from 'react'
import type { Drink, Ingredient } from '../types'
import { getIngredientImageCandidates } from './ingredientImages'
import { getDrinkImageCandidates } from './drinkImages'

const CATEGORY_ICONS: Record<string, string> = {
  Spirits: 'thumb-spirits',
  Liqueurs: 'thumb-liqueurs',
  Mixers: 'thumb-mixers',
  Juices: 'thumb-juices',
  Fruits: 'thumb-fruits',
  Garnishes: 'thumb-garnishes',
  Other: 'thumb-spirits',
}

const DRINK_ICONS: Record<string, string> = {
  Shot: 'thumb-shot',
  Cocktail: 'thumb-cocktail',
  Martini: 'thumb-martini',
  Themed: 'thumb-cocktail',
  'Ordinary Drink': 'thumb-cocktail',
  Punch: 'thumb-cocktail',
  Other: 'thumb-cocktail',
}

export function getIngredientThumbClass(category: string): string {
  return CATEGORY_ICONS[category] ?? 'thumb-spirits'
}

export function getDrinkThumbClass(type: string): string {
  return DRINK_ICONS[type] ?? 'thumb-cocktail'
}

export function IngredientThumb({ ingredient, size }: { ingredient: Ingredient; size?: 'sm' | 'lg' }) {
  const cls = getIngredientThumbClass(ingredient.category)
  const candidates = getIngredientImageCandidates(ingredient)
  const [index, setIndex] = useState(0)
  const src = candidates[index]
  const showEmoji = index >= candidates.length

  const sizeStyle = size === 'lg' ? { width: 120, height: 120 } : undefined

  return (
    <div
      className={`item-thumb ${showEmoji ? cls : 'item-thumb--photo'}`}
      style={sizeStyle}
    >
      {!showEmoji && src && (
        <img
          src={src}
          alt={ingredient.name}
          loading="lazy"
          onError={() => setIndex((i) => i + 1)}
        />
      )}
    </div>
  )
}

export function DrinkThumb({
  drink,
  size,
}: {
  drink: Pick<Drink, 'id' | 'name' | 'type' | 'image'>
  size?: 'sm' | 'lg'
}) {
  const cls = getDrinkThumbClass(drink.type)
  const candidates = getDrinkImageCandidates(drink)
  const [index, setIndex] = useState(0)
  const src = candidates[index]
  const showEmoji = index >= candidates.length
  const sizeStyle = size === 'lg' ? { width: 120, height: 120 } : undefined

  return (
    <div
      className={`item-thumb ${showEmoji ? cls : 'item-thumb--photo'}`}
      style={sizeStyle}
    >
      {!showEmoji && src && (
        <img
          src={src}
          alt={drink.name}
          loading="lazy"
          onError={() => setIndex((i) => i + 1)}
        />
      )}
    </div>
  )
}

export const ALPHA_INDEX_LETTERS = [
  ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),
  '0-9',
  '#',
] as const

export function getItemAlphaLetter(name: string): string {
  const first = name.charAt(0).toUpperCase()
  if (/[A-Z]/.test(first)) return first
  if (/[0-9]/.test(first)) return '0-9'
  return '#'
}

export function getAlphaIndex(items: { name: string }[]): string[] {
  const letters = new Set<string>()
  items.forEach((item) => letters.add(getItemAlphaLetter(item.name)))
  return [...letters].sort()
}

export function getActiveAlphaLetters(items: { name: string }[]): Set<string> {
  return new Set(getAlphaIndex(items))
}
