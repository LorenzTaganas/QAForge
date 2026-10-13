import { CheckCircle2, Circle, Link2, XCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import MainLayout from '../components/layout/MainLayout'
import { useQA } from '../context/QAContext'

const TraceabilityPage = () => {
  const { requirements, testCases, bugs } = useQA()
  return <MainLayout><div className="mx-auto flex max-w-[1400px] flex-col gap-6">
    <div className="border-b border-[#20283A] pb-5"><p className="section-title">Quality Assurance / Coverage</p><h1 className="mt-1 section-heading text-white">Traceability matrix</h1><p className="mt-2 text-sm text-jira-muted">Follow each requirement through validation and defect resolution.</p></div>
    <section className="dashboard-card overflow-x-auto"><table className="w-full min-w-[760px] text-left text-xs"><thead className="border-b border-[#242D40] bg-[#141A26] text-[11px] uppercase tracking-wider text-jira-muted"><tr><th className="px-5 py-4">Requirement</th><th className="px-5 py-4">Linked tests</th><th className="px-5 py-4">Execution</th><th className="px-5 py-4">Defects</th><th className="px-5 py-4">Coverage</th></tr></thead><tbody className="divide-y divide-[#242D40]">{requirements.map((requirement) => { const linked = testCases.filter((test) => test.requirementIds?.includes(requirement.id)); const failed = linked.filter((test) => test.lastResult === 'Failed'); const relatedBugs = failed.length ? bugs.filter((bug) => bug.status !== 'Closed').slice(0, 1) : []; return <tr key={requirement.id} className="hover:bg-[#192131]"><td className="px-5 py-4"><Link to={`/issues/${requirement.id}`} className="font-mono text-[#6EA8FF] hover:underline">{requirement.id}</Link><p className="mt-1 max-w-xs font-medium text-white">{requirement.title}</p></td><td className="px-5 py-4 text-[#AAB5C7]">{linked.length ? linked.map((test) => <Link key={test.id} to={`/issues/${test.id}`} className="mr-2 inline-block text-[#6EA8FF] hover:underline">{test.id}</Link>) : 'Unlinked'}</td><td className="px-5 py-4">{linked.length ? <span className={failed.length ? 'text-red-400' : 'text-emerald-400'}>{failed.length ? 'Failed' : 'Passed'}</span> : <span className="text-[#78849A]">Not run</span>}</td><td className="px-5 py-4 text-[#AAB5C7]">{relatedBugs.length ? relatedBugs.map((bug) => <span key={bug.id} className="mr-2 text-red-400">{bug.id}</span>) : 'None'}</td><td className="px-5 py-4">{linked.length && !failed.length ? <CheckCircle2 size={16} className="text-emerald-400" /> : linked.length ? <XCircle size={16} className="text-red-400" /> : <Circle size={16} className="text-[#78849A]" />}</td></tr> })}</tbody></table></section>
    <div className="flex items-center gap-2 text-xs text-jira-muted"><Link2 size={14} /> Linking is based on requirement IDs assigned to test cases.</div>
  </div></MainLayout>
}

export default TraceabilityPage
