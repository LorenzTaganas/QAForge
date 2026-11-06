import { useMemo, useState } from 'react'
import { CheckCircle2, Circle, Layers3, List, Plus, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import MainLayout from '../components/layout/MainLayout'
import PageHeader from '../components/ui/PageHeader'
import EmptyState from '../components/ui/EmptyState'
import { PriorityBadge } from '../components/ui/Badges'
import KanbanBoard from '../components/kanban/KanbanBoard'
import { useQA } from '../context/useQA'
import { belongsToProject } from '../utils/projectScope'

const statuses = ['To Do', 'In Progress', 'In Review', 'Done']
const priorities = ['Critical', 'High', 'Medium', 'Low']

const BacklogPage = () => {
  const {
    tasks, sprints, selectedProjectKey, updateTaskStatus, updateIssue,
    openCreateModal, searchQuery, setSearchQuery, hydrating,
  } = useQA()
  const [statusFilter, setStatusFilter] = useState('All')
  const [priorityFilter, setPriorityFilter] = useState('All')
  const [sprintFilter, setSprintFilter] = useState('All')
  const [view, setView] = useState(() => localStorage.getItem('qaforge-backlog-view') || 'Board')

  const projectTasks = useMemo(
    () => tasks.filter((task) => belongsToProject(task, selectedProjectKey)),
    [selectedProjectKey, tasks],
  )
  const projectSprints = useMemo(
    () => sprints.filter((sprint) => belongsToProject(sprint, selectedProjectKey)),
    [selectedProjectKey, sprints],
  )
  const activeSprint = projectSprints.find((sprint) => sprint.status === 'Active')

  const visibleTasks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return projectTasks.filter((task) => (
      (!query || task.id.toLowerCase().includes(query) || task.title.toLowerCase().includes(query)) &&
      (statusFilter === 'All' || task.status === statusFilter) &&
      (priorityFilter === 'All' || task.priority === priorityFilter) &&
      (sprintFilter === 'All' || (sprintFilter === 'Unassigned' ? !task.sprintId : task.sprintId === sprintFilter))
    ))
  }, [priorityFilter, projectTasks, searchQuery, sprintFilter, statusFilter])

  const columns = useMemo(
    () => statuses.map((name) => ({ name, tasks: visibleTasks.filter((task) => task.status === name) })),
    [visibleTasks],
  )

  const changeView = (nextView) => {
    setView(nextView)
    localStorage.setItem('qaforge-backlog-view', nextView)
  }

  const filtersActive = statusFilter !== 'All' || priorityFilter !== 'All' || sprintFilter !== 'All' || Boolean(searchQuery)

  return (
    <MainLayout>
      <div className="mx-auto flex max-w-[1400px] flex-col gap-5">
        <PageHeader
          eyebrow={`${selectedProjectKey} · Planning`}
          title="Backlog"
          description="Plan, prioritize, and move quality work into the active sprint."
          actions={(
            <button type="button" onClick={() => openCreateModal('Task')} className="btn-primary text-xs">
              <Plus size={14} /> Create issue
            </button>
          )}
        />

        <div className="flex flex-col gap-3 rounded-lg border border-qf-border bg-qf-surface p-3 lg:flex-row lg:items-center">
          <label className="relative flex-1">
            <Search size={14} className="absolute left-3 top-2.5 text-qf-muted" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search backlog by key or title"
              aria-label="Search backlog"
              className="input-field pl-9 text-xs"
            />
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="input-field w-auto py-1.5 text-xs" aria-label="Filter by status">
              <option value="All">All statuses</option>
              {statuses.map((status) => <option key={status}>{status}</option>)}
            </select>
            <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)} className="input-field w-auto py-1.5 text-xs" aria-label="Filter by priority">
              <option value="All">All priorities</option>
              {priorities.map((priority) => <option key={priority}>{priority}</option>)}
            </select>
            <select value={sprintFilter} onChange={(event) => setSprintFilter(event.target.value)} className="input-field w-auto py-1.5 text-xs" aria-label="Filter by sprint">
              <option value="All">All sprints</option>
              <option value="Unassigned">Unassigned</option>
              {projectSprints.map((sprint) => <option key={sprint.id} value={sprint.id}>{sprint.name}</option>)}
            </select>
            {filtersActive && (
              <button type="button" onClick={() => { setStatusFilter('All'); setPriorityFilter('All'); setSprintFilter('All'); setSearchQuery('') }} className="text-[11px] text-qf-info hover:underline">
                Reset
              </button>
            )}
            <div className="flex rounded-md border border-qf-border bg-qf-card p-0.5">
              <button type="button" onClick={() => changeView('Board')} className={`rounded px-2 py-1 ${view === 'Board' ? 'bg-qf-primary/20 text-qf-text' : 'text-qf-muted hover:text-qf-text'}`} aria-label="Board view" aria-pressed={view === 'Board'}><Layers3 size={14} /></button>
              <button type="button" onClick={() => changeView('List')} className={`rounded px-2 py-1 ${view === 'List' ? 'bg-qf-primary/20 text-qf-text' : 'text-qf-muted hover:text-qf-text'}`} aria-label="List view" aria-pressed={view === 'List'}><List size={14} /></button>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-4">
          {statuses.map((status) => (
            <div key={status} className="rounded-lg border border-qf-border bg-qf-surface p-4">
              <p className="text-xs text-qf-muted">{status}</p>
              <p className="mt-1.5 text-2xl font-semibold text-qf-text">{projectTasks.filter((task) => task.status === status).length}</p>
            </div>
          ))}
        </div>

        {hydrating ? (
          <p className="rounded-lg border border-qf-border bg-qf-surface p-8 text-center text-sm text-qf-muted">Loading backlog…</p>
        ) : view === 'Board' ? (
          <section className="min-h-[420px] overflow-x-auto rounded-lg border border-qf-border bg-qf-surface p-3">
            {visibleTasks.length === 0 ? (
              <EmptyState
                icon={Layers3}
                title={projectTasks.length ? 'No issues match these filters' : 'The backlog is empty'}
                description={projectTasks.length ? 'Adjust or reset the filters to see more work.' : 'Create an issue to start planning this project.'}
                action={projectTasks.length ? null : <button type="button" onClick={() => openCreateModal('Task')} className="btn-primary text-xs"><Plus size={14} /> Create issue</button>}
              />
            ) : <KanbanBoard columns={columns} />}
          </section>
        ) : (
          <section className="overflow-hidden rounded-lg border border-qf-border bg-qf-surface">
            <div className="flex items-center gap-2 border-b border-qf-border px-4 py-3 text-xs text-qf-muted">
              <List size={14} /> {visibleTasks.length} issues
              {activeSprint && <span className="ml-auto text-qf-info">Active sprint: {activeSprint.name}</span>}
            </div>
            {visibleTasks.length === 0 ? (
              <p className="p-8 text-center text-sm text-qf-muted">No backlog issues match the current filters.</p>
            ) : (
              <ul className="divide-y divide-qf-border">
                {visibleTasks.map((task) => (
                  <li key={task.id} className="flex flex-col gap-3 px-4 py-3.5 lg:flex-row lg:items-center">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      {task.status === 'Done' ? <CheckCircle2 size={16} className="shrink-0 text-qf-success" /> : <Circle size={16} className="shrink-0 text-qf-info" />}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Link to={`/issues/${task.id}`} className="font-mono text-[11px] font-semibold text-qf-info hover:underline">{task.id}</Link>
                          <PriorityBadge priority={task.priority} />
                        </div>
                        <Link to={`/issues/${task.id}`} className="mt-0.5 block truncate text-sm font-medium text-qf-text hover:text-white">{task.title}</Link>
                        <span className="mt-0.5 block text-[11px] text-qf-muted">{task.owner || 'Unassigned'} · {projectSprints.find((sprint) => sprint.id === task.sprintId)?.name || 'No sprint'}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                      <select value={task.status} onChange={(event) => updateTaskStatus(task.id, event.target.value)} className="input-field w-auto py-1.5 text-xs" aria-label={`Status for ${task.id}`}>
                        {statuses.map((status) => <option key={status}>{status}</option>)}
                      </select>
                      <select value={task.sprintId || ''} onChange={(event) => updateIssue(task.id, { sprintId: event.target.value || undefined })} className="input-field w-auto py-1.5 text-xs" aria-label={`Sprint for ${task.id}`}>
                        <option value="">No sprint</option>
                        {projectSprints.map((sprint) => <option key={sprint.id} value={sprint.id}>{sprint.name}</option>)}
                      </select>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>
    </MainLayout>
  )
}

export default BacklogPage
