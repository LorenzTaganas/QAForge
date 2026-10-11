import React, { useState } from 'react'
import { Plus, MoreHorizontal, X, Check } from 'lucide-react'
import KanbanCard from './KanbanCard'
import { useQA } from '../../context/QAContext'

const KanbanColumn = ({ column }) => {
  const { addTask } = useQA()
  const [isAdding, setIsAdding] = useState(false)
  const [quickTitle, setQuickTitle] = useState('')

  const columnName = column?.name || 'To Do'
  const tasks = column?.tasks || []

  const closeQuickAdd = () => {
    setIsAdding(false)
    setQuickTitle('')
  }

  const handleQuickAdd = (e) => {
    e.preventDefault()

    const trimmedTitle = quickTitle.trim()
    if (!trimmedTitle) return

    addTask({
      title: trimmedTitle,
      status: columnName,
      priority: 'Medium',
      owner: 'QA Tester',
      type: 'Task',
      due: 'Oct 20, 2026',
    })

    closeQuickAdd()
  }

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-lg bg-jira-surface/30 p-2.5 border border-jira-border/60 hover:border-jira-border transition">
      {/* Column Header */}
      <div className="mb-2 flex items-center justify-between px-2 py-2">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-jira-muted">
            {columnName}
          </h3>
          <span className="rounded-full border border-jira-border bg-jira-surface-3 px-2 py-0.5 text-[10px] font-bold text-jira-text">
            {tasks.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            title="Add task to this column"
            className="rounded p-1 text-jira-muted transition hover:bg-jira-surface-3 hover:text-white"
          >
            <Plus size={14} />
          </button>
          <button
            type="button"
            title="More column options"
            className="rounded p-1 text-jira-muted transition hover:bg-jira-surface-3 hover:text-white"
          >
            <MoreHorizontal size={14} />
          </button>
        </div>
      </div>

      {/* Cards List */}
      <div className="flex min-h-[160px] flex-1 flex-col gap-2.5 overflow-y-auto custom-scrollbar">
        {tasks.map((task) => (
          <KanbanCard key={task.id} task={task} />
        ))}

        {/* Quick Add Form */}
        {isAdding ? (
          <form onSubmit={handleQuickAdd} className="rounded-md border border-jira-blue bg-jira-surface p-2 shadow-sm">
            <input
              type="text"
              autoFocus
              placeholder="What needs to be done?"
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  closeQuickAdd()
                }
              }}
              className="w-full bg-transparent text-xs text-white placeholder-jira-muted outline-none"
            />
            <div className="mt-2 flex items-center justify-end gap-1.5">
              <button
                type="button"
                onClick={closeQuickAdd}
                className="rounded p-1 text-jira-muted hover:text-white"
              >
                <X size={14} />
              </button>
              <button
                type="submit"
                disabled={!quickTitle.trim()}
                className="flex items-center gap-1 rounded bg-jira-blue px-2 py-1 text-[11px] font-semibold text-white transition hover:bg-jira-blue-soft disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Check size={12} />
                <span>Add</span>
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-jira-muted transition hover:bg-jira-surface-2 hover:text-white"
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
