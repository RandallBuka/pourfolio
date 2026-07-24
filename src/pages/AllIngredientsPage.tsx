import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { NavBar } from '../components/NavBar'
import { IngredientFilterPanel } from '../components/IngredientFilterPanel'
import { BarcodeScanModal } from '../components/BarcodeScanModal'
import { FilterPills, ListFilterToolbar } from '../components/ListFilterToolbar'
import { AlphaIndexScrubber } from '../components/AlphaIndexScrubber'
import { IngredientThumb, ALPHA_INDEX_LETTERS, getActiveAlphaLetters, getItemAlphaLetter } from '../lib/ui'
import { useApp } from '../context/AppContext'
import {
  EMPTY_INGREDIENT_FILTERS,
  applyIngredientFilters,
  applyIngredientSearch,
  formatActiveFilters,
  getActiveFilterCount,
  type IngredientFilterField,
  type IngredientFilters,
} from '../lib/ingredientFilter'
import {
  applyIngredientBrandFilter,
  applyIngredientBrandIdFilter,
} from '../lib/ingredientBrowse'
import { isUsCountry } from '../data/usStates'
import type { IngredientCategory } from '../types'
import { useListScrollRestoration } from '../hooks/useListScrollRestoration'
import { saveScrollForRoute, scrollHistoryKey, scrollRouteKey } from '../lib/scrollRestoration'

const CATEGORIES: IngredientCategory[] = ['Spirits', 'Liqueurs', 'Mixers', 'Juices', 'Fruits', 'Garnishes', 'Other']

export function AllIngredientsPage() {
  const { allIngredients, isInBar, addCustomIngredient, activeBar } = useApp()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const initialQ = searchParams.get('q') ?? ''
  const initialGeneric = searchParams.get('genericName') ?? ''
  const initialBrand = searchParams.get('brand') ?? ''
  const initialBrandId = searchParams.get('brandId') ?? ''
  const [search, setSearch] = useState(initialQ)
  const [brandFilter, setBrandFilter] = useState(initialBrand)
  const [brandIdFilter, setBrandIdFilter] = useState(initialBrandId)
  const [filters, setFilters] = useState<IngredientFilters>(() => ({
    ...EMPTY_INGREDIENT_FILTERS,
    genericName: initialGeneric && !initialBrand && !initialBrandId ? [initialGeneric] : [],
  }))
  const [onShelfOnly, setOnShelfOnly] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [showScan, setShowScan] = useState(false)
  const [randomMsg, setRandomMsg] = useState<string | null>(null)
  const [newIng, setNewIng] = useState({
    name: '',
    genericName: '',
    company: '',
    country: '',
    state: '',
    category: 'Spirits' as IngredientCategory,
  })

  useEffect(() => {
    const q = searchParams.get('q')
    const generic = searchParams.get('genericName')
    const brand = searchParams.get('brand')
    const brandId = searchParams.get('brandId')
    if (q) setSearch(q)
    if (brand) {
      setBrandFilter(brand)
      setBrandIdFilter('')
      setFilters((f) => ({ ...f, genericName: [] }))
    } else if (brandId) {
      setBrandIdFilter(brandId)
      setBrandFilter('')
      setFilters((f) => ({ ...f, genericName: [] }))
    } else if (generic) {
      setBrandFilter('')
      setBrandIdFilter('')
      setFilters((f) => ({
        ...f,
        genericName: f.genericName.includes(generic) ? f.genericName : [generic],
      }))
    }
  }, [searchParams])

  const brandIdLabel = useMemo(
    () => (brandIdFilter ? allIngredients.find((i) => i.id === brandIdFilter)?.name : undefined),
    [allIngredients, brandIdFilter]
  )

  const browseLabel = brandFilter || brandIdLabel || initialGeneric || initialQ

  const onShelfIds = useMemo(
    () => new Set(activeBar.ingredientIds),
    [activeBar.ingredientIds]
  )

  const filtered = useMemo(() => {
    let items = [...allIngredients].sort((a, b) => a.name.localeCompare(b.name))
    items = applyIngredientFilters(items, filters, { onShelfOnly }, onShelfIds)
    if (brandIdFilter) items = applyIngredientBrandIdFilter(items, brandIdFilter)
    else if (brandFilter) items = applyIngredientBrandFilter(items, brandFilter)
    items = applyIngredientSearch(items, search)
    return items
  }, [allIngredients, search, filters, onShelfOnly, onShelfIds, brandFilter, brandIdFilter])

  useListScrollRestoration(filtered.length)

  const activeLetters = useMemo(() => getActiveAlphaLetters(filtered), [filtered])
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})

  const scrollToLetter = useCallback((letter: string, scrubbing = false) => {
    const el = sectionRefs.current[letter]
    if (!el) return
    el.scrollIntoView({ behavior: scrubbing ? 'auto' : 'smooth', block: 'start' })
  }, [])
  const activePills = useMemo(() => {
    const pills = formatActiveFilters(filters, onShelfOnly)
    if (brandFilter) {
      pills.unshift({ key: 'brand', label: `Brand: ${brandFilter}` })
    }
    if (brandIdFilter) {
      pills.unshift({
        key: 'brandId',
        label: `Bottle: ${brandIdLabel ?? brandIdFilter}`,
      })
    }
    return pills
  }, [filters, onShelfOnly, brandFilter, brandIdFilter, brandIdLabel])
  const filterCount = getActiveFilterCount(filters, onShelfOnly) + (brandFilter ? 1 : 0) + (brandIdFilter ? 1 : 0)

  const removePill = (pill: { key: string; field?: string; value?: string }) => {
    if (pill.key === 'onShelf') {
      setOnShelfOnly(false)
      return
    }
    if (pill.key === 'brand') {
      setBrandFilter('')
      return
    }
    if (pill.key === 'brandId') {
      setBrandIdFilter('')
      return
    }
    if (pill.field && pill.value) {
      const field = pill.field as IngredientFilterField
      setFilters((f) => ({
        ...f,
        [field]: f[field].filter((v) => v !== pill.value),
      }))
    }
  }

  const pickRandomIngredient = () => {
    if (filtered.length === 0) {
      setRandomMsg('No ingredients match your search or filters. Try clearing filters or broadening your search.')
      return
    }
    setRandomMsg(null)
    const ing = filtered[Math.floor(Math.random() * filtered.length)]
    const routeKey = scrollRouteKey(location.pathname, location.search)
    saveScrollForRoute(routeKey)
    saveScrollForRoute(scrollHistoryKey(location))
    navigate(`/ingredients/${ing.id}`)
  }

  return (
    <div className="page">
      <NavBar
        title={browseLabel ? `Stock: ${browseLabel}` : 'Stock'}
        actions={
          <>
            <button type="button" className="nav-btn" onClick={() => setShowScan(true)} title="Scan barcode" aria-label="Scan barcode">▦</button>
            <button type="button" className="nav-btn" onClick={() => setShowAdd(true)} title="Add ingredient" aria-label="Add ingredient">+</button>
          </>
        }
      />

      <ListFilterToolbar
        search={search}
        onSearchChange={(value) => { setSearch(value); setRandomMsg(null) }}
        placeholder="Search name, type, company, state..."
        filterCount={filterCount}
        onFilterClick={() => setShowFilters(true)}
        trailing={
          <button
            type="button"
            className="dice-btn"
            title="Random ingredient"
            aria-label="Random ingredient"
            onClick={pickRandomIngredient}
          >
            🎲
          </button>
        }
      >
        <FilterPills pills={activePills} onRemove={removePill} />
      </ListFilterToolbar>

      {randomMsg && <p className="shopping-flash">{randomMsg}</p>}

      <div className="section-header">{filtered.length} ingredients</div>

      <div className="list-container">
        {ALPHA_INDEX_LETTERS.map((letter) => {
          const items = filtered.filter((ing) => getItemAlphaLetter(ing.name) === letter)
          if (items.length === 0) return null
          return (
            <div key={letter}>
              <div
                ref={(el) => { sectionRefs.current[letter] = el }}
                className="section-header alpha-section-marker"
              >
                {letter}
              </div>
              {items.map((ing) => (
                <Link key={ing.id} to={`/ingredients/${ing.id}`} className="list-item">
                  <IngredientThumb ingredient={ing} />
                  <div className="item-info">
                    <div className="item-name">{ing.name}</div>
                    <div className="item-subtitle">{ing.company ?? ing.genericName}</div>
                    <div className="item-meta">
                      {ing.genericName}
                      {ing.country && ` · ${ing.country}`}
                      {isUsCountry(ing.country) && ing.state && `, ${ing.state}`}
                    </div>
                  </div>
                  {isInBar(ing.id) && <span className="item-badge">On shelf</span>}
                </Link>
              ))}
            </div>
          )
        })}
      </div>

      {activeLetters.size > 0 && (
        <AlphaIndexScrubber
          activeLetters={activeLetters}
          onLetter={scrollToLetter}
        />
      )}

      {showFilters && (
        <IngredientFilterPanel
          items={allIngredients}
          filters={filters}
          onChange={setFilters}
          onClose={() => setShowFilters(false)}
          onShelfOnly={onShelfOnly}
          onShelfOnlyChange={setOnShelfOnly}
          onShelfIds={onShelfIds}
          resultCount={filtered.length}
        />
      )}

      {showScan && <BarcodeScanModal onClose={() => setShowScan(false)} />}

      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal modal--wide" onClick={(e) => e.stopPropagation()}>
            <h3>Add custom ingredient</h3>
            <label className="field-label">Brand name</label>
            <input placeholder="Brand name" value={newIng.name} onChange={(e) => setNewIng({ ...newIng, name: e.target.value })} />
            <label className="field-label">Generic type</label>
            <input placeholder="e.g. Bourbon" value={newIng.genericName} onChange={(e) => setNewIng({ ...newIng, genericName: e.target.value })} />
            <label className="field-label">Company</label>
            <input placeholder="Company (optional)" value={newIng.company} onChange={(e) => setNewIng({ ...newIng, company: e.target.value })} />
            <label className="field-label">Country</label>
            <input placeholder="e.g. USA" value={newIng.country} onChange={(e) => setNewIng({ ...newIng, country: e.target.value, state: isUsCountry(e.target.value) ? newIng.state : '' })} />
            {isUsCountry(newIng.country) && (
              <>
                <label className="field-label">State</label>
                <input placeholder="e.g. Kentucky" value={newIng.state} onChange={(e) => setNewIng({ ...newIng, state: e.target.value })} />
              </>
            )}
            <label className="field-label">Category</label>
            <select
              value={newIng.category}
              onChange={(e) => setNewIng({ ...newIng, category: e.target.value as IngredientCategory })}
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  if (newIng.name && newIng.genericName) {
                    addCustomIngredient({
                      name: newIng.name,
                      genericName: newIng.genericName,
                      company: newIng.company || undefined,
                      country: newIng.country || undefined,
                      state: isUsCountry(newIng.country) ? newIng.state || undefined : undefined,
                      category: newIng.category,
                    })
                    setShowAdd(false)
                    setNewIng({ name: '', genericName: '', company: '', country: '', state: '', category: 'Spirits' })
                  }
                }}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
