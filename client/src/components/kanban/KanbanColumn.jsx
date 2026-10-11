import React from 'react'
import { Plus, MoreHorizontal } from 'lucide-react'
import KanbanCard from './KanbanCard'

const KanbanColumn = ({ column }) => {
  return (
    <div className="flex w-72 shrink-0 flex-col rounded-lg bg-jira-surface/30 p-2 border border-transparent hover:border-jira-border transition">
      <div className="flex items-center justify-between px-2 py-2 mb-2">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-jira-muted">
            {column.name}
          </h3>
          <span className="rounded-full bg-jira-surface-3 px-2 py-0.5 text-[10px] font-bold text-jira-text border border-jira-border">
            {column.tasks.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button className="rounded p-1 text-jira-muted hover:bg-jira-surface-3 hover:text-white transition">
            <Plus size={14} />
          </button>
          <button className="rounded p-1 text-jira-muted hover:bg-jira-surface-3 hover:text-white transition">
            <MoreHorizontal size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto min-h-[150px] custom-scrollbar">
        {column.tasks.map((task, index) => (
          <KanbanCard key={index} task={task} />
        ))}

        <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-jira-muted transition hover:bg-jira-surface-2 hover:text-white">
          <Plus size={16} />
          <span>Create task</span>
        </button>
      </div>
    </div>
  )
}

export default KanbanColumn
