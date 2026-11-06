import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, CheckSquare, ChevronDown, ChevronRight, PlayCircle, Plus, Search, Trash2, XCircle } from 'lucide-react'
import MainLayout from '../components/layout/MainLayout'
import PageHeader from '../components/ui/PageHeader'
import MetricCard from '../components/ui/MetricCard'
import EmptyState, { LoadingState } from '../components/ui/EmptyState'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { Badge, PriorityBadge, ResultBadge } from '../components/ui/Badges'
import { useQA } from '../context/useQA'
import { useAuth } from '../context/AuthContext'
import { canDeleteIssue } from '../utils/permissions'
import { belongsToProject } from '../utils/projectScope'

const types = ['Functional', 'Regression', 'Smoke', 'Security', 'Performance', 'Integration']
const results = ['Passed', 'Failed', 'Blocked', 'Skipped', 'Not Run', 'Pending']

const normalizeSteps = (steps) => (Array.isArray(steps) ? steps : [])
  .map((step) => (typeof step === 'string' ? { action: step, expected: '' } : { action: step.action || '', expected: step.expected || '' }))

const TestCasesPage = () => {
  const {
    testCases, testSuites, selectedProjectKey, hydrating, searchQuery,
    openCreateModal, deleteTestCase,
  } = useQA()
  const { user } = useAuth()
  const canDelete = canDeleteIssue(user?.role)
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [resultFilter, setResultFilter] = useState('All')
  const [suiteFilter, setSuiteFilter] = useState('All')
  const [expandedId, setExpandedId] = useState(null)
  const [selectedIds, setSelectedIds] = useState([])
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const projectCases = useMemo(
    () => testCases.filter((testCase) => belongsToProject(testCase, selectedProjectKey)),
    [selectedProjectKey, testCases],
  )
  const projectSuites = useMemo(
    () => testSuites.filter((suite) => (suite.projectKey || 'QAR') === selectedProjectKey),
    [selectedProjectKey, testSuites],
  )

  const filtered = useMemo(() => {
    const term = (query || searchQuery).trim().toLowerCase()
    return projectCases.filter((testCase) => {
      const suiteId = testCase.suiteId || projectSuites.find((suite) => (suite.testCaseIds || []).includes(testCase.id))?.id || ''
      const matchesSuite = suiteFilter === 'All'
        || (suiteFilter === 'None' ? !suiteId : suiteId === suiteFilter)
      const matchesSearch = !term || `${testCase.id} ${testCase.title} ${testCase.owner || ''}`.toLowerCase().includes(term)
      return matchesSearch
        && (typeFilter === 'All' || testCase.type === typeFilter)
        && (resultFilter === 'All' || testCase.lastResult === resultFilter)
        && matchesSuite
    })
  }, [projectCases, projectSuites, query, searchQuery, typeFilter, resultFilter, suiteFilter])

  useEffect(() => {
    setSelectedIds((previous) => previous.filter((id) => filtered.some((testCase) => testCase.id === id)))
  }, [filtered])

  const stats = useMemo(() => ({
    total: projectCases.length,
    passed: projectCases.filter((testCase) => testCase.lastResult === 'Passed').length,
    failed: projectCases.filter((testCase) => testCase.lastResult === 'Failed').length,
    notRun: projectCases.filter((testCase) => !['Passed', 'Failed'].includes(testCase.lastResult)).length,
  }), [projectCases])

  const allSelected = filtered.length > 0 && filtered.every((testCase) => selectedIds.includes(testCase.id))
  const toggleAll = () => setSelectedIds(allSelected ? [] : filtered.map((testCase) => testCase.id))
  const toggleOne = (id) => setSelectedIds((previous) => (previous.includes(id) ? previous.filter((item) => item !== id) : [...previous, id]))
  const suiteName = (testCase) => testCase.suiteId
    ? projectSuites.find((suite) => suite.id === testCase.suiteId)?.name
    : projectSuites.find((suite) => (suite.testCaseIds || []).includes(testCase.id))?.name

  const confirmDelete = async () => {
    if (!pendingDelete) return
    setDeleting(true)
    await deleteTestCase(pendingDelete.id)
    setDeleting(false)
    setPendingDelete(null)
  }

  const filtersActive = query || typeFilter !== 'All' || resultFilter !== 'All' || suiteFilter !== 'All'
  const clearFilters = () => {
    setQuery('')
    setTypeFilter('All')
    setResultFilter('All')
    setSuiteFilter('All')
  }

  return (
    <MainLayout>
      <div className="flex flex-col gap-5">
        <PageHeader
          eyebrow="Test repository"
          title="Test cases"
          description="Author reusable test cases, organize them into suites, and send them into a test run."
          actions={(
            <>
              <Link to="/test-runs" className="btn-ghost text-xs"><PlayCircle size={14} /> Test runs</Link>
              <button type="button" onClick={() => openCreateModal('TestCase')} className="btn-primary text-xs"><Plus size={14} /> New test case</button>
            </>
          )}
        />

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Test cases" value={stats.total} icon={CheckSquare} />
          <MetricCard label="Passing" value={stats.passed} icon={CheckCircle2} tone="success" />
          <MetricCard label="Failing" value={stats.failed} icon={XCircle} tone="danger" />
          <MetricCard label="Not run" value={stats.notRun} icon={PlayCircle} tone="warning" />
        </div>

        <div className="rounded-lg border border-qf-border bg-qf-surface">
          <div className="flex flex-col gap-3 border-b border-qf-border p-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <label className="relative flex-1">
                <Search size={14} className="absolute left-3 top-2.5 text-qf-muted" />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search test cases" className="input-field pl-9 text-xs" aria-label="Search test cases" />
              </label>
              <div className="flex flex-wrap gap-2">
                <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="input-field w-auto py-2 text-xs" aria-label="Filter by type">
                  <option value="All">All types</option>
                  {types.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
                <select value={resultFilter} onChange={(event) => setResultFilter(event.target.value)} className="input-field w-auto py-2 text-xs" aria-label="Filter by result">
                  <option value="All">All results</option>
                  {results.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
                <select value={suiteFilter} onChange={(event) => setSuiteFilter(event.target.value)} className="input-field w-auto py-2 text-xs" aria-label="Filter by suite">
                  <option value="All">All suites</option>
                  <option value="None">Not in a suite</option>
                  {projectSuites.map((suite) => <option key={suite.id} value={suite.id}>{suite.name}</option>)}
                </select>
                {filtersActive && <button type="button" onClick={clearFilters} className="btn-subtle text-xs">Clear</button>}
              </div>
            </div>

            {selectedIds.length > 0 && (
              <div className="flex flex-wrap items-center gap-3 rounded border border-qf-primary/30 bg-qf-primary/10 px-3 py-2 text-xs animate-fade-in">
                <span className="text-qf-secondary">{selectedIds.length} selected</span>
                <Link
                  to={`/test-runs?create=1&caseIds=${encodeURIComponent(selectedIds.join(','))}`}
                  className="btn-primary px-2.5 py-1 text-[11px]"
                >
                  <PlayCircle size={12} /> Run selected
                </Link>
                <button type="button" onClick={() => setSelectedIds([])} className="ml-auto text-qf-muted hover:text-qf-text">Clear selection</button>
              </div>
            )}
          </div>

          {hydrating ? (
            <div className="p-4"><LoadingState label="Loading test cases" rows={6} /></div>
          ) : filtered.length === 0 ? (
            <div className="p-4">
              <EmptyState
                icon={CheckSquare}
                title={projectCases.length ? 'No test cases match these filters' : 'No test cases yet'}
                description={projectCases.length
                  ? 'Adjust the filters or search for a different test case.'
                  : 'Create your first test case to start building reusable coverage.'}
                action={projectCases.length
                  ? <button type="button" onClick={clearFilters} className="btn-ghost text-xs">Clear filters</button>
                  : <button type="button" onClick={() => openCreateModal('TestCase')} className="btn-primary text-xs"><Plus size={14} /> New test case</button>}
              />
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[940px] text-left text-xs">
                  <thead className="bg-qf-card/50 text-[11px] uppercase tracking-wider text-qf-muted">
                    <tr>
                      <th className="w-8 px-3 py-3">
                        <input type="checkbox" checked={allSelected} onChange={toggleAll} className="h-3.5 w-3.5 accent-[#7C6CF2]" aria-label="Select all test cases" />
                      </th>
                      <th className="w-8 px-1 py-3" />
                      <th className="px-3 py-3 font-medium">Key</th>
                      <th className="px-3 py-3 font-medium">Title</th>
                      <th className="px-3 py-3 font-medium">Type</th>
                      <th className="px-3 py-3 font-medium">Suite</th>
                      <th className="px-3 py-3 font-medium">Priority</th>
                      <th className="px-3 py-3 font-medium">Last result</th>
                      <th className="px-3 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-qf-border">
                    {filtered.map((testCase) => (
                      <React.Fragment key={testCase.id}>
                        <tr className="group transition hover:bg-qf-card/50">
                          <td className="px-3 py-3">
                            <input type="checkbox" checked={selectedIds.includes(testCase.id)} onChange={() => toggleOne(testCase.id)} className="h-3.5 w-3.5 accent-[#7C6CF2]" aria-label={`Select ${testCase.id}`} />
                          </td>
                          <td className="px-1 py-3">
                            <button type="button" onClick={() => setExpandedId(expandedId === testCase.id ? null : testCase.id)} className="rounded p-0.5 text-qf-muted hover:text-qf-text" aria-label={`Toggle steps for ${testCase.id}`}>
                              {expandedId === testCase.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </button>
                          </td>
                          <td className="px-3 py-3"><Link to={`/issues/${testCase.id}`} className="font-mono font-semibold text-qf-info hover:underline">{testCase.id}</Link></td>
                          <td className="max-w-[22rem] px-3 py-3">
                            <Link to={`/issues/${testCase.id}`} className="block truncate font-medium text-qf-text">{testCase.title}</Link>
                            <span className="text-[10px] text-qf-muted">{testCase.owner || 'Unassigned'}</span>
                          </td>
                          <td className="px-3 py-3"><Badge tone="muted">{testCase.type || 'Functional'}</Badge></td>
                          <td className="px-3 py-3 text-qf-secondary">{suiteName(testCase) || <span className="text-qf-muted">—</span>}</td>
                          <td className="px-3 py-3"><PriorityBadge priority={testCase.priority} /></td>
                          <td className="px-3 py-3"><ResultBadge result={testCase.lastResult} /></td>
                          <td className="px-3 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <Link to={`/test-runs?create=1&testCaseId=${encodeURIComponent(testCase.id)}`} className="rounded p-1 text-qf-muted hover:bg-qf-card hover:text-qf-primary" title="Run this test case" aria-label={`Run ${testCase.id}`}>
                                <PlayCircle size={14} />
                              </Link>
                              {canDelete && (
                                <button type="button" onClick={() => setPendingDelete(testCase)} className="rounded p-1 text-qf-muted opacity-0 transition hover:text-qf-danger group-hover:opacity-100" aria-label={`Delete ${testCase.id}`}>
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                        {expandedId === testCase.id && (
                          <tr className="bg-qf-card/30">
                            <td colSpan={9} className="px-6 py-4">
                              <div className="grid gap-4 lg:grid-cols-2">
                                <div>
                                  <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-qf-muted">Steps</h3>
                                  {normalizeSteps(testCase.steps).length ? (
                                    <ol className="space-y-1.5">
                                      {normalizeSteps(testCase.steps).map((step, index) => (
                                        <li key={index} className="rounded border border-qf-border bg-qf-surface px-3 py-2 text-xs">
                                          <span className="mr-2 font-mono text-[10px] text-qf-muted">{index + 1}.</span>
                                          <span className="text-qf-text">{step.action}</span>
                                          {step.expected && <span className="mt-0.5 block pl-5 text-[11px] text-qf-muted">Expected: {step.expected}</span>}
                                        </li>
                                      ))}
                                    </ol>
                                  ) : <p className="text-xs text-qf-muted">No steps defined.</p>}
                                </div>
                                <div className="space-y-3 text-xs">
                                  <div>
                                    <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-qf-muted">Preconditions</h3>
                                    <p className="text-qf-secondary">{testCase.preconditions || 'None recorded.'}</p>
                                  </div>
                                  <div>
                                    <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-qf-muted">Description</h3>
                                    <p className="text-qf-secondary">{testCase.description || 'No description.'}</p>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    <Badge tone="muted">Status: {testCase.status || 'Ready'}</Badge>
                                    {(testCase.requirementIds || []).map((id) => <Link key={id} to={`/issues/${id}`} className="text-qf-info hover:underline">{id}</Link>)}
                                  </div>
                                  <Link to={`/issues/${testCase.id}`} className="inline-block text-qf-primary hover:underline">Open full details →</Link>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              <ul className="divide-y divide-qf-border md:hidden">
                {filtered.map((testCase) => (
                  <li key={testCase.id} className="p-4">
                    <div className="flex items-center justify-between gap-2">
                      <Link to={`/issues/${testCase.id}`} className="font-mono text-[11px] font-semibold text-qf-info">{testCase.id}</Link>
                      <ResultBadge result={testCase.lastResult} />
                    </div>
                    <Link to={`/issues/${testCase.id}`} className="mt-1.5 block text-sm font-medium text-qf-text">{testCase.title}</Link>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-qf-muted">
                      <Badge tone="muted">{testCase.type}</Badge>
                      <PriorityBadge priority={testCase.priority} />
                      <span>{suiteName(testCase) || 'No suite'}</span>
                      <Link to={`/test-runs?create=1&testCaseId=${encodeURIComponent(testCase.id)}`} className="ml-auto text-qf-primary">Run →</Link>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={`Delete ${pendingDelete?.id || 'test case'}?`}
        description="This removes the test case from the project and any suite that references it."
        confirmLabel="Delete test case"
        busy={deleting}
        onConfirm={confirmDelete}
        onClose={() => setPendingDelete(null)}
      />
    </MainLayout>
  )
}

export default TestCasesPage
