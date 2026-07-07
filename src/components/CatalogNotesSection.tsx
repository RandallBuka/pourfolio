import { useEffect, useState } from 'react'

interface Props {
  value: string
  onSave: (notes: string) => void
  placeholder?: string
}

export function CatalogNotesSection({ value, onSave, placeholder }: Props) {
  const [draft, setDraft] = useState(value)
  const [flash, setFlash] = useState<string | null>(null)

  useEffect(() => {
    setDraft(value)
  }, [value])

  const save = () => {
    onSave(draft)
    setFlash('Notes saved')
    window.setTimeout(() => setFlash(null), 1800)
  }

  return (
    <section className="catalog-notes-section">
      <div className="section-header">Notes</div>
      <textarea
        className="catalog-notes-input"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={placeholder ?? 'Tasting notes, where you bought it, substitutes…'}
        rows={4}
      />
      <div className="catalog-notes-actions">
        <button type="button" className="btn btn-secondary" onClick={save}>
          Save notes
        </button>
        {flash && <span className="catalog-notes-flash">{flash}</span>}
      </div>
    </section>
  )
}
