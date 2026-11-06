import React, { useState, useEffect, useRef } from 'react'
import api, { setActiveProjectKey } from '../services/api'
import { useAuth } from './AuthContext'
import QAContext from './QAContextBase'

const emptySettings = { name: '', key: '', defaultEnv: 'QA' }

const errorMessage = (error, fallback) => (
  error?.response?.data?.message || `${fallback} Check that the API server is running.`
)

const mergeRun = (runs, updatedRun) => runs.map((run) => (run.id === updatedRun.id ? updatedRun : run))

export const QAProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth()

  const [tasks, setTasks] = useState([])
  const [requirements, setRequirements] = useState([])
  const [testCases, setTestCases] = useState([])
  const [bugs, setBugs] = useState([])
  const [projectSettings, setProjectSettings] = useState(emptySettings)
  const [projects, setProjects] = useState([])
  const [selectedProjectKey, setSelectedProjectKey] = useState('')
  const [epics, setEpics] = useState([])
  const [sprints, setSprints] = useState([])
  const [comments, setComments] = useState([])
  const [activity, setActivity] = useState([])
  const [testRuns, setTestRuns] = useState([])
  const [testSuites, setTestSuites] = useState([])
  const [notifications, setNotifications] = useState([])
  const [watchers, setWatchers] = useState([])
  const [teamUsers, setTeamUsers] = useState([])
  const [hydrating, setHydrating] = useState(Boolean(isAuthenticated))

  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [createModalType, setCreateModalType] = useState('Task')
  const [toastMessage, setToastMessage] = useState(null)

  const toastTimer = useRef(null)

  const showToast = (message) => {
    if (!message) return
    clearTimeout(toastTimer.current)
    setToastMessage(message)
    toastTimer.current = setTimeout(() => setToastMessage(null), 3200)
  }

  useEffect(() => () => clearTimeout(toastTimer.current), [])

  const resetWorkspace = () => {
    setTasks([])
    setRequirements([])
    setTestCases([])
    setBugs([])
    setProjectSettings(emptySettings)
    setProjects([])
    setSelectedProjectKey('')
    setEpics([])
    setSprints([])
    setComments([])
    setActivity([])
    setTestRuns([])
    setTestSuites([])
    setNotifications([])
    setWatchers([])
    setTeamUsers([])
    setActiveProjectKey(null)
  }

  const applyBootstrap = (data) => {
    setProjects(data.projects || [])
    setSelectedProjectKey(data.selectedProjectKey || '')
    setActiveProjectKey(data.selectedProjectKey || null)
    setProjectSettings(data.projectSettings || emptySettings)
    setTasks(data.tasks || [])
    setRequirements(data.requirements || [])
    setTestCases(data.testCases || [])
    setBugs(data.bugs || [])
    setEpics(data.epics || [])
    setSprints(data.sprints || [])
    setComments(data.comments || [])
    setActivity(data.activity || [])
    setTestRuns(data.testRuns || [])
    setTestSuites(data.testSuites || [])
    setNotifications(data.notifications || [])
    setWatchers(data.watchers || [])
  }

  useEffect(() => {
    if (!isAuthenticated) {
      resetWorkspace()
      setHydrating(false)
      return undefined
    }

    let cancelled = false
    setHydrating(true)
    setActiveProjectKey(user?.selectedProjectKey || null)

    Promise.all([api.get('/qa/bootstrap'), api.get('/users')])
      .then(([bootstrap, directory]) => {
        if (cancelled) return
        if (Array.isArray(directory.data?.users)) setTeamUsers(directory.data.users)
        applyBootstrap(bootstrap.data)
      })
      .catch((error) => {
        if (!cancelled) showToast(errorMessage(error, 'Could not load the shared workspace.'))
      })
      .finally(() => {
        if (!cancelled) setHydrating(false)
      })

    return () => {
      cancelled = true
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.id])

  const loadTeam = async () => {
    try {
      const response = await api.get('/users')
      if (Array.isArray(response.data?.users)) setTeamUsers(response.data.users)
    } catch {
      // The team directory is secondary; the workspace stays usable without it.
    }
  }

  const refreshData = async () => {
    const response = await api.get('/qa/bootstrap', {
      params: selectedProjectKey ? { projectKey: selectedProjectKey } : undefined,
    })
    applyBootstrap(response.data)
    await loadTeam()
    return true
  }

  const selectProject = async (projectKey) => {
    if (!projectKey || projectKey === selectedProjectKey) return true
    const previousKey = selectedProjectKey
    const previousSettings = projectSettings

    setSelectedProjectKey(projectKey)
    setActiveProjectKey(projectKey)

    try {
      const response = await api.put('/qa/state', { selectedProjectKey: projectKey })
      if (response.data?.projectSettings) setProjectSettings(response.data.projectSettings)
      return true
    } catch (error) {
      setSelectedProjectKey(previousKey)
      setActiveProjectKey(previousKey)
      setProjectSettings(previousSettings)
      showToast(errorMessage(error, 'Could not switch projects.'))
      return false
    }
  }

  const openCreateModal = (type = 'Task') => {
    setCreateModalType(type)
    setIsCreateModalOpen(true)
  }

  const closeCreateModal = () => setIsCreateModalOpen(false)

  const markNotificationRead = async (notificationId) => {
    const previous = notifications
    setNotifications((items) => items.map((notification) => (
      notification.id === notificationId ? { ...notification, read: true } : notification
    )))
    try {
      await api.patch(`/notifications/${notificationId}/read`)
    } catch (error) {
      setNotifications(previous)
      showToast(errorMessage(error, 'Could not update the notification.'))
    }
  }

  const markAllNotificationsRead = async () => {
    const previous = notifications
    setNotifications((items) => items.map((notification) => ({ ...notification, read: true })))
    try {
      await api.patch('/notifications/read-all')
    } catch (error) {
      setNotifications(previous)
      showToast(errorMessage(error, 'Could not update notifications.'))
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
      showToast(errorMessage(error, 'Could not update this watcher.'))
    }
  }

  const updateProjectSettings = async (updates) => {
    const previous = projectSettings
    setProjectSettings((settings) => ({ ...settings, ...updates }))
    try {
      const response = await api.patch('/qa/settings', updates)
      if (response.data?.projectSettings) setProjectSettings(response.data.projectSettings)
      showToast(`New test runs will default to ${updates.defaultEnv}`)
      return true
    } catch (error) {
      setProjectSettings(previous)
      showToast(errorMessage(error, 'Could not save testing defaults.'))
      return false
    }
  }

  const addTask = async (task) => {
    try {
      const response = await api.post('/tasks', task)
      const created = response.data?.task
      if (!created) throw new Error('No task returned')
      setTasks((previous) => [created, ...previous])
      showToast(`Created issue ${created.id}`)
      return created
    } catch (error) {
      showToast(errorMessage(error, 'Could not create the task.'))
      return null
    }
  }

  const updateTaskStatus = async (taskId, newStatus) => {
    const previousTask = tasks.find((task) => task.id === taskId)
    setTasks((previous) => previous.map((task) => (task.id === taskId ? { ...task, status: newStatus } : task)))
    try {
      await api.patch(`/tasks/${taskId}`, { status: newStatus })
      try {
        await api.post('/activity', { issueId: taskId, action: `moved to ${newStatus}` })
      } catch {
        // The status change is persisted; activity logging is best-effort.
      }
      setActivity((previous) => [{ id: `activity-${Date.now()}`, issueId: taskId, action: `moved to ${newStatus}`, actor: user?.name || 'You', createdAt: new Date().toISOString() }, ...previous])
      showToast(`Updated ${taskId} to ${newStatus}`)
      return true
    } catch (error) {
      if (previousTask) setTasks((previous) => previous.map((task) => (task.id === taskId ? previousTask : task)))
      showToast(errorMessage(error, 'Could not update the task.'))
      return false
    }
  }

  const deleteTask = async (taskId) => {
    try {
      await api.delete(`/tasks/${taskId}`)
      setTasks((previous) => previous.filter((task) => task.id !== taskId))
      showToast(`Deleted issue ${taskId}`)
      return true
    } catch (error) {
      showToast(errorMessage(error, 'Could not delete the issue.'))
      return false
    }
  }

  const addRequirement = async (requirement) => {
    try {
      const response = await api.post('/requirements', requirement)
      const created = response.data?.requirement
      if (!created) throw new Error('No requirement returned')
      setRequirements((previous) => [created, ...previous])
      showToast(`Added requirement ${created.id}`)
      return created
    } catch (error) {
      showToast(errorMessage(error, 'Could not save the requirement.'))
      return null
    }
  }

  const deleteRequirement = async (id) => {
    try {
      await api.delete(`/requirements/${id}`)
      setRequirements((previous) => previous.filter((requirement) => requirement.id !== id))
      showToast(`Removed requirement ${id}`)
      return true
    } catch (error) {
      showToast(errorMessage(error, 'Could not remove the requirement.'))
      return false
    }
  }

  const updateRequirementStatus = async (id, newStatus) => {
    const previousRequirement = requirements.find((requirement) => requirement.id === id)
    setRequirements((previous) => previous.map((requirement) => (requirement.id === id ? { ...requirement, status: newStatus } : requirement)))
    try {
      await api.patch(`/requirements/${id}`, { status: newStatus })
      showToast('Requirement status updated')
      return true
    } catch (error) {
      if (previousRequirement) setRequirements((previous) => previous.map((requirement) => (requirement.id === id ? previousRequirement : requirement)))
      showToast(errorMessage(error, 'Could not update the requirement.'))
      return false
    }
  }

  const addTestCase = async (testCase) => {
    try {
      const response = await api.post('/test-cases', testCase)
      const created = response.data?.testCase
      if (!created) throw new Error('No test case returned')
      setTestCases((previous) => [created, ...previous])
      showToast(`Added test case ${created.id}`)
      return created
    } catch (error) {
      showToast(errorMessage(error, 'Could not create the test case.'))
      return null
    }
  }

  const executeTestCase = async (id, result) => {
    const previousTestCase = testCases.find((testCase) => testCase.id === id)
    setTestCases((previous) => previous.map((testCase) => (testCase.id === id ? { ...testCase, lastResult: result } : testCase)))
    try {
      await api.patch(`/test-cases/${id}`, { lastResult: result })
      showToast(`Test ${id} marked ${result}`)
      return true
    } catch (error) {
      if (previousTestCase) setTestCases((previous) => previous.map((testCase) => (testCase.id === id ? previousTestCase : testCase)))
      showToast(errorMessage(error, 'Could not update the test result.'))
      return false
    }
  }

  const updateTestCase = async (id, updates) => {
    const previous = testCases.find((testCase) => testCase.id === id)
    setTestCases((items) => items.map((testCase) => (testCase.id === id ? { ...testCase, ...updates } : testCase)))
    try {
      const response = await api.patch(`/test-cases/${id}`, updates)
      if (response.data?.testCase) {
        setTestCases((items) => items.map((testCase) => (testCase.id === id ? response.data.testCase : testCase)))
      }
      showToast(`Updated ${id}`)
      return true
    } catch (error) {
      if (previous) setTestCases((items) => items.map((testCase) => (testCase.id === id ? previous : testCase)))
      showToast(errorMessage(error, 'Could not update the test case.'))
      return false
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
      showToast(errorMessage(error, 'Could not delete the test case.'))
      return false
    }
  }

  const createTestRun = async (options = {}) => {
    const payload = typeof options === 'string' ? { name: options } : options
    if (!payload.name?.trim()) {
      showToast('Give the test run a name')
      return null
    }
    try {
      const response = await api.post('/test-runs', {
        ...payload,
        name: payload.name.trim(),
        projectKey: payload.projectKey || selectedProjectKey,
      })
      const created = response.data?.testRun
      if (!created) throw new Error('No test run returned')
      setTestRuns((previous) => [created, ...previous])
      showToast(`Created test run ${created.id}`)
      return created
    } catch (error) {
      showToast(errorMessage(error, 'Could not create the test run.'))
      return null
    }
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
      showToast(errorMessage(error, 'Could not save this test result.'))
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
      showToast(errorMessage(error, 'Could not delete the test run.'))
      return false
    }
  }

  const addBug = async (bug) => {
    try {
      const response = await api.post('/bugs', bug)
      const created = response.data?.bug
      if (!created) throw new Error('No bug returned')
      setBugs((previous) => [created, ...previous])
      showToast(`Logged defect ${created.id}`)
      return created
    } catch (error) {
      showToast(errorMessage(error, 'Could not create the bug.'))
      return null
    }
  }

  const updateBugStatus = async (id, newStatus) => {
    const previousBug = bugs.find((bug) => bug.id === id)
    setBugs((previous) => previous.map((bug) => (bug.id === id ? { ...bug, status: newStatus } : bug)))
    try {
      await api.patch(`/bugs/${id}`, { status: newStatus })
      try {
        await api.post('/activity', { issueId: id, action: `changed status to ${newStatus}` })
      } catch {
        // The status change is persisted; activity logging is best-effort.
      }
      setActivity((previous) => [{
        id: `activity-${Date.now()}`,
        issueId: id,
        action: newStatus === 'Reopened' ? 'reopened the bug' : `changed bug status to ${newStatus}`,
        actor: user?.name || 'You',
        createdAt: new Date().toISOString(),
      }, ...previous])
      showToast(`Bug ${id} updated to ${newStatus}`)
      return true
    } catch (error) {
      if (previousBug) setBugs((previous) => previous.map((bug) => (bug.id === id ? previousBug : bug)))
      showToast(errorMessage(error, 'Could not update the bug.'))
      return false
    }
  }

  const deleteBug = async (id) => {
    try {
      await api.delete(`/bugs/${id}`)
      setBugs((previous) => previous.filter((bug) => bug.id !== id))
      showToast(`Deleted defect ${id}`)
      return true
    } catch (error) {
      showToast(errorMessage(error, 'Could not delete the defect.'))
      return false
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
      setTasks(previous.tasks)
      setRequirements(previous.requirements)
      setTestCases(previous.testCases)
      setBugs(previous.bugs)
      showToast(errorMessage(error, `Could not update ${issueId}.`))
      return false
    }
  }

  const addComment = async (issueId, body, attachment = null) => {
    if (!body.trim()) return false
    try {
      const response = await api.post('/comments', { issueId, body: body.trim(), attachment })
      const comment = response.data?.comment
      const event = response.data?.activity
      if (!comment) throw new Error('No comment returned')
      setComments((previous) => [comment, ...previous])
      if (event) setActivity((previous) => [event, ...previous])
      showToast('Comment added')
      return true
    } catch (error) {
      showToast(errorMessage(error, 'Could not add the comment.'))
      return false
    }
  }

  const addProject = async (project) => {
    try {
      const response = await api.post('/projects', project)
      const created = response.data?.project
      if (!created) throw new Error('No project returned')
      setProjects((previous) => [created, ...previous])
      await selectProject(created.key)
      showToast(`Created project ${created.key}`)
      return created
    } catch (error) {
      showToast(errorMessage(error, 'Could not create the project.'))
      return null
    }
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
      showToast(errorMessage(error, 'Could not update the project.'))
      return null
    }
  }

  const deleteProject = async (projectKey) => {
    try {
      await api.delete(`/projects/${projectKey}`)
      const remaining = projects.filter((project) => project.key !== projectKey)
      setProjects(remaining)
      if (selectedProjectKey === projectKey) {
        const next = remaining[0]
        if (next) {
          await selectProject(next.key)
        } else {
          setSelectedProjectKey('')
          setActiveProjectKey(null)
        }
      }
      showToast(`Deleted project ${projectKey}`)
      return true
    } catch (error) {
      showToast(errorMessage(error, 'Could not delete the project.'))
      return false
    }
  }

  const addEpic = async (epic) => {
    try {
      const response = await api.post('/epics', epic)
      const created = response.data?.epic
      if (!created) throw new Error('No epic returned')
      setEpics((previous) => [created, ...previous])
      showToast(`Created epic ${created.title}`)
      return created
    } catch (error) {
      showToast(errorMessage(error, 'Could not create the epic.'))
      return null
    }
  }

  const updateEpic = async (epicId, updates) => {
    const previous = epics.find((epic) => epic.id === epicId)
    setEpics((items) => items.map((epic) => (epic.id === epicId ? { ...epic, ...updates } : epic)))
    try {
      const response = await api.patch(`/epics/${epicId}`, updates)
      if (response.data?.epic) setEpics((items) => items.map((epic) => (epic.id === epicId ? response.data.epic : epic)))
      showToast('Epic updated')
      return true
    } catch (error) {
      if (previous) setEpics((items) => items.map((epic) => (epic.id === epicId ? previous : epic)))
      showToast(errorMessage(error, 'Could not update the epic.'))
      return false
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
      showToast(errorMessage(error, 'Could not delete the epic.'))
      return false
    }
  }

  const addSprint = async (sprint) => {
    try {
      const response = await api.post('/sprints', sprint)
      const created = response.data?.sprint
      if (!created) throw new Error('No sprint returned')
      setSprints((previous) => [
        created,
        ...previous.map((item) => (created.status === 'Active' && item.status === 'Active' ? { ...item, status: 'Planned' } : item)),
      ])
      showToast(`Created sprint ${created.name}`)
      return created
    } catch (error) {
      showToast(errorMessage(error, 'Could not create the sprint.'))
      return null
    }
  }

  const updateSprint = async (sprintId, updates) => {
    const previous = sprints
    setSprints((items) => items.map((sprint) => {
      if (sprint.id === sprintId) return { ...sprint, ...updates }
      if (updates.status === 'Active' && sprint.status === 'Active') return { ...sprint, status: 'Planned' }
      return sprint
    }))
    try {
      const response = await api.patch(`/sprints/${sprintId}`, updates)
      if (response.data?.sprint) {
        setSprints((items) => items.map((sprint) => (sprint.id === sprintId ? response.data.sprint : sprint)))
      }
      showToast('Sprint updated')
      return true
    } catch (error) {
      setSprints(previous)
      showToast(errorMessage(error, 'Could not update the sprint.'))
      return false
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
      showToast(errorMessage(error, 'Could not delete the sprint.'))
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
      showToast(errorMessage(error, 'Could not create the test suite.'))
      return null
    }
  }

  const updateTestSuite = async (suiteId, updates) => {
    const previous = testSuites.find((suite) => suite.id === suiteId)
    setTestSuites((items) => items.map((suite) => (suite.id === suiteId ? { ...suite, ...updates } : suite)))
    try {
      const response = await api.patch(`/test-suites/${suiteId}`, updates)
      if (response.data?.testSuite) {
        setTestSuites((items) => items.map((suite) => (suite.id === suiteId ? response.data.testSuite : suite)))
      }
      showToast('Suite updated')
      return true
    } catch (error) {
      if (previous) setTestSuites((items) => items.map((suite) => (suite.id === suiteId ? previous : suite)))
      showToast(errorMessage(error, 'Could not update the test suite.'))
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
      showToast(errorMessage(error, 'Could not delete the test suite.'))
      return false
    }
  }

  const createTeamUser = async (payload) => {
    try {
      const response = await api.post('/users', payload)
      const created = response.data?.user
      if (!created) throw new Error('No account returned')
      setTeamUsers((previous) => [...previous, created])
      showToast(`Added ${created.name}`)
      return created
    } catch (error) {
      showToast(errorMessage(error, 'Could not create the account.'))
      return null
    }
  }

  const updateTeamUser = async (userId, updates) => {
    try {
      const response = await api.patch(`/users/${userId}`, updates)
      const updated = response.data?.user
      if (!updated) throw new Error('No account returned')
      setTeamUsers((previous) => previous.map((member) => (member.id === userId ? updated : member)))
      showToast(`Updated ${updated.name}`)
      return updated
    } catch (error) {
      showToast(errorMessage(error, 'Could not update the account.'))
      return null
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
        setSelectedProjectKey: selectProject,
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
        createTeamUser,
        updateTeamUser,
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
