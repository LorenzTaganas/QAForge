import { useState } from 'react'
import { FolderKanban, Plus, Rocket, Users, Target, Zap } from 'lucide-react'
import MainLayout from '../components/layout/MainLayout'
import { useQA } from '../context/useQA'
import { useAuth } from '../context/AuthContext'
import { canManageProjects, canManageSprints } from '../utils/permissions'

const ProjectsPage = () => {
  const { projects, epics, sprints, addProject, addEpic, addSprint, updateEpic, selectedProjectKey } = useQA()
  const { user } = useAuth()
  const canManageProjectSettings = canManageProjects(user?.role)
  const canAddSprint = canManageSprints(user?.role)

  const [showProjectForm, setShowProjectForm] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [projectKey, setProjectKey] = useState('')

  const [showEpicForm, setShowEpicForm] = useState(false)
  const [epicTitle, setEpicTitle] = useState('')

  const createProject = (event) => {
    event.preventDefault()
    if (!projectName.trim() || !projectKey.trim()) return
    addProject({
      name: projectName.trim(),
      key: projectKey.trim().toUpperCase(),
      lead: user?.name || 'You',
      category: 'Software',
      description: 'New high-priority QA command center workspace.'
    })
    setProjectName('')
    setProjectKey('')
    setShowProjectForm(false)
  }

  const createEpic = (event) => {
    event.preventDefault()
    if (!epicTitle.trim()) return
    addEpic({
      title: epicTitle.trim(),
      projectKey: selectedProjectKey,
      owner: user?.name || 'You'
    })
    setEpicTitle('')
    setShowEpicForm(false)
  }

  return (
    <MainLayout>
      <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
        <div className="flex flex-col gap-3 border-b border-[#2B416C] pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#00F0FF]">Tactical / Projects</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">QA Command Centers</h1>
            <p className="mt-2 text-sm text-[#8B97A9]">Manage tactical operations, epics, and QA work streams.</p>
          </div>
          {canManageProjectSettings && (
            <button
              onClick={() => setShowProjectForm((value) => !value)}
              className="btn-primary"
            >
              <Plus size={15} /> New Command Center
            </button>
          )}
        </div>

        {showProjectForm && canManageProjectSettings && (
          <form onSubmit={createProject} className="rounded-xl border border-[#00F0FF]/40 bg-[#101726]/80 backdrop-blur-md grid gap-3 p-4 sm:grid-cols-[1fr_8rem_auto] shadow-[0_0_20px_rgba(0,240,255,0.15)] animate-fade-in">
            <input
              className="input-field"
              placeholder="Command center name"
              value={projectName}
              onChange={(event) => setProjectName(event.target.value)}
            />
            <input
              className="input-field font-mono text-[#00F0FF]"
              maxLength={5}
              placeholder="KEY"
              value={projectKey}
              onChange={(event) => setProjectKey(event.target.value)}
            />
            <button className="btn-primary">Initialize</button>
          </form>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          {projects.map((project) => (
            <div key={project.id} className="rounded-xl border border-[#2B416C] bg-[#101726]/85 backdrop-blur-md p-5 shadow-[0_12px_40px_rgba(0,0,0,0.4)] transition hover:border-[#00F0FF]/50 hover:shadow-[0_0_25px_rgba(0,240,255,0.15)]">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/30 shadow-[0_0_15px_rgba(0,240,255,0.2)]">
                    <FolderKanban size={22} />
                  </div>
                  <div>
                    <h2 className="font-bold text-white tracking-tight">{project.name}</h2>
                    <p className="font-mono text-xs text-[#00F0FF] tracking-widest">{project.key}</p>
                  </div>
                </div>
                <span className="rounded-full bg-[#00F0FF]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#00F0FF] border border-[#00F0FF]/30 shadow-[0_0_10px_rgba(0,240,255,0.1)]">
                  {project.status}
                </span>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-[#8B97A9]">{project.description}</p>
              <div className="mt-5 flex flex-wrap gap-4 border-t border-[#233352] pt-4 text-[11px] font-semibold text-[#DDE5F2]">
                <span className="flex items-center gap-1.5 text-[#00F0FF]/80">
                  <Users size={14} /> {project.lead}
                </span>
                <span className="px-2 py-0.5 rounded bg-[#172138] border border-[#2B416C]">
                  {epics.filter((epic) => epic.projectKey === project.key).length} Epics
                </span>
                <span className="px-2 py-0.5 rounded bg-[#172138] border border-[#2B416C]">
                  {sprints.filter((sprint) => sprint.projectKey === project.key).length} Sprints
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Epics Section */}
          <section className="rounded-xl border border-[#2B416C] bg-[#101726]/85 backdrop-blur-md p-5 shadow-[0_12px_40px_rgba(0,0,0,0.4)]">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Target size={18} className="text-[#00F0FF]" />
                  Strategic Epics
                </h2>
                <p className="mt-1 text-xs text-[#8B97A9]">High-level quality objectives</p>
              </div>
              {canManageProjectSettings && (
                <button
                  onClick={() => setShowEpicForm((value) => !value)}
                  className="btn-ghost text-[11px] h-7 px-2"
                >
                  <Plus size={14} /> Add Epic
                </button>
              )}
            </div>

            {showEpicForm && (
              <form onSubmit={createEpic} className="mb-4 flex gap-2 animate-fade-in">
                <input
                  className="input-field text-xs"
                  placeholder="Epic tactical title"
                  value={epicTitle}
                  onChange={(event) => setEpicTitle(event.target.value)}
                />
                <button className="btn-primary text-xs h-9">Create</button>
              </form>
            )}

            <div className="space-y-2.5">
              {epics.filter(e => e.projectKey === selectedProjectKey).map((epic) => (
                <div key={epic.id} className="flex items-center gap-3 rounded-xl border border-[#2B416C] bg-[#172138]/80 p-3 shadow-sm hover:border-[#00F0FF]/40 transition">
                  <div className="h-3 w-3 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: epic.color, color: epic.color }} />
                  <span className="font-mono text-[11px] font-bold text-[#00F0FF]">{epic.id}</span>
                  <span className="flex-1 text-sm font-medium text-[#DDE5F2] truncate">{epic.title}</span>
                  <select
                    value={epic.status}
                    onChange={(event) => updateEpic(epic.id, { status: event.target.value })}
                    className="rounded-md border border-[#2B416C] bg-[#070B14] px-2 py-1 text-[11px] font-bold text-[#00F0FF] outline-none focus:border-[#00F0FF]"
                  >
                    <option>To Do</option>
                    <option>In Progress</option>
                    <option>Done</option>
                  </select>
                </div>
              ))}
              {epics.filter(e => e.projectKey === selectedProjectKey).length === 0 && (
                <div className="text-center py-6 border border-dashed border-[#2B416C] rounded-xl text-[#8B97A9] text-xs">
                  No active epics in this command center.
                </div>
              )}
            </div>
          </section>

          {/* Sprints Section */}
          <section className="rounded-xl border border-[#2B416C] bg-[#101726]/85 backdrop-blur-md p-5 shadow-[0_12px_40px_rgba(0,0,0,0.4)]">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Zap size={18} className="text-[#00F0FF]" />
                  Sprint Pulse
                </h2>
                <p className="mt-1 text-xs text-[#8B97A9]">Active and upcoming iterations</p>
              </div>
              {canAddSprint && (
                <button
                  onClick={() => addSprint({
                    name: `Sprint ${sprints.length + 24}.${sprints.length + 1}`,
                    goal: 'Deploy high-confidence QA features',
                    projectKey: selectedProjectKey
                  })}
                  className="btn-ghost text-[11px] h-7 px-2"
                >
                  <Plus size={14} /> Start Sprint
                </button>
              )}
            </div>

            <div className="space-y-3">
              {sprints.filter(s => s.projectKey === selectedProjectKey).map((sprint) => (
                <div key={sprint.id} className="rounded-xl border border-[#2B416C] bg-[#172138]/80 p-4 shadow-sm hover:border-[#00F0FF]/40 transition">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-white text-sm">{sprint.name}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                      sprint.status === 'Active'
                        ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10 shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                        : 'text-amber-400 border-amber-500/30 bg-amber-500/10'
                    }`}>
                      {sprint.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#8B97A9] leading-relaxed italic">"{sprint.goal}"</p>
                  <div className="mt-3 flex items-center gap-2 text-[10px] font-mono text-[#00F0FF]/70">
                    <Rocket size={12} />
                    {sprint.start} — {sprint.end}
                  </div>
                </div>
              ))}
              {sprints.filter(s => s.projectKey === selectedProjectKey).length === 0 && (
                <div className="text-center py-6 border border-dashed border-[#2B416C] rounded-xl text-[#8B97A9] text-xs">
                  No scheduled sprints.
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </MainLayout>
  )
}

export default ProjectsPage
