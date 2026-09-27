import type { ReactNode } from 'react'

export function Modal({
  title,
  onClose,
  children,
  footer,
}: {
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  )
}

export function MetricCard({
  icon,
  value,
  label,
  color,
}: {
  icon: string
  value: string | number
  label: string
  color: string
}) {
  return (
    <div className="metric" style={{ ['--mcolor' as string]: color }}>
      <div className="ico" aria-hidden>
        {icon}
      </div>
      <b>{value}</b>
      <span>{label}</span>
    </div>
  )
}

export function StatusBadge({ status }: { status: string }) {
  return <span className={`badge badge-${status}`}>{status}</span>
}

export function EmptyState({
  icon,
  title,
  text,
}: {
  icon: string
  title: string
  text?: string
}) {
  return (
    <div className="empty-state">
      <div className="big" aria-hidden>
        {icon}
      </div>
      <b>{title}</b>
      {text && <p>{text}</p>}
    </div>
  )
}

export function PageHead({
  title,
  sub,
  actions,
}: {
  title: string
  sub?: string
  actions?: ReactNode
}) {
  return (
    <div className="page-head">
      <div className="page-head-row">
        <div>
          <h1>{title}</h1>
          {sub && <p>{sub}</p>}
        </div>
        {actions && <div style={{ display: 'flex', gap: 10 }}>{actions}</div>}
      </div>
    </div>
  )
}
