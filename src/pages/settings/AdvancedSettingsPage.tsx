import { useState } from 'react'
import { AdvancedSettingsSection } from '../../components/AdvancedSettingsSection'
import { SettingsSubPage } from '../../components/SettingsSubPage'
import { useApp } from '../../context/AppContext'
import { SEED_INGREDIENTS } from '../../data/ingredients'
import { formatSnapshotTime, undoActionLabel } from '../../lib/dataSnapshot'
import { clearAppCache } from '../../lib/appCache'
import { saveState } from '../../lib/storage'

type ConfirmAction = 'reset' | 'delete-ingredients' | 'delete-recipes' | 'restore' | 'discard-undo' | 'reset-cache'

export function AdvancedSettingsPage() {
  const {
    state,
    undoSnapshot,
    deleteAllIngredients,
    deleteAllRecipes,
    restoreUndoSnapshot,
    discardUndoSnapshot,
    resetAllData,
  } = useApp()
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null)
  const [cacheBusy, setCacheBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const shelfBottleCount = state.bars.reduce((n, b) => n + b.ingredientIds.length, 0)
  const customIngredientCount = state.customIngredients.length
  const customRecipeCount = state.customDrinks.length
  const overrideCount = Object.keys(state.ingredientOverrides ?? {}).length

  const loadDemoBar = () => {
    const demoIds = SEED_INGREDIENTS.map((i) => i.id)
    const newState = {
      ...state,
      bars: state.bars.map((b) =>
        b.id === state.activeBarId
          ? { ...b, name: 'Full Demo Shelf', ingredientIds: demoIds }
          : b
      ),
    }
    saveState(newState)
    window.location.reload()
  }

  const resetAll = () => {
    resetAllData()
    setConfirmAction(null)
    setMessage('All data cleared. You can restore the previous state below if needed.')
  }

  const confirmDeleteIngredients = () => {
    deleteAllIngredients()
    setConfirmAction(null)
    setMessage('Ingredients cleared. Restore is available below if this was a mistake.')
  }

  const confirmDeleteRecipes = () => {
    deleteAllRecipes()
    setConfirmAction(null)
    setMessage('Custom recipes deleted. Restore is available below if this was a mistake.')
  }

  const confirmRestore = () => {
    const ok = restoreUndoSnapshot()
    setConfirmAction(null)
    setMessage(ok ? 'Previous data restored.' : 'Nothing to restore — snapshot expired or missing.')
  }

  const confirmDiscardUndo = () => {
    discardUndoSnapshot()
    setConfirmAction(null)
    setMessage('Restore point discarded.')
  }

  const confirmResetCache = async () => {
    setCacheBusy(true)
    try {
      await clearAppCache()
      setConfirmAction(null)
      window.location.reload()
    } catch {
      setCacheBusy(false)
      setConfirmAction(null)
      setMessage('Could not reset cache — try again or reinstall the app')
    }
  }

  return (
    <SettingsSubPage title="Advanced settings" subtitle="Cloud sync, app cache, and data tools">
      <AdvancedSettingsSection
        shelfBottleCount={shelfBottleCount}
        customIngredientCount={customIngredientCount}
        customRecipeCount={customRecipeCount}
        overrideCount={overrideCount}
        undoSnapshot={undoSnapshot}
        cacheBusy={cacheBusy}
        onLoadDemoBar={loadDemoBar}
        onRequestDeleteIngredients={() => setConfirmAction('delete-ingredients')}
        onRequestDeleteRecipes={() => setConfirmAction('delete-recipes')}
        onRequestResetAll={() => setConfirmAction('reset')}
        onRequestRestore={() => setConfirmAction('restore')}
        onRequestDiscardUndo={() => setConfirmAction('discard-undo')}
        onRequestResetCache={() => setConfirmAction('reset-cache')}
      />

      {message && <p className="shopping-flash">{message}</p>}

      {confirmAction && (
        <div className="modal-overlay" onClick={() => setConfirmAction(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            {confirmAction === 'reset' && (
              <>
                <h3>Reset everything?</h3>
                <p style={{ marginBottom: 16, fontSize: 14, color: 'var(--pf-text-muted)' }}>
                  Clears shelves, custom ingredients, saved recipes, and your shopping list. A restore point is saved automatically so you can undo this.
                </p>
                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setConfirmAction(null)}>Cancel</button>
                  <button type="button" className="btn btn-primary" onClick={resetAll}>Reset</button>
                </div>
              </>
            )}
            {confirmAction === 'delete-ingredients' && (
              <>
                <h3>Delete all ingredients?</h3>
                <p style={{ marginBottom: 16, fontSize: 14, color: 'var(--pf-text-muted)' }}>
                  Removes every bottle from all shelves ({shelfBottleCount}), deletes {customIngredientCount} custom ingredient{customIngredientCount !== 1 ? 's' : ''}, clears shopping list items, and resets catalog edits. Built-in catalog entries remain — only your shelf and custom data are cleared.
                </p>
                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setConfirmAction(null)}>Cancel</button>
                  <button type="button" className="btn btn-primary" onClick={confirmDeleteIngredients}>Delete all</button>
                </div>
              </>
            )}
            {confirmAction === 'delete-recipes' && (
              <>
                <h3>Delete all custom recipes?</h3>
                <p style={{ marginBottom: 16, fontSize: 14, color: 'var(--pf-text-muted)' }}>
                  Permanently removes {customRecipeCount} custom recipe{customRecipeCount !== 1 ? 's' : ''} you created or cloned. Built-in recipes in the catalog are not affected.
                </p>
                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setConfirmAction(null)}>Cancel</button>
                  <button type="button" className="btn btn-primary" onClick={confirmDeleteRecipes}>Delete all</button>
                </div>
              </>
            )}
            {confirmAction === 'restore' && undoSnapshot && (
              <>
                <h3>Restore previous data?</h3>
                <p style={{ marginBottom: 16, fontSize: 14, color: 'var(--pf-text-muted)' }}>
                  Brings back {undoActionLabel(undoSnapshot.action)} from {formatSnapshotTime(undoSnapshot.savedAt)}. Any changes made after that delete will be replaced.
                </p>
                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setConfirmAction(null)}>Cancel</button>
                  <button type="button" className="btn btn-primary" onClick={confirmRestore}>Restore</button>
                </div>
              </>
            )}
            {confirmAction === 'discard-undo' && undoSnapshot && (
              <>
                <h3>Discard restore point?</h3>
                <p style={{ marginBottom: 16, fontSize: 14, color: 'var(--pf-text-muted)' }}>
                  You will not be able to undo the last delete unless you exported a backup file.
                </p>
                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setConfirmAction(null)}>Cancel</button>
                  <button type="button" className="btn btn-primary" onClick={confirmDiscardUndo}>Discard</button>
                </div>
              </>
            )}
            {confirmAction === 'reset-cache' && (
              <>
                <h3>Reset app cache?</h3>
                <p style={{ marginBottom: 16, fontSize: 14, color: 'var(--pf-text-muted)' }}>
                  Clears offline files and reloads the latest version from the server. Your ingredients, recipes, and settings stay on this device.
                </p>
                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" disabled={cacheBusy} onClick={() => setConfirmAction(null)}>Cancel</button>
                  <button type="button" className="btn btn-primary" disabled={cacheBusy} onClick={() => { void confirmResetCache() }}>
                    {cacheBusy ? 'Resetting…' : 'Reset cache'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </SettingsSubPage>
  )
}
