type TabIconKind = 'home' | 'saved' | 'stock' | 'recipes' | 'settings'

export function TabIcon({ kind }: { kind: TabIconKind }) {
  switch (kind) {
    case 'home':
      return (
        <svg className="tab-icon-svg" viewBox="0 0 24 24" aria-hidden>
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.5 11.5 12 5l7.5 6.5"
          />
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6.5 11v9.5h11V11"
          />
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10 20.5v-5h4v5"
          />
        </svg>
      )
    case 'saved':
      return <span className="tab-icon-glyph">★</span>
    case 'stock':
      return (
        <svg className="tab-icon-svg" viewBox="0 0 24 24" aria-hidden>
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            d="M5 4v16M19 4v16"
          />
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            d="M5 8h14M5 14h14M5 20h14"
          />
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.5 8V6a.75.75 0 0 1 1.5 0V8M14 14v-3.5a1 1 0 0 1 2 0V14M9.5 20v-2a.75.75 0 0 1 1.5 0v2"
          />
        </svg>
      )
    case 'settings':
      return <span className="tab-icon-glyph">⚙</span>
    case 'recipes':
      return (
        <svg className="tab-icon-svg" viewBox="0 0 24 24" aria-hidden>
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 4h14l-2 10.5a4.5 4.5 0 0 1-10 0L5 4z"
          />
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            d="M12 14.5V19"
          />
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            d="M8.5 21h7"
          />
          <circle cx="12" cy="8" r="1.25" fill="currentColor" />
        </svg>
      )
  }
}
