import React, { useState } from 'react'
import { Calendar, Trash2, ArrowRightCircle, CheckCircle2, AlertCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useQA } from '../../context/useQA'
import { useAuth } from '../../context/AuthContext'
import { canDeleteIssue } from '../../utils/permissions'

const priorityColors = {
  Critical: 'text-red-400 bg-red-500/10 border-red-500/30 shadow-[0_0_8px_rgba(239,68,68,0.2)]',
  High: 'text-amber-400 bg-amber-500/10 border-amber-500/30 shadow-[0_0_8px_rgba(245,158,11,0.2)]',
  Medium: 'text-[#00F0FF] bg-[#00F0FF]/10 border-[#00F0FF]/30 shadow-[0_0_8px_rgba(0,240,255,0.2)]',
  Low: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.2)]',
}

const statusFlow = ['To Do', 'In Progress', 'In Review', 'Done']

const KanbanCard = ({ task }) => {
  const { updateTaskStatus, deleteTask } = useQA()
  const { user } = useAuth()
  const [showMenu, setShowMenu] = useState(false)

  const currentIdx = statusFlow.indexOf(task.status)
  const nextStatus = currentIdx !== -1 && currentIdx < statusFlow.length - 1 ? statusFlow[currentIdx + 1] : null

  return (
    <div
      draggable
      onDragStart={(event) => event.dataTransfer.setData('text/plain', task.id)}
      className="kanban-card group relative flex cursor-grab flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:border-[#00F0FF]/80 hover:shadow-[0_12px_30px_rgba(0,0,0,0.6),0_0_20px_rgba(0,240,255,0.25)] active:cursor-grabbing border border-[#2B416C] bg-[#101726]/90 backdrop-blur-md rounded-xl p-3.5"
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[11px] font-bold text-[#00F0FF] tracking-wider">
              {task.id}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-tight border ${
                priorityColors[task.priority] || priorityColors.Medium
              }`}
            >
              {task.priority}
            </span>
          </div>

          {canDeleteIssue(user?.role) && (
            <button
              onClick={() => deleteTask(task.id)}
              title="Delete task"
              className="text-[#8B97A9] hover:text-red-400 opacity-0 group-hover:opacity-100 transition p-1"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>

        <Link to={`/issues/${task.id}`} className="block text-xs font-semibold leading-relaxed text-[#DDE5F2] transition group-hover:text-white">
          {task.title}
        </Link>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-[#233352] pt-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#172138] border border-[#00F0FF]/40 text-[9px] font-bold text-[#00F0FF] shadow-[0_0_8px_rgba(0,240,255,0.2)]">
            {task.owner?.charAt(0) || 'U'}
          </div>
          <span className="text-[11px] font-medium text-[#8B97A9] truncate max-w-[80px]">
            {task.owner}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {nextStatus ? (
            <button
              onClick={() => updateTaskStatus(task.id, nextStatus)}
              title={`Advance to ${nextStatus}`}
              className="flex items-center gap-1 rounded-md bg-[#172138] px-2 py-1 text-[10px] font-semibold text-[#8B97A9] hover:text-[#00F0FF] hover:bg-[#1D3A68] transition border border-[#2B416C] hover:border-[#00F0FF]/50"
            >
              <span>{nextStatus}</span>
              <ArrowRightCircle size={11} className="text-[#00F0FF]" />
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
