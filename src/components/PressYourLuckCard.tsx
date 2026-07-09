import { useEffect, useMemo, useState } from 'react'
import { IngredientThumb } from '../lib/ui'
import { useApp } from '../context/AppContext'
import { pickRandomShotIngredients } from '../lib/randomShot'
import { isLiquidIngredient } from '../lib/ingredientLiquid'
import type { Ingredient } from '../types'

const MIN_COUNT = 1
const MAX_COUNT = 6

export function PressYourLuckCard() {
  const { activeBar, ingredientMap } = useApp()
  const [count, setCount] = useState(3)
  const [result, setResult] = useState<Ingredient[] | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [spinning, setSpinning] = useState(false)

  const barIngredients = useMemo(
    () =>
      activeBar.ingredientIds
        .map((id) => ingredientMap.get(id))
        .filter((ing): ing is Ingredient => !!ing),
    [activeBar.ingredientIds, ingredientMap]
  )

  const liquidCount = useMemo(
    () => barIngredients.filter(isLiquidIngredient).length,
    [barIngredients]
  )

  const maxCount = Math.min(MAX_COUNT, Math.max(MIN_COUNT, barIngredients.length))
  const canSpin = barIngredients.length > 0 && liquidCount > 0

  useEffect(() => {
    setCount((c) => Math.min(Math.max(MIN_COUNT, c), maxCount))
  }, [maxCount])

  const spin = () => {
    if (!canSpin || spinning) return
    setSpinning(true)
    setMessage(null)

    window.setTimeout(() => {
      const picked = pickRandomShotIngredients(barIngredients, count)
      if (!picked.ok) {
        setResult(null)
        setMessage(
          picked.reason === 'empty-bar'
            ? 'Add ingredients to your bar first.'
            : 'You need at least one pourable ingredient on your bar.'
        )
      } else {
        setResult(picked.ingredients)
        setMessage(null)
      }
      setSpinning(false)
    }, 450)
  }

  return (
    <section className="hub-luck-card" aria-labelledby="hub-luck-title">
      <div className="hub-luck-header">
        <div className="hub-luck-icon" aria-hidden>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 4h12l-6 8v0z" />
            <path d="M12 12v5" />
            <path d="M9 21h6" />
            <circle cx="18" cy="6" r="2.5" />
            <path d="M17 4.5v1M18 5h1M19 6v1M18 7h-1M17 6v-1" />
          </svg>
        </div>
        <div className="hub-luck-heading">
          <h3 id="hub-luck-title">Press Your Luck</h3>
          <p>Random shot from what&apos;s on your bar — at least one pourable ingredient every time.</p>
        </div>
      </div>

      <div className="hub-luck-controls">
        <span className="hub-luck-count-label">Ingredients</span>
        <div className="servings-stepper hub-luck-stepper">
          <button
            type="button"
            onClick={() => setCount((c) => Math.max(MIN_COUNT, c - 1))}
            disabled={!canSpin || count <= MIN_COUNT}
            aria-label="Fewer ingredients"
          >
            −
          </button>
          <span>{count}</span>
          <button
            type="button"
            onClick={() => setCount((c) => Math.min(maxCount, c + 1))}
            disabled={!canSpin || count >= maxCount}
            aria-label="More ingredients"
          >
            +
          </button>
        </div>
      </div>

      <button
        type="button"
        className={`btn btn-primary hub-luck-spin${spinning ? ' hub-luck-spin--active' : ''}`}
        onClick={spin}
        disabled={!canSpin || spinning}
      >
        {spinning ? 'Spinning…' : 'Press your luck!'}
      </button>

      {!canSpin && (
        <p className="hub-luck-hint">
          {barIngredients.length === 0
            ? 'Stock your bar to spin wild shot combos.'
            : 'Add a spirit, liqueur, mixer, or juice to enable random shots.'}
        </p>
      )}

      {message && <p className="hub-luck-hint">{message}</p>}

      {result && result.length > 0 && (
        <div className={`hub-luck-result${spinning ? ' hub-luck-result--hidden' : ''}`}>
          <p className="hub-luck-result-title">Tonight&apos;s chaos shot</p>
          <ul className="hub-luck-ingredients">
            {result.map((ing) => (
              <li key={ing.id} className="hub-luck-ingredient">
                <IngredientThumb ingredient={ing} />
                <span className="hub-luck-ingredient-name">{ing.name}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
