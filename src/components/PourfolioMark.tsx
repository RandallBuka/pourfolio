/**
 * Pourfolio monogram — bold P with a teardrop in the counter (where the hole would be).
 */
export function PourfolioMark({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle className="pourfolio-mark-bowl" cx="19.5" cy="13" r="8.5" fill="currentColor" />
      <rect className="pourfolio-mark-stem" x="7" y="5" width="6.5" height="22" rx="3.25" fill="currentColor" />
      <path
        className="pourfolio-mark-accent"
        d="M19.5 7 C19.5 7 14.5 12 14.5 14.5 C14.5 17.35 16.85 19.1 19.5 19.1 C22.15 19.1 24.5 17.35 24.5 14.5 C24.5 12 19.5 7 19.5 7 Z"
      />
    </svg>
  )
}
