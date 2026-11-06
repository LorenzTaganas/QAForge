import React, { useState, useEffect, useRef } from 'react'
import api from '../services/api'
import { useAuth } from './AuthContext'
import QAContext from './QAContextBase'

const initialTasks = [
  { id: 'QAR-101', title: 'Validate OAuth2 token refresh & session revocation', status: 'To Do', priority: 'High', owner: 'QA Tester', due: 'Oct 14, 2026', type: 'Task', projectKey: 'QAR', labels: ['auth', 'security'] },
  { id: 'QAR-102', title: 'Verify checkout currency conversion rounding errors', status: 'To Do', priority: 'Medium', owner: 'QA Tester', due: 'Oct 16, 2026', type: 'Task', projectKey: 'QAR' },
  { id: 'QAR-103', title: 'Execute API load testing for payment gateway endpoints', status: 'In Progress', priority: 'High', owner: 'Developer', due: 'Oct 12, 2026', type: 'Task', projectKey: 'QAR' },
  { id: 'QAR-104', title: 'Update automated smoke test suite for v2.4 release', status: 'In Progress', priority: 'Medium', owner: 'QA Lead', due: 'Oct 15, 2026', type: 'Task', projectKey: 'QAR' },
  { id: 'QAR-105', title: 'Security audit on role-based permission endpoints', status: 'In Review', priority: 'Critical', owner: 'Security', due: 'Oct 13, 2026', type: 'Task', projectKey: 'QAR' },
  { id: 'QAR-106', title: 'Setup automated regression trigger on GitHub Actions', status: 'Done', priority: 'Low', owner: 'DevOps', due: 'Oct 09, 2026', type: 'Task', projectKey: 'QAR' },
  { id: 'QAR-107', title: 'Cross-browser compatibility validation (Safari & Firefox)', status: 'Done', priority: 'Medium', owner: 'QA Tester', due: 'Oct 10, 2026', type: 'Task', projectKey: 'QAR' },
]

const initialRequirements = [
  { id: 'REQ-101', title: 'Multi-factor authentication (MFA) enforcement', owner: 'Security Lead', priority: 'High', status: 'Approved', projectKey: 'QAR', description: 'All administrative and tester accounts must support TOTP MFA before accessing production QA telemetry.' },
  { id: 'REQ-102', title: 'Cart checkout error boundary and graceful rollback', owner: 'PM', priority: 'Critical', status: 'Approved', projectKey: 'QAR', description: 'When payment gateway times out, shopping cart contents must remain intact without duplicate charges.' },
  { id: 'REQ-103', title: 'Real-time WebSocket notifications for test run results', owner: 'Developer', priority: 'Medium', status: 'In Review', projectKey: 'QAR', description: 'CI runners broadcast execution outcomes to active dashboard users within 500ms.' },
  { id: 'REQ-104', title: 'Export compliance reports in CSV and PDF formats', owner: 'QA Lead', priority: 'Low', status: 'Draft', projectKey: 'QAR', description: 'Audit trail of all test executions and defect resolutions must be exportable for quarterly compliance.' },
  { id: 'REQ-105', title: 'Role-based test case deletion restrictions', owner: 'QA Lead', priority: 'High', status: 'Approved', projectKey: 'QAR', description: 'Only QA Leads and Project Admins are authorized to deprecate or permanently delete test cases.' },
]

const initialTestCases = [
  { id: 'TC-201', title: 'Verify successful login with valid credentials', type: 'Smoke', priority: 'High', status: 'Ready', owner: 'QA Tester', projectKey: 'QAR', requirementIds: ['REQ-101'], lastResult: 'Passed', steps: ['Navigate to /login', 'Enter valid email & password', 'Click Sign In', 'Verify redirection to dashboard'] },
  { id: 'TC-202', title: 'Verify lockout after 5 consecutive failed login attempts', type: 'Security', priority: 'Critical', status: 'Ready', owner: 'QA Lead', projectKey: 'QAR', requirementIds: ['REQ-101'], lastResult: 'Passed', steps: ['Attempt 5 invalid passwords', 'Check HTTP 429 response', 'Verify account lockout banner'] },
  { id: 'TC-203', title: 'Validate checkout transaction with expired credit card', type: 'Functional', priority: 'High', status: 'Ready', owner: 'QA Tester', projectKey: 'QAR', requirementIds: ['REQ-102'], lastResult: 'Failed', steps: ['Add item to cart', 'Input expired card details', 'Submit order', 'Verify specific error message'] },
  { id: 'TC-204', title: 'Measure response latency under 500 concurrent users', type: 'Performance', priority: 'Medium', status: 'Ready', owner: 'Developer', projectKey: 'QAR', requirementIds: ['REQ-103'], lastResult: 'Passed', steps: ['Spin up Locust swarm', 'Trigger GET /api/health and /api/projects', 'Monitor p95 latency under 200ms'] },
  { id: 'TC-205', title: 'Test password reset token expiry after 15 minutes', type: 'Regression', priority: 'Medium', status: 'Draft', owner: 'QA Tester', projectKey: 'QAR', requirementIds: ['REQ-105'], lastResult: 'Not Run', steps: ['Request password reset', 'Wait 16 minutes', 'Attempt to submit new password', 'Confirm token expired'] },
]

const initialBugs = [
  { id: 'BUG-301', title: 'Session token not cleared upon browser tab close', severity: 'Critical', priority: 'Critical', status: 'In Progress', reporter: 'QA Tester', assignee: 'John Cruz', environment: 'Production', projectKey: 'QAR', labels: ['auth'] },
  { id: 'BUG-302', title: 'CSV export truncates special characters and accents', severity: 'Minor', priority: 'Low', status: 'Open', reporter: 'QA Lead', assignee: 'Developer', environment: 'Staging', projectKey: 'QAR' },
  { id: 'BUG-303', title: 'Kanban card drag animation causes horizontal scroll jitter', severity: 'Major', priority: 'Medium', status: 'Resolved', reporter: 'PM', assignee: 'Frontend Dev', environment: 'Dev', projectKey: 'QAR' },
  { id: 'BUG-304', title: 'Password field lacks minimum entropy validation', severity: 'Major', priority: 'High', status: 'Open', reporter: 'Security', assignee: 'Backend Dev', environment: 'Staging', projectKey: 'QAR' },
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
  { id: 'EPIC-2', title: 'Release analytics', status: 'To Do', owner: 'QA Lead', projectKey: 'QAR', color: '#59A8F5' },
]

const initialSprints = [
  { id: 'SPRINT-24-4', name: 'Sprint 24.4', goal: 'Stabilize authentication and payment flows', status: 'Active', start: 'Oct 1, 2026', end: 'Oct 28, 2026', projectKey: 'QAR' },
  { id: 'SPRINT-24-5', name: 'Sprint 24.5', goal: 'Improve release reporting and traceability', status: 'Planned', start: 'Oct 29, 2026', end: 'Nov 12, 2026', projectKey: 'QAR' },
]

const initialComments = [
  { id: 'comment-1', issueId: 'QAR-101', author: 'Maria Santos', body: 'Please include token revocation coverage in the regression run.', createdAt: '2026-10-03T09:42:00.000Z' },
  { id: 'comment-2', issueId: 'BUG-301', author: 'John Cruz', body: 'Investigating browser lifecycle behavior and refresh token persistence.', createdAt: '2026-10-02T16:18:00.000Z' },
]

const initialActivity = [
  { id: 'activity-1', issueId: 'QAR-101', action: 'moved to In Progress', actor: 'Maria Santos', createdAt: '2026-10-03T09:35:00.000Z' },
  { id: 'activity-2', issueId: 'BUG-301', action: 'created this issue', actor: 'Lorenz Taganas', createdAt: '2026-10-02T15:54:00.000Z' },
]

const initialTestRuns = [
  { id: 'RUN-1042', name: 'Release candidate smoke suite', status: 'Completed', startedAt: '2026-10-03T10:14:00.000Z', passed: 4, failed: 1, total: 5, environment: 'Staging', projectKey: 'QAR' },
  { id: 'RUN-1041', name: 'Authentication regression', status: 'Completed', startedAt: '2026-10-02T16:22:00.000Z', passed: 5, failed: 0, total: 5, environment: 'QA', projectKey: 'QAR' },
]

const initialTestSuites = [
  { id: 'SUITE-1', name: 'Authentication', description: 'Sign-in, session handling, and account lockout coverage.', projectKey: 'QAR', testCaseIds: ['TC-201', 'TC-202', 'TC-205'] },
  { id: 'SUITE-2', name: 'Payments', description: 'Checkout validation and error recovery.', projectKey: 'QAR', testCaseIds: ['TC-203'] },
  { id: 'SUITE-3', name: 'Release regression', description: 'Core regression and performance checks for each release.', projectKey: 'QAR', testCaseIds: ['TC-204', 'TC-205'] },
]

const createUniqueId = (prefix, items, start) => {
  const usedIds = new Set(items.map((item) => item.id))
  let number = start

  while (usedIds.has(`${prefix}-${number}`)) {
    number += 1
  }

  return `${prefix}-${number}`
}

const mergeRun = (runs, updatedRun) => runs.map((run) => (run.id === updatedRun.id ? updatedRun : run))

export const QAProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth()
  const storagePrefix = `qaforge:${user?.id || 'anon'}:`
  const hasLoadedServerSnapshot = useRef(false)
  const persistTimer = useRef(null)
  const toastTimer = useRef(null)

  const loadStoredValue = (key, fallback) => {
    try {
      const saved = localStorage.getItem(`${storagePrefix}${key}`)
      if (!saved) return fallback
      const parsed = JSON.parse(saved)
      return parsed ?? fallback
    } catch {
      localStorage.removeItem(`${storagePrefix}${key}`)
      return fallback
    }
  }

  const [tasks, setTasks] = useState(() => loadStoredValue('tasks', initialTasks))
  const [requirements, setRequirements] = useState(() => loadStoredValue('requirements', initialRequirements))
  const [testCases, setTestCases] = useState(() => loadStoredValue('testcases', initialTestCases))
  const [bugs, setBugs] = useState(() => loadStoredValue('bugs', initialBugs))
  const [projectSettings, setProjectSettings] = useState(() => loadStoredValue('settings', initialProjectSettings))
  const [projects, setProjects] = useState(() => loadStoredValue('projects', initialProjects))
  const [selectedProjectKey, setSelectedProjectKey] = useState(() => loadStoredValue('selected-project', initialProjectSettings.key))
  const [epics, setEpics] = useState(() => loadStoredValue('epics', initialEpics))
  const [sprints, setSprints] = useState(() => loadStoredValue('sprints', initialSprints))
  const [comments, setComments] = useState(() => loadStoredValue('comments', initialComments))
  const [activity, setActivity] = useState(() => loadStoredValue('activity', initialActivity))
  const [testRuns, setTestRuns] = useState(() => loadStoredValue('test-runs', initialTestRuns))
  const [testSuites, setTestSuites] = useState(() => loadStoredValue('test-suites', initialTestSuites))
  const [notifications, setNotifications] = useState(() => loadStoredValue('notifications', []))
  const [watchers, setWatchers] = useState(() => loadStoredValue('watchers', []))
  const [teamUsers, setTeamUsers] = useState([])
  const [hydrating, setHydrating] = useState(Boolean(isAuthenticated))

  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [createModalType, setCreateModalType] = useState('Task')
  const [toastMessage, setToastMessage] = useState(null)

  const showToast = (message) => {
    if (!message) return
    clearTimeout(toastTimer.current)
    setToastMessage(message)
    toastTimer.current = setTimeout(() => setToastMessage(null), 3200)
  }

  useEffect(() => () => {
    clearTimeout(toastTimer.current)
    clearTimeout(persistTimer.current)
  }, [])

  const applySnapshot = (snapshot) => {
    if (!snapshot) return
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
    if (snapshot.testSuites) setTestSuites(snapshot.testSuites)
    if (snapshot.notifications) setNotifications(snapshot.notifications)
    if (snapshot.watchers) setWatchers(snapshot.watchers)
  }

  const applyCollections = (collections) => {
    if (collections.projects) setProjects(collections.projects)
    if (collections.requirements) setRequirements(collections.requirements)
    if (collections.testCases) setTestCases(collections.testCases)
    if (collections.bugs) setBugs(collections.bugs)
    if (collections.testRuns) setTestRuns(collections.testRuns)
    if (collections.testSuites) setTestSuites(collections.testSuites)
    if (collections.comments) setComments(collections.comments)
    if (collections.activity) setActivity(collections.activity)
    if (collections.tasks) setTasks(collections.tasks)
    if (collections.sprints) setSprints(collections.sprints)
    if (collections.epics) setEpics(collections.epics)
    if (collections.notifications) setNotifications(collections.notifications)
  }

  const fetchCollections = async () => {
    const responses = await Promise.allSettled([
      api.get('/projects'),
      api.get('/requirements'),
      api.get('/test-cases'),
      api.get('/bugs'),
      api.get('/test-runs'),
      api.get('/test-suites'),
      api.get('/comments'),
      api.get('/activity'),
      api.get('/tasks'),
      api.get('/sprints'),
      api.get('/epics'),
      api.get('/notifications'),
      api.get('/users'),
    ])
    const value = (index, key) => {
      const response = responses[index]
      return response.status === 'fulfilled' ? response.value.data?.[key] : undefined
    }
    applyCollections({
      projects: value(0, 'projects'),
      requirements: value(1, 'requirements'),
      testCases: value(2, 'testCases'),
      bugs: value(3, 'bugs'),
      testRuns: value(4, 'testRuns'),
      testSuites: value(5, 'testSuites'),
      comments: value(6, 'comments'),
      activity: value(7, 'activity'),
      tasks: value(8, 'tasks'),
      sprints: value(9, 'sprints'),
      epics: value(10, 'epics'),
      notifications: value(11, 'notifications'),
    })
    const users = value(12, 'users')
    if (Array.isArray(users)) setTeamUsers(users)
  }

  useEffect(() => {
    if (!isAuthenticated) {
      hasLoadedServerSnapshot.current = false
      setHydrating(false)
      return undefined
    }

    let cancelled = false
    setHydrating(true)
    api.get('/qa/snapshot')
      .then((response) => {
        const snapshot = response.data.snapshot
        if (cancelled) return null

        if (!snapshot) {
          return api.put('/qa/snapshot', {
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
            testSuites,
            notifications,
            watchers,
          }).then(() => fetchCollections())
        }

        applySnapshot(snapshot)
        return fetchCollections()
      })
      .catch(() => {
        // Keep the local cache usable when the sync endpoint is unavailable.
      })
      .finally(() => {
        if (!cancelled) {
          hasLoadedServerSnapshot.current = true
          setHydrating(false)
        }
      })

    return () => {
      cancelled = true
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.id])

  useEffect(() => {
    const save = (key, value) => {
      try {
        localStorage.setItem(`${storagePrefix}${key}`, JSON.stringify(value))
      } catch {
        // Storage can be full or blocked; the server snapshot remains authoritative.
      }
    }
    save('tasks', tasks)
    save('requirements', requirements)
    save('testcases', testCases)
    save('bugs', bugs)
    save('settings', projectSettings)
    save('projects', projects)
    save('selected-project', selectedProjectKey)
    save('epics', epics)
    save('sprints', sprints)
    save('comments', comments)
    save('activity', activity)
    save('test-runs', testRuns)
    save('test-suites', testSuites)
    save('notifications', notifications)
    save('watchers', watchers)
  }, [tasks, requirements, testCases, bugs, projectSettings, projects, selectedProjectKey, epics, sprints, comments, activity, testRuns, testSuites, notifications, watchers, storagePrefix])

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
        testSuites,
        notifications,
        watchers,
      }).catch(() => {
        // Retry on the next local change; keep the cached workspace intact.
      })
    }, 500)

    return () => clearTimeout(persistTimer.current)
  }, [isAuthenticated, tasks, requirements, testCases, bugs, projectSettings, projects, selectedProjectKey, epics, sprints, comments, activity, testRuns, testSuites, notifications, watchers])

  const openCreateModal = (type = 'Task') => {
    setCreateModalType(type)
    setIsCreateModalOpen(true)
  }

  const closeCreateModal = () => setIsCreateModalOpen(false)

  const refreshData = async () => {
    const response = await api.get('/qa/snapshot')
    if (response.data?.snapshot) applySnapshot(response.data.snapshot)
    await fetchCollections()
    return true
  }

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
      showToast(error.response?.data?.message || 'Could not update watcher')
    }
  }

  const updateProjectSettings = (updates) => {
    setProjectSettings((previous) => ({ ...previous, ...updates }))
  }

  const addTask = async (task) => {
    let newTask = {
      ...task,
      id: createUniqueId('QAR', tasks, 100),
      status: task.status || 'To Do',
      priority: task.priority || 'Medium',
      due: task.due || '',
    }
    try {
      const response = await api.post('/tasks', task)
      if (response.data?.task) newTask = response.data.task
    } catch (error) {
      if (error.response) {
        showToast(error.response.data?.message || 'Could not create task')
        return null
      }
      showToast('Task saved locally; the server is unavailable')
    }
    setTasks((previous) => [newTask, ...previous])
    showToast(`Created issue ${newTask.id}`)
    return newTask
  }

  const updateTaskStatus = async (taskId, newStatus) => {
    const previousTask = tasks.find((task) => task.id === taskId)
    setTasks((previous) => previous.map((task) => (task.id === taskId ? { ...task, status: newStatus } : task)))
    try {
      await api.patch(`/tasks/${taskId}`, { status: newStatus })
      await api.post('/activity', { issueId: taskId, action: `moved to ${newStatus}` })
      setActivity((previous) => [{ id: `activity-${Date.now()}`, issueId: taskId, action: `moved to ${newStatus}`, actor: user?.name || 'You', createdAt: new Date().toISOString() }, ...previous])
      showToast(`Updated ${taskId} to ${newStatus}`)
    } catch (error) {
      if (error.response) {
        if (previousTask) setTasks((previous) => previous.map((task) => (task.id === taskId ? previousTask : task)))
        showToast(error.response.data?.message || 'Could not update task')
      } else {
        showToast('Task updated locally; the server is unavailable')
      }
    }
  }

  const deleteTask = async (taskId) => {
    try {
      await api.delete(`/tasks/${taskId}`)
      setTasks((previous) => previous.filter((task) => task.id !== taskId))
      showToast(`Deleted issue ${taskId}`)
      return true
    } catch (error) {
      if (error.response) {
        showToast(error.response.data?.message || 'Could not delete issue')
        return false
      }
      setTasks((previous) => previous.filter((task) => task.id !== taskId))
      showToast('Issue removed locally; the server is unavailable')
      return true
    }
  }

  const addRequirement = async (requirement) => {
    let newRequirement = {
      ...requirement,
      id: createUniqueId('REQ', requirements, 100),
      status: requirement.status || 'Draft',
      priority: requirement.priority || 'Medium',
    }
    try {
      const response = await api.post('/requirements', requirement)
      if (response.data?.requirement) newRequirement = response.data.requirement
    } catch (error) {
      if (error.response) {
        showToast(error.response.data?.message || 'Could not save requirement')
        return null
      }
      showToast('Requirement saved locally; the server is unavailable')
    }
    setRequirements((previous) => [newRequirement, ...previous])
    showToast(`Added requirement ${newRequirement.id}`)
    return newRequirement
  }

  const deleteRequirement = async (id) => {
    try {
      await api.delete(`/requirements/${id}`)
      setRequirements((previous) => previous.filter((requirement) => requirement.id !== id))
      showToast(`Removed requirement ${id}`)
      return true
    } catch (error) {
      if (error.response) {
        showToast(error.response.data?.message || 'Could not remove requirement')
        return false
      }
      setRequirements((previous) => previous.filter((requirement) => requirement.id !== id))
      showToast('Requirement removed locally; the server is unavailable')
      return true
    }
  }

  const updateRequirementStatus = async (id, newStatus) => {
    const previousRequirement = requirements.find((requirement) => requirement.id === id)
    setRequirements((previous) => previous.map((requirement) => (requirement.id === id ? { ...requirement, status: newStatus } : requirement)))
    try {
      await api.patch(`/requirements/${id}`, { status: newStatus })
      showToast('Requirement status updated')
    } catch (error) {
      if (error.response) {
        if (previousRequirement) setRequirements((previous) => previous.map((requirement) => (requirement.id === id ? previousRequirement : requirement)))
        showToast(error.response.data?.message || 'Could not update requirement')
      } else {
        showToast('Requirement updated locally; the server is unavailable')
      }
    }
  }

  const addTestCase = async (testCase) => {
    let newTestCase = {
      ...testCase,
      id: createUniqueId('TC', testCases, 200),
      status: testCase.status || 'Ready',
      priority: testCase.priority || 'Medium',
      type: testCase.type || 'Functional',
      lastResult: 'Not Run',
      steps: testCase.steps || [],
    }
    try {
      const response = await api.post('/test-cases', testCase)
      if (response.data?.testCase) newTestCase = response.data.testCase
    } catch (error) {
      if (error.response) {
        showToast(error.response.data?.message || 'Could not create test case')
        return null
      }
      showToast('Test case saved locally; the server is unavailable')
    }
    setTestCases((previous) => [newTestCase, ...previous])
    showToast(`Added test case ${newTestCase.id}`)
    return newTestCase
  }

  const executeTestCase = async (id, result) => {
    const previousTestCase = testCases.find((testCase) => testCase.id === id)
    setTestCases((previous) => previous.map((testCase) => (testCase.id === id ? { ...testCase, lastResult: result } : testCase)))
    try {
      await api.patch(`/test-cases/${id}`, { lastResult: result })
      showToast(`Test ${id} marked ${result}`)
    } catch (error) {
      if (error.response) {
        if (previousTestCase) setTestCases((previous) => previous.map((testCase) => (testCase.id === id ? previousTestCase : testCase)))
        showToast(error.response.data?.message || 'Could not update test result')
      } else {
        showToast('Test result updated locally; the server is unavailable')
      }
    }
  }

  const updateTestCase = async (id, updates) => {
    const previous = testCases.find((testCase) => testCase.id === id)
    setTestCases((previousItems) => previousItems.map((testCase) => (testCase.id === id ? { ...testCase, ...updates } : testCase)))
    try {
      const response = await api.patch(`/test-cases/${id}`, updates)
      if (response.data?.testCase) {
        setTestCases((previousItems) => previousItems.map((testCase) => (testCase.id === id ? response.data.testCase : testCase)))
      }
      showToast(`Updated ${id}`)
    } catch (error) {
      if (error.response) {
        if (previous) setTestCases((previousItems) => previousItems.map((testCase) => (testCase.id === id ? previous : testCase)))
        showToast(error.response.data?.message || 'Could not update test case')
      } else {
        showToast('Test case updated locally; the server is unavailable')
      }
    }
  }

  const deleteTestCase = async (id) => {
    try {
      await api.delete(`/test-cases/${id}`)
      setTestCases((previous) => previous.filter((testCase) => testCase.id !== id))
      setTestSuites((previous) => previous.map((suite) => ({ ...suite, testCaseIds: (suite.testCaseIds || []).filter((caseId) => caseId !== id) })))
      showToast(`Deleted test case ${id}`)
      return true
    } catch (error) {
      if (error.response) {
        showToast(error.response.data?.message || 'Could not delete test case')
        return false
      }
      setTestCases((previous) => previous.filter((testCase) => testCase.id !== id))
      showToast('Test case removed locally; the server is unavailable')
      return true
    }
  }

  const createTestRun = async (options = {}) => {
    const payload = typeof options === 'string' ? { name: options } : options
    if (!payload.name?.trim()) {
      showToast('Give the test run a name')
      return null
    }
    let created = null
    try {
      const response = await api.post('/test-runs', {
        ...payload,
        name: payload.name.trim(),
        projectKey: payload.projectKey || selectedProjectKey,
      })
      created = response.data?.testRun
    } catch (error) {
      showToast(error.response?.data?.message || 'Could not create test run')
      return null
    }
    if (!created) return null
    setTestRuns((previous) => [created, ...previous])
    showToast(`Created test run ${created.id}`)
    return created
  }

  const executeTestRunCase = async (runId, testCaseId, result, notes = '') => {
    const previousRun = testRuns.find((run) => run.id === runId)
    const previousCase = testCases.find((testCase) => testCase.id === testCaseId)
    setTestRuns((previous) => previous.map((run) => {
      if (run.id !== runId || !Array.isArray(run.cases)) return run
      return {
        ...run,
        cases: run.cases.map((item) => (item.testCaseId === testCaseId
          ? { ...item, result, notes, executedAt: result === 'Not Run' ? null : new Date().toISOString() }
          : item)),
      }
    }))
    setTestCases((previous) => previous.map((testCase) => (testCase.id === testCaseId ? { ...testCase, lastResult: result } : testCase)))
    try {
      const response = await api.patch(`/test-runs/${runId}/cases/${testCaseId}`, { result, notes })
      if (response.data?.testRun) {
        setTestRuns((previous) => mergeRun(previous, response.data.testRun))
      }
      if (response.data?.testCase) {
        setTestCases((previous) => previous.map((testCase) => (testCase.id === testCaseId ? response.data.testCase : testCase)))
      }
      return response.data?.testRun || null
    } catch (error) {
      if (previousRun) setTestRuns((previous) => mergeRun(previous, previousRun))
      if (previousCase) setTestCases((previous) => previous.map((testCase) => (testCase.id === testCaseId ? previousCase : testCase)))
      showToast(error.response?.data?.message || 'Could not save this test result')
      return null
    }
  }

  const deleteTestRun = async (runId) => {
    try {
      await api.delete(`/test-runs/${runId}`)
      setTestRuns((previous) => previous.filter((run) => run.id !== runId))
      showToast(`Deleted test run ${runId}`)
      return true
    } catch (error) {
      showToast(error.response?.data?.message || 'Could not delete test run')
      return false
    }
  }

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
      showToast('Bug saved locally; the server is unavailable')
    }
    setBugs((previous) => [newBug, ...previous])
    showToast(`Logged defect ${newBug.id}`)
    return newBug
  }

  const updateBugStatus = async (id, newStatus) => {
    const previousBug = bugs.find((bug) => bug.id === id)
    setBugs((previous) => previous.map((bug) => (bug.id === id ? { ...bug, status: newStatus } : bug)))
    try {
      await api.patch(`/bugs/${id}`, { status: newStatus })
      await api.post('/activity', { issueId: id, action: `changed status to ${newStatus}` })
      setActivity((previous) => [{
        id: `activity-${Date.now()}`,
        issueId: id,
        action: newStatus === 'Reopened' ? 'reopened the bug' : `changed bug status to ${newStatus}`,
        actor: user?.name || 'You',
        createdAt: new Date().toISOString(),
      }, ...previous])
      showToast(`Bug ${id} updated to ${newStatus}`)
    } catch (error) {
      if (error.response) {
        if (previousBug) setBugs((previous) => previous.map((bug) => (bug.id === id ? previousBug : bug)))
        showToast(error.response.data?.message || 'Could not update bug')
      } else {
        showToast('Bug updated locally; the server is unavailable')
      }
    }
  }

  const deleteBug = async (id) => {
    try {
      await api.delete(`/bugs/${id}`)
      setBugs((previous) => previous.filter((bug) => bug.id !== id))
      showToast(`Deleted defect ${id}`)
      return true
    } catch (error) {
      if (error.response) {
        showToast(error.response.data?.message || 'Could not delete defect')
        return false
      }
      setBugs((previous) => previous.filter((bug) => bug.id !== id))
      showToast('Bug removed locally; the server is unavailable')
      return true
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
      return false
    }

    const previous = { tasks, requirements, testCases, bugs }
    const update = (items) => items.map((item) => (item.id === issueId ? { ...item, ...updates } : item))
    if (collection === 'tasks') setTasks(update)
    if (collection === 'requirements') setRequirements(update)
    if (collection === 'testCases') setTestCases(update)
    if (collection === 'bugs') setBugs(update)

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
        const replacePersisted = (items) => items.map((item) => (item.id === issueId ? { ...item, ...persistedItem } : item))
        if (collection === 'tasks') setTasks(replacePersisted)
        if (collection === 'requirements') setRequirements(replacePersisted)
        if (collection === 'testCases') setTestCases(replacePersisted)
        if (collection === 'bugs') setBugs(replacePersisted)
      }
      setActivity((previousActivity) => [{
        id: `activity-${Date.now()}`,
        issueId,
        action: `updated ${Object.keys(updates).join(', ')}`,
        actor: user?.name || 'You',
        createdAt: new Date().toISOString(),
      }, ...previousActivity])
      try {
        await api.post('/activity', { issueId, action: `updated ${Object.keys(updates).join(', ')}` })
      } catch {
        // The issue change is already persisted; activity logging is best-effort.
      }
      showToast(`Updated ${issueId}`)
      return true
    } catch (error) {
      if (error.response) {
        setTasks(previous.tasks)
        setRequirements(previous.requirements)
        setTestCases(previous.testCases)
        setBugs(previous.bugs)
        showToast(error.response.data?.message || `Could not update ${issueId}`)
      } else {
        showToast(`${issueId} updated locally; the server is unavailable`)
      }
      return false
    }
  }

  const addComment = async (issueId, body, attachment = null) => {
    if (!body.trim()) return
    let commentToAdd = { id: `comment-${Date.now()}`, issueId, author: user?.name || 'You', body: body.trim(), createdAt: new Date().toISOString() }
    let activityToAdd = { id: `activity-${Date.now() + 1}`, issueId, action: 'added a comment', actor: user?.name || 'You', createdAt: new Date().toISOString() }
    try {
      const response = await api.post('/comments', { issueId, body: body.trim(), attachment })
      if (response.data?.comment) commentToAdd = response.data.comment
      if (response.data?.activity) activityToAdd = response.data.activity
    } catch (error) {
      if (error.response) {
        showToast(error.response.data?.message || 'Could not add comment')
        return false
      }
      showToast('Comment saved locally; the server is unavailable')
    }
    setComments((previous) => [commentToAdd, ...previous])
    setActivity((previous) => [activityToAdd, ...previous])
    showToast('Comment added')
    return true
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
      showToast('Project created locally; the server is unavailable')
    }
    setProjects((previous) => [created, ...previous])
    showToast(`Created project ${created.key}`)
    return created
  }

  const updateProject = async (projectKey, updates) => {
    const previousProject = projects.find((project) => project.key === projectKey)
    if (!previousProject) return null
    setProjects((previous) => previous.map((project) => (project.key === projectKey ? { ...project, ...updates } : project)))
    try {
      const response = await api.patch(`/projects/${projectKey}`, updates)
      const updated = response.data?.project
      if (updated) setProjects((previous) => previous.map((project) => (project.key === projectKey ? updated : project)))
      showToast(`Updated project ${projectKey}`)
      return updated || { ...previousProject, ...updates }
    } catch (error) {
      setProjects((previous) => previous.map((project) => (project.key === projectKey ? previousProject : project)))
      showToast(error.response?.data?.message || 'Could not update project')
      return null
    }
  }

  const deleteProject = async (projectKey) => {
    try {
      await api.delete(`/projects/${projectKey}`)
      setProjects((previous) => previous.filter((project) => project.key !== projectKey))
      if (selectedProjectKey === projectKey) {
        const next = projects.find((project) => project.key !== projectKey)
        if (next) setSelectedProjectKey(next.key)
      }
      showToast(`Deleted project ${projectKey}`)
      return true
    } catch (error) {
      showToast(error.response?.data?.message || 'Could not delete project')
      return false
    }
  }

  const addEpic = async (epic) => {
    let created = { ...epic, id: `EPIC-${Date.now()}`, status: 'To Do', color: epic.color || '#7C6CF2' }
    try {
      const response = await api.post('/epics', epic)
      if (response.data?.epic) created = response.data.epic
    } catch (error) {
      if (error.response) {
        showToast(error.response.data?.message || 'Could not create epic')
        return null
      }
      showToast('Epic created locally; the server is unavailable')
    }
    setEpics((previous) => [created, ...previous])
    showToast(`Created epic ${created.title}`)
    return created
  }

  const updateEpic = async (epicId, updates) => {
    setEpics((previous) => previous.map((epic) => (epic.id === epicId ? { ...epic, ...updates } : epic)))
    try {
      const response = await api.patch(`/epics/${epicId}`, updates)
      if (response.data?.epic) setEpics((previous) => previous.map((epic) => (epic.id === epicId ? response.data.epic : epic)))
      showToast('Epic updated')
    } catch (error) {
      showToast(error.response?.data?.message || 'Could not update epic')
    }
  }

  const deleteEpic = async (epicId) => {
    try {
      await api.delete(`/epics/${epicId}`)
      setEpics((previous) => previous.filter((epic) => epic.id !== epicId))
      setTasks((previous) => previous.map((task) => (task.epicId === epicId ? { ...task, epicId: undefined } : task)))
      showToast('Epic deleted')
      return true
    } catch (error) {
      showToast(error.response?.data?.message || 'Could not delete epic')
      return false
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
      showToast('Sprint created locally; the server is unavailable')
    }
    setSprints((previous) => [created, ...previous])
    showToast(`Created sprint ${created.name}`)
    return created
  }

  const updateSprint = async (sprintId, updates) => {
    setSprints((previous) => previous.map((sprint) => {
      if (sprint.id === sprintId) return { ...sprint, ...updates }
      if (updates.status === 'Active' && sprint.status === 'Active') return { ...sprint, status: 'Planned' }
      return sprint
    }))
    try {
      const response = await api.patch(`/sprints/${sprintId}`, updates)
      if (response.data?.sprint) {
        setSprints((previous) => previous.map((sprint) => (sprint.id === sprintId ? response.data.sprint : sprint)))
      }
      showToast('Sprint updated')
    } catch (error) {
      showToast(error.response?.data?.message || 'Could not update sprint')
    }
  }

  const deleteSprint = async (sprintId) => {
    try {
      await api.delete(`/sprints/${sprintId}`)
      setSprints((previous) => previous.filter((sprint) => sprint.id !== sprintId))
      setTasks((previous) => previous.map((task) => (task.sprintId === sprintId ? { ...task, sprintId: undefined } : task)))
      showToast('Sprint deleted')
      return true
    } catch (error) {
      showToast(error.response?.data?.message || 'Could not delete sprint')
      return false
    }
  }

  const addTestSuite = async (suite) => {
    try {
      const response = await api.post('/test-suites', suite)
      const created = response.data?.testSuite
      if (!created) throw new Error('No suite returned')
      setTestSuites((previous) => [created, ...previous])
      showToast(`Created suite ${created.name}`)
      return created
    } catch (error) {
      showToast(error.response?.data?.message || 'Could not create test suite')
      return null
    }
  }

  const updateTestSuite = async (suiteId, updates) => {
    const previous = testSuites.find((suite) => suite.id === suiteId)
    setTestSuites((previousItems) => previousItems.map((suite) => (suite.id === suiteId ? { ...suite, ...updates } : suite)))
    try {
      const response = await api.patch(`/test-suites/${suiteId}`, updates)
      if (response.data?.testSuite) {
        setTestSuites((previousItems) => previousItems.map((suite) => (suite.id === suiteId ? response.data.testSuite : suite)))
      }
      showToast('Suite updated')
      return true
    } catch (error) {
      if (error.response && previous) {
        setTestSuites((previousItems) => previousItems.map((suite) => (suite.id === suiteId ? previous : suite)))
      }
      showToast(error.response?.data?.message || 'Could not update test suite')
      return false
    }
  }

  const deleteTestSuite = async (suiteId) => {
    try {
      await api.delete(`/test-suites/${suiteId}`)
      setTestSuites((previous) => previous.filter((suite) => suite.id !== suiteId))
      showToast('Suite deleted')
      return true
    } catch (error) {
      showToast(error.response?.data?.message || 'Could not delete test suite')
      return false
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
        setSelectedProjectKey,
        epics,
        sprints,
        comments,
        activity,
        testRuns,
        testSuites,
        teamUsers,
        notifications,
        watchers,
        hydrating,
        refreshData,
        toggleWatcher,
        markNotificationRead,
        markAllNotificationsRead,
        projectSettings,
        searchQuery,
        setSearchQuery,
        isCreateModalOpen,
        setIsCreateModalOpen,
        createModalType,
        openCreateModal,
        closeCreateModal,
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
        updateTestCase,
        executeTestCase,
        createTestRun,
        executeTestRunCase,
        deleteTestRun,
        deleteTestCase,
        addTestSuite,
        updateTestSuite,
        deleteTestSuite,
        addBug,
        updateBugStatus,
        deleteBug,
        updateIssue,
        addComment,
        addProject,
        updateProject,
        deleteProject,
        addEpic,
        updateEpic,
        deleteEpic,
        addSprint,
        updateSprint,
        deleteSprint,
      }}
    >
      {children}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-[70] flex max-w-sm items-start gap-2.5 rounded-lg border border-qf-border bg-qf-surface px-4 py-3 text-xs font-medium text-qf-text shadow-popover animate-fade-in" role="status">
          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-qf-primary" />
          <span>{toastMessage}</span>
        </div>
      )}
    </QAContext.Provider>
  )
}
