import { useApp } from '../context/AppContext'
import { formatSnapshotTime } from '../lib/dataSnapshot'

function DeletedGroup({
  title,
  emptyMessage,
  items,
  onRestore,
  onRestoreAll,
}: {
  title: string
  emptyMessage: string
  items: Array<{ id: string; name: string; deletedAt: number; isCustom: boolean }>
  onRestore: (id: string) => void
  onRestoreAll: () => void
}) {
  return (
    <div className="deleted-items-group">
      <div className="deleted-items-group-header">
        <h4 className="deleted-items-group-title">{title}</h4>
        {items.length > 0 && (
          <button type="button" className="btn btn-sm btn-secondary" onClick={onRestoreAll}>
            Restore all ({items.length})
          </button>
        )}
      </div>
      {items.length === 0 ? (
        <p className="modal-hint deleted-items-empty">{emptyMessage}</p>
      ) : (
        <div className="deleted-items-list">
          {items.map((item) => (
            <div key={item.id} className="deleted-item-row">
              <div className="deleted-item-info">
                <div className="item-name">{item.name}</div>
                <div className="item-subtitle">
                  {item.isCustom ? 'Custom' : 'Built-in'}
                  {' · '}
                  {formatSnapshotTime(item.deletedAt)}
                </div>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={() => onRestore(item.id)}
              >
                Restore
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function DeletedItemsSection() {
  const {
    deletedIngredients,
    deletedDrinks,
    deletedCatalogItems,
    restoreIngredient,
    restoreDrink,
    restoreAllDeleted,
    restoreAllDeletedIngredients,
    restoreAllDeletedDrinks,
  } = useApp()

  return (
    <div className="deleted-items-section">
      {deletedCatalogItems.length > 1 && (
        <div className="deleted-items-actions">
          <button type="button" className="btn btn-primary" onClick={restoreAllDeleted}>
            Restore everything ({deletedCatalogItems.length})
          </button>
        </div>
      )}

      <DeletedGroup
        title="Deleted ingredients"
        emptyMessage="No deleted ingredients."
        items={deletedIngredients}
        onRestore={restoreIngredient}
        onRestoreAll={restoreAllDeletedIngredients}
      />

      <DeletedGroup
        title="Deleted recipes"
        emptyMessage="No deleted recipes."
        items={deletedDrinks}
        onRestore={restoreDrink}
        onRestoreAll={restoreAllDeletedDrinks}
      />
    </div>
  )
}
