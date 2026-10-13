import React, { useState, useMemo } from 'react'
import MainLayout from '../components/layout/MainLayout'
import { Link } from 'react-router-dom'
import { Plus, Filter, Play, CheckCircle2, XCircle, Clock, ChevronDown, ChevronRight, Trash2 } from 'lucide-react'
import { useQA } from '../context/QAContext'
import { useAuth } from '../context/AuthContext'
import { canDeleteIssue } from '../utils/permissions'

const typeBadgeStyles = {
  Smoke: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Security: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  Functional: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  Performance: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Regression: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
}

const resultStyles = {
  Passed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Failed: 'bg-red-500/10 text-red-400 border-red-500/20',
  Pending: 'bg-jira-surface-2 text-jira-muted border-jira-border',
}

const TestCasesPage = () => {
  const { testCases, executeTestCase, deleteTestCase, setIsCreateModalOpen, showToast, searchQuery } = useQA()
  const { user } = useAuth()
  const canDelete = canDeleteIssue(user?.role)
  const [typeFilter, setTypeFilter] = useState('All')
  const [resultFilter, setResultFilter] = useState('All')
  const [expandedId, setExpandedId] = useState(null)
  const [showFilterBar, setShowFilterBar] = useState(false)

  const filteredTestCases = useMemo(() => {
    return testCases.filter((tc) => {
      const matchSearch = searchQuery
        ? tc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tc.id.toLowerCase().includes(searchQuery.toLowerCase())
        : true
      const matchType = typeFilter === 'All' ? true : tc.type === typeFilter
      const matchResult = resultFilter === 'All' ? true : tc.lastResult === resultFilter
      return matchSearch && matchType && matchResult
    })
  }, [testCases, searchQuery, typeFilter, resultFilter])

  const stats = useMemo(() => {
    return {
      total: testCases.length,
      passed: testCases.filter((t) => t.lastResult === 'Passed').length,
      failed: testCases.filter((t) => t.lastResult === 'Failed').length,
      pending: testCases.filter((t) => t.lastResult === 'Pending').length,
    }
  }, [testCases])

  const handleRunAll = () => {
    testCases.forEach((tc) => {
      // Simulate run
      const outcome = Math.random() > 0.15 ? 'Passed' : 'Failed'
      executeTestCase(tc.id, outcome)
    })
    showToast('Executed test suite batch run')
  }

  return (
    <MainLayout>
      <div className="flex flex-col gap-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 border-b border-jira-border pb-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-jira-muted">
              Quality Assurance / Test Repository
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">
              Test Cases & Execution
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilterBar(!showFilterBar)}
              className={`btn-ghost text-xs ${showFilterBar ? 'border-jira-blue text-white' : ''}`}
            >
              <Filter size={14} />
              Filter
            </button>
            <button
              onClick={handleRunAll}
              className="btn-ghost text-xs text-blue-400 hover:text-white"
            >
              <Play size={14} />
              Run All Tests
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="btn-primary text-xs"
            >
              <Plus size={14} />
              New Test Case
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        {showFilterBar && (
          <div className="flex flex-wrap items-center gap-4 rounded-lg border border-jira-border bg-jira-surface/80 p-3 text-xs animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="text-jira-muted font-medium">Type:</span>
              {['All', 'Smoke', 'Security', 'Functional', 'Performance', 'Regression'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`rounded px-2 py-1 transition ${
                    typeFilter === t
                      ? 'bg-jira-blue text-white font-semibold'
                      : 'bg-jira-surface-2 text-jira-muted hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="h-4 w-px bg-jira-border" />

            <div className="flex items-center gap-2">
              <span className="text-jira-muted font-medium">Outcome:</span>
              {['All', 'Passed', 'Failed', 'Pending'].map((r) => (
                <button
                  key={r}
                  onClick={() => setResultFilter(r)}
                  className={`rounded px-2 py-1 transition ${
                    resultFilter === r
                      ? 'bg-jira-blue text-white font-semibold'
                      : 'bg-jira-surface-2 text-jira-muted hover:text-white'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="stat-card">
            <div className="text-[11px] font-bold uppercase tracking-wider text-jira-muted">Total Test Cases</div>
            <div className="mt-2 text-2xl font-bold text-white">{stats.total}</div>
          </div>
          <div className="stat-card">
            <div className="text-[11px] font-bold uppercase tracking-wider text-jira-muted">Passed</div>
            <div className="mt-2 text-2xl font-bold text-emerald-400">{stats.passed}</div>
          </div>
          <div className="stat-card">
            <div className="text-[11px] font-bold uppercase tracking-wider text-jira-muted">Failed</div>
            <div className="mt-2 text-2xl font-bold text-red-400">{stats.failed}</div>
          </div>
          <div className="stat-card">
            <div className="text-[11px] font-bold uppercase tracking-wider text-jira-muted">Pending Run</div>
            <div className="mt-2 text-2xl font-bold text-jira-muted">{stats.pending}</div>
          </div>
        </div>

        {/* Test Cases Table */}
        <div className="overflow-x-auto rounded-lg border border-jira-border bg-jira-surface/40">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="border-b border-jira-border bg-jira-surface-2 text-[11px] font-bold uppercase tracking-wider text-jira-muted">
              <tr>
                <th className="w-8 px-3 py-3"></th>
                <th className="px-4 py-3">Key</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Last Result</th>
                <th className="px-4 py-3">Execute Live</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-jira-border/60">
              {filteredTestCases.map((tc) => (
                <React.Fragment key={tc.id}>
                  <tr className="table-row group">
                    <td className="px-3 py-3">
                      <button
                        onClick={() => setExpandedId(expandedId === tc.id ? null : tc.id)}
                        className="text-jira-muted hover:text-white"
                      >
                        {expandedId === tc.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </button>
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold text-jira-blue"><Link to={`/issues/${tc.id}`} className="hover:underline">{tc.id}</Link></td>
                    <td className="px-4 py-3 font-medium text-white max-w-sm truncate"><Link to={`/issues/${tc.id}`} className="hover:text-[#B7D5FF]">{tc.title}</Link></td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded px-2 py-0.5 text-[10px] font-bold uppercase border ${typeBadgeStyles[tc.type] || typeBadgeStyles.Functional}`}>
                        {tc.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-jira-text">{tc.priority}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold uppercase border ${resultStyles[tc.lastResult]}`}>
                        {tc.lastResult === 'Passed' && <CheckCircle2 size={11} />}
                        {tc.lastResult === 'Failed' && <XCircle size={11} />}
                        {tc.lastResult === 'Pending' && <Clock size={11} />}
                        <span>{tc.lastResult}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => executeTestCase(tc.id, 'Passed')}
                          title="Mark Passed"
                          className="flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition"
                        >
                          <CheckCircle2 size={11} />
                          Pass
                        </button>
                        <button
                          onClick={() => executeTestCase(tc.id, 'Failed')}
                          title="Mark Failed"
                          className="flex items-center gap-1 rounded bg-red-500/10 px-2 py-1 text-[10px] font-semibold text-red-400 border border-red-500/20 hover:bg-red-500/20 transition"
                        >
                          <XCircle size={11} />
                          Fail
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {canDelete && (
                        <button
                          onClick={() => deleteTestCase(tc.id)}
                          className="rounded p-1 text-jira-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>

                  {expandedId === tc.id && (
                    <tr className="bg-jira-surface-2/40 border-b border-jira-border">
                      <td colSpan={8} className="px-10 py-3 text-xs">
                        <div className="space-y-2">
                          <span className="font-semibold text-white">Execution Steps & Verification:</span>
                          <ol className="list-decimal list-inside space-y-1 text-jira-muted">
                            {tc.steps?.map((step, idx) => (
                              <li key={idx} className="text-jira-text">{step}</li>
                            ))}
                          </ol>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </MainLayout>
  )
}

export default TestCasesPage
