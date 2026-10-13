import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import { useAuth } from './context/AuthContext'
import { QAProvider } from './context/QAContext'

const LoginPage = lazy(() => import('./pages/LoginPage'))
const HomePage = lazy(() => import('./pages/HomePage'))
const RequirementsPage = lazy(() => import('./pages/RequirementsPage'))
const TestCasesPage = lazy(() => import('./pages/TestCasesPage'))
const BugsPage = lazy(() => import('./pages/BugsPage'))
const ReportsPage = lazy(() => import('./pages/ReportsPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const ProjectsPage = lazy(() => import('./pages/ProjectsPage'))
const IssueDetailPage = lazy(() => import('./pages/IssueDetailPage'))
const BacklogPage = lazy(() => import('./pages/BacklogPage'))
const TestRunsPage = lazy(() => import('./pages/TestRunsPage'))
const TraceabilityPage = lazy(() => import('./pages/TraceabilityPage'))
const SprintsPage = lazy(() => import('./pages/SprintsPage'))
const AuditLogsPage = lazy(() => import('./pages/AuditLogsPage'))

const PageLoading = () => (
  <div className="flex min-h-[40vh] items-center justify-center bg-jira-bg text-jira-text">
    <div className="flex flex-col items-center gap-3">
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-jira-blue border-t-transparent" />
      <p className="text-sm font-medium">Loading page...</p>
    </div>
  </div>
)

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-jira-bg text-jira-text">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-jira-blue border-t-transparent" />
          <p className="text-sm font-medium">Loading QAForge...</p>
        </div>
      </div>
    )
  }

  return (
    <QAProvider>
      <Suspense fallback={<PageLoading />}>
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
        <Route
          path="/requirements"
          element={
            <ProtectedRoute>
              <RequirementsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/test-cases"
          element={
            <ProtectedRoute>
              <TestCasesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bugs"
          element={
            <ProtectedRoute>
              <BugsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <ReportsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects"
          element={
            <ProtectedRoute>
              <ProjectsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/backlog"
          element={
            <ProtectedRoute>
              <BacklogPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/test-runs"
          element={
            <ProtectedRoute>
              <TestRunsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/traceability"
          element={
            <ProtectedRoute>
              <TraceabilityPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sprints"
          element={
            <ProtectedRoute>
              <SprintsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/audit-log"
          element={
            <ProtectedRoute>
              <AuditLogsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/issues/:issueId"
          element={
            <ProtectedRoute>
              <IssueDetailPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to={user ? '/' : '/login'} replace />} />
        </Routes>
      </Suspense>
    </QAProvider>
  )
}

export default App
