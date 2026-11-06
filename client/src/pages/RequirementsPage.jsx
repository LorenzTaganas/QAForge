import { useMemo, useState } from 'react'
import { Download, FileText, Plus, Search } from 'lucide-react'
import MainLayout from '../components/layout/MainLayout'
import PageHeader from '../components/ui/PageHeader'
import MetricCard from '../components/ui/MetricCard'
import RequirementsTable from '../components/requirements/RequirementsTable'
import { useQA } from '../context/useQA'
import { belongsToProject } from '../utils/projectScope'

const statusOptions = ['Draft', 'In Review', 'Approved', 'Implemented', 'Rejected']
const priorityOptions = ['Critical', 'High', 'Medium', 'Low']

const RequirementsPage = () => {
  const { requirements, testCases, selectedProjectKey, openCreateModal, showToast, searchQuery, setSearchQuery, hydrating } = useQA()
  const [statusFilter, setStatusFilter] = useState('All')
  const [priorityFilter, setPriorityFilter] = useState('All')

  const projectRequirements = useMemo(
    () => requirements.filter((requirement) => belongsToProject(requirement, selectedProjectKey)),
    [requirements, selectedProjectKey],
  )

  const filteredRequirements = useMemo(() => {
    const term = searchQuery.trim().toLowerCase()
    return projectRequirements.filter((requirement) => (
      (!term || requirement.title.toLowerCase().includes(term) || requirement.id.toLowerCase().includes(term)) &&
      (statusFilter === 'All' || requirement.status === statusFilter) &&
      (priorityFilter === 'All' || requirement.priority === priorityFilter)
    ))
  }, [priorityFilter, projectRequirements, searchQuery, statusFilter])

  const coverage = projectRequirements.filter((requirement) => (
    testCases.some((test) => (test.requirementIds || []).includes(requirement.id))
  )).length

  const handleExportCSV = () => {
    if (filteredRequirements.length === 0) return
    const escape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`
    const headers = ['Key', 'Title', 'Owner', 'Priority', 'Status', 'Linked tests', 'Description']
    const rows = filteredRequirements.map((requirement) => [
      escape(requirement.id),
      escape(requirement.title),
      escape(requirement.owner),
      escape(requirement.priority),
      escape(requirement.status),
      escape(testCases.filter((test) => (test.requirementIds || []).includes(requirement.id)).length),
      escape(requirement.description),
    ])
    const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `qaforge-${selectedProjectKey}-requirements-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    showToast(`Exported ${filteredRequirements.length} requirements`)
  }

  return (
    <MainLayout>
      <div className="flex flex-col gap-5">
        <PageHeader
          eyebrow={`${selectedProjectKey} · Traceability`}
          title="Requirements"
          description="Capture what must be true, then link tests that prove it."
          actions={(
            <>
              <button type="button" onClick={handleExportCSV} disabled={filteredRequirements.length === 0} className="btn-ghost text-xs">
                <Download size={14} /> Export CSV
              </button>
              <button type="button" onClick={() => openCreateModal('Requirement')} className="btn-primary text-xs">
                <Plus size={14} /> Add requirement
              </button>
            </>
          )}
        />

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Requirements" value={projectRequirements.length} icon={FileText} />
          <MetricCard label="Approved" value={projectRequirements.filter((requirement) => requirement.status === 'Approved').length} icon={FileText} tone="success" />
          <MetricCard label="In review or draft" value={projectRequirements.filter((requirement) => ['In Review', 'Draft'].includes(requirement.status)).length} icon={FileText} tone="warning" />
          <MetricCard label="Covered by tests" value={`${projectRequirements.length ? Math.round((coverage / projectRequirements.length) * 100) : 0}%`} hint={`${coverage} of ${projectRequirements.length}`} icon={FileText} tone="primary" />
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-qf-border bg-qf-surface p-3 sm:flex-row sm:items-center">
          <label className="relative flex-1">
            <Search size={14} className="absolute left-3 top-2.5 text-qf-muted" />
            <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search requirements by key or title" aria-label="Search requirements" className="input-field pl-9 text-xs" />
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="input-field w-auto py-1.5 text-xs" aria-label="Filter by status">
              <option value="All">All statuses</option>
              {statusOptions.map((status) => <option key={status}>{status}</option>)}
            </select>
            <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)} className="input-field w-auto py-1.5 text-xs" aria-label="Filter by priority">
              <option value="All">All priorities</option>
              {priorityOptions.map((priority) => <option key={priority}>{priority}</option>)}
            </select>
            {(statusFilter !== 'All' || priorityFilter !== 'All' || searchQuery) && (
              <button type="button" onClick={() => { setStatusFilter('All'); setPriorityFilter('All'); setSearchQuery('') }} className="text-[11px] text-qf-info hover:underline">Reset</button>
            )}
          </div>
        </div>

        {hydrating ? (
          <p className="rounded-lg border border-qf-border bg-qf-surface p-8 text-center text-sm text-qf-muted">Loading requirements…</p>
        ) : (
          <RequirementsTable requirements={filteredRequirements} />
        )}
      </div>
    </MainLayout>
  )
}

export default RequirementsPage
