import React, { useState } from 'react'
import { LayoutGrid, FileText, CheckSquare, Bug, BarChart3, Settings, X, FolderKanban, ListTodo, PlayCircle, Network, KanbanSquare, History, ChevronDown, ChevronRight } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useQA } from '../../context/QAContext'

const Sidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { tasks, requirements, testCases, bugs, projects, sprints } = useQA()

  const sections = [
    {
      label: 'Your work',
      items: [
        { label: 'Overview', path: '/', icon: LayoutGrid, count: tasks.length },
        { label: 'Backlog', path: '/backlog', icon: ListTodo },
        { label: 'Active sprint', path: '/sprints', icon: KanbanSquare, count: sprints.filter((sprint) => sprint.status === 'Active').length },
      ],
    },
    {
      label: 'Quality',
      items: [
        { label: 'Requirements', path: '/requirements', icon: FileText, count: requirements.length },
        { label: 'Test cases', path: '/test-cases', icon: CheckSquare, count: testCases.length },
        { label: 'Test runs', path: '/test-runs', icon: PlayCircle },
        { label: 'Bugs', path: '/bugs', icon: Bug, count: bugs.filter((b) => b.status !== 'Closed').length },
        { label: 'Traceability', path: '/traceability', icon: Network },
      ],
    },
    {
      label: 'Insights',
      items: [
        { label: 'Reports', path: '/reports', icon: BarChart3 },
        { label: 'Activity log', path: '/audit-log', icon: History },
      ],
    },
    {
      label: 'Workspace',
      items: [
        { label: 'Projects', path: '/projects', icon: FolderKanban, count: projects.length },
        { label: 'Settings', path: '/settings', icon: Settings },
      ],
    },
  ]
  const [collapsedSections, setCollapsedSections] = useState({})

  return (
    <>
      <button
        type="button"
        aria-label="Close navigation menu"
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/60 transition-opacity lg:hidden ${isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      />
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[min(82vw,18rem)] flex-col border-r border-[#20283A] bg-[#111722] p-3 pt-16 shadow-2xl transition-transform duration-200 lg:static lg:min-h-[calc(100vh-3.5rem)] lg:w-64 lg:translate-x-0 lg:shadow-none ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close navigation menu"
          className="absolute right-3 top-3 rounded-md p-2 text-[#AAB5C7] hover:bg-[#1C2638] hover:text-white lg:hidden"
        >
          <X size={18} />
        </button>
      <div className="flex-1 space-y-4 overflow-y-auto pr-1">
        <div className="px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#6F7D92]">
          QAForge workspace
        </div>

        {sections.map((section) => {
          const isCollapsed = collapsedSections[section.label]
          const hasActiveItem = section.items.some((item) => location.pathname === item.path)

          return (
            <div key={section.label}>
              <button
                type="button"
                onClick={() => setCollapsedSections((previous) => ({ ...previous, [section.label]: !previous[section.label] }))}
                className="mb-1 flex w-full items-center justify-between px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#78849A] hover:text-[#DDE5F2]"
                aria-expanded={!isCollapsed}
              >
                <span>{section.label}</span>
                {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
              </button>
              {!isCollapsed && (
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const isActive = location.pathname === item.path
                      || (item.path !== '/' && location.pathname.startsWith(`${item.path}/`))
                    const Icon = item.icon

                    return (
                      <button
                        key={item.label}
                        onClick={() => {
                          navigate(item.path)
                          onClose()
                        }}
                        className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition ${
                          isActive
                            ? 'bg-[#1D3A68] font-medium text-white'
                            : 'text-jira-text hover:bg-jira-surface hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon size={17} className={isActive ? 'text-[#6EA8FF]' : 'text-jira-muted'} />
                          <span>{item.label}</span>
                        </div>
                        {item.count !== undefined && (
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${isActive ? 'bg-[#3F7FEA] text-white' : 'border border-jira-border bg-jira-surface-2 text-jira-muted'}`}>
                            {item.count}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
              {isCollapsed && hasActiveItem && <div className="mt-1 h-0.5 rounded-full bg-[#3F7FEA]" />}
            </div>
          )
        })}
      </div>

      <div className="mt-auto border-t border-jira-border pt-3">
        <div className="flex items-center gap-3 px-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-jira-blue/20 text-blue-400 font-bold border border-jira-blue/30">
            QAR
          </div>
          <div className="overflow-hidden">
            <div className="text-xs font-semibold text-white truncate">QAForge Sprint 24.4</div>
            <div className="text-[10px] text-jira-muted truncate">Active Kanban Board</div>
          </div>
        </div>
      </div>
      </aside>
    </>
  )
}

export default Sidebar
