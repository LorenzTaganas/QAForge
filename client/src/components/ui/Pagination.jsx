import { ChevronLeft, ChevronRight } from 'lucide-react'

const Pagination = ({ page, pageSize, total, onPageChange, itemLabel = 'items' }) => {
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  if (total <= pageSize) return null

  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)

  const goTo = (next) => {
    const clamped = Math.min(Math.max(next, 1), pageCount)
    if (clamped !== page) onPageChange(clamped)
  }

  return (
    <nav className="flex flex-col items-center justify-between gap-3 border-t border-qf-border px-4 py-3 text-xs text-qf-muted sm:flex-row" aria-label="Pagination">
      <p>
        Showing <span className="font-medium text-qf-secondary">{start}–{end}</span> of{' '}
        <span className="font-medium text-qf-secondary">{total}</span> {itemLabel}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => goTo(page - 1)}
          disabled={page <= 1}
          className="inline-flex items-center gap-1 rounded-md border border-qf-border px-2.5 py-1.5 text-qf-secondary transition hover:bg-qf-card hover:text-qf-text disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft size={14} /> Previous
        </button>
        <span className="px-2 tabular-nums text-qf-secondary">
          {page} / {pageCount}
        </span>
        <button
          type="button"
          onClick={() => goTo(page + 1)}
          disabled={page >= pageCount}
          className="inline-flex items-center gap-1 rounded-md border border-qf-border px-2.5 py-1.5 text-qf-secondary transition hover:bg-qf-card hover:text-qf-text disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next <ChevronRight size={14} />
        </button>
      </div>
    </nav>
  )
}

export default Pagination
