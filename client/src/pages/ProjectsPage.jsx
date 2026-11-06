import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, FolderKanban, Pencil, Play, Plus, Rocket, Target, Trash2, Users, Zap } from 'lucide-react'
import MainLayout from '../components/layout/MainLayout'
import PageHeader from '../components/ui/PageHeader'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { Badge } from '../components/ui/Badges'
import { useQA } from '../context/useQA'
import { useAuth } from '../context/AuthContext'
import { canManageProjects, canManageSprints } from '../utils/permissions'
import { belongsToProject } from '../utils/projectScope'

const epicColors = ['#7C6CF2', '#59A8F5', '#35B77A', '#E7A94B', '#F06B70']
const projectStatuses = ['Active', 'Archived']

const emptyProjectDraft = { name: '', description: '', lead: '', category: 'Software', status: 'Active' }

const ProjectsPage = () => {
  const {
    projects, epics, sprints, tasks, bugs, testCases, requirements,
    selectedProjectKey, setSelectedProjectKey, addProject, updateProject, deleteProject,
    addEpic, updateEpic, deleteEpic, addSprint, updateSprint, deleteSprint, showToast, hydrating,
  } = useQA()
  const { user } = useAuth()
  const navigate = useNavigate()
  const canManageProjectSettings = canManageProjects(user?.role)
  const canAddSprint = canManageSprints(user?.role)

  const [showProjectForm, setShowProjectForm] = useState(false)
  const [projectDraft, setProjectDraft] = useState({ name: '', key: '' })
  const [editingKey, setEditingKey] = useState(null)
  const [editDraft, setEditDraft] = useState(emptyProjectDraft)

  const [showEpicForm, setShowEpicForm] = useState(false)
  const [epicTitle, setEpicTitle] = useState('')
  const [showSprintForm, setShowSprintForm] = useState(false)
  const [sprintDraft, setSprintDraft] = useState({ name: '', goal: '', start: '', end: '' })

  const [pendingDeletion, setPendingDeletion] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const currentProject = projects.find((project) => project.key === selectedProjectKey)
  const projectEpics = epics.filter((epic) => (epic.projectKey || 'QAR') === selectedProjectKey)
  const projectSprints = sprints.filter((sprint) => (sprint.projectKey || 'QAR') === selectedProjectKey)

  const countsByProject = useMemo(() => Object.fromEntries(projects.map((project) => {
    const key = project.key
    return [key, {
      tasks: tasks.filter((task) => belongsToProject(task, key)).length,
      bugs: bugs.filter((bug) => belongsToProject(bug, key)).length,
      tests: testCases.filter((test) => belongsToProject(test, key)).length,
      requirements: requirements.filter((requirement) => belongsToProject(requirement, key)).length,
    }]
  })), [bugs, projects, requirements, tasks, testCases])

  const createProject = async (event) => {
    event.preventDefault()
    if (!projectDraft.name.trim() || !projectDraft.key.trim()) {
      showToast('Project name and key are required')
      return
    }
    const created = await addProject({
      name: projectDraft.name.trim(),
      key: projectDraft.key.trim().toUpperCase(),
      lead: user?.name || 'You',
      category: 'Software',
      description: '',
    })
    if (created) {
      setProjectDraft({ name: '', key: '' })
      setShowProjectForm(false)
      setSelectedProjectKey(created.key)
    }
  }

  const startEditing = (project) => {
    setEditingKey(project.key)
    setEditDraft({
      name: project.name || '',
      description: project.description || '',
      lead: project.lead || '',
      category: project.category || 'Software',
      status: project.status || 'Active',
    })
  }

  const saveProject = async (event) => {
    event.preventDefault()
    if (!editDraft.name.trim()) {
      showToast('Project name is required')
      return
    }
    const updated = await updateProject(editingKey, {
      name: editDraft.name.trim(),
      description: editDraft.description.trim(),
      lead: editDraft.lead.trim(),
      category: editDraft.category.trim() || 'Software',
      status: editDraft.status,
    })
    if (updated) setEditingKey(null)
  }

  const createEpic = async (event) => {
    event.preventDefault()
    if (!epicTitle.trim()) return
    await addEpic({
      title: epicTitle.trim(),
      projectKey: selectedProjectKey,
      owner: user?.name || 'You',
      color: epicColors[projectEpics.length % epicColors.length],
    })
    setEpicTitle('')
    setShowEpicForm(false)
  }

  const createSprint = async (event) => {
    event.preventDefault()
    if (!sprintDraft.name.trim()) {
      showToast('Sprint name is required')
      return
    }
    const created = await addSprint({
      name: sprintDraft.name.trim(),
      goal: sprintDraft.goal.trim(),
      start: sprintDraft.start,
      end: sprintDraft.end,
      projectKey: selectedProjectKey,
    })
    if (created) {
      setSprintDraft({ name: '', goal: '', start: '', end: '' })
      setShowSprintForm(false)
    }
  }

  const confirmDeletion = async () => {
    if (!pendingDeletion) return
    setDeleting(true)
    if (pendingDeletion.type === 'project') await deleteProject(pendingDeletion.item.key)
    if (pendingDeletion.type === 'epic') await deleteEpic(pendingDeletion.item.id)
    if (pendingDeletion.type === 'sprint') await deleteSprint(pendingDeletion.item.id)
    setDeleting(false)
    setPendingDeletion(null)
  }

  return (
    <MainLayout>
      <div className="mx-auto flex max-w-[1400px] flex-col gap-5">
        <PageHeader
          eyebrow="Workspace"
          title="Projects"
          description="Every project keeps its own issues, tests, defects, and reporting scope."
          actions={canManageProjectSettings && (
            <button type="button" onClick={() => setShowProjectForm((value) => !value)} className="btn-primary text-xs">
              <Plus size={14} /> New project
            </button>
          )}
        />

        {showProjectForm && canManageProjectSettings && (
          <form onSubmit={createProject} className="grid gap-3 rounded-lg border border-qf-primary/40 bg-qf-surface p-4 sm:grid-cols-[1fr_8rem_auto]">
            <input className="input-field" placeholder="Project name" maxLength={120} value={projectDraft.name} onChange={(event) => setProjectDraft((previous) => ({ ...previous, name: event.target.value }))} />
            <input className="input-field font-mono uppercase text-qf-primary" placeholder="KEY" maxLength={10} value={projectDraft.key} onChange={(event) => setProjectDraft((previous) => ({ ...previous, key: event.target.value }))} />
            <button className="btn-primary text-xs">Create project</button>
          </form>
        )}

        {hydrating && projects.length === 0 ? (
          <p className="rounded-lg border border-qf-border bg-qf-surface p-8 text-center text-sm text-qf-muted">Loading projects…</p>
        ) : projects.length === 0 ? (
          <p className="rounded-lg border border-dashed border-qf-border bg-qf-surface p-8 text-center text-sm text-qf-muted">No projects yet. Create one to start tracking work.</p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {projects.map((project) => {
              const counts = countsByProject[project.key] || { tasks: 0, bugs: 0, tests: 0, requirements: 0 }
              const isSelected = project.key === selectedProjectKey
              return (
                <article key={project.id} className={`rounded-lg border bg-qf-surface transition ${isSelected ? 'border-qf-primary/60' : 'border-qf-border hover:border-qf-border-strong'}`}>
                  <div className="flex items-start justify-between gap-3 p-5">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-qf-primary/12 text-qf-primary"><FolderKanban size={20} /></span>
                      <div className="min-w-0">
                        <h2 className="truncate font-semibold text-qf-text">{project.name}</h2>
                        <p className="mt-0.5 flex items-center gap-2 font-mono text-[11px] text-qf-primary">
                          {project.key}
                          {isSelected && <Badge tone="purple">Current</Badge>}
                        </p>
                      </div>
                    </div>
                    <Badge tone={project.status === 'Archived' ? 'muted' : 'green'}>{project.status || 'Active'}</Badge>
                  </div>

                  {editingKey === project.key ? (
                    <form onSubmit={saveProject} className="space-y-3 border-t border-qf-border p-5">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="block sm:col-span-2">
                          <span className="mb-1 block text-[11px] text-qf-muted">Name</span>
                          <input className="input-field py-1.5 text-xs" value={editDraft.name} onChange={(event) => setEditDraft((previous) => ({ ...previous, name: event.target.value }))} />
                        </label>
                        <label className="block">
                          <span className="mb-1 block text-[11px] text-qf-muted">Lead</span>
                          <input className="input-field py-1.5 text-xs" value={editDraft.lead} onChange={(event) => setEditDraft((previous) => ({ ...previous, lead: event.target.value }))} />
                        </label>
                        <label className="block">
                          <span className="mb-1 block text-[11px] text-qf-muted">Category</span>
                          <input className="input-field py-1.5 text-xs" value={editDraft.category} onChange={(event) => setEditDraft((previous) => ({ ...previous, category: event.target.value }))} />
                        </label>
                        <label className="block sm:col-span-2">
                          <span className="mb-1 block text-[11px] text-qf-muted">Description</span>
                          <textarea rows={2} className="input-field resize-none py-1.5 text-xs" value={editDraft.description} onChange={(event) => setEditDraft((previous) => ({ ...previous, description: event.target.value }))} />
                        </label>
                        <label className="block">
                          <span className="mb-1 block text-[11px] text-qf-muted">Status</span>
                          <select className="input-field py-1.5 text-xs" value={editDraft.status} onChange={(event) => setEditDraft((previous) => ({ ...previous, status: event.target.value }))}>
                            {projectStatuses.map((status) => <option key={status}>{status}</option>)}
                          </select>
                        </label>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setEditingKey(null)} className="btn-ghost text-xs">Cancel</button>
                        <button type="submit" className="btn-primary text-xs">Save</button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <p className="min-h-[2.5rem] px-5 text-sm text-qf-secondary">{project.description || 'No description yet.'}</p>
                      <div className="flex flex-wrap items-center gap-2 px-5 pt-3">
                        <span className="flex items-center gap-1.5 text-[11px] text-qf-muted"><Users size={12} /> {project.lead || 'Unassigned'}</span>
                        <Badge tone="muted">{counts.tasks} issues</Badge>
                        <Badge tone="muted">{counts.tests} tests</Badge>
                        <Badge tone="red">{counts.bugs} defects</Badge>
                        <Badge tone="muted">{counts.requirements} requirements</Badge>
                      </div>
                      <div className="mt-4 flex items-center justify-between gap-2 border-t border-qf-border px-5 py-3">
                        <button
                          type="button"
                          onClick={() => { setSelectedProjectKey(project.key); navigate('/issues') }}
                          className="btn-ghost text-xs"
                        >
                          Open issues
                        </button>
                        {canManageProjectSettings && (
                          <div className="flex items-center gap-1">
                            <button type="button" onClick={() => startEditing(project)} className="rounded p-1.5 text-qf-muted hover:bg-qf-card hover:text-qf-text" aria-label={`Edit ${project.name}`}><Pencil size={14} /></button>
                            <button type="button" onClick={() => setPendingDeletion({ type: 'project', item: project })} className="rounded p-1.5 text-qf-muted hover:bg-qf-card hover:text-qf-danger" aria-label={`Delete ${project.name}`}><Trash2 size={14} /></button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </article>
              )
            })}
          </div>
        )}

        {currentProject && (
          <div className="grid gap-4 lg:grid-cols-2">
            <section className="rounded-lg border border-qf-border bg-qf-surface">
              <div className="flex items-center justify-between gap-2 border-b border-qf-border px-5 py-4">
                <div className="flex items-center gap-2">
                  <Target size={16} className="text-qf-primary" />
                  <div>
                    <h2 className="text-sm font-semibold text-qf-text">Epics</h2>
                    <p className="mt-0.5 text-[11px] text-qf-muted">{selectedProjectKey} · {projectEpics.length} total</p>
                  </div>
                </div>
                {canManageProjectSettings && (
                  <button type="button" onClick={() => setShowEpicForm((value) => !value)} className="btn-ghost text-xs"><Plus size={13} /> Add</button>
                )}
              </div>

              {showEpicForm && (
                <form onSubmit={createEpic} className="flex gap-2 border-b border-qf-border p-4">
                  <input autoFocus className="input-field py-1.5 text-xs" placeholder="Epic title" maxLength={120} value={epicTitle} onChange={(event) => setEpicTitle(event.target.value)} />
                  <button className="btn-primary text-xs">Create</button>
                </form>
              )}

              <ul className="divide-y divide-qf-border">
                {projectEpics.map((epic) => (
                  <li key={epic.id} className="flex items-center gap-2 px-4 py-3">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: epic.color || '#7C6CF2' }} />
                    <span className="min-w-0 flex-1 truncate text-sm text-qf-text">{epic.title}</span>
                    <select value={epic.status} onChange={(event) => updateEpic(epic.id, { status: event.target.value })} className="input-field w-auto py-1 text-[11px]" aria-label={`Status for ${epic.title}`}>
                      {['To Do', 'In Progress', 'Done'].map((status) => <option key={status}>{status}</option>)}
                    </select>
                    {canManageProjectSettings && (
                      <button type="button" onClick={() => setPendingDeletion({ type: 'epic', item: epic })} className="rounded p-1 text-qf-muted hover:text-qf-danger" aria-label={`Delete ${epic.title}`}><Trash2 size={13} /></button>
                    )}
                  </li>
                ))}
                {projectEpics.length === 0 && <li className="px-4 py-6 text-center text-xs text-qf-muted">No epics in this project yet.</li>}
              </ul>
            </section>

            <section className="rounded-lg border border-qf-border bg-qf-surface">
              <div className="flex items-center justify-between gap-2 border-b border-qf-border px-5 py-4">
                <div className="flex items-center gap-2">
                  <Zap size={16} className="text-qf-primary" />
                  <div>
                    <h2 className="text-sm font-semibold text-qf-text">Sprints</h2>
                    <p className="mt-0.5 text-[11px] text-qf-muted">{selectedProjectKey} · {projectSprints.length} total</p>
                  </div>
                </div>
                {canAddSprint && (
                  <button type="button" onClick={() => setShowSprintForm((value) => !value)} className="btn-ghost text-xs"><Plus size={13} /> New sprint</button>
                )}
              </div>

              {showSprintForm && (
                <form onSubmit={createSprint} className="space-y-2 border-b border-qf-border p-4">
                  <input autoFocus className="input-field py-1.5 text-xs" placeholder="Sprint name" maxLength={80} value={sprintDraft.name} onChange={(event) => setSprintDraft((previous) => ({ ...previous, name: event.target.value }))} />
                  <input className="input-field py-1.5 text-xs" placeholder="Sprint goal (optional)" maxLength={160} value={sprintDraft.goal} onChange={(event) => setSprintDraft((previous) => ({ ...previous, goal: event.target.value }))} />
                  <div className="grid grid-cols-2 gap-2">
                    <label className="block"><span className="mb-1 block text-[11px] text-qf-muted">Start</span><input type="date" className="input-field py-1.5 text-xs" value={sprintDraft.start} onChange={(event) => setSprintDraft((previous) => ({ ...previous, start: event.target.value }))} /></label>
                    <label className="block"><span className="mb-1 block text-[11px] text-qf-muted">End</span><input type="date" className="input-field py-1.5 text-xs" value={sprintDraft.end} onChange={(event) => setSprintDraft((previous) => ({ ...previous, end: event.target.value }))} /></label>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setShowSprintForm(false)} className="btn-ghost text-xs">Cancel</button>
                    <button type="submit" className="btn-primary text-xs">Create sprint</button>
                  </div>
                </form>
              )}

              <ul className="divide-y divide-qf-border">
                {projectSprints.map((sprint) => {
                  const sprintTasks = tasks.filter((task) => task.sprintId === sprint.id)
                  const done = sprintTasks.filter((task) => task.status === 'Done').length
                  return (
                    <li key={sprint.id} className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-qf-text">{sprint.name}</span>
                        <Badge tone={sprint.status === 'Active' ? 'green' : sprint.status === 'Completed' ? 'muted' : 'blue'}>{sprint.status}</Badge>
                      </div>
                      <p className="mt-0.5 truncate text-[11px] text-qf-muted">{sprint.goal || 'No goal set.'}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-qf-muted">
                        <span className="flex items-center gap-1"><Rocket size={11} /> {sprint.start || 'No start'} → {sprint.end || 'No end'}</span>
                        <span className="flex items-center gap-1"><CheckCircle2 size={11} /> {done}/{sprintTasks.length} issues done</span>
                        <span className="ml-auto flex items-center gap-1">
                          {canAddSprint && sprint.status !== 'Active' && (
                            <button type="button" onClick={() => updateSprint(sprint.id, { status: 'Active' })} className="rounded p-1 text-qf-muted hover:text-qf-success" aria-label={`Start ${sprint.name}`}><Play size={13} /></button>
                          )}
                          {canAddSprint && sprint.status === 'Active' && (
                            <button type="button" onClick={() => updateSprint(sprint.id, { status: 'Completed' })} className="rounded p-1 text-qf-muted hover:text-qf-warning" aria-label={`Complete ${sprint.name}`}><CheckCircle2 size={13} /></button>
                          )}
                          {canAddSprint && (
                            <button type="button" onClick={() => setPendingDeletion({ type: 'sprint', item: sprint })} className="rounded p-1 text-qf-muted hover:text-qf-danger" aria-label={`Delete ${sprint.name}`}><Trash2 size={13} /></button>
                          )}
                        </span>
                      </div>
                    </li>
                  )
                })}
                {projectSprints.length === 0 && <li className="px-4 py-6 text-center text-xs text-qf-muted">No sprints scheduled for this project.</li>}
              </ul>
            </section>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(pendingDeletion)}
        title={pendingDeletion?.type === 'project'
          ? `Delete project ${pendingDeletion.item.name}?`
          : pendingDeletion?.type === 'epic'
            ? `Delete epic "${pendingDeletion.item.title}"?`
            : `Delete sprint "${pendingDeletion?.item?.name || ''}"?`}
        description={pendingDeletion?.type === 'project'
          ? 'Projects with existing work cannot be deleted; reassign or remove their items first.'
          : pendingDeletion?.type === 'epic'
            ? 'Issues keep their history but lose this epic assignment.'
            : 'Issues assigned to the sprint return to the backlog.'}
        confirmLabel={pendingDeletion?.type === 'project' ? 'Delete project' : 'Delete'}
        busy={deleting}
        onConfirm={confirmDeletion}
        onClose={() => setPendingDeletion(null)}
      />
    </MainLayout>
  )
}

export default ProjectsPage
