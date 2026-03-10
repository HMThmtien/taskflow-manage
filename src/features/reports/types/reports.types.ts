export type WorkspaceReport = {
    from: string
    to: string
    totals: {
      totalProjects: number
      totalIssues: number
      openIssues: number
      doneIssues: number
      overdueIssues: number
    }
    issuesByStatus: Array<{
      status: string
      count: number
    }>
    issuesByPriority: Array<{
      priority: string
      count: number
    }>
    workloadByUser: Array<{
      userId: number
      username: string
      fullName: string | null
      assignedOpenIssues: number
      doneThisWeek: number
    }>
  }