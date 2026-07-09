import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { NavBar } from '../components/NavBar'
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal'
import { CatalogNotesSection } from '../components/CatalogNotesSection'

import { DrinkThumb, IngredientThumb } from '../lib/ui'

import { useApp } from '../context/AppContext'

import {

  explainMatch,

  findMatchingBarIngredient,

  findSubstituteOptions,

} from '../lib/matching'

import { scaleAmount } from '../lib/recipeScale'

import { shareRecipe } from '../lib/recipeShare'

import { getRecipeIngredientBrowseUrl } from '../lib/ingredientBrowse'
import type { RecipeIngredient } from '../types'



export function DrinkDetailPage() {

  const { id } = useParams<{ id: string }>()

  const navigate = useNavigate()

  const {

    allDrinks,

    state,

    toggleFavorite,

    cloneDrink,

    ingredientMap,

    matchContext,

    getMissingForDrink,

    canMake,

    addMissingToShopping,

    updateCustomDrinkIngredient,

    deleteDrink,
    getDrinkNotes,
    setDrinkNotes,

  } = useApp()



  const drink = allDrinks.find((d) => d.id === id)

  const [editingIngredient, setEditingIngredient] = useState<number | null>(null)

  const [guests, setGuests] = useState(1)

  const [cartMsg, setCartMsg] = useState<string | null>(null)

  const [shareMsg, setShareMsg] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)



  if (!drink) {

    return (

      <div className="page">

        <NavBar title="Drink" onBack={() => navigate(-1)} />

        <div className="empty-state"><h3>Drink not found</h3></div>

      </div>

    )

  }



  const isFavorite = state.favorites.includes(drink.id)

  const missing = getMissingForDrink(drink)

  const makeable = canMake(drink)

  const isEditable = !!drink.isCustom



  const handleShare = async () => {

    try {

      const result = await shareRecipe(drink, guests)

      setShareMsg(result === 'shared' ? 'Recipe shared' : 'Recipe copied to clipboard')

    } catch {

      setShareMsg(null)

    }

  }



  return (

    <div className="page">

      <NavBar

        title={drink.name}

        onBack={() => navigate(-1)}

      />



      <div className="detail-hero">

        <DrinkThumb drink={drink} size="lg" expandable />

        <div className="item-name">{drink.name}</div>

        <div className="detail-hero-actions">

          <button

            type="button"

            className={`favorite-btn ${isFavorite ? 'active' : ''}`}

            onClick={() => toggleFavorite(drink.id)}

            aria-label={isFavorite ? 'Remove from saved' : 'Save recipe'}

          >

            {isFavorite ? '★' : '☆'}

          </button>

        </div>

        <div className="share-row">

          <button type="button" className="btn btn-sm btn-primary" onClick={() => { void handleShare() }}>

            Share recipe

          </button>

          <button

            type="button"

            className="btn btn-sm btn-secondary"

            onClick={() => {

              void shareRecipe(drink, guests).then((r) => {

                if (r === 'copied') setShareMsg('Recipe copied to clipboard')

              }).catch(() => undefined)

            }}

          >

            Copy text

          </button>

        </div>

        {shareMsg && <p className="shopping-flash">{shareMsg}</p>}

        {makeable ? (

          <p className="text-success detail-hero-status">✓ Ready to pour!</p>

        ) : (

          <p className="detail-hero-status detail-hero-status--missing">

            Missing {missing.length} ingredient{missing.length !== 1 ? 's' : ''}

          </p>

        )}

      </div>



      <div className="section-header">Ingredients & Measurements</div>



      {!isEditable && (

        <p className="recipe-edit-hint">Clone this drink to customize ingredient matching.</p>

      )}



      <div className="servings-control">

        <span className="servings-label">Guests</span>

        <div className="servings-stepper">

          <button type="button" onClick={() => setGuests((g) => Math.max(1, g - 1))} aria-label="Fewer guests">−</button>

          <span>{guests}</span>

          <button type="button" onClick={() => setGuests((g) => Math.min(50, g + 1))} aria-label="More guests">+</button>

        </div>

      </div>

      <p className="servings-hint">Amounts scale for the number of guests (1–50).</p>



      {drink.ingredients.map((req, idx) => (

        <RecipeIngredientRow

          key={idx}

          req={req}

          amount={scaleAmount(req.amount, guests)}

          matchContext={matchContext}

          ingredientMap={ingredientMap}

          editing={editingIngredient === idx}

          editable={isEditable}

          onEdit={() => {

            if (!isEditable) return

            setEditingIngredient(editingIngredient === idx ? null : idx)

          }}

          onUpdate={(patch) => updateCustomDrinkIngredient(drink.id, idx, patch)}

        />

      ))}



      <div className="detail-meta">

        <div className="detail-row">

          <span className="detail-label">Type</span>

          <span className="detail-value">{drink.type}</span>

        </div>

        <div className="detail-row">

          <span className="detail-label">Serve in</span>

          <span className="detail-value">{drink.glass}</span>

        </div>

      </div>



      <div className="instructions">

        <h4>Instructions</h4>

        <p>{drink.instructions}</p>

      </div>



      <CatalogNotesSection

        value={getDrinkNotes(drink.id)}

        onSave={(notes) => setDrinkNotes(drink.id, notes)}

        placeholder="Ratings, tweaks, when you last made it…"

      />



      <div className="detail-actions">

        <button

          type="button"

          className="btn btn-primary"

          onClick={() => {

            const clone = cloneDrink(drink)

            navigate(`/drinks/${clone.id}`)

          }}

        >

          Clone Drink

        </button>

        <button

          type="button"

          className="btn btn-secondary"

          onClick={() => {

            const n = addMissingToShopping(drink)

            setCartMsg(n > 0 ? `Added ${n} item${n !== 1 ? 's' : ''} to shopping list` : 'Nothing new to add')

          }}

        >

          Add missing to shopping list

        </button>

        <button

          type="button"

          className="btn btn-secondary btn-danger-outline"

          onClick={() => setConfirmDelete(true)}

        >

          Delete recipe

        </button>

      </div>



      {confirmDelete && (

        <ConfirmDeleteModal

          title={`Delete ${drink.name}?`}

          message="Removes this recipe from your catalog. Restore it anytime from Settings → Deleted items."

          confirmLabel="Delete recipe"

          onCancel={() => setConfirmDelete(false)}

          onConfirm={() => {

            deleteDrink(drink.id)

            setConfirmDelete(false)

            navigate('/drinks')

          }}

        />

      )}



      {cartMsg && <p className="shopping-flash detail-cart-msg">{cartMsg}</p>}

    </div>

  )

}



function RecipeIngredientRow({

  req,

  amount,

  matchContext,

  ingredientMap,

  editing,

  editable,

  onEdit,

  onUpdate,

}: {

  req: RecipeIngredient

  amount: string

  matchContext: import('../types').IngredientMatchContext

  ingredientMap: Map<string, import('../types').Ingredient>

  editing: boolean

  editable: boolean

  onEdit: () => void

  onUpdate: (patch: Partial<RecipeIngredient>) => void

}) {

  const matched = findMatchingBarIngredient(req, matchContext)

  const substitutes = findSubstituteOptions(req, matchContext)

  const displayIng = matched ?? [...ingredientMap.values()].find((i) => i.genericName === req.genericName)
  const matchNote = matched ? explainMatch(req, matched) : null
  const ingredientsBrowseUrl = getRecipeIngredientBrowseUrl(req)

  return (
    <div
      className={`recipe-ingredient ${editable ? 'recipe-ingredient--editable' : ''}`}
      onClick={editable ? onEdit : undefined}
      onKeyDown={editable ? (e) => { if (e.key === 'Enter' || e.key === ' ') onEdit() } : undefined}
      role={editable ? 'button' : undefined}
      tabIndex={editable ? 0 : undefined}
    >
      <div className="recipe-ingredient-main">
        <Link
          to={ingredientsBrowseUrl}
          className="recipe-ingredient-browse"
          onClick={(e) => e.stopPropagation()}
        >
          {displayIng && <IngredientThumb ingredient={displayIng} />}
          <span className="recipe-amount">{amount}</span>
          <div className="recipe-name">
            <div className="item-name recipe-ingredient-title">
              {req.brandName ?? req.genericName}
            </div>
            {req.brandName && (
              <div className="recipe-brand">Generic: {req.genericName}</div>
            )}
            {matched && matchNote ? (
              <span className="match-note match-note--ok">{matchNote.message}</span>
            ) : !req.optional ? (
              <>
                <span className="match-note match-note--missing">Not on your bar</span>
                {substitutes.length > 0 && (
                  <div className="substitute-list">
                    <span className="substitute-label">Try instead:</span>
                    {substitutes.slice(0, 3).map((sub) => (
                      <span key={sub.id} className="substitute-chip">
                        {sub.name} ({sub.genericName})
                      </span>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <span className="recipe-optional-label">Optional</span>
            )}
          </div>
        </Link>
      </div>



      {editing && editable && (

        <div className="recipe-ingredient-editor" onClick={(e) => e.stopPropagation()}>

          <div className="segmented">

            <button

              type="button"

              className={req.mode === 'premium' ? 'active' : ''}

              onClick={() => onUpdate({ mode: 'premium' })}

            >

              Premium

            </button>

            <button

              type="button"

              className={req.mode === 'generic' ? 'active' : ''}

              onClick={() => onUpdate({ mode: 'generic' })}

            >

              Generic

            </button>

          </div>

          <div className="toggle-row">

            <span>Allow generic substitution</span>

            <button

              type="button"

              className={`toggle ${req.allowGenericSubstitution ? 'on' : ''}`}

              aria-pressed={req.allowGenericSubstitution}

              onClick={() => onUpdate({ allowGenericSubstitution: !req.allowGenericSubstitution })}

            />

          </div>

          <div className="toggle-row">

            <span>Optional ingredient</span>

            <button

              type="button"

              className={`toggle ${req.optional ? 'on' : ''}`}

              aria-pressed={req.optional}

              onClick={() => onUpdate({ optional: !req.optional })}

            />

          </div>

          <p className="recipe-edit-note">

            Substitution: {req.allowGenericSubstitution ? 'ON — related spirits in the same family count' : 'OFF — exact match required'}

          </p>

        </div>

      )}

    </div>

  )

}


