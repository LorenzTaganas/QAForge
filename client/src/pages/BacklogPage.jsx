import { useMemo, useState } from 'react'
import { CheckCircle2, Circle, Filter, Layers3, List, Plus, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import MainLayout from '../components/layout/MainLayout'
import KanbanBoard from '../components/kanban/KanbanBoard'
import { useQA } from '../context/QAContext'

const statuses = ['To Do', 'In Progress', 'In Review', 'Done']

const BacklogPage = () => {
  const { tasks, updateTaskStatus, setIsCreateModalOpen, searchQuery } = useQA()
  const [statusFilter, setStatusFilter] = useState('All')
  const [priorityFilter, setPriorityFilter] = useState('All')
  const [view, setView] = useState('Board')
  const visibleTasks = useMemo(() => tasks.filter((task) => {
    const query = searchQuery.toLowerCase()
    return (!query || task.id.toLowerCase().includes(query) || task.title.toLowerCase().includes(query)) &&
      (statusFilter === 'All' || task.status === statusFilter) &&
      (priorityFilter === 'All' || task.priority === priorityFilter)
  }), [searchQuery, statusFilter, priorityFilter, tasks])
  const columns = useMemo(
    () => statuses.map((name) => ({ name, tasks: visibleTasks.filter((task) => task.status === name) })),
    [visibleTasks],
  )

  return (
    <MainLayout>
      <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
        <div className="flex flex-col gap-4 border-b border-[#20283A] pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="section-title">QAForge Core / Issues</p><h1 className="mt-1 section-heading text-white">Backlog</h1><p className="mt-2 text-sm text-jira-muted">Plan, prioritize, and move quality work into an active sprint.</p></div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setStatusFilter(statusFilter === 'All' ? 'To Do' : 'All')} className="dashboard-action"><Filter size={14} /> {statusFilter === 'All' ? 'Filter' : statusFilter}</button>
            <button onClick={() => setPriorityFilter(priorityFilter === 'All' ? 'High' : 'All')} className="dashboard-action">{priorityFilter === 'All' ? 'Priority' : priorityFilter}</button>
            <div className="flex rounded-md border border-[#2B3345] bg-[#171B25] p-0.5">
              <button onClick={() => setView('Board')} className={`rounded px-2 py-1.5 ${view === 'Board' ? 'bg-[#263A5D] text-white' : 'text-[#78849A]'}`} aria-label="Board view"><Layers3 size={14} /></button>
              <button onClick={() => setView('List')} className={`rounded px-2 py-1.5 ${view === 'List' ? 'bg-[#263A5D] text-white' : 'text-[#78849A]'}`} aria-label="List view"><List size={14} /></button>
            </div>
            <button onClick={() => setIsCreateModalOpen(true)} className="dashboard-primary"><Plus size={14} /> Create issue</button>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-4">{statuses.map((status) => <div key={status} className="dashboard-card p-4"><p className="text-xs text-jira-muted">{status}</p><p className="mt-2 text-2xl font-semibold text-white">{tasks.filter((task) => task.status === status).length}</p></div>)}</div>
        {view === 'Board' ? (
          <section className="min-h-[420px] overflow-x-auto rounded-xl border border-[#20283A] bg-[#111722] p-3">
            <KanbanBoard columns={columns} />
          </section>
        ) : <section className="dashboard-card overflow-hidden">
          <div className="flex items-center gap-2 border-b border-[#242D40] px-4 py-3 text-xs text-jira-muted"><Search size={14} /> {visibleTasks.length} issues in backlog</div>
          <div className="divide-y divide-[#242D40]">{visibleTasks.map((task) => <div key={task.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center"><div className="flex min-w-0 flex-1 items-center gap-3">{task.status === 'Done' ? <CheckCircle2 size={17} className="shrink-0 text-[#49C2B1]" /> : <Circle size={17} className="shrink-0 text-[#6EA8FF]" />}<div className="min-w-0"><Link to={`/issues/${task.id}`} className="font-mono text-[11px] font-semibold text-[#6EA8FF] hover:underline">{task.id}</Link><Link to={`/issues/${task.id}`} className="mt-1 block truncate text-sm font-medium text-white hover:text-[#B7D5FF]">{task.title}</Link></div></div><div className="flex items-center gap-3 sm:w-64 sm:justify-end"><span className="text-xs text-[#FFB454]">{task.priority}</span><select value={task.status} onChange={(event) => updateTaskStatus(task.id, event.target.value)} className="input-field w-auto py-1.5 text-xs">{statuses.map((option) => <option key={option}>{option}</option>)}</select></div></div>)}</div>
          {!visibleTasks.length && <p className="p-8 text-center text-sm text-jira-muted">No backlog issues match the current filters.</p>}
        </section>}
      </div>
    </MainLayout>
  )
}

export default BacklogPage
