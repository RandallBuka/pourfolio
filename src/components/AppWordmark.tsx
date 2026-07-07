import { PourfolioMark } from './PourfolioMark'

interface Props {
  className?: string
}

export function AppWordmark({ className = '' }: Props) {
  return (
    <span className={`app-wordmark ${className}`.trim()}>
      <PourfolioMark className="app-wordmark-mark" />
      <span className="app-wordmark-text">
        <span className="app-wordmark-pour">Pour</span>
        <span className="app-wordmark-folio">folio</span>
      </span>
    </span>
  )
}
