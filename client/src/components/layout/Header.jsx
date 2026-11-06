import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Bell,
  Bug,
  Check,
  CheckSquare,
  ChevronDown,
  CircleHelp,
  FolderKanban,
  LogOut,
  Menu,
  PlayCircle,
  Plus,
  Search,
  Settings,
  UserRound,
  X,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useQA } from '../../context/useQA'
import { formatTimestamp, getTimestamp } from '../../utils/time'
import Avatar from '../ui/Avatar'

const Highlight = ({ text = '', query = '' }) => {
  const term = query.trim()
  if (!term) return text
  const index = text.toLowerCase().indexOf(term.toLowerCase())
  if (index === -1) return text
  return (
    <>
      {text.slice(0, index)}
      <mark className="rounded-sm bg-qf-primary/30 px-0.5 text-qf-text">{text.slice(index, index + term.length)}</mark>
      {text.slice(index + term.length)}
    </>
  )
}

const Header = ({ onMenuClick, onCreate, onQuickCreate }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const {
    tasks,
    bugs,
    testCases,
    testRuns,
    projects,
    selectedProjectKey,
    setSelectedProjectKey,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    searchQuery,
    setSearchQuery,
  } = useQA()

  const [openMenu, setOpenMenu] = useState(null)
  const [rawQuery, setRawQuery] = useState('')
  const [query, setQuery] = useState('')
  const searchRef = useRef(null)

  const currentProject = projects.find((project) => project.key === selectedProjectKey) || projects[0]
  const notificationItems = Array.isArray(notifications) ? notifications : []
  const recentNotifications = [...notificationItems]
    .sort((first, second) => getTimestamp(second.createdAt) - getTimestamp(first.createdAt))
    .slice(0, 6)
  const unreadCount = notificationItems.filter((notification) => !notification.read).length

  useEffect(() => {
    const timer = window.setTimeout(() => setQuery(rawQuery), 180)
    return () => window.clearTimeout(timer)
  }, [rawQuery])

  useEffect(() => {
    setRawQuery(searchQuery || '')
    setQuery(searchQuery || '')
  }, [searchQuery])

  useEffect(() => {
    const handleShortcut = (event) => {
      const element = document.activeElement
      const isTyping = element?.tagName === 'INPUT' || element?.tagName === 'TEXTAREA' || element?.tagName === 'SELECT' || element?.isContentEditable

      if (event.key === '/' && !isTyping) {
        event.preventDefault()
        setOpenMenu('search')
        searchRef.current?.focus()
      }
      if (event.key.toLowerCase() === 'c' && !isTyping && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault()
        onCreate()
      }
      if (event.key === 'Escape') {
        setOpenMenu(null)
        searchRef.current?.blur()
      }
    }
    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [onCreate])

  const results = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return []
    const match = (value = '') => value.toLowerCase().includes(term)
    const list = [
      ...tasks.filter((task) => match(task.id) || match(task.title)).map((task) => ({ id: task.id, title: task.title, type: 'Issue', icon: Bug, to: `/issues/${task.id}` })),
      ...bugs.filter((bug) => match(bug.id) || match(bug.title)).map((bug) => ({ id: bug.id, title: bug.title, type: 'Issue', icon: Bug, to: `/issues/${bug.id}` })),
      ...testCases.filter((testCase) => match(testCase.id) || match(testCase.title)).map((testCase) => ({ id: testCase.id, title: testCase.title, type: 'Test case', icon: CheckSquare, to: `/issues/${testCase.id}` })),
      ...testRuns.filter((run) => match(run.id) || match(run.name || run.title)).map((run) => ({ id: run.id, title: run.name || run.title, type: 'Test run', icon: PlayCircle, to: `/test-runs/${run.id}` })),
      ...projects.filter((project) => match(project.key) || match(project.name)).map((project) => ({ id: project.key, title: project.name, type: 'Project', icon: FolderKanban, to: '/projects' })),
    ]
    return list.slice(0, 8)
  }, [bugs, projects, query, tasks, testCases, testRuns])

  const closeMenu = () => setOpenMenu(null)

  const handleResult = (result) => {
    if (result.type === 'Project') setSelectedProjectKey(result.id)
    navigate(result.to)
    setRawQuery('')
    setQuery('')
    setSearchQuery('')
    closeMenu()
  }

  const menuButtonClass = (name) => `rounded-md p-2 transition ${openMenu === name ? 'bg-qf-card text-qf-text' : 'text-qf-secondary hover:bg-qf-card hover:text-qf-text'}`

  return (
    <>
      <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-2 border-b border-qf-border bg-qf-sidebar px-3 sm:gap-3 sm:px-4">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
          className="rounded-md p-2 text-qf-secondary hover:bg-qf-card hover:text-qf-text lg:hidden"
        >
          <Menu size={19} />
        </button>

        <Link to="/" className="flex shrink-0 items-center gap-2.5" aria-label="QAForge home">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-qf-primary text-sm font-bold text-[#0F1016]">Q</span>
          <span className="hidden text-[15px] font-semibold tracking-tight text-qf-text sm:inline">QAForge</span>
        </Link>

        <span className="hidden h-5 w-px bg-qf-border sm:block" />

        <label className="hidden min-w-0 items-center gap-1.5 md:flex">
          <span className="sr-only">Current project</span>
          <select
            value={selectedProjectKey}
            onChange={(event) => setSelectedProjectKey(event.target.value)}
            className="max-w-[13rem] rounded-md border border-qf-border bg-qf-surface px-2 py-1.5 text-xs font-medium text-qf-text outline-none transition hover:border-qf-border-strong focus:border-qf-primary"
          >
            {projects.map((project) => (
              <option key={project.key} value={project.key}>{project.key} · {project.name}</option>
            ))}
          </select>
        </label>

        <div className="relative mx-auto w-full max-w-md">
          <Search className="pointer-events-none absolute left-2.5 top-2 h-4 w-4 text-qf-muted" aria-hidden="true" />
          <input
            ref={searchRef}
            id="global-search"
            type="search"
            value={rawQuery}
            onChange={(event) => {
              setRawQuery(event.target.value)
              setSearchQuery(event.target.value)
              setOpenMenu('search')
            }}
            onFocus={() => setOpenMenu('search')}
            placeholder="Search issues, tests, runs…"
            aria-label="Search workspace"
            className="w-full rounded-md border border-qf-border bg-qf-input py-1.5 pl-8 pr-14 text-xs text-qf-text placeholder-qf-muted outline-none transition focus:border-qf-primary focus:ring-2 focus:ring-qf-primary/20"
          />
          {rawQuery ? (
            <button
              type="button"
              onClick={() => {
                setRawQuery('')
                setQuery('')
                setSearchQuery('')
              }}
              className="absolute right-2 top-1.5 rounded p-1 text-qf-muted hover:text-qf-text"
              aria-label="Clear search"
            >
              <X size={13} />
            </button>
          ) : (
            <kbd className="pointer-events-none absolute right-2 top-1.5 rounded border border-qf-border bg-qf-surface px-1.5 py-0.5 text-[10px] font-medium text-qf-muted">/</kbd>
          )}

          {openMenu === 'search' && query.trim() && (
            <div className="absolute left-0 right-0 top-11 z-50 overflow-hidden rounded-lg border border-qf-border bg-qf-surface shadow-popover animate-fade-in">
              <p className="border-b border-qf-border px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-qf-muted">
                {results.length} result{results.length === 1 ? '' : 's'} for “{query.trim()}”
              </p>
              {results.length ? (
                <ul className="max-h-80 overflow-y-auto py-1">
                  {results.map((result) => {
                    const Icon = result.icon
                    return (
                      <li key={`${result.type}-${result.id}`}>
                        <button
                          type="button"
                          onClick={() => handleResult(result)}
                          className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs transition hover:bg-qf-card"
                        >
                          <Icon size={14} className="shrink-0 text-qf-muted" />
                          <span className="w-16 shrink-0 font-mono text-[11px] text-qf-primary">{result.id}</span>
                          <span className="min-w-0 flex-1 truncate text-qf-text">
                            <Highlight text={result.title || ''} query={query} />
                          </span>
                          <span className="shrink-0 text-[10px] text-qf-muted">{result.type}</span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <p className="px-3 py-6 text-center text-xs text-qf-muted">No issues, test cases, runs, or projects match your search.</p>
              )}
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenMenu(openMenu === 'create' ? null : 'create')}
              className="btn-primary hidden h-8 px-2.5 text-xs sm:inline-flex"
              aria-haspopup="menu"
              aria-expanded={openMenu === 'create'}
            >
              <Plus size={14} />
              <span className="hidden lg:inline">Create</span>
              <ChevronDown size={12} />
            </button>
            {openMenu === 'create' && (
              <div role="menu" className="absolute right-0 top-10 z-50 w-52 overflow-hidden rounded-lg border border-qf-border bg-qf-surface py-1 shadow-popover animate-fade-in">
                {[
                  { label: 'Issue', hint: 'Task or bug', icon: Bug, run: () => onQuickCreate('Task') },
                  { label: 'Bug', hint: 'Report a defect', icon: Bug, run: () => onQuickCreate('Bug') },
                  { label: 'Test case', hint: 'Add coverage', icon: CheckSquare, run: () => onQuickCreate('TestCase') },
                  { label: 'Test run', hint: 'Execute tests', icon: PlayCircle, run: () => navigate('/test-runs?create=1') },
                  { label: 'Project', hint: 'New workspace', icon: FolderKanban, run: () => navigate('/projects?create=1') },
                ].map((item) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={item.label}
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        item.run()
                        closeMenu()
                      }}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs text-qf-text transition hover:bg-qf-card"
                    >
                      <Icon size={14} className="text-qf-muted" />
                      <span className="flex-1">{item.label}</span>
                      <span className="text-[10px] text-qf-muted">{item.hint}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenMenu(openMenu === 'notifications' ? null : 'notifications')}
              className={`relative ${menuButtonClass('notifications')}`}
              aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
              aria-haspopup="menu"
              aria-expanded={openMenu === 'notifications'}
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-qf-danger px-1 text-[9px] font-bold text-[#1A0E10]">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            {openMenu === 'notifications' && (
              <div className="absolute right-0 top-11 z-50 w-80 overflow-hidden rounded-lg border border-qf-border bg-qf-surface shadow-popover animate-fade-in">
                <div className="flex items-center justify-between border-b border-qf-border px-3 py-2.5">
                  <span className="text-xs font-semibold text-qf-text">Notifications</span>
                  {unreadCount > 0 && (
                    <button type="button" onClick={markAllNotificationsRead} className="text-[11px] font-medium text-qf-primary hover:underline">
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {recentNotifications.length ? recentNotifications.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        if (!item.read) markNotificationRead(item.id)
                        if (item.issueId) navigate(`/issues/${item.issueId}`)
                        closeMenu()
                      }}
                      className={`flex w-full items-start gap-2.5 border-b border-qf-border/60 px-3 py-2.5 text-left transition last:border-0 hover:bg-qf-card ${item.read ? '' : 'bg-qf-primary/5'}`}
                    >
                      <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${item.read ? 'bg-qf-border-strong' : 'bg-qf-primary'}`} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-medium text-qf-text">{item.title || item.issueId || 'Workspace update'}</span>
                        <span className="mt-0.5 block truncate text-[11px] text-qf-muted">{item.message || `${item.actor || 'QAForge'} ${item.action || ''}`}</span>
                        <span className="mt-0.5 block text-[10px] text-qf-muted">{formatTimestamp(item.createdAt)}</span>
                      </span>
                      {item.read && <Check size={13} className="mt-1 shrink-0 text-qf-muted" />}
                    </button>
                  )) : (
                    <p className="px-3 py-8 text-center text-xs text-qf-muted">You're all caught up.</p>
                  )}
                </div>
                <Link to="/audit-log" onClick={closeMenu} className="block border-t border-qf-border px-3 py-2 text-center text-[11px] font-medium text-qf-primary hover:bg-qf-card">
                  View all activity
                </Link>
              </div>
            )}
          </div>

          <div className="relative hidden sm:block">
            <button
              type="button"
              onClick={() => setOpenMenu(openMenu === 'help' ? null : 'help')}
              className={menuButtonClass('help')}
              aria-label="Help and keyboard shortcuts"
              aria-haspopup="menu"
              aria-expanded={openMenu === 'help'}
            >
              <CircleHelp size={18} />
            </button>
            {openMenu === 'help' && (
              <div className="absolute right-0 top-11 z-50 w-72 rounded-lg border border-qf-border bg-qf-surface p-3 shadow-popover animate-fade-in">
                <p className="mb-2 text-xs font-semibold text-qf-text">Keyboard shortcuts</p>
                <dl className="space-y-1.5 text-[11px] text-qf-secondary">
                  <div className="flex items-center justify-between"><dt>Focus search</dt><dd><kbd className="rounded border border-qf-border bg-qf-card px-1.5 py-0.5">/</kbd></dd></div>
                  <div className="flex items-center justify-between"><dt>Create issue</dt><dd><kbd className="rounded border border-qf-border bg-qf-card px-1.5 py-0.5">C</kbd></dd></div>
                  <div className="flex items-center justify-between"><dt>Close menu</dt><dd><kbd className="rounded border border-qf-border bg-qf-card px-1.5 py-0.5">Esc</kbd></dd></div>
                </dl>
                <p className="mt-3 border-t border-qf-border pt-2 text-[11px] leading-5 text-qf-muted">
                  Use the project switcher to scope dashboards, issues, tests, and reports.
                </p>
              </div>
            )}
          </div>

          <span className="mx-0.5 hidden h-5 w-px bg-qf-border sm:block" />

          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenMenu(openMenu === 'profile' ? null : 'profile')}
              className="flex items-center gap-2 rounded-md p-1 transition hover:bg-qf-card"
              aria-label="Open profile menu"
              aria-haspopup="menu"
              aria-expanded={openMenu === 'profile'}
            >
              <Avatar name={user?.name || 'QAForge User'} size="md" />
              <span className="hidden text-left lg:block">
                <span className="block max-w-[9rem] truncate text-xs font-medium text-qf-text">{user?.name || 'QA User'}</span>
                <span className="block text-[10px] text-qf-muted">{user?.role || 'QA Tester'}</span>
              </span>
              <ChevronDown size={12} className="hidden text-qf-muted lg:block" />
            </button>
            {openMenu === 'profile' && (
              <div className="absolute right-0 top-11 z-50 w-56 overflow-hidden rounded-lg border border-qf-border bg-qf-surface shadow-popover animate-fade-in">
                <div className="border-b border-qf-border px-3 py-3">
                  <p className="truncate text-xs font-semibold text-qf-text">{user?.name}</p>
                  <p className="mt-0.5 truncate text-[11px] text-qf-muted">{user?.email}</p>
                  <p className="mt-1 inline-flex rounded border border-qf-border bg-qf-card px-1.5 py-0.5 text-[10px] text-qf-secondary">{user?.role}</p>
                </div>
                <Link to="/settings" onClick={closeMenu} className="flex items-center gap-2 px-3 py-2 text-xs text-qf-text hover:bg-qf-card">
                  <UserRound size={14} className="text-qf-muted" /> Profile & settings
                </Link>
                <Link to="/my-work" onClick={closeMenu} className="flex items-center gap-2 px-3 py-2 text-xs text-qf-text hover:bg-qf-card">
                  <CheckSquare size={14} className="text-qf-muted" /> My work
                </Link>
                <Link to="/settings" onClick={closeMenu} className="flex items-center gap-2 px-3 py-2 text-xs text-qf-text hover:bg-qf-card">
                  <Settings size={14} className="text-qf-muted" /> Workspace settings
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="flex w-full items-center gap-2 border-t border-qf-border px-3 py-2 text-left text-xs text-qf-danger hover:bg-qf-danger/10"
                >
                  <LogOut size={14} /> Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {openMenu && (
        <button
          type="button"
          className="fixed inset-0 z-30 cursor-default"
          aria-label="Close menu"
          onClick={closeMenu}
          tabIndex={-1}
        />
      )}
    </>
  )
}

export default Header
