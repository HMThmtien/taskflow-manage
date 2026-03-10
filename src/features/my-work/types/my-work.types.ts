export type WorkIssueStatus = 'TODO' | 'IN_PROGRESS' | 'DONE'
export type WorkIssuePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

export type MyWorkTab = 'assigned' | 'created' | 'watching' | 'overdue'

export type MyWorkIssue = {
  id: number
  key: string
  title: string
  description: string | null
  status: WorkIssueStatus
  priority: WorkIssuePriority
  dueDate: string | null
  updatedAt: string
  projectId: number
  projectKey: string
  projectName: string
  assignee: {
    id: number
    username: string
    fullName: string | null
  } | null
}

export type GetMyWorkParams = {
  type: MyWorkTab
  q?: string
  projectId?: number
  status?: WorkIssueStatus
  priority?: WorkIssuePriority
}