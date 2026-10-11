import React, { useState } from 'react'
import { Search, Plus, Bell, HelpCircle, LogOut, X, CheckCircle, FileText, Bug, CheckSquare } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useQA } from '../../context/QAContext'
import CreateModal from '../common/CreateModal'

const Header = () => {
  const { user, logout } = useAuth()
  const {
    tasks,
    requirements,
    testCases,
    bugs,
    searchQuery,
    setSearchQuery,
    isCreateModalOpen,
    setIsCreateModalOpen,
    showToast,
  } = useQA()

  const [showNotifications, setShowNotifications] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)

  // Search matches
  const searchResults = searchQuery.trim()
    ? [
        ...tasks
          .filter((t) => t.title.toLowerCase().includes(searchQuery.toLowerCase()))
          .map((t) => ({ ...t, category: 'Task', icon: CheckCircle, link: '/' })),
        ...requirements
          .filter((r) => r.title.toLowerCase().includes(searchQuery.toLowerCase()))
          .map((r) => ({ ...r, category: 'Requirement', icon: FileText, link: '/requirements' })),
        ...testCases
          .filter((tc) => tc.title.toLowerCase().includes(searchQuery.toLowerCase()))
          .map((tc) => ({ ...tc, category: 'Test Case', icon: CheckSquare, link: '/test-cases' })),
        ...bugs
          .filter((b) => b.title.toLowerCase().includes(searchQuery.toLowerCase()))
          .map((b) => ({ ...b, category: 'Bug', icon: Bug, link: '/bugs' })),
      ].slice(0, 6)
    : []

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-jira-border bg-jira-sidebar px-4 text-jira-text">
        {/* Left: Brand */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-jira-blue font-bold text-white shadow-sm">
              Q
            </div>
            <span className="text-base font-bold tracking-tight text-white">QAForge</span>
          </div>

          <div className="hidden h-4 w-px bg-jira-border md:block" />

          <div className="hidden items-center gap-1 text-sm md:flex">
            <button
              onClick={() => showToast('Switched project scope to QAForge Core')}
              className="rounded px-2.5 py-1 font-medium text-jira-text hover:bg-jira-surface-2 hover:text-white transition"
            >
              Workspaces
            </button>
            <button
              onClick={() => showToast('Viewing default sprint: Sprint 24.4')}
              className="rounded px-2.5 py-1 font-medium text-jira-text hover:bg-jira-surface-2 hover:text-white transition"
            >
              Projects
            </button>
            <button
              onClick={() => showToast('Quick filter: High priority items')}
              className="rounded px-2.5 py-1 font-medium text-jira-text hover:bg-jira-surface-2 hover:text-white transition"
            >
              Filters
            </button>
          </div>
        </div>

        {/* Middle: Global Search */}
        <div className="relative flex flex-1 items-center justify-center px-4 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-jira-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setShowSearchResults(true)
              }}
              onFocus={() => setShowSearchResults(true)}
              placeholder="Search tasks, requirements, bugs... (Press '/')"
              className="w-full rounded-md border border-jira-border bg-jira-bg py-1.5 pl-9 pr-8 text-xs text-jira-text placeholder-jira-muted outline-none transition focus:border-jira-blue focus:ring-1 focus:ring-jira-blue"
            />
            {searchQuery ? (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setShowSearchResults(false)
                }}
                className="absolute right-2.5 top-2 text-jira-muted hover:text-white"
              >
                <X size={14} />
              </button>
            ) : (
              <kbd className="absolute right-2.5 top-2 rounded border border-jira-border bg-jira-surface px-1.5 py-0.5 text-[10px] font-medium text-jira-muted">
                /
              </kbd>
            )}
          </div>

          {/* Search Results Dropdown */}
          {showSearchResults && searchQuery.trim() && (
            <div className="absolute top-12 left-4 right-4 z-50 rounded-lg border border-jira-border bg-jira-surface p-2 shadow-lift">
              <div className="mb-1.5 px-2 text-[10px] font-bold uppercase tracking-wider text-jira-muted">
                Matching Issues ({searchResults.length})
              </div>
              {searchResults.length === 0 ? (
                <div className="p-3 text-center text-xs text-jira-muted">
                  No issues found matching "{searchQuery}"
                </div>
              ) : (
                <div className="space-y-1">
                  {searchResults.map((item) => {
                    const Icon = item.icon
                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          setShowSearchResults(false)
                          showToast(`Opened ${item.id}: ${item.title}`)
                        }}
                        className="flex cursor-pointer items-center justify-between rounded p-2 text-xs hover:bg-jira-surface-2 transition"
                      >
                        <div className="flex items-center gap-2 truncate pr-2">
                          <Icon size={14} className="text-jira-blue shrink-0" />
                          <span className="font-semibold text-white">{item.id}</span>
                          <span className="truncate text-jira-text">{item.title}</span>
                        </div>
                        <span className="shrink-0 rounded bg-jira-surface-3 px-1.5 py-0.5 text-[10px] text-jira-muted">
                          {item.category}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Actions & User Menu */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="btn-primary hidden h-8 px-3 text-xs md:inline-flex"
          >
            <Plus size={14} />
            Create
          </button>

          <div className="relative flex items-center gap-1">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications)
                setShowHelp(false)
              }}
              className="relative rounded-md p-1.5 text-jira-muted hover:bg-jira-surface hover:text-jira-text transition"
              title="Notifications"
            >
              <Bell size={18} />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-jira-blue" />
            </button>

            {/* Notification Drawer */}
            {showNotifications && (
              <div className="absolute right-0 top-10 z-50 w-72 rounded-lg border border-jira-border bg-jira-surface p-3 shadow-lift">
                <div className="flex items-center justify-between border-b border-jira-border pb-2 mb-2">
                  <span className="text-xs font-bold text-white">Notifications</span>
                  <span className="text-[10px] text-jira-muted">3 new</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="rounded p-2 bg-jira-surface-2/60">
                    <p className="font-semibold text-white">Test Run Suite #48 Completed</p>
                    <p className="text-[11px] text-jira-muted mt-0.5">94% pass rate across 124 tests.</p>
                  </div>
                  <div className="rounded p-2 bg-jira-surface-2/60">
                    <p className="font-semibold text-white">BUG-301 Assigned</p>
                    <p className="text-[11px] text-jira-muted mt-0.5">Critical defect moved to In Progress.</p>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => {
                setShowHelp(!showHelp)
                setShowNotifications(false)
              }}
              className="rounded-md p-1.5 text-jira-muted hover:bg-jira-surface hover:text-jira-text transition"
              title="Help & Shortcuts"
            >
              <HelpCircle size={18} />
            </button>

            {/* Help Drawer */}
            {showHelp && (
              <div className="absolute right-0 top-10 z-50 w-64 rounded-lg border border-jira-border bg-jira-surface p-3 shadow-lift">
                <div className="border-b border-jira-border pb-2 mb-2">
                  <span className="text-xs font-bold text-white">QAForge Quick Guide</span>
                </div>
                <div className="space-y-1.5 text-[11px] text-jira-muted">
                  <p>• Click <strong className="text-white">+ Create</strong> to add tasks, test cases, or bugs.</p>
                  <p>• Drag or click card status to advance Kanban columns.</p>
                  <p>• Run tests live from the Test Cases module.</p>
                  <p>• Export requirements matrix to CSV instantly.</p>
                </div>
              </div>
            )}
          </div>

          <div className="h-4 w-px bg-jira-border" />

          <div className="flex items-center gap-2">
            <div className="hidden text-right md:block">
              <div className="text-xs font-semibold text-white">{user?.name || 'QA Tester'}</div>
              <div className="text-[10px] text-jira-muted">{user?.role || 'QA Member'}</div>
            </div>

            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-jira-surface-3 text-xs font-bold text-white border border-jira-border">
              {user?.name?.charAt(0) || 'Q'}
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              className="rounded-md p-1.5 text-jira-muted hover:bg-jira-surface hover:text-red-400 transition"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Global Create Issue Modal */}
      <CreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </>
  )
}

export default Header
