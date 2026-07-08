import { useCallback, useRef, useState } from 'react'
import { ALPHA_INDEX_LETTERS } from '../lib/ui'

interface AlphaIndexScrubberProps {
  activeLetters: Set<string>
  onLetter: (letter: string, scrubbing: boolean) => void
}

export function AlphaIndexScrubber({ activeLetters, onLetter }: AlphaIndexScrubberProps) {
  const railRef = useRef<HTMLDivElement>(null)
  const lastLetterRef = useRef<string | null>(null)
  const [scrubbing, setScrubbing] = useState(false)
  const [highlight, setHighlight] = useState<string | null>(null)
  const [bubbleY, setBubbleY] = useState(0)

  const letterAtY = useCallback((clientY: number): string | null => {
    const rail = railRef.current
    if (!rail) return null

    const buttons = rail.querySelectorAll<HTMLElement>('[data-letter]')
    for (const btn of buttons) {
      const rect = btn.getBoundingClientRect()
      if (clientY >= rect.top && clientY <= rect.bottom) {
        return btn.dataset.letter ?? null
      }
    }

    const rect = rail.getBoundingClientRect()
    if (clientY < rect.top || clientY > rect.bottom) return null
    const ratio = (clientY - rect.top) / rect.height
    const idx = Math.min(
      ALPHA_INDEX_LETTERS.length - 1,
      Math.max(0, Math.floor(ratio * ALPHA_INDEX_LETTERS.length))
    )
    return ALPHA_INDEX_LETTERS[idx]
  }, [])

  const activateLetter = useCallback(
    (clientY: number, isScrubbing: boolean) => {
      const letter = letterAtY(clientY)
      if (!letter || !activeLetters.has(letter)) return
      setHighlight(letter)
      setBubbleY(clientY)
      if (letter !== lastLetterRef.current) {
        lastLetterRef.current = letter
        onLetter(letter, isScrubbing)
      }
    },
    [activeLetters, letterAtY, onLetter]
  )

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return
    e.preventDefault()
    railRef.current?.setPointerCapture(e.pointerId)
    setScrubbing(true)
    activateLetter(e.clientY, true)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!scrubbing) return
    e.preventDefault()
    activateLetter(e.clientY, true)
  }

  const endScrub = (e: React.PointerEvent) => {
    if (!scrubbing) return
    railRef.current?.releasePointerCapture(e.pointerId)
    setScrubbing(false)
    setHighlight(null)
    lastLetterRef.current = null
  }

  return (
    <>
      <div
        ref={railRef}
        className={`alpha-index${scrubbing ? ' alpha-index--scrubbing' : ''}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endScrub}
        onPointerCancel={endScrub}
        role="navigation"
        aria-label="Jump to letter"
      >
        {ALPHA_INDEX_LETTERS.map((letter) => {
          const enabled = activeLetters.has(letter)
          return (
            <span
              key={letter}
              data-letter={letter}
              className={[
                'alpha-index__letter',
                letter.length > 1 && 'alpha-index__letter--wide',
                !enabled && 'alpha-index__letter--disabled',
                highlight === letter && 'alpha-index__letter--active',
              ]
                .filter(Boolean)
                .join(' ')}
              aria-hidden={!enabled}
            >
              {letter}
            </span>
          )
        })}
      </div>

      {scrubbing && highlight && (
        <div className="alpha-index__bubble" style={{ top: bubbleY }}>
          {highlight}
        </div>
      )}
    </>
  )
}
