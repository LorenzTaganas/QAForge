import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckSquare, Layers3, Pencil, Play, Plus, Search, Trash2, X } from 'lucide-react'
import MainLayout from '../components/layout/MainLayout'
import PageHeader from '../components/ui/PageHeader'
import EmptyState, { LoadingState } from '../components/ui/EmptyState'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { Badge, ResultBadge } from '../components/ui/Badges'
import { useQA } from '../context/useQA'
import { useAuth } from '../context/AuthContext'
import { canDeleteIssue } from '../utils/permissions'
import { belongsToProject } from '../utils/projectScope'

const emptyDraft = { name: '', description: '', testCaseIds: [] }

const TestSuitesPage = () => {
  const { testCases, testSuites, selectedProjectKey, hydrating, addTestSuite, updateTestSuite, deleteTestSuite, showToast } = useQA()
  const { user } = useAuth()
  const canDelete = canDeleteIssue(user?.role)
  const [query, setQuery] = useState('')
  const [editor, setEditor] = useState(null)
  const [draft, setDraft] = useState(emptyDraft)
  const [saving, setSaving] = useState(false)
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
  const visible = projectSuites.filter((suite) => {
    const term = query.trim().toLowerCase()
    if (!term) return true
    return `${suite.name} ${suite.description}`.toLowerCase().includes(term)
  })

  const casesForSuite = (suite) => (suite.testCaseIds || [])
    .map((id) => projectCases.find((testCase) => testCase.id === id))
    .filter(Boolean)

  const openCreate = () => {
    setDraft(emptyDraft)
    setEditor({ mode: 'create' })
  }

  const openEdit = (suite) => {
    setDraft({ name: suite.name, description: suite.description || '', testCaseIds: suite.testCaseIds || [] })
    setEditor({ mode: 'edit', id: suite.id })
  }

  const toggleCase = (caseId) => {
    setDraft((previous) => ({
      ...previous,
      testCaseIds: previous.testCaseIds.includes(caseId)
        ? previous.testCaseIds.filter((id) => id !== caseId)
        : [...previous.testCaseIds, caseId],
    }))
  }

  const saveSuite = async (event) => {
    event.preventDefault()
    if (!draft.name.trim()) {
      showToast('Give the suite a name')
      return
    }
    setSaving(true)
    const payload = {
      name: draft.name.trim(),
      description: draft.description.trim(),
      projectKey: selectedProjectKey,
      testCaseIds: draft.testCaseIds,
    }
    const result = editor.mode === 'create'
      ? await addTestSuite(payload)
      : await updateTestSuite(editor.id, payload)
    setSaving(false)
    if (result) setEditor(null)
  }

  const confirmDelete = async () => {
    if (!pendingDelete) return
    setDeleting(true)
    await deleteTestSuite(pendingDelete.id)
    setDeleting(false)
    setPendingDelete(null)
  }

  const totals = useMemo(() => {
    const ids = new Set(projectSuites.flatMap((suite) => suite.testCaseIds || []))
    const covered = [...ids].map((id) => projectCases.find((testCase) => testCase.id === id)).filter(Boolean)
    const passed = covered.filter((testCase) => testCase.lastResult === 'Passed').length
    return {
      suites: projectSuites.length,
      covered: covered.length,
      uncovered: projectCases.length - covered.length,
      passRate: covered.length ? Math.round((passed / covered.length) * 100) : 0,
    }
  }, [projectCases, projectSuites])

  return (
    <MainLayout>
      <div className="flex flex-col gap-5">
        <PageHeader
          eyebrow="Test management"
          title="Test suites"
          description="Group test cases into reusable suites and launch a run in one click."
          actions={<button type="button" onClick={openCreate} className="btn-primary text-xs"><Plus size={14} /> New suite</button>}
          meta={(
            <>
              <span>{totals.suites} suites</span>
              <span className="text-qf-border-strong">•</span>
              <span>{totals.covered} cases covered</span>
              <span className="text-qf-border-strong">•</span>
              <span>{totals.passRate}% pass rate in suites</span>
            </>
          )}
        />

        <div className="flex flex-wrap items-center gap-3">
          <label className="relative min-w-[16rem] flex-1 sm:max-w-sm">
            <Search size={14} className="absolute left-3 top-2.5 text-qf-muted" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search suites" className="input-field pl-9 text-xs" aria-label="Search test suites" />
          </label>
          {totals.uncovered > 0 && (
            <Badge tone="amber">{totals.uncovered} project cases are not in any suite</Badge>
          )}
        </div>

        {hydrating ? (
          <LoadingState label="Loading test suites" rows={4} />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={Layers3}
            title={projectSuites.length ? 'No suites match your search' : 'No test suites yet'}
            description={projectSuites.length
              ? 'Try a different suite name.'
              : 'Create a suite to group related test cases, then run them together.'}
            action={<button type="button" onClick={openCreate} className="btn-primary text-xs"><Plus size={14} /> Create suite</button>}
          />
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {visible.map((suite) => {
              const cases = casesForSuite(suite)
              const passed = cases.filter((testCase) => testCase.lastResult === 'Passed').length
              const failed = cases.filter((testCase) => testCase.lastResult === 'Failed').length
              const passRate = cases.length ? Math.round((passed / cases.length) * 100) : 0
              return (
                <article key={suite.id} className="flex flex-col rounded-lg border border-qf-border bg-qf-surface p-4 transition hover:border-qf-border-strong">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-qf-border bg-qf-card text-qf-primary">
                        <Layers3 size={16} />
                      </span>
                      <div className="min-w-0">
                        <h2 className="truncate text-sm font-semibold text-qf-text">{suite.name}</h2>
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-qf-muted">{suite.description || 'No description'}</p>
                      </div>
                    </div>
                    <span className="shrink-0 rounded border border-qf-border bg-qf-card px-2 py-0.5 text-[11px] text-qf-secondary">{cases.length} cases</span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {cases.slice(0, 4).map((testCase) => (
                      <Link key={testCase.id} to={`/issues/${testCase.id}`} className="inline-flex items-center gap-1 rounded border border-qf-border bg-qf-card px-1.5 py-0.5 font-mono text-[10px] text-qf-secondary hover:text-qf-text">
                        <CheckSquare size={10} /> {testCase.id}
                      </Link>
                    ))}
                    {cases.length > 4 && <span className="text-[10px] text-qf-muted">+{cases.length - 4} more</span>}
                    {cases.length === 0 && <span className="text-xs text-qf-muted">No cases assigned</span>}
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[11px]">
                    <div className="rounded border border-qf-border bg-qf-card/50 px-2 py-1.5">
                      <p className="text-qf-muted">Passed</p>
                      <p className="mt-0.5 font-semibold text-qf-success">{passed}</p>
                    </div>
                    <div className="rounded border border-qf-border bg-qf-card/50 px-2 py-1.5">
                      <p className="text-qf-muted">Failed</p>
                      <p className="mt-0.5 font-semibold text-qf-danger">{failed}</p>
                    </div>
                    <div className="rounded border border-qf-border bg-qf-card/50 px-2 py-1.5">
                      <p className="text-qf-muted">Pass rate</p>
                      <p className="mt-0.5 font-semibold text-qf-text">{passRate}%</p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-2 border-t border-qf-border pt-3">
                    <div className="flex gap-1.5">
                      <button type="button" onClick={() => openEdit(suite)} className="btn-subtle px-2 py-1 text-[11px]"><Pencil size={12} /> Edit</button>
                      {canDelete && (
                        <button type="button" onClick={() => setPendingDelete(suite)} className="btn-subtle px-2 py-1 text-[11px] text-qf-danger hover:bg-qf-danger/10"><Trash2 size={12} /> Delete</button>
                      )}
                    </div>
                    {cases.length > 0 ? (
                      <Link to={`/test-runs?create=1&suiteId=${encodeURIComponent(suite.id)}`} className="btn-primary px-2.5 py-1.5 text-[11px]">
                        <Play size={12} /> Run suite
                      </Link>
                    ) : (
                      <span className="text-[11px] text-qf-muted">Add cases to run</span>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>

      {editor && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/70 p-4 py-8 animate-fade-in" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setEditor(null) }}>
          <form onSubmit={saveSuite} className="w-full max-w-2xl overflow-hidden rounded-lg border border-qf-border bg-qf-surface shadow-lift">
            <div className="flex items-center justify-between border-b border-qf-border px-5 py-4">
              <h2 className="text-sm font-semibold text-qf-text">{editor.mode === 'create' ? 'Create test suite' : 'Edit test suite'}</h2>
              <button type="button" onClick={() => setEditor(null)} className="rounded p-1 text-qf-muted hover:bg-qf-card hover:text-qf-text" aria-label="Close"><X size={16} /></button>
            </div>
            <div className="space-y-4 p-5">
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-qf-secondary">Suite name <span className="text-qf-danger">*</span></span>
                <input autoFocus value={draft.name} onChange={(event) => setDraft((previous) => ({ ...previous, name: event.target.value }))} maxLength={120} placeholder="e.g. Authentication regression" className="input-field" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-qf-secondary">Description</span>
                <textarea value={draft.description} onChange={(event) => setDraft((previous) => ({ ...previous, description: event.target.value }))} rows={2} placeholder="What does this suite cover?" className="input-field resize-y" />
              </label>
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-xs font-medium text-qf-secondary">Test cases</span>
                  <span className="text-[11px] text-qf-muted">{draft.testCaseIds.length} selected</span>
                </div>
                <div className="max-h-64 space-y-1 overflow-y-auto rounded border border-qf-border bg-qf-input p-2 custom-scrollbar">
                  {projectCases.length === 0 && <p className="px-2 py-3 text-xs text-qf-muted">No test cases exist in this project yet.</p>}
                  {projectCases.map((testCase) => (
                    <label key={testCase.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-xs hover:bg-qf-card">
                      <input type="checkbox" checked={draft.testCaseIds.includes(testCase.id)} onChange={() => toggleCase(testCase.id)} className="h-3.5 w-3.5 accent-[#7C6CF2]" />
                      <span className="font-mono text-[10px] text-qf-info">{testCase.id}</span>
                      <span className="min-w-0 flex-1 truncate text-qf-secondary">{testCase.title}</span>
                      <ResultBadge result={testCase.lastResult} />
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-qf-border px-5 py-4">
              <button type="button" onClick={() => setEditor(null)} disabled={saving} className="btn-ghost text-xs">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary text-xs">{saving ? 'Saving…' : editor.mode === 'create' ? 'Create suite' : 'Save changes'}</button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={`Delete ${pendingDelete?.name || 'suite'}?`}
        description="The suite is removed, but its test cases stay in the project."
        confirmLabel="Delete suite"
        busy={deleting}
        onConfirm={confirmDelete}
        onClose={() => setPendingDelete(null)}
      />
    </MainLayout>
  )
}

export default TestSuitesPage
