import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronRight, CircleDot, Home } from 'lucide-react'
import Header from './Header'
import Sidebar from './Sidebar'
import CreateModal from '../common/CreateModal'
import { useQA } from '../../context/useQA'

const pageNames = {
  '/': 'Dashboard',
  '/my-work': 'My work',
  '/issues': 'Issues',
  '/projects': 'Projects',
  '/backlog': 'Backlog',
  '/sprints': 'Sprints',
  '/requirements': 'Requirements',
  '/test-cases': 'Test cases',
  '/test-suites': 'Test suites',
  '/test-runs': 'Test runs',
  '/traceability': 'Traceability',
  '/bugs': 'Bugs',
  '/reports': 'Reports',
  '/audit-log': 'Activity',
  '/settings': 'Team & settings',
}

const MainLayout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('qaforge-sidebar-collapsed') === 'true'
    } catch {
      return false
    }
  })
  const location = useLocation()
  const {
    projects,
    selectedProjectKey,
    setSelectedProjectKey,
    sprints,
    isCreateModalOpen,
    createModalType,
    openCreateModal,
    closeCreateModal,
  } = useQA()

  const selectedProject = projects.find((project) => project.key === selectedProjectKey) || projects[0]
  const activeSprint = sprints.find((sprint) => sprint.status === 'Active' && (!sprint.projectKey || sprint.projectKey === selectedProjectKey))
  const basePath = `/${location.pathname.split('/').filter(Boolean)[0] || ''}`
  const detailMatch = location.pathname.match(/^\/(issues|test-runs)\/([^/]+)$/)
  const pageName = detailMatch
    ? `Details · ${decodeURIComponent(detailMatch[2])}`
    : pageNames[basePath] || 'Workspace'
  const sectionName = detailMatch
    ? pageNames[`/${detailMatch[1]}`]
    : ''

  const toggleCollapsed = () => {
    setCollapsed((previous) => {
      const next = !previous
      try {
        localStorage.setItem('qaforge-sidebar-collapsed', String(next))
      } catch {
        // The preference simply falls back to the default when storage is unavailable.
      }
      return next
    })
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-qf-bg text-qf-text">
      <Header
        onMenuClick={() => setMobileOpen(true)}
        onCreate={() => openCreateModal('Task')}
        onQuickCreate={openCreateModal}
      />

      <div className="flex min-h-0 flex-1">
        <Sidebar
          isOpen={mobileOpen}
          onClose={() => setMobileOpen(false)}
          collapsed={collapsed}
          onToggleCollapse={toggleCollapsed}
        />

        <main className="min-w-0 flex-1 overflow-y-auto">
          <div className="flex h-10 items-center justify-between gap-3 border-b border-qf-border bg-qf-bg px-4 text-xs sm:px-6">
            <div className="flex min-w-0 items-center gap-1.5 text-qf-muted">
              <Link to="/" className="flex items-center gap-1 hover:text-qf-text" aria-label="Home">
                <Home size={13} />
              </Link>
              <ChevronRight size={12} className="shrink-0 text-qf-border-strong" />
              <label className="flex min-w-0 items-center">
                <span className="sr-only">Current project</span>
                <select
                  value={selectedProject?.key || selectedProjectKey}
                  onChange={(event) => setSelectedProjectKey(event.target.value)}
                  className="max-w-[10rem] truncate rounded border border-transparent bg-transparent py-0.5 text-xs font-medium text-qf-secondary outline-none transition hover:border-qf-border hover:text-qf-text focus:border-qf-primary sm:max-w-[15rem]"
                >
                  {projects.map((project) => (
                    <option key={project.key} value={project.key}>{project.key} · {project.name}</option>
                  ))}
                </select>
              </label>
              {sectionName && (
                <>
                  <ChevronRight size={12} className="shrink-0 text-qf-border-strong" />
                  <span className="truncate">{sectionName}</span>
                </>
              )}
              <ChevronRight size={12} className="shrink-0 text-qf-border-strong" />
              <span className="truncate font-medium text-qf-secondary">{pageName}</span>
            </div>
            {activeSprint && (
              <Link
                to="/sprints"
                className="hidden shrink-0 items-center gap-1.5 rounded border border-qf-border bg-qf-surface px-2 py-0.5 text-[11px] text-qf-secondary transition hover:text-qf-text sm:flex"
              >
                <CircleDot size={11} className="text-qf-success" />
                {activeSprint.name}
              </Link>
            )}
          </div>

          <div className="px-4 py-5 sm:px-6 sm:py-6">
            <div className="mx-auto w-full max-w-[1600px]">{children}</div>
          </div>
        </main>
      </div>

      <CreateModal
        isOpen={isCreateModalOpen}
        initialType={createModalType}
        onClose={closeCreateModal}
      />
    </div>
  )
}

export default MainLayout
