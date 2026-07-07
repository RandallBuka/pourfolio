import { useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { NavBar } from '../components/NavBar'
import { decodeSharedShelf, getShareQrUrl } from '../lib/shelfShare'

export function SharedShelfPage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()

  const data = useMemo(() => {
    if (!token) return null
    return decodeSharedShelf(token)
  }, [token])

  if (!data) {
    return (
      <div className="page">
        <NavBar title="Shared Shelf" onBack={() => navigate('/')} />
        <div className="empty-state">
          <h3>Invalid or expired link</h3>
          <p>This shelf share link could not be read.</p>
        </div>
      </div>
    )
  }

  const shareUrl = window.location.href
  const qrUrl = getShareQrUrl(shareUrl)

  return (
    <div className="page">
      <NavBar title="Shared Shelf" onBack={() => navigate('/')} />

      <div className="shared-shelf-hero">
        <h2>{data.name}</h2>
        <p className="text-muted">{data.items.length} bottles · read-only view</p>
        <img src={qrUrl} alt="QR code for this shelf" className="shared-shelf-qr" />
        <p className="modal-hint">Scan to open this shelf on another phone</p>
      </div>

      <div className="section-header">On the shelf</div>
      <div className="list-container">
        {data.items.map((item, idx) => (
          <div key={`${item.name}-${idx}`} className="list-item">
            <div className="item-info">
              <div className="item-name">{item.name}</div>
              <div className="item-subtitle">{item.company ?? item.genericName}</div>
              <div className="item-meta">{item.genericName}{item.category ? ` · ${item.category}` : ''}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="detail-actions">
        <Link to="/" className="btn btn-primary" style={{ textAlign: 'center', textDecoration: 'none' }}>
          Open Pourfolio
        </Link>
      </div>
    </div>
  )
}
