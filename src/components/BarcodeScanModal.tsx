import { useCallback, useRef, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { useNavigate } from 'react-router-dom'
import { WebBarcodeScanner } from './WebBarcodeScanner'
import { useApp } from '../context/AppContext'
import { scanBarcodeNative } from '../lib/barcodeScan'
import { findIngredientByBarcode, findIngredientByNameHint, normalizeBarcode } from '../lib/ingredientBarcode'
import { lookupBarcode, type ScannedProduct } from '../lib/openFoodFacts'
import { GENERIC_NAME_SUGGESTIONS, INGREDIENT_CATEGORIES } from '../lib/ingredientEdit'
import { captureLabelPhoto } from '../lib/labelPhoto'
import { recognizeLabelFromImage } from '../lib/labelOcr'
import { recordLabelCorrection } from '../lib/labelOcrLearning'
import type { ParsedLabel } from '../lib/labelParse'
import { isWineIngredient } from '../lib/ingredientAbv'
import { isUsCountry } from '../data/usStates'
import type { IngredientCategory } from '../types'

type Step = 'choose' | 'scan' | 'manual' | 'photo' | 'ocr' | 'lookup' | 'review' | 'done'

interface Props {
  onClose: () => void
  /** If returns true, modal closes without adding (e.g. shopping check-off) */
  onScanned?: (barcode: string) => boolean | void
}

interface ReviewForm {
  name: string
  genericName: string
  company: string
  country: string
  state: string
  category: IngredientCategory
  abv: string
  vintage: string
  image?: string
  ocrRaw?: string
  ocrConfidence?: 'low' | 'medium' | 'high'
  ocrParsed?: ParsedLabel
}

function productToForm(product: ScannedProduct): ReviewForm {
  return {
    name: product.name,
    genericName: product.genericName,
    company: product.company ?? '',
    country: product.country ?? '',
    state: '',
    category: product.category,
    image: product.image,
    abv: '',
    vintage: '',
  }
}

export function BarcodeScanModal({ onClose, onScanned }: Props) {
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)
  const { allIngredients, addCustomIngredient, addToBar, isInBar } = useApp()
  const [step, setStep] = useState<Step>(onScanned ? 'scan' : 'choose')
  const [barcode, setBarcode] = useState('')
  const [manualCode, setManualCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<ReviewForm | null>(null)
  const [addToShelf, setAddToShelf] = useState(true)
  const [ocrProgress, setOcrProgress] = useState(0)
  const [ocrStatus, setOcrStatus] = useState('')
  const isNative = Capacitor.isNativePlatform()

  const finishWithIngredient = useCallback((ingredientId: string) => {
    setStep('done')
    onClose()
    navigate(`/ingredients/${ingredientId}`)
  }, [navigate, onClose])

  const handleExisting = useCallback((ingredientId: string) => {
    if (addToShelf && !isInBar(ingredientId)) {
      addToBar(ingredientId)
    }
    finishWithIngredient(ingredientId)
  }, [addToBar, addToShelf, finishWithIngredient, isInBar])

  const processBarcode = useCallback(async (raw: string) => {
    const code = normalizeBarcode(raw)
    if (code.length < 8) {
      setError('Enter a valid barcode (8+ digits)')
      return
    }

    if (onScanned?.(code)) {
      onClose()
      return
    }

    setBarcode(code)
    setError(null)
    setStep('lookup')

    const existing = findIngredientByBarcode(allIngredients, code)
    if (existing) {
      handleExisting(existing.id)
      return
    }

    const product = await lookupBarcode(code)
    if (!product) {
      setError('Product not found online. Take a label photo or enter details manually.')
      setManualCode(code)
      setStep('manual')
      return
    }

    const nameMatch = findIngredientByNameHint(allIngredients, product.name, product.company)
    if (nameMatch) {
      handleExisting(nameMatch.id)
      return
    }

    setForm(productToForm(product))
    setStep('review')
  }, [allIngredients, handleExisting, onClose, onScanned])

  const startNativeScan = async () => {
    setError(null)
    try {
      const code = await scanBarcodeNative()
      if (code) {
        await processBarcode(code)
      } else {
        setError('No barcode detected. Try again or enter the code manually.')
      }
    } catch {
      setError('Camera permission is required to scan barcodes.')
    }
  }

  const startPhotoCapture = () => {
    setError(null)
    setStep('photo')
  }

  const handlePhotoFile = async (file: File | undefined) => {
    if (!file) return
    try {
      setError(null)
      setStep('ocr')
      setOcrProgress(0)
      setOcrStatus('Preparing photo…')
      const image = await captureLabelPhoto(file)
      const parsed = await recognizeLabelFromImage(image, (pct, status) => {
        setOcrProgress(pct)
        setOcrStatus(status)
      })

      const nameMatch = parsed.name
        ? findIngredientByNameHint(allIngredients, parsed.name, parsed.company)
        : undefined
      if (nameMatch) {
        handleExisting(nameMatch.id)
        return
      }

      setForm({
        name: parsed.name,
        genericName: parsed.genericName,
        company: parsed.company ?? '',
        country: parsed.country ?? '',
        state: '',
        category: parsed.category,
        abv: parsed.abv != null ? String(parsed.abv) : '',
        vintage: parsed.vintage != null ? String(parsed.vintage) : '',
        image,
        ocrRaw: parsed.rawText,
        ocrConfidence: parsed.confidence,
        ocrParsed: parsed,
      })
      setStep('review')
      if (!parsed.name) {
        setError('Could not read a clear brand name — review or edit the fields below.')
      } else if (parsed.confidence === 'low') {
        setError('OCR had low confidence — please verify the details below.')
      } else {
        setError(null)
      }
    } catch {
      setError('Label OCR failed. Try a clearer, well-lit photo of the front label.')
      setStep('photo')
    }
  }

  const saveReview = () => {
    if (!form) return
    if (!form.name.trim() || !form.genericName.trim()) {
      setError('Brand name and generic type are required')
      return
    }

    const abvRaw = form.abv.trim()
    const abv = abvRaw ? Number(abvRaw) : undefined
    const vintageRaw = form.vintage.trim()
    const vintage = vintageRaw ? Number(vintageRaw) : undefined

    if (form.ocrRaw) {
      recordLabelCorrection(
        form.ocrRaw,
        form.ocrParsed?.name ?? form.name.trim(),
        {
          name: form.name.trim(),
          genericName: form.genericName.trim(),
          company: form.company.trim() || undefined,
          country: form.country.trim() || undefined,
          category: form.category,
          abv: abv != null && !Number.isNaN(abv) ? abv : undefined,
          vintage: vintage != null && !Number.isNaN(vintage) ? Math.round(vintage) : undefined,
        }
      )
    }

    const id = addCustomIngredient({
      name: form.name.trim(),
      genericName: form.genericName.trim(),
      company: form.company.trim() || undefined,
      country: form.country.trim() || undefined,
      state: isUsCountry(form.country) ? form.state.trim() || undefined : undefined,
      category: form.category,
      image: form.image,
      barcode: barcode || undefined,
      abv: abv != null && !Number.isNaN(abv) ? abv : undefined,
      vintage: vintage != null && !Number.isNaN(vintage) ? Math.round(vintage) : undefined,
    })

    if (addToShelf) addToBar(id)
    finishWithIngredient(id)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--wide barcode-modal" onClick={(e) => e.stopPropagation()}>
        <div className="barcode-modal-header">
          <h3>{onScanned ? 'Scan item' : 'Add new ingredient'}</h3>
          <button type="button" className="nav-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {error && <p className="barcode-error">{error}</p>}

        {step === 'choose' && !onScanned && (
          <>
            <p className="modal-hint">
              Add a bottle to your bar and catalog. <strong>Label photo</strong> works best for spirits; try <strong>barcode</strong> for mixers and grocery items. You can also enter details manually.
            </p>
            <button type="button" className="btn btn-primary" onClick={startPhotoCapture}>
              Label photo (recommended)
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => setStep('manual')}>
              Enter details manually
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => setStep('scan')}>
              Scan barcode
            </button>
          </>
        )}

        {step === 'scan' && (
          <>
            {isNative ? (
              <div className="barcode-native-scan">
                <p className="modal-hint">Use your device camera to scan the UPC on a bottle or can.</p>
                <button type="button" className="btn btn-primary" onClick={startNativeScan}>
                  Open camera scanner
                </button>
              </div>
            ) : (
              <WebBarcodeScanner
                active
                onDetected={(code) => { void processBarcode(code) }}
                onError={(message) => setError(message)}
              />
            )}
            {!onScanned && (
              <>
                <button type="button" className="btn btn-secondary barcode-manual-link" onClick={startPhotoCapture}>
                  Label photo instead
                </button>
                <button type="button" className="btn btn-secondary barcode-manual-link" onClick={() => setStep('manual')}>
                  Enter manually
                </button>
                <button type="button" className="btn btn-secondary barcode-manual-link" onClick={() => setStep('choose')}>
                  Back
                </button>
              </>
            )}
          </>
        )}

        {step === 'manual' && (
          <>
            <label className="field-label">Barcode number</label>
            <input
              inputMode="numeric"
              placeholder="e.g. 012345678905"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              autoFocus
            />
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setStep('choose')}>Back</button>
              <button type="button" className="btn btn-secondary" onClick={startPhotoCapture}>Label photo</button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => { void processBarcode(manualCode) }}
              >
                Look up product
              </button>
            </div>
          </>
        )}

        {step === 'photo' && (
          <>
            <p className="modal-hint">
              Photograph the front label in good light. OCR will read the brand, type, ABV, and vintage when visible.
            </p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="photo-file-input"
              onChange={(e) => { void handlePhotoFile(e.target.files?.[0]) }}
            />
            <button type="button" className="btn btn-primary" onClick={() => fileRef.current?.click()}>
              Take or choose photo
            </button>
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setStep('choose')}>Back</button>
            </div>
          </>
        )}

        {step === 'ocr' && (
          <div className="label-ocr-progress">
            <p>{ocrStatus || 'Reading label…'}</p>
            <div className="label-ocr-bar" aria-hidden>
              <div className="label-ocr-bar-fill" style={{ width: `${Math.max(8, ocrProgress)}%` }} />
            </div>
            <p className="modal-hint">First run downloads the OCR engine (~2 MB). This may take a few seconds.</p>
          </div>
        )}

        {step === 'lookup' && (
          <div className="barcode-loading">
            <p>Looking up product…</p>
          </div>
        )}

        {step === 'review' && form && (
          <>
            <p className="modal-hint">
              Review OCR results before adding. Generic type affects recipe matching.
              {form.ocrConfidence && (
                <> Confidence: <strong>{form.ocrConfidence}</strong>.</>
              )}
              {form.ocrRaw && (
                <> Your saved corrections improve future scans of similar labels.</>
              )}
            </p>
            {form.image && (
              <img src={form.image} alt="" className="barcode-product-image" />
            )}
            <label className="field-label">Brand name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <label className="field-label">Generic type</label>
            <input
              list="barcode-generic-suggestions"
              value={form.genericName}
              onChange={(e) => setForm({ ...form, genericName: e.target.value })}
            />
            <datalist id="barcode-generic-suggestions">
              {GENERIC_NAME_SUGGESTIONS.map((g) => <option key={g} value={g} />)}
            </datalist>
            <label className="field-label">Company</label>
            <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
            <label className="field-label">Country</label>
            <input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
            {isUsCountry(form.country) && (
              <>
                <label className="field-label">State</label>
                <input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
              </>
            )}
            <label className="field-label">ABV (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={form.abv}
              onChange={(e) => setForm({ ...form, abv: e.target.value })}
              placeholder="e.g. 40"
            />
            {isWineIngredient({ name: form.name, genericName: form.genericName, category: form.category }) && (
              <>
                <label className="field-label">Vintage (year)</label>
                <input
                  type="number"
                  min={1900}
                  max={2100}
                  value={form.vintage}
                  onChange={(e) => setForm({ ...form, vintage: e.target.value })}
                  placeholder="e.g. 2019"
                />
              </>
            )}
            <label className="field-label">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value as IngredientCategory })}
            >
              {INGREDIENT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            {form.ocrRaw && (
              <details className="label-ocr-raw">
                <summary>OCR raw text</summary>
                <pre>{form.ocrRaw}</pre>
              </details>
            )}
            <label className="barcode-toggle-row">
              <span>Add to current shelf</span>
              <button
                type="button"
                className={`toggle ${addToShelf ? 'on' : ''}`}
                onClick={() => setAddToShelf((v) => !v)}
                aria-pressed={addToShelf}
              />
            </label>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setStep(form.ocrRaw ? 'photo' : 'scan')}
              >
                {form.ocrRaw ? 'Retake photo' : 'Scan again'}
              </button>
              <button type="button" className="btn btn-primary" onClick={saveReview}>Add ingredient</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
