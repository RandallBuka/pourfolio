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
            <circle cx="16" cy="21.5" r="6.75" fill="var(--luck-jester-face)" />
            <path
              fill="var(--luck-jester-hat)"
              d="M8.2 15.4
                 C6.2 14.8 4.6 11.5 6.1 8.8
                 C7.2 10.4 8.6 12.2 10.1 13.6
                 L14.8 13
                 C15.4 9.2 15.8 6.4 16 5.2
                 C16.2 6.4 16.6 9.2 17.2 13
                 L21.9 13.6
                 C23.4 12.2 24.8 10.4 25.9 8.8
                 C27.4 11.5 25.8 14.8 23.8 15.4
                 C21.4 16.3 18.7 16.6 16 16.6
                 C13.3 16.6 10.6 16.3 8.2 15.4
                 Z"
            />
            <circle cx="6.1" cy="8.8" r="1.65" fill="var(--luck-jester-hat)" stroke="var(--luck-jester-detail)" strokeWidth="0.55" />
            <circle cx="16" cy="5.2" r="1.65" fill="var(--luck-jester-hat)" stroke="var(--luck-jester-detail)" strokeWidth="0.55" />
            <circle cx="25.9" cy="8.8" r="1.65" fill="var(--luck-jester-hat)" stroke="var(--luck-jester-detail)" strokeWidth="0.55" />
            <path
              fill="none"
              stroke="var(--luck-jester-detail)"
              strokeWidth="0.75"
              strokeOpacity="0.35"
              d="M8.5 15.6 Q16 17 23.5 15.6"
            />
            <circle cx="13.3" cy="20.5" r="1" fill="var(--luck-jester-detail)" />
            <circle cx="18.7" cy="20.5" r="1" fill="var(--luck-jester-detail)" />
            <path
              fill="none"
              stroke="var(--luck-jester-detail)"
              strokeWidth="1"
              strokeLinecap="round"
              d="M13.5 23.3 Q16 24.6 18.5 23.3"
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
