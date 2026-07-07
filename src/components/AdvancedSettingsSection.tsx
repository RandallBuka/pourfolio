import { CloudSyncPanel } from './CloudSyncPanel'
import { formatSnapshotTime, undoActionLabel, type UndoSnapshot } from '../lib/dataSnapshot'

interface Props {
  shelfBottleCount: number
  customIngredientCount: number
  customRecipeCount: number
  overrideCount: number
  undoSnapshot: UndoSnapshot | null
  cacheBusy: boolean
  onLoadDemoBar: () => void
  onRequestDeleteIngredients: () => void
  onRequestDeleteRecipes: () => void
  onRequestResetAll: () => void
  onRequestRestore: () => void
  onRequestDiscardUndo: () => void
  onRequestResetCache: () => void
}

export function AdvancedSettingsSection({
  shelfBottleCount,
  customIngredientCount,
  customRecipeCount,
  overrideCount,
  undoSnapshot,
  cacheBusy,
  onLoadDemoBar,
  onRequestDeleteIngredients,
  onRequestDeleteRecipes,
  onRequestResetAll,
  onRequestRestore,
  onRequestDiscardUndo,
  onRequestResetCache,
}: Props) {
  return (
    <>
      <div className="section-header">Cloud sync</div>
      <CloudSyncPanel />

      <div className="section-header">App</div>
      <div className="card">
        <div className="card-body">
          <p className="modal-hint" style={{ margin: '0 0 12px' }}>
            If the installed app looks outdated or shows a blank screen, reset cached files. Your bar data is kept.
          </p>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={cacheBusy}
            onClick={onRequestResetCache}
          >
            Reset cache
          </button>
        </div>
      </div>

      <div className="section-header">Data</div>

      {undoSnapshot && (
        <div className="card undo-restore-card">
          <div className="card-body">
            <p className="undo-restore-title">Restore available</p>
            <p className="modal-hint" style={{ margin: 0 }}>
              Snapshot from {formatSnapshotTime(undoSnapshot.savedAt)} before deleting{' '}
              {undoActionLabel(undoSnapshot.action)}.
            </p>
            <div className="detail-actions" style={{ marginTop: 12 }}>
              <button type="button" className="btn btn-primary" onClick={onRequestRestore}>
                Restore previous data
              </button>
              <button type="button" className="btn btn-secondary" onClick={onRequestDiscardUndo}>
                Discard restore point
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="detail-actions">
        <button type="button" className="btn btn-primary" onClick={onLoadDemoBar}>
          Load demo shelf (all ingredients)
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onRequestDeleteIngredients}
          disabled={shelfBottleCount === 0 && customIngredientCount === 0 && overrideCount === 0}
        >
          Delete all ingredients
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onRequestDeleteRecipes}
          disabled={customRecipeCount === 0}
        >
          Delete all custom recipes
        </button>
        <button type="button" className="btn btn-secondary" onClick={onRequestResetAll}>
          Reset all data
        </button>
      </div>
      <p className="modal-hint data-section-hint">
        {shelfBottleCount} bottle{shelfBottleCount !== 1 ? 's' : ''} on shelves ·{' '}
        {customIngredientCount} custom ingredient{customIngredientCount !== 1 ? 's' : ''} ·{' '}
        {customRecipeCount} custom recipe{customRecipeCount !== 1 ? 's' : ''}
      </p>
    </>
  )
}
