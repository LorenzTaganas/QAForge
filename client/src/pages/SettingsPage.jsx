import React, { useState } from 'react'
import MainLayout from '../components/layout/MainLayout'
import { Save, Users, Bell, Shield, Sliders } from 'lucide-react'
import { useQA } from '../context/useQA'

const SettingsPage = () => {
  const { projectSettings, updateProjectSettings, showToast } = useQA()
  const [draftSettings, setDraftSettings] = useState(projectSettings)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setDraftSettings((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSave = (e) => {
    e.preventDefault()
    const trimmedSettings = {
      ...draftSettings,
      name: draftSettings.name.trim(),
      key: draftSettings.key.trim().toUpperCase(),
      slackWebhook: draftSettings.slackWebhook.trim(),
    }

    if (!trimmedSettings.name || !trimmedSettings.key) {
      showToast('Project name and key are required')
      return
    }

    updateProjectSettings(trimmedSettings)
    showToast('Project settings saved successfully')
  }

  return (
    <MainLayout>
      <div className="flex flex-col gap-6 max-w-4xl">
        {/* Page Header */}
        <div className="flex flex-col gap-4 border-b border-jira-border pb-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-jira-muted">
              Administration / Project Config
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">
              Project Settings
            </h1>
          </div>

          <button
            onClick={handleSave}
            className="btn-primary text-xs"
          >
            <Save size={14} />
            Save Changes
          </button>
        </div>

        {/* General Project Settings */}
        <div className="rounded-xl border border-jira-border bg-jira-surface p-6 shadow-card space-y-4">
          <div className="flex items-center gap-2 border-b border-jira-border pb-3">
            <Sliders size={16} className="text-jira-blue" />
            <h3 className="text-sm font-bold text-white">General Information</h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-jira-text" htmlFor="name">
                Project Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={draftSettings.name}
                onChange={handleChange}
                className="input-field text-xs"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-jira-text" htmlFor="key">
                Project Key (Jira prefix)
              </label>
              <input
                id="key"
                name="key"
                type="text"
                value={draftSettings.key}
                onChange={handleChange}
                className="input-field text-xs uppercase"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-jira-text" htmlFor="defaultEnv">
              Default Target Environment
            </label>
            <select
              id="defaultEnv"
              name="defaultEnv"
              value={draftSettings.defaultEnv}
              onChange={handleChange}
              className="input-field text-xs sm:w-1/2"
            >
              <option value="Dev">Development (Dev)</option>
              <option value="Staging">Staging (Pre-Prod)</option>
              <option value="Production">Production</option>
            </select>
          </div>
        </div>

        {/* Team Members */}
        <div className="rounded-xl border border-jira-border bg-jira-surface p-6 shadow-card space-y-4">
          <div className="flex items-center gap-2 border-b border-jira-border pb-3">
            <Users size={16} className="text-jira-blue" />
            <h3 className="text-sm font-bold text-white">Authorized Team Roles</h3>
          </div>

          <div className="space-y-2">
            {[
              { name: 'Lorenz Taganas', email: 'qa@qaforge.local', role: 'QA Tester', access: 'Admin' },
              { name: 'Maria Santos', email: 'lead@qaforge.local', role: 'QA Lead', access: 'Maintainer' },
              { name: 'John Cruz', email: 'developer@qaforge.local', role: 'Developer', access: 'Contributor' },
              { name: 'Mark Reyes', email: 'manager@qaforge.local', role: 'Project Manager', access: 'Viewer' },
            ].map((member, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-lg border border-jira-border bg-jira-surface-2 p-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-jira-surface-3 font-bold text-white">
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <span className="font-semibold text-white block">{member.name}</span>
                    <span className="text-[11px] text-jira-muted">{member.email}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="rounded bg-jira-bg px-2 py-0.5 text-[10px] font-medium text-jira-muted border border-jira-border">
                    {member.role}
                  </span>
                  <span className="font-semibold text-jira-blue">{member.access}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notification & Integration Settings */}
        <div className="rounded-xl border border-jira-border bg-jira-surface p-6 shadow-card space-y-4">
          <div className="flex items-center gap-2 border-b border-jira-border pb-3">
            <Bell size={16} className="text-jira-blue" />
            <h3 className="text-sm font-bold text-white">Integration & Notifications</h3>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-3 text-xs text-jira-text cursor-pointer">
              <input
                type="checkbox"
                name="notifyOnFailure"
                checked={draftSettings.notifyOnFailure}
                onChange={handleChange}
                className="h-4 w-4 rounded border-jira-border bg-jira-bg text-jira-blue focus:ring-0"
              />
              <span>Trigger instant notification upon Test Run suite failure</span>
            </label>

            <label className="flex items-center gap-3 text-xs text-jira-text cursor-pointer">
              <input
                type="checkbox"
                name="autoCloseDefects"
                checked={draftSettings.autoCloseDefects}
                onChange={handleChange}
                className="h-4 w-4 rounded border-jira-border bg-jira-bg text-jira-blue focus:ring-0"
              />
              <span>Automatically close defect when associated test case passes twice</span>
            </label>

            <div className="pt-2">
              <label className="mb-1.5 block text-xs font-medium text-jira-text" htmlFor="slackWebhook">
                Slack webhook URL <span className="font-normal text-jira-muted">(optional)</span>
              </label>
              <input
                id="slackWebhook"
                name="slackWebhook"
                type="url"
                value={draftSettings.slackWebhook}
                onChange={handleChange}
                placeholder="https://hooks.slack.com/services/..."
                className="input-field text-xs"
              />
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

export default SettingsPage
