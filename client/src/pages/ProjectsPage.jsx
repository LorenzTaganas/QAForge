import { useState } from 'react'
import { FolderKanban, Plus, Rocket, Users } from 'lucide-react'
import MainLayout from '../components/layout/MainLayout'
import { useQA } from '../context/QAContext'
import { useAuth } from '../context/AuthContext'
import { canManageProjects, canManageSprints } from '../utils/permissions'

const ProjectsPage = () => {
  const { projects, epics, sprints, addProject, addSprint } = useQA()
  const { user } = useAuth()
  const canManageProjectSettings = canManageProjects(user?.role)
  const canAddSprint = canManageSprints(user?.role)
  const [showProjectForm, setShowProjectForm] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [projectKey, setProjectKey] = useState('')

  const createProject = (event) => {
    event.preventDefault()
    if (!projectName.trim() || !projectKey.trim()) return
    addProject({ name: projectName.trim(), key: projectKey.trim().toUpperCase(), lead: 'You', category: 'Software', description: 'New QA project workspace.' })
    setProjectName('')
    setProjectKey('')
    setShowProjectForm(false)
  }

  return (
    <MainLayout>
      <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
        <div className="flex flex-col gap-3 border-b border-jira-border pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="section-title">Planning / Projects</p><h1 className="mt-1 section-heading text-white">Projects and workspaces</h1><p className="mt-2 text-sm text-jira-muted">Organize teams, releases, epics, and QA work by project.</p></div>
          {canManageProjectSettings && (
            <button onClick={() => setShowProjectForm((value) => !value)} className="btn-primary"><Plus size={15} /> New project</button>
          )}
        </div>
        {showProjectForm && canManageProjectSettings && <form onSubmit={createProject} className="card-surface grid gap-3 p-4 sm:grid-cols-[1fr_8rem_auto]"><input className="input-field" placeholder="Project name" value={projectName} onChange={(event) => setProjectName(event.target.value)} /><input className="input-field" maxLength={5} placeholder="KEY" value={projectKey} onChange={(event) => setProjectKey(event.target.value)} /><button className="btn-primary">Create</button></form>}
        <div className="grid gap-4 lg:grid-cols-2">
          {projects.map((project) => <div key={project.id} className="dashboard-card p-5"><div className="flex items-start justify-between"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1D3A68] text-[#71B2FF]"><FolderKanban size={21} /></div><div><h2 className="font-semibold text-white">{project.name}</h2><p className="font-mono text-xs text-[#6EA8FF]">{project.key}</p></div></div><span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-400">{project.status}</span></div><p className="mt-4 text-sm leading-6 text-jira-muted">{project.description}</p><div className="mt-5 flex flex-wrap gap-4 border-t border-[#242D40] pt-4 text-xs text-[#8B97A9]"><span className="flex items-center gap-1.5"><Users size={14} /> {project.lead}</span><span>{epics.filter((epic) => epic.projectKey === project.key).length} epics</span><span>{sprints.filter((sprint) => sprint.projectKey === project.key).length} sprints</span></div></div>)}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <section className="dashboard-card p-5"><div className="mb-4 flex items-center justify-between"><div><h2 className="font-semibold text-white">Epics</h2><p className="mt-1 text-xs text-jira-muted">Large bodies of QA work</p></div><Rocket size={17} className="text-[#6EA8FF]" /></div><div className="space-y-2">{epics.map((epic) => <div key={epic.id} className="flex items-center gap-3 rounded-lg border border-[#242D40] bg-[#141A26] p-3"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: epic.color }} /><span className="font-mono text-[11px] text-[#6EA8FF]">{epic.id}</span><span className="flex-1 text-sm text-[#DDE5F2]">{epic.title}</span><span className="text-xs text-jira-muted">{epic.status}</span></div>)}</div></section>
          <section className="dashboard-card p-5"><div className="mb-4 flex items-center justify-between"><div><h2 className="font-semibold text-white">Sprint cadence</h2><p className="mt-1 text-xs text-jira-muted">Active and planned iterations</p></div>{canAddSprint && <button onClick={() => addSprint({ name: `Sprint ${sprints.length + 24}.6`, goal: 'New QA iteration', projectKey: 'QAR' })} className="btn-ghost text-xs"><Plus size={14} /> Add sprint</button>}</div><div className="space-y-2">{sprints.map((sprint) => <div key={sprint.id} className="rounded-lg border border-[#242D40] bg-[#141A26] p-3"><div className="flex items-center justify-between"><span className="font-medium text-white">{sprint.name}</span><span className={sprint.status === 'Active' ? 'text-emerald-400' : 'text-[#FFB454]'}>{sprint.status}</span></div><p className="mt-1 text-xs text-jira-muted">{sprint.goal}</p><p className="mt-2 text-[11px] text-[#78849A]">{sprint.start} — {sprint.end}</p></div>)}</div></section>
        </div>
      </div>
    </MainLayout>
  )
}

export default ProjectsPage
