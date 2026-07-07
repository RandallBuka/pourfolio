import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { SEED_DRINKS, getDrinkIngredientSummary } from '../data/drinks'
import { canMakeDrink, getMissingIngredients } from '../lib/matching'
import { buildIngredientCatalog, getSeedIngredient } from '../lib/ingredientEdit'
import { SEED_INGREDIENTS } from '../data/ingredients'
import { createDefaultState, generateId, loadState, saveState } from '../lib/storage'
import { parseBackup } from '../lib/backup'
import {
  addIdsToShoppingList,
  getMissingIngredientIdsForDrink,
  getMissingIngredientIdsForDrinks,
} from '../lib/shoppingList'
import { buildSharedShelf, encodeSharedShelf, getShareUrl } from '../lib/shelfShare'
import {
  loadSyncConfig,
  mergeSyncState,
  pullSyncState,
  pushSyncState,
  saveSyncConfig,
  setupSyncPassphrase,
  isSupabaseConfigured,
  type SyncConfig,
} from '../lib/cloudSync'
import {
  initSupabaseAuth,
  onAuthStateChange,
  signInWithGoogle as signInWithGoogleAuth,
  signOutGoogle as signOutGoogleAuth,
} from '../lib/supabaseAuth'
import type { User } from '@supabase/supabase-js'
import { getLowStockIngredients } from '../lib/lowStock'
import { pickRandomMakeableDrink } from '../lib/randomDrink'
import {
  applyDeleteDrink,
  applyDeleteIngredient,
  applyRestoreAllTrash,
  applyRestoreAllTrashDrinks,
  applyRestoreAllTrashIngredients,
  applyRestoreDrink,
  applyRestoreIngredient,
  isTrashDrinkCustom,
  isTrashIngredientCustom,
  trashDrinkLabel,
  trashIngredientLabel,
} from '../lib/catalogTrash'
import {
  clearUndoSnapshot,
  loadUndoSnapshot,
  saveUndoSnapshot,
  type UndoSnapshot,
} from '../lib/dataSnapshot'
import type {
  AppState,
  BarItemMeta,
  BarProfile,
  Drink,
  Ingredient,
  IngredientMatchContext,
  IngredientOverride,
  RecipeIngredient,
  DeletedCatalogItem,
} from '../types'

interface AppContextValue {
  state: AppState
  activeBar: BarProfile
  allIngredients: Ingredient[]
  allDrinks: Drink[]
  ingredientMap: Map<string, Ingredient>
  matchContext: IngredientMatchContext
  makeableDrinks: Drink[]
  makeableCount: number
  favorites: Drink[]
  toggleFavorite: (drinkId: string) => void
  setActiveBar: (barId: string) => void
  addBar: (name: string) => void
  renameBar: (barId: string, name: string) => void
  setBarImage: (barId: string, image?: string) => void
  deleteBar: (barId: string) => void
  duplicateBar: (barId: string, name?: string) => void
  addToBar: (ingredientId: string) => void
  removeFromBar: (ingredientId: string) => void
  isInBar: (ingredientId: string) => boolean
  addCustomIngredient: (ingredient: Omit<Ingredient, 'id' | 'isCustom'>) => string
  updateIngredient: (id: string, patch: IngredientOverride) => void
  resetIngredient: (id: string) => void
  isIngredientEdited: (id: string) => boolean
  getOriginalIngredient: (id: string) => Ingredient | undefined
  cloneDrink: (drink: Drink) => Drink
  addCustomDrink: (drink: Omit<Drink, 'id' | 'isCustom'>) => void
  updateCustomDrink: (id: string, patch: Partial<Omit<Drink, 'id'>>) => void
  updateCustomDrinkIngredient: (drinkId: string, index: number, patch: Partial<RecipeIngredient>) => void
  deleteDrink: (id: string) => void
  deleteIngredient: (id: string) => void
  restoreDrink: (id: string) => void
  restoreIngredient: (id: string) => void
  restoreAllDeleted: () => void
  restoreAllDeletedIngredients: () => void
  restoreAllDeletedDrinks: () => void
  deletedCatalogItems: DeletedCatalogItem[]
  deletedIngredients: DeletedCatalogItem[]
  deletedDrinks: DeletedCatalogItem[]
  getDrinkNotes: (id: string) => string
  setIngredientNotes: (id: string, notes: string) => void
  setDrinkNotes: (id: string, notes: string) => void
  /** @deprecated Use deleteDrink */
  deleteCustomDrink: (id: string) => void
  deleteAllIngredients: () => void
  deleteAllRecipes: () => void
  restoreUndoSnapshot: () => boolean
  discardUndoSnapshot: () => void
  resetAllData: () => void
  undoSnapshot: UndoSnapshot | null
  toggleShopping: (ingredientId: string) => void
  isInShoppingList: (ingredientId: string) => boolean
  addMissingToShopping: (drink: Drink) => number
  addAllMissingToShopping: (drinks: Drink[]) => number
  toggleShoppingChecked: (ingredientId: string) => void
  isShoppingChecked: (ingredientId: string) => boolean
  clearShoppingChecked: () => void
  clearShoppingList: () => void
  getBarItemMeta: (ingredientId: string) => BarItemMeta
  setBarItemMeta: (ingredientId: string, patch: Partial<BarItemMeta>) => void
  importBackup: (json: string) => void
  getShareLink: () => string
  syncConfig: import('../lib/cloudSync').SyncConfig
  saveSyncConfig: (config: import('../lib/cloudSync').SyncConfig) => void
  authUser: User | null
  authReady: boolean
  signInWithGoogle: () => Promise<void>
  signOutGoogle: () => Promise<void>
  pushCloudSync: (passphrase?: string) => Promise<void>
  pullCloudSync: (passphrase?: string) => Promise<'updated' | 'unchanged' | 'empty'>
  getDrinkSummary: (drink: Drink) => string
  getMissingForDrink: (drink: Drink) => RecipeIngredient[]
  canMake: (drink: Drink) => boolean
  getRandomMakeableDrink: () => Drink | undefined
  lowStockIngredients: Ingredient[]
  addLowStockToShopping: () => number
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => loadState())
  const [syncConfig, setSyncConfig] = useState<SyncConfig>(() => loadSyncConfig())
  const [undoSnapshot, setUndoSnapshot] = useState<UndoSnapshot | null>(() => loadUndoSnapshot())
  const [authUser, setAuthUser] = useState<User | null>(null)
  const [authReady, setAuthReady] = useState(() => !isSupabaseConfigured())

  useEffect(() => {
    if (!isSupabaseConfigured()) return

    let unsubscribe: (() => void) | undefined

    void initSupabaseAuth()
      .then((session) => {
        setAuthUser(session?.user ?? null)
        setAuthReady(true)
      })
      .catch(() => setAuthReady(true))

    unsubscribe = onAuthStateChange((user) => setAuthUser(user))

    return () => unsubscribe?.()
  }, [])

  useEffect(() => {
    saveState(state)
  }, [state])

  useEffect(() => {
    saveSyncConfig(syncConfig)
  }, [syncConfig])

  useEffect(() => {
    if (!syncConfig.enabled) return
    if (isSupabaseConfigured()) {
      if (!authUser?.id) return
    } else if (!syncConfig.passphrase || !syncConfig.roomId) {
      return
    }

    const runPull = async () => {
      try {
        const remote = isSupabaseConfigured() && authUser
          ? await pullSyncState(syncConfig, { mode: 'auth', userId: authUser.id })
          : await pullSyncState(syncConfig, { mode: 'passphrase', passphrase: syncConfig.passphrase! })
        if (!remote) return
        setState((local) => {
          const merged = mergeSyncState(local, remote)
          return merged === local ? local : merged
        })
        setSyncConfig((c) => ({
          ...c,
          lastSyncedAt: new Date().toISOString(),
          lastSyncError: undefined,
        }))
      } catch (err) {
        setSyncConfig((c) => ({
          ...c,
          lastSyncError: err instanceof Error ? err.message : 'Sync failed',
        }))
      }
    }

    void runPull()
    const onVisible = () => {
      if (document.visibilityState === 'visible') void runPull()
    }
    document.addEventListener('visibilitychange', onVisible)
    const interval = window.setInterval(() => { void runPull() }, 5 * 60 * 1000)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.clearInterval(interval)
    }
  }, [
    syncConfig.enabled,
    syncConfig.passphrase,
    syncConfig.roomId,
    syncConfig.serverUrl,
    authUser?.id,
  ])

  useEffect(() => {
    if (!syncConfig.enabled) return
    if (isSupabaseConfigured()) {
      if (!authUser?.id) return
    } else if (!syncConfig.passphrase || !syncConfig.roomId) {
      return
    }

    const timer = window.setTimeout(() => {
      const credentials = isSupabaseConfigured() && authUser
        ? { mode: 'auth' as const, userId: authUser.id }
        : { mode: 'passphrase' as const, passphrase: syncConfig.passphrase! }

      void pushSyncState(syncConfig, state, credentials)
        .then((next) => setSyncConfig(next))
        .catch((err) => {
          setSyncConfig((c) => ({
            ...c,
            lastSyncError: err instanceof Error ? err.message : 'Auto-sync upload failed',
          }))
        })
    }, 4000)
    return () => window.clearTimeout(timer)
  }, [state, syncConfig.enabled, syncConfig.passphrase, syncConfig.roomId, syncConfig.serverUrl, authUser?.id])

  const touchState = (next: AppState): AppState => ({
    ...next,
    syncUpdatedAt: Date.now(),
  })

  const allIngredients = useMemo(
    () => buildIngredientCatalog(
      state.customIngredients,
      state.ingredientOverrides ?? {},
      state.hiddenIngredients
    ),
    [state.customIngredients, state.ingredientOverrides, state.hiddenIngredients]
  )

  const allDrinks = useMemo(
    () => [...SEED_DRINKS, ...state.customDrinks].filter(
      (d) => !state.hiddenDrinks.includes(d.id)
    ),
    [state.customDrinks, state.hiddenDrinks]
  )

  const ingredientMap = useMemo(
    () => new Map(allIngredients.map((i) => [i.id, i])),
    [allIngredients]
  )

  const activeBar = useMemo(
    () => state.bars.find((b) => b.id === state.activeBarId) ?? state.bars[0],
    [state.bars, state.activeBarId]
  )

  const matchContext: IngredientMatchContext = useMemo(
    () => ({
      barIngredientIds: new Set(activeBar.ingredientIds),
      allIngredients: ingredientMap,
    }),
    [activeBar.ingredientIds, ingredientMap]
  )

  const makeableDrinks = useMemo(() => {
    const seen = new Set<string>()
    return allDrinks.filter((d) => {
      if (!canMakeDrink(d.ingredients, matchContext)) return false
      if (seen.has(d.id)) return false
      seen.add(d.id)
      return true
    })
  }, [allDrinks, matchContext])

  const favorites = useMemo(
    () => allDrinks.filter((d) => state.favorites.includes(d.id)),
    [allDrinks, state.favorites]
  )

  const deletedCatalogItems = useMemo((): DeletedCatalogItem[] => {
    const ingredients = (state.trash?.ingredients ?? []).map((entry) => ({
      id: entry.id,
      name: trashIngredientLabel(entry),
      deletedAt: entry.deletedAt,
      kind: 'ingredient' as const,
      isCustom: isTrashIngredientCustom(entry),
    }))
    const drinks = (state.trash?.drinks ?? []).map((entry) => ({
      id: entry.id,
      name: trashDrinkLabel(entry),
      deletedAt: entry.deletedAt,
      kind: 'drink' as const,
      isCustom: isTrashDrinkCustom(entry),
    }))
    return [...ingredients, ...drinks].sort((a, b) => b.deletedAt - a.deletedAt)
  }, [state.trash])

  const deletedIngredients = useMemo(
    () => deletedCatalogItems.filter((item) => item.kind === 'ingredient'),
    [deletedCatalogItems]
  )

  const deletedDrinks = useMemo(
    () => deletedCatalogItems.filter((item) => item.kind === 'drink'),
    [deletedCatalogItems]
  )

  const getBarItemMetaFn = (ingredientId: string): BarItemMeta => {
    return state.barItemMeta?.[activeBar.id]?.[ingredientId] ?? {}
  }

  const lowStockIngredients = useMemo(
    () => getLowStockIngredients(activeBar.ingredientIds, ingredientMap, getBarItemMetaFn),
    [activeBar.ingredientIds, ingredientMap, state.barItemMeta, state.activeBarId]
  )

  const update = (fn: (s: AppState) => AppState) =>
    setState((s) => {
      const next = fn(s)
      if (next === s) return s
      return touchState(next)
    })

  const value: AppContextValue = {
    state,
    activeBar,
    allIngredients,
    allDrinks,
    ingredientMap,
    matchContext,
    makeableDrinks,
    makeableCount: makeableDrinks.length,
    favorites,
    toggleFavorite: (drinkId) =>
      update((s) => ({
        ...s,
        favorites: s.favorites.includes(drinkId)
          ? s.favorites.filter((id) => id !== drinkId)
          : [...s.favorites, drinkId],
      })),
    setActiveBar: (barId) => update((s) => ({ ...s, activeBarId: barId })),
    addBar: (name) => {
      const bar: BarProfile = { id: generateId(), name, ingredientIds: [] }
      update((s) => ({ ...s, bars: [...s.bars, bar], activeBarId: bar.id }))
    },
    renameBar: (barId, name) =>
      update((s) => ({
        ...s,
        bars: s.bars.map((b) => (b.id === barId ? { ...b, name } : b)),
      })),
    setBarImage: (barId, image) =>
      update((s) => ({
        ...s,
        bars: s.bars.map((b) => {
          if (b.id !== barId) return b
          if (!image) {
            const { image: _removed, ...rest } = b
            return rest
          }
          return { ...b, image }
        }),
      })),
    deleteBar: (barId) =>
      update((s) => {
        if (s.bars.length <= 1) {
          const only = s.bars[0]
          const resetBar = { ...only, id: only.id, name: only.name, ingredientIds: [] }
          const barMeta = { ...(s.barItemMeta ?? {}) }
          delete barMeta[barId]
          return {
            ...s,
            bars: [resetBar],
            activeBarId: resetBar.id,
            barItemMeta: barMeta,
          }
        }
        const bars = s.bars.filter((b) => b.id !== barId)
        const activeBarId = s.activeBarId === barId ? bars[0].id : s.activeBarId
        const barMeta = { ...(s.barItemMeta ?? {}) }
        delete barMeta[barId]
        return {
          ...s,
          bars,
          activeBarId,
          barItemMeta: barMeta,
        }
      }),
    duplicateBar: (barId, name) =>
      update((s) => {
        const source = s.bars.find((b) => b.id === barId)
        if (!source) return s
        const newBar: BarProfile = {
          id: generateId(),
          name: name?.trim() || `${source.name} (copy)`,
          ingredientIds: [...source.ingredientIds],
        }
        const barMeta = { ...(s.barItemMeta ?? {}) }
        if (barMeta[barId]) {
          barMeta[newBar.id] = JSON.parse(JSON.stringify(barMeta[barId])) as Record<string, import('../types').BarItemMeta>
        }
        return {
          ...s,
          bars: [...s.bars, newBar],
          activeBarId: newBar.id,
          barItemMeta: barMeta,
        }
      }),
    addToBar: (ingredientId) =>
      update((s) => ({
        ...s,
        bars: s.bars.map((b) =>
          b.id === s.activeBarId && !b.ingredientIds.includes(ingredientId)
            ? { ...b, ingredientIds: [...b.ingredientIds, ingredientId] }
            : b
        ),
      })),
    removeFromBar: (ingredientId) =>
      update((s) => ({
        ...s,
        bars: s.bars.map((b) =>
          b.id === s.activeBarId
            ? { ...b, ingredientIds: b.ingredientIds.filter((id) => id !== ingredientId) }
            : b
        ),
      })),
    isInBar: (ingredientId) => activeBar.ingredientIds.includes(ingredientId),
    addCustomIngredient: (ingredient) => {
      const item: Ingredient = { ...ingredient, id: generateId(), isCustom: true }
      update((s) => ({ ...s, customIngredients: [...s.customIngredients, item] }))
      return item.id
    },
    updateIngredient: (id, patch) => {
      update((s) => {
        const custom = s.customIngredients.find((c) => c.id === id)
        if (custom?.isCustom) {
          return {
            ...s,
            customIngredients: s.customIngredients.map((c) =>
              c.id === id ? { ...c, ...patch, id: c.id, isCustom: true } : c
            ),
          }
        }
        const seed = getSeedIngredient(id)
        if (!seed) return s
        const prev = s.ingredientOverrides[id] ?? {}
        const merged = { ...prev, ...patch }
        return {
          ...s,
          ingredientOverrides: { ...s.ingredientOverrides, [id]: merged },
        }
      })
    },
    resetIngredient: (id) => {
      update((s) => {
        if (s.customIngredients.some((c) => c.id === id)) return s
        const next = { ...s.ingredientOverrides }
        delete next[id]
        return { ...s, ingredientOverrides: next }
      })
    },
    isIngredientEdited: (id) => !!state.ingredientOverrides[id],
    getOriginalIngredient: (id) => getSeedIngredient(id),
    cloneDrink: (drink) => {
      const clone: Drink = {
        ...drink,
        id: generateId(),
        name: `${drink.name} (My Version)`,
        isCustom: true,
        clonedFrom: drink.id,
        ingredients: drink.ingredients.map((i) => ({ ...i })),
      }
      update((s) => ({ ...s, customDrinks: [...s.customDrinks, clone] }))
      return clone
    },
    addCustomDrink: (drink) => {
      const item: Drink = { ...drink, id: generateId(), isCustom: true }
      update((s) => ({ ...s, customDrinks: [...s.customDrinks, item] }))
    },
    updateCustomDrink: (id, patch) => {
      update((s) => ({
        ...s,
        customDrinks: s.customDrinks.map((d) =>
          d.id === id ? { ...d, ...patch, id: d.id, isCustom: true } : d
        ),
      }))
    },
    updateCustomDrinkIngredient: (drinkId, index, patch) => {
      update((s) => ({
        ...s,
        customDrinks: s.customDrinks.map((d) => {
          if (d.id !== drinkId) return d
          const ingredients = d.ingredients.map((ing, i) =>
            i === index ? { ...ing, ...patch } : ing
          )
          return { ...d, ingredients }
        }),
      }))
    },
    deleteDrink: (id) => {
      update((s) => applyDeleteDrink(s, id))
    },
    deleteIngredient: (id) => {
      update((s) => applyDeleteIngredient(s, id))
    },
    restoreDrink: (id) => {
      update((s) => applyRestoreDrink(s, id))
    },
    restoreIngredient: (id) => {
      update((s) => applyRestoreIngredient(s, id))
    },
    restoreAllDeleted: () => {
      update((s) => applyRestoreAllTrash(s))
    },
    restoreAllDeletedIngredients: () => {
      update((s) => applyRestoreAllTrashIngredients(s))
    },
    restoreAllDeletedDrinks: () => {
      update((s) => applyRestoreAllTrashDrinks(s))
    },
    deletedCatalogItems,
    deletedIngredients,
    deletedDrinks,
    getDrinkNotes: (id) => {
      const custom = state.customDrinks.find((d) => d.id === id)
      if (custom) return custom.notes ?? ''
      return state.drinkOverrides?.[id]?.notes ?? ''
    },
    setIngredientNotes: (id, notes) => {
      const trimmed = notes.trim()
      update((s) => {
        const custom = s.customIngredients.find((c) => c.id === id)
        if (custom?.isCustom) {
          return {
            ...s,
            customIngredients: s.customIngredients.map((c) =>
              c.id === id ? { ...c, notes: trimmed || undefined, isCustom: true as const } : c
            ),
          }
        }
        if (!getSeedIngredient(id)) return s
        const prev = s.ingredientOverrides[id] ?? {}
        return {
          ...s,
          ingredientOverrides: {
            ...s.ingredientOverrides,
            [id]: { ...prev, notes: trimmed || undefined },
          },
        }
      })
    },
    setDrinkNotes: (id, notes) => {
      const trimmed = notes.trim()
      const custom = state.customDrinks.find((d) => d.id === id)
      if (custom?.isCustom) {
        update((s) => ({
          ...s,
          customDrinks: s.customDrinks.map((d) =>
            d.id === id ? { ...d, notes: trimmed || undefined } : d
          ),
        }))
        return
      }
      update((s) => {
        const drinkOverrides = { ...(s.drinkOverrides ?? {}) }
        if (trimmed) drinkOverrides[id] = { ...drinkOverrides[id], notes: trimmed }
        else {
          const prev = drinkOverrides[id]
          if (!prev?.notes) return s
          const { notes: _removed, ...rest } = prev
          if (Object.keys(rest).length === 0) delete drinkOverrides[id]
          else drinkOverrides[id] = rest
        }
        return { ...s, drinkOverrides }
      })
    },
    deleteCustomDrink: (id) => {
      update((s) => applyDeleteDrink(s, id))
    },
    deleteAllIngredients: () => {
      setState((current) => {
        saveUndoSnapshot('delete-all-ingredients', current)
        setUndoSnapshot(loadUndoSnapshot())
        let next = current
        for (const ing of current.customIngredients) {
          next = applyDeleteIngredient(next, ing.id)
        }
        return touchState({
          ...next,
          ingredientOverrides: {},
          bars: next.bars.map((b) => ({ ...b, ingredientIds: [] })),
          barItemMeta: {},
          shoppingList: [],
          shoppingChecked: [],
        })
      })
    },
    deleteAllRecipes: () => {
      setState((current) => {
        saveUndoSnapshot('delete-all-recipes', current)
        setUndoSnapshot(loadUndoSnapshot())
        let next = current
        for (const drink of current.customDrinks) {
          next = applyDeleteDrink(next, drink.id)
        }
        return touchState(next)
      })
    },
    restoreUndoSnapshot: () => {
      const snap = loadUndoSnapshot()
      if (!snap) return false
      setState(touchState(snap.state))
      clearUndoSnapshot()
      setUndoSnapshot(null)
      return true
    },
    discardUndoSnapshot: () => {
      clearUndoSnapshot()
      setUndoSnapshot(null)
    },
    resetAllData: () => {
      setState((current) => {
        saveUndoSnapshot('reset-all', current)
        setUndoSnapshot(loadUndoSnapshot())
        return touchState(createDefaultState())
      })
    },
    undoSnapshot,
    toggleShopping: (ingredientId) =>
      update((s) => {
        const removing = s.shoppingList.includes(ingredientId)
        return {
          ...s,
          shoppingList: removing
            ? s.shoppingList.filter((id) => id !== ingredientId)
            : [...s.shoppingList, ingredientId],
          shoppingChecked: removing
            ? (s.shoppingChecked ?? []).filter((id) => id !== ingredientId)
            : (s.shoppingChecked ?? []),
        }
      }),
    isInShoppingList: (ingredientId) => state.shoppingList.includes(ingredientId),
    addMissingToShopping: (drink) => {
      const ids = getMissingIngredientIdsForDrink(drink, matchContext, ingredientMap)
      const before = new Set(state.shoppingList)
      const next = addIdsToShoppingList(state.shoppingList, ids)
      const added = next.filter((id) => !before.has(id)).length
      if (next.length !== state.shoppingList.length) {
        update((s) => ({ ...s, shoppingList: addIdsToShoppingList(s.shoppingList, ids) }))
      }
      return added
    },
    addAllMissingToShopping: (drinks) => {
      const ids = getMissingIngredientIdsForDrinks(drinks, matchContext, ingredientMap)
      const before = new Set(state.shoppingList)
      const next = addIdsToShoppingList(state.shoppingList, ids)
      const added = next.filter((id) => !before.has(id)).length
      if (next.length !== state.shoppingList.length) {
        update((s) => ({ ...s, shoppingList: addIdsToShoppingList(s.shoppingList, ids) }))
      }
      return added
    },
    toggleShoppingChecked: (ingredientId) =>
      update((s) => {
        const checked = s.shoppingChecked ?? []
        return {
          ...s,
          shoppingChecked: checked.includes(ingredientId)
            ? checked.filter((id) => id !== ingredientId)
            : [...checked, ingredientId],
        }
      }),
    isShoppingChecked: (ingredientId) => (state.shoppingChecked ?? []).includes(ingredientId),
    clearShoppingChecked: () => update((s) => ({ ...s, shoppingChecked: [] })),
    clearShoppingList: () => update((s) => ({ ...s, shoppingList: [], shoppingChecked: [] })),
    getBarItemMeta: (ingredientId) => {
      return state.barItemMeta?.[activeBar.id]?.[ingredientId] ?? {}
    },
    setBarItemMeta: (ingredientId, patch) =>
      update((s) => {
        const barMeta = { ...(s.barItemMeta ?? {}) }
        const shelf = { ...(barMeta[s.activeBarId] ?? {}) }
        shelf[ingredientId] = { ...shelf[ingredientId], ...patch }
        barMeta[s.activeBarId] = shelf
        return { ...s, barItemMeta: barMeta }
      }),
    importBackup: (json) => {
      const imported = parseBackup(json)
      setState(touchState(imported))
    },
    getShareLink: () => {
      const data = buildSharedShelf(activeBar, ingredientMap)
      return getShareUrl(encodeSharedShelf(data))
    },
    syncConfig,
    saveSyncConfig: (config) => setSyncConfig(config),
    authUser,
    authReady,
    signInWithGoogle: async () => {
      await signInWithGoogleAuth()
    },
    signOutGoogle: async () => {
      await signOutGoogleAuth()
      setSyncConfig((c) => ({ ...c, lastSyncError: undefined }))
    },
    pushCloudSync: async (passphrase) => {
      let config = syncConfig
      const credentials = isSupabaseConfigured() && authUser
        ? { mode: 'auth' as const, userId: authUser.id }
        : (() => {
            if (!passphrase?.trim()) throw new Error('Enter your sync passphrase first')
            return { mode: 'passphrase' as const, passphrase }
          })()

      if (credentials.mode === 'passphrase' && !config.roomId) {
        config = await setupSyncPassphrase(config, credentials.passphrase)
        setSyncConfig(config)
      }

      const stamped = touchState(state)
      setState(stamped)
      const next = await pushSyncState(config, stamped, credentials)
      setSyncConfig(next)
    },
    pullCloudSync: async (passphrase) => {
      let config = syncConfig
      const credentials = isSupabaseConfigured() && authUser
        ? { mode: 'auth' as const, userId: authUser.id }
        : (() => {
            if (!passphrase?.trim()) throw new Error('Enter your sync passphrase first')
            return { mode: 'passphrase' as const, passphrase }
          })()

      if (credentials.mode === 'passphrase' && !config.roomId) {
        config = await setupSyncPassphrase(config, credentials.passphrase)
        setSyncConfig(config)
      }

      const remote = await pullSyncState(config, credentials)
      if (!remote) {
        setSyncConfig((c) => ({ ...c, lastSyncedAt: new Date().toISOString(), lastSyncError: undefined }))
        return 'empty'
      }
      const remoteTs = remote.syncUpdatedAt ?? 0
      let changed = false
      setState((local) => {
        const localTs = local.syncUpdatedAt ?? 0
        if (remoteTs <= localTs) {
          changed = false
          return local
        }
        changed = true
        return mergeSyncState(local, remote)
      })
      setSyncConfig((c) => ({
        ...c,
        lastSyncedAt: new Date().toISOString(),
        lastSyncError: undefined,
        roomId: config.roomId,
        passphrase:
          credentials.mode === 'passphrase' && config.rememberPassphrase
            ? credentials.passphrase
            : c.passphrase,
      }))
      return changed ? 'updated' : 'unchanged'
    },
    getDrinkSummary: getDrinkIngredientSummary,
    getMissingForDrink: (drink) => getMissingIngredients(drink.ingredients, matchContext),
    canMake: (drink) => canMakeDrink(drink.ingredients, matchContext),
    getRandomMakeableDrink: () => pickRandomMakeableDrink(makeableDrinks),
    lowStockIngredients,
    addLowStockToShopping: () => {
      const ids = lowStockIngredients.map((i) => i.id)
      const before = new Set(state.shoppingList)
      const next = addIdsToShoppingList(state.shoppingList, ids)
      const added = next.filter((id) => !before.has(id)).length
      if (added > 0) {
        update((s) => ({ ...s, shoppingList: addIdsToShoppingList(s.shoppingList, ids) }))
      }
      return added
    },
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}

export function useDemoBar() {
  const { state, activeBar } = useApp()
  const isEmpty = activeBar.ingredientIds.length === 0
  return { isEmpty, hasDemo: state.bars.some((b) => b.ingredientIds.length > 50) }
}

export function populateDemoBar(setState: React.Dispatch<React.SetStateAction<AppState>>) {
  const demoIds = SEED_INGREDIENTS.slice(0, 80).map((i) => i.id)
  setState((s) => ({
    ...s,
    bars: s.bars.map((b) =>
      b.id === s.activeBarId ? { ...b, name: "Randy's Liquor Only", ingredientIds: demoIds } : b
    ),
  }))
}

export { createDefaultState }
