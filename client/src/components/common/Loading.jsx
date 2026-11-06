const Loading = ({ fullScreen = false, label = 'Loading QAForge…' }) => (
  <div
    className={`flex ${fullScreen ? 'min-h-screen' : 'min-h-[40vh]'} flex-col items-center justify-center gap-4 bg-qf-bg text-qf-text`}
    role="status"
    aria-live="polite"
  >
    <span className="h-8 w-8 animate-spin rounded-full border-2 border-qf-border border-t-qf-primary" aria-hidden="true" />
    <p className="text-xs font-medium text-qf-secondary">{label}</p>
    <span className="sr-only">{label}</span>
  </div>
)

export default Loading
