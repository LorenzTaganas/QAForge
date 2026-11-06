import { useMemo } from 'react'
import { CheckCircle2, Circle, Link2, XCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import MainLayout from '../components/layout/MainLayout'
import PageHeader from '../components/ui/PageHeader'
import EmptyState from '../components/ui/EmptyState'
import { Badge } from '../components/ui/Badges'
import { useQA } from '../context/useQA'
import { belongsToProject } from '../utils/projectScope'

const TraceabilityPage = () => {
  const { requirements, testCases, bugs, selectedProjectKey, hydrating } = useQA()

  const projectRequirements = useMemo(
    () => requirements.filter((requirement) => belongsToProject(requirement, selectedProjectKey)),
    [requirements, selectedProjectKey],
  )
  const projectTests = useMemo(
    () => testCases.filter((test) => belongsToProject(test, selectedProjectKey)),
    [testCases, selectedProjectKey],
  )
  const projectBugs = useMemo(
    () => bugs.filter((bug) => belongsToProject(bug, selectedProjectKey) && bug.status !== 'Closed'),
    [bugs, selectedProjectKey],
  )

  const rows = useMemo(() => projectRequirements.map((requirement) => {
    const linked = projectTests.filter((test) => (test.requirementIds || []).includes(requirement.id))
    const failed = linked.filter((test) => test.lastResult === 'Failed')
    const defects = projectBugs.filter((bug) => linked.some((test) => test.id === bug.linkedTestCaseId))
    return { requirement, linked, failed, defects }
  }), [projectBugs, projectRequirements, projectTests])

  const coverage = rows.filter((row) => row.linked.length > 0 && row.failed.length === 0).length

  return (
    <MainLayout>
      <div className="mx-auto flex max-w-[1400px] flex-col gap-5">
        <PageHeader
          eyebrow="Quality assurance"
          title="Traceability"
          description="Follow each requirement through its tests and defect resolution."
        />

        <div className="flex flex-wrap items-center gap-2 text-xs text-qf-muted">
          <Badge tone="green">{coverage} covered</Badge>
          <Badge tone="red">{rows.filter((row) => row.failed.length > 0).length} with failures</Badge>
          <Badge tone="muted">{rows.filter((row) => row.linked.length === 0).length} unlinked</Badge>
        </div>

        {hydrating ? (
          <p className="rounded-lg border border-qf-border bg-qf-surface p-8 text-center text-sm text-qf-muted">Loading traceability data…</p>
        ) : rows.length === 0 ? (
          <div className="rounded-lg border border-qf-border bg-qf-surface">
            <EmptyState
              icon={Link2}
              title="No requirements in this project"
              description="Create a requirement and link it to test cases to build coverage."
            />
          </div>
        ) : (
          <section className="rounded-lg border border-qf-border bg-qf-surface">
            <div className="space-y-3 p-3 md:hidden">
              {rows.map(({ requirement, linked, failed, defects }) => (
                <article key={requirement.id} className="rounded-lg border border-qf-border bg-qf-card p-4">
                  <Link to={`/issues/${requirement.id}`} className="font-mono text-[11px] text-qf-info">{requirement.id}</Link>
                  <h2 className="mt-1 text-sm font-semibold text-qf-text">{requirement.title}</h2>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                    <span className="text-qf-muted">Tests <strong className="text-qf-text">{linked.length || 'Unlinked'}</strong></span>
                    <span className={failed.length ? 'text-qf-danger' : linked.length ? 'text-qf-success' : 'text-qf-muted'}>
                      Execution {linked.length ? (failed.length ? 'Failed' : 'Passed') : 'Not run'}
                    </span>
                    <span className="text-qf-muted">Defects <strong className="text-qf-text">{defects.length || 'None'}</strong></span>
                    <span className="flex items-center gap-1 text-qf-muted">
                      Coverage {linked.length && !failed.length ? <CheckCircle2 size={14} className="text-qf-success" /> : linked.length ? <XCircle size={14} className="text-qf-danger" /> : <Circle size={14} />}
                    </span>
                  </div>
                  {defects.length > 0 && (
                    <p className="mt-2 flex flex-wrap gap-2 text-[11px]">
                      {defects.map((bug) => <Link key={bug.id} to={`/issues/${bug.id}`} className="text-qf-danger hover:underline">{bug.id}</Link>)}
                    </p>
                  )}
                </article>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[820px] text-left text-xs">
                <thead className="border-b border-qf-border bg-qf-card/50 text-[11px] uppercase tracking-wider text-qf-muted">
                  <tr>
                    <th className="px-5 py-3 font-medium">Requirement</th>
                    <th className="px-5 py-3 font-medium">Linked tests</th>
                    <th className="px-5 py-3 font-medium">Execution</th>
                    <th className="px-5 py-3 font-medium">Defects</th>
                    <th className="px-5 py-3 font-medium">Coverage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-qf-border">
                  {rows.map(({ requirement, linked, failed, defects }) => (
                    <tr key={requirement.id} className="transition hover:bg-qf-card/50">
                      <td className="px-5 py-4">
                        <Link to={`/issues/${requirement.id}`} className="font-mono text-qf-info hover:underline">{requirement.id}</Link>
                        <p className="mt-1 max-w-sm font-medium text-qf-text">{requirement.title}</p>
                      </td>
                      <td className="px-5 py-4 text-qf-secondary">
                        {linked.length
                          ? linked.map((test) => <Link key={test.id} to={`/issues/${test.id}`} className="mr-2 inline-block font-mono text-qf-info hover:underline">{test.id}</Link>)
                          : <span className="text-qf-muted">Unlinked</span>}
                      </td>
                      <td className="px-5 py-4">
                        {linked.length
                          ? <span className={failed.length ? 'text-qf-danger' : 'text-qf-success'}>{failed.length ? 'Failed' : 'Passed'}</span>
                          : <span className="text-qf-muted">Not run</span>}
                      </td>
                      <td className="px-5 py-4 text-qf-secondary">
                        {defects.length
                          ? defects.map((bug) => <Link key={bug.id} to={`/issues/${bug.id}`} className="mr-2 inline-block font-mono text-qf-danger hover:underline">{bug.id}</Link>)
                          : <span className="text-qf-muted">None</span>}
                      </td>
                      <td className="px-5 py-4">
                        {linked.length && !failed.length
                          ? <CheckCircle2 size={16} className="text-qf-success" aria-label="Covered" />
                          : linked.length
                            ? <XCircle size={16} className="text-qf-danger" aria-label="Failing" />
                            : <Circle size={16} className="text-qf-muted" aria-label="Not covered" />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <div className="flex items-center gap-2 text-xs text-qf-muted">
          <Link2 size={14} />
          Links come from requirement IDs on test cases and test case references on defects.
        </div>
      </div>
    </MainLayout>
  )
}

export default TraceabilityPage
