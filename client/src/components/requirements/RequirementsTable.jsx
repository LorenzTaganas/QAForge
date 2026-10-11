import React from 'react'
import StatusBadge from './StatusBadge'
import { MoreHorizontal, FileText } from 'lucide-react'

const RequirementsTable = ({ requirements }) => {
  return (
    <div className="overflow-x-auto rounded-lg border border-jira-border bg-jira-surface/40">
      <table className="w-full text-left text-sm border-collapse">
        <thead className="border-b border-jira-border bg-jira-surface-2/80 text-[11px] font-bold uppercase tracking-wider text-jira-muted">
          <tr>
            <th className="px-4 py-3">Key</th>
            <th className="px-4 py-3">Requirement Title</th>
            <th className="px-4 py-3">Owner</th>
            <th className="px-4 py-3">Priority</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-jira-border/60">
          {requirements.map((req) => (
            <tr key={req.id} className="table-row">
              <td className="px-4 py-3 font-semibold text-jira-blue">
                <div className="flex items-center gap-1.5">
                  <FileText size={14} className="text-jira-blue" />
                  {req.id}
                </div>
              </td>
              <td className="px-4 py-3 font-medium text-white">{req.title}</td>
              <td className="px-4 py-3 text-jira-text">
                <div className="flex items-center gap-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-jira-surface-3 text-[10px] text-white">
                    {req.owner.charAt(0)}
                  </div>
                  {req.owner}
                </div>
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={req.priority} type="priority" />
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={req.status} type="status" />
              </td>
              <td className="px-4 py-3 text-right">
                <button className="rounded p-1 text-jira-muted hover:bg-jira-surface-3 hover:text-white transition">
                  <MoreHorizontal size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default RequirementsTable
