import { BarManagementSection } from './BarManagementSection'

interface Props {
  onClose: () => void
}

export function BarManagementModal({ onClose }: Props) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--wide bar-management-modal" onClick={(e) => e.stopPropagation()}>
        <div className="filter-panel-header">
          <div>
            <h3>Manage bars</h3>
            <p className="filter-panel-sub">Photo, stats, rename, switch, or delete</p>
          </div>
          <button type="button" className="nav-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="bar-management-modal-body">
          <BarManagementSection />
        </div>
        <div className="modal-actions">
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
