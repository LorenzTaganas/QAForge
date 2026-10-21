import React, { useState } from 'react'
import { Plus, MoreHorizontal, X, Check } from 'lucide-react'
import KanbanCard from './KanbanCard'
import { useQA } from '../../context/useQA'

const KanbanColumn = ({ column }) => {
  const { addTask, updateTaskStatus } = useQA()
  const [isAdding, setIsAdding] = useState(false)
  const [quickTitle, setQuickTitle] = useState('')
  const [isDropTarget, setIsDropTarget] = useState(false)

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
      className={`flex w-72 shrink-0 flex-col rounded-xl border p-3 transition-all duration-200 ${
        isDropTarget ? 'border-[#00F0FF] bg-[#00F0FF]/10 shadow-[0_0_20px_rgba(0,240,255,0.25)]' : 'border-[#2B416C] bg-[#101726]/70 backdrop-blur-md hover:border-[#3A5280]'
      }`}
    >
      {/* Column Header */}
      <div className="mb-2 flex items-center justify-between px-2 py-2 border-b border-[#233352]/80">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#00F0FF]">
            {columnName}
          </h3>
          <span className="rounded-full border border-[#2B416C] bg-[#172138] px-2 py-0.5 text-[10px] font-bold text-[#00F0FF]">
            {tasks.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            title="Add task to this column"
            className="rounded p-1 text-[#8B97A9] transition hover:bg-[#172138] hover:text-[#00F0FF]"
          >
            <Plus size={14} />
          </button>
          <button
            type="button"
            title="More column options"
            className="rounded p-1 text-[#8B97A9] transition hover:bg-[#172138] hover:text-[#00F0FF]"
          >
            <MoreHorizontal size={14} />
          </button>
        </div>
      </div>

      {/* Cards List */}
      <div className="flex min-h-[160px] flex-1 flex-col gap-3 overflow-y-auto custom-scrollbar pt-1">
        {tasks.map((task) => (
          <KanbanCard key={task.id} task={task} />
        ))}

        {/* Quick Add Form */}
        {isAdding ? (
          <form onSubmit={handleQuickAdd} className="rounded-xl border border-[#00F0FF] bg-[#101726] p-2.5 shadow-[0_0_15px_rgba(0,240,255,0.2)]">
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
              className="w-full bg-transparent text-xs text-white placeholder-[#8B97A9] outline-none"
            />
            <div className="mt-2 flex items-center justify-end gap-1.5">
              <button
                type="button"
                onClick={closeQuickAdd}
                className="rounded p-1 text-[#8B97A9] hover:text-white"
              >
                <X size={14} />
              </button>
              <button
                type="submit"
                disabled={!quickTitle.trim()}
                className="flex items-center gap-1 rounded bg-[#00F0FF] px-2.5 py-1 text-[11px] font-bold text-[#070B14] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
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
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-[#8B97A9] transition hover:bg-[#172138] hover:text-[#00F0FF] hover:border hover:border-[#00F0FF]/30"
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
