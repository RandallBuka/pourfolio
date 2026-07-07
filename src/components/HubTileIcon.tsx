export type HubTileIconKind = 'bar' | 'make' | 'need' | 'shop'

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export function HubTileIcon({ kind }: { kind: HubTileIconKind }) {
  switch (kind) {
    case 'bar':
      return (
        <svg viewBox="0 0 24 24" aria-hidden>
          <path {...stroke} d="M4 19h16" />
          <path {...stroke} d="M7 19V9l1.5-2.5h1L11 9v10" />
          <path {...stroke} d="M13 19V7l1.5-2h1L17 7v12" />
          <path {...stroke} d="M7 9h4M13 7h4" />
        </svg>
      )
    case 'make':
      return (
        <svg viewBox="0 0 24 24" aria-hidden>
          <path {...stroke} d="M6 4h12l-6 8v0z" />
          <path {...stroke} d="M12 12v5" />
          <path {...stroke} d="M9 21h6" />
          <path {...stroke} d="M8 4c0-1 1.5-2 4-2s4 1 4 2" />
        </svg>
      )
    case 'need':
      return (
        <svg viewBox="0 0 24 24" aria-hidden>
          <path {...stroke} d="M10 3h4v2.5l2.5 4.5V20H7.5V10l2.5-4.5V3z" />
          <path {...stroke} d="M9.5 3h5" />
          <circle cx="17.5" cy="17.5" r="3.25" {...stroke} />
          <path {...stroke} d="M17.5 16v3M16 17.5h3" />
        </svg>
      )
    case 'shop':
      return (
        <svg viewBox="0 0 24 24" aria-hidden>
          <path {...stroke} d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
          <path {...stroke} d="M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" />
          <path {...stroke} d="M8 11.5l2 2 3.5-3.5" />
          <path {...stroke} d="M8 16.5h8" />
          <path {...stroke} d="M8 19.5h5" />
        </svg>
      )
  }
}
