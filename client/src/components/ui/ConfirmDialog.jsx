import { useEffect, useRef } from 'react'
import { AlertTriangle, X } from 'lucide-react'

const ConfirmDialog = ({
  open,
  title = 'Are you sure?',
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  busy = false,
  onConfirm,
  onClose,
}) => {
  const confirmRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const timer = window.setTimeout(() => confirmRef.current?.focus(), 0)
    const handleKey = (event) => {
      if (event.key === 'Escape' && !busy) onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('keydown', handleKey)
    }
  }, [open, busy, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 animate-fade-in"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose()
      }}
    >
      <div role="dialog" aria-modal="true" aria-labelledby="confirm-title" className="w-full max-w-md rounded-lg border border-qf-border bg-qf-surface shadow-lift">
        <div className="flex items-start justify-between gap-4 border-b border-qf-border px-5 py-4">
          <div className="flex items-start gap-3">
            <span className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-md ${tone === 'danger' ? 'bg-qf-danger/10 text-qf-danger' : 'bg-qf-warning/10 text-qf-warning'}`}>
              <AlertTriangle size={16} />
            </span>
            <div>
              <h2 id="confirm-title" className="text-sm font-semibold text-qf-text">{title}</h2>
              {description && <p className="mt-1 text-xs leading-5 text-qf-secondary">{description}</p>}
            </div>
          </div>
          <button type="button" onClick={onClose} disabled={busy} className="rounded p-1 text-qf-muted hover:bg-qf-card hover:text-qf-text" aria-label="Close dialog">
            <X size={16} />
          </button>
        </div>
        <div className="flex justify-end gap-2 px-5 py-4">
          <button type="button" onClick={onClose} disabled={busy} className="btn-ghost text-xs">{cancelLabel}</button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={tone === 'danger' ? 'btn-danger text-xs' : 'btn-primary text-xs'}
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
