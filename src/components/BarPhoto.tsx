import type { BarProfile } from '../types'

type BarPhotoSize = 'sm' | 'md' | 'lg'

interface BarPhotoProps {
  bar: Pick<BarProfile, 'name' | 'image'>
  size?: BarPhotoSize
  className?: string
  onClick?: () => void
  title?: string
}

export function BarPhoto({ bar, size = 'md', className, onClick, title }: BarPhotoProps) {
  const label = title ?? (onClick ? `Change photo for ${bar.name}` : bar.name)
  const classes = ['bar-photo', `bar-photo--${size}`, onClick ? 'bar-photo--btn' : '', className]
    .filter(Boolean)
    .join(' ')

  if (onClick) {
    return (
      <button type="button" className={classes} onClick={onClick} title={label} aria-label={label}>
        {bar.image ? (
          <img src={bar.image} alt="" />
        ) : (
          <span className="bar-photo-fallback" aria-hidden>
            {bar.name.charAt(0).toUpperCase() || '?'}
          </span>
        )}
      </button>
    )
  }

  return (
    <div className={classes} title={label}>
      {bar.image ? (
        <img src={bar.image} alt="" />
      ) : (
        <span className="bar-photo-fallback" aria-hidden>
          {bar.name.charAt(0).toUpperCase() || '?'}
        </span>
      )}
    </div>
  )
}
