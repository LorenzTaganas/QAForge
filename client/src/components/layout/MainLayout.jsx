import React, { useState } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import { ChevronRight, CircleDot, LayoutGrid } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useQA } from '../../context/useQA'

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
    <div className="flex min-h-screen flex-col bg-[#070B14]">
      <Header onMenuClick={() => setIsSidebarOpen(true)} />
      <div className="border-b border-[#233352] bg-[#0D1424]/90 backdrop-blur px-4 py-2.5 sm:px-6 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2 text-xs">
            <Link to="/" className="flex items-center gap-1.5 text-[#8B97A9] hover:text-[#00F0FF] transition">
              <LayoutGrid size={13} className="text-[#00F0FF]" />
              QAForge
            </Link>
            <ChevronRight size={13} className="shrink-0 text-[#3A5280]" />
            <label className="flex min-w-0 items-center gap-1.5">
              <span className="sr-only">Current project</span>
              <select
                value={selectedProject?.key || projectSettings.key}
                onChange={(event) => setSelectedProjectKey(event.target.value)}
                className="max-w-[11rem] truncate rounded border border-[#2B416C] bg-[#101726] px-2 py-1 font-medium text-[#00F0FF] outline-none focus:border-[#00F0FF] focus:ring-1 focus:ring-[#00F0FF]/40 sm:max-w-[16rem]"
              >
                {projects.map((project) => <option key={project.key} value={project.key}>{project.key} · {project.name}</option>)}
              </select>
            </label>
            <ChevronRight size={13} className="shrink-0 text-[#3A5280]" />
            <span className="truncate text-[#8B97A9]">{pageName}</span>
          </div>
          {activeSprint && (
            <Link to="/sprints" className="hidden shrink-0 items-center gap-1.5 rounded-full border border-[#00F0FF]/40 bg-[#00F0FF]/10 px-2.5 py-1 text-[11px] font-medium text-[#00F0FF] shadow-[0_0_10px_rgba(0,240,255,0.15)] sm:flex">
              <CircleDot size={12} className="animate-pulse text-[#00F0FF]" />
              {activeSprint.name}
            </Link>
          )}
        </div>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <main className="min-w-0 flex-1 overflow-auto bg-gradient-to-br from-[#070B14] via-[#0B101D] to-[#0E1628] p-3 text-[#DDE5F2] sm:p-5 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

export default MainLayout
