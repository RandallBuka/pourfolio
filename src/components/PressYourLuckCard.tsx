import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { IngredientThumb } from '../lib/ui'
import { useApp } from '../context/AppContext'
import { pickRandomShotIngredients } from '../lib/randomShot'
import { isLiquidIngredient } from '../lib/ingredientLiquid'
import type { Ingredient } from '../types'

const MIN_COUNT = 1
const MAX_COUNT = 6
const SPIN_MS = 1400

function randomBarName(ingredients: Ingredient[]): string {
  if (!ingredients.length) return '???'
  return ingredients[Math.floor(Math.random() * ingredients.length)].name
}

export function PressYourLuckCard() {
  const { activeBar, ingredientMap } = useApp()
  const [count, setCount] = useState(3)
  const [result, setResult] = useState<Ingredient[] | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [spinning, setSpinning] = useState(false)
  const [slotLabel, setSlotLabel] = useState('Tap to spin!')
  const spinTimerRef = useRef<number | null>(null)

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

  useEffect(() => {
    return () => {
      if (spinTimerRef.current) window.clearTimeout(spinTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (!spinning || !barIngredients.length) return
    setSlotLabel(randomBarName(barIngredients))
    const id = window.setInterval(() => {
      setSlotLabel(randomBarName(barIngredients))
    }, 70)
    return () => window.clearInterval(id)
  }, [spinning, barIngredients])

  const spin = () => {
    if (!canSpin || spinning) return
    setSpinning(true)
    setMessage(null)
    setResult(null)
    setSlotLabel(randomBarName(barIngredients))

    if (spinTimerRef.current) window.clearTimeout(spinTimerRef.current)
    spinTimerRef.current = window.setTimeout(() => {
      const picked = pickRandomShotIngredients(barIngredients, count)
      if (!picked.ok) {
        setResult(null)
        setSlotLabel('No luck…')
        setMessage(
          picked.reason === 'empty-bar'
            ? 'Add ingredients to your bar first.'
            : 'You need at least one pourable ingredient on your bar.'
        )
      } else {
        setResult(picked.ingredients)
        setSlotLabel(picked.ingredients.map((ing) => ing.name).join(' + '))
        setMessage(null)
      }
      setSpinning(false)
      spinTimerRef.current = null
    }, SPIN_MS)
  }

  return (
    <section
      className={`hub-luck-card${spinning ? ' hub-luck-card--spinning' : ''}${result && !spinning ? ' hub-luck-card--winner' : ''}`}
      aria-labelledby="hub-luck-title"
    >
      <div className="hub-luck-lights" aria-hidden>
        {Array.from({ length: 8 }, (_, i) => (
          <span key={i} className="hub-luck-light" style={{ '--i': i } as CSSProperties} />
        ))}
      </div>

      <div className="hub-luck-header">
        <div className="hub-luck-icon" aria-hidden>
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 4h12l-6 8v0z" />
            <path d="M12 12v5" />
            <path d="M9 21h6" />
            <rect x="15" y="3" width="6" height="6" rx="1" />
            <circle cx="17" cy="5.5" r="0.6" fill="currentColor" stroke="none" />
            <circle cx="19" cy="7" r="0.6" fill="currentColor" stroke="none" />
            <circle cx="17" cy="7" r="0.6" fill="currentColor" stroke="none" />
          </svg>
        </div>
        <div className="hub-luck-heading">
          <h3 id="hub-luck-title">Press Your Luck</h3>
          <p>Wild random shot from your bar — always at least one pourable ingredient.</p>
        </div>
      </div>

      <div className="hub-luck-controls">
        <span className="hub-luck-count-label">Ingredients</span>
        <div className="servings-stepper hub-luck-stepper">
          <button
            type="button"
            onClick={() => setCount((c) => Math.max(MIN_COUNT, c - 1))}
            disabled={!canSpin || count <= MIN_COUNT || spinning}
            aria-label="Fewer ingredients"
          >
            −
          </button>
          <span>{count}</span>
          <button
            type="button"
            onClick={() => setCount((c) => Math.min(maxCount, c + 1))}
            disabled={!canSpin || count >= maxCount || spinning}
            aria-label="More ingredients"
          >
            +
          </button>
        </div>
      </div>

      <div
        className={`hub-luck-slot${spinning ? ' hub-luck-slot--spinning' : ''}${result && !spinning ? ' hub-luck-slot--winner' : ''}`}
        aria-live="polite"
        aria-atomic="true"
      >
        <span className="hub-luck-slot-label" key={slotLabel}>
          {slotLabel}
        </span>
      </div>

      <button
        type="button"
        className={`hub-luck-spin${spinning ? ' hub-luck-spin--active' : ''}`}
        onClick={spin}
        disabled={!canSpin || spinning}
      >
        <span className="hub-luck-spin-glow" aria-hidden />
        <span className="hub-luck-spin-text">
          {spinning ? 'Spinning…' : 'Press your luck!'}
        </span>
      </button>

      {!canSpin && (
        <p className="hub-luck-hint">
          {barIngredients.length === 0
            ? 'Stock your bar to spin wild shot combos.'
            : 'Add a spirit, liqueur, mixer, or juice to enable random shots.'}
        </p>
      )}

      {message && <p className="hub-luck-hint">{message}</p>}

      {result && result.length > 0 && !spinning && (
        <div className="hub-luck-result">
          <p className="hub-luck-result-title">Tonight&apos;s chaos shot</p>
          <ul className="hub-luck-ingredients">
            {result.map((ing, idx) => (
              <li
                key={ing.id}
                className="hub-luck-ingredient"
                style={{ '--luck-i': idx } as CSSProperties}
              >
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
