import { useMemo, useRef, useState } from 'react'
import { canMakeDrink } from '../lib/matching'
import { captureBarPhoto } from '../lib/barPhoto'
import type { BarProfile } from '../types'
import { BarPhoto } from './BarPhoto'
import { useApp } from '../context/AppContext'

function useBarMakeableCount(bar: BarProfile): number {
  const { allDrinks, ingredientMap } = useApp()
  return useMemo(() => {
    const ctx = {
      barIngredientIds: new Set(bar.ingredientIds),
      allIngredients: ingredientMap,
    }
    return allDrinks.filter((d) => canMakeDrink(d.ingredients, ctx)).length
  }, [bar.ingredientIds, allDrinks, ingredientMap])
}

function BarCard({ bar }: { bar: BarProfile }) {
  const {
    state,
    activeBar,
    allIngredients,
    setActiveBar,
    renameBar,
    deleteBar,
    duplicateBar,
    setBarImage,
  } = useApp()
  const makeableCount = useBarMakeableCount(bar)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(bar.name)
  const [expanded, setExpanded] = useState(bar.id === activeBar.id)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const photoRef = useRef<HTMLInputElement>(null)

  const isActive = bar.id === activeBar.id

  const handlePhoto = async (file: File | undefined) => {
    if (!file) return
    try {
      const image = await captureBarPhoto(file)
      setBarImage(bar.id, image)
    } catch {
      /* ignore */
    } finally {
      if (photoRef.current) photoRef.current.value = ''
    }
  }

  const saveRename = () => {
    if (!editName.trim()) return
    renameBar(bar.id, editName.trim())
    setEditing(false)
  }

  const handleDelete = () => {
    deleteBar(bar.id)
    setConfirmDelete(false)
  }

  return (
    <div className={`bar-card ${isActive ? 'bar-card--active' : ''} ${expanded ? 'bar-card--expanded' : ''}`}>
      <button
        type="button"
        className="bar-card-header"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <BarPhoto bar={bar} size="sm" />
        <div className="bar-card-header-text">
          <div className="bar-management-title">
            {bar.name}
            {isActive && <span className="bar-management-active">Active</span>}
          </div>
          <div className="bar-management-meta">
            {bar.ingredientIds.length} ingredients · {makeableCount} drinks ready
          </div>
        </div>
        <span className="bar-card-chevron" aria-hidden>{expanded ? '▾' : '›'}</span>
      </button>

      {expanded && (
        <div className="bar-card-body">
          <div className="bar-card-photo">
            <BarPhoto bar={bar} size="md" onClick={() => photoRef.current?.click()} />
            <div className="bar-card-photo-actions">
              <button type="button" className="btn btn-sm btn-secondary" onClick={() => photoRef.current?.click()}>
                {bar.image ? 'Change photo' : 'Add photo'}
              </button>
              {bar.image && (
                <button type="button" className="btn btn-sm btn-secondary" onClick={() => setBarImage(bar.id, undefined)}>
                  Remove
                </button>
              )}
            </div>
            <input
              ref={photoRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="photo-file-input"
              onChange={(e) => { void handlePhoto(e.target.files?.[0]) }}
            />
          </div>

          <div className="bar-card-stats">
            <div className="bar-card-stat">
              <span className="bar-card-stat-value">{bar.ingredientIds.length}</span>
              <span className="bar-card-stat-label">On bar</span>
            </div>
            <div className="bar-card-stat">
              <span className="bar-card-stat-value">{makeableCount}</span>
              <span className="bar-card-stat-label">Can make</span>
            </div>
            <div className="bar-card-stat">
              <span className="bar-card-stat-value">{allIngredients.length}</span>
              <span className="bar-card-stat-label">In catalog</span>
            </div>
          </div>

          {editing ? (
            <div className="bar-management-edit">
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Bar name"
              />
              <button type="button" className="btn btn-sm btn-primary" onClick={saveRename}>Save</button>
              <button type="button" className="btn btn-sm btn-secondary" onClick={() => { setEditing(false); setEditName(bar.name) }}>Cancel</button>
            </div>
          ) : (
            <div className="bar-management-actions">
              {!isActive && (
                <button type="button" className="btn btn-sm btn-secondary" onClick={() => setActiveBar(bar.id)}>
                  Make active
                </button>
              )}
              <button type="button" className="btn btn-sm btn-secondary" onClick={() => setEditing(true)}>
                Rename
              </button>
              <button type="button" className="btn btn-sm btn-secondary" onClick={() => duplicateBar(bar.id)}>
                Duplicate
              </button>
              <button type="button" className="btn btn-sm btn-secondary" onClick={() => setConfirmDelete(true)}>
                {state.bars.length <= 1 ? 'Clear' : 'Delete'}
              </button>
            </div>
          )}
        </div>
      )}

      {confirmDelete && (
        <div className="modal-overlay modal-overlay--nested" onClick={() => setConfirmDelete(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{state.bars.length <= 1 ? 'Clear this bar?' : 'Delete this bar?'}</h3>
            <p className="modal-hint">
              {state.bars.length <= 1
                ? 'Removes all bottles from your only bar. The bar itself stays.'
                : 'Removes the bar and its stock list. Other bars are not affected.'}
            </p>
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setConfirmDelete(false)}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={handleDelete}>
                {state.bars.length <= 1 ? 'Clear bar' : 'Delete bar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function BarManagementSection() {
  const { state, addBar } = useApp()
  const [newBarName, setNewBarName] = useState('')

  return (
    <div className="bar-management">
      {state.bars.map((bar) => (
        <BarCard key={bar.id} bar={bar} />
      ))}

      <div className="bar-card-add">
        <input
          placeholder="New bar name"
          value={newBarName}
          onChange={(e) => setNewBarName(e.target.value)}
        />
        <button
          type="button"
          className="btn btn-sm btn-primary"
          onClick={() => {
            if (newBarName.trim()) {
              addBar(newBarName.trim())
              setNewBarName('')
            }
          }}
        >
          Add bar
        </button>
      </div>
    </div>
  )
}
