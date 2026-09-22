import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import { useAuth } from './context/AuthContext'

const statCards = [
  { label: 'Total Test Cases', value: '120', tone: 'text-sky-300' },
  { label: 'Pass Rate', value: '78.3%', tone: 'text-emerald-300' },
  { label: 'Open Bugs', value: '32', tone: 'text-amber-300' },
  { label: 'Critical Bugs', value: '5', tone: 'text-rose-300' },
]

const HomePage = () => {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-[28px] border border-slate-800 bg-slate-900/80 p-6 shadow-[0_25px_60px_rgba(15,23,42,0.7)] md:p-8">
          <div className="flex flex-col gap-6 border-b border-slate-800 pb-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-300">QAForge</p>
              <h1 className="mt-3 text-3xl font-bold text-white md:text-4xl">Project overview</h1>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-2">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Signed in</p>
                <p className="mt-1 text-sm font-semibold text-white">{user?.name}</p>
              </div>
              <button
                onClick={logout}
                className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-sky-400 hover:text-white"
              >
                Logout
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {statCards.map(({ label, value, tone }) => (
              <div key={label} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
                <p className={`mt-4 text-3xl font-bold ${tone}`}>{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Release workflow</h2>
                <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300">
                  Active sprint
                </span>
              </div>

              <div className="mt-6 space-y-5">
                {[
                  ['Requirements', '18 / 20 approved'],
                  ['Test Cases', '94 / 120 executed'],
                  ['Regression', '7 test runs scheduled'],
                  ['Bug triage', '12 open, 4 critical'],
                ].map(([title, detail]) => (
                  <div key={title} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-white">{title}</p>
                      <span className="text-xs text-slate-400">{detail}</span>
                    </div>
                    <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-sky-400 to-cyan-300"
                        style={{ width: title === 'Requirements' ? '90%' : title === 'Test Cases' ? '78%' : title === 'Regression' ? '65%' : '55%' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6">
              <h2 className="text-xl font-semibold text-white">Current role</h2>
              <div className="mt-5 rounded-2xl border border-sky-500/20 bg-sky-500/10 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-sky-200">Account</p>
                <p className="mt-3 text-2xl font-bold text-white">{user?.role}</p>
                <p className="mt-2 text-sm text-slate-300">{user?.name}</p>
              </div>

              <div className="mt-6 space-y-3 text-sm text-slate-300">
                <p>• View project dashboard</p>
                <p>• Review requirements and test cases</p>
                <p>• Execute QA testing workflows</p>
                <p>• Track bug and regression status</p>
              </div>
            </div>
          </div>
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
