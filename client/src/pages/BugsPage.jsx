import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Bug, Plus, Search, Trash2 } from 'lucide-react'
import MainLayout from '../components/layout/MainLayout'
import PageHeader from '../components/ui/PageHeader'
import MetricCard from '../components/ui/MetricCard'
import EmptyState, { LoadingState } from '../components/ui/EmptyState'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import Pagination from '../components/ui/Pagination'
import { Badge, PriorityBadge, SeverityBadge, StatusBadge } from '../components/ui/Badges'
import { useQA } from '../context/useQA'
import { useAuth } from '../context/AuthContext'
import { canDeleteIssue } from '../utils/permissions'
import { belongsToProject } from '../utils/projectScope'

const statuses = ['Open', 'In Progress', 'Resolved', 'Verified', 'Reopened', 'Closed', "Won't Fix", 'Duplicate']
const severities = ['Blocker', 'Critical', 'Major', 'Minor', 'Trivial']
const pageSize = 20

const BugsPage = () => {
  const { bugs, selectedProjectKey, hydrating, searchQuery, openCreateModal, updateBugStatus, deleteBug } = useQA()
  const { user } = useAuth()
  const canDelete = canDeleteIssue(user?.role)
  const [query, setQuery] = useState('')
  const [severityFilter, setSeverityFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [page, setPage] = useState(1)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const projectBugs = useMemo(
    () => bugs.filter((bug) => belongsToProject(bug, selectedProjectKey)),
    [bugs, selectedProjectKey],
  )

  const stats = useMemo(() => ({
    total: projectBugs.length,
    critical: projectBugs.filter((bug) => ['Critical', 'Blocker'].includes(bug.severity)).length,
    open: projectBugs.filter((bug) => ['Open', 'In Progress', 'Reopened'].includes(bug.status)).length,
    resolved: projectBugs.filter((bug) => ['Resolved', 'Verified', 'Closed'].includes(bug.status)).length,
  }), [projectBugs])

  const filtered = useMemo(() => {
    const term = (query || searchQuery).trim().toLowerCase()
    return projectBugs.filter((bug) => {
      const matchesSearch = !term || `${bug.id} ${bug.title} ${bug.assignee || ''} ${bug.environment || ''}`.toLowerCase().includes(term)
      return matchesSearch
        && (severityFilter === 'All' || bug.severity === severityFilter)
        && (statusFilter === 'All' || bug.status === statusFilter)
    })
  }, [projectBugs, query, searchQuery, severityFilter, statusFilter])

  useEffect(() => { setPage(1) }, [query, searchQuery, severityFilter, statusFilter])
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize)
  const filtersActive = query || severityFilter !== 'All' || statusFilter !== 'All'

  const confirmDelete = async () => {
    if (!pendingDelete) return
    setDeleting(true)
    await deleteBug(pendingDelete.id)
    setDeleting(false)
    setPendingDelete(null)
  }

  return (
    <MainLayout>
      <div className="flex flex-col gap-5">
        <PageHeader
          eyebrow="Defect management"
          title="Bugs"
          description="Triage defects by severity, reproduce them from linked test evidence, and track them to closure."
          actions={<button type="button" onClick={() => openCreateModal('Bug')} className="btn-primary text-xs"><Plus size={14} /> Report bug</button>}
        />

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Reported defects" value={stats.total} icon={Bug} />
          <MetricCard label="Critical or blocker" value={stats.critical} icon={AlertTriangle} tone="danger" />
          <MetricCard label="Active" value={stats.open} icon={Bug} tone="warning" hint="Open, in progress, or reopened" />
          <MetricCard label="Resolved" value={stats.resolved} icon={Bug} tone="success" />
        </div>

        <div className="rounded-lg border border-qf-border bg-qf-surface">
          <div className="flex flex-col gap-3 border-b border-qf-border p-3 sm:flex-row sm:items-center">
            <label className="relative flex-1">
              <Search size={14} className="absolute left-3 top-2.5 text-qf-muted" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by id, summary, assignee, or environment" className="input-field pl-9 text-xs" aria-label="Search bugs" />
            </label>
            <div className="flex flex-wrap gap-2">
              <select value={severityFilter} onChange={(event) => setSeverityFilter(event.target.value)} className="input-field w-auto py-2 text-xs" aria-label="Filter by severity">
                <option value="All">All severities</option>
                {severities.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="input-field w-auto py-2 text-xs" aria-label="Filter by status">
                <option value="All">All statuses</option>
                {statuses.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
              {filtersActive && (
                <button type="button" onClick={() => { setQuery(''); setSeverityFilter('All'); setStatusFilter('All') }} className="btn-subtle text-xs">Clear</button>
              )}
            </div>
          </div>

          {hydrating ? (
            <div className="p-4"><LoadingState label="Loading defects" rows={6} /></div>
          ) : visible.length === 0 ? (
            <div className="p-4">
              <EmptyState
                icon={Bug}
                title={projectBugs.length ? 'No defects match these filters' : 'No defects reported'}
                description={projectBugs.length
                  ? 'Try a different search, severity, or status.'
                  : 'When a test fails during a run, log it as a defect from the execution screen.'}
                action={projectBugs.length
                  ? <button type="button" onClick={() => { setQuery(''); setSeverityFilter('All'); setStatusFilter('All') }} className="btn-ghost text-xs">Clear filters</button>
                  : <button type="button" onClick={() => openCreateModal('Bug')} className="btn-primary text-xs"><Plus size={14} /> Report bug</button>}
              />
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[960px] text-left text-xs">
                  <thead className="bg-qf-card/50 text-[11px] uppercase tracking-wider text-qf-muted">
                    <tr>
                      <th className="px-4 py-3 font-medium">Key</th>
                      <th className="px-4 py-3 font-medium">Summary</th>
                      <th className="px-4 py-3 font-medium">Severity</th>
                      <th className="px-4 py-3 font-medium">Priority</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Environment</th>
                      <th className="px-4 py-3 font-medium">Assignee</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-qf-border">
                    {visible.map((bug) => (
                      <tr key={bug.id} className="group transition hover:bg-qf-card/50">
                        <td className="px-4 py-3">
                          <Link to={`/issues/${bug.id}`} className="flex items-center gap-1.5 font-mono font-semibold text-qf-danger hover:underline"><Bug size={12} />{bug.id}</Link>
                        </td>
                        <td className="max-w-[22rem] px-4 py-3">
                          <Link to={`/issues/${bug.id}`} className="block truncate font-medium text-qf-text">{bug.title}</Link>
                          <span className="text-[10px] text-qf-muted">Reported by {bug.reporter || 'Unknown'}</span>
                        </td>
                        <td className="px-4 py-3"><SeverityBadge severity={bug.severity} /></td>
                        <td className="px-4 py-3"><PriorityBadge priority={bug.priority} /></td>
                        <td className="px-4 py-3">
                          <select
                            value={bug.status}
                            onChange={(event) => updateBugStatus(bug.id, event.target.value)}
                            className="max-w-[9.5rem] rounded border border-qf-border bg-qf-input px-2 py-1 text-[11px] text-qf-secondary outline-none transition hover:text-qf-text focus:border-qf-primary"
                            aria-label={`Status for ${bug.id}`}
                          >
                            {[...new Set([bug.status, ...statuses])].filter(Boolean).map((option) => <option key={option} value={option}>{option}</option>)}
                          </select>
                        </td>
                        <td className="px-4 py-3"><Badge tone="muted">{bug.environment || 'Not set'}</Badge></td>
                        <td className="px-4 py-3 text-qf-secondary">{bug.assignee || <span className="text-qf-muted">Unassigned</span>}</td>
                        <td className="px-4 py-3 text-right">
                          {canDelete && (
                            <button type="button" onClick={() => setPendingDelete(bug)} className="rounded p-1 text-qf-muted opacity-0 transition hover:text-qf-danger group-hover:opacity-100" aria-label={`Delete ${bug.id}`}>
                              <Trash2 size={14} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <ul className="divide-y divide-qf-border md:hidden">
                {visible.map((bug) => (
                  <li key={bug.id} className="p-4">
                    <div className="flex items-center justify-between gap-2">
                      <Link to={`/issues/${bug.id}`} className="font-mono text-[11px] font-semibold text-qf-danger">{bug.id}</Link>
                      <StatusBadge status={bug.status} />
                    </div>
                    <Link to={`/issues/${bug.id}`} className="mt-1.5 block text-sm font-medium text-qf-text">{bug.title}</Link>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <SeverityBadge severity={bug.severity} />
                      <PriorityBadge priority={bug.priority} />
                      <Badge tone="muted">{bug.environment || 'No environment'}</Badge>
                      <span className="text-[11px] text-qf-muted">{bug.assignee || 'Unassigned'}</span>
                    </div>
                  </li>
                ))}
              </ul>

              <Pagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} itemLabel="defects" />
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={`Delete ${pendingDelete?.id || 'defect'}?`}
        description="This permanently removes the defect and its comments. This cannot be undone."
        confirmLabel="Delete defect"
        busy={deleting}
        onConfirm={confirmDelete}
        onClose={() => setPendingDelete(null)}
      />
    </MainLayout>
  )
}

export default BugsPage
