import React, { useMemo, useState } from 'react'
import MainLayout from '../components/layout/MainLayout'
import { Link } from 'react-router-dom'
import KanbanBoard from '../components/kanban/KanbanBoard'
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock3,
  Download,
  Filter,
  Layers3,
  List,
  RefreshCw,
  Share2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Target,
  Users,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useQA } from '../context/QAContext'

const columnDefinitions = ['To Do', 'In Progress', 'In Review', 'Done']
const chartTooltipStyle = {
  backgroundColor: '#171B25',
  border: '1px solid #2B3345',
  borderRadius: '8px',
  color: '#F4F7FB',
  fontSize: '12px',
}

const HomePage = () => {
  const { tasks, testCases, bugs, requirements, setIsCreateModalOpen, showToast, searchQuery } = useQA()
  const [activeTab, setActiveTab] = useState('Board')
  const [selectedPriority, setSelectedPriority] = useState('All')
  const [selectedOwner, setSelectedOwner] = useState('All')
  const [showFilterBar, setShowFilterBar] = useState(false)

  const filteredTasks = useMemo(
    () =>
      tasks.filter((task) => {
        const query = searchQuery.toLowerCase()
        const matchesSearch = !query || task.title.toLowerCase().includes(query) || task.id.toLowerCase().includes(query)
        const matchesPriority = selectedPriority === 'All' || task.priority === selectedPriority
        const matchesOwner = selectedOwner === 'All' || task.owner === selectedOwner
        return matchesSearch && matchesPriority && matchesOwner
      }),
    [tasks, searchQuery, selectedPriority, selectedOwner],
  )

  const columns = useMemo(
    () => columnDefinitions.map((name) => ({ name, tasks: filteredTasks.filter((task) => task.status === name) })),
    [filteredTasks],
  )

  const metrics = useMemo(() => {
    const passed = testCases.filter((test) => test.lastResult === 'Passed').length
    const failed = testCases.filter((test) => test.lastResult === 'Failed').length
    const activeBugs = bugs.filter((bug) => bug.status !== 'Closed').length
    const passRate = testCases.length ? Math.round((passed / testCases.length) * 100) : 0
    const approved = requirements.filter((requirement) => requirement.status === 'Approved').length

    return {
      executions: testCases.length,
      uniqueCases: testCases.length,
      variants: testCases.filter((test) => test.type === 'Regression' || test.type === 'Performance').length,
      passRate,
      activeBugs,
      coverage: requirements.length ? Math.round((approved / requirements.length) * 100) : 0,
      passed,
      failed,
    }
  }, [bugs, requirements, testCases])

  const outcomeData = useMemo(
    () => [
      { name: 'Passed', value: metrics.passed, color: '#4B8DFF' },
      { name: 'Failed', value: metrics.failed, color: '#FF8A3D' },
      { name: 'Pending', value: Math.max(metrics.executions - metrics.passed - metrics.failed, 0), color: '#58657A' },
    ],
    [metrics],
  )

  const trendData = useMemo(() => {
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    return labels.map((day, index) => ({
      day,
      passRate: Math.max(72, Math.min(100, metrics.passRate + (index % 3) * 4 - (index === 4 ? 8 : 0))),
    }))
  }, [metrics.passRate])

  const executionData = useMemo(
    () =>
      ['Passed', 'Failed', 'Pending'].map((status) => ({
        status,
        count: status === 'Passed' ? metrics.passed : status === 'Failed' ? metrics.failed : outcomeData[2].value,
      })),
    [metrics, outcomeData],
  )

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href)
      showToast('Dashboard URL copied to clipboard')
    } else {
      showToast('Dashboard link ready to share')
    }
  }

  return (
    <MainLayout>
      <div className="mx-auto flex max-w-[1600px] flex-col gap-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-3 text-xs text-[#78849A]">
              <span className="flex items-center gap-2 rounded-md border border-[#2B3345] bg-[#171B25] px-2.5 py-1.5 text-[#DDE5F2]">
                <span className="h-2 w-2 rounded-sm bg-[#49C2B1]" />
                QAForge Core Platform
              </span>
              <span>{activeTab === 'Board' ? `${filteredTasks.length} issues · Updated just now` : 'Global health check · Updated just now'}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#182A4A] text-[#56B6FF]">
                <Activity size={22} />
              </div>
              <h1 className="text-3xl font-semibold tracking-[-0.03em] text-[#F4F7FB]">{activeTab === 'Board' ? 'All issues' : 'QA Analytics'}</h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md border border-[#2B3345] bg-[#171B25] px-3 py-2 text-xs text-[#AAB5C7]">Last 15 days</span>
            <button onClick={() => showToast('Report export is ready')} className="dashboard-action"><Download size={14} /> Export PDF</button>
            <button onClick={() => showToast('Dashboard synced')} className="dashboard-action"><RefreshCw size={14} /> Sync now</button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#20283A] bg-[#111722] px-4 py-3">
          <div className="flex items-center gap-3 text-xs text-[#7F8BA0]">
            <span className="flex items-center gap-2 rounded-md bg-[#182A4A] px-3 py-1.5 font-semibold text-[#B8D9FF]"><Target size={14} /> Mobile quality workspace</span>
            <span>Release confidence across requirements, tests, and defects</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowFilterBar((value) => !value)} className="dashboard-action"><SlidersHorizontal size={14} /> Filters</button>
            <button onClick={handleShare} className="dashboard-action"><Share2 size={14} /> Share</button>
          </div>
        </div>

        {showFilterBar && (
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#2B3345] bg-[#171B25] p-3 text-xs">
            <span className="text-[#78849A]">Priority:</span>
            {['All', 'Critical', 'High', 'Medium', 'Low'].map((priority) => (
              <button key={priority} onClick={() => setSelectedPriority(priority)} className={selectedPriority === priority ? 'dashboard-filter-active' : 'dashboard-filter'}>
                {priority}
              </button>
            ))}
            <span className="mx-1 h-4 w-px bg-[#2B3345]" />
            <span className="text-[#78849A]">Owner:</span>
            {['All', 'QA Tester', 'QA Lead', 'Developer', 'Security'].map((owner) => (
              <button key={owner} onClick={() => setSelectedOwner(owner)} className={selectedOwner === owner ? 'dashboard-filter-active' : 'dashboard-filter'}>
                {owner}
              </button>
            ))}
          </div>
        )}

        {activeTab === 'Analytics' && (
          <>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <MetricCard label="Total executions" value={metrics.executions} icon={Activity} />
          <MetricCard label="Unique test cases" value={metrics.uniqueCases} icon={CheckCircle2} />
          <MetricCard label="Parameterized runs" value={metrics.variants} icon={Layers3} />
          <MetricCard label="Global pass rate" value={`${metrics.passRate}%`} icon={ShieldCheck} accent />
          <MetricCard label="Requirement coverage" value={`${metrics.coverage}%`} icon={Target} accent />
          <MetricCard label="Active defects" value={metrics.activeBugs} icon={AlertTriangle} warning />
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.35fr_0.9fr]">
          <AnalyticsCard title="Coverage by day" subtitle="Pass rate % over time" icon={BarChart3}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 12, right: 12, left: -18, bottom: 0 }}>
                <CartesianGrid stroke="#283044" strokeDasharray="3 4" vertical={false} />
                <XAxis dataKey="day" stroke="#78849A" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis domain={[60, 100]} stroke="#78849A" tickLine={false} axisLine={false} fontSize={11} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Line type="monotone" dataKey="passRate" stroke="#4B8DFF" strokeWidth={3} dot={{ fill: '#4B8DFF', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </AnalyticsCard>
          <AnalyticsCard title="Passed vs failed" subtitle="Current execution results" icon={CheckCircle2}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={executionData} margin={{ top: 12, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid stroke="#283044" strokeDasharray="3 4" vertical={false} />
                <XAxis dataKey="status" stroke="#78849A" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis allowDecimals={false} stroke="#78849A" tickLine={false} axisLine={false} fontSize={11} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Bar dataKey="count" radius={[5, 5, 0, 0]}>
                  {executionData.map((entry) => <Cell key={entry.status} fill={entry.status === 'Failed' ? '#FF8A3D' : '#4B8DFF'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </AnalyticsCard>
        </div>

        <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
          <AnalyticsCard title="Execution health" subtitle="Distribution of test results" icon={Sparkles}>
            <div className="flex h-full items-center justify-center gap-6">
              <div className="h-44 w-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={outcomeData} dataKey="value" innerRadius={54} outerRadius={76} paddingAngle={4} stroke="none">
                      {outcomeData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={chartTooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3 text-xs">
                {outcomeData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between gap-6">
                    <span className="flex items-center gap-2 text-[#AAB5C7]"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />{item.name}</span>
                    <strong className="text-[#F4F7FB]">{item.value}</strong>
                  </div>
                ))}
              </div>
            </div>
          </AnalyticsCard>
          <AnalyticsCard title="Recent quality signals" subtitle="Issues and work that need attention" icon={Clock3}>
            <div className="space-y-2">
              {bugs.slice(0, 3).map((bug) => (
                <div key={bug.id} className="flex items-center gap-3 rounded-lg border border-[#242D40] bg-[#141A26] px-3 py-2.5">
                  <span className={`h-2 w-2 rounded-full ${bug.severity === 'Critical' ? 'bg-[#FF6978]' : 'bg-[#FFB454]'}`} />
                  <span className="font-mono text-[11px] font-semibold text-[#6EA8FF]">{bug.id}</span>
                  <span className="min-w-0 flex-1 truncate text-xs text-[#DDE5F2]">{bug.title}</span>
                  <span className="text-[11px] text-[#78849A]">{bug.status}</span>
                  <ArrowUpRight size={14} className="text-[#68758B]" />
                </div>
              ))}
            </div>
          </AnalyticsCard>
        </div>
          </>
        )}

        <div className="flex flex-col gap-3 border-b border-[#252E40] pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-1 rounded-lg border border-[#242D40] bg-[#141A26] p-1 text-xs font-semibold">
            {['Analytics', 'Board', 'List', 'Timeline'].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={activeTab === tab ? 'dashboard-tab-active' : 'dashboard-tab'}>
                {tab === 'Analytics' ? <BarChart3 size={14} /> : tab === 'List' ? <List size={14} /> : tab === 'Timeline' ? <Calendar size={14} /> : <Layers3 size={14} />}
                {tab}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {activeTab === 'Board' && (
              <>
                <span className="hidden text-xs text-[#78849A] sm:inline">Board</span>
                <button onClick={() => setShowFilterBar((value) => !value)} className="dashboard-action"><SlidersHorizontal size={14} /> Filter</button>
                <button onClick={() => setActiveTab('List')} className="dashboard-action"><List size={14} /> Display</button>
              </>
            )}
            <button onClick={() => setIsCreateModalOpen(true)} className="dashboard-primary"><span>+</span> Create issue</button>
          </div>
        </div>

        {activeTab === 'Board' && <KanbanBoard columns={columns} />}
        {activeTab === 'List' && <TaskList tasks={filteredTasks} />}
        {activeTab === 'Timeline' && <Timeline tasks={filteredTasks} />}
      </div>
    </MainLayout>
  )
}

const MetricCard = ({ label, value, icon: Icon, accent, warning }) => (
  <div className="dashboard-card min-h-[118px] p-4">
    <div className="flex items-center justify-between text-[11px] font-medium text-[#8B97A9]">
      {label}
      <Icon size={16} className={warning ? 'text-[#FFB454]' : accent ? 'text-[#6EA8FF]' : 'text-[#6D7890]'} />
    </div>
    <div className={`mt-4 text-3xl font-semibold tracking-tight ${warning ? 'text-[#FFB454]' : accent ? 'text-[#6EA8FF]' : 'text-[#E6EBF3]'}`}>{value}</div>
  </div>
)

const AnalyticsCard = ({ title, subtitle, icon: Icon, children }) => (
  <section className="dashboard-card p-5">
    <div className="mb-4 flex items-start gap-3">
      <Icon size={17} className="mt-0.5 text-[#6D7890]" />
      <div>
        <h2 className="text-sm font-semibold text-[#E6EBF3]">{title}</h2>
        <p className="mt-1 text-xs text-[#78849A]">{subtitle}</p>
      </div>
    </div>
    <div className="h-60">{children}</div>
  </section>
)

const TaskList = ({ tasks }) => (
  <div className="overflow-x-auto rounded-xl border border-[#242D40] bg-[#141A26]">
    <table className="w-full text-left text-xs">
      <thead className="border-b border-[#242D40] bg-[#171E2B] text-[11px] uppercase tracking-wider text-[#78849A]">
        <tr>{['Key', 'Summary', 'Status', 'Priority', 'Assignee', 'Due date'].map((heading) => <th key={heading} className="px-4 py-3">{heading}</th>)}</tr>
      </thead>
      <tbody>{tasks.map((task) => <tr key={task.id} className="border-b border-[#20283A] last:border-0 hover:bg-[#192131]"><td className="px-4 py-3 font-mono font-semibold text-[#6EA8FF]"><Link to={`/issues/${task.id}`} className="hover:underline">{task.id}</Link></td><td className="px-4 py-3 font-medium text-[#E6EBF3]"><Link to={`/issues/${task.id}`} className="hover:text-[#B7D5FF]">{task.title}</Link></td><td className="px-4 py-3 text-[#AAB5C7]">{task.status}</td><td className="px-4 py-3 text-[#AAB5C7]">{task.priority}</td><td className="px-4 py-3 text-[#AAB5C7]">{task.owner}</td><td className="px-4 py-3 text-[#78849A]">{task.due}</td></tr>)}</tbody>
    </table>
  </div>
)

const Timeline = ({ tasks }) => (
  <div className="space-y-2 rounded-xl border border-[#242D40] bg-[#141A26] p-4">
    {tasks.length === 0 ? <p className="py-8 text-center text-xs text-[#78849A]">No scheduled issues match the current filters.</p> : tasks.map((task) => <div key={task.id} className="flex items-center gap-3 rounded-lg border border-[#242D40] bg-[#171E2B] p-3"><Clock3 size={14} className="text-[#6EA8FF]" /><span className="font-mono text-[11px] font-semibold text-[#6EA8FF]">{task.id}</span><span className="min-w-0 flex-1 truncate text-xs text-[#E6EBF3]">{task.title}</span><span className="text-[11px] text-[#78849A]">{task.due}</span></div>)}
  </div>
)

export default HomePage
