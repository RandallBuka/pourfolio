import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { useApp } from '../context/AppContext'
import { pickRandomShotIngredients } from '../lib/randomShot'
import { isLiquidIngredient } from '../lib/ingredientLiquid'
import type { Ingredient } from '../types'

const MIN_COUNT = 1
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
  const [cycleLabel, setCycleLabel] = useState('')
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

  const maxCount = Math.max(MIN_COUNT, barIngredients.length)
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
    setCycleLabel(randomBarName(barIngredients))
    const id = window.setInterval(() => {
      setCycleLabel(randomBarName(barIngredients))
    }, 70)
    return () => window.clearInterval(id)
  }, [spinning, barIngredients])

  const subtitle = useMemo(() => {
    if (message) return message
    if (spinning) return cycleLabel
    if (result?.length) return result.map((ing) => ing.name).join(' + ')
    if (!canSpin) {
      return barIngredients.length === 0
        ? 'Stock your bar to spin'
        : 'Add a pourable ingredient'
    }
    return 'Wild random shot from your bar'
  }, [message, spinning, cycleLabel, result, canSpin, barIngredients.length])

  const spin = () => {
    if (!canSpin || spinning) return
    setSpinning(true)
    setMessage(null)
    setResult(null)
    setCycleLabel(randomBarName(barIngredients))

    if (spinTimerRef.current) window.clearTimeout(spinTimerRef.current)
    spinTimerRef.current = window.setTimeout(() => {
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
      spinTimerRef.current = null
    }, SPIN_MS)
  }

  return (
    <section
      className={`hub-luck-card${spinning ? ' hub-luck-card--spinning' : ''}${result && !spinning ? ' hub-luck-card--winner' : ''}`}
      aria-labelledby="hub-luck-title"
    >
      <div className="hub-luck-warnings" aria-hidden>
        {Array.from({ length: 8 }, (_, i) => (
          <span key={i} className="hub-luck-warning-blink" style={{ '--i': i } as CSSProperties} />
        ))}
      </div>

      <div className="hub-luck-main">
        <div className="hub-luck-icon" aria-hidden>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 13 9 7 11.5 12" />
            <path d="M11.5 12 12 4 12.5 12" />
            <path d="M12.5 12 15 7 19 13" />
            <path d="M6.5 13.2 Q12 15.2 17.5 13.2" />
            <circle cx="5" cy="13" r="1.15" fill="currentColor" stroke="none" />
            <circle cx="12" cy="4" r="1.15" fill="currentColor" stroke="none" />
            <circle cx="19" cy="13" r="1.15" fill="currentColor" stroke="none" />
            <circle cx="10" cy="14.8" r="0.65" fill="currentColor" stroke="none" />
            <circle cx="14" cy="14.8" r="0.65" fill="currentColor" stroke="none" />
            <path d="M8.5 15.5 Q12 18.2 15.5 15.5" />
            <path d="M7.5 16.8 8.8 19.5 12 17.8 15.2 19.5 16.5 16.8" />
          </svg>
        </div>

        <div className="hub-luck-body">
          <h3 id="hub-luck-title">Press Your Luck</h3>
          <div className="hub-luck-footer">
            <p
              className={`hub-luck-subtitle${spinning ? ' hub-luck-subtitle--spinning' : ''}${result?.length ? ' hub-luck-subtitle--wrap' : ''}`}
              aria-live="polite"
            >
              {subtitle}
            </p>
            <div className="hub-luck-actions">
              <div className="hub-luck-count" role="group" aria-labelledby="hub-luck-count-label">
                <span id="hub-luck-count-label" className="hub-luck-count-label">
                  Ingredients
                </span>
                <div className="hub-luck-stepper">
                  <button
                    type="button"
                    onClick={() => setCount((c) => Math.max(MIN_COUNT, c - 1))}
                    disabled={!canSpin || count <= MIN_COUNT || spinning}
                    aria-label="Fewer ingredients"
                  >
                    −
                  </button>
                  <span aria-hidden>{count}</span>
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

              <button
                type="button"
                className={`hub-luck-spin${spinning ? ' hub-luck-spin--active' : ''}`}
                onClick={spin}
                disabled={!canSpin || spinning}
              >
                <span className="hub-luck-spin-glow" aria-hidden />
                <span className="hub-luck-spin-text">
                  {spinning ? '…' : 'Spin!'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
