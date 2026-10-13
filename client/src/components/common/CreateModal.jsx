import React, { useState } from 'react'
import { X, CheckCircle, FileText, CheckSquare, Bug } from 'lucide-react'
import { useQA } from '../../context/QAContext'
import { useAuth } from '../../context/AuthContext'

const CreateModal = ({ isOpen, onClose }) => {
  const { addTask, addRequirement, addTestCase, addBug, projects, sprints, epics } = useQA()
  const { user } = useAuth()
  const [entityType, setEntityType] = useState('Task')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'High',
    severity: 'Major',
    type: 'Functional',
    owner: user?.name || 'QA Tester',
    assignee: 'Developer',
    due: 'Oct 30, 2026',
    environment: 'Staging',
    projectKey: 'QAR',
    sprintId: '',
    epicId: '',
    labels: '',
  })

  if (!isOpen) return null

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.title.trim()) return

    if (entityType === 'Task') {
      addTask({
        title: formData.title,
        priority: formData.priority,
        owner: formData.owner,
        due: formData.due,
        status: 'To Do',
        projectKey: formData.projectKey,
        sprintId: formData.sprintId || undefined,
        epicId: formData.epicId || undefined,
        labels: formData.labels.split(',').map((label) => label.trim()).filter(Boolean),
      })
    } else if (entityType === 'Requirement') {
      addRequirement({
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        owner: formData.owner,
        status: 'Draft',
        projectKey: formData.projectKey,
        labels: formData.labels.split(',').map((label) => label.trim()).filter(Boolean),
      })
    } else if (entityType === 'TestCase') {
      addTestCase({
        title: formData.title,
        type: formData.type,
        priority: formData.priority,
        owner: formData.owner,
        projectKey: formData.projectKey,
        requirementIds: [],
        labels: formData.labels.split(',').map((label) => label.trim()).filter(Boolean),
      })
    } else if (entityType === 'Bug') {
      addBug({
        title: formData.title,
        description: formData.description,
        severity: formData.severity,
        priority: formData.priority,
        reporter: formData.owner,
        assignee: formData.assignee,
        environment: formData.environment,
        projectKey: formData.projectKey,
        labels: formData.labels.split(',').map((label) => label.trim()).filter(Boolean),
      })
    }

    setFormData({
      title: '',
      description: '',
      priority: 'High',
      severity: 'Major',
      type: 'Functional',
      owner: user?.name || 'QA Tester',
      assignee: 'Developer',
      due: 'Oct 30, 2026',
      environment: 'Staging',
      projectKey: 'QAR',
      sprintId: '',
      epicId: '',
      labels: '',
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-lg rounded-xl border border-jira-border bg-jira-surface shadow-lift">
        <div className="flex items-center justify-between border-b border-jira-border px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-jira-blue/20 text-jira-blue">
              <CheckCircle size={16} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Create issue</h3>
              <p className="mt-0.5 text-[11px] text-jira-muted">Add work to your QA project</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-jira-muted hover:bg-jira-surface-2 hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-jira-muted">
              Issue Type
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                ['Task', 'Work item'],
                ['Requirement', 'Requirement'],
                ['TestCase', 'Test case'],
                ['Bug', 'Bug'],
              ].map(([type, label]) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setEntityType(type)}
                  className={`flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition border ${
                    entityType === type
                      ? 'bg-jira-blue/10 text-white border-jira-blue'
                      : 'border-jira-border bg-jira-surface-2 text-jira-text hover:bg-jira-surface-3'
                  }`}
                >
                  {type === 'Task' && <CheckCircle size={13} className="text-blue-400" />}
                  {type === 'Requirement' && <FileText size={13} className="text-amber-400" />}
                  {type === 'TestCase' && <CheckSquare size={13} className="text-emerald-400" />}
                  {type === 'Bug' && <Bug size={13} className="text-rose-400" />}
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-jira-text" htmlFor="title">
              Summary / Title <span className="text-red-400">*</span>
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              value={formData.title}
              onChange={handleChange}
              placeholder={`Enter ${entityType.toLowerCase()} summary...`}
              className="input-field text-xs"
            />
          </div>

          {(entityType === 'Requirement' || entityType === 'Bug') && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-jira-text" htmlFor="description">
                Description & Details
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                placeholder="Provide description, acceptance criteria, or steps to reproduce..."
                className="input-field text-xs resize-none"
              />
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-jira-text" htmlFor="projectKey">Project</label>
              <select id="projectKey" name="projectKey" value={formData.projectKey} onChange={handleChange} className="input-field text-xs">
                {projects.map((project) => <option key={project.key} value={project.key}>{project.key} · {project.name}</option>)}
              </select>
            </div>
            {(entityType === 'Task' || entityType === 'Bug') && (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-jira-text" htmlFor="labels">Labels</label>
                <input id="labels" name="labels" value={formData.labels} onChange={handleChange} placeholder="regression, release" className="input-field text-xs" />
              </div>
            )}
          </div>

          {(entityType === 'Task' || entityType === 'Bug') && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-jira-text" htmlFor="sprintId">Sprint</label>
                <select id="sprintId" name="sprintId" value={formData.sprintId} onChange={handleChange} className="input-field text-xs">
                  <option value="">Backlog / no sprint</option>
                  {sprints.map((sprint) => <option key={sprint.id} value={sprint.id}>{sprint.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-jira-text" htmlFor="epicId">Epic</label>
                <select id="epicId" name="epicId" value={formData.epicId} onChange={handleChange} className="input-field text-xs">
                  <option value="">No epic</option>
                  {epics.map((epic) => <option key={epic.id} value={epic.id}>{epic.title}</option>)}
                </select>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-jira-text" htmlFor="priority">
                Priority
              </label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="input-field text-xs"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            {entityType === 'Bug' ? (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-jira-text" htmlFor="severity">
                  Severity
                </label>
                <select
                  id="severity"
                  name="severity"
                  value={formData.severity}
                  onChange={handleChange}
                  className="input-field text-xs"
                >
                  <option value="Trivial">Trivial</option>
                  <option value="Minor">Minor</option>
                  <option value="Major">Major</option>
                  <option value="Critical">Critical</option>
                  <option value="Blocker">Blocker</option>
                </select>
              </div>
            ) : entityType === 'TestCase' ? (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-jira-text" htmlFor="type">
                  Test Type
                </label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="input-field text-xs"
                >
                  <option value="Functional">Functional</option>
                  <option value="Smoke">Smoke</option>
                  <option value="Regression">Regression</option>
                  <option value="Security">Security</option>
                  <option value="Performance">Performance</option>
                </select>
              </div>
            ) : (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-jira-text" htmlFor="owner">
                  Assignee / Owner
                </label>
                <input
                  id="owner"
                  name="owner"
                  type="text"
                  value={formData.owner}
                  onChange={handleChange}
                  className="input-field text-xs"
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-jira-border">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary text-xs"
            >
              Create {entityType}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateModal
