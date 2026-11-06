import { useState } from 'react'
import { ChevronDown, ChevronRight, FileText, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useQA } from '../../context/useQA'
import { useAuth } from '../../context/AuthContext'
import { canDeleteIssue } from '../../utils/permissions'
import { PriorityBadge, StatusBadge } from '../ui/Badges'
import ConfirmDialog from '../ui/ConfirmDialog'

const statusOptions = ['Draft', 'In Review', 'Approved', 'Implemented', 'Rejected']

const RequirementsTable = ({ requirements }) => {
  const { deleteRequirement, updateRequirementStatus, testCases } = useQA()
  const { user } = useAuth()
  const canDelete = canDeleteIssue(user?.role)
  const [expandedId, setExpandedId] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const linkedTests = (requirementId) => testCases.filter((test) => (test.requirementIds || []).includes(requirementId))

  const confirmDelete = async () => {
    if (!pendingDelete) return
    setDeleting(true)
    await deleteRequirement(pendingDelete.id)
    setDeleting(false)
    setPendingDelete(null)
  }

  return (
    <>
      <div className="rounded-lg border border-qf-border bg-qf-surface">
        <div className="divide-y divide-qf-border md:hidden">
          {requirements.length === 0 ? (
            <p className="px-4 py-8 text-center text-xs text-qf-muted">No requirements match the current filters.</p>
          ) : requirements.map((requirement) => {
            const linked = linkedTests(requirement.id)
            return (
              <article key={requirement.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <Link to={`/issues/${requirement.id}`} className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-qf-info hover:underline">
                    <FileText size={13} /> {requirement.id}
                  </Link>
                  <StatusBadge status={requirement.status} />
                </div>
                <Link to={`/issues/${requirement.id}`} className="mt-2 block text-sm font-medium text-qf-text">{requirement.title}</Link>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px]">
                  <PriorityBadge priority={requirement.priority} />
                  <span className="rounded border border-qf-border px-2 py-1 text-qf-muted">{requirement.owner || 'Unassigned'}</span>
                  <span className="text-qf-muted">{linked.length} linked test{linked.length === 1 ? '' : 's'}</span>
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <button type="button" onClick={() => setExpandedId(expandedId === requirement.id ? null : requirement.id)} className="text-[11px] text-qf-info hover:underline">
                    {expandedId === requirement.id ? 'Hide details' : 'Show details'}
                  </button>
                  <select value={requirement.status} onChange={(event) => updateRequirementStatus(requirement.id, event.target.value)} className="input-field w-auto py-1 text-[11px]" aria-label={`Status for ${requirement.id}`}>
                    {statusOptions.map((option) => <option key={option}>{option}</option>)}
                  </select>
                  {canDelete && (
                    <button type="button" onClick={() => setPendingDelete(requirement)} className="rounded p-1 text-qf-muted hover:text-qf-danger" aria-label={`Delete ${requirement.id}`}><Trash2 size={14} /></button>
                  )}
                </div>
                {expandedId === requirement.id && (
                  <div className="mt-2 space-y-1 text-xs text-qf-muted">
                    <p className="leading-relaxed">{requirement.description || 'No description provided.'}</p>
                    {linked.length > 0 && (
                      <p className="flex flex-wrap gap-2 pt-1">
                        {linked.map((test) => <Link key={test.id} to={`/issues/${test.id}`} className="font-mono text-[10px] text-qf-info hover:underline">{test.id}</Link>)}
                      </p>
                    )}
                  </div>
                )}
              </article>
            )
          })}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[880px] text-left text-xs">
            <thead className="border-b border-qf-border bg-qf-card/50 text-[11px] uppercase tracking-wider text-qf-muted">
              <tr>
                <th className="w-8 px-3 py-3" />
                <th className="px-4 py-3 font-medium">Key</th>
                <th className="px-4 py-3 font-medium">Requirement</th>
                <th className="px-4 py-3 font-medium">Owner</th>
                <th className="px-4 py-3 font-medium">Priority</th>
                <th className="px-4 py-3 font-medium">Linked tests</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-qf-border">
              {requirements.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-xs text-qf-muted">No requirements match the current filters.</td></tr>
              ) : requirements.map((requirement) => {
                const linked = linkedTests(requirement.id)
                return (
                  <tr key={requirement.id} className="group transition hover:bg-qf-card/50">
                    <td className="px-3 py-3">
                      <button type="button" onClick={() => setExpandedId(expandedId === requirement.id ? null : requirement.id)} className="text-qf-muted transition hover:text-qf-text" aria-label={`${expandedId === requirement.id ? 'Collapse' : 'Expand'} ${requirement.id}`}>
                        {expandedId === requirement.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <Link to={`/issues/${requirement.id}`} className="flex items-center gap-1.5 font-mono font-semibold text-qf-info hover:underline">
                        <FileText size={13} /> {requirement.id}
                      </Link>
                    </td>
                    <td className="max-w-xs px-4 py-3">
                      <Link to={`/issues/${requirement.id}`} className="block truncate font-medium text-qf-text hover:text-white">{requirement.title}</Link>
                      {expandedId === requirement.id && (
                        <p className="mt-2 whitespace-normal text-[11px] leading-relaxed text-qf-muted">{requirement.description || 'No description provided.'}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-qf-secondary">
                      <span className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-qf-card text-[10px] text-qf-secondary">{(requirement.owner || 'U').charAt(0)}</span>
                        <span className="truncate">{requirement.owner || 'Unassigned'}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3"><PriorityBadge priority={requirement.priority} /></td>
                    <td className="px-4 py-3">
                      {linked.length
                        ? <span className="flex flex-wrap gap-1.5">{linked.map((test) => <Link key={test.id} to={`/issues/${test.id}`} className="font-mono text-qf-info hover:underline">{test.id}</Link>)}</span>
                        : <span className="text-qf-muted">None</span>}
                    </td>
                    <td className="px-4 py-3">
                      <select value={requirement.status} onChange={(event) => updateRequirementStatus(requirement.id, event.target.value)} className="input-field w-auto py-1 text-[11px]" aria-label={`Status for ${requirement.id}`}>
                        {statusOptions.map((option) => <option key={option}>{option}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {canDelete && (
                        <button type="button" onClick={() => setPendingDelete(requirement)} className="rounded p-1 text-qf-muted opacity-0 transition hover:text-qf-danger group-hover:opacity-100 focus:opacity-100" aria-label={`Delete ${requirement.id}`}>
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
      </div>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={`Delete ${pendingDelete?.id || 'requirement'}?`}
        description="The requirement is removed and test cases keep their history without this link."
        confirmLabel="Delete requirement"
        busy={deleting}
        onConfirm={confirmDelete}
        onClose={() => setPendingDelete(null)}
      />
    </>
  )
}

export default RequirementsTable
