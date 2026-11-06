const PageHeader = ({ eyebrow, title, description, actions, meta, className = '' }) => (
  <header className={`flex flex-col gap-4 border-b border-qf-border pb-5 sm:flex-row sm:items-end sm:justify-between ${className}`}>
    <div className="min-w-0">
      {eyebrow && <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-qf-muted">{eyebrow}</p>}
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-qf-text">{title}</h1>
      {description && <p className="mt-1.5 max-w-2xl text-sm text-qf-secondary">{description}</p>}
      {meta && <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-qf-muted">{meta}</div>}
    </div>
    {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
  </header>
)

export default PageHeader
