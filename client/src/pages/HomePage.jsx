import React from 'react'
import MainLayout from '../components/layout/MainLayout'
import KanbanBoard from '../components/kanban/KanbanBoard'
import { Filter, Share2, Plus, SlidersHorizontal } from 'lucide-react'

const boardColumns = [
  {
    name: 'To Do',
    tasks: [
      { title: 'Validate login flow and security tokens', due: 'Sep 27, 2026', owner: 'KAN-1' },
      { title: 'Review release checklist and sign-offs', due: 'Sep 30, 2026', owner: 'KAN-3' },
    ],
  },
  {
    name: 'In Progress',
    tasks: [
      { title: 'Fix checkout edge case for international currencies', due: 'Oct 2, 2026', owner: 'KAN-4' },
      { title: 'Update automated regression test matrix', due: 'Oct 5, 2026', owner: 'KAN-6' },
    ],
  },
  {
    name: 'In Review',
    tasks: [
      { title: 'Security access validation and permissions audit', due: 'Oct 4, 2026', owner: 'KAN-7' },
    ],
  },
  {
    name: 'Done',
    tasks: [
      { title: 'Requirements traceability matrix mapping', due: 'Sep 22, 2026', owner: 'KAN-2' },
    ],
  },
]

const HomePage = () => {
  return (
    <MainLayout>
      <div className="flex flex-col gap-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 border-b border-jira-border pb-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-jira-muted">
              Software Team / QAR Release Board
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">
              QA Sprint Board
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button className="btn-ghost text-xs">
              <Filter size={14} />
              Filter
            </button>
            <button className="btn-ghost text-xs">
              <Share2 size={14} />
              Share
            </button>
            <button className="btn-primary text-xs">
              <Plus size={14} />
              Create issue
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Open tasks', value: '18', color: 'text-blue-400' },
            { label: 'In review', value: '7', color: 'text-amber-400' },
            { label: 'Blocked', value: '3', color: 'text-red-400' },
            { label: 'Done', value: '42', color: 'text-emerald-400' },
          ].map((stat, index) => (
            <div key={index} className="stat-card">
              <div className="text-[11px] font-bold uppercase tracking-wider text-jira-muted">
                {stat.label}
              </div>
              <div className={`mt-2 text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Board Controls / Tabs */}
        <div className="flex items-center justify-between border-b border-jira-border pb-3">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <button className="rounded bg-jira-surface px-3 py-1.5 text-white border border-jira-border">
              Board
            </button>
            <button className="rounded px-3 py-1.5 text-jira-muted hover:bg-jira-surface/50 hover:text-white transition">
              Timeline
            </button>
            <button className="rounded px-3 py-1.5 text-jira-muted hover:bg-jira-surface/50 hover:text-white transition">
              List
            </button>
            <button className="rounded px-3 py-1.5 text-jira-muted hover:bg-jira-surface/50 hover:text-white transition">
              Reports
            </button>
          </div>

          <button className="flex items-center gap-1.5 text-xs text-jira-muted hover:text-white transition">
            <SlidersHorizontal size={14} />
            <span>View settings</span>
          </button>
        </div>

        {/* Kanban Board */}
        <KanbanBoard columns={boardColumns} />
      </div>
    </MainLayout>
  )
}

export default HomePage
