import React, { useEffect, useState } from 'react'
import { Search, Plus, Bell, HelpCircle, LogOut, X, CheckCircle, FileText, Bug, CheckSquare, Menu } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useQA } from '../../context/QAContext'
import CreateModal from '../common/CreateModal'
import { useNavigate } from 'react-router-dom'
import { canCreateIssue } from '../../utils/permissions'
import { formatTimestamp, getTimestamp } from '../../utils/time'

const Header = ({ onMenuClick }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const {
    tasks,
    requirements,
    testCases,
    bugs,
    activity,
    searchQuery,
    setSearchQuery,
    isCreateModalOpen,
    setIsCreateModalOpen,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
  } = useQA()

  const [showNotifications, setShowNotifications] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const recentNotifications = [...notifications]
    .sort((first, second) => getTimestamp(second.createdAt) - getTimestamp(first.createdAt))
    .slice(0, 5)
  const unreadNotificationCount = notifications.filter((notification) => !notification.read).length

  useEffect(() => {
    const handleShortcut = (event) => {
      if (event.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        event.preventDefault()
        document.getElementById('global-search')?.focus()
      }

      if (event.key === 'Escape') {
        setShowSearchResults(false)
        setShowNotifications(false)
        setShowHelp(false)
      }
    }

    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [])

  // Search matches
  const searchResults = searchQuery.trim()
    ? [
        ...tasks
          .filter((t) => t.title.toLowerCase().includes(searchQuery.toLowerCase()) || t.id.toLowerCase().includes(searchQuery.toLowerCase()))
          .map((t) => ({ ...t, category: 'Task', icon: CheckCircle, link: `/issues/${t.id}` })),
        ...requirements
          .filter((r) => r.title.toLowerCase().includes(searchQuery.toLowerCase()) || r.id.toLowerCase().includes(searchQuery.toLowerCase()))
          .map((r) => ({ ...r, category: 'Requirement', icon: FileText, link: `/issues/${r.id}` })),
        ...testCases
          .filter((tc) => tc.title.toLowerCase().includes(searchQuery.toLowerCase()) || tc.id.toLowerCase().includes(searchQuery.toLowerCase()))
          .map((tc) => ({ ...tc, category: 'Test Case', icon: CheckSquare, link: `/issues/${tc.id}` })),
        ...bugs
          .filter((b) => b.title.toLowerCase().includes(searchQuery.toLowerCase()) || b.id.toLowerCase().includes(searchQuery.toLowerCase()))
          .map((b) => ({ ...b, category: 'Bug', icon: Bug, link: `/issues/${b.id}` })),
      ].slice(0, 6)
    : []

  return (
    <>
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-[#20283A] bg-[#111722] px-3 text-[#DDE5F2] sm:px-4">
        {/* Left: Brand */}
        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Open navigation menu"
            className="rounded-md p-2 text-[#AAB5C7] hover:bg-[#1C2638] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B8DFF] lg:hidden"
          >
            <Menu size={19} />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-jira-blue font-bold text-white shadow-sm">
              Q
            </div>
            <span className="hidden text-base font-bold tracking-tight text-white sm:inline">QAForge</span>
          </div>

          <div className="hidden h-4 w-px bg-jira-border md:block" />

          <div className="hidden items-center gap-1 text-sm md:flex">
            <button
              onClick={() => navigate('/projects')}
              className="rounded px-2.5 py-1 font-medium text-jira-text hover:bg-jira-surface-2 hover:text-white transition"
            >
              Workspaces
            </button>
            <button
              onClick={() => navigate('/projects')}
              className="rounded px-2.5 py-1 font-medium text-jira-text hover:bg-jira-surface-2 hover:text-white transition"
            >
              Projects
            </button>
            <button
              onClick={() => navigate('/backlog')}
              className="rounded px-2.5 py-1 font-medium text-jira-text hover:bg-jira-surface-2 hover:text-white transition"
            >
              Filters
            </button>
          </div>
        </div>

        {/* Middle: Global Search */}
        <div className="relative mx-2 flex min-w-0 flex-1 items-center justify-center px-0 sm:mx-4 sm:max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-jira-muted" />
            <input
              id="global-search"
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setShowSearchResults(true)
              }}
              onFocus={() => setShowSearchResults(true)}
              placeholder="Search QAForge..."
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
                          navigate(item.link)
                          setSearchQuery('')
                          setShowSearchResults(false)
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
        <div className="flex shrink-0 items-center gap-1 sm:gap-3">
          {canCreateIssue(user?.role) && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="btn-primary hidden h-8 px-3 text-xs xl:inline-flex"
            >
              <Plus size={14} />
              Create
            </button>
          )}

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
              {unreadNotificationCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                  {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                </span>
              )}
            </button>

            {/* Notification Drawer */}
            {showNotifications && (
              <div className="absolute right-0 top-10 z-50 w-72 rounded-lg border border-jira-border bg-jira-surface p-3 shadow-lift">
                <div className="flex items-center justify-between border-b border-jira-border pb-2 mb-2">
                  <span className="text-xs font-bold text-white">Notifications</span>
                  <button type="button" onClick={markAllNotificationsRead} className="text-[10px] text-jira-blue hover:underline">
                    Mark all read
                  </button>
                </div>
                <div className="space-y-2 text-xs">
                  {recentNotifications.length ? recentNotifications.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        markNotificationRead(item.id)
                        if (item.issueId) navigate(`/issues/${item.issueId}`)
                        setShowNotifications(false)
                      }}
                      className={`w-full rounded p-2 text-left hover:bg-jira-surface-2/60 ${item.read ? '' : 'bg-jira-blue/10'}`}
                    >
                      <p className="font-semibold text-white">{item.title || item.issueId || 'QAForge notification'}</p>
                      <p className="mt-0.5 text-[11px] text-jira-muted">{item.message || `${item.actor || 'QAForge'} ${item.action || ''}`} · {formatTimestamp(item.createdAt)}</p>
                    </button>
                  )) : (
                    <p className="p-2 text-center text-[11px] text-jira-muted">No notifications.</p>
                  )}
                </div>
                <button type="button" onClick={() => { navigate('/audit-log'); setShowNotifications(false) }} className="mt-2 w-full border-t border-jira-border pt-2 text-center text-[11px] text-jira-blue hover:underline">View activity log</button>
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
                  <p>• Use <strong className="text-white">+ Create</strong> to add work items, requirements, test cases, or bugs.</p>
                  <p>• Drag cards between board columns to update status.</p>
                  <p>• Open any issue key to edit details, comments, links, and sprint assignment.</p>
                  <p>• Press <kbd className="rounded border border-jira-border px-1 text-white">/</kbd> to focus global search.</p>
                </div>
                <button type="button" onClick={() => { navigate('/projects'); setShowHelp(false) }} className="mt-3 text-[11px] text-jira-blue hover:underline">Open workspace projects</button>
              </div>
            )}
          </div>

          <div className="hidden h-4 w-px bg-jira-border sm:block" />

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
              aria-label="Sign out"
              className="rounded-md p-2 text-jira-muted hover:bg-jira-surface hover:text-red-400 transition"
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
