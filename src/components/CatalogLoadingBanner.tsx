import { useCatalogReady } from '../data/catalogStore'

export function CatalogLoadingBanner() {
  const ready = useCatalogReady()
  if (ready) return null

  return (
    <div className="catalog-loading-banner" role="status">
      Loading recipe library…
    </div>
  )
}
