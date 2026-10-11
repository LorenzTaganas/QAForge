import React from 'react'
import { Search, Plus, Bell, HelpCircle, LogOut, Shield } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const Header = () => {
  const { user, logout } = useAuth()

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-jira-border bg-jira-sidebar px-4 text-jira-text">
      {/* Left: Brand & Navigation */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-jira-blue font-bold text-white shadow-sm">
            Q
          </div>
          <span className="text-base font-bold tracking-tight text-white">QAForge</span>
        </div>

        <div className="hidden h-4 w-px bg-jira-border md:block" />

        <div className="hidden items-center gap-1 text-sm md:flex">
          <button className="rounded px-2.5 py-1 font-medium text-jira-text hover:bg-jira-surface-2 hover:text-white transition">
            Workspaces
          </button>
          <button className="rounded px-2.5 py-1 font-medium text-jira-text hover:bg-jira-surface-2 hover:text-white transition">
            Projects
          </button>
          <button className="rounded px-2.5 py-1 font-medium text-jira-text hover:bg-jira-surface-2 hover:text-white transition">
            Filters
          </button>
          <button className="rounded px-2.5 py-1 font-medium text-jira-text hover:bg-jira-surface-2 hover:text-white transition">
            Dashboards
          </button>
        </div>
      </div>

      {/* Middle: Global Search & Quick Actions */}
      <div className="flex flex-1 items-center justify-center px-4 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-jira-muted" />
          <input
            type="text"
            placeholder="Search tasks, requirements, bugs... (Press '/')"
            className="w-full rounded-md border border-jira-border bg-jira-bg py-1.5 pl-9 pr-8 text-xs text-jira-text placeholder-jira-muted outline-none transition focus:border-jira-blue focus:ring-1 focus:ring-jira-blue"
          />
          <kbd className="absolute right-2.5 top-2 rounded border border-jira-border bg-jira-surface px-1.5 py-0.5 text-[10px] font-medium text-jira-muted">
            /
          </kbd>
        </div>
      </div>

      {/* Right: Actions & User Menu */}
      <div className="flex items-center gap-3">
        <button className="btn-primary hidden h-8 px-3 text-xs md:inline-flex">
          <Plus size={14} />
          Create
        </button>

        <div className="flex items-center gap-1">
          <button className="rounded-md p-1.5 text-jira-muted hover:bg-jira-surface hover:text-jira-text transition">
            <Bell size={18} />
          </button>
          <button className="rounded-md p-1.5 text-jira-muted hover:bg-jira-surface hover:text-jira-text transition">
            <HelpCircle size={18} />
          </button>
        </div>

        <div className="h-4 w-px bg-jira-border" />

        <div className="flex items-center gap-2">
          <div className="hidden text-right md:block">
            <div className="text-xs font-semibold text-white">{user?.name || 'User'}</div>
            <div className="text-[10px] text-jira-muted">{user?.role || 'Member'}</div>
          </div>

          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-jira-surface-3 text-xs font-bold text-white border border-jira-border">
            {user?.name?.charAt(0) || 'U'}
          </div>

          <button
            onClick={logout}
            title="Logout"
            className="rounded-md p-1.5 text-jira-muted hover:bg-jira-surface hover:text-red-400 transition"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header
