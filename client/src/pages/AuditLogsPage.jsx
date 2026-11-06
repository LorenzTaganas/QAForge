import { useMemo, useState } from 'react'
import { Activity, MessageSquare, Pencil, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import MainLayout from '../components/layout/MainLayout'
import PageHeader from '../components/ui/PageHeader'
import EmptyState from '../components/ui/EmptyState'
import Pagination from '../components/ui/Pagination'
import { Badge } from '../components/ui/Badges'
import { useQA } from '../context/useQA'
import { formatTimestamp, getTimestamp } from '../utils/time'
import { belongsToProject } from '../utils/projectScope'

const pageSize = 25

const AuditLogsPage = () => {
  const { activity, comments, tasks, requirements, testCases, bugs, testRuns, selectedProjectKey } = useQA()
  const [query, setQuery] = useState('')
  const [kind, setKind] = useState('All')
  const [page, setPage] = useState(1)

  const projectIssueIds = useMemo(
    () => new Set(
      [...tasks, ...requirements, ...testCases, ...bugs, ...testRuns]
        .filter((item) => belongsToProject(item, selectedProjectKey))
        .map((item) => item.id),
    ),
    [bugs, requirements, selectedProjectKey, tasks, testCases, testRuns],
  )

  const events = useMemo(() => {
    const term = query.trim().toLowerCase()
    return [
      ...activity.map((event) => ({ ...event, kind: 'Change' })),
      ...comments.map((comment) => ({ id: comment.id, issueId: comment.issueId, action: 'added a comment', actor: comment.author, createdAt: comment.createdAt, kind: 'Comment' })),
    ]
      .filter((event) => {
        if (!projectIssueIds.has(event.issueId)) return false
        const haystack = `${event.issueId} ${event.action} ${event.actor}`.toLowerCase()
        return (!term || haystack.includes(term)) && (kind === 'All' || event.kind === kind)
      })
      .sort((first, second) => getTimestamp(second.createdAt) - getTimestamp(first.createdAt))
  }, [activity, comments, kind, projectIssueIds, query])

  const visible = events.slice((page - 1) * pageSize, page * pageSize)

  const changeKind = (nextKind) => {
    setKind(nextKind)
    setPage(1)
  }

  return (
    <MainLayout>
      <div className="mx-auto flex max-w-[1200px] flex-col gap-5">
        <PageHeader
          eyebrow="Administration"
          title="Audit log"
          description="Every issue change and comment recorded in this project, newest first."
        />

        <div className="flex flex-col gap-3 rounded-lg border border-qf-border bg-qf-surface p-3 sm:flex-row sm:items-center">
          <label className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-qf-muted" size={15} />
            <input
              value={query}
              onChange={(event) => { setQuery(event.target.value); setPage(1) }}
              placeholder="Search issue, action, or actor"
              aria-label="Search audit events"
              className="input-field pl-9 text-xs"
            />
          </label>
          <div className="flex items-center gap-1" role="group" aria-label="Filter by event type">
            {['All', 'Change', 'Comment'].map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => changeKind(option)}
                aria-pressed={kind === option}
                className={`rounded px-2.5 py-1 text-xs transition ${kind === option ? 'bg-qf-primary/20 text-qf-text' : 'text-qf-muted hover:bg-qf-card hover:text-qf-text'}`}
              >
                {option}
              </button>
            ))}
            <Badge tone="muted" className="ml-2"><Activity size={11} /> {events.length}</Badge>
          </div>
        </div>

        <section className="overflow-hidden rounded-lg border border-qf-border bg-qf-surface">
          {visible.length === 0 ? (
            <EmptyState
              icon={Activity}
              title="No audit events"
              description={query || kind !== 'All' ? 'No events match the current filters.' : 'Changes to issues and comments will appear here.'}
            />
          ) : (
            <ul className="divide-y divide-qf-border">
              {visible.map((event) => (
                <li key={`${event.kind}-${event.id}`} className="flex items-start gap-3 px-5 py-3.5">
                  <span className={`mt-0.5 rounded-md p-2 ${event.kind === 'Comment' ? 'bg-qf-info/12 text-qf-info' : 'bg-qf-success/12 text-qf-success'}`}>
                    {event.kind === 'Comment' ? <MessageSquare size={15} /> : <Pencil size={15} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-qf-secondary">
                      <strong className="font-medium text-qf-text">{event.actor || 'Unknown user'}</strong> {event.action} on{' '}
                      <Link to={`/issues/${event.issueId}`} className="font-mono text-qf-info hover:underline">{event.issueId}</Link>
                    </p>
                    <p className="mt-0.5 text-[11px] text-qf-muted">{formatTimestamp(event.createdAt)}</p>
                  </div>
                  <Badge tone={event.kind === 'Comment' ? 'blue' : 'green'} className="hidden sm:inline-flex">{event.kind}</Badge>
                </li>
              ))}
            </ul>
          )}
          {events.length > pageSize && (
            <Pagination page={page} pageSize={pageSize} total={events.length} onPageChange={setPage} itemLabel="events" />
          )}
        </section>
      </div>
    </MainLayout>
  )
}

export default AuditLogsPage
