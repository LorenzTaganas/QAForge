import { useState } from 'react'
import { ArrowRightCircle, CheckCircle2, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useQA } from '../../context/useQA'
import { useAuth } from '../../context/AuthContext'
import { canDeleteIssue } from '../../utils/permissions'
import { PriorityBadge } from '../ui/Badges'
import ConfirmDialog from '../ui/ConfirmDialog'

const statusFlow = ['To Do', 'In Progress', 'In Review', 'Done']

const KanbanCard = ({ task }) => {
  const { updateTaskStatus, deleteTask } = useQA()
  const { user } = useAuth()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const currentIdx = statusFlow.indexOf(task.status)
  const nextStatus = currentIdx !== -1 && currentIdx < statusFlow.length - 1 ? statusFlow[currentIdx + 1] : null

  const confirmDelete = async () => {
    setDeleting(true)
    await deleteTask(task.id)
    setDeleting(false)
    setConfirmOpen(false)
  }

  return (
    <>
      <div
        draggable
        onDragStart={(event) => event.dataTransfer.setData('text/plain', task.id)}
        className="group flex cursor-grab flex-col rounded-lg border border-qf-border bg-qf-card p-3 transition hover:border-qf-primary/60 active:cursor-grabbing"
      >
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="font-mono text-[11px] font-semibold text-qf-info">{task.id}</span>
            <PriorityBadge priority={task.priority} />
          </div>
          {canDeleteIssue(user?.role) && (
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              aria-label={`Delete ${task.id}`}
              className="rounded p-1 text-qf-muted opacity-0 transition hover:text-qf-danger group-hover:opacity-100 focus:opacity-100"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>

        <Link to={`/issues/${task.id}`} className="block text-xs font-medium leading-relaxed text-qf-text hover:text-white">
          {task.title}
        </Link>

        <div className="mt-3 flex items-center justify-between border-t border-qf-border pt-2.5">
          <span className="flex min-w-0 items-center gap-1.5">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-qf-surface text-[9px] font-semibold text-qf-secondary">
              {task.owner?.charAt(0) || 'U'}
            </span>
            <span className="truncate text-[11px] text-qf-muted">{task.owner || 'Unassigned'}</span>
          </span>

          {nextStatus ? (
            <button
              type="button"
              onClick={() => updateTaskStatus(task.id, nextStatus)}
              title={`Move to ${nextStatus}`}
              className="flex items-center gap-1 rounded border border-qf-border px-1.5 py-1 text-[10px] font-medium text-qf-muted transition hover:border-qf-primary/50 hover:text-qf-primary"
            >
              <ArrowRightCircle size={11} />
              <span>{nextStatus}</span>
            </button>
          ) : (
            <span className="flex items-center gap-1 text-[10px] font-medium text-qf-success">
              <CheckCircle2 size={12} /> Done
            </span>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title={`Delete ${task.id}?`}
        description="This issue and its comments are removed permanently."
        confirmLabel="Delete issue"
        busy={deleting}
        onConfirm={confirmDelete}
        onClose={() => setConfirmOpen(false)}
      />
    </>
  )
}

export default KanbanCard
