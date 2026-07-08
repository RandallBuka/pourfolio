import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { downloadBackup } from '../lib/backup'
import { getShareQrUrl } from '../lib/shelfShare'

export function ShareBackupPanel() {
  const { state, activeBar, importBackup, getShareLink } = useApp()
  const [shareOpen, setShareOpen] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const shareUrl = shareOpen ? getShareLink() : ''
  const shareToken = shareUrl.split('/share/')[1] ?? ''

  const copyShare = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setMessage('Share link copied!')
    } catch {
      setMessage('Copy the link below manually')
    }
  }

  const handleImport = async (file: File | undefined) => {
    if (!file) return
    try {
      const text = await file.text()
      importBackup(text)
      setMessage('Backup restored successfully')
      setTimeout(() => window.location.reload(), 800)
    } catch {
      setMessage('Could not import — invalid backup file')
    }
  }

  return (
    <>
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

      {message && <p className="shopping-flash">{message}</p>}

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
    </>
  )
}
