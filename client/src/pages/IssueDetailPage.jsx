import { useMemo, useState } from 'react'
import { ArrowLeft, CheckCircle2, MessageSquare, Pencil, Tag, UserRound } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import MainLayout from '../components/layout/MainLayout'
import { useQA } from '../context/QAContext'

const IssueDetailPage = () => {
  const { issueId } = useParams()
  const navigate = useNavigate()
  const { tasks, requirements, testCases, bugs, comments, activity, updateIssue, addComment } = useQA()
  const [comment, setComment] = useState('')
  const issue = useMemo(() => [...tasks, ...requirements, ...testCases, ...bugs].find((item) => item.id === issueId), [bugs, issueId, requirements, tasks, testCases])
  const issueComments = comments.filter((item) => item.issueId === issueId)
  const issueActivity = activity.filter((item) => item.issueId === issueId)

  if (!issue) return <MainLayout><div className="mx-auto max-w-3xl py-16 text-center"><p className="text-sm text-jira-muted">Issue not found.</p><button onClick={() => navigate(-1)} className="btn-ghost mt-4">Go back</button></div></MainLayout>

  const updateStatus = (event) => updateIssue(issue.id, { status: event.target.value })
  const submitComment = (event) => { event.preventDefault(); addComment(issue.id, comment); setComment('') }

  return <MainLayout><div className="mx-auto max-w-6xl space-y-5">
    <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-xs text-[#8B97A9] hover:text-white"><ArrowLeft size={14} /> Back to work</button>
    <div className="flex flex-col gap-4 border-b border-[#242D40] pb-5 lg:flex-row lg:items-start lg:justify-between"><div><div className="flex items-center gap-2 text-xs text-[#6EA8FF]"><span className="font-mono">{issue.id}</span><span>•</span><span>{issue.type || 'Issue'}</span></div><h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">{issue.title}</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-[#AAB5C7]">{issue.description || 'No description has been added to this issue yet.'}</p></div><button className="btn-ghost text-xs"><Pencil size={14} /> Edit issue</button></div>
    <div className="grid gap-5 lg:grid-cols-[1fr_18rem]"><div className="space-y-5"><section className="dashboard-card p-5"><div className="mb-4 flex items-center gap-2 text-sm font-semibold text-white"><MessageSquare size={16} className="text-[#6EA8FF]" /> Comments</div><form onSubmit={submitComment} className="flex flex-col gap-3 sm:flex-row"><textarea value={comment} onChange={(event) => setComment(event.target.value)} rows={2} placeholder="Add an update or ask a question..." className="input-field resize-none" /><button className="btn-primary self-end sm:self-start">Comment</button></form><div className="mt-5 space-y-3">{issueComments.length ? issueComments.map((item) => <div key={item.id} className="rounded-lg border border-[#242D40] bg-[#141A26] p-3"><div className="flex items-center justify-between text-xs"><span className="font-semibold text-white">{item.author}</span><span className="text-[#78849A]">{item.createdAt}</span></div><p className="mt-2 text-sm leading-6 text-[#AAB5C7]">{item.body}</p></div>) : <p className="py-5 text-center text-xs text-jira-muted">No comments yet.</p>}</div></section><section className="dashboard-card p-5"><div className="mb-4 flex items-center gap-2 text-sm font-semibold text-white"><CheckCircle2 size={16} className="text-[#49C2B1]" /> Activity</div><div className="space-y-3">{issueActivity.length ? issueActivity.map((item) => <div key={item.id} className="flex items-start gap-3 text-xs"><span className="mt-1 h-2 w-2 rounded-full bg-[#4B8DFF]" /><p className="text-[#AAB5C7]"><strong className="text-white">{item.actor}</strong> {item.action}<span className="ml-2 text-[#78849A]">{item.createdAt}</span></p></div>) : <p className="text-xs text-jira-muted">No activity recorded.</p>}</div></section></div><aside className="dashboard-card h-fit p-5"><h2 className="mb-4 text-sm font-semibold text-white">Details</h2><div className="space-y-4 text-xs"><label className="block"><span className="mb-1.5 block text-[#78849A]">Status</span><select value={issue.status || 'Open'} onChange={updateStatus} className="input-field"><option>To Do</option><option>In Progress</option><option>In Review</option><option>Done</option><option>Open</option><option>Resolved</option><option>Closed</option><option>Ready</option><option>Draft</option></select></label><div><span className="mb-1.5 flex items-center gap-1.5 text-[#78849A]"><Tag size={13} /> Priority</span><p className="text-sm text-[#DDE5F2]">{issue.priority || 'Not set'}</p></div><div><span className="mb-1.5 flex items-center gap-1.5 text-[#78849A]"><UserRound size={13} /> Assignee</span><p className="text-sm text-[#DDE5F2]">{issue.assignee || issue.owner || 'Unassigned'}</p></div><div><span className="mb-1.5 block text-[#78849A]">Issue type</span><p className="text-sm text-[#DDE5F2]">{issue.type || (issue.severity ? 'Bug' : 'Requirement')}</p></div></div></aside></div>
  </div></MainLayout>
}

export default IssueDetailPage
