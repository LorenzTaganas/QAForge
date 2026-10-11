import React from 'react'

const StatusBadge = ({ status, type = 'status' }) => {
  const getStyles = () => {
    if (type === 'priority') {
      switch (status) {
        case 'High':
          return 'bg-red-500/10 text-red-400 border-red-500/20'
        case 'Medium':
          return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
        case 'Low':
          return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
        default:
          return 'bg-jira-surface-2 text-jira-muted border-jira-border'
      }
    }

    // Default status styles
    switch (status) {
      case 'Approved':
      case 'Done':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      case 'In Review':
      case 'In Progress':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      case 'Blocked':
        return 'bg-red-500/10 text-red-400 border-red-500/20'
      case 'Draft':
      case 'To Do':
        return 'bg-jira-surface-2 text-jira-muted border-jira-border'
      default:
        return 'bg-jira-surface-2 text-jira-text border-jira-border'
    }
  }

  return (
    <span className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] font-bold uppercase tracking-tight border ${getStyles()}`}>
      {status}
    </span>
  )
}

export default StatusBadge
