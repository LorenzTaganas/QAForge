import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  AlertTriangle, ArrowLeft, Bug, CheckCircle2, ChevronLeft, ChevronRight,
  CircleSlash, Clock3, Flag, MessageSquare, PlayCircle, Save, SkipForward, XCircle,
} from 'lucide-react'
import MainLayout from '../components/layout/MainLayout'
import EmptyState from '../components/ui/EmptyState'
import { Badge, ResultBadge, StatusBadge } from '../components/ui/Badges'
import { useQA } from '../context/useQA'
import { useAuth } from '../context/AuthContext'
import { formatTimestamp } from '../utils/time'

const executedResults = ['Passed', 'Failed', 'Blocked', 'Skipped']

const computeRunStats = (run) => {
  const cases = Array.isArray(run?.cases) ? run.cases : []
  const count = (result) => cases.filter((item) => item.result === result).length
  const executed = cases.filter((item) => executedResults.includes(item.result)).length
  return {
    total: cases.length,
    passed: count('Passed'),
    failed: count('Failed'),
    blocked: count('Blocked'),
    skipped: count('Skipped'),
    executed,
    remaining: cases.length - executed,
    progress: cases.length ? Math.round((executed / cases.length) * 100) : 0,
  }
}

const stepLines = (testCase) => {
  if (!testCase || !Array.isArray(testCase.steps)) return []
  return testCase.steps.map((step) => (typeof step === 'string' ? { action: step, expected: '' } : { action: step.action || '', expected: step.expected || '' }))
}

const resultActions = [
  { result: 'Passed', label: 'Pass', icon: CheckCircle2, className: 'border-qf-success/40 bg-qf-success/10 text-qf-success hover:bg-qf-success/20' },
  { result: 'Failed', label: 'Fail', icon: XCircle, className: 'border-qf-danger/40 bg-qf-danger/10 text-qf-danger hover:bg-qf-danger/20' },
  { result: 'Blocked', label: 'Block', icon: AlertTriangle, className: 'border-qf-warning/40 bg-qf-warning/10 text-qf-warning hover:bg-qf-warning/20' },
  { result: 'Skipped', label: 'Skip', icon: SkipForward, className: 'border-qf-border bg-qf-card text-qf-secondary hover:text-qf-text' },
]

const TestRunDetailPage = () => {
  const { runId } = useParams()
  const { testRuns, testCases, bugs, hydrating, executeTestRunCase, addBug, showToast } = useQA()
  const { user } = useAuth()
  const run = testRuns.find((item) => item.id === runId)
  const [selectedId, setSelectedId] = useState(null)
  const [notes, setNotes] = useState('')
  const [filter, setFilter] = useState('All')
  const [saving, setSaving] = useState(false)
  const [loggingDefect, setLoggingDefect] = useState(false)

  const cases = useMemo(() => (Array.isArray(run?.cases) ? run.cases : []), [run])
  const stats = useMemo(() => computeRunStats(run), [run])
  const selectedCase = cases.find((item) => item.testCaseId === selectedId) || cases.find((item) => item.result === 'Not Run') || cases[0]
  const testCase = testCases.find((item) => item.id === selectedCase?.testCaseId)
  const existingDefect = bugs.find((bug) => bug.linkedTestRunId === run?.id && bug.linkedTestCaseId === selectedCase?.testCaseId)

  useEffect(() => {
    if (selectedCase) setNotes(selectedCase.notes || '')
  }, [selectedCase?.testCaseId])

  const visibleCases = cases.filter((item) => {
    if (filter === 'Not Run') return !executedResults.includes(item.result)
    if (filter === 'Failed') return item.result === 'Failed'
    return true
  })

  const runCase = async (result) => {
    if (!run || !selectedCase) return
    setSaving(true)
    await executeTestRunCase(run.id, selectedCase.testCaseId, result, notes)
    setSaving(false)
    if (result !== 'Not Run') {
      const index = cases.findIndex((item) => item.testCaseId === selectedCase.testCaseId)
      const next = cases[index + 1] || cases[index - 1]
      if (next) setSelectedId(next.testCaseId)
    }
  }

  const saveNotes = async () => {
    if (!run || !selectedCase) return
    setSaving(true)
    await executeTestRunCase(run.id, selectedCase.testCaseId, selectedCase.result || 'Not Run', notes)
    setSaving(false)
  }

  const logDefect = async () => {
    if (!run || !selectedCase) return
    setLoggingDefect(true)
    const steps = stepLines(testCase).map((step, index) => `${index + 1}. ${step.action}`).join('\n')
    const created = await addBug({
      title: `[${run.id}] ${selectedCase.title} failed`,
      description: notes.trim() || `Failed during test run ${run.id}.`,
      stepsToReproduce: steps,
      expectedBehavior: stepLines(testCase).map((step) => step.expected).filter(Boolean).join('\n'),
      actualBehavior: notes.trim(),
      severity: 'Major',
      priority: 'High',
      environment: run.environment,
      projectKey: run.projectKey,
      reporter: user?.name,
      assignee: '',
      linkedTestCaseId: selectedCase.testCaseId,
      linkedTestRunId: run.id,
    })
    setLoggingDefect(false)
    if (created) showToast(`Logged defect ${created.id}`)
  }

  if (hydrating && !run) {
    return <MainLayout><div className="py-16 text-center text-sm text-qf-muted">Loading test run…</div></MainLayout>
  }

  if (!run) {
    return (
      <MainLayout>
        <EmptyState
          icon={PlayCircle}
          title="Test run not found"
          description="It may have been deleted, or the link is out of date."
          action={<Link to="/test-runs" className="btn-ghost text-xs"><ArrowLeft size={13} /> Back to test runs</Link>}
        />
      </MainLayout>
    )
  }

  if (!cases.length) {
    return (
      <MainLayout>
        <div className="flex flex-col gap-5">
          <PageBack run={run} />
          <EmptyState
            icon={Clock3}
            title="This run has no per-test records"
            description="It was created before per-case execution was available. Start a new run to execute tests step by step."
            action={<Link to="/test-runs?create=1" className="btn-primary text-xs"><PlayCircle size={13} /> Create a new run</Link>}
          />
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3 border-b border-qf-border pb-5">
          <div className="flex items-center justify-between gap-3">
            <Link to="/test-runs" className="inline-flex items-center gap-1.5 text-xs text-qf-muted hover:text-qf-text">
              <ArrowLeft size={14} /> All test runs
            </Link>
            <div className="flex items-center gap-2">
              <Badge tone="muted">{run.environment}</Badge>
              <StatusBadge status={run.status} />
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-[11px] font-semibold text-qf-info">{run.id}</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-qf-text">{run.name}</h1>
              <p className="mt-1 text-xs text-qf-muted">
                Created by {run.createdBy || 'Unknown'} · Started {run.startedAt ? formatTimestamp(run.startedAt) : 'not started'}
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-qf-success"><CheckCircle2 size={14} /> {stats.passed} passed</span>
              <span className="flex items-center gap-1.5 text-qf-danger"><XCircle size={14} /> {stats.failed} failed</span>
              <span className="flex items-center gap-1.5 text-qf-muted"><Clock3 size={14} /> {stats.remaining} left</span>
            </div>
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between text-[11px] text-qf-muted">
              <span>{stats.executed} of {stats.total} executed</span>
              <span className="tabular-nums">{stats.progress}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-qf-card" role="progressbar" aria-valuenow={stats.progress} aria-valuemin={0} aria-valuemax={100} aria-label="Run progress">
              <div className="h-full rounded-full bg-qf-primary transition-all" style={{ width: `${stats.progress}%` }} />
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[20rem_minmax(0,1fr)]">
          <aside className="rounded-lg border border-qf-border bg-qf-surface">
            <div className="flex items-center gap-1 border-b border-qf-border p-2">
              {['All', 'Not Run', 'Failed'].map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFilter(option)}
                  className={`rounded px-2.5 py-1.5 text-[11px] transition ${filter === option ? 'bg-qf-card font-medium text-qf-text' : 'text-qf-muted hover:text-qf-text'}`}
                >
                  {option}
                  <span className="ml-1.5 tabular-nums text-qf-muted">
                    {option === 'All' ? cases.length : option === 'Failed' ? stats.failed : stats.remaining}
                  </span>
                </button>
              ))}
            </div>
            <ol className="max-h-[32rem] divide-y divide-qf-border overflow-y-auto custom-scrollbar">
              {visibleCases.map((item, index) => (
                <li key={item.testCaseId}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(item.testCaseId)}
                    className={`flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition ${selectedCase?.testCaseId === item.testCaseId ? 'bg-qf-primary/10' : 'hover:bg-qf-card/60'}`}
                  >
                    <span className="mt-0.5 w-5 shrink-0 text-[10px] tabular-nums text-qf-muted">{String(index + 1).padStart(2, '0')}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-mono text-[10px] text-qf-info">{item.testCaseId}</span>
                      <span className="mt-0.5 block text-xs leading-5 text-qf-secondary">{item.title}</span>
                    </span>
                    <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                      item.result === 'Passed' ? 'bg-qf-success'
                        : item.result === 'Failed' ? 'bg-qf-danger'
                          : item.result === 'Blocked' ? 'bg-qf-warning'
                            : item.result === 'Skipped' ? 'bg-qf-muted'
                              : 'border border-qf-border-strong bg-transparent'
                    }`} title={item.result} />
                  </button>
                </li>
              ))}
              {visibleCases.length === 0 && <li className="px-3 py-8 text-center text-xs text-qf-muted">No cases in this filter.</li>}
            </ol>
          </aside>

          {selectedCase && (
            <section className="rounded-lg border border-qf-border bg-qf-surface">
              <div className="flex flex-col gap-2 border-b border-qf-border px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[11px] font-semibold text-qf-info">{selectedCase.testCaseId}</span>
                    <ResultBadge result={selectedCase.result} />
                    {selectedCase.executedAt && <span className="text-[11px] text-qf-muted">Executed {formatTimestamp(selectedCase.executedAt)}</span>}
                  </div>
                  <h2 className="mt-2 text-base font-semibold text-qf-text">{selectedCase.title}</h2>
                  <Link to={`/issues/${selectedCase.testCaseId}`} className="mt-1 inline-block text-[11px] text-qf-primary hover:underline">Open test case details</Link>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      const index = cases.findIndex((item) => item.testCaseId === selectedCase.testCaseId)
                      if (index > 0) setSelectedId(cases[index - 1].testCaseId)
                    }}
                    className="btn-subtle px-2 py-1"
                    aria-label="Previous test case"
                  ><ChevronLeft size={15} /></button>
                  <button
                    type="button"
                    onClick={() => {
                      const index = cases.findIndex((item) => item.testCaseId === selectedCase.testCaseId)
                      if (index < cases.length - 1) setSelectedId(cases[index + 1].testCaseId)
                    }}
                    className="btn-subtle px-2 py-1"
                    aria-label="Next test case"
                  ><ChevronRight size={15} /></button>
                </div>
              </div>

              <div className="space-y-5 p-5">
                {testCase?.preconditions && (
                  <div>
                    <h3 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-qf-muted">Preconditions</h3>
                    <p className="rounded border border-qf-border bg-qf-input px-3 py-2 text-xs leading-5 text-qf-secondary">{testCase.preconditions}</p>
                  </div>
                )}

                <div>
                  <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-qf-muted">Test steps</h3>
                  {stepLines(testCase).length ? (
                    <ol className="space-y-1.5">
                      {stepLines(testCase).map((step, index) => (
                        <li key={index} className="grid gap-2 rounded border border-qf-border bg-qf-input px-3 py-2 text-xs sm:grid-cols-[1.5rem_1fr_1fr]">
                          <span className="font-mono text-[10px] text-qf-muted">{index + 1}</span>
                          <span className="text-qf-text">{step.action || '—'}</span>
                          <span className="text-qf-muted">{step.expected || 'Verify expected behavior'}</span>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="rounded border border-dashed border-qf-border px-3 py-4 text-xs text-qf-muted">No steps defined for this test case. Use the notes below to record what you checked.</p>
                  )}
                </div>

                <div>
                  <label htmlFor="execution-notes" className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-qf-muted">
                    <MessageSquare size={12} /> Execution notes
                  </label>
                  <textarea
                    id="execution-notes"
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    rows={3}
                    maxLength={5000}
                    placeholder="What happened? Include evidence, error messages, or deviations."
                    className="input-field resize-y text-xs"
                  />
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="text-[10px] text-qf-muted">{notes.length}/5000</span>
                    <button type="button" onClick={saveNotes} disabled={saving} className="btn-subtle px-2 py-1 text-[11px]">
                      <Save size={12} /> Save notes
                    </button>
                  </div>
                </div>

                <div className="border-t border-qf-border pt-4">
                  <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-qf-muted">Record result</h3>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {resultActions.map((action) => {
                      const Icon = action.icon
                      return (
                        <button
                          key={action.result}
                          type="button"
                          disabled={saving}
                          onClick={() => runCase(action.result)}
                          className={`inline-flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-xs font-medium transition disabled:opacity-50 ${action.className}`}
                        >
                          <Icon size={14} /> {action.label}
                        </button>
                      )
                    })}
                  </div>
                  {selectedCase.result !== 'Not Run' && (
                    <button type="button" onClick={() => runCase('Not Run')} disabled={saving} className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-qf-muted hover:text-qf-text">
                      <CircleSlash size={12} /> Reset this result
                    </button>
                  )}
                </div>

                {selectedCase.result === 'Failed' && (
                  <div className="flex flex-col gap-2 rounded border border-qf-danger/30 bg-qf-danger/5 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                    <p className="flex items-center gap-1.5 text-xs text-qf-secondary">
                      <Flag size={13} className="text-qf-danger" /> Failed results should be tracked as a defect.
                    </p>
                    {existingDefect ? (
                      <Link to={`/issues/${existingDefect.id}`} className="btn-ghost text-[11px]"><Bug size={13} /> {existingDefect.id}</Link>
                    ) : (
                      <button type="button" onClick={logDefect} disabled={loggingDefect} className="btn-danger text-[11px]">
                        <Bug size={13} /> {loggingDefect ? 'Logging…' : 'Log defect'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </MainLayout>
  )
}

const PageBack = ({ run }) => (
  <div className="flex flex-col gap-2 border-b border-qf-border pb-5">
    <Link to="/test-runs" className="inline-flex items-center gap-1.5 text-xs text-qf-muted hover:text-qf-text"><ArrowLeft size={14} /> All test runs</Link>
    <p className="font-mono text-[11px] font-semibold text-qf-info">{run.id}</p>
    <h1 className="text-2xl font-semibold tracking-tight text-qf-text">{run.name}</h1>
  </div>
)

export default TestRunDetailPage
