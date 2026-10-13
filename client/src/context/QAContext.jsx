import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import api from '../services/api'
import { useAuth } from './AuthContext'

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
  { id: 'TC-201', title: 'Verify successful login with valid credentials', type: 'Smoke', priority: 'High', status: 'Ready', owner: 'QA Tester', requirementIds: ['REQ-101'], lastResult: 'Passed', steps: ['Navigate to /login', 'Enter valid email & password', 'Click Sign In', 'Verify redirection to dashboard'] },
  { id: 'TC-202', title: 'Verify lockout after 5 consecutive failed login attempts', type: 'Security', priority: 'Critical', status: 'Ready', owner: 'QA Lead', requirementIds: ['REQ-101'], lastResult: 'Passed', steps: ['Attempt 5 invalid passwords', 'Check HTTP 429 response', 'Verify account lockout banner'] },
  { id: 'TC-203', title: 'Validate checkout transaction with expired credit card', type: 'Functional', priority: 'High', status: 'Ready', owner: 'QA Tester', requirementIds: ['REQ-102'], lastResult: 'Failed', steps: ['Add item to cart', 'Input expired card details', 'Submit order', 'Verify specific error message'] },
  { id: 'TC-204', title: 'Measure response latency under 500 concurrent users', type: 'Performance', priority: 'Medium', status: 'Ready', owner: 'Developer', requirementIds: ['REQ-103'], lastResult: 'Passed', steps: ['Spin up Locust swarm', 'Trigger GET /api/health and /api/projects', 'Monitor p95 latency under 200ms'] },
  { id: 'TC-205', title: 'Test password reset token expiry after 15 minutes', type: 'Regression', priority: 'Medium', status: 'Draft', owner: 'QA Tester', requirementIds: ['REQ-105'], lastResult: 'Pending', steps: ['Request password reset', 'Wait 16 minutes', 'Attempt to submit new password', 'Confirm token expired'] },
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

const initialProjects = [
  { id: 'proj-pp-001', key: 'QAR', name: 'QAForge Core Platform', lead: 'Maria Santos', category: 'Software', status: 'Active', description: 'Quality engineering workspace for the QAForge product.' },
  { id: 'proj-mobile-002', key: 'MOB', name: 'Mobile Banking App', lead: 'Lorenz Taganas', category: 'Software', status: 'Active', description: 'Mobile release quality and regression tracking.' },
]

const initialEpics = [
  { id: 'EPIC-1', title: 'Authentication hardening', status: 'In Progress', owner: 'Security Lead', projectKey: 'QAR', color: '#7C6CF2' },
  { id: 'EPIC-2', title: 'Release analytics', status: 'To Do', owner: 'QA Lead', projectKey: 'QAR', color: '#4B8DFF' },
]

const initialSprints = [
  { id: 'SPRINT-24-4', name: 'Sprint 24.4', goal: 'Stabilize authentication and payment flows', status: 'Active', start: 'Oct 1, 2026', end: 'Oct 28, 2026', projectKey: 'QAR' },
  { id: 'SPRINT-24-5', name: 'Sprint 24.5', goal: 'Improve release reporting and traceability', status: 'Planned', start: 'Oct 29, 2026', end: 'Nov 12, 2026', projectKey: 'QAR' },
]

const initialComments = [
  { id: 'comment-1', issueId: 'QAR-101', author: 'Maria Santos', body: 'Please include token revocation coverage in the regression run.', createdAt: 'Today, 9:42 AM' },
  { id: 'comment-2', issueId: 'BUG-301', author: 'John Cruz', body: 'Investigating browser lifecycle behavior and refresh token persistence.', createdAt: 'Yesterday, 4:18 PM' },
]

const initialActivity = [
  { id: 'activity-1', issueId: 'QAR-101', action: 'moved to In Progress', actor: 'Maria Santos', createdAt: 'Today, 9:35 AM' },
  { id: 'activity-2', issueId: 'BUG-301', action: 'created this issue', actor: 'Lorenz Taganas', createdAt: 'Yesterday, 3:54 PM' },
]

const initialTestRuns = [
  { id: 'RUN-1042', name: 'Release candidate smoke suite', status: 'Completed', startedAt: 'Today, 10:14 AM', passed: 4, failed: 1, total: 5, environment: 'Staging' },
  { id: 'RUN-1041', name: 'Authentication regression', status: 'Completed', startedAt: 'Yesterday, 4:22 PM', passed: 5, failed: 0, total: 5, environment: 'QA' },
]

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
  const { isAuthenticated } = useAuth()
  const hasLoadedServerSnapshot = useRef(false)
  const persistTimer = useRef(null)
  const [tasks, setTasks] = useState(() => loadStoredValue('qaforge-tasks', initialTasks))
  const [requirements, setRequirements] = useState(() => loadStoredValue('qaforge-requirements', initialRequirements))
  const [testCases, setTestCases] = useState(() => loadStoredValue('qaforge-testcases', initialTestCases))
  const [bugs, setBugs] = useState(() => loadStoredValue('qaforge-bugs', initialBugs))
  const [projectSettings, setProjectSettings] = useState(() =>
    loadStoredValue('qaforge-settings', initialProjectSettings),
  )
  const [projects, setProjects] = useState(() => loadStoredValue('qaforge-projects', initialProjects))
  const [selectedProjectKey, setSelectedProjectKey] = useState(() => loadStoredValue('qaforge-selected-project', initialProjectSettings.key))
  const [epics, setEpics] = useState(() => loadStoredValue('qaforge-epics', initialEpics))
  const [sprints, setSprints] = useState(() => loadStoredValue('qaforge-sprints', initialSprints))
  const [comments, setComments] = useState(() => loadStoredValue('qaforge-comments', initialComments))
  const [activity, setActivity] = useState(() => loadStoredValue('qaforge-activity', initialActivity))
  const [testRuns, setTestRuns] = useState(() => loadStoredValue('qaforge-test-runs', initialTestRuns))
  const [notifications, setNotifications] = useState(() => loadStoredValue('qaforge-notifications', []))
  const [watchers, setWatchers] = useState(() => loadStoredValue('qaforge-watchers', []))

  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState(null)
  const toastTimer = useRef(null)

  useEffect(() => {
    if (!isAuthenticated) {
      hasLoadedServerSnapshot.current = false
      return undefined
    }

    let cancelled = false
    api.get('/qa/snapshot')
      .then((response) => {
        const snapshot = response.data.snapshot
        if (cancelled) return

        if (!snapshot) {
          return api.put('/qa/snapshot', {
            tasks,
            requirements,
            testCases,
            bugs,
            projectSettings,
            projects,
            epics,
            sprints,
            comments,
            activity,
            testRuns,
            notifications,
            watchers,
          })
        }

        if (snapshot.tasks) setTasks(snapshot.tasks)
        if (snapshot.requirements) setRequirements(snapshot.requirements)
        if (snapshot.testCases) setTestCases(snapshot.testCases)
        if (snapshot.bugs) setBugs(snapshot.bugs)
        if (snapshot.projectSettings) setProjectSettings(snapshot.projectSettings)
        if (snapshot.projects) setProjects(snapshot.projects)
        if (snapshot.selectedProjectKey) setSelectedProjectKey(snapshot.selectedProjectKey)
        if (snapshot.epics) setEpics(snapshot.epics)
        if (snapshot.sprints) setSprints(snapshot.sprints)
        if (snapshot.comments) setComments(snapshot.comments)
        if (snapshot.activity) setActivity(snapshot.activity)
        if (snapshot.testRuns) setTestRuns(snapshot.testRuns)
        if (snapshot.notifications) setNotifications(snapshot.notifications)
        if (snapshot.watchers) setWatchers(snapshot.watchers)

        return Promise.all([
          api.get('/projects'),
          api.get('/requirements'),
          api.get('/test-cases'),
          api.get('/bugs'),
          api.get('/test-runs'),
          api.get('/comments'),
          api.get('/activity'),
          api.get('/tasks'),
          api.get('/sprints'),
          api.get('/epics'),
          api.get('/notifications'),
        ]).then(([projectResponse, requirementResponse, testCaseResponse, bugResponse, testRunResponse, commentsResponse, activityResponse, taskResponse, sprintResponse, epicResponse, notificationResponse]) => {
          if (cancelled) return
          if (projectResponse.data?.projects) setProjects(projectResponse.data.projects)
          if (requirementResponse.data?.requirements) setRequirements(requirementResponse.data.requirements)
          if (testCaseResponse.data?.testCases) setTestCases(testCaseResponse.data.testCases)
          if (bugResponse.data?.bugs) setBugs(bugResponse.data.bugs)
          if (testRunResponse.data?.testRuns) setTestRuns(testRunResponse.data.testRuns)
          if (commentsResponse.data?.comments) setComments(commentsResponse.data.comments)
          if (activityResponse.data?.activity) setActivity(activityResponse.data.activity)
          if (taskResponse.data?.tasks) setTasks(taskResponse.data.tasks)
          if (sprintResponse.data?.sprints) setSprints(sprintResponse.data.sprints)
          if (epicResponse.data?.epics) setEpics(epicResponse.data.epics)
          if (notificationResponse.data?.notifications) setNotifications(notificationResponse.data.notifications)
        })
      })
      .catch(() => {
        // The local cache remains available when the optional sync endpoint is unavailable.
      })
      .finally(() => {
        if (!cancelled) hasLoadedServerSnapshot.current = true
      })

    return () => {
      cancelled = true
    }
  }, [isAuthenticated])

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
  useEffect(() => localStorage.setItem('qaforge-projects', JSON.stringify(projects)), [projects])
  useEffect(() => localStorage.setItem('qaforge-selected-project', JSON.stringify(selectedProjectKey)), [selectedProjectKey])
  useEffect(() => localStorage.setItem('qaforge-epics', JSON.stringify(epics)), [epics])
  useEffect(() => localStorage.setItem('qaforge-sprints', JSON.stringify(sprints)), [sprints])
  useEffect(() => localStorage.setItem('qaforge-comments', JSON.stringify(comments)), [comments])
  useEffect(() => localStorage.setItem('qaforge-activity', JSON.stringify(activity)), [activity])
  useEffect(() => localStorage.setItem('qaforge-notifications', JSON.stringify(notifications)), [notifications])
  useEffect(() => localStorage.setItem('qaforge-watchers', JSON.stringify(watchers)), [watchers])

  const markNotificationRead = async (notificationId) => {
    setNotifications((previous) => previous.map((notification) => (
      notification.id === notificationId ? { ...notification, read: true } : notification
    )))
    try {
      await api.patch(`/notifications/${notificationId}/read`)
    } catch (error) {
      if (error.response) showToast(error.response.data?.message || 'Could not update notification')
    }
  }

  const markAllNotificationsRead = async () => {
    setNotifications((previous) => previous.map((notification) => ({ ...notification, read: true })))
    try {
      await api.patch('/notifications/read-all')
    } catch (error) {
      if (error.response) showToast(error.response.data?.message || 'Could not update notifications')
    }
  }

  const toggleWatcher = async (issueId) => {
    const isWatching = watchers.includes(issueId)
    setWatchers((previous) => isWatching ? previous.filter((id) => id !== issueId) : [...previous, issueId])
    try {
      await (isWatching ? api.delete(`/watchers/${issueId}`) : api.post(`/watchers/${issueId}`))
      showToast(isWatching ? `Stopped watching ${issueId}` : `Watching ${issueId}`)
    } catch (error) {
      setWatchers((previous) => isWatching ? [...previous, issueId] : previous.filter((id) => id !== issueId))
      showToast(error.response?.data?.message || 'Watcher saved locally; server is unavailable')
    }
  }
  useEffect(() => localStorage.setItem('qaforge-test-runs', JSON.stringify(testRuns)), [testRuns])

  useEffect(() => () => clearTimeout(toastTimer.current), [])

  useEffect(() => {
    if (!isAuthenticated || !hasLoadedServerSnapshot.current) return undefined

    clearTimeout(persistTimer.current)
    persistTimer.current = setTimeout(() => {
      api.put('/qa/snapshot', {
        tasks,
        requirements,
        testCases,
        bugs,
        projectSettings,
        projects,
        selectedProjectKey,
        epics,
        sprints,
        comments,
        activity,
        testRuns,
        notifications,
        watchers,
      }).catch(() => {
        // Keep the local cache usable if the server is temporarily unavailable.
      })
    }, 400)

    return () => clearTimeout(persistTimer.current)
  }, [
    isAuthenticated,
    tasks,
    requirements,
    testCases,
    bugs,
    projectSettings,
    projects,
    selectedProjectKey,
    epics,
    sprints,
    comments,
    activity,
    testRuns,
    notifications,
    watchers,
  ])

  const showToast = (message) => {
    clearTimeout(toastTimer.current)
    setToastMessage(message)
    toastTimer.current = setTimeout(() => setToastMessage(null), 3000)
  }

  const updateProjectSettings = (updates) => {
    setProjectSettings((previous) => ({ ...previous, ...updates }))
  }

  // Task actions
  const addTask = async (task) => {
    let newTask = {
      ...task,
      id: createUniqueId('QAR', tasks, 100),
      status: task.status || 'To Do',
      priority: task.priority || 'Medium',
      due: task.due || 'Oct 20, 2026',
    }
    try {
      const response = await api.post('/tasks', task)
      if (response.data?.task) newTask = response.data.task
    } catch (error) {
      if (error.response) {
        showToast(error.response.data?.message || 'Could not create task')
        return null
      }
      showToast('Task saved locally; server is unavailable')
    }
    setTasks((prev) => [newTask, ...prev])
    showToast(`Created task ${newTask.id}`)
    return newTask
  }

  const updateTaskStatus = async (taskId, newStatus) => {
    const previousTask = tasks.find((task) => task.id === taskId)
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    )
    setActivity((previous) => [{ id: `activity-${Date.now()}`, issueId: taskId, action: `moved to ${newStatus}`, actor: 'You', createdAt: new Date().toISOString() }, ...previous])
    try {
      await api.patch(`/tasks/${taskId}`, { status: newStatus })
      await api.post('/activity', { issueId: taskId, action: `moved to ${newStatus}` })
      showToast(`Updated ${taskId} to ${newStatus}`)
    } catch (error) {
      if (error.response) {
        if (previousTask) setTasks((prev) => prev.map((task) => task.id === taskId ? previousTask : task))
        showToast(error.response.data?.message || 'Could not update task')
      } else {
        showToast('Task updated locally; server is unavailable')
      }
    }
  }

  const deleteTask = async (taskId) => {
    try {
      await api.delete(`/tasks/${taskId}`)
      setTasks((prev) => prev.filter((t) => t.id !== taskId))
      showToast(`Deleted task ${taskId}`)
    } catch (error) {
      if (error.response) showToast(error.response.data?.message || 'Could not delete task')
      else {
        setTasks((prev) => prev.filter((t) => t.id !== taskId))
        showToast('Task removed locally; server is unavailable')
      }
    }
  }

  // Requirement actions
  const addRequirement = async (req) => {
    let newReq = {
      ...req,
      id: createUniqueId('REQ', requirements, 100),
      status: req.status || 'Draft',
      priority: req.priority || 'Medium',
    }
    try {
      const response = await api.post('/requirements', req)
      if (response.data?.requirement) newReq = response.data.requirement
    } catch (error) {
      if (error.response) {
        showToast(error.response.data?.message || 'Could not save requirement')
        return null
      } else {
        showToast('Requirement saved locally; server is unavailable')
      }
    }
    setRequirements((prev) => [newReq, ...prev])
    showToast(`Added requirement ${newReq.id}`)
    return newReq
  }

  const deleteRequirement = async (id) => {
    try {
      await api.delete(`/requirements/${id}`)
      setRequirements((prev) => prev.filter((r) => r.id !== id))
      showToast(`Removed requirement ${id}`)
    } catch (error) {
      if (error.response) {
        showToast(error.response.data?.message || 'Could not remove requirement')
      } else {
        setRequirements((prev) => prev.filter((r) => r.id !== id))
        showToast('Requirement removed locally; server is unavailable')
      }
    }
  }

  const updateRequirementStatus = async (id, newStatus) => {
    const previousRequirement = requirements.find((requirement) => requirement.id === id)
    setRequirements((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
    )
    try {
      await api.patch(`/requirements/${id}`, { status: newStatus })
      showToast('Requirement status updated')
    } catch (error) {
      if (error.response) {
        if (previousRequirement) setRequirements((prev) => prev.map((requirement) => requirement.id === id ? previousRequirement : requirement))
        showToast(error.response.data?.message || 'Could not update requirement')
      } else {
        showToast('Requirement updated locally; server is unavailable')
      }
    }
  }

  // Test Case actions
  const addTestCase = async (tc) => {
    let newTc = {
      ...tc,
      id: createUniqueId('TC', testCases, 200),
      status: tc.status || 'Ready',
      priority: tc.priority || 'Medium',
      type: tc.type || 'Functional',
      lastResult: 'Pending',
      steps: tc.steps || ['Verify acceptance criteria', 'Check system behavior'],
    }
    try {
      const response = await api.post('/test-cases', tc)
      if (response.data?.testCase) newTc = response.data.testCase
    } catch (error) {
      if (error.response) {
        showToast(error.response.data?.message || 'Could not create test case')
        return null
      }
      showToast('Test case saved locally; server is unavailable')
    }
    setTestCases((prev) => [newTc, ...prev])
    showToast(`Added test case ${newTc.id}`)
    return newTc
  }

  const executeTestCase = async (id, result) => {
    const previousTestCase = testCases.find((testCase) => testCase.id === id)
    setTestCases((prev) =>
      prev.map((tc) => (tc.id === id ? { ...tc, lastResult: result } : tc))
    )
    try {
      await api.patch(`/test-cases/${id}`, { lastResult: result })
      showToast(`Test ${id} marked as ${result}`)
    } catch (error) {
      if (error.response) {
        if (previousTestCase) setTestCases((prev) => prev.map((testCase) => testCase.id === id ? previousTestCase : testCase))
        showToast(error.response.data?.message || 'Could not update test result')
      } else {
        showToast('Test result updated locally; server is unavailable')
      }
    }
  }

  const createTestRun = async (name = 'Ad hoc regression run', projectKey = selectedProjectKey) => {
    const scopedTestCases = testCases.filter((test) => !test.projectKey ? projectKey === 'QAR' : test.projectKey === projectKey)
    const passed = scopedTestCases.filter((test) => test.lastResult === 'Passed').length
    const failed = scopedTestCases.filter((test) => test.lastResult === 'Failed').length
    const run = {
      id: `RUN-${Date.now().toString().slice(-5)}`,
      name,
      status: 'Completed',
      startedAt: new Date().toISOString(),
      passed,
      failed,
      total: scopedTestCases.length,
      projectKey,
      environment: projectSettings.defaultEnv,
    }
    let persistedRun = run
    try {
      const response = await api.post('/test-runs', run)
      if (response.data?.testRun) persistedRun = response.data.testRun
    } catch (error) {
      if (error.response) {
        showToast(error.response.data?.message || 'Could not create test run')
        return null
      }
      showToast('Test run saved locally; server is unavailable')
    }
    setTestRuns((previous) => [persistedRun, ...previous])
    showToast(`Created test run ${persistedRun.id}`)
    return persistedRun
  }

  const deleteTestCase = async (id) => {
    try {
      await api.delete(`/test-cases/${id}`)
      setTestCases((prev) => prev.filter((tc) => tc.id !== id))
      showToast(`Deleted test case ${id}`)
    } catch (error) {
      if (error.response) {
        showToast(error.response.data?.message || 'Could not delete test case')
      } else {
        setTestCases((prev) => prev.filter((tc) => tc.id !== id))
        showToast('Test case removed locally; server is unavailable')
      }
    }
  }

  // Bug actions
  const addBug = async (bug) => {
    let newBug = {
      ...bug,
      id: createUniqueId('BUG', bugs, 300),
      status: 'Open',
      severity: bug.severity || 'Major',
      priority: bug.priority || 'High',
    }
    try {
      const response = await api.post('/bugs', bug)
      if (response.data?.bug) newBug = response.data.bug
    } catch (error) {
      if (error.response) {
        showToast(error.response.data?.message || 'Could not create bug')
        return null
      }
      showToast('Bug saved locally; server is unavailable')
    }

    setBugs((prev) => [newBug, ...prev])
    showToast(`Logged defect ${newBug.id}`)
    return newBug
  }

  const updateBugStatus = async (id, newStatus) => {
    const previousBug = bugs.find((bug) => bug.id === id)
    setBugs((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: newStatus } : b))
    )
    setActivity((previous) => [
      {
        id: `activity-${Date.now()}`,
        issueId: id,
        action: newStatus === 'Reopened' ? 'reopened the bug' : `changed bug status to ${newStatus}`,
        actor: 'You',
        createdAt: new Date().toISOString(),
      },
      ...previous,
    ])
    try {
      await api.patch(`/bugs/${id}`, { status: newStatus })
      showToast(`Bug ${id} updated to ${newStatus}`)
    } catch (error) {
      if (error.response) {
        if (previousBug) setBugs((prev) => prev.map((bug) => bug.id === id ? previousBug : bug))
        showToast(error.response.data?.message || 'Could not update bug')
      } else {
        showToast('Bug updated locally; server is unavailable')
      }
    }
  }

  const deleteBug = async (id) => {
    try {
      await api.delete(`/bugs/${id}`)
      setBugs((prev) => prev.filter((b) => b.id !== id))
      showToast(`Deleted defect ${id}`)
    } catch (error) {
      if (error.response) {
        showToast(error.response.data?.message || 'Could not delete defect')
      } else {
        setBugs((prev) => prev.filter((b) => b.id !== id))
        showToast('Bug removed locally; server is unavailable')
      }
    }
  }

  const updateIssue = async (issueId, updates) => {
    const collection = tasks.some((item) => item.id === issueId)
      ? 'tasks'
      : requirements.some((item) => item.id === issueId)
        ? 'requirements'
        : testCases.some((item) => item.id === issueId)
          ? 'testCases'
          : bugs.some((item) => item.id === issueId) ? 'bugs' : null
    const endpoint = {
      tasks: 'tasks',
      requirements: 'requirements',
      testCases: 'test-cases',
      bugs: 'bugs',
    }[collection]
    if (!endpoint) {
      showToast(`Could not find ${issueId}`)
      return
    }

    const update = (items) =>
      items.map((item) => (item.id === issueId ? { ...item, ...updates } : item))

    setTasks((previous) => update(previous))
    setRequirements((previous) => update(previous))
    setTestCases((previous) => update(previous))
    setBugs((previous) => update(previous))
    const changedFields = Object.keys(updates).join(', ')
    setActivity((previous) => [
      {
        id: `activity-${Date.now()}`,
        issueId,
        action: `updated ${changedFields}`,
        actor: 'You',
        createdAt: new Date().toISOString(),
      },
      ...previous,
    ])
    const serverUpdates = { ...updates }
    if (serverUpdates.assignee !== undefined && collection !== 'bugs') {
      serverUpdates.owner = serverUpdates.assignee
      delete serverUpdates.assignee
    }

    try {
      const response = await api.patch(`/${endpoint}/${issueId}`, serverUpdates)
      const persistedItem = response.data?.task
        || response.data?.requirement
        || response.data?.testCase
        || response.data?.bug
      if (persistedItem) {
        const replacePersisted = (items) => items.map((item) => item.id === issueId ? { ...item, ...persistedItem } : item)
        setTasks((previous) => replacePersisted(previous))
        setRequirements((previous) => replacePersisted(previous))
        setTestCases((previous) => replacePersisted(previous))
        setBugs((previous) => replacePersisted(previous))
      }
      await api.post('/activity', { issueId, action: `updated ${Object.keys(updates).join(', ')}` })
      showToast(`Updated ${issueId}`)
    } catch (error) {
      showToast(error.response?.data?.message || `${issueId} updated locally; server is unavailable`)
    }
  }

  const addComment = async (issueId, body, author = 'You', attachment = null) => {
    if (!body.trim()) return

    const localComment = { id: `comment-${Date.now()}`, issueId, author, body: body.trim(), createdAt: new Date().toISOString() }
    const localActivity = { id: `activity-${Date.now() + 1}`, issueId, action: 'added a comment', actor: author, createdAt: new Date().toISOString() }
    let commentToAdd = localComment
    let activityToAdd = localActivity
    try {
      const response = await api.post('/comments', { issueId, body: body.trim(), attachment })
      if (response.data?.comment) commentToAdd = response.data.comment
      if (response.data?.activity) activityToAdd = response.data.activity
    } catch (error) {
      if (error.response) {
        showToast(error.response.data?.message || 'Could not add comment')
        return
      }
      showToast('Comment saved locally; server is unavailable')
    }
    setComments((previous) => [commentToAdd, ...previous])
    setActivity((previous) => [activityToAdd, ...previous])
    showToast('Comment added')
  }

  const addProject = async (project) => {
    let created = { ...project, id: `proj-${Date.now()}`, status: 'Active' }
    try {
      const response = await api.post('/projects', project)
      if (response.data?.project) created = response.data.project
    } catch (error) {
      if (error.response) {
        showToast(error.response.data?.message || 'Could not create project')
        return null
      }
      showToast('Project created locally; server is unavailable')
    }
    setProjects((previous) => [created, ...previous])
    showToast(`Created project ${created.key}`)
    return created
  }

  const addEpic = async (epic) => {
    let created = { ...epic, id: `EPIC-${Date.now()}`, status: 'To Do', color: epic.color || '#4B8DFF' }
    try {
      const response = await api.post('/epics', epic)
      if (response.data?.epic) created = response.data.epic
    } catch (error) {
      if (error.response) {
        showToast(error.response.data?.message || 'Could not create epic')
        return null
      }
      showToast('Epic created locally; server is unavailable')
    }
    setEpics((previous) => [created, ...previous])
    showToast(`Created epic ${created.title}`)
    return created
  }

  const updateEpic = async (epicId, updates) => {
    setEpics((previous) => previous.map((epic) => epic.id === epicId ? { ...epic, ...updates } : epic))
    try {
      const response = await api.patch(`/epics/${epicId}`, updates)
      if (response.data?.epic) setEpics((previous) => previous.map((epic) => epic.id === epicId ? response.data.epic : epic))
      showToast('Epic updated')
    } catch (error) {
      showToast(error.response?.data?.message || 'Epic updated locally; server is unavailable')
    }
  }

  const addSprint = async (sprint) => {
    let created = { ...sprint, id: `SPRINT-${Date.now()}`, status: 'Planned' }
    try {
      const response = await api.post('/sprints', sprint)
      if (response.data?.sprint) created = response.data.sprint
    } catch (error) {
      if (error.response) {
        showToast(error.response.data?.message || 'Could not create sprint')
        return null
      }
      showToast('Sprint created locally; server is unavailable')
    }
    setSprints((previous) => [created, ...previous])
    showToast(`Created sprint ${created.name}`)
    return created
  }

  const updateSprint = async (sprintId, updates) => {
    setSprints((previous) =>
      previous.map((sprint) => {
        if (sprint.id === sprintId) return { ...sprint, ...updates }
        if (updates.status === 'Active' && sprint.status === 'Active') return { ...sprint, status: 'Planned' }
        return sprint
      }),
    )
    try {
      const response = await api.patch(`/sprints/${sprintId}`, updates)
      if (response.data?.sprint) {
        setSprints((previous) => previous.map((sprint) => sprint.id === sprintId ? response.data.sprint : sprint))
      }
      showToast('Sprint updated')
    } catch (error) {
      showToast(error.response?.data?.message || 'Sprint updated locally; server is unavailable')
    }
  }

  return (
    <QAContext.Provider
      value={{
        tasks,
        requirements,
        testCases,
        bugs,
        projects,
        selectedProjectKey,
        epics,
        sprints,
        comments,
        activity,
        testRuns,
        notifications,
        watchers,
        toggleWatcher,
        markNotificationRead,
        markAllNotificationsRead,
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
        createTestRun,
        deleteTestCase,
        addBug,
        updateBugStatus,
        deleteBug,
        updateIssue,
        addComment,
        addProject,
        addEpic,
        updateEpic,
        addSprint,
        updateSprint,
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
