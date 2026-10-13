import React, { useState, useMemo } from 'react'
import MainLayout from '../components/layout/MainLayout'
import RequirementsTable from '../components/requirements/RequirementsTable'
import { Plus, Filter, Download } from 'lucide-react'
import { useQA } from '../context/useQA'

const RequirementsPage = () => {
  const { requirements, selectedProjectKey, setIsCreateModalOpen, showToast, searchQuery } = useQA()
  const [statusFilter, setStatusFilter] = useState('All')
  const [priorityFilter, setPriorityFilter] = useState('All')
  const [showFilterBar, setShowFilterBar] = useState(false)

  const filteredRequirements = useMemo(() => {
    return requirements.filter((req) => {
      const belongsToProject = req.projectKey ? req.projectKey === selectedProjectKey : selectedProjectKey === 'QAR'
      const matchSearch = searchQuery
        ? req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          req.id.toLowerCase().includes(searchQuery.toLowerCase())
        : true
      const matchStatus = statusFilter === 'All' ? true : req.status === statusFilter
      const matchPriority = priorityFilter === 'All' ? true : req.priority === priorityFilter
      return belongsToProject && matchSearch && matchStatus && matchPriority
    })
  }, [requirements, selectedProjectKey, searchQuery, statusFilter, priorityFilter])

  const handleExportCSV = () => {
    if (filteredRequirements.length === 0) {
      showToast('No requirements to export')
      return
    }

    const headers = ['Key', 'Title', 'Owner', 'Priority', 'Status', 'Description']
    const rows = filteredRequirements.map((r) => [
      `"${r.id}"`,
      `"${r.title.replace(/"/g, '""')}"`,
      `"${r.owner}"`,
      `"${r.priority}"`,
      `"${r.status}"`,
      `"${(r.description || '').replace(/"/g, '""')}"`,
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `qaforge_requirements_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    showToast('Exported requirements matrix to CSV')
  }

  return (
    <MainLayout>
      <div className="flex flex-col gap-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 border-b border-jira-border pb-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-jira-muted">
              Project Scope / Traceability
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">
              Requirements Matrix
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilterBar(!showFilterBar)}
              className={`btn-ghost text-xs ${showFilterBar ? 'border-jira-blue text-white' : ''}`}
            >
              <Filter size={14} />
              Filter {statusFilter !== 'All' || priorityFilter !== 'All' ? '(Active)' : ''}
            </button>
            <button
              onClick={handleExportCSV}
              className="btn-ghost text-xs"
            >
              <Download size={14} />
              Export CSV
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="btn-primary text-xs"
            >
              <Plus size={14} />
              Add requirement
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        {showFilterBar && (
          <div className="flex flex-wrap items-center gap-4 rounded-lg border border-jira-border bg-jira-surface/80 p-3 text-xs animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="text-jira-muted font-medium">Status:</span>
              {['All', 'Draft', 'In Review', 'Approved', 'Implemented', 'Rejected'].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`rounded px-2 py-1 transition ${
                    statusFilter === s
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
              <span className="text-jira-muted font-medium">Priority:</span>
              {['All', 'Critical', 'High', 'Medium', 'Low'].map((p) => (
                <button
                  key={p}
                  onClick={() => setPriorityFilter(p)}
                  className={`rounded px-2 py-1 transition ${
                    priorityFilter === p
                      ? 'bg-jira-blue text-white font-semibold'
                      : 'bg-jira-surface-2 text-jira-muted hover:text-white'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            {(statusFilter !== 'All' || priorityFilter !== 'All') && (
              <button
                onClick={() => {
                  setStatusFilter('All')
                  setPriorityFilter('All')
                }}
                className="ml-auto text-xs text-blue-400 hover:underline"
              >
                Reset filters
              </button>
            )}
          </div>
        )}

        {/* Stats Row */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="stat-card">
            <div className="text-[11px] font-bold uppercase tracking-wider text-jira-muted">Total Requirements</div>
            <div className="mt-2 text-2xl font-bold text-white">{requirements.length}</div>
          </div>
          <div className="stat-card">
            <div className="text-[11px] font-bold uppercase tracking-wider text-jira-muted">Approved & Ready</div>
            <div className="mt-2 text-2xl font-bold text-emerald-400">
              {requirements.filter((r) => r.status === 'Approved').length}
            </div>
          </div>
          <div className="stat-card">
            <div className="text-[11px] font-bold uppercase tracking-wider text-jira-muted">Under Review / Draft</div>
            <div className="mt-2 text-2xl font-bold text-amber-400">
              {requirements.filter((r) => r.status !== 'Approved').length}
            </div>
          </div>
        </div>

        {/* Requirements Table */}
        <RequirementsTable requirements={filteredRequirements} />
      </div>
    </MainLayout>
  )
}

export default RequirementsPage
