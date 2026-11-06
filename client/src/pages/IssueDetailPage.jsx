import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, CheckCircle2, Clock3, Copy, Eye, EyeOff, FileText, Link2,
  MessageSquare, Pencil, Plus, Save, Tag, TestTube2, Trash2, UserRound, X,
} from 'lucide-react'
import MainLayout from '../components/layout/MainLayout'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import EmptyState from '../components/ui/EmptyState'
import { Badge, IssueTypeIcon, PriorityBadge, SeverityBadge, StatusBadge, issueTypeLabel } from '../components/ui/Badges'
import { useQA } from '../context/useQA'
import { useAuth } from '../context/AuthContext'
import { canDeleteIssue } from '../utils/permissions'
import { formatTimestamp } from '../utils/time'
import { statusesByType } from './IssuesPage'

const priorities = ['Critical', 'High', 'Medium', 'Low']
const severities = ['Blocker', 'Critical', 'Major', 'Minor', 'Trivial']
const environments = ['Dev', 'Staging', 'Production']

const normalizeSteps = (steps) => (Array.isArray(steps) ? steps : [])
  .map((step) => (typeof step === 'string' ? { action: step, expected: '' } : { action: step.action || '', expected: step.expected || '' }))

const NotFound = ({ navigate }) => (
  <MainLayout>
    <EmptyState
      icon={FileText}
      title="Issue not found"
      description="It may have been deleted, or the link is out of date."
      action={<button type="button" onClick={() => navigate('/issues')} className="btn-ghost text-xs"><ArrowLeft size={13} /> Back to issues</button>}
    />
  </MainLayout>
)

const IssueDetailPage = () => {
  const { issueId } = useParams()
  const navigate = useNavigate()
  const {
    tasks, requirements, testCases, bugs, comments, activity, epics, sprints,
    testSuites, teamUsers, watchers, updateIssue, updateTestCase, deleteTask,
    deleteBug, deleteTestCase, deleteRequirement, addComment, toggleWatcher, showToast,
  } = useQA()
  const { user } = useAuth()

  const match = useMemo(() => {
    const bug = bugs.find((item) => item.id === issueId)
    if (bug) return { issue: bug, issueType: 'Bug' }
    const testCase = testCases.find((item) => item.id === issueId)
    if (testCase) return { issue: testCase, issueType: 'TestCase' }
    const requirement = requirements.find((item) => item.id === issueId)
    if (requirement) return { issue: requirement, issueType: 'Requirement' }
    const task = tasks.find((item) => item.id === issueId)
    if (task) return { issue: task, issueType: 'Task' }
    return null
  }, [bugs, issueId, requirements, tasks, testCases])

  const issue = match?.issue
  const issueType = match?.issueType
  const canDelete = canDeleteIssue(user?.role)

  const [comment, setComment] = useState('')
  const [commentAttachment, setCommentAttachment] = useState(null)
  const [draft, setDraft] = useState(null)
  const [linkTarget, setLinkTarget] = useState('')
  const [requirementTarget, setRequirementTarget] = useState('')
  const [pendingDelete, setPendingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [submittingComment, setSubmittingComment] = useState(false)

  useEffect(() => {
    setComment('')
    setCommentAttachment(null)
    setDraft(null)
    setLinkTarget('')
    setRequirementTarget('')
  }, [issueId])

  if (!issue) return <NotFound navigate={navigate} />

  const issueComments = comments.filter((item) => item.issueId === issueId)
  const issueActivity = activity.filter((item) => item.issueId === issueId)
  const linkedIssueIds = issue.linkedIssueIds || []
  const linkedIssues = [...tasks, ...requirements, ...testCases, ...bugs]
    .filter((item) => item.id !== issue.id && linkedIssueIds.includes(item.id))
  const allIssues = [...tasks, ...requirements, ...testCases, ...bugs]
  const linkCandidates = allIssues.filter((item) => item.id !== issue.id && !linkedIssueIds.includes(item.id))
  const epic = epics.find((item) => item.id === issue.epicId)
  const sprint = sprints.find((item) => item.id === issue.sprintId)
  const suite = testSuites.find((item) => item.id === issue.suiteId)
  const linkedTestCase = issue.linkedTestCaseId ? testCases.find((item) => item.id === issue.linkedTestCaseId) : null
  const linkedRunId = issue.linkedTestRunId
  const steps = normalizeSteps(issue.steps)

  const linkedRequirements = issueType === 'TestCase'
    ? (issue.requirementIds || []).map((id) => requirements.find((item) => item.id === id)).filter(Boolean)
    : []
  const linkedTests = issueType === 'Requirement'
    ? testCases.filter((test) => (test.requirementIds || []).includes(issue.id))
    : []

  const statusChoices = statusesByType[issueType] || ['Open', 'In Progress', 'Resolved', 'Closed']
  const assigneeValue = issue.assignee ?? issue.owner ?? ''
  const assigneeOptions = [...new Set([...teamUsers.map((member) => member.name), assigneeValue, user?.name].filter(Boolean))]

  const commitAssignee = (value) => {
    const next = value.trim()
    if (next === assigneeValue) return
    updateIssue(issue.id, issueType === 'Bug' ? { assignee: next } : { assignee: next })
  }

  const startEditing = () => {
    setDraft({
      title: issue.title || '',
      description: issue.description || '',
      labels: (issue.labels || []).join(', '),
      due: issue.due || '',
      environment: issue.environment || 'Staging',
      severity: issue.severity || 'Major',
      stepsToReproduce: issue.stepsToReproduce || '',
      expectedBehavior: issue.expectedBehavior || '',
      actualBehavior: issue.actualBehavior || '',
      preconditions: issue.preconditions || '',
      acceptanceCriteria: issue.acceptanceCriteria || '',
    })
  }

  const saveEdits = async () => {
    if (!draft.title.trim()) {
      showToast('A title is required')
      return
    }
    const updates = {
      title: draft.title.trim(),
      description: draft.description,
      labels: draft.labels.split(',').map((label) => label.trim()).filter(Boolean),
    }
    if (issueType === 'Task') updates.due = draft.due
    if (issueType === 'Bug') {
      updates.environment = draft.environment
      updates.severity = draft.severity
      updates.stepsToReproduce = draft.stepsToReproduce
      updates.expectedBehavior = draft.expectedBehavior
      updates.actualBehavior = draft.actualBehavior
    }
    if (issueType === 'TestCase') updates.preconditions = draft.preconditions
    if (issueType === 'Requirement') updates.acceptanceCriteria = draft.acceptanceCriteria
    const saved = await updateIssue(issue.id, updates)
    if (saved) setDraft(null)
  }

  const addLinkedIssue = () => {
    if (!linkTarget) return
    updateIssue(issue.id, { linkedIssueIds: [...linkedIssueIds, linkTarget] })
    setLinkTarget('')
  }

  const removeLinkedIssue = (linkedId) => updateIssue(issue.id, { linkedIssueIds: linkedIssueIds.filter((id) => id !== linkedId) })

  const addRequirementLink = () => {
    if (!requirementTarget) return
    updateIssue(issue.id, { requirementIds: [...new Set([...(issue.requirementIds || []), requirementTarget])] })
    setRequirementTarget('')
  }

  const removeRequirementLink = (requirementId) => {
    updateIssue(issue.id, { requirementIds: (issue.requirementIds || []).filter((id) => id !== requirementId) })
  }

  const linkTestToRequirement = (testCaseId) => {
    const test = testCases.find((item) => item.id === testCaseId)
    if (!test) return
    updateTestCase(test.id, { requirementIds: [...new Set([...(test.requirementIds || []), issue.id])] })
  }

  const unlinkTestFromRequirement = (testCaseId) => {
    const test = testCases.find((item) => item.id === testCaseId)
    if (!test) return
    updateTestCase(test.id, { requirementIds: (test.requirementIds || []).filter((id) => id !== issue.id) })
  }

  const submitComment = async (event) => {
    event.preventDefault()
    if (!comment.trim() || submittingComment) return
    setSubmittingComment(true)
    const saved = await addComment(issue.id, comment, commentAttachment)
    setSubmittingComment(false)
    if (saved) {
      setComment('')
      setCommentAttachment(null)
    }
  }

  const pickAttachment = (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      showToast('Only image attachments are supported')
      return
    }
    if (file.size > 500 * 1024) {
      showToast('Attachments must be 500 KB or smaller')
      return
    }
    const reader = new FileReader()
    reader.onload = () => setCommentAttachment({ name: file.name, type: file.type, data: reader.result })
    reader.readAsDataURL(file)
  }

  const copyIssueKey = async () => {
    try {
      await navigator.clipboard.writeText(issue.id)
      showToast(`Copied ${issue.id}`)
    } catch {
      showToast('Could not copy the issue key')
    }
  }

  const confirmDelete = async () => {
    setDeleting(true)
    const remove = { Bug: deleteBug, TestCase: deleteTestCase, Requirement: deleteRequirement, Task: deleteTask }[issueType]
    const removed = await remove(issue.id)
    setDeleting(false)
    setPendingDelete(false)
    if (removed) navigate('/issues')
  }

  const isWatching = watchers.includes(issue.id)

  return (
    <MainLayout>
      <div className="mx-auto flex max-w-6xl flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button type="button" onClick={() => navigate('/issues')} className="inline-flex items-center gap-2 text-xs text-qf-muted hover:text-qf-text">
            <ArrowLeft size={14} /> All issues
          </button>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => toggleWatcher(issue.id)} className="btn-ghost text-xs">
              {isWatching ? <EyeOff size={14} /> : <Eye size={14} />}
              {isWatching ? 'Unwatch' : 'Watch'}
            </button>
            <button type="button" onClick={startEditing} className="btn-ghost text-xs">
              <Pencil size={14} /> {draft ? 'Editing' : 'Edit'}
            </button>
            {canDelete && (
              <button type="button" onClick={() => setPendingDelete(true)} className="btn-ghost text-xs text-qf-danger">
                <Trash2 size={14} /> Delete
              </button>
            )}
          </div>
        </div>

        <header className="rounded-lg border border-qf-border bg-qf-surface p-5">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button type="button" onClick={copyIssueKey} className="inline-flex items-center gap-1 rounded px-1 font-mono font-semibold text-qf-info transition hover:bg-qf-card" title={`Copy ${issue.id}`}>
              {issue.id} <Copy size={12} />
            </button>
            <span className="text-qf-border-strong">•</span>
            <span className="inline-flex items-center gap-1.5 rounded border border-qf-border bg-qf-card px-2 py-0.5 text-qf-secondary">
              <IssueTypeIcon type={issueType} size={12} /> {issueTypeLabel(issueType)}
            </span>
            <StatusBadge status={issue.status} />
            <PriorityBadge priority={issue.priority} />
            {issueType === 'Bug' && <SeverityBadge severity={issue.severity} />}
            {issueType === 'TestCase' && issue.lastResult && <Badge tone="muted">Last result: {issue.lastResult}</Badge>}
          </div>
          {draft ? (
            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="mb-1 block text-[11px] font-medium text-qf-muted">Title</span>
                <input value={draft.title} onChange={(event) => setDraft((previous) => ({ ...previous, title: event.target.value }))} maxLength={240} className="input-field text-lg font-semibold" />
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-medium text-qf-muted">Description</span>
                <textarea value={draft.description} onChange={(event) => setDraft((previous) => ({ ...previous, description: event.target.value }))} rows={3} className="input-field resize-y" />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-[11px] font-medium text-qf-muted">Labels (comma separated)</span>
                  <input value={draft.labels} onChange={(event) => setDraft((previous) => ({ ...previous, labels: event.target.value }))} className="input-field" />
                </label>
                {issueType === 'Task' && (
                  <label className="block">
                    <span className="mb-1 block text-[11px] font-medium text-qf-muted">Due date</span>
                    <input type="date" value={draft.due} onChange={(event) => setDraft((previous) => ({ ...previous, due: event.target.value }))} className="input-field" />
                  </label>
                )}
                {issueType === 'Bug' && (
                  <>
                    <label className="block">
                      <span className="mb-1 block text-[11px] font-medium text-qf-muted">Severity</span>
                      <select value={draft.severity} onChange={(event) => setDraft((previous) => ({ ...previous, severity: event.target.value }))} className="input-field">
                        {severities.map((option) => <option key={option}>{option}</option>)}
                      </select>
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-[11px] font-medium text-qf-muted">Environment</span>
                      <select value={draft.environment} onChange={(event) => setDraft((previous) => ({ ...previous, environment: event.target.value }))} className="input-field">
                        {environments.map((option) => <option key={option}>{option}</option>)}
                      </select>
                    </label>
                    <label className="block sm:col-span-2">
                      <span className="mb-1 block text-[11px] font-medium text-qf-muted">Steps to reproduce</span>
                      <textarea value={draft.stepsToReproduce} onChange={(event) => setDraft((previous) => ({ ...previous, stepsToReproduce: event.target.value }))} rows={4} className="input-field resize-y" />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-[11px] font-medium text-qf-muted">Expected result</span>
                      <textarea value={draft.expectedBehavior} onChange={(event) => setDraft((previous) => ({ ...previous, expectedBehavior: event.target.value }))} rows={2} className="input-field resize-y" />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-[11px] font-medium text-qf-muted">Actual result</span>
                      <textarea value={draft.actualBehavior} onChange={(event) => setDraft((previous) => ({ ...previous, actualBehavior: event.target.value }))} rows={2} className="input-field resize-y" />
                    </label>
                  </>
                )}
                {issueType === 'TestCase' && (
                  <label className="block sm:col-span-2">
                    <span className="mb-1 block text-[11px] font-medium text-qf-muted">Preconditions</span>
                    <textarea value={draft.preconditions} onChange={(event) => setDraft((previous) => ({ ...previous, preconditions: event.target.value }))} rows={2} className="input-field resize-y" />
                  </label>
                )}
                {issueType === 'Requirement' && (
                  <label className="block sm:col-span-2">
                    <span className="mb-1 block text-[11px] font-medium text-qf-muted">Acceptance criteria</span>
                    <textarea value={draft.acceptanceCriteria} onChange={(event) => setDraft((previous) => ({ ...previous, acceptanceCriteria: event.target.value }))} rows={3} className="input-field resize-y" />
                  </label>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setDraft(null)} className="btn-ghost text-xs"><X size={13} /> Cancel</button>
                <button type="button" onClick={saveEdits} className="btn-primary text-xs"><Save size={13} /> Save changes</button>
              </div>
            </div>
          ) : (
            <>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight text-qf-text sm:text-3xl">{issue.title}</h1>
              <p className="mt-3 max-w-3xl whitespace-pre-wrap text-sm leading-6 text-qf-secondary">{issue.description || 'No description has been added yet.'}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {(issue.labels || []).map((label) => (
                  <span key={label} className="inline-flex items-center gap-1 rounded-full border border-qf-border bg-qf-card px-2.5 py-0.5 text-[11px] text-qf-secondary"><Tag size={10} />{label}</span>
                ))}
                {!issue.labels?.length && <span className="text-xs text-qf-muted">No labels</span>}
              </div>
            </>
          )}
        </header>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_19rem]">
          <div className="space-y-5">
            {issueType === 'Bug' && (
              <section className="rounded-lg border border-qf-border bg-qf-surface p-5">
                <h2 className="text-sm font-semibold text-qf-text">Reproduction details</h2>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <div>
                    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-qf-muted">Steps to reproduce</h3>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-qf-secondary">{issue.stepsToReproduce || 'Not provided.'}</p>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-qf-muted">Expected result</h3>
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-qf-secondary">{issue.expectedBehavior || 'Not provided.'}</p>
                    </div>
                    <div>
                      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-qf-muted">Actual result</h3>
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-qf-secondary">{issue.actualBehavior || 'Not provided.'}</p>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {issueType === 'TestCase' && (
              <section className="rounded-lg border border-qf-border bg-qf-surface p-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-qf-text">Test steps</h2>
                  <Badge tone="muted">{issue.type || 'Functional'}</Badge>
                </div>
                {issue.preconditions && (
                  <p className="mt-3 rounded border border-qf-border bg-qf-input px-3 py-2 text-xs text-qf-secondary"><span className="text-qf-muted">Preconditions: </span>{issue.preconditions}</p>
                )}
                {steps.length ? (
                  <ol className="mt-3 space-y-1.5">
                    {steps.map((step, index) => (
                      <li key={index} className="grid gap-1 rounded border border-qf-border bg-qf-input px-3 py-2 text-xs sm:grid-cols-[1.5rem_1fr_1fr]">
                        <span className="font-mono text-[10px] text-qf-muted">{index + 1}</span>
                        <span className="text-qf-text">{step.action || '—'}</span>
                        <span className="text-qf-muted">{step.expected || 'Verify expected behavior'}</span>
                      </li>
                    ))}
                  </ol>
                ) : <p className="mt-3 text-xs text-qf-muted">No steps recorded yet. Use Edit to add them.</p>}
              </section>
            )}

            <section className="rounded-lg border border-qf-border bg-qf-surface p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-qf-text"><MessageSquare size={15} className="text-qf-info" /> Comments</h2>
                <span className="text-xs text-qf-muted">{issueComments.length}</span>
              </div>
              <form onSubmit={submitComment} className="space-y-3">
                <textarea value={comment} onChange={(event) => setComment(event.target.value)} rows={2} maxLength={5000} placeholder="Add an update, question, or evidence…" className="input-field resize-none text-xs" />
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded border border-qf-border px-2.5 py-1.5 text-[11px] text-qf-secondary hover:text-qf-text">
                      <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={pickAttachment} />
                      Attach screenshot
                    </label>
                    {commentAttachment && (
                      <span className="flex items-center gap-1 text-[11px] text-qf-info">
                        <span className="max-w-[10rem] truncate">{commentAttachment.name}</span>
                        <button type="button" onClick={() => setCommentAttachment(null)} aria-label="Remove attachment"><X size={12} /></button>
                      </span>
                    )}
                  </div>
                  <button type="submit" disabled={!comment.trim() || submittingComment} className="btn-primary text-xs">
                    <Plus size={13} /> {submittingComment ? 'Adding…' : 'Comment'}
                  </button>
                </div>
              </form>
              <div className="mt-5 space-y-3">
                {issueComments.length ? issueComments.map((item) => (
                  <article key={item.id} className="rounded-lg border border-qf-border bg-qf-card/40 p-3">
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <span className="font-semibold text-qf-text">{item.author}</span>
                      <span className="text-qf-muted">{formatTimestamp(item.createdAt)}</span>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-qf-secondary">{item.body}</p>
                    {item.attachment?.data && (
                      <a href={item.attachment.data} target="_blank" rel="noreferrer" className="mt-3 block max-w-sm overflow-hidden rounded border border-qf-border">
                        <img src={item.attachment.data} alt={item.attachment.name || 'Attached evidence'} className="max-h-56 w-full object-contain" />
                        <span className="block border-t border-qf-border px-3 py-2 text-[11px] text-qf-info">{item.attachment.name}</span>
                      </a>
                    )}
                  </article>
                )) : <p className="py-4 text-center text-xs text-qf-muted">No comments yet. Start the discussion.</p>}
              </div>
            </section>

            <section className="rounded-lg border border-qf-border bg-qf-surface p-5">
              <h2 className="text-sm font-semibold text-qf-text">Traceability</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {issueType === 'TestCase' && (
                  <div className="rounded border border-qf-border bg-qf-card/40 p-3">
                    <h3 className="flex items-center gap-1.5 text-xs font-semibold text-qf-text"><FileText size={13} className="text-qf-warning" /> Requirements</h3>
                    <div className="mt-2 space-y-1.5">
                      {linkedRequirements.map((requirement) => (
                        <div key={requirement.id} className="flex items-center gap-2 text-xs">
                          <Link to={`/issues/${requirement.id}`} className="min-w-0 flex-1 truncate text-qf-info hover:underline">{requirement.id} · {requirement.title}</Link>
                          <button type="button" onClick={() => removeRequirementLink(requirement.id)} className="text-qf-muted hover:text-qf-danger" aria-label={`Unlink ${requirement.id}`}><X size={12} /></button>
                        </div>
                      ))}
                      {!linkedRequirements.length && <p className="text-xs text-qf-muted">No linked requirements.</p>}
                    </div>
                    <div className="mt-2 flex gap-1.5">
                      <select value={requirementTarget} onChange={(event) => setRequirementTarget(event.target.value)} className="input-field py-1 text-[11px]">
                        <option value="">Link a requirement</option>
                        {requirements.filter((requirement) => !(issue.requirementIds || []).includes(requirement.id)).map((requirement) => (
                          <option key={requirement.id} value={requirement.id}>{requirement.id} · {requirement.title}</option>
                        ))}
                      </select>
                      <button type="button" onClick={addRequirementLink} disabled={!requirementTarget} className="btn-primary px-2 py-1 text-[11px] disabled:opacity-40">Link</button>
                    </div>
                  </div>
                )}

                {issueType === 'Requirement' && (
                  <div className="rounded border border-qf-border bg-qf-card/40 p-3">
                    <h3 className="flex items-center gap-1.5 text-xs font-semibold text-qf-text"><TestTube2 size={13} className="text-qf-success" /> Validating test cases</h3>
                    <div className="mt-2 space-y-1.5">
                      {linkedTests.map((test) => (
                        <div key={test.id} className="flex items-center gap-2 text-xs">
                          <Link to={`/issues/${test.id}`} className="min-w-0 flex-1 truncate text-qf-info hover:underline">{test.id} · {test.title}</Link>
                          <button type="button" onClick={() => unlinkTestFromRequirement(test.id)} className="text-qf-muted hover:text-qf-danger" aria-label={`Unlink ${test.id}`}><X size={12} /></button>
                        </div>
                      ))}
                      {!linkedTests.length && <p className="text-xs text-qf-muted">No test cases validate this requirement yet.</p>}
                    </div>
                    <div className="mt-2 flex gap-1.5">
                      <select value={requirementTarget} onChange={(event) => setRequirementTarget(event.target.value)} className="input-field py-1 text-[11px]">
                        <option value="">Link a test case</option>
                        {testCases.filter((test) => !(test.requirementIds || []).includes(issue.id)).map((test) => (
                          <option key={test.id} value={test.id}>{test.id} · {test.title}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => { linkTestToRequirement(requirementTarget); setRequirementTarget('') }}
                        disabled={!requirementTarget}
                        className="btn-primary px-2 py-1 text-[11px] disabled:opacity-40"
                      >Link</button>
                    </div>
                  </div>
                )}

                {(linkedTestCase || linkedRunId || issue.linkedTestRunId) && (
                  <div className="rounded border border-qf-border bg-qf-card/40 p-3">
                    <h3 className="text-xs font-semibold text-qf-text">Linked test evidence</h3>
                    <div className="mt-2 space-y-1 text-xs">
                      {linkedTestCase && <Link to={`/issues/${linkedTestCase.id}`} className="block text-qf-info hover:underline">{linkedTestCase.id} · {linkedTestCase.title}</Link>}
                      {linkedRunId && <Link to={`/test-runs/${linkedRunId}`} className="block text-qf-info hover:underline">{linkedRunId}</Link>}
                    </div>
                  </div>
                )}

                {suite && (
                  <div className="rounded border border-qf-border bg-qf-card/40 p-3">
                    <h3 className="text-xs font-semibold text-qf-text">Suite</h3>
                    <Link to="/test-suites" className="mt-1 block text-xs text-qf-info hover:underline">{suite.name}</Link>
                  </div>
                )}

                <div className="rounded border border-qf-border bg-qf-card/40 p-3 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <h3 className="flex items-center gap-1.5 text-xs font-semibold text-qf-text"><Link2 size={13} className="text-qf-primary" /> Related issues</h3>
                    <span className="text-[11px] text-qf-muted">{linkedIssues.length} linked</span>
                  </div>
                  <div className="mt-2 space-y-1.5">
                    {linkedIssues.map((item) => (
                      <div key={item.id} className="flex items-center gap-2 text-xs">
                        <IssueTypeIcon type={item.id.startsWith('BUG') ? 'Bug' : item.id.startsWith('TC') ? 'TestCase' : item.id.startsWith('REQ') ? 'Requirement' : 'Task'} size={12} />
                        <Link to={`/issues/${item.id}`} className="min-w-0 flex-1 truncate text-qf-info hover:underline">{item.id} · {item.title}</Link>
                        <button type="button" onClick={() => removeLinkedIssue(item.id)} className="text-qf-muted hover:text-qf-danger" aria-label={`Unlink ${item.id}`}><X size={12} /></button>
                      </div>
                    ))}
                    {!linkedIssues.length && <p className="text-xs text-qf-muted">Link related work to keep traceability explicit.</p>}
                  </div>
                  <div className="mt-2 flex gap-1.5">
                    <select value={linkTarget} onChange={(event) => setLinkTarget(event.target.value)} className="input-field py-1 text-[11px]">
                      <option value="">Select an issue to link</option>
                      {linkCandidates.map((item) => <option key={item.id} value={item.id}>{item.id} · {item.title}</option>)}
                    </select>
                    <button type="button" onClick={addLinkedIssue} disabled={!linkTarget} className="btn-primary px-2 py-1 text-[11px] disabled:opacity-40">Link</button>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-qf-border bg-qf-surface p-5">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-qf-text"><CheckCircle2 size={15} className="text-qf-success" /> Activity</h2>
              <div className="mt-3 space-y-3">
                {issueActivity.length ? issueActivity.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 text-xs">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-qf-info" />
                    <p className="text-qf-secondary"><strong className="text-qf-text">{item.actor}</strong> {item.action}<span className="ml-2 text-qf-muted">{formatTimestamp(item.createdAt)}</span></p>
                  </div>
                )) : <p className="text-xs text-qf-muted">No activity recorded.</p>}
              </div>
            </section>
          </div>

          <aside className="h-fit rounded-lg border border-qf-border bg-qf-surface p-4 lg:sticky lg:top-4">
            <h2 className="mb-4 text-sm font-semibold text-qf-text">Details</h2>
            <div className="space-y-4 text-xs">
              <label className="block">
                <span className="mb-1.5 block text-qf-muted">Status</span>
                <select value={issue.status || 'Open'} onChange={(event) => updateIssue(issue.id, { status: event.target.value })} className="input-field">
                  {[...new Set([issue.status, ...statusChoices])].filter(Boolean).map((option) => <option key={option}>{option}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-qf-muted">Priority</span>
                <select value={issue.priority || 'Medium'} onChange={(event) => updateIssue(issue.id, { priority: event.target.value })} className="input-field">
                  {priorities.map((option) => <option key={option}>{option}</option>)}
                </select>
              </label>
              {issueType === 'Bug' && (
                <>
                  <label className="block">
                    <span className="mb-1.5 block text-qf-muted">Severity</span>
                    <select value={issue.severity || 'Major'} onChange={(event) => updateIssue(issue.id, { severity: event.target.value })} className="input-field">
                      {severities.map((option) => <option key={option}>{option}</option>)}
                    </select>
                  </label>
                  <div>
                    <span className="mb-1.5 block text-qf-muted">Environment</span>
                    <p className="text-sm text-qf-text">{issue.environment || 'Not set'}</p>
                  </div>
                  <div>
                    <span className="mb-1.5 block text-qf-muted">Reporter</span>
                    <p className="text-sm text-qf-text">{issue.reporter || 'Unknown'}</p>
                  </div>
                </>
              )}
              <label className="block">
                <span className="mb-1.5 flex items-center gap-1.5 text-qf-muted"><UserRound size={12} /> Assignee</span>
                <input
                  key={`${issue.id}-${assigneeValue}`}
                  defaultValue={assigneeValue}
                  list={`assignees-${issue.id}`}
                  onBlur={(event) => commitAssignee(event.target.value)}
                  onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur() }}
                  placeholder="Unassigned"
                  className="input-field"
                />
                <datalist id={`assignees-${issue.id}`}>
                  {assigneeOptions.map((name) => <option key={name} value={name} />)}
                </datalist>
              </label>
              {issueType === 'Task' && (
                <>
                  <label className="block">
                    <span className="mb-1.5 flex items-center gap-1.5 text-qf-muted"><Clock3 size={12} /> Sprint</span>
                    <select value={issue.sprintId || ''} onChange={(event) => updateIssue(issue.id, { sprintId: event.target.value })} className="input-field">
                      <option value="">Backlog</option>
                      {sprints.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-qf-muted">Epic</span>
                    <select value={issue.epicId || ''} onChange={(event) => updateIssue(issue.id, { epicId: event.target.value })} className="input-field">
                      <option value="">No epic</option>
                      {epics.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
                    </select>
                  </label>
                  {issue.due && (
                    <div>
                      <span className="mb-1.5 block text-qf-muted">Due date</span>
                      <p className="text-sm text-qf-text">{issue.due}</p>
                    </div>
                  )}
                </>
              )}
              {issueType === 'TestCase' && (
                <label className="block">
                  <span className="mb-1.5 block text-qf-muted">Suite</span>
                  <select value={issue.suiteId || ''} onChange={(event) => updateIssue(issue.id, { suiteId: event.target.value })} className="input-field">
                    <option value="">No suite</option>
                    {testSuites.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                </label>
              )}
              <div>
                <span className="mb-1.5 block text-qf-muted">Issue type</span>
                <p className="flex items-center gap-1.5 text-sm text-qf-text"><IssueTypeIcon type={issueType} size={13} /> {issueTypeLabel(issueType)}</p>
              </div>
              {sprint && (
                <div>
                  <span className="mb-1.5 block text-qf-muted">Sprint</span>
                  <Link to="/sprints" className="text-qf-info hover:underline">{sprint.name}</Link>
                </div>
              )}
              {epic && (
                <div>
                  <span className="mb-1.5 block text-qf-muted">Epic</span>
                  <p className="text-sm text-qf-text">{epic.title}</p>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      <ConfirmDialog
        open={pendingDelete}
        title={`Delete ${issue.id}?`}
        description="This permanently removes the issue, its comments, and its links. This cannot be undone."
        confirmLabel="Delete issue"
        busy={deleting}
        onConfirm={confirmDelete}
        onClose={() => setPendingDelete(false)}
      />
    </MainLayout>
  )
}

export default IssueDetailPage
