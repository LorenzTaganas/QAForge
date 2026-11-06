import { useEffect, useRef, useState } from 'react'
import { Bug, CheckCircle2, CheckSquare, FileText, X } from 'lucide-react'
import { useQA } from '../../context/useQA'
import { useAuth } from '../../context/AuthContext'

const typeOptions = [
  { value: 'Task', label: 'Task', icon: CheckCircle2 },
  { value: 'Bug', label: 'Bug', icon: Bug },
  { value: 'TestCase', label: 'Test case', icon: CheckSquare },
  { value: 'Requirement', label: 'Requirement', icon: FileText },
]

const emptyForm = (projectKey, owner) => ({
  title: '',
  description: '',
  priority: 'Medium',
  severity: 'Major',
  type: 'Functional',
  owner,
  assignee: '',
  due: '',
  environment: 'Staging',
  projectKey,
  sprintId: '',
  epicId: '',
  suiteId: '',
  labels: '',
  steps: '',
  preconditions: '',
  acceptanceCriteria: '',
  stepsToReproduce: '',
  expectedBehavior: '',
  actualBehavior: '',
})

const Field = ({ label, htmlFor, required, children, hint }) => (
  <div>
    <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-medium text-qf-secondary">
      {label} {required && <span className="text-qf-danger">*</span>}
    </label>
    {children}
    {hint && <p className="mt-1 text-[11px] text-qf-muted">{hint}</p>}
  </div>
)

const CreateModal = ({ isOpen, onClose, initialType = 'Task' }) => {
  const {
    addTask,
    addRequirement,
    addTestCase,
    addBug,
    projects,
    selectedProjectKey,
    sprints,
    epics,
    testSuites,
    teamUsers,
  } = useQA()
  const { user } = useAuth()
  const [entityType, setEntityType] = useState(initialType)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationError, setValidationError] = useState('')
  const titleInputRef = useRef(null)
  const [formData, setFormData] = useState(() => emptyForm(selectedProjectKey || 'QAR', user?.name || ''))

  const projectSprints = sprints.filter((sprint) => !sprint.projectKey || sprint.projectKey === formData.projectKey)
  const projectEpics = epics.filter((epic) => !epic.projectKey || epic.projectKey === formData.projectKey)
  const projectSuites = testSuites.filter((suite) => !suite.projectKey || suite.projectKey === formData.projectKey)

  useEffect(() => {
    if (!isOpen) return
    setEntityType(typeOptions.some((option) => option.value === initialType) ? initialType : 'Task')
    setFormData((previous) => ({ ...previous, projectKey: selectedProjectKey || previous.projectKey }))
    setValidationError('')
    const focusTimer = window.setTimeout(() => titleInputRef.current?.focus(), 0)
    return () => window.clearTimeout(focusTimer)
  }, [isOpen, initialType, selectedProjectKey])

  useEffect(() => {
    if (!isOpen) return undefined
    const handleKey = (event) => {
      if (event.key === 'Escape' && !isSubmitting) onClose()
      if (event.key !== 'Tab') return
      const dialog = document.getElementById('create-issue-dialog')
      if (!dialog) return
      const focusable = [...dialog.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])')]
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, isSubmitting, onClose])

  if (!isOpen) return null

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((previous) => ({ ...previous, [name]: value }))
    setValidationError('')
  }

  const reset = () => {
    setFormData(emptyForm(selectedProjectKey || 'QAR', user?.name || ''))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!formData.title.trim()) {
      setValidationError('Add a summary before creating this item.')
      titleInputRef.current?.focus()
      return
    }
    if (isSubmitting) return
    setValidationError('')
    setIsSubmitting(true)

    try {
      const labels = formData.labels.split(',').map((label) => label.trim()).filter(Boolean)
      const common = {
        title: formData.title.trim(),
        priority: formData.priority,
        projectKey: formData.projectKey,
        labels,
      }
      let created
      if (entityType === 'Task') {
        created = await addTask({
          ...common,
          description: formData.description.trim(),
          owner: formData.assignee || formData.owner,
          due: formData.due.trim(),
          status: 'To Do',
          sprintId: formData.sprintId || undefined,
          epicId: formData.epicId || undefined,
        })
      } else if (entityType === 'Requirement') {
        created = await addRequirement({
          ...common,
          description: formData.description,
          acceptanceCriteria: formData.acceptanceCriteria,
          owner: formData.assignee || formData.owner,
          status: 'Draft',
        })
      } else if (entityType === 'TestCase') {
        created = await addTestCase({
          ...common,
          description: formData.description,
          type: formData.type,
          owner: formData.assignee || formData.owner,
          preconditions: formData.preconditions,
          suiteId: formData.suiteId || null,
          steps: formData.steps.split('\n').map((step) => step.trim()).filter(Boolean).map((step) => ({ action: step, expected: 'Verify expected behavior' })),
        })
      } else {
        created = await addBug({
          ...common,
          description: formData.description,
          stepsToReproduce: formData.stepsToReproduce,
          expectedBehavior: formData.expectedBehavior,
          actualBehavior: formData.actualBehavior,
          severity: formData.severity,
          reporter: formData.owner,
          assignee: formData.assignee,
          environment: formData.environment,
        })
      }
      if (!created) return

      reset()
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  const assigneeOptions = [...new Set([...teamUsers.map((member) => member.name), formData.owner].filter(Boolean))]

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/70 p-4 py-8 animate-fade-in"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) onClose()
      }}
    >
      <div
        id="create-issue-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-issue-title"
        className="w-full max-w-2xl overflow-hidden rounded-lg border border-qf-border bg-qf-surface shadow-lift"
      >
        <div className="flex items-center justify-between border-b border-qf-border px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-qf-primary/15 text-qf-primary">
              <CheckCircle2 size={16} />
            </span>
            <div>
              <h2 id="create-issue-title" className="text-sm font-semibold text-qf-text">Create work item</h2>
              <p className="mt-0.5 text-[11px] text-qf-muted">Add an issue, defect, test case, or requirement.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} disabled={isSubmitting} aria-label="Close dialog" className="rounded p-1 text-qf-muted hover:bg-qf-card hover:text-qf-text">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div>
            <span className="mb-1.5 block text-xs font-medium text-qf-secondary">Type</span>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              {typeOptions.map((option) => {
                const Icon = option.icon
                const active = entityType === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setEntityType(option.value)}
                    className={`flex items-center justify-center gap-1.5 rounded-md border px-2 py-2 text-xs font-medium transition ${
                      active ? 'border-qf-primary/60 bg-qf-primary/15 text-qf-text' : 'border-qf-border bg-qf-card text-qf-secondary hover:text-qf-text'
                    }`}
                  >
                    <Icon size={13} className={active ? 'text-qf-primary' : 'text-qf-muted'} />
                    {option.label}
                  </button>
                )
              })}
            </div>
          </div>

          <Field label="Summary" htmlFor="title" required>
            <input
              id="title"
              name="title"
              ref={titleInputRef}
              value={formData.title}
              onChange={handleChange}
              maxLength={240}
              placeholder={entityType === 'Bug' ? 'Describe the defect in one line' : `Enter ${entityType === 'TestCase' ? 'test case' : entityType.toLowerCase()} summary`}
              className="input-field"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Project" htmlFor="projectKey">
              <select id="projectKey" name="projectKey" value={formData.projectKey} onChange={handleChange} className="input-field">
                {projects.map((project) => <option key={project.key} value={project.key}>{project.key} · {project.name}</option>)}
              </select>
            </Field>
            <Field label={entityType === 'Bug' ? 'Assignee' : 'Owner / assignee'} htmlFor="assignee">
              <select id="assignee" name="assignee" value={formData.assignee} onChange={handleChange} className="input-field">
                <option value="">{user?.name ? `${user.name} (me)` : 'Unassigned'}</option>
                {assigneeOptions.map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Description" htmlFor="description">
            <textarea id="description" name="description" rows={3} value={formData.description} onChange={handleChange} placeholder="Context, expected behavior, or acceptance notes" className="input-field resize-y" />
          </Field>

          {entityType === 'Bug' && (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Severity" htmlFor="severity">
                  <select id="severity" name="severity" value={formData.severity} onChange={handleChange} className="input-field">
                    {['Blocker', 'Critical', 'Major', 'Minor', 'Trivial'].map((value) => <option key={value}>{value}</option>)}
                  </select>
                </Field>
                <Field label="Priority" htmlFor="priority">
                  <select id="priority" name="priority" value={formData.priority} onChange={handleChange} className="input-field">
                    {['Critical', 'High', 'Medium', 'Low'].map((value) => <option key={value}>{value}</option>)}
                  </select>
                </Field>
                <Field label="Environment" htmlFor="environment">
                  <select id="environment" name="environment" value={formData.environment} onChange={handleChange} className="input-field">
                    {['Dev', 'Staging', 'Production'].map((value) => <option key={value}>{value}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Steps to reproduce" htmlFor="stepsToReproduce" hint="One step per line.">
                <textarea id="stepsToReproduce" name="stepsToReproduce" rows={3} value={formData.stepsToReproduce} onChange={handleChange} placeholder={'1. Open the checkout page\n2. Submit an expired card'} className="input-field resize-y" />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Expected result" htmlFor="expectedBehavior">
                  <textarea id="expectedBehavior" name="expectedBehavior" rows={2} value={formData.expectedBehavior} onChange={handleChange} className="input-field resize-y" />
                </Field>
                <Field label="Actual result" htmlFor="actualBehavior">
                  <textarea id="actualBehavior" name="actualBehavior" rows={2} value={formData.actualBehavior} onChange={handleChange} className="input-field resize-y" />
                </Field>
              </div>
            </>
          )}

          {entityType === 'TestCase' && (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Test type" htmlFor="type">
                  <select id="type" name="type" value={formData.type} onChange={handleChange} className="input-field">
                    {['Functional', 'Regression', 'Smoke', 'Security', 'Performance', 'Integration'].map((value) => <option key={value}>{value}</option>)}
                  </select>
                </Field>
                <Field label="Priority" htmlFor="priority">
                  <select id="priority" name="priority" value={formData.priority} onChange={handleChange} className="input-field">
                    {['Critical', 'High', 'Medium', 'Low'].map((value) => <option key={value}>{value}</option>)}
                  </select>
                </Field>
                <Field label="Suite" htmlFor="suiteId">
                  <select id="suiteId" name="suiteId" value={formData.suiteId} onChange={handleChange} className="input-field">
                    <option value="">No suite</option>
                    {projectSuites.map((suite) => <option key={suite.id} value={suite.id}>{suite.name}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Preconditions" htmlFor="preconditions">
                <textarea id="preconditions" name="preconditions" rows={2} value={formData.preconditions} onChange={handleChange} className="input-field resize-y" />
              </Field>
              <Field label="Test steps" htmlFor="steps" hint="One step per line. You can refine expected results in the test case later.">
                <textarea id="steps" name="steps" rows={4} value={formData.steps} onChange={handleChange} placeholder={'Navigate to /login\nEnter valid credentials\nVerify dashboard loads'} className="input-field resize-y" />
              </Field>
            </>
          )}

          {entityType === 'Requirement' && (
            <Field label="Acceptance criteria" htmlFor="acceptanceCriteria">
              <textarea id="acceptanceCriteria" name="acceptanceCriteria" rows={3} value={formData.acceptanceCriteria} onChange={handleChange} className="input-field resize-y" />
            </Field>
          )}

          {entityType === 'Task' && (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Priority" htmlFor="priority">
                  <select id="priority" name="priority" value={formData.priority} onChange={handleChange} className="input-field">
                    {['Critical', 'High', 'Medium', 'Low'].map((value) => <option key={value}>{value}</option>)}
                  </select>
                </Field>
                <Field label="Sprint" htmlFor="sprintId">
                  <select id="sprintId" name="sprintId" value={formData.sprintId} onChange={handleChange} className="input-field">
                    <option value="">Backlog</option>
                    {projectSprints.map((sprint) => <option key={sprint.id} value={sprint.id}>{sprint.name}</option>)}
                  </select>
                </Field>
                <Field label="Epic" htmlFor="epicId">
                  <select id="epicId" name="epicId" value={formData.epicId} onChange={handleChange} className="input-field">
                    <option value="">No epic</option>
                    {projectEpics.map((epic) => <option key={epic.id} value={epic.id}>{epic.title}</option>)}
                  </select>
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Due date" htmlFor="due">
                  <input id="due" name="due" type="date" value={formData.due} onChange={handleChange} className="input-field" />
                </Field>
                <Field label="Labels" htmlFor="labels" hint="Comma separated.">
                  <input id="labels" name="labels" value={formData.labels} onChange={handleChange} placeholder="regression, release" className="input-field" />
                </Field>
              </div>
            </>
          )}

          {entityType === 'Requirement' && (
            <Field label="Labels" htmlFor="labels" hint="Comma separated.">
              <input id="labels" name="labels" value={formData.labels} onChange={handleChange} placeholder="compliance, security" className="input-field" />
            </Field>
          )}

          <div className="flex items-center justify-end gap-2 border-t border-qf-border pt-4">
            {validationError && <p className="mr-auto text-xs text-qf-danger" role="alert">{validationError}</p>}
            <button type="button" onClick={onClose} disabled={isSubmitting} className="btn-ghost text-xs">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary text-xs">
              {isSubmitting ? 'Creating…' : `Create ${entityType === 'TestCase' ? 'test case' : entityType.toLowerCase()}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateModal
