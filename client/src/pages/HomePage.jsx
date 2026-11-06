import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity, AlertTriangle, ArrowRight, BarChart3, CheckCircle2, Clock3,
  FileText, Layers3, ListTodo, PlayCircle, ShieldCheck, Target, TrendingUp,
} from 'lucide-react'
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import MainLayout from '../components/layout/MainLayout'
import PageHeader from '../components/ui/PageHeader'
import MetricCard from '../components/ui/MetricCard'
import EmptyState from '../components/ui/EmptyState'
import { Badge, IssueTypeIcon, PriorityBadge, ResultBadge, SeverityBadge, StatusBadge } from '../components/ui/Badges'
import { useQA } from '../context/useQA'
import { useAuth } from '../context/AuthContext'
import { belongsToProject } from '../utils/projectScope'
import { getTimestamp, formatTimestamp } from '../utils/time'

const chartTooltipStyle = {
  backgroundColor: '#1C1F2A',
  border: '1px solid #303443',
  borderRadius: '8px',
  color: '#F0F1F5',
  fontSize: '12px',
}

const HomePage = () => {
  const {
    tasks, testCases, bugs, requirements, testRuns, activity, sprints,
    projects, selectedProjectKey, hydrating, openCreateModal,
  } = useQA()
  const { user } = useAuth()

  const project = projects.find((item) => item.key === selectedProjectKey)
  const projectTasks = useMemo(() => tasks.filter((item) => belongsToProject(item, selectedProjectKey)), [selectedProjectKey, tasks])
  const projectTests = useMemo(() => testCases.filter((item) => belongsToProject(item, selectedProjectKey)), [selectedProjectKey, testCases])
  const projectBugs = useMemo(() => bugs.filter((item) => belongsToProject(item, selectedProjectKey)), [selectedProjectKey, bugs])
  const projectRequirements = useMemo(() => requirements.filter((item) => belongsToProject(item, selectedProjectKey)), [selectedProjectKey, requirements])
  const projectRuns = useMemo(() => testRuns.filter((item) => belongsToProject(item, selectedProjectKey)), [selectedProjectKey, testRuns])
  const projectIssueIds = useMemo(
    () => new Set([...projectTasks, ...projectTests, ...projectBugs, ...projectRequirements].map((item) => item.id)),
    [projectTasks, projectTests, projectBugs, projectRequirements],
  )

  const metrics = useMemo(() => {
    const passed = projectTests.filter((test) => test.lastResult === 'Passed').length
    const failed = projectTests.filter((test) => test.lastResult === 'Failed').length
    const blocked = projectTests.filter((test) => ['Blocked', 'Skipped'].includes(test.lastResult)).length
    const notRun = projectTests.length - passed - failed - blocked
    const activeDefects = projectBugs.filter((bug) => !['Closed', 'Resolved'].includes(bug.status))
    const coveredRequirements = projectRequirements.filter((requirement) => projectTests.some((test) => (test.requirementIds || []).includes(requirement.id)))
    return {
      openIssues: projectTasks.filter((task) => task.status !== 'Done').length,
      activeDefects: activeDefects.length,
      criticalDefects: activeDefects.filter((bug) => ['Critical', 'Blocker'].includes(bug.severity)).length,
      passed,
      failed,
      blocked,
      notRun: Math.max(notRun, 0),
      passRate: projectTests.length ? Math.round((passed / projectTests.length) * 100) : 0,
      coverage: projectRequirements.length ? Math.round((coveredRequirements.length / projectRequirements.length) * 100) : 0,
      coveredRequirements: coveredRequirements.length,
      totalRequirements: projectRequirements.length,
      executed: passed + failed + blocked,
    }
  }, [projectBugs, projectRequirements, projectTasks, projectTests])

  const resultData = useMemo(() => [
    { name: 'Passed', value: metrics.passed, color: '#35B77A' },
    { name: 'Failed', value: metrics.failed, color: '#F06B70' },
    { name: 'Blocked / skipped', value: metrics.blocked, color: '#E7A94B' },
    { name: 'Not run', value: metrics.notRun, color: '#777E90' },
  ].filter((entry) => entry.value > 0), [metrics])

  const severityData = useMemo(() => ['Blocker', 'Critical', 'Major', 'Minor', 'Trivial'].map((severity) => ({
    severity,
    count: projectBugs.filter((bug) => bug.severity === severity && !['Closed', 'Resolved'].includes(bug.status)).length,
  })), [projectBugs])

  const runTrend = useMemo(() => projectRuns
    .filter((run) => Number(run.total) > 0 && (run.status === 'Completed' || (run.executed ?? 0) > 0))
    .sort((first, second) => getTimestamp(first.completedAt || first.startedAt) - getTimestamp(second.completedAt || second.startedAt))
    .slice(-8)
    .map((run) => ({
      run: run.id.replace('RUN-', ''),
      passRate: run.total ? Math.round(((run.passed || 0) / run.total) * 100) : 0,
    })), [projectRuns])

  const needsAttention = useMemo(() => {
    const failing = projectTests
      .filter((test) => test.lastResult === 'Failed')
      .map((test) => ({ ...test, issueType: 'TestCase' }))
    const critical = projectBugs
      .filter((bug) => ['Critical', 'Blocker'].includes(bug.severity) && !['Closed', 'Resolved'].includes(bug.status))
      .map((bug) => ({ ...bug, issueType: 'Bug' }))
    return [...failing, ...critical].slice(0, 6)
  }, [projectBugs, projectTests])

  const recentActivity = useMemo(() => activity
    .filter((event) => projectIssueIds.has(event.issueId))
    .sort((first, second) => getTimestamp(second.createdAt) - getTimestamp(first.createdAt))
    .slice(0, 8), [activity, projectIssueIds])

  const activeSprint = sprints.find((sprint) => sprint.status === 'Active' && (!sprint.projectKey || sprint.projectKey === selectedProjectKey))
  const sprintTasks = activeSprint ? projectTasks.filter((task) => task.sprintId === activeSprint.id) : []
  const sprintDone = sprintTasks.filter((task) => task.status === 'Done').length
  const myOpen = projectTasks.filter((task) => task.owner === user?.name && task.status !== 'Done')

  if (hydrating) {
    return <MainLayout><div className="py-20 text-center text-sm text-qf-muted">Loading your workspace…</div></MainLayout>
  }

  return (
    <MainLayout>
      <div className="flex flex-col gap-5">
        <PageHeader
          eyebrow={`${selectedProjectKey} · Dashboard`}
          title={project?.name || 'Quality dashboard'}
          description={`Quality status for ${project?.name || selectedProjectKey}. Every metric reflects current project data.`}
          actions={(
            <>
              <Link to="/reports" className="btn-ghost text-xs"><BarChart3 size={14} /> Reports</Link>
              <button type="button" onClick={() => openCreateModal('Task')} className="btn-primary text-xs"><ListTodo size={14} /> Create issue</button>
            </>
          )}
          meta={(
            <>
              <span className="flex items-center gap-1.5"><Activity size={12} /> {projectTasks.length} issues tracked</span>
              <span className="text-qf-border-strong">•</span>
              <span>{projectTests.length} test cases</span>
              <span className="text-qf-border-strong">•</span>
              <span>{projectRuns.length} test runs</span>
            </>
          )}
        />

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Open issues" value={metrics.openIssues} icon={ListTodo} hint={`${projectTasks.length - metrics.openIssues} completed`} to="/issues" />
          <MetricCard label="Active defects" value={metrics.activeDefects} icon={AlertTriangle} tone="danger" hint={`${metrics.criticalDefects} critical or blocker`} to="/bugs" />
          <MetricCard label="Test pass rate" value={`${metrics.passRate}%`} icon={ShieldCheck} tone="success" hint={projectTests.length ? `${metrics.passed} of ${projectTests.length} cases passing` : 'No test results yet'} to="/test-cases" />
          <MetricCard label="Requirement coverage" value={`${metrics.coverage}%`} icon={Target} tone="primary" hint={metrics.totalRequirements ? `${metrics.coveredRequirements} of ${metrics.totalRequirements} covered by tests` : 'No requirements yet'} to="/traceability" />
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
          <section className="rounded-lg border border-qf-border bg-qf-surface p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 text-sm font-semibold text-qf-text"><TrendingUp size={15} className="text-qf-info" /> Execution pass rate</h2>
                <p className="mt-1 text-xs text-qf-muted">Pass rate across completed runs, oldest to newest.</p>
              </div>
              <Badge tone="muted">Last {runTrend.length || 0} runs</Badge>
            </div>
            {runTrend.length >= 2 ? (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={runTrend} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid stroke="#303443" strokeDasharray="3 4" vertical={false} />
                    <XAxis dataKey="run" stroke="#777E90" tickLine={false} axisLine={false} fontSize={11} />
                    <YAxis domain={[0, 100]} stroke="#777E90" tickLine={false} axisLine={false} fontSize={11} unit="%" />
                    <Tooltip contentStyle={chartTooltipStyle} formatter={(value) => [`${value}%`, 'Pass rate']} />
                    <Line type="monotone" dataKey="passRate" stroke="#7C6CF2" strokeWidth={2.5} dot={{ fill: '#7C6CF2', r: 3 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-56 flex-col items-center justify-center rounded border border-dashed border-qf-border text-center">
                <Clock3 size={20} className="text-qf-muted" />
                <p className="mt-2 text-sm font-medium text-qf-text">Run at least two tests to see a trend</p>
                <p className="mt-1 max-w-xs text-xs text-qf-muted">Each completed run adds a real data point to this chart.</p>
                <Link to="/test-runs" className="btn-ghost mt-3 text-xs"><PlayCircle size={13} /> Start a test run</Link>
              </div>
            )}
          </section>

          <section className="rounded-lg border border-qf-border bg-qf-surface p-5">
            <div className="mb-4">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-qf-text"><CheckCircle2 size={15} className="text-qf-success" /> Current test outcomes</h2>
              <p className="mt-1 text-xs text-qf-muted">Latest result recorded for each test case.</p>
            </div>
            {resultData.length ? (
              <div className="flex items-center gap-4">
                <div className="h-40 w-40 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={resultData} dataKey="value" innerRadius={48} outerRadius={68} paddingAngle={3} stroke="none">
                        {resultData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={chartTooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="min-w-0 flex-1 space-y-2.5 text-xs">
                  {resultData.map((entry) => (
                    <div key={entry.name} className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 text-qf-secondary"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />{entry.name}</span>
                      <strong className="tabular-nums text-qf-text">{entry.value}</strong>
                    </div>
                  ))}
                  <Link to="/test-cases" className="inline-block pt-1 text-qf-primary hover:underline">Open test cases →</Link>
                </div>
              </div>
            ) : (
              <EmptyState compact icon={CheckCircle2} title="No test results" description="Execute a test run to populate this chart." action={<Link to="/test-runs" className="btn-ghost text-xs">Open test runs</Link>} />
            )}
          </section>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
          <section className="rounded-lg border border-qf-border bg-qf-surface p-5">
            <div className="mb-4">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-qf-text"><AlertTriangle size={15} className="text-qf-warning" /> Needs attention</h2>
              <p className="mt-1 text-xs text-qf-muted">Failing tests and unresolved critical defects.</p>
            </div>
            {needsAttention.length ? (
              <ul className="space-y-1.5">
                {needsAttention.map((item) => (
                  <li key={item.id} className="flex items-center gap-2.5 rounded border border-qf-border bg-qf-card/40 px-3 py-2 text-xs">
                    <IssueTypeIcon type={item.issueType} size={13} />
                    <Link to={`/issues/${item.id}`} className="font-mono font-semibold text-qf-info hover:underline">{item.id}</Link>
                    <Link to={`/issues/${item.id}`} className="min-w-0 flex-1 truncate text-qf-text">{item.title}</Link>
                    {item.issueType === 'Bug' ? <SeverityBadge severity={item.severity} /> : <ResultBadge result={item.lastResult} />}
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState compact icon={CheckCircle2} title="Nothing needs attention" description="No failing tests or unresolved critical defects in this project." />
            )}
          </section>

          <section className="rounded-lg border border-qf-border bg-qf-surface p-5">
            <div className="mb-4">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-qf-text"><BarChart3 size={15} className="text-qf-danger" /> Open defects by severity</h2>
              <p className="mt-1 text-xs text-qf-muted">Unresolved defects only.</p>
            </div>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={severityData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                  <CartesianGrid stroke="#303443" strokeDasharray="3 4" vertical={false} />
                  <XAxis dataKey="severity" stroke="#777E90" tickLine={false} axisLine={false} fontSize={10} />
                  <YAxis allowDecimals={false} stroke="#777E90" tickLine={false} axisLine={false} fontSize={11} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="#F06B70" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-qf-border pt-3 text-xs">
              <span className="text-qf-muted">{metrics.activeDefects} open defects</span>
              <Link to="/bugs" className="inline-flex items-center gap-1 text-qf-primary hover:underline">Triage defects <ArrowRight size={12} /></Link>
            </div>
          </section>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1fr_1fr_1fr]">
          <section className="rounded-lg border border-qf-border bg-qf-surface p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-qf-text"><Layers3 size={15} className="text-qf-primary" /> Active sprint</h2>
            {activeSprint ? (
              <>
                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-qf-text">{activeSprint.name}</p>
                    <p className="mt-0.5 text-xs text-qf-muted">{activeSprint.start || 'No start'} — {activeSprint.end || 'No end'}</p>
                  </div>
                  <StatusBadge status={activeSprint.status} />
                </div>
                <div className="mt-4">
                  <div className="mb-1.5 flex justify-between text-[11px] text-qf-muted"><span>{sprintDone} of {sprintTasks.length} done</span><span>{sprintTasks.length ? Math.round((sprintDone / sprintTasks.length) * 100) : 0}%</span></div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-qf-card">
                    <div className="h-full rounded-full bg-qf-success" style={{ width: `${sprintTasks.length ? (sprintDone / sprintTasks.length) * 100 : 0}%` }} />
                  </div>
                </div>
                <Link to="/sprints" className="mt-4 inline-block text-xs text-qf-primary hover:underline">Open sprint planning →</Link>
              </>
            ) : (
              <EmptyState compact icon={Layers3} title="No active sprint" description="Start a sprint to plan current work." action={<Link to="/sprints" className="btn-ghost text-xs">Open sprints</Link>} />
            )}
          </section>

          <section className="rounded-lg border border-qf-border bg-qf-surface p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-qf-text"><ListTodo size={15} className="text-qf-info" /> My open work</h2>
            {myOpen.length ? (
              <ul className="mt-3 space-y-1.5">
                {myOpen.slice(0, 5).map((task) => (
                  <li key={task.id} className="flex items-center gap-2 text-xs">
                    <Link to={`/issues/${task.id}`} className="font-mono font-semibold text-qf-info hover:underline">{task.id}</Link>
                    <Link to={`/issues/${task.id}`} className="min-w-0 flex-1 truncate text-qf-secondary hover:text-qf-text">{task.title}</Link>
                    <PriorityBadge priority={task.priority} />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState compact icon={ListTodo} title="No open work assigned" description="Tasks assigned to you will appear here." />
            )}
            {myOpen.length > 0 && <Link to="/my-work" className="mt-3 inline-block text-xs text-qf-primary hover:underline">Open My work →</Link>}
          </section>

          <section className="rounded-lg border border-qf-border bg-qf-surface p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-qf-text"><Activity size={15} className="text-qf-success" /> Recent activity</h2>
            {recentActivity.length ? (
              <ul className="mt-3 space-y-2.5">
                {recentActivity.slice(0, 5).map((event) => (
                  <li key={event.id} className="text-xs">
                    <p className="text-qf-secondary"><strong className="text-qf-text">{event.actor}</strong> {event.action}</p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-qf-muted">
                      <Link to={`/issues/${event.issueId}`} className="font-mono text-qf-info hover:underline">{event.issueId}</Link>
                      <span>·</span>
                      {formatTimestamp(event.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState compact icon={Activity} title="No activity yet" description="Changes to project issues will appear here." />
            )}
            <Link to="/audit-log" className="mt-3 inline-block text-xs text-qf-primary hover:underline">Open audit log →</Link>
          </section>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-qf-border bg-qf-surface px-4 py-3 text-xs">
          <p className="flex items-center gap-2 text-qf-muted"><FileText size={14} /> Requirement coverage counts requirements with at least one linked test case.</p>
          <Link to="/traceability" className="inline-flex items-center gap-1 text-qf-primary hover:underline">View traceability matrix <ArrowRight size={12} /></Link>
        </div>
      </div>
    </MainLayout>
  )
}

export default HomePage
