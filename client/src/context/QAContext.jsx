import React, { createContext, useContext, useState, useEffect, useRef } from 'react'

const QAContext = createContext()

const initialTasks = [
  { id: 'QAR-101', title: 'Validate OAuth2 token refresh & session revocation', status: 'To Do', priority: 'High', owner: 'QA Tester', due: 'Oct 14, 2026', type: 'Task' },
  { id: 'QAR-102', title: 'Verify checkout currency conversion rounding errors', status: 'To Do', priority: 'Medium', owner: 'QA Tester', due: 'Oct 16, 2026', type: 'Task' },
  { id: 'QAR-103', title: 'Execute API load testing for payment gateway endpoints', status: 'In Progress', priority: 'High', owner: 'Developer', due: 'Oct 12, 2026', type: 'Task' },
  { id: 'QAR-104', title: 'Update automated smoke test suite for v2.4 release', status: 'In Progress', priority: 'Medium', owner: 'QA Lead', due: 'Oct 15, 2026', type: 'Task' },
  { id: 'QAR-105', title: 'Security audit on role-based permission endpoints', status: 'In Review', priority: 'Critical', owner: 'Security', due: 'Oct 13, 2026', type: 'Task' },
  { id: 'QAR-106', title: 'Setup automated regression trigger on GitHub Actions', status: 'Done', priority: 'Low', owner: 'DevOps', due: 'Oct 09, 2026', type: 'Task' },
  { id: 'QAR-107', title: 'Cross-browser compatibility validation (Safari & Firefox)', status: 'Done', priority: 'Medium', owner: 'QA Tester', due: 'Oct 10, 2026', type: 'Task' },
]

const initialRequirements = [
  { id: 'REQ-101', title: 'Multi-factor authentication (MFA) enforcement', owner: 'Security Lead', priority: 'High', status: 'Approved', description: 'All administrative and tester accounts must support TOTP MFA before accessing production QA telemetry.' },
  { id: 'REQ-102', title: 'Cart checkout error boundary and graceful rollback', owner: 'PM', priority: 'Critical', status: 'Approved', description: 'When payment gateway times out, shopping cart contents must remain intact without duplicate charges.' },
  { id: 'REQ-103', title: 'Real-time WebSocket notifications for test run results', owner: 'Developer', priority: 'Medium', status: 'In Review', description: 'CI runners broadcast execution outcomes to active dashboard users within 500ms.' },
  { id: 'REQ-104', title: 'Export compliance reports in CSV and PDF formats', owner: 'QA Lead', priority: 'Low', status: 'Draft', description: 'Audit trail of all test executions and defect resolutions must be exportable for quarterly compliance.' },
  { id: 'REQ-105', title: 'Role-based test case deletion restrictions', owner: 'QA Lead', priority: 'High', status: 'Approved', description: 'Only QA Leads and Project Admins are authorized to deprecate or permanently delete test cases.' },
]

const initialTestCases = [
  { id: 'TC-201', title: 'Verify successful login with valid credentials', type: 'Smoke', priority: 'High', status: 'Ready', owner: 'QA Tester', lastResult: 'Passed', steps: ['Navigate to /login', 'Enter valid email & password', 'Click Sign In', 'Verify redirection to dashboard'] },
  { id: 'TC-202', title: 'Verify lockout after 5 consecutive failed login attempts', type: 'Security', priority: 'Critical', status: 'Ready', owner: 'QA Lead', lastResult: 'Passed', steps: ['Attempt 5 invalid passwords', 'Check HTTP 429 response', 'Verify account lockout banner'] },
  { id: 'TC-203', title: 'Validate checkout transaction with expired credit card', type: 'Functional', priority: 'High', status: 'Ready', owner: 'QA Tester', lastResult: 'Failed', steps: ['Add item to cart', 'Input expired card details', 'Submit order', 'Verify specific error message'] },
  { id: 'TC-204', title: 'Measure response latency under 500 concurrent users', type: 'Performance', priority: 'Medium', status: 'Ready', owner: 'Developer', lastResult: 'Passed', steps: ['Spin up Locust swarm', 'Trigger GET /api/health and /api/projects', 'Monitor p95 latency under 200ms'] },
  { id: 'TC-205', title: 'Test password reset token expiry after 15 minutes', type: 'Regression', priority: 'Medium', status: 'Draft', owner: 'QA Tester', lastResult: 'Pending', steps: ['Request password reset', 'Wait 16 minutes', 'Attempt to submit new password', 'Confirm token expired'] },
]

const initialBugs = [
  { id: 'BUG-301', title: 'Session token not cleared upon browser tab close', severity: 'Critical', priority: 'Critical', status: 'In Progress', reporter: 'QA Tester', assignee: 'Developer', environment: 'Production' },
  { id: 'BUG-302', title: 'CSV export truncates special characters and accents', severity: 'Minor', priority: 'Low', status: 'Open', reporter: 'QA Lead', assignee: 'Developer', environment: 'Staging' },
  { id: 'BUG-303', title: 'Kanban card drag animation causes horizontal scroll jitter', severity: 'Major', priority: 'Medium', status: 'Resolved', reporter: 'PM', assignee: 'Frontend Dev', environment: 'Dev' },
  { id: 'BUG-304', title: 'Password field lacks minimum entropy validation', severity: 'Major', priority: 'High', status: 'Open', reporter: 'Security', assignee: 'Backend Dev', environment: 'Staging' },
]

const initialProjectSettings = {
  name: 'QAForge Core Platform',
  key: 'QAR',
  defaultEnv: 'Staging',
  autoCloseDefects: true,
  slackWebhook: '',
  notifyOnFailure: true,
}

const loadStoredValue = (key, fallback) => {
  try {
    const saved = localStorage.getItem(key)
    if (!saved) return fallback

    const parsed = JSON.parse(saved)
    return parsed ?? fallback
  } catch {
    localStorage.removeItem(key)
    return fallback
  }
}

const createUniqueId = (prefix, items, start) => {
  const usedIds = new Set(items.map((item) => item.id))
  let number = start

  while (usedIds.has(`${prefix}-${number}`)) {
    number += 1
  }

  return `${prefix}-${number}`
}

export const QAProvider = ({ children }) => {
  const [tasks, setTasks] = useState(() => loadStoredValue('qaforge-tasks', initialTasks))
  const [requirements, setRequirements] = useState(() => loadStoredValue('qaforge-requirements', initialRequirements))
  const [testCases, setTestCases] = useState(() => loadStoredValue('qaforge-testcases', initialTestCases))
  const [bugs, setBugs] = useState(() => loadStoredValue('qaforge-bugs', initialBugs))
  const [projectSettings, setProjectSettings] = useState(() =>
    loadStoredValue('qaforge-settings', initialProjectSettings),
  )

  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState(null)
  const toastTimer = useRef(null)

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('qaforge-tasks', JSON.stringify(tasks))
  }, [tasks])

  useEffect(() => {
    localStorage.setItem('qaforge-requirements', JSON.stringify(requirements))
  }, [requirements])

  useEffect(() => {
    localStorage.setItem('qaforge-testcases', JSON.stringify(testCases))
  }, [testCases])

  useEffect(() => {
    localStorage.setItem('qaforge-bugs', JSON.stringify(bugs))
  }, [bugs])

  useEffect(() => {
    localStorage.setItem('qaforge-settings', JSON.stringify(projectSettings))
  }, [projectSettings])

  useEffect(() => () => clearTimeout(toastTimer.current), [])

  const showToast = (message) => {
    clearTimeout(toastTimer.current)
    setToastMessage(message)
    toastTimer.current = setTimeout(() => setToastMessage(null), 3000)
  }

  const updateProjectSettings = (updates) => {
    setProjectSettings((previous) => ({ ...previous, ...updates }))
  }

  // Task actions
  const addTask = (task) => {
    const newTask = {
      ...task,
      id: createUniqueId('QAR', tasks, 100),
      status: task.status || 'To Do',
      priority: task.priority || 'Medium',
      due: task.due || 'Oct 20, 2026',
    }
    setTasks((prev) => [newTask, ...prev])
    showToast(`Created task ${newTask.id}`)
    return newTask
  }

  const updateTaskStatus = (taskId, newStatus) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    )
    showToast(`Updated ${taskId} to ${newStatus}`)
  }

  const deleteTask = (taskId) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId))
    showToast(`Deleted task ${taskId}`)
  }

  // Requirement actions
  const addRequirement = (req) => {
    const newReq = {
      ...req,
      id: createUniqueId('REQ', requirements, 100),
      status: req.status || 'Draft',
      priority: req.priority || 'Medium',
    }
    setRequirements((prev) => [newReq, ...prev])
    showToast(`Added requirement ${newReq.id}`)
    return newReq
  }

  const deleteRequirement = (id) => {
    setRequirements((prev) => prev.filter((r) => r.id !== id))
    showToast(`Removed requirement ${id}`)
  }

  const updateRequirementStatus = (id, newStatus) => {
    setRequirements((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
    )
    showToast(`Requirement status updated`)
  }

  // Test Case actions
  const addTestCase = (tc) => {
    const newTc = {
      ...tc,
      id: createUniqueId('TC', testCases, 200),
      status: tc.status || 'Ready',
      priority: tc.priority || 'Medium',
      type: tc.type || 'Functional',
      lastResult: 'Pending',
      steps: tc.steps || ['Verify acceptance criteria', 'Check system behavior'],
    }
    setTestCases((prev) => [newTc, ...prev])
    showToast(`Added test case ${newTc.id}`)
    return newTc
  }

  const executeTestCase = (id, result) => {
    setTestCases((prev) =>
      prev.map((tc) => (tc.id === id ? { ...tc, lastResult: result } : tc))
    )
    showToast(`Test ${id} marked as ${result}`)
  }

  const deleteTestCase = (id) => {
    setTestCases((prev) => prev.filter((tc) => tc.id !== id))
    showToast(`Deleted test case ${id}`)
  }

  // Bug actions
  const addBug = (bug) => {
    const newBug = {
      ...bug,
      id: createUniqueId('BUG', bugs, 300),
      status: 'Open',
      severity: bug.severity || 'Major',
      priority: bug.priority || 'High',
    }
    setBugs((prev) => [newBug, ...prev])
    showToast(`Logged defect ${newBug.id}`)
    return newBug
  }

  const updateBugStatus = (id, newStatus) => {
    setBugs((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: newStatus } : b))
    )
    showToast(`Bug ${id} updated to ${newStatus}`)
  }

  const deleteBug = (id) => {
    setBugs((prev) => prev.filter((b) => b.id !== id))
    showToast(`Deleted defect ${id}`)
  }

  return (
    <QAContext.Provider
      value={{
        tasks,
        requirements,
        testCases,
        bugs,
        projectSettings,
        searchQuery,
        setSearchQuery,
        isCreateModalOpen,
        setIsCreateModalOpen,
        toastMessage,
        showToast,
        updateProjectSettings,
        addTask,
        updateTaskStatus,
        deleteTask,
        addRequirement,
        deleteRequirement,
        updateRequirementStatus,
        addTestCase,
        executeTestCase,
        deleteTestCase,
        addBug,
        updateBugStatus,
        deleteBug,
      }}
    >
      {children}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-lg border border-jira-blue bg-jira-surface px-4 py-3 text-xs font-medium text-white shadow-lift animate-fade-in">
          <div className="h-2 w-2 rounded-full bg-jira-blue animate-pulse" />
          {toastMessage}
        </div>
      )}
    </QAContext.Provider>
  )
}

export const useQA = () => {
  const context = useContext(QAContext)
  if (!context) {
    throw new Error('useQA must be used within a QAProvider')
  }
  return context
}
