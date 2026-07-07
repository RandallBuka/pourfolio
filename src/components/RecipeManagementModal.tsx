import { RecipeManagementSection } from './RecipeManagementSection'

interface Props {
  onClose: () => void
}

export function RecipeManagementModal({ onClose }: Props) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--wide bar-management-modal" onClick={(e) => e.stopPropagation()}>
        <div className="filter-panel-header">
          <div>
            <h3>Manage recipes</h3>
            <p className="filter-panel-sub">Custom and cloned recipes you can edit or delete</p>
          </div>
          <button type="button" className="nav-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="bar-management-modal-body">
          <RecipeManagementSection />
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
