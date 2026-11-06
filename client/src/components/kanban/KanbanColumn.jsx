import { useState } from 'react'
import { Check, Plus, X } from 'lucide-react'
import KanbanCard from './KanbanCard'
import { useQA } from '../../context/useQA'
import { useAuth } from '../../context/AuthContext'

const KanbanColumn = ({ column }) => {
  const { addTask, updateTaskStatus, selectedProjectKey } = useQA()
  const { user } = useAuth()
  const [isAdding, setIsAdding] = useState(false)
  const [quickTitle, setQuickTitle] = useState('')
  const [isDropTarget, setIsDropTarget] = useState(false)

  const columnName = column?.name || 'To Do'
  const tasks = column?.tasks || []

  const closeQuickAdd = () => {
    setIsAdding(false)
    setQuickTitle('')
  }

  const handleQuickAdd = (event) => {
    event.preventDefault()
    const trimmedTitle = quickTitle.trim()
    if (!trimmedTitle) return
    addTask({
      title: trimmedTitle,
      status: columnName,
      priority: 'Medium',
      owner: user?.name || 'Unassigned',
      type: 'Task',
      projectKey: selectedProjectKey,
    })
    closeQuickAdd()
  }

  const handleDrop = (event) => {
    event.preventDefault()
    const taskId = event.dataTransfer.getData('text/plain')
    if (taskId) updateTaskStatus(taskId, columnName)
    setIsDropTarget(false)
  }

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault()
        setIsDropTarget(true)
      }}
      onDragLeave={() => setIsDropTarget(false)}
      onDrop={handleDrop}
      className={`flex w-72 shrink-0 flex-col rounded-lg border p-2.5 transition ${isDropTarget ? 'border-qf-primary bg-qf-primary/5' : 'border-qf-border bg-qf-surface'}`}
    >
      <div className="mb-2 flex items-center justify-between border-b border-qf-border px-1.5 pb-2 pt-1">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-semibold text-qf-secondary">{columnName}</h3>
          <span className="rounded bg-qf-card px-1.5 py-0.5 text-[10px] font-medium text-qf-muted">{tasks.length}</span>
        </div>
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          title={`Add issue to ${columnName}`}
          aria-label={`Add issue to ${columnName}`}
          className="rounded p-1 text-qf-muted transition hover:bg-qf-card hover:text-qf-primary"
        >
          <Plus size={14} />
        </button>
      </div>

      <div className="flex min-h-[140px] flex-1 flex-col gap-2 overflow-y-auto pt-1 custom-scrollbar">
        {tasks.map((task) => <KanbanCard key={task.id} task={task} />)}

        {isAdding ? (
          <form onSubmit={handleQuickAdd} className="rounded-lg border border-qf-primary bg-qf-card p-2.5">
            <input
              type="text"
              autoFocus
              maxLength={140}
              placeholder="Issue title"
              value={quickTitle}
              onChange={(event) => setQuickTitle(event.target.value)}
              onKeyDown={(event) => { if (event.key === 'Escape') closeQuickAdd() }}
              className="w-full bg-transparent text-xs text-qf-text placeholder-qf-muted outline-none"
            />
            <div className="mt-2 flex items-center justify-end gap-1.5">
              <button type="button" onClick={closeQuickAdd} className="rounded p-1 text-qf-muted hover:text-qf-text" aria-label="Cancel">
                <X size={14} />
              </button>
              <button type="submit" disabled={!quickTitle.trim()} className="btn-primary px-2 py-1 text-[11px]">
                <Check size={12} /> Add
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-xs text-qf-muted transition hover:bg-qf-card hover:text-qf-primary"
          >
            <Plus size={14} />
            <span>Create issue</span>
          </button>
        )}
      </div>
    </div>
  )
}

export default KanbanColumn
