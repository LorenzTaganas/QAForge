import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Clock3, Layers3, PlayCircle, Plus, Search, Trash2, X, XCircle } from 'lucide-react'
import MainLayout from '../components/layout/MainLayout'
import PageHeader from '../components/ui/PageHeader'
import MetricCard from '../components/ui/MetricCard'
import EmptyState, { LoadingState } from '../components/ui/EmptyState'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { Badge, StatusBadge } from '../components/ui/Badges'
import Pagination from '../components/ui/Pagination'
import { useQA } from '../context/useQA'
import { useAuth } from '../context/AuthContext'
import { canDeleteIssue } from '../utils/permissions'
import { belongsToProject } from '../utils/projectScope'
import { formatTimestamp } from '../utils/time'

const environments = ['QA', 'Staging', 'Dev', 'Production']
const pageSize = 12

const TestRunsPage = () => {
  const {
    testRuns, testCases, testSuites, projects, selectedProjectKey, projectSettings,
    hydrating, createTestRun, deleteTestRun, openCreateModal, showToast,
  } = useQA()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const canDelete = canDeleteIssue(user?.role)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const projectName = projects.find((project) => project.key === selectedProjectKey)?.name || selectedProjectKey
  const projectRuns = useMemo(
    () => testRuns.filter((run) => belongsToProject(run, selectedProjectKey)),
    [selectedProjectKey, testRuns],
  )
  const projectTestCases = useMemo(
    () => testCases.filter((testCase) => belongsToProject(testCase, selectedProjectKey)),
    [selectedProjectKey, testCases],
  )
  const projectSuites = useMemo(
    () => testSuites.filter((suite) => (suite.projectKey || 'QAR') === selectedProjectKey),
    [selectedProjectKey, testSuites],
  )

  const [draft, setDraft] = useState({ name: '', environment: 'QA', suiteId: '', testCaseIds: [] })

  const openCreate = () => {
    setDraft({
      name: `${projectName} regression · ${new Date().toLocaleDateString()}`,
      environment: projectSettings.defaultEnv || 'QA',
      suiteId: '',
      testCaseIds: [],
    })
    setModalOpen(true)
  }

  useEffect(() => {
    if (searchParams.get('create') !== '1') return
    const suiteId = searchParams.get('suiteId') || ''
    const testCaseId = searchParams.get('testCaseId') || ''
    const caseIds = (searchParams.get('caseIds') || '').split(',').filter(Boolean)
    const suite = testSuites.find((item) => item.id === suiteId)
    setDraft({
      name: suite ? `${suite.name} run · ${new Date().toLocaleDateString()}` : `${projectName} test run · ${new Date().toLocaleDateString()}`,
      environment: projectSettings.defaultEnv || 'QA',
      suiteId: suite?.id || '',
      testCaseIds: suite ? suite.testCaseIds || [] : caseIds.length ? caseIds : testCaseId ? [testCaseId] : [],
    })
    setModalOpen(true)
    setSearchParams({}, { replace: true })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const stats = useMemo(() => {
    const completed = projectRuns.filter((run) => run.status === 'Completed').length
    const inProgress = projectRuns.filter((run) => run.status === 'In Progress').length
    const totalCases = projectRuns.reduce((sum, run) => sum + (run.total || 0), 0)
    const passed = projectRuns.reduce((sum, run) => sum + (run.passed || 0), 0)
    return {
      total: projectRuns.length,
      completed,
      inProgress,
      passRate: totalCases ? Math.round((passed / totalCases) * 100) : 0,
    }
  }, [projectRuns])

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    const items = projectRuns.filter((run) => {
      const matchesSearch = !term || `${run.id} ${run.name} ${run.createdBy || ''}`.toLowerCase().includes(term)
      const matchesStatus = statusFilter === 'All' || run.status === statusFilter
      return matchesSearch && matchesStatus
    })
    return items.sort((first, second) => Number(String(second.id).split('-').pop()) - Number(String(first.id).split('-').pop()))
  }, [projectRuns, query, statusFilter])

  useEffect(() => { setPage(1) }, [query, statusFilter])
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize)

  const toggleCase = (caseId) => {
    setDraft((previous) => ({
      ...previous,
      testCaseIds: previous.testCaseIds.includes(caseId)
        ? previous.testCaseIds.filter((id) => id !== caseId)
        : [...previous.testCaseIds, caseId],
    }))
  }

  const chooseSuite = (suiteId) => {
    const suite = projectSuites.find((item) => item.id === suiteId)
    setDraft((previous) => ({
      ...previous,
      suiteId,
      testCaseIds: suite ? suite.testCaseIds || [] : previous.testCaseIds,
    }))
  }

  const submitRun = async (event) => {
    event.preventDefault()
    if (!draft.name.trim()) {
      showToast('Give the test run a name')
      return
    }
    if (!draft.testCaseIds.length) {
      showToast('Select at least one test case')
      return
    }
    setCreating(true)
    const created = await createTestRun({
      name: draft.name.trim(),
      environment: draft.environment,
      projectKey: selectedProjectKey,
      suiteId: draft.suiteId || undefined,
      testCaseIds: draft.testCaseIds,
    })
    setCreating(false)
    if (created) {
      setModalOpen(false)
      navigate(`/test-runs/${created.id}`)
    }
  }

  const confirmDelete = async () => {
    if (!pendingDelete) return
    setDeleting(true)
    await deleteTestRun(pendingDelete.id)
    setDeleting(false)
    setPendingDelete(null)
  }

  return (
    <MainLayout>
      <div className="flex flex-col gap-5">
        <PageHeader
          eyebrow="Execution"
          title="Test runs"
          description="Execute test cases, capture results, and keep a complete execution history."
          actions={(
            <>
              <button type="button" onClick={() => openCreateModal('TestCase')} className="btn-ghost text-xs"><Plus size={14} /> New test case</button>
              <button type="button" onClick={openCreate} className="btn-primary text-xs"><PlayCircle size={14} /> New test run</button>
            </>
          )}
        />

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Test runs" value={stats.total} icon={PlayCircle} />
          <MetricCard label="In progress" value={stats.inProgress} icon={Clock3} tone="warning" />
          <MetricCard label="Completed" value={stats.completed} icon={CheckCircle2} tone="success" />
          <MetricCard label="Overall pass rate" value={`${stats.passRate}%`} icon={CheckCircle2} tone="primary" hint="Across every recorded run" />
        </div>

        <div className="rounded-lg border border-qf-border bg-qf-surface">
          <div className="flex flex-col gap-3 border-b border-qf-border p-3 sm:flex-row sm:items-center">
            <label className="relative flex-1">
              <Search size={14} className="absolute left-3 top-2.5 text-qf-muted" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search runs by id, name, or creator" className="input-field pl-9 text-xs" aria-label="Search test runs" />
            </label>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="input-field w-auto py-2 text-xs" aria-label="Filter by status">
              {['All', 'Not Started', 'In Progress', 'Completed'].map((option) => <option key={option} value={option}>{option === 'All' ? 'All statuses' : option}</option>)}
            </select>
          </div>

          {hydrating ? (
            <div className="p-4"><LoadingState label="Loading test runs" rows={5} /></div>
          ) : visible.length === 0 ? (
            <div className="p-4">
              <EmptyState
                icon={PlayCircle}
                title={projectRuns.length ? 'No runs match these filters' : 'No test runs yet'}
                description={projectRuns.length
                  ? 'Try a different search or status.'
                  : 'Create a run from a suite or pick individual test cases to start executing.'}
                action={projectRuns.length
                  ? null
                  : <button type="button" onClick={openCreate} className="btn-primary text-xs"><PlayCircle size={14} /> Create test run</button>}
              />
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[880px] text-left text-xs">
                  <thead className="bg-qf-card/50 text-[11px] uppercase tracking-wider text-qf-muted">
                    <tr>
                      <th className="px-4 py-3 font-medium">Run</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Progress</th>
                      <th className="px-4 py-3 font-medium">Results</th>
                      <th className="px-4 py-3 font-medium">Environment</th>
                      <th className="px-4 py-3 font-medium">Started</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-qf-border">
                    {visible.map((run) => {
                      const progress = run.total ? Math.round(((run.executed ?? 0) / run.total) * 100) : 0
                      return (
                        <tr key={run.id} className="group transition hover:bg-qf-card/50">
                          <td className="px-4 py-3">
                            <Link to={`/test-runs/${run.id}`} className="font-mono font-semibold text-qf-info hover:underline">{run.id}</Link>
                            <Link to={`/test-runs/${run.id}`} className="mt-0.5 block max-w-xs truncate font-medium text-qf-text">{run.name}</Link>
                          </td>
                          <td className="px-4 py-3"><StatusBadge status={run.status} /></td>
                          <td className="px-4 py-3">
                            {run.total ? (
                              <div className="w-28">
                                <div className="mb-1 flex justify-between text-[10px] text-qf-muted"><span>{run.executed ?? 0}/{run.total}</span><span>{progress}%</span></div>
                                <div className="h-1 overflow-hidden rounded-full bg-qf-card">
                                  <div className="h-full rounded-full bg-qf-primary" style={{ width: `${progress}%` }} />
                                </div>
                              </div>
                            ) : <span className="text-qf-muted">—</span>}
                          </td>
                          <td className="px-4 py-3">
                            <span className="flex items-center gap-2 text-[11px]">
                              <span className="flex items-center gap-1 text-qf-success"><CheckCircle2 size={12} />{run.passed ?? 0}</span>
                              <span className="flex items-center gap-1 text-qf-danger"><XCircle size={12} />{run.failed ?? 0}</span>
                            </span>
                          </td>
                          <td className="px-4 py-3"><Badge tone="muted">{run.environment || 'QA'}</Badge></td>
                          <td className="px-4 py-3 text-qf-muted">{run.startedAt ? formatTimestamp(run.startedAt) : 'Not started'}</td>
                          <td className="px-4 py-3 text-right">
                            {canDelete && (
                              <button type="button" onClick={() => setPendingDelete(run)} className="rounded p-1 text-qf-muted opacity-0 transition hover:text-qf-danger group-hover:opacity-100" aria-label={`Delete ${run.id}`}>
                                <Trash2 size={14} />
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <ul className="divide-y divide-qf-border md:hidden">
                {visible.map((run) => (
                  <li key={run.id} className="p-4">
                    <div className="flex items-center justify-between gap-2">
                      <Link to={`/test-runs/${run.id}`} className="font-mono text-[11px] font-semibold text-qf-info">{run.id}</Link>
                      <StatusBadge status={run.status} />
                    </div>
                    <Link to={`/test-runs/${run.id}`} className="mt-1.5 block text-sm font-medium text-qf-text">{run.name}</Link>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-qf-muted">
                      <Badge tone="muted">{run.environment}</Badge>
                      <span className="text-qf-success">{run.passed ?? 0} passed</span>
                      <span className="text-qf-danger">{run.failed ?? 0} failed</span>
                      <span>{run.startedAt ? formatTimestamp(run.startedAt) : 'Not started'}</span>
                    </div>
                  </li>
                ))}
              </ul>

              <Pagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} itemLabel="test runs" />
            </>
          )}
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/70 p-4 py-8 animate-fade-in" onMouseDown={(event) => { if (event.target === event.currentTarget && !creating) setModalOpen(false) }}>
          <form onSubmit={submitRun} className="w-full max-w-2xl overflow-hidden rounded-lg border border-qf-border bg-qf-surface shadow-lift">
            <div className="flex items-center justify-between border-b border-qf-border px-5 py-4">
              <div>
                <h2 className="text-sm font-semibold text-qf-text">New test run</h2>
                <p className="mt-0.5 text-[11px] text-qf-muted">{selectedProjectKey} · {projectName}</p>
              </div>
              <button type="button" onClick={() => setModalOpen(false)} className="rounded p-1 text-qf-muted hover:bg-qf-card hover:text-qf-text" aria-label="Close"><X size={16} /></button>
            </div>
            <div className="space-y-4 p-5">
              <div className="grid gap-4 sm:grid-cols-[1fr_10rem]">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-qf-secondary">Run name <span className="text-qf-danger">*</span></span>
                  <input autoFocus value={draft.name} onChange={(event) => setDraft((previous) => ({ ...previous, name: event.target.value }))} maxLength={160} className="input-field" />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-qf-secondary">Environment</span>
                  <select value={draft.environment} onChange={(event) => setDraft((previous) => ({ ...previous, environment: event.target.value }))} className="input-field">
                    {environments.map((option) => <option key={option}>{option}</option>)}
                  </select>
                </label>
              </div>

              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-qf-secondary">Start from a suite</span>
                <select value={draft.suiteId} onChange={(event) => chooseSuite(event.target.value)} className="input-field text-xs">
                  <option value="">Choose individual test cases</option>
                  {projectSuites.map((suite) => <option key={suite.id} value={suite.id}>{suite.name} · {(suite.testCaseIds || []).length} cases</option>)}
                </select>
              </label>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-medium text-qf-secondary"><Layers3 size={13} /> Test cases</span>
                  <span className="text-[11px] text-qf-muted">{draft.testCaseIds.length} selected</span>
                </div>
                <div className="max-h-64 space-y-0.5 overflow-y-auto rounded border border-qf-border bg-qf-input p-2 custom-scrollbar">
                  {projectTestCases.length === 0 && <p className="px-2 py-4 text-xs text-qf-muted">No test cases exist in this project yet.</p>}
                  {projectTestCases.map((testCase) => (
                    <label key={testCase.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-xs hover:bg-qf-card">
                      <input type="checkbox" checked={draft.testCaseIds.includes(testCase.id)} onChange={() => toggleCase(testCase.id)} className="h-3.5 w-3.5 accent-[#7C6CF2]" />
                      <span className="font-mono text-[10px] text-qf-info">{testCase.id}</span>
                      <span className="min-w-0 flex-1 truncate text-qf-secondary">{testCase.title}</span>
                      <span className="text-[10px] text-qf-muted">{testCase.type}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2 border-t border-qf-border px-5 py-4">
              <p className="text-[11px] text-qf-muted">Results start as Not Run.</p>
              <div className="flex gap-2">
                <button type="button" onClick={() => setModalOpen(false)} disabled={creating} className="btn-ghost text-xs">Cancel</button>
                <button type="submit" disabled={creating || !draft.testCaseIds.length} className="btn-primary text-xs">{creating ? 'Creating…' : 'Create run'}</button>
              </div>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={`Delete ${pendingDelete?.id || 'test run'}?`}
        description="Execution history for this run is removed. Test case results stay unchanged."
        confirmLabel="Delete run"
        busy={deleting}
        onConfirm={confirmDelete}
        onClose={() => setPendingDelete(null)}
      />
    </MainLayout>
  )
}

export default TestRunsPage
