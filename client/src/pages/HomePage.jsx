import React, { useState, useMemo } from 'react'
import MainLayout from '../components/layout/MainLayout'
import KanbanBoard from '../components/kanban/KanbanBoard'
import { Filter, Share2, Plus, SlidersHorizontal, Calendar, List, CheckCircle, Clock } from 'lucide-react'
import { useQA } from '../context/QAContext'

const columnDefinitions = ['To Do', 'In Progress', 'In Review', 'Done']

const HomePage = () => {
  const { tasks, setIsCreateModalOpen, showToast, searchQuery } = useQA()
  const [activeTab, setActiveTab] = useState('Board')
  const [selectedPriority, setSelectedPriority] = useState('All')
  const [selectedOwner, setSelectedOwner] = useState('All')
  const [showFilterBar, setShowFilterBar] = useState(false)

  // Filter tasks based on search, priority, owner
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchSearch = searchQuery
        ? t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.id.toLowerCase().includes(searchQuery.toLowerCase())
        : true
      const matchPriority = selectedPriority === 'All' ? true : t.priority === selectedPriority
      const matchOwner = selectedOwner === 'All' ? true : t.owner === selectedOwner
      return matchSearch && matchPriority && matchOwner
    })
  }, [tasks, searchQuery, selectedPriority, selectedOwner])

  // Group into columns
  const columns = useMemo(() => {
    return columnDefinitions.map((name) => ({
      name,
      tasks: filteredTasks.filter((t) => t.status === name),
    }))
  }, [filteredTasks])

  // Dynamic stats
  const stats = useMemo(() => {
    return [
      { label: 'To Do', value: tasks.filter((t) => t.status === 'To Do').length, color: 'text-blue-400' },
      { label: 'In Progress', value: tasks.filter((t) => t.status === 'In Progress').length, color: 'text-amber-400' },
      { label: 'In Review', value: tasks.filter((t) => t.status === 'In Review').length, color: 'text-purple-400' },
      { label: 'Done', value: tasks.filter((t) => t.status === 'Done').length, color: 'text-emerald-400' },
    ]
  }, [tasks])

  const timelineTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
      const first = new Date(a.due).getTime()
      const second = new Date(b.due).getTime()
      return (Number.isNaN(first) ? Number.MAX_SAFE_INTEGER : first) -
        (Number.isNaN(second) ? Number.MAX_SAFE_INTEGER : second)
    })
  }, [filteredTasks])

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href)
      showToast('Board URL copied to clipboard')
    } else {
      showToast('Board link ready to share')
    }
  }

  return (
    <MainLayout>
      <div className="flex flex-col gap-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 border-b border-jira-border pb-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-jira-muted">
              <span>Software Team</span>
              <span>/</span>
              <span className="text-jira-text">QAR Sprint Board</span>
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">
              QA Sprint Board (Sprint 24.4)
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilterBar(!showFilterBar)}
              className={`btn-ghost text-xs ${showFilterBar ? 'border-jira-blue text-white' : ''}`}
            >
              <Filter size={14} />
              Filter {selectedPriority !== 'All' || selectedOwner !== 'All' ? '(Active)' : ''}
            </button>
            <button
              onClick={handleShare}
              className="btn-ghost text-xs"
            >
              <Share2 size={14} />
              Share
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="btn-primary text-xs"
            >
              <Plus size={14} />
              Create issue
            </button>
          </div>
        </div>

        {/* Filter bar toggle */}
        {showFilterBar && (
          <div className="flex flex-wrap items-center gap-4 rounded-lg border border-jira-border bg-jira-surface/80 p-3 text-xs animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="text-jira-muted font-medium">Priority:</span>
              {['All', 'Critical', 'High', 'Medium', 'Low'].map((p) => (
                <button
                  key={p}
                  onClick={() => setSelectedPriority(p)}
                  className={`rounded px-2 py-1 text-xs transition ${
                    selectedPriority === p
                      ? 'bg-jira-blue text-white font-semibold'
                      : 'bg-jira-surface-2 text-jira-muted hover:text-white'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            <div className="h-4 w-px bg-jira-border" />

            <div className="flex items-center gap-2">
              <span className="text-jira-muted font-medium">Assignee:</span>
              {['All', 'QA Tester', 'QA Lead', 'Developer', 'Security'].map((o) => (
                <button
                  key={o}
                  onClick={() => setSelectedOwner(o)}
                  className={`rounded px-2 py-1 text-xs transition ${
                    selectedOwner === o
                      ? 'bg-jira-blue text-white font-semibold'
                      : 'bg-jira-surface-2 text-jira-muted hover:text-white'
                  }`}
                >
                  {o}
                </button>
              ))}
            </div>

            {(selectedPriority !== 'All' || selectedOwner !== 'All') && (
              <button
                onClick={() => {
                  setSelectedPriority('All')
                  setSelectedOwner('All')
                }}
                className="ml-auto text-xs text-blue-400 hover:underline"
              >
                Reset filters
              </button>
            )}
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
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
            {['Board', 'List', 'Timeline'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded px-3 py-1.5 transition ${
                  activeTab === tab
                    ? 'bg-jira-surface text-white border border-jira-border'
                    : 'text-jira-muted hover:bg-jira-surface/50 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs text-jira-muted">
            <span>Showing {filteredTasks.length} of {tasks.length} issues</span>
          </div>
        </div>

        {/* Tab View Render */}
        {activeTab === 'Board' && <KanbanBoard columns={columns} />}

        {activeTab === 'List' && (
          <div className="overflow-x-auto rounded-lg border border-jira-border bg-jira-surface/40">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-jira-border bg-jira-surface-2 text-[11px] font-bold uppercase tracking-wider text-jira-muted">
                <tr>
                  <th className="px-4 py-3">Key</th>
                  <th className="px-4 py-3">Summary</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Assignee</th>
                  <th className="px-4 py-3">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-jira-border/60">
                {filteredTasks.map((t) => (
                  <tr key={t.id} className="table-row">
                    <td className="px-4 py-3 font-mono font-semibold text-jira-blue">{t.id}</td>
                    <td className="px-4 py-3 font-medium text-white">{t.title}</td>
                    <td className="px-4 py-3">{t.status}</td>
                    <td className="px-4 py-3 font-semibold">{t.priority}</td>
                    <td className="px-4 py-3 text-jira-text">{t.owner}</td>
                    <td className="px-4 py-3 text-jira-muted">{t.due}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'Timeline' && (
          <div className="rounded-lg border border-jira-border bg-jira-surface/40 p-5">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-jira-surface-2 text-jira-muted">
                <Calendar size={18} />
              </div>
              <div>
                <p className="font-semibold text-white">Sprint 24.4 Timeline</p>
                <p className="mt-1 text-xs text-jira-muted">Scheduled: Oct 1, 2026 - Oct 28, 2026</p>
              </div>
            </div>
            {timelineTasks.length === 0 ? (
              <p className="py-8 text-center text-xs text-jira-muted">No scheduled issues match the current filters.</p>
            ) : (
              <div className="space-y-3">
                {timelineTasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-3 rounded-md border border-jira-border/60 bg-jira-surface-2/40 p-3">
                    <Clock size={14} className="shrink-0 text-jira-blue" />
                    <span className="w-24 shrink-0 font-mono text-[11px] font-semibold text-jira-blue">{task.id}</span>
                    <span className="min-w-0 flex-1 truncate text-xs text-white">{task.title}</span>
                    <span className="shrink-0 text-[11px] text-jira-muted">{task.due || 'No due date'}</span>
                    <span className="shrink-0 rounded bg-jira-surface-3 px-2 py-0.5 text-[10px] text-jira-text">{task.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  )
}

export default HomePage
