import { useRef, useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { BarManagementModal } from '../components/BarManagementModal'
import { RecipeManagementModal } from '../components/RecipeManagementModal'
import { DeletedItemsModal } from '../components/DeletedItemsModal'
import { CloudSyncPanel } from '../components/CloudSyncPanel'
import { ThemeSelector } from '../components/ThemeSelector'
import { NavBar } from '../components/NavBar'
import { APP_NAME, APP_TAGLINE } from '../lib/brand'
import { useApp } from '../context/AppContext'
import { SEED_INGREDIENTS } from '../data/ingredients'
import { downloadBackup } from '../lib/backup'
import { formatSnapshotTime, undoActionLabel } from '../lib/dataSnapshot'
import { getShareQrUrl } from '../lib/shelfShare'
import { saveState } from '../lib/storage'
import { clearAppCache } from '../lib/appCache'

type ConfirmAction = 'reset' | 'delete-ingredients' | 'delete-recipes' | 'restore' | 'discard-undo' | 'reset-cache'

export function MorePage() {
  const location = useLocation()
  const {
    state,
    activeBar,
    allDrinks,
    importBackup,
    getShareLink,
    undoSnapshot,
    deleteAllIngredients,
    deleteAllRecipes,
    restoreUndoSnapshot,
    discardUndoSnapshot,
    resetAllData,
    deletedIngredients,
    deletedDrinks,
  } = useApp()
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null)
  const [shareOpen, setShareOpen] = useState(false)
  const [barsOpen, setBarsOpen] = useState(false)
  const [recipesOpen, setRecipesOpen] = useState(false)
  const [deletedOpen, setDeletedOpen] = useState(false)
  const [importMsg, setImportMsg] = useState<string | null>(null)
  const [cacheBusy, setCacheBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const shelfBottleCount = state.bars.reduce((n, b) => n + b.ingredientIds.length, 0)
  const customIngredientCount = state.customIngredients.length
  const customRecipeCount = state.customDrinks.length
  const overrideCount = Object.keys(state.ingredientOverrides ?? {}).length

  useEffect(() => {
    const navState = location.state as { openBars?: boolean } | null
    if (navState?.openBars) {
      setBarsOpen(true)
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

  const shareUrl = shareOpen ? getShareLink() : ''
  const shareToken = shareUrl.split('/share/')[1] ?? ''

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
    setImportMsg('All data cleared. You can restore the previous state below if needed.')
  }

  const confirmDeleteIngredients = () => {
    deleteAllIngredients()
    setConfirmAction(null)
    setImportMsg('Ingredients cleared. Restore is available below if this was a mistake.')
  }

  const confirmDeleteRecipes = () => {
    deleteAllRecipes()
    setConfirmAction(null)
    setImportMsg('Custom recipes deleted. Restore is available below if this was a mistake.')
  }

  const confirmRestore = () => {
    const ok = restoreUndoSnapshot()
    setConfirmAction(null)
    setImportMsg(ok ? 'Previous data restored.' : 'Nothing to restore — snapshot expired or missing.')
  }

  const confirmDiscardUndo = () => {
    discardUndoSnapshot()
    setConfirmAction(null)
    setImportMsg('Restore point discarded.')
  }

  const copyShare = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setImportMsg('Share link copied!')
    } catch {
      setImportMsg('Copy the link below manually')
    }
  }

  const handleImport = async (file: File | undefined) => {
    if (!file) return
    try {
      const text = await file.text()
      importBackup(text)
      setImportMsg('Backup restored successfully')
      setTimeout(() => window.location.reload(), 800)
    } catch {
      setImportMsg('Could not import — invalid backup file')
    }
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
      setImportMsg('Could not reset cache — try again or reinstall the app')
    }
  }

  return (
    <div className="page">
      <NavBar title="Settings" />

      <div className="card">
        <div className="card-header">
          <h3 className="text-primary" style={{ fontWeight: 700 }}>About {APP_NAME}</h3>
        </div>
        <div className="card-body" style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--pf-text-muted)' }}>
          <p>{APP_TAGLINE}</p>
          <p style={{ marginTop: 8 }}>
            Track bottles on your shelf, see what you can pour tonight, and build a shopping list for what's missing.
          </p>
        </div>
      </div>

      <ThemeSelector />

      <button type="button" className="list-item settings-cta" onClick={() => setBarsOpen(true)}>
        <div className="item-info">
          <div className="item-name">Manage bars</div>
          <div className="item-subtitle">
            {state.bars.length} bar{state.bars.length !== 1 ? 's' : ''} · {activeBar.name} active · {allDrinks.length} recipes
          </div>
        </div>
        <span className="settings-cta-chevron" aria-hidden>›</span>
      </button>

      <button type="button" className="list-item settings-cta" onClick={() => setRecipesOpen(true)}>
        <div className="item-info">
          <div className="item-name">Manage recipes</div>
          <div className="item-subtitle">
            {state.customDrinks.length} custom recipe{state.customDrinks.length !== 1 ? 's' : ''} · edit or delete
          </div>
        </div>
        <span className="settings-cta-chevron" aria-hidden>›</span>
      </button>

      <button type="button" className="list-item settings-cta" onClick={() => setDeletedOpen(true)}>
        <div className="item-info">
          <div className="item-name">Deleted items</div>
          <div className="item-subtitle">
            {deletedIngredients.length} ingredient{deletedIngredients.length !== 1 ? 's' : ''} ·{' '}
            {deletedDrinks.length} recipe{deletedDrinks.length !== 1 ? 's' : ''} · restore individually
          </div>
        </div>
        <span className="settings-cta-chevron" aria-hidden>›</span>
      </button>

      <div className="section-header">Share & backup</div>
      <div className="detail-actions">
        <button type="button" className="btn btn-primary" onClick={() => setShareOpen(true)}>
          Share this shelf
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => downloadBackup(state)}>
          Export backup
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => fileRef.current?.click()}>
          Import backup
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="photo-file-input"
          onChange={(e) => { void handleImport(e.target.files?.[0]) }}
        />
      </div>

      {importMsg && <p className="shopping-flash">{importMsg}</p>}

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
            onClick={() => setConfirmAction('reset-cache')}
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
              <button type="button" className="btn btn-primary" onClick={() => setConfirmAction('restore')}>
                Restore previous data
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setConfirmAction('discard-undo')}>
                Discard restore point
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="detail-actions">
        <button type="button" className="btn btn-primary" onClick={loadDemoBar}>
          Load demo shelf (all ingredients)
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setConfirmAction('delete-ingredients')}
          disabled={shelfBottleCount === 0 && customIngredientCount === 0 && overrideCount === 0}
        >
          Delete all ingredients
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setConfirmAction('delete-recipes')}
          disabled={customRecipeCount === 0}
        >
          Delete all custom recipes
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => setConfirmAction('reset')}>
          Reset all data
        </button>
      </div>
      <p className="modal-hint data-section-hint">
        {shelfBottleCount} bottle{shelfBottleCount !== 1 ? 's' : ''} on shelves ·{' '}
        {customIngredientCount} custom ingredient{customIngredientCount !== 1 ? 's' : ''} ·{' '}
        {customRecipeCount} custom recipe{customRecipeCount !== 1 ? 's' : ''}
      </p>

      {barsOpen && <BarManagementModal onClose={() => setBarsOpen(false)} />}

      {recipesOpen && <RecipeManagementModal onClose={() => setRecipesOpen(false)} />}

      {deletedOpen && <DeletedItemsModal onClose={() => setDeletedOpen(false)} />}

      {shareOpen && (
        <div className="modal-overlay" onClick={() => setShareOpen(false)}>
          <div className="modal modal--wide" onClick={(e) => e.stopPropagation()}>
            <h3>Share {activeBar.name}</h3>
            <p className="modal-hint">Anyone with this link can view what's on your shelf (read-only).</p>
            {activeBar.ingredientIds.length === 0 ? (
              <p className="barcode-error">Add bottles to this shelf before sharing.</p>
            ) : (
              <>
                <img src={getShareQrUrl(shareUrl)} alt="" className="shared-shelf-qr" />
                <label className="field-label">Share link</label>
                <input readOnly value={shareUrl} onFocus={(e) => e.target.select()} />
                {shareToken && (
                  <Link to={`/share/${shareToken}`} className="btn btn-secondary" style={{ textDecoration: 'none', textAlign: 'center' }}>
                    Preview shared view
                  </Link>
                )}
                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShareOpen(false)}>Close</button>
                  <button type="button" className="btn btn-primary" onClick={() => { void copyShare() }}>Copy link</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

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
    </div>
  )
}
