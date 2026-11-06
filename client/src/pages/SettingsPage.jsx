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
      <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 border-b border-[#2B416C] pb-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#00F0FF]">
              Administration / Project Config
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">
              Project Settings
            </h1>
          </div>

          <button
            onClick={handleSave}
            className="btn-primary text-xs shrink-0"
          >
            <Save size={14} />
            Save Changes
          </button>
        </div>

        {/* General Project Settings */}
        <div className="rounded-xl border border-[#2B416C] bg-[#101726]/85 backdrop-blur-md p-6 shadow-[0_12px_40px_rgba(0,0,0,0.5)] space-y-4">
          <div className="flex items-center gap-2 border-b border-[#233352] pb-3">
            <Sliders size={16} className="text-[#00F0FF]" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">General Information</h3>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#DDE5F2]" htmlFor="name">
                Project Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={draftSettings.name}
                onChange={handleChange}
                className="input-field text-xs w-full"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#DDE5F2]" htmlFor="key">
                Project Key (Prefix)
              </label>
              <input
                id="key"
                name="key"
                type="text"
                value={draftSettings.key}
                onChange={handleChange}
                className="input-field text-xs uppercase font-mono text-[#00F0FF] w-full"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#DDE5F2]" htmlFor="defaultEnv">
              Default Target Environment
            </label>
            <select
              id="defaultEnv"
              name="defaultEnv"
              value={draftSettings.defaultEnv}
              onChange={handleChange}
              className="input-field text-xs sm:w-1/2 w-full"
            >
              <option value="Dev">Development (Dev)</option>
              <option value="Staging">Staging (Pre-Prod)</option>
              <option value="Production">Production</option>
            </select>
          </div>
        </div>

        {/* Team Members */}
        <div className="rounded-xl border border-[#2B416C] bg-[#101726]/85 backdrop-blur-md p-6 shadow-[0_12px_40px_rgba(0,0,0,0.5)] space-y-4">
          <div className="flex items-center gap-2 border-b border-[#233352] pb-3">
            <Users size={16} className="text-[#00F0FF]" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Authorized Team Roles</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { name: 'Lorenz Taganas', email: 'qa@qaforge.local', role: 'QA Tester', access: 'Admin' },
              { name: 'Maria Santos', email: 'lead@qaforge.local', role: 'QA Lead', access: 'Maintainer' },
              { name: 'John Cruz', email: 'developer@qaforge.local', role: 'Developer', access: 'Contributor' },
              { name: 'Mark Reyes', email: 'manager@qaforge.local', role: 'Project Manager', access: 'Viewer' },
            ].map((member, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-xl border border-[#2B416C] bg-[#172138]/80 p-3 text-xs shadow-sm hover:border-[#00F0FF]/40 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00F0FF]/20 text-[#00F0FF] font-bold border border-[#00F0FF]/40 shadow-[0_0_10px_rgba(0,240,255,0.15)]">
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <span className="font-semibold text-white block">{member.name}</span>
                    <span className="text-[11px] text-[#8B97A9]">{member.email}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="rounded-md bg-[#070B14] px-2 py-1 text-[10px] font-medium text-[#8B97A9] border border-[#2B416C]">
                    {member.role}
                  </span>
                  <span className="font-semibold text-[#00F0FF]">{member.access}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notification & Integration Settings */}
        <div className="rounded-xl border border-[#2B416C] bg-[#101726]/85 backdrop-blur-md p-6 shadow-[0_12px_40px_rgba(0,0,0,0.5)] space-y-4">
          <div className="flex items-center gap-2 border-b border-[#233352] pb-3">
            <Bell size={16} className="text-[#00F0FF]" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Integration & Notifications</h3>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-3 text-xs text-[#DDE5F2] cursor-pointer hover:text-white transition">
              <input
                type="checkbox"
                name="notifyOnFailure"
                checked={draftSettings.notifyOnFailure}
                onChange={handleChange}
                className="h-4 w-4 rounded border-[#2B416C] bg-[#070B14] text-[#00F0FF] focus:ring-0 accent-[#00F0FF]"
              />
              <span>Trigger instant notification upon Test Run suite failure</span>
            </label>

            <label className="flex items-center gap-3 text-xs text-[#DDE5F2] cursor-pointer hover:text-white transition">
              <input
                type="checkbox"
                name="autoCloseDefects"
                checked={draftSettings.autoCloseDefects}
                onChange={handleChange}
                className="h-4 w-4 rounded border-[#2B416C] bg-[#070B14] text-[#00F0FF] focus:ring-0 accent-[#00F0FF]"
              />
              <span>Automatically close defect when associated test case passes twice</span>
            </label>

            <div className="pt-2">
              <label className="mb-1.5 block text-xs font-medium text-[#DDE5F2]" htmlFor="slackWebhook">
                Slack webhook URL <span className="font-normal text-[#8B97A9]">(optional)</span>
              </label>
              <input
                id="slackWebhook"
                name="slackWebhook"
                type="url"
                value={draftSettings.slackWebhook}
                onChange={handleChange}
                placeholder="https://hooks.slack.com/services/..."
                className="input-field text-xs w-full"
              />
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

export default SettingsPage
