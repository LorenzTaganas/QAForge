import React from 'react'
import { LayoutGrid, FileText, CheckSquare, Bug, BarChart3, Settings } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'

const navItems = [
  { label: 'Overview', path: '/', icon: LayoutGrid },
  { label: 'Requirements', path: '/requirements', icon: FileText },
  { label: 'Test Cases', path: '/test-cases', icon: CheckSquare },
  { label: 'Bugs', path: '/bugs', icon: Bug },
  { label: 'Reports', path: '/reports', icon: BarChart3 },
  { label: 'Settings', path: '/settings', icon: Settings },
]

const Sidebar = () => {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <aside className="w-64 border-r border-jira-border bg-jira-sidebar p-3 flex flex-col min-h-[calc(100vh-3.5rem)]">
      <div className="flex-1 space-y-1">
        <div className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-jira-muted">
          Software Team
        </div>

        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          const Icon = item.icon

          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition ${
                isActive
                  ? 'bg-jira-blue/10 text-white font-medium'
                  : 'text-jira-text hover:bg-jira-surface hover:text-white'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-jira-blue' : 'text-jira-muted'} />
              {item.label}
            </button>
          )
        })}
      </div>

      <div className="mt-auto border-t border-jira-border pt-3">
        <div className="flex items-center gap-3 px-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-jira-surface-2 text-white">
            P
          </div>
          <div className="overflow-hidden">
            <div className="text-xs font-semibold text-white truncate">QAForge Core</div>
            <div className="text-[10px] text-jira-muted truncate">Software Project</div>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
