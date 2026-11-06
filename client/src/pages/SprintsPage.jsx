import { useMemo, useState } from 'react'
import { CheckCircle2, Circle, ExternalLink, Play, StopCircle, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import MainLayout from '../components/layout/MainLayout'
import PageHeader from '../components/ui/PageHeader'
import EmptyState from '../components/ui/EmptyState'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { Badge } from '../components/ui/Badges'
import { useQA } from '../context/useQA'
import { useAuth } from '../context/AuthContext'
import { canManageSprints } from '../utils/permissions'
import { belongsToProject } from '../utils/projectScope'

const taskStatuses = ['To Do', 'In Progress', 'In Review', 'Done']

const SprintsPage = () => {
  const { sprints, tasks, selectedProjectKey, updateSprint, updateIssue, deleteSprint, hydrating } = useQA()
  const { user } = useAuth()
  const canManage = canManageSprints(user?.role)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const projectSprints = useMemo(
    () => sprints.filter((sprint) => belongsToProject(sprint, selectedProjectKey)),
    [selectedProjectKey, sprints],
  )
  const activeSprint = projectSprints.find((sprint) => sprint.status === 'Active') || projectSprints[0]
  const sprintTasks = useMemo(
    () => (activeSprint
      ? tasks.filter((task) => task.sprintId === activeSprint.id && belongsToProject(task, selectedProjectKey))
      : []),
    [activeSprint, selectedProjectKey, tasks],
  )
  const doneCount = sprintTasks.filter((task) => task.status === 'Done').length
  const progress = sprintTasks.length ? Math.round((doneCount / sprintTasks.length) * 100) : 0

  const confirmDelete = async () => {
    if (!pendingDelete) return
    setDeleting(true)
    await deleteSprint(pendingDelete.id)
    setDeleting(false)
    setPendingDelete(null)
  }

  if (hydrating && !activeSprint) {
    return <MainLayout><div className="p-8 text-center text-sm text-qf-muted">Loading sprints…</div></MainLayout>
  }

  if (!activeSprint) {
    return (
      <MainLayout>
        <div className="mx-auto max-w-[1000px]">
          <PageHeader eyebrow={`${selectedProjectKey} · Planning`} title="Sprints" description="Plan work, start iterations, and close completed QA cycles." />
          <div className="rounded-lg border border-qf-border bg-qf-surface">
            <EmptyState
              icon={Play}
              title="No sprints in this project"
              description="Create a sprint from the Projects page, then assign issues to it."
              action={<Link to="/projects" className="btn-primary text-xs">Open projects</Link>}
            />
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="mx-auto flex max-w-[1400px] flex-col gap-5">
        <PageHeader
          eyebrow={`${selectedProjectKey} · Planning`}
          title="Sprints"
          description="Plan work, start iterations, and close completed QA cycles."
          actions={canManage && (
            activeSprint.status === 'Active'
              ? <button type="button" onClick={() => updateSprint(activeSprint.id, { status: 'Completed' })} className="btn-ghost text-xs"><StopCircle size={14} /> Complete sprint</button>
              : <button type="button" onClick={() => updateSprint(activeSprint.id, { status: 'Active' })} className="btn-primary text-xs"><Play size={14} /> Start sprint</button>
          )}
        />

        <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
          <section className="rounded-lg border border-qf-border bg-qf-surface p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-mono text-[11px] text-qf-info">{activeSprint.id}</p>
                <h2 className="mt-1 text-xl font-semibold text-qf-text">{activeSprint.name}</h2>
                <p className="mt-1.5 text-sm text-qf-muted">{activeSprint.goal || 'No sprint goal set.'}</p>
              </div>
              <Badge tone={activeSprint.status === 'Active' ? 'green' : activeSprint.status === 'Completed' ? 'gray' : 'neutral'}>{activeSprint.status}</Badge>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg bg-qf-card p-3"><p className="text-xs text-qf-muted">Issues</p><p className="mt-1 text-lg font-semibold text-qf-text">{sprintTasks.length}</p></div>
              <div className="rounded-lg bg-qf-card p-3"><p className="text-xs text-qf-muted">Completed</p><p className="mt-1 text-lg font-semibold text-qf-success">{doneCount}</p></div>
              <div className="rounded-lg bg-qf-card p-3"><p className="text-xs text-qf-muted">Dates</p><p className="mt-1 text-xs text-qf-text">{activeSprint.start || '—'} → {activeSprint.end || '—'}</p></div>
            </div>

            {sprintTasks.length > 0 && (
              <div className="mt-4">
                <div className="mb-1 flex justify-between text-[11px] text-qf-muted"><span>Sprint progress</span><span>{progress}%</span></div>
                <div className="h-1.5 overflow-hidden rounded-full bg-qf-card">
                  <div className="h-full rounded-full bg-qf-primary transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}
          </section>

          <aside className="rounded-lg border border-qf-border bg-qf-surface p-4">
            <h2 className="text-sm font-semibold text-qf-text">All sprints</h2>
            <ul className="mt-3 space-y-2">
              {projectSprints.map((sprint) => (
                <li key={sprint.id} className={`rounded-md border p-2.5 text-xs ${sprint.id === activeSprint.id ? 'border-qf-primary/50 bg-qf-primary/10' : 'border-qf-border bg-qf-card'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="min-w-0 truncate font-medium text-qf-text">{sprint.name}</span>
                    <Badge tone={sprint.status === 'Active' ? 'green' : sprint.status === 'Completed' ? 'gray' : 'neutral'}>{sprint.status}</Badge>
                  </div>
                  {canManage && (
                    <div className="mt-2 flex items-center justify-end gap-1">
                      {sprint.status !== 'Active' && (
                        <button type="button" onClick={() => updateSprint(sprint.id, { status: 'Active' })} className="btn-ghost px-1.5 py-1 text-[10px]"><Play size={11} /> Start</button>
                      )}
                      <button type="button" onClick={() => setPendingDelete(sprint)} className="rounded p-1 text-qf-muted hover:text-qf-danger" aria-label={`Delete ${sprint.name}`}><Trash2 size={12} /></button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </aside>
        </div>

        <section className="overflow-hidden rounded-lg border border-qf-border bg-qf-surface">
          <div className="flex items-center justify-between border-b border-qf-border px-5 py-4">
            <h2 className="font-semibold text-qf-text">Sprint work</h2>
            <Link to="/backlog" className="inline-flex items-center gap-1.5 text-xs text-qf-info hover:underline">Open backlog <ExternalLink size={13} /></Link>
          </div>
          <div className="divide-y divide-qf-border">
            {sprintTasks.length ? sprintTasks.map((task) => (
              <div key={task.id} className="flex flex-col gap-3 px-5 py-3.5 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  {task.status === 'Done' ? <CheckCircle2 size={16} className="shrink-0 text-qf-success" /> : <Circle size={16} className="shrink-0 text-qf-info" />}
                  <div className="min-w-0">
                    <Link to={`/issues/${task.id}`} className="font-mono text-[11px] text-qf-info hover:underline">{task.id}</Link>
                    <p className="mt-0.5 truncate text-sm text-qf-text">{task.title}</p>
                  </div>
                </div>
                <select value={task.status} onChange={(event) => updateIssue(task.id, { status: event.target.value })} className="input-field w-auto py-1.5 text-xs" aria-label={`Status for ${task.id}`}>
                  {taskStatuses.map((status) => <option key={status}>{status}</option>)}
                </select>
              </div>
            )) : <p className="p-8 text-center text-sm text-qf-muted">No issues are assigned to this sprint. Assign one from an issue detail page or the backlog.</p>}
          </div>
        </section>

        <p className="text-xs text-qf-muted">Sprint assignment is available from issue details and the backlog list.</p>
      </div>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={`Delete ${pendingDelete?.name || 'sprint'}?`}
        description="Issues assigned to this sprint return to the backlog. Their history is not deleted."
        confirmLabel="Delete sprint"
        busy={deleting}
        onConfirm={confirmDelete}
        onClose={() => setPendingDelete(null)}
      />
    </MainLayout>
  )
}

export default SprintsPage
