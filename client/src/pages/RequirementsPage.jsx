import React from 'react'
import MainLayout from '../components/layout/MainLayout'
import RequirementsTable from '../components/requirements/RequirementsTable'
import { Plus, Filter, Download } from 'lucide-react'

const requirements = [
  { id: 'REQ-104', title: 'User login flow validation and token management', owner: 'QA Lead', priority: 'High', status: 'Approved' },
  { id: 'REQ-112', title: 'Checkout error handling and recovery options', owner: 'QA Tester', priority: 'Medium', status: 'In Review' },
  { id: 'REQ-118', title: 'Password reset automation script coverage', owner: 'Developer', priority: 'High', status: 'Blocked' },
  { id: 'REQ-129', title: 'Reporting dashboard filters and date range pickers', owner: 'PM', priority: 'Low', status: 'Draft' },
  { id: 'REQ-134', title: 'Role-based access checks for administration pages', owner: 'Security', priority: 'High', status: 'Approved' },
]

const RequirementsPage = () => {
  return (
    <MainLayout>
      <div className="flex flex-col gap-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 border-b border-jira-border pb-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-jira-muted">
              Project Scope / Requirements Matrix
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">
              Requirements
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button className="btn-ghost text-xs">
              <Filter size={14} />
              Filter
            </button>
            <button className="btn-ghost text-xs">
              <Download size={14} />
              Export
            </button>
            <button className="btn-primary text-xs">
              <Plus size={14} />
              Add requirement
            </button>
          </div>
        </div>

        {/* Requirements Table */}
        <RequirementsTable requirements={requirements} />
      </div>
    </MainLayout>
  )
}

export default RequirementsPage
