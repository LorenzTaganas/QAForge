import { useMemo, useState } from 'react'
import { Activity, Filter, MessageSquare, Pencil, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import MainLayout from '../components/layout/MainLayout'
import { useQA } from '../context/QAContext'
import { formatTimestamp, getTimestamp } from '../utils/time'
import { belongsToProject } from '../utils/projectScope'

const AuditLogsPage = () => {
  const { activity, comments, tasks, requirements, testCases, bugs, selectedProjectKey } = useQA()
  const projectIssueIds = new Set([...tasks, ...requirements, ...testCases, ...bugs].filter((item) => belongsToProject(item, selectedProjectKey)).map((item) => item.id))
  const [query, setQuery] = useState('')
  const [kind, setKind] = useState('All')
  const events = useMemo(() => [
    ...activity.map((event) => ({ ...event, kind: 'Change' })),
    ...comments.map((comment) => ({ id: comment.id, issueId: comment.issueId, action: 'added a comment', actor: comment.author, createdAt: comment.createdAt, kind: 'Comment' })),
  ].filter((event) => {
    if (!projectIssueIds.has(event.issueId)) return false
    const haystack = `${event.issueId} ${event.action} ${event.actor}`.toLowerCase()
    return (!query || haystack.includes(query.toLowerCase())) && (kind === 'All' || event.kind === kind)
  }).sort((first, second) => getTimestamp(second.createdAt) - getTimestamp(first.createdAt)), [activity, comments, kind, query])

  return <MainLayout><div className="mx-auto flex max-w-[1200px] flex-col gap-6">
    <div className="flex flex-col gap-4 border-b border-[#20283A] pb-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="section-title">Administration / History</p><h1 className="mt-1 section-heading text-white">Audit log</h1><p className="mt-2 text-sm text-jira-muted">Review issue changes and collaboration events across QAForge.</p></div><span className="flex items-center gap-2 text-xs text-[#78849A]"><Activity size={15} /> {events.length} events</span></div>
    <div className="dashboard-card flex flex-col gap-3 p-4 sm:flex-row"><label className="relative flex-1"><Search className="absolute left-3 top-2.5 text-[#78849A]" size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search issue, action, or actor" className="input-field pl-9" /></label><div className="flex items-center gap-2 text-xs"><Filter size={14} className="text-[#78849A]" />{['All', 'Change', 'Comment'].map((option) => <button key={option} onClick={() => setKind(option)} className={kind === option ? 'dashboard-filter-active' : 'dashboard-filter'}>{option}</button>)}</div></div>
    <section className="dashboard-card overflow-hidden"><div className="divide-y divide-[#242D40]">{events.map((event) => <div key={`${event.kind}-${event.id}`} className="flex items-start gap-3 px-5 py-4"><div className={`mt-0.5 rounded-md p-2 ${event.kind === 'Comment' ? 'bg-[#1D3A68] text-[#6EA8FF]' : 'bg-[#19352F] text-[#49C2B1]'}`}>{event.kind === 'Comment' ? <MessageSquare size={15} /> : <Pencil size={15} />}</div><div className="min-w-0 flex-1"><p className="text-sm text-[#AAB5C7]"><strong className="text-white">{event.actor}</strong> {event.action} on <Link to={`/issues/${event.issueId}`} className="font-mono text-[#6EA8FF] hover:underline">{event.issueId}</Link></p><p className="mt-1 text-xs text-[#78849A]">{formatTimestamp(event.createdAt)}</p></div><span className="hidden rounded-full border border-[#2B3345] px-2 py-1 text-[10px] text-[#78849A] sm:inline">{event.kind}</span></div>)}</div>{!events.length && <p className="p-10 text-center text-sm text-jira-muted">No audit events match the current filters.</p>}</section>
  </div></MainLayout>
}

export default AuditLogsPage
