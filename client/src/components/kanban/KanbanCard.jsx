import React from 'react'
import { Calendar, MoreHorizontal, User } from 'lucide-react'

const KanbanCard = ({ task }) => {
  return (
    <div className="kanban-card group cursor-grab active:cursor-grabbing">
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-medium text-jira-text group-hover:text-white transition">
          {task.title}
        </h4>
        <button className="text-jira-muted hover:text-white transition opacity-0 group-hover:opacity-100">
          <MoreHorizontal size={16} />
        </button>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-jira-surface-3 border border-jira-border text-[10px] font-bold text-white shadow-sm">
            {task.owner.split('-')[1] || <User size={12} />}
          </div>
          <span className="text-[11px] font-medium text-jira-muted group-hover:text-jira-text transition">
            {task.owner}
          </span>
        </div>

        <div className="flex items-center gap-1.5 rounded bg-jira-bg/50 px-1.5 py-0.5 text-[10px] text-jira-muted border border-jira-border/50">
          <Calendar size={10} />
          {task.due}
        </div>
      </div>
    </div>
  )
}

export default KanbanCard
