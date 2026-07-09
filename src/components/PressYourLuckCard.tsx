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
  const [count, setCount] = useState(2)
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
          <svg viewBox="0 0 32 32" width="30" height="30" aria-hidden>
            <circle cx="16" cy="22.5" r="5.6" fill="var(--luck-jester-face)" />
            <path
              fill="var(--luck-jester-detail)"
              fillOpacity="0.82"
              d="M7.2 17.4 Q16 19.2 24.8 17.4 Q16 15.6 7.2 17.4 Z"
            />
            <path
              fill="var(--luck-jester-hat-gold)"
              d="M7.5 16.2 C5.8 12.8 5.2 9.8 6.5 8.2 C8.2 10.5 9.6 13.5 10.8 16.2 Z"
            />
            <path
              fill="var(--luck-jester-hat-red)"
              d="M10.8 16.2 L16 7.5 L21.2 16.2 Z"
            />
            <path
              fill="var(--luck-jester-hat-gold)"
              d="M21.2 16.2 C22.4 13.5 23.8 10.5 25.5 8.2 C26.8 9.8 26.2 12.8 24.5 16.2 Z"
            />
            <circle cx="6.5" cy="8.2" r="1.55" fill="var(--luck-jester-hat-gold)" stroke="var(--luck-jester-detail)" strokeWidth="0.55" />
            <circle cx="16" cy="7.5" r="1.55" fill="var(--luck-jester-hat-red)" stroke="var(--luck-jester-detail)" strokeWidth="0.55" />
            <circle cx="25.5" cy="8.2" r="1.55" fill="var(--luck-jester-hat-gold)" stroke="var(--luck-jester-detail)" strokeWidth="0.55" />
            <circle cx="13.8" cy="21.8" r="0.95" fill="var(--luck-jester-detail)" />
            <circle cx="18.2" cy="21.8" r="0.95" fill="var(--luck-jester-detail)" />
            <path
              fill="none"
              stroke="var(--luck-jester-detail)"
              strokeWidth="0.9"
              strokeLinecap="round"
              d="M14 24 Q16 25.1 18 24"
            />
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
