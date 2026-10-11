import React from 'react'
import Header from './Header'
import Sidebar from './Sidebar'

const MainLayout = ({ children }) => {
  return (
    <div className="flex min-h-screen flex-col bg-jira-bg">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto bg-jira-bg p-6 text-jira-text">
          {children}
        </main>
      </div>
    </div>
  )
}

export default MainLayout
