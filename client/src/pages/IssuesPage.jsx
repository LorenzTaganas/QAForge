import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckSquare, FileText, ListTodo, Plus, Bug, Search, SlidersHorizontal, X } from 'lucide-react'
import MainLayout from '../components/layout/MainLayout'
import PageHeader from '../components/ui/PageHeader'
import Pagination from '../components/ui/Pagination'
import EmptyState, { LoadingState } from '../components/ui/EmptyState'
import { Badge, IssueTypeIcon, PriorityBadge, StatusBadge, issueTypeLabel } from '../components/ui/Badges'
import { useQA } from '../context/useQA'
import { belongsToProject } from '../utils/projectScope'
import { formatTimestamp } from '../utils/time'

export const statusesByType = {
  Task: ['To Do', 'In Progress', 'In Review', 'Done'],
  Bug: ['Open', 'In Progress', 'Resolved', 'Verified', 'Reopened', 'Closed', "Won't Fix", 'Duplicate'],
  TestCase: ['Draft', 'Ready', 'In Progress', 'Deprecated'],
  Requirement: ['Draft', 'In Review', 'Approved', 'Implemented', 'Rejected'],
}

export const collectIssues = ({ tasks, bugs, requirements, testCases }) => [
  ...tasks.map((item) => ({ ...item, issueType: 'Task' })),
  ...bugs.map((item) => ({ ...item, issueType: 'Bug' })),
  ...testCases.map((item) => ({ ...item, issueType: 'TestCase' })),
  ...requirements.map((item) => ({ ...item, issueType: 'Requirement' })),
]

export const issueAssignee = (issue) => issue.assignee || issue.owner || ''
export const issueNumber = (issue) => Number(String(issue.id).split('-').pop()) || 0

const typeOptions = [
  { value: 'All', label: 'All types', icon: SlidersHorizontal },
  { value: 'Task', label: 'Tasks', icon: ListTodo },
  { value: 'Bug', label: 'Bugs', icon: Bug },
  { value: 'TestCase', label: 'Test cases', icon: CheckSquare },
  { value: 'Requirement', label: 'Requirements', icon: FileText },
]

const priorityOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 }
const pageSize = 20

const IssuesPage = () => {
  const {
    tasks, bugs, requirements, testCases, selectedProjectKey,
    hydrating, searchQuery, updateIssue, openCreateModal,
  } = useQA()
  const [query, setQuery] = useState('')
  const [type, setType] = useState('All')
  const [status, setStatus] = useState('All')
  const [priority, setPriority] = useState('All')
  const [sort, setSort] = useState('newest')
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)

  const projectIssues = useMemo(() => collectIssues({ tasks, bugs, requirements, testCases })
    .filter((issue) => belongsToProject(issue, selectedProjectKey)), [tasks, bugs, requirements, testCases, selectedProjectKey])

  const filtered = useMemo(() => {
    const term = (query || searchQuery).trim().toLowerCase()
    const items = projectIssues.filter((issue) => {
      const haystack = `${issue.id} ${issue.title} ${issueAssignee(issue)} ${(issue.labels || []).join(' ')}`.toLowerCase()
      return (!term || haystack.includes(term))
        && (type === 'All' || issue.issueType === type)
        && (status === 'All' || issue.status === status)
        && (priority === 'All' || issue.priority === priority)
    })
    return items.sort((first, second) => {
      if (sort === 'priority') return (priorityOrder[first.priority] ?? 9) - (priorityOrder[second.priority] ?? 9)
      if (sort === 'status') return String(first.status).localeCompare(String(second.status))
      if (sort === 'key') return issueNumber(first) - issueNumber(second)
      return issueNumber(second) - issueNumber(first)
    })
  }, [projectIssues, query, searchQuery, type, status, priority, sort])

  useEffect(() => { setPage(1) }, [query, searchQuery, type, status, priority, sort])

  const visible = filtered.slice((page - 1) * pageSize, page * pageSize)
  const counts = useMemo(() => ({
    Task: projectIssues.filter((issue) => issue.issueType === 'Task').length,
    Bug: projectIssues.filter((issue) => issue.issueType === 'Bug').length,
    TestCase: projectIssues.filter((issue) => issue.issueType === 'TestCase').length,
    Requirement: projectIssues.filter((issue) => issue.issueType === 'Requirement').length,
  }), [projectIssues])

  const clearFilters = () => {
    setQuery('')
    setType('All')
    setStatus('All')
    setPriority('All')
    setSort('newest')
  }

  const filtersActive = query || type !== 'All' || status !== 'All' || priority !== 'All'
  const statusChoices = type === 'All'
    ? [...new Set(Object.values(statusesByType).flat())]
    : statusesByType[type]

  return (
    <MainLayout>
      <div className="flex flex-col gap-5">
        <PageHeader
          eyebrow="Quality workspace"
          title="Issues"
          description="Every task, defect, test case, and requirement in one filterable list."
          actions={(
            <>
              <button type="button" onClick={() => setShowFilters((value) => !value)} className="btn-ghost text-xs">
                <SlidersHorizontal size={14} /> Filters
                {filtersActive && <span className="ml-1 h-1.5 w-1.5 rounded-full bg-qf-primary" />}
              </button>
              <button type="button" onClick={() => openCreateModal('Task')} className="btn-primary text-xs">
                <Plus size={14} /> New issue
              </button>
            </>
          )}
          meta={(
            <>
              <span>{projectIssues.length} total</span>
              <span className="text-qf-border-strong">•</span>
              <span>{counts.Bug} defects</span>
              <span className="text-qf-border-strong">•</span>
              <span>{counts.TestCase} test cases</span>
            </>
          )}
        />

        <div className="flex flex-wrap gap-2">
          {typeOptions.slice(1).map((option) => {
            const Icon = option.icon
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setType(type === option.value ? 'All' : option.value)}
                className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs transition ${
                  type === option.value
                    ? 'border-qf-primary/50 bg-qf-primary/15 text-qf-text'
                    : 'border-qf-border bg-qf-surface text-qf-secondary hover:text-qf-text'
                }`}
              >
                <Icon size={13} className={type === option.value ? 'text-qf-primary' : 'text-qf-muted'} />
                {option.label}
                <span className="tabular-nums text-qf-muted">{counts[option.value]}</span>
              </button>
            )
          })}
        </div>

        <div className="rounded-lg border border-qf-border bg-qf-surface">
          <div className="flex flex-col gap-3 border-b border-qf-border p-3 sm:flex-row sm:items-center">
            <label className="relative flex-1">
              <Search size={14} className="absolute left-3 top-2.5 text-qf-muted" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by key, summary, assignee, or label"
                className="input-field pl-9 text-xs"
                aria-label="Search issues"
              />
            </label>
            <div className="flex items-center gap-2">
              <select value={sort} onChange={(event) => setSort(event.target.value)} className="input-field w-auto py-2 text-xs" aria-label="Sort issues">
                <option value="newest">Newest first</option>
                <option value="key">Key</option>
                <option value="priority">Priority</option>
                <option value="status">Status</option>
              </select>
              {filtersActive && (
                <button type="button" onClick={clearFilters} className="btn-subtle text-xs">
                  <X size={13} /> Clear
                </button>
              )}
            </div>
          </div>

          {showFilters && (
            <div className="flex flex-wrap items-center gap-3 border-b border-qf-border bg-qf-card/40 px-3 py-2.5 text-xs animate-fade-in">
              <label className="flex items-center gap-2 text-qf-muted">
                Status
                <select value={status} onChange={(event) => setStatus(event.target.value)} className="input-field w-auto py-1.5 text-xs">
                  <option value="All">All statuses</option>
                  {statusChoices.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
              <label className="flex items-center gap-2 text-qf-muted">
                Priority
                <select value={priority} onChange={(event) => setPriority(event.target.value)} className="input-field w-auto py-1.5 text-xs">
                  <option value="All">All priorities</option>
                  {['Critical', 'High', 'Medium', 'Low'].map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
              <span className="ml-auto text-qf-muted">{filtered.length} matching</span>
            </div>
          )}

          {hydrating ? (
            <div className="p-4"><LoadingState label="Loading issues" rows={6} /></div>
          ) : visible.length === 0 ? (
            <div className="p-4">
              <EmptyState
                icon={Search}
                title={filtersActive ? 'No issues match these filters' : 'No issues yet'}
                description={filtersActive ? 'Try clearing filters or searching for a different key.' : 'Create your first issue to start tracking quality work.'}
                action={filtersActive
                  ? <button type="button" onClick={clearFilters} className="btn-ghost text-xs">Clear filters</button>
                  : <button type="button" onClick={() => openCreateModal('Task')} className="btn-primary text-xs"><Plus size={14} /> Create issue</button>}
              />
            </div>
          ) : (
            <>
              <div className="divide-y divide-qf-border md:hidden">
                {visible.map((issue) => (
                  <article key={issue.id} className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <Link to={`/issues/${issue.id}`} className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-qf-info hover:underline">
                        <IssueTypeIcon type={issue.issueType} size={13} /> {issue.id}
                      </Link>
                      <StatusBadge status={issue.status} />
                    </div>
                    <Link to={`/issues/${issue.id}`} className="mt-2 block text-sm font-medium text-qf-text">{issue.title}</Link>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-qf-muted">
                      <PriorityBadge priority={issue.priority} />
                      <span>{issueAssignee(issue) || 'Unassigned'}</span>
                      <span className="ml-auto">{formatTimestamp(issue.updatedAt || issue.createdAt) === 'Unknown time' ? '' : formatTimestamp(issue.updatedAt || issue.createdAt)}</span>
                    </div>
                  </article>
                ))}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[860px] text-left text-xs">
                  <thead className="bg-qf-card/50 text-[11px] uppercase tracking-wider text-qf-muted">
                    <tr>
                      <th className="px-4 py-3 font-medium">Type</th>
                      <th className="px-4 py-3 font-medium">Key</th>
                      <th className="px-4 py-3 font-medium">Summary</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Priority</th>
                      <th className="px-4 py-3 font-medium">Assignee</th>
                      <th className="px-4 py-3 font-medium">Labels</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-qf-border">
                    {visible.map((issue) => (
                      <tr key={issue.id} className="group transition hover:bg-qf-card/50">
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 text-qf-secondary" title={issueTypeLabel(issue.issueType)}>
                            <IssueTypeIcon type={issue.issueType} />
                            <span className="hidden xl:inline">{issueTypeLabel(issue.issueType)}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Link to={`/issues/${issue.id}`} className="font-mono font-semibold text-qf-info hover:underline">{issue.id}</Link>
                        </td>
                        <td className="max-w-[24rem] px-4 py-3">
                          <Link to={`/issues/${issue.id}`} className="block truncate font-medium text-qf-text group-hover:text-white">{issue.title}</Link>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={issue.status}
                            onChange={(event) => updateIssue(issue.id, { status: event.target.value })}
                            className="max-w-[9.5rem] rounded border border-qf-border bg-qf-input px-2 py-1 text-[11px] text-qf-secondary outline-none transition hover:text-qf-text focus:border-qf-primary"
                            aria-label={`Status for ${issue.id}`}
                          >
                            {[...new Set([issue.status, ...(statusesByType[issue.issueType] || [])])].filter(Boolean).map((option) => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3"><PriorityBadge priority={issue.priority} /></td>
                        <td className="px-4 py-3 text-qf-secondary">{issueAssignee(issue) || 'Unassigned'}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {(issue.labels || []).slice(0, 2).map((label) => <Badge key={label} tone="muted">{label}</Badge>)}
                            {(issue.labels || []).length === 0 && <span className="text-qf-muted">—</span>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Pagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} itemLabel="issues" />
            </>
          )}
        </div>
      </div>
    </MainLayout>
  )
}

export default IssuesPage
