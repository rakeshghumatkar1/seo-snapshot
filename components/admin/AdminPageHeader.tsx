import Link from 'next/link'

type Props = {
  eyebrow?: string
  title: string
  subtitle?: string
  actions?: React.ReactNode
  backHref?: string
  backLabel?: string
}

export default function AdminPageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
  backHref,
  backLabel = '← Dashboard',
}: Props) {
  return (
    <div className="admin-page-header">
      <div>
        {eyebrow ? <div className="admin-eyebrow">{eyebrow}</div> : null}
        <h1 className="admin-title">{title}</h1>
        {subtitle ? <p className="admin-subtitle">{subtitle}</p> : null}
      </div>
      <div className="admin-page-header-actions">
        {actions}
        {backHref ? (
          <Link href={backHref} className="admin-btn admin-btn-secondary">
            {backLabel}
          </Link>
        ) : null}
      </div>
    </div>
  )
}
