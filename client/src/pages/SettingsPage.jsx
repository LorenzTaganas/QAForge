import { useEffect, useMemo, useState } from 'react'
import { Building2, Mail, Save, ShieldCheck, SlidersHorizontal, Users } from 'lucide-react'
import MainLayout from '../components/layout/MainLayout'
import PageHeader from '../components/ui/PageHeader'
import { Badge } from '../components/ui/Badges'
import { LoadingState } from '../components/ui/EmptyState'
import { useQA } from '../context/useQA'
import { useAuth } from '../context/AuthContext'
import { canManageProjects } from '../utils/permissions'

const projectStatuses = ['Active', 'Archived']
const environments = ['QA', 'Staging', 'Dev', 'Production']

const SettingsPage = () => {
  const {
    projects, selectedProjectKey, projectSettings, updateProjectSettings, updateProject,
    teamUsers, hydrating, showToast,
  } = useQA()
  const { user } = useAuth()
  const canManage = canManageProjects(user?.role)
  const project = projects.find((item) => item.key === selectedProjectKey) || projects[0]
  const [draft, setDraft] = useState({ name: '', description: '', lead: '', category: '', status: 'Active' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!project) return
    setDraft({
      name: project.name || '',
      description: project.description || '',
      lead: project.lead || '',
      category: project.category || 'Software',
      status: project.status || 'Active',
    })
  }, [project])

  const teamMembers = useMemo(() => teamUsers || [], [teamUsers])
  const projectLabel = (projectRef) => {
    const match = projects.find((item) => item.id === projectRef) || projects.find((item) => item.key === projectRef)
    return match?.key || projectRef
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setDraft((previous) => ({ ...previous, [name]: value }))
  }

  const handleSave = async (event) => {
    event.preventDefault()
    if (!project) return
    if (!draft.name.trim()) {
      showToast('Project name is required')
      return
    }
    setSaving(true)
    await updateProject(project.key, {
      name: draft.name.trim(),
      description: draft.description.trim(),
      lead: draft.lead.trim(),
      category: draft.category.trim() || 'Software',
      status: draft.status,
    })
    setSaving(false)
  }

  const handleDefaultEnvironment = (event) => {
    updateProjectSettings({ defaultEnv: event.target.value })
    showToast(`New test runs will default to ${event.target.value}`)
  }

  return (
    <MainLayout>
      <div className="mx-auto flex max-w-[1200px] flex-col gap-5">
        <PageHeader
          eyebrow="Administration"
          title="Settings"
          description="Project details, testing defaults, and the people who share this workspace."
        />

        {!project ? (
          <div className="rounded-lg border border-qf-border bg-qf-surface p-8 text-center text-sm text-qf-muted">
            No project is available to configure.
          </div>
        ) : (
          <>
            <form onSubmit={handleSave} className="rounded-lg border border-qf-border bg-qf-surface">
              <div className="flex flex-col gap-3 border-b border-qf-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <Building2 size={17} className="text-qf-primary" />
                  <div>
                    <h2 className="text-sm font-semibold text-qf-text">Project details</h2>
                    <p className="mt-0.5 text-[11px] text-qf-muted">Shown across issues, runs, and reports.</p>
                  </div>
                </div>
                <button type="submit" disabled={!canManage || saving} className="btn-primary text-xs">
                  <Save size={14} /> {saving ? 'Saving…' : 'Save changes'}
                </button>
              </div>

              <div className="grid gap-4 p-5 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-qf-secondary">Project name</span>
                  <input name="name" value={draft.name} onChange={handleChange} disabled={!canManage} maxLength={120} className="input-field" required />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-qf-secondary">Project key</span>
                  <input value={project.key} readOnly disabled className="input-field font-mono text-qf-primary" />
                  <span className="mt-1 block text-[11px] text-qf-muted">Keys are permanent because they prefix issue IDs.</span>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-qf-secondary">Project lead</span>
                  <input name="lead" value={draft.lead} onChange={handleChange} disabled={!canManage} maxLength={80} className="input-field" />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-qf-secondary">Category</span>
                  <input name="category" value={draft.category} onChange={handleChange} disabled={!canManage} maxLength={40} className="input-field" />
                </label>
                <label className="block sm:col-span-2">
                  <span className="mb-1.5 block text-xs font-medium text-qf-secondary">Description</span>
                  <textarea name="description" value={draft.description} onChange={handleChange} disabled={!canManage} rows={3} maxLength={500} className="input-field resize-none" />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-qf-secondary">Status</span>
                  <select name="status" value={draft.status} onChange={handleChange} disabled={!canManage} className="input-field">
                    {projectStatuses.map((status) => <option key={status}>{status}</option>)}
                  </select>
                </label>
              </div>

              {!canManage && (
                <p className="border-t border-qf-border px-5 py-3 text-[11px] text-qf-muted">
                  Only Admins, QA Leads, and Project Managers can change project details.
                </p>
              )}
            </form>

            <section className="rounded-lg border border-qf-border bg-qf-surface">
              <div className="flex items-center gap-2 border-b border-qf-border px-5 py-4">
                <SlidersHorizontal size={17} className="text-qf-primary" />
                <div>
                  <h2 className="text-sm font-semibold text-qf-text">Testing defaults</h2>
                  <p className="mt-0.5 text-[11px] text-qf-muted">Applied when a new test run is created.</p>
                </div>
              </div>
              <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-end">
                <label className="block sm:w-64">
                  <span className="mb-1.5 block text-xs font-medium text-qf-secondary">Default environment</span>
                  <select value={projectSettings.defaultEnv || 'QA'} onChange={handleDefaultEnvironment} className="input-field">
                    {environments.map((environment) => <option key={environment}>{environment}</option>)}
                  </select>
                </label>
                <p className="pb-2 text-[11px] text-qf-muted">Test runs still start as Not Started; only the environment is prefilled.</p>
              </div>
            </section>

            <section className="rounded-lg border border-qf-border bg-qf-surface">
              <div className="flex items-center justify-between gap-3 border-b border-qf-border px-5 py-4">
                <div className="flex items-center gap-2">
                  <Users size={17} className="text-qf-primary" />
                  <div>
                    <h2 className="text-sm font-semibold text-qf-text">Team directory</h2>
                    <p className="mt-0.5 text-[11px] text-qf-muted">Accounts that can sign in to this workspace.</p>
                  </div>
                </div>
                <Badge tone="muted">{teamMembers.length} members</Badge>
              </div>

              {hydrating && teamMembers.length === 0 ? (
                <div className="p-4"><LoadingState label="Loading team" rows={3} /></div>
              ) : teamMembers.length === 0 ? (
                <p className="p-5 text-sm text-qf-muted">No team members were returned by the server.</p>
              ) : (
                <ul className="divide-y divide-qf-border">
                  {teamMembers.map((member) => (
                    <li key={member.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-qf-primary/15 text-sm font-semibold text-qf-primary">
                          {member.name.charAt(0)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-qf-text">{member.name}{member.email === user?.email ? ' (you)' : ''}</p>
                          <p className="flex items-center gap-1 truncate text-[11px] text-qf-muted"><Mail size={11} /> {member.email}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone="purple">{member.role}</Badge>
                        {(member.projects || []).map((projectRef) => <Badge key={projectRef} tone="muted">{projectLabel(projectRef)}</Badge>)}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-lg border border-qf-border bg-qf-surface p-5">
              <div className="flex items-center gap-2">
                <ShieldCheck size={17} className="text-qf-success" />
                <h2 className="text-sm font-semibold text-qf-text">Your account</h2>
              </div>
              <dl className="mt-4 grid gap-3 text-xs sm:grid-cols-3">
                <div><dt className="text-qf-muted">Name</dt><dd className="mt-1 text-qf-text">{user?.name}</dd></div>
                <div><dt className="text-qf-muted">Email</dt><dd className="mt-1 text-qf-text">{user?.email}</dd></div>
                <div><dt className="text-qf-muted">Role</dt><dd className="mt-1"><Badge tone="purple">{user?.role}</Badge></dd></div>
              </dl>
              <p className="mt-4 text-[11px] text-qf-muted">Sessions last eight hours. Passwords and access are managed by the server administrator.</p>
            </section>
          </>
        )}
      </div>
    </MainLayout>
  )
}

export default SettingsPage
