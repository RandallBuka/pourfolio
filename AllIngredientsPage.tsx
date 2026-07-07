import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { NavBar } from '../components/NavBar'
import { IngredientFilterPanel } from '../components/IngredientFilterPanel'
import { BarcodeScanModal } from '../components/BarcodeScanModal'
import { FilterPills, ListFilterToolbar } from '../components/ListFilterToolbar'
import { IngredientThumb, getAlphaIndex, filterByAlpha } from '../lib/ui'
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
import { isUsCountry } from '../data/usStates'
import type { IngredientCategory } from '../types'

const CATEGORIES: IngredientCategory[] = ['Spirits', 'Liqueurs', 'Mixers', 'Juices', 'Fruits', 'Garnishes', 'Other']

export function AllIngredientsPage() {
  const { allIngredients, isInBar, addCustomIngredient, activeBar } = useApp()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialQ = searchParams.get('q') ?? ''
  const initialGeneric = searchParams.get('genericName') ?? ''
  const [search, setSearch] = useState(initialQ)
  const [filters, setFilters] = useState<IngredientFilters>(() => ({
    ...EMPTY_INGREDIENT_FILTERS,
    genericName: initialGeneric ? [initialGeneric] : [],
  }))
  const [onShelfOnly, setOnShelfOnly] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [alpha, setAlpha] = useState<string | null>(null)
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
    if (q) setSearch(q)
    if (generic) {
      setFilters((f) => ({
        ...f,
        genericName: f.genericName.includes(generic) ? f.genericName : [generic],
      }))
    }
  }, [searchParams])

  const browseLabel = initialGeneric || initialQ

  const onShelfIds = useMemo(
    () => new Set(activeBar.ingredientIds),
    [activeBar.ingredientIds]
  )

  const filtered = useMemo(() => {
    let items = [...allIngredients].sort((a, b) => a.name.localeCompare(b.name))
    items = applyIngredientFilters(items, filters, { onShelfOnly }, onShelfIds)
    items = applyIngredientSearch(items, search)
    if (alpha) items = filterByAlpha(items, alpha)
    return items
  }, [allIngredients, search, filters, onShelfOnly, onShelfIds, alpha])

  const alphaLetters = useMemo(() => getAlphaIndex(filtered), [filtered])
  const activePills = formatActiveFilters(filters, onShelfOnly)
  const filterCount = getActiveFilterCount(filters, onShelfOnly)

  const removePill = (pill: { key: string; field?: string; value?: string }) => {
    if (pill.key === 'onShelf') {
      setOnShelfOnly(false)
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
        {filtered.map((ing) => (
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

      {alphaLetters.length > 0 && (
        <div className="alpha-index">
          {alphaLetters.map((l) => (
            <button key={l} type="button" onClick={() => setAlpha(alpha === l ? null : l)}>{l}</button>
          ))}
        </div>
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
