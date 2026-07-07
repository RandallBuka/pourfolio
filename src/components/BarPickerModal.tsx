import { Link } from 'react-router-dom'
import type { BarProfile } from '../types'
import { BarPhoto } from './BarPhoto'

interface BarPickerModalProps {
  bars: BarProfile[]
  activeBarId: string
  onClose: () => void
  onSelect: (barId: string) => void
}

export function BarPickerModal({
  bars,
  activeBarId,
  onClose,
  onSelect,
}: BarPickerModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--wide" onClick={(e) => e.stopPropagation()}>
        <h3>Switch bar</h3>
        <p className="modal-hint">Tap a bar to make it active.</p>

        <div className="bar-picker-notice">
          To <strong>add</strong>, <strong>remove</strong>, <strong>duplicate</strong>, or manage bar photos and stats, go to{' '}
          <strong>Settings → Manage bars</strong>.
        </div>

        {bars.map((bar) => (
          <div key={bar.id} className="bar-picker-row">
            <BarPhoto bar={bar} size="sm" />
            <button
              type="button"
              className="bar-picker-select"
              onClick={() => {
                onSelect(bar.id)
                onClose()
              }}
            >
              <span className="bar-picker-name">
                {bar.name}
                {bar.id === activeBarId && ' ✓'}
              </span>
              <span className="bar-picker-count">{bar.ingredientIds.length}</span>
            </button>
          </div>
        ))}

        <div className="modal-actions modal-actions--stack">
          <Link
            to="/more"
            state={{ openBars: true }}
            className="btn btn-primary"
            style={{ textDecoration: 'none', textAlign: 'center' }}
            onClick={onClose}
          >
            Manage bars in Settings
          </Link>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
