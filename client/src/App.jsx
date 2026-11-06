import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import Loading from './components/common/Loading'
import { useAuth } from './context/AuthContext'
import { QAProvider } from './context/QAContext'

const LoginPage = lazy(() => import('./pages/LoginPage'))
const HomePage = lazy(() => import('./pages/HomePage'))
const MyWorkPage = lazy(() => import('./pages/MyWorkPage'))
const IssuesPage = lazy(() => import('./pages/IssuesPage'))
const RequirementsPage = lazy(() => import('./pages/RequirementsPage'))
const TestCasesPage = lazy(() => import('./pages/TestCasesPage'))
const TestSuitesPage = lazy(() => import('./pages/TestSuitesPage'))
const BugsPage = lazy(() => import('./pages/BugsPage'))
const ReportsPage = lazy(() => import('./pages/ReportsPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const ProjectsPage = lazy(() => import('./pages/ProjectsPage'))
const IssueDetailPage = lazy(() => import('./pages/IssueDetailPage'))
const BacklogPage = lazy(() => import('./pages/BacklogPage'))
const TestRunsPage = lazy(() => import('./pages/TestRunsPage'))
const TestRunDetailPage = lazy(() => import('./pages/TestRunDetailPage'))
const TraceabilityPage = lazy(() => import('./pages/TraceabilityPage'))
const SprintsPage = lazy(() => import('./pages/SprintsPage'))
const AuditLogsPage = lazy(() => import('./pages/AuditLogsPage'))

const PageLoading = () => <Loading />

const protectedPage = (element) => <ProtectedRoute>{element}</ProtectedRoute>

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return <Loading fullScreen />
  }

  return (
    <QAProvider key={user?.id || 'anonymous'}>
      <Suspense fallback={<PageLoading />}>
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
          <Route path="/" element={protectedPage(<HomePage />)} />
          <Route path="/my-work" element={protectedPage(<MyWorkPage />)} />
          <Route path="/issues" element={protectedPage(<IssuesPage />)} />
          <Route path="/issues/:issueId" element={protectedPage(<IssueDetailPage />)} />
          <Route path="/requirements" element={protectedPage(<RequirementsPage />)} />
          <Route path="/test-cases" element={protectedPage(<TestCasesPage />)} />
          <Route path="/test-suites" element={protectedPage(<TestSuitesPage />)} />
          <Route path="/test-runs" element={protectedPage(<TestRunsPage />)} />
          <Route path="/test-runs/:runId" element={protectedPage(<TestRunDetailPage />)} />
          <Route path="/bugs" element={protectedPage(<BugsPage />)} />
          <Route path="/reports" element={protectedPage(<ReportsPage />)} />
          <Route path="/settings" element={protectedPage(<SettingsPage />)} />
          <Route path="/projects" element={protectedPage(<ProjectsPage />)} />
          <Route path="/backlog" element={protectedPage(<BacklogPage />)} />
          <Route path="/traceability" element={protectedPage(<TraceabilityPage />)} />
          <Route path="/sprints" element={protectedPage(<SprintsPage />)} />
          <Route path="/audit-log" element={protectedPage(<AuditLogsPage />)} />
          <Route path="*" element={<Navigate to={user ? '/' : '/login'} replace />} />
        </Routes>
      </Suspense>
    </QAProvider>
  )
}

export default App
