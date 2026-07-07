import { DeletedItemsSection } from './DeletedItemsSection'

interface Props {
  onClose: () => void
}

export function DeletedItemsModal({ onClose }: Props) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--wide" onClick={(e) => e.stopPropagation()}>
        <h3>Deleted items</h3>
        <p className="modal-hint">
          Restore ingredients and recipes you removed from your catalog.
        </p>
        <DeletedItemsSection />
        <div className="modal-actions">
          <button type="button" className="btn btn-primary" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  )
}
