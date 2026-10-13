import React, { useMemo } from 'react'
import MainLayout from '../components/layout/MainLayout'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { ShieldCheck, TrendingUp, AlertOctagon, CheckCircle2 } from 'lucide-react'
import { useQA } from '../context/QAContext'
import { belongsToProject } from '../utils/projectScope'

const COLORS = ['#10b981', '#ef4444', '#64748b'] // Passed, Failed, Pending

const ReportsPage = () => {
  const { testCases, bugs, requirements, selectedProjectKey } = useQA()
  const projectTestCases = testCases.filter((testCase) => belongsToProject(testCase, selectedProjectKey))
  const projectBugs = bugs.filter((bug) => belongsToProject(bug, selectedProjectKey))
  const projectRequirements = requirements.filter((requirement) => belongsToProject(requirement, selectedProjectKey))

  // Dynamic test status distribution for Pie Chart
  const testData = useMemo(() => {
    const passed = projectTestCases.filter((tc) => tc.lastResult === 'Passed').length
    const failed = projectTestCases.filter((tc) => tc.lastResult === 'Failed').length
    const pending = projectTestCases.filter((tc) => tc.lastResult === 'Pending').length
    return [
      { name: 'Passed', value: passed },
      { name: 'Failed', value: failed },
      { name: 'Pending', value: pending },
    ]
  }, [projectTestCases])

  // Defect severity distribution for Bar Chart
  const defectData = useMemo(() => {
    return [
      { severity: 'Blocker', count: projectBugs.filter((b) => b.severity === 'Blocker').length },
      { severity: 'Critical', count: projectBugs.filter((b) => b.severity === 'Critical').length },
      { severity: 'Major', count: projectBugs.filter((b) => b.severity === 'Major').length },
      { severity: 'Minor', count: projectBugs.filter((b) => b.severity === 'Minor').length },
    ]
  }, [projectBugs])

  const totalRuns = projectTestCases.length
  const passedRuns = projectTestCases.filter((t) => t.lastResult === 'Passed').length
  const passRate = totalRuns > 0 ? Math.round((passedRuns / totalRuns) * 100) : 0

  const approvedReqs = projectRequirements.filter((r) => r.status === 'Approved').length
  const reqCoverage = projectRequirements.length > 0 ? Math.round((approvedReqs / projectRequirements.length) * 100) : 0

  return (
    <MainLayout>
      <div className="flex flex-col gap-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 border-b border-jira-border pb-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-jira-muted">
              Quality Assurance / Analytics
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">
              Release Quality & QA Metrics
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
              Release Health: 92% Ready
            </span>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="stat-card">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-jira-muted">Pass Rate</span>
              <TrendingUp size={16} className="text-emerald-400" />
            </div>
            <div className="mt-2 text-3xl font-bold text-emerald-400">{passRate}%</div>
            <p className="mt-1 text-[11px] text-jira-muted">{passedRuns} of {totalRuns} tests passing</p>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-jira-muted">Req Coverage</span>
              <ShieldCheck size={16} className="text-jira-blue" />
            </div>
            <div className="mt-2 text-3xl font-bold text-blue-400">{reqCoverage}%</div>
            <p className="mt-1 text-[11px] text-jira-muted">{approvedReqs} of {requirements.length} approved</p>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-jira-muted">Active Defects</span>
              <AlertOctagon size={16} className="text-red-400" />
            </div>
            <div className="mt-2 text-3xl font-bold text-red-400">
              {projectBugs.filter((b) => b.status !== 'Closed').length}
            </div>
            <p className="mt-1 text-[11px] text-jira-muted">Triage priority active</p>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-jira-muted">Resolved Bugs</span>
              <CheckCircle2 size={16} className="text-purple-400" />
            </div>
            <div className="mt-2 text-3xl font-bold text-purple-400">
              {projectBugs.filter((b) => b.status === 'Resolved' || b.status === 'Closed').length}
            </div>
            <p className="mt-1 text-[11px] text-jira-muted">Verified & closed defects</p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Test Outcomes Chart */}
          <div className="rounded-xl border border-jira-border bg-jira-surface p-5 shadow-card">
            <h3 className="text-sm font-bold text-white mb-1">Test Execution Outcomes</h3>
            <p className="text-xs text-jira-muted mb-4">Live breakdown of test suite run statuses</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={testData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {testData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1B1F23',
                      borderColor: '#2D333B',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex justify-center gap-6 text-xs">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-emerald-500" />
                <span className="text-jira-text">Passed ({testData[0].value})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500" />
                <span className="text-jira-text">Failed ({testData[1].value})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-slate-500" />
                <span className="text-jira-text">Pending ({testData[2].value})</span>
              </div>
            </div>
          </div>

          {/* Defect Severity Chart */}
          <div className="rounded-xl border border-jira-border bg-jira-surface p-5 shadow-card">
            <h3 className="text-sm font-bold text-white mb-1">Defects by Severity</h3>
            <p className="text-xs text-jira-muted mb-4">Distribution of reported issues across critical levels</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={defectData}>
                  <XAxis dataKey="severity" stroke="#8C9097" fontSize={11} />
                  <YAxis stroke="#8C9097" fontSize={11} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1B1F23',
                      borderColor: '#2D333B',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="count" fill="#0065FF" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

export default ReportsPage
