import { useMemo, useState } from 'react'
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  FileText,
  MessageSquare,
  Pencil,
  Plus,
  Tag,
  TestTube2,
  UserRound,
  Eye,
  EyeOff,
} from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import MainLayout from '../components/layout/MainLayout'
import { useQA } from '../context/QAContext'
import { formatTimestamp } from '../utils/time'

const statusOptions = ['To Do', 'In Progress', 'In Review', 'Done', 'Open', 'Resolved', 'Verified', 'Reopened', 'Closed', 'Ready', 'Draft']
const priorityColors = {
  Critical: 'border-red-400/30 bg-red-400/10 text-red-300',
  High: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
  Medium: 'border-blue-400/30 bg-blue-400/10 text-blue-300',
  Low: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
}

const IssueDetailPage = () => {
  const { issueId } = useParams()
  const navigate = useNavigate()
  const {
    tasks,
    requirements,
    testCases,
    bugs,
    comments,
    activity,
    epics,
    sprints,
    updateIssue,
    updateBugStatus,
    addComment,
    watchers,
    toggleWatcher,
  } = useQA()
  const [comment, setComment] = useState('')
  const [commentAttachment, setCommentAttachment] = useState(null)
  const [editing, setEditing] = useState(false)
  const [linkTarget, setLinkTarget] = useState('')

  const issue = useMemo(
    () => [...tasks, ...requirements, ...testCases, ...bugs].find((item) => item.id === issueId),
    [bugs, issueId, requirements, tasks, testCases],
  )

  if (!issue) {
    return (
      <MainLayout>
        <div className="mx-auto max-w-3xl py-16 text-center">
          <p className="text-sm text-jira-muted">Issue not found.</p>
          <button onClick={() => navigate(-1)} className="btn-ghost mt-4">Go back</button>
        </div>
      </MainLayout>
    )
  }

  const issueComments = comments.filter((item) => item.issueId === issueId)
  const issueActivity = activity.filter((item) => item.issueId === issueId)
  const issueType = issue.type || (issue.severity ? 'Bug' : issue.requirementIds ? 'Test case' : 'Requirement')
  const linkedRequirements = (issue.requirementIds || []).map((id) => requirements.find((item) => item.id === id)).filter(Boolean)
  const linkedTests = testCases.filter((test) => (test.requirementIds || []).some((id) => id === issue.id || linkedRequirements.some((requirement) => requirement.id === id)))
  const linkedIssueIds = issue.linkedIssueIds || []
  const linkedIssues = [...tasks, ...requirements, ...testCases, ...bugs]
    .filter((item) => item.id !== issue.id && linkedIssueIds.includes(item.id))
  const linkCandidates = [...tasks, ...requirements, ...testCases, ...bugs]
    .filter((item) => item.id !== issue.id && !linkedIssueIds.includes(item.id))
  const epic = epics.find((item) => item.id === issue.epicId)
  const sprint = sprints.find((item) => item.id === issue.sprintId)

  const updateField = (field, value) => {
    if (field === 'status' && issueType === 'Bug') {
      updateBugStatus(issue.id, value)
      return
    }
    updateIssue(issue.id, { [field]: value })
  }
  const addLinkedIssue = () => {
    if (!linkTarget) return
    updateField('linkedIssueIds', [...linkedIssueIds, linkTarget])
    setLinkTarget('')
  }
  const removeLinkedIssue = (linkedId) => updateField('linkedIssueIds', linkedIssueIds.filter((id) => id !== linkedId))
  const submitComment = (event) => {
    event.preventDefault()
    if (!comment.trim()) return
    addComment(issue.id, comment, 'You', commentAttachment)
    setComment('')
    setCommentAttachment(null)
  }

  return (
    <MainLayout>
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-xs text-[#8B97A9] hover:text-white">
            <ArrowLeft size={14} /> Back to work
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#78849A]">Issue workspace</span>
            <button type="button" onClick={() => toggleWatcher(issue.id)} className="btn-ghost text-xs">
              {watchers.includes(issue.id) ? <EyeOff size={14} /> : <Eye size={14} />}
              {watchers.includes(issue.id) ? 'Unwatch' : 'Watch'}
            </button>
          </div>
        </div>

        <header className="rounded-xl border border-[#242D40] bg-[#171B25] p-5 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-mono font-semibold text-[#6EA8FF]">{issue.id}</span>
                <span className="text-[#4A566B]">•</span>
                <span className="rounded border border-[#2B3345] bg-[#141A26] px-2 py-1 text-[#AAB5C7]">{issueType}</span>
                {issue.priority && <span className={`rounded border px-2 py-1 ${priorityColors[issue.priority] || priorityColors.Medium}`}>{issue.priority}</span>}
              </div>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">{issue.title}</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[#AAB5C7]">{issue.description || 'No description has been added to this issue yet.'}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {(issue.labels || []).map((label) => <span key={label} className="inline-flex items-center gap-1 rounded-full border border-[#2B3345] bg-[#141A26] px-2.5 py-1 text-[11px] text-[#AAB5C7]"><Tag size={11} />{label}</span>)}
                {!issue.labels?.length && <span className="text-xs text-[#78849A]">No labels</span>}
              </div>
            </div>
            <button onClick={() => setEditing((value) => !value)} className="btn-ghost shrink-0 text-xs">
              <Pencil size={14} /> {editing ? 'Close editor' : 'Edit issue'}
            </button>
          </div>
        </header>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="space-y-5">
            <section className="dashboard-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-white"><MessageSquare size={16} className="text-[#6EA8FF]" /> Comments</h2>
                <span className="text-xs text-[#78849A]">{issueComments.length}</span>
              </div>
              <form onSubmit={submitComment} className="flex flex-col gap-3">
                <textarea value={comment} onChange={(event) => setComment(event.target.value)} rows={2} placeholder="Add an update or ask a question..." className="input-field resize-none" />
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-[#AAB5C7] hover:text-white">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0]
                        if (!file) return
                        if (file.size > 500 * 1024) return
                        const reader = new FileReader()
                        reader.onload = () => setCommentAttachment({ name: file.name, type: file.type, data: reader.result })
                        reader.readAsDataURL(file)
                      }}
                    />
                    <span className="rounded border border-[#2B3345] px-2.5 py-1.5">Attach screenshot</span>
                    {commentAttachment && <span className="max-w-[14rem] truncate text-[#6EA8FF]">{commentAttachment.name}</span>}
                  </label>
                  <button className="btn-primary self-end sm:self-start"><Plus size={14} /> Comment</button>
                </div>
              </form>
              <div className="mt-5 space-y-3">
                {issueComments.length ? issueComments.map((item) => (
                  <div key={item.id} className="rounded-lg border border-[#242D40] bg-[#141A26] p-3">
                    <div className="flex items-center justify-between gap-3 text-xs"><span className="font-semibold text-white">{item.author}</span><span className="text-[#78849A]">{formatTimestamp(item.createdAt)}</span></div>
                    <p className="mt-2 text-sm leading-6 text-[#AAB5C7]">{item.body}</p>
                    {item.attachment?.data && (
                      <a href={item.attachment.data} target="_blank" rel="noreferrer" className="mt-3 block max-w-sm overflow-hidden rounded-lg border border-[#2B3345]">
                        <img src={item.attachment.data} alt={item.attachment.name || 'Attached evidence'} className="max-h-56 w-full object-contain" />
                        <span className="block border-t border-[#2B3345] px-3 py-2 text-[11px] text-[#6EA8FF]">{item.attachment.name}</span>
                      </a>
                    )}
                  </div>
                )) : <p className="py-5 text-center text-xs text-jira-muted">No comments yet. Add the first update.</p>}
              </div>
            </section>

            <section className="dashboard-card p-5">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white"><CheckCircle2 size={16} className="text-[#49C2B1]" /> Activity</h2>
              <div className="space-y-3">
                {issueActivity.length ? issueActivity.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 text-xs"><span className="mt-1 h-2 w-2 rounded-full bg-[#4B8DFF]" /><p className="text-[#AAB5C7]"><strong className="text-white">{item.actor}</strong> {item.action}<span className="ml-2 text-[#78849A]">{formatTimestamp(item.createdAt)}</span></p></div>
                )) : <p className="text-xs text-jira-muted">No activity recorded.</p>}
              </div>
            </section>

            <section className="dashboard-card p-5">
              <h2 className="mb-4 text-sm font-semibold text-white">Quality links</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <LinkGroup icon={FileText} title="Requirements" items={linkedRequirements} empty="No linked requirements" />
                <LinkGroup icon={TestTube2} title="Test cases" items={linkedTests} empty="No linked test cases" />
              </div>
              <div className="mt-3 rounded-lg border border-[#242D40] bg-[#141A26] p-3">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-xs font-semibold text-[#DDE5F2]">Related issues</h3>
                  <span className="text-[11px] text-[#78849A]">{linkedIssues.length} linked</span>
                </div>
                <div className="mt-3 space-y-2">
                  {linkedIssues.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 text-xs">
                      <Link to={`/issues/${item.id}`} className="min-w-0 flex-1 truncate text-[#6EA8FF] hover:underline">{item.id} · {item.title}</Link>
                      <button type="button" onClick={() => removeLinkedIssue(item.id)} className="text-[#78849A] hover:text-red-300" aria-label={`Unlink ${item.id}`}>Remove</button>
                    </div>
                  ))}
                  {!linkedIssues.length && <p className="text-xs text-[#78849A]">Link related QA work to keep traceability explicit.</p>}
                </div>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <select value={linkTarget} onChange={(event) => setLinkTarget(event.target.value)} className="input-field">
                    <option value="">Select an issue to link</option>
                    {linkCandidates.map((item) => <option key={item.id} value={item.id}>{item.id} · {item.title}</option>)}
                  </select>
                  <button type="button" onClick={addLinkedIssue} disabled={!linkTarget} className="btn-primary shrink-0 disabled:cursor-not-allowed disabled:opacity-50"><Plus size={14} /> Link</button>
                </div>
              </div>
            </section>
          </div>

          <aside className="dashboard-card h-fit p-5 lg:sticky lg:top-20">
            <h2 className="mb-4 text-sm font-semibold text-white">Details</h2>
            <div className="space-y-4 text-xs">
              <Field label="Status">
                <select value={issue.status || 'Open'} onChange={(event) => updateField('status', event.target.value)} className="input-field">{statusOptions.map((option) => <option key={option}>{option}</option>)}</select>
              </Field>
              <Field label="Priority" icon={Tag}>
                <select value={issue.priority || 'Medium'} onChange={(event) => updateField('priority', event.target.value)} className="input-field">{['Critical', 'High', 'Medium', 'Low'].map((option) => <option key={option}>{option}</option>)}</select>
              </Field>
              <Field label="Assignee" icon={UserRound}>
                <input value={issue.assignee || issue.owner || ''} onChange={(event) => updateField('assignee', event.target.value)} placeholder="Unassigned" className="input-field" />
              </Field>
              {editing && <>
                <Field label="Sprint" icon={Clock3}><select value={issue.sprintId || ''} onChange={(event) => updateField('sprintId', event.target.value)} className="input-field"><option value="">No sprint</option>{sprints.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
                <Field label="Epic"><select value={issue.epicId || ''} onChange={(event) => updateField('epicId', event.target.value)} className="input-field"><option value="">No epic</option>{epics.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></Field>
                <Field label="Labels"><input defaultValue={(issue.labels || []).join(', ')} onBlur={(event) => updateField('labels', event.target.value.split(',').map((label) => label.trim()).filter(Boolean))} placeholder="security, regression" className="input-field" /></Field>
              </>}
              <div><span className="mb-1.5 block text-[#78849A]">Issue type</span><p className="text-sm text-[#DDE5F2]">{issueType}</p></div>
              {sprint && <div><span className="mb-1.5 block text-[#78849A]">Sprint</span><Link to="/sprints" className="text-[#6EA8FF] hover:underline">{sprint.name}</Link></div>}
              {epic && <div><span className="mb-1.5 block text-[#78849A]">Epic</span><p className="text-[#DDE5F2]">{epic.title}</p></div>}
            </div>
          </aside>
        </div>
      </div>
    </MainLayout>
  )
}

const Field = ({ label, icon: Icon, children }) => (
  <label className="block">
    <span className="mb-1.5 flex items-center gap-1.5 text-[#78849A]">{Icon && <Icon size={13} />}{label}</span>
    {children}
  </label>
)

const LinkGroup = ({ icon: Icon, title, items, empty }) => (
  <div className="rounded-lg border border-[#242D40] bg-[#141A26] p-3">
    <h3 className="flex items-center gap-2 text-xs font-semibold text-[#DDE5F2]"><Icon size={14} className="text-[#6EA8FF]" />{title}</h3>
    <div className="mt-3 space-y-2">
      {items.length ? items.map((item) => <Link key={item.id} to={`/issues/${item.id}`} className="block truncate text-xs text-[#6EA8FF] hover:underline">{item.id} · {item.title}</Link>) : <p className="text-xs text-[#78849A]">{empty}</p>}
    </div>
  </div>
)

export default IssueDetailPage
