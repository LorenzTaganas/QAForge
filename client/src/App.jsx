import { Routes, Route, Navigate } from 'react-router-dom'

const HomePage = () => (
  <div className="min-h-screen bg-slate-950 p-8 text-slate-100">
    <div className="mx-auto max-w-6xl">
      <div className="card-surface p-8">
        <p className="mb-3 text-sm uppercase tracking-[0.2em] text-brand-400">QAForge</p>
        <h1 className="text-4xl font-bold text-white">Quality Assurance & Test Management Platform</h1>
        <p className="mt-4 max-w-2xl text-slate-300">
          A portfolio-ready QA platform for managing requirements, test suites, test runs, bugs,
          execution histories, reports, and team collaboration.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="card-surface p-5">
            <h2 className="text-lg font-semibold text-white">Core Workflow</h2>
            <p className="mt-2 text-sm text-slate-300">
              Requirements → Test Cases → Test Runs → Bugs → Reports
            </p>
          </div>
          <div className="card-surface p-5">
            <h2 className="text-lg font-semibold text-white">QA Roles</h2>
            <p className="mt-2 text-sm text-slate-300">
              Tester, Lead, Developer, and Project Manager access patterns.
            </p>
          </div>
          <div className="card-surface p-5">
            <h2 className="text-lg font-semibold text-white">Portfolio Goal</h2>
            <p className="mt-2 text-sm text-slate-300">
              Demonstrate strong QA thinking, API design, and full-stack development ability.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
)

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
