import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { BarcodeScanModal } from '../components/BarcodeScanModal'

import { BarPhoto } from '../components/BarPhoto'

import { BarPickerModal } from '../components/BarPickerModal'

import { HubTileIcon } from '../components/HubTileIcon'

import { NavBar } from '../components/NavBar'

import { OnboardingModal } from '../components/OnboardingModal'

import { APP_NAME, APP_TAGLINE } from '../lib/brand'

import { captureBarPhoto } from '../lib/barPhoto'

import { isOnboardingComplete } from '../lib/onboarding'

import { PressYourLuckCard } from '../components/PressYourLuckCard'
import { useApp } from '../context/AppContext'



export function MyBarPage() {

  const {

    activeBar,

    makeableCount,

    state,

    setActiveBar,

    setBarImage,

    lowStockIngredients,

    addLowStockToShopping,

  } = useApp()

  const barCount = activeBar.ingredientIds.length

  const [showBarPicker, setShowBarPicker] = useState(false)

  const [showScan, setShowScan] = useState(false)

  const [showOnboarding, setShowOnboarding] = useState(
    () => activeBar.ingredientIds.length === 0 && !isOnboardingComplete()
  )

  const [photoError, setPhotoError] = useState<string | null>(null)

  const [lowStockMsg, setLowStockMsg] = useState<string | null>(null)

  const photoRef = useRef<HTMLInputElement>(null)



  const lowStockNames = useMemo(

    () => lowStockIngredients.slice(0, 3).map((i) => i.name).join(', '),

    [lowStockIngredients]

  )



  const handleActiveBarPhoto = async (file: File | undefined) => {

    if (!file) return

    try {

      const image = await captureBarPhoto(file)

      setBarImage(activeBar.id, image)

      setPhotoError(null)

    } catch {

      setPhotoError('Could not use that photo — try another image.')

    } finally {

      if (photoRef.current) photoRef.current.value = ''

    }

  }



  return (

    <div className="page hub-page">

      <NavBar title={APP_NAME} brand />



      <div className="hub-header">

        <div className="hub-bar-identity">

          <BarPhoto

            bar={activeBar}

            size="md"

            onClick={() => photoRef.current?.click()}

          />

          <div className="hub-bar-identity-text">

            <button

              type="button"

              className="hub-bar-switch"

              onClick={() => setShowBarPicker(true)}

              aria-label={`Switch bar — currently ${activeBar.name}`}

              title="Switch bar"

            >

              <span className="hub-bar-switch-name">{activeBar.name}</span>

              <span className="hub-bar-switch-chevron" aria-hidden>

                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">

                  <path d="M6 9l6 6 6-6" />

                </svg>

              </span>

            </button>

            <p className="hub-tagline">{APP_TAGLINE}</p>

          </div>

        </div>

        {photoError && <p className="hub-photo-error">{photoError}</p>}

        <input

          ref={photoRef}

          type="file"

          accept="image/*"

          capture="environment"

          className="photo-file-input"

          onChange={(e) => { void handleActiveBarPhoto(e.target.files?.[0]) }}

        />

      </div>

      {lowStockIngredients.length > 0 && (

        <div className="hub-low-stock-banner">

          <p>

            {lowStockIngredients.length} bottle{lowStockIngredients.length !== 1 ? 's' : ''} running low

            {lowStockNames ? ` — ${lowStockNames}${lowStockIngredients.length > 3 ? '…' : ''}` : ''}

          </p>

          <button

            type="button"

            className="btn btn-sm btn-secondary"

            onClick={() => {

              const n = addLowStockToShopping()

              setLowStockMsg(n > 0 ? `Added ${n} to shopping list` : 'Already on your shopping list')

            }}

          >

            Add to list

          </button>

        </div>

      )}



      {lowStockMsg && <p className="hub-photo-error">{lowStockMsg}</p>}

      <div className="hub-grid">

        <Link to="/my-ingredients" className="hub-tile">
          <div className="hub-icon hub-icon--have">
            <HubTileIcon kind="bar" />
          </div>
          <div className="hub-tile-body">
            <h3>What&apos;s On My Bar</h3>
            <p>{barCount} ingredient{barCount !== 1 ? 's' : ''}</p>
          </div>
        </Link>



        <Link to="/can-make" className="hub-tile">
          <div className="hub-icon hub-icon--make">
            <HubTileIcon kind="make" />
          </div>
          <div className="hub-tile-body">
            <h3>Drinks I Can Make</h3>
            <p>{makeableCount} ready now</p>
          </div>
        </Link>



        <Link to="/need" className="hub-tile">

          <div className="hub-icon hub-icon--need">

            <HubTileIcon kind="need" />

          </div>

          <div className="hub-tile-body">

            <h3>What I&apos;m Missing</h3>

            <p>For saved drinks</p>

          </div>

        </Link>



        <Link to="/shopping" className="hub-tile">

          <div className="hub-icon hub-icon--shop">

            <HubTileIcon kind="shop" />

          </div>

          <div className="hub-tile-body">

            <h3>Shopping List</h3>

            <p>{state.shoppingList.length > 0 ? `${state.shoppingList.length} to buy` : 'Store checklist'}</p>

          </div>

        </Link>

        <PressYourLuckCard />
      </div>

      {showBarPicker && (

        <BarPickerModal

          bars={state.bars}

          activeBarId={state.activeBarId}

          onClose={() => setShowBarPicker(false)}

          onSelect={setActiveBar}

        />

      )}



      {showScan && <BarcodeScanModal onClose={() => setShowScan(false)} />}



      {showOnboarding && (

        <OnboardingModal

          onClose={() => setShowOnboarding(false)}

          onScan={() => setShowScan(true)}

        />

      )}

    </div>

  )

}


