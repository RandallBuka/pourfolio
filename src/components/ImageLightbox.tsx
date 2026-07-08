interface ImageLightboxProps {
  src: string
  alt: string
  onClose: () => void
}

export function ImageLightbox({ src, alt, onClose }: ImageLightboxProps) {
  return (
    <div
      className="image-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      onClick={onClose}
    >
      <button type="button" className="image-lightbox__close" onClick={onClose} aria-label="Close">
        ×
      </button>
      <img
        src={src}
        alt={alt}
        className="image-lightbox__img"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  )
}
