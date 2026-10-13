import React from 'react'
import Header from './Header'
import Sidebar from './Sidebar'

const MainLayout = ({ children }) => {
  return (
    <div className="flex min-h-screen flex-col bg-[#0D1119]">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto bg-[#0D1119] p-4 text-[#DDE5F2] sm:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

export default MainLayout
