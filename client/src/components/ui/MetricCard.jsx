import { Link } from 'react-router-dom'

const tones = {
  default: 'text-qf-text',
  primary: 'text-qf-primary',
  success: 'text-qf-success',
  warning: 'text-qf-warning',
  danger: 'text-qf-danger',
  info: 'text-qf-info',
}

const MetricCard = ({ label, value, hint, icon: Icon, tone = 'default', to, actionLabel }) => {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-medium text-qf-secondary">{label}</span>
        {Icon && (
          <span className="flex h-7 w-7 items-center justify-center rounded-md border border-qf-border bg-qf-card text-qf-muted">
            <Icon size={14} aria-hidden="true" />
          </span>
        )}
      </div>
      <div className={`mt-3 text-2xl font-semibold tracking-tight ${tones[tone] || tones.default}`}>{value}</div>
      {hint && <p className="mt-1 text-[11px] leading-4 text-qf-muted">{hint}</p>}
      {to && <span className="mt-3 inline-block text-[11px] font-medium text-qf-primary opacity-0 transition group-hover:opacity-100">{actionLabel || 'View details'} →</span>}
    </>
  )

  const className = 'group block rounded-lg border border-qf-border bg-qf-surface p-4 transition hover:border-qf-border-strong'

  if (to) {
    return (
      <Link to={to} className={className}>
        {content}
      </Link>
    )
  }

  return <div className={className}>{content}</div>
}

export default MetricCard
