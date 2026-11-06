import { useEffect, useMemo, useState } from 'react'
import { Building2, Mail, Pencil, Save, ShieldCheck, SlidersHorizontal, UserPlus, Users, X } from 'lucide-react'
import MainLayout from '../components/layout/MainLayout'
import PageHeader from '../components/ui/PageHeader'
import { Badge } from '../components/ui/Badges'
import { LoadingState } from '../components/ui/EmptyState'
import { useQA } from '../context/useQA'
import { useAuth } from '../context/AuthContext'
import { canManageProjects, canManageUsers } from '../utils/permissions'
import api from '../services/api'

const projectStatuses = ['Active', 'Archived']
const environments = ['QA', 'Staging', 'Dev', 'Production']
const roles = ['QA Tester', 'QA Lead', 'Developer', 'Project Manager', 'Admin']

const SettingsPage = () => {
  const {
    projects, selectedProjectKey, projectSettings, updateProjectSettings, updateProject,
    teamUsers, hydrating, showToast, createTeamUser, updateTeamUser,
  } = useQA()
  const { user } = useAuth()
  const canManage = canManageProjects(user?.role)
  const canManageAccounts = canManageUsers(user?.role)
  const project = projects.find((item) => item.key === selectedProjectKey) || projects[0]
  const [draft, setDraft] = useState({ name: '', description: '', lead: '', category: '', status: 'Active' })
  const [saving, setSaving] = useState(false)
  const [allProjects, setAllProjects] = useState([])
  const [memberForm, setMemberForm] = useState(null)
  const [memberSaving, setMemberSaving] = useState(false)

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

  useEffect(() => {
    if (!canManageAccounts) return undefined
    let cancelled = false
    api.get('/projects/all')
      .then((response) => {
        if (!cancelled) setAllProjects(response.data?.projects || [])
      })
      .catch(() => {
        if (!cancelled) setAllProjects(projects)
      })
    return () => {
      cancelled = true
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canManageAccounts])

  useEffect(() => {
    if (!memberForm) return undefined
    const handleKey = (event) => {
      if (event.key === 'Escape' && !memberSaving) setMemberForm(null)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [memberForm, memberSaving])

  const teamMembers = useMemo(() => teamUsers || [], [teamUsers])
  const projectOptions = allProjects.length ? allProjects : projects
  const projectLabel = (projectRef) => {
    const match = projects.find((item) => item.id === projectRef) || projects.find((item) => item.key === projectRef)
      || allProjects.find((item) => item.id === projectRef) || allProjects.find((item) => item.key === projectRef)
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

  const handleDefaultEnvironment = async (event) => {
    await updateProjectSettings({ defaultEnv: event.target.value })
  }

  const openCreateMember = () => {
    setMemberForm({
      mode: 'create',
      id: '',
      name: '',
      email: '',
      role: 'QA Tester',
      isActive: true,
      password: '',
      projectKeys: selectedProjectKey ? [selectedProjectKey] : [],
    })
  }

  const openEditMember = (member) => {
    setMemberForm({
      mode: 'edit',
      id: member.id,
      name: member.name,
      email: member.email,
      role: member.role,
      isActive: member.isActive !== false,
      password: '',
      projectKeys: [...(member.projects || [])],
    })
  }

  const updateMemberForm = (field, value) => {
    setMemberForm((previous) => (previous ? { ...previous, [field]: value } : previous))
  }

  const toggleMemberProject = (projectKey) => {
    setMemberForm((previous) => {
      if (!previous) return previous
      const hasProject = previous.projectKeys.includes(projectKey)
      return {
        ...previous,
        projectKeys: hasProject
          ? previous.projectKeys.filter((key) => key !== projectKey)
          : [...previous.projectKeys, projectKey],
      }
    })
  }

  const handleMemberSubmit = async (event) => {
    event.preventDefault()
    if (!memberForm || memberSaving) return
    if (!memberForm.name.trim()) {
      showToast('Member name is required')
      return
    }
    if (memberForm.mode === 'create' && !memberForm.email.trim()) {
      showToast('Email is required')
      return
    }
    if (memberForm.password && memberForm.password.length < 8) {
      showToast('Password must be at least 8 characters')
      return
    }
    if (memberForm.mode === 'create' && !memberForm.password) {
      showToast('Set an initial password for the account')
      return
    }

    setMemberSaving(true)
    try {
      if (memberForm.mode === 'create') {
        const created = await createTeamUser({
          name: memberForm.name.trim(),
          email: memberForm.email.trim(),
          password: memberForm.password,
          role: memberForm.role,
          projectKeys: memberForm.projectKeys,
        })
        if (!created) return
      } else {
        const updated = await updateTeamUser(memberForm.id, {
          name: memberForm.name.trim(),
          role: memberForm.role,
          isActive: memberForm.isActive,
          projectKeys: memberForm.projectKeys,
          ...(memberForm.password ? { password: memberForm.password } : {}),
        })
        if (!updated) return
      }
      setMemberForm(null)
    } finally {
      setMemberSaving(false)
    }
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
                  <select value={projectSettings.defaultEnv || 'QA'} onChange={handleDefaultEnvironment} disabled={!canManage} className="input-field">
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
                <div className="flex items-center gap-2">
                  <Badge tone="muted">{teamMembers.length} members</Badge>
                  {canManageAccounts && (
                    <button type="button" onClick={openCreateMember} className="btn-primary text-xs">
                      <UserPlus size={14} /> Add member
                    </button>
                  )}
                </div>
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
                        {member.isActive === false && <Badge tone="danger">Inactive</Badge>}
                        {(member.projects || []).map((projectRef) => <Badge key={projectRef} tone="muted">{projectLabel(projectRef)}</Badge>)}
                        {canManageAccounts && (
                          <button
                            type="button"
                            onClick={() => openEditMember(member)}
                            className="inline-flex items-center gap-1 rounded-md border border-qf-border px-2 py-1 text-[11px] font-medium text-qf-secondary transition hover:border-qf-border-strong hover:text-qf-text"
                          >
                            <Pencil size={11} /> Edit
                          </button>
                        )}
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
              <p className="mt-4 text-[11px] text-qf-muted">
                {canManageAccounts
                  ? 'As an Admin you can add accounts, change roles, assign projects, reset passwords, and deactivate access.'
                  : 'Sessions last eight hours. Ask an Admin to change your role, projects, or password.'}
              </p>
            </section>
          </>
        )}
      </div>

      {memberForm && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-labelledby="member-dialog-title">
          <form onSubmit={handleMemberSubmit} className="w-full max-w-lg overflow-hidden rounded-lg border border-qf-border bg-qf-surface shadow-popover animate-fade-in">
            <div className="flex items-center justify-between border-b border-qf-border px-5 py-4">
              <div>
                <h2 id="member-dialog-title" className="text-sm font-semibold text-qf-text">
                  {memberForm.mode === 'create' ? 'Add team member' : `Edit ${memberForm.name || 'member'}`}
                </h2>
                <p className="mt-0.5 text-[11px] text-qf-muted">
                  {memberForm.mode === 'create' ? 'Create a real account with an initial password.' : 'Update access, role, projects, or password.'}
                </p>
              </div>
              <button type="button" onClick={() => setMemberForm(null)} className="rounded-md p-1.5 text-qf-muted hover:bg-qf-card hover:text-qf-text" aria-label="Close">
                <X size={16} />
              </button>
            </div>

            <div className="grid max-h-[70vh] gap-4 overflow-y-auto p-5 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-qf-secondary">Full name</span>
                <input value={memberForm.name} onChange={(event) => updateMemberForm('name', event.target.value)} maxLength={80} className="input-field" required />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-qf-secondary">Email</span>
                <input
                  type="email"
                  value={memberForm.email}
                  onChange={(event) => updateMemberForm('email', event.target.value)}
                  disabled={memberForm.mode === 'edit'}
                  className="input-field disabled:opacity-70"
                  required={memberForm.mode === 'create'}
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-qf-secondary">Role</span>
                <select value={memberForm.role} onChange={(event) => updateMemberForm('role', event.target.value)} className="input-field">
                  {roles.map((role) => <option key={role}>{role}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-qf-secondary">
                  {memberForm.mode === 'create' ? 'Initial password' : 'New password'}
                </span>
                <input
                  type="password"
                  value={memberForm.password}
                  onChange={(event) => updateMemberForm('password', event.target.value)}
                  placeholder={memberForm.mode === 'create' ? 'At least 8 characters' : 'Leave blank to keep current'}
                  minLength={8}
                  className="input-field"
                  required={memberForm.mode === 'create'}
                  autoComplete="new-password"
                />
              </label>

              <div className="sm:col-span-2">
                <span className="mb-1.5 block text-xs font-medium text-qf-secondary">Project access</span>
                {projectOptions.length === 0 ? (
                  <p className="text-[11px] text-qf-muted">No projects exist yet. Create one first.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {projectOptions.map((option) => {
                      const checked = memberForm.projectKeys.includes(option.key)
                      return (
                        <label
                          key={option.key}
                          className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[11px] font-medium transition ${checked ? 'border-qf-primary/60 bg-qf-primary/10 text-qf-primary' : 'border-qf-border text-qf-secondary hover:border-qf-border-strong'}`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleMemberProject(option.key)}
                            className="h-3 w-3 accent-[#7C6CF2]"
                          />
                          {option.key} · {option.name}
                        </label>
                      )
                    })}
                  </div>
                )}
              </div>

              {memberForm.mode === 'edit' && (
                <label className="flex items-center gap-2 sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={memberForm.isActive}
                    onChange={(event) => updateMemberForm('isActive', event.target.checked)}
                    disabled={memberForm.id === user?.id}
                    className="h-4 w-4 accent-[#7C6CF2]"
                  />
                  <span className="text-xs text-qf-secondary">Account is active</span>
                  {memberForm.id === user?.id && <span className="text-[11px] text-qf-muted">You cannot deactivate your own account.</span>}
                </label>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-qf-border px-5 py-4">
              <button type="button" onClick={() => setMemberForm(null)} disabled={memberSaving} className="btn-secondary text-xs">Cancel</button>
              <button type="submit" disabled={memberSaving} className="btn-primary text-xs">
                {memberSaving ? 'Saving…' : memberForm.mode === 'create' ? 'Create account' : 'Save changes'}
              </button>
            </div>
          </form>
        </div>
      )}
    </MainLayout>
  )
}

export default SettingsPage
