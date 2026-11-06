import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle2, Eye, Inbox, UserRound } from 'lucide-react'
import MainLayout from '../components/layout/MainLayout'
import PageHeader from '../components/ui/PageHeader'
import MetricCard from '../components/ui/MetricCard'
import EmptyState from '../components/ui/EmptyState'
import { IssueTypeIcon, PriorityBadge, StatusBadge } from '../components/ui/Badges'
import { useQA } from '../context/useQA'
import { useAuth } from '../context/AuthContext'
import { belongsToProject } from '../utils/projectScope'
import { collectIssues, issueAssignee } from './IssuesPage'

const closedStatuses = ['Done', 'Closed', 'Resolved', 'Verified', 'Deprecated', "Won't Fix", 'Duplicate']

const MyWorkPage = () => {
  const { tasks, bugs, requirements, testCases, testRuns, selectedProjectKey, watchers, hydrating } = useQA()
  const { user } = useAuth()
  const [tab, setTab] = useState('assigned')

  const issues = useMemo(() => collectIssues({ tasks, bugs, requirements, testCases })
    .filter((issue) => belongsToProject(issue, selectedProjectKey)), [tasks, bugs, requirements, testCases, selectedProjectKey])

  const assigned = issues.filter((issue) => issueAssignee(issue) === user?.name)
  const reported = bugs.filter((bug) => bug.reporter === user?.name && belongsToProject(bug, selectedProjectKey))
  const watched = issues.filter((issue) => watchers.includes(issue.id))

  const lists = {
    assigned,
    reported: reported.map((bug) => ({ ...bug, issueType: 'Bug' })),
    watched,
  }
  const current = lists[tab] || []
  const open = current.filter((issue) => !closedStatuses.includes(issue.status))
  const done = current.filter((issue) => closedStatuses.includes(issue.status))
  const myRuns = testRuns.filter((run) => run.createdBy === user?.name && belongsToProject(run, selectedProjectKey))

  const tabs = [
    { id: 'assigned', label: 'Assigned to me', count: assigned.length },
    { id: 'reported', label: 'Reported by me', count: reported.length },
    { id: 'watched', label: 'Watching', count: watched.length },
  ]

  return (
    <MainLayout>
      <div className="flex flex-col gap-5">
        <PageHeader
          eyebrow={selectedProjectKey}
          title="My work"
          description={`Everything assigned to ${user?.name || 'you'} across issues, tests, and defects.`}
          meta={(
            <>
              <span>{open.length} open</span>
              <span className="text-qf-border-strong">•</span>
              <span>{done.length} completed</span>
              <span className="text-qf-border-strong">•</span>
              <span>{myRuns.length} test runs created</span>
            </>
          )}
        />

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Assigned issues" value={assigned.length} icon={UserRound} to="/issues" />
          <MetricCard label="Open items" value={assigned.filter((issue) => !closedStatuses.includes(issue.status)).length} icon={ArrowRight} to="/issues" />
          <MetricCard label="Defects reported" value={reported.length} icon={Inbox} tone="warning" to="/bugs" />
          <MetricCard label="Completed" value={assigned.filter((issue) => closedStatuses.includes(issue.status)).length} icon={CheckCircle2} tone="success" to="/issues" />
        </div>

        <div className="rounded-lg border border-qf-border bg-qf-surface">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-qf-border px-3 py-2">
            <div className="flex flex-wrap gap-1">
              {tabs.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs transition ${
                    tab === item.id ? 'bg-qf-card font-medium text-qf-text' : 'text-qf-muted hover:text-qf-text'
                  }`}
                >
                  {item.label}
                  <span className="tabular-nums text-qf-muted">{item.count}</span>
                </button>
              ))}
            </div>
            {tab === 'watched' && <Eye size={14} className="text-qf-muted" aria-hidden="true" />}
          </div>

          {hydrating ? (
            <p className="px-4 py-10 text-center text-xs text-qf-muted">Loading your work…</p>
          ) : current.length === 0 ? (
            <div className="p-4">
              <EmptyState
                icon={tab === 'watched' ? Eye : UserRound}
                title={tab === 'watched' ? 'You are not watching any issues' : 'Nothing assigned yet'}
                description={tab === 'watched'
                  ? 'Open an issue and choose Watch to follow its updates here.'
                  : 'Work assigned to you will appear here. Ask a lead to assign an issue, or pick something from the backlog.'}
                action={<Link to="/issues" className="btn-ghost text-xs">Browse issues <ArrowRight size={13} /></Link>}
              />
            </div>
          ) : (
            <ul className="divide-y divide-qf-border">
              {current.map((issue) => (
                <li key={issue.id} className="flex flex-col gap-2 px-4 py-3 transition hover:bg-qf-card/40 sm:flex-row sm:items-center">
                  <span className="flex w-48 shrink-0 items-center gap-2 text-xs">
                    <IssueTypeIcon type={issue.issueType} />
                    <Link to={`/issues/${issue.id}`} className="font-mono font-semibold text-qf-info hover:underline">{issue.id}</Link>
                  </span>
                  <Link to={`/issues/${issue.id}`} className="min-w-0 flex-1 truncate text-sm text-qf-text hover:text-white">{issue.title}</Link>
                  <div className="flex shrink-0 items-center gap-2">
                    <StatusBadge status={issue.status} />
                    <PriorityBadge priority={issue.priority} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {myRuns.length > 0 && (
          <section className="rounded-lg border border-qf-border bg-qf-surface">
            <div className="flex items-center justify-between border-b border-qf-border px-4 py-3">
              <h2 className="text-sm font-semibold text-qf-text">Test runs I created</h2>
              <Link to="/test-runs" className="text-xs text-qf-primary hover:underline">All test runs</Link>
            </div>
            <ul className="divide-y divide-qf-border">
              {myRuns.slice(0, 5).map((run) => (
                <li key={run.id} className="flex items-center gap-3 px-4 py-3 text-xs">
                  <Link to={`/test-runs/${run.id}`} className="font-mono font-semibold text-qf-info hover:underline">{run.id}</Link>
                  <Link to={`/test-runs/${run.id}`} className="min-w-0 flex-1 truncate text-sm text-qf-text">{run.name}</Link>
                  <span className="text-qf-muted">{run.passed ?? 0} passed · {run.failed ?? 0} failed</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </MainLayout>
  )
}

export default MyWorkPage
