import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { AlertOctagon, CheckCircle2, Download, FileBarChart, ShieldCheck, Target, TrendingUp } from 'lucide-react'
import {
  Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import MainLayout from '../components/layout/MainLayout'
import PageHeader from '../components/ui/PageHeader'
import MetricCard from '../components/ui/MetricCard'
import EmptyState from '../components/ui/EmptyState'
import { Badge, ResultBadge } from '../components/ui/Badges'
import { useQA } from '../context/useQA'
import { belongsToProject } from '../utils/projectScope'

const tooltipStyle = {
  backgroundColor: '#1C1F2A',
  border: '1px solid #303443',
  borderRadius: '8px',
  color: '#F0F1F5',
  fontSize: '12px',
}

const resultColors = {
  Passed: '#35B77A',
  Failed: '#F06B70',
  Blocked: '#E7A94B',
  Skipped: '#777E90',
  'Not Run': '#3B4053',
  Pending: '#3B4053',
}

const csvCell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`

const ReportsPage = () => {
  const { testCases, testRuns, bugs, requirements, tasks, selectedProjectKey, showToast } = useQA()

  const projectTests = useMemo(() => testCases.filter((item) => belongsToProject(item, selectedProjectKey)), [selectedProjectKey, testCases])
  const projectRuns = useMemo(() => testRuns.filter((item) => belongsToProject(item, selectedProjectKey)), [selectedProjectKey, testRuns])
  const projectBugs = useMemo(() => bugs.filter((item) => belongsToProject(item, selectedProjectKey)), [selectedProjectKey, bugs])
  const projectRequirements = useMemo(() => requirements.filter((item) => belongsToProject(item, selectedProjectKey)), [selectedProjectKey, requirements])
  const projectTasks = useMemo(() => tasks.filter((item) => belongsToProject(item, selectedProjectKey)), [selectedProjectKey, tasks])

  const metrics = useMemo(() => {
    const passed = projectTests.filter((test) => test.lastResult === 'Passed').length
    const failed = projectTests.filter((test) => test.lastResult === 'Failed').length
    const executed = projectTests.filter((test) => ['Passed', 'Failed', 'Blocked', 'Skipped'].includes(test.lastResult)).length
    const covered = projectRequirements.filter((requirement) => projectTests.some((test) => (test.requirementIds || []).includes(requirement.id))).length
    const active = projectBugs.filter((bug) => !['Closed', 'Resolved'].includes(bug.status))
    const resolved = projectBugs.filter((bug) => ['Closed', 'Resolved', 'Verified'].includes(bug.status))
    return {
      passed,
      failed,
      executed,
      passRate: projectTests.length ? Math.round((passed / projectTests.length) * 100) : 0,
      completion: projectTests.length ? Math.round((executed / projectTests.length) * 100) : 0,
      coverage: projectRequirements.length ? Math.round((covered / projectRequirements.length) * 100) : 0,
      covered,
      activeDefects: active.length,
      resolvedDefects: resolved.length,
      openTasks: projectTasks.filter((task) => task.status !== 'Done').length,
    }
  }, [projectBugs, projectRequirements, projectTasks, projectTests])

  const outcomeData = useMemo(() => ['Passed', 'Failed', 'Blocked', 'Skipped', 'Not Run'].map((name) => ({
    name,
    value: name === 'Not Run'
      ? projectTests.filter((test) => !['Passed', 'Failed', 'Blocked', 'Skipped'].includes(test.lastResult)).length
      : projectTests.filter((test) => test.lastResult === name).length,
  })).filter((entry) => entry.value > 0), [projectTests])

  const severityData = useMemo(() => ['Blocker', 'Critical', 'Major', 'Minor', 'Trivial'].map((severity) => ({
    severity,
    open: projectBugs.filter((bug) => bug.severity === severity && !['Closed', 'Resolved'].includes(bug.status)).length,
    closed: projectBugs.filter((bug) => bug.severity === severity && ['Closed', 'Resolved'].includes(bug.status)).length,
  })), [projectBugs])

  const coverageRows = useMemo(() => projectRequirements.map((requirement) => {
    const tests = projectTests.filter((test) => (test.requirementIds || []).includes(requirement.id))
    return {
      ...requirement,
      tests,
      passed: tests.filter((test) => test.lastResult === 'Passed').length,
      failed: tests.filter((test) => test.lastResult === 'Failed').length,
    }
  }), [projectRequirements, projectTests])

  const exportReport = () => {
    const rows = [
      ['QAForge quality report', selectedProjectKey],
      ['Generated', new Date().toISOString()],
      [],
      ['Metric', 'Value'],
      ['Test pass rate', `${metrics.passRate}%`],
      ['Execution completion', `${metrics.completion}%`],
      ['Requirement coverage', `${metrics.coverage}%`],
      ['Active defects', metrics.activeDefects],
      ['Resolved defects', metrics.resolvedDefects],
      ['Open issues', metrics.openTasks],
      [],
      ['Requirement', 'Title', 'Status', 'Priority', 'Linked tests', 'Passed', 'Failed'],
      ...coverageRows.map((row) => [row.id, row.title, row.status, row.priority, row.tests.length, row.passed, row.failed]),
      [],
      ['Test case', 'Title', 'Type', 'Last result'],
      ...projectTests.map((test) => [test.id, test.title, test.type, test.lastResult]),
    ]
    const csv = rows.map((row) => row.map(csvCell).join(',')).join('\n')
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `qaforge-${selectedProjectKey}-report-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    showToast('Exported quality report to CSV')
  }

  const recentRuns = projectRuns
    .filter((run) => Array.isArray(run.cases) && run.cases.length)
    .slice(0, 5)

  return (
    <MainLayout>
      <div className="flex flex-col gap-5">
        <PageHeader
          eyebrow={`${selectedProjectKey} · Analytics`}
          title="Quality reports"
          description="Test outcomes, defect trends, and requirement coverage computed from current project data."
          actions={<button type="button" onClick={exportReport} className="btn-ghost text-xs"><Download size={14} /> Export CSV</button>}
          meta={(
            <>
              <span>{projectTests.length} test cases</span>
              <span className="text-qf-border-strong">•</span>
              <span>{projectRuns.length} test runs</span>
              <span className="text-qf-border-strong">•</span>
              <span>{projectBugs.length} defects</span>
            </>
          )}
        />

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Pass rate" value={`${metrics.passRate}%`} icon={TrendingUp} tone="success" hint={`${metrics.passed} of ${projectTests.length} test cases`} />
          <MetricCard label="Execution completion" value={`${metrics.completion}%`} icon={CheckCircle2} tone="primary" hint={`${metrics.executed} of ${projectTests.length} cases have results`} />
          <MetricCard label="Requirement coverage" value={`${metrics.coverage}%`} icon={ShieldCheck} hint={`${metrics.covered} of ${projectRequirements.length} requirements linked to tests`} />
          <MetricCard label="Active defects" value={metrics.activeDefects} icon={AlertOctagon} tone="danger" hint={`${metrics.resolvedDefects} resolved or closed`} />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-lg border border-qf-border bg-qf-surface p-5">
            <h2 className="text-sm font-semibold text-qf-text">Test execution outcomes</h2>
            <p className="mt-1 text-xs text-qf-muted">Latest recorded result for every test case.</p>
            {outcomeData.length ? (
              <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row">
                <div className="h-52 w-52 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={outcomeData} dataKey="value" innerRadius={58} outerRadius={84} paddingAngle={3} stroke="none">
                        {outcomeData.map((entry) => <Cell key={entry.name} fill={resultColors[entry.name] || '#777E90'} />)}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="w-full flex-1 space-y-2 text-xs">
                  {outcomeData.map((entry) => (
                    <li key={entry.name} className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 text-qf-secondary"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: resultColors[entry.name] || '#777E90' }} />{entry.name}</span>
                      <span className="tabular-nums text-qf-text">{entry.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="mt-4"><EmptyState compact icon={FileBarChart} title="No test results" description="Execute tests to populate this report." /></div>
            )}
          </section>

          <section className="rounded-lg border border-qf-border bg-qf-surface p-5">
            <h2 className="text-sm font-semibold text-qf-text">Defects by severity</h2>
            <p className="mt-1 text-xs text-qf-muted">Open versus resolved defects.</p>
            <div className="mt-4 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={severityData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                  <CartesianGrid stroke="#303443" strokeDasharray="3 4" vertical={false} />
                  <XAxis dataKey="severity" stroke="#777E90" tickLine={false} axisLine={false} fontSize={10} />
                  <YAxis allowDecimals={false} stroke="#777E90" tickLine={false} axisLine={false} fontSize={11} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="open" name="Open" stackId="a" fill="#F06B70" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="closed" name="Resolved" stackId="a" fill="#35B77A" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>

        <section className="rounded-lg border border-qf-border bg-qf-surface">
          <div className="flex items-center justify-between border-b border-qf-border px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold text-qf-text">Requirement coverage</h2>
              <p className="mt-0.5 text-xs text-qf-muted">Every requirement and the tests that validate it.</p>
            </div>
            <Link to="/traceability" className="text-xs text-qf-primary hover:underline">Traceability matrix</Link>
          </div>
          {coverageRows.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-xs">
                <thead className="bg-qf-card/50 text-[11px] uppercase tracking-wider text-qf-muted">
                  <tr>
                    <th className="px-4 py-3 font-medium">Requirement</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Linked tests</th>
                    <th className="px-4 py-3 font-medium">Passing</th>
                    <th className="px-4 py-3 font-medium">Failing</th>
                    <th className="px-4 py-3 font-medium">Coverage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-qf-border">
                  {coverageRows.map((row) => (
                    <tr key={row.id} className="transition hover:bg-qf-card/40">
                      <td className="px-4 py-3">
                        <Link to={`/issues/${row.id}`} className="font-mono text-qf-info hover:underline">{row.id}</Link>
                        <span className="ml-2 text-qf-secondary">{row.title}</span>
                      </td>
                      <td className="px-4 py-3"><Badge tone="muted">{row.status}</Badge></td>
                      <td className="px-4 py-3 text-qf-secondary">{row.tests.length}</td>
                      <td className="px-4 py-3 text-qf-success">{row.passed}</td>
                      <td className="px-4 py-3 text-qf-danger">{row.failed}</td>
                      <td className="px-4 py-3">
                        {row.tests.length === 0
                          ? <Badge tone="gray">Not covered</Badge>
                          : row.failed > 0
                            ? <ResultBadge result="Failed" />
                            : <ResultBadge result="Passed" />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-4"><EmptyState compact icon={Target} title="No requirements" description="Add requirements and link test cases to measure coverage." /></div>
          )}
        </section>

        {recentRuns.length > 0 && (
          <section className="rounded-lg border border-qf-border bg-qf-surface">
            <div className="flex items-center justify-between border-b border-qf-border px-4 py-3">
              <h2 className="text-sm font-semibold text-qf-text">Recent test runs</h2>
              <Link to="/test-runs" className="text-xs text-qf-primary hover:underline">All test runs</Link>
            </div>
            <ul className="divide-y divide-qf-border">
              {recentRuns.map((run) => (
                <li key={run.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-xs">
                  <Link to={`/test-runs/${run.id}`} className="font-mono font-semibold text-qf-info hover:underline">{run.id}</Link>
                  <Link to={`/test-runs/${run.id}`} className="min-w-0 flex-1 truncate text-qf-text">{run.name}</Link>
                  <span className="text-qf-success">{run.passed || 0} passed</span>
                  <span className="text-qf-danger">{run.failed || 0} failed</span>
                  <Badge tone={run.status === 'Completed' ? 'green' : run.status === 'In Progress' ? 'amber' : 'gray'}>{run.status}</Badge>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </MainLayout>
  )
}

export default ReportsPage
