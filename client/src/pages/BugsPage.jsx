import React, { useState, useMemo } from 'react'
import MainLayout from '../components/layout/MainLayout'
import { Link } from 'react-router-dom'
import { Plus, Filter, AlertTriangle, Bug, Check, Trash2, ArrowUpDown } from 'lucide-react'
import { useQA } from '../context/QAContext'
import { useAuth } from '../context/AuthContext'
import { canDeleteIssue } from '../utils/permissions'

const severityStyles = {
  Blocker: 'bg-red-500/15 text-red-400 border-red-500/30',
  Critical: 'bg-red-500/10 text-red-400 border-red-500/20',
  Major: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Minor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Trivial: 'bg-jira-surface-2 text-jira-muted border-jira-border',
}

const statusOptions = ['Open', 'In Progress', 'Resolved', 'Verified', 'Reopened', 'Closed']

const BugsPage = () => {
  const { bugs, selectedProjectKey, updateBugStatus, deleteBug, setIsCreateModalOpen, searchQuery } = useQA()
  const { user } = useAuth()
  const canDelete = canDeleteIssue(user?.role)
  const [severityFilter, setSeverityFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [activeMenuId, setActiveMenuId] = useState(null)
  const [showFilterBar, setShowFilterBar] = useState(false)

  const filteredBugs = useMemo(() => {
    return bugs.filter((bug) => {
      const belongsToProject = bug.projectKey ? bug.projectKey === selectedProjectKey : selectedProjectKey === 'QAR'
      const matchSearch = searchQuery
        ? bug.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          bug.id.toLowerCase().includes(searchQuery.toLowerCase())
        : true
      const matchSeverity = severityFilter === 'All' ? true : bug.severity === severityFilter
      const matchStatus = statusFilter === 'All' ? true : bug.status === statusFilter
      return belongsToProject && matchSearch && matchSeverity && matchStatus
    })
  }, [bugs, selectedProjectKey, searchQuery, severityFilter, statusFilter])

  const stats = useMemo(() => {
    return {
      total: bugs.length,
      critical: bugs.filter((b) => b.severity === 'Critical' || b.severity === 'Blocker').length,
      open: bugs.filter((b) => b.status === 'Open' || b.status === 'In Progress' || b.status === 'Reopened').length,
      resolved: bugs.filter((b) => b.status === 'Resolved' || b.status === 'Closed').length,
    }
  }, [bugs])

  return (
    <MainLayout>
      <div className="flex flex-col gap-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 border-b border-jira-border pb-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-jira-muted">
              Quality Assurance / Defect Management
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">
              Bugs & Defects Triage
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
              onClick={() => setIsCreateModalOpen(true)}
              className="btn-primary text-xs"
            >
              <Plus size={14} />
              Report Bug
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        {showFilterBar && (
          <div className="flex flex-wrap items-center gap-4 rounded-lg border border-jira-border bg-jira-surface/80 p-3 text-xs animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="text-jira-muted font-medium">Severity:</span>
              {['All', 'Blocker', 'Critical', 'Major', 'Minor', 'Trivial'].map((s) => (
                <button
                  key={s}
                  onClick={() => setSeverityFilter(s)}
                  className={`rounded px-2 py-1 transition ${
                    severityFilter === s
                      ? 'bg-jira-blue text-white font-semibold'
                      : 'bg-jira-surface-2 text-jira-muted hover:text-white'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="h-4 w-px bg-jira-border" />

            <div className="flex items-center gap-2">
              <span className="text-jira-muted font-medium">Status:</span>
              {['All', 'Open', 'In Progress', 'Resolved', 'Verified', 'Reopened', 'Closed'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`rounded px-2 py-1 transition ${
                    statusFilter === st
                      ? 'bg-jira-blue text-white font-semibold'
                      : 'bg-jira-surface-2 text-jira-muted hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="stat-card">
            <div className="text-[11px] font-bold uppercase tracking-wider text-jira-muted">Total Reported</div>
            <div className="mt-2 text-2xl font-bold text-white">{stats.total}</div>
          </div>
          <div className="stat-card">
            <div className="text-[11px] font-bold uppercase tracking-wider text-jira-muted">Critical / Blocker</div>
            <div className="mt-2 text-2xl font-bold text-red-400">{stats.critical}</div>
          </div>
          <div className="stat-card">
            <div className="text-[11px] font-bold uppercase tracking-wider text-jira-muted">Active / In Progress</div>
            <div className="mt-2 text-2xl font-bold text-amber-400">{stats.open}</div>
          </div>
          <div className="stat-card">
            <div className="text-[11px] font-bold uppercase tracking-wider text-jira-muted">Resolved & Closed</div>
            <div className="mt-2 text-2xl font-bold text-emerald-400">{stats.resolved}</div>
          </div>
        </div>

        {/* Defects Table */}
        <div className="rounded-lg border border-jira-border bg-jira-surface/40">
          <div className="divide-y divide-jira-border/60 md:hidden">
            {filteredBugs.length === 0 ? (
              <p className="px-4 py-8 text-center text-xs text-jira-muted">No defects found matching current filters.</p>
            ) : filteredBugs.map((bug) => (
              <article key={bug.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <Link to={`/issues/${bug.id}`} className="font-mono text-[11px] font-semibold text-rose-400 hover:underline">{bug.id}</Link>
                  <select value={bug.status} onChange={(event) => updateBugStatus(bug.id, event.target.value)} className="max-w-[8rem] rounded border border-jira-border bg-jira-surface-2 px-2 py-1 text-[11px] text-jira-text">
                    {statusOptions.map((option) => <option key={option}>{option}</option>)}
                  </select>
                </div>
                <Link to={`/issues/${bug.id}`} className="mt-2 block text-sm font-medium text-white">{bug.title}</Link>
                <div className="mt-3 flex flex-wrap gap-2 text-[10px]">
                  <span className={`rounded border px-2 py-1 font-bold uppercase ${severityStyles[bug.severity] || severityStyles.Major}`}>{bug.severity}</span>
                  <span className="rounded border border-jira-border px-2 py-1 text-jira-text">{bug.priority}</span>
                  <span className="rounded border border-jira-border px-2 py-1 text-jira-muted">{bug.assignee || 'Unassigned'}</span>
                </div>
              </article>
            ))}
          </div>
          <table className="hidden w-full text-left text-xs border-collapse md:table">
            <thead className="border-b border-jira-border bg-jira-surface-2 text-[11px] font-bold uppercase tracking-wider text-jira-muted">
              <tr>
                <th className="px-4 py-3">Key</th>
                <th className="px-4 py-3">Summary</th>
                <th className="px-4 py-3">Severity</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Environment</th>
                <th className="px-4 py-3">Assignee</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-jira-border/60">
              {filteredBugs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-xs text-jira-muted">
                    No defects found matching current filters.
                  </td>
                </tr>
              ) : (
                filteredBugs.map((bug) => (
                  <tr key={bug.id} className="table-row group">
                    <td className="px-4 py-3 font-mono font-semibold text-rose-400">
                      <div className="flex items-center gap-1.5">
                        <Bug size={13} className="text-rose-400" />
                        <Link to={`/issues/${bug.id}`} className="hover:underline">{bug.id}</Link>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-white max-w-sm truncate"><Link to={`/issues/${bug.id}`} className="hover:text-[#B7D5FF]">{bug.title}</Link></td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded px-2 py-0.5 text-[10px] font-bold uppercase border ${severityStyles[bug.severity] || severityStyles.Major}`}>
                        {bug.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-jira-text">{bug.priority}</td>
                    <td className="px-4 py-3">
                      <div className="relative inline-block">
                        <button
                          onClick={() => setActiveMenuId(activeMenuId === bug.id ? null : bug.id)}
                          className="flex items-center gap-1 rounded bg-jira-surface-2 px-2 py-1 text-[11px] font-semibold text-jira-text border border-jira-border hover:bg-jira-surface-3 transition"
                        >
                          <span>{bug.status}</span>
                          <ArrowUpDown size={10} className="text-jira-muted" />
                        </button>

                        {activeMenuId === bug.id && (
                          <div className="absolute left-0 mt-1 z-30 w-36 rounded-md border border-jira-border bg-jira-surface p-1 shadow-lift">
                            {statusOptions.map((opt) => (
                              <button
                                key={opt}
                                onClick={() => {
                                  updateBugStatus(bug.id, opt)
                                  setActiveMenuId(null)
                                }}
                                className={`flex w-full items-center justify-between rounded px-2 py-1 text-left text-[11px] transition ${
                                  bug.status === opt ? 'bg-jira-blue text-white' : 'text-jira-text hover:bg-jira-surface-2'
                                }`}
                              >
                                <span>{opt}</span>
                                {bug.status === opt && <Check size={12} />}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-jira-muted">{bug.environment || 'Staging'}</td>
                    <td className="px-4 py-3 text-jira-text">
                      <div className="flex items-center gap-1.5">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-jira-surface-3 text-[10px] text-white">
                          {bug.assignee?.charAt(0) || 'D'}
                        </div>
                        <span>{bug.assignee || 'Unassigned'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {canDelete && (
                        <button
                          onClick={() => deleteBug(bug.id)}
                          className="rounded p-1 text-jira-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </MainLayout>
  )
}

export default BugsPage
