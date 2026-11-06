import { useState } from 'react'
import {
  BarChart3,
  Bug,
  CheckSquare,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FolderKanban,
  History,
  LayoutDashboard,
  Layers3,
  ListTodo,
  Network,
  PanelLeftClose,
  PanelLeftOpen,
  PlayCircle,
  Search,
  Settings,
  Users,
  X,
} from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useQA } from '../../context/useQA'
import { useAuth } from '../../context/AuthContext'
import Avatar from '../ui/Avatar'

const Sidebar = ({ isOpen, onClose, collapsed, onToggleCollapse }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { tasks, bugs, testCases, testRuns, projects, sprints } = useQA()
  const [closedSections, setClosedSections] = useState({})

  const openIssueCount = tasks.filter((task) => task.status !== 'Done').length
    + bugs.filter((bug) => !['Closed', 'Resolved', 'Verified', "Won't Fix", 'Duplicate'].includes(bug.status)).length

  const sections = [
    {
      label: 'Workspace',
      items: [
        { label: 'Dashboard', path: '/', icon: LayoutDashboard },
        { label: 'My work', path: '/my-work', icon: ListTodo },
        { label: 'Activity', path: '/audit-log', icon: History },
      ],
    },
    {
      label: 'Quality',
      items: [
        { label: 'Issues', path: '/issues', icon: Bug, count: openIssueCount },
        { label: 'Test cases', path: '/test-cases', icon: CheckSquare, count: testCases.length },
        { label: 'Test suites', path: '/test-suites', icon: Layers3 },
        { label: 'Test runs', path: '/test-runs', icon: PlayCircle, count: testRuns.filter((run) => run.status !== 'Completed').length || undefined },
        { label: 'Reports', path: '/reports', icon: BarChart3 },
      ],
    },
    {
      label: 'Planning',
      items: [
        { label: 'Projects', path: '/projects', icon: FolderKanban, count: projects.length },
        { label: 'Backlog', path: '/backlog', icon: Search },
        { label: 'Sprints', path: '/sprints', icon: Users, count: sprints.filter((sprint) => sprint.status === 'Active').length || undefined },
        { label: 'Traceability', path: '/traceability', icon: Network },
      ],
    },
    {
      label: 'Administration',
      items: [
        { label: 'Team & settings', path: '/settings', icon: Settings },
      ],
    },
  ]

  const isItemActive = (path) => (
    path === '/'
      ? location.pathname === '/'
      : location.pathname === path || location.pathname.startsWith(`${path}/`)
  )

  const go = (path) => {
    navigate(path)
    onClose()
  }

  return (
    <>
      <button
        type="button"
        aria-label="Close navigation menu"
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/70 transition-opacity lg:hidden ${isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(84vw,17rem)] flex-col border-r border-qf-border bg-qf-sidebar transition-[transform,width] duration-200 lg:static lg:h-[calc(100vh-3.5rem)] lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } ${collapsed ? 'lg:w-[4.25rem]' : 'lg:w-[15.5rem]'}`}
        aria-label="Primary navigation"
      >
        <div className="flex h-12 items-center justify-between border-b border-qf-border px-3 lg:hidden">
          <span className="text-xs font-semibold uppercase tracking-wider text-qf-muted">Navigation</span>
          <button type="button" onClick={onClose} aria-label="Close navigation menu" className="rounded p-1.5 text-qf-muted hover:bg-qf-card hover:text-qf-text">
            <X size={18} />
          </button>
        </div>

        <nav className="custom-scrollbar flex-1 space-y-4 overflow-y-auto px-2 py-3">
          {sections.map((section) => {
            const isClosed = closedSections[section.label]
            return (
              <div key={section.label}>
                {!collapsed && (
                  <button
                    type="button"
                    onClick={() => setClosedSections((previous) => ({ ...previous, [section.label]: !previous[section.label] }))}
                    className="mb-1 flex w-full items-center justify-between rounded px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-qf-muted transition hover:text-qf-secondary"
                    aria-expanded={!isClosed}
                  >
                    <span>{section.label}</span>
                    {isClosed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                  </button>
                )}
                {collapsed && <div className="mx-auto mb-1.5 h-px w-6 bg-qf-border" />}

                {(collapsed || !isClosed) && (
                  <div className="space-y-0.5">
                    {section.items.map((item) => {
                      const active = isItemActive(item.path)
                      const Icon = item.icon
                      return (
                        <button
                          key={item.path}
                          type="button"
                          onClick={() => go(item.path)}
                          title={collapsed ? item.label : undefined}
                          aria-current={active ? 'page' : undefined}
                          className={`relative flex w-full items-center rounded-md py-2 text-sm transition ${
                            collapsed ? 'justify-center px-0' : 'justify-between gap-2 px-2.5'
                          } ${active ? 'bg-qf-primary/15 font-medium text-qf-text' : 'text-qf-secondary hover:bg-qf-card hover:text-qf-text'}`}
                        >
                          {active && <span className="absolute inset-y-1 left-0 w-0.5 rounded-full bg-qf-primary" />}
                          <span className="flex min-w-0 items-center gap-2.5">
                            <Icon size={16} className={active ? 'text-qf-primary' : 'text-qf-muted'} aria-hidden="true" />
                            {!collapsed && <span className="truncate">{item.label}</span>}
                          </span>
                          {!collapsed && item.count !== undefined && (
                            <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold tabular-nums ${active ? 'bg-qf-primary/20 text-qf-primary' : 'bg-qf-card text-qf-muted'}`}>
                              {item.count}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        <div className="border-t border-qf-border p-2">
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-2.5'} rounded-md px-1.5 py-2`}>
            <Avatar name={user?.name || 'QAForge User'} size="sm" />
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-qf-text">{user?.name || 'QAForge User'}</p>
                <p className="truncate text-[10px] text-qf-muted">{user?.role || 'QA Tester'}</p>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onToggleCollapse}
            className="mt-1 hidden w-full items-center justify-center gap-2 rounded-md border border-qf-border py-1.5 text-[11px] text-qf-muted transition hover:bg-qf-card hover:text-qf-text lg:flex"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <PanelLeftOpen size={14} /> : <><PanelLeftClose size={14} /> Collapse</>}
          </button>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
