import { AdvancedSettingsSection } from './AdvancedSettingsSection'
import type { UndoSnapshot } from '../lib/dataSnapshot'

interface Props {
  onClose: () => void
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

export function AdvancedSettingsModal({
  onClose,
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--wide bar-management-modal" onClick={(e) => e.stopPropagation()}>
        <div className="filter-panel-header">
          <div>
            <h3>Advanced settings</h3>
            <p className="filter-panel-sub">Cloud sync, app cache, and data tools</p>
          </div>
          <button type="button" className="nav-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="bar-management-modal-body">
          <AdvancedSettingsSection
            shelfBottleCount={shelfBottleCount}
            customIngredientCount={customIngredientCount}
            customRecipeCount={customRecipeCount}
            overrideCount={overrideCount}
            undoSnapshot={undoSnapshot}
            cacheBusy={cacheBusy}
            onLoadDemoBar={onLoadDemoBar}
            onRequestDeleteIngredients={onRequestDeleteIngredients}
            onRequestDeleteRecipes={onRequestDeleteRecipes}
            onRequestResetAll={onRequestResetAll}
            onRequestRestore={onRequestRestore}
            onRequestDiscardUndo={onRequestDiscardUndo}
            onRequestResetCache={onRequestResetCache}
          />
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
