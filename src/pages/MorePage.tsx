import { useRef, useState } from 'react'

import { Link } from 'react-router-dom'

import { ThemeSelector } from '../components/ThemeSelector'

import { NavBar } from '../components/NavBar'

import { APP_NAME, APP_TAGLINE } from '../lib/brand'

import { useApp } from '../context/AppContext'

import { downloadBackup } from '../lib/backup'

import { getShareQrUrl } from '../lib/shelfShare'



export function MorePage() {

  const {

    state,

    activeBar,

    allDrinks,

    importBackup,

    getShareLink,

    deletedIngredients,

    deletedDrinks,

  } = useApp()

  const [shareOpen, setShareOpen] = useState(false)

  const [importMsg, setImportMsg] = useState<string | null>(null)

  const fileRef = useRef<HTMLInputElement>(null)



  const shareUrl = shareOpen ? getShareLink() : ''

  const shareToken = shareUrl.split('/share/')[1] ?? ''



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



      <Link to="/more/bars" className="list-item settings-cta">

        <div className="item-info">

          <div className="item-name">Manage bars</div>

          <div className="item-subtitle">

            {state.bars.length} bar{state.bars.length !== 1 ? 's' : ''} · {activeBar.name} active · {allDrinks.length} recipes

          </div>

        </div>

        <span className="settings-cta-chevron" aria-hidden>›</span>

      </Link>



      <Link to="/more/recipes" className="list-item settings-cta">

        <div className="item-info">

          <div className="item-name">Manage recipes</div>

          <div className="item-subtitle">

            {state.customDrinks.length} custom recipe{state.customDrinks.length !== 1 ? 's' : ''} · edit or delete

          </div>

        </div>

        <span className="settings-cta-chevron" aria-hidden>›</span>

      </Link>



      <Link to="/more/deleted" className="list-item settings-cta">

        <div className="item-info">

          <div className="item-name">Deleted items</div>

          <div className="item-subtitle">

            {deletedIngredients.length} ingredient{deletedIngredients.length !== 1 ? 's' : ''} ·{' '}

            {deletedDrinks.length} recipe{deletedDrinks.length !== 1 ? 's' : ''} · restore individually

          </div>

        </div>

        <span className="settings-cta-chevron" aria-hidden>›</span>

      </Link>



      <Link to="/more/advanced" className="list-item settings-cta">

        <div className="item-info">

          <div className="item-name">Advanced settings</div>

          <div className="item-subtitle">Cloud sync, app cache, and data tools</div>

        </div>

        <span className="settings-cta-chevron" aria-hidden>›</span>

      </Link>



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

    </div>

  )

}

