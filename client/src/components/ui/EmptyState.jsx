import { Inbox } from 'lucide-react'

const EmptyState = ({ icon: Icon = Inbox, title = 'Nothing here yet', description, action, compact = false }) => (
  <div className={`flex flex-col items-center justify-center rounded-lg border border-dashed border-qf-border bg-qf-surface/40 px-6 text-center ${compact ? 'py-8' : 'py-14'}`}>
    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-qf-border bg-qf-card text-qf-muted">
      <Icon size={18} aria-hidden="true" />
    </div>
    <h3 className="text-sm font-semibold text-qf-text">{title}</h3>
    {description && <p className="mt-1 max-w-sm text-xs leading-5 text-qf-muted">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
)

export const ErrorState = ({ title = 'Something went wrong', description = 'We could not load this data. Please try again.', action }) => (
  <div className="rounded-lg border border-qf-danger/30 bg-qf-danger/5 p-5">
    <h3 className="text-sm font-semibold text-qf-text">{title}</h3>
    <p className="mt-1 text-xs text-qf-secondary">{description}</p>
    {action && <div className="mt-3">{action}</div>}
  </div>
)

export const LoadingState = ({ label = 'Loading…', rows = 3 }) => (
  <div className="space-y-2.5" role="status" aria-live="polite">
    <span className="sr-only">{label}</span>
    {Array.from({ length: rows }).map((_, index) => (
      <div key={index} className="h-10 animate-pulse rounded-md border border-qf-border bg-qf-surface/60" />
    ))}
  </div>
)

export default EmptyState
