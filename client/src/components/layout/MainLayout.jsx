import React, { useState } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import { ChevronRight, CircleDot, LayoutGrid } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useQA } from '../../context/QAContext'

const MainLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const location = useLocation()
  const { projectSettings, projects, selectedProjectKey, setSelectedProjectKey, sprints } = useQA()
  const selectedProject = projects.find((project) => project.key === selectedProjectKey) || projects[0]
  const activeSprint = sprints.find((sprint) => sprint.status === 'Active')
  const pageNames = {
    '/': 'Overview',
    '/projects': 'Projects',
    '/backlog': 'Backlog',
    '/sprints': 'Active sprint',
    '/requirements': 'Requirements',
    '/test-cases': 'Test cases',
    '/test-runs': 'Test runs',
    '/traceability': 'Traceability',
    '/bugs': 'Bugs',
    '/reports': 'Reports',
    '/audit-log': 'Activity log',
    '/settings': 'Settings',
  }
  const issuePage = location.pathname.startsWith('/issues/')
  const pageName = pageNames[location.pathname] || (issuePage ? 'Issue details' : 'QA workspace')

  return (
    <div className="flex min-h-screen flex-col bg-[#0D1119]">
      <Header onMenuClick={() => setIsSidebarOpen(true)} />
      <div className="border-b border-[#20283A] bg-[#111722] px-4 py-2.5 sm:px-6">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2 text-xs">
            <Link to="/" className="flex items-center gap-1.5 text-[#78849A] hover:text-white">
              <LayoutGrid size={13} />
              QAForge
            </Link>
            <ChevronRight size={13} className="shrink-0 text-[#4A566B]" />
            <label className="flex min-w-0 items-center gap-1.5">
              <span className="sr-only">Current project</span>
              <select
                value={selectedProject?.key || projectSettings.key}
                onChange={(event) => setSelectedProjectKey(event.target.value)}
                className="max-w-[11rem] truncate rounded border border-[#2B3345] bg-[#171B25] px-2 py-1 font-medium text-[#DDE5F2] outline-none focus:border-[#4B8DFF] sm:max-w-[16rem]"
              >
                {projects.map((project) => <option key={project.key} value={project.key}>{project.key} · {project.name}</option>)}
              </select>
            </label>
            <ChevronRight size={13} className="shrink-0 text-[#4A566B]" />
            <span className="truncate text-[#78849A]">{pageName}</span>
          </div>
          {activeSprint && (
            <Link to="/sprints" className="hidden shrink-0 items-center gap-1.5 rounded-full border border-[#28559A] bg-[#182A4A] px-2.5 py-1 text-[11px] font-medium text-[#B8D9FF] sm:flex">
              <CircleDot size={12} />
              {activeSprint.name}
            </Link>
          )}
        </div>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <main className="min-w-0 flex-1 overflow-auto bg-[#0D1119] p-3 text-[#DDE5F2] sm:p-5 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

export default MainLayout
