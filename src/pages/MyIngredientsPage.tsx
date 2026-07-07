import { useMemo, useState } from 'react'

import { Link, useNavigate } from 'react-router-dom'

import { NavBar } from '../components/NavBar'

import { PageSubtitle } from '../components/PageSubtitle'

import { IngredientFilterPanel } from '../components/IngredientFilterPanel'

import { BarcodeScanModal } from '../components/BarcodeScanModal'

import { FilterPills, ListFilterToolbar } from '../components/ListFilterToolbar'

import { IngredientThumb } from '../lib/ui'

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

  EMPTY_STOCK_FILTERS,

  applyStockFilters,

  formatStockFilterPills,

  getStockFilterCount,

  type StockFilters,

} from '../lib/stockFilter'

import {

  STOCK_SORT_LABELS,

  sortBarIngredients,

  type StockSortOption,

} from '../lib/ingredientSort'

import { isUsCountry } from '../data/usStates'



export function MyIngredientsPage() {

  const { activeBar, ingredientMap, getBarItemMeta } = useApp()

  const navigate = useNavigate()

  const [search, setSearch] = useState('')

  const [filters, setFilters] = useState<IngredientFilters>({ ...EMPTY_INGREDIENT_FILTERS })

  const [stockFilters, setStockFilters] = useState<StockFilters>({ ...EMPTY_STOCK_FILTERS })

  const [sort, setSort] = useState<StockSortOption>('name')

  const [showFilters, setShowFilters] = useState(false)

  const [showScan, setShowScan] = useState(false)

  const [randomMsg, setRandomMsg] = useState<string | null>(null)



  const barIngredients = useMemo(() => {

    return activeBar.ingredientIds

      .map((id) => ingredientMap.get(id))

      .filter((i): i is NonNullable<typeof i> => !!i)

  }, [activeBar.ingredientIds, ingredientMap])



  const filtered = useMemo(() => {

    let items = barIngredients

    items = applyIngredientFilters(items, filters)

    items = applyStockFilters(items, stockFilters, getBarItemMeta)

    items = applyIngredientSearch(items, search)

    items = sortBarIngredients(items, sort, getBarItemMeta)

    return items

  }, [barIngredients, search, filters, stockFilters, sort, getBarItemMeta])



  const activePills = useMemo(() => {

    return [

      ...formatActiveFilters(filters),

      ...formatStockFilterPills(stockFilters),

    ]

  }, [filters, stockFilters])



  const filterCount = getActiveFilterCount(filters) + getStockFilterCount(stockFilters)



  const removePill = (pill: { key: string; field?: string; value?: string; kind?: string }) => {

    if (pill.kind === 'stockLevel' && pill.value) {

      setStockFilters((f) => ({

        ...f,

        stockLevel: f.stockLevel.filter((v) => v !== pill.value),

      }))

      return

    }

    if (pill.kind === 'opened' && pill.value) {

      setStockFilters((f) => ({

        ...f,

        opened: f.opened.filter((v) => v !== pill.value),

      }))

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

      setRandomMsg('No ingredients match your search or filters.')

      return

    }

    setRandomMsg(null)

    const ing = filtered[Math.floor(Math.random() * filtered.length)]

    navigate(`/ingredients/${ing.id}`)

  }



  return (

    <div className="page">

      <NavBar

        title="What's On My Bar"

        onBack={() => navigate('/')}

        actions={

          <>

            <button type="button" className="nav-btn" onClick={() => setShowScan(true)} title="Scan barcode" aria-label="Scan barcode">▦</button>

            <Link to="/ingredients" className="nav-btn" title="Add to shelf" aria-label="Add to shelf">+</Link>

          </>

        }

      />



      <PageSubtitle title={activeBar.name} />



      <ListFilterToolbar

        search={search}

        onSearchChange={(value) => { setSearch(value); setRandomMsg(null) }}

        placeholder="Search your stock..."

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



      <div className="section-header section-header--split">

        <span>{activeBar.name} — {filtered.length} items</span>

        <label className="stock-sort">

          <span className="stock-sort-label">Sort</span>

          <select value={sort} onChange={(e) => setSort(e.target.value as StockSortOption)}>

            {(Object.keys(STOCK_SORT_LABELS) as StockSortOption[]).map((key) => (

              <option key={key} value={key}>{STOCK_SORT_LABELS[key]}</option>

            ))}

          </select>

        </label>

      </div>



      {filtered.length === 0 ? (

        <div className="empty-state">

          <div className="icon">📦</div>

          <h3>No ingredients match</h3>

          <Link to="/ingredients" className="btn btn-primary" style={{ marginTop: 16, display: 'inline-block' }}>

            Add Ingredients

          </Link>

        </div>

      ) : (

        filtered.map((ing) => (

          <Link key={ing.id} to={`/ingredients/${ing.id}`} className="list-item">

            <IngredientThumb ingredient={ing} />

            <div className="item-info">

              <div className="item-name">{ing.name}</div>

              <div className="item-subtitle">{ing.company ?? ing.genericName}</div>

              {isUsCountry(ing.country) && ing.state && (

                <div className="item-meta">{ing.state}</div>

              )}

              {(() => {

                const meta = getBarItemMeta(ing.id)

                if (!meta.stockLevel && !meta.openedOn) return null

                return (

                  <div className="item-meta">

                    {meta.stockLevel && `${meta.stockLevel.charAt(0).toUpperCase()}${meta.stockLevel.slice(1)} bottle`}

                    {meta.openedOn && ` · opened ${meta.openedOn.slice(0, 10)}`}

                  </div>

                )

              })()}

            </div>

          </Link>

        ))

      )}



      {showScan && <BarcodeScanModal onClose={() => setShowScan(false)} />}



      {showFilters && (

        <IngredientFilterPanel

          items={barIngredients}

          filters={filters}

          onChange={setFilters}

          onClose={() => setShowFilters(false)}

          resultCount={filtered.length}

          stockFilters={stockFilters}

          onStockFiltersChange={setStockFilters}

          getBarItemMeta={getBarItemMeta}

        />

      )}

    </div>

  )

}


