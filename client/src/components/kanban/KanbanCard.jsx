import React, { useState } from 'react'
import { Calendar, Trash2, ArrowRightCircle, CheckCircle2, AlertCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useQA } from '../../context/QAContext'

const priorityColors = {
  Critical: 'text-red-400 bg-red-400/10 border-red-400/20',
  High: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  Medium: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  Low: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
}

const statusFlow = ['To Do', 'In Progress', 'In Review', 'Done']

const KanbanCard = ({ task }) => {
  const { updateTaskStatus, deleteTask } = useQA()
  const [showMenu, setShowMenu] = useState(false)

  const currentIdx = statusFlow.indexOf(task.status)
  const nextStatus = currentIdx !== -1 && currentIdx < statusFlow.length - 1 ? statusFlow[currentIdx + 1] : null

  return (
    <div
      draggable
      onDragStart={(event) => event.dataTransfer.setData('text/plain', task.id)}
      className="kanban-card group relative flex cursor-grab flex-col justify-between transition hover:border-jira-blue/60 active:cursor-grabbing"
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[11px] font-bold text-jira-blue">
              {task.id}
            </span>
            <span
              className={`rounded px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-tight border ${
                priorityColors[task.priority] || priorityColors.Medium
              }`}
            >
              {task.priority}
            </span>
          </div>

          <button
            onClick={() => deleteTask(task.id)}
            title="Delete task"
            className="text-jira-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition p-1"
          >
            <Trash2 size={13} />
          </button>
        </div>

        <Link to={`/issues/${task.id}`} className="block text-xs font-medium leading-snug text-jira-text transition group-hover:text-white">
          {task.title}
        </Link>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-jira-border/60 pt-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-jira-surface-3 border border-jira-border text-[9px] font-bold text-white shadow-sm">
            {task.owner?.charAt(0) || 'U'}
          </div>
          <span className="text-[11px] font-medium text-jira-muted truncate max-w-[80px]">
            {task.owner}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {nextStatus ? (
            <button
              onClick={() => updateTaskStatus(task.id, nextStatus)}
              title={`Advance to ${nextStatus}`}
              className="flex items-center gap-1 rounded bg-jira-surface-2 px-1.5 py-0.5 text-[10px] font-semibold text-jira-muted hover:text-white hover:bg-jira-blue transition border border-jira-border"
            >
              <span>{nextStatus}</span>
              <ArrowRightCircle size={11} />
            </button>
          ) : (
            <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
              <CheckCircle2 size={12} />
              <span>Completed</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default KanbanCard
