import { useWorkspaceReportQuery } from '@/features/reports/api/reports.queries'

export default function ReportsPage() {
  const query = useWorkspaceReportQuery()

  if (query.isLoading) {
    return <div className="p-6">Loading reports...</div>
  }

  if (query.isError || !query.data) {
    return <div className="p-6 text-destructive">Không tải được reports.</div>
  }

  const report = query.data

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Reports</h1>
        <p className="text-sm text-muted-foreground">
          KPI và phân tích cho toàn workspace.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">Projects</div>
          <div className="text-2xl font-semibold">{report.totals.totalProjects}</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">Issues</div>
          <div className="text-2xl font-semibold">{report.totals.totalIssues}</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">Open</div>
          <div className="text-2xl font-semibold">{report.totals.openIssues}</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">Done</div>
          <div className="text-2xl font-semibold">{report.totals.doneIssues}</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">Overdue</div>
          <div className="text-2xl font-semibold">{report.totals.overdueIssues}</div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border p-4">
          <h2 className="mb-3 font-semibold">Issues by status</h2>
          <div className="space-y-2">
            {report.issuesByStatus.map((item) => (
              <div key={item.status} className="flex justify-between text-sm">
                <span>{item.status}</span>
                <span>{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border p-4">
          <h2 className="mb-3 font-semibold">Issues by priority</h2>
          <div className="space-y-2">
            {report.issuesByPriority.map((item) => (
              <div key={item.priority} className="flex justify-between text-sm">
                <span>{item.priority}</span>
                <span>{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <h2 className="mb-3 font-semibold">Workload by user</h2>
        <div className="space-y-2">
          {report.workloadByUser.map((user) => (
            <div
              key={user.userId}
              className="flex items-center justify-between rounded-md border p-3"
            >
              <div>
                <div className="font-medium">
                  {user.fullName || user.username}
                </div>
                <div className="text-sm text-muted-foreground">
                  @{user.username}
                </div>
              </div>

              <div className="text-right text-sm">
                <div>Open assigned: {user.assignedOpenIssues}</div>
                <div>Done this week: {user.doneThisWeek}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}