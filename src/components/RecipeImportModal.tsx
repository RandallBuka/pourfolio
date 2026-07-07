import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { parseRecipeText } from '../lib/recipeImport'

interface Props {
  onClose: () => void
}

export function RecipeImportModal({ onClose }: Props) {
  const { addCustomDrink } = useApp()
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)

  const preview = text.trim() ? parseRecipeText(text) : null

  const handleImport = () => {
    const drink = parseRecipeText(text)
    if (!drink) {
      setError('Could not parse recipe. Use the format: name on line 1, ingredients below, optional Instructions: section.')
      return
    }
    addCustomDrink(drink)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--wide" onClick={(e) => e.stopPropagation()}>
        <h3>Import recipe</h3>
        <p className="modal-hint">
          Paste a recipe from text. Line 1 is the drink name, then one ingredient per line, then an optional Instructions section.
        </p>
        <textarea
          className="recipe-import-textarea"
          rows={12}
          placeholder={`Old Fashioned\n2 oz Bourbon\n1 sugar cube\n2 dashes Angostura Bitters\nInstructions:\nMuddle sugar with bitters, add bourbon and ice, stir.`}
          value={text}
          onChange={(e) => { setText(e.target.value); setError(null) }}
        />
        {preview && (
          <p className="modal-hint">
            Preview: {preview.name} · {preview.ingredients.length} ingredients
          </p>
        )}
        {error && <p className="field-error">{error}</p>}
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={handleImport}>Add to recipes</button>
        </div>
      </div>
    </div>
  )
}
