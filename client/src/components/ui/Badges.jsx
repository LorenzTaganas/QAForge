import { Bug, CheckSquare, FileText, ListTodo, PlayCircle } from 'lucide-react'

const tones = {
  neutral: 'border-[#3A3F52] bg-[#262A38] text-[#D4D8E3]',
  muted: 'border-[#303443] bg-[#1C1F2A] text-[#A3A8B7]',
  blue: 'border-[#59A8F5]/30 bg-[#59A8F5]/12 text-[#8CC4FA]',
  purple: 'border-[#7C6CF2]/35 bg-[#7C6CF2]/15 text-[#B4AAFF]',
  green: 'border-[#35B77A]/30 bg-[#35B77A]/12 text-[#6FD3A4]',
  amber: 'border-[#E7A94B]/30 bg-[#E7A94B]/12 text-[#F0C27E]',
  red: 'border-[#F06B70]/30 bg-[#F06B70]/12 text-[#F59A9E]',
  gray: 'border-[#303443] bg-[#1C1F2A] text-[#777E90]',
}

const issueStatusTones = {
  Open: 'blue',
  'To Do': 'neutral',
  'In Progress': 'purple',
  'In Review': 'blue',
  Resolved: 'green',
  Verified: 'green',
  Done: 'green',
  Closed: 'gray',
  Reopened: 'amber',
  "Won't Fix": 'gray',
  Duplicate: 'gray',
  Draft: 'gray',
  Ready: 'blue',
  Deprecated: 'gray',
  'Not Started': 'gray',
  Blocked: 'amber',
  Completed: 'green',
  Planned: 'neutral',
  Active: 'green',
  Approved: 'green',
  Implemented: 'blue',
  Rejected: 'red',
}

const resultTones = {
  Passed: 'green',
  Failed: 'red',
  Blocked: 'amber',
  Skipped: 'muted',
  'Not Run': 'gray',
  Pending: 'gray',
}

const severityTones = {
  Blocker: 'red',
  Critical: 'red',
  Major: 'amber',
  Minor: 'blue',
  Trivial: 'gray',
  Lowest: 'gray',
}

const priorityTones = {
  Highest: 'red',
  Critical: 'red',
  High: 'amber',
  Medium: 'blue',
  Low: 'gray',
  Lowest: 'gray',
}

export const Badge = ({ children, tone = 'neutral', dot = false, className = '', title }) => (
  <span
    title={title}
    className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border px-2 py-0.5 text-[11px] font-medium ${tones[tone] || tones.neutral} ${className}`}
  >
    {dot && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />}
    {children}
  </span>
)

export const StatusBadge = ({ status, className }) => (
  <Badge tone={issueStatusTones[status] || 'neutral'} dot className={className}>
    {status || 'Unknown'}
  </Badge>
)

export const ResultBadge = ({ result, className }) => {
  const label = result || 'Not Run'
  return (
    <Badge tone={resultTones[label] || 'gray'} dot className={className}>
      {label}
    </Badge>
  )
}

export const SeverityBadge = ({ severity, className }) => (
  <Badge tone={severityTones[severity] || 'gray'} className={className}>
    {severity || 'Unset'}
  </Badge>
)

export const PriorityBadge = ({ priority, className }) => (
  <Badge tone={priorityTones[priority] || 'gray'} className={className}>
    {priority || 'Medium'}
  </Badge>
)

export const issueTypeMeta = {
  Task: { label: 'Task', icon: ListTodo, tone: 'text-[#59A8F5]' },
  Requirement: { label: 'Requirement', icon: FileText, tone: 'text-[#E7A94B]' },
  'Test case': { label: 'Test case', icon: CheckSquare, tone: 'text-[#35B77A]' },
  TestCase: { label: 'Test case', icon: CheckSquare, tone: 'text-[#35B77A]' },
  Bug: { label: 'Bug', icon: Bug, tone: 'text-[#F06B70]' },
  'Test run': { label: 'Test run', icon: PlayCircle, tone: 'text-[#7C6CF2]' },
}

export const IssueTypeIcon = ({ type = 'Task', size = 14, className = '' }) => {
  const meta = issueTypeMeta[type] || issueTypeMeta.Task
  const Icon = meta.icon
  return <Icon size={size} className={`${meta.tone} ${className}`} aria-hidden="true" />
}

export const issueTypeLabel = (type) => (issueTypeMeta[type]?.label || type || 'Task')
