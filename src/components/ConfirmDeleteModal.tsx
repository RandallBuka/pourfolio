interface Props {
  title: string
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
  nested?: boolean
}

export function ConfirmDeleteModal({
  title,
  message,
  confirmLabel = 'Delete',
  onConfirm,
  onCancel,
  nested = false,
}: Props) {
  return (
    <div
      className={`modal-overlay${nested ? ' modal-overlay--nested' : ''}`}
      onClick={onCancel}
    >
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <p className="modal-hint">{message}</p>
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
