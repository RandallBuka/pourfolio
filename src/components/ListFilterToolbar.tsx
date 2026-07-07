import type { ReactNode } from 'react'

interface Props {
  search: string
  onSearchChange: (value: string) => void
  placeholder?: string
  filterCount: number
  onFilterClick: () => void
  filterLabel?: string
  trailing?: ReactNode
  children?: ReactNode
}

export function ListFilterToolbar({
  search,
  onSearchChange,
  placeholder = 'Search...',
  filterCount,
  onFilterClick,
  filterLabel = 'Filter',
  trailing,
  children,
}: Props) {
  return (
    <div className="list-toolbar">
      <div className="list-toolbar-row">
        <input
          className="search-input list-toolbar-search"
          placeholder={placeholder}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <button type="button" className="btn btn-secondary list-toolbar-filter" onClick={onFilterClick}>
          {filterLabel}{filterCount > 0 ? ` (${filterCount})` : ''}
        </button>
        {trailing}
      </div>
      {children}
    </div>
  )
}

interface FilterPillsProps {
  pills: Array<{ key: string; label: string; field?: string; value?: string }>
  onRemove: (pill: { key: string; field?: string; value?: string }) => void
}

export function FilterPills({ pills, onRemove }: FilterPillsProps) {
  if (pills.length === 0) return null
  return (
    <div className="category-pills list-toolbar-pills">
      {pills.map((pill) => (
        <button
          key={pill.key}
          type="button"
          className="category-pill active"
          onClick={() => onRemove(pill)}
        >
          {pill.label} ✕
        </button>
      ))}
    </div>
  )
}
