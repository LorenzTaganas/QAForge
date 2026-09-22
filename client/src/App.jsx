import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import { useAuth } from './context/AuthContext'

const statCards = [
  { label: 'Projects', value: '12', tone: 'text-sky-300' },
  { label: 'Test Cases', value: '320', tone: 'text-emerald-300' },
  { label: 'Open Bugs', value: '24', tone: 'text-amber-300' },
  { label: 'Pass Rate', value: '88.4%', tone: 'text-rose-300' },
]

const navItems = [
  'Overview',
  'Requirements',
  'Test Cases',
  'Runs',
  'Bugs',
  'Reports',
  'Settings',
]

const requirements = [
  { id: 'REQ-104', title: 'User login flow validation', owner: 'QA Lead', priority: 'High', status: 'Approved' },
  { id: 'REQ-112', title: 'Checkout error handling', owner: 'QA Tester', priority: 'Medium', status: 'In Review' },
  { id: 'REQ-118', title: 'Password reset automation', owner: 'Developer', priority: 'High', status: 'Blocked' },
  { id: 'REQ-129', title: 'Reporting dashboard filters', owner: 'PM', priority: 'Low', status: 'Draft' },
  { id: 'REQ-134', title: 'Role-based access checks', owner: 'Security', priority: 'High', status: 'Approved' },
]

const statusStyles = {
  Approved: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  'In Review': 'border-amber-500/30 bg-amber-500/10 text-amber-200',
  Blocked: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
  Draft: 'border-slate-600 bg-slate-800 text-slate-300',
}

const priorityStyles = {
  High: 'text-rose-300',
  Medium: 'text-amber-300',
  Low: 'text-emerald-300',
}

const releaseSteps = [
  { label: 'Requirements', value: '18 / 20', progress: 90 },
  { label: 'Test Cases', value: '94 / 120', progress: 78 },
  { label: 'Regression', value: '7 scheduled', progress: 65 },
  { label: 'Bug Triage', value: '12 open', progress: 58 },
]

const HomePage = () => {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex max-w-[1600px] flex-col lg:flex-row">
        <aside className="w-full border-b border-slate-800 bg-slate-900/80 p-5 lg:w-72 lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-lg font-bold text-sky-300">
              Q
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-sky-300">QAForge</p>
              <h2 className="text-lg font-semibold text-white">Workspace</h2>
            </div>
          </div>

          <nav className="mt-8 space-y-2">
            {navItems.map((item, index) => (
              <button
                key={item}
                type="button"
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition ${
                  index === 0
                    ? 'bg-sky-500/10 text-sky-200 ring-1 ring-sky-500/20'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span>{item}</span>
                {index === 0 && <span className="rounded-full bg-sky-500/10 px-1.5 text-[10px]">Live</span>}
              </button>
            ))}
          </nav>

          <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Current role</p>
            <p className="mt-3 text-xl font-semibold text-white">{user?.role}</p>
            <p className="mt-1 text-sm text-slate-300">{user?.name}</p>
          </div>
        </aside>

        <main className="flex-1 p-5 md:p-8">
          <header className="flex flex-col gap-4 border-b border-slate-800 pb-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Project Overview</p>
              <h1 className="mt-2 text-3xl font-bold text-white md:text-4xl">Release dashboard</h1>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-300">
                Q3 Release v2.4
              </div>
              <button
                onClick={logout}
                className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-sky-400 hover:text-white"
              >
                Logout
              </button>
            </div>
          </header>

          <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {statCards.map(({ label, value, tone }) => (
              <div key={label} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg shadow-slate-950/20">
                <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">{label}</p>
                <p className={`mt-4 text-3xl font-bold ${tone}`}>{value}</p>
              </div>
            ))}
          </section>

          <section className="mt-8 grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Requirements board</h2>
                <button className="rounded-xl bg-sky-300 px-3.5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-200">
                  + New requirement
                </button>
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-800">
                <table className="min-w-full border-collapse text-left text-sm">
                  <thead className="bg-slate-950/80 text-slate-300">
                    <tr>
                      <th className="px-4 py-3 font-medium">ID</th>
                      <th className="px-4 py-3 font-medium">Requirement</th>
                      <th className="px-4 py-3 font-medium">Owner</th>
                      <th className="px-4 py-3 font-medium">Priority</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requirements.map((requirement) => (
                      <tr key={requirement.id} className="border-t border-slate-800 bg-slate-900/70">
                        <td className="px-4 py-3 font-medium text-sky-300">{requirement.id}</td>
                        <td className="px-4 py-3 text-slate-200">{requirement.title}</td>
                        <td className="px-4 py-3 text-slate-300">{requirement.owner}</td>
                        <td className={`px-4 py-3 font-medium ${priorityStyles[requirement.priority]}`}>
                          {requirement.priority}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs ${statusStyles[requirement.status]}`}>
                            {requirement.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
                <h2 className="text-xl font-semibold text-white">Release workflow</h2>
                <div className="mt-5 space-y-5">
                  {releaseSteps.map((step) => (
                    <div key={step.label}>
                      <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
                        <span>{step.label}</span>
                        <span>{step.value}</span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-slate-800">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-sky-400 to-cyan-300"
                          style={{ width: `${step.progress}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
                <h2 className="text-xl font-semibold text-white">Quality snapshot</h2>
                <div className="mt-5 space-y-3 text-sm text-slate-300">
                  <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2.5">
                    <span>Regression suite</span>
                    <span className="font-semibold text-emerald-300">Passed</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2.5">
                    <span>Automation health</span>
                    <span className="font-semibold text-sky-300">Healthy</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2.5">
                    <span>Risk review</span>
                    <span className="font-semibold text-amber-300">Moderate</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
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
