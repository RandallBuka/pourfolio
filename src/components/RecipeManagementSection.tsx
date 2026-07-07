import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ConfirmDeleteModal } from './ConfirmDeleteModal'
import { useApp } from '../context/AppContext'

export function RecipeManagementSection() {
  const { state, deleteDrink, deleteAllRecipes, updateCustomDrink } = useApp()
  const recipes = state.customDrinks
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false)

  if (recipes.length === 0) {
    return (
      <p className="modal-hint" style={{ margin: '0 0 8px' }}>
        No custom recipes yet. Import or clone a drink to create one.
      </p>
    )
  }

  return (
    <>
      <div className="recipe-management-list">
        {recipes.map((drink) => (
          <div key={drink.id} className="bar-card">
            <div className="recipe-mgmt-row">
              <div className="recipe-mgmt-info">
                <div className="item-name">{drink.name}</div>
                <div className="item-subtitle">
                  {drink.type} · {drink.ingredients.length} ingredients
                  {drink.clonedFrom ? ' · cloned' : ' · custom'}
                </div>
              </div>
              <div className="recipe-mgmt-actions">
                <Link to={`/drinks/${drink.id}`} className="btn btn-sm btn-secondary recipe-mgmt-link">
                  Open
                </Link>
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={() => {
                    const name = window.prompt('Recipe name', drink.name)
                    if (name?.trim()) updateCustomDrink(drink.id, { name: name.trim() })
                  }}
                >
                  Rename
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={() => setDeleteTarget({ id: drink.id, name: drink.name })}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {recipes.length > 1 && (
        <button
          type="button"
          className="btn btn-secondary recipe-mgmt-delete-all"
          onClick={() => setConfirmDeleteAll(true)}
        >
          Delete all custom recipes
        </button>
      )}

      {deleteTarget && (
        <ConfirmDeleteModal
          nested
          title={`Delete ${deleteTarget.name}?`}
          message="Removes this recipe from your catalog. Restore it anytime from Settings → Deleted items."
          confirmLabel="Delete recipe"
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => {
            deleteDrink(deleteTarget.id)
            setDeleteTarget(null)
          }}
        />
      )}

      {confirmDeleteAll && (
        <ConfirmDeleteModal
          nested
          title={`Delete all ${recipes.length} custom recipes?`}
          message="Removes every custom recipe from your catalog. Restore them from Settings → Deleted items."
          confirmLabel="Delete all"
          onCancel={() => setConfirmDeleteAll(false)}
          onConfirm={() => {
            deleteAllRecipes()
            setConfirmDeleteAll(false)
          }}
        />
      )}
    </>
  )
}
