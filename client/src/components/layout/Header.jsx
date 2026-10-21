import React, { useEffect, useState } from 'react'
import { Search, Plus, Bell, HelpCircle, LogOut, X, CheckCircle, FileText, Bug, CheckSquare, Menu } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useQA } from '../../context/useQA'
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
  const notificationItems = Array.isArray(notifications) ? notifications : []
  const recentNotifications = [...notificationItems]
    .sort((first, second) => getTimestamp(second.createdAt) - getTimestamp(first.createdAt))
    .slice(0, 5)
  const unreadNotificationCount = notificationItems.filter((notification) => !notification.read).length

  useEffect(() => {
    const handleShortcut = (event) => {
      const activeElement = document.activeElement
      const isTyping = activeElement?.tagName === 'INPUT'
        || activeElement?.tagName === 'TEXTAREA'
        || activeElement?.isContentEditable

      if (event.key === '/' && !isTyping) {
        event.preventDefault()
        document.getElementById('global-search')?.focus()
      }

      if (event.key.toLowerCase() === 'c' && !isTyping && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault()
        setIsCreateModalOpen(true)
        setShowSearchResults(false)
        setShowNotifications(false)
        setShowHelp(false)
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
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-[#233352] bg-[#0A101E]/80 backdrop-blur-md px-3 text-[#DDE5F2] sm:px-4 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        {/* Left: Brand */}
        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Open navigation menu"
            className="rounded-md p-2 text-[#8B97A9] hover:bg-[#172138] hover:text-[#00F0FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00F0FF] lg:hidden"
          >
            <Menu size={19} />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-[#00F0FF] to-[#3B82F6] font-bold text-[#070B14] shadow-[0_0_15px_rgba(0,240,255,0.4)]">
              Q
            </div>
            <span className="hidden text-base font-bold tracking-wider text-white sm:inline bg-gradient-to-r from-white via-[#DDE5F2] to-[#00F0FF] bg-clip-text text-transparent">QAForge</span>
          </div>

          <div className="hidden h-4 w-px bg-[#233352] md:block" />

          <div className="hidden items-center gap-1 text-sm md:flex">
            <button
              onClick={() => navigate('/projects')}
              className="rounded px-2.5 py-1 font-medium text-[#8B97A9] hover:bg-[#172138] hover:text-[#00F0FF] transition"
            >
              Workspaces
            </button>
            <button
              onClick={() => navigate('/projects')}
              className="rounded px-2.5 py-1 font-medium text-[#8B97A9] hover:bg-[#172138] hover:text-[#00F0FF] transition"
            >
              Projects
            </button>
            <button
              onClick={() => navigate('/backlog')}
              className="rounded px-2.5 py-1 font-medium text-[#8B97A9] hover:bg-[#172138] hover:text-[#00F0FF] transition"
            >
              Filters
            </button>
          </div>
        </div>

        {/* Middle: Global Search */}
        <div className="relative mx-2 flex min-w-0 flex-1 items-center justify-center px-0 sm:mx-4 sm:max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#8B97A9]" />
            <input
              id="global-search"
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setShowSearchResults(true)
              }}
              onFocus={() => setShowSearchResults(true)}
              placeholder="Search command center..."
              className="w-full rounded-md border border-[#2B416C] bg-[#070B14]/80 py-1.5 pl-9 pr-8 text-xs text-white placeholder-[#8B97A9] outline-none transition focus:border-[#00F0FF] focus:ring-1 focus:ring-[#00F0FF]/50 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]"
            />
            {searchQuery ? (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setShowSearchResults(false)
                }}
                className="absolute right-2.5 top-2 text-[#8B97A9] hover:text-[#00F0FF]"
              >
                <X size={14} />
              </button>
            ) : (
              <kbd className="absolute right-2.5 top-2 rounded border border-[#2B416C] bg-[#101726] px-1.5 py-0.5 text-[10px] font-medium text-[#8B97A9]">
                /
              </kbd>
            )}
          </div>

          {/* Search Results Dropdown */}
          {showSearchResults && searchQuery.trim() && (
            <div className="absolute top-12 left-4 right-4 z-50 rounded-xl border border-[#2B416C] bg-[#101726]/95 backdrop-blur-md p-2 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_20px_rgba(0,240,255,0.15)]">
              <div className="mb-1.5 px-2 text-[10px] font-bold uppercase tracking-wider text-[#00F0FF]">
                Matching Issues ({searchResults.length})
              </div>
              {searchResults.length === 0 ? (
                <div className="p-3 text-center text-xs text-[#8B97A9]">
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
                        className="flex cursor-pointer items-center justify-between rounded-md p-2 text-xs hover:bg-[#172138] hover:border hover:border-[#00F0FF]/30 transition"
                      >
                        <div className="flex items-center gap-2 truncate pr-2">
                          <Icon size={14} className="text-[#00F0FF] shrink-0" />
                          <span className="font-semibold text-white">{item.id}</span>
                          <span className="truncate text-[#DDE5F2]">{item.title}</span>
                        </div>
                        <span className="shrink-0 rounded bg-[#172138] px-1.5 py-0.5 text-[10px] text-[#8B97A9] border border-[#2B416C]">
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
              className="relative rounded-md p-1.5 text-[#8B97A9] hover:bg-[#172138] hover:text-[#00F0FF] transition"
              title="Notifications"
            >
              <Bell size={18} />
              {unreadNotificationCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#00F0FF] px-1 text-[9px] font-bold text-[#070B14] shadow-[0_0_8px_#00F0FF]">
                  {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                </span>
              )}
            </button>

            {/* Notification Drawer */}
            {showNotifications && (
              <div className="absolute right-0 top-10 z-50 w-72 rounded-xl border border-[#2B416C] bg-[#101726]/95 backdrop-blur-md p-3 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_20px_rgba(0,240,255,0.15)]">
                <div className="flex items-center justify-between border-b border-[#233352] pb-2 mb-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Signals</span>
                  <button type="button" onClick={markAllNotificationsRead} className="text-[10px] text-[#00F0FF] hover:underline">
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
                      className={`w-full rounded-lg p-2 text-left hover:bg-[#172138] transition ${item.read ? '' : 'bg-[#00F0FF]/10 border border-[#00F0FF]/20'}`}
                    >
                      <p className="font-semibold text-white">{item.title || item.issueId || 'QAForge notification'}</p>
                      <p className="mt-0.5 text-[11px] text-[#8B97A9]">{item.message || `${item.actor || 'QAForge'} ${item.action || ''}`} · {formatTimestamp(item.createdAt)}</p>
                    </button>
                  )) : (
                    <p className="p-2 text-center text-[11px] text-[#8B97A9]">No active signals.</p>
                  )}
                </div>
                <button type="button" onClick={() => { navigate('/audit-log'); setShowNotifications(false) }} className="mt-2 w-full border-t border-[#233352] pt-2 text-center text-[11px] text-[#00F0FF] hover:underline">View activity log</button>
              </div>
            )}

            <button
              onClick={() => {
                setShowHelp(!showHelp)
                setShowNotifications(false)
              }}
              className="rounded-md p-1.5 text-[#8B97A9] hover:bg-[#172138] hover:text-[#00F0FF] transition"
              title="Help & Shortcuts"
            >
              <HelpCircle size={18} />
            </button>

            {/* Help Drawer */}
            {showHelp && (
              <div className="absolute right-0 top-10 z-50 w-64 rounded-xl border border-[#2B416C] bg-[#101726]/95 backdrop-blur-md p-3 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_20px_rgba(0,240,255,0.15)]">
                <div className="border-b border-[#233352] pb-2 mb-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Tactical Guide</span>
                </div>
                <div className="space-y-1.5 text-[11px] text-[#8B97A9]">
                  <p>• Use <strong className="text-[#00F0FF]">+ Create</strong> to initialize work items, test cases, or bugs.</p>
                  <p>• Drag isometric cards between columns to update status.</p>
                  <p>• Open any issue key to edit details, comments, and links.</p>
                  <p>• Press <kbd className="rounded border border-[#2B416C] bg-[#070B14] px-1 text-[#00F0FF]">/</kbd> to focus global search.</p>
                  <p>• Press <kbd className="rounded border border-[#2B416C] bg-[#070B14] px-1 text-[#00F0FF]">C</kbd> to quick-create an issue.</p>
                </div>
                <button type="button" onClick={() => { navigate('/projects'); setShowHelp(false) }} className="mt-3 text-[11px] text-[#00F0FF] hover:underline">Open workspace projects</button>
              </div>
            )}
          </div>

          <div className="hidden h-4 w-px bg-[#233352] sm:block" />

          <div className="flex items-center gap-2">
            <div className="hidden text-right md:block">
              <div className="text-xs font-semibold text-white">{user?.name || 'Commander'}</div>
              <div className="text-[10px] text-[#00F0FF]">{user?.role || 'QA Lead'}</div>
            </div>

            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#172138] text-xs font-bold text-[#00F0FF] border border-[#00F0FF]/40 shadow-[0_0_10px_rgba(0,240,255,0.2)]">
              {user?.name?.charAt(0) || 'Q'}
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              aria-label="Sign out"
              className="rounded-md p-2 text-[#8B97A9] hover:bg-[#172138] hover:text-red-400 transition"
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
