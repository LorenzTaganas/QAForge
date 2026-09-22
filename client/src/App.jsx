import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import { useAuth } from './context/AuthContext'

const boardColumns = [
  {
    name: 'To Do',
    accent: 'bg-sky-500',
    tasks: [
      { title: 'Validate login flow', due: 'Sep 27, 2026', owner: 'KAN-1' },
      { title: 'Review release checklist', due: 'Sep 30, 2026', owner: 'KAN-3' },
    ],
  },
  {
    name: 'In Progress',
    accent: 'bg-emerald-500',
    tasks: [
      { title: 'Fix checkout edge case', due: 'Oct 2, 2026', owner: 'KAN-4' },
      { title: 'Update regression matrix', due: 'Oct 5, 2026', owner: 'KAN-6' },
    ],
  },
  {
    name: 'In Review',
    accent: 'bg-amber-500',
    tasks: [
      { title: 'Security access validation', due: 'Oct 4, 2026', owner: 'KAN-7' },
    ],
  },
  {
    name: 'Done',
    accent: 'bg-slate-500',
    tasks: [
      { title: 'Requirements traceability', due: 'Sep 22, 2026', owner: 'KAN-2' },
    ],
  },
]

const navItems = ['Overview', 'Requirements', 'Test Cases', 'Runs', 'Bugs', 'Reports', 'Settings']

const HomePage = () => {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-[#101827] text-slate-100">
      <div className="flex min-h-screen flex-col">
        <header className="flex items-center justify-between border-b border-slate-800 bg-[#111827] px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-sky-500/10 text-sm font-bold text-sky-300">
              Q
            </div>
            <div className="text-sm font-medium text-slate-200">QAForge</div>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <button className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-300">
              Search
            </button>
            <button className="rounded-md bg-sky-500 px-3 py-1.5 text-sm font-medium text-slate-950">
              + Create
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-300 md:block">
              {user?.role}
            </div>
            <button
              onClick={logout}
              className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-200 transition hover:border-sky-400 hover:text-white"
            >
              Logout
            </button>
          </div>
        </header>

        <div className="flex flex-1 flex-col lg:flex-row">
          <aside className="w-full border-b border-slate-800 bg-[#0f172a] p-4 lg:w-64 lg:border-b-0 lg:border-r">
            <div className="mb-4 text-xs uppercase tracking-[0.2em] text-slate-400">Workspaces</div>

            <div className="space-y-2">
              {navItems.map((item, index) => (
                <button
                  key={item}
                  type="button"
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition ${
                    index === 0 ? 'bg-sky-500/10 text-sky-200 ring-1 ring-sky-500/20' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span>{item}</span>
                </button>
              ))}
            </div>

            <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900/60 p-3">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Current user</div>
              <div className="mt-3 text-base font-semibold text-white">{user?.name}</div>
              <div className="mt-1 text-sm text-slate-400">{user?.role}</div>
            </div>
          </aside>

          <main className="flex-1 bg-[#0b1220] p-4 md:p-6">
            <div className="rounded-xl border border-slate-800 bg-[#111827] p-4 shadow-[0_18px_50px_rgba(2,6,23,0.5)]">
              <div className="flex flex-col gap-4 border-b border-slate-800 pb-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.22em] text-slate-400">My Software Team</div>
                  <h1 className="mt-2 text-3xl font-bold text-white">QA release board</h1>
                </div>

                <div className="flex items-center gap-2">
                  <button className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-300">
                    Filters
                  </button>
                  <button className="rounded-lg bg-sky-500 px-3 py-2 text-sm font-medium text-slate-950">
                    Share
                  </button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-1">Summary</span>
                <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-1">Board</span>
                <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-1">Timeline</span>
                <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-1">Reports</span>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: 'Open tasks', value: '18', tone: 'text-sky-300' },
                  { label: 'In review', value: '7', tone: 'text-amber-300' },
                  { label: 'Blocked', value: '3', tone: 'text-rose-300' },
                  { label: 'Done', value: '42', tone: 'text-emerald-300' },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{item.label}</div>
                    <div className={`mt-3 text-3xl font-bold ${item.tone}`}>{item.value}</div>
                  </div>
                ))}
              </div>

              <div className="mt-6 grid gap-4 xl:grid-cols-4">
                {boardColumns.map((column) => (
                  <div key={column.name} className="rounded-xl border border-slate-800 bg-[#0f172a]">
                    <div className={`flex items-center justify-between rounded-t-xl px-3 py-3 ${column.accent}`}>
                      <span className="text-sm font-semibold text-white">{column.name}</span>
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/90">
                        {column.tasks.length}
                      </span>
                    </div>

                    <div className="space-y-3 p-3">
                      {column.tasks.map((task) => (
                        <div key={task.title} className="rounded-xl border border-slate-700 bg-[#111827] p-3 shadow-md shadow-slate-950/20">
                          <div className="flex items-start justify-between gap-2">
                            <div className="text-sm font-medium text-slate-100">{task.title}</div>
                            <button className="text-slate-500">⋯</button>
                          </div>

                          <div className="mt-3 text-xs text-slate-400">Due date</div>
                          <div className="mt-1 text-sm text-slate-300">{task.due}</div>

                          <div className="mt-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-700 text-[10px] font-bold text-slate-200">
                                {task.owner.split('-')[1] || 'Q'}
                              </div>
                              <span className="text-xs text-slate-300">{task.owner}</span>
                            </div>
                            <span className="rounded-full border border-slate-700 bg-slate-800 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-slate-300">
                              QA
                            </span>
                          </div>
                        </div>
                      ))}

                      <button className="flex w-full items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-900/50 px-3 py-3 text-sm text-slate-400 transition hover:border-sky-500 hover:text-sky-300">
                        + Create
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">
        Loading QAForge...
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to={user ? '/' : '/login'} replace />} />
    </Routes>
  )
}

export default App
