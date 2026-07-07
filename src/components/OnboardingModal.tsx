import { useNavigate } from 'react-router-dom'
import { markOnboardingComplete } from '../lib/onboarding'
import { SEED_INGREDIENTS } from '../data/ingredients'
import { saveState } from '../lib/storage'
import { useApp } from '../context/AppContext'

interface Props {
  onClose: () => void
  onScan: () => void
}

export function OnboardingModal({ onClose, onScan }: Props) {
  const navigate = useNavigate()
  const { state } = useApp()

  const dismiss = () => {
    markOnboardingComplete()
    onClose()
  }

  const loadDemo = () => {
    const demoIds = SEED_INGREDIENTS.slice(0, 40).map((i) => i.id)
    saveState({
      ...state,
      bars: state.bars.map((b) =>
        b.id === state.activeBarId ? { ...b, ingredientIds: demoIds } : b
      ),
    })
    markOnboardingComplete()
    window.location.reload()
  }

  return (
    <div className="modal-overlay">
      <div className="modal modal--wide onboarding-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Welcome to Pourfolio</h3>
        <p className="modal-hint">Your bar is empty. Add a few bottles to see what you can make tonight.</p>
        <div className="onboarding-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              dismiss()
              onScan()
            }}
          >
            Scan or photo a bottle
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              dismiss()
              navigate('/ingredients')
            }}
          >
            Browse ingredients
          </button>
          <button type="button" className="btn btn-secondary" onClick={loadDemo}>
            Try demo bar (40 bottles)
          </button>
        </div>
        <button type="button" className="btn btn-sm btn-secondary onboarding-skip" onClick={dismiss}>
          Skip for now
        </button>
      </div>
    </div>
  )
}
