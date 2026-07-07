interface Props {
  title: string
  description?: string
}

export function PageSubtitle({ title, description }: Props) {
  return (
    <div className="page-subtitle">
      <p className="page-subtitle-title">{title}</p>
      {description && <p className="page-subtitle-desc">{description}</p>}
    </div>
  )
}
