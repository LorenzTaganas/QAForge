import React, { useState } from 'react'
import StatusBadge from './StatusBadge'
import { MoreHorizontal, FileText, Trash2, ChevronDown, ChevronRight, Check } from 'lucide-react'
import { useQA } from '../../context/QAContext'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { canDeleteIssue } from '../../utils/permissions'

const statusOptions = ['Draft', 'In Review', 'Approved', 'Implemented', 'Rejected']

const RequirementsTable = ({ requirements }) => {
  const { deleteRequirement, updateRequirementStatus } = useQA()
  const { user } = useAuth()
  const canDelete = canDeleteIssue(user?.role)
  const [expandedId, setExpandedId] = useState(null)
  const [activeMenuId, setActiveMenuId] = useState(null)

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id)
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-jira-border bg-jira-surface/40">
      <table className="w-full text-left text-xs border-collapse">
        <thead className="border-b border-jira-border bg-jira-surface-2 text-[11px] font-bold uppercase tracking-wider text-jira-muted">
          <tr>
            <th className="w-8 px-3 py-3"></th>
            <th className="px-4 py-3">Key</th>
            <th className="px-4 py-3">Requirement Title</th>
            <th className="px-4 py-3">Owner</th>
            <th className="px-4 py-3">Priority</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-jira-border/60">
          {requirements.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center text-xs text-jira-muted">
                No requirements found. Click "+ Add requirement" to create one.
              </td>
            </tr>
          ) : (
            requirements.map((req) => (
              <React.Fragment key={req.id}>
                <tr className="table-row group">
                  <td className="px-3 py-3">
                    <button
                      onClick={() => toggleExpand(req.id)}
                      className="text-jira-muted hover:text-white transition"
                    >
                      {expandedId === req.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                  </td>
                  <td className="px-4 py-3 font-mono font-semibold text-jira-blue">
                    <div className="flex items-center gap-1.5">
                      <FileText size={13} className="text-jira-blue" />
                      <Link to={`/issues/${req.id}`} className="hover:underline">{req.id}</Link>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-white max-w-xs truncate">
                    <Link to={`/issues/${req.id}`} className="hover:text-[#B7D5FF]">{req.title}</Link>
                  </td>
                  <td className="px-4 py-3 text-jira-text">
                    <div className="flex items-center gap-2">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-jira-surface-3 text-[10px] text-white">
                        {req.owner.charAt(0)}
                      </div>
                      <span className="truncate">{req.owner}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={req.priority} type="priority" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="relative inline-block">
                      <button
                        onClick={() => setActiveMenuId(activeMenuId === req.id ? null : req.id)}
                        className="flex items-center gap-1 focus:outline-none"
                      >
                        <StatusBadge status={req.status} type="status" />
                      </button>

                      {activeMenuId === req.id && (
                        <div className="absolute left-0 mt-1 z-30 w-36 rounded-md border border-jira-border bg-jira-surface p-1 shadow-lift">
                          {statusOptions.map((opt) => (
                            <button
                              key={opt}
                              onClick={() => {
                                updateRequirementStatus(req.id, opt)
                                setActiveMenuId(null)
                              }}
                              className={`flex w-full items-center justify-between rounded px-2 py-1 text-left text-[11px] transition ${
                                req.status === opt ? 'bg-jira-blue text-white' : 'text-jira-text hover:bg-jira-surface-2'
                              }`}
                            >
                              <span>{opt}</span>
                              {req.status === opt && <Check size={12} />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {canDelete && (
                      <button
                        onClick={() => deleteRequirement(req.id)}
                        title="Delete requirement"
                        className="rounded p-1 text-jira-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>

                {/* Expanded Details Row */}
                {expandedId === req.id && (
                  <tr className="bg-jira-surface-2/40 border-b border-jira-border">
                    <td colSpan={7} className="px-10 py-3 text-xs text-jira-muted">
                      <div className="space-y-1">
                        <span className="font-semibold text-white">Description & Acceptance Criteria:</span>
                        <p className="text-jira-text leading-relaxed">
                          {req.description || 'No detailed description provided for this requirement.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

export default RequirementsTable
