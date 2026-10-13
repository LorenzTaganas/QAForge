import React, { useState } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'

const MainLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen flex-col bg-[#0D1119]">
      <Header onMenuClick={() => setIsSidebarOpen(true)} />
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
