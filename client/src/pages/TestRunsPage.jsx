import { useMemo } from 'react'
import { CheckCircle2, Play, XCircle } from 'lucide-react'
import MainLayout from '../components/layout/MainLayout'
import { useQA } from '../context/useQA'
import { formatTimestamp } from '../utils/time'
import { belongsToProject } from '../utils/projectScope'

const TestRunsPage = () => {
  const { testCases, testRuns, selectedProjectKey, createTestRun, executeTestCase } = useQA()
  const projectTestCases = testCases.filter((testCase) => belongsToProject(testCase, selectedProjectKey))
  const projectTestRuns = testRuns.filter((run) => belongsToProject(run, selectedProjectKey))
  const current = useMemo(() => ({
    passed: projectTestCases.filter((test) => test.lastResult === 'Passed').length,
    failed: projectTestCases.filter((test) => test.lastResult === 'Failed').length,
    pending: projectTestCases.filter((test) => test.lastResult === 'Pending').length,
  }), [projectTestCases])
  const runSuite = () => {
    projectTestCases.forEach((test) => executeTestCase(test.id, test.lastResult === 'Failed' ? 'Failed' : 'Passed'))
    createTestRun('Manual full regression suite', selectedProjectKey)
  }

  return <MainLayout><div className="mx-auto flex max-w-[1400px] flex-col gap-6">
    <div className="flex flex-col gap-4 border-b border-[#20283A] pb-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="section-title">Quality Assurance / Execution</p><h1 className="mt-1 section-heading text-white">Test runs</h1><p className="mt-2 text-sm text-jira-muted">Review execution history and launch repeatable QA suites.</p></div><button onClick={runSuite} className="dashboard-primary"><Play size={14} /> Run full suite</button></div>
    <div className="grid gap-4 sm:grid-cols-3"><div className="dashboard-card p-5"><p className="text-xs text-jira-muted">Passed now</p><p className="mt-2 text-2xl font-semibold text-emerald-400">{current.passed}</p></div><div className="dashboard-card p-5"><p className="text-xs text-jira-muted">Failed now</p><p className="mt-2 text-2xl font-semibold text-red-400">{current.failed}</p></div><div className="dashboard-card p-5"><p className="text-xs text-jira-muted">Awaiting execution</p><p className="mt-2 text-2xl font-semibold text-[#FFB454]">{current.pending}</p></div></div>
    <section className="dashboard-card overflow-hidden"><div className="border-b border-[#242D40] px-5 py-4"><h2 className="font-semibold text-white">Execution history</h2></div><div className="divide-y divide-[#242D40]">{projectTestRuns.map((run) => <div key={run.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center"><div className="flex-1"><p className="font-mono text-[11px] text-[#6EA8FF]">{run.id}</p><p className="mt-1 text-sm font-medium text-white">{run.name}</p><p className="mt-1 text-xs text-jira-muted">{formatTimestamp(run.startedAt)} · {run.environment}</p></div><div className="flex items-center gap-4 text-xs"><span className="flex items-center gap-1.5 text-emerald-400"><CheckCircle2 size={14} /> {run.passed} passed</span><span className="flex items-center gap-1.5 text-red-400"><XCircle size={14} /> {run.failed} failed</span><span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-emerald-400">{run.status}</span></div></div>)}</div></section>
  </div></MainLayout>
}

export default TestRunsPage
