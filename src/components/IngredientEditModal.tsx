import { useEffect, useState } from 'react'
import type { Ingredient } from '../types'
import { US_STATES, isUsCountry } from '../data/usStates'
import { isWineIngredient } from '../lib/ingredientAbv'
import {
  GENERIC_NAME_SUGGESTIONS,
  INGREDIENT_CATEGORIES,
  formToPatch,
  ingredientToForm,
  type IngredientEditForm,
} from '../lib/ingredientEdit'

interface Props {
  ingredient: Ingredient
  original?: Ingredient
  onSave: (patch: ReturnType<typeof formToPatch>) => void
  onReset?: () => void
  onClose: () => void
}

export function IngredientEditModal({ ingredient, original, onSave, onReset, onClose }: Props) {
  const [form, setForm] = useState<IngredientEditForm>(() => ingredientToForm(ingredient))
  const [error, setError] = useState('')

  useEffect(() => {
    setForm(ingredientToForm(ingredient))
    setError('')
  }, [ingredient])

  const set = (key: keyof IngredientEditForm, value: string) => {
    setForm((f) => {
      const next = { ...f, [key]: value }
      if (key === 'country' && !isUsCountry(value)) {
        next.state = ''
      }
      return next
    })
  }

  const handleSave = () => {
    if (!form.name.trim() || !form.genericName.trim()) {
      setError('Name and generic type are required.')
      return
    }
    onSave(formToPatch(form))
    onClose()
  }

  const genericChanged = original && form.genericName.trim() !== original.genericName
  const showState = isUsCountry(form.country)
  const showWineFields = isWineIngredient({ genericName: form.genericName, name: form.name, category: form.category })

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--wide" onClick={(e) => e.stopPropagation()}>
        <h3>Edit ingredient</h3>
        <p className="modal-hint">
          Changing the <strong>generic type</strong> updates which recipes this bottle counts toward.
        </p>

        <label className="field-label">Display name</label>
        <input
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder="e.g. Hennessy VS Cognac"
        />

        <label className="field-label">Generic type</label>
        <input
          list="generic-suggestions"
          value={form.genericName}
          onChange={(e) => set('genericName', e.target.value)}
          placeholder="e.g. Brandy, Vodka, Liqueur"
        />
        <datalist id="generic-suggestions">
          {GENERIC_NAME_SUGGESTIONS.map((g) => (
            <option key={g} value={g} />
          ))}
        </datalist>
        {genericChanged && (
          <p className="field-note">
            Was <strong>{original!.genericName}</strong> — recipes will match as{' '}
            <strong>{form.genericName.trim()}</strong> instead.
          </p>
        )}

        <label className="field-label">Category</label>
        <select value={form.category} onChange={(e) => set('category', e.target.value)}>
          {INGREDIENT_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <label className="field-label">Company</label>
        <input value={form.company} onChange={(e) => set('company', e.target.value)} />

        <label className="field-label">Country</label>
        <input
          value={form.country}
          onChange={(e) => set('country', e.target.value)}
          placeholder="e.g. USA, France, Mexico"
        />

        {showState && (
          <>
            <label className="field-label">State (USA)</label>
            <input
              list="us-state-suggestions"
              value={form.state}
              onChange={(e) => set('state', e.target.value)}
              placeholder="e.g. Kentucky"
            />
            <datalist id="us-state-suggestions">
              {US_STATES.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </>
        )}

        <label className="field-label">Spirit type</label>
        <input value={form.type} onChange={(e) => set('type', e.target.value)} placeholder="e.g. Whiskey" />

        <label className="field-label">Flavor</label>
        <input value={form.flavor} onChange={(e) => set('flavor', e.target.value)} />

        <label className="field-label">ABV (%)</label>
        <input
          type="number"
          min={0}
          max={100}
          step={0.1}
          value={form.abv}
          onChange={(e) => set('abv', e.target.value)}
          placeholder="e.g. 40"
        />

        {showWineFields && (
          <>
            <label className="field-label">Vintage (year)</label>
            <input
              type="number"
              min={1900}
              max={2100}
              step={1}
              value={form.vintage}
              onChange={(e) => set('vintage', e.target.value)}
              placeholder="e.g. 2019"
            />
          </>
        )}

        <label className="field-label">Notes</label>
        <textarea
          className="catalog-notes-input"
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
          placeholder="Optional — tasting notes, storage tips…"
          rows={3}
        />

        {error && <p className="field-error">{error}</p>}

        <div className="modal-actions modal-actions--stack">
          {onReset && (
            <button type="button" className="btn btn-secondary" onClick={() => { onReset(); onClose() }}>
              Reset to default
            </button>
          )}
          <div style={{ display: 'flex', gap: 12, marginLeft: 'auto' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="button" className="btn btn-primary" onClick={handleSave}>Save</button>
          </div>
        </div>
      </div>
    </div>
  )
}
