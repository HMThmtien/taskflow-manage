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

export type ReportCountItem = {
  key: string
  count: number
}

export type OverdueIssueItem = {
  issueId: string
  title: string
  status: string
  priority: string
  dueDate: string
  assigneeUsername?: string | null
}

export type ActiveSprintReport = {
  sprintId: string
  sprintName: string
  totalIssues: number
  doneIssues: number
  inProgressIssues: number
  todoIssues: number
  unfinishedIssues: number
  completionPercent: number
}

export type ProjectSummaryReport = {
  projectId: string
  totalIssues: number
  openIssues: number
  doneIssues: number
  overdueIssues: number
  issuesByStatus: ReportCountItem[]
  issuesByPriority: ReportCountItem[]
  overdueItems: OverdueIssueItem[]
  activeSprint?: ActiveSprintReport | null
}

export type ProjectWorkloadReport = {
  projectId: string
  items: Array<{
    userId: string
    username: string
    fullName?: string | null
    totalAssigned: number
    openAssigned: number
    overdueAssigned: number
  }>
}

export type SprintProgressReport = {
  projectId: string
  activeSprint?: ActiveSprintReport | null
}
